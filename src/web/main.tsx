import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type {
  Action,
  Option,
  PlayerView,
  View,
  VisiblePiece,
  CardPool,
  EnergyRule,
} from "../engine/types";
import { dropOptions as seatDropOptions, zoneHelp } from "./interaction";
import { useBattleMotion } from "./motion";
import {useFeedback,FeedbackStatus} from './use-feedback';
import {eventText} from './battle-feedback';
import './feedback.css';
import { CardFace, EditionLine } from "./cards";
import { Collection } from "./collection";
import { DeckManager } from "./deck-manager";
import { Sanctuary, DuelSetup } from "./sanctuary";
import { SchoolIcon, AtlasPileIcon } from "./atlas-icons";
import { attackCurve } from "./atlas";
import {
  readDeckLibrary,
  DECK_STORAGE_KEY,
  type SavedDeck,
} from "./deck-storage";
import { inspectDeck, starterDecks, availableDecks, cardPools, isPilotCard } from "../engine/decks";
import {
  keywordDetails,
  localPreviewPosition,
  pointerPreviewPosition,
  type PreviewAnchor,
} from "./presentation";
import "@fontsource/alegreya-sc/500.css";
import "@fontsource/alegreya-sc/700.css";
import "@fontsource/alegreya-sans/400.css";
import "@fontsource/alegreya-sans/500.css";
import "@fontsource/alegreya-sans/700.css";
import "./tokens.css";
import "./style.css";
import "./readability.css";
import "./collection.css";
import "./deck-manager.css";
import "./sanctuary.css";
import "./atlas.css";
import './friends.css';
import "./polish.css";
import "./mesa-v2.css";
import { startFrameProbe } from './qa-probe';
import { api, invitation, key, NetworkError, remember, savedSession, type RoomInfo, type Snapshot } from './network';
const symbols: Record<string, string> = {
  Chama: "♨",
  Raiz: "❧",
  Sombra: "☾",
  Maré: "≈",
};
const phases: Record<string, string> = {
  mulligan: "Preparação",
  main: "Principal",
  combat: "Combate",
  resolving: "Resolução",
};
type Drag = {
  piece: VisiblePiece;
  pointer: number;
  sx: number;
  sy: number;
  x: number;
  y: number;
  active: boolean;
  origin: DOMRect;
  dest: string | null;
  mode: "card" | "attack";
};
const art = (x: VisiblePiece) => `/cartas/${x.card}.png`;
export function App({initialView=null,previewMode=false}:{initialView?:View|null;previewMode?:boolean}={}) {
  const [token, setToken] = useState(previewMode ? "" : savedSession()),
    [view, setView] = useState<View | null>(initialView);
  const feedbackPlayer=useFeedback(v=>setView(previous=>JSON.stringify(previous)===JSON.stringify(v)?previous:v));
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [playMode, setPlayMode] = useState(invitation() ? 'join' : 'solo');
  const [inviteCode, setInviteCode] = useState(invitation());
  const [connection, setConnection] = useState('');
  const [confirmConcede, setConfirmConcede] = useState(false);
  const [feedbackSettings,setFeedbackSettings]=useState(false);
  const [grimoire, setGrimoire] = useState(false);
  const grimoireRef = useRef<HTMLElement>(null);
  const revision = useRef(-1);
  const admission = useRef<{ signature: string; key: string } | null>(null);
  const waitingRef = useRef<HTMLElement>(null);
  const decisionRef = useRef<HTMLElement>(null);
  const endRef = useRef<HTMLElement>(null);
  const ownSeat = view?.seat ?? room?.seat ?? 0;
  const rivalSeat = (1 - ownSeat) as 0 | 1;
  const friends = room?.mode === 'friends';
  useEffect(() => { if (room?.waiting) waitingRef.current?.focus({preventScroll:true}); }, [room?.waiting]);
  // Grimório: fecha ao tocar fora dele, mas não ao interagir com um diálogo aberto a partir dele.
  useEffect(() => {
    if (!grimoire) return;
    const close = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (grimoireRef.current?.contains(target) || target?.closest('[role="dialog"]')) return;
      setGrimoire(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [grimoire]);
  function dropOptions(options: Option[], uid: string, dest: string, cardType: string) {
    return seatDropOptions(options, uid, dest, cardType, ownSeat);
  }
  function accept(d: Snapshot) {
    if (d.revision !== undefined && d.revision < revision.current) return;
    if (d.revision !== undefined) revision.current = d.revision;
    if(d.view)feedbackPlayer.present(d.view,`${d.token??token}:${d.room?.round??1}:${d.view.version}`);
    else {feedbackPlayer.reset();setView(null);}
    if (d.room) setRoom(d.room);
    setConnection('');
  }
  const [deck, setDeck] = useState("Pira"),
    [variant, setVariant] = useState("escolas-v1");
  const [cardPool,setCardPool] = useState<CardPool>('terras-v1');
  const [energyRule,setEnergyRule] = useState<EnergyRule>('reserve-v1');
  useEffect(()=>{ if (variant !== 'escolas-v1') setEnergyRule('turn'); },[variant]);
  const [inviteMeta,setInviteMeta] = useState<{code:string;full:boolean}|null>(null);
  const [inviteError,setInviteError] = useState('');
  const poolDecks = availableDecks(cardPool);
  useEffect(()=>{
    if (!poolDecks.some(d=>d.name===deck)) setDeck('Pira');
    if (!poolDecks.some(d=>d.name===opponentDeck)) setOpponentDeck('Queimada');
    if (cardPool!=='ves') setVariant('escolas-v1');
  },[cardPool]);
  useEffect(()=>{
    if (playMode!=='join' || !/^[A-Fa-f0-9]{20}$/.test(inviteCode)) {setInviteMeta(null);setInviteError('');return;}
    let cancelled=false;
    setInviteMeta(null);setInviteError('');
    void api(`rooms/info?code=${encodeURIComponent(inviteCode)}`,'').then(info=>{
      if(cancelled)return;
      setCardPool(info.cardPool);setVariant(info.variant);setEnergyRule(info.energyRule ?? 'turn');setInviteMeta({code:inviteCode,full:info.full});
    }).catch(e=>{if(!cancelled)setInviteError((e as Error).message)});
    return ()=>{cancelled=true};
  },[playMode,inviteCode]);
  const [setupOpen, setSetupOpen] = useState(!!invitation());
  const [selected, setSelected] = useState<string | null>(null),
    [hover, setHover] = useState<VisiblePiece | null>(null);
  const [handOpen, setHandOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [deckManagerOpen, setDeckManagerOpen] = useState(false);
  const [deckLibrary, setDeckLibrary] = useState(readDeckLibrary);
  const [customId, setCustomId] = useState<string | null>(null);
  const [opponentDeck, setOpponentDeck] = useState("Queimada");
  useEffect(() => {
    const update = (e: StorageEvent) => {
      if (e.key === DECK_STORAGE_KEY) setDeckLibrary(readDeckLibrary());
    };
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);
  useEffect(() => {
    if (customId && !deckLibrary.decks.some((d) => d.id === customId))
      setCustomId(null);
  }, [deckLibrary, customId]);
  const [previewCenter, setPreviewCenter] = useState(0);
  const [previewAnchor, setPreviewAnchor] = useState<PreviewAnchor>({
    left: 0,
    top: 80,
    width: 0,
    height: 0,
  });
  const inspectorRef = useRef<HTMLElement>(null);
  const previewPointer = useRef<{ uid: string; x: number; y: number } | null>(
    null,
  );
  const previewFrame = useRef<number | null>(null);
  const [previewInput, setPreviewInput] = useState<"mouse" | "keyboard">(
    "keyboard",
  );
  const measuredPreview = useRef({ width: 620, height: 590 });
  const [previewSize, setPreviewSize] = useState({ width: 620, height: 590 });
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  useEffect(() => {
    const resize = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  const [attackLink, setAttackLink] = useState<{
    from: { x: number; y: number };
    to: { x: number; y: number };
  } | null>(null);
  const linkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [help, setHelp] = useState<string | null>(null),
    [history, setHistory] = useState(false),
    [rules, setRules] = useState(false);
  const [dragging, setDragging] = useState<VisiblePiece | null>(null),
    [drop, setDrop] = useState<string | null>(null),
    [armed, setArmed] = useState<string | null>(null),
    [zoom, setZoom] = useState(false);
  const drag = useRef<Drag | null>(null),
    ghost = useRef<HTMLDivElement>(null),
    aim = useRef<SVGPathElement>(null),
    skipClick = useRef(false),
    locked = useRef(false),
    latest = useRef(view);
  latest.current = view;
  useBattleMotion(view, `${token}:${room?.round ?? 1}`,true);
  useEffect(
    () => () => {
      if (linkTimer.current) clearTimeout(linkTimer.current);
      if (previewFrame.current !== null)
        cancelAnimationFrame(previewFrame.current);
    },
    [],
  );
  async function request(path: string, body?: unknown) { return api(path, token, body); }
  useEffect(() => {
    if (!token || previewMode) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function sync() {
      try {
        if (locked.current) return;
        const d = await api('state', token);
        if (!cancelled) accept(d);
      } catch (e) {
        if (!cancelled) {
          setConnection(e instanceof NetworkError && e.status === 401 ? 'Esta mesa não está disponível neste servidor.' : 'Reconectando… sua partida continua salva.');
        }
      } finally {
        if (!cancelled) timer = setTimeout(sync, 1000);
      }
    }
    void sync();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [token, previewMode]);
  useEffect(() => {
    const blur = () => { cancel(); setArmed(null); setHover(null); };
    const visibility = () => { if (document.hidden) blur(); };
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', visibility);
    return () => { window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 2600);
    return () => clearTimeout(id);
  }, [notice]);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        drag.current = null;
        skipClick.current = false;
        setAttackLink(null);
        setDragging(null);
        setDrop(null);
        setArmed(null);
        setSelected(null);
        setHover(null);
        setHelp(null);
        setRules(false);
        setFeedbackSettings(false);
        setZoom(false);
        setCollectionOpen(false);
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  async function start(override?: SavedDeck, mode = playMode): Promise<boolean> {
    if(previewMode) return false;
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const custom =
        override ?? deckLibrary.decks.find((d) => d.id === customId);
      const signature = JSON.stringify({mode, deck, custom, inviteCode, variant, opponentDeck, cardPool, energyRule});
      if (admission.current?.signature !== signature) admission.current = {signature, key:key()};
      const d = await request(mode === 'solo' ? 'new' : mode === 'friends' ? 'rooms/create' : 'rooms/join', {
        accessKey: admission.current.key,
        ...(mode === 'join' ? { code: inviteCode } : {}),
        deck: custom?.name ?? deck,
        ...(custom
          ? { customDeck: { name: custom.name, cards: custom.cards } }
          : {}),
        opponent: opponentDeck,
        variant,
        cardPool,
        energyRule,
      });
      remember(d.token!, d.room?.code);
      revision.current = -1;
      setToken(d.token!);
      accept(d);
      admission.current = null;
      setSelected(null);
      setNotice(d.room?.waiting ? "Sala criada. Envie o convite ao seu amigo." : "O duelo começou. Escolha sua mão inicial.");
      if (custom) setCustomId(custom.id);
      setDeckManagerOpen(false);
      setSetupOpen(false);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function act(action: Action) {
    if(previewMode){setNotice("Prévia isolada — nenhuma partida real é alterada.");return}
    if (locked.current || feedbackPlayer.active.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const d = await request("action", { action, requestId: key(), revision: revision.current });
      accept(d);
      setConfirmConcede(false);
      setArmed(null);
      setSelected(null);
      setHover(null);
      setNotice(
        (
          {
            sacrifice: "Carta convertida em fonte.",
            cast: "Conjuração confirmada.",
            move: "Monstro reposicionado.",
            attack: "Ataque resolvido.",
            choose: "Escolha confirmada.",
            mulligan: "Mão confirmada.",
          } as Record<string, string>
        )[action.kind] ?? "Fase avançada.",
      );
    } catch (e) {
      setError((e as Error).message);
      if (e instanceof NetworkError && e.status === 409) {
        try { accept(await request('state')); } catch { setConnection('Reconectando… sua partida continua salva.'); }
      }
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    if (previewMode || friends || !view || view.winner !== null || view.options.length || feedbackPlayer.playing) return;
    let cancelled = false;
    const id = setTimeout(async () => {
      if (locked.current || feedbackPlayer.active.current) return;
      locked.current = true;
      setBusy(true);
      try {
        const d = await request("bot", { requestId: key(), revision: revision.current });
        if (!cancelled) {
          accept(d);
          if (!d.played)
            setError(
              "O rival não encontrou uma ação. Recarregue para retomar.",
            );
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        locked.current = false;
        if (!cancelled) setBusy(false);
      }
    }, 900);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [view, friends,feedbackPlayer.playing]);
  const all =
    view?.players.flatMap((p) => [
      ...p.hand,
      ...p.front,
      ...p.back,
      ...p.sources,
      ...p.enchants,
      ...p.discard,
      ...p.ashes.filter((x) => "definition" in x),
      ...(p.veil.filter((x) => "definition" in x) as VisiblePiece[]),
    ]) ?? [];
  const inspected = selected
    ? all.find((x) => x.uid === selected)
    : hover
      ? all.find((x) => x.uid === hover.uid)
      : null;
  const inspectionPinned = !!inspected && selected === inspected.uid;
  function positionAtPointer() {
    const el = inspectorRef.current,
      pointer = previewPointer.current;
    if (!el || !pointer || el.dataset.pointerUid !== pointer.uid) return;
    const position = pointerPreviewPosition(pointer, measuredPreview.current, {
      width: window.innerWidth,
      height: window.innerHeight,
    });
    el.style.left = `${position.left}px`;
    el.style.top = `${position.top}px`;
  }
  function followPointer(e: React.MouseEvent<HTMLElement>, x: VisiblePiece) {
    if (dragging || drag.current?.active) return;
    previewPointer.current = { uid: x.uid, x: e.clientX, y: e.clientY };
    if (previewFrame.current !== null) return;
    previewFrame.current = requestAnimationFrame(() => {
      previewFrame.current = null;
      positionAtPointer();
    });
  }
  function measurePreview() {
    const rect = inspectorRef.current?.getBoundingClientRect();
    if (rect && rect.width > 0 && rect.height > 0) {
      measuredPreview.current = { width: rect.width, height: rect.height };
      setPreviewSize((old) =>
        Math.abs(old.width - rect.width) > 1 ||
        Math.abs(old.height - rect.height) > 1
          ? { width: rect.width, height: rect.height }
          : old,
      );
    }
    positionAtPointer();
  }
  useLayoutEffect(() => {
    measurePreview();
  }, [
    inspected,
    inspectionPinned,
    previewInput,
    hover,
    viewport,
    dragging,
    view?.pending,
  ]);
  const source = dragging ?? (armed ? all.find((x) => x.uid === armed) : null),
    options = view?.options ?? [];
  const available = (dest: string) =>
    !!source &&
    dropOptions(options, source.uid, dest, source.definition.type).length > 0;
  const canDrag = (x: VisiblePiece) =>
    !busy &&
    !feedbackPlayer.playing &&
    options.some(
      (o) =>
        o.uid === x.uid &&
        ["cast", "sacrifice", "move", "attack"].includes(o.action.kind),
    );
  const decision = view?.pending?.owner === ownSeat;
  useEffect(() => {
    if (decision) decisionRef.current?.querySelector<HTMLButtonElement>('button')?.focus({preventScroll:true});
  }, [decision, view?.pending?.title]);
  useEffect(() => {
    if (view?.winner !== null && view?.winner !== undefined) endRef.current?.focus({preventScroll:true});
  }, [view?.winner]);
  useEffect(() => {
    if (selected && previewInput === 'keyboard') inspectorRef.current?.querySelector<HTMLButtonElement>('.inspector-actions button')?.focus({preventScroll:true});
  }, [selected]);
  const choices = decision
    ? options.filter((o) => o.action.kind === "choose")
    : [];
  const inspectOptions = inspected
    ? options.filter((o) => o.uid === inspected.uid)
    : [];
  const blocked = inspected
    ? view?.blocked.find((b) => b.uid === inspected.uid)?.reason
    : null;
  function pick(x: VisiblePiece) {
    if (skipClick.current) {
      skipClick.current = false;
      return;
    }
    const choice = decision && options.find((o) => o.action.choice === x.uid);
    if (choice) {
      void act(choice.action);
      return;
    }
    if (armed) {
      const o = dropOptions(
        options,
        armed,
        `piece:${x.uid}`,
        all.find((x) => x.uid === armed)?.definition.type ?? "",
      )[0];
      if (o) {
        void act(o.action);
        return;
      }
    }
    setSelected(selected === x.uid ? null : x.uid);
  }
  function down(e: React.PointerEvent<HTMLElement>, x: VisiblePiece) {
    if (e.button !== 0 || !canDrag(x)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      piece: x,
      pointer: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      x: e.clientX,
      y: e.clientY,
      active: false,
      origin: e.currentTarget.getBoundingClientRect(),
      dest: null,
      mode: options.some((o) => o.uid === x.uid && o.action.kind === "attack")
        ? "attack"
        : "card",
    };
    // No ataque só a mira acompanha o ponteiro; o monstro fica na fileira.
    if (drag.current.mode === "attack") {
      drag.current.active = true;
      setDragging(x);
      setSelected(null);
      setHover(null);
      setArmed(null);
      skipClick.current = true;
    }
  }
  function motion(e: React.PointerEvent<HTMLElement>) {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    d.x = e.clientX;
    d.y = e.clientY;
    if (!d.active && Math.hypot(d.x - d.sx, d.y - d.sy) < 7) return;
    if (!d.active) {
      d.active = true;
      setDragging(d.piece);
      setHover(null);
      setSelected(null);
      setArmed(null);
      skipClick.current = true;
    }
    if (ghost.current && d.mode === "card")
      ghost.current.style.transform = `translate3d(${e.clientX - 62}px,${e.clientY - 88}px,0) rotate(${Math.max(-6, Math.min(6, (e.clientX - d.sx) / 50))}deg)`;
    aim.current?.setAttribute("d",attackCurve({x:d.origin.x+d.origin.width/2,y:d.origin.y+d.origin.height/2},{x:e.clientX,y:e.clientY}));
    const target = document
      .elementsFromPoint(e.clientX, e.clientY)
      .map((el) => el.closest<HTMLElement>("[data-drop]"))
      .find(
        (el) =>
          el &&
          dropOptions(
            latest.current?.options ?? [],
            d.piece.uid,
            el.dataset.drop!,
            d.piece.definition.type,
          ).length,
      );
    const next = target?.dataset.drop ?? null;
    if (next !== d.dest) {
      d.dest = next;
      setDrop(next);
    }
  }
  function up(e: React.PointerEvent<HTMLElement>) {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    // O destino é o ponto de soltura, inclusive se o último movimento ficou em outra zona.
    if (d.active) motion(e);
    drag.current = null;
    if (!d.active) return;
    if (
      d.mode === "attack" &&
      !d.dest &&
      Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 7
    ) {
      setDragging(null);
      setDrop(null);
      skipClick.current = false;
      return;
    }
    const found = d.dest
      ? dropOptions(
          latest.current?.options ?? [],
          d.piece.uid,
          d.dest,
          d.piece.definition.type,
        )[0]
      : null;
    if (found) {
      if (d.mode === "attack") {
        const target = document.querySelector<HTMLElement>(
          `[data-drop="${d.dest}"]`,
        );
        const rect = target?.getBoundingClientRect();
        setAttackLink({
          from: {
            x: d.origin.x + d.origin.width / 2,
            y: d.origin.y + d.origin.height / 2,
          },
          to: rect
            ? { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
            : { x: e.clientX, y: e.clientY },
        });
        if (linkTimer.current) clearTimeout(linkTimer.current);
        linkTimer.current = setTimeout(() => setAttackLink(null), 650);
      }
      setDragging(null);
      setDrop(null);
      void act(found.action);
    } else {
      const el = ghost.current;
      if (el && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const animation = el.animate(
          [
            { transform: el.style.transform },
            {
              transform: `translate(${d.origin.x}px,${d.origin.y}px) scale(${d.origin.width / 124})`,
              opacity: 0,
            },
          ],
          { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" },
        );
        animation.onfinish = () => {
          setDragging(null);
          setDrop(null);
        };
      } else {
        setDragging(null);
        setDrop(null);
      }
      setNotice(
        d.mode === "attack"
          ? "Ataque cancelado. Nenhuma ação foi gasta."
          : "Solte em uma área iluminada. Nenhuma ação foi gasta.",
      );
    }
    setTimeout(() => {
      skipClick.current = false;
    }, 0);
  }
  function cancel() {
    drag.current = null;
    skipClick.current = false;
    setDragging(null);
    setDrop(null);
    setAttackLink(null);
  }
  function executeDrop(dest: string) {
    if (!source) return;
    const o = dropOptions(options, source.uid, dest, source.definition.type)[0];
    if (o) void act(o.action);
  }
  function dropClass(dest: string) {
    return `${available(dest) ? " valid-drop" : ""}${drop === dest ? " over-drop" : ""}`;
  }
  function tile(x: VisiblePiece, owner: number, location: string) {
    const playable = options.some(o => o.uid === x.uid && o.action.kind === "cast"),
      target = decision && options.some((o) => o.action.choice === x.uid);
    return (
      <button
        key={x.uid}
        aria-label={x.definition.name}
        data-testid={`card-${x.uid}`}
        data-motion-id={x.uid}
        data-owner={owner}
        data-art={art(x)}
        data-damage={x.damage}
        data-drop={`piece:${x.uid}`}
        className={`game-card ${location} ${playable ? "playable" : ""} ${selected === x.uid ? "chosen" : ""} ${dragging?.uid === x.uid ? (drag.current?.mode === "attack" ? "aiming" : "lifted") : ""} ${target ? "choice-target" : ""}${dropClass(`piece:${x.uid}`)} ${x.attacked ? "exhausted" : ""}`}
        onPointerDown={(e) => down(e, x)}
        onPointerMove={motion}
        onPointerUp={up}
        onPointerCancel={cancel}
        onClick={(e) => {
          e.stopPropagation();
          pick(x);
        }}
        onMouseEnter={(e) => {
          if (!dragging) {
            previewPointer.current = { uid: x.uid, x: e.clientX, y: e.clientY };
            setPreviewInput("mouse");
            setHover(x);
            const r = e.currentTarget.getBoundingClientRect();
            setPreviewCenter(r.x + r.width / 2);
            setPreviewAnchor({
              left: r.left,
              top: r.top,
              width: r.width,
              height: r.height,
            });
          }
        }}
        onMouseMove={(e) => followPointer(e, x)}
        onMouseLeave={() => {
          if (previewFrame.current !== null) {
            cancelAnimationFrame(previewFrame.current);
            previewFrame.current = null;
          }
          setHover(null);
        }}
        onFocus={(e) => {
          if (e.currentTarget.matches(":focus-visible"))
            setPreviewInput("keyboard");
          setHover(x);
          const r = e.currentTarget.getBoundingClientRect();
          setPreviewCenter(r.x + r.width / 2);
          setPreviewAnchor({
            left: r.left,
            top: r.top,
            width: r.width,
            height: r.height,
          });
        }}
        onBlur={() => setHover(null)}
      >
        <CardFace id={x.card} name={x.definition.name} />
        {location === "battle" && (
          <>
            <span className="battle-name">{x.definition.name}</span>
            <span className="combat-stats">
              <b className={x.definition.force !== null && x.power > x.definition.force ? "boosted" : ""}>{x.power}</b>
              <i> / </i>
              <b className={x.damage ? "wounded" : ""}>{x.health}</b>
            </span>
            {x.keywords.length > 0 && (
              <span className="keyword-badges">
                {keywordDetails(view!.players[owner], x).map((ability) => (
                  <span
                    key={ability.name}
                    className="keyword-badge"
                    title={`${ability.name}: ${ability.description}\n${ability.sources.join("; ")}`}
                    aria-label={`${ability.name}. ${ability.sources.join(". ")}`}
                  >
                    <span aria-hidden="true">{ability.icon}</span>{" "}
                    {ability.name}
                  </span>
                ))}
              </span>
            )}
            {x.attacked && <span className="attacked">ATACOU</span>}
          </>
        )}
        {(location === "source" || location === "small") && x.duration > 0 && (
          <span className="duration-counter">
            {x.duration}
            <small>turnos</small>
          </span>
        )}
        {location === "hand" && playable && <span className="playable-dot" />}
      </button>
    );
  }
  function label(zone: string, count?: string) {
    const z = zoneHelp[zone];
    return (
      <div className="zone-label">
        <span className="zone-icon">{z.icon}</span>
        <div>
          <strong>{z.name}</strong>
          <small>{z.subtitle}</small>
        </div>
        {count && <em>{count}</em>}
        <button
          aria-label={`Sobre ${z.name}`}
          onClick={(e) => {
            e.stopPropagation();
            setHelp(zone);
          }}
        >
          ?
        </button>
      </div>
    );
  }
  function formation(p: PlayerView, owner: number, row: "front" | "back") {
    const dest = `${owner}:${row}`;
    return (
      <section
        className={`formation ${owner === rivalSeat ? "rival" : ""} ${row}${dropClass(dest)}`}
        data-drop={dest}
        data-feedback-zone={dest}
        aria-label={`${row === "front" ? "Frente" : "Retaguarda"} ${owner === ownSeat ? "aliada" : "inimiga"}`}
        onClick={() => executeDrop(dest)}
      >
        {label(row, `${p[row].length}/3`)}
        <div className="formation-slots">
          {p[row].map((x) => tile(x, owner, "battle"))}
          {Array.from({ length: 3 - p[row].length }, (_, i) => (
            <button
              key={i}
              className="vacant"
              aria-label={`Vaga ${row === "front" ? "frente" : "retaguarda"} ${i + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                executeDrop(dest);
              }}
            >
              <span>{available(dest) ? "＋" : zoneHelp[row].icon}</span>
              {available(dest) && <small>Solte aqui</small>}
            </button>
          ))}
        </div>
      </section>
    );
  }
  function sources(p: PlayerView, owner: number) {
    const dest = `${owner}:sources`;
    return (
      <section
        className={`source-well${dropClass(dest)}`}
        data-drop={dest}
        data-feedback-zone={dest}
        onClick={() => executeDrop(dest)}
      >
        {label("sources", String(p.sources.length))}
        <div className="source-cards">
          {p.sources.map((x) => (
            <div className="source-entry" key={x.uid}>
              {tile(x, owner, "source")}
              <span>
                <b>{x.definition.name}</b>
                <small data-gen={`+${x.definition.essence.generation}`}>+{x.definition.essence.generation} energia</small>
              </span>
            </div>
          ))}
          {!p.sources.length && (
            <div className="source-empty"
              title={owner === ownSeat ? "Arraste uma carta da mão para cá: ela vira fonte de energia. 1 sacrifício por turno." : "Fontes do rival aparecem aqui."}>
              <span aria-hidden="true">✦</span>
            </div>
          )}
        </div>
        {owner === ownSeat && available(dest) && (
          <div className="sacrifice-hint">SOLTE PARA SACRIFICAR</div>
        )}
        <div className="pile-row">
          {(["deck", "ashes", "discard"] as const).map((z) => (
            <button
              key={z}
              data-feedback-zone={`${owner}:${z}`}
              onClick={(e) => {
                e.stopPropagation();
                setHelp(z);
              }}
            >
              <AtlasPileIcon zone={z}/>
              <b>{z === "deck" ? p.deck : p[z].length}</b>
              <small>{zoneHelp[z].name}</small>
            </button>
          ))}
        </div>
      </section>
    );
  }
  function ritual(p: PlayerView, owner: number) {
    return (
      <aside className="rituals">
        {(["enchants", "veil"] as const).map((zone) => {
          const dest = `${owner}:${zone}`;
          return (
            <section
              key={zone}
              className={`ritual-zone${dropClass(dest)}`}
              data-drop={dest}
              data-feedback-zone={dest}
              onClick={() => executeDrop(dest)}
            >
              {label(zone, `${p[zone].length}/${zone === "veil" ? 2 : 3}`)}
              <div className="ritual-cards">
                {p[zone].map((x) =>
                  "hidden" in x ? (
                    <div className="card-back" key={x.uid}>
                      <span>◈</span>
                      <small>{x.duration} turnos</small>
                    </div>
                  ) : (
                    tile(x, owner, "small")
                  ),
                )}
                {Array.from({length:(zone==='veil'?2:3)-p[zone].length},(_,i)=><button key={`vacant-${i}`} className="ritual-vacant" aria-label={`Vaga de ${zoneHelp[zone].name} ${i+1}`} onClick={e=>{e.stopPropagation();executeDrop(dest)}}><span aria-hidden="true">{zoneHelp[zone].icon}</span></button>)}
              </div>
            </section>
          );
        })}
      </aside>
    );
  }
  function player(p: PlayerView, owner: number) {
    const dest = `${owner}:mage`;
    return (
      <>
      <div
        className={`player-bar ${owner === rivalSeat ? "rival-player" : ""}${dropClass(dest)}`}
        data-drop={dest}
        data-feedback-zone={`${owner}:mage`}
        onClick={() => executeDrop(dest)}
      >
        <div className="portrait" aria-hidden="true"><img src={owner===ownSeat || friends?'/arte/atlas-maga.png':'/arte/atlas-automato.png'} alt="" draggable={false}/></div>
        <div className="player-name">
          <b>{owner === ownSeat ? "Você" : friends ? "Amigo" : "Autômato"}</b>
          <span>{p.deckName} <i>•</i> {p.handCount} na mão</span>
        </div>
        <div
            className="life"
            aria-label={`Vida ${owner===ownSeat?'aliada':'inimiga'}: ${p.life}`}
            data-motion-id={`life-${owner}`}
            data-owner={owner}
            data-life={p.life}
          >
            {p.life}
          </div>
        <div className="energy-orb" aria-label={`Energia ${owner===ownSeat?'aliada':'inimiga'}: ${p.energy}`}
          title={view?.energyRule === 'reserve-v1' ? 'Reserva de energia: a sobra permanece entre turnos.' : 'Energia não gasta expira no encerramento.'}>
          <span aria-hidden="true">✦</span><b data-motion-id={`energy-${owner}`} data-resource="energy" data-value={p.energy}>{p.energy}</b><small>{view?.energyRule === 'reserve-v1' ? 'RESERVA' : 'ENERGIA'}</small>
        </div>
      </div>
      {/* Placas por escola (WB-D30): Presença em destaque, Escola abaixo; acende o que libera uma carta jogável. */}
      <div className={`school-plates ${owner === rivalSeat ? "rival" : "ally"}`}>
        {view?.variant === "escolas-v1" && <div className="school-progression" aria-label={`Escola ${owner === ownSeat ? "aliada" : "inimiga"}`}>
          <small>ESCOLA</small>
          {Object.entries(symbols).map(([name,icon]) => <div key={name} className={`school ${name.toLowerCase()}${owner === ownSeat && wantedSchools.has(name) ? " wanted" : ""}`} title={`Escola ${name}: ${p.school?.[name as keyof typeof p.school] ?? 0}. Avanço permanente por fonte ou conjuração, inclusive ao jogar novamente.`}>
            <SchoolIcon school={name}/><b data-motion-id={`school-${owner}-${name}`} data-resource="school" data-value={p.school?.[name as keyof typeof p.school] ?? 0}>{p.school?.[name as keyof typeof p.school] ?? 0}</b><small>{name}</small>
          </div>)}
        </div>}
        <div
          className={`school-presence ${view?.variant === "escolas-v1" ? "has-progression" : ""}`}
          aria-label={`Presença ${owner === ownSeat ? "aliada" : "inimiga"}`}
        >
          {view?.variant === "escolas-v1" && <span className="presence-label">PRESENÇA</span>}
          {Object.entries(symbols).map(([name, icon]) => (
            <div
              key={name}
              className={`school ${name.toLowerCase()}${owner === ownSeat && wantedSchools.has(name) ? " wanted" : ""}`}
              title={`Presença de ${name}: ${p.presence[name as keyof typeof p.presence] ?? 0}`}
            >
              <SchoolIcon school={name}/>
              <b data-motion-id={`presence-${owner}-${name}`} data-resource="presence" data-value={p.presence[name as keyof typeof p.presence] ?? 0}>{p.presence[name as keyof typeof p.presence] ?? 0}</b>
              <small>{name}</small>
            </div>
          ))}
        </div>
      </div>
      </>
    );
  }
  function actionButton(o: Option) {
    return (
      <button
        key={o.id}
        className={`action-btn ${o.action.kind === "advance" ? "gold-btn" : ""}`}
        disabled={busy || feedbackPlayer.playing}
        onClick={() => void act(o.action)}
      >
        {o.label}
        <span>→</span>
      </button>
    );
  }
  const mainAction = options.find((o) => o.action.kind === "advance");
  const handPreviewWidth = Math.min(
    660,
    Math.max(540, window.innerWidth * 0.42),
  );
  const handPreviewLeft = Math.max(
    16,
    Math.min(
      previewCenter - handPreviewWidth / 2,
      window.innerWidth - handPreviewWidth - 16,
    ),
  );
  async function rematch() {
    if (locked.current) return;
    locked.current = true; setBusy(true);
    try { accept(await request('rematch', {requestId:key(), revision:revision.current})); }
    catch (e) { setError((e as Error).message); }
    finally { locked.current = false; setBusy(false); }
  }
  async function downloadReplay() {
    try {
      const data = await request("replay", {});
      const link = document.createElement("a");
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      link.href = url;
      link.download = "wizards-battle-replay.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const hint = dragging
    ? "Solte em uma área iluminada"
    : armed
      ? "Escolha um destino iluminado"
      : decision
        ? view!.pending!.title
        : view?.phase === "mulligan"
          ? "Mantenha sua mão ou troque as 7 cartas"
          : view?.phase === "combat"
            ? "Arraste um atacante até o alvo"
            : view?.options.length
              ? "Arraste uma carta da mão para jogar ou sacrificar"
              : "O rival está jogando…";
  const hand = view?.players[ownSeat].hand ?? [];
  // Escolas exigidas por cartas da mão que podem ser conjuradas agora (placas acesas).
  const wantedSchools = new Set(
    hand
      .filter((x) => options.some((o) => o.uid === x.uid && o.action.kind === "cast"))
      .flatMap((x) => Object.keys(x.definition.presence ?? {})),
  );
  const inspectedPlayer =
    inspected &&
    view?.players.find((p) =>
      [
        ...p.front,
        ...p.back,
        ...p.enchants,
        ...p.hand,
        ...p.sources,
        ...p.discard,
        ...p.ashes,
      ].some((x) => x.uid === inspected.uid),
    );
  const activeAbilities =
    inspected && inspectedPlayer
      ? keywordDetails(inspectedPlayer, inspected)
      : [];
  const inBattle =
    !!inspected &&
    !!inspectedPlayer &&
    [...inspectedPlayer.front, ...inspectedPlayer.back].some(
      (x) => x.uid === inspected.uid,
    );
  const boardPreviewWidth = Math.min(620, viewport.width - 32);
  const fromHand = hand.some((x) => x.uid === inspected?.uid);
  const mouseAnchored =
    previewInput === "mouse" && previewPointer.current?.uid === inspected?.uid;
  const pointerPosition =
    mouseAnchored && previewPointer.current
      ? pointerPreviewPosition(
          previewPointer.current,
          {
            width: fromHand ? handPreviewWidth : boardPreviewWidth,
            height: Math.min(previewSize.height, viewport.height - 96),
          },
          viewport,
        )
      : null;
  const boardPreviewPosition = localPreviewPosition(
    previewAnchor,
    {
      width: boardPreviewWidth,
      height: Math.min(previewSize.height, viewport.height - 96),
    },
    viewport,
  );
  return (
    <div
      className={`app ${view ? "in-game atlas" : ""} ${dragging ? "is-dragging" : ""} ${selected ? "has-selection" : ""} ${feedbackPlayer.playing?'feedback-in-progress':''}`}
    >
      {view && <header className="masthead" ref={grimoireRef}
        onKeyDown={(e) => { if (e.key === "Escape" && grimoire) { e.stopPropagation(); setGrimoire(false); } }}>
        <a href="#" onClick={(e) => e.preventDefault()} className="brand">
          <span>✧</span>
          <div>
            WIZARDS <b>BATTLE</b>
            <small>O CORAÇÃO DE VÉSPERA</small>
          </div>
        </a>
        <button className="grimoire-toggle" aria-expanded={grimoire} aria-controls="grimoire-menu"
          onClick={() => setGrimoire(!grimoire)}>
          <span aria-hidden="true">✦</span>Grimório
        </button>
        {grimoire && <nav id="grimoire-menu" aria-label="Grimório">
          <p className="grimoire-context">
            <b>{friends ? `Duelo com amigo · rodada ${room!.round}` : 'Duelo solo'}</b>
            <span>{view.cardPool === 'ves' ? 'Véspera · 80 cartas' : `Véspera + As Terras Despertas · ${view.cardPool==='terras-v1'?140:92} cartas`}</span>
            <span>
              {view.energyRule === 'reserve-v1' ? 'Energia acumulada' : view.variant === "base-0.3"
                ? "Regras originais"
                : view.variant === "escolas-v1" ? "Escola + Presença" : "Fontes estendidas"}
            </span>
          </p>
          <button onClick={() => setRules(true)}>Guia da mesa</button>
          <button
            onClick={() => {
              setHover(null);
              setCollectionOpen(true);
            }}
          >
            Coleção
          </button>
          <button
            onClick={() => {
              if(previewMode){setNotice("Gerenciamento de decks disponível no jogo, fora da prévia isolada.");return}
              setHover(null);
              setDeckManagerOpen(true);
            }}
          >
            Meus decks
          </button>
          {view && (
            <button onClick={()=>setFeedbackSettings(true)}>Feedback</button>
          )}
          {view && (
            <button onClick={() => setHistory(!history)} aria-pressed={history}>
              Histórico
            </button>
          )}
          {view && (
            <button
              onClick={() => {
                if (!busy) {
                  feedbackPlayer.reset();
                  setView(null);
                  setToken("");
                  setRoom(null);
                  setConnection('');
                  revision.current = -1;
                  setSelected(null);
                  setHover(null);
                }
              }}
            >
              Santuário
            </button>
          )}
        </nav>}
      </header>}
      {error && (
        <div className="error-toast" role="alert">
          {error}
          <button onClick={() => setError("")}>×</button>
        </div>
      )}
      {notice && (
        <div className="action-toast" role="status" key={notice}>
          {notice}
        </div>
      )}
      {!view ? (
        <div inert={room?.waiting || undefined}>
          <Sanctuary deck={deckLibrary.decks.find(d=>d.id===customId)?.name ?? deck}
            onPlay={()=>setSetupOpen(true)} onDecks={()=>setDeckManagerOpen(true)}
            onCollection={()=>setCollectionOpen(true)} onGuide={()=>setRules(true)}/>
          {!token && savedSession() && <div className="friends-tools"><button onClick={()=>{revision.current=-1;setToken(savedSession())}}>Retomar duelo salvo</button></div>}
          {setupOpen && <DuelSetup onClose={()=>setSetupOpen(false)}>
          <section className="lobby-panel">
            <span className="eyebrow">ESCOLHA SUA ESTRATÉGIA</span>
            <h2>Entre na arena</h2>
            <label htmlFor="play-mode">Como jogar</label>
            <select id="play-mode" value={playMode} onChange={e=>setPlayMode(e.target.value)}>
              <option value="solo">Solo contra o autômato</option>
              <option value="friends">Criar sala para um amigo</option>
              <option value="join">Entrar com convite</option>
            </select>
            {playMode === 'join' && <div className="friends-mode"><label htmlFor="invite-code">Código do convite</label><input id="invite-code" value={inviteCode} onChange={e=>setInviteCode(e.target.value.trim().toUpperCase())} maxLength={20}/><p role="status">{inviteError || (inviteMeta?.code===inviteCode ? (inviteMeta.full?'Esta sala já tem dois jogadores.':'Conjunto e regras do anfitrião confirmados.'):'Digite o código completo para consultar o conjunto da sala.')}</p></div>}
            <label htmlFor="card-pool">Conjunto de cartas</label>
            <select id="card-pool" value={cardPool} disabled={playMode==='join'} onChange={e=>{setCardPool(e.target.value as CardPool);setCustomId(null)}}>
              {Object.entries(cardPools).filter(([value])=>value!=='terras-pilot-v1'||cardPool===value).map(([value,label])=><option value={value} key={value}>{label}</option>)}
            </select>
            {cardPool!=='ves' && <p className="variant-note">{cardPool==='terras-v1'?'As Terras Despertas: edição completa com 60 cartas e seis novos modelos de deck.':'Seleção inicial de As Terras Despertas: 12 cartas para esta sala histórica.'} Ressonância usa a Presença atual no campo.</p>}
            {poolDecks.map(({name}) => (
              <button
                key={name}
                className={`deck-choice ${!customId && deck === name ? "active" : ""}`}
                onClick={() => {
                  setDeck(name);
                  setCustomId(null);
                  setOpponentDeck(name === "Pira" ? "Queimada" : "Pira");
                }}
              >
                <span>{({Pira:"☾",Queimada:"❧",Vapor:"≈",Decomposição:"◌",Estações:"❧",Ilusão:"◇"} as Record<string,string>)[name] ?? '◇'}</span>
                <div>
                  <strong>{name}</strong>
                  <small>
                    {({Pira:"Chama + Sombra · O poder das Cinzas",Queimada:"Chama + Raiz · Sacrifício e resistência",Vapor:"Chama + Maré · Pressão e refluxo",Decomposição:"Raiz + Sombra · Recuperação e Cinzas",Estações:"Raiz + Maré · Suportes e movimento",Ilusão:"Sombra + Maré · Informação e retorno","Terras — Manada do Vale":"Chama + Raiz · Investida e sustentação","Terras — Nascentes Vivas":"Raiz + Maré · Formação e seleção","Terras — Nomes e Brasas":"Chama + Sombra · Cinzas e recuperação"} as Record<string,string>)[name]}
                  </small>
                </div>
                <b>{!customId && deck === name ? "◉" : "○"}</b>
              </button>
            ))}
            <div className="lobby-custom-decks">
              <label htmlFor="custom-deck">Seus decks</label>
              <select
                id="custom-deck"
                value={customId ?? ""}
                onChange={(e) => setCustomId(e.target.value || null)}
              >
                <option value="">Selecionar deck salvo…</option>
                {deckLibrary.decks.map((d) => (
                  <option
                    key={d.id}
                    value={d.id}
                    disabled={!inspectDeck(d,cardPool).ready}
                  >
                    {d.name}
                    {inspectDeck(d,cardPool).ready ? "" : inspectDeck(d).ready ? " — requer As Terras Despertas" : " — rascunho"}
                  </option>
                ))}
              </select>
              <button
                className="text-btn"
                onClick={() => setDeckManagerOpen(true)}
              >
                Criar ou gerenciar decks →
              </button>
            </div>
            {playMode === 'solo' && <><label htmlFor="opponent-deck">Deck do autômato</label>
            <select
              id="opponent-deck"
              value={opponentDeck}
              onChange={(e) => setOpponentDeck(e.target.value)}
            >
              {poolDecks.map(d=><option key={d.name}>{d.name}</option>)}
            </select>
            </>}
            <label htmlFor="variant">Regras do duelo</label>
            <select
              id="variant"
              disabled={playMode === 'join' || cardPool!=='ves'}
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
            >
              <option value="escolas-v1">Escola + Presença</option>
              <option value="base-0.3">Original v0.3</option>
              <option value="fontes-estendidas">
                Fontes com duração integral ao sacrificar
              </option>
            </select>
            <p className="variant-note">
              {variant === "escolas-v1" ? "Escola avança +1 por fonte ou conjuração, inclusive ao jogar a carta novamente. Presença conta somente o campo atual. Geração, duração e Cinzas das fontes seguem a base." : variant === "base-0.3"
                ? "A fonte gera energia e perde 1 de duração ao ser sacrificada."
                : "A fonte conserva a duração ao sacrificar. Mais energia total, Cinzas chegam mais tarde."}
            </p>
            <label htmlFor="energy-rule">Energia entre turnos</label>
            <select id="energy-rule" value={energyRule}
              disabled={playMode === 'join' || variant !== 'escolas-v1'}
              onChange={e=>setEnergyRule(e.target.value as EnergyRule)}>
              <option value="reserve-v1">Acumulada — reserva entre turnos</option>
              <option value="turn">Expira no encerramento — original</option>
            </select>
            <p className="variant-note">
              {energyRule === 'reserve-v1'
                ? 'A energia não gasta permanece na reserva, sem limite. Uma fonte 1×3 gera 1 agora e 1 nos seus dois próximos turnos. Virar Cinza não apaga a reserva.'
                : 'A energia não gasta é perdida no encerramento, salvo habilidades que guardam energia.'}
            </p>
            <button
              className="gold-btn enter"
              onClick={() => void start()}
              disabled={
                busy ||
                (playMode==='join' && (inviteMeta?.code!==inviteCode || inviteMeta.full)) ||
                (!!customId &&
                  !inspectDeck(
                    deckLibrary.decks.find((d) => d.id === customId) ?? {
                      name: "",
                      cards: [],
                    },
                    cardPool,
                  ).ready)
              }
            >
              {busy ? "Preparando…" : playMode === 'friends' ? "Criar sala" : playMode === 'join' ? "Entrar na sala" : "Iniciar duelo"}
              <span>→</span>
            </button>
            <small className="lobby-foot">
              40 cartas por baralho · 15 de Vida · regras automáticas
            </small>
          </section>
          </DuelSetup>}
        </div>
      ) : (
        <>
          {(friends || connection) && <div className="friends-tools" role="status">
            <span>{friends ? `Duelo com amigo · rodada ${room!.round}` : 'Duelo solo'}</span>
            <span className="connection-state">{connection || (friends ? (room?.opponentOnline ? 'Amigo conectado' : 'Amigo desconectado · aguardando retorno') : 'Autômato')}</span>
            {friends && <button disabled={busy || view.winner !== null} onClick={()=>setConfirmConcede(true)}>Conceder duelo</button>}
          </div>}
          {feedbackSettings&&<DuelSetup title="Feedback da partida" closeLabel="Fechar feedback" onClose={()=>setFeedbackSettings(false)}>
          <h2>Feedback da partida</h2><p>Acompanhe a origem, o alvo e a consequência de cada carta. O bot espera a sequência terminar.</p>
          <div className="feedback-controls">
            <label htmlFor="feedback-speed">Ritmo das jogadas</label>
            <select id="feedback-speed" value={feedbackPlayer.speed} onChange={e=>feedbackPlayer.changeSpeed(e.target.value as 'normal'|'fast')}>
              <option value="normal">Cinemático</option><option value="fast">Rápido</option>
            </select>
            <button aria-pressed={feedbackPlayer.sound} onClick={feedbackPlayer.changeSound}>{feedbackPlayer.sound?'Som ligado':'Ativar som'}</button>
            <button onClick={()=>setHistory(!history)}>Por que aconteceu?</button>
            <span>{feedbackPlayer.playing?'Acompanhe a resolução…':'Mesa atualizada'}</span>
            {feedbackPlayer.failed&&<span className="feedback-warning">Animação indisponível; resultado preservado no histórico.</span>}
          </div>
          </DuelSetup>}
          <main className="arena" aria-label="Campo de batalha" aria-busy={feedbackPlayer.playing}>
            <div className="rival-header">
              {player(view.players[rivalSeat], rivalSeat)}
              <div
                className="rival-hand"
                data-feedback-zone={`${rivalSeat}:hand`}
                aria-label={`${view.players[rivalSeat].handCount} cartas ocultas na mão rival`}
              >
                {Array.from(
                  { length: Math.min(8, view.players[rivalSeat].handCount) },
                  (_, i) => (
                    <div className="tiny-back" key={i}>
                      ✧
                    </div>
                  ),
                )}
              </div>
            </div>
            <div className="battlefield">
              <div className="field-decoration">
                <span>◈</span>
              </div>
              <div className="half rival-half">
                {sources(view.players[rivalSeat], rivalSeat)}
                <div className="formations">
                  {formation(view.players[rivalSeat], rivalSeat, "back")}
                  {formation(view.players[rivalSeat], rivalSeat, "front")}
                </div>
                {ritual(view.players[rivalSeat], rivalSeat)}
              </div>
              <div className="equator">
                <div className="turn-indicator">
                  <span
                    className={`turn-dot ${view.options.length ? "mine" : ""}`}
                  />
                  <b>Turno {view.turn}</b>
                  <span>
                    {view.options.length ? "Sua decisão" : "Vez do rival"}
                  </span>
                </div>
                <div className="phase-track">
                  {["mulligan", "main", "combat"].map((p, i) => (
                    <span key={p} className={view.phase === p ? "current" : ""}>
                      <i>{i + 1}</i>
                      {phases[p]}
                    </span>
                  ))}
                </div>
                <span className="last-event" aria-live="polite">
                  {view.feedback?.length?eventText(view.feedback.at(-1)!,ownSeat):view.log.at(-1)?.text}
                </span>
              </div>
              <div className="half ally-half">
                {sources(view.players[ownSeat], ownSeat)}
                <div className="formations">
                  {formation(view.players[ownSeat], ownSeat, "front")}
                  {formation(view.players[ownSeat], ownSeat, "back")}
                </div>
                {ritual(view.players[ownSeat], ownSeat)}
              </div>
            </div>
            <div className="your-header">
              {player(view.players[ownSeat], ownSeat)}
              <div
                className={`spell-drop${dropClass(`${ownSeat}:cast`)}`}
                data-drop={`${ownSeat}:cast`}
                onClick={() => executeDrop(`${ownSeat}:cast`)}
              >
                <span>✧</span>
                <div>
                  <b>Conjurar magia</b>
                  <small>
                    {available(`${ownSeat}:cast`)
                      ? "Solte para lançar"
                      : "Efeitos imediatos"}
                  </small>
                </div>
              </div>
              <div className={`phase-action${mainAction && options.length === 1 ? " only-action" : ""}`}>
                {mainAction ? (
                  actionButton(mainAction)
                ) : view.phase === "mulligan" ? (
                  <span>Escolha sua mão inicial</span>
                ) : view.winner !== null ? (
                  <b>Duelo encerrado</b>
                ) : (
                  <span className="thinking">
                    {feedbackPlayer.playing?'Resolvendo a jogada':decision ? "Sua decisão" : friends ? "Aguardando amigo" : "Autômato pensando"}<span>···</span>
                  </span>
                )}
              </div>
            </div>
            <div
              className={`hand-area ${handOpen || (dragging && hand.some((x) => x.uid === dragging.uid)) ? "expanded" : ""}`}
              data-testid="hand-tray"
              data-feedback-zone={`${ownSeat}:hand`}
              data-expanded={handOpen}
              onMouseEnter={() => setHandOpen(true)}
              onMouseLeave={() => setHandOpen(false)}
              onFocusCapture={() => setHandOpen(true)}
              onBlurCapture={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null))
                  setHandOpen(false);
              }}
            >
              <div className="hand-heading">
                <span>
                  SUA MÃO <b>{hand.length}</b>
                </span>
                <span>{hint}</span>
              </div>
              <div
                className="hand-fan"
                style={{ "--hand-count": hand.length } as React.CSSProperties}
              >
                {hand.map((x, i) => (
                  <div
                    className="hand-position"
                    key={x.uid}
                    style={
                      {
                        "--index": i,
                        "--angle": `${(i - (hand.length - 1) / 2) * 2}deg`,
                        "--offset": `${Math.abs(i - (hand.length - 1) / 2) * 3}px`,
                      } as React.CSSProperties
                    }
                  >
                    {tile(x, ownSeat, "hand")}
                  </div>
                ))}
              </div>
            </div>
          </main>
          {view.phase === "mulligan" &&
            view.options.some((o) => o.action.kind === "mulligan") && (
              <div className="mulligan-banner">
                <span>SEU PRIMEIRO PASSO</span>
                <h3>Uma boa mão muda o duelo.</h3>
                <p>Busque uma fonte duradoura e monstros baratos.</p>
                <div>
                  {options
                    .filter((o) => o.action.kind === "mulligan")
                    .map(actionButton)}
                </div>
              </div>
            )}
          {decision && !feedbackPlayer.playing && (
            <section
              className="decision-panel"
              ref={decisionRef}
              role="dialog"
              aria-label={view.pending!.title}
            >
              <div className="decision-top">
                <span>
                  {view.pending!.kind === "order"
                    ? "ORDEM DOS GATILHOS"
                    : "SUA ESCOLHA"}
                </span>
                <b>{choices.length} opções</b>
              </div>
              <h2>
                {view.pending!.kind === "order"
                  ? "O que resolve primeiro?"
                  : view.pending!.title}
              </h2>
              <p>
                {view.pending!.kind === "order"
                  ? "Escolha a próxima habilidade. Ela resolve por completo antes da seguinte."
                  : "Clique numa carta destacada no campo ou escolha abaixo."}
              </p>
              <div className="decision-cards">
                {choices.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => void act(o.action)}
                    disabled={busy}
                  >
                    {o.card && <CardFace id={o.card} name="" />}
                    <strong>{o.label}</strong>
                    <span>
                      {view.pending!.kind === "order"
                        ? "Resolver agora →"
                        : "Escolher →"}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
          {inspected && !dragging && !decision && (
            <aside
              ref={inspectorRef}
              data-pointer-uid={mouseAnchored ? inspected.uid : undefined}
              aria-label={`Prévia de ${inspected.definition.name}`}
              className={`card-inspector ${inspectionPinned ? "pinned" : ""} ${fromHand ? "hand-preview" : "board-preview"} ${mouseAnchored ? "pointer-preview" : ""} ${mouseAnchored && hover ? "following-pointer" : ""}`}
              style={
                pointerPosition
                  ? {
                      ...pointerPosition,
                      width: fromHand ? handPreviewWidth : boardPreviewWidth,
                    }
                  : fromHand
                    ? { left: handPreviewLeft, width: handPreviewWidth }
                    : { ...boardPreviewPosition, width: boardPreviewWidth }
              }
            >
              <button
                className="close-inspector"
                aria-label="Fechar inspeção"
                onClick={() => {
                  setSelected(null);
                  setHover(null);
                }}
              >
                ×
              </button>
              <button
                className="zoom-art"
                aria-label="Ampliar carta"
                onClick={() => setZoom(true)}
              >
                <CardFace
                  id={inspected.card}
                  name={inspected.definition.name}
                  onLoad={measurePreview}
                />
              </button>
              <div className="preview-details">
                <h3>{inspected.definition.name}</h3>
                <EditionLine id={inspected.card} />
                <p>
                  {inspected.definition.text || "Monstro sem efeito adicional."}
                </p>
                {view.energyRule === 'reserve-v1' && inspected.definition.fx.store && (
                  <p className="variant-note">Energia acumulada: toda a sobra já permanece na reserva. Este suporte não guarda energia extra nem limita o saldo a 1.</p>
                )}
                {inBattle && (
                  <div className="live-stats">
                    Em jogo:{" "}
                    <b>
                      {inspected.power} força / {inspected.health} vigor
                      restante
                    </b>
                  </div>
                )}
                {activeAbilities.length > 0 && (
                  <section
                    className="active-abilities"
                    aria-label="Habilidades ativas"
                  >
                    <h4>Habilidades {inBattle ? "ativas" : "da carta"}</h4>
                    {activeAbilities.map((ability) => (
                      <div key={ability.name} className="ability-detail">
                        <strong>
                          {ability.icon} {ability.name}
                        </strong>
                        <p>{ability.description}</p>
                        {ability.sources.map((source) => (
                          <small key={source}>{source}</small>
                        ))}
                      </div>
                    ))}
                  </section>
                )}
                {inspected.definition.support && (
                  <div className="support-note">
                    {inspectedPlayer?.back.some((x) => x.uid === inspected.uid)
                      ? "♜ Suporte ativo — está na retaguarda"
                      : "♜ Suporte inativo — funciona na retaguarda"}
                  </div>
                )}
                {inspectionPinned && (
                  <div className="inspector-actions">
                    {inspectOptions
                      .filter((o) => o.action.kind !== "attack")
                      .map(actionButton)}
                    {inspectOptions.some((o) => o.action.kind === "attack") && (
                      <details className="attack-options">
                        <summary>Atacar sem arrastar</summary>
                        {inspectOptions
                          .filter((o) => o.action.kind === "attack")
                          .map(actionButton)}
                      </details>
                    )}
                    {inspectOptions.some((o) => o.action.kind === "attack") && (
                      <button
                        className="gold-btn"
                        onClick={() => {
                          setArmed(inspected.uid);
                          setSelected(null);
                          setHover(null);
                        }}
                      >
                        Escolher alvo do ataque →
                      </button>
                    )}
                    {blocked &&
                      view.players[ownSeat].hand.some(
                        (x) => x.uid === inspected.uid,
                      ) && <span className="blocked">{blocked}</span>}
                    <button
                      className="text-btn"
                      onClick={() => {
                        setArmed(inspected.uid);
                        setSelected(null);
                        setHover(null);
                      }}
                    >
                      Mostrar destinos no campo
                    </button>
                  </div>
                )}
              </div>
            </aside>
          )}
          {history && (
            <aside className="history-drawer">
              <div>
                <h3>Histórico do duelo</h3>
                <button
                  aria-label="Fechar histórico"
                  onClick={() => setHistory(false)}
                >
                  ×
                </button>
              </div>
              <section className="feedback-history" aria-label="Causas dos acontecimentos">
                <h4>Cartas, alvos e consequências</h4>
                {[...(view.feedback??[])].reverse().slice(0,45).map(e=><p key={e.id}><small>T{e.turn}</small>{eventText(e,ownSeat)}</p>)}
              </section>
              {[...view.log].reverse().map((l, i) => (
                <p key={i}>
                  <small>T{l.turn}</small>
                  {l.text}
                </p>
              ))}
            </aside>
          )}
          <FeedbackStatus event={feedbackPlayer.step} seat={ownSeat} left={feedbackPlayer.left} playing={feedbackPlayer.playing}/>
          {view.winner !== null && (
            <div className="overlay">
              <section className="end-panel" role="dialog" aria-modal="true" aria-label="Resultado do duelo" tabIndex={-1} ref={endRef} onKeyDown={e=>{
                if(e.key!=='Tab') return;
                const items=endRef.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
                const first=items[0],last=items[items.length-1];
                if(e.shiftKey && (document.activeElement===first || document.activeElement===endRef.current)){e.preventDefault();last?.focus()}
                else if(!e.shiftKey && (document.activeElement===last || document.activeElement===endRef.current)){e.preventDefault();first?.focus()}
              }}>
                <span>✧</span>
                <h1>
                  {view.winner === "draw"
                    ? "Empate"
                    : view.winner === ownSeat
                      ? "Vitória"
                      : "O rival venceu"}
                </h1>
                <p>O coração de Véspera continua pulsando.</p>
                {friends ? <button className="gold-btn" disabled={busy || room!.rematch[ownSeat]} onClick={()=>void rematch()}>{room!.rematch[ownSeat] ? 'Aguardando revanche do amigo…' : room!.rematch[rivalSeat] ? 'Aceitar revanche' : 'Pedir revanche'}</button> : <button className="gold-btn" onClick={()=>{setView(null);setToken('');setRoom(null);setSelected(null);revision.current=-1}}>Jogar novamente →</button>}
                {friends && <button onClick={()=>{setView(null);setToken('');setRoom(null);revision.current=-1}}>Voltar ao santuário</button>}
                <button className="action-btn" onClick={downloadReplay}>
                  Baixar replay →
                </button>
              </section>
            </div>
          )}
        </>
      )}
      {confirmConcede && <DuelSetup title="Conceder duelo" closeLabel="Fechar confirmação" onClose={()=>setConfirmConcede(false)}><h2>Conceder este duelo?</h2><p>Seu amigo vencerá a partida atual.</p><button disabled={busy} onClick={()=>void act({kind:'concede'})}>Confirmar concessão</button><button onClick={()=>setConfirmConcede(false)}>Continuar jogando</button></DuelSetup>}
      {room?.waiting && <div className="friends-wait"><section role="dialog" aria-modal="true" aria-label="Sala de amigos" tabIndex={-1} ref={waitingRef} onKeyDown={e=>{if(e.key==='Tab'){const nodes=waitingRef.current!.querySelectorAll<HTMLElement>('input,button');const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey && (document.activeElement===first || document.activeElement===waitingRef.current)){e.preventDefault();last?.focus()}else if(!e.shiftKey && (document.activeElement===last || document.activeElement===waitingRef.current)){e.preventDefault();first?.focus()}}}}><h1>Sua sala está pronta</h1><p>Envie o convite. Seu amigo escolhe o próprio deck antes de entrar.</p><p>Regras: {room.variant} · apenas dois jogadores.</p><label>Link do convite<input readOnly value={`${location.origin}/#sala=${room.code}`} onFocus={e=>e.currentTarget.select()}/></label><p>Código: <code>{room.code}</code></p><button onClick={()=>{void navigator.clipboard?.writeText(`${location.origin}/#sala=${room.code}`).then(()=>setNotice('Convite copiado.')).catch(()=>setNotice('Selecione o link acima para copiar.'))}}>Copiar convite</button><p role="status">{connection || 'Aguardando seu amigo entrar…'}</p><p>O amigo precisa acessar este mesmo servidor. Um endereço 127.0.0.1 só funciona neste computador.</p><button onClick={()=>{setToken('');setRoom(null);setView(null)}}>Voltar ao santuário</button></section></div>}
      {attackLink && (
        <svg className="attack-line committed-link" aria-hidden="true">
          <defs>
            <marker
              id="committed-tip"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path
                d="M0,0 L6,3 L0,6"
                fill="none"
                stroke="#edc48f"
                strokeWidth="1.5"
              />
            </marker>
          </defs>
          <path className="attack-curve"
            d={attackCurve(attackLink.from,attackLink.to)}
            markerEnd="url(#committed-tip)"
          />
        </svg>
      )}
      {dragging && (
        <>
          {options.some(
            (o) => o.uid === dragging.uid && o.action.kind === "attack",
          ) &&
            drag.current && (
              <svg className="attack-line" aria-hidden="true">
                <defs>
                  <marker
                    id="arrow-tip"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <path
                      d="M0,0 L6,3 L0,6"
                      fill="none"
                      stroke="#edc48f"
                      strokeWidth="1.5"
                    />
                  </marker>
                </defs>
                <path className="attack-curve"
                  ref={aim}
                  d={attackCurve({x:drag.current.origin.x+drag.current.origin.width/2,y:drag.current.origin.y+drag.current.origin.height/2},{x:drag.current.x,y:drag.current.y})}
                  markerEnd="url(#arrow-tip)"
                />
              </svg>
            )}
          {drag.current?.mode !== "attack" && (
            <div
              className="drag-ghost"
              ref={ghost}
              style={{
                transform: `translate3d(${(drag.current?.x ?? 0) - 62}px,${(drag.current?.y ?? 0) - 88}px,0)`,
              }}
              aria-hidden="true"
            >
              <CardFace id={dragging.card} name="" />
              <span>
                {drop ? "Soltar para confirmar" : "Escolha uma área iluminada"}
              </span>
            </div>
          )}
        </>
      )}
      {help && (
        <div className="overlay" onClick={() => setHelp(null)}>
          <section
            className="help-panel"
            role="dialog"
            aria-label={`Sobre ${zoneHelp[help].name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close" onClick={() => setHelp(null)}>
              ×
            </button>
            <span className="help-icon">{zoneHelp[help].icon}</span>
            <span className="eyebrow">CONHEÇA SUA MESA</span>
            <h2>{zoneHelp[help].name}</h2>
            <p>{zoneHelp[help].description}</p>
            <button className="gold-btn" onClick={() => setHelp(null)}>
              Entendi
            </button>
          </section>
        </div>
      )}
      {rules && (
        <div className="overlay" onClick={() => setRules(false)}>
          <section
            className="guide"
            role="dialog"
            aria-label="Guia da mesa"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close" onClick={() => setRules(false)}>
              ×
            </button>
            <span className="eyebrow">CADA ÁREA TEM UMA FUNÇÃO</span>
            <h2>Conheça o campo de batalha</h2>
            <p className="guide-intro">
              Arraste cartas da mão para as áreas iluminadas. Para atacar,
              arraste um monstro da frente até um alvo. Você também pode clicar
              nas cartas para jogar.
            </p>
            <div className="guide-zones">
              <article><div><h3>Energia entre turnos</h3><p>{(view?.energyRule ?? energyRule) === 'reserve-v1'
                ? 'A energia não gasta fica na reserva, sem limite, durante o turno rival e até você gastá-la. No seu Despertar, some a geração das fontes ao saldo. Uma fonte 1×3 gera três vezes ao todo, contando o sacrifício. Expirar ou destruir a fonte interrompe a geração futura, mas conserva a energia já produzida. A Guardiã da Cisterna não acrescenta energia: guardar já é regra geral no modo de reserva.'
                : 'A sobra é perdida no encerramento. A Guardiã da Cisterna pode guardar até 1 para o próximo turno.'}</p></div></article>
              <article><div><h3>Ressonância · As Terras Despertas</h3><p>Escola permanente permite conjurar; Presença conta fontes ativas, monstros e encantamentos no campo. Ressonância verifica essa Presença ao resolver o efeito. A própria entrada pode contar; Magias e cartas no Véu não contam. Bônus usa o mesmo alvo e não renova um ataque já usado.</p></div></article>
              {Object.entries(zoneHelp)
                .filter(([id]) => id !== "cast")
                .map(([id, z]) => (
                  <article key={id}>
                    <span>{z.icon}</span>
                    <div>
                      <h3>{z.name}</h3>
                      <p>{z.description}</p>
                    </div>
                  </article>
                ))}
            </div>
            <div className="guide-footer">
              <b>{(view?.variant ?? variant) === "escolas-v1" ? "Energia paga. Escola libera cartas. Presença mede o campo." : "Energia paga o custo. Presença libera a escola."}</b>
              <p>
                {(view?.variant ?? variant) === "escolas-v1" ? "Escola só aumenta: +1 por escola a cada fonte criada ou carta conjurada, mesmo ao jogar novamente. O requisito é conferido antes do avanço da carta. Presença soma fontes ativas, monstros e encantamentos e cai quando saem. Armar um Prenúncio também avança a Escola pública, sem revelar sua identidade. Esc cancela a seleção." : "A presença soma fontes, monstros e encantamentos; nunca é consumida. Esc cancela a seleção."}
              </p>
            </div>
          </section>
        </div>
      )}
      {zoom && inspected && (
        <div className="overlay art-zoom" onClick={() => setZoom(false)}>
          <CardFace id={inspected.card} name={inspected.definition.name} />
          <EditionLine id={inspected.card} />
          <span>Clique para fechar · Esc</span>
        </div>
      )}
      {collectionOpen && (
        <Collection onClose={() => setCollectionOpen(false)} />
      )}
      {deckManagerOpen && (
        <DeckManager
          library={deckLibrary}
          onLibraryChange={setDeckLibrary}
          onClose={() => setDeckManagerOpen(false)}
          onPlay={d=>{
            if(d.cards.some(c=>isPilotCard(c.id))){setCustomId(d.id);setCardPool('terras-v1');setPlayMode('solo');setSetupOpen(true);setDeckManagerOpen(false);return Promise.resolve(true)}
            return start(d,'solo');
          }}
          busy={busy}
        />
      )}
    </div>
  );
}
const root = document.getElementById("root");
if (root) startFrameProbe();
if (root)
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
