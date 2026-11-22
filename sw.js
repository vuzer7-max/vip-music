/* V MUSIC service worker: the app opens offline; the built-in songs are saved after the first play. */
const V='vmusic-v12';
const SHELL=['./','index.html','manifest.webmanifest','css/styles.css','js/i18n-extra.js','js/i18n-ru.js','js/app.js','js/fullshow.js','js/pip.js','js/welcome.js','js/lookup.js','js/identify.js','js/library.js','js/persist.js','js/select.js','js/pwa.js','js/asr-worker.js','assets/favicon.svg','assets/v-music-logo.svg','assets/v-music-wordmark.svg','assets/icon-192.png','assets/icon-512.png','assets/icon-maskable-512.png','assets/apple-touch-icon.png','assets/covers/samoe-svetloe-chuvstvo.jpg','assets/covers/detstvo.jpg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V&&x.startsWith('vmusic-')).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
async function audio(r,e){
 const c=await caches.open(V),key=new Request(r.url),h=await c.match(key);
 if(!h){e.waitUntil(new Promise(ok=>setTimeout(ok,8000)).then(()=>fetch(key)).then(x=>x.status===200?c.put(key,x):0).catch(()=>{}));return fetch(r)}
 const rg=r.headers.get('range');if(!rg)return h;
 const buf=await h.arrayBuffer(),n=buf.byteLength,m=/bytes=(\d*)-(\d*)/.exec(rg);if(!m)return h;
 let s=m[1]?+m[1]:0,en=m[2]?Math.min(+m[2],n-1):n-1;if(!m[1]&&m[2]){s=Math.max(0,n-+m[2]);en=n-1}
 return new Response(buf.slice(s,en+1),{status:206,headers:{'Content-Type':h.headers.get('Content-Type')||'audio/mp4','Content-Range':'bytes '+s+'-'+en+'/'+n,'Content-Length':String(en-s+1),'Accept-Ranges':'bytes'}})}
self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
 if(u.origin===location.origin){
  if(u.pathname.indexOf('/api/')>=0)return;
  if(/\.(m4a|mp3|ogg|wav)$/i.test(u.pathname)){e.respondWith(audio(r,e));return}
  e.respondWith(fetch(r).then(x=>{if(x.ok){const c=x.clone();caches.open(V).then(h=>h.put(r,c))}return x}).catch(()=>caches.match(r,{ignoreSearch:true}).then(h=>h||(r.mode==='navigate'?caches.match('index.html'):Response.error()))));
 }else if(/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
  e.respondWith(caches.match(r).then(h=>h||fetch(r).then(x=>{const c=x.clone();caches.open(V).then(k=>k.put(r,c));return x})));
 }});
