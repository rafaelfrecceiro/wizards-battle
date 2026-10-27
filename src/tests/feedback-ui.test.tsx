// @vitest-environment jsdom
import React,{useState} from 'react';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {useFeedback,FeedbackStatus} from '../web/use-feedback';
import {createGame,viewFor} from '../engine/engine';
import type {BattleEvent,View} from '../engine/types';
const events:BattleEvent[]=[
  {id:1,turn:2,kind:'cast',source:{seat:1,zone:'hand',uid:'spell',card:'VES-006',name:'A Última Descarga'},target:{seat:1,zone:'discard'}},
  {id:2,turn:2,kind:'damage',source:{seat:1,zone:'discard',uid:'spell',card:'VES-006',name:'A Última Descarga'},target:{seat:0,zone:'front',uid:'victim',card:'VES-014',name:'Vulto da Fuligem'},amount:3},
  {id:3,turn:2,kind:'death',source:{seat:1,zone:'discard',uid:'spell',card:'VES-006',name:'A Última Descarga'},target:{seat:0,zone:'discard',uid:'victim',card:'VES-014',name:'Vulto da Fuligem'},reason:'damage'},
];
function makeView(seq=0):View{return {...viewFor(createGame({seed:10010,decks:['Pira','Queimada'],first:0,variant:'escolas-v1'}),0),feedbackSeq:seq,feedback:events.slice(0,seq)}}
function Harness(){
  const [view,setView]=useState(makeView()),f=useFeedback(setView);
  return <><button onClick={()=>f.present(makeView(),'one')}>Conectar</button><button onClick={()=>f.present(makeView(3),'one')}>Resolver</button><button onClick={()=>f.present(makeView(),'two')}>Revanche</button>
    <button onClick={f.changeSound}>Som</button><button onClick={()=>f.changeSpeed('fast')}>Rápido</button>
    <div data-feedback-zone="1:hand"/><div data-feedback-zone="0:discard"/>
    {view.feedbackSeq===0&&<div data-motion-id="victim" data-art="/cartas/VES-014.png">Monstro ainda na mesa</div>}
    <b data-testid="confirmed">{view.feedbackSeq}</b><b data-testid="busy">{String(f.playing)}</b>
    <FeedbackStatus event={f.step} seat={0} left={f.left} playing={f.playing}/></>;
}
beforeEach(()=>{
  vi.useFakeTimers();localStorage.clear();
  Object.defineProperty(document,'hidden',{configurable:true,value:false});
  Object.defineProperty(window,'matchMedia',{configurable:true,value:()=>({matches:false})});
  HTMLElement.prototype.animate=vi.fn(()=>({cancel:vi.fn()} as unknown as Animation));
  HTMLElement.prototype.getBoundingClientRect=()=>new DOMRect(120,140,80,112);
});
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals()});
async function advance(n:number){await act(async()=>{await vi.advanceTimersByTimeAsync(n)})}
describe('Sequência visual e causal no cliente',()=>{
  it('preserva alvo até explicar carta, dano e morte; só então confirma snapshot',async()=>{
    render(<Harness/>);fireEvent.click(screen.getByText('Conectar'));fireEvent.click(screen.getByText('Resolver'));
    expect(screen.getByTestId('confirmed').textContent).toBe('0');expect(screen.getByTestId('busy').textContent).toBe('true');
    expect(screen.getByLabelText('Acontecimento na mesa').textContent).toContain('conjurou A Última Descarga');expect(document.querySelector('.feedback-ghost')).not.toBeNull();
    await advance(1000);expect(document.querySelector('.feedback-beam')).not.toBeNull();expect(document.querySelector('.feedback-number')?.textContent).toBe('−3');
    expect(screen.getByText('Monstro ainda na mesa')).toBeTruthy();
    await advance(600);expect(screen.getByLabelText('Acontecimento na mesa').textContent).toContain('Vulto da Fuligem morreu por A Última Descarga');
    expect(document.querySelector('[data-motion-id="victim"]')?.getAttribute('style')).toContain('hidden');
    await advance(850);expect(screen.getByTestId('confirmed').textContent).toBe('3');expect(screen.getByTestId('busy').textContent).toBe('false');
    expect(screen.queryByText('Monstro ainda na mesa')).toBeNull();expect(document.querySelector('.feedback-ghost')).toBeNull();
  });
  it('movimento reduzido conserva explicação sem deslocamentos e sem bloquear a mesa',async()=>{
    Object.defineProperty(window,'matchMedia',{configurable:true,value:()=>({matches:true})});
    render(<Harness/>);fireEvent.click(screen.getByText('Conectar'));fireEvent.click(screen.getByText('Resolver'));await advance(0);
    expect(screen.getByTestId('confirmed').textContent).toBe('3');expect(document.querySelector('.feedback-ghost')).toBeNull();
    expect(screen.getByLabelText('Acontecimento na mesa').textContent).toContain('morreu por A Última Descarga');
    expect(HTMLElement.prototype.animate).not.toHaveBeenCalled();
  });
  it('revanche cancela animações e não aplica resultado atrasado da rodada anterior',async()=>{
    render(<Harness/>);fireEvent.click(screen.getByText('Conectar'));fireEvent.click(screen.getByText('Resolver'));
    fireEvent.click(screen.getByText('Revanche'));await advance(4000);
    expect(screen.getByTestId('confirmed').textContent).toBe('0');expect(screen.getByTestId('busy').textContent).toBe('false');
    expect(screen.queryByLabelText('Acontecimento na mesa')).toBeNull();expect(document.querySelector('.feedback-ghost')).toBeNull();
  });
  it('aba oculta alcança resultado atual sem acumular segundos de reprodução',async()=>{
    render(<Harness/>);fireEvent.click(screen.getByText('Conectar'));fireEvent.click(screen.getByText('Resolver'));
    Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));await advance(0);
    expect(screen.getByTestId('confirmed').textContent).toBe('3');expect(screen.getByTestId('busy').textContent).toBe('false');
  });
  it('ritmo e som persistem como preferências, áudio só é iniciado após gesto',async()=>{
    const resume=vi.fn(async()=>{}),close=vi.fn(async()=>{});
    const Audio=vi.fn(function(){return {state:'suspended',resume,close}});vi.stubGlobal('AudioContext',Audio);
    render(<Harness/>);expect(Audio).not.toHaveBeenCalled();fireEvent.click(screen.getByText('Rápido'));fireEvent.click(screen.getByText('Som'));
    expect(localStorage.getItem('wb-feedback-speed')).toBe('fast');expect(localStorage.getItem('wb-feedback-sound')).toBe('on');
    expect(Audio).toHaveBeenCalledTimes(1);expect(resume).toHaveBeenCalled();
  });
  it('desmontar a tela remove objetos temporários e restaura cartas escondidas',async()=>{
    const ui=render(<Harness/>);fireEvent.click(screen.getByText('Conectar'));fireEvent.click(screen.getByText('Resolver'));
    expect(document.querySelector('.feedback-ghost')).not.toBeNull();ui.unmount();await advance(5000);
    expect(document.querySelectorAll('.feedback-ghost,.feedback-beam,.feedback-number')).toHaveLength(0);
  });
});
