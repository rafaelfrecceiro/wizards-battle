import React, { useEffect, useRef } from "react";

export function Sanctuary({ deck, onPlay, onDecks, onCollection, onGuide }: {
  deck: string; onPlay: () => void; onDecks: () => void;
  onCollection: () => void; onGuide: () => void;
}) {
  return <main className="sanctuary" aria-label="Santuário do Pulso">
    <div className="sanctuary-scene">
      <img className="sanctuary-art" src="/arte/santuario-home.png" alt="Wizards Battle — O Coração de Véspera. O coração mecânico ilumina o santuário." draggable={false}/>
      <nav aria-label="Destinos do santuário">
        <button className="sanctuary-destination sanctuary-play" aria-label="Jogar" onClick={onPlay}><span>Jogar</span></button>
        <button className="sanctuary-destination sanctuary-decks" aria-label="Meus decks" onClick={onDecks}><span>Meus decks</span></button>
        <button className="sanctuary-destination sanctuary-collection" aria-label="Coleção" onClick={onCollection}><span>Coleção</span></button>
        <button className="sanctuary-destination sanctuary-guide" aria-label="Guia da mesa" onClick={onGuide}><span>Guia da mesa</span></button>
      </nav>
      <button className="sanctuary-active-deck" onClick={onPlay} aria-label={`Deck ativo: ${deck}. Trocar deck`}>
        <span>Deck ativo: <b>{deck}</b></span><em>⇄ Trocar deck</em>
      </button>
    </div>
    <span className="sanctuary-version">AS TERRAS DESPERTAS · EDIÇÃO COMPLETA · SOLO + AMIGOS</span>
  </main>;
}

/** Foco e Esc ficam no painel; retornar ao destino que o abriu. */
export function DuelSetup({ onClose, children, title='Preparar duelo', closeLabel='Voltar ao santuário' }: { onClose: () => void; children: React.ReactNode; title?:string; closeLabel?:string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus({preventScroll:true});
    return () => previous?.focus({preventScroll:true});
  }, []);
  return <div className="overlay sanctuary-setup-overlay" onClick={onClose}>
    <div className="sanctuary-setup" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref} onClick={e=>e.stopPropagation()} onKeyDown={e=>{
      if(e.key==='Escape'){e.stopPropagation();onClose()}
      if(e.key==='Tab'){
        const items=[...ref.current!.querySelectorAll<HTMLElement>('button:not(:disabled), select, input, a[href]')];
        const first=items[0], last=items.at(-1);
        if(e.shiftKey && (document.activeElement===first || document.activeElement===ref.current)){e.preventDefault();last?.focus()}
        else if(!e.shiftKey && (document.activeElement===last || document.activeElement===ref.current)){e.preventDefault();first?.focus()}
      }
    }}><button className="sanctuary-return text-btn" aria-label={closeLabel} onClick={onClose}>← {closeLabel}</button>{children}</div>
  </div>;
}
