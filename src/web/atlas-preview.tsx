import React from 'react';
import {createRoot} from 'react-dom/client';
import {App} from './main';
import {createGame,viewFor} from '../engine/engine';
import type {Piece,Seat,Zone} from '../engine/types';

// Fixture visual pública, não é sessão do servidor nem replay de uma partida legal.
const game=createGame({seed:517,decks:['Pira','Queimada'],first:0,variant:'escolas-v1'});
game.phase='combat';game.turn=7;game.kept=[true,true];
for(const player of game.players)for(const zone of Object.keys(player.zones) as Zone[])player.zones[zone]=[];
function add(card:string,zone:Zone,seat:Seat=0){
  const p:Piece={uid:`atlas-${++game.seq}`,card,damage:0,duration:2,born:0,attacked:false,retreated:false,temp:0,haste:false};
  game.players[seat].zones[zone].push(p);return p;
}
add('VES-002','front');add('VES-047','front');add('VES-048','back');
add('VES-023','front',1);add('VES-040','back',1);
for(const seat of [0,1] as const){
  add('VES-002','sources',seat);add(seat===0?'VES-047':'VES-040','sources',seat);
  add('VES-017','veil',seat);
  for(let i=0;i<27;i++)add('VES-002','deck',seat);
  for(let i=0;i<6;i++)add('VES-016','ashes',seat);
}
for(const id of ['VES-006','VES-025','VES-047','VES-002','VES-048'])add(id,'hand');
for(let i=0;i<4;i++)add('VES-002','hand',1);
game.players[0].life=13;game.players[0].energy=3;game.players[0].school={Chama:3,Sombra:4};
game.players[1].life=12;game.players[1].energy=2;game.players[1].school={Chama:4,Raiz:4};
if(new URLSearchParams(location.search).has('cheio')){
  for(const seat of [0,1] as const)for(const row of ['front','back'] as const)while(game.players[seat].zones[row].length<3)add(seat===0?'VES-047':'VES-023',row,seat);
  for(let i=0;i<3;i++)add('VES-002','hand');
  for(const seat of [0,1] as const){for(let i=0;i<3;i++)add('VES-007','enchants',seat);add('VES-017','veil',seat);for(let i=0;i<6;i++)add('VES-002','sources',seat)}
}
const root=document.getElementById('atlas-preview-root');
if(root)createRoot(root).render(<><App initialView={viewFor(game,0)} previewMode/><div className="atlas-preview-note">Prévia visual isolada · <a href={location.search?'atlas-preview.html':'atlas-preview.html?cheio=1'}>{location.search?'Cena de referência':'Campo cheio'}</a> · <a href="/" target="_blank" rel="noopener">Abrir jogo ↗</a></div></>);
