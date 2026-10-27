/** Curva da mira em coordenadas da janela; não muda destinos nem legalidade. */
export function attackCurve(from:{x:number;y:number},to:{x:number;y:number}) {
  const dx=to.x-from.x,dy=to.y-from.y;
  const bend=Math.min(100,Math.hypot(dx,dy)*.2);
  return `M ${from.x} ${from.y} Q ${(from.x+to.x)/2+bend} ${(from.y+to.y)/2} ${to.x} ${to.y}`;
}
