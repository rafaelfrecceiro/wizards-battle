import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { replay } from '../engine/engine';
import type { Game } from '../engine/types';
const folder=mkdtempSync(resolve('../qa/amigos-v070/http-isolado-'));
const port=await new Promise<number>(done=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=(s.address() as {port:number}).port;s.close(()=>done(p))})});
let child:ChildProcess, requests=0;
const base=`http://127.0.0.1:${port}`, checks:string[]=[];
function assert(ok:unknown,message:string){if(!ok)throw Error(message);checks.push(message)}
async function start(){
  child=spawn(process.execPath,['node_modules/tsx/dist/cli.mjs','server/index.ts','--production'],{
    cwd:process.cwd(),env:{...process.env,WB_PORT:String(port),WB_HOST:'127.0.0.1',WB_SAVE_PATH:resolve(folder,'rooms.sqlite')},stdio:['ignore','pipe','pipe'],windowsHide:true});
  child.stderr?.on('data',chunk=>process.stderr.write(chunk));
  let ready=false;
  child.stdout?.on('data',chunk=>{if(String(chunk).includes('Wizards Battle:'))ready=true});
  for(let i=0;i<100;i++){if(ready)return;if(child.exitCode!==null)throw Error('Servidor de teste encerrou');await new Promise(r=>setTimeout(r,100))}
  throw Error('Servidor não iniciou');
}
async function stop(){if(child.exitCode===null){const ended=once(child,'exit');child.kill();await ended}}
async function call(path:string,body?:unknown,token='',origin?:string){requests++;const r=await fetch(`${base}/api/${path}`,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`,...(origin?{Origin:origin}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()}}
const id=()=>randomBytes(12).toString('hex');
try{
  await start();
  assert((await call('health')).data.appVersion==='0.7.0','versão 0.7 em processo isolado');
  assert((await call('state')).status===401,'sem credencial não acessa mesa');
  assert((await call('rooms/create',{deck:'Pira'},'','https://outro.invalid')).status===403,'origem externa bloqueada');
  assert((await call('rooms/create',{customDeck:{name:'Ilegal',cards:[]}})).status===400,'lista ilegal rejeitada');
  const a=(await call('rooms/create',{deck:'Estações',accessKey:randomBytes(24).toString('hex')})).data;
  assert(a.view===null && a.room.waiting,'anfitrião aguarda sem mão/seed');
  const joins=await Promise.all([call('rooms/join',{code:a.room.code,deck:'Vapor'}),call('rooms/join',{code:a.room.code,deck:'Ilusão'})]);
  assert(joins.filter(j=>j.status===200).length===1 && joins.filter(j=>j.status===409).length===1,'entrada concorrente reserva um único assento');
  const b=joins.find(j=>j.status===200)!.data;
  const state=(await call('state',undefined,b.token)).data;
  assert(state.view.seat===1 && state.view.players[0].hand.length===0 && state.view.players[1].hand.length===7,'convidado recebe somente sua mão');
  assert((await call('bot',{requestId:id(),revision:state.revision},b.token)).status===403,'bot proibido em sala humana');
  const body={action:{kind:'mulligan',choice:'keep'},revision:state.revision,requestId:id()};
  const repeated=await Promise.all([call('action',body,b.token),call('action',body,b.token)]);
  assert(repeated.every(r=>r.status===200) && repeated[0].data.revision===repeated[1].data.revision,'duplo envio não duplica ação');
  assert((await call('action',{...body,requestId:id()},a.token)).status===409,'ação atrasada bloqueada');
  assert((await call('replay',{},a.token)).status===400,'replay bloqueado antes do término');
  const prior=(await call('state',undefined,b.token)).data;
  await stop();await start();
  const restored=(await call('state',undefined,b.token)).data;
  assert(JSON.stringify(restored.view)===JSON.stringify(prior.view) && restored.revision===prior.revision,'reinício real preserva partida e revisão');
  assert((await call('action',body,b.token)).data.revision===prior.revision,'recibo sobrevive a reinício');
  const revision=(await call('state',undefined,a.token)).data.revision;
  assert((await call('action',{action:{kind:'concede'},requestId:id(),revision},a.token)).data.view.winner===1,'concessão resolve vitória do convidado');
  const record=(await call('replay',{},b.token)).data;
  assert(replay({version:record.version,config:record.config,history:record.actions} as Game).winner===1,'replay HTTP reproduz concessão');
  for(const token of [a.token,b.token])await call('rematch',{requestId:id(),revision:(await call('state',undefined,token)).data.revision},token);
  const next=(await call('state',undefined,a.token)).data;
  assert(next.room.round===2 && next.view.winner===null,'revanche começa somente após dois aceites');
  const solo=(await call('new',{deck:'Pira'})).data;
  await stop();await start();
  assert((await call('state',undefined,solo.token)).data.view.players[0].hand.length===7,'duelo solo também sobrevive ao reinício');
  const staticResponse=await fetch(base+'/');assert(staticResponse.ok && (await staticResponse.text()).includes('/assets/main-'),'build isolado servido por HTTP');
  writeFileSync(resolve('../qa/amigos-v070/http.json'),JSON.stringify({success:true,requests,checks,folder},null,2));
  console.log(JSON.stringify({success:true,requests,checks:checks.length}));
}finally{if(child!)await stop()}
