import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import identity from "../data/identity.json";
import {
  applyAction,
  cards,
  createGame,
  def,
  locate,
  options,
  presence,
  replay,
  validatePool,
  viewFor,
} from "../engine/engine";
import { chooseBot } from "../engine/bot";
import type { Game, Piece, Seat, Zone } from "../engine/types";
import { dropOptions } from "../web/interaction";
function ready(variant: "base-0.3" | "fontes-estendidas" = "base-0.3") {
  let g = createGame({
    seed: 1122,
    decks: ["Queimada", "Pira"],
    variant,
    first: 0,
  });
  g = applyAction(g, 0, { kind: "mulligan", choice: "keep" });
  g = applyAction(g, 1, { kind: "mulligan", choice: "keep" });
  return g;
}
function add(g: Game, s: Seat, id: string, zone: Zone): Piece {
  const x = {
    uid: `test${++g.seq}`,
    card: id,
    damage: 0,
    duration: 3,
    born: 0,
    attacked: false,
    retreated: false,
    temp: 0,
    haste: false,
  };
  g.players[s].zones[zone].push(x);
  return x;
}
function fixture() {
  const g = ready();
  for (const p of g.players) {
    for (const z of Object.keys(p.zones) as Zone[]) p.zones[z] = [];
    p.energy = 20;
  }
  return g;
}
function perform(
  g: Game,
  s: Seat,
  kind: string,
  uid?: string,
  target?: string,
) {
  const o = options(g, s).find(
    (o) =>
      o.action.kind === kind &&
      (!uid || o.uid === uid) &&
      (!target || o.target === target),
  );
  if (!o) throw Error(`Ação ausente ${kind}/${uid}/${target}`);
  return applyAction(g, s, o.action);
}
function finishChoices(g: Game) {
  let n = 0;
  while (g.pending) {
    if (++n > 50) throw Error("Laço");
    const o = chooseBot(viewFor(g, g.pending.owner))!;
    g = applyAction(g, g.pending.owner, o.action);
  }
  return g;
}
describe("Regras e custos", () => {
  it("fixa os snapshots de cartas e decks usados pelos replays", () => {
    for (const [file, expected] of [
      ["cartas.json", identity.cardsSha256],
      ["baralhos.json", identity.decksSha256],
    ]) {
      const data = readFileSync(new URL(`../data/${file}`, import.meta.url));
      expect(createHash("sha256").update(data).digest("hex")).toBe(expected);
    }
  });
  it("habilita os seis decks e reconhece suas capacidades", () => {
    expect(() => validatePool()).not.toThrow();
    expect(() =>
      createGame({
        seed: 1,
        decks: ["Vapor", "Pira"],
        variant: "base-0.3",
        first: 0,
      }),
    ).not.toThrow();
  });
  it("troca a mão apenas uma vez e compra inicial para ambos", () => {
    let g = createGame({
      seed: 1,
      decks: ["Pira", "Queimada"],
      variant: "base-0.3",
      first: 0,
    });
    g = applyAction(g, 0, { kind: "mulligan", choice: "redraw" });
    expect(options(g, 0).some((o) => o.action.choice === "redraw")).toBe(false);
    g = applyAction(g, 0, { kind: "mulligan", choice: "keep" });
    g = applyAction(g, 1, { kind: "mulligan", choice: "keep" });
    expect(g.players[0].zones.hand).toHaveLength(8);
  });
  it("recusa jogada inválida sem alterar o estado", () => {
    const g = ready();
    const before = JSON.stringify(g);
    expect(() => applyAction(g, 1, { kind: "advance" })).toThrow();
    expect(JSON.stringify(g)).toBe(before);
  });
  it("fonte duração 1 gera e vira Cinza sem presença na base", () => {
    let g = fixture();
    const x = add(g, 0, "VES-002", "hand");
    expect(cards[x.card].essence.duration).toBe(1);
    g = perform(g, 0, "sacrifice", x.uid);
    expect(g.players[0].energy).toBe(22);
    expect(g.players[0].zones.ashes.some((a) => a.uid === x.uid)).toBe(true);
    expect(presence(g.players[0]).Chama ?? 0).toBe(0);
  });
  it("variante conserva presença e marcador no sacrifício", () => {
    let g = fixture();
    g.config.variant = "fontes-estendidas";
    const x = add(g, 0, "VES-002", "hand");
    g = perform(g, 0, "sacrifice", x.uid);
    expect(g.players[0].zones.sources[0].duration).toBe(1);
    expect(presence(g.players[0]).Chama).toBe(1);
  });
  it("fonte 2×3 entra com 2 marcadores na base, só um sacrifício por turno", () => {
    let g = fixture();
    const x = add(g, 0, "VES-009", "hand");
    add(g, 0, "VES-009", "hand");
    g = perform(g, 0, "sacrifice", x.uid);
    expect(locate(g, x.uid)?.x.duration).toBe(2);
    expect(options(g, 0).some((o) => o.action.kind === "sacrifice")).toBe(
      false,
    );
  });
  it("monstros e encantamentos contam e requisito não é gasto", () => {
    let g = fixture();
    add(g, 0, "VES-002", "front");
    add(g, 0, "VES-034", "enchants");
    const x = add(g, 0, "VES-002", "hand");
    expect(presence(g.players[0]).Chama).toBe(2);
    g = perform(g, 0, "cast", x.uid);
    expect(presence(g.players[0]).Chama).toBe(3);
  });
  it("híbrida conta nas duas escolas e Véu não conta", () => {
    const g = fixture();
    add(g, 0, "VES-069", "back");
    add(g, 0, "VES-022", "veil");
    expect(presence(g.players[0])).toEqual({ Chama: 1, Raiz: 1 });
  });
  it("explica falta de presença e permite armar sem presença", () => {
    const g = fixture();
    const x = add(g, 0, "VES-002", "hand");
    add(g, 0, "VES-022", "hand");
    expect(
      viewFor(g, 0).blocked.find((b) => b.uid === x.uid)?.reason,
    ).toContain("Presença");
    expect(
      options(g, 0).some(
        (o) => o.action.kind === "cast" && o.card === "VES-022",
      ),
    ).toBe(true);
  });
  it("Emboscada entra atrás e pode avançar sem energia uma vez", () => {
    let g = fixture();
    for (let i = 0; i < 3; i++) add(g, 0, "VES-011", "front");
    const x = add(g, 0, "VES-037", "hand");
    const rows = options(g, 0).filter(
      (o) => o.uid === x.uid && o.action.kind === "cast",
    );
    expect(rows.every((o) => o.action.row === "back")).toBe(true);
    g = perform(g, 0, "cast", x.uid);
    g.players[0].zones.front = [];
    g.players[0].energy = 0;
    g = perform(g, 0, "move", x.uid);
    expect(locate(g, x.uid)?.zone).toBe("front");
    expect(g.players[0].moved).toBe(true);
    expect(g.players[0].energy).toBe(0);
  });
});
describe("Combate e gatilhos", () => {
  it("bot mantém atacante comum na frente quando recuar não ajuda", () => {
    const g = fixture();
    g.players[0].sacrificed = true;
    add(g, 0, "VES-036", "front");
    const action = chooseBot(viewFor(g, 0));
    expect(action?.action.kind).toBe("advance");
  });
  it("Guardião obriga Alcance a atacar o Guardião", () => {
    const g = fixture();
    g.phase = "combat";
    const a = add(g, 0, "VES-027", "front"),
      guard = add(g, 1, "VES-012", "front");
    add(g, 1, "VES-004", "back");
    const attacks = options(g, 0).filter((o) => o.uid === a.uid);
    expect(attacks.map((o) => o.target)).toEqual([guard.uid]);
  });
  it("frente vazia oferece mago e ataque a fonte com -2 duração", () => {
    let g = fixture();
    g.phase = "combat";
    const a = add(g, 0, "VES-002", "front"),
      src = add(g, 1, "VES-009", "sources");
    expect(
      options(g, 0)
        .filter((o) => o.uid === a.uid)
        .map((o) => o.target),
    ).toEqual(["mage", src.uid]);
    g = perform(g, 0, "attack", a.uid, src.uid);
    expect(locate(g, src.uid)?.x.duration).toBe(1);
    expect(g.players[0].zones.front[0].damage).toBe(0);
  });
  it("dano é simultâneo e morte dos dois reduz presença", () => {
    let g = fixture();
    g.phase = "combat";
    const a = add(g, 0, "VES-002", "front"),
      b = add(g, 1, "VES-002", "front");
    a.damage = 1;
    b.damage = 1;
    g = perform(g, 0, "attack", a.uid, b.uid);
    expect(g.players.every((p) => p.zones.front.length === 0)).toBe(true);
    expect(g.players.every((p) => p.zones.discard.length === 1)).toBe(true);
  });
  it("Ímpeto ataca ao entrar, monstro comum espera", () => {
    const g = fixture();
    g.phase = "combat";
    const a = add(g, 0, "VES-009", "front"),
      b = add(g, 0, "VES-002", "front");
    a.born = g.turn;
    b.born = g.turn;
    expect(options(g, 0).some((o) => o.uid === a.uid)).toBe(true);
    expect(options(g, 0).some((o) => o.uid === b.uid)).toBe(false);
  });
  it("Prenúncio mata atacante antes do dano e não vaza antes de revelar", () => {
    let g = fixture();
    g.phase = "combat";
    const a = add(g, 0, "VES-009", "front");
    add(g, 1, "VES-022", "veil");
    expect(JSON.stringify(viewFor(g, 0).players[1].veil)).not.toContain(
      "VES-022",
    );
    g = perform(g, 0, "attack", a.uid, "mage");
    expect(locate(g, a.uid)?.zone).toBe("discard");
    expect(g.players[1].life).toBe(15);
    expect(g.log.some((l) => l.text.includes("revelou Retorno da Chama"))).toBe(
      true,
    );
  });
  it("Prenúncio não dispara no turno do dono", () => {
    let g = fixture();
    const t = add(g, 0, "VES-017", "veil"),
      x = add(g, 0, "VES-009", "hand");
    g = perform(g, 0, "sacrifice", x.uid);
    expect(locate(g, t.uid)?.zone).toBe("veil");
  });
  it("Fenda Preparada reduz a fonte do sacrifício rival", () => {
    let g = fixture();
    add(g, 1, "VES-017", "veil");
    const x = add(g, 0, "VES-009", "hand");
    g = perform(g, 0, "sacrifice", x.uid);
    expect(locate(g, x.uid)?.x.duration).toBe(1);
  });
  it("suporte de Ivo cura somente se estiver atrás", () => {
    let g = fixture();
    const a = add(g, 1, "VES-002", "front");
    a.damage = 2;
    add(g, 1, "VES-003", "back");
    g = perform(g, 0, "advance");
    g = perform(g, 0, "advance");
    g = finishChoices(g);
    expect(locate(g, a.uid)?.x.damage).toBe(1);
    expect(g.active).toBe(1);
  });
  it("faixa de suporte fica inativa na frente", () => {
    let g = fixture();
    const a = add(g, 1, "VES-002", "front");
    a.damage = 2;
    add(g, 1, "VES-003", "front");
    g = perform(g, 0, "advance");
    g = perform(g, 0, "advance");
    expect(locate(g, a.uid)?.x.damage).toBe(2);
  });
  it("dano persiste entre turnos", () => {
    let g = fixture();
    const a = add(g, 0, "VES-002", "front");
    a.damage = 1;
    g = perform(g, 0, "advance");
    g = perform(g, 0, "advance");
    expect(locate(g, a.uid)?.x.damage).toBe(1);
  });
});
describe("Escolhas, informação e reprodução", () => {
  it("dono escolhe entre gatilhos de início e resolve a habilidade escolhida primeiro", () => {
    let g = fixture();
    g.players[1].life = 10;
    add(g, 1, "VES-002", "deck");
    add(g, 1, "VES-002", "front");
    const heal = add(g, 1, "VES-044", "enchants");
    const support = add(g, 1, "VES-003", "back");
    g = perform(g, 0, "advance");
    g = perform(g, 0, "advance");
    expect(g.pending?.job.fx.op).toBe("$order");
    expect(g.pending?.owner).toBe(1);
    expect(viewFor(g, 0).options).toHaveLength(0);
    expect(viewFor(g, 1).pending?.kind).toBe("order");
    g = applyAction(g, 1, { kind: "choose", choice: heal.uid });
    expect(g.players[1].life).toBe(11);
    expect(
      g.log.filter((l) => l.text.startsWith("Resolve agora:")).at(-2)?.text,
    ).toContain("Horto");
    expect(g.log.at(-1)?.text).toContain("Ivo");
    expect(g.phase).toBe("main");
  });
  it("gatilhos de encerramento respeitam ordem escolhida e não repetem", () => {
    let g = fixture();
    g.players[0].casts = 2;
    g.players[0].deaths = 1;
    add(g, 1, "VES-002", "deck");
    const a = add(g, 0, "VES-033", "enchants"),
      b = add(g, 0, "VES-055", "enchants");
    g = perform(g, 0, "advance");
    g = perform(g, 0, "advance");
    expect(g.pending?.job.triggers?.map((t) => t.id)).toEqual([a.uid, b.uid]);
    const before = JSON.stringify(g);
    expect(() =>
      applyAction(g, 0, { kind: "choose", choice: "fake" }),
    ).toThrow();
    expect(JSON.stringify(g)).toBe(before);
    g = applyAction(g, 0, { kind: "choose", choice: b.uid });
    expect(g.players[1].life).toBe(13);
    expect(
      g.log
        .filter((l) => l.text.startsWith("Resolve agora:"))
        .map((l) => l.text),
    ).toEqual([
      "Resolve agora: Vigília dos Ausentes.",
      "Resolve agora: Ritmo das Fornalhas.",
    ]);
  });
  it("agrupa Prenúncios diferentes que disparam no mesmo ataque e resolve antes do dano", () => {
    let g = fixture();
    g.phase = "combat";
    const attacker = add(g, 0, "VES-009", "front");
    add(g, 1, "VES-002", "deck");
    const a = add(g, 1, "VES-022", "veil"),
      b = add(g, 1, "VES-035", "veil");
    const before = viewFor(g, 0);
    expect(JSON.stringify(before.players[1].veil)).not.toContain("VES-");
    g = perform(g, 0, "attack", attacker.uid, "mage");
    expect(g.pending?.owner).toBe(1);
    expect(g.pending?.job.triggers).toHaveLength(2);
    expect(g.players[1].zones.veil).toHaveLength(0);
    expect(viewFor(g, 0).pending?.title).toBe("O rival está escolhendo…");
    g = applyAction(g, 1, { kind: "choose", choice: b.uid });
    expect(locate(g, attacker.uid)?.zone).toBe("discard");
    expect(g.players[1].life).toBe(15);
    expect(g.players[1].zones.discard.map((x) => x.uid)).toContain(a.uid);
  });
  it("não oferece ordem para uma única habilidade ou gatilhos sem condição", () => {
    let g = fixture();
    g.players[0].casts = 0;
    add(g, 0, "VES-033", "enchants");
    add(g, 0, "VES-055", "enchants");
    add(g, 1, "VES-002", "deck");
    g = perform(g, 0, "advance");
    g = perform(g, 0, "advance");
    expect(g.pending).toBeNull();
    expect(g.players[1].life).toBe(15);
  });
  it("arrastar usa somente destinos autorizados e separa magia de sacrifício", () => {
    const g = fixture();
    add(g, 0, "VES-002", "front");
    add(g, 0, "VES-002", "back");
    const x = add(g, 0, "VES-006", "hand");
    const opts = options(g, 0);
    expect(dropOptions(opts, x.uid, "0:cast", "Magia")[0].action.kind).toBe(
      "cast",
    );
    expect(dropOptions(opts, x.uid, "0:sources", "Magia")[0].action.kind).toBe(
      "sacrifice",
    );
    expect(dropOptions(opts, x.uid, "1:front", "Magia")).toHaveLength(0);
    expect(dropOptions(opts, x.uid, "0:front", "Magia")).toHaveLength(0);
  });
  it("arrastar monstro respeita fileiras cheias e alvo protegido por Guardião", () => {
    const g = fixture();
    for (let n = 0; n < 3; n++) add(g, 0, "VES-002", "front");
    const x = add(g, 0, "VES-002", "hand");
    expect(
      dropOptions(options(g, 0), x.uid, "0:front", "Monstro"),
    ).toHaveLength(0);
    expect(dropOptions(options(g, 0), x.uid, "0:back", "Monstro")).toHaveLength(
      1,
    );
    g.phase = "combat";
    const attacker = g.players[0].zones.front[0];
    const guard = add(g, 1, "VES-012", "front"),
      other = add(g, 1, "VES-002", "front");
    expect(
      dropOptions(options(g, 0), attacker.uid, `piece:${guard.uid}`, "Monstro"),
    ).toHaveLength(1);
    expect(
      dropOptions(options(g, 0), attacker.uid, `piece:${other.uid}`, "Monstro"),
    ).toHaveLength(0);
  });
  it("resolve a compra independente mesmo sem alvo para curar", () => {
    let g = fixture();
    add(g, 0, "VES-007", "enchants");
    const spell = add(g, 0, "VES-042", "hand");
    const drawn = add(g, 0, "VES-002", "deck");
    g = perform(g, 0, "cast", spell.uid);
    expect(locate(g, drawn.uid)?.zone).toBe("hand");
  });
  it("Selo de Fuligem destrói o Encantamento que disparou o Prenúncio", () => {
    let g = fixture();
    add(g, 0, "VES-002", "front");
    add(g, 0, "VES-002", "back");
    add(g, 1, "VES-057", "veil");
    const enchant = add(g, 0, "VES-034", "hand");
    g = perform(g, 0, "cast", enchant.uid);
    expect(locate(g, enchant.uid)?.zone).toBe("discard");
  });
  it("recusa reproduzir um histórico de versão incompatível", () => {
    const g = ready();
    g.version = "incompatível";
    expect(() => replay(g)).toThrow("outra versão");
  });
  it("magia pede alvo entre inimigos e usa o alvo escolhido", () => {
    let g = fixture();
    add(g, 0, "VES-002", "front");
    add(g, 0, "VES-002", "back");
    const a = add(g, 1, "VES-002", "front"),
      b = add(g, 1, "VES-029", "front"),
      spell = add(g, 0, "VES-006", "hand");
    g = perform(g, 0, "cast", spell.uid);
    expect(g.pending?.owner).toBe(0);
    g = applyAction(g, 0, { kind: "choose", choice: b.uid });
    expect(locate(g, a.uid)?.x.damage).toBe(0);
    expect(locate(g, b.uid)?.x.damage).toBe(3);
  });
  it("aliado destruído como custo não vira fonte", () => {
    let g = fixture();
    add(g, 0, "VES-002", "front");
    add(g, 0, "VES-011", "front");
    const spell = add(g, 0, "VES-070", "hand");
    const target = add(g, 1, "VES-029", "front");
    g = perform(g, 0, "cast", spell.uid);
    expect(g.pending?.title).toContain("destruir");
    const victim = g.players[0].zones.front[0].uid;
    g = applyAction(g, 0, { kind: "choose", choice: victim });
    g = finishChoices(g);
    expect(locate(g, victim)?.zone).toBe("discard");
    expect(g.players[0].zones.sources).toHaveLength(0);
    expect(locate(g, target.uid)?.x.damage).toBe(3);
  });
  it("custo de Cinzas escolhe cartas e move ao descarte", () => {
    let g = fixture();
    add(g, 0, "VES-069", "front");
    add(g, 0, "VES-004", "back");
    add(g, 0, "VES-002", "back");
    const a = add(g, 0, "VES-002", "ashes"),
      b = add(g, 0, "VES-009", "ashes"),
      spell = add(g, 0, "VES-072", "hand");
    g = perform(g, 0, "cast", spell.uid);
    g = applyAction(g, 0, { kind: "choose", choice: a.uid });
    g = applyAction(g, 0, { kind: "choose", choice: b.uid });
    expect(g.players[0].zones.ashes).toHaveLength(0);
    expect(locate(g, a.uid)?.zone).toBe("discard");
    expect(g.players[1].life).toBe(12);
  });
  it("efeito opcional pode ser recusado sem gastar Cinzas", () => {
    let g = fixture();
    add(g, 0, "VES-002", "front");
    add(g, 0, "VES-004", "back");
    add(g, 0, "VES-002", "back");
    add(g, 0, "VES-004", "enchants");
    add(g, 0, "VES-002", "ashes");
    add(g, 0, "VES-009", "ashes");
    add(g, 1, "VES-029", "front");
    const x = add(g, 0, "VES-071", "hand");
    const o = options(g, 0).find(
      (o) => o.uid === x.uid && o.action.kind === "cast",
    );
    expect(o).toBeTruthy();
    g = applyAction(g, 0, o!.action);
    expect(g.pending?.choices.some((c) => c.id === "skip")).toBe(true);
    g = applyAction(g, 0, { kind: "choose", choice: "skip" });
    expect(g.players[0].zones.ashes).toHaveLength(2);
  });
  it("visão e decisão do bot não mudam ao trocar segredos rivais", () => {
    const g = ready();
    g.kept = [true, true];
    add(g, 0, "VES-022", "veil");
    const before = viewFor(g, 1);
    const altered = structuredClone(g);
    for (const x of altered.players[0].zones.hand) x.card = "VES-029";
    for (const x of altered.players[0].zones.deck) x.card = "VES-002";
    for (const x of altered.players[0].zones.veil) x.card = "VES-057";
    expect(viewFor(altered, 1)).toEqual(before);
    expect(chooseBot(viewFor(altered, 1))).toEqual(chooseBot(before));
  });
  it("escolha privada não aparece nas opções do outro jogador", () => {
    let g = fixture();
    add(g, 0, "VES-002", "front");
    add(g, 0, "VES-004", "back");
    add(g, 0, "VES-002", "back");
    add(g, 0, "VES-002", "ashes");
    add(g, 0, "VES-009", "ashes");
    const x = add(g, 0, "VES-072", "hand");
    g = perform(g, 0, "cast", x.uid);
    expect(viewFor(g, 1).options).toHaveLength(0);
    expect(viewFor(g, 1).pending?.title).toContain("rival");
  });
  it("limite da mão pede descarte e não escolhe pelo humano", () => {
    let g = fixture();
    for (let i = 0; i < 10; i++) add(g, 0, "VES-002", "hand");
    g = perform(g, 0, "advance");
    g = perform(g, 0, "advance");
    expect(g.pending?.title).toContain("descartar");
    g = finishChoices(g);
    expect(g.players[0].zones.hand).toHaveLength(8);
  });
  it("replay refaz uma partida usando somente config e ações", () => {
    let g = createGame({
      seed: 771,
      decks: ["Pira", "Queimada"],
      variant: "base-0.3",
      first: 0,
    });
    for (let i = 0; i < 300 && g.winner === null; i++) {
      const seat =
        g.pending?.owner ??
        (g.phase === "mulligan" ? (g.kept[0] ? 1 : 0) : g.active);
      const o = chooseBot(viewFor(g, seat));
      if (!o) break;
      g = applyAction(g, seat, o.action);
    }
    expect(replay(g)).toEqual(g);
  });
});
