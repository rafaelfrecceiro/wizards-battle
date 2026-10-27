import { useLayoutEffect, useRef } from "react";
import type { View } from "../engine/types";
type Position = {
  rect: DOMRect;
  src: string;
  seat: string;
  damage: number;
  life: number;
  value: number;
};
const reduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/** As transições refletem o estado confirmado pelo servidor. */
export function useBattleMotion(view: View | null, identity = '', narrated=false) {
  const previous = useRef(new Map<string, Position>());
  const lastView = useRef<View | null>(null);
  const lastIdentity = useRef(identity);
  useLayoutEffect(() => {
    if (identity !== lastIdentity.current) {
      previous.current.clear(); lastView.current = null; lastIdentity.current = identity;
    }
    if (!view) {
      previous.current.clear();
      lastView.current = null;
      return;
    }
    const current = new Map<string, Position>();
    document.querySelectorAll<HTMLElement>("[data-motion-id]").forEach((el) => {
      const id = el.dataset.motionId!,
        rect = el.getBoundingClientRect();
      current.set(id, {
        rect,
        src: el.dataset.art ?? "",
        seat: el.dataset.owner ?? "0",
        damage: Number(el.dataset.damage ?? 0),
        life: Number(el.dataset.life ?? 0),
        value: Number(el.dataset.value ?? 0),
      });
      const before = previous.current.get(id);
      if (before && !reduced()) {
        const value=Number(el.dataset.value ?? 0);
        if(el.dataset.resource && value!==before.value) {
          const color=value<before.value?'#f5a18b':el.dataset.resource==='energy'?'#a9f1ff':'#ffe3a2';
          el.animate([{color,textShadow:`0 0 12px ${color}`,transform:'scale(1.2)'},{color:'',textShadow:'none',transform:'scale(1)'}],{duration:280,easing:'ease-out'});
        }
        const dx = before.rect.x - rect.x,
          dy = before.rect.y - rect.y;
        if (Math.abs(dx) + Math.abs(dy) > 5)
          el.animate(
            [
              {
                transform: `translate(${dx}px,${dy}px) scale(${before.rect.width / rect.width})`,
                opacity: 0.8,
              },
              { transform: "translate(0,0) scale(1)", opacity: 1 },
            ],
            { duration: 380, easing: "cubic-bezier(.2,.75,.25,1)" },
          );
        const diff =
          el.dataset.life !== undefined
            ? before.life - Number(el.dataset.life)
            : Number(el.dataset.damage ?? 0) - before.damage;
        if (!narrated && Number.isFinite(diff) && diff !== 0) {
          const float = document.createElement("div");
          float.className = `number-float ${diff > 0 ? "damage" : "healing"}`;
          float.textContent = diff > 0 ? `−${diff}` : `+${-diff}`;
          float.style.left = `${rect.x + rect.width / 2}px`;
          float.style.top = `${rect.y + 10}px`;
          document.body.append(float);
          const a = float.animate(
            [
              { transform: "translate(-50%,0) scale(.7)", opacity: 0 },
              {
                transform: "translate(-50%,-10px) scale(1.15)",
                opacity: 1,
                offset: 0.2,
              },
              { transform: "translate(-50%,-65px)", opacity: 0 },
            ],
            { duration: 1100, easing: "ease-out" },
          );
          a.onfinish = () => float.remove();
          el.animate(
            [
              {
                filter:
                  diff > 0 ? "brightness(2) sepia(.6)" : "brightness(1.5)",
              },
              { filter: "none" },
            ],
            { duration: 450 },
          );
        }
      } else if (!narrated && !before && lastView.current && !reduced())
        el.animate(
          [
            { opacity: 0, transform: "translateY(18px) scale(.85)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 350, easing: "ease-out" },
        );
    });
    if (!narrated && lastView.current && !reduced())
      for (const [id, before] of previous.current) {
        if (current.has(id) || !before.src) continue;
        const exit = document.createElement("img");
        exit.src = before.src;
        exit.className = "departing-card";
        Object.assign(exit.style, {
          left: `${before.rect.x}px`,
          top: `${before.rect.y}px`,
          width: `${before.rect.width}px`,
          height: `${before.rect.height}px`,
        });
        document.body.append(exit);
        const a = exit.animate(
          [
            { opacity: 0.85, transform: "scale(1)" },
            {
              opacity: 0,
              transform: "translateY(-15px) scale(.5)",
              filter: "brightness(2)",
            },
          ],
          { duration: 420, easing: "ease-in" },
        );
        a.onfinish = () => exit.remove();
      }
    previous.current = current;
    lastView.current = view;
  }, [view, identity,narrated]);
}
