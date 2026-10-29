// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import {
  render,
  fireEvent,
  screen,
  waitFor,
  cleanup,
  within,
} from "@testing-library/react";
import { App } from "../web/main";
import { readDeckLibrary, writeDeckLibrary } from "../web/deck-storage";
import { starterDecks } from "../engine/decks";
import { applyAction, createGame, viewFor } from "../engine/engine";
import type { Action, Game, Piece, Zone } from "../engine/types";
import {
  keywordDetails,
  localPreviewPosition,
  pointerPreviewPosition,
} from "../web/presentation";
let game: Game, actions: Action[], dropTarget: Element | null;
function add(id: string, zone: Zone, seat: 0 | 1 = 0): Piece {
  const x: Piece = {
    uid: `ui${++game.seq}`,
    card: id,
    damage: 0,
    duration: 3,
    born: 0,
    attacked: false,
    retreated: false,
    temp: 0,
    haste: false,
  };
  game.players[seat].zones[zone].push(x);
  return x;
}
async function mount() {
  render(<App />);
  await screen.findByRole("main", { name: "Campo de batalha" });
}
// Na mesa, Guia/Coleção/Decks/Santuário ficam dentro do Grimório (WB-26).
function openGrimoire() {
  const toggle = screen.getByRole("button", { name: "Grimório" });
  if (toggle.getAttribute("aria-expanded") !== "true") fireEvent.click(toggle);
}
async function dragTo(x: Piece, destination: Element) {
  const card = screen.getByTestId(`card-${x.uid}`);
  dropTarget = destination;
  fireEvent.pointerDown(card, {
    button: 0,
    pointerId: 1,
    clientX: 500,
    clientY: 650,
  });
  fireEvent.pointerMove(card, { pointerId: 1, clientX: 530, clientY: 500 });
  await waitFor(() =>
    expect(document.querySelector(".drag-ghost,.attack-line")).not.toBeNull(),
  );
  fireEvent.pointerUp(card, { pointerId: 1, clientX: 530, clientY: 500 });
}
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem("wb-session", "test-local");
  actions = [];
  dropTarget = null;
  game = createGame({
    seed: 333,
    decks: ["Queimada", "Pira"],
    variant: "base-0.3",
    first: 0,
  });
  game.phase = "main";
  game.kept = [true, true];
  for (const p of game.players) {
    for (const z of Object.keys(p.zones) as Zone[]) p.zones[z] = [];
    p.energy = 10;
  }
  class PointerMock extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: PointerEventInit) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
    }
  }
  vi.stubGlobal("PointerEvent", PointerMock);
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      matches: true,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
  HTMLElement.prototype.setPointerCapture = () => {};
  HTMLElement.prototype.animate = vi.fn(() => {
    const a = { onfinish: null as (() => void) | null };
    setTimeout(() => a.onfinish?.(), 0);
    return a as unknown as Animation;
  });
  document.elementsFromPoint = () => (dropTarget ? [dropTarget] : []);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (path: string, init?: RequestInit) => {
      if (path.endsWith("/state"))
        return { ok: true, json: async () => ({ view: viewFor(game, 0) }) };
      if (path.endsWith("/new")) {
        const body = JSON.parse(init?.body as string);
        game = createGame({
          seed: 513,
          decks: [body.customDeck?.name ?? body.deck, body.opponent ?? "Pira"],
          ...(body.customDeck ? { customDecks: [body.customDeck, null] } : {}),
          variant: body.variant ?? "base-0.3",
          first: 0,
        });
        return {
          ok: true,
          json: async () => ({ token: "custom-test", view: viewFor(game, 0) }),
        };
      }
      if (path.endsWith("/action")) {
        const body = JSON.parse(init?.body as string);
        actions.push(body.action);
        game = applyAction(game, 0, body.action);
        return { ok: true, json: async () => ({ view: viewFor(game, 0) }) };
      }
      return {
        ok: true,
        json: async () => ({ view: viewFor(game, 0), played: false }),
      };
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document
    .querySelectorAll(".number-float,.departing-card")
    .forEach((x) => x.remove());
});
describe("Mesa interativa — DOM simulado, sem medição de fluidez", () => {
  it.each(['pointercancel','blur'])('interrupção %s cancela arrasto e permite selecionar novamente sem gastar ação', async event=>{
    const x=add('VES-009','hand'); await mount();const el=screen.getByTestId(`card-${x.uid}`);
    fireEvent.pointerDown(el,{button:0,pointerId:8,clientX:400,clientY:600});
    fireEvent.pointerMove(el,{pointerId:8,clientX:440,clientY:550});
    expect(document.querySelector('.drag-ghost')).not.toBeNull();
    if(event==='blur') fireEvent.blur(window); else fireEvent.pointerCancel(el,{pointerId:8});
    expect(document.querySelector('.drag-ghost')).toBeNull();expect(actions).toHaveLength(0);
    fireEvent.click(el);expect(screen.getByLabelText(`Prévia de ${el.getAttribute('aria-label')}`)).toBeTruthy();
  });
  it('soltura fora da zona válida ignora destino anterior do arrasto', async()=>{
    const x=add('VES-002','hand');await mount();const el=screen.getByTestId(`card-${x.uid}`);
    dropTarget=document.querySelector('[data-drop="0:sources"]');
    fireEvent.pointerDown(el,{button:0,pointerId:4,clientX:400,clientY:600});
    fireEvent.pointerMove(el,{pointerId:4,clientX:440,clientY:550});
    dropTarget=null;fireEvent.pointerUp(el,{pointerId:4,clientX:900,clientY:100});
    expect(actions).toHaveLength(0);expect(document.querySelector('.drag-ghost')).toBeNull();
  });
  it('convidado vê sua própria mão e sacrifica no assento 1 sem acionar o bot', async()=>{
    game.active=1;const x=add('VES-009','hand',1);
    vi.stubGlobal('fetch',vi.fn(async(path:string,init?:RequestInit)=>{
      if(path.endsWith('/action')){const b=JSON.parse(init!.body as string);actions.push(b.action);game=applyAction(game,1,b.action)}
      return {ok:true,json:async()=>({view:viewFor(game,1),revision:actions.length,room:{mode:'friends',seat:1,code:'TEST',waiting:false,round:1,variant:'base-0.3',rematch:[false,false],opponentOnline:true}})};
    }));
    await mount();expect(screen.getByTestId(`card-${x.uid}`)).toBeTruthy();
    await dragTo(x,document.querySelector('[data-drop="1:sources"]')!);
    await waitFor(()=>expect(game.players[1].zones.sources).toHaveLength(1));
    expect(game.players[0].zones.sources).toHaveLength(0);
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls.some(c=>c[0].endsWith('/bot'))).toBe(false);
  });
  it('decisão privada de topo mostra carta e permite escolher fundo',async()=>{
    add('VES-018','front');const top=add('VES-071','deck'),spell=add('VES-058','hand');
    game=applyAction(game,0,{kind:'cast',uid:spell.uid,row:'front'});await mount();
    expect(screen.getByRole('dialog',{name:/Topo do seu baralho: Fênix/})).toBeTruthy();
    expect(screen.getAllByText('Sua decisão').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button',{name:'Colocar no fundo Escolher →'}));
    await waitFor(()=>expect(game.pending).toBeNull());expect(game.players[0].zones.deck[0].uid).toBe(top.uid);
  });
  it('cura parcial na interface permite escolher zero sem perder o ferimento',async()=>{
    const target=add('VES-012','front');target.damage=2;const spell=add('VES-013','hand');
    game=applyAction(game,0,{kind:'cast',uid:spell.uid});await mount();
    fireEvent.click(screen.getByRole('button',{name:'Remover 0 de dano Escolher →'}));
    await waitFor(()=>expect(game.pending).toBeNull());expect(game.players[0].zones.front[0].damage).toBe(2);
  });
  it('carta fixada por clique conserva ações ao atravessar outra carta com o ponteiro',async()=>{
    add('VES-065','hand');add('VES-019','hand');await mount();
    fireEvent.click(screen.getByRole('button',{name:'Revelar a Comporta'}));
    fireEvent.mouseEnter(screen.getByRole('button',{name:'Leitora das Correntes'}));
    const source=screen.getByRole('button',{name:'Fonte: Revelar a Comporta →'});
    fireEvent.click(source);
    await waitFor(()=>expect(game.players[0].zones.sources.some(x=>x.card==='VES-065')).toBe(true));
  });
  it('prévia Atlas não consulta sessão nem envia ações ou remove o token real',async()=>{
    add('VES-002','hand');
    render(<App initialView={viewFor(game,0)} previewMode/>);
    expect(fetch).not.toHaveBeenCalled();
    const card=screen.getByRole('button',{name:'Vigia da Caldeira'});fireEvent.click(card);
    const option=screen.getAllByRole('button').find(b=>b.textContent?.includes('Fonte: Vigia da Caldeira'));
    expect(option).toBeDefined();fireEvent.click(option!);
    await screen.findByRole('status');expect(fetch).not.toHaveBeenCalled();
    openGrimoire();
    fireEvent.click(screen.getByRole('button',{name:'Santuário'}));
    expect(localStorage.getItem('wb-session')).toBe('test-local');
  });
  it('Grimório reúne os atalhos da mesa, mostra o contexto do duelo e fecha por Esc ou toque fora',async()=>{
    await mount();
    expect(screen.queryByRole('button',{name:'Coleção'})).toBeNull();
    expect(screen.queryByText('Vaga livre')).toBeNull();
    const toggle=screen.getByRole('button',{name:'Grimório'});
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const menu=screen.getByRole('navigation',{name:'Grimório'});
    for(const name of ['Guia da mesa','Coleção','Meus decks','Feedback','Histórico','Santuário'])expect(within(menu).getByRole('button',{name})).toBeTruthy();
    expect(within(menu).getByText('Duelo solo')).toBeTruthy();
    fireEvent.keyDown(within(menu).getByRole('button',{name:'Histórico'}),{key:'Escape'});
    expect(screen.queryByRole('navigation',{name:'Grimório'})).toBeNull();
    fireEvent.click(toggle);
    fireEvent.pointerDown(document.querySelector('.battlefield')!);
    expect(screen.queryByRole('navigation',{name:'Grimório'})).toBeNull();
  });
  it('mesa v2 separa placas de Escola/Presença da barra do mago e acende as escolas de cartas jogáveis',async()=>{
    game.config.variant='escolas-v1';game.players[0].school={Chama:3};const playable=add('VES-002','hand');await mount();
    const plates=document.querySelector('.school-plates.ally')!;
    expect(plates).not.toBeNull();
    expect(plates.contains(screen.getByLabelText('Presença aliada'))).toBe(true);
    expect(plates.contains(screen.getByLabelText('Escola aliada'))).toBe(true);
    expect(document.querySelector('.player-bar:not(.rival-player) .school-presence')).toBeNull();
    expect(screen.getByTestId(`card-${playable.uid}`).classList.contains('playable')).toBe(true);
    expect(document.querySelectorAll('.school-plates.ally .school.chama.wanted')).toHaveLength(2);
    expect(document.querySelectorAll('.school-plates.rival .wanted')).toHaveLength(0);
  });
  it('Atlas preenche três vagas de encantamento e duas de Véu com dados reais, sem cartas fictícias',async()=>{
    await mount();
    expect(document.querySelectorAll('.ritual-vacant')).toHaveLength(10);
    expect(document.querySelectorAll('.atlas-school-icon')).toHaveLength(8);
    expect(screen.getByLabelText('Vida aliada: 15')).toBeTruthy();
    expect(screen.getByLabelText('Energia aliada: 10')).toBeTruthy();
    expect(document.querySelector('.app.atlas')).not.toBeNull();
  });
  it("home tem destinos reais e só abre configuração após Jogar; Esc retorna foco", async()=>{
    localStorage.removeItem('wb-session');render(<App/>);
    const home=screen.getByRole('main',{name:'Santuário do Pulso'});
    expect(within(home).getAllByRole('button')).toHaveLength(5);
    expect(screen.queryByRole('dialog',{name:'Preparar duelo'})).toBeNull();
    const play=within(home).getByRole('button',{name:'Jogar'});play.focus();fireEvent.click(play);
    const setup=screen.getByRole('dialog',{name:'Preparar duelo'});
    expect((within(setup).getByRole('combobox',{name:'Regras do duelo'}) as HTMLSelectElement).value).toBe('escolas-v1');
    fireEvent.keyDown(setup,{key:'Escape'});
    expect(screen.queryByRole('dialog',{name:'Preparar duelo'})).toBeNull();expect(document.activeElement).toBe(play);
  });
  it('mostra Escola e Presença separadas; fonte sacrificável não recebe ponto verde de conjuração',async()=>{
    game.config.variant='escolas-v1';game.players[0].school={Sombra:3};
    const blocked=add('VES-002','hand');await mount();
    expect(screen.getByLabelText('Escola aliada').textContent).toContain('3');
    expect(screen.getByLabelText('Presença aliada').textContent).toContain('0');
    expect(screen.getByTestId(`card-${blocked.uid}`).querySelector('.playable-dot')).toBeNull();
  });
  it("cria deck por modelo, renomeia, salva e reabre sem perder cartas", async () => {
    await mount();
    openGrimoire();
    fireEvent.click(screen.getByRole("button", { name: "Meus decks" }));
    fireEvent.click(screen.getByRole("button", { name: "Copiar Pira" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Nome do deck" }), {
      target: { value: "Minhas Cinzas" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar deck" }));
    expect(readDeckLibrary().decks[0].name).toBe("Minhas Cinzas");
    expect(
      readDeckLibrary().decks[0].cards.reduce((sum, c) => sum + c.copies, 0),
    ).toBe(40);
    fireEvent.click(
      screen.getByRole("button", { name: "Fechar gerenciador ×" }),
    );
    openGrimoire();
    fireEvent.click(screen.getByRole("button", { name: "Meus decks" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Minhas Cinzas 40/40 · Pronto para jogar",
      }),
    );
    expect(
      (
        screen.getByRole("textbox", {
          name: "Nome do deck",
        }) as HTMLInputElement
      ).value,
    ).toBe("Minhas Cinzas");
  });
  it("limita três cópias, salva rascunho e mantém jogar bloqueado até completar 40", async () => {
    await mount();
    openGrimoire();
    fireEvent.click(screen.getByRole("button", { name: "Meus decks" }));
    const dialog = screen.getByRole("dialog", { name: "Gerenciar decks" });
    fireEvent.change(
      within(dialog).getByRole("searchbox", { name: "Buscar carta" }),
      { target: { value: "Vigia da Caldeira" } },
    );
    const add = within(dialog).getByRole("button", {
      name: "Adicionar Vigia da Caldeira",
    });
    fireEvent.click(add);
    fireEvent.click(add);
    fireEvent.click(add);
    expect((add as HTMLButtonElement).disabled).toBe(true);
    expect(
      (
        within(dialog).getByRole("button", {
          name: "Jogar com este deck →",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Salvar deck" }),
    );
    expect(readDeckLibrary().decks[0].cards).toEqual([
      { id: "VES-002", copies: 3 },
    ]);
    fireEvent.change(
      within(dialog).getByRole("searchbox", { name: "Buscar carta" }),
      { target: { value: "Aprendiz das Comportas" } },
    );
    expect(
      within(dialog).getByRole("button", { name: "Adicionar Aprendiz das Comportas" }),
    ).toBeTruthy();
  });
  it("duplica com ID próprio e exclusão confirmada preserva o original", async () => {
    await mount();
    openGrimoire();
    fireEvent.click(screen.getByRole("button", { name: "Meus decks" }));
    fireEvent.click(screen.getByRole("button", { name: "Copiar Pira" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar deck" }));
    fireEvent.click(screen.getByRole("button", { name: "Duplicar deck" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar deck" }));
    const entries = readDeckLibrary().decks;
    expect(entries).toHaveLength(2);
    expect(entries[0].id).not.toBe(entries[1].id);
    fireEvent.click(screen.getByRole("button", { name: "Excluir deck" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar exclusão" }));
    expect(readDeckLibrary().decks.map((d) => d.id)).toEqual([entries[0].id]);
  });
  it("protege alterações não salvas e permite salvar rascunho ao fechar", async () => {
    await mount();
    openGrimoire();
    fireEvent.click(screen.getByRole("button", { name: "Meus decks" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Nome do deck" }), {
      target: { value: "Meu rascunho" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Fechar gerenciador ×" }),
    );
    expect(
      screen.getByRole("alertdialog", { name: "Alterações não salvas" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continuar editando" }));
    expect(
      screen.getByRole("dialog", { name: "Gerenciar decks" }),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Fechar gerenciador ×" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Salvar e continuar" }));
    expect(
      screen.queryByRole("dialog", { name: "Gerenciar decks" }),
    ).toBeNull();
    expect(readDeckLibrary().decks[0].name).toBe("Meu rascunho");
  });
  it("jogar no gerenciador envia a lista salva e abre duelo com seu nome", async () => {
    await mount();
    openGrimoire();
    fireEvent.click(screen.getByRole("button", { name: "Meus decks" }));
    fireEvent.click(screen.getByRole("button", { name: "Copiar Queimada" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Nome do deck" }), {
      target: { value: "Meu primeiro deck" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Remover Vigia da Caldeira" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Adicionar Catadora de Lamparinas" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Jogar com este deck →" }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Gerenciar decks" }),
      ).toBeNull(),
    );
    expect(game.players[0].deckName).toBe("Meu primeiro deck");
    expect(
      game.config.customDecks![0]!.cards.find((c) => c.id === "VES-047")
        ?.copies,
    ).toBe(1);
    expect(
      game.config.customDecks![0]!.cards.find((c) => c.id === "VES-002")
        ?.copies,
    ).toBe(1);
    expect(game.config.customDecks![0]!.cards).toEqual(
      readDeckLibrary().decks[0].cards,
    );
    expect(
      game.players[0].zones.hand.length + game.players[0].zones.deck.length,
    ).toBe(40);
  });
  it("lobby seleciona deck salvo e escolhe o deck rival", async () => {
    const saved = {
      ...structuredClone(starterDecks[0]),
      id: "local-lobby",
      updatedAt: new Date().toISOString(),
      name: "Deck do lobby",
    };
    writeDeckLibrary([saved], 0);
    await mount();
    openGrimoire();
    fireEvent.click(screen.getByRole("button", { name: "Santuário" }));
    fireEvent.click(screen.getByRole("button", { name: "Jogar" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Seus decks" }), {
      target: { value: saved.id },
    });
    fireEvent.change(
      screen.getByRole("combobox", { name: "Deck do autômato" }),
      { target: { value: "Pira" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Iniciar duelo →" }));
    await screen.findByRole("main", { name: "Campo de batalha" });
    expect(game.players[0].deckName).toBe(saved.name);
    expect(game.players[1].deckName).toBe("Pira");
    expect(game.config.customDecks![0]!.cards).toEqual(saved.cards);
  });
  it("carta em campo e prévia identificam edição, número e raridade sem perder o hover flutuante", async () => {
    const piece = add("VES-071", "front");
    await mount();
    const card = screen.getByTestId(`card-${piece.uid}`);
    expect(
      card.querySelector('[data-edition="VES"][data-rarity="rare"]'),
    ).not.toBeNull();
    expect(
      card.querySelector(".edition-mark")?.getAttribute("aria-label"),
    ).toContain("VES 071/80 · Rara");
    fireEvent.mouseEnter(card, { clientX: 180, clientY: 380 });
    const preview = screen.getByRole("complementary", {
      name: "Prévia de Fênix do Motor",
    });
    expect(preview.textContent).toContain("O Coração de Véspera");
    expect(preview.textContent).toContain("071/080 · Rara");
    expect(preview.classList.contains("following-pointer")).toBe(true);
  });
  it("coleção mostra as 80 cartas, filtra raras e busca nome sem acento", async () => {
    await mount();
    openGrimoire();
    fireEvent.click(screen.getByRole("button", { name: "Coleção" }));
    const dialog = screen.getByRole("dialog", { name: "Coleção de cartas" });
    fireEvent.change(within(dialog).getByLabelText('Edição'),{target:{value:'VES'}});
    expect(within(dialog).getByRole("status").textContent).toContain(
      "80 cartas encontradas",
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Rara 12" }));
    expect(within(dialog).getByRole("status").textContent).toContain(
      "12 cartas encontradas",
    );
    fireEvent.change(
      within(dialog).getByRole("searchbox", { name: "Buscar carta" }),
      { target: { value: "fenix" } },
    );
    expect(within(dialog).getByRole("status").textContent).toContain(
      "1 carta encontrada",
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Consultar Fênix do Motor" }),
    );
    expect(
      within(dialog).getByRole("complementary", {
        name: "Detalhes de Fênix do Motor",
      }).textContent,
    ).toContain("Rara (R)");
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(
      screen.queryByRole("dialog", { name: "Coleção de cartas" }),
    ).toBeNull();
    expect(actions).toHaveLength(0);
  });
  it("busca vazia informa ausência de resultados e modal prende/restaura foco", async () => {
    await mount();
    openGrimoire();
    const opener = screen.getByRole("button", { name: "Coleção" });
    opener.focus();
    fireEvent.click(opener);
    const dialog = screen.getByRole("dialog", { name: "Coleção de cartas" });
    expect(document.activeElement).toBe(dialog);
    fireEvent.keyDown(dialog, { key: "Tab" });
    const close = within(dialog).getByRole("button", {
      name: "Fechar coleção",
    });
    expect(document.activeElement).toBe(close);
    fireEvent.change(
      within(dialog).getByRole("searchbox", { name: "Buscar carta" }),
      { target: { value: "não existe VES-999" } },
    );
    expect(
      within(dialog).getByText("Nenhuma carta corresponde aos filtros."),
    ).toBeTruthy();
    fireEvent.click(close);
    expect(document.activeElement).toBe(opener);
  });
  it("prévia flutuante acompanha X e Y do mouse durante hover e fecha ao sair", async () => {
    const piece = add("VES-047", "front");
    await mount();
    const card = screen.getByTestId(`card-${piece.uid}`);
    fireEvent.mouseEnter(card, { clientX: 180, clientY: 380 });
    const panel = screen.getByRole("complementary", {
      name: "Prévia de Catadora de Lamparinas",
    });
    expect(panel.classList.contains("following-pointer")).toBe(true);
    const left = panel.style.left,
      top = panel.style.top;
    fireEvent.mouseMove(card, { clientX: 220, clientY: 410 });
    await waitFor(() => {
      expect(panel.style.left).not.toBe(left);
      expect(panel.style.top).not.toBe(top);
    });
    expect(
      screen.getByRole("complementary", {
        name: "Prévia de Catadora de Lamparinas",
      }),
    ).toBe(panel);
    fireEvent.mouseMove(card, { clientX: 225, clientY: 415 });
    fireEvent.mouseLeave(card);
    expect(
      screen.queryByRole("complementary", {
        name: "Prévia de Catadora de Lamparinas",
      }),
    ).toBeNull();
    expect(actions).toHaveLength(0);
  });
  it("prévia da mão também segue o mouse e clique permite consultar ações sem hover", async () => {
    const piece = add("VES-009", "hand");
    await mount();
    const card = screen.getByTestId(`card-${piece.uid}`);
    fireEvent.mouseEnter(card, { clientX: 160, clientY: 380 });
    const panel = screen.getByRole("complementary", {
      name: "Prévia de Faísca Desgarrada",
    });
    expect(panel.classList.contains("pointer-preview")).toBe(true);
    const left = panel.style.left;
    fireEvent.mouseMove(card, { clientX: 200, clientY: 390 });
    await waitFor(() => expect(panel.style.left).not.toBe(left));
    fireEvent.click(card);
    fireEvent.mouseLeave(card);
    expect(panel.classList.contains("following-pointer")).toBe(false);
    expect(panel.classList.contains("pinned")).toBe(true);
    expect(screen.getByRole("button", { name: /Fonte: Faísca/ })).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(
      screen.queryByRole("complementary", {
        name: "Prévia de Faísca Desgarrada",
      }),
    ).toBeNull();
  });
  it("prévia junto ao mouse troca de lado e fica dentro da tela nas bordas", () => {
    const viewport = { width: 1920, height: 1080 },
      panel = { width: 620, height: 590 };
    const right = pointerPreviewPosition({ x: 300, y: 500 }, panel, viewport);
    expect(right.left).toBe(320);
    const left = pointerPreviewPosition({ x: 1750, y: 500 }, panel, viewport);
    expect(left.left + panel.width).toBe(1730);
    for (const point of [
      { x: 0, y: 0 },
      { x: 1919, y: 1079 },
    ]) {
      const position = pointerPreviewPosition(point, panel, viewport);
      expect(position.left).toBeGreaterThanOrEqual(16);
      expect(position.top).toBeGreaterThanOrEqual(16);
      expect(position.left + panel.width).toBeLessThanOrEqual(1904);
      expect(position.top + panel.height).toBeLessThanOrEqual(1064);
    }
  });
  it("Alcance informa a fonte e Ímpeto informa que pertence à própria carta", async () => {
    const catadora = add("VES-047", "front"),
      corredor = add("VES-025", "front");
    add("VES-048", "back");
    await mount();
    const shadow = screen.getByTestId(`card-${catadora.uid}`);
    expect(shadow.querySelector(".keyword-badge")?.textContent).toContain(
      "Alcance",
    );
    expect(
      shadow.querySelector(".keyword-badge")?.getAttribute("title"),
    ).toContain("Guia dos Túneis (retaguarda)");
    fireEvent.mouseEnter(shadow);
    const preview = screen.getByRole("complementary", {
      name: "Prévia de Catadora de Lamparinas",
    });
    expect(
      within(preview).getByRole("region", { name: "Habilidades ativas" })
        .textContent,
    ).toContain("Concedido por Guia dos Túneis (retaguarda)");
    expect(preview.textContent).toContain("retaguarda inimiga");
    fireEvent.mouseLeave(shadow);
    fireEvent.mouseEnter(screen.getByTestId(`card-${corredor.uid}`));
    const own = screen.getByRole("region", { name: "Habilidades ativas" });
    expect(own.textContent).toContain("Ímpeto");
    expect(own.textContent).toContain("Da própria carta");
    expect(own.textContent).not.toContain("Guia dos Túneis");
  });
  it("mostra simultaneamente todas as habilidades, incluindo a concedida por suporte", async () => {
    const phoenix = add("VES-071", "front");
    add("VES-048", "back");
    await mount();
    const card = screen.getByTestId(`card-${phoenix.uid}`);
    expect(
      [...card.querySelectorAll(".keyword-badge")].map((x) =>
        x.textContent?.trim(),
      ),
    ).toEqual(["ϟ Ímpeto", "➶ Alcance"]);
    fireEvent.focus(card);
    expect(
      screen.getByRole("region", { name: "Habilidades ativas" }).textContent,
    ).toContain("Guia dos Túneis");
  });
  it("explicação acompanha o motor: suporte fora da retaguarda não concede Alcance", () => {
    const catadora = add("VES-047", "front");
    const guide = add("VES-048", "back");
    const before = viewFor(game, 0).players[0];
    expect(keywordDetails(before, before.front[0]).map((x) => x.name)).toEqual([
      "Alcance",
    ]);
    game = applyAction(game, 0, { kind: "move", uid: guide.uid, row: "front" });
    const after = viewFor(game, 0).players[0];
    expect(
      keywordDetails(after, after.front.find((x) => x.uid === catadora.uid)!),
    ).toEqual([]);
  });
  it("preview do campo usa a posição da carta, inclusive por foco, e não um painel lateral fixo", async () => {
    const a = add("VES-047", "front"),
      b = add("VES-025", "front", 1);
    await mount();
    const first = screen.getByTestId(`card-${a.uid}`),
      second = screen.getByTestId(`card-${b.uid}`);
    vi.spyOn(first, "getBoundingClientRect").mockReturnValue({
      left: 450,
      top: 500,
      x: 450,
      y: 500,
      width: 96,
      height: 135,
    } as DOMRect);
    vi.spyOn(second, "getBoundingClientRect").mockReturnValue({
      left: 800,
      top: 200,
      x: 800,
      y: 200,
      width: 96,
      height: 135,
    } as DOMRect);
    fireEvent.mouseEnter(first);
    const preview = screen.getByRole("complementary", {
      name: "Prévia de Catadora de Lamparinas",
    });
    expect(preview.classList.contains("board-preview")).toBe(true);
    const left = preview.style.left;
    fireEvent.mouseLeave(first);
    fireEvent.focus(second);
    expect(
      screen.getByRole("complementary", {
        name: "Prévia de Corredor das Brasas",
      }).style.left,
    ).not.toBe(left);
  });
  it("posicionamento da prévia respeita as quatro bordas nas resoluções previstas", () => {
    for (const viewport of [
      { width: 1366, height: 768 },
      { width: 1920, height: 1080 },
    ]) {
      for (const left of [0, viewport.width - 96]) {
        for (const top of [0, viewport.height - 135]) {
          const panel = { width: 620, height: 590 };
          const pos = localPreviewPosition(
            { left, top, width: 96, height: 135 },
            panel,
            viewport,
          );
          expect(pos.left).toBeGreaterThanOrEqual(16);
          expect(pos.top).toBeGreaterThanOrEqual(16);
          expect(pos.left + panel.width).toBeLessThanOrEqual(
            viewport.width - 16,
          );
          expect(pos.top + panel.height).toBeLessThanOrEqual(
            viewport.height - 16,
          );
        }
      }
    }
  });
  it("prévia da mão abre junto da carta e acompanha a troca de hover", async () => {
    const a = add("VES-009", "hand"),
      b = add("VES-002", "hand");
    await mount();
    fireEvent.mouseEnter(screen.getByTestId(`card-${a.uid}`));
    expect(
      screen
        .getByRole("complementary", { name: "Prévia de Faísca Desgarrada" })
        .classList.contains("hand-preview"),
    ).toBe(true);
    fireEvent.mouseEnter(screen.getByTestId(`card-${b.uid}`));
    expect(
      screen.getByRole("complementary", {
        name: "Prévia de Vigia da Caldeira",
      }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("complementary", {
        name: "Prévia de Faísca Desgarrada",
      }),
    ).toBeNull();
  });
  it("mão sobe ao entrar na região e recolhe ao sair", async () => {
    add("VES-009", "hand");
    await mount();
    const tray = screen.getByTestId("hand-tray");
    expect(tray.getAttribute("data-expanded")).toBe("false");
    fireEvent.mouseEnter(tray);
    expect(tray.classList.contains("expanded")).toBe(true);
    fireEvent.mouseLeave(tray);
    expect(tray.classList.contains("expanded")).toBe(false);
    fireEvent.focus(screen.getByRole("button", { name: "Faísca Desgarrada" }));
    expect(tray.classList.contains("expanded")).toBe(true);
  });
  it("ataque mantém carta na origem e mostra apenas flecha até conectar o alvo", async () => {
    game.phase = "combat";
    const a = add("VES-002", "front"),
      b = add("VES-029", "front", 1);
    await mount();
    const el = screen.getByTestId(`card-${a.uid}`);
    dropTarget = document.querySelector(`[data-drop="piece:${b.uid}"]`);
    fireEvent.pointerDown(el, {
      button: 0,
      pointerId: 1,
      clientX: 500,
      clientY: 650,
    });
    expect(document.querySelector(".attack-line")).not.toBeNull();
    expect(document.querySelector(".attack-curve")?.getAttribute('d')).toContain(' Q ');
    expect(document.querySelector(".drag-ghost")).toBeNull();
    expect(el.classList.contains("lifted")).toBe(false);
    expect(el.classList.contains("aiming")).toBe(true);
    fireEvent.pointerMove(el, { pointerId: 1, clientX: 530, clientY: 500 });
    expect(document.querySelector(".attack-curve")?.getAttribute('d')).toMatch(/530 500$/);
    fireEvent.pointerUp(el, { pointerId: 1, clientX: 530, clientY: 500 });
    await waitFor(() =>
      expect(actions[0]).toEqual({ kind: "attack", uid: a.uid, target: b.uid }),
    );
    expect(document.querySelector(".committed-link")).not.toBeNull();
  });
  it("soltar ataque fora de um alvo não ataca nem move a carta", async () => {
    game.phase = "combat";
    const a = add("VES-002", "front");
    await mount();
    const el = screen.getByTestId(`card-${a.uid}`);
    fireEvent.pointerDown(el, {
      button: 0,
      pointerId: 1,
      clientX: 500,
      clientY: 650,
    });
    fireEvent.pointerMove(el, { pointerId: 1, clientX: 530, clientY: 500 });
    fireEvent.pointerUp(el, { pointerId: 1, clientX: 530, clientY: 500 });
    expect(actions).toHaveLength(0);
    expect(document.querySelector(".attack-line")).toBeNull();
    expect(game.players[0].zones.front[0].uid).toBe(a.uid);
  });
  it("mover uma carta entre fileiras anima a posição confirmada", async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: false }),
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const y = this.closest('[data-drop="0:back"]') ? 400 : 200;
        return {
          x: 400,
          y,
          width: 80,
          height: 110,
          top: y,
          bottom: y + 110,
          left: 400,
          right: 480,
          toJSON: () => ({}),
        };
      },
    );
    const x = add("VES-002", "front");
    await mount();
    await dragTo(x, document.querySelector('[data-drop="0:back"]')!);
    await waitFor(() => expect(game.players[0].zones.back[0]?.uid).toBe(x.uid));
    expect(HTMLElement.prototype.animate).toHaveBeenCalled();
  });
  it("dano ao mago inicia feedback numérico após a confirmação", async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: false }),
    });
    game.phase = "combat";
    const a = add("VES-002", "front");
    await mount();
    await dragTo(a, document.querySelector('[data-drop="1:mage"]')!);
    await waitFor(() => expect(game.players[1].life).toBe(13));
    await waitFor(()=>expect(document.querySelector('.feedback-number')?.textContent).toBe('−2'),{timeout:2500});
    expect(screen.getByLabelText('Acontecimento na mesa').textContent).toContain('Vigia da Caldeira');
  });
  it("arrastar da mão para Fontes envia sacrifício e atualiza energia/presença", async () => {
    const x = add("VES-009", "hand");
    await mount();
    await dragTo(x, document.querySelector('[data-drop="0:sources"]')!);
    await waitFor(() =>
      expect(actions).toEqual([{ kind: "sacrifice", uid: x.uid }]),
    );
    expect(game.players[0].energy).toBe(12);
    expect(game.players[0].zones.sources[0].uid).toBe(x.uid);
  });
  it("soltar na frente conjura na fileira escolhida, sem sacrificar", async () => {
    add("VES-009", "sources");
    const x = add("VES-002", "hand");
    await mount();
    await dragTo(x, document.querySelector('[data-drop="0:front"]')!);
    await waitFor(() =>
      expect(actions).toEqual([{ kind: "cast", uid: x.uid, row: "front" }]),
    );
    expect(game.players[0].zones.front).toHaveLength(1);
  });
  it("soltar em destino inválido devolve carta sem enviar ação", async () => {
    const x = add("VES-002", "hand");
    await mount();
    await dragTo(x, document.querySelector('[data-drop="1:front"]')!);
    await waitFor(() =>
      expect(document.querySelector(".drag-ghost")).toBeNull(),
    );
    expect(actions).toHaveLength(0);
    expect(game.players[0].zones.hand).toHaveLength(1);
    expect(screen.getByRole("status").textContent).toContain(
      "Nenhuma ação foi gasta",
    );
  });
  it("Esc cancela arrastar sem gastar recurso", async () => {
    const x = add("VES-009", "hand");
    await mount();
    const el = screen.getByTestId(`card-${x.uid}`);
    fireEvent.pointerDown(el, {
      button: 0,
      pointerId: 2,
      clientX: 400,
      clientY: 600,
    });
    fireEvent.pointerMove(el, { pointerId: 2, clientX: 420, clientY: 580 });
    await waitFor(() =>
      expect(document.querySelector(".drag-ghost")).not.toBeNull(),
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(document.querySelector(".drag-ghost")).toBeNull();
    expect(actions).toHaveLength(0);
  });
  it("arrastar atacante para o rival escolhe o alvo e resolve dano", async () => {
    game.phase = "combat";
    const a = add("VES-002", "front"),
      b = add("VES-029", "front", 1);
    await mount();
    await dragTo(a, document.querySelector(`[data-drop="piece:${b.uid}"]`)!);
    await waitFor(() =>
      expect(actions).toEqual([{ kind: "attack", uid: a.uid, target: b.uid }]),
    );
    expect(game.players[1].zones.front[0].damage).toBe(2);
  });
  it("clique continua oferecendo as mesmas ações e explica as zonas", async () => {
    const x = add("VES-009", "hand");
    await mount();
    fireEvent.click(screen.getByTestId(`card-${x.uid}`));
    expect(screen.getByRole("button", { name: /Fonte: Faísca/ })).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Sobre Fontes" })[0]);
    expect(
      screen.getByRole("dialog", { name: "Sobre Fontes" }).textContent,
    ).toContain("Um sacrifício por turno");
  });
  it("painel de gatilhos mostra cartas e a decisão vai para o motor", async () => {
    game.players[0].casts = 2;
    game.players[0].deaths = 1;
    const a = add("VES-033", "enchants"),
      b = add("VES-055", "enchants");
    add("VES-002", "deck", 1);
    game = applyAction(game, 0, { kind: "advance" });
    game = applyAction(game, 0, { kind: "advance" });
    await mount();
    const dialog = screen.getByRole("dialog", { name: /Gatilhos simultâneos/ });
    expect(dialog.textContent).toContain("O que resolve primeiro");
    fireEvent.click(
      screen.getByRole("button", {
        name: "Vigília dos Ausentes Resolver agora →",
      }),
    );
    await waitFor(() =>
      expect(actions[0]).toEqual({ kind: "choose", choice: b.uid }),
    );
    expect(game.players[1].life).toBe(13);
    expect(game.log.some((l) => l.text.includes("Ritmo das Fornalhas"))).toBe(
      true,
    );
  });
});
