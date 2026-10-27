import {spawn,type ChildProcess} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdirSync,mkdtempSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomBytes,createHash} from 'node:crypto';
import {once} from 'node:events';
import {chooseBot} from '../engine/bot';
import {replay} from '../engine/engine';
import {pilotDecks} from '../engine/decks';
import type {Game} from '../engine/types';
const output=resolve('../qa/terras-v080');mkdirSync(output,{recursive:true});const folder=mkdtempSync(resolve(output,'http-'));
const port=await new Promise<number>(done=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=(s.address() as {port:number}).port;s.close(()=>done(p))})});
let child:ChildProcess,requests=0,posts=0;const base=`http://127.0.0.1:${port}`,checks:string[]=[];
function assert(ok:unknown,message:string){if(!ok)throw Error(message);checks.push(message)}
const id=()=>randomBytes(12).toString('hex');
async function start(){
  child=spawn(process.execPath,['node_modules/tsx/dist/cli.mjs','server/index.ts','--production'],{cwd:process.cwd(),env:{...process.env,WB_PORT:String(port),WB_HOST:'127.0.0.1',WB_SAVE_PATH:resolve(folder,'rooms.sqlite')},stdio:['ignore','pipe','pipe'],windowsHide:true});
  let ready=false;child.stdout?.on('data',chunk=>{if(String(chunk).includes('Wizards Battle:'))ready=true});child.stderr?.on('data',c=>process.stderr.write(c));
  for(let n=0;n<100;n++){if(ready)return;if(child.exitCode!==null)throw Error('Servidor de QA encerrou');await new Promise(r=>setTimeout(r,100))}throw Error('Servidor não iniciou');
}
async function stop(){if(child.exitCode===null){const done=once(child,'exit');child.kill();await done}}
async function call(path:string,body?:unknown,token=''){
  requests++;if(body!==undefined)posts++;
  const r=await fetch(`${base}/api/${path}`,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:r.status,data:await r.json()};
}
async function action(token:string,action:unknown){const state=(await call('state',undefined,token)).data;return call('action',{action,requestId:id(),revision:state.revision},token)}
let privateChoiceRestored=false;
try{
  await start();assert((await call('health')).data.appVersion==='0.8.0','processo isolado 0.8');
  assert((await call('decks')).data.length===6,'padrão só VES');assert((await call('decks?cardPool=terras-pilot-v1')).data.length===9,'piloto oferece três modelos mistos além de VES');
  assert((await call('new',{customDeck:pilotDecks[0]})).status===400,'deck misto rejeitado sem conjunto experimental');
  assert((await call('new',{deck:pilotDecks[0].name,cardPool:'terras-pilot-v1',variant:'base-0.3'})).status===400,'variante incompatível rejeitada');
  assert((await call('new',{deck:'Pira',cardPool:'inventado'})).status===400,'conjunto forjado rejeitado');
  const h=(await call('rooms/create',{deck:pilotDecks[1].name,cardPool:'terras-pilot-v1'})).data;
  const info=(await call(`rooms/info?code=${h.room.code}`)).data;
  assert(JSON.stringify(Object.keys(info).sort())===JSON.stringify(['cardPool','full','variant']),'convite só publica conjunto, variante e disponibilidade');
  assert((await call('rooms/join',{code:h.room.code,deck:'Pira'})).status===400,'convidado confirma o piloto explicitamente');
  assert((await call('state',undefined,h.token)).data.room.waiting,'erro não consome assento');
  const b=(await call('rooms/join',{code:h.room.code,deck:pilotDecks[2].name,cardPool:'terras-pilot-v1'})).data;
  assert(b.view.cardPool==='terras-pilot-v1'&&b.view.players[0].hand.length===0,'conjunto herdado com mão rival privada');
  const tokens=[h.token,b.token];
  for(let n=0;n<110;n++){
    let moved=false;
    for(const token of tokens){
      const state=(await call('state',undefined,token)).data,v=state.view;
      if(v.winner!==null){moved=false;break}
      const option=chooseBot(v);if(!option)continue;
      if(v.pending?.owner===v.seat&&v.pending.title.includes('Lia')){
        const before=JSON.stringify(v);await stop();await start();const after=(await call('state',undefined,token)).data;
        assert(JSON.stringify(after.view)===before,'consulta privada de Lia persiste com choices após reinício real');privateChoiceRestored=true;
      }
      const result=await call('action',{action:option.action,requestId:id(),revision:state.revision},token);
      assert(result.status===200,'ação legal pela API');moved=true;break;
    }
    if(!moved)break;
  }
  const before=(await call('state',undefined,b.token)).data;
  await stop();await start();const restored=(await call('state',undefined,b.token)).data;
  assert(JSON.stringify(restored.view)===JSON.stringify(before.view)&&restored.room.cardPool==='terras-pilot-v1','reinício mantém conjunto, jogo e escolhas');
  if(restored.view.winner===null)assert((await action(h.token,{kind:'concede'})).status===200,'concessão termina a amostra HTTP');
  const record=(await call('replay',{},h.token)).data;
  const reconstructed=replay({version:record.version,config:record.config,history:record.actions} as Game);
  assert(record.config.cardPool==='terras-pilot-v1'&&reconstructed.winner!==null,'replay HTTP guarda conjunto e reproduz a partida');
  for(const token of tokens){const state=(await call('state',undefined,token)).data;assert((await call('rematch',{requestId:id(),revision:state.revision},token)).status===200,'aceite de revanche válido')}
  assert((await call('state',undefined,b.token)).data.view.cardPool==='terras-pilot-v1','revanche conserva piloto');
  const custom={...pilotDecks[0],name:'Meu deck misto HTTP'};
  const own=(await call('new',{customDeck:custom,cardPool:'terras-pilot-v1',opponent:pilotDecks[1].name})).data;
  assert(own.view.players[0].deckName===custom.name,'lista própria mista inicia contra autômato');await action(own.token,{kind:'concede'});
  const customReplay=(await call('replay',{},own.token)).data;
  assert(JSON.stringify(customReplay.config.customDecks[0])===JSON.stringify(custom),'replay guarda snapshot completo da lista própria');
  const plain=(await call('new',{deck:'Pira'})).data;assert(plain.view.cardPool==='ves','duelo VES continua padrão');
  for(let n=1;n<=12;n++){
    const name=`TD-P${String(n).padStart(2,'0')}.png`,r=await fetch(`${base}/cartas/${name}`),data=Buffer.from(await r.arrayBuffer());
    assert(r.headers.get('content-type')==='image/png'&&createHash('sha256').update(data).digest('hex')===createHash('sha256').update(readFileSync(`public/cartas/${name}`)).digest('hex'),`${name} serve frente revisada exata`);
  }
  const html=await (await fetch(base)).text();assert(html.includes('/assets/main-'),'build 0.8 servido');
  writeFileSync(resolve(output,'http.json'),JSON.stringify({success:true,requests,posts,privateChoiceRestored,checks,folder},null,2));
  console.log(JSON.stringify({success:true,requests,posts,privateChoiceRestored,checks:checks.length}));
}finally{if(child!)await stop()}
