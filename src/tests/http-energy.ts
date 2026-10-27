import {spawn,type ChildProcess} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdirSync,mkdtempSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {once} from 'node:events';
import {replay} from '../engine/engine';
import type {Game} from '../engine/types';
const output=resolve('../qa/energia-v090');mkdirSync(output,{recursive:true});
const folder=mkdtempSync(resolve(output,'http-'));
const port=await new Promise<number>(done=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=(s.address() as {port:number}).port;s.close(()=>done(p))})});
let child:ChildProcess|undefined;const base=`http://127.0.0.1:${port}`,checks:string[]=[];let requests=0;
function assert(ok:unknown,message:string){if(!ok)throw Error(message);checks.push(message)}
async function start(){
  child=spawn(process.execPath,['node_modules/tsx/dist/cli.mjs','server/index.ts','--production'],{cwd:process.cwd(),env:{...process.env,WB_PORT:String(port),WB_HOST:'127.0.0.1',WB_SAVE_PATH:resolve(folder,'rooms.sqlite')},stdio:['ignore','pipe','pipe'],windowsHide:true});
  let ready=false;child.stdout?.on('data',c=>{if(String(c).includes('Wizards Battle:'))ready=true});child.stderr?.on('data',c=>process.stderr.write(c));
  for(let n=0;n<100;n++){if(ready)return;if(child.exitCode!==null)throw Error('Servidor de QA encerrou');await new Promise(r=>setTimeout(r,100))}throw Error('Servidor não iniciou');
}
async function stop(){if(child&&child.exitCode===null){const done=once(child,'exit');child.kill();await done}}
async function call(path:string,body?:unknown,token=''){
  requests++;const r=await fetch(`${base}/api/${path}`,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:r.status,data:await r.json()};
}
async function action(token:string,action:unknown){const state=(await call('state',undefined,token)).data;const result=await call('action',{action,requestId:randomBytes(12).toString('hex'),revision:state.revision},token);assert(result.status===200,'ação legal aceita');return result.data}
try{
  await start();assert((await call('health')).data.appVersion==='0.9.0','servidor 0.9 isolado');
  assert((await call('new',{deck:'Pira',energyRule:'forjada'})).status===400,'regra forjada rejeitada');
  assert((await call('new',{deck:'Pira',variant:'base-0.3',energyRule:'reserve-v1'})).status===400,'combinação incompatível rejeitada');
  const h=(await call('rooms/create',{deck:'Vapor',energyRule:'reserve-v1'})).data;
  const info=(await call(`rooms/info?code=${h.room.code}`)).data;
  assert(info.energyRule==='reserve-v1'&&JSON.stringify(Object.keys(info).sort())===JSON.stringify(['cardPool','energyRule','full','variant']),'convite publica somente regras e disponibilidade');
  assert((await call('rooms/join',{deck:'Ilusão',code:h.room.code})).status===400,'confirmação da reserva é obrigatória no convite');
  const b=(await call('rooms/join',{deck:'Ilusão',code:h.room.code,energyRule:'reserve-v1'})).data,tokens=[h.token,b.token];
  assert(b.view.energyRule==='reserve-v1'&&b.view.players[0].hand.length===0,'convidado herda reserva sem receber mão rival');
  for(const t of tokens)await action(t,{kind:'mulligan',choice:'keep'});
  const first=(await call('state',undefined,h.token)).data.view.active,token=tokens[first],other=tokens[1-first];
  const state=(await call('state',undefined,token)).data;
  const hand=state.view.players[first].hand;
  const best=hand.find((x:any)=>x.definition.essence.generation===1&&x.definition.essence.duration===3)??hand[0];
  const sacrificed=await action(token,{kind:'sacrifice',uid:best.uid});
  const generated=sacrificed.view.players[first].energy;
  await action(token,{kind:'advance'});const ended=await action(token,{kind:'advance'});
  assert(generated>0&&ended.view.players[first].energy===generated,'saldo atravessa encerramento e fica público no turno rival');
  const snapshot=JSON.stringify(ended.view);await stop();await start();
  assert(JSON.stringify((await call('state',undefined,token)).data.view)===snapshot,'reinício real recupera saldo, regra e estado exatos');
  await action(other,{kind:'advance'});const next=await action(other,{kind:'advance'});
  const expected=generated+(sacrificed.view.players[first].sources.length?best.definition.essence.generation:0);
  assert(next.view.players[first].energy===expected,'despertar soma geração ao saldo conservado');
  await action(token,{kind:'concede'});const record=(await call('replay',{},token)).data;
  const reconstructed=replay({version:record.version,config:record.config,history:record.actions} as Game);
  assert(record.config.energyRule==='reserve-v1'&&reconstructed.winner!==null&&reconstructed.players[first].energy===expected,'replay HTTP conserva regra e saldo');
  for(const t of tokens){const s=(await call('state',undefined,t)).data;assert((await call('rematch',{requestId:randomBytes(12).toString('hex'),revision:s.revision},t)).status===200,'revanche aceita')}
  const rematch=(await call('state',undefined,token)).data.view;
  assert(rematch.energyRule==='reserve-v1'&&rematch.players.every((p:any)=>p.energy===0),'revanche mantém regra e inicia reservas novas');
  const plain=(await call('new',{deck:'Pira',energyRule:'turn'})).data;
  assert(plain.view.energyRule==='turn','regra anterior permanece selecionável');
  const html=await(await fetch(base)).text();assert(html.includes('/assets/main-'),'build novo é servido');
  writeFileSync(resolve(output,'http.json'),JSON.stringify({success:true,requests,checks,folder,firstSource:best.card,generated,nextEnergy:expected},null,2));
  console.log(JSON.stringify({success:true,requests,checks:checks.length,generated,nextEnergy:expected}));
}finally{await stop()}
