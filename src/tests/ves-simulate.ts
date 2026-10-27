import {writeFileSync} from "node:fs";
import {applyAction,createGame,replay,viewFor,VERSION} from "../engine/engine";
import {starterDecks} from "../engine/decks";
import {chooseBot} from "../engine/bot";
import type {Config,Seat} from "../engine/types";

const results:unknown[]=[],casts:Record<string,number>={};
const started=Date.now();
for(const variant of ["base-0.3","fontes-estendidas","escolas-v1"] as const)
for(let i=0;i<starterDecks.length;i++)for(let j=i;j<starterDecks.length;j++)
for(let n=0;n<2;n++)for(const first of [0,1] as Seat[]){
  const config:Config={seed:606000+i*1000+j*100+n*10+first,decks:[starterDecks[i].name,starterDecks[j].name],variant,first};
  let g=createGame(config),steps=0;
  try{
    while(g.winner===null&&steps++<4000){
      const s=g.pending?.owner??(g.phase==="mulligan"?(g.kept[0]?1:0):g.active);
      const v=viewFor(g,s),o=chooseBot(v);if(!o)throw Error("Bot sem ação legal");
      const schools=g.players.map(p=>({...p.school}));
      g=applyAction(g,s,o.action);
      for(const [seat,p] of g.players.entries()){
        const pieces=Object.values(p.zones).flat();
        if(pieces.length!==40||new Set(pieces.map(x=>x.uid)).size!==40)throw Error("Conservação/identidade violada");
        if(p.energy<0||p.zones.front.length>3||p.zones.back.length>3||p.zones.enchants.length>3||p.zones.veil.length>2)throw Error("Recursos/vagas inválidos");
        for(const [sc,value] of Object.entries(schools[seat]))if((p.school[sc as keyof typeof p.school]??0)<value!)throw Error("Escola diminuiu");
      }
    }
    if(g.winner===null)throw Error("Limite de ações excedido");
    if(JSON.stringify(replay(g))!==JSON.stringify(g))throw Error("Replay divergiu");
    for(const [id,count] of Object.entries(g.metrics.casts))casts[id]=(casts[id]??0)+count;
    results.push({config,winner:g.winner,turns:g.turn,actions:steps});
  }catch(error){
    writeFileSync("../qa/ves-v060/simulation-failure.json",JSON.stringify({config,steps,error:String(error),state:g},null,2));throw error;
  }
  if(results.length%42===0)console.log(`${results.length}/252 duelos completos; replay e invariantes OK`);
}
const report={version:VERSION,method:"Bot heurístico, 21 pares incluindo espelhos × 3 variantes × 2 seeds × 2 primeiros jogadores. Não mede diversão ou equilíbrio humano.",games:results.length,finished:results.length,uniqueCast:Object.keys(casts).length,missingCast:Object.keys((await import('../engine/engine')).cards).filter(id=>!casts[id]),maxTurns:Math.max(...(results as {turns:number}[]).map(x=>x.turns)),elapsedMs:Date.now()-started,casts,results};
writeFileSync("../qa/ves-v060/simulations.json",JSON.stringify(report,null,2));
console.log(JSON.stringify({games:report.games,uniqueCast:report.uniqueCast,missingCast:report.missingCast,maxTurns:report.maxTurns}));
