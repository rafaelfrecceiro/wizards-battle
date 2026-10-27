import {describe,it,expect} from "vitest";
import {createGame,applyAction,viewFor} from "../engine/engine";
import type {Game,Piece,Zone} from "../engine/types";
import {initialStudy,studySacrifice,studyDawn,studyPresence,studyTrace} from "../research/presence-study";
function fixture(variant:"base-0.3"|"fontes-estendidas") {
  const game=createGame({seed:777,decks:["Pira","Queimada"],variant,first:0});
  game.phase="main";game.kept=[true,true];
  for(const player of game.players)for(const zone of Object.keys(player.zones) as Zone[])player.zones[zone]=[];
  const add=(id:string,zone:Zone,seat:0|1=0)=>{
    const piece:Piece={uid:`study${++game.seq}`,card:id,damage:0,duration:0,born:0,attacked:false,retreated:false,temp:0,haste:false};
    game.players[seat].zones[zone].push(piece);return piece;
  };
  const eco=add("VES-004","hand"),silence=add("VES-016","hand"),catadora=add("VES-047","hand");
  for(const seat of [0,1] as const)for(let i=0;i<12;i++)add("VES-002","deck",seat);
  return {game,eco,silence,catadora};
}
function cycle(before:Game){let game=before;for(let i=0;i<4;i++)game=applyAction(game,game.active,{kind:"advance"});return game;}
describe("Presença — reprodução e modelo de proposta, sem alterar partidas",()=>{
  it.each(["base-0.3","fontes-estendidas"] as const)("modelo reproduz o motor real em %s",variant=>{
    const {game:initial,eco,silence,catadora}=fixture(variant);
    let game=applyAction(initial,0,{kind:"sacrifice",uid:eco.uid});
    const expected=studyTrace(variant==="base-0.3"?"base":"extended",true);
    const compare=(step:number)=>{
      const player=viewFor(game,0).players[0];
      const snapshot=expected[step];
      expect({energy:player.energy,shadow:player.presence.Sombra??0,sources:player.sources.length,ashes:player.ashes.length,monsters:player.front.length+player.back.length})
       .toEqual({energy:snapshot.energy,shadow:snapshot.shadow,sources:snapshot.sources,ashes:snapshot.ashes,monsters:snapshot.monsters});
      expect(viewFor(game,0).options.some(o=>o.action.kind==="cast"&&o.uid===catadora.uid)).toBe(snapshot.canCastCatadora);
    };
    compare(0);game=cycle(game);compare(1);
    game=applyAction(game,0,{kind:"sacrifice",uid:silence.uid});compare(2);
    if(expected[2].canCastCatadora)game=applyAction(game,0,{kind:"cast",uid:catadora.uid,row:"front"});
    compare(3);game=cycle(game);compare(4);
  });
  it("base reproduz 2 e depois 4 de energia, sempre zero presença, nas etapas das capturas",()=>{
    const frames=studyTrace("base",false);
    expect(frames[1]).toMatchObject({energy:2,shadow:0,ashes:1,canCastCatadora:false});
    expect(frames[2]).toMatchObject({energy:4,shadow:0,ashes:2,canCastCatadora:false});
  });
  it("vínculos mantêm energia e timing de Cinzas da base sem duplicar fonte ativa",()=>{
    const base=studyTrace("base",false),links=studyTrace("links",false);
    expect(links.map(x=>[x.energy,x.ashes,x.sources])).toEqual(base.map(x=>[x.energy,x.ashes,x.sources]));
    expect(links[0].shadow).toBe(1);expect(links[1].shadow).toBe(1);expect(links[2].shadow).toBe(2);
    expect(links[1].canCastCatadora).toBe(true);expect(links[4].shadow).toBe(2);expect(links[4].energy).toBe(0);
  });
  it("cada escola recebe um vínculo, não o valor impresso do requisito",()=>{
    const shadow=studySacrifice(initialStudy("links"),"VES-016");
    expect(studyPresence(shadow).Sombra).toBe(1);
    const hybrid=studySacrifice(initialStudy("links"),"VES-001");
    expect(studyPresence(hybrid)).toEqual({Chama:1,Maré:1});
    const expired=studyDawn(hybrid);
    expect(studyPresence(expired)).toEqual({Chama:1,Maré:1});
  });
  it("duração estendida adia o problema e altera energia total/Cinzas; não equivale a vínculos",()=>{
    const extended=studyTrace("extended",false),links=studyTrace("links",false);
    expect(extended[2]).toMatchObject({energy:4,shadow:2,ashes:0,sources:2});
    expect(extended[4]).toMatchObject({energy:4,shadow:0,ashes:2});
    expect(links[4]).toMatchObject({energy:0,shadow:2,ashes:2});
  });
});
