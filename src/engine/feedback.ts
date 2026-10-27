import type {BattleEvent,FeedbackActor,Game,Piece,Seat,Zone} from './types';
type Cause = {source?:FeedbackActor;reason?:string};
const causes=new WeakMap<Game,Cause>();
export const causeOf=(g:Game)=>causes.get(g)??{};
export function withCause<T>(g:Game,cause:Cause,action:()=>T):T {
  const previous=causes.get(g);causes.set(g,cause);
  try{return action()}finally{if(previous)causes.set(g,previous);else causes.delete(g)}
}
export function actor(seat:Seat,zone:Zone,x:Piece,name:string,publicIdentity=false):FeedbackActor {
  return {seat,zone,uid:x.uid,card:x.card,name,
    ...(!publicIdentity&&['hand','deck','veil','ashes'].includes(zone)?{privateTo:seat}:{})};
}
export function feedback(g:Game,event:Omit<BattleEvent,'id'|'turn'>) {
  g.feedbackSeq=(g.feedbackSeq??0)+1;
  (g.feedback??=[]).push({...causeOf(g),...event,id:g.feedbackSeq,turn:g.turn});
  if(g.feedback.length>240)g.feedback.splice(0,g.feedback.length-240);
}
export function publicFeedback(g:Game,seat:Seat):BattleEvent[] {
  function visible(a:FeedbackActor|undefined):FeedbackActor|undefined {
    if(!a)return;
    if(a.privateTo!==undefined&&a.privateTo!==seat)return {seat:a.seat,zone:a.zone};
    const {privateTo,...rest}=a;return rest;
  }
  return (g.feedback??[]).map(e=>({...e,source:visible(e.source),target:visible(e.target)}));
}
