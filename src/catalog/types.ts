export type Rarity = "common" | "uncommon" | "rare";
export interface Edition {
  code: string;
  name: string;
  order: number;
  cardCount: number;
  symbol: string;
  theme: string;
  mechanics: string[];
  experimental?: boolean;
}
/** A impressão pertence à edição; a identidade de regras pode ser reimpressa. */
export interface Printing {
  id: string;
  cardId: string;
  edition: string;
  number: number;
  rarity: Rarity;
  designNote: string;
}
export interface Catalogue {
  schemaVersion: 1;
  classificationStatus: "initial-review" | "approved";
  editions: Edition[];
  printings: Printing[];
}
