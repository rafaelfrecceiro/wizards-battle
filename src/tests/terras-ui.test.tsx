// @vitest-environment jsdom
import React from 'react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import {App} from '../web/main';
import {createGame,viewFor} from '../engine/engine';
import {pilotDecks} from '../engine/decks';
import {writeDeckLibrary} from '../web/deck-storage';
let requests:Record<string,any>[];
beforeEach(()=>{
  localStorage.clear();sessionStorage.clear();requests=[];
  Object.defineProperty(window,'matchMedia',{configurable:true,value:()=>({matches:true,addEventListener(){},removeEventListener(){}})});
  HTMLElement.prototype.animate=vi.fn(()=>({onfinish:null}) as unknown as Animation);
  vi.stubGlobal('fetch',vi.fn(async(path:string,init?:RequestInit)=>{
    const body=init?.body?JSON.parse(String(init.body)):{};
    if(path.includes('/rooms/info'))return {ok:true,json:async()=>({cardPool:'terras-v1',variant:'escolas-v1',energyRule:'reserve-v1',full:false})};
    if(path.endsWith('/new') || path.endsWith('/rooms/join')){
      requests.push(body);
      const game=createGame({seed:811,decks:[body.customDeck?.name??body.deck,body.opponent??'Pira'],customDecks:[body.customDeck??null,null],variant:body.variant,first:0,cardPool:body.cardPool,energyRule:body.energyRule});
      return {ok:true,json:async()=>({token:'pilot-ui',view:viewFor(game,0),room:{mode:'solo',seat:0,waiting:false,round:1,cardPool:body.cardPool,variant:body.variant,opponentOnline:true,rematch:[false,false]}})};
    }
    return {ok:true,json:async()=>({view:null})};
  }));
});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()});

describe('UI da edição completa',()=>{
  it('oferece edição completa por padrão e envia a escolha na criação',async()=>{
    render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Jogar'}));
    const setup=screen.getByRole('dialog',{name:'Preparar duelo'});
    expect((within(setup).getByLabelText('Energia entre turnos') as HTMLSelectElement).value).toBe('reserve-v1');
    expect(within(setup).getByRole('button',{name:/Terras — Nascentes Vivas/})).toBeTruthy();
    fireEvent.change(within(setup).getByLabelText('Conjunto de cartas'),{target:{value:'terras-v1'}});
    expect((within(setup).getByLabelText('Regras do duelo') as HTMLSelectElement).disabled).toBe(true);
    fireEvent.click(within(setup).getByRole('button',{name:/Terras — Nascentes Vivas/}));
    expect(requests).toHaveLength(0);fireEvent.click(within(setup).getByRole('button',{name:/Iniciar duelo/}));
    await screen.findByRole('main',{name:'Campo de batalha'});
    expect(requests[0].cardPool).toBe('terras-v1');expect(requests[0].deck).toBe('Terras — Nascentes Vivas');
    expect(requests[0].energyRule).toBe('reserve-v1');expect(screen.getByText('Energia acumulada')).toBeTruthy();
    expect(screen.getAllByText('RESERVA')).toHaveLength(2);
    expect(screen.getByText('Véspera + As Terras Despertas · 140 cartas')).toBeTruthy();
    expect(screen.queryByText('Amigo conectado')).toBeNull();expect(screen.getAllByText('Autômato').length).toBeGreaterThan(0);
  });
  it('lista própria experimental fica bloqueada em VES e exige preparação explícita a partir do editor',async()=>{
    const library=writeDeckLibrary([{...pilotDecks[0],id:'mixed-library',updatedAt:new Date().toISOString()}],0);
    render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Jogar'}));
    fireEvent.change(screen.getByLabelText('Conjunto de cartas'),{target:{value:'ves'}});
    const custom=screen.getByLabelText('Seus decks');
    expect((within(custom).getByRole('option',{name:/requer As Terras Despertas/}) as HTMLOptionElement).disabled).toBe(true);
    fireEvent.keyDown(screen.getByRole('dialog',{name:'Preparar duelo'}),{key:'Escape'});
    fireEvent.click(screen.getByRole('button',{name:'Meus decks'}));
    const editor=screen.getByRole('dialog',{name:'Gerenciar decks'});
    fireEvent.click(within(editor).getByRole('button',{name:new RegExp('^'+library.decks[0].name)}));
    fireEvent.click(within(editor).getByRole('button',{name:'Jogar com este deck →'}));
    await waitFor(()=>expect(screen.queryByRole('dialog',{name:'Gerenciar decks'})).toBeNull());
    const setup=screen.getByRole('dialog',{name:'Preparar duelo'});
    expect((within(setup).getByLabelText('Conjunto de cartas') as HTMLSelectElement).value).toBe('terras-v1');expect(requests).toHaveLength(0);
    fireEvent.click(within(setup).getByRole('button',{name:/Iniciar duelo/}));await screen.findByRole('main',{name:'Campo de batalha'});
    expect(requests[0].customDeck.cards.reduce((sum:number,c:any)=>sum+c.copies,0)).toBe(40);
  });
  it('coleção separa as 80 VES das 60 TDP e mostra a edição publicada',()=>{
    render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Coleção'}));
    const collection=screen.getByRole('dialog',{name:'Coleção de cartas'});
    expect(within(collection).getByRole('status').textContent).toContain('60 cartas encontradas');
    expect(within(collection).getByText('Terras — Manada do Vale')).toBeTruthy();
    fireEvent.change(within(collection).getByLabelText('Edição'),{target:{value:'all'}});
    expect(within(collection).getByRole('status').textContent).toContain('140 cartas encontradas');
    expect(within(collection).getByText('140 cartas · Duas edições completas')).toBeTruthy();
    expect(within(collection).getByText('Composição de raridades dos doze decks de exemplo')).toBeTruthy();
    fireEvent.change(within(collection).getByLabelText('Edição'),{target:{value:'VES'}});
    expect(within(collection).getByRole('status').textContent).toContain('80 cartas encontradas');
    fireEvent.change(within(collection).getByLabelText('Edição'),{target:{value:'TDP'}});
    expect(within(collection).getByRole('status').textContent).toContain('60 cartas encontradas');
    fireEvent.click(within(collection).getByRole('button',{name:'Consultar Garça dos Espelhos d’Água'}));
    const detail=within(collection).getByRole('complementary',{name:'Detalhes de Garça dos Espelhos d’Água'});
    expect(detail.textContent).toContain('Custo 4');expect(detail.textContent).not.toContain('EXPERIMENTAL');expect(detail.textContent).toContain('devolver outro monstro');
  });
  it('consulta o conjunto do convite antes de permitir entrada',async()=>{
    render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Jogar'}));
    fireEvent.change(screen.getByLabelText('Como jogar'),{target:{value:'join'}});
    expect((screen.getByRole('button',{name:/Entrar na sala/}) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Código do convite'),{target:{value:'A'.repeat(20)}});
    await waitFor(()=>expect((screen.getByLabelText('Conjunto de cartas') as HTMLSelectElement).value).toBe('terras-v1'));
    expect((screen.getByLabelText('Conjunto de cartas') as HTMLSelectElement).disabled).toBe(true);
    expect((screen.getByLabelText('Energia entre turnos') as HTMLSelectElement).disabled).toBe(true);
    expect((screen.getByLabelText('Energia entre turnos') as HTMLSelectElement).value).toBe('reserve-v1');
    expect(screen.getByText('Conjunto e regras do anfitrião confirmados.')).toBeTruthy();
    expect((screen.getByRole('button',{name:/Entrar na sala/}) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole('button',{name:/Entrar na sala/}));
    await screen.findByRole('main',{name:'Campo de batalha'});
    expect(requests[0].energyRule).toBe('reserve-v1');
  });
  it('permite escolher a energia original para comparar e o guia acompanha a regra',async()=>{
    render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Jogar'}));
    fireEvent.change(screen.getByLabelText('Energia entre turnos'),{target:{value:'turn'}});
    fireEvent.click(screen.getByRole('button',{name:/Iniciar duelo/}));
    await screen.findByRole('main',{name:'Campo de batalha'});
    expect(requests[0].energyRule).toBe('turn');expect(screen.queryByText('Energia acumulada')).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'Guia da mesa'}));
    expect(screen.getByText('A sobra é perdida no encerramento. A Guardiã da Cisterna pode guardar até 1 para o próximo turno.')).toBeTruthy();
  });
});
