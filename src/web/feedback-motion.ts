import type {BattleEvent,FeedbackActor} from '../engine/types';
import {eventDuration,type FeedbackSpeed} from './battle-feedback';
type Rect={x:number;y:number;width:number;height:number};
const center=(r:Rect)=>({x:r.x+r.width/2,y:r.y+r.height/2});
const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export class FeedbackAnimator {
  private nodes=new Set<HTMLElement>();private animations=new Set<Animation>();
  private hidden=new Map<HTMLElement,string>();private positions=new Map<string,Rect>();
  private staged=new Map<string,HTMLElement>();
  private sound:AudioContext|null=null;
  speed:FeedbackSpeed='normal';soundEnabled=false;seat=0;
  unlockAudio(){
    if(!this.soundEnabled)return;
    try {if(!this.sound)this.sound=new AudioContext();if(this.sound.state==='suspended')void this.sound.resume().catch(()=>{});}catch{/* Áudio opcional; a sequência visual continua. */}
  }
  private tone(e:BattleEvent){
    if(!this.soundEnabled||!this.sound||this.sound.state!=='running'||document.hidden)return;
    const ctx=this.sound,t=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();
    const notes:Partial<Record<BattleEvent['kind'],[number,number]>>={cast:[340,650],reveal:[220,760],attack:[160,65],damage:[95,40],death:[180,35],heal:[440,880],energy:[600,780],sacrifice:[290,130],phase:[390,520]};
    const note=notes[e.kind];if(!note)return;
    osc.type=e.kind==='damage'?'triangle':'sine';osc.frequency.setValueAtTime(note[0],t);osc.frequency.exponentialRampToValueAtTime(note[1],t+.16);
    gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.035,t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+.2);
    osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+.22);osc.onended=()=>{osc.disconnect();gain.disconnect()};
  }
  private element(a:FeedbackActor|undefined,destination=false):HTMLElement|null {
    if(!a)return null;
    if(!destination&&a.uid&&this.staged.has(a.uid))return this.staged.get(a.uid)!;
    if(!destination&&a.uid){const found=Array.from(document.querySelectorAll<HTMLElement>('[data-motion-id]')).find(x=>x.dataset.motionId===a.uid);if(found)return found;}
    return document.querySelector<HTMLElement>(`[data-feedback-zone="${a.seat}:${a.zone}"]`);
  }
  private rect(a:FeedbackActor|undefined,destination=false):Rect {
    if(!destination&&a?.uid&&this.positions.has(a.uid))return this.positions.get(a.uid)!;
    const r=this.element(a,destination)?.getBoundingClientRect();
    if(r&&r.width&&r.height){if((destination&&['front','back','sources','enchants','veil','hand'].includes(a?.zone??''))||(!a?.uid&&a?.zone==='hand')){
      // A área pode estar cheia; a carta viajante permanece dentro da zona, sem depender de índices de slots.
      return {x:r.x+r.width/2-42,y:r.y+r.height/2-58,width:84,height:116};
    }return r;}
    const source=document.querySelector<HTMLElement>('[data-feedback-source]')?.getBoundingClientRect();
    return source?.width?source:{x:innerWidth*.48-45,y:innerHeight*.42-64,width:90,height:128};
  }
  private node(tag='div',className=''){
    const n=document.createElement(tag);n.className=className;n.setAttribute('aria-hidden','true');document.body.append(n);this.nodes.add(n);return n;
  }
  private animate(n:HTMLElement,keyframes:Keyframe[],duration:number){
    if(typeof n.animate!=='function')return;
    const a=n.animate(keyframes,{duration,easing:'cubic-bezier(.22,.7,.25,1)',fill:'forwards'});this.animations.add(a);
  }
  private ghost(a:FeedbackActor|undefined,r:Rect){
    const n=this.node('div','feedback-ghost');Object.assign(n.style,{left:`${r.x}px`,top:`${r.y}px`,width:`${r.width}px`,height:`${r.height}px`});
    if(a?.card){const img=document.createElement('img');img.src=`/cartas/${a.card}.png`;img.alt='';n.append(img)}else {n.classList.add('feedback-card-back');n.textContent='◈'}
    return n;
  }
  private fly(a:FeedbackActor|undefined,from:Rect,to:Rect,duration:number,death=false){
    const n=this.ghost(a,from),p=center(from),q=center(to);
    this.animate(n,[{transform:'translate(0,0) scale(1)',opacity:1},
      {transform:`translate(${(q.x-p.x)*.45}px,${(q.y-p.y)*.45-25}px) scale(1.18) rotate(-5deg)`,opacity:1,offset:.45},
      {transform:`translate(${q.x-p.x}px,${q.y-p.y}px) scale(${death ? .18 : Math.min(1.1,to.width/from.width)}) rotate(${death?12:0}deg)`,opacity:death?0:1}],duration);
  }
  private beam(from:Rect,to:Rect,heal=false){
    const p=center(from),q=center(to),n=this.node('div',`feedback-beam${heal?' healing':''}`),length=Math.hypot(q.x-p.x,q.y-p.y);
    Object.assign(n.style,{left:`${p.x}px`,top:`${p.y}px`,width:`${length}px`,transform:`rotate(${Math.atan2(q.y-p.y,q.x-p.x)}rad)`});
    this.animate(n,[{opacity:0,clipPath:'inset(0 100% 0 0)'},{opacity:1,clipPath:'inset(0 0 0 0)',offset:.45},{opacity:0,clipPath:'inset(0 0 0 0)'}],480);
  }
  private impact(a:FeedbackActor|undefined,amount:number|undefined,healing=false,suffix='',resource?:'energy'){
    const hud=resource&&a?document.querySelector<HTMLElement>(`[data-motion-id="energy-${a.seat}"]`)?.getBoundingClientRect():undefined;
    const r=hud?.width?hud:this.rect(a),p=center(r),ring=this.node('div',`feedback-impact${healing?' healing':''}`);
    Object.assign(ring.style,{left:`${p.x}px`,top:`${p.y}px`});
    this.animate(ring,[{transform:'translate(-50%,-50%) scale(.2)',opacity:1},{transform:'translate(-50%,-50%) scale(1.5)',opacity:0}],500);
    const n=this.node('div',`feedback-number${healing?' healing':''}`);n.textContent=amount===undefined?suffix:`${healing?'+':'−'}${Math.abs(amount)}${suffix?' '+suffix:''}`;
    Object.assign(n.style,{left:`${p.x}px`,top:`${r.y}px`});
    this.animate(n,[{transform:'translate(-50%,0) scale(.7)',opacity:0},{transform:'translate(-50%,-20px) scale(1.15)',opacity:1,offset:.25},{transform:'translate(-50%,-48px) scale(1)',opacity:0}],700);
    const el=this.element(a);if(el)this.animate(el,[{filter:healing?'brightness(1.6)':'brightness(2) sepia(.6)',transform:'translateX(-4px)'},{filter:'none',transform:'translateX(4px)',offset:.4},{filter:'none',transform:'none'}],380);
  }
  private hide(a:FeedbackActor|undefined){const el=this.element(a);if(el&&a?.uid){if(!this.hidden.has(el))this.hidden.set(el,el.style.visibility);el.style.visibility='hidden'}}
  async play(e:BattleEvent,signal:AbortSignal){
    if(signal.aborted)return;
    if(document.hidden)return;
    this.tone(e);
    const duration=eventDuration(e)/(this.speed==='fast'?1.8:1);
    if(reduced())return;
    const source=this.rect(e.source),target=this.rect(e.target);
    if(e.kind==='cast'||e.kind==='reveal'||e.kind==='arm'){
      const spotlight:Rect={x:innerWidth/2-67,y:Math.max(90,innerHeight*.30-90),width:134,height:188};
      const end=e.kind==='cast'&&e.target?.zone!=='discard'?this.rect(e.target,true):spotlight;
      const n=this.ghost(e.source,source),p=center(source),q=center(spotlight),r=center(end);
      this.animate(n,[{transform:'translate(0,0) scale(1)',opacity:1},
        {transform:`translate(${q.x-p.x}px,${q.y-p.y}px) scale(${spotlight.width/source.width})`,offset:.35,opacity:1},
        {transform:`translate(${q.x-p.x}px,${q.y-p.y}px) scale(${spotlight.width/source.width})`,offset:.75,opacity:1},
        {transform:`translate(${r.x-p.x}px,${r.y-p.y}px) scale(${end.width/source.width})`,opacity:1}],duration);
      if(e.kind==='cast'&&e.target?.zone!=='discard'){
        if(e.source?.uid)this.positions.set(e.source.uid,this.rect(e.target,true));
      } else if(e.source?.uid)this.positions.set(e.source.uid,spotlight);
    } else if(e.kind==='attack'&&e.reason==='intent'){
      this.beam(source,target);
    } else if(e.kind==='attack'&&e.reason!=='cancelled'){
      const n=this.ghost(e.source,source),p=center(source),q=center(target);
      this.hide(e.source);
      this.animate(n,[{transform:'translate(0,0) scale(1)',offset:0},
        {transform:`translate(${(p.x-q.x)*.08}px,${(p.y-q.y)*.08}px) scale(1.08) rotate(-4deg)`,offset:.23},
        {transform:`translate(${(q.x-p.x)*.87}px,${(q.y-p.y)*.87}px) scale(1.1) rotate(3deg)`,offset:.57},
        {transform:'translate(0,0) scale(1)',offset:1}],duration*.9);
    } else if(['damage','heal','boost','energy'].includes(e.kind)){
      if(e.source&&e.reason!=='combat')this.beam(source,target,e.kind==='heal'||(e.kind==='boost'&&(e.amount??0)>=0&&!e.reason?.startsWith('keyword_lost')));
      this.impact(e.target,e.amount,e.kind!=='damage'&&(e.amount??0)>=0&&!e.reason?.startsWith('keyword_lost'),e.reason?.startsWith('keyword')?e.reason.split(':')[1]:e.kind==='energy'?'energia':e.kind==='boost'?(e.reason==='extend'?'duração':'Força'):e.reason==='source_damage'?'duração':'',e.kind==='energy'?'energy':undefined);
    } else if(['death','expire','discard','recover','move','sacrifice','draw'].includes(e.kind)){
      const a=e.target;
      const start=e.kind==='draw'?this.rect(a?{...a,zone:'deck',uid:undefined}:a,true):target;
      const end=this.rect(a,true);
      this.fly(a,start,end,duration*.9,['death','expire','discard'].includes(e.kind));
      if(e.kind!=='draw')this.hide(a);
      if(a?.uid&&['death','expire','discard','recover'].includes(e.kind)){const staged=this.staged.get(a.uid);if(staged){staged.remove();this.nodes.delete(staged);this.staged.delete(a.uid);}}
      if(a?.uid)this.positions.set(a.uid,end);
    }
    await new Promise<void>(resolve=>{
      const finish=()=>{clearTimeout(timer);signal.removeEventListener('abort',finish);document.removeEventListener('visibilitychange',visibility);resolve()};
      const visibility=()=>{if(document.hidden)finish()};
      const timer=setTimeout(finish,duration);signal.addEventListener('abort',finish,{once:true});document.addEventListener('visibilitychange',visibility);
    });
    if(!signal.aborted){
      const landing=e.kind==='cast'&&e.target?.zone!=='discard'?e.source:['move','sacrifice'].includes(e.kind)?e.target:undefined;
      if(landing?.uid){
        this.hide(landing);
        this.staged.get(landing.uid)?.remove();
        const ghost=this.ghost(landing,this.positions.get(landing.uid)??this.rect(e.target,true));this.staged.set(landing.uid,ghost);
      }
    }
    this.clearEffects();
    if(e.kind==='attack'){
      const el=this.element(e.source);if(el&&this.hidden.has(el)){el.style.visibility=this.hidden.get(el)!;this.hidden.delete(el);}
    }
  }
  private clearEffects(){for(const a of this.animations)a.cancel?.();this.animations.clear();const keep=new Set(this.staged.values());for(const n of this.nodes)if(!keep.has(n)){n.remove();this.nodes.delete(n);}}
  settle(){this.staged.clear();this.clearEffects();for(const [el,visibility] of this.hidden)el.style.visibility=visibility;this.hidden.clear();this.positions.clear();}
  dispose(){this.settle();if(this.sound)void this.sound.close().catch(()=>{});this.sound=null;}
}
