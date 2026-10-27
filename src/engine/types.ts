export type Seat = 0 | 1;
export type School = "Chama" | "Raiz" | "Sombra" | "Maré";
export type CardPool = "ves" | "terras-pilot-v1" | "terras-v1";
export type EnergyRule = "turn" | "reserve-v1";
export type Zone =
  | "hand"
  | "deck"
  | "front"
  | "back"
  | "sources"
  | "enchants"
  | "veil"
  | "ashes"
  | "discard";
export interface Effect {
  op: string;
  n: number;
  target: string;
  max_cost?: number;
  ashes?: number;
  ashes_min?: number;
  hand_max?: number;
  sources_min?: number;
  casts_min?: number;
  requires_guardian?: boolean;
  requires_front?: boolean;
  requires_death?: boolean;
  requires_reposition?: boolean;
  face_n?: number;
  ashes_bonus?: number;
  optional?: boolean;
  up_to?: boolean;
  haste?: boolean;
  presence_min?: Partial<Record<School, number>>;
  exclude_self?: boolean;
  resonance?: {
    presence: Partial<Record<School, number>>;
    n?: number;
    max_cost?: number;
    haste?: boolean;
  };
}
export interface Aura {
  school: School;
  force?: number;
  keyword?: string;
  wounded?: boolean;
}
export interface Card {
  id: string;
  name: string;
  type: string;
  schools: School[];
  cost: number | null;
  presence: Partial<Record<School, number>>;
  force: number | null;
  vigor: number | null;
  essence: { generation: number; duration: number };
  text: string;
  support: boolean;
  vigil: number | null;
  keywords: string[];
  ash_cost?: number;
  sac_cost?: boolean;
  fx: {
    enter?: Effect[];
    cast?: Effect[];
    death?: Effect[];
    support_dawn?: Effect[];
    support_end?: Effect[];
    enchant_dawn?: Effect[];
    enchant_end?: Effect[];
    reposition?: Effect[];
    trap?: Effect[];
    trigger?: string;
    aura?: Aura;
    conditional_guard?: number;
    discount?: School;
    store?: boolean;
    magic_school?: School;
    first_magic?: Effect[];
  };
}
export interface Piece {
  uid: string;
  card: string;
  damage: number;
  duration: number;
  born: number;
  attacked: boolean;
  retreated: boolean;
  temp: number;
  haste: boolean;
}
export interface FeedbackActor {
  seat: Seat;
  zone: Zone | "mage";
  uid?: string;
  card?: string;
  name?: string;
  /** Identidade privada; viewFor remove para o outro assento. */
  privateTo?: Seat;
}
export interface BattleEvent {
  id: number;
  turn: number;
  kind: "cast" | "arm" | "reveal" | "attack" | "damage" | "heal" | "death" | "move" | "sacrifice" | "expire" | "draw" | "discard" | "recover" | "boost" | "energy" | "phase" | "inspect";
  source?: FeedbackActor;
  target?: FeedbackActor;
  amount?: number;
  reason?: string;
}
export interface Player {
  name: string;
  deckName: string;
  life: number;
  energy: number;
  stored: number;
  sacrificed: boolean;
  moved: boolean;
  casts: number;
  deaths: number;
  magic: Partial<Record<School, number>>;
  school: Partial<Record<School, number>>;
  /** Conhecimento privado de cartas que continuam no mesmo Véu. */
  known?: Record<string, string>;
  zones: Record<Zone, Piece[]>;
}
export interface DeckDefinition {
  name: string;
  cards: { id: string; copies: number }[];
}
export interface Config {
  seed: number;
  decks: [string, string];
  customDecks?: [DeckDefinition | null, DeckDefinition | null];
  variant: "base-0.3" | "fontes-estendidas" | "escolas-v1";
  first: Seat;
  cardPool?: CardPool;
  energyRule?: EnergyRule;
}
export interface Job {
  owner: Seat;
  fx: Effect;
  event: Record<string, string>;
  triggers?: { id: string; label: string; card: string; jobs: Job[] }[];
}
export interface Choice {
  id: string;
  label: string;
  target?: string;
}
export interface Pending {
  owner: Seat;
  title: string;
  job: Job;
  choices: Choice[];
}
export interface Action {
  kind:
    | "sacrifice"
    | "cast"
    | "move"
    | "attack"
    | "advance"
    | "choose"
    | "mulligan"
    | "concede";
  uid?: string;
  target?: string;
  row?: "front" | "back";
  choice?: string;
}
export interface Option {
  id: string;
  label: string;
  action: Action;
  group: string;
  card?: string;
  uid?: string;
  target?: string;
  score: number;
}
export interface Game {
  feedback?: BattleEvent[];
  feedbackSeq?: number;
  version: string;
  config: Config;
  rng: number;
  seq: number;
  turn: number;
  active: Seat;
  phase: "mulligan" | "main" | "combat" | "resolving";
  players: [Player, Player];
  mulligans: [boolean, boolean];
  kept: [boolean, boolean];
  queue: Job[];
  pending: Pending | null;
  winner: Seat | "draw" | null;
  log: { turn: number; text: string }[];
  metrics: {
    presenceBlocks: number;
    energyBlocks: number;
    casts: Record<string, number>;
  };
  history: { seat: Seat; action: Action }[];
}
export interface VisiblePiece extends Piece {
  known?: boolean;
  definition: Card;
  power: number;
  health: number;
  keywords: string[];
}
export interface PlayerView {
  name: string;
  deckName: string;
  life: number;
  energy: number;
  presence: Partial<Record<School, number>>;
  school: Partial<Record<School, number>>;
  deck: number;
  handCount: number;
  hand: VisiblePiece[];
  front: VisiblePiece[];
  back: VisiblePiece[];
  sources: VisiblePiece[];
  enchants: VisiblePiece[];
  veil: ({ uid: string; duration: number; hidden: true } | VisiblePiece)[];
  ashes: VisiblePiece[];
  discard: VisiblePiece[];
}
export interface View {
  feedback?: BattleEvent[];
  feedbackSeq?: number;
  version: string;
  variant: Config["variant"];
  cardPool?: CardPool;
  energyRule?: EnergyRule;
  turn: number;
  active: Seat;
  seat: Seat;
  phase: Game["phase"];
  winner: Game["winner"];
  players: [PlayerView, PlayerView];
  pending: { owner: Seat; title: string; kind?: "order" | "target" } | null;
  options: Option[];
  blocked: { uid: string; reason: string }[];
  log: Game["log"];
}
