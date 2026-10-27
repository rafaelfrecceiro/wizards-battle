import React, { useEffect, useRef, useState } from "react";
import {
  catalogue,
  definitions,
  editions,
  rarities,
  rarityCounts,
  printings,
} from "../catalog/catalogue";
import type { Rarity } from "../catalog/types";
import lists from "../data/baralhos.json";
import terrasLists from "../data/terras-decks.json";
import { CardFace, EditionLine, EditionSymbol } from "./cards";

export function Collection({ onClose }: { onClose: () => void }) {
  const [edition, setEdition] = useState("TDP"),
    [rarity, setRarity] = useState<Rarity | "all">("all");
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState(catalogue.printings[0]?.id);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    return () => previous?.focus();
  }, []);
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  const visible = catalogue.printings.filter((p) => {
    const card = definitions[p.cardId];
    return (
      (edition === "all" || p.edition === edition) &&
      (rarity === "all" || p.rarity === rarity) &&
      normalize(
        `${card.name} ${card.type} ${card.schools.join(" ")} ${card.text} ${p.id}`,
      ).includes(normalize(query))
    );
  });
  const chosen = visible.find((p) => p.id === selected) ?? visible[0];
  const card = chosen && definitions[chosen.cardId];
  const displayedEdition = editions[edition] ?? catalogue.editions[0];
  const displayedDecks = edition === 'TDP' ? terrasLists : edition === 'VES' ? lists : [...lists,...terrasLists];
  const counts = rarityCounts(
    catalogue.printings.filter(
      (p) => edition === "all" || p.edition === edition,
    ),
  );
  return (
    <div className="overlay collection-overlay" onClick={onClose}>
      <section
        className="collection-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Coleção de cartas"
        tabIndex={-1}
        ref={panel}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
          }
          if (e.key === "Tab") {
            const items = [
              ...panel.current!.querySelectorAll<HTMLElement>(
                'button, input, select, [tabindex="0"]',
              ),
            ].filter((x) => !x.hasAttribute("disabled"));
            const first = items[0],
              last = items.at(-1);
            if (
              e.shiftKey &&
              (document.activeElement === first ||
                document.activeElement === panel.current)
            ) {
              e.preventDefault();
              last?.focus();
            } else if (
              !e.shiftKey &&
              (document.activeElement === last ||
                document.activeElement === panel.current)
            ) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <header className="collection-header">
          <div>
            <span className="eyebrow">EDIÇÕES DE WIZARDS BATTLE</span>
            <h1>Coleção</h1>
            <p>
              {catalogue.printings.length} cartas · {catalogue.editions.length}{" "}
              {catalogue.editions.length === 1 ? "edição" : "edições"}
            </p>
          </div>
          <button
            className="text-btn"
            onClick={onClose}
            aria-label="Fechar coleção"
          >
            Voltar ×
          </button>
        </header>
        <div className="edition-banner">
          <EditionSymbol edition={displayedEdition.code} rarity="rare" />
          <div>
            <strong>
              {edition === 'all' ? 'Véspera + As Terras Despertas' : `${String(displayedEdition.order).padStart(2, "0")} / ${displayedEdition.name}`}
            </strong>
            <p>{edition === 'all' ? 'Duas edições para combinar em seus decks.' : displayedEdition.theme}</p>
            <small>
              {edition === 'all' ? catalogue.printings.length : displayedEdition.cardCount} cartas · {edition === 'all' ? 'Duas edições completas' : displayedEdition.code === 'TDP' ? 'Edição completa' : 'O Coração de Véspera'}
            </small>
          </div>
        </div>
        <div className="collection-filters">
          <label>
            Buscar carta
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nome, escola, tipo ou efeito…"
            />
          </label>
          <label>
            Edição
            <select
              value={edition}
              onChange={(e) => setEdition(e.target.value)}
            >
              <option value="all">Todas as edições</option>
              {catalogue.editions.map((e) => (
                <option key={e.code} value={e.code}>
                  {e.code} — {e.name}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend>Raridade</legend>
            <button
              type="button"
              aria-pressed={rarity === "all"}
              onClick={() => setRarity("all")}
            >
              Todas
            </button>
            {(Object.keys(rarities) as Rarity[]).map((r) => (
              <button
                type="button"
                key={r}
                className={`rarity-${r}`}
                aria-pressed={rarity === r}
                onClick={() => setRarity(r)}
              >
                {rarities[r].name} <small>{counts[r]}</small>
              </button>
            ))}
          </fieldset>
        </div>
        <div className="collection-body">
          <section
            className="collection-results"
            aria-label="Cartas da coleção"
          >
            <p role="status">
              {visible.length}{" "}
              {visible.length === 1 ? "carta encontrada" : "cartas encontradas"}
              . Todas disponíveis para montar decks.
            </p>
            <div className="collection-grid">
              {visible.map((p) => (
                <button
                  key={p.id}
                  className={`collection-card ${chosen?.id === p.id ? "selected" : ""}`}
                  aria-label={`Consultar ${definitions[p.cardId].name}`}
                  aria-pressed={chosen?.id === p.id}
                  onClick={() => setSelected(p.id)}
                >
                  <CardFace
                    id={p.id}
                    name={definitions[p.cardId].name}
                    loading="lazy"
                  />
                  <strong>{definitions[p.cardId].name}</strong>
                  <small className={`rarity-${p.rarity}`}>
                    {p.id} · {rarities[p.rarity].name}
                  </small>
                </button>
              ))}
            </div>
            {!visible.length && <p>Nenhuma carta corresponde aos filtros.</p>}
          </section>
          {chosen && card && (
            <aside
              className="collection-detail"
              aria-label={`Detalhes de ${card.name}`}
            >
              <CardFace id={chosen.id} name={card.name} />
              <EditionLine id={chosen.id} />
              <h2>{card.name}</h2>
              <p>{card.text || "Monstro sem efeito adicional."}</p>
              {(card.text.includes('Ressonância') || card.fx.enchant_end?.some(f=>f.presence_min)) && <p>Ressonância verifica a Presença atual, separada da Escola permanente. A própria carta no campo pode contar.</p>}
              <p className="catalogue-card-type">
                {card.type} · {card.schools.join(" / ")}
                {card.cost !== null ? ` · Custo ${card.cost}` : ""}
              </p>
              <h3>Função na edição</h3>
              <p>{chosen.designNote}</p>
              <small>
                Raridade não altera o texto ou os atributos da carta.
              </small>
            </aside>
          )}
        </div>
        <details className="collection-decks">
          <summary>Composição de raridades dos {displayedDecks.length === 6 ? 'seis' : 'doze'} decks de exemplo</summary>
          <p>
            40 cartas por deck. A mistura vem das funções e sinergias; não há
            cota obrigatória por raridade.
          </p>
          <div>
            {displayedDecks.map((deck) => {
              const entries = deck.cards.flatMap((entry) =>
                Array.from({ length: entry.copies }, () => printings[entry.id]),
              );
              const totals = rarityCounts(entries);
              return (
                <p key={deck.name}>
                  <strong>{deck.name}</strong>
                  <span>
                    {totals.common} comuns · {totals.uncommon} incomuns ·{" "}
                    {totals.rare} raras
                  </span>
                </p>
              );
            })}
          </div>
        </details>
      </section>
    </div>
  );
}
