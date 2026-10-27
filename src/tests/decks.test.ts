import { describe, it, expect } from "vitest";
import {
  normalizeDeck,
  playableDeck,
  inspectDeck,
  starterDecks,
} from "../engine/decks";
import {
  applyAction,
  createGame,
  replay,
  viewFor,
  VERSION,
} from "../engine/engine";
import { chooseBot } from "../engine/bot";
import { printings } from "../catalog/catalogue";
import identity from "../data/identity.json";
import * as historical from '../engine/legacy/engine-v09';
import type { Config, DeckDefinition } from "../engine/types";

function customDeck(): DeckDefinition {
  const deck = structuredClone(
    starterDecks.find((d) => d.name === "Queimada")!,
  );
  deck.name = "Oficina das três escolas";
  deck.cards.find((c) => c.id === "VES-002")!.copies--;
  deck.cards.push({ id: "VES-047", copies: 1 });
  return deck;
}
describe("Montagem e jogo com decks personalizados", () => {
  it("valida lista personalizada e permite três escolas sem inventar quotas de raridade", () => {
    expect(playableDeck(customDeck()).name).toBe("Oficina das três escolas");
    expect(inspectDeck(customDeck()).ready).toBe(true);
  });
  it("rascunho incompleto pode ser estruturado, mas não pode iniciar partida", () => {
    const deck = normalizeDeck({
      name: "Rascunho",
      cards: [{ id: "VES-002", copies: 3 }],
    });
    expect(inspectDeck(deck).total).toBe(3);
    expect(() => playableDeck(deck)).toThrow("40 cartas");
  });
  it.each([0, -1, 1.5, 4, "2", null])(
    "rejeita quantidade inválida %s",
    (copies) => {
      expect(() =>
        normalizeDeck({ name: "Teste", cards: [{ id: "VES-002", copies }] }),
      ).toThrow();
    },
  );
  it("agrega entradas e reimpressões para impedir contornar as três cópias", () => {
    expect(() =>
      normalizeDeck({
        name: "Teste",
        cards: [
          { id: "VES-002", copies: 2 },
          { id: "VES-002", copies: 2 },
        ],
      }),
    ).toThrow("Máximo de 3");
    printings["TST-001"] = {
      ...printings["VES-002"],
      id: "TST-001",
      edition: "TST",
    };
    try {
      expect(() =>
        normalizeDeck({
          name: "Teste",
          cards: [
            { id: "VES-002", copies: 2 },
            { id: "TST-001", copies: 2 },
          ],
        }),
      ).toThrow("todas as edições");
    } finally {
      delete printings["TST-001"];
    }
  });
  it("rejeita carta desconhecida e permite as cartas antes bloqueadas de VES", () => {
    expect(() =>
      normalizeDeck({ name: "Teste", cards: [{ id: "VES-999", copies: 1 }] }),
    ).toThrow("desconhecida");
    const deck = customDeck();
    deck.cards[0].id = "VES-018";
    expect(() => playableDeck(deck)).not.toThrow();
  });
  it("configuração guarda cópia completa imutável, sem depender da biblioteca editada depois", () => {
    const deck = customDeck();
    const game = createGame({
      seed: 721,
      decks: [deck.name, "Pira"],
      customDecks: [deck, null],
      variant: "base-0.3",
      first: 0,
    });
    deck.name = "Alterado depois";
    deck.cards.splice(0);
    expect(game.players[0].deckName).toBe("Oficina das três escolas");
    expect(inspectDeck(game.config.customDecks![0]!).total).toBe(40);
    expect(replay(game)).toEqual(game);
    expect(viewFor(game, 0)).not.toHaveProperty("config");
  });
  it("rejeita nome divergente e snapshot personalizado incompleto", () => {
    const config: Config = {
      seed: 721,
      decks: ["Nome divergente", "Pira"],
      customDecks: [customDeck(), null],
      variant: "base-0.3",
      first: 0,
    };
    expect(() => createGame(config)).toThrow("Nome do deck");
    config.decks[0] = customDeck().name;
    config.customDecks![0]!.cards.pop();
    expect(() => createGame(config)).toThrow("40 cartas");
  });
  it("completa partida personalizada com bot e replay idêntico", () => {
    const deck = customDeck();
    let game = createGame({
      seed: 812,
      decks: [deck.name, "Pira"],
      customDecks: [deck, null],
      variant: "fontes-estendidas",
      first: 0,
    });
    for (let step = 0; step < 2000 && game.winner === null; step++) {
      const owner =
        game.pending?.owner ??
        (game.phase === "mulligan" ? (game.kept[0] ? 1 : 0) : game.active);
      const option = chooseBot(viewFor(game, owner));
      expect(option).toBeDefined();
      game = applyAction(game, owner, option!.action);
      expect(
        game.players.flatMap((p) => Object.values(p.zones).flat()).length,
      ).toBe(80);
    }
    expect(game.winner).not.toBeNull();
    expect(replay(game)).toEqual(game);
  });
  it("mantém replay de preset 0.2 e rejeita usar versão antiga com lista personalizada", () => {
    const oldVersion = `wb-0.2.0/rules-0.3-trigger-order/${identity.cardsSha256.slice(0, 12)}/${identity.decksSha256.slice(0, 12)}`;
    const old = historical.createGame({
      seed: 20,
      decks: ["Pira", "Queimada"],
      variant: "base-0.3",
      first: 0,
    });
    old.version = oldVersion;
    expect(replay(old)).toEqual(old);
    const custom = createGame({
      ...old.config,
      decks: [customDeck().name, "Pira"],
      customDecks: [customDeck(), null],
    });
    expect(custom.version).toBe(VERSION);
    custom.version = oldVersion;
    expect(() => replay(custom)).toThrow("outra versão");
  });
});
