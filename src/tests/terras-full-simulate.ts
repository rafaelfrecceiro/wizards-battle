import {mkdirSync,writeFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {applyAction,createGame,replay,viewFor,VERSION} from '../engine/engine';
import {availableDecks,terrasDecks} from '../engine/decks';
import {chooseBot} from '../engine/bot';
import edition from '../data/terras-despertas.json';
import type {Config,School} from '../engine/types';
const folder='../qa/terras-v110';mkdirSync(folder,{recursive:true});
const results:unknown[]=[],casts:Record<string,number>={},started=Date.now();let actions=0;
for(const [a,deck]of terrasDecks.entries())for(const [b,other]of availableDecks('terras-v1').entries())for(const first of [0,1] as const){
  const config:Config={seed:1110000+a*10000+b*100+first,decks:[deck.name,other.name],first,variant:'escolas-v1',energyRule:'reserve-v1',cardPool:'terras-v1'};
  let g=createGame(config),steps=0;
  try{
    while(g.winner===null&&steps++<5000){
      const s=g.pending?.owner??(g.phase==='mulligan'?(g.kept[0]?1:0):g.active),view=viewFor(g,s),o=chooseBot(view);
      if(!o)throw Error('Bot sem ação legal');const schools=g.players.map(p=>({...p.school}));g=applyAction(g,s,o.action);actions++;
      for(const [seat,p]of g.players.entries()){
        const all=Object.values(p.zones).flat();if(all.length!==40||new Set(all.map(x=>x.uid)).size!==40)throw Error('Conservação/UID');
        if(p.energy<0||p.zones.front.length>3||p.zones.back.length>3||p.zones.enchants.length>3||p.zones.veil.length>2)throw Error('Recursos/vagas');
        for(const [school,n]of Object.entries(schools[seat]))if((p.school[school as School]??0)<n!)throw Error('Escola diminuiu');
      }
      if(viewFor(g,s).players[1-s].hand.length)throw Error('Mão rival exposta');
    }
    if(g.winner===null)throw Error('Duelo não terminou');if(!isDeepStrictEqual(replay(g),g))throw Error('Replay divergiu');
    for(const [id,n]of Object.entries(g.metrics.casts))casts[id]=(casts[id]??0)+n;
    results.push({config,winner:g.winner,turns:g.turn,actions:steps,events:g.feedbackSeq});
  }catch(error){writeFileSync(`${folder}/simulation-failure.json`,JSON.stringify({config,error:String(error),state:g},null,2));throw error}
  if(results.length%24===0)console.log(`${results.length}/144 duelos completos`);
}
const missing=edition.cards.filter(c=>!casts[c.id]).map(c=>c.id);
writeFileSync(`${folder}/simulations.json`,JSON.stringify({success:true,version:VERSION,games:results.length,actions,elapsedMs:Date.now()-started,method:'Seis decks TDP × doze adversários VES/TDP × duas iniciativas; regra reserva. Estado/privacidade/conservação/replay; não demonstra equilíbrio humano.',editionCast:60-missing.length,missing,casts,results},null,2));
console.log(JSON.stringify({success:true,games:results.length,actions,editionCast:60-missing.length,missing}));
