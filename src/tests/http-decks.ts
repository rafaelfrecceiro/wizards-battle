import { writeFileSync } from "node:fs";
import { createGame, applyAction, viewFor, VERSION } from "../engine/engine";
import { starterDecks } from "../engine/decks";
import { chooseBot } from "../engine/bot";
import type { View, Game } from "../engine/types";
const base = `http://127.0.0.1:${process.env.WB_PORT ?? 4182}`;
let requests = 0;
function assert(ok: unknown, message: string): asserts ok {
  if (!ok) throw Error(message);
}
async function call(path: string, body?: unknown, token = "") {
  requests++;
  const response = await fetch(base + "/api/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() };
}
const health = await call("health");
assert(health.data.version === VERSION, "Versão do servidor incorreta");
const deck = structuredClone(starterDecks.find((d) => d.name === "Queimada")!);
deck.name = "Deck personalizado HTTP";
deck.cards.find((c) => c.id === "VES-002")!.copies--;
deck.cards.push({ id: "VES-047", copies: 1 });
const invalids = [
  { customDeck: { ...deck, cards: [] } },
  { customDeck: { ...deck, cards: [{ id: "VES-002", copies: 4 }] } },
  { customDeck: { ...deck, cards: [{ id: "VES-999", copies: 1 }] } },
  { customDeck: deck, opponent: "não existe" },
];
for (const invalid of invalids) {
  const r = await call("new", invalid);
  assert(r.status === 400 && !r.data.token, "Deck inválido aceito");
}
const fresh = await call("new", {
  customDeck: deck,
  opponent: "Pira",
  variant: "escolas-v1",
});
assert(fresh.status === 200, "Duelo personalizado não iniciou");
const token = fresh.data.token;
let view: View = fresh.data.view;
assert(view.players[0].deckName === deck.name, "Nome não corresponde ao deck");
assert(
  !("config" in fresh.data) && view.players[1].hand.length === 0,
  "Dados privados expostos",
);
deck.name = "Editado depois de iniciar";
deck.cards = [];
assert(
  (await call("state", undefined, token)).data.view.players[0].deckName ===
    "Deck personalizado HTTP",
  "Partida depende da lista editada",
);
assert(
  (await call("replay", {}, token)).status === 400,
  "Replay liberado durante duelo",
);
let steps = 0;
for (; steps < 2000 && view.winner === null; steps++) {
  const choice = chooseBot(view);
  const result = choice
    ? await call("action", { action: choice.action }, token)
    : await call("bot", {}, token);
  assert(result.status === 200, "Ação HTTP falhou");
  view = result.data.view;
  assert(
    view.players[1].hand.length === 0 &&
      view.players[1].veil.every((x) => "hidden" in x),
    "Segredo rival exposto",
  );
}
assert(view.winner !== null, "Duelo personalizado não terminou");
const history = await call("replay", {}, token);
assert(history.status === 200, "Replay indisponível após fim");
assert(
  history.data.config.customDecks[0].cards.reduce(
    (sum: number, c: { copies: number }) => sum + c.copies,
    0,
  ) === 40,
  "Snapshot perdeu cartas",
);
let restored: Game = createGame(history.data.config);
for (const item of history.data.actions)
  restored = applyAction(restored, item.seat, item.action);
assert(
  JSON.stringify(viewFor(restored, 0)) === JSON.stringify(view),
  "Replay personalizado divergiu do servidor",
);
const report = {
  version: VERSION,
  checks: [
    "rejeição de lista incompleta/ilegal/desconhecida",
    "oponente validado",
    "duelo com lista personalizada",
    "snapshot independente do editor",
    "privacidade e replay bloqueado durante duelo",
    "partida completa contra bot",
    "replay determinístico idêntico ao servidor",
  ],
  requests,
  steps,
  turns: view.turn,
  winner: view.winner,
  actions: history.data.actions.length,
};
writeFileSync(
  "../qa/ves-v060/http-custom.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
