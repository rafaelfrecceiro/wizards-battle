import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { createServer as createViteServer } from "vite";
import { decks, cards, VERSION } from "../engine/engine";
import { Rooms, ApiError } from "./rooms";
import { availableDecks, parseCardPool } from '../engine/decks';
const root = resolve(import.meta.dirname, "..");
const port = Number(process.env.WB_PORT ?? 4187);
const rooms = new Rooms(process.env.WB_SAVE_PATH ?? resolve(root, '../saves/rooms-terras-complete-v1.sqlite'));
const production =
  process.env.NODE_ENV === "production" ||
  process.argv.includes("--production");
const vite = production
  ? null
  : await createViteServer({
      root,
      server: { middlewareMode: true },
      appType: "spa",
    });
const limits = new Map<string, { time: number; count: number }>();
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname.startsWith("/api/")) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      if (req.method === "GET" && url.pathname === "/api/health") {
        res.end(
          JSON.stringify({
            ok: true,
            name: "Wizards Battle",
            version: VERSION,
            sessions: rooms.size,
            appVersion: "0.11.0",
          }),
        );
        return;
      }
      if (req.method === "GET" && url.pathname === "/api/decks") {
        res.end(
          JSON.stringify(
            availableDecks(parseCardPool(url.searchParams.get('cardPool') ?? undefined)).map((d) => ({
              name: d.name,
              schools: [
                ...new Set(d.cards.flatMap((entry) => cards[entry.id].schools)),
              ],
            })),
          ),
        );
        return;
      }
      if (req.method === 'GET' && url.pathname === '/api/rooms/info') {
        res.end(JSON.stringify(rooms.inviteInfo(url.searchParams.get('code')))); return;
      }
      if (req.method === 'POST') {
        const key = req.socket.remoteAddress ?? 'unknown', now = Date.now();
        const rate = limits.get(key);
        if (!rate || now - rate.time > 60000) {
          for (const [ip, value] of limits) if (now - value.time > 60000) limits.delete(ip);
          limits.set(key, { time: now, count: 1 });
        } else if (++rate.count > 240) throw new ApiError('Muitas ações. Aguarde um minuto.', 429);
      }
      // API local de mesma origem. Nenhuma ação por GET nem CORS aberto.
      const origin = req.headers.origin;
      if (origin && new URL(origin).host !== req.headers.host) {
        res.writeHead(403);
        res.end(JSON.stringify({ error: "Origem não autorizada." }));
        return;
      }
      let raw = "";
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 16384) throw Error("Pedido muito grande.");
      }
      const body = raw ? JSON.parse(raw) : {};
      if (req.method === "POST" && url.pathname === "/api/new") {
        res.end(JSON.stringify(rooms.create(body))); return;
      }
      if (req.method === "POST" && url.pathname === "/api/rooms/create") {
        res.end(JSON.stringify(rooms.create(body, true))); return;
      }
      if (req.method === "POST" && url.pathname === "/api/rooms/join") {
        res.end(JSON.stringify(rooms.join(body))); return;
      }
      const token = req.headers.authorization?.replace(/^Bearer /, "") ?? "";
      if (req.method === "GET" && url.pathname === "/api/state") {
        res.end(JSON.stringify(rooms.state(token))); return;
      }
      if (req.method === "POST" && ["/api/action", "/api/bot", "/api/rematch"].includes(url.pathname)) {
        res.end(JSON.stringify(rooms.mutate(token, url.pathname.slice(5) as 'action' | 'bot' | 'rematch', body))); return;
      }
      if (req.method === "POST" && url.pathname === "/api/replay") {
        res.end(JSON.stringify(rooms.replay(token))); return;
      }
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Rota não encontrada." }));
      return;
    }
    if (vite) {
      vite.middlewares(req, res, () => {
        res.writeHead(404);
        res.end();
      });
      return;
    }
    const dist = resolve(root, "dist-v11");
    let file = resolve(dist, "." + decodeURIComponent(url.pathname));
    if (file !== dist && !file.startsWith(dist + sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    const meta = await stat(file).catch(() => null);
    if (!meta?.isFile()) file = resolve(dist, "index.html");
    const type =
      (
        {
          ".html": "text/html; charset=utf-8",
          ".js": "text/javascript",
          ".css": "text/css",
          ".png": "image/png",
          ".json": "application/json",
          ".svg": "image/svg+xml",
          ".woff2": "font/woff2",
          ".woff": "font/woff",
        } as Record<string, string>
      )[extname(file)] ?? "application/octet-stream";
    res.setHeader("Content-Type", type);
    res.end(await readFile(file));
  } catch (error) {
    if (!res.headersSent)
      res.writeHead(error instanceof ApiError ? error.status : 400, { "Content-Type": "application/json; charset=utf-8" });
    res.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Falha na solicitação.",
      }),
    );
  }
});
server.listen(port, process.env.WB_HOST ?? "127.0.0.1", () =>
  console.log(`Wizards Battle: http://127.0.0.1:${port}`),
);

server.requestTimeout = 15000;
server.headersTimeout = 10000;
process.on('SIGTERM', () => server.close(() => { rooms.close(); process.exit(0); }));
