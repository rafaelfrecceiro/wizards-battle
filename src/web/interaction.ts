import type { Option } from "../engine/types";
/** A UI só oferece destinos que o motor já autorizou. */
export function destination(o: Option, seat: number = 0): string | null {
  const a = o.action;
  if (a.kind === "sacrifice") return `${seat}:sources`;
  if (a.kind === "cast")
    return a.row ? `${seat}:${a.row}` : o.group === "Conjurar" ? `${seat}:cast` : null;
  if (a.kind === "move") return `${seat}:${a.row}`;
  if (a.kind === "attack")
    return a.target === "mage" ? `${1-seat}:mage` : `piece:${a.target}`;
  return null;
}
export function dropOptions(
  options: Option[],
  uid: string,
  dest: string,
  cardType: string,
  seat: number = 0,
): Option[] {
  return options
    .filter((o) => o.uid === uid)
    .filter((o) => {
      if (o.action.kind === "cast" && !o.action.row) {
        const zone =
          cardType === "Encantamento"
            ? `${seat}:enchants`
            : cardType === "Prenúncio"
              ? `${seat}:veil`
              : `${seat}:cast`;
        return dest === zone;
      }
      return destination(o, seat) === dest;
    });
}
export const zoneHelp: Record<
  string,
  { name: string; subtitle: string; description: string; icon: string }
> = {
  front: {
    name: "Frente",
    subtitle: "Ataque e defesa",
    description:
      "Até 3 monstros. Eles atacam e protegem seu mago e suas fontes. O dano permanece entre turnos.",
    icon: "⚔",
  },
  back: {
    name: "Retaguarda",
    subtitle: "Suportes protegidos",
    description:
      "Até 3 monstros. Suportes funcionam aqui. Só podem ser atacados por monstros com Alcance; não atacam desta fileira.",
    icon: "♜",
  },
  sources: {
    name: "Fontes",
    subtitle: "Geração de energia",
    description:
      "Arraste uma carta da mão para sacrificá-la: ela gera energia e fornece presença enquanto durar. Um sacrifício por turno.",
    icon: "✦",
  },
  enchants: {
    name: "Encantamentos",
    subtitle: "Efeitos contínuos",
    description:
      "Até 3 encantamentos. Seus efeitos e gatilhos funcionam em jogo. Também contam presença da escola.",
    icon: "❂",
  },
  veil: {
    name: "Véu",
    subtitle: "Armadilhas ocultas",
    description:
      "Até 2 Prenúncios. Custam 1 energia para armar, sem exigir presença. Disparam no turno rival. Não contam presença.",
    icon: "◈",
  },
  ashes: {
    name: "Cinzas",
    subtitle: "Fontes e Prenúncios esgotados",
    description:
      "Fontes esgotadas e Prenúncios expirados chegam aqui. Algumas cartas gastam Cinzas como recurso.",
    icon: "◌",
  },
  discard: {
    name: "Descarte",
    subtitle: "Cartas usadas ou destruídas",
    description:
      "Monstros mortos, magias resolvidas e cartas descartadas chegam aqui. Algumas cartas recuperam monstros daqui.",
    icon: "▤",
  },
  deck: {
    name: "Baralho",
    subtitle: "Cartas para comprar",
    description:
      "Você compra uma carta por turno. Se precisar comprar do baralho vazio, perde 2 de Vida.",
    icon: "▥",
  },
  cast: {
    name: "Conjurar magia",
    subtitle: "Solte aqui para jogar",
    description:
      "A magia resolve e vai ao descarte. Se houver alvos, escolha-os no campo ou no painel de decisão.",
    icon: "✧",
  },
};
