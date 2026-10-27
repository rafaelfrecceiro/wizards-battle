import {describe,expect,it} from 'vitest';
import {applyAction,cards,createGame,locate,options,replay,viewFor} from '../engine/engine';
import {actor,feedback,publicFeedback} from '../engine/feedback';
import {chooseBot} from '../engine/bot';
import * as old from '../engine/legacy/engine-v09';
import {eventText,FeedbackQueue} from '../web/battle-feedback';
import type {BattleEvent,Game,Piece,Seat,View,Zone} from '../engine/types';

function fixture(){
  const g=createGame({seed:1001,decks:['Pira','Queimada'],first:0,variant:'escolas-v1',energyRule:'reserve-v1',cardPool:'terras-pilot-v1'});
  g.phase='main';g.kept=[true,true];g.feedback=[];g.feedbackSeq=0;
  for(const p of g.players){for(const z of Object.keys(p.zones) as Zone[])p.zones[z]=[];p.energy=40;p.school={Chama:20,Raiz:20,Sombra:20,Maré:20};}
  return g;
}
function put(g:Game,card:string,zone:Zone,seat:Seat=0,damage=0){
  const p:Piece={uid:`feedback-${++g.seq}`,card,damage,duration:3,born:0,attacked:false,retreated:false,temp:0,haste:false};g.players[seat].zones[zone].push(p);return p;
}
function settle(g:Game,choice?:string){
  for(let n=0;g.pending;n++){
    if(n>100)throw Error('Escolha sem fim');const s=g.pending.owner;
    const o=options(g,s).find(o=>o.action.choice===choice)??chooseBot(viewFor(g,s));g=applyAction(g,s,o!.action);
  }return g;
}

describe('Feedback causal confirmado pelo motor',()=>{
  it('Magia anuncia a carta, causa dano e explica a morte antes de descartar',()=>{
    let g=fixture();const target=put(g,'VES-014','front',1),spell=put(g,'VES-006','hand');
    g=settle(applyAction(g,0,{kind:'cast',uid:spell.uid}));
    expect(g.feedback!.map(e=>e.kind)).toEqual(['cast','damage','death']);
    const [cast,hit,death]=g.feedback!;expect(cast.source?.card).toBe(spell.card);
    expect(hit.source?.uid).toBe(spell.uid);expect(hit.target?.uid).toBe(target.uid);expect(hit.amount).toBe(3);
    expect(death.source?.uid).toBe(spell.uid);expect(death.target?.zone).toBe('discard');
    expect(eventText(death,1)).toContain('A Última Descarga');expect(eventText(death,1)).toContain('Vulto da Fuligem');
  });
  it('Prenúncio mata atacante antes do combate: revela origem e não inventa ataque resolvido',()=>{
    let g=fixture();g.phase='combat';const a=put(g,'VES-009','front'),trap=put(g,'VES-022','veil',1);
    g=settle(applyAction(g,0,{kind:'attack',uid:a.uid,target:'mage'}));
    const death=g.feedback!.find(e=>e.kind==='death')!;
    expect(death.source?.uid).toBe(trap.uid);expect(death.target?.uid).toBe(a.uid);
    expect(g.feedback!.some(e=>e.kind==='reveal'&&e.source?.card===trap.card)).toBe(true);
    expect(g.feedback!.some(e=>e.kind==='attack'&&e.reason==='combat')).toBe(false);
    expect(g.feedback!.some(e=>e.kind==='attack'&&e.reason==='intent')).toBe(true);
    expect(g.feedback!.some(e=>e.kind==='attack'&&e.reason==='cancelled')).toBe(true);expect(g.players[1].life).toBe(15);
  });
  it('troca simultânea atribui cada morte ao monstro que causou aquele dano',()=>{
    let g=fixture();g.phase='combat';const a=put(g,'VES-002','front',0,1),b=put(g,'VES-002','front',1,1);
    g=applyAction(g,0,{kind:'attack',uid:a.uid,target:b.uid});
    const deaths=g.feedback!.filter(e=>e.kind==='death');expect(deaths).toHaveLength(2);
    expect(deaths.find(e=>e.target?.uid===a.uid)?.source?.uid).toBe(b.uid);
    expect(deaths.find(e=>e.target?.uid===b.uid)?.source?.uid).toBe(a.uid);
    expect(g.feedback!.map(e=>e.kind)).toEqual(['attack','attack','damage','damage','death','death']);
  });
  it('Encantamento identifica sua origem ao causar dano ao mago no encerramento',()=>{
    let g=fixture();const enchant=put(g,'VES-033','enchants');g.players[0].casts=2;
    g=applyAction(g,0,{kind:'advance'});g=settle(applyAction(g,0,{kind:'advance'}));
    const e=g.feedback!.find(e=>e.kind==='damage'&&e.target?.zone==='mage')!;
    expect(e.source?.uid).toBe(enchant.uid);expect(e.amount).toBe(1);
    expect(eventText(e,0)).toContain('Ritmo das Fornalhas');
  });
  it('suporte que causa dano e mata carrega sua identidade até a morte',()=>{
    let g=fixture();const support=put(g,'VES-026','back',1),target=put(g,'VES-009','front');
    g=applyAction(g,0,{kind:'advance'});g=settle(applyAction(g,0,{kind:'advance'}));
    expect(g.feedback!.find(e=>e.kind==='death'&&e.target?.uid===target.uid)?.source?.uid).toBe(support.uid);
  });
  it('cura escolhida preserva a origem e o valor realmente removido',()=>{
    let g=fixture();const target=put(g,'VES-002','front',0,1),spell=put(g,'VES-013','hand');
    g=settle(applyAction(g,0,{kind:'cast',uid:spell.uid}),'1');
    const e=g.feedback!.find(e=>e.kind==='heal')!;expect(e.amount).toBe(1);expect(e.source?.uid).toBe(spell.uid);expect(e.target?.uid).toBe(target.uid);
  });
  it('retorno não é apresentado como morte',()=>{
    let g=fixture();const target=put(g,'VES-002','front',1),spell=put(g,'VES-021','hand');
    g=settle(applyAction(g,0,{kind:'cast',uid:spell.uid}));
    expect(g.feedback!.some(e=>e.kind==='death')).toBe(false);
    const e=g.feedback!.find(e=>e.kind==='recover')!;expect(e.source?.uid).toBe(spell.uid);expect(e.target?.uid).toBe(target.uid);expect(e.target?.zone).toBe('hand');
  });
  it('fonte destruída por ataque explica a origem e o destino Cinzas',()=>{
    let g=fixture();g.phase='combat';const a=put(g,'VES-002','front'),source=put(g,'VES-014','sources',1);source.duration=2;
    g=applyAction(g,0,{kind:'attack',uid:a.uid,target:source.uid});
    const e=g.feedback!.find(e=>e.kind==='expire')!;expect(e.source?.uid).toBe(a.uid);expect(e.target?.uid).toBe(source.uid);expect(e.target?.zone).toBe('ashes');
    expect(eventText(e,0)).toContain('Vigia da Caldeira');expect(g.feedback!.some(e=>e.kind==='death')).toBe(false);
  });
  it('Cuidadora explica o bônus condicional quando um Raiz fica ferido',()=>{
    let g=fixture();g.phase='combat';const unit=put(g,'VES-036','front'),support=put(g,'VES-040','back'),enemy=put(g,'VES-014','front',1);
    g=applyAction(g,0,{kind:'attack',uid:unit.uid,target:enemy.uid});
    const buff=g.feedback!.find(e=>e.kind==='boost'&&e.target?.uid===unit.uid)!;
    expect(buff.source?.uid).toBe(support.uid);expect(buff.amount).toBe(1);expect(buff.reason).toBe('aura_force');
    expect(eventText(buff,0)).toContain('Cuidadora das Fendas');
  });
  it('armar e comprar não revelam nome, frente nem UID ao assento rival',()=>{
    let g=fixture();const trap=put(g,'VES-022','hand');g=applyAction(g,0,{kind:'cast',uid:trap.uid});
    const own=JSON.stringify(publicFeedback(g,0)),enemy=JSON.stringify(publicFeedback(g,1));
    expect(own).toContain('Retorno da Chama');expect(enemy).not.toContain('Retorno da Chama');expect(enemy).not.toContain(trap.card);expect(enemy).not.toContain(trap.uid);
    feedback(g,{kind:'draw',target:actor(0,'hand',trap,cards[trap.card].name)});
    expect(JSON.stringify(publicFeedback(g,1))).not.toContain(trap.card);
  });
  it('recuperação de Cinzas permanece privada mesmo na linha de acontecimentos',()=>{
    let g=fixture();const target=put(g,'VES-023','ashes');put(g,'VES-013','ashes');put(g,'VES-016','ashes');
    put(g,'VES-014','sources');put(g,'VES-014','sources');
    g=settle(applyAction(g,0,{kind:'cast',uid:put(g,'TD-P07','hand').uid,row:'front'}),target.uid);
    expect(locate(g,target.uid)?.zone).toBe('hand');
    expect(JSON.stringify(publicFeedback(g,1))).not.toContain('Bastião da Passagem');
    expect(JSON.stringify(publicFeedback(g,0))).toContain('Bastião da Passagem');
  });
  it('a linha é limitada sem perder a numeração monotônica',()=>{
    const g=fixture();for(let n=0;n<300;n++)feedback(g,{kind:'phase',reason:'test'});
    expect(g.feedback).toHaveLength(240);expect(g.feedback![0].id).toBe(61);expect(g.feedbackSeq).toBe(300);
  });
  it('partida antiga 0.9 usa motor congelado sem reinterpretar como acontecimentos novos',()=>{
    let g=old.createGame({seed:10009,decks:['Estações','Pira'],first:0,variant:'escolas-v1',energyRule:'reserve-v1'});
    for(let n=0;n<130&&g.winner===null;n++){const s=g.pending?.owner??(g.phase==='mulligan'?(g.kept[0]?1:0):g.active);const o=chooseBot(old.viewFor(g,s));g=old.applyAction(g,s,o!.action)}
    expect(replay(g)).toEqual(g);expect(g.feedback).toBeUndefined();
  });
});

describe('Fila de apresentação',()=>{
  const event=(id:number):BattleEvent=>({id,turn:1,kind:'damage',amount:1,target:{seat:0,zone:'mage'}});
  const view=(seq:number):View=>({...viewFor(fixture(),0),feedbackSeq:seq,feedback:Array.from({length:seq},(_,n)=>event(n+1))});
  it('mantém o estado anterior durante a animação e não repete por polling',async()=>{
    const committed:number[]=[],steps:number[]=[],finish:(()=>void)[]=[];
    const q=new FeedbackQueue({commit:v=>committed.push(v.feedbackSeq!),playing:()=>{},step:e=>{if(e)steps.push(e.id)},animate:()=>new Promise(r=>finish.push(r))});
    q.enqueue(view(0),'a');q.enqueue(view(2),'a');q.enqueue(view(2),'a');expect(committed).toEqual([0]);expect(steps).toEqual([1]);
    finish.shift()!();await Promise.resolve();expect(steps).toEqual([1,2]);expect(committed).toEqual([0]);
    finish.shift()!();await Promise.resolve();await Promise.resolve();expect(committed.at(-1)).toBe(2);expect(steps).toEqual([1,2]);q.dispose();
  });
  it('reconexão/revanche começam da posição atual sem reproduzir histórico antigo',async()=>{
    const commits:number[]=[],steps:number[]=[];let resolve:(()=>void)|undefined;
    const q=new FeedbackQueue({commit:v=>commits.push(v.feedbackSeq!),playing:()=>{},step:e=>{if(e)steps.push(e.id)},animate:()=>new Promise(r=>{resolve=r})});
    q.enqueue(view(3),'a');expect(steps).toEqual([]);q.enqueue(view(4),'a');expect(steps).toEqual([4]);
    q.enqueue(view(0),'b');resolve?.();await Promise.resolve();expect(commits.at(-1)).toBe(0);expect(steps).toEqual([4]);q.dispose();
  });
  it('falha da animação não bloqueia a atualização confirmada',async()=>{
    let seq=-1,failed=false,busy=false;
    const q=new FeedbackQueue({commit:v=>{seq=v.feedbackSeq!},playing:v=>{busy=v},step:()=>{},animate:async()=>{throw Error('WAAPI unavailable')},failure:()=>{failed=true}});
    q.enqueue(view(0),'a');q.enqueue(view(1),'a');await Promise.resolve();await Promise.resolve();
    expect(seq).toBe(1);expect(failed).toBe(true);expect(busy).toBe(false);q.dispose();
  });
});
