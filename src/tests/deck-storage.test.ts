// @vitest-environment jsdom
import { beforeEach, describe, it, expect, vi } from "vitest";
import {
  DECK_STORAGE_KEY,
  readDeckLibrary,
  writeDeckLibrary,
  importDecks,
  type SavedDeck,
} from "../web/deck-storage";
import { starterDecks } from "../engine/decks";
const saved = (): SavedDeck => ({
  ...structuredClone(starterDecks[0]),
  id: "local-deck",
  updatedAt: "2026-10-23T00:00:00Z",
});
beforeEach(() => localStorage.clear());
describe("Persistência da biblioteca de decks", () => {
  it("salva e recarrega lista e nome, depois edita, duplica e exclui por identidade estável", () => {
    let library = writeDeckLibrary([saved()], 0);
    expect(readDeckLibrary()).toEqual(library);
    const copy = { ...saved(), id: "copy", name: "Minha cópia" };
    library = writeDeckLibrary(
      [{ ...saved(), name: "Renomeado" }, copy],
      library.revision,
    );
    expect(readDeckLibrary().decks.map((d) => d.name)).toEqual([
      "Renomeado",
      "Minha cópia",
    ]);
    library = writeDeckLibrary([copy], library.revision);
    expect(readDeckLibrary()).toEqual(library);
  });
  it("preserva dados corrompidos e impede sobrescrita automática", () => {
    localStorage.setItem(DECK_STORAGE_KEY, "{quebrado");
    expect(readDeckLibrary().error).toBeTruthy();
    expect(() => writeDeckLibrary([saved()], -1)).toThrow();
    expect(localStorage.getItem(DECK_STORAGE_KEY)).toBe("{quebrado");
  });
  it("erro de armazenamento não remove biblioteca anterior", () => {
    writeDeckLibrary([saved()], 0);
    const before = localStorage.getItem(DECK_STORAGE_KEY);
    const set = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Quota");
      });
    try {
      expect(() => writeDeckLibrary([], 1)).toThrow("alterações continuam");
    } finally {
      set.mockRestore();
    }
    expect(localStorage.getItem(DECK_STORAGE_KEY)).toBe(before);
  });
  it("detecta revisão alterada antes do salvamento", () => {
    const old = readDeckLibrary();
    writeDeckLibrary([saved()], old.revision);
    expect(() => writeDeckLibrary([], old.revision)).toThrow("outra aba");
    expect(readDeckLibrary().decks).toHaveLength(1);
  });
  it("importa backup com IDs novos e suporta rascunhos, sem executar conteúdo", () => {
    const raw = JSON.stringify({
      schemaVersion: 1,
      decks: [saved(), { name: "Rascunho <script>", cards: [] }],
    });
    const entries = importDecks(raw);
    expect(entries).toHaveLength(2);
    expect(entries[0].id).not.toBe("local-deck");
    expect(entries[0].cards).toEqual(saved().cards);
    expect(entries[1].cards).toHaveLength(0);
  });
  it("rejeita backups inválidos e quantidades ilegais", () => {
    expect(() => importDecks("quebrado")).toThrow("JSON");
    expect(() =>
      importDecks(JSON.stringify({ schemaVersion: 2, decks: [] })),
    ).toThrow("incompatível");
    expect(() =>
      importDecks(
        JSON.stringify({
          schemaVersion: 1,
          decks: [{ name: "Inválido", cards: [{ id: "VES-002", copies: 4 }] }],
        }),
      ),
    ).toThrow();
  });
});
