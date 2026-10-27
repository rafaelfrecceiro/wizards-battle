import type { CardPool, EnergyRule, View } from '../engine/types';
export type RoomInfo = { mode: 'solo' | 'friends'; code: string | null; seat: 0 | 1;
  waiting: boolean; round: number; variant: string; cardPool?:CardPool; energyRule?:EnergyRule; rematch: [boolean, boolean]; opponentOnline: boolean };
export type Snapshot = { view: View | null; revision?: number; room?: RoomInfo; token?: string; played?: boolean };
export const key = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), n => n.toString(16).padStart(2, '0')).join('');
export function invitation() { return new URLSearchParams(location.hash.slice(1)).get('sala') ?? ''; }
export function savedSession() {
  const invite = invitation();
  if (invite && sessionStorage.getItem('wb-room-code') !== invite) return '';
  return sessionStorage.getItem('wb-session-tab') ?? localStorage.getItem('wb-session') ?? '';
}
export function remember(token: string, code: string | null = null) {
  sessionStorage.setItem('wb-session-tab', token);
  sessionStorage.setItem('wb-room-code', code ?? '');
  localStorage.setItem('wb-session', token);
}
export class NetworkError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function api(path: string, token: string, body?: unknown): Promise<Snapshot & Record<string, any>> {
  const init = { method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(8000) };
  // Só repete automaticamente pedidos com chave estável, após falha de transporte.
  let r: Response;
  try { r = await fetch(`/api/${path}`, init); }
  catch (error) {
    if (!body || (!('requestId' in (body as object)) && !('accessKey' in (body as object)))) throw error;
    r = await fetch(`/api/${path}`, { ...init, signal: AbortSignal.timeout(8000) });
  }
  const data = await r.json();
  if (!r.ok) throw new NetworkError(data.error ?? 'Falha na conexão.', r.status);
  return data;
}
