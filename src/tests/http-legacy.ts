import { writeFileSync } from "node:fs";
import { createGame, applyAction, viewFor, replay } from "../engine/engine";
import { chooseBot } from "../engine/bot";
import type { View } from "../engine/types";
const base = "http://127.0.0.1:4179";
let requests = 0;
async function call(path: string, body?: unknown, token = "") {
  requests++;
  const r = await fetch(base + "/api/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!r.ok) throw Error(`API legada: ${r.status}`);
  return r.json();
}
const health = await call("health");
if (!health.version.startsWith("wb-0.2.0/rules-0.3-trigger-order/"))
  throw Error("Instância 4179 não corresponde à versão legada esperada");
// Nova mesa isolada de QA; tokens/sessões do usuário não são acessados.
const own = await call("new", { deck: "Pira", variant: "base-0.3" });
let view: View = own.view;
for (let i = 0; i < 2000 && view.winner === null; i++) {
  const option = chooseBot(view);
  view = (
    option
      ? await call("action", { action: option.action }, own.token)
      : await call("bot", {}, own.token)
  ).view;
}
if (view.winner === null) throw Error("Mesa legada de QA não terminou");
const history = await call("replay", {}, own.token);
let game = createGame(history.config);
game.version = history.version;
for (const item of history.actions)
  game = applyAction(game, item.seat, item.action);
if (JSON.stringify(viewFor(game, 0)) !== JSON.stringify(view))
  throw Error("Replay legado divergiu da instância original");
if (JSON.stringify(replay(game)) !== JSON.stringify(game))
  throw Error("Reconstrução legada divergiu");
const report = {
  sourceVersion: history.version,
  requests,
  actions: history.actions.length,
  turns: view.turn,
  originalViewEqualsRestored: true,
  replayEqualsRestored: true,
  isolatedQaSession: true,
};
writeFileSync(
  "../qa/decks-v040-legacy.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report));
