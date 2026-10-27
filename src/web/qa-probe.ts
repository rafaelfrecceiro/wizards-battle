/** Diagnóstico opt-in de QA: não roda no fluxo normal do jogador. */
export function startFrameProbe() {
  if (new URLSearchParams(location.search).get('qa') !== 'frames') return;
  const out=document.createElement('output');out.id='qa-frame-probe';out.hidden=true;document.body.append(out);
  const samples:number[]=[];let last=0,frames=0,animationFrames=0;
  let frame=0, running=true;
  function tick(time:number) {
    if(!running)return;
    if(last) {samples.push(time-last);if(samples.length>180)samples.shift()}
    last=time;frames++;
    if(document.getAnimations().some(a=>a.playState==='running'))animationFrames++;
    if(samples.length && frames%15===0){const sorted=[...samples].sort((a,b)=>a-b);out.value=JSON.stringify({frames,animationFrames,samples:samples.length,meanMs:samples.reduce((a,b)=>a+b,0)/samples.length,p95Ms:sorted[Math.floor(sorted.length*.95)],maxMs:sorted.at(-1),width:innerWidth,height:innerHeight,hidden:document.hidden})}
    frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);
  addEventListener('pagehide',()=>{running=false;cancelAnimationFrame(frame)},{once:true});
}
