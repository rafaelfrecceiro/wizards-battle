import lists from "../../data/baralhos.json";
import pilotLists from "../../data/terras-baralhos.json";
import { definitions, printings } from "./catalogue-v08";
import type { CardPool, DeckDefinition } from "../types";

export const DECK_SIZE = 40;
export const MAX_COPIES = 3;
export const starterDecks: DeckDefinition[] = lists;
export const pilotDecks: DeckDefinition[] = pilotLists;
export const cardPools: Record<Exclude<CardPool, "terras-v1">, string> = {
  ves: "Véspera — 80 cartas",
  "terras-pilot-v1": "Experimental — Véspera + 12 de As Terras Despertas",
};
export function parseCardPool(value: unknown): CardPool {
  if (value === undefined) return "ves";
  if (value !== "ves" && value !== "terras-pilot-v1") throw Error("Conjunto de cartas inválido.");
  return value;
}
export const availableDecks = (pool: CardPool = "ves") =>
  pool === "terras-pilot-v1" ? [...starterDecks, ...pilotDecks] : starterDecks;
export const isPilotCard = (id: string) => printings[rulesCardId(id)]?.edition === "TDP";
export const supportedCards = new Set(Object.keys(definitions));
export function rulesCardId(id: string) {
  return printings[id]?.cardId ?? id;
}

/** Validação de estrutura, também para rascunhos. IDs nunca vêm do cliente sem conferência. */
export function normalizeDeck(input: unknown): DeckDefinition {
  if (!input || typeof input !== "object") throw Error("Deck inválido.");
  const value = input as Record<string, unknown>;
  if (
    typeof value.name !== "string" ||
    !value.name.trim() ||
    value.name.trim().length > 50
  )
    throw Error("O deck precisa de um nome de até 50 caracteres.");
  if (!Array.isArray(value.cards) || value.cards.length > 240)
    throw Error("Lista de cartas inválida.");
  const entries = new Map<string, number>(),
    identities = new Map<string, number>();
  for (const raw of value.cards) {
    if (!raw || typeof raw !== "object")
      throw Error("Entrada de carta inválida.");
    const entry = raw as Record<string, unknown>;
    if (
      typeof entry.id !== "string" ||
      !Object.hasOwn(definitions, rulesCardId(entry.id))
    )
      throw Error("Carta desconhecida no deck.");
    if (
      !Number.isSafeInteger(entry.copies) ||
      (entry.copies as number) < 1 ||
      (entry.copies as number) > MAX_COPIES
    )
      throw Error("Cada carta deve ter de 1 a 3 cópias.");
    const copies = entry.copies as number,
      identity = rulesCardId(entry.id);
    identities.set(identity, (identities.get(identity) ?? 0) + copies);
    if (identities.get(identity)! > MAX_COPIES)
      throw Error(
        `Máximo de 3 cópias de ${definitions[identity].name}, somando todas as edições.`,
      );
    entries.set(entry.id, (entries.get(entry.id) ?? 0) + copies);
  }
  return {
    name: value.name.trim(),
    cards: [...entries].map(([id, copies]) => ({ id, copies })),
  };
}
export function inspectDeck(deck: DeckDefinition, pool?: CardPool) {
  const total = deck.cards.reduce((sum, c) => sum + c.copies, 0);
  const issues: string[] = [];
  if (total !== DECK_SIZE)
    issues.push(`O deck precisa de 40 cartas; agora tem ${total}.`);
  for (const entry of deck.cards)
    if (!supportedCards.has(rulesCardId(entry.id)))
      issues.push(
        `${definitions[rulesCardId(entry.id)]?.name ?? entry.id}: ainda não habilitada no motor.`,
      );
    else if (pool === "ves" && isPilotCard(entry.id))
      issues.push(`${definitions[rulesCardId(entry.id)].name}: selecione o conjunto experimental As Terras Despertas.`);
  return { total, issues, ready: issues.length === 0 };
}
export function playableDeck(input: unknown, pool: CardPool = "ves"): DeckDefinition {
  const deck = normalizeDeck(input),
    check = inspectDeck(deck, pool);
  if (!check.ready) throw Error(check.issues.join(" "));
  return deck;
}
