import type {BattleEvent,FeedbackActor,View} from '../engine/types';

const zoneNames:Record<string,string>={front:'frente',back:'retaguarda',hand:'mão',deck:'baralho',veil:'Véu',enchants:'encantamentos',sources:'fontes',ashes:'Cinzas',discard:'descarte',mage:'mago'};
export function actorName(a:FeedbackActor|undefined,seat:number) {
  if(!a)return 'Efeito';
  return a.name??(a.zone==='mage'?(a.seat===seat?'Seu mago':'Mago rival'):a.zone==='hand'?'Carta da mão':a.zone==='veil'?'Prenúncio':a.zone==='ashes'?'Cinza':'Carta');
}
export function eventText(e:BattleEvent,seat:number) {
  const source=actorName(e.source,seat),target=actorName(e.target,seat),who=(e.source??e.target)?.seat===seat?'Você':'Rival';
  switch(e.kind){
    case 'cast':return `${who} conjurou ${source}`;
    case 'arm':return `${who} armou um Prenúncio no Véu`;
    case 'reveal':return e.reason==='trap'?`Prenúncio revelado: ${source}`:`${source} ativou sua habilidade`;
    case 'attack':return e.reason==='cancelled'?`Ataque de ${source} interrompido: atacante ou alvo saiu da posição de combate`:e.reason==='intent'?`${source} prepara ataque contra ${target}`:`${source} ataca ${target}`;
    case 'damage':return `${e.source?source+' → ':''}${target}: −${e.amount} ${e.reason==='source_damage'?'de duração':e.target?.zone==='mage'?'de Vida':'de dano'}${e.reason==='empty_deck'?' · baralho vazio':''}`;
    case 'heal':return `${e.source?source+' → ':''}${target}: +${e.amount} de cura`;
    case 'death':return `${target} morreu${e.source?' por '+source:''}${e.reason?.includes('sacrifice')?' · custo de sacrifício':' · dano letal'} → descarte`;
    case 'sacrifice':return `${target} virou fonte de energia`;
    case 'expire':return `${target} ${e.reason==='dissipate'?'foi dissipado':'se esgotou'}${e.source&&e.source.uid!==e.target?.uid?' por '+source:''} → Cinzas`;
    case 'recover':return `${target} voltou para a mão${e.source&&e.source.uid!==e.target?.uid?' por '+source:''}`;
    case 'move':return `${target} → ${zoneNames[e.target?.zone??'']??'campo'}`;
    case 'draw':return `${e.target?.seat===seat?'Você comprou '+target:'Rival comprou uma carta'}`;
    case 'discard':return `${target} foi para o descarte`;
    case 'boost':return e.reason?.startsWith('keyword')?`${source}: ${target} ${e.reason.startsWith('keyword_lost')?'perdeu':'ganhou'} ${e.reason.split(':')[1]}`:
      `${source} → ${target}: ${(e.amount??0)>=0?'+':''}${e.amount} ${e.reason==='extend'?'de duração':'de Força'}${e.reason==='aura_force'?' · suporte contínuo':''}`;
    case 'energy':return `${source}: +${e.amount} de energia`;
    case 'phase':return `Turno ${e.turn} · ${e.target?.seat===seat?'sua vez':'vez do rival'}`;
    case 'inspect':return 'Uma carta foi consultada em segredo';
  }
}
export function eventDuration(e:BattleEvent) {
  if(e.kind==='attack'&&e.reason!=='combat')return 400;
  return ({cast:1000,arm:650,reveal:1100,attack:720,damage:600,heal:600,death:850,move:600,sacrifice:800,expire:700,draw:400,discard:500,recover:700,boost:600,energy:300,phase:700,inspect:500})[e.kind];
}
export type FeedbackSpeed='normal'|'fast';
type Packet={view:View;events:BattleEvent[]};
/** Serializa snapshots confirmados sem avançar a mesa antes de explicar seus efeitos. */
export class FeedbackQueue {
  private identity='';private sequence=0;private queue:Packet[]=[];private running=false;
  private controller=new AbortController();private epoch=0;private disposed=false;
  constructor(private callbacks:{commit:(v:View)=>void;playing:(v:boolean)=>void;step:(e:BattleEvent|null,left:number)=>void;
    animate:(e:BattleEvent,signal:AbortSignal)=>Promise<void>;settle?:()=>void;failure?:()=>void}){}
  enqueue(view:View,identity:string){
    if(this.disposed)return;
    if(identity!==this.identity){this.reset();this.identity=identity;this.sequence=view.feedbackSeq??0;this.callbacks.commit(view);return;}
    const events=(view.feedback??[]).filter(e=>e.id>this.sequence);
    this.sequence=Math.max(this.sequence,view.feedbackSeq??0);
    this.queue.push({view,events});
    // Polls iguais durante a apresentação só substituem o snapshot final sem duplicar eventos.
    if(this.queue.length>1 && !events.length){const previous=this.queue[this.queue.length-2];if(!previous.events.length)this.queue.splice(this.queue.length-2,1);}
    if(!this.running)void this.drain();
  }
  private async drain(){
    const epoch=this.epoch,signal=this.controller.signal;this.running=true;
    this.callbacks.playing(this.queue.some(p=>p.events.length>0));
    while(this.queue.length && epoch===this.epoch&&!this.disposed){
      const packet=this.queue.shift()!;
      for(let i=0;i<packet.events.length;i++){
        if(signal.aborted||epoch!==this.epoch)return;
        this.callbacks.playing(true);this.callbacks.step(packet.events[i],packet.events.length-i);
        try {await this.callbacks.animate(packet.events[i],signal)} catch {this.callbacks.failure?.();}
        if(signal.aborted||epoch!==this.epoch)return;
      }
      this.callbacks.commit(packet.view);this.callbacks.settle?.();
    }
    if(epoch!==this.epoch)return;
    this.running=false;this.callbacks.step(null,0);this.callbacks.playing(false);
  }
  reset(){this.epoch++;this.controller.abort();this.controller=new AbortController();this.queue=[];this.running=false;this.identity='';this.sequence=0;this.callbacks.settle?.();this.callbacks.step(null,0);this.callbacks.playing(false);}
  dispose(){this.reset();this.disposed=true;}
}
