import {mkdirSync,writeFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {applyAction,createGame,replay,viewFor,VERSION} from '../engine/engine';
import * as old from '../engine/legacy/engine-v09';
import {availableDecks} from '../engine/decks';
import {chooseBot} from '../engine/bot';
import type {Config} from '../engine/types';
const output='../qa/feedback-v100';mkdirSync(output,{recursive:true});
const all=availableDecks('terras-pilot-v1'),results:unknown[]=[],kinds:Record<string,number>={};let totalActions=0;
const started=Date.now();
for(const [index,deck] of all.entries())for(const first of [0,1] as const)for(const energyRule of ['turn','reserve-v1'] as const){
  const config:Config={seed:101000+index*100+first*10+(energyRule==='turn'?0:1),decks:[deck.name,all[(index+4)%all.length].name],variant:'escolas-v1',cardPool:'terras-pilot-v1',energyRule,first};
  let g=createGame(config),baseline=old.createGame(config),steps=0,seen=g.feedbackSeq??0;
  while(g.winner===null&&steps++<4000){
    const s=g.pending?.owner??(g.phase==='mulligan'?(g.kept[0]?1:0):g.active),v=viewFor(g,s),o=chooseBot(v);
    if(!o)throw Error('Bot sem opção legal');
    const oldOptions=old.viewFor(baseline,s).options;
    if(!oldOptions.some(x=>JSON.stringify(x.action)===JSON.stringify(o.action)))throw Error('Feedback alterou legalidade');
    g=applyAction(g,s,o.action);baseline=old.applyAction(baseline,s,o.action);totalActions++;
    for(const e of g.feedback??[])if(e.id>seen)kinds[e.kind]=(kinds[e.kind]??0)+1;
    seen=g.feedbackSeq??seen;
    for(const p of g.players)if(Object.values(p.zones).flat().length!==40||p.energy<0)throw Error('Conservação/energia inválida');
    if(!isDeepStrictEqual(g.players,baseline.players)||g.winner!==baseline.winner||g.rng!==baseline.rng)throw Error('Feedback alterou regras/estado em '+deck.name);
  }
  if(g.winner===null)throw Error('Partida não terminou');
  if(!isDeepStrictEqual(replay(g),g))throw Error('Replay divergiu');
  results.push({decks:config.decks,first,energyRule,steps,turns:g.turn,winner:g.winner,events:g.feedbackSeq,identicalRules:true,exactReplay:true});
}
const report={success:true,version:VERSION,games:results.length,totalActions,kinds,elapsedMs:Date.now()-started,method:'Nove modelos × duas iniciativas × duas regras de energia; cada ação também aplicada ao motor congelado 0.9, jogadores/RNG/vencedor idênticos. Não mede diversão/FPS.',results};
writeFileSync(`${output}/simulations.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({success:true,games:results.length,totalActions,kinds}));
