import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash, randomBytes, randomInt } from 'node:crypto';
import { applyAction, createGame, decks, viewFor, VERSION, VES_VERSION } from '../engine/engine';
import { playableDeck, availableDecks, parseCardPool } from '../engine/decks';
import { chooseBot } from '../engine/bot';
import type { Action, CardPool, Config, DeckDefinition, EnergyRule, Game, Seat } from '../engine/types';

export class ApiError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
type Selection = { deck: string; custom: DeckDefinition | null };
type Room = {
  id: string; invite: string | null; mode: 'solo' | 'friends';
  credentials: [string, string | null]; selections: [Selection, Selection | null];
  variant: Config['variant']; game: Game | null; revision: number;
  cardPool: CardPool;
  energyRule?: EnergyRule;
  rematch: [boolean, boolean]; round: number;
  receipts: Record<string, string>; created: number;
};
const secret = () => randomBytes(24).toString('hex');
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
function accessKey(body: any) {
  if (body?.accessKey === undefined) return secret();
  if (typeof body.accessKey !== 'string' || !/^[a-f0-9]{48}$/.test(body.accessKey)) throw new ApiError('Chave de acesso inválida.');
  return body.accessKey as string;
}
function selection(body: any, pool: CardPool): Selection {
  if (!body || typeof body !== 'object') throw new ApiError('Escolha um baralho.');
  const custom = body.customDeck === undefined ? null : playableDeck(body.customDeck, pool);
  if (!custom && !availableDecks(pool).some(d => d.name === body.deck)) throw new ApiError('Escolha um baralho disponível neste conjunto.');
  return { deck: custom?.name ?? body.deck, custom };
}
function variant(value: unknown): Config['variant'] {
  if (value === undefined) return 'escolas-v1';
  if (!['base-0.3', 'fontes-estendidas', 'escolas-v1'].includes(value as string)) throw new ApiError('Variante inválida.');
  return value as Config['variant'];
}
function energyRule(value: unknown): EnergyRule {
  if (value === undefined || value === 'turn') return 'turn';
  if (value === 'reserve-v1') return value;
  throw new ApiError('Regra de energia inválida.');
}

/** Um único processo é dono do arquivo. SQLite confirma o snapshot antes de responder. */
export class Rooms {
  private db: DatabaseSync;
  private rooms = new Map<string, Room>();
  private credentials = new Map<string, { id: string; seat: Seat }>();
  private seen = new Map<string, [number, number]>();
  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, snapshot TEXT NOT NULL)');
    for (const row of this.db.prepare('SELECT snapshot FROM rooms').all()) {
      const room: Room = JSON.parse(row.snapshot as string);
      // Saves de QA anteriores à versão final desta entrega têm a mesma regra de VES.
      if (room.game?.version === VES_VERSION) room.game.version = VERSION;
      if (room.game && room.game.version !== VERSION) throw Error('Versão de save incompatível; preserve o arquivo e use a versão correspondente.');
      room.cardPool = parseCardPool(room.cardPool);
      this.save(room);
    }
  }
  close() { this.db.close(); }
  get size() { return this.rooms.size; }
  private index(room: Room) {
    this.rooms.set(room.id, room);
    room.credentials.forEach((token, seat) => { if (token) this.credentials.set(token, { id: room.id, seat: seat as Seat }); });
  }
  private save(room: Room) {
    this.db.prepare('INSERT INTO rooms VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET snapshot=excluded.snapshot').run(room.id, JSON.stringify(room));
    this.index(room);
  }
  private start(room: Room, first: Seat = randomInt(2) as Seat) {
    const a = room.selections[0], b = room.selections[1]!;
    room.game = createGame({ seed: randomInt(0, 2 ** 31), decks: [a.deck, b.deck],
      customDecks: [a.custom, b.custom], variant: room.variant, first, cardPool: room.cardPool, energyRule: room.energyRule });
  }
  create(body: any, friends = false) {
    const token = accessKey(body);
    if (this.credentials.has(hash(token))) return { token, ...this.state(token) };
    if (this.size >= 1000) throw new ApiError('Limite de mesas atingido.', 503);
    const cardPool = parseCardPool(body.cardPool), rule = variant(body.variant);
    const energy = energyRule(body.energyRule);
    if (energy === 'reserve-v1' && rule !== 'escolas-v1') throw new ApiError('Energia acumulada usa Escola + Presença.');
    if (cardPool !== 'ves' && rule !== 'escolas-v1') throw new ApiError('As Terras Despertas usa Escola + Presença.');
    const room: Room = { id: secret(), invite: friends ? randomBytes(10).toString('hex').toUpperCase() : null,
      mode: friends ? 'friends' : 'solo', credentials: [hash(token), null],
      selections: [selection(body,cardPool), friends ? null : selection({ deck: body.opponent ?? (body.deck === 'Pira' ? 'Queimada' : 'Pira') },cardPool)],
      variant: rule, cardPool, energyRule: energy, game: null, revision: 0, rematch: [false, false], round: 1, receipts: {}, created: Date.now() };
    if (!friends) this.start(room);
    this.save(room);
    return { token, ...this.state(token) };
  }
  join(body: any) {
    const token = accessKey(body);
    if (this.credentials.has(hash(token))) return { token, ...this.state(token) };
    const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : '';
    const original = [...this.rooms.values()].find(r => r.invite === code && r.mode === 'friends');
    if (!original) throw new ApiError('Convite não encontrado.', 404);
    if (original.credentials[1]) throw new ApiError('Esta sala já tem dois jogadores.', 409);
    if (parseCardPool(body.cardPool) !== original.cardPool) throw new ApiError('Confirme o conjunto experimental escolhido pelo anfitrião antes de entrar.');
    if (energyRule(body.energyRule) !== (original.energyRule ?? 'turn')) throw new ApiError('Confirme a regra de energia escolhida pelo anfitrião antes de entrar.');
    const room = structuredClone(original);
    room.selections[1] = selection(body,room.cardPool);
    room.credentials[1] = hash(token);
    room.revision++;
    this.start(room);
    this.save(room);
    return { token, ...this.state(token) };
  }
  private auth(token: string) {
    const auth = this.credentials.get(hash(token));
    if (!auth) throw new ApiError('Mesa não encontrada neste servidor.', 401);
    return { room: this.rooms.get(auth.id)!, seat: auth.seat };
  }
  inviteInfo(value: unknown) {
    const code = typeof value === 'string' ? value.trim().toUpperCase() : '';
    const room = [...this.rooms.values()].find(r=>r.mode==='friends' && r.invite===code);
    if (!room) throw new ApiError('Convite não encontrado.',404);
    return {cardPool:room.cardPool,variant:room.variant,energyRule:room.energyRule ?? 'turn',full:!!room.credentials[1]};
  }
  state(token: string) {
    const { room, seat } = this.auth(token);
    const seen = this.seen.get(room.id) ?? [0, 0];
    seen[seat] = Date.now(); this.seen.set(room.id, seen);
    const view = room.game ? viewFor(room.game, seat) : null;
    if (view && room.mode === 'friends') {
      view.players.forEach((p, i) => { p.name = i === seat ? 'Você' : 'Amigo'; });
      view.log = view.log.map(l => ({...l, text: l.text.replace(/Autômato|Você/g, word => (word === 'Você' ? 0 : 1) === seat ? 'Você' : 'Amigo')}));
    }
    return { revision: room.revision, view,
      room: { mode: room.mode, code: room.invite, seat, waiting: !room.game, round: room.round,
        variant: room.variant, cardPool:room.cardPool, energyRule:room.energyRule ?? 'turn', rematch: room.rematch,
        opponentOnline: room.mode === 'solo' || Date.now() - seen[1 - seat] < 10000 } };
  }
  mutate(token: string, path: 'action' | 'bot' | 'rematch', body: any) {
    const { room: original, seat } = this.auth(token);
    // Identificador obrigatório no PvP; modo solo mantém compatibilidade da API anterior.
    const requestId = body?.requestId;
    if (original.mode === 'friends' || requestId !== undefined) {
      if (typeof requestId !== 'string' || !/^[a-zA-Z0-9_-]{8,100}$/.test(requestId)) throw new ApiError('Identificador de ação inválido.');
      const key = `${seat}:${requestId}`, signature = JSON.stringify({ path, action: body.action });
      if (original.receipts[key]) {
        if (original.receipts[key] !== signature) throw new ApiError('Identificador já usado por outra ação.', 409);
        return { ...this.state(token), played: undefined as boolean | undefined };
      }
      if (!Number.isSafeInteger(body.revision) || body.revision !== original.revision) throw new ApiError('A mesa mudou. Confira o estado atualizado e tente novamente.', 409);
    }
    const room = structuredClone(original);
    if (!room.game) throw new ApiError('Aguardando seu amigo entrar.');
    let played: boolean | undefined;
    if (path === 'bot') {
      if (room.mode !== 'solo') throw new ApiError('Esta sala é entre pessoas.', 403);
      const option = chooseBot(viewFor(room.game, 1));
      played = !!option;
      if (option) room.game = applyAction(room.game, 1, option.action);
    } else if (path === 'rematch') {
      if (room.game.winner === null || room.mode !== 'friends') throw new ApiError('Revanche disponível ao encerrar um duelo com amigos.');
      room.rematch[seat] = true;
      if (room.rematch.every(Boolean)) {
        const first = (1 - room.game.config.first) as Seat;
        room.round++; room.rematch = [false, false]; this.start(room, first);
      }
    } else {
      room.game = applyAction(room.game, seat, body.action as Action);
    }
    room.revision++;
    if (typeof requestId === 'string') {
      room.receipts[`${seat}:${requestId}`] = JSON.stringify({ path, action: body.action });
      // IDs não expiram durante a sala: duplicatas antigas jamais viram ações novas.
    }
    this.save(room);
    return { ...this.state(token), ...(played === undefined ? {} : { played }) };
  }
  replay(token: string) {
    const { room } = this.auth(token), game = room.game;
    if (!game || game.winner === null) throw new ApiError('O replay completo fica disponível após a partida para preservar informações ocultas.');
    return { version: game.version, config: game.config, actions: game.history };
  }
}
