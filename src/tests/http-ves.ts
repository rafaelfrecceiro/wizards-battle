import {writeFileSync} from "node:fs";
import {applyAction,createGame,viewFor,VERSION} from "../engine/engine";
import {starterDecks} from "../engine/decks";
import {chooseBot} from "../engine/bot";
import type {View} from "../engine/types";
const base=`http://127.0.0.1:${process.env.WB_PORT??4182}`;
let requests=0;
function assert(ok:unknown,message:string):asserts ok {if(!ok)throw Error(message)}
async function call(path:string,body?:unknown,token=""){
  requests++;const r=await fetch(`${base}/api/${path}`,{method:body===undefined?"GET":"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:r.status,data:await r.json()};
}
assert((await call("health")).data.version===VERSION,"Versão incorreta");
const catalogue=await call("decks");assert(catalogue.data.length===6,"Seis decks ausentes");
assert((await call("state")).status===401,"Estado sem token");
assert((await call("new",{deck:"inventado"})).status===400,"Deck desconhecido aceito");
const results=[];
for(let i=0;i<starterDecks.length;i++){
  const deck=starterDecks[i],opponent=starterDecks[(i+1)%6].name;
  const custom=i%2===1;
  const r=await call("new",{...(custom?{customDeck:{...deck,name:`VES HTTP ${deck.name}`}}:{deck:deck.name}),opponent,variant:"escolas-v1"});
  assert(r.status===200,`Falha ao abrir ${deck.name}`);const token=r.data.token;
  let view:View=r.data.view;
  assert((await call("replay",{},token)).status===400,"Replay completo liberado antes do fim");
  const before=JSON.stringify(view);
  assert((await call("action",{action:{kind:"attack",uid:"impossivel",target:"mage"}},token)).status===400,"Ação impossível aceita");
  assert(JSON.stringify((await call("state",undefined,token)).data.view)===before,"Erro mudou a mesa");
  let steps=0,privateDecisions=0;
  for(;view.winner===null&&steps<3000;steps++){
    if(view.pending?.owner===0)privateDecisions++;
    const o=chooseBot(view),next=o?await call("action",{action:o.action},token):await call("bot",{},token);
    assert(next.status===200,`Ação falhou em ${deck.name}`);view=next.data.view;
    assert(view.players[1].hand.length===0,"Mão rival exposta");
    assert(view.players[1].veil.every(x=>"hidden" in x||x.known===true),"Prenúncio exposto sem inspeção");
  }
  assert(view.winner!==null,`Duelo ${deck.name} não terminou`);
  const exported=await call("replay",{},token);assert(exported.status===200,"Replay ausente após fim");
  let reconstructed=createGame(exported.data.config);
  for(const h of exported.data.actions)reconstructed=applyAction(reconstructed,h.seat,h.action);
  assert(JSON.stringify(viewFor(reconstructed,0))===JSON.stringify(view),"Replay HTTP divergiu");
  results.push({deck:deck.name,opponent,custom,actions:steps,turns:view.turn,privateDecisions,winner:view.winner,replay:true});
}
const report={version:VERSION,requests,results,privacy:true,atomicErrors:true};
writeFileSync("../qa/ves-v060/http.json",JSON.stringify(report,null,2));console.log(JSON.stringify(report));
