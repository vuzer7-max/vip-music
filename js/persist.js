/* Keeps the songs you add (file, cover, title/artist) in IndexedDB, so they are still here after you close the site. */
(function(){
if(!window.indexedDB)return;
let db,restoring=false,st,warned=false;const sig={},ST=['files','meta','covers'];
const idb=()=>db||(db=new Promise((ok,no)=>{const r=indexedDB.open('vmusic',1);r.onupgradeneeded=()=>ST.forEach(s=>r.result.createObjectStore(s));r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}));
const run=(s,m,f)=>idb().then(d=>new Promise((ok,no)=>{const t=d.transaction(s,m),r=f(t);t.oncomplete=()=>ok(r&&r.result);t.onerror=t.onabort=()=>no(t.error)}));
const put=(s,k,v)=>run(s,'readwrite',t=>{t.objectStore(s).put(v,k)});
const get=(s,k)=>run(s,'readonly',t=>t.objectStore(s).get(k));
const drop=k=>run(ST,'readwrite',t=>{ST.forEach(s=>t.objectStore(s).delete(k))}).catch(()=>{});
const fail=()=>{if(!warned){warned=true;msg(tr('Couldn’t save this song for next time.'))}};
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch{}

/* save a song the moment it is added; on restore, skip the online lookup when lyrics are already cached */
const _a=window.afterAdd;
window.afterAdd=(t,f)=>{if(f&&!t.lib&&!t.key.startsWith('demo|')){if(restoring){if(ld(lkey(t),''))return}else{t.mine=1;t.n=Date.now()+Math.random();put('files',t.key,f).catch(()=>{drop(t.key);fail()})}}_a&&_a(t,f)};

/* covers that come from the file's tags or that you pick yourself */
const _s=setArt;
setArt=function(t,src){_s(t,src);if(t.mine&&!restoring&&typeof src==='string'&&src.startsWith('blob:'))fetch(src).then(r=>r.blob()).then(b=>put('covers',t.key,b)).catch(()=>{})};

/* title / artist / length are saved a moment after the page updates them */
const meta=()=>tracks.forEach(t=>{if(!t.mine)return;const m={key:t.key,base:t.base,title:t.title,artist:t.artist,album:t.album||'',dur:t.dur||0,n:t.n},s=JSON.stringify(m);if(sig[t.key]!==s){sig[t.key]=s;put('meta',t.key,m).catch(()=>{})}});
const _r=render;render=function(){_r.apply(this,arguments);clearTimeout(st);st=setTimeout(meta,700)};

const _d=removeTrack;removeTrack=t=>{_d(t);drop(t.key)};
window.vmClearSongs=()=>{tracks.filter(t=>t.mine).forEach(t=>removeTrack(t));run(ST,'readwrite',t=>{ST.forEach(s=>t.objectStore(s).clear())}).catch(()=>{})};

async function restore(){try{
 const ms=((await run('meta','readonly',t=>t.objectStore('meta').getAll()))||[]).sort((a,b)=>a.n-b.n);
 for(const m of ms){if(tracks.some(t=>t.key===m.key))continue;
  const f=await get('files',m.key);if(!f){drop(m.key);continue}
  const cv=await get('covers',m.key);
  restoring=true;
  try{addT(f,m.base,m.key,m.artist);const t=tracks.find(x=>x.key===m.key);
   if(t){t.mine=1;t.n=m.n;t.title=m.title;t.artist=m.artist;if(m.album)t.album=m.album;if(m.dur)t.dur=m.dur;sig[t.key]=JSON.stringify(m);
    const cc=ld('vm.cv.'+t.key,'');if(cv){t.hasPic=1;setArt(t,URL.createObjectURL(cv))}else if(cc){t.hasPic=1;setArt(t,cc)}}}
  finally{restoring=false}}
 render()}catch{}}
restore();
})();
