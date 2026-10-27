import { writeFileSync } from "node:fs";
import { chooseBot } from "../engine/bot";
import { VERSION } from "../engine/engine";
import type { View } from "../engine/types";
const base = `http://127.0.0.1:${process.env.WB_PORT ?? 4182}`;
let requests = 0;
async function call(path: string, body?: unknown, token = "", origin?: string) {
  requests++;
  const response = await fetch(base + "/api/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(origin ? { Origin: origin } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() };
}
function assert(check: unknown, message: string) {
  if (!check) throw Error(message);
}
const health = await call("health");
assert(
  health.status === 200 && health.data.version === VERSION,
  "servidor precisa estar na versão atual",
);
assert((await call("state")).status === 401, "sem token");
assert(
  (await call("new", { deck: "Pira" }, "", "https://exemplo.invalid"))
    .status === 403,
  "origem externa",
);
const fresh = await call("new", { deck: "Pira", variant: "escolas-v1" });
assert(fresh.status === 200, "nova mesa");
const token = fresh.data.token;
let view: View = fresh.data.view;
assert(!view.players[1].hand.length, "mão rival vazou");
assert(!("config" in fresh.data), "config com seed vazou");
assert((await call("replay", {}, token)).status === 400, "replay prematuro");
const before = JSON.stringify(
  (await call("state", undefined, token)).data.view,
);
assert(
  (await call("action", { action: { kind: "cast", uid: "inventado" } }, token))
    .status === 400,
  "ação inválida aceita",
);
assert(
  JSON.stringify((await call("state", undefined, token)).data.view) === before,
  "erro alterou estado",
);
let steps = 0;
for (; steps < 2000 && view.winner === null; steps++) {
  const option = chooseBot(view);
  const r = option
    ? await call("action", { action: option.action }, token)
    : await call("bot", {}, token);
  assert(r.status === 200, "falha durante partida HTTP");
  view = r.data.view;
  assert(view.players[1].hand.length === 0, "mão rival vazou durante partida");
  assert(
    view.players[1].veil.every((x) => "hidden" in x),
    "Véu rival vazou",
  );
}
assert(view.winner !== null, "partida HTTP não terminou");
const r = await call("replay", {}, token);
assert(r.status === 200 && r.data.actions.length > 0, "replay final");
writeFileSync(
  "../qa/ves-v060/http-preset.json",
  JSON.stringify(
    {
      checks: [
        "saúde",
        "autorização",
        "origem",
        "ação inválida atômica",
        "replay bloqueado antes do fim",
        "privacidade durante partida inteira",
        "partida completa via HTTP",
        "replay ao encerrar",
      ],
      requests,
      steps,
      turns: view.turn,
      winner: view.winner,
      actions: r.data.actions.length,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    ok: true,
    requests,
    turns: view.turn,
    actions: r.data.actions.length,
  }),
);
