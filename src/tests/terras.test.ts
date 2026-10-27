import {describe,it,expect} from 'vitest';
import {applyAction,cards,createGame,has,locate,options,presence,replay,resonanceEffect,viewFor} from '../engine/engine';
import * as old from '../engine/legacy/engine-v07';
import {availableDecks,inspectDeck,pilotDecks,playableDeck} from '../engine/decks';
import {chooseBot} from '../engine/bot';
import {definitions,catalogue} from '../catalog/catalogue';
import {Rooms} from '../server/rooms';
import type {Game,Piece,Seat,Zone} from '../engine/types';

function fixture():Game {
  const g=createGame({seed:809,decks:['Pira','Queimada'],variant:'escolas-v1',first:0,cardPool:'terras-pilot-v1'});
  g.phase='main';g.kept=[true,true];
  g.feedback=[];g.feedbackSeq=0;
  for(const p of g.players){for(const z of Object.keys(p.zones) as Zone[])p.zones[z]=[];p.energy=40;p.school={Chama:20,Raiz:20,Sombra:20,Maré:20};}
  return g;
}
function add(g:Game,id:string,zone:Zone,seat:Seat=0,damage=0):Piece {
  const x:Piece={uid:`td${++g.seq}`,card:id,damage,duration:8,born:0,attacked:false,retreated:false,temp:0,haste:false};g.players[seat].zones[zone].push(x);return x;
}
function settle(g:Game,preference?:string):Game {
  for(let step=0;g.pending;step++){
    if(step>100)throw Error('Escolha sem término');
    const s=g.pending.owner, choices=options(g,s);
    const option=choices.find(o=>o.action.choice===preference)??chooseBot(viewFor(g,s));
    expect(option).not.toBeNull();g=applyAction(g,s,option!.action);
  }
  return g;
}
function cast(g:Game,x:Piece,row:'front'|'back'='front'){
  return applyAction(g,0,{kind:'cast',uid:x.uid,...(cards[x.card].type==='Monstro'?{row}: {})});
}
function turn(g:Game,s:Seat){
  if(g.phase==='main')g=applyAction(g,s,{kind:'advance'});
  return settle(applyAction(g,s,{kind:'advance'}));
}
function source(g:Game,id:string,n=1){for(let i=0;i<n;i++)add(g,id,'sources');}

describe('Terras — auditoria individual das 12 pela ação real',()=>{
  it.each(Object.keys(cards).filter(id=>id.startsWith('TD-')))('%s conjura e cumpre seu efeito',(id)=>{
    let g=fixture();
    const ally=add(g,'VES-002','front',0,2), back=add(g,'VES-003','back',0,2);
    const enemy=add(g,'VES-012','front',1), enchant=add(g,'VES-033','enchants',1);
    for(const schoolId of ['VES-009','VES-011','VES-014','VES-018'])source(g,schoolId,2);
    const recovered=add(g,'VES-023','ashes');add(g,'VES-013','ashes');add(g,'VES-016','ashes');
    const top=add(g,'VES-029','deck');add(g,'VES-050','deck');
    const c=cards[id], x=add(g,id,'hand');
    const preferred=id==='TD-P04'?ally.uid:id==='TD-P07'?recovered.uid:id==='TD-P12'||id==='TD-P03'?enemy.uid:ally.uid;
    const beforeEnergy=g.players[0].energy;
    g=settle(cast(g,x,c.support?'back':'front'),preferred);
    expect(g.metrics.casts[id]).toBe(1);expect(g.players[0].energy).toBe(beforeEnergy-c.cost!);
    const zone=locate(g,x.uid)!.zone;
    expect(zone).toBe(c.type==='Monstro'?(c.support?'back':'front'):c.type==='Encantamento'?'enchants':'discard');
    switch(id){
      case 'TD-P01':expect(locate(g,ally.uid)!.x.temp).toBe(1);expect(locate(g,ally.uid)!.x.haste).toBe(true);expect(locate(g,x.uid)!.x.haste).toBe(false);break;
      case 'TD-P02':expect(has(g,0,locate(g,x.uid)!.x,'Guardião')).toBe(true);break;
      case 'TD-P03':expect(locate(g,enemy.uid)!.x.damage).toBe(2);expect(g.players[0].zones.ashes).toHaveLength(1);break;
      case 'TD-P04':expect(has(g,0,locate(g,x.uid)!.x,'Alcance')).toBe(true);expect(locate(g,ally.uid)!.zone).toBe('hand');break;
      case 'TD-P05':g=turn(g,0);expect(locate(g,ally.uid)!.x.damage).toBe(0);break;
      case 'TD-P06':expect(g.log.some(l=>l.text.includes('consultou 2 cartas'))).toBe(true);expect(g.players[0].zones.deck).toHaveLength(2);break;
      case 'TD-P07':expect(locate(g,recovered.uid)!.zone).toBe('hand');expect(g.players[0].zones.ashes).toHaveLength(0);break;
      case 'TD-P08':g=turn(g,0);expect(g.log.some(l=>l.text.includes('consultou o topo'))).toBe(true);break;
      case 'TD-P09':expect(locate(g,enchant.uid)!.zone).toBe('discard');break;
      case 'TD-P10':expect(locate(g,enemy.uid)!.zone).toBe('front'); // custo 5 não é alvo
        expect(options(g,0).length).toBeGreaterThan(0);break;
      case 'TD-P11':expect(locate(g,ally.uid)!.x.damage).toBe(1);expect(locate(g,back.uid)!.x.damage).toBe(1);break;
      case 'TD-P12':expect(locate(g,enemy.uid)!.x.damage).toBe(3);break;
    }
    expect(g.players[0].zones.deck.some(x=>x.uid===top.uid)).toBe(true);
  });
});

describe('Ressonância e fronteiras de campo',()=>{
  it('Escola alta não substitui campo; entrada própria completa o limiar e usa o mesmo alvo',()=>{
    let g=fixture();const ally=add(g,'VES-002','front');const lince=add(g,'TD-P01','hand');
    g=settle(cast(g,lince),ally.uid);expect(locate(g,ally.uid)!.x.temp).toBe(1);expect(locate(g,ally.uid)!.x.haste).toBe(false);
    g=fixture();const a=add(g,'VES-002','front');add(g,'VES-009','back');const x=add(g,'TD-P01','hand');
    g=cast(g,x);expect(presence(g.players[0]).Chama).toBe(3);
    expect(g.pending?.choices.some(c=>c.target===x.uid)).toBe(false);
    g=settle(g,a.uid);expect(locate(g,a.uid)!.x.haste).toBe(true);expect(locate(g,x.uid)!.x.temp).toBe(0);
  });
  it('magia não conta, bônus fixa o dano ao abrir escolha e não escolhe outro alvo',()=>{
    let g=fixture();source(g,'VES-009',2);const one=add(g,'VES-012','front',1),two=add(g,'VES-012','front',1);
    const spell=add(g,'TD-P12','hand');g=cast(g,spell);expect(g.pending!.job.fx.n).toBe(2);expect(g.pending!.job.fx.resonance).toBeUndefined();
    g=settle(g,one.uid);expect(locate(g,one.uid)!.x.damage).toBe(2);expect(locate(g,two.uid)!.x.damage).toBe(0);
    g=fixture();source(g,'VES-009',3);const target=add(g,'VES-012','front',1);const f=add(g,'TD-P12','hand');g=settle(cast(g,f));expect(locate(g,target.uid)!.x.damage).toBe(3);
  });
  it('bônus é calculado pela Presença na resolução, incluindo cada escola de híbridas',()=>{
    const g=fixture();source(g,'VES-001',2);
    const f={op:'damage',n:1,target:'enemy_front',resonance:{presence:{Chama:2,Maré:2},n:3}} as const;
    expect(resonanceEffect(g,0,f).n).toBe(3);g.players[0].zones.sources.pop();expect(resonanceEffect(g,0,f).n).toBe(1);
  });
  it('fonte esgotada sai da Presença, sem apagar Escola',()=>{
    let g=fixture();source(g,'VES-009',3);g.players[0].zones.sources[0].duration=1;
    g=turn(g,0);g=turn(g,1);expect(presence(g.players[0]).Chama).toBe(2);expect(g.players[0].school.Chama).toBe(20);
    const enemy=add(g,'VES-012','front',1);g=settle(cast(g,add(g,'TD-P12','hand')));expect(locate(g,enemy.uid)!.x.damage).toBe(2);
  });
  it('Ímpeto não renova ataque já usado e temporários terminam no encerramento',()=>{
    let g=fixture();source(g,'VES-009',2);const ally=add(g,'VES-002','front');ally.attacked=true;
    g=settle(cast(g,add(g,'TD-P01','hand')),ally.uid);g=applyAction(g,0,{kind:'advance'});
    expect(options(g,0).some(o=>o.action.kind==='attack'&&o.uid===ally.uid)).toBe(false);
    g=settle(applyAction(g,0,{kind:'advance'}));expect(locate(g,ally.uid)!.x.temp).toBe(0);expect(locate(g,ally.uid)!.x.haste).toBe(false);
  });
  it('cura parcial permite escolher zero e não adiciona uma segunda escolha de alvo para o bônus',()=>{
    let g=fixture();source(g,'VES-011',2);const ally=add(g,'VES-002','front',0,2);add(g,'TD-P05','back');
    g=applyAction(g,0,{kind:'advance'});g=applyAction(g,0,{kind:'advance'});
    expect(g.pending?.job.fx.op).toBe('$heal_amount');expect(g.pending?.choices.map(c=>c.id)).toEqual(['0','1','2']);
    g=applyAction(g,0,{kind:'choose',choice:'0'});expect(locate(g,ally.uid)!.x.damage).toBe(2);
  });
  it('Santuário exige as duas Presenças; não ativa retroativamente',()=>{
    let g=fixture();add(g,'TD-P08','enchants');source(g,'VES-011');add(g,'VES-029','deck');
    g=turn(g,0);expect(g.log.some(l=>l.text.includes('consultou o topo'))).toBe(false);
  });
  it('Garça respeita condição, limite, próprio alvo e rejogo com novo avanço de Escola',()=>{
    let g=fixture();const small=add(g,'VES-058','front');
    const garca=add(g,'TD-P04','hand');g=settle(cast(g,garca));expect(locate(g,small.uid)!.zone).toBe('front');
    g=fixture();source(g,'VES-018',2);const target=add(g,'VES-058','front');const big=add(g,'VES-060','back');
    const bird=add(g,'TD-P04','hand');g=cast(g,bird);
    expect(g.pending?.choices.filter(c=>c.id!=='skip').map(c=>c.target)).toEqual([target.uid]);
    expect(g.pending?.choices.some(c=>c.target===big.uid||c.target===bird.uid)).toBe(false);
    g=settle(g,target.uid);expect(g.players[0].school.Maré).toBe(21);
    g=settle(cast(g,locate(g,target.uid)!.x));expect(g.players[0].school.Maré).toBe(22);
  });
  it('Bruma devolve um alvo elegível, mas rejeita unidade cara',()=>{
    let g=fixture();const small=add(g,'VES-002','front',1),big=add(g,'VES-012','back',1);
    g=settle(cast(g,add(g,'TD-P10','hand')),small.uid);
    expect(locate(g,small.uid)!.zone).toBe('hand');expect(locate(g,big.uid)!.zone).toBe('back');
  });
});

describe('Cinzas reservadas e consulta privada',()=>{
  it('Catadora reserva o alvo, paga exatamente duas OUTRAS e não revela a recuperação ao rival',()=>{
    let g=fixture();source(g,'VES-014',2);const target=add(g,'VES-023','ashes');add(g,'VES-013','ashes');add(g,'VES-016','ashes');
    g=cast(g,add(g,'TD-P07','hand'));expect(g.pending!.choices.some(c=>c.target===target.uid)).toBe(true);
    g=applyAction(g,0,{kind:'choose',choice:target.uid});
    expect(g.pending!.job.fx.op).toBe('$ashes');expect(g.pending!.choices.some(c=>c.target===target.uid)).toBe(false);
    const before=structuredClone(g);expect(()=>applyAction(g,0,{kind:'choose',choice:target.uid})).toThrow();expect(g).toEqual(before);
    g=settle(g);expect(locate(g,target.uid)!.zone).toBe('hand');expect(g.players[0].zones.discard).toHaveLength(2);
    expect(JSON.stringify(viewFor(g,1))).not.toContain('Bastião da Passagem');
  });
  it('sem bônus só recupera até 2, não recupera magia ou a própria Catadora e pode desistir',()=>{
    let g=fixture();const small=add(g,'VES-002','ashes');const big=add(g,'VES-023','ashes');const spell=add(g,'VES-013','ashes');add(g,'TD-P07','ashes');
    g=cast(g,add(g,'TD-P07','hand'));expect(g.pending!.choices.map(c=>c.target)).toEqual([small.uid,'']);
    const before=g.players[0].zones.ashes.length;g=settle(g,'skip');expect(g.players[0].zones.ashes).toHaveLength(before);expect(locate(g,big.uid)!.zone).toBe('ashes');expect(locate(g,spell.uid)!.zone).toBe('ashes');
  });
  it('duas Cinzas totais não bastam para pagar duas outras; sem pagamento parcial',()=>{
    let g=fixture();add(g,'VES-002','ashes');add(g,'VES-013','ashes');g=settle(cast(g,add(g,'TD-P07','hand')));
    expect(g.pending).toBeNull();expect(g.players[0].zones.ashes).toHaveLength(2);expect(g.players[0].zones.discard).toHaveLength(0);
  });
  it('Lia mostra só as duas cartas ao dono e permite inverter a próxima compra',()=>{
    let g=fixture();const third=add(g,'VES-080','deck'),second=add(g,'VES-050','deck'),first=add(g,'VES-029','deck');
    g=cast(g,add(g,'TD-P06','hand'));
    expect(new Set(options(g,0).map(o=>o.card))).toEqual(new Set(['VES-029','VES-050']));
    const rival=JSON.stringify(viewFor(g,1));for(const name of ['Titã das Fornalhas','Memória da Primeira Queda','Reflexo dos Ausentes'])expect(rival).not.toContain(name);
    g=applyAction(g,0,{kind:'choose',choice:`top:${second.uid}`});g=applyAction(g,0,{kind:'choose',choice:`top:${first.uid}`});
    expect(g.players[0].zones.deck.map(x=>x.uid)).toEqual([third.uid,first.uid,second.uid]);expect(g.pending).toBeNull();
  });
  it('Lia envia as duas ao fundo e lida com biblioteca de zero/uma carta sem duplicar',()=>{
    let g=fixture();const rest=add(g,'VES-080','deck'),second=add(g,'VES-050','deck'),first=add(g,'VES-029','deck');g=cast(g,add(g,'TD-P06','hand'));
    g=applyAction(g,0,{kind:'choose',choice:`bottom:${first.uid}`});g=applyAction(g,0,{kind:'choose',choice:`bottom:${second.uid}`});
    expect(g.players[0].zones.deck.map(x=>x.uid)).toEqual([first.uid,second.uid,rest.uid]);
    for(const n of [0,1]){let f=fixture();if(n)add(f,'VES-029','deck');f=settle(cast(f,add(f,'TD-P06','hand')));expect(f.players[0].zones.deck).toHaveLength(n);expect(f.pending).toBeNull();}
  });
});

describe('Conjuntos, modelos e replay',()=>{
  it('bot valoriza o Santuário que ativa no campo e não consulta biblioteca secreta para pontuar conjuração',()=>{
    const g=fixture();source(g,'VES-011');source(g,'VES-018');const sanctuary=add(g,'TD-P08','hand');add(g,'VES-039','hand');add(g,'VES-029','deck');
    const choices=options(g,0),castOption=choices.find(o=>o.uid===sanctuary.uid&&o.action.kind==='cast')!,sourceOption=choices.find(o=>o.uid===sanctuary.uid&&o.action.kind==='sacrifice')!;
    expect(castOption.score).toBeGreaterThan(sourceOption.score);
    const hidden=structuredClone(g);hidden.players[1].zones.hand=[{...sanctuary,uid:'hidden-opponent',card:'VES-029'}];
    expect(options(hidden,0)).toEqual(choices);
  });
  it('edição completa preserva VES e compatibilidade da seleção inicial de12',()=>{
    expect(Object.keys(definitions)).toHaveLength(140);expect(catalogue.editions.find(e=>e.code==='TDP')?.experimental).toBe(false);
    expect(catalogue.printings.filter(p=>p.edition==='TDP')).toHaveLength(60);expect(availableDecks()).toHaveLength(6);expect(availableDecks('terras-pilot-v1')).toHaveLength(9);expect(availableDecks('terras-v1')).toHaveLength(12);
    const covered=new Set<string>();for(const d of pilotDecks){expect(playableDeck(d,'terras-pilot-v1').cards.length).toBeGreaterThan(0);expect(inspectDeck(d,'ves').ready).toBe(false);for(const c of d.cards)if(c.id.startsWith('TD-'))covered.add(c.id);}
    expect(covered.size).toBe(12);
  });
  it('servidor/motor rejeitam modelo ou lista experimental fora do conjunto e variante incorreta',()=>{
    const d=pilotDecks[0];expect(()=>playableDeck(d)).toThrow('conjunto com As Terras Despertas');
    const config={seed:1,decks:[d.name,'Pira'] as [string,string],variant:'escolas-v1' as const,first:0 as const};
    expect(()=>createGame(config)).toThrow();expect(()=>createGame({...config,customDecks:[d,null]})).toThrow('conjunto com As Terras Despertas');
    expect(()=>createGame({...config,cardPool:'terras-pilot-v1',variant:'base-0.3'})).toThrow('Escola + Presença');
  });
  it('replay 0.7 é reproduzido pelo motor congelado',()=>{
    let g=old.createGame({seed:808,decks:['Vapor','Ilusão'],variant:'escolas-v1',first:0});
    for(let n=0;n<100&&g.winner===null;n++){const s=g.pending?.owner??(g.phase==='mulligan'?(g.kept[0]?1:0):g.active);const o=chooseBot(old.viewFor(g,s));expect(o).not.toBeNull();g=old.applyAction(g,s,o!.action);}
    expect(replay(g)).toEqual(g);
  });
  it.each(pilotDecks.map(d=>d.name))('duelo misto %s termina, conserva 80 peças e reproduz exatamente',(name)=>{
    let g=createGame({seed:81234,decks:[name,'Ilusão'],variant:'escolas-v1',first:0,cardPool:'terras-pilot-v1'});
    for(let n=0;n<3000&&g.winner===null;n++){
      const s=g.pending?.owner??(g.phase==='mulligan'?(g.kept[0]?1:0):g.active),o=chooseBot(viewFor(g,s));expect(o).not.toBeNull();g=applyAction(g,s,o!.action);
      expect(g.players.flatMap(p=>Object.values(p.zones).flat())).toHaveLength(80);
    }
    expect(g.winner).not.toBeNull();expect(replay(g)).toEqual(g);
  });
  it('sala herda conjunto, exige confirmação experimental e não consome o assento em erro',()=>{
    const r=new Rooms(':memory:');try{
      const h=r.create({deck:pilotDecks[0].name,cardPool:'terras-pilot-v1'},true);
      expect(r.inviteInfo(h.room.code)).toEqual({cardPool:'terras-pilot-v1',variant:'escolas-v1',energyRule:'turn',full:false});
      expect(()=>r.join({code:h.room.code,deck:'Pira'})).toThrow('Confirme');expect(r.state(h.token).room.waiting).toBe(true);
      const b=r.join({code:h.room.code,deck:pilotDecks[1].name,cardPool:'terras-pilot-v1'});
      expect(b.room.cardPool).toBe('terras-pilot-v1');expect(b.view!.cardPool).toBe('terras-pilot-v1');expect(b.view!.players[0].hand).toHaveLength(0);
      const normal=r.create({deck:'Pira'},true);expect(()=>r.join({code:normal.room.code,deck:pilotDecks[0].name,cardPool:'terras-pilot-v1'})).toThrow();
      expect(()=>r.create({deck:pilotDecks[0].name,cardPool:'terras-pilot-v1',variant:'fontes-estendidas'})).toThrow('Escola + Presença');
    }finally{r.close()}
  });
});
