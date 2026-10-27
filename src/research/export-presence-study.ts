import {writeFileSync,mkdirSync} from "node:fs";
import {studyTrace} from "./presence-study";
import {catalogue} from "../catalog/catalogue";
import lists from "../data/baralhos.json";
import {definitions} from "../catalog/catalogue";
const report={
  status:"proposta-modelada-nao-implementada-nas-partidas",
  scenario:"Eco dos Soterrados sacrificado no turno 1; Despertar próprio no turno 3; Silenciar o Motor sacrificado; tentativa de Catadora de Lamparinas; Despertar seguinte.",
  steps:["Eco vira fonte","Despertar: captura 2","Novo sacrifício: captura 3","Tentar conjurar Catadora","Próximo Despertar"],
  policies:{base:{name:"Regra atual",note:"Presença depende do campo e de fontes ativas."},extended:{name:"Duração integral",note:"Variante existente. A fonte gera uma vez a mais; Cinzas chegam depois."},links:{name:"Vínculos de escola",note:"Proposta: cada fonte criada deixa +1 permanente por escola; fontes não contam novamente. Energia/Cinzas seguem a base."}},
  traces:Object.fromEntries([false,true].map(cast=>[cast?"cast":"wait",Object.fromEntries((["base","extended","links"] as const).map(p=>[p,studyTrace(p,cast)]))])),
  shortSources:lists.map(deck=>({deck:deck.name,total:deck.cards.reduce((n,c)=>n+c.copies,0),durationOneCopies:deck.cards.filter(c=>definitions[c.id].essence.duration===1).reduce((n,c)=>n+c.copies,0)})),
  catalogueCards:catalogue.printings.length,
  limitations:["modelo isolado e determinístico","vínculos não implementados no motor/bot de partidas","sem avaliação de vitória/diversão humana","comparação cobre transições básicas de fontes e Catadora; outras interações exigem testes"]
};
mkdirSync("../qa/presenca-v01",{recursive:true});
writeFileSync("../qa/presenca-v01/comparacao.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({base:report.traces.wait.base.slice(1,3),links:report.traces.wait.links.slice(1,3),shortSources:report.shortSources}));
