import { normalizeDeck } from "../engine/decks";
import type { DeckDefinition } from "../engine/types";

export interface SavedDeck extends DeckDefinition {
  id: string;
  updatedAt: string;
}
export interface DeckLibrary {
  revision: number;
  decks: SavedDeck[];
  error?: string;
}
export const DECK_STORAGE_KEY = "wb-decks-v1";
export function readDeckLibrary(storage: Storage = localStorage): DeckLibrary {
  try {
    const raw = storage.getItem(DECK_STORAGE_KEY);
    if (!raw) return { revision: 0, decks: [] };
    const data = JSON.parse(raw);
    if (
      data.schemaVersion !== 1 ||
      !Number.isSafeInteger(data.revision) ||
      data.revision < 0 ||
      !Array.isArray(data.decks) ||
      data.decks.length > 100
    )
      throw Error("Formato de biblioteca inválido.");
    const ids = new Set<string>();
    const decks = data.decks.map((item: SavedDeck) => {
      if (
        typeof item?.id !== "string" ||
        !item.id ||
        item.id.length > 100 ||
        ids.has(item.id) ||
        typeof item.updatedAt !== "string"
      )
        throw Error("Identificador de deck inválido.");
      ids.add(item.id);
      return { ...normalizeDeck(item), id: item.id, updatedAt: item.updatedAt };
    });
    return { revision: data.revision, decks };
  } catch {
    return {
      revision: -1,
      decks: [],
      error:
        "Não foi possível ler seus decks. Os dados locais foram preservados; exporte o backup antes de reparar o armazenamento.",
    };
  }
}
export function writeDeckLibrary(
  decks: SavedDeck[],
  expectedRevision: number,
  storage: Storage = localStorage,
): DeckLibrary {
  const current = readDeckLibrary(storage);
  if (current.error) throw Error(current.error);
  if (current.revision !== expectedRevision)
    throw Error(
      "Seus decks mudaram em outra aba. Reabra o gerenciador antes de salvar para evitar sobrescrever alterações.",
    );
  if (decks.length > 100)
    throw Error(
      "Limite de 100 decks locais atingido. Exporte um backup antes de remover listas antigas.",
    );
  const ids = new Set<string>();
  const safe = decks.map((deck) => {
    if (!deck.id || ids.has(deck.id)) throw Error("ID de deck duplicado.");
    ids.add(deck.id);
    return { ...normalizeDeck(deck), id: deck.id, updatedAt: deck.updatedAt };
  });
  try {
    storage.setItem(
      DECK_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        revision: expectedRevision + 1,
        decks: safe,
      }),
    );
  } catch {
    throw Error(
      "Não foi possível salvar neste navegador. Suas alterações continuam no editor; exporte um backup e tente novamente.",
    );
  }
  return { revision: expectedRevision + 1, decks: safe };
}
export function importDecks(raw: string): SavedDeck[] {
  if (raw.length > 1_000_000) throw Error("Arquivo de decks muito grande.");
  let data: { schemaVersion?: number; decks?: unknown[] };
  try {
    data = JSON.parse(raw);
  } catch {
    throw Error("O arquivo não é um JSON válido.");
  }
  if (
    data?.schemaVersion !== 1 ||
    !Array.isArray(data.decks) ||
    data.decks.length > 100
  )
    throw Error("Backup de decks incompatível.");
  return data.decks.map((item) => ({
    ...normalizeDeck(item),
    id: crypto.randomUUID(),
    updatedAt: new Date().toISOString(),
  }));
}
