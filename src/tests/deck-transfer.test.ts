// @vitest-environment jsdom
import {afterEach,describe,it,expect,vi} from 'vitest';
import {transferV04Decks,transferV05Decks} from '../web/deck-transfer';
import {starterDecks} from '../engine/decks';
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();vi.useRealTimers();document.querySelectorAll('iframe').forEach(f=>f.remove())});
describe('Cópia local explícita de decks v0.4',()=>{
  it('copia da 4181 para 4182 sem aceitar outra origem ou nonce',async()=>{
    vi.stubGlobal('location',{origin:'http://127.0.0.1:4182'});
    const promise=transferV05Decks(),frame=document.querySelector('iframe')!;
    const send=vi.spyOn(frame.contentWindow!,'postMessage').mockImplementation(()=>{});
    frame.dispatchEvent(new Event('load'));const nonce=send.mock.calls[0][0].nonce;
    const raw=JSON.stringify({schemaVersion:1,decks:[{...starterDecks[0],id:'v05-old'}]});
    window.dispatchEvent(new MessageEvent('message',{origin:'http://127.0.0.1:4180',source:frame.contentWindow,data:{type:'wb-decks-v05',nonce,raw}}));
    expect(document.querySelector('iframe')).not.toBeNull();
    window.dispatchEvent(new MessageEvent('message',{origin:'http://127.0.0.1:4181',source:frame.contentWindow,data:{type:'wb-decks-v05',nonce,raw}}));
    const result=await promise;expect(result[0].id).not.toBe('v05-old');expect(result[0].cards).toEqual(starterDecks[0].cards);
    expect(document.querySelector('iframe')).toBeNull();
  });
  it('aceita somente a janela/origem/nonce esperados e valida listas antes de importar',async()=>{
    vi.stubGlobal('location',{origin:'http://127.0.0.1:4181'});
    const promise=transferV04Decks(),frame=document.querySelector('iframe')!;
    const send=vi.spyOn(frame.contentWindow!,'postMessage').mockImplementation(()=>{});
    frame.dispatchEvent(new Event('load'));const nonce=send.mock.calls[0][0].nonce;
    const raw=JSON.stringify({schemaVersion:1,decks:[{...starterDecks[0],id:'old-id'}]});
    let resolved=false;void promise.then(()=>{resolved=true});
    window.dispatchEvent(new MessageEvent('message',{origin:'https://example.com',source:frame.contentWindow,data:{type:'wb-decks-v04',nonce,raw}}));
    window.dispatchEvent(new MessageEvent('message',{origin:'http://127.0.0.1:4180',source:frame.contentWindow,data:{type:'wb-decks-v04',nonce:'wrong',raw}}));
    await Promise.resolve();expect(resolved).toBe(false);
    window.dispatchEvent(new MessageEvent('message',{origin:'http://127.0.0.1:4180',source:frame.contentWindow,data:{type:'wb-decks-v04',nonce,raw}}));
    const decks=await promise;expect(decks[0].cards).toEqual(starterDecks[0].cards);expect(decks[0].id).not.toBe('old-id');
    expect(document.querySelector('iframe')).toBeNull();
  });
  it('sem resposta encerra a ponte com erro e preserva o armazenamento',async()=>{
    vi.useFakeTimers();vi.stubGlobal('location',{origin:'http://127.0.0.1:4181'});
    localStorage.setItem('wb-decks-v1','preservar');
    const result=transferV04Decks().catch(error=>error);
    await vi.advanceTimersByTimeAsync(5000);
    expect((await result).message).toContain('não respondeu');
    expect(document.querySelector('iframe')).toBeNull();expect(localStorage.getItem('wb-decks-v1')).toBe('preservar');
  });
});
