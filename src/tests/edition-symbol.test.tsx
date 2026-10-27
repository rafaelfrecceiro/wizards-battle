// @vitest-environment jsdom
import React from 'react';
import {cleanup,render} from '@testing-library/react';
import {afterEach,describe,expect,it} from 'vitest';
import {CardFace,EditionLine,EditionSymbol} from '../web/cards';
afterEach(cleanup);
describe('Selo oficial de As Terras Despertas',()=>{
  it('usa desenho vetorial, sem fallback de sigla ou texto',()=>{
    const {container}=render(<EditionSymbol edition="TDP" rarity="rare"/>);
    expect(container.querySelector('[data-symbol="terras-awakening"]')).not.toBeNull();
    expect(container.querySelector('svg text')).toBeNull();expect(container.querySelectorAll('path').length).toBeGreaterThan(1);
  });
  it('edição tem nome e numeração finais, sem marca de piloto/experimental',()=>{
    const {container}=render(<EditionLine id="TDP-060"/>);expect(container.textContent).toContain('As Terras Despertas');
    expect(container.textContent).toContain('060/060');expect(container.textContent).not.toMatch(/piloto|experimental|protótipo/i);
  });
  it('frente publicada usa símbolo impresso sem duplicar a sobreposição e mantém VES',()=>{
    const tdp=render(<CardFace id="TDP-013" name="Batedor das Lanternas"/>);
    expect(tdp.container.querySelector('.edition-mark')).toBeNull();expect(tdp.container.querySelector('img')?.getAttribute('src')).toBe('/cartas/TDP-013.png');tdp.unmount();
    const ves=render(<CardFace id="VES-002" name="Vigia da Caldeira"/>);expect(ves.container.querySelector('.edition-mark')).not.toBeNull();
  });
});
