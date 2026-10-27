// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {api,invitation,key,remember,savedSession} from '../web/network';
beforeEach(()=>{localStorage.clear();sessionStorage.clear();history.replaceState(null,'','/')});
afterEach(()=>{vi.unstubAllGlobals();history.replaceState(null,'','/')});
it('reenvia a mesma ação com mesmo identificador após perda de resposta',async()=>{
  const fetcher=vi.fn().mockRejectedValueOnce(Error('offline')).mockResolvedValue({ok:true,json:async()=>({revision:2,view:null})});
  vi.stubGlobal('fetch',fetcher);const body={requestId:key(),revision:1,action:{kind:'advance'}};
  expect((await api('action','seat-secret',body)).revision).toBe(2);
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(fetcher.mock.calls[0][1].body).toBe(fetcher.mock.calls[1][1].body);
});
it('erro HTTP preserva status e não repete ação ilegal ou atrasada',async()=>{
  const fetcher=vi.fn().mockResolvedValue({ok:false,status:409,json:async()=>({error:'mesa mudou'})});vi.stubGlobal('fetch',fetcher);
  await expect(api('action','secret',{requestId:key()})).rejects.toMatchObject({status:409,message:'mesa mudou'});
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it('convite novo não herda assento do anfitrião; recarregar a aba do convidado retoma o próprio acesso',()=>{
  remember('host','ABC');sessionStorage.clear();history.replaceState(null,'','/#sala=ABC');
  expect(invitation()).toBe('ABC');expect(savedSession()).toBe('');
  remember('guest','ABC');expect(savedSession()).toBe('guest');
  history.replaceState(null,'','/#sala=OTHER');expect(savedSession()).toBe('');
});
