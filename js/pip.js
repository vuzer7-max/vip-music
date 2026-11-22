/* Mini player = a Dynamic Island in a Picture-in-Picture window.
   Chrome/Edge: a real HTML window (Document PiP) that opens by itself when you leave the site, small like a pill and
   growing when you hover it; it tries to sit at the top centre of the screen. Other browsers: canvas video in the browser's own PiP. */
(function(){
const DOCPIP='documentPictureInPicture' in window,E={},SM=[340,86],BG=[430,236];let pw=null,tm=null,ht=null,want=SM,lastArt='',lastPl=null,lastG='';
const HTML=`<div class="di cp" id="di"><div class="dtop"><img id="dic" alt=""><div class="dmeta"><b id="dit"></b><span id="dia"></span></div><i class="dlg" id="dlg"></i><i class="deq" id="deq"><u></u><u></u><u></u><u></u></i></div><div class="dseek"><span id="dtc">0:00</span><input id="dsk" type="range" min="0" max="1000" value="0" aria-label="Seek"><span id="dtd">-0:00</span></div><div class="dbtn"><button class="ib" id="dpv" aria-label="Previous"></button><button class="ib dpp" id="dpp" aria-label="Play"></button><button class="ib" id="dnx" aria-label="Next"></button></div></div>`;
function mount(doc,host){host.innerHTML=HTML;['di','dic','dit','dia','dlg','deq','dtc','dsk','dtd','dpv','dpp','dnx'].forEach(id=>E[id]=doc.getElementById(id));E.dlg.innerHTML=LOGO;E.dpv.innerHTML=ic('prev');E.dnx.innerHTML=ic('next');E.dpv.onclick=prevT;E.dnx.onclick=()=>step(1);E.dpp.onclick=tog;E.dsk.oninput=()=>{if(aud.duration)aud.currentTime=E.dsk.value/1000*aud.duration};lastArt='';lastPl=null;lastG=''}
function lines(){const c=aud.currentTime+.15,sy=ly.length&&ly[0].t!=null;let i=-1;if(sy)for(let k=0;k<ly.length;k++){if(ly[k].t<=c)i=k;else break}const g=k=>sy&&ly[k]&&k>=0?(ly[k].s||'\u266a'):'';return[g(i-1),sy?g(i):ly.length?'':tr('No lyrics yet.'),g(i+1)]}
const isBig=()=>!!pw&&pw.innerHeight>=150;
function update(){const t=q[cur];if(!pw||!E.dic)return;const cp=!isBig(),sy=ly.length&&ly[0].t!=null,l=sy?lines()[1]:'';E.di.classList.toggle('cp',cp);
 E.dit.textContent=t?t.title:'V MUSIC';E.dia.textContent=cp&&l?l:(t?t.artist:'');
 if(t&&t.art!==lastArt){lastArt=t.art;E.dic.src=t.art}
 const g='rgb('+vivid()[0].map(c=>c*215|0)+')';if(g!==lastG){lastG=g;E.di.style.setProperty('--g',g)}
 const pl=!aud.paused;if(pl!==lastPl){lastPl=pl;E.dpp.innerHTML=ic(pl?'pause':'play');E.deq.classList.toggle('on',pl)}
 const dd=aud.duration||0;E.dsk.value=dd?aud.currentTime/dd*1000:0;E.dsk.style.setProperty('--p',E.dsk.value/10+'%');E.dtc.textContent=fmt(aud.currentTime);E.dtd.textContent='-'+fmt(Math.max(0,dd-aud.currentTime))}
/* the browser decides where a PiP window goes; we ask for the top centre of the screen and grow/shrink around it */
function place(){try{const s=screen;pw.moveTo((s.availLeft||0)+Math.round((s.availWidth-want[0])/2),(s.availTop||0)+12)}catch{}}
function fit(big){want=big?BG:SM;try{pw.resizeTo(want[0],want[1])}catch{}place();setTimeout(update,60)}
async function openDoc(){if(pw&&!pw.closed)return;pw=await documentPictureInPicture.requestWindow({width:SM[0],height:SM[1],preferInitialWindowPlacement:true});const d=pw.document;
 [...document.querySelectorAll('link[rel=stylesheet]')].forEach(l=>{const n=d.createElement('link');n.rel='stylesheet';n.href=l.href;d.head.appendChild(n)});
 d.documentElement.className='ddoc';mount(d,d.body);want=SM;place();update();clearInterval(tm);tm=setInterval(update,100);
 const de=d.documentElement;
 de.addEventListener('pointerenter',()=>{clearTimeout(ht);if(!isBig())fit(true)});
 de.addEventListener('pointerleave',()=>{clearTimeout(ht);ht=setTimeout(()=>{if(isBig())fit(false)},450)});
 de.addEventListener('pointerdown',e=>{clearTimeout(ht);if(!isBig()&&!e.target.closest('button'))fit(true);else place()});
 pw.addEventListener('pagehide',()=>{clearInterval(tm);clearTimeout(ht);pw=null;Object.keys(E).forEach(k=>delete E[k])})}
/* fallback: canvas -> video -> browser PiP */
const pv=document.createElement('video'),pc=document.createElement('canvas'),x=pc.getContext('2d');pc.width=pc.height=420;pv.muted=true;pv.playsInline=true;pv.style.cssText='position:fixed;width:2px;height:2px;opacity:0;pointer-events:none';document.body.appendChild(pv);try{pv.srcObject=pc.captureStream(30)}catch{}
let img=null,imgSrc='';
function rr(x0,y0,w,h,r){x.beginPath();x.moveTo(x0+r,y0);x.arcTo(x0+w,y0,x0+w,y0+h,r);x.arcTo(x0+w,y0+h,x0,y0+h,r);x.arcTo(x0,y0+h,x0,y0,r);x.arcTo(x0,y0,x0+w,y0,r);x.closePath()}
function drawC(){const W=420,t=q[cur],v=vivid();if(t&&t.art!==imgSrc){imgSrc=t.art;img=new Image();img.src=t.art}
 x.fillStyle='#000';x.fillRect(0,0,W,W);if(img&&img.complete&&img.naturalWidth){x.globalAlpha=.9;x.drawImage(img,-60,-60,W+120,W+120);x.globalAlpha=1;x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,0,W,W)}else{x.fillStyle=`rgb(${v[0].map(c=>c*90|0)})`;x.fillRect(0,0,W,W)}
 rr(16,16,W-32,W-32,34);x.fillStyle='rgba(255,255,255,.13)';x.fill();x.strokeStyle='rgba(255,255,255,.4)';x.lineWidth=1.5;x.stroke();
 if(img&&img.complete&&img.naturalWidth){x.save();rr(W/2-62,38,124,124,18);x.clip();x.drawImage(img,W/2-62-lvl*4,38-lvl*4,124+lvl*8,124+lvl*8);x.restore()}
 x.textAlign='center';x.fillStyle='#fff';x.font='700 17px system-ui,sans-serif';x.fillText(t?t.title:'V MUSIC',W/2,190,W-70);x.fillStyle='rgba(255,255,255,.65)';x.font='13px system-ui,sans-serif';x.fillText(t?t.artist:'',W/2,210,W-70);
 const l=lines();x.fillStyle='rgba(255,255,255,.4)';x.font='700 14px system-ui,sans-serif';x.fillText(l[0],W/2,260,W-70);x.fillStyle='#fff';x.font='800 22px system-ui,sans-serif';x.fillText(l[1],W/2,296,W-70);x.fillStyle='rgba(255,255,255,.45)';x.font='700 14px system-ui,sans-serif';x.fillText(l[2],W/2,330,W-70);
 const p=aud.duration?aud.currentTime/aud.duration:0;x.fillStyle='rgba(255,255,255,.25)';x.fillRect(40,368,W-80,5);x.fillStyle='#fff';x.fillRect(40,368,(W-80)*p,5)}
async function openVid(){try{if(document.pictureInPictureElement)return;drawC();await pv.play();await pv.requestPictureInPicture();clearInterval(tm);tm=setInterval(drawC,33);pv.addEventListener('leavepictureinpicture',()=>clearInterval(tm),{once:true})}catch{msg(tr('Mini player isn\u2019t supported here.'))}}
async function openPip(){if(DOCPIP){try{await openDoc();return}catch{}}openVid()}
const toggle=()=>{if(pw&&!pw.closed)pw.close();else if(document.pictureInPictureElement)document.exitPictureInPicture();else openPip()};
const svg='<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v14H3zM12 12h7v5h-7z"/></svg>';
['pipb','pipb2'].forEach(id=>{const b=$('#'+id);if(b){b.innerHTML=svg;b.onclick=toggle}});
const arm=()=>{try{navigator.mediaSession.setActionHandler('enterpictureinpicture',S.autopip===false?null:openPip)}catch{}};arm();
const sa=$('#sapip');sa.checked=S.autopip!==false;sa.onchange=e=>{S.autopip=e.target.checked;saveS();arm()};
})();
