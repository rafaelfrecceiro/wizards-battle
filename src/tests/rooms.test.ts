import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Rooms } from '../server/rooms';
import { chooseBot } from '../engine/bot';
import { applyAction, createGame, replay, viewFor, VES_VERSION } from '../engine/engine';
import * as historical from '../engine/legacy/engine-v07';
import { dropOptions } from '../web/interaction';
import type { Action, Game } from '../engine/types';
const open: Rooms[] = [];
const store = (path = ':memory:') => { const r = new Rooms(path); open.push(r); return r; };
afterEach(() => { for (const r of open.splice(0)) r.close(); });
function pair(r: Rooms) {
  const host = r.create({deck:'Vapor'}, true);
  const guest = r.join({code:host.room.code, deck:'Ilusão'});
  return [host.token, guest.token] as const;
}
let seq = 0;
function act(r: Rooms, token: string, action: Action, requestId = `request_${++seq}`) {
  return r.mutate(token, 'action', {action, requestId, revision:r.state(token).revision});
}
describe('Salas autoritativas e persistentes', () => {
  it('replay da VES 0.6 conserva versão, estado e histórico na aplicação 0.7',()=>{
    let g=historical.createGame({seed:606,decks:['Pira','Queimada'],variant:'escolas-v1',first:0});
    for(let i=0;i<40 && g.winner===null;i++)for(const seat of [0,1] as const){const o=chooseBot(historical.viewFor(g,seat));if(o){g=historical.applyAction(g,seat,o.action);break}}
    g.version=VES_VERSION;expect(replay(g)).toEqual(g);
  });
  it('aguarda convite sem gerar seed ou mão; reserva um único assento e filtra ambos os lados', () => {
    const r = store(), h = r.create({deck:'Pira'}, true);
    expect(h.view).toBeNull(); expect(h.room.waiting).toBe(true);
    expect(() => act(r,h.token,{kind:'advance'})).toThrow('Aguardando');
    const g = r.join({code:h.room.code!.toLowerCase(),deck:'Estações'});
    for (const [seat, token] of [h.token,g.token].entries()) {
      const state = r.state(token), v = state.view!;
      expect(v.seat).toBe(seat); expect(v.players[seat].hand).toHaveLength(7);
      expect(v.players[1-seat].hand).toHaveLength(0);
      expect(JSON.stringify(state)).not.toContain('credentials');
      expect(state).not.toHaveProperty('config'); expect(state).not.toHaveProperty('seed');
      expect(v.players[1-seat].name).toBe('Amigo');
    }
    expect(() => r.join({code:h.room.code,deck:'Pira'})).toThrow('dois jogadores');
    expect(() => r.state(h.room.code!)).toThrow('Mesa não encontrada');
    expect(() => r.mutate(g.token,'bot',{requestId:'bot_12345',revision:1})).toThrow('pessoas');
    expect(() => r.replay(h.token)).toThrow('informações ocultas');
  });
  it('repete criação/entrada com a mesma chave sem abandonar assentos', () => {
    const r=store(), body={deck:'Pira',accessKey:'a'.repeat(48)};
    const a=r.create(body,true), b=r.create(body,true);
    expect(a).toEqual(b); expect(r.size).toBe(1);
    const joinBody={deck:'Vapor',code:a.room.code,accessKey:'b'.repeat(48)};
    expect(r.join(joinBody)).toEqual(r.join(joinBody));
  });
  it('rejeita chave forjada, deck ilegal, convite inexistente e variante inválida sem criar mesa', () => {
    const r=store();
    for (const body of [{deck:'falso'},{deck:'Pira',variant:'falsa'},{deck:'Pira',accessKey:'abc'},{customDeck:{name:'Fraude',cards:[]}}]) expect(()=>r.create(body,true)).toThrow();
    expect(()=>r.join({code:'x',deck:'Pira'})).toThrow('Convite'); expect(r.size).toBe(0);
  });
  it('deduplica jogadas e bloqueia estado antigo, ID reutilizado e ações inválidas atomicamente', () => {
    const r=store(), [a,b]=pair(r), before=r.state(a);
    const request={action:{kind:'mulligan',choice:'keep'},requestId:'unique_action_1',revision:before.revision};
    const done=r.mutate(a,'action',request);
    expect(r.mutate(a,'action',request)).toEqual(done);
    expect(()=>r.mutate(a,'action',{...request,action:{kind:'advance'}})).toThrow('Identificador já usado');
    expect(()=>r.mutate(b,'action',{...request,requestId:'unique_action_2'})).toThrow('mesa mudou');
    expect(()=>r.mutate(b,'action',{action:{kind:'advance'}})).toThrow('Identificador');
    const stable=r.state(b);
    expect(()=>act(r,b,{kind:'cast',uid:'fake'})).toThrow('inválida');
    expect(r.state(b).view).toEqual(stable.view); expect(r.state(b).revision).toBe(stable.revision);
  });
  it('persiste convite, dois assentos, revisão, segredo, escolhas e recibos após reabrir SQLite', () => {
    const folder=mkdtempSync(join(tmpdir(),'wb-rooms-')), file=join(folder,'rooms.sqlite');
    let r=new Rooms(file);
    try {
      const host=r.create({deck:'Pira'},true); r.close(); r=new Rooms(file);
      const guest=r.join({code:host.room.code,deck:'Vapor'});
      const body={action:{kind:'mulligan',choice:'keep'},revision:r.state(guest.token).revision,requestId:'persist_request'};
      r.mutate(guest.token,'action',body); const state=r.state(guest.token);
      r.close();r=new Rooms(file);
      expect(r.state(guest.token).view).toEqual(state.view);
      expect(r.mutate(guest.token,'action',body).revision).toBe(state.revision);
      expect(r.state(host.token).room.opponentOnline).toBe(true);
    } finally {r.close();for(const suffix of ['','-wal','-shm']) {try{unlinkSync(file+suffix)}catch{}} rmdirSync(folder);}
  });
  it('concessão fora do turno, replay e revanche exigem os dois e alternam primeiro jogador', () => {
    const r=store(), [a,b]=pair(r);act(r,b,{kind:'concede'});
    expect(r.state(a).view!.winner).toBe(0);
    const record=r.replay(a), game=replay({version:record.version,config:record.config,history:record.actions} as Game);
    expect(game.winner).toBe(0);
    const oldFirst=record.config.first;
    r.mutate(a,'rematch',{requestId:'rematch_host_1',revision:r.state(a).revision});
    expect(r.state(b).view!.winner).toBe(0);
    r.mutate(b,'rematch',{requestId:'rematch_guest_1',revision:r.state(b).revision});
    expect(r.state(a).room.round).toBe(2); expect(r.state(a).view!.winner).toBeNull();
    act(r,a,{kind:'concede'}); expect(r.replay(a).config.first).toBe(1-oldFirst);
    expect(()=>act(r,b,{kind:'concede'})).toThrow();
  });
  it('solo também retoma, mantém API anterior e bot autorizado',()=>{
    const r=store(), a=r.create({deck:'Pira'});
    expect(a.room.mode).toBe('solo');
    expect(r.mutate(a.token,'action',{action:{kind:'mulligan',choice:'keep'}}).view).not.toBeNull();
    expect(r.mutate(a.token,'bot',{}).played).toBe(true);
  });
  it('segundo assento usa destinos próprios em fontes, fileiras, magia e ataque ao rival',()=>{
    const cases: [Action,string,string][]=[
      [{kind:'sacrifice',uid:'x'},'1:sources','Monstro'],[{kind:'cast',uid:'x',row:'back'},'1:back','Monstro'],
      [{kind:'move',uid:'x',row:'front'},'1:front','Monstro'],[{kind:'attack',uid:'x',target:'mage'},'0:mage','Monstro'],
      [{kind:'cast',uid:'x'},'1:veil','Prenúncio'],[{kind:'cast',uid:'x'},'1:enchants','Encantamento'],[{kind:'cast',uid:'x'},'1:cast','Magia']];
    for(const [action,dest,type] of cases) {
      const option={id:'a',label:'a',group:'Conjurar',score:0,uid:'x',action};
      expect(dropOptions([option],'x',dest,type,1)).toHaveLength(1);
      expect(dropOptions([option],'x',dest.replace(/^1:/,'0:').replace(/^0:mage/,'1:mage'),type,1)).toHaveLength(0);
    }
  });
  it.each([['Pira','Queimada'],['Vapor','Ilusão'],['Estações','Decomposição']])('duelo humano completo %s × %s com privacidade e replay', (deck, opponent)=>{
    const r=store(), a=r.create({deck},true), b=r.join({deck:opponent,code:a.room.code}), tokens=[a.token,b.token];
    let steps=0;
    while(r.state(a.token).view!.winner===null && steps++<2500) {
      let played=false;
      for(const token of tokens) {
        const state=r.state(token), v=state.view!, option=chooseBot(v);
        expect(v.players[1-v.seat].hand).toHaveLength(0);
        if(option) {act(r,token,option.action);played=true;break;}
      }
      expect(played).toBe(true);
    }
    expect(r.state(a.token).view!.winner).not.toBeNull();
    const rec=r.replay(a.token), result=replay({version:rec.version,config:rec.config,history:rec.actions} as Game);
    expect(result.winner).toBe(r.state(a.token).view!.winner);
    expect(result.history).toEqual(rec.actions);
  });
});
