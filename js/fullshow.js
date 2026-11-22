/* Full animation. Two modes:
   "words"  - the cover becomes a liquid, beat-reactive wallpaper; a clock sits on top and every sung word pops up as a node of a growing constellation.
   "glass"  - a liquid-glass card (cover, title, synced lyrics) over a WebGL liquid. */
window.vivid=()=>pal===DEF?[[.5,.3,1],[.2,.8,1],[1,.35,.7]]:pal.map(s=>{const m=s.match(/\d+/g).map(Number),k=Math.max(...m,1),n=m.map(v=>v/k),a=(n[0]+n[1]+n[2])/3;return n.map(v=>Math.max(0,Math.min(1,a+(v-a)*1.7)))});
(function(){
const root=$('#show'),cv=$('#sc'),c2=$('#sc2'),x2=c2.getContext('2d'),L=$('#shl'),sk=$('#shs');
let gl,pg,tex,ctex,hasCov=0,covSrc=null,U={},run=false,raf,idle,vl=-2,lastT=null,lastLy=null,lastPl=null,last=0,beat=0,rip=1,rs=0,fav=0,bs=0,lastB=0,tcS='',mode=S.showMode==='glass'?'glass':'words',col=[[.5,.3,1],[.2,.8,1],[1,.35,.7]];
const pf=new Float32Array(64);
const VS='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const FS=`precision highp float;uniform vec2 R;uniform float t,bass,hi,beat,rip,rs,cmode,hasCov;uniform vec3 c1,c2,c3;uniform sampler2D sp,cov;
float S(float x){return texture2D(sp,vec2(clamp(x,0.,1.),.5)).r;}
float hs(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
vec3 pal(float x){float u=abs(fract(x*.5)*2.-1.);return u<.5?mix(c1,c2,u*2.):mix(c2,c3,u*2.-1.);}
vec3 wall(vec2 uv){vec2 q=uv*.5;vec2 w=q+.05*vec2(sin(q.y*5.+t*.4+bass*2.),cos(q.x*5.4-t*.35))+.025*vec2(sin(q.y*14.+t*.9),cos(q.x*13.-t*.8))*(.4+bass);
vec2 cu=w*.42+.5;vec3 c=vec3(0.);float rad=.012+bass*.01;
for(int i=0;i<8;i++){float a=float(i)*.785+t*.2;vec2 u=cu+vec2(cos(a),sin(a))*rad;u=1.-abs(1.-mod(u,2.));c+=texture2D(cov,u).rgb;}c/=8.;
if(hasCov<.5)c=pal(length(uv)*.6+t*.03)*.7;
float g=dot(c,vec3(.3,.59,.11));c=mix(vec3(g),c,1.4);c=pow(c,vec3(.92))*(1.2+beat*.45);
c+=pow(max(0.,sin(w.x*7.+w.y*5.+t*.55+bass*3.)),10.)*.07*pal(.4);
float d0=length(uv),ring=exp(-abs(d0-rip*1.9)*8.)*(1.-rip)*rs;c+=pal(.5+rip)*ring*.25;return c*smoothstep(2.4,.5,d0*.9+.15);}
vec3 liquid(vec2 uv){vec2 w=uv+.10*vec2(sin(uv.y*1.7+t*.25),cos(uv.x*1.9-t*.21));float f=0.;vec3 acc=vec3(0.);
for(int i=0;i<8;i++){float fi=float(i);float s=S(.02+fi*.07);vec2 c=vec2(sin(t*(.17+fi*.031)+fi*2.3)*(.95+.25*sin(fi)),cos(t*(.14+fi*.027)+fi*1.9)*(.62+.2*cos(fi*1.7)));c*=1.+bass*.14;
float r=.12+.04*sin(fi*1.7)+s*.24+bass*.09+beat*.07;float d=length(w-c);float v=r*r/(d*d+.012);f+=v;acc+=v*pal(fi*.13+t*.015);}
vec3 base=acc/max(f,.001);float body=smoothstep(1.,1.5,f);float rim=smoothstep(.9,1.05,f)*(1.-smoothstep(1.05,1.5,f));float haze=(1.-exp(-f*.35))*.5;
vec3 col=vec3(.012,.012,.02)+base*(haze*.18+body*.7)+base*rim*1.1+vec3(rim*.12*(1.+hi*2.));
float d0=length(uv),ring=exp(-abs(d0-rip*1.9)*8.)*(1.-rip)*rs;col+=pal(.5+rip)*ring*.55;col*=1.+beat*.35;return col*smoothstep(2.3,.35,d0*.9+.2);}
void main(){vec2 uv=(gl_FragCoord.xy*2.-R)/R.y;vec3 col=cmode>.5?wall(uv):liquid(uv);col=1.-exp(-col*1.5);col+=(hs(gl_FragCoord.xy+t)-.5)/255.;gl_FragColor=vec4(col,1.);}`;
function init(){if(gl)return true;gl=cv.getContext('webgl',{antialias:false,alpha:false});if(!gl)return false;
const mk=(k,s)=>{const o=gl.createShader(k);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))console.warn(gl.getShaderInfoLog(o));return o};
pg=gl.createProgram();gl.attachShader(pg,mk(gl.VERTEX_SHADER,VS));gl.attachShader(pg,mk(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pg);gl.useProgram(pg);
gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);const l=gl.getAttribLocation(pg,'p');gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,2,gl.FLOAT,false,0,0);
['R','t','bass','hi','beat','rip','rs','cmode','hasCov','c1','c2','c3','sp','cov'].forEach(n=>U[n]=gl.getUniformLocation(pg,n));
const mkT=()=>{const o=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,o);[gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER].forEach(k=>gl.texParameteri(gl.TEXTURE_2D,k,gl.LINEAR));[gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T].forEach(k=>gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE));return o};
gl.activeTexture(gl.TEXTURE0);tex=mkT();gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);gl.activeTexture(gl.TEXTURE1);ctex=mkT();gl.activeTexture(gl.TEXTURE0);gl.uniform1i(U.sp,0);gl.uniform1i(U.cov,1);
[['#shv','prev'],['#shp','play'],['#shn','next']].forEach(([s,n])=>$(s).innerHTML=ic(n));$('#shm').innerHTML='<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.2 6.2L20 11l-5.8 1.8L12 19l-2.2-6.2L4 11l5.8-1.8z"/></svg>';return true}
function setCover(src){hasCov=0;covSrc=src;if(!gl||!src)return;const im=new Image();im.crossOrigin='anonymous';im.onload=()=>{if(covSrc!==src)return;try{const k=document.createElement('canvas');k.width=k.height=64;k.getContext('2d').drawImage(im,0,0,64,64);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,ctex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,k);hasCov=1}catch{hasCov=0}gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.activeTexture(gl.TEXTURE0)};im.src=src}
/* glass card lyrics */
function build(){lastLy=ly;const sy=ly.length&&ly[0].t!=null;L.innerHTML=ly.length?ly.map((l,i)=>`<p class="sl${sy?'':' u'}" data-i="${i}">${esc(l.s)||'\u266a'}</p>`).join(''):`<p class="sl u">${esc(tr('No lyrics yet.'))}</p>`;vl=-2;L.scrollTop=0}
function tick(){if(!ly.length||ly[0].t==null)return;const c=aud.currentTime+.15;let i=-1;for(let k=0;k<ly.length;k++){if(ly[k].t<=c)i=k;else break}if(i===vl)return;vl=i;
[...L.children].forEach((e,k)=>{e.classList.toggle('on',k===i);e.style.setProperty('--d',Math.min(Math.abs(k-i),5))});const e=L.children[i];if(e)L.scrollTo({top:e.offsetTop-L.clientHeight/2+e.offsetHeight/2,behavior:'smooth'})}
/* words constellation */
const rnd=s=>{s=Math.sin(s*127.1+311.7)*43758.5453;return s-Math.floor(s)};
function layout(i,n,cw,ch){const P=[],cx=cw/2,cy=ch*.5,rx=Math.min(cw*.3,430),ry=Math.min(ch*.2,210);for(let j=0;j<n;j++){let b=null,bd=-1e9;for(let k=0;k<6;k++){const x=cx+(rnd(i*97+j*13+k*7+1)*2-1)*rx,y=cy+(rnd(i*57+j*29+k*11+2)*2-1)*ry;let md=P.length?1e9:-Math.hypot(x-cx,y-cy);for(const p of P)md=Math.min(md,Math.hypot(p.x-x,p.y-y));if(md>bd){bd=md;b={x,y}}}P.push(b)}return P}
let curLine=-2,words=[],ts=[],P=[],drawn=[],prev=null;
function lineSetup(i,cw,ch){curLine=i;words=i>=0?ly[i].s.split(/\s+/).filter(Boolean):[];const t0=ly[i].t,t1=ly[i+1]?ly[i+1].t:t0+4,dur=Math.min(t1-t0,8)*.88,tot=words.reduce((a,w)=>a+w.length+1,0)||1;let c=0;ts=words.map(w=>{const s=t0+dur*c/tot;c+=w.length+1;return s});P=layout(i,words.length,cw,ch)}
function star(x,y,L,a,ph){a*=.78+.22*Math.sin(performance.now()/1000*2.3+ph*1.9);x2.save();x2.globalCompositeOperation='lighter';
 const g=x2.createRadialGradient(x,y,0,x,y,L*.7);g.addColorStop(0,`rgba(255,255,255,${.85*a})`);g.addColorStop(.2,`rgba(255,240,220,${.32*a})`);g.addColorStop(1,'rgba(255,255,255,0)');x2.fillStyle=g;x2.beginPath();x2.arc(x,y,L*.7,0,6.283);x2.fill();
 for(let k=0;k<2;k++){const len=k?L*.55:L*1.25,w=k?L*.035:L*.06;for(let s=0;s<4;s++){x2.save();x2.translate(x,y);x2.rotate((k?Math.PI/4:0)+s*Math.PI/2);const gr=x2.createLinearGradient(0,0,len,0);gr.addColorStop(0,`rgba(255,255,255,${.95*a})`);gr.addColorStop(1,'rgba(255,255,255,0)');x2.fillStyle=gr;x2.beginPath();x2.moveTo(0,-w);x2.lineTo(len,0);x2.lineTo(0,w);x2.closePath();x2.fill();x2.restore()}}
 x2.fillStyle=`rgba(255,255,255,${a})`;x2.beginPath();x2.arc(x,y,Math.max(1.3,L*.06),0,6.283);x2.fill();x2.restore()}
const BG=Array.from({length:44},(_,i)=>({x:rnd(i*7+3),y:rnd(i*11+5),r:.5+rnd(i*5+1)*1.1,p:rnd(i*3+9)*6.28,s:.6+rnd(i*13+2)*1.6}));
function bgStars(now,cw,ch){const t=now/1000;x2.save();x2.globalCompositeOperation='lighter';BG.forEach(b=>{x2.fillStyle=`rgba(255,255,255,${.12+.38*(.5+.5*Math.sin(t*b.s+b.p))})`;x2.beginPath();x2.arc(b.x*cw,b.y*ch,b.r,0,6.283);x2.fill()});x2.restore()}
const wd=$('#wd'),wdate=$('#wdate'),wtime=$('#wtime'),wtit=$('#wtit');let chips=[],ck='',wg=null;try{document.fonts.load('700 100px Nunito').then(()=>{ck=''}).catch(()=>{})}catch{}
/* clock = liquid glass: the digit shapes become a mask for a frosted, tinted backdrop (.wg); a canvas on top adds the soft shadow, sheen and lit edges */
const UZDAY=['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'],UZMON=['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'];
function dateStr(dt){let s='';if(LANG==='uz')s=UZDAY[dt.getDay()]+', '+dt.getDate()+'-'+UZMON[dt.getMonth()];else try{s=dt.toLocaleDateString(LANG==='ru'?'ru-RU':'en-US',{weekday:'long',day:'numeric',month:'long'})}catch{}return s.charAt(0).toUpperCase()+s.slice(1)}
const CKF="ui-rounded,'SF Pro Rounded',Nunito,'Varela Round','Arial Rounded MT Bold',system-ui,sans-serif";
function clockGlass(txt,f0){const fs=f0*1.12,d=Math.min(devicePixelRatio||1,2),m=Math.round(fs*.3),font='700 '+fs+'px '+CKF,M=document.createElement('canvas').getContext('2d');M.font=font;
 const z=M.measureText('0'),asc=Math.ceil(z.actualBoundingBoxAscent),dh=asc+Math.ceil(z.actualBoundingBoxDescent),dr=dh*.08,gap=dh*.05,it=[...txt].map(c=>{if(c===':')return{c,l:0,iw:dr*2+gap*.9};const t=M.measureText(c);return{c,l:t.actualBoundingBoxLeft,iw:t.actualBoundingBoxLeft+t.actualBoundingBoxRight}}),W=Math.ceil(it.reduce((a,b)=>a+b.iw,0)+gap*(it.length-1)+m*2),H=dh+m*2,base=m+asc,e=Math.max(1.5,fs*.012),br=dh*.055;
 const mk=()=>{const c=document.createElement('canvas');c.width=W*d;c.height=H*d;const x=c.getContext('2d');x.scale(d,d);return[c,x]};
 const glyphs=(x,st)=>{x.font=font;x.textAlign='left';x.textBaseline='alphabetic';x.lineJoin='round';let px=m;it.forEach(o=>{if(o.c===':')[.32,.68].forEach(p=>{x.beginPath();x.arc(px+o.iw/2,m+dh*p,dr,0,6.283);st?x.stroke():x.fill()});else st?x.strokeText(o.c,px+o.l,base):x.fillText(o.c,px+o.l,base);px+=o.iw+gap})};
 const[mc,mx]=mk();mx.fillStyle='#000';glyphs(mx);
 const[rc,rx]=mk();
 /* 1. soft shadow that falls outside the digits only */
 rx.save();rx.shadowColor='rgba(10,20,60,.38)';rx.shadowBlur=fs*.16;rx.shadowOffsetY=fs*.045;rx.fillStyle='#000';glyphs(rx);rx.restore();rx.globalCompositeOperation='destination-out';glyphs(rx);rx.globalCompositeOperation='source-over';
 /* 2. everything below is painted inside the digits only */
 const ins=fn=>{const[c,x]=mk();fn(x);x.globalCompositeOperation='destination-in';x.fillStyle='#000';glyphs(x);rx.drawImage(c,0,0,W,H)};
 ins(x=>{const g=x.createLinearGradient(m,m,m+W*.55,m+dh);g.addColorStop(0,'rgba(255,255,255,.3)');g.addColorStop(.55,'rgba(255,255,255,.08)');g.addColorStop(1,'rgba(190,215,255,.22)');x.fillStyle=g;x.fillRect(0,0,W,H)});
 ins(x=>{const g=x.createLinearGradient(m,m,m+W*.7,m+dh*1.1);[[0,0],[.3,0],[.38,.22],[.46,0],[.72,0],[.8,.1],[.88,0]].forEach(([o,a])=>g.addColorStop(o,'rgba(255,255,255,'+a+')'));x.fillStyle=g;x.fillRect(0,0,W,H)});
 /* thick light bevel along every edge, fading toward the middle of the stroke (stacked strokes, so it also works without canvas blur) */
 ins(x=>{for(let k=6;k>=1;k--){x.lineWidth=2*br*k/6;x.strokeStyle='rgba(255,255,255,.085)';glyphs(x,1)}});
 ins(x=>{x.lineWidth=e*1.8;x.strokeStyle='rgba(255,255,255,.72)';glyphs(x,1)});
 /* 3. directional light: bright top-left rim, cool refracted rim bottom-right */
 const strip=(dx,dy,col,b)=>{const[tc,tx]=mk();tx.fillStyle='#000';glyphs(tx);tx.globalCompositeOperation='destination-out';tx.save();tx.translate(dx,dy);glyphs(tx);tx.restore();tx.globalCompositeOperation='source-in';tx.fillStyle=col;tx.fillRect(0,0,W,H);rx.save();rx.filter='blur('+b+'px)';rx.drawImage(tc,0,0,W,H);rx.restore()};
 strip(-e*2.4,-e*2.4,'rgba(150,205,255,.4)',2);strip(e*1.2,e*1.2,'rgba(255,255,255,.95)',.7);
 if(!wg){wg=document.createElement('i');wg.className='wg'}const u='url('+mc.toDataURL()+')';wg.style.webkitMaskImage=wg.style.maskImage=u;rc.className='wr';rc.style.cssText='width:100%;height:100%';
 wtime.replaceChildren(wg,rc);wtime.style.cssText='width:'+W+'px;height:'+H+'px;margin:'+(-m*.7)+'px auto';wtime.setAttribute('aria-label',txt)}
function chipsReset(){chips.forEach(c=>{c.classList.add('out');setTimeout(()=>c.remove(),460)});chips=[]}
function drawWords(now,ct,t,cw,ch,s,d){x2.setTransform(d,0,0,d,0,0);x2.clearRect(0,0,cw,ch);bgStars(now,cw,ch);
const fs=Math.round(Math.max(84,Math.min(176,cw*.125,ch*.26))),dt=new Date(),k=dt.getHours()+':'+dt.getMinutes()+LANG+fs;if(k!==ck){ck=k;clockGlass(String(dt.getHours()).padStart(2,'0')+':'+String(dt.getMinutes()).padStart(2,'0'),fs);wdate.textContent=dateStr(dt)}
wtit.textContent=t?t.artist+' \u2014 '+t.title:'';
if(!ly.length||ly[0].t==null){if(chips.length)chipsReset();return}let i=-1;for(let k2=0;k2<ly.length;k2++){if(ly[k2].t<=ct+.05)i=k2;else break}
if(i!==curLine){if(drawn.length)prev={d:drawn,t:now};drawn=[];chipsReset();if(i>=0)lineSetup(i,cw,ch);else{curLine=-1;words=[];ts=[];P=[]}}
const lines=(arr,a)=>{x2.lineWidth=1.2;for(let k2=1;k2<arr.length;k2++){x2.strokeStyle=`rgba(255,255,255,${.6*a})`;x2.beginPath();x2.moveTo(arr[k2-1].x,arr[k2-1].y);x2.lineTo(arr[k2].x,arr[k2].y);x2.stroke();if(k2>1&&k2%2===0){x2.strokeStyle=`rgba(255,255,255,${.3*a})`;x2.beginPath();x2.moveTo(arr[k2-2].x,arr[k2-2].y);x2.lineTo(arr[k2].x,arr[k2].y);x2.stroke()}}};
if(prev){const a=1-(now-prev.t)/550;if(a<=0)prev=null;else{lines(prev.d,a*.6);prev.d.forEach((n,k)=>star(n.x,n.y,9,.7*a,k))}}
const vis=[];for(let j=0;j<words.length;j++)if(ts[j]<=ct)vis.push(j);drawn=vis.map(j=>({x:P[j].x,y:P[j].y,w:words[j]}));lines(drawn,1);
const ks=Math.min(1,cw/900+.35);
vis.forEach((j,a)=>{const p=P[j],act=a===vis.length-1,age=ct-ts[j];
 if(act)star(p.x,p.y,(30+beat*16)*(1+Math.max(0,1-age/.4)*1.1)*ks,1,j);else star(p.x,p.y,(9+j%3)*ks,.85,j);
 if(!chips[a]){const e=document.createElement('div');e.className='wchip';e.textContent=words[j];e.style.left=p.x+'px';e.style.top=p.y+'px';wd.appendChild(e);chips[a]=e}});
chips.forEach((e,a)=>e.classList.toggle('act',a===vis.length-1))}
function frame(now){if(!run)return;raf=requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000||.016);last=now;
const d=Math.min(devicePixelRatio||1,1.5),cw=innerWidth,ch=innerHeight,w=cw*d|0,h=ch*d|0;if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;c2.width=w;c2.height=h}gl.viewport(0,0,w,h);
let b=0,hi=0,fl=0;for(let i=1;i<9;i++)b+=F[i];b/=2040;for(let i=60;i<200;i++)hi+=F[i];hi/=140*255;for(let i=1;i<48;i++){const x=F[i]-pf[i];if(x>0)fl+=x;pf[i]=F[i]}
fav=fav*.94+fl*.06;if(fl>fav*1.6+60&&now-lastB>230){beat=1;lastB=now;rip=0;rs=.35+b*.65}beat*=.9;rip=Math.min(1,rip+dt/1.5);bs=bs*.7+b*b*.3;
const tg=vivid();for(let i=0;i<3;i++)for(let j=0;j<3;j++)col[i][j]+=(tg[i][j]-col[i][j])*.03;
const t=q[cur];if(t!==lastT){lastT=t;$('#sht').textContent=t?t.title:'V MUSIC';$('#sha').textContent=t?t.artist:'';$('#shc').src=t?t.art:'assets/v-music-logo.svg';curLine=-2;drawn=[];prev=null;chipsReset()}
const art=t?t.art:null;if(art!==covSrc)setCover(art);
gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,256,1,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,F.subarray(0,256));
gl.uniform2f(U.R,w,h);gl.uniform1f(U.t,now/1000);gl.uniform1f(U.bass,Math.min(1,bs*1.6));gl.uniform1f(U.hi,Math.min(1,hi*2));gl.uniform1f(U.beat,beat);gl.uniform1f(U.rip,rip);gl.uniform1f(U.rs,rs);gl.uniform1f(U.cmode,mode==='words'?1:0);gl.uniform1f(U.hasCov,hasCov);gl.uniform3fv(U.c1,col[0]);gl.uniform3fv(U.c2,col[1]);gl.uniform3fv(U.c3,col[2]);
gl.drawArrays(gl.TRIANGLES,0,3);
root.style.setProperty('--bt',beat.toFixed(3));root.style.setProperty('--rgb',col[1].map(c=>c*255|0).join(','));
if(mode==='words')drawWords(now,aud.currentTime,t,cw,ch,Math.min(cw,ch*1.4),d);
else{if(ly!==lastLy)build();if(t&&$('#shc').getAttribute('src')!==t.art)$('#shc').src=t.art;tick()}
const pl=!aud.paused;if(pl!==lastPl){lastPl=pl;$('#shp').innerHTML=ic(pl?'pause':'play');$('#shp').setAttribute('aria-label',tr(pl?'Pause':'Play'))}
const dd=aud.duration||0,tc=fmt(aud.currentTime)+'/'+fmt(dd);if(tc!==tcS){tcS=tc;$('#shtc').textContent=fmt(aud.currentTime);$('#shtd').textContent=fmt(dd);sk.value=dd?aud.currentTime/dd*1000:0;sk.style.setProperty('--p',sk.value/10+'%')}}
const wake=()=>{root.classList.remove('idle');clearTimeout(idle);idle=setTimeout(()=>root.classList.add('idle'),3500)};
function setMode(m){mode=m;root.dataset.mode=m;S.showMode=m;saveS();lastLy=null;vl=-2;curLine=-2;chipsReset();x2.clearRect(0,0,c2.width,c2.height)}
function open(){if(!init()){msg(tr('WebGL isn\u2019t available on this device.'));return}root.hidden=false;run=true;lastT=null;lastLy=null;covSrc=null;last=performance.now();setMode(mode);raf=requestAnimationFrame(frame);try{root.requestFullscreen&&root.requestFullscreen().catch(()=>{})}catch{}wake()}
function close(){run=false;cancelAnimationFrame(raf);root.hidden=true;if(document.fullscreenElement)document.exitFullscreen().catch(()=>{})}
$('[data-v=show]').onclick=open;$('#shx').onclick=close;$('#shm').onclick=()=>setMode(mode==='words'?'glass':'words');cv.onclick=()=>{tog();wake()};$('#shv').onclick=prevT;$('#shn').onclick=()=>step(1);$('#shp').onclick=tog;
sk.oninput=()=>{if(aud.duration)aud.currentTime=sk.value/1000*aud.duration};L.onclick=e=>{const p=e.target.closest('.sl'),l=p&&ly[+p.dataset.i];if(l&&l.t!=null)aud.currentTime=l.t};
['mousemove','pointerdown','keydown'].forEach(n=>root.addEventListener(n,wake));
document.addEventListener('fullscreenchange',()=>{if(run&&!document.fullscreenElement&&root.dataset.fs==='1')close();root.dataset.fs=document.fullscreenElement?'1':'0'});
addEventListener('keydown',e=>{if(!run)return;if(e.key==='Escape')close();else if(e.key==='ArrowRight'&&e.target.tagName!=='INPUT')aud.currentTime+=5;else if(e.key==='ArrowLeft'&&e.target.tagName!=='INPUT')aud.currentTime-=5;else if(e.key==='m'||e.key==='M')$('#shm').click()},true);
})();
