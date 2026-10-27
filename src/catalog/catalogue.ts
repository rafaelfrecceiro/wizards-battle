import data from "../data/colecao.json";
import snapshot from "../data/cartas.json";
import pilot from "../data/terras-despertas.json";
import pilotCatalogue from "../data/terras-edicao.json";
import type { Card } from "../engine/types";
import type { Catalogue, Rarity } from "./types";

export const rarities: Record<
  Rarity,
  { name: string; code: string; role: string }
> = {
  common: {
    name: "Comum",
    code: "C",
    role: "Base da curva, respostas diretas e peças essenciais.",
  },
  uncommon: {
    name: "Incomum",
    code: "I",
    role: "Sinergias, suportes e peças que conectam o deck.",
  },
  rare: {
    name: "Rara",
    code: "R",
    role: "Cartas marcantes, motores e efeitos de maior impacto.",
  },
};
export const catalogue = {
  ...data,
  editions: [...data.editions, pilotCatalogue.edition],
  printings: [...data.printings, ...pilotCatalogue.printings],
} as Catalogue;
export const definitions = Object.fromEntries(
  ([...snapshot.cards, ...pilot.cards] as unknown as Card[]).map((c) => [c.id, c]),
);
export const editions = Object.fromEntries(
  catalogue.editions.map((e) => [e.code, e]),
);
export const printings = Object.fromEntries(
  catalogue.printings.map((p) => [p.id, p]),
);

export function validateCatalogue(
  document: Catalogue,
  knownCards: Set<string>,
) {
  if (document.schemaVersion !== 1)
    throw Error("Versão do catálogo desconhecida.");
  if (!["initial-review", "approved"].includes(document.classificationStatus))
    throw Error("Estado de classificação inválido.");
  const codes = new Set<string>(),
    ids = new Set<string>(),
    numbers = new Set<string>();
  for (const e of document.editions) {
    if (
      !/^[A-Z0-9]{2,6}$/.test(e.code) ||
      codes.has(e.code) ||
      !e.name ||
      !e.symbol ||
      !Number.isInteger(e.cardCount) ||
      e.cardCount < 1
    )
      throw Error(`Edição inválida ou duplicada: ${e.code}`);
    codes.add(e.code);
  }
  for (const p of document.printings) {
    const edition = document.editions.find((e) => e.code === p.edition);
    const key = `${p.edition}:${p.number}`;
    if (
      !edition ||
      !knownCards.has(p.cardId) ||
      ids.has(p.id) ||
      numbers.has(key) ||
      !p.id ||
      !Number.isInteger(p.number) ||
      p.number < 1 ||
      p.number > edition.cardCount ||
      !Object.hasOwn(rarities, p.rarity) ||
      !p.designNote
    )
      throw Error(`Impressão inválida ou duplicada: ${p.id}`);
    ids.add(p.id);
    numbers.add(key);
  }
  for (const e of document.editions)
    if (
      document.printings.filter((p) => p.edition === e.code).length !==
      e.cardCount
    )
      throw Error(`Contagem incompleta da edição ${e.code}`);
}
validateCatalogue(catalogue, new Set(Object.keys(definitions)));

export function rarityCounts(entries = catalogue.printings) {
  return entries.reduce<Record<Rarity, number>>(
    (counts, p) => {
      counts[p.rarity]++;
      return counts;
    },
    { common: 0, uncommon: 0, rare: 0 },
  );
}
