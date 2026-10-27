import { importDecks } from "./deck-storage";

/** Ponte explícita da biblioteca 0.5 para 0.6, sem credencial de partida. */
export function transferV05Decks(): Promise<ReturnType<typeof importDecks>> {
  if(location.origin!=='http://127.0.0.1:4182') return Promise.reject(Error('Use o backup JSON nesta origem.'));
  return new Promise((resolve,reject)=>{
    const origin='http://127.0.0.1:4181',nonce=crypto.randomUUID();
    const frame=document.createElement('iframe');frame.hidden=true;frame.title='Transferência de decks v0.5';
    const cleanup=()=>{clearTimeout(timer);window.removeEventListener('message',receive);frame.remove()};
    const receive=(event:MessageEvent)=>{
      if(event.origin!==origin||event.source!==frame.contentWindow||event.data?.type!=='wb-decks-v05'||event.data.nonce!==nonce)return;
      try{if(typeof event.data.raw!=='string')throw Error('Não há decks salvos na v0.5 neste navegador.');const result=importDecks(event.data.raw);cleanup();resolve(result)}catch(error){cleanup();reject(error)}
    };
    const timer=setTimeout(()=>{cleanup();reject(Error('A v0.5 não respondeu. Use Exportar/Importar backup.'))},5000);
    window.addEventListener('message',receive);frame.onload=()=>frame.contentWindow?.postMessage({type:'wb-read-decks',nonce},origin);
    frame.src=origin+'/transferir-decks-v05.html';document.body.append(frame);
  });
}

/** Migração local explícita: só biblioteca, nunca sessão/token de partida. */
export function transferV04Decks(): Promise<ReturnType<typeof importDecks>> {
  if(location.origin !== 'http://127.0.0.1:4181') return Promise.reject(Error('Use o backup JSON para transferir decks nesta origem.'));
  return new Promise((resolve,reject)=>{
    const frame=document.createElement('iframe');
    frame.hidden=true;frame.title='Transferência local de decks v0.4';
    const origin='http://127.0.0.1:4180', nonce=crypto.randomUUID();
    const cleanup=()=>{clearTimeout(timer);window.removeEventListener('message',receive);frame.remove()};
    const receive=(event:MessageEvent)=>{
      if(event.origin!==origin || event.source!==frame.contentWindow || event.data?.type!=='wb-decks-v04' || event.data.nonce!==nonce)return;
      try{
        if(typeof event.data.raw!=='string') throw Error('Não há decks salvos na v0.4 neste navegador.');
        const decks=importDecks(event.data.raw);cleanup();resolve(decks);
      }catch(error){cleanup();reject(error)}
    };
    const timer=setTimeout(()=>{cleanup();reject(Error('A v0.4 não respondeu. Você também pode usar Exportar/Importar backup.'))},5000);
    window.addEventListener('message',receive);
    frame.onload=()=>frame.contentWindow?.postMessage({type:'wb-read-decks',nonce},origin);
    frame.src=origin+'/transferir-decks-v04.html';document.body.append(frame);
  });
}
