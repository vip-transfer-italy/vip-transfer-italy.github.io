/* shared helpers — inlined into every game by build.sh */
const cv=document.getElementById('c'),ctx=cv.getContext('2d');let W=0,H=0,DPR=1;
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);W=cv.clientWidth;H=cv.clientHeight;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);ctx.setTransform(DPR,0,0,DPR,0,0);if(typeof onResize==='function')onResize();}
window.addEventListener('resize',resize);
const store={get(k){try{return +localStorage.getItem(k)||0}catch(e){return 0}},set(k,v){try{localStorage.setItem(k,String(v))}catch(e){}}};
let AC=null,muted=false;
function beep(f,d,type,vol){if(muted)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(vol||.07,t);g.gain.exponentialRampToValueAtTime(.0001,t+(d||.1));o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+(d||.1));}catch(e){}}
function rnd(a,b){return a+Math.random()*(b-a)}
/* Ads adapter: on CrazyGames it loads their SDK; everywhere else it is a no-op */
const Ads={sdk:null,count:0,
 init(){if(!/crazygames/i.test(location.hostname))return;const s=document.createElement('script');s.src='https://sdk.crazygames.com/crazygames-sdk-v3.js';s.onload=async()=>{try{await window.CrazyGames.SDK.init();Ads.sdk=window.CrazyGames.SDK;}catch(e){}};document.head.appendChild(s);},
 start(){try{this.sdk&&this.sdk.game.gameplayStart()}catch(e){}},
 stop(){try{this.sdk&&this.sdk.game.gameplayStop()}catch(e){}},
 between(cb){this.count++;if(!this.sdk||this.count%2){cb();return}let done=false;const fin=()=>{if(done)return;done=true;muted=false;cb()};
  try{this.sdk.ad.requestAd('midgame',{adStarted(){muted=true},adFinished:fin,adError:fin})}catch(e){fin()}}};
Ads.init();
function loop(update,draw){let last=performance.now(),paused=false;
 document.addEventListener('visibilitychange',()=>{paused=document.hidden;last=performance.now()});
 function f(t){const dt=Math.min(.033,(t-last)/1000);last=t;if(!paused)update(dt);draw();requestAnimationFrame(f)}
 resize();requestAnimationFrame(f);}
function text(s,x,y,size,color,align,weight){ctx.font=(weight||700)+' '+size+'px "Trebuchet MS",system-ui,sans-serif';ctx.fillStyle=color;ctx.textAlign=align||'center';ctx.textBaseline='middle';ctx.fillText(s,x,y)}
