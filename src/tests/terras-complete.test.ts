import {describe,it,expect} from 'vitest';
import {applyAction,cards,createGame,locate,options,replay,viewFor,validatePool} from '../engine/engine';
import * as old from '../engine/legacy/engine-v10';
import {availableDecks,inspectDeck,terrasDecks} from '../engine/decks';
import {catalogue,definitions,editions,rarityCounts} from '../catalog/catalogue';
import edition from '../data/terras-despertas.json';
import {chooseBot} from '../engine/bot';
import {Rooms} from '../server/rooms';
import type {Action,Game,Piece,Seat,Zone} from '../engine/types';
function fixture(){
  const g=createGame({seed:1101,decks:['Pira','Queimada'],first:0,variant:'escolas-v1',energyRule:'reserve-v1',cardPool:'terras-v1'});
  g.phase='main';g.kept=[true,true];g.feedback=[];g.feedbackSeq=0;
  for(const p of g.players){for(const z of Object.keys(p.zones) as Zone[])p.zones[z]=[];p.energy=99;p.life=10;p.school={Chama:20,Raiz:20,Sombra:20,Maré:20};}
  return g;
}
function put(g:Game,id:string,zone:Zone,seat:Seat=0,damage=0):Piece{
  const p:Piece={uid:`td-full-${++g.seq}`,card:id,damage,duration:8,born:0,attacked:false,retreated:false,temp:0,haste:false};g.players[seat].zones[zone].push(p);return p;
}
function settle(g:Game,preferred?:string){
  for(let n=0;g.pending;n++){
    if(n>100)throw Error('Escolha não terminou');const s=g.pending.owner;
    const opts=options(g,s).filter(o=>o.action.choice!=='skip');
    const chosen=opts.find(o=>o.action.choice===preferred)??
      (g.pending.job.fx.op==='$heal_amount'?opts.at(-1):opts[0])??chooseBot(viewFor(g,s));
    if(!chosen)throw Error('Escolha sem opção');g=applyAction(g,s,chosen.action);
  }return g;
}
const cast=(g:Game,x:Piece,row:'front'|'back'='front',s:Seat=0)=>settle(applyAction(g,s,{kind:'cast',uid:x.uid,...(cards[x.card].type==='Monstro'?{row}:{})}));
function end(g:Game){const s=g.active;if(g.phase==='main')g=applyAction(g,s,{kind:'advance'});return settle(applyAction(g,s,{kind:'advance'}));}
function prepared(){
  const g=fixture();put(g,'VES-002','front',0,1);put(g,'VES-003','back',0,1);put(g,'VES-015','front',1,1);put(g,'VES-002','front',1,1);put(g,'VES-003','back',1);
  put(g,'VES-033','enchants',1);put(g,'VES-022','veil',1);
  for(const id of ['VES-009','VES-011','VES-014','VES-018'])for(let n=0;n<3;n++)put(g,id,'sources');
  put(g,'VES-002','ashes');put(g,'VES-013','ashes');put(g,'VES-016','ashes');put(g,'VES-014','discard');
  for(const s of [0,1] as const)for(let n=0;n<8;n++)put(g,'VES-009','deck',s);
  g.players[0].deaths=1;return g;
}
describe('As Terras Despertas completa',()=>{
  it('60 cartas, 140 identidades, raridades 30/20/10, símbolo e edição publicada',()=>{
    expect(edition.cards).toHaveLength(60);expect(Object.keys(definitions)).toHaveLength(140);
    const prints=catalogue.printings.filter(p=>p.edition==='TDP');expect(prints).toHaveLength(60);
    expect(rarityCounts(prints)).toEqual({common:30,uncommon:20,rare:10});
    expect(prints.map(p=>p.number)).toEqual(Array.from({length:60},(_,n)=>n+1));
    expect(editions.TDP.name).toBe('As Terras Despertas');expect(editions.TDP.experimental).toBe(false);expect(editions.TDP.symbol).toBe('terras-awakening');
    expect(edition.cards.every(c=>c.state==='published-1.0')).toBe(true);expect(()=>validatePool()).not.toThrow();
  });
  it('12 monocolores por escola e dois híbridos por par; seis decks cobrem toda a edição',()=>{
    for(const school of ['Chama','Raiz','Sombra','Maré'])expect(edition.cards.filter(c=>c.schools.length===1&&c.schools[0]===school)).toHaveLength(12);
    expect(edition.cards.filter(c=>c.schools.length===2)).toHaveLength(12);
    expect(terrasDecks).toHaveLength(6);const ids=new Set(terrasDecks.flatMap(d=>d.cards.map(c=>c.id)));expect(ids.size).toBe(60);
    for(const d of terrasDecks){expect(inspectDeck(d,'terras-v1').ready).toBe(true);expect(d.cards.reduce((n,c)=>n+c.copies,0)).toBe(40);expect(inspectDeck(d,'ves').ready).toBe(false)}
    expect(availableDecks('terras-v1')).toHaveLength(12);
  });
  it.each(edition.cards.map(c=>c.id))('%s conjura legalmente e suporta escolhas/timings reais',(id)=>{
    let g=prepared();const c=cards[id],x=put(g,id,'hand');const energy=g.players[0].energy;
    const row=c.support||c.keywords.includes('Emboscada')?'back':'front';
    g=cast(g,x,row);expect(g.metrics.casts[id]).toBe(1);expect(g.players[0].energy).toBe(energy-(c.type==='Prenúncio'?1:c.cost!));
    if(c.type==='Prenúncio'){
      expect(locate(g,x.uid)?.zone).toBe('veil');g=end(g);g.active=1;g.phase='main';
      if(c.fx.trigger==='sacrifice')g=applyAction(g,1,{kind:'sacrifice',uid:put(g,'VES-009','hand',1).uid});
      else if(c.fx.trigger==='magic')g=cast(g,put(g,'VES-013','hand',1),'front',1);
      else if(c.fx.trigger==='big_monster')g=cast(g,put(g,'VES-012','hand',1),'front',1);
      else {
        g.phase='combat';const attacker=g.players[1].zones.front[0];
        const target=c.fx.trigger==='face_attack'?'mage':c.fx.trigger==='back_attacked'?g.players[0].zones.back[0].uid:g.players[0].zones.front[0].uid;
        if(target==='mage'){g.players[0].zones.back.push(...g.players[0].zones.front);g.players[0].zones.front=[];}
        g=applyAction(g,1,{kind:'attack',uid:attacker.uid,target});
      }
      g=settle(g);expect(locate(g,x.uid)?.zone).toBe('discard');
      expect(g.feedback?.some(e=>e.kind==='reveal'&&e.source?.uid===x.uid)).toBe(true);
    }else{
      expect(locate(g,x.uid)?.zone).toBe(c.type==='Monstro'?row:c.type==='Encantamento'?'enchants':'discard');
      if(c.type==='Encantamento'||c.support){g=end(g);g=end(g);expect(g.winner).toBeNull()}
    }
    expect(g.players.every(p=>p.energy>=0)).toBe(true);
  });
  it('Espelho só devolve atacante de custo até3; nunca remove um caro',()=>{
    for(const [attackerId,expected] of [['VES-009','hand'],['VES-012','front']] as const){
      let g=fixture();g.active=1;g.phase='combat';const trap=put(g,'TDP-050','veil');const a=put(g,attackerId,'front',1);
      g=settle(applyAction(g,1,{kind:'attack',uid:a.uid,target:'mage'}));expect(locate(g,a.uid)?.zone).toBe(expected);expect(locate(g,trap.uid)?.zone).toBe('discard');
    }
  });
  it.each(edition.cards.map(c=>c.id))('%s conserva atomicidade sem energia e gera sua Essência impressa',(id)=>{
    let g=prepared();const c=cards[id],x=put(g,id,'hand');g.players[0].energy=0;
    const before=structuredClone(g),row=c.support||c.keywords.includes('Emboscada')?'back':'front';
    expect(()=>applyAction(g,0,{kind:'cast',uid:x.uid,...(c.type==='Monstro'?{row}:{})})).toThrow();expect(g).toEqual(before);
    g=applyAction(g,0,{kind:'sacrifice',uid:x.uid});
    expect(g.players[0].energy).toBe(c.essence.generation);
    expect(locate(g,x.uid)?.zone).toBe(c.essence.duration>1?'sources':'ashes');
    expect(locate(g,x.uid)?.x.duration).toBe(Math.max(0,c.essence.duration-1));
    for(const school of c.schools)expect(g.players[0].school[school]).toBe(21);
  });
  it('Tributo paga duas Cinzas antes do dano e não permite pagamento parcial',()=>{
    let g=fixture();const spell=put(g,'TDP-037','hand'),enemy=put(g,'VES-012','front',1);
    put(g,'VES-009','ashes');expect(options(g,0).some(o=>o.uid===spell.uid&&o.action.kind==='cast')).toBe(false);put(g,'VES-013','ashes');
    g=cast(g,spell);expect(g.players[0].zones.ashes).toHaveLength(0);expect(locate(g,enemy.uid)!.x.damage).toBe(3);
    expect(g.feedback?.find(e=>e.kind==='damage')?.source?.card).toBe('TDP-037');
  });
  it('Tecelã consulta Véu e topo em privado sem publicar os nomes ao rival',()=>{
    let g=fixture();put(g,'VES-022','veil',1);const top1=put(g,'VES-051','deck'),top2=put(g,'VES-053','deck');
    g=cast(g,put(g,'TDP-059','hand'));const enemy=JSON.stringify(viewFor(g,1));
    for(const top of [top1,top2]){expect(enemy).not.toContain(cards[top.card].name);expect(enemy).not.toContain(top.uid);}
    expect(g.players[0].known).toBeDefined();expect(g.players[0].zones.deck).toHaveLength(2);
    expect(g.pending).toBeNull();expect(g.feedback?.some(e=>e.kind==='inspect')).toBe(true);
  });
  it('habilidades de morrer respeitam o turno do dono, preservando Prenúncios como reação rival',()=>{
    for(const id of ['TDP-024','TDP-033','TDP-055'])for(const active of [0,1] as const){
      let g=fixture();g.active=active;g.phase='combat';const victim=put(g,id,'front',0,id==='TDP-055'?3:1),ally=put(g,'VES-002','back',0,1),recover=put(g,'VES-014','discard');
      put(g,'VES-009','deck');const a=put(g,'VES-012','front',1);
      g=settle(applyAction(g,active,{kind:'attack',uid:active===0?victim.uid:a.uid,target:active===0?a.uid:victim.uid}));
      expect(locate(g,victim.uid)?.zone).toBe('discard');
      if(id==='TDP-024')expect(locate(g,ally.uid)!.x.damage).toBe(active===0?0:1);
      if(id==='TDP-033')expect(g.players[0].zones.hand).toHaveLength(active===0?1:0);
      if(id==='TDP-055')expect(locate(g,recover.uid)!.zone).toBe(active===0?'hand':'discard');
    }
  });
  it('replay0.10 mantém a seleção de12 e acontecimentos originais',()=>{
    let g=old.createGame({seed:11100,decks:['Terras — Nascentes Vivas','Pira'],cardPool:'terras-pilot-v1',variant:'escolas-v1',energyRule:'reserve-v1',first:0});
    for(let n=0;n<160&&g.winner===null;n++){const s=g.pending?.owner??(g.phase==='mulligan'?(g.kept[0]?1:0):g.active);const o=chooseBot(old.viewFor(g,s));g=old.applyAction(g,s,o!.action)}
    expect(replay(g)).toEqual(g);
  });
  it('sala confirma edição completa e rejeita nova carta no conjunto VES ou seleção inicial',()=>{
    const r=new Rooms(':memory:');try{
      const h=r.create({deck:terrasDecks[0].name,cardPool:'terras-v1',energyRule:'reserve-v1'},true);
      expect(r.inviteInfo(h.room.code).cardPool).toBe('terras-v1');expect(()=>r.join({deck:'Pira',code:h.room.code})).toThrow('Confirme');
      const b=r.join({deck:terrasDecks[1].name,cardPool:'terras-v1',energyRule:'reserve-v1',code:h.room.code});expect(b.view!.cardPool).toBe('terras-v1');
      const g=fixture();const x=put(g,'TDP-013','hand');g.config.cardPool='terras-pilot-v1';expect(()=>applyAction(g,0,{kind:'cast',uid:x.uid,row:'front'})).toThrow();
    }finally{r.close()}
  });
});
