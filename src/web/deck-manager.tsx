import React, { useEffect, useRef, useState } from "react";
import {
  catalogue,
  definitions,
  editions,
  printings,
  rarities,
} from "../catalog/catalogue";
import {
  inspectDeck,
  MAX_COPIES,
  normalizeDeck,
  rulesCardId,
  starterDecks,
  supportedCards,
  terrasDecks,
  isPilotCard,
} from "../engine/decks";
import type { DeckDefinition } from "../engine/types";
import type { Rarity } from "../catalog/types";
import { CardFace } from "./cards";
import { transferV04Decks, transferV05Decks } from "./deck-transfer";
import {
  DECK_STORAGE_KEY,
  importDecks,
  writeDeckLibrary,
  type DeckLibrary,
  type SavedDeck,
} from "./deck-storage";

export function DeckManager({
  library,
  onLibraryChange,
  onClose,
  onPlay,
  busy,
}: {
  library: DeckLibrary;
  onLibraryChange: (next: DeckLibrary) => void;
  onClose: () => void;
  onPlay: (deck: SavedDeck) => Promise<boolean>;
  busy: boolean;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DeckDefinition>({
    name: "Novo deck",
    cards: [],
  });
  const [baseline, setBaseline] = useState(JSON.stringify(draft));
  const [query, setQuery] = useState(""),
    [school, setSchool] = useState("all"),
    [rarity, setRarity] = useState("all"),
    [edition, setEdition] = useState("all");
  const [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [pending, setPending] = useState<(() => void) | null>(null);
  const [deleting, setDeleting] = useState(false);
  const panel = useRef<HTMLElement>(null),
    fileInput = useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(draft) !== baseline;
  const check = inspectDeck(draft);
  const normalizedQuery = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  const available = catalogue.printings.filter((p) => {
    const card = definitions[p.cardId];
    return (
      supportedCards.has(p.cardId) &&
      (school === "all" || card.schools.some((s) => s === school)) &&
      (rarity === "all" || p.rarity === rarity) &&
      (edition === "all" || p.edition === edition) &&
      normalizedQuery(
        `${card.name} ${card.type} ${card.text} ${p.id}`,
      ).includes(normalizedQuery(query))
    );
  });
  const quantity = (id: string) =>
    draft.cards
      .filter((c) => rulesCardId(c.id) === rulesCardId(id))
      .reduce((n, c) => n + c.copies, 0);
  const rarityTotals = { common: 0, uncommon: 0, rare: 0 };
  const curve = Array.from({ length: 8 }, () => 0);
  for (const entry of draft.cards) {
    rarityTotals[printings[entry.id].rarity] += entry.copies;
    const cost = definitions[rulesCardId(entry.id)].cost;
    if (cost !== null) curve[Math.min(7, cost)] += entry.copies;
  }
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    return () => previous?.focus();
  }, []);
  useEffect(() => {
    if (pending || deleting)
      panel.current
        ?.querySelector<HTMLButtonElement>(
          pending ? ".deck-unsaved button" : ".deck-delete button",
        )
        ?.focus();
  }, [pending, deleting]);
  function navigate(next: () => void) {
    if (busy) return;
    if (dirty) setPending(() => next);
    else next();
  }
  function edit(deck: DeckDefinition, id: string | null) {
    const next = structuredClone(deck);
    setDraft(next);
    setBaseline(JSON.stringify(next));
    setActiveId(id);
    setError("");
    setMessage("");
    setDeleting(false);
  }
  function changeCopies(id: string, delta: number) {
    if (delta > 0 && quantity(id) >= MAX_COPIES) return;
    setDraft((current) => {
      const entries = current.cards.map((c) => ({ ...c }));
      const entry = entries.find((c) => c.id === id);
      if (entry) entry.copies += delta;
      else if (delta > 0) entries.push({ id, copies: 1 });
      return { ...current, cards: entries.filter((c) => c.copies > 0) };
    });
    setMessage("");
  }
  function save(): SavedDeck | null {
    try {
      const safe = normalizeDeck(draft);
      const saved = {
        ...safe,
        id: activeId ?? crypto.randomUUID(),
        updatedAt: new Date().toISOString(),
      };
      const entries = library.decks.some((d) => d.id === saved.id)
        ? library.decks.map((d) => (d.id === saved.id ? saved : d))
        : [...library.decks, saved];
      const next = writeDeckLibrary(entries, library.revision);
      onLibraryChange(next);
      setActiveId(saved.id);
      setDraft(safe);
      setBaseline(JSON.stringify(safe));
      setError("");
      setMessage(
        inspectDeck(safe).ready
          ? "Deck salvo e pronto para jogar."
          : "Rascunho salvo. Complete os requisitos para jogar.",
      );
      return saved;
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }
  async function play() {
    const saved = save();
    if (saved && inspectDeck(saved).ready && !(await onPlay(saved)))
      setError(
        "Não foi possível iniciar o duelo. Confira a conexão com o servidor e tente novamente.",
      );
  }
  function remove() {
    if (!activeId) return;
    try {
      onLibraryChange(
        writeDeckLibrary(
          library.decks.filter((d) => d.id !== activeId),
          library.revision,
        ),
      );
      edit({ name: "Novo deck", cards: [] }, null);
      setMessage("Deck excluído.");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function exportBackup() {
    try {
      let content: string;
      if (library.error) content = localStorage.getItem(DECK_STORAGE_KEY) ?? "";
      else {
        let decks = [...library.decks];
        if (dirty) {
          const unsaved = {
            ...draft,
            name: draft.name.trim() || "Rascunho sem nome",
            id: activeId ?? crypto.randomUUID(),
            updatedAt: new Date().toISOString(),
          };
          decks = [...decks.filter((d) => d.id !== unsaved.id), unsaved];
        }
        content = JSON.stringify({ schemaVersion: 1, decks }, null, 2);
      }
      const url = URL.createObjectURL(
        new Blob([content], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "wizards-battle-decks.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Backup exportado. Inclui as alterações atuais do editor.");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function readBackup(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 1_000_000) throw Error("Arquivo de decks muito grande.");
      const incoming = importDecks(await file.text());
      onLibraryChange(
        writeDeckLibrary([...library.decks, ...incoming], library.revision),
      );
      setMessage(
        `${incoming.length} decks importados como novas listas. Seus decks anteriores foram mantidos.`,
      );
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
    if (fileInput.current) fileInput.current.value = "";
  }
  return (
    <div className="overlay deck-overlay" onClick={() => navigate(onClose)}>
      <section
        className="deck-manager"
        role="dialog"
        aria-modal="true"
        aria-label="Gerenciar decks"
        ref={panel}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            if (pending) setPending(null);
            else if (deleting) setDeleting(false);
            else navigate(onClose);
          }
          if (e.key === "Tab") {
            const scope = pending
              ? panel.current!.querySelector(".deck-unsaved")!
              : deleting
                ? panel.current!.querySelector(".deck-delete")!
                : panel.current!;
            const items = [
              ...scope.querySelectorAll<HTMLElement>(
                'button:not(:disabled), input:not([type="file"]), select, summary',
              ),
            ];
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
        <header className="deck-manager-header">
          <div>
            <span className="eyebrow">SUA ESTRATÉGIA, SUAS CARTAS</span>
            <h1>Meus decks</h1>
            <p>40 cartas · até 3 cópias por carta · salvos neste navegador</p>
            {draft.cards.some(c=>isPilotCard(c.id)) && <p>Este deck usa As Terras Despertas. A edição completa está disponível na preparação do duelo.</p>}
          </div>
          <button className="text-btn" onClick={() => navigate(onClose)}>
            Fechar gerenciador ×
          </button>
        </header>
        {(error || library.error) && (
          <p className="deck-error" role="alert">
            {error || library.error}
          </p>
        )}
        {message && (
          <p className="deck-message" role="status">
            {message}
          </p>
        )}
        {pending && (
          <div
            className="deck-unsaved"
            role="alertdialog"
            aria-label="Alterações não salvas"
          >
            <strong>Você tem alterações não salvas.</strong>
            <p>Salve o rascunho ou descarte as alterações para continuar.</p>
            <button
              onClick={() => {
                if (save()) {
                  const next = pending;
                  setPending(null);
                  next();
                }
              }}
            >
              Salvar e continuar
            </button>
            <button
              onClick={() => {
                const next = pending;
                setPending(null);
                next();
              }}
            >
              Descartar alterações
            </button>
            <button onClick={() => setPending(null)}>Continuar editando</button>
          </div>
        )}
        <div className="deck-manager-body" inert={pending ? true : undefined}>
          <nav className="deck-library" aria-label="Decks salvos">
            <button
              className="gold-btn"
              onClick={() =>
                navigate(() => edit({ name: "Novo deck", cards: [] }, null))
              }
            >
              ＋ Criar deck
            </button>
            <p>{library.decks.length} decks salvos</p>
            {library.decks.map((d) => (
              <button
                key={d.id}
                className={`saved-deck ${activeId === d.id ? "active" : ""}`}
                onClick={() => navigate(() => edit(d, d.id))}
              >
                <strong>{d.name}</strong>
                <small>
                  {inspectDeck(d).total}/40 ·{" "}
                  {inspectDeck(d).ready ? "Pronto para jogar" : "Rascunho"}
                </small>
              </button>
            ))}
            {!library.decks.length && (
              <p>Comece do zero ou copie um deck inicial.</p>
            )}
            <h2>Começar de um modelo</h2>
            {[...starterDecks,...terrasDecks].map((d) => (
              <button
                className="model-deck"
                key={d.name}
                onClick={() =>
                  navigate(() => {
                    edit({ ...d, name: `${d.name} — meu deck` }, null);
                    setBaseline("");
                  })
                }
              >
                Copiar {d.name}
              </button>
            ))}
            <div className="deck-backup">
              {location.origin === 'http://127.0.0.1:4182' && <button className="text-btn" disabled={!!library.error} onClick={async()=>{
                try {
                  const incoming=await transferV05Decks();
                  onLibraryChange(writeDeckLibrary([...library.decks,...incoming],library.revision));
                  setMessage(`${incoming.length} decks copiados da v0.5. As listas originais foram preservadas.`);setError('');
                } catch(error){setError((error as Error).message)}
              }}>Trazer decks da v0.5</button>}
              {location.origin === 'http://127.0.0.1:4181' && <button className="text-btn" disabled={!!library.error} onClick={async()=>{
                try {
                  const incoming=await transferV04Decks();
                  onLibraryChange(writeDeckLibrary([...library.decks,...incoming],library.revision));
                  setMessage(`${incoming.length} decks copiados da v0.4. As listas originais foram preservadas.`);setError('');
                } catch(error){setError((error as Error).message)}
              }}>Trazer decks da v0.4</button>}
              <button className="text-btn" onClick={exportBackup}>
                Exportar backup
              </button>
              <button
                className="text-btn"
                disabled={!!library.error}
                onClick={() => fileInput.current?.click()}
              >
                Importar backup
              </button>
              <input
                ref={fileInput}
                type="file"
                accept=".json,application/json"
                aria-label="Arquivo de decks"
                hidden
                onChange={(e) => void readBackup(e.target.files?.[0])}
              />
            </div>
          </nav>
          <section
            className="deck-pool"
            aria-label="Cartas disponíveis para montar deck"
          >
            <div className="deck-pool-filters">
              <label>
                Buscar carta
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nome, tipo ou efeito…"
                />
              </label>
              <label>
                Escola
                <select
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                >
                  <option value="all">Todas</option>
                  {["Chama", "Raiz", "Sombra", "Maré"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Raridade
                <select
                  value={rarity}
                  onChange={(e) => setRarity(e.target.value)}
                >
                  <option value="all">Todas</option>
                  {(Object.keys(rarities) as Rarity[]).map((r) => (
                    <option key={r} value={r}>
                      {rarities[r].name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Edição
                <select
                  value={edition}
                  onChange={(e) => setEdition(e.target.value)}
                >
                  <option value="all">Todas</option>
                  {catalogue.editions.map((e) => (
                    <option key={e.code} value={e.code}>
                      {e.code} — {editions[e.code].name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p>
              {available.length} cartas encontradas · {supportedCards.size}{" "}
              habilitadas para duelos
            </p>
            <div className="deck-pool-grid">
              {available.map((p) => {
                const card = definitions[p.cardId];
                return (
                  <article key={p.id}>
                    <CardFace id={p.id} name={card.name} loading="lazy" />
                    <strong>{card.name}</strong>
                    <small className={`rarity-${p.rarity}`}>
                      {rarities[p.rarity].name} · {card.type}
                    </small>
                    <small className="pool-card-stats">
                      {card.cost === null
                        ? "Armar: 1 energia"
                        : `Custo ${card.cost}`}
                      {card.type === "Monstro"
                        ? ` · ${card.force}/${card.vigor}`
                        : ""}
                    </small>
                    <p>{card.text || "Monstro sem efeito adicional."}</p>
                    <button
                      aria-label={`Adicionar ${card.name}`}
                      disabled={quantity(p.id) >= MAX_COPIES}
                      onClick={() => changeCopies(p.id, 1)}
                    >
                      ＋ Adicionar <small>{quantity(p.id)}/3</small>
                    </button>
                  </article>
                );
              })}
            </div>
            {!available.length && <p>Nenhuma carta corresponde aos filtros.</p>}
          </section>
          <section className="deck-editor" aria-label="Lista do deck">
            <label>
              Nome do deck
              <input
                maxLength={50}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <div className={`deck-count ${check.ready ? "ready" : ""}`}>
              <strong>
                {check.total}
                <small>/40 cartas</small>
              </strong>
              <span>
                {dirty
                  ? "Alterações não salvas"
                  : activeId
                    ? "Salvo"
                    : "Novo rascunho"}
              </span>
            </div>
            <div
              className="deck-rarities"
              aria-label="Distribuição de raridades"
            >
              {(Object.keys(rarities) as Rarity[]).map((r) => (
                <span key={r} className={`rarity-${r}`}>
                  {rarityTotals[r]}{" "}
                  {rarities[r].name.toLocaleLowerCase("pt-BR")}
                </span>
              ))}
            </div>
            <div className="deck-curve" aria-label="Curva de custos">
              {curve.map((count, i) => (
                <span
                  key={i}
                  title={`${i === 7 ? "7 ou mais" : i} de custo: ${count} cartas`}
                >
                  <i
                    style={{
                      height: `${Math.max(2, (count / Math.max(1, ...curve)) * 34)}px`,
                    }}
                  />
                  <small>{i === 7 ? "7+" : i}</small>
                </span>
              ))}
            </div>
            <div className="deck-entries">
              {[...draft.cards]
                .sort(
                  (a, b) =>
                    (definitions[rulesCardId(a.id)].cost ?? 1) -
                      (definitions[rulesCardId(b.id)].cost ?? 1) ||
                    definitions[rulesCardId(a.id)].name.localeCompare(
                      definitions[rulesCardId(b.id)].name,
                    ),
                )
                .map((entry) => {
                  const card = definitions[rulesCardId(entry.id)];
                  return (
                    <div className="deck-entry" key={entry.id}>
                      <span>{card.cost ?? "◇"}</span>
                      <div>
                        <strong>{card.name}</strong>
                        <small>{card.schools.join(" / ")}</small>
                      </div>
                      <button
                        aria-label={`Remover ${card.name}`}
                        onClick={() => changeCopies(entry.id, -1)}
                      >
                        −
                      </button>
                      <b>{entry.copies}</b>
                      <button
                        aria-label={`Mais uma cópia de ${card.name}`}
                        disabled={quantity(entry.id) >= MAX_COPIES}
                        onClick={() => changeCopies(entry.id, 1)}
                      >
                        ＋
                      </button>
                    </div>
                  );
                })}
              {!draft.cards.length && (
                <p className="empty-deck">
                  Adicione cartas do catálogo ao lado para montar sua
                  estratégia.
                </p>
              )}
            </div>
            <div className="deck-validity" aria-label="Validação do deck">
              {check.ready ? (
                <p>✓ Deck válido. Pronto para enfrentar o autômato.</p>
              ) : (
                check.issues.map((issue) => <p key={issue}>{issue}</p>)
              )}
            </div>
            <div className="deck-editor-actions">
              <button
                className="gold-btn"
                onClick={save}
                disabled={busy || !!library.error}
              >
                Salvar deck
              </button>
              <button
                className="gold-btn play-deck"
                onClick={() => void play()}
                disabled={
                  busy || !!library.error || !check.ready || !draft.name.trim()
                }
              >
                Jogar com este deck →
              </button>
              <div>
                <button
                  className="text-btn"
                  onClick={() =>
                    navigate(() => {
                      edit(
                        {
                          ...draft,
                          name: `${draft.name.slice(0, 40)} — cópia`,
                        },
                        null,
                      );
                      setBaseline("");
                    })
                  }
                >
                  Duplicar deck
                </button>
                <button
                  className="text-btn"
                  disabled={!activeId || busy}
                  onClick={() => setDeleting(true)}
                >
                  Excluir deck
                </button>
              </div>
            </div>
            {deleting && (
              <div
                className="deck-delete"
                role="alertdialog"
                aria-label="Excluir deck"
              >
                <p>Excluir “{draft.name}” do navegador?</p>
                <button onClick={remove}>Confirmar exclusão</button>
                <button onClick={() => setDeleting(false)}>Cancelar</button>
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
