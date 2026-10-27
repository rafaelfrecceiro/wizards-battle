import { describe, expect, it } from 'vitest';
import { mkdtempSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyAction, cards, createGame, options, replay, viewFor } from '../engine/engine';
import * as old from '../engine/legacy/engine-v08';
import { chooseBot } from '../engine/bot';
import { pilotDecks } from '../engine/decks';
import { Rooms } from '../server/rooms';
import type { Action, Config, Game, Piece, Seat, Zone } from '../engine/types';

function put(g: Game, id: string, zone: Zone, seat: Seat = 0): Piece {
  const x: Piece = { uid:`reserve-${++g.seq}`, card:id, damage:0, duration:cards[id].essence.duration,
    born:0, attacked:false, retreated:false, temp:0, haste:false };
  g.players[seat].zones[zone].push(x); return x;
}
function fixture(energyRule: Config['energyRule'] = 'reserve-v1') {
  let g = createGame({seed:901,decks:['Vapor','Ilusão'],first:0,variant:'escolas-v1',energyRule});
  for (const s of [0,1] as const) g=applyAction(g,s,{kind:'mulligan',choice:'keep'});
  for (const p of g.players) {
    for (const z of Object.keys(p.zones) as Zone[]) p.zones[z]=[];
    p.energy=0; p.life=100; p.school={Chama:20,Raiz:20,Maré:20,Sombra:20};
  }
  for (const s of [0,1] as const) for(let n=0;n<12;n++) put(g,'VES-001','deck',s);
  return g;
}
function end(g: Game) {
  const s=g.active;
  if(g.phase==='main') g=applyAction(g,s,{kind:'advance'});
  return applyAction(g,s,{kind:'advance'});
}
function nextOwn(g: Game) { return end(end(g)); }

describe('Reserva experimental de energia',()=>{
  it('fonte 1×3 acumula 1→2→3 e não produz uma quarta vez',()=>{
    let g=fixture();const source=put(g,'VES-062','hand');
    g=applyAction(g,0,{kind:'sacrifice',uid:source.uid});
    expect(g.players[0].energy).toBe(1);expect(g.players[0].zones.sources[0].duration).toBe(2);
    expect(options(g,0).some(o=>o.action.kind==='sacrifice')).toBe(false);
    g=end(g);expect(g.active).toBe(1);expect(g.players[0].energy).toBe(1);
    expect(viewFor(g,1).players[0].energy).toBe(1);
    g=end(g);expect(g.players[0].energy).toBe(2);
    g=nextOwn(g);expect(g.players[0].energy).toBe(3);
    expect(g.players[0].zones.sources).toHaveLength(0);
    expect(g.players[0].zones.ashes.some(x=>x.uid===source.uid)).toBe(true);
    g=nextOwn(g);expect(g.players[0].energy).toBe(3);
    expect(g.players[0].stored).toBe(0);
  });
  it('pagamento reduz o saldo e a geração seguinte soma apenas o que sobrou',()=>{
    let g=fixture();g.players[0].energy=4;
    const source=put(g,'VES-062','hand'),unit=put(g,'VES-036','hand');
    g=applyAction(g,0,{kind:'sacrifice',uid:source.uid});
    g=applyAction(g,0,{kind:'cast',uid:unit.uid,row:'front'});
    expect(g.players[0].energy).toBe(3);
    g=nextOwn(g);expect(g.players[0].energy).toBe(4);
  });
  it('soma várias fontes sem teto e mantém reservas independentes',()=>{
    let g=fixture();g.players[0].energy=50;g.players[1].energy=7;
    put(g,'VES-062','sources');put(g,'VES-062','sources');
    g=nextOwn(g);expect(g.players[0].energy).toBe(52);expect(g.players[1].energy).toBe(7);
    expect(viewFor(g,0).energyRule).toBe('reserve-v1');
  });
  it('destruir a fonte no turno rival conserva o saldo e remove geração futura',()=>{
    let g=fixture();const source=put(g,'VES-062','hand');
    const attacker=put(g,'VES-001','front',1);
    g=applyAction(g,0,{kind:'sacrifice',uid:source.uid});g=end(g);
    g=applyAction(g,1,{kind:'advance'});
    g=applyAction(g,1,{kind:'attack',uid:attacker.uid,target:source.uid});
    expect(g.players[0].zones.sources).toHaveLength(0);expect(g.players[0].energy).toBe(1);
    expect(viewFor(g,0).players[0].presence.Maré??0).toBe(0);
    expect(g.players[0].school.Maré).toBe(21);
    g=end(g);expect(g.players[0].energy).toBe(1);
  });
  it('saldo insuficiente continua bloqueando pagamento sem mutação',()=>{
    const g=fixture(),unit=put(g,'VES-036','hand');g.players[0].energy=1;
    const before=structuredClone(g);
    expect(()=>applyAction(g,0,{kind:'cast',uid:unit.uid,row:'front'})).toThrow();
    expect(g).toEqual(before);
  });
  it('Guardiã não duplica, não limita reserva a 1 e não oferece escolha redundante',()=>{
    let g=fixture();g.players[0].energy=8;put(g,'VES-062','back');put(g,'VES-062','back');
    g=end(g);expect(g.pending).toBeNull();expect(g.players[0].energy).toBe(8);
    expect(g.players[0].stored).toBe(0);g=end(g);expect(g.players[0].energy).toBe(8);
  });
  it('regra original ainda perde a sobra no encerramento',()=>{
    let g=fixture('turn');g.players[0].energy=5;
    g=end(g);expect(g.players[0].energy).toBe(0);
    g=end(g);expect(g.players[0].energy).toBe(0);
  });
  it('Guardiã original ainda permite guardar 1 para o próximo turno',()=>{
    let g=fixture('turn');g.players[0].energy=5;put(g,'VES-062','back');g=end(g);
    expect(g.pending?.title).toContain('guardar energia');
    g=applyAction(g,0,{kind:'choose',choice:'store'});
    expect(g.players[0].energy).toBe(0);expect(g.players[0].stored).toBe(1);
    g=end(g);expect(g.players[0].energy).toBe(1);expect(g.players[0].stored).toBe(0);
  });
  it('rejeita regra forjada e combinação com variante antiga',()=>{
    const config:Config={seed:1,decks:['Pira','Queimada'],variant:'escolas-v1',first:0};
    expect(()=>createGame({...config,energyRule:'inventada' as Config['energyRule']})).toThrow();
    expect(()=>createGame({...config,variant:'fontes-estendidas',energyRule:'reserve-v1'})).toThrow();
  });
  it('replay 0.8 continua com o motor congelado, inclusive suportes e cartas Terras',()=>{
    let g=old.createGame({seed:9008,decks:[pilotDecks[1].name,'Ilusão'],variant:'escolas-v1',first:0,cardPool:'terras-pilot-v1'});
    for(let n=0;n<180&&g.winner===null;n++) {
      const s=g.pending?.owner??(g.phase==='mulligan'?(g.kept[0]?1:0):g.active);
      const o=chooseBot(old.viewFor(g,s));expect(o).not.toBeNull();g=old.applyAction(g,s,o!.action);
    }
    expect(replay(g)).toEqual(g);
  });
  it.each(['Pira','Vapor','Ilusão',...pilotDecks.map(d=>d.name)])('bot conclui %s com reserva, conservação de peças e replay exato',(name)=>{
    let g=createGame({seed:90901,decks:[name,'Queimada'],first:0,variant:'escolas-v1',energyRule:'reserve-v1',cardPool:'terras-pilot-v1'});
    let carried=false;
    for(let n=0;n<4000&&g.winner===null;n++) {
      const s=g.pending?.owner??(g.phase==='mulligan'?(g.kept[0]?1:0):g.active);
      const o=chooseBot(viewFor(g,s));expect(o).not.toBeNull();g=applyAction(g,s,o!.action);
      for(const p of g.players){expect(p.energy).toBeGreaterThanOrEqual(0);expect(Object.values(p.zones).flat()).toHaveLength(40)}
      if(g.players[1-g.active].energy>0&&g.phase!=='mulligan')carried=true;
    }
    expect(g.winner).not.toBeNull();expect(carried).toBe(true);expect(replay(g)).toEqual(g);
  });
  it('sala confirma regra, persiste saldo após reinício e mantém configuração na revanche',()=>{
    const folder=mkdtempSync(join(tmpdir(),'wb-energy-'));const path=join(folder,'rooms.sqlite');let r=new Rooms(path);
    try {
      const h=r.create({deck:'Vapor',energyRule:'reserve-v1'},true);
      expect(r.inviteInfo(h.room.code)).toEqual({cardPool:'ves',variant:'escolas-v1',energyRule:'reserve-v1',full:false});
      expect(()=>r.join({deck:'Ilusão',code:h.room.code})).toThrow('regra de energia');
      expect(r.state(h.token).room.waiting).toBe(true);
      const b=r.join({deck:'Ilusão',code:h.room.code,energyRule:'reserve-v1'});const tokens=[h.token,b.token];let seq=0;
      function action(token:string,a:Action){return r.mutate(token,'action',{action:a,revision:r.state(token).revision,requestId:`energy_${++seq}`})}
      for(const token of tokens)action(token,{kind:'mulligan',choice:'keep'});
      const active=r.state(h.token).view!.active,token=tokens[active];
      const source=r.state(token).view!.options.find(o=>o.action.kind==='sacrifice')!;action(token,source.action);
      action(token,{kind:'advance'});const ended=action(token,{kind:'advance'});
      expect(ended.view!.players[active].energy).toBeGreaterThan(0);
      r.close();r=new Rooms(path);expect(r.state(token).view).toEqual(ended.view);
      action(h.token,{kind:'concede'});const record=r.replay(h.token);
      expect(replay({version:record.version,config:record.config,history:record.actions} as Game).config.energyRule).toBe('reserve-v1');
      for(const t of tokens)r.mutate(t,'rematch',{revision:r.state(t).revision,requestId:`rematch_energy_${++seq}`});
      expect(r.state(h.token).view!.energyRule).toBe('reserve-v1');
      expect(r.state(h.token).view!.players.every(p=>p.energy===0)).toBe(true);
    }finally {r.close();for(const suffix of ['','-wal','-shm']){try{unlinkSync(path+suffix)}catch{}}rmdirSync(folder)}
  });
  it('API rejeita regra forjada ou incompatível sem criar sala',()=>{
    const r=new Rooms(':memory:');try {
      expect(()=>r.create({deck:'Pira',energyRule:'forjada'})).toThrow('Regra de energia');
      expect(()=>r.create({deck:'Pira',variant:'base-0.3',energyRule:'reserve-v1'})).toThrow('Escola + Presença');
      expect(r.size).toBe(0);
    }finally{r.close()}
  });
});
