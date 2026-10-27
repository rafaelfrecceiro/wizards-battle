// @vitest-environment jsdom
import React from "react";
import {render,cleanup} from "@testing-library/react";
import {describe,it,expect,vi,afterEach} from "vitest";
import {useBattleMotion} from "../web/motion";
import {createGame,viewFor} from "../engine/engine";
import type {View} from "../engine/types";
function Harness({view,value,life,identity}:{view:View;value:number;life:number;identity?:string}){
  useBattleMotion(view,identity);
  return <><b data-motion-id="energy" data-resource="energy" data-value={value}>{value}</b><b data-motion-id="life" data-life={life}>{life}</b></>;
}
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();document.querySelectorAll('.number-float').forEach(x=>x.remove())});
describe("Feedback de recursos e dano",()=>{
  it('revanche não trata vida reiniciada e IDs reaproveitados como cura ou movimento do duelo anterior',()=>{
    vi.stubGlobal('matchMedia',()=>({matches:false}));
    const animate=vi.fn(()=>({onfinish:null}));HTMLElement.prototype.animate=animate as unknown as typeof HTMLElement.prototype.animate;
    const view=viewFor(createGame({seed:601,decks:['Vapor','Ilusão'],variant:'escolas-v1',first:0}),0);
    const ui=render(<Harness view={view} value={2} life={3} identity="room:1"/>);
    animate.mockClear();ui.rerender(<Harness view={structuredClone(view)} value={0} life={15} identity="room:2"/>);
    expect(document.querySelector('.number-float')).toBeNull();expect(animate).not.toHaveBeenCalled();
  });
  it('movimento reduzido mantém os valores sem gerar animações ou objetos flutuantes',()=>{
    vi.stubGlobal('matchMedia',()=>({matches:true}));
    const animate=vi.fn();HTMLElement.prototype.animate=animate;
    const view=viewFor(createGame({seed:601,decks:['Vapor','Ilusão'],variant:'escolas-v1',first:0}),0);
    const ui=render(<Harness view={view} value={0} life={15}/>);
    ui.rerender(<Harness view={structuredClone(view)} value={3} life={10}/>);
    expect(animate).not.toHaveBeenCalled();expect(document.querySelector('.number-float')).toBeNull();
    expect(document.querySelector('[data-life]')?.textContent).toBe('10');
  });
  it("energia sem data-damage não cria +NaN; dano real continua numérico",()=>{
    vi.stubGlobal('matchMedia',()=>({matches:false}));
    HTMLElement.prototype.animate=vi.fn(()=>({onfinish:null})) as unknown as typeof HTMLElement.prototype.animate;
    const view=viewFor(createGame({seed:601,decks:["Vapor","Ilusão"],variant:"escolas-v1",first:0}),0);
    const ui=render(<Harness view={view} value={0} life={15}/>);
    ui.rerender(<Harness view={structuredClone(view)} value={2} life={15}/>);
    expect(document.querySelectorAll('.number-float')).toHaveLength(0);
    ui.rerender(<Harness view={structuredClone(view)} value={2} life={13}/>);
    expect(document.querySelector('.number-float')?.textContent).toBe('−2');
  });
});
