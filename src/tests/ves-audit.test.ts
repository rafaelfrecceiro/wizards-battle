import { describe, it, expect } from "vitest";
import { applyAction, cards, createGame, viewFor, locate, options, has, power, castingCost, validatePool, replay } from "../engine/engine";
import { chooseBot } from "../engine/bot";
import { starterDecks, supportedCards, playableDeck } from "../engine/decks";
import type { Game, Piece, Seat, Zone } from "../engine/types";
import * as legacy from "../engine/legacy/engine-v05";

function fixture() {
  const g = createGame({seed:6001,decks:["Pira","Queimada"],variant:"escolas-v1",first:0});
  g.phase="main";g.kept=[true,true];
  for(const p of g.players){for(const z of Object.keys(p.zones) as Zone[])p.zones[z]=[];
    p.energy=40;p.life=10;p.school={Chama:20,Raiz:20,Sombra:20,Maré:20};}
  return g;
}
function add(g:Game,id:string,zone:Zone,seat:Seat=0,damage=0) {
  const x:Piece={uid:`audit${++g.seq}`,card:id,damage,duration:8,born:0,attacked:false,retreated:false,temp:0,haste:false};
  g.players[seat].zones[zone].push(x);return x;
}
function choose(g:Game, preferred?:string):Game {
  let limit=0;
  while(g.pending){
    if(++limit>100)throw Error("Escolha não terminou");
    const s=g.pending.owner, list=options(g,s);
    const o=list.find(o=>o.action.choice===preferred) ?? chooseBot(viewFor(g,s));
    if(!o)throw Error("Escolha sem opção");g=applyAction(g,s,o.action);
  }return g;
}
function cast(g:Game,x:Piece,s:Seat=0,row?:"front"|"back") {
  return applyAction(g,s,{kind:"cast",uid:x.uid,...(cards[x.card].type==="Monstro"?{row:row??(cards[x.card].support||cards[x.card].keywords.includes("Emboscada")?"back":"front")}:{})});
}
function finishTurn(g:Game,s:Seat) {
  if(g.phase==="main")g=applyAction(g,s,{kind:"advance"});
  return choose(applyAction(g,s,{kind:"advance"}));
}

describe("VES — auditoria individual das 80 cartas pela ação real",()=>{
  it.each(Object.values(cards).filter(c=>c.id.startsWith('VES-')).map(c=>[c.id,c.name] as const))("%s — %s",(id)=>{
    let g=fixture();
    const front=add(g,"VES-012","front",0,2),back=add(g,"VES-002","back",0,1);
    const ef=add(g,"VES-002","front",1),eb=add(g,"VES-003","back",1);
    const source=add(g,"VES-009","sources"),source2=add(g,"VES-009","sources");
    const es=add(g,"VES-009","sources",1),enc=add(g,"VES-033","enchants",1);
    const trap=add(g,"VES-017","veil",1),dead=add(g,"VES-002","discard");
    for(let i=0;i<3;i++)add(g,"VES-011","ashes");
    for(let i=0;i<5;i++)add(g,"VES-011","deck");
    for(let i=0;i<5;i++)add(g,"VES-011","deck",1);
    const top=g.players[0].zones.deck.at(-1)!;
    const c=cards[id], card=add(g,id,"hand");
    const beforeEnergy=g.players[0].energy;
    g=choose(cast(g,card),c.fx.enter?.some(f=>f.op==="scry")?"bottom":["VES-050","VES-069","VES-071"].includes(id)?ef.uid:front.uid);
    const at=(x:Piece)=>locate(g,x.uid)!;
    expect(g.players[0].energy).toBe(beforeEnergy-(c.cost??1));
    expect(g.metrics.casts[id]).toBe(1);
    for(const sc of c.schools)expect(g.players[0].school[sc]).toBe(21);
    expect(at(card).zone).toBe(c.type==="Monstro"?(c.support||c.keywords.includes("Emboscada")?"back":"front"):c.type==="Encantamento"?"enchants":c.type==="Prenúncio"?"veil":"discard");
    if(c.type==="Monstro") {
      for(const k of c.keywords)expect(has(g,0,at(card).x,k)).toBe(true);
      expect(power(g,0,at(card).x)).toBe(c.force);
      expect(viewFor(g,0).players[0][at(card).zone as "front"|"back"].find(x=>x.uid===card.uid)?.health).toBe(c.vigor);
    }
    // Cada efeito impresso tem resultado concreto, além de entrar na zona correta.
    switch(id){
      case "VES-001":expect(at(ef).x.damage).toBe(1);expect(at(source).x.duration).toBe(9);break;
      case "VES-006":expect(at(ef).zone).toBe("discard");break;
      case "VES-008":case "VES-013":expect(at(front).x.damage).toBe(0);break;
      case "VES-016":expect(at(es).x.duration).toBe(6);break;
      case "VES-020":case "VES-021":expect(at(ef).zone).toBe("hand");break;
      case "VES-028":expect(at(es).x.duration).toBe(7);break;
      case "VES-029":case "VES-031":expect(at(ef).x.damage).toBe(2);break;
      case "VES-032":expect(g.players[0].zones.hand).toHaveLength(2);expect(g.players[0].life).toBe(9);break;
      case "VES-042":expect(at(front).x.damage).toBe(0);expect(g.players[0].zones.hand).toHaveLength(1);break;
      case "VES-043":expect(at(dead).zone).toBe("hand");break;
      case "VES-047":expect(g.players[0].zones.hand).toHaveLength(1);break;
      case "VES-050":case "VES-071":expect(g.players[0].zones.ashes).toHaveLength(1);expect(at(ef).x.damage).toBe(2);break;
      case "VES-053":expect(at(enc).zone).toBe("discard");break;
      case "VES-054":expect(g.players[0].zones.ashes).toHaveLength(1);expect(g.players[0].zones.hand).toHaveLength(2);break;
      case "VES-058":expect(g.players[0].zones.deck[0].uid).toBe(top.uid);break;
      case "VES-060":expect(at(back).zone).toBe("hand");break;
      case "VES-061":expect(at(enc).zone).toBe("hand");break;
      case "VES-064":expect(at(source).x.duration).toBe(9);expect(g.players[0].zones.hand).toHaveLength(1);break;
      case "VES-065":expect(at(trap).zone).toBe("ashes");expect(g.log.some(l=>l.text.includes("Fenda Preparada"))).toBe(true);break;
      case "VES-069":expect(at(ef).x.damage).toBe(2);expect(g.players[0].zones.discard.some(x=>x.uid===front.uid||x.uid===back.uid)).toBe(true);break;
      case "VES-070":expect(at(ef).zone).toBe("discard");expect(g.players[0].life).toBe(12);break;
      case "VES-072":expect(g.players[0].zones.ashes).toHaveLength(1);expect(g.players[1].life).toBe(7);break;
      case "VES-074":expect(at(front).x.temp).toBe(1);expect(at(front).x.haste).toBe(true);break;
      case "VES-075":expect(has(g,0,at(card).x,"Guardião")).toBe(true);g.players[0].zones.ashes=[];expect(has(g,0,at(card).x,"Guardião")).toBe(false);break;
      case "VES-076":expect(at(dead).zone).toBe("hand");expect(g.players[0].life).toBe(12);break;
      case "VES-079":expect(g.players[0].known?.[trap.uid]).toBe(trap.card);expect("hidden" in viewFor(g,0).players[1].veil[0]).toBe(false);break;
      case "VES-080":expect(at(eb).zone).toBe("hand");expect(g.players[0].zones.hand).toHaveLength(1);break;
    }
    if(["VES-010","VES-034","VES-040","VES-048"].includes(id)){
      const ally=add(g,id==="VES-040"?"VES-011":id==="VES-048"?"VES-014":"VES-002","front",0,id==="VES-040"?1:0);
      if(id==="VES-010"||id==="VES-040")expect(power(g,0,ally)).toBe(cards[ally.card].force!+1);
      else expect(has(g,0,ally,id==="VES-034"?"Ímpeto":"Alcance")).toBe(true);
    }
    if(id==="VES-030")expect(castingCost(g,0,cards["VES-031"])).toBe(Math.max(1,cards["VES-031"].cost!-1));
    if(id==="VES-052"){
      at(card).x.damage=c.vigor!-1;g.phase="combat";at(card).x.born=0;
      g=choose(applyAction(g,0,{kind:"attack",uid:card.uid,target:ef.uid}));
      expect(at(card).zone).toBe("discard");expect(g.players[0].zones.hand).toHaveLength(1);
    }
    if(["VES-004","VES-033","VES-055","VES-056","VES-078","VES-062"].includes(id)){
      g.players[0].casts=2;g.players[0].deaths=1;g.players[0].moved=true;
      g=finishTurn(g,0);
      if(["VES-004","VES-033","VES-055"].includes(id))expect(g.players[1].life).toBe(9);
      if(id==="VES-056")expect(g.players[0].zones.hand).toHaveLength(1);
      if(id==="VES-078"){expect(g.players[0].life).toBe(12);expect(at(front).x.damage).toBe(0);}
      if(id==="VES-062")expect(g.players[0].stored).toBe(1);
    }
    if(["VES-003","VES-007","VES-019","VES-024","VES-026","VES-041","VES-044","VES-051","VES-063","VES-077"].includes(id)){
      g=finishTurn(g,0);g=finishTurn(g,1);
      if(id==="VES-003")expect(at(front).x.damage).toBe(1);
      if(id==="VES-007")expect(at(back).x.damage).toBe(0);
      if(id==="VES-019")expect(g.log.some(l=>l.text.includes("consultou o topo"))).toBe(true);
      if(id==="VES-024"){expect(g.players[1].life).toBe(9);expect(g.players[0].known?.[trap.uid]).toBe(trap.card);}
      if(id==="VES-026")expect(at(ef).x.damage).toBe(1);
      if(["VES-041","VES-051","VES-063"].includes(id))expect(g.players[0].zones.hand).toHaveLength(2);
      if(id==="VES-044")expect(g.players[0].life).toBe(11);
      if(id==="VES-077"){expect(at(front).x.damage).toBe(1);expect(at(back).x.damage).toBe(0);}
    }
    if(id==="VES-066"){
      g=choose(applyAction(g,0,{kind:"move",uid:back.uid,row:"front"}));
      expect(g.players[0].zones.hand).toHaveLength(1);expect(options(g,0).some(o=>o.action.kind==="move")).toBe(false);
    }
    if(id==="VES-067"){
      const spell=add(g,"VES-064","hand");g=choose(cast(g,spell),source.uid);
      expect(at(source).x.duration).toBe(10);
    }
    if(c.type==="Prenúncio"){
      g.active=1;g.turn=2;g.phase="main";
      if(id==="VES-005")g=choose(cast(g,add(g,"VES-029","hand",1),1));
      if(id==="VES-017")g=choose(applyAction(g,1,{kind:"sacrifice",uid:add(g,"VES-009","hand",1).uid}));
      if(id==="VES-046")g=choose(cast(g,add(g,"VES-032","hand",1),1),front.uid);
      if(id==="VES-057")g=choose(cast(g,add(g,"VES-055","hand",1),1));
      if(["VES-022","VES-035","VES-045","VES-068"].includes(id)){
        g.phase="combat";
        if(id==="VES-035")g.players[0].zones.front=[];
        if(id==="VES-068"){g.players[0].zones.front=[];g.players[1].zones.front[0].card="VES-015";}
        g=choose(applyAction(g,1,{kind:"attack",uid:ef.uid,target:id==="VES-035"?"mage":id==="VES-068"?back.uid:front.uid}));
      }
      expect(at(card).zone).toBe("discard");
      if(id==="VES-005")expect(at(ef).zone).toBe("hand");
      if(id==="VES-017")expect(g.players[1].zones.sources.at(-1)?.duration).toBe(1);
      if(id==="VES-022"){expect(at(ef).zone).toBe("discard");expect(g.log.some(l=>l.text.includes("recebeu 2 de dano"))).toBe(true);}
      if(id==="VES-035")expect(g.players[0].zones.hand).toHaveLength(1);
      if(id==="VES-045")expect(at(front).x.damage).toBe(2); // cura 2 antes de receber 2
      if(id==="VES-046")expect(at(front).x.damage).toBe(0);
      if(id==="VES-057")expect(g.players[1].zones.enchants.some(x=>x.card==="VES-055")).toBe(false);
      if(id==="VES-068"){expect(at(back).zone).toBe("hand");expect(at(back).x.damage).toBe(0);expect(at(ef).x.damage).toBe(0);}
    }
  });
});

describe("VES — fronteiras e interações",()=>{
  it.each(["VES-004","VES-024","VES-033","VES-041","VES-044","VES-047","VES-051","VES-055","VES-056","VES-063","VES-078","VES-080"])("%s — não concede bônus com condição ausente",(id)=>{
    let g=fixture();
    for(let i=0;i<6;i++){add(g,"VES-011","deck");add(g,"VES-011","deck",1);}
    for(let i=0;i<2;i++)add(g,"VES-011","ashes");
    if(id==="VES-051")add(g,"VES-011","ashes");
    const c=cards[id],x=add(g,id,"hand");
    const ally=add(g,"VES-002","back",0,2);
    add(g,"VES-009","sources");
    const foe=add(g,"VES-003","back",1);
    g=choose(cast(g,x),ally.uid);
    if(["VES-047","VES-080"].includes(id))expect(g.players[0].zones.hand).toHaveLength(0);
    if(id==="VES-080")expect(locate(g,foe.uid)?.zone).toBe("hand");
    if(id==="VES-051")for(let i=0;i<4;i++)add(g,"VES-011","hand");
    if(["VES-004","VES-033","VES-055","VES-056","VES-078"].includes(id)){
      g=finishTurn(g,0);expect(g.players[1].life).toBe(10);expect(g.players[0].life).toBe(10);
      expect(locate(g,ally.uid)?.x.damage).toBe(2);expect(g.players[0].zones.hand).toHaveLength(0);
    }
    if(["VES-024","VES-041","VES-044","VES-051","VES-063"].includes(id)){
      g=finishTurn(g,0);g=finishTurn(g,1);
      expect(g.players[1].life).toBe(10);expect(g.players[0].life).toBe(10);
      expect(g.players[0].zones.hand).toHaveLength(id==="VES-051"?5:1);
    }
  });
  it.each(Object.values(cards).filter(c=>c.id.startsWith('VES-')).map(c=>[c.id,c.name] as const))("%s — fonte, energia, requisito e atomicidade",(id)=>{
    let g=fixture();const card=add(g,id,"hand"),c=cards[id];
    g.players[0].energy=0;
    const before=structuredClone(g);
    expect(()=>cast(g,card)).toThrow();expect(g).toEqual(before);
    g=applyAction(g,0,{kind:"sacrifice",uid:card.uid});
    expect(g.players[0].energy).toBe(c.essence.generation);
    expect(locate(g,card.uid)?.zone).toBe(c.essence.duration>1?"sources":"ashes");
    expect(locate(g,card.uid)?.x.duration).toBe(Math.max(0,c.essence.duration-1));
    for(const sc of c.schools)expect(g.players[0].school[sc]).toBe(21);
    const gated=fixture(),next=add(gated,id,"hand");gated.players[0].school={};
    if(c.type!=="Prenúncio"&&Object.values(c.presence).some(n=>n!>0))expect(()=>cast(gated,next)).toThrow();
    else expect(()=>cast(gated,next)).not.toThrow();
  });
  it("habilita 80 identidades e seis listas legais com as capacidades verificadas",()=>{
    expect([...supportedCards].filter(id=>id.startsWith('VES-')).length).toBe(80);expect(starterDecks).toHaveLength(6);expect(()=>validatePool()).not.toThrow();
    for(const d of starterDecks)expect(playableDeck(d)).toEqual({name:d.name,cards:d.cards});
  });
  it("consulta topo é privada, oferece topo/fundo e não escolhe pelo humano",()=>{
    let g=fixture();const top=add(g,"VES-071","deck"),x=add(g,"VES-058","hand");
    g=cast(g,x);expect(g.pending?.owner).toBe(0);
    expect(viewFor(g,0).pending?.title).toContain("Fênix");expect(JSON.stringify(viewFor(g,1))).not.toContain("Fênix");
    g=choose(g,"keep");expect(g.players[0].zones.deck.at(-1)?.uid).toBe(top.uid);
  });
  it("escolher Prenúncio oculto não vaza arte/nome nem pontua sua identidade",()=>{
    let g=fixture();const a=add(g,"VES-017","veil",1),b=add(g,"VES-068","veil",1);
    g=cast(g,add(g,"VES-079","hand"));
    const v=viewFor(g,0);expect(v.options).toHaveLength(2);expect(v.options.every(o=>!o.card)).toBe(true);
    expect(new Set(v.options.map(o=>o.score)).size).toBe(1);
    expect(JSON.stringify(v)).not.toContain("Rota de Escape");
    g=applyAction(g,0,{kind:"choose",choice:b.uid});
    expect(viewFor(g,0).pending?.title).toContain("Rota de Escape");
    expect(JSON.stringify(viewFor(g,1).log)).not.toContain("Rota de Escape");
    expect("hidden" in viewFor(g,0).players[1].veil[0]).toBe(true);
    expect("hidden" in viewFor(g,0).players[1].veil[1]).toBe(false);
    expect(g.players[0].known?.[a.uid]).toBeUndefined();
  });
  it("retorno remove dano/bônus e rejogar o mesmo UID avança Escola novamente",()=>{
    let g=fixture();const x=add(g,"VES-002","front",0,2);x.temp=3;x.haste=true;
    const returner=add(g,"VES-060","hand");g=choose(cast(g,returner),x.uid);
    expect(locate(g,x.uid)?.x).toMatchObject({damage:0,temp:0,haste:false});
    const school=g.players[0].school.Chama!;g=choose(cast(g,locate(g,x.uid)!.x));
    expect(g.players[0].school.Chama).toBe(school+1);
  });
  it("desconto da primeira Magia não acumula, só retaguarda, mínimo 1",()=>{
    let g=fixture();const a=add(g,"VES-030","back");add(g,"VES-030","back");
    const spell=add(g,"VES-006","hand");add(g,"VES-002","front",1);
    expect(castingCost(g,0,cards[spell.card])).toBe(Math.max(1,cards[spell.card].cost!-1));
    const before=g.players[0].energy;g=choose(cast(g,spell));
    expect(g.players[0].energy).toBe(before-Math.max(1,cards[spell.card].cost!-1));
    expect(castingCost(g,0,cards["VES-006"])).toBe(cards["VES-006"].cost);
    g.players[0].magic={};g.players[0].zones.back=[];g.players[0].zones.front=[a];
    expect(castingCost(g,0,cards["VES-006"])).toBe(cards["VES-006"].cost);
  });
  it("bônus de Ímpeto/Força expira no encerramento",()=>{
    let g=fixture();const x=add(g,"VES-002","front");x.born=g.turn;
    g=choose(cast(g,add(g,"VES-074","hand")),x.uid);
    expect(has(g,0,locate(g,x.uid)!.x,"Ímpeto")).toBe(true);g=finishTurn(g,0);
    expect(locate(g,x.uid)?.x).toMatchObject({temp:0,haste:false});
  });
  it("capacidade desconhecida falha fechada",()=>{
    const fx=cards["VES-058"].fx.enter!;const saved=fx[0].op;
    try{fx[0].op="not-implemented";expect(()=>validatePool()).toThrow("Capacidade ausente");}finally{fx[0].op=saved;}
  });
  it("cura 'até' oferece zero e quantidades intermediárias para preservar ferimento",()=>{
    let g=fixture();const x=add(g,"VES-012","front",0,3),spell=add(g,"VES-013","hand");
    g=cast(g,spell);expect(g.pending?.job.fx.op).toBe("$heal_amount");
    expect(g.pending?.choices.map(c=>c.id)).toEqual(["0","1","2"]);
    g=choose(g,"1");expect(locate(g,x.uid)?.x.damage).toBe(2);
  });
  it("Pacto permite recusar inspeção sem cancelar seu dano por Cinzas",()=>{
    let g=fixture();add(g,"VES-024","enchants");add(g,"VES-017","veil",1);
    for(let i=0;i<3;i++)add(g,"VES-011","ashes");
    for(let i=0;i<3;i++){add(g,"VES-011","deck");add(g,"VES-011","deck",1);}
    g=finishTurn(g,0);g=applyAction(g,1,{kind:"advance"});g=applyAction(g,1,{kind:"advance"});
    expect(g.pending?.choices.some(c=>c.id==="skip")).toBe(true);
    g=choose(g,"skip");expect(g.players[0].known).toBeUndefined();expect(g.players[1].life).toBe(9);
  });
  it("dissipar apaga o conhecimento privado e não dispara o Prenúncio",()=>{
    let g=fixture();const trap=add(g,"VES-022","veil",1);g.players[0].known={[trap.uid]:trap.card};
    g=choose(cast(g,add(g,"VES-065","hand")));
    expect(g.players[0].known?.[trap.uid]).toBeUndefined();expect(locate(g,trap.uid)?.zone).toBe("ashes");
    expect(g.log.some(l=>l.text.includes("revelou Retorno"))).toBe(false);
  });
  it("energia guardada não acumula com dois suportes e pode ser recusada",()=>{
    let g=fixture();add(g,"VES-062","back");add(g,"VES-062","back");
    add(g,"VES-011","deck",1);add(g,"VES-011","deck");
    g=applyAction(g,0,{kind:"advance"});g=applyAction(g,0,{kind:"advance"});
    expect(g.pending?.choices.map(c=>c.id)).toEqual(["store","skip"]);
    const skipped=choose(g,"skip");expect(skipped.players[0].stored).toBe(0);
    g=choose(g,"store");expect(g.players[0].stored).toBe(1);expect(g.players[0].energy).toBe(0);
    g=finishTurn(g,1);expect(g.players[0].energy).toBe(1);expect(g.players[0].stored).toBe(0);
  });
  it("replays 0.5 conservam o motor anterior em duelos completos",()=>{
    let g=legacy.createGame({seed:606,decks:["Pira","Queimada"],variant:"escolas-v1",first:0});
    for(let i=0;i<2500&&g.winner===null;i++){
      const s=g.pending?.owner??(g.phase==="mulligan"?(g.kept[0]?1:0):g.active);
      const o=chooseBot(legacy.viewFor(g,s));if(!o)throw Error("Bot legado sem opção");g=legacy.applyAction(g,s,o.action);
    }
    expect(g.winner).not.toBeNull();expect(replay(g)).toEqual(g);
  });
});
