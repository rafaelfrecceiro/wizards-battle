import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import {
  catalogue,
  definitions,
  printings,
  rarityCounts,
  validateCatalogue,
} from "../catalog/catalogue";
import type { Catalogue } from "../catalog/types";
import lists from "../data/baralhos.json";
import identity from "../data/identity.json";

describe("Catálogo TCG e identidades de edição", () => {
  it("80 impressões completas de VES, numeração única e classificação inicial 40/28/12", () => {
    expect(() =>
      validateCatalogue(catalogue, new Set(Object.keys(definitions))),
    ).not.toThrow();
    const ves=catalogue.printings.filter(p=>p.edition==='VES');
    expect(ves).toHaveLength(80);
    expect(catalogue.classificationStatus).toBe("initial-review");
    expect(rarityCounts(ves)).toEqual({ common: 40, uncommon: 28, rare: 12 });
    expect(
      ves.map((p) => p.number).sort((a, b) => a - b),
    ).toEqual(Array.from({ length: 80 }, (_, i) => i + 1));
    for (const p of catalogue.printings)
      expect(existsSync(`public/cartas/${p.id}.png`)).toBe(true);
  });
  it("todos os seis decks mantêm 40 cartas e misturam as três raridades", () => {
    expect(lists).toHaveLength(6);
    for (const deck of lists) {
      const copies = deck.cards.flatMap((entry) =>
        Array.from({ length: entry.copies }, () => printings[entry.id]),
      );
      expect(copies.every(Boolean)).toBe(true);
      expect(copies).toHaveLength(40);
      const counts = rarityCounts(copies);
      expect(counts.common, deck.name).toBeGreaterThan(0);
      expect(counts.uncommon, deck.name).toBeGreaterThan(0);
      expect(counts.rare, deck.name).toBeGreaterThan(0);
    }
  });
  it("aceita nova edição e reimpressão da mesma identidade sem duplicar regras", () => {
    const next = structuredClone(catalogue);
    next.editions.push({
      code: "TST",
      name: "Edição de teste",
      order: 2,
      cardCount: 1,
      symbol: "test-only",
      theme: "Teste isolado",
      mechanics: [],
    });
    next.printings.push({
      id: "TST-001",
      cardId: "VES-002",
      edition: "TST",
      number: 1,
      rarity: "uncommon",
      designNote: "Reimpressão de teste, sem mudar regras.",
    });
    expect(() =>
      validateCatalogue(next, new Set(Object.keys(definitions))),
    ).not.toThrow();
    expect(next.printings.filter((p) => p.cardId === "VES-002")).toHaveLength(
      2,
    );
    expect(Object.keys(definitions).filter(id=>id.startsWith('VES-'))).toHaveLength(80);
  });
  it.each([
    "edição ausente",
    "número duplicado",
    "carta desconhecida",
    "raridade inválida",
  ])("rejeita catálogo com %s", (error) => {
    const broken = structuredClone(catalogue);
    if (error === "edição ausente") broken.printings[0].edition = "XXX";
    if (error === "número duplicado") broken.printings[0].number = 2;
    if (error === "carta desconhecida") broken.printings[0].cardId = "VES-999";
    if (error === "raridade inválida")
      (broken.printings[0] as { rarity: string }).rarity = "mythic";
    expect(() =>
      validateCatalogue(broken as Catalogue, new Set(Object.keys(definitions))),
    ).toThrow();
  });
  it("a classificação editorial não altera os snapshots das regras ou decks", () => {
    expect(
      createHash("sha256")
        .update(readFileSync("data/cartas.json"))
        .digest("hex"),
    ).toBe(identity.cardsSha256);
    expect(
      createHash("sha256")
        .update(readFileSync("data/baralhos.json"))
        .digest("hex"),
    ).toBe(identity.decksSha256);
  });
});
