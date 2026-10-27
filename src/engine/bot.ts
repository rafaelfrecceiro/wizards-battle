import type { Option, View } from "./types";
/** Recebe somente a visão autorizada, nunca Game ou ordem de biblioteca. */
export function chooseBot(view: View): Option | null {
  const candidates = view.options.filter((o) => o.action.kind !== "concede");
  if (!candidates.length) return null;
  if (view.phase === "mulligan") {
    const hand = view.players[view.seat].hand;
    const long = hand.filter((x) => x.definition.essence.duration >= 3).length;
    const cheap = hand.filter(
      (x) => x.definition.type === "Monstro" && (x.definition.cost ?? 0) <= 2,
    ).length;
    return (
      candidates.find(
        (o) => o.action.choice === (!long || !cheap ? "redraw" : "keep"),
      ) ?? candidates[0]
    );
  }
  // Pontuações usam apenas informação própria/pública. Efeitos/combate seguem a legalidade do mesmo motor humano.
  const useful = candidates.filter(
    (o) => o.score >= 0 || ["advance", "choose"].includes(o.action.kind),
  );
  return [...(useful.length ? useful : candidates)].sort(
    (a, b) => b.score - a.score || a.id.localeCompare(b.id),
  )[0];
}
