import { writeFileSync, mkdirSync } from "node:fs";
import { applyAction, createGame, replay, viewFor } from "../engine/engine";
import { chooseBot } from "../engine/bot";
import type { Seat } from "../engine/types";
const results = [];
const casts: Record<string, number> = {};
for (const variant of ["base-0.3", "fontes-estendidas"] as const)
  for (let n = 0; n < 20; n++) {
    let g = createGame({
      seed: 220000 + n,
      decks: n % 2 ? ["Pira", "Queimada"] : ["Queimada", "Pira"],
      variant,
      first: (n % 2) as Seat,
    });
    let steps = 0;
    for (; steps < 3000 && g.winner === null; steps++) {
      const s =
        g.pending?.owner ??
        (g.phase === "mulligan" ? (g.kept[0] ? 1 : 0) : g.active);
      const v = viewFor(g, s),
        o = chooseBot(v);
      if (!o)
        throw Error(`Bot sem ação no seed ${g.config.seed}, turno ${g.turn}`);
      g = applyAction(g, s, o.action);
      const total = g.players.reduce(
        (n, p) => n + Object.values(p.zones).reduce((n, z) => n + z.length, 0),
        0,
      );
      if (total !== 80) throw Error(`Conservação falhou: ${total}`);
      if (
        g.players.some(
          (p) =>
            p.energy < 0 ||
            p.zones.front.length > 3 ||
            p.zones.back.length > 3 ||
            p.zones.veil.length > 2 ||
            p.zones.enchants.length > 3,
        )
      )
        throw Error("Invariante de recurso/vaga violada.");
    }
    if (g.winner === null) throw Error("Partida excedeu limite.");
    if (n === 0 && JSON.stringify(replay(g)) !== JSON.stringify(g))
      throw Error("Replay divergiu.");
    for (const [id, count] of Object.entries(g.metrics.casts))
      casts[id] = (casts[id] ?? 0) + count;
    results.push({
      variant,
      seed: g.config.seed,
      turns: g.turn,
      actions: steps,
      winner: g.winner,
      winnerDeck: g.winner === "draw" ? "draw" : g.players[g.winner!].deckName,
    });
  }
mkdirSync("../qa", { recursive: true });
writeFileSync(
  "../qa/simulacoes.json",
  JSON.stringify(
    {
      method:
        "40 partidas bot heurístico × bot, 20 por variante; seeds fixas; não mede força estratégica ou diversão humana",
      results,
      casts,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    games: results.length,
    finished: results.filter((r) => r.winner !== null).length,
    uniqueCast: Object.keys(casts).length,
    maxTurns: Math.max(...results.map((r) => r.turns)),
  }),
);
