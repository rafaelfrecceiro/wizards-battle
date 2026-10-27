import type { PlayerView, VisiblePiece } from "../engine/types";

const abilities: Record<string, { icon: string; description: string }> = {
  Alcance: {
    icon: "➶",
    description:
      "Pode atacar monstros na retaguarda inimiga. Guardiões na frente ainda têm prioridade.",
  },
  Ímpeto: {
    icon: "ϟ",
    description: "Pode atacar no turno em que entra na frente.",
  },
  Guardião: {
    icon: "♜",
    description:
      "Enquanto estiver na frente, deve ser alvo dos ataques antes dos outros monstros.",
  },
  Emboscada: {
    icon: "◇",
    description:
      "Entra na retaguarda. Pode avançar sem pagar energia, usando o reposicionamento do turno.",
  },
};

/** Explica apenas habilidades já confirmadas pelo servidor, com fontes públicas. */
export function keywordDetails(player: PlayerView, piece: VisiblePiece) {
  return piece.keywords.map((name) => {
    const sources: string[] = [];
    if (piece.definition.keywords.includes(name))
      sources.push("Da própria carta");
    if (name === "Ímpeto" && piece.haste)
      sources.push("Concedido por um efeito temporário");
    if (
      name === "Guardião" &&
      piece.definition.fx.conditional_guard !== undefined
    )
      sources.push("Da própria carta — condição de Cinzas ativa");
    if (player.front.some((x) => x.uid === piece.uid)) {
      for (const [zone, cards] of [
        ["retaguarda", player.back],
        ["encantamentos", player.enchants],
      ] as const) {
        for (const source of cards) {
          const aura = source.definition.fx.aura;
          if (
            aura?.keyword === name &&
            piece.definition.schools.includes(aura.school)
          )
            sources.push(`Concedido por ${source.definition.name} (${zone})`);
        }
      }
    }
    return {
      name,
      icon: abilities[name]?.icon ?? "◇",
      description:
        abilities[name]?.description ??
        "Habilidade ativa confirmada pelo motor.",
      sources: sources.length ? sources : ["Efeito em jogo"],
    };
  });
}

export type PreviewAnchor = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** A carta ampliada ocupa a posição da carta original, respeitando a janela. */
export function localPreviewPosition(
  anchor: PreviewAnchor,
  panel: { width: number; height: number },
  viewport: { width: number; height: number },
) {
  const margin = 16;
  const minTop = Math.min(
    80,
    Math.max(margin, viewport.height - panel.height - margin),
  );
  return {
    left: Math.max(
      margin,
      Math.min(
        anchor.left + anchor.width / 2 - panel.width / 2,
        viewport.width - panel.width - margin,
      ),
    ),
    top: Math.max(
      minTop,
      Math.min(
        anchor.top + anchor.height / 2 - panel.height / 2,
        viewport.height - panel.height - margin,
      ),
    ),
  };
}

/** Mantém a ampliação junto do mouse e troca de lado quando falta espaço. */
export function pointerPreviewPosition(
  pointer: { x: number; y: number },
  panel: { width: number; height: number },
  viewport: { width: number; height: number },
) {
  const margin = 16,
    gap = 20;
  const right = pointer.x + gap;
  const left =
    right + panel.width <= viewport.width - margin
      ? right
      : pointer.x - gap - panel.width;
  return {
    left: Math.max(
      margin,
      Math.min(left, viewport.width - panel.width - margin),
    ),
    top: Math.max(
      margin,
      Math.min(
        pointer.y - panel.height / 2,
        viewport.height - panel.height - margin,
      ),
    ),
  };
}
