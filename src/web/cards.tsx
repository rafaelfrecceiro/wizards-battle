import React from "react";
import { editions, printings, rarities } from "../catalog/catalogue";

export function EditionSymbol({
  edition,
  rarity,
}: {
  edition: string;
  rarity: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={`edition-symbol rarity-${rarity}`}
      aria-hidden="true"
      focusable="false"
    >
      {editions[edition]?.symbol === "vespera-heart" ? (
        <>
          <path
            className="symbol-metal"
            d="M12 2h8l1 4 4 2 4-1 3 7-3 3-1 5-5 1-3 6h-8l-3-6-5-1-1-5-3-3 3-7 4 1 4-2z"
          />
          <path
            className="symbol-heart"
            d="M16 23 8 15c-5-6 3-12 8-6 5-6 13 0 8 6z"
          />
          <path className="symbol-pulse" d="m17 10-4 6h5l-3 6" />
        </>
      ) : editions[edition]?.symbol === 'terras-awakening' ? (
        <g data-symbol="terras-awakening">
          <circle className="symbol-metal" cx="16" cy="9" r="6"/>
          <path className="symbol-metal" d="M2 21 10 10l6 9 6-9 8 11-6 2H8z"/>
          <path className="symbol-pulse" d="M16 19v11m0-5-7 4m7-4 7 4m-10-7-7 2m13-2 7 2"/>
          <path className="symbol-heart" d="m10 15 3 5H7zm12 0 3 5h-6z"/>
        </g>
      ) : (
        <text x="16" y="20" textAnchor="middle" fontSize="10">
          {edition}
        </text>
      )}
    </svg>
  );
}

export function EditionMark({ id }: { id: string }) {
  const printing = printings[id];
  if (!printing) return null;
  const edition = editions[printing.edition],
    rarity = rarities[printing.rarity];
  const label = `${edition.name} · ${printing.edition} ${String(printing.number).padStart(3, "0")}/${edition.cardCount} · ${rarity.name}`;
  return (
    <span
      className={`edition-mark rarity-${printing.rarity}`}
      role="img"
      aria-label={label}
      title={label}
    >
      <EditionSymbol edition={printing.edition} rarity={printing.rarity} />
    </span>
  );
}

export function EditionLine({ id }: { id: string }) {
  const printing = printings[id];
  if (!printing) return null;
  const edition = editions[printing.edition],
    rarity = rarities[printing.rarity];
  return (
    <div className={`edition-line rarity-${printing.rarity}`}>
      <EditionSymbol edition={printing.edition} rarity={printing.rarity} />
      <span>
        <strong>{edition.name}</strong>
        <small>
          {edition.experimental ? 'EXPERIMENTAL · ' : ''}
          {printing.edition} · {String(printing.number).padStart(3, "0")}/
          {String(edition.cardCount).padStart(3, "0")} · {rarity.name} (
          {rarity.code})
        </small>
      </span>
    </div>
  );
}

export function CardFace({
  id,
  name,
  onLoad,
  loading,
}: {
  id: string;
  name: string;
  onLoad?: () => void;
  loading?: "lazy";
}) {
  return (
    <span
      className="card-face"
      aria-hidden={name ? undefined : true}
      data-edition={printings[id]?.edition}
      data-rarity={printings[id]?.rarity}
      title={printings[id]?.edition === 'TDP' ? `As Terras Despertas · ${printings[id].number}/60` : undefined}
    >
      <img
        src={`/cartas/${id}.png`}
        alt={name}
        draggable={false}
        onLoad={onLoad}
        loading={loading}
      />
      {printings[id]?.edition !== 'TDP' && <EditionMark id={id} />}
    </span>
  );
}
