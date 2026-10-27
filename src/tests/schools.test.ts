import {describe,it,expect} from 'vitest';
import {createGame,applyAction,viewFor,castReason,presence,replay,cards,VERSION} from '../engine/engine';
import {chooseBot} from '../engine/bot';
import type {Config,Game,Piece,Seat,Zone} from '../engine/types';

function fixture(variant:Config['variant']='escolas-v1') {
  const g=createGame({seed:501,decks:['Pira','Queimada'],variant,first:0});
  g.phase='main';g.kept=[true,true];
  for(const p of g.players){for(const z of Object.keys(p.zones) as Zone[])p.zones[z]=[];p.energy=20}
  return g;
}
function add(g:Game,card:string,zone:Zone,seat:Seat=0){
  const x:Piece={uid:`school${++g.seq}`,card,damage:0,duration:3,born:0,attacked:false,retreated:false,temp:0,haste:false};
  g.players[seat].zones[zone].push(x);return x;
}
function action(g:Game,kind:'cast'|'sacrifice',x:Piece){return applyAction(g,0,{kind,uid:x.uid,...(kind==='cast'&&cards[x.card].type==='Monstro'?{row:'front' as const}:{})})}
describe('Escola permanente e Presença real — regra v1',()=>{
  it('fonte 2×1 avança Escola antes de expirar, permitindo iniciar o campo com presença zero',()=>{
    let g=fixture();g.players[0].energy=0;
    const source=add(g,'VES-016','hand'),cat=add(g,'VES-047','hand');
    expect(castReason(g,0,cat)).toContain('Energia');
    g=action(g,'sacrifice',source);
    expect(g.players[0]).toMatchObject({energy:2,school:{Sombra:1}});
    expect(presence(g.players[0])).toEqual({});
    expect(g.players[0].zones.ashes).toHaveLength(1);
    expect(castReason(g,0,g.players[0].zones.hand[0])).toBeNull();
    g=action(g,'cast',cat);
    expect(viewFor(g,0).players[0]).toMatchObject({energy:0,school:{Sombra:2},presence:{Sombra:1}});
  });
  it('uma carta não pode usar seu próprio avanço para cumprir o requisito',()=>{
    const g=fixture(),cat=add(g,'VES-047','hand'),before=JSON.stringify(g);
    expect(castReason(g,0,cat)).toContain('Escola insuficiente');
    expect(()=>action(g,'cast',cat)).toThrow();expect(JSON.stringify(g)).toBe(before);
  });
  it('conjurar novamente a mesma carta incrementa Escola; reposicionar não incrementa',()=>{
    let g=fixture();g.players[0].school={Sombra:1};
    const cat=add(g,'VES-047','hand');g=action(g,'cast',cat);
    g=applyAction(g,0,{kind:'move',uid:cat.uid,row:'back'});
    expect(g.players[0].school.Sombra).toBe(2);
    // Fixture de devolução: o mesmo UID retorna à mão; o motor valida a nova conjuração.
    const returned=g.players[0].zones.back.pop()!;g.players[0].zones.hand.push(returned);
    expect(presence(g.players[0]).Sombra??0).toBe(0);
    g=action(g,'cast',cat);expect(g.players[0].school.Sombra).toBe(3);
    expect(presence(g.players[0]).Sombra).toBe(1);
  });
  it('híbrida avança um por escola e fonte ativa não duplica avanço',()=>{
    let g=fixture();const source=add(g,'VES-001','hand');g=action(g,'sacrifice',source);
    expect(g.players[0].school).toEqual({Chama:1,Maré:1});
    const before=structuredClone(g.players[0].school);
    for(let i=0;i<4;i++)g=applyAction(g,g.active,{kind:'advance'});
    expect(g.players[0].school).toEqual(before);
  });
  it('magia avança Escola, mas não fica na Presença',()=>{
    let g=fixture();g.players[0].school={Sombra:2};const spell=add(g,'VES-016','hand');
    g=action(g,'cast',spell);expect(g.players[0].school.Sombra).toBe(3);
    expect(presence(g.players[0])).toEqual({});
  });
  it('Pré­núncio mantém identidade oculta; seu avanço de escola é público por regra',()=>{
    let g=fixture();const trap=add(g,'VES-017','hand');g=action(g,'cast',trap);
    const rival=viewFor(g,1);
    expect(rival.players[0].school.Sombra).toBe(1);
    expect(rival.players[0].veil[0]).toMatchObject({hidden:true});
    expect(JSON.stringify(rival)).not.toContain('Fenda Preparada');
    expect(JSON.stringify(rival.players[0].veil)).not.toContain('VES-017');
    expect(rival.players[0].presence).toEqual({});
  });
  it('condição forte de Presença usa o campo na resolução, independentemente de Escola',()=>{
    const original=structuredClone(cards['VES-016'].fx);
    try{
      cards['VES-016'].fx.cast=[{op:'face',n:5,target:'enemy',presence_min:{Sombra:2}}];
      let g=fixture();g.players[0].school={Sombra:20};const spell=add(g,'VES-016','hand');
      g=action(g,'cast',spell);expect(g.players[1].life).toBe(15);
      g=fixture();g.players[0].school={Sombra:2};add(g,'VES-047','front');add(g,'VES-014','back');
      const second=add(g,'VES-016','hand');g=action(g,'cast',second);expect(g.players[1].life).toBe(10);
      expect(g.players[0].school.Sombra).toBe(3);
    }finally{cards['VES-016'].fx=original}
  });
  it.each(['base-0.3','fontes-estendidas'] as const)('regra antiga %s não acumula Escola',variant=>{
    let g=fixture(variant);const source=add(g,'VES-016','hand');g=action(g,'sacrifice',source);
    expect(g.players[0].school).toEqual({});
  });
  it('replay de partida v0.4 permanece aceito em variantes antigas',()=>{
    const g=createGame({seed:5,decks:['Pira','Queimada'],variant:'base-0.3',first:0});
    g.version='wb-0.4.0/rules-0.3-custom-decks/'+VERSION.split('/').slice(2,4).join('/');
    expect(replay(g).version).toBe(g.version);
    g.config.variant='escolas-v1';expect(()=>replay(g)).toThrow();
  });
  it('bot conclui partidas de Escola com progresso monotônico, conservação e replay idêntico',()=>{
    for(let seed=0;seed<8;seed++){
      let g=createGame({seed:50100+seed,decks:seed%2?['Pira','Queimada']:['Queimada','Pira'],variant:'escolas-v1',first:(seed%2) as Seat});
      let steps=0;
      while(g.winner===null && steps++<2500){
        const s=g.pending?.owner??(g.phase==='mulligan'?(g.kept[0]?1:0):g.active);
        const o=chooseBot(viewFor(g,s));expect(o).not.toBeNull();
        const before=g.players.map(p=>({...p.school}));g=applyAction(g,s,o!.action);
        for(const [i,p] of g.players.entries()){
          for(const [school,n] of Object.entries(before[i]))expect(p.school[school as keyof typeof p.school]??0).toBeGreaterThanOrEqual(n!);
          expect(Object.values(p.zones).reduce((n,z)=>n+z.length,0)).toBe(40);
          expect(p.energy).toBeGreaterThanOrEqual(0);
        }
      }
      expect(g.winner).not.toBeNull();
      expect(viewFor(replay(g),0)).toEqual(viewFor(g,0));
    }
  });
});
