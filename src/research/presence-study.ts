import {definitions} from "../catalog/catalogue";
import type {School} from "../engine/types";

/** Modelo de proposta isolado. Não integra Config, partidas ou bot de produção. */
export type StudyPolicy = "base" | "extended" | "links";
export interface StudyState {
  policy: StudyPolicy;
  energy: number;
  sources: {card: string; duration: number}[];
  ashes: string[];
  links: Partial<Record<School, number>>;
  permanents: string[];
  catadoraInHand: boolean;
}
export function initialStudy(policy: StudyPolicy): StudyState {
  return {policy,energy:0,sources:[],ashes:[],links:{},permanents:[],catadoraInHand:true};
}
function cleanup(state: StudyState) {
  for(const source of state.sources.filter(x=>x.duration<=0)) state.ashes.push(source.card);
  state.sources=state.sources.filter(x=>x.duration>0);
}
export function studyPresence(state: StudyState) {
  const result: Partial<Record<School, number>> = state.policy === "links" ? {...state.links} : {};
  const contributing=[...state.permanents,...(state.policy === "links" ? [] : state.sources.map(s=>s.card))];
  for(const id of contributing) for(const school of definitions[id].schools) result[school]=(result[school]??0)+1;
  return result;
}
export function studySacrifice(before: StudyState, id: string): StudyState {
  const state=structuredClone(before), card=definitions[id];
  state.energy+=card.essence.generation;
  state.sources.push({card:id,duration:card.essence.duration-(state.policy === "extended" ? 0 : 1)});
  if(state.policy === "links") for(const school of card.schools) state.links[school]=(state.links[school]??0)+1;
  cleanup(state); return state;
}
export function studyDawn(before: StudyState): StudyState {
  const state=structuredClone(before);
  state.energy=0;
  for(const source of state.sources){state.energy+=definitions[source.card].essence.generation;source.duration--;}
  cleanup(state);return state;
}
export function canCastCatadora(state: StudyState) {
  const card=definitions["VES-047"], presence=studyPresence(state);
  return state.catadoraInHand && state.energy >= card.cost! && Object.entries(card.presence).every(([school,n])=>(presence[school as School]??0)>=n!);
}
export function studyCastCatadora(before: StudyState): StudyState {
  if(!canCastCatadora(before)) return structuredClone(before);
  const state=structuredClone(before);state.energy-=definitions["VES-047"].cost!;state.permanents.push("VES-047");state.catadoraInHand=false;return state;
}
export function studySnapshot(state: StudyState) {
  return {energy:state.energy,shadow:studyPresence(state).Sombra??0,sources:state.sources.length,ashes:state.ashes.length,links:state.links.Sombra??0,monsters:state.permanents.length,canCastCatadora:canCastCatadora(state)};
}
export function studyTrace(policy: StudyPolicy, castCreature: boolean) {
  let state=studySacrifice(initialStudy(policy),"VES-004");
  const states=[studySnapshot(state)];
  state=studyDawn(state);states.push(studySnapshot(state));
  state=studySacrifice(state,"VES-016");states.push(studySnapshot(state));
  if(castCreature)state=studyCastCatadora(state);
  states.push(studySnapshot(state));
  state=studyDawn(state);states.push(studySnapshot(state));
  return states;
}
