import snapshot from "../../data/cartas.json";
import pilot from "../../data/terras-piloto.json";
import pilotIdentity from "../../data/terras-identity.json";
import identity from "../../data/identity.json";
import * as legacyV07 from "./engine-v07";
import {
  playableDeck,
  starterDecks,
  supportedCards,
  rulesCardId,
  availableDecks,
  parseCardPool,
  isPilotCard,
} from "./decks-v08";
import type {
  Action,
  Card,
  Choice,
  Config,
  Effect,
  Game,
  Job,
  Option,
  Pending,
  Piece,
  Player,
  Seat,
  School,
  View,
  VisiblePiece,
  Zone,
} from "../types";
export const VES_VERSION = `wb-0.6.0/rules-ves-complete/${identity.cardsSha256.slice(0, 12)}/${identity.decksSha256.slice(0, 12)}`;
export const VERSION = `wb-0.8.0/rules-terras-pilot-02/${identity.cardsSha256.slice(0, 12)}/${identity.decksSha256.slice(0, 12)}/${pilotIdentity.cardsSha256.slice(0, 12)}/${pilotIdentity.decksSha256.slice(0, 12)}`;
const V04_VERSION = `wb-0.4.0/rules-0.3-custom-decks/${identity.cardsSha256.slice(0, 12)}/${identity.decksSha256.slice(0, 12)}`;
const LEGACY_VERSION = `wb-0.2.0/rules-0.3-trigger-order/${identity.cardsSha256.slice(0, 12)}/${identity.decksSha256.slice(0, 12)}`;
export const cards = Object.fromEntries(
  (structuredClone([...snapshot.cards, ...pilot.cards]) as unknown as Card[]).map((c) => [c.id, c]),
);
// "Até" permite preservar dano por escolha, inclusive para auras de feridos.
for (const c of Object.values(cards)) if (/remova até/i.test(c.text))
  for (const effects of Object.values(c.fx)) if (Array.isArray(effects))
    for (const effect of effects) if (effect.op === "heal") effect.up_to = true;
export const decks = starterDecks;
const enabled = supportedCards;
const operations = new Set([
  "damage",
  "damage_or_face",
  "face",
  "lose_life",
  "life",
  "draw",
  "heal",
  "heal_all",
  "source_damage",
  "recover",
  "recover_ashes", "survey",
  "spend_damage",
  "sac_damage",
  "destroy_enchant",
  "bounce", "bounce_enchant", "scry", "peek", "dissipate", "extend", "boost",
]);
const timingKeys = [
  "enter",
  "cast",
  "death",
  "support_dawn",
  "support_end",
  "enchant_dawn",
  "enchant_end",
  "reposition",
  "trap",
  "first_magic",
] as const;
export function validatePool() {
  const fxKeys = new Set([...timingKeys,"trigger","aura","conditional_guard","discount","store","magic_school"]);
  const targetKeys = new Set(["own","enemy","enemy_front","enemy_back","enemy_monster","own_front","own_back","own_monster","enemy_source","own_source","enemy_enchant","own_discard","own_ashes","enemy_veil","attacker","defender","event_source","event_enchant"]);
  for (const id of enabled) {
    const c = cards[id];
    if (!c || Object.keys(c.fx).some(key=>!fxKeys.has(key)) || c.keywords.some(key=>!["Ímpeto","Guardião","Alcance","Emboscada"].includes(key)))
      throw Error(`Capacidade ausente: ${id}`);
    for (const k of timingKeys)
      for (const f of c.fx[k] ?? [])
        if (!operations.has(f.op) || !targetKeys.has(f.target) || !Number.isSafeInteger(f.n) || f.n < 0 ||
          (f.resonance && (!Object.keys(f.resonance.presence).length || Object.entries(f.resonance.presence).some(([school,n])=>!["Chama","Raiz","Sombra","Maré"].includes(school)||!Number.isSafeInteger(n)||n!<1))))
          throw Error(`Capacidade ausente: ${id}/${f.op}`);
  }
}
validatePool();
const opponent = (s: Seat) => (1 - s) as Seat;
const zones: Zone[] = [
  "hand",
  "deck",
  "front",
  "back",
  "sources",
  "enchants",
  "veil",
  "ashes",
  "discard",
];
export const def = (x: Piece) => cards[x.card];
export const units = (p: Player) => [...p.zones.front, ...p.zones.back];
const permanents = (p: Player) => [...units(p), ...p.zones.enchants];
export function locate(g: Game, uid: string) {
  for (const [seat, p] of g.players.entries())
    for (const zone of zones) {
      const x = p.zones[zone].find((x) => x.uid === uid);
      if (x) return { x, p, zone, seat: seat as Seat };
    }
  return null;
}
function random(g: Game) {
  g.rng = (g.rng + 0x6d2b79f5) >>> 0;
  let t = g.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function shuffle(g: Game, a: Piece[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random(g) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}
function piece(g: Game, id: string): Piece {
  return {
    uid: `c${++g.seq}`,
    card: id,
    damage: 0,
    duration: 0,
    born: g.turn,
    attacked: false,
    retreated: false,
    temp: 0,
    haste: false,
  };
}
function log(g: Game, text: string) {
  g.log.push({ turn: g.turn, text });
}
function enqueue(
  g: Game,
  owner: Seat,
  fx: Effect[],
  event: Record<string, string> = {},
  front = false,
) {
  const jobs = fx.map((f) => ({
    owner,
    fx: structuredClone(f),
    event: { ...event },
  }));
  if (front) g.queue.unshift(...jobs);
  else g.queue.push(...jobs);
}
const internal = (op: string, target = "", n = 0): Effect => ({
  op,
  target,
  n,
});
function move(g: Game, uid: string, to: Zone) {
  const loc = locate(g, uid);
  if (!loc) return;
  if (loc.zone === "veil" && to !== "veil")
    for (const p of g.players) if (p.known) delete p.known[uid];
  loc.p.zones[loc.zone] = loc.p.zones[loc.zone].filter((x) => x.uid !== uid);
  if (to === "hand" || to === "discard" || to === "ashes") {
    loc.x.damage = 0;
    loc.x.temp = 0;
    loc.x.haste = false;
    loc.x.duration = 0;
    loc.x.attacked = false;
    loc.x.retreated = false;
  }
  loc.p.zones[to].push(loc.x);
}
export function presence(p: Player) {
  const count: Partial<Record<School, number>> = {};
  for (const x of [...units(p), ...p.zones.sources, ...p.zones.enchants])
    for (const s of def(x).schools) count[s] = (count[s] ?? 0) + 1;
  return count;
}
/** Escola é progresso público; presença continua sendo somente o campo atual. */
export function schoolRequirement(g: Game, p: Player) {
  return g.config.variant === "escolas-v1" ? p.school : presence(p);
}
function advanceSchool(g: Game, s: Seat, x: Piece) {
  if (g.config.variant !== "escolas-v1") return;
  const p = g.players[s];
  for (const school of def(x).schools) {
    p.school[school] = (p.school[school] ?? 0) + 1;
    // Não incluir nome/UID: Prenúncios continuam ocultos. Escola é pública.
    log(g, `${p.name}: Escola ${school} +1 → ${p.school[school]}.`);
  }
}
function auraSources(p: Player) {
  return [...p.zones.back, ...p.zones.enchants];
}
export function has(g: Game, s: Seat, x: Piece, key: string): boolean {
  const c = def(x),
    p = g.players[s];
  if (c.keywords.includes(key) || (key === "Ímpeto" && x.haste)) return true;
  if (
    key === "Guardião" &&
    c.fx.conditional_guard !== undefined &&
    p.zones.ashes.length >= c.fx.conditional_guard
  )
    return true;
  return (
    p.zones.front.includes(x) &&
    auraSources(p).some(
      (a) =>
        def(a).fx.aura?.keyword === key &&
        c.schools.includes(def(a).fx.aura!.school),
    )
  );
}
export function power(g: Game, s: Seat, x: Piece) {
  let n = (def(x).force ?? 0) + x.temp;
  const p = g.players[s];
  if (p.zones.front.includes(x))
    for (const a of auraSources(p)) {
      const f = def(a).fx.aura;
      if (
        f?.force &&
        def(x).schools.includes(f.school) &&
        (!f.wounded || x.damage > 0)
      )
        n += f.force;
    }
  return n;
}
function over(g: Game) {
  const dead = g.players.map((p) => p.life <= 0);
  if (dead.some(Boolean)) {
    g.winner = dead.every(Boolean) ? "draw" : dead[0] ? 1 : 0;
    g.pending = null;
    g.queue = [];
    log(
      g,
      g.winner === "draw" ? "Empate." : `${g.players[g.winner].name} venceu.`,
    );
  }
}
function cleanup(g: Game) {
  const deaths: { s: Seat; x: Piece }[] = [];
  for (const s of [0, 1] as Seat[]) {
    const p = g.players[s];
    for (const x of [...units(p)])
      if (x.damage >= (def(x).vigor ?? 0)) deaths.push({ s, x });
    for (const x of [...p.zones.sources])
      if (x.duration <= 0) {
        log(g, `${def(x).name} se esgotou e virou Cinza.`);
        move(g, x.uid, "ashes");
      }
  }
  // Retira os mortos juntos antes de recolher gatilhos; a ordem escolhida não altera quem morreu.
  for (const { s, x } of deaths) {
    log(g, `${def(x).name} morreu.`);
    move(g, x.uid, "discard");
    g.players[s].deaths++;
  }
  for (const s of [opponent(g.active), g.active]) {
    const own = deaths.filter((d) => d.s === s);
    if (!own.length) continue;
    if (s === g.active)
      orderTriggers(
        g,
        s,
        own
          .map(({ x }) =>
            triggerJob(g, s, x, def(x).fx.death ?? [], { self: x.uid }),
          )
          .filter((x) => x !== null),
      );
    else fire(g, s, "own_death", {});
  }
  over(g);
}
function kill(g: Game, s: Seat, x: Piece) {
  const loc = locate(g, x.uid);
  if (!loc || !["front", "back"].includes(loc.zone)) return;
  log(g, `${def(x).name} morreu.`);
  move(g, x.uid, "discard");
  g.players[s].deaths++;
  if (s === g.active)
    enqueue(g, s, def(x).fx.death ?? [], { self: x.uid }, true);
  fire(g, s, "own_death", {});
}
function draw(g: Game, s: Seat, n: number) {
  const p = g.players[s];
  for (let i = 0; i < n; i++) {
    const x = p.zones.deck.pop();
    if (x) p.zones.hand.push(x);
    else {
      p.life -= 2;
      log(g, `${p.name} perdeu 2 de Vida por comprar do baralho vazio.`);
      over(g);
      if (g.winner !== null) break;
    }
  }
}
function fire(
  g: Game,
  s: Seat,
  trigger: string,
  event: Record<string, string>,
) {
  if (s === g.active) return;
  enqueue(g, s, [internal("$fire", trigger)], event, true);
}
function allowed(g: Game, s: Seat, f: Effect) {
  const p = g.players[s];
  return (
    Object.entries(f.presence_min ?? {}).every(([school, n]) =>
      (presence(p)[school as School] ?? 0) >= n!,
    ) &&
    p.zones.ashes.length >= (f.ashes_min ?? 0) &&
    p.zones.hand.length <= (f.hand_max ?? Infinity) &&
    p.zones.sources.length >= (f.sources_min ?? 0) &&
    p.casts >= (f.casts_min ?? 0) &&
    (!f.requires_guardian ||
      p.zones.front.some((x) => has(g, s, x, "Guardião"))) &&
    (!f.requires_front || p.zones.front.length > 0) &&
    (!f.requires_death || p.deaths > 0) &&
    (!f.requires_reposition || p.moved)
  );
}
/** Materializa uma vez antes da escolha: bônus e efeito básico usam o mesmo alvo. */
export function resonanceEffect(g: Game, s: Seat, effect: Effect): Effect {
  const { resonance, ...base } = effect;
  if (!resonance) return effect;
  const actual = presence(g.players[s]);
  if (!Object.entries(resonance.presence).every(([school,n])=>(actual[school as School]??0)>=n!)) return base;
  const { presence: _, ...bonus } = resonance;
  return { ...base, ...bonus };
}
function targets(
  g: Game,
  s: Seat,
  f: Effect,
  event: Record<string, string>,
): Piece[] {
  const p = g.players[s],
    e = g.players[opponent(s)];
  const named = event[f.target];
  if (
    ["attacker", "defender", "event_source", "event_enchant"].includes(f.target)
  ) {
    const x = named ? locate(g, named) : null;
    return x && ["front", "back", "sources", "enchants"].includes(x.zone)
      ? [x.x]
      : [];
  }
  const pool: Record<string, Piece[]> = {
    enemy_front: e.zones.front,
    enemy_back: e.zones.back,
    enemy_monster: units(e),
    own_front: p.zones.front,
    own_back: p.zones.back,
    own_monster: units(p),
    enemy_source: e.zones.sources,
    own_source: p.zones.sources,
    enemy_enchant: e.zones.enchants,
    own_discard: p.zones.discard,
    own_ashes: p.zones.ashes,
    enemy_veil: e.zones.veil,
  };
  return (pool[f.target] ?? []).filter(
    (x) =>
      (def(x).cost ?? 0) <= (f.max_cost ?? Infinity) &&
      (!(f.op === "recover" || f.op === "recover_ashes") || def(x).type === "Monstro") &&
      (!f.exclude_self || x.uid !== event.self),
  );
}
function wait(g: Game, job: Job, title: string, choices: Choice[]) {
  g.pending = { owner: job.owner, title, job, choices };
}
/** Cada habilidade é um bloco indivisível; o dono escolhe a próxima a resolver. */
function triggerJob(
  g: Game,
  owner: Seat,
  source: Piece,
  fx: Effect[],
  event: Record<string, string> = {},
) {
  const eligible = fx.filter((f) => allowed(g, owner, f));
  return eligible.length
    ? {
        id: source.uid,
        label: def(source).name,
        card: source.card,
        jobs: eligible.map((f) => ({
          owner,
          fx: { ...structuredClone(f), ...(source.card === "VES-024" && f.op === "peek" ? { optional: true } : {}) },
          event: { ...event, self: source.uid },
        })),
      }
    : null;
}
function orderTriggers(
  g: Game,
  s: Seat,
  triggers: NonNullable<Job["triggers"]>,
) {
  if (!triggers.length) return;
  g.queue.unshift({ owner: s, fx: internal("$order"), event: {}, triggers });
}
function payAsh(g: Game, s: Seat, n: number) {
  if (n > 0) enqueue(g, s, [internal("$ashes", "", n)], {}, true);
}
function resolveEffect(g: Game, job: Job, choice?: Choice) {
  if (job.fx.resonance) {
    const actual = resonanceEffect(g, job.owner, job.fx);
    if (Object.entries(job.fx.resonance).some(([key,value])=>key!=="presence" && actual[key as keyof Effect]===value))
      log(g, `${g.players[job.owner].name}: Ressonância ativada.`);
    job = { ...job, fx: actual };
  }
  const { owner: s, fx: f, event } = job,
    p = g.players[s],
    e = g.players[opponent(s)];
  if (!allowed(g, s, f)) return;
  if (f.op === "survey") {
    const ids: string[] = event.survey ? JSON.parse(event.survey) : p.zones.deck.slice(-f.n).reverse().map(x=>x.uid);
    const kept: string[] = event.kept ? JSON.parse(event.kept) : [];
    const bottom: string[] = event.bottom ? JSON.parse(event.bottom) : [];
    const remaining = ids.filter(uid=>!kept.includes(uid)&&!bottom.includes(uid));
    if (!ids.length) return;
    if (choice) {
      (choice.id.startsWith("top:") ? kept : bottom).push(choice.target!);
      remaining.splice(remaining.indexOf(choice.target!),1);
    }
    if (remaining.length) {
      wait(g,{...job,event:{...event,survey:JSON.stringify(ids),kept:JSON.stringify(kept),bottom:JSON.stringify(bottom)}},
        `Lia — escolha a próxima carta a manter no topo ou enviar ao fundo`,
        remaining.flatMap(uid=>{
          const x=p.zones.deck.find(x=>x.uid===uid)!;
          return [{id:`top:${uid}`,label:`Topo (${kept.length+1}ª compra): ${def(x).name}`,target:uid},
            {id:`bottom:${uid}`,label:`Fundo: ${def(x).name}`,target:uid}];
        }));
      return;
    }
    const chosen = new Map(p.zones.deck.filter(x=>ids.includes(x.uid)).map(x=>[x.uid,x]));
    p.zones.deck = [...bottom.map(uid=>chosen.get(uid)!), ...p.zones.deck.filter(x=>!ids.includes(x.uid)), ...kept.reverse().map(uid=>chosen.get(uid)!)];
    log(g,`${p.name} consultou ${ids.length} cartas e organizou o topo e o fundo do próprio baralho.`);
    return;
  }
  if (f.op === "$recover_ashes") {
    const target = locate(g,event.reserved);
    if (target?.seat===s && target.zone==="ashes" && def(target.x).type==="Monstro" && (def(target.x).cost??0)<=(f.max_cost??0)) {
      move(g,target.x.uid,"hand");
      log(g,`${p.name} recuperou um Monstro das próprias Cinzas para a mão.`);
    }
    return;
  }
  if (f.op === "$heal_amount") {
    const target = locate(g, event.target);
    if (target && choice) target.x.damage = Math.max(0, target.x.damage - Number(choice.id));
    cleanup(g); return;
  }
  if (f.op === "$peek_ack") return;
  if (f.op === "scry") {
    const top = p.zones.deck.at(-1);
    if (!top) return;
    if (!choice) {
      wait(g, job, `Topo do seu baralho: ${def(top).name}`, [
        { id: "keep", label: "Manter no topo", target: top.uid },
        { id: "bottom", label: "Colocar no fundo", target: top.uid },
      ]);
      return;
    }
    if (choice.id === "bottom") p.zones.deck.unshift(p.zones.deck.pop()!);
    log(g, `${p.name} consultou o topo e ${choice.id === "bottom" ? "colocou uma carta no fundo" : "manteve a carta no topo"}.`);
    return;
  }
  if (f.op === "$order") {
    const triggers = job.triggers ?? [];
    if (!triggers.length) return;
    if (!choice && triggers.length > 1) {
      wait(
        g,
        job,
        "Gatilhos simultâneos — qual resolve primeiro?",
        triggers.map((t, i) => ({ id: t.id, label: t.label, target: t.id })),
      );
      return;
    }
    const choiceId = choice?.id;
    const chosen = choiceId
      ? triggers.find((t) => t.id === choiceId)!
      : triggers[0];
    const remaining = triggers.filter((t) => t !== chosen);
    log(g, `Resolve agora: ${chosen.label}.`);
    const rest: Job[] = remaining.length
      ? [{ ...job, triggers: remaining }]
      : [];
    g.queue.unshift(...chosen.jobs, ...rest);
    return;
  }
  if (f.op === "$timing") {
    const when = f.target;
    const triggers = [
      ...p.zones.back.map((x) =>
        triggerJob(
          g,
          s,
          x,
          def(x).fx[when === "dawn" ? "support_dawn" : "support_end"] ?? [],
        ),
      ),
      ...p.zones.enchants.map((x) =>
        triggerJob(
          g,
          s,
          x,
          def(x).fx[when === "dawn" ? "enchant_dawn" : "enchant_end"] ?? [],
        ),
      ),
    ].filter((x) => x !== null);
    orderTriggers(g, s, triggers);
    return;
  }
  if (f.op === "$fire") {
    const traps = [...p.zones.veil].filter((x) =>
      f.target.split("|").includes(def(x).fx.trigger ?? ""),
    );
    const triggers: NonNullable<Job["triggers"]> = [];
    for (const x of traps) {
      log(g, `${p.name} revelou ${def(x).name}.`);
      move(g, x.uid, "discard");
      const t = triggerJob(g, s, x, def(x).fx.trap ?? [], event);
      if (t) triggers.push(t);
    }
    orderTriggers(g, s, triggers);
    return;
  }
  if (f.op === "$start") {
    g.active = s;
    g.phase = "resolving";
    p.energy = p.stored;
    p.stored = 0;
    p.sacrificed = false;
    p.moved = false;
    p.casts = 0;
    p.magic = {};
    for (const q of g.players) q.deaths = 0;
    for (const q of g.players)
      for (const x of units(q)) {
        x.temp = 0;
        x.haste = false;
      }
    for (const x of units(p)) {
      x.attacked = false;
      x.retreated = false;
    }
    log(g, `Turno ${g.turn} — ${p.name}.`);
    for (const x of [...p.zones.sources]) {
      p.energy += def(x).essence.generation;
      x.duration--;
    }
    cleanup(g);
    for (const x of [...p.zones.veil]) {
      x.duration--;
      if (x.duration <= 0) {
        log(g, `${def(x).name} expirou no Véu e virou Cinza.`);
        move(g, x.uid, "ashes");
      }
    }
    enqueue(
      g,
      s,
      [internal("$timing", "dawn"), internal("$drawstart")],
      {},
      true,
    );
    return;
  }
  if (f.op === "$drawstart") {
    draw(g, s, 1);
    g.phase = "main";
    return;
  }
  if (f.op === "$end") {
    if (!choice && p.energy > 0 && auraSources(p).some((x) => def(x).fx.store)) {
      wait(g, job, "Guardiã da Cisterna — guardar energia para o próximo turno?", [
        { id: "store", label: "Guardar 1 energia" }, { id: "skip", label: "Não guardar energia" },
      ]);
      return;
    }
    p.stored = auraSources(p).some((x) => def(x).fx.store)
      ? (choice?.id === "store" ? Math.min(1, p.energy) : 0)
      : 0;
    p.energy = 0;
    const excess = p.zones.hand.length - 8;
    enqueue(
      g,
      s,
      [
        ...(excess > 0 ? [internal("$discard", "", excess)] : []),
        internal("$timing", "end"),
        internal("$switch"),
      ],
      {},
      true,
    );
    return;
  }
  if (f.op === "$switch") {
    for (const q of g.players)
      for (const x of units(q)) {
        x.temp = 0;
        x.haste = false;
      }
    g.turn++;
    enqueue(g, opponent(s), [internal("$start")], {}, true);
    return;
  }
  if (
    f.op === "$discard" ||
    f.op === "$ashes" ||
    f.op === "$sacrificecost" ||
    f.op === "$sacrificeability"
  ) {
    const pool =
      f.op === "$discard"
        ? p.zones.hand
        : f.op === "$ashes"
          ? p.zones.ashes.filter(x=>x.uid!==event.reserved)
          : units(p).filter(
              (x) => f.op !== "$sacrificeability" || x.uid !== event.self,
            );
    if (!pool.length) return;
    if (!choice) {
      wait(
        g,
        job,
        f.op === "$discard"
          ? "Escolha uma carta para descartar"
          : f.op === "$ashes"
            ? "Escolha uma Cinza para mover ao descarte"
            : "Escolha o monstro a destruir",
        pool.map((x) => ({ id: x.uid, label: def(x).name, target: x.uid })),
      );
      return;
    }
    const x = locate(g, choice.target!)?.x;
    if (!x) throw Error("Escolha indisponível.");
    if (f.op === "$sacrificecost" || f.op === "$sacrificeability")
      kill(g, s, x);
    else {
      log(g, `${p.name} moveu ${def(x).name} para o descarte.`);
      move(g, x.uid, "discard");
    }
    if (f.n > 1) enqueue(g, s, [{ ...f, n: f.n - 1 }], event, true);
    return;
  }
  if (f.op === "$cast") {
    const x = locate(g, f.target)?.x;
    if (!x) return;
    const c = def(x);
    advanceSchool(g, s, x);
    p.casts++;
    g.metrics.casts[c.id] = (g.metrics.casts[c.id] ?? 0) + 1;
    const ev = { self: x.uid };
    log(
      g,
      c.type === "Prenúncio"
        ? `${p.name} armou um Prenúncio.`
        : `${p.name} conjurou ${c.name}.`,
    );
    if (c.type === "Monstro") {
      move(g, x.uid, event.row as Zone);
      x.born = g.turn;
      x.attacked = false;
      x.retreated = false;
      enqueue(
        g,
        s,
        [...(c.fx.enter ?? []), internal("$aftercast", x.uid)],
        ev,
        true,
      );
    } else if (c.type === "Encantamento") {
      move(g, x.uid, "enchants");
      enqueue(g, s, [internal("$aftercast", x.uid)], ev, true);
    } else if (c.type === "Prenúncio") {
      move(g, x.uid, "veil");
      x.duration = c.vigil ?? 1;
    } else {
      move(g, x.uid, "discard");
      enqueue(
        g,
        s,
        [...(c.fx.cast ?? []), internal("$aftercast", x.uid)],
        ev,
        true,
      );
    }
    return;
  }
  if (f.op === "$aftercast") {
    const x = locate(g, f.target)?.x;
    if (!x) return;
    const c = def(x);
    if (c.type === "Monstro" && (c.cost ?? 0) >= 5)
      fire(g, opponent(s), "big_monster", {});
    if (c.type === "Encantamento" && (c.cost ?? 0) <= 3)
      fire(g, opponent(s), "small_enchant", { event_enchant: x.uid });
    if (c.type === "Magia") {
      const first = c.schools.filter((sc) => !p.magic[sc]);
      for (const sc of c.schools) p.magic[sc] = (p.magic[sc] ?? 0) + 1;
      fire(g, opponent(s), "magic", {});
      orderTriggers(
        g,
        s,
        p.zones.enchants
          .filter(
            (a) =>
              def(a).fx.magic_school && first.includes(def(a).fx.magic_school!),
          )
          .map((a) => triggerJob(g, s, a, def(a).fx.first_magic ?? []))
          .filter((x) => x !== null),
      );
    }
    return;
  }
  if (f.op === "$combat") {
    const a = locate(g, event.attacker);
    if (!a || a.seat !== s || a.zone !== "front") return;
    const b = event.defender ? locate(g, event.defender) : null;
    if (event.defender && (!b || b.seat !== opponent(s) ||
      !["front", "back", "sources"].includes(b.zone) ||
      (event.defender_zone && b.zone !== event.defender_zone))) return;
    if (b) {
      if (b.zone === "sources") {
        b.x.duration -= 2;
        log(g, `${def(a.x).name} removeu 2 de duração de ${def(b.x).name}.`);
      } else {
        const pa = power(g, s, a.x),
          pb = power(g, opponent(s), b.x);
        b.x.damage += pa;
        a.x.damage += pb;
        log(
          g,
          `${def(a.x).name} e ${def(b.x).name} trocaram ${pa}/${pb} de dano.`,
        );
      }
    } else {
      const n = power(g, s, a.x);
      e.life -= n;
      log(g, `${def(a.x).name} causou ${n} de dano ao mago rival.`);
    }
    cleanup(g);
    return;
  }
  if (choice?.id === "skip") return;
  if (!operations.has(f.op)) throw Error(`Efeito indisponível: ${f.op}`);
  if (["draw", "face", "lose_life", "life", "heal_all"].includes(f.op)) {
    if (f.op === "draw") draw(g, s, f.n);
    if (f.op === "face") e.life -= f.n;
    if (f.op === "lose_life") p.life -= f.n;
    if (f.op === "life") p.life = Math.min(15, p.life + f.n);
    if (f.op === "heal_all")
      for (const x of f.target === "own_back" ? p.zones.back : units(p))
        x.damage = Math.max(0, x.damage - f.n);
    cleanup(g);
    return;
  }
  if (f.op === "spend_damage" && p.zones.ashes.length < (f.ashes ?? 2)) return;
  if (f.op === "recover_ashes" && p.zones.ashes.length < (f.ashes ?? 2)+1) return;
  if (f.op === "sac_damage" && !units(p).some((x) => x.uid !== event.self))
    return;
  const pool = targets(g, s, f, event);
  if (f.op === "damage_or_face" && !e.zones.front.length) {
    e.life -= f.face_n ?? 1;
    cleanup(g);
    return;
  }
  if (!pool.length) return;
  if (!choice) {
    const choices = pool.map((x, i) => ({
      id: x.uid,
      label: f.target === "enemy_veil" ? `Prenúncio ${i + 1} — duração ${x.duration}` : def(x).name,
      target: x.uid,
    }));
    if (f.op === "spend_damage" || f.op === "sac_damage" || f.optional)
      choices.push({ id: "skip", label: "Não usar este efeito", target: "" });
    if (choices.length > 1) {
      wait(g, job, `${effectLabel(f)} — escolha o alvo`, choices);
      return;
    }
    choice = choices[0];
  }
  const x = locate(g, choice.target!)?.x;
  if (!x) return;
  if (f.op === "damage" || f.op === "damage_or_face") {
    x.damage += f.n;
    log(g, `${def(x).name} recebeu ${f.n} de dano.`);
  } else if (f.op === "heal") {
    const maximum = Math.min(x.damage, f.n + (p.zones.ashes.length >= 3 ? (f.ashes_bonus ?? 0) : 0));
    if (f.up_to && maximum > 0) {
      wait(g, {owner:s,fx:internal("$heal_amount","",maximum),event:{target:x.uid}},
        `${def(x).name} — quantos marcadores de dano remover?`,
        Array.from({length:maximum+1},(_,n)=>({id:String(n),label:`Remover ${n} de dano`,target:x.uid})));
      return;
    }
    x.damage = Math.max(0, x.damage - maximum);
  }
  else if (f.op === "source_damage") x.duration -= f.n;
  else if (f.op === "destroy_enchant") {
    log(g, `${def(x).name} foi destruído.`);
    move(g, x.uid, "discard");
  } else if (f.op === "recover") move(g, x.uid, "hand");
  else if (f.op === "recover_ashes") {
    enqueue(g,s,[internal("$ashes","",f.ashes??2),{...f,op:"$recover_ashes"}],{...event,reserved:x.uid},true);
  }
  else if (f.op === "bounce" || f.op === "bounce_enchant") {
    log(g, `${def(x).name} voltou para a mão do dono.`);
    move(g, x.uid, "hand");
  } else if (f.op === "extend") {
    x.duration += f.n;
    log(g, `${def(x).name}: +${f.n} de duração (sem energia imediata).`);
  } else if (f.op === "boost") {
    x.temp += f.n;
    if (f.haste) x.haste = true;
  } else if (f.op === "dissipate") {
    log(g, `${p.name} dissipou ${def(x).name}; revelado e movido para as Cinzas do dono.`);
    move(g, x.uid, "ashes");
  } else if (f.op === "peek") {
    p.known ??= {};
    p.known[x.uid] = x.card;
    log(g, `${p.name} olhou um Prenúncio do Véu rival.`);
    wait(g, { owner:s, fx:internal("$peek_ack"), event:{} },
      `Você viu ${def(x).name}: ${def(x).text}`, [{id:"continue",label:"Continuar",target:x.uid}]);
  }
  else if (f.op === "spend_damage") {
    enqueue(
      g,
      s,
      [
        internal("$ashes", "", f.ashes ?? 2),
        { ...f, op: "damage", target: "event_source" },
      ],
      { event_source: x.uid },
      true,
    );
  } else if (f.op === "sac_damage") {
    enqueue(
      g,
      s,
      [
        internal("$sacrificeability", "", 1),
        { ...f, op: "damage", target: "event_source" },
      ],
      { self: event.self, event_source: x.uid },
      true,
    );
  } else throw Error(`Efeito indisponível: ${f.op}`);
  cleanup(g);
}
function effectLabel(f: Effect) {
  return (
    (
      {
        damage: `Causar ${f.n} de dano`,
        damage_or_face: `Causar ${f.n} de dano`,
        heal: `Curar ${f.n}`,
        source_damage: `Remover ${f.n} de duração`,
        recover: "Recuperar monstro",
        recover_ashes: `Gastar ${f.ashes??2} outras Cinzas e recuperar Monstro de custo até ${f.max_cost}`,
        spend_damage: `Gastar ${f.ashes ?? 2} Cinzas e causar ${f.n} de dano`,
        sac_damage: `Destruir um aliado e causar ${f.n} de dano`,
        destroy_enchant: "Destruir encantamento",
        bounce: "Devolver monstro para a mão", bounce_enchant: "Devolver encantamento",
        extend: "Prolongar fonte", boost: f.haste ? "Conceder Força e Ímpeto" : `Conceder +${f.n} de Força`,
        peek: "Olhar Prenúncio", dissipate: "Dissipar Prenúncio",
      } as Record<string, string>
    )[f.op] ?? f.op
  );
}
function pump(g: Game) {
  let steps = 0;
  while (g.queue.length && !g.pending && g.winner === null) {
    if (++steps > 500) throw Error("Limite de resolução excedido.");
    resolveEffect(g, g.queue.shift()!);
    over(g);
  }
}
export function createGame(config: Config): Game {
  const cardPool = parseCardPool(config.cardPool);
  if (cardPool === "terras-pilot-v1" && config.variant !== "escolas-v1")
    throw Error("O piloto de As Terras Despertas usa Escola + Presença.");
  if (
    !Number.isSafeInteger(config.seed) ||
    !Array.isArray(config.decks) ||
    config.decks.length !== 2 ||
    (config.customDecks !== undefined &&
      (!Array.isArray(config.customDecks) ||
        config.customDecks.length !== 2 ||
        config.customDecks.some(
          (d) => d !== null && (!d || typeof d !== "object"),
        ))) ||
    !["base-0.3", "fontes-estendidas", "escolas-v1"].includes(config.variant) ||
    ![0, 1].includes(config.first)
  )
    throw Error("Configuração inválida.");
  const resolvedDecks = config.decks.map((name, i) => {
    const custom = config.customDecks?.[i];
    const deck = playableDeck(custom ?? availableDecks(cardPool).find((d) => d.name === name), cardPool);
    if (deck.name !== name)
      throw Error("Nome do deck difere da lista registrada.");
    return deck;
  });
  const fixedConfig = structuredClone(config);
  if (fixedConfig.customDecks)
    fixedConfig.customDecks = fixedConfig.customDecks.map((d, i) =>
      d ? resolvedDecks[i] : null,
    ) as Config["customDecks"];
  const g: Game = {
    version: VERSION,
    config: fixedConfig,
    rng: config.seed >>> 0,
    seq: 0,
    turn: 1,
    active: config.first,
    phase: "mulligan",
    players: [] as unknown as [Player, Player],
    mulligans: [false, false],
    kept: [false, false],
    queue: [],
    pending: null,
    winner: null,
    log: [],
    metrics: { presenceBlocks: 0, energyBlocks: 0, casts: {} },
    history: [],
  };
  for (const [i, name] of config.decks.entries()) {
    const deck = resolvedDecks[i];
    const p: Player = {
      name: i === 0 ? "Você" : "Autômato",
      deckName: name,
      life: 15,
      energy: 0,
      stored: 0,
      sacrificed: false,
      moved: false,
      casts: 0,
      deaths: 0,
      magic: {},
      school: {},
      zones: {
        hand: [],
        deck: [],
        front: [],
        back: [],
        sources: [],
        enchants: [],
        veil: [],
        ashes: [],
        discard: [],
      },
    };
    g.players.push(p);
    for (const entry of deck.cards)
      for (let n = 0; n < entry.copies; n++)
        p.zones.deck.push(piece(g, rulesCardId(entry.id)));
    shuffle(g, p.zones.deck);
    draw(g, i as Seat, 7);
  }
  log(g, `Partida ${config.variant} — ${config.decks.join(" × ")}.`);
  return g;
}
export function castingCost(g: Game, s: Seat, c: Card): number {
  const p = g.players[s];
  const discounted = c.type === "Magia" && c.schools.some(sc =>
    !p.magic[sc] && p.zones.back.some(x => def(x).fx.discount === sc));
  return discounted ? Math.max(1, (c.cost ?? 1) - 1) : c.cost ?? 1;
}
function choiceCard(g: Game, s: Seat, c: Choice): string | undefined {
  const loc = locate(g, c.target ?? "");
  if (!loc) return;
  if (loc.seat !== s && loc.zone === "veil" && !g.players[s].known?.[loc.x.uid]) return;
  return loc.x.card;
}
export function castReason(g: Game, s: Seat, x: Piece) {
  const p = g.players[s],
    c = def(x);
  if (!enabled.has(c.id)) return "Carta ainda não habilitada.";
  if (isPilotCard(c.id) && g.config.cardPool !== "terras-pilot-v1") return "Carta fora do conjunto deste duelo.";
  if (g.phase !== "main" || g.active !== s)
    return "Conjure na sua fase principal.";
  if (p.energy < castingCost(g, s, c))
    return `Energia insuficiente: precisa de ${castingCost(g, s, c)}.`;
  for (const [sc, n] of Object.entries(c.presence))
    if ((schoolRequirement(g, p)[sc as School] ?? 0) < n)
      return `${g.config.variant === "escolas-v1" ? "Escola" : "Presença"} insuficiente: precisa de ${sc} ${n}.`;
  if (p.zones.ashes.length < (c.ash_cost ?? 0))
    return `Precisa de ${c.ash_cost} Cinzas.`;
  if (c.sac_cost && !units(p).length)
    return "Precisa destruir um monstro aliado como custo.";
  if (
    c.type === "Monstro" &&
    (units(p).length >= 6 ||
      (c.keywords.includes("Emboscada") && p.zones.back.length >= 3))
  )
    return "Sem vaga na fileira de entrada.";
  if (c.type === "Encantamento" && p.zones.enchants.length >= 3)
    return "As três vagas de Encantamento estão ocupadas.";
  if (c.type === "Prenúncio" && p.zones.veil.length >= 2)
    return "As duas vagas do Véu estão ocupadas.";
  return null;
}
export function options(g: Game, s: Seat): Option[] {
  if (g.winner !== null) return [];
  const p = g.players[s],
    e = g.players[opponent(s)];
  const out: Option[] = [];
  const add = (
    label: string,
    action: Action,
    group: string,
    score: number,
    card?: string,
  ) =>
    out.push({
      id: JSON.stringify(action),
      label,
      action,
      group,
      card,
      uid: action.uid,
      target: action.target,
      score,
    });
  if (g.pending) {
    if (g.pending.owner !== s) return [];
    for (const c of g.pending.choices)
      add(
        c.label,
        { kind: "choose", choice: c.id },
        "Escolha",
        choiceScore(g, s, g.pending, c),
        choiceCard(g, s, c),
      );
    return out;
  }
  if (g.phase === "mulligan") {
    if (g.kept[s]) return [];
    add("Manter mão", { kind: "mulligan", choice: "keep" }, "Preparação", 1);
    if (!g.mulligans[s])
      add(
        "Trocar as 7 cartas",
        { kind: "mulligan", choice: "redraw" },
        "Preparação",
        0,
      );
    return out;
  }
  if (g.active !== s) return [];
  if (g.phase === "main") {
    if (!p.sacrificed)
      for (const x of p.zones.hand) {
        const c = def(x),
          es = c.essence;
        let score =
          es.generation * Math.min(es.duration, 3) * 0.65 +
          es.generation * 0.6 +
          c.schools.reduce((v, sc) => v + (!schoolRequirement(g, p)[sc] ? 1.2 : 0.2), 0);
        if (g.config.variant === "escolas-v1") {
          const before = p.school;
          // Progresso só valoriza escolas que desbloqueiam cartas da própria mão.
          score += p.zones.hand.filter(y => y.uid !== x.uid).reduce((value, y) => {
            const requirements = def(y).presence;
            const blockedBefore = Object.entries(requirements).some(([sc, n]) => (before[sc as School] ?? 0) < n!);
            const readyAfter = Object.entries(requirements).every(([sc, n]) => (before[sc as School] ?? 0) + (c.schools.includes(sc as School) ? 1 : 0) >= n!);
            return value + (blockedBefore && readyAfter ? 1.4 : 0);
          }, 0);
        }
        if (
          c.type === "Monstro" &&
          (c.cost ?? 0) <= 2 &&
          p.zones.front.length < 2
        )
          score -= 1.5;
        // Custo de oportunidade: preservar apoio experimental quando outra
        // carta da própria mão oferece geração equivalente como fonte.
        if (isPilotCard(c.id) && c.type==='Encantamento' && p.zones.enchants.length<3 &&
          p.zones.hand.some(y=>y.uid!==x.uid && def(y).essence.generation*Math.min(def(y).essence.duration,3)>=es.generation*Math.min(es.duration,3))) score-=1.4;
        add(
          `Fonte: ${c.name}`,
          { kind: "sacrifice", uid: x.uid },
          "Sacrificar",
          score,
          c.id,
        );
      }
    for (const x of p.zones.hand)
      if (!castReason(g, s, x)) {
        const c = def(x),
          score =
            c.type === "Monstro"
              ? 3 +
                (c.force ?? 0) * 0.5 +
                (c.vigor ?? 0) * 0.2 +
                (p.zones.front.length < 2 ? 1 : 0) +
                (isPilotCard(c.id) ? pilotEntryValue(g,s,c) : 0)
              : c.type === "Magia"
                ? magicValue(g, s, c)
                : c.type === "Encantamento"
                  ? (isPilotCard(c.id) ? pilotEnchantmentValue(g,s,c) : 1.5)
                  : 1;
        if (c.type === "Monstro") {
          for (const row of ["front", "back"] as const)
            if (
              p.zones[row].length < 3 &&
              (!c.keywords.includes("Emboscada") || row === "back")
            )
              add(
                `${row === "front" ? "Frente" : "Retaguarda"}: ${c.name}`,
                { kind: "cast", uid: x.uid, row },
                "Conjurar",
                score +
                  (c.support && row === "back" && p.zones.front.length
                    ? 1
                    : row === "front"
                      ? 0.4
                      : 0),
                c.id,
              );
        } else
          add(
            `${c.type === "Prenúncio" ? "Armar" : "Conjurar"}: ${c.name}`,
            { kind: "cast", uid: x.uid },
            "Conjurar",
            score,
            c.id,
          );
      }
    if (!p.moved)
      for (const x of units(p)) {
        const back = p.zones.back.includes(x),
          row = back ? "front" : "back";
        if (
          p.zones[row].length < 3 &&
          (p.energy >= 1 || (back && has(g, s, x, "Emboscada")))
        )
          add(
            `${def(x).name} → ${row === "front" ? "frente" : "retaguarda"}`,
            { kind: "move", uid: x.uid, row },
            "Reposicionar",
            back && !def(x).support
              ? 0.7
              : !back &&
                  def(x).support &&
                  (p.zones.front.length > 1 || !e.zones.front.length)
                ? 0.9
                : -0.5,
            def(x).id,
          );
      }
    add("Ir para combate", { kind: "advance" }, "Fase", -1);
  }
  if (g.phase === "combat") {
    for (const x of p.zones.front) {
      if (
        x.attacked ||
        x.retreated ||
        (x.born === g.turn && !has(g, s, x, "Ímpeto"))
      )
        continue;
      const guards = e.zones.front.filter((t) =>
        has(g, opponent(s), t, "Guardião"),
      );
      const victims = guards.length
        ? guards
        : [...e.zones.front, ...(has(g, s, x, "Alcance") ? e.zones.back : [])];
      for (const t of victims) {
        const kills = power(g, s, x) >= (def(t).vigor ?? 0) - t.damage,
          dies = power(g, opponent(s), t) >= (def(x).vigor ?? 0) - x.damage;
        add(
          `${def(x).name} → ${def(t).name}`,
          { kind: "attack", uid: x.uid, target: t.uid },
          "Atacar",
          2 + Number(kills) * 3 - Number(dies) * 3 + Number(def(t).support),
          x.card,
        );
      }
      if (!e.zones.front.length) {
        add(
          `${def(x).name} → mago rival`,
          { kind: "attack", uid: x.uid, target: "mage" },
          "Atacar",
          power(g, s, x) >= e.life ? 100 : 5,
          x.card,
        );
        for (const t of e.zones.sources)
          add(
            `${def(x).name} → fonte ${def(t).name}`,
            { kind: "attack", uid: x.uid, target: t.uid },
            "Atacar",
            t.duration <= 2 ? 2 : 1,
            x.card,
          );
      }
    }
    add("Encerrar turno", { kind: "advance" }, "Fase", -1);
  }
  return out;
}
function pilotEnchantmentValue(g: Game, s: Seat, c: Card) {
  const actual=presence(g.players[s]);
  for(const sc of c.schools)actual[sc]=(actual[sc]??0)+1;
  if(!g.players[s].zones.deck.length)return .5;
  return (c.fx.enchant_end??[]).some(f=>Object.entries(f.presence_min??{}).every(([sc,n])=>(actual[sc as School]??0)>=n!)) ? 3.5 : 1.8;
}
function pilotEntryValue(g: Game, s: Seat, c: Card) {
  const p=g.players[s], actual=presence(p);
  for(const school of c.schools)actual[school]=(actual[school]??0)+1;
  let score=0;
  for(const raw of c.fx.enter??[]) {
    if(Object.entries(raw.presence_min??{}).some(([sc,n])=>(actual[sc as School]??0)<n!))continue;
    let f=raw;
    if(raw.resonance && Object.entries(raw.resonance.presence).every(([sc,n])=>(actual[sc as School]??0)>=n!)) {
      const {presence:_,...bonus}=raw.resonance;f={...raw,...bonus};
    }
    const available=targets(g,s,f,{});
    if(f.op==='survey')score+=p.zones.deck.length ? .8 : 0; // Não consultar o topo para decidir conjurar.
    if(f.op==='boost')score+=available.some(x=>p.zones.front.includes(x)&&!x.attacked) ? (f.haste?1.5:.5) : 0;
    if(f.op==='spend_damage')score+=p.zones.ashes.length>=(f.ashes??2)&&available.length ? 1.2 : 0;
    if(f.op==='recover_ashes')score+=p.zones.ashes.length>=(f.ashes??2)+1&&available.length ? 1.5 : 0;
  }
  if(c.support && p.zones.front.some(x=>x.damage>0))score+=.6;
  return score;
}
function magicValue(g: Game, s: Seat, c: Card) {
  let n = 0;
  for (const raw of c.fx.cast ?? []) {
    const f = resonanceEffect(g,s,raw);
    const ts = targets(g, s, f, {});
    if (f.op === "draw") n += g.players[s].zones.hand.length < 4 ? 2.5 : 1;
    else if (f.op === "face") n += g.players[opponent(s)].life <= f.n ? 100 : 2;
    else if (f.op === "heal") n += ts.some((x) => x.damage > 0) ? 2 : -2;
    else if (f.op === "heal_all") n += units(g.players[s]).some(x=>x.damage>0) ? 2 : -2;
    else if (
      f.op === "damage" ||
      f.op === "source_damage" ||
      f.op === "destroy_enchant"
    )
      n += ts.length ? 2.5 + (raw.resonance && f.n>raw.n ? .5 : 0) : -3;
    else if (f.op === "recover") n += ts.length ? 2.5 : -3;
    else if (f.op === "life") n += g.players[s].life < 12 ? 1 : 0;
    else n += 1;
  }
  return n;
}
function choiceScore(g: Game, s: Seat, p: Pending, c: Choice) {
  if (c.id === "skip") return 0;
  if (p.job.fx.op === "$end") return c.id === "store" ? 1 : 0;
  const loc = locate(g, c.target ?? "");
  if (!loc) return 0;
  // A escolha do alvo oculto não pode usar sua identidade real.
  if (loc.seat !== s && loc.zone === "veil" && !g.players[s].known?.[loc.x.uid]) return 1;
  const x = loc.x,
    d = def(x),
    f = p.job.fx;
  switch (f.op) {
    case "scry":
      return c.id === "keep" ? ((d.cost ?? 0) <= Math.max(2,g.players[s].energy) ? 2 : -1) : 0;
    case "survey":
      return c.id.startsWith("top:") ? ((d.cost??0)<=Math.max(2,g.players[s].energy) ? 2 : -1) + (d.type==="Monstro" ? .2 : 0) : 0;
    case "$heal_amount": return Number(c.id);
    case "peek": case "$peek_ack": case "dissipate": return 1;
    case "extend": return d.essence.generation / Math.max(1,x.duration);
    case "boost": return (g.players[s].zones.front.includes(x) && !x.attacked ? 2 : 0) + (x.born === g.turn ? 1 : 0);
    case "bounce_enchant": return 2;
    case "bounce":
      return loc.seat !== s ? (d.cost ?? 0) + Number(d.support) :
        x.damage + Number(!!d.fx.enter?.length) - (d.cost ?? 0) * .4;
    case "$discard":
    case "$ashes":
      return -(d.force ?? 0) - (d.vigor ?? 0) * 0.2;
    case "$sacrificecost":
    case "$sacrificeability":
      return -(d.force ?? 0) - ((d.vigor ?? 0) - x.damage) * 0.5;
    case "heal":
      return Math.min(x.damage, f.n);
    case "recover":
    case "recover_ashes":
      return (d.force ?? 0) + (d.vigor ?? 0) * 0.5;
    case "source_damage":
      return (d.essence.generation * 2) / Math.max(1, x.duration);
    case "destroy_enchant":
      return 2;
    default:
      return (
        (f.n >= (d.vigor ?? 0) - x.damage ? 4 : 1) +
        (d.force ?? 0) * 0.3 +
        Number(d.support)
      );
  }
}
export function applyAction(state: Game, s: Seat, a: Action): Game {
  if (a?.kind === 'concede' && JSON.stringify(a) === JSON.stringify({kind:'concede'}) && state.winner === null) {
    const g = structuredClone(state);
    g.history.push({ seat: s, action: {kind:'concede'} });
    g.winner = opponent(s);
    g.pending = null;
    g.queue = [];
    log(g, `${g.players[s].name} concedeu o duelo.`);
    return g;
  }
  const valid = options(state, s).find(
    (o) => JSON.stringify(o.action) === JSON.stringify(a),
  );
  if (!valid) throw Error("Ação inválida nesta fase ou para este jogador.");
  const g = structuredClone(state),
    p = g.players[s],
    e = g.players[opponent(s)];
  g.history.push({ seat: s, action: structuredClone(a) });
  if (a.kind === "choose") {
    const q = g.pending!;
    const c = q.choices.find((c) => c.id === a.choice)!;
    g.pending = null;
    resolveEffect(g, q.job, c);
  }
  if (a.kind === "mulligan") {
    if (a.choice === "redraw") {
      p.zones.deck.push(...p.zones.hand);
      p.zones.hand = [];
      shuffle(g, p.zones.deck);
      draw(g, s, 7);
      g.mulligans[s] = true;
      log(g, `${p.name} trocou a mão inicial.`);
    } else {
      g.kept[s] = true;
      if (g.kept.every(Boolean)) {
        g.phase = "resolving";
        enqueue(g, g.config.first, [internal("$start")]);
      }
    }
  }
  if (a.kind === "sacrifice") {
    const x = locate(g, a.uid!)!.x;
    p.sacrificed = true;
    advanceSchool(g, s, x);
    move(g, x.uid, "sources");
    x.duration =
      def(x).essence.duration - (g.config.variant === "fontes-estendidas" ? 0 : 1);
    p.energy += def(x).essence.generation;
    log(
      g,
      `${p.name} sacrificou ${def(x).name}: +${def(x).essence.generation} energia.`,
    );
    cleanup(g);
    fire(g, opponent(s), "sacrifice", { event_source: x.uid });
  }
  if (a.kind === "cast") {
    const x = locate(g, a.uid!)!.x,
      c = def(x);
    p.energy -= castingCost(g, s, c);
    const jobs = [
      ...(c.ash_cost ? [internal("$ashes", "", c.ash_cost)] : []),
      ...(c.sac_cost ? [internal("$sacrificecost", "", 1)] : []),
      internal("$cast", x.uid),
    ];
    enqueue(g, s, jobs, { row: a.row ?? "front" });
  }
  if (a.kind === "move") {
    const x = locate(g, a.uid!)!.x;
    const free = p.zones.back.includes(x) && has(g, s, x, "Emboscada");
    p.energy -= free ? 0 : 1;
    p.moved = true;
    if (a.row === "back") x.retreated = true;
    move(g, x.uid, a.row!);
    log(
      g,
      `${def(x).name} foi para ${a.row === "back" ? "retaguarda" : "frente"}.`,
    );
    orderTriggers(
      g,
      s,
      p.zones.enchants
        .map((x) => triggerJob(g, s, x, def(x).fx.reposition ?? []))
        .filter((x) => x !== null),
    );
  }
  if (a.kind === "attack") {
    const x = locate(g, a.uid!)!.x;
    x.attacked = true;
    const t = a.target === "mage" ? null : locate(g, a.target!)!;
    const ev = { attacker: x.uid, ...(t ? { defender: t.x.uid, defender_zone: t.zone } : {}) };
    enqueue(g, s, [internal("$combat")], ev);
    const triggers = ["attack"];
    if (t?.zone === "back") triggers.push("back_attacked");
    if (t && ["front", "back"].includes(t.zone) && t.x.damage > 0)
      triggers.push("wounded_attacked");
    if (!t) triggers.push("face_attack");
    fire(g, opponent(s), triggers.join("|"), ev);
  }
  if (a.kind === "advance") {
    if (g.phase === "main") g.phase = "combat";
    else {
      g.phase = "resolving";
      enqueue(g, s, [internal("$end")]);
    }
  }
  pump(g);
  over(g);
  return g;
}
export function viewFor(g: Game, s: Seat): View {
  const visible = (owner: Seat, x: Piece): VisiblePiece => ({
    ...structuredClone(x),
    definition: structuredClone(def(x)),
    power: power(g, owner, x),
    health: (def(x).vigor ?? 0) - x.damage,
    keywords: ["Ímpeto", "Guardião", "Alcance", "Emboscada"].filter((k) =>
      has(g, owner, x, k),
    ),
  });
  const players = g.players.map((p, i) => {
    const owner = i as Seat;
    return {
      name: p.name,
      deckName: p.deckName,
      life: p.life,
      energy: p.energy,
      presence: presence(p),
      school: { ...p.school },
      deck: p.zones.deck.length,
      handCount: p.zones.hand.length,
      hand: s === owner ? p.zones.hand.map((x) => visible(owner, x)) : [],
      front: p.zones.front.map((x) => visible(owner, x)),
      back: p.zones.back.map((x) => visible(owner, x)),
      sources: p.zones.sources.map((x) => visible(owner, x)),
      enchants: p.zones.enchants.map((x) => visible(owner, x)),
      veil: p.zones.veil.map((x) =>
        s === owner || g.players[s].known?.[x.uid] === x.card
          ? { ...visible(owner, x), ...(s !== owner ? { known: true } : {}) }
          : { uid: x.uid, duration: x.duration, hidden: true as const },
      ),
      ashes: [],
      discard: p.zones.discard.map((x) => visible(owner, x)),
    };
  }) as unknown as View["players"];
  // Cinzas são viradas para baixo. O dono pode consultar as próprias para pagar custos; o rival recebe só contagem sem identidades.
  players[s].ashes = g.players[s].zones.ashes.map((x) => visible(s, x));
  players[opponent(s)].ashes = g.players[opponent(s)].zones.ashes.map((x) => ({
    uid: x.uid,
    duration: 0,
    hidden: true,
  })) as unknown as VisiblePiece[];
  return {
    version: g.version,
    variant: g.config.variant,
    cardPool: g.config.cardPool ?? "ves",
    turn: g.turn,
    active: g.active,
    seat: s,
    phase: g.phase,
    winner: g.winner,
    players,
    pending: g.pending
      ? {
          owner: g.pending.owner,
          title:
            g.pending.owner === s
              ? g.pending.title
              : "O rival está escolhendo…",
          kind: g.pending.job.fx.op === "$order" ? "order" : "target",
        }
      : null,
    options: options(g, s),
    blocked: g.players[s].zones.hand
      .map((x) => ({ uid: x.uid, reason: castReason(g, s, x) ?? "" }))
      .filter((x) => x.reason),
    log: structuredClone(g.log.slice(-100)),
  };
}
export function replay(g: Game) {
  if (g.version !== VERSION) return legacyV07.replay(g);
  let fresh = createGame(g.config);
  for (const h of g.history) fresh = applyAction(fresh, h.seat, h.action);
  fresh.version = g.version;
  return fresh;
}
