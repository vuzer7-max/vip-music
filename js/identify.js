/* Auto-identify a track.
   1) read tags + embedded cover  2) /api/identify: AI name clean-up, original cover, synced lyrics
   3) /api/listen: recognise the song from a 12 s clip when the name doesn't help  4) /api/transcribe: AI listens and writes timed lyrics if none exist */
(function(){
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),SR=16000;
async function readTags(f){const o={};try{const h=new Uint8Array(await f.slice(0,10).arrayBuffer());if(h[0]!==73||h[1]!==68||h[2]!==51)return o;const ver=h[3],sz=h[6]<<21|h[7]<<14|h[8]<<7|h[9],b=new Uint8Array(await f.slice(10,10+sz).arrayBuffer());let p=0;
while(p+10<=b.length){const id=String.fromCharCode(...b.slice(p,p+4));if(!/^[A-Z0-9]{4}$/.test(id))break;const n=ver===4?b[p+4]<<21|b[p+5]<<14|b[p+6]<<7|b[p+7]:new DataView(b.buffer).getUint32(p+4),d=b.slice(p+10,p+10+n);p+=10+n;if(!n)continue;const e=d[0],w=e===1||e===2?2:1,tx=()=>dec(e,d.slice(1)).replace(/\0+$/,'').trim();
if(id==='TIT2')o.title=tx();else if(id==='TPE1')o.artist=tx();else if(id==='TALB')o.album=tx();
else if(id==='APIC'&&!o.pic){const j=d.indexOf(0,1),mime=String.fromCharCode(...d.slice(1,j)),z=nul(d,j+2,e)+w;if(d.length-z>200)o.pic=new Blob([d.slice(z)],{type:mime.includes('/')?mime:'image/jpeg'})}}}catch{}return o}
/* audio helpers: decode to 16 kHz mono, cut a range, encode as WAV, base64 */
async function pcm(f){const AC=window.OfflineAudioContext||window.webkitOfflineAudioContext,buf=await new AC(1,1,SR).decodeAudioData(await f.arrayBuffer()),n=buf.length,ch=buf.numberOfChannels,o=new Float32Array(n);for(let c=0;c<ch;c++){const d=buf.getChannelData(c);for(let i=0;i<n;i++)o[i]+=d[i]/ch}return o}
function wav(s,a,b){const n=b-a,v=new DataView(new ArrayBuffer(44+n*2)),w=(o,t)=>[...t].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0)));w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,SR,true);v.setUint32(28,SR*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);for(let i=0;i<n;i++)v.setInt16(44+i*2,Math.max(-1,Math.min(1,s[a+i]))*32767,true);return v.buffer}
const b64=buf=>{let s='';const u=new Uint8Array(buf);for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s)};
async function post(u,b){const r=await fetch(u,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)});if(r.status===404||r.status===405)window.noApi=true;return r.ok?r.json():null}
const direct=(t,tg)=>window.lookupDirect(t,tg);
let API;async function status(){if(API!==undefined)return API;try{const r=await fetch('/api/status');API=r.ok?await r.json():null}catch{API=null}paintStatus();return API}
function paintStatus(){const e=$('#sstat');if(!e)return;const on=v=>tr(v?'on':'off');e.textContent=API?`${tr('AI names')}: ${on(API.ai)} \u00b7 ${tr('Song listening')}: ${on(API.listen)} \u00b7 ${tr('Lyrics writing')}: ${on(API.transcribe)}`:tr('Server tools are off. The free in-browser tools are used instead.')}
function apply(t,tg,j){if(!j)return;if(j.title&&!tg.title)t.title=j.title;if(j.artist&&!tg.artist)t.artist=j.artist;if(j.album)t.album=j.album;
 if(j.cover&&!t.hasPic){t.hasPic=1;setArt(t,j.cover);if(j.cover.length<70000)sv('vm.cv.'+t.key,j.cover)}
 if((j.lrc||j.plain)&&!ld(lkey(t),'')){sv(lkey(t),j.lrc||j.plain);sv('vm.lyai.'+t.key,0)}render();if(q[cur]===t)show(t)}
const blobOf=async(t,f)=>f||(await fetch(t.url)).blob();
async function transcribe(t,f){const s=await pcm(await blobOf(t,f)),CH=45*SR,max=Math.min(s.length,360*SR),segs=[];
 for(let a=0;a<max;a+=CH){const b=Math.min(a+CH,max);if(b-a<2*SR)break;msg(tr('Writing the lyrics\u2026 {0}%',Math.round(a/max*100)));
  const r=await post('/api/transcribe',{audio:b64(wav(s,a,b)),prompt:t.title&&t.artist?t.artist+' - '+t.title:''});if(!r||!r.segments)break;
  r.segments.forEach(g=>{if(g.text&&g.ns<.6&&g.lp>-1.3)segs.push({t:a/SR+g.start,s:g.text})})}
 if(segs.length<3)return false;sv(lkey(t),segs.map(g=>`[${String(g.t/60|0).padStart(2,'0')}:${(g.t%60).toFixed(2).padStart(5,'0')}]${g.s}`).join('\n'));sv('vm.lyai.'+t.key,1);return true}
async function run(t,f){if(t.key.startsWith('demo|'))return;
 const cc=ld('vm.cv.'+t.key,''),tg=f?await readTags(f):{};
 if(tg.title)t.title=tg.title;if(tg.artist)t.artist=tg.artist;if(tg.album)t.album=tg.album;
 if(tg.pic){t.hasPic=1;setArt(t,URL.createObjectURL(tg.pic))}else if(cc){t.hasPic=1;setArt(t,cc)}
 render();if(q[cur]===t)show(t);
 if(S.auto===false)return;
 const api=await status();if(!api){apply(t,tg,await direct(t,tg));let a0=false;if(!ld(lkey(t),'')&&S.web!==false){try{a0=await browserAsr(t,f);render();if(q[cur]===t)show(t)}catch{msg(tr('Free AI listening failed in this browser.'))}}msg(ld(lkey(t),'')?(a0?tr('Lyrics written by AI from the audio. It may contain mistakes.'):tr('Found: {0}',t.title+' — '+t.artist)):tr('No lyrics found. It may be an instrumental.'));return}
 for(let i=0;i<25&&!t.dur;i++)await sleep(100);
 let got=false;
 if(!ld(lkey(t),'')||!t.hasPic){msg(tr('Finding lyrics and cover\u2026'));
  try{const j=await post('/api/identify',{name:t.base,title:tg.title||'',artist:tg.artist||'',album:tg.album||'',duration:t.dur||0,need:{lyrics:!ld(lkey(t),''),cover:!t.hasPic}});apply(t,tg,j);got=!!(j&&(j.lrc||j.plain||j.cover))}catch{}}
 if(!got&&api.listen&&(!t.hasPic||!ld(lkey(t),''))){msg(tr('Listening to the song\u2026'));
  try{const s=await pcm(await blobOf(t,f)),a=Math.max(0,Math.min(s.length-12*SR,Math.floor(s.length*.3))),j=await post('/api/listen',{audio:b64(wav(s,a,Math.min(s.length,a+12*SR))),duration:t.dur||0});if(j&&j.found)apply(t,tg,j)}catch{}}
 if(!ld(lkey(t),'')||!t.hasPic){try{apply(t,tg,await direct(t,tg))}catch{}}
 let ai=false;
 if(!ld(lkey(t),'')&&api.transcribe){try{ai=await transcribe(t,f);render();if(q[cur]===t)show(t)}catch{}}
 if(!ld(lkey(t),'')&&S.web!==false){try{ai=await browserAsr(t,f);render();if(q[cur]===t)show(t)}catch{msg(tr('Free AI listening failed in this browser.'))}}
 if(ld(lkey(t),''))msg(ai?tr('Lyrics written by AI from the audio. It may contain mistakes.'):tr('Found: {0}',t.title+' \u2014 '+t.artist));
 else msg(api.listen&&api.transcribe?tr('No lyrics found. It may be an instrumental.'):tr('Add AUDD_API_TOKEN and OPENAI_API_KEY in Vercel to let AI listen and write lyrics.'))}
let asrChain=Promise.resolve(),aw=null;
const webOk=()=>S.web!==false&&(navigator.hardwareConcurrency||4)>=4&&!(navigator.connection&&navigator.connection.saveData)&&!(navigator.deviceMemory&&navigator.deviceMemory<2);
function runWorker(s){return new Promise((res,rej)=>{if(!aw){try{aw=new Worker('js/asr-worker.js',{type:'module'})}catch(e){return rej(e)}}let lp=0;const to=setTimeout(()=>{aw&&aw.terminate();aw=null;rej(new Error('timeout'))},15*60*1000);
 aw.onmessage=e=>{const m=e.data;if(m.type==='dl'){if(Date.now()-lp>1200){lp=Date.now();msg(tr('Downloading the free AI model (once)\u2026')+' '+Math.round(m.p)+'%')}}else if(m.type==='listen')msg(tr('AI is listening in your browser. This can take a few minutes\u2026'));else if(m.type==='done'){clearTimeout(to);res(m.chunks)}else if(m.type==='err'){clearTimeout(to);rej(new Error(m.msg))}};
 aw.onerror=()=>{clearTimeout(to);aw=null;rej(new Error('worker'))};const a=s.slice(0,360*SR);aw.postMessage({type:'run',audio:a},[a.buffer])})}
function browserAsr(t,f){const job=async()=>{if(!tracks.includes(t)||!webOk())return false;const s=await pcm(await blobOf(t,f));if(!tracks.includes(t))return false;const out=await runWorker(s);if(!tracks.includes(t))return false;
  const segs=(out||[]).filter(c=>c.text&&c.text.trim()&&c.timestamp&&c.timestamp[0]!=null),txt=segs.map(c=>c.text.trim());if(segs.length<3||new Set(txt).size<txt.length*.5)return false;
  sv(lkey(t),segs.map(c=>`[${String(c.timestamp[0]/60|0).padStart(2,'0')}:${(c.timestamp[0]%60).toFixed(2).padStart(5,'0')}]${c.text.trim()}`).join('\n'));sv('vm.lyai.'+t.key,1);return true};
 const p=asrChain.catch(()=>{}).then(job);asrChain=p.catch(()=>{});return p}
window.afterAdd=(t,f)=>{run(t,f)};
const sweb=$('#sweb');sweb.checked=S.web!==false;sweb.onchange=e=>{S.web=e.target.checked;saveS()};
const _sh=show;show=t=>{_sh(t);$('#lcov').src=t.art;$('#lti').textContent=t.title;$('#lar').textContent=t.artist};
const _sl=setLang;setLang=l=>{_sl(l);paintStatus()};
const sa=$('#sauto');sa.checked=S.auto!==false;sa.onchange=e=>{S.auto=e.target.checked;saveS()};
status();
})();
