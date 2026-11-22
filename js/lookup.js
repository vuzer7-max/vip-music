/* Free lookups straight from the browser (no keys): covers from iTunes, Deezer, MusicBrainz + Cover Art Archive; lyrics from LRCLIB, then lyrics.ovh. */
(function(){
const norm=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const jsonp=(url,ms=7000)=>new Promise((res,rej)=>{const cb='jp'+Math.random().toString(36).slice(2),s=document.createElement('script'),end=()=>{clearTimeout(tm);delete window[cb];s.remove()},tm=setTimeout(()=>{end();rej()},ms);window[cb]=d=>{end();res(d)};s.onerror=()=>{end();rej()};s.src=url+'&callback='+cb;document.head.appendChild(s)});
const getJ=async u=>{const r=await fetch(u);return r.ok?r.json():null};
const match=(a,title,artist)=>{const nt=norm(title),na=norm(artist),tm=a.filter(x=>{const t=norm(x.t);return t&&(t.includes(nt)||nt.includes(t))});return tm.find(x=>na&&(norm(x.a).includes(na)||na.includes(norm(x.a))))||tm[0]||null};
const imgOk=u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i.naturalWidth>50);i.onerror=()=>r(false);i.src=u});
const toData=async u=>{try{const b=await(await fetch(u)).blob();return await new Promise(res=>{const f=new FileReader();f.onload=()=>res(f.result);f.readAsDataURL(b)})}catch{return u}};
async function cover(ar,tl){const q=encodeURIComponent((ar+' '+tl).trim());
 try{const d=await jsonp('https://itunes.apple.com/search?media=music&entity=song&limit=8&term='+q),h=match((d.results||[]).map(x=>({t:x.trackName,a:x.artistName,u:x.artworkUrl100})),tl,ar);if(h&&h.u)return toData(h.u.replace('100x100bb','600x600bb'))}catch{}
 try{const d=await jsonp('https://api.deezer.com/search?output=jsonp&limit=8&q='+q),h=match((d.data||[]).map(x=>({t:x.title,a:x.artist&&x.artist.name,u:x.album&&x.album.cover_xl})),tl,ar);if(h&&h.u)return toData(h.u)}catch{}
 try{const d=await getJ('https://musicbrainz.org/ws/2/release/?fmt=json&limit=5&query='+encodeURIComponent(`recording:"${tl}" AND artist:"${ar}"`));for(const r of d.releases||[]){const u=`https://coverartarchive.org/release/${r.id}/front-500`;if(await imgOk(u))return toData(u)}}catch{}
 return ''}
async function lyrics(ar,tl,dur){let l=null;
 try{const q=new URLSearchParams({track_name:tl,artist_name:ar});if(dur)q.set('duration',Math.round(dur));l=await getJ('https://lrclib.net/api/get?'+q)}catch{}
 if(l&&(l.syncedLyrics||l.plainLyrics))return{lrc:l.syncedLyrics||'',plain:l.plainLyrics||''};
 for(const x of[tl+' '+ar,tl]){try{const a=(await getJ('https://lrclib.net/api/search?'+new URLSearchParams({q:x})))||[],b=a.filter(y=>y.syncedLyrics||y.plainLyrics).sort((y,z)=>Math.abs((y.duration||0)-dur)-Math.abs((z.duration||0)-dur))[0];if(b&&(!dur||Math.abs((b.duration||0)-dur)<8))return{lrc:b.syncedLyrics||'',plain:b.plainLyrics||''}}catch{}}
 try{const d=await getJ('https://api.lyrics.ovh/v1/'+encodeURIComponent(ar)+'/'+encodeURIComponent(tl));if(d&&d.lyrics&&d.lyrics.length>80)return{lrc:'',plain:d.lyrics}}catch{}
 return{}}
window.lookupDirect=async(t,tg)=>{const tl=tg.title||t.title,ar=tg.artist||t.artist,needL=!ld(lkey(t),''),needC=!t.hasPic,j={};
 const[l,c]=await Promise.all([needL?lyrics(ar,tl,t.dur||0):{},needC?cover(ar,tl):'']);return Object.assign(j,l,{cover:c||''})};
})();
