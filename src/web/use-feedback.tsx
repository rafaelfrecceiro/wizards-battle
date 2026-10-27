import React,{useEffect,useRef,useState} from 'react';
import type {BattleEvent,View} from '../engine/types';
import {eventText,FeedbackQueue,type FeedbackSpeed} from './battle-feedback';
import {FeedbackAnimator} from './feedback-motion';

export function useFeedback(commit:(view:View)=>void){
  const [playing,setPlaying]=useState(false),[step,setStep]=useState<BattleEvent|null>(null),[left,setLeft]=useState(0);
  const [speed,setSpeed]=useState<FeedbackSpeed>(()=>localStorage.getItem('wb-feedback-speed')==='fast'?'fast':'normal');
  const [sound,setSound]=useState(()=>localStorage.getItem('wb-feedback-sound')==='on');
  const [failed,setFailed]=useState(false);
  const [last,setLast]=useState<BattleEvent|null>(null);
  const commitRef=useRef(commit);commitRef.current=commit;
  const animator=useRef<FeedbackAnimator|null>(null);if(!animator.current)animator.current=new FeedbackAnimator();
  animator.current.speed=speed;animator.current.soundEnabled=sound;
  const active=useRef(false);
  const currentIdentity=useRef('');
  const player=useRef<FeedbackQueue|null>(null);
  if(!player.current)player.current=new FeedbackQueue({
    commit:v=>{animator.current!.seat=v.seat;commitRef.current(v)},
    playing:v=>{active.current=v;setPlaying(v)},
    step:(e,n)=>{setStep(e);if(e)setLast(e);setLeft(n)},
    animate:(e,signal)=>animator.current!.play(e,signal),
    settle:()=>animator.current!.settle(),failure:()=>setFailed(true),
  });
  useEffect(()=>{
    const audio=()=>animator.current?.unlockAudio();document.addEventListener('pointerdown',audio);document.addEventListener('keydown',audio);
    return ()=>{document.removeEventListener('pointerdown',audio);document.removeEventListener('keydown',audio);player.current?.reset();animator.current?.dispose()};
  },[]);
  return {
    playing,active,step:step??last,left,failed,speed,sound,
    present:(v:View,identity:string)=>{if(currentIdentity.current!==identity){setLast(null);currentIdentity.current=identity;}player.current!.enqueue(v,identity)},
    reset:()=>{player.current!.reset();setLast(null)},
    changeSpeed:(v:FeedbackSpeed)=>{setSpeed(v);localStorage.setItem('wb-feedback-speed',v)},
    changeSound:()=>{const value=!sound;setSound(value);localStorage.setItem('wb-feedback-sound',value?'on':'off');animator.current!.soundEnabled=value;if(value)animator.current!.unlockAudio()},
  };
}
export function FeedbackStatus({event,seat,left,playing}:{event:BattleEvent|null;seat:number;left:number;playing:boolean}){
  if(!event)return null;
  const source=event.source?.card?event.source:event.kind==='draw'&&event.target?.seat!==seat?undefined:event.target;
  return <section className={`feedback-status ${event.kind} ${playing?'playing':'idle'}`} aria-label="Acontecimento na mesa" aria-live="polite" aria-atomic="true">
    {source?.card&&<img data-feedback-source src={`/cartas/${source.card}.png`} alt={source.name??''} draggable={false}/>}
    <div><small>{event.kind==='reveal'?'HABILIDADE ATIVADA':event.kind==='death'?'MONSTRO DESTRUÍDO':playing?'RESOLVENDO A JOGADA':'ÚLTIMO ACONTECIMENTO'}{playing&&left>1?` · ${left} etapas`:''}</small>
    <strong>{eventText(event,seat)}</strong><span>Turno {event.turn}</span></div>
    {playing&&<span className="feedback-step-dot" aria-hidden="true"/>}
  </section>;
}
