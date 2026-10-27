import {mkdirSync,writeFileSync} from 'node:fs';
import {applyAction,createGame,replay,viewFor,VERSION} from '../engine/engine';
import {availableDecks,pilotDecks} from '../engine/decks';
import {chooseBot} from '../engine/bot';
import type {Config,Game,School} from '../engine/types';
const folder='../qa/terras-v080';mkdirSync(folder,{recursive:true});
const results:unknown[]=[],casts:Record<string,number>={};const started=Date.now();
for(const [p,pilot]of pilotDecks.entries())for(const [i,other]of availableDecks('terras-pilot-v1').entries())for(const swapped of [false,true])for(const first of [0,1] as const){
  const config:Config={seed:808000+p*10000+i*100+Number(swapped)*10+first,decks:swapped?[other.name,pilot.name]:[pilot.name,other.name],variant:'escolas-v1',first,cardPool:'terras-pilot-v1'};
  let g=createGame(config),steps=0;
  try{
    while(g.winner===null&&steps++<4000){
      const s=g.pending?.owner??(g.phase==='mulligan'?(g.kept[0]?1:0):g.active),v=viewFor(g,s),o=chooseBot(v);
      if(!o)throw Error('Bot sem ação legal');
      const schools=g.players.map(p=>({...p.school}));g=applyAction(g,s,o.action);
      for(const [seat,player]of g.players.entries()){
        const all=Object.values(player.zones).flat();
        if(all.length!==40||new Set(all.map(x=>x.uid)).size!==40)throw Error('Conservação/UID inválido');
        if(player.energy<0||player.zones.front.length>3||player.zones.back.length>3||player.zones.enchants.length>3||player.zones.veil.length>2)throw Error('Recurso/vaga inválido');
        for(const [school,n]of Object.entries(schools[seat]))if((player.school[school as School]??0)<n!)throw Error('Escola diminuiu');
      }
      if(viewFor(g,s).players[1-s].hand.length)throw Error('Vazou mão rival');
    }
    if(g.winner===null)throw Error('Duelo não terminou');
    if(JSON.stringify(replay(g))!==JSON.stringify(g))throw Error('Replay divergiu');
    for(const[id,n]of Object.entries(g.metrics.casts))casts[id]=(casts[id]??0)+n;
    results.push({config,winner:g.winner,turns:g.turn,actions:steps});
  }catch(error){writeFileSync(`${folder}/simulation-failure.json`,JSON.stringify({config,error:String(error),state:g},null,2));throw error}
  if(results.length%18===0)console.log(`${results.length}/108 duelos mistos e replays concluídos`);
}
const report={success:true,version:VERSION,games:results.length,elapsedMs:Date.now()-started,method:'3 modelos Terras × 9 adversários × 2 posições de assento × 2 iniciativas. Bot heurístico: valida regras, não equilíbrio humano.',pilotCast:Object.keys(casts).filter(id=>id.startsWith('TD-')).length,missingPilot:Array.from({length:12},(_,i)=>`TD-P${String(i+1).padStart(2,'0')}`).filter(id=>!casts[id]),casts,results};
writeFileSync(`${folder}/simulations.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({games:report.games,pilotCast:report.pilotCast,missingPilot:report.missingPilot}));
