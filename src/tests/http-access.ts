import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
const remote=process.env.WB_PUBLIC_URL;
if(!remote)throw Error('Defina WB_PUBLIC_URL para o túnel em teste.');
const lan=process.env.WB_LAN_URL ?? 'http://127.0.0.1:4183';
let requests=0;
async function call(base:string,path:string,body?:unknown,token=''){
  requests++;const r=await fetch(`${base}/api/${path}`,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`,Origin:base},body:body===undefined?undefined:JSON.stringify(body)});
  const data=await r.json();if(!r.ok)throw Error(`${path}: ${r.status} ${data.error}`);return data;
}
const host=await call(lan,'rooms/create',{deck:'Vapor'}),guest=await call(remote,'rooms/join',{code:host.room.code,deck:'Decomposição'});
const seen=await call(lan,'state',undefined,host.token);
if(seen.room.waiting || guest.view.seat!==1 || guest.view.players[0].hand.length)throw Error('Assento/sigilo incorreto');
await call(remote,'action',{action:{kind:'mulligan',choice:'keep'},requestId:randomBytes(12).toString('hex'),revision:guest.revision},guest.token);
const update=await call(lan,'state',undefined,host.token);
if(update.revision!==guest.revision+1)throw Error('LAN não recebeu ação remota');
const end=await call(lan,'action',{action:{kind:'concede'},requestId:randomBytes(12).toString('hex'),revision:update.revision},host.token);
const result=await call(remote,'state',undefined,guest.token);
if(result.view.winner!==1 || end.view.winner!==1)throw Error('Vitória divergente');
const replay=await call(remote,'replay',{},guest.token);
if(replay.actions.length!==2)throw Error('Replay divergente');
writeFileSync('../qa/amigos-v070/https-lan.json',JSON.stringify({success:true,requests,lan,remote,checks:['criação LAN','entrada HTTPS','Origem pública autorizada','mão do outro jogador oculta','ação HTTPS sincronizada na LAN','resultado consistente','replay final pelo túnel']},null,2));
console.log(JSON.stringify({success:true,requests}));
