/* Vercel serverless function: POST /api/identify
   1) Claude cleans up messy file names/tags into artist + title (needs ANTHROPIC_API_KEY, otherwise a simple parser is used)
   2) iTunes Search finds the original cover (and confirms artist/album)
   3) LRCLIB finds synced (or plain) lyrics */
const UA='VMusic/1.0';
const norm=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
const clean=s=>String(s||'').replace(/\.[a-z0-9]{2,4}$/i,'').replace(/_+/g,' ').replace(/[\(\[][^\)\]]*(official|lyric|audio|video|visuali|hd|4k|remaster|clip)[^\)\]]*[\)\]]/gi,'').replace(/\s+/g,' ').trim();
const heur=n=>{const s=clean(n),p=s.split(/\s[-\u2013\u2014]\s/);return p.length>1?{artist:p[0].trim(),title:p.slice(1).join(' - ').trim()}:{artist:'',title:s}};
const hits=new Map();
const limited=ip=>{const n=Date.now(),a=(hits.get(ip)||[]).filter(t=>n-t<60000);a.push(n);hits.set(ip,a);return a.length>20};
async function jget(url){const r=await fetch(url,{headers:{'user-agent':UA}});return r.ok?r.json():null}
async function ai(info){const key=process.env.ANTHROPIC_API_KEY;if(!key)return null;
 try{const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'},
 body:JSON.stringify({model:process.env.ANTHROPIC_MODEL||'claude-haiku-5-5',max_tokens:200,system:'You identify songs from messy file names and tags. Reply with JSON only: {"artist":"","title":"","album":""}. Remove noise such as "Official Video", "Lyrics", uploader names and bitrates. Use the original artist and the canonical song title. Use "" when unsure and never invent.',messages:[{role:'user',content:JSON.stringify(info)}]})});
 const j=await r.json(),t=j.content&&j.content[0]&&j.content[0].text||'',m=t.match(/\{[\s\S]*\}/);return m?JSON.parse(m[0]):null}catch{return null}}
async function itunes(artist,title){const j=await jget('https://itunes.apple.com/search?media=music&entity=song&limit=8&term='+encodeURIComponent((artist+' '+title).trim()));const a=(j&&j.results)||[],nt=norm(title),na=norm(artist);
 const tm=a.filter(x=>{const t=norm(x.trackName);return t&&(t.includes(nt)||nt.includes(t))});return tm.find(x=>na&&(norm(x.artistName).includes(na)||na.includes(norm(x.artistName))))||(na?null:tm[0])||null}
async function lrclib(artist,title,album,dur){const q=new URLSearchParams({track_name:title});if(artist)q.set('artist_name',artist);if(album)q.set('album_name',album);if(dur)q.set('duration',Math.round(dur));
 if(artist){const g=await jget('https://lrclib.net/api/get?'+q);if(g&&(g.syncedLyrics||g.plainLyrics))return g}
 for(const p of [artist?{track_name:title,artist_name:artist}:{q:title},{q:(artist+' '+title).trim()},{q:title}]){const s=await jget('https://lrclib.net/api/search?'+new URLSearchParams(p));
  const best=(s||[]).filter(x=>x.syncedLyrics||x.plainLyrics).sort((x,y)=>Math.abs((x.duration||0)-dur)-Math.abs((y.duration||0)-dur))[0];
  if(best&&(!dur||Math.abs((best.duration||0)-dur)<8))return best}
 return null}
async function image(url){const r=await fetch(url,{headers:{'user-agent':UA}});if(!r.ok)return '';const b=Buffer.from(await r.arrayBuffer());return b.length>1500000?'':'data:image/jpeg;base64,'+b.toString('base64')}
module.exports=async(req,res)=>{
 res.setHeader('cache-control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST only'});
 const ip=String(req.headers['x-forwarded-for']||'').split(',')[0]||'x';if(limited(ip))return res.status(429).json({error:'Too many requests'});
 let b=req.body;if(typeof b==='string'){try{b=JSON.parse(b)}catch{b={}}}b=b||{};
 const L=(v,n)=>String(v||'').slice(0,n),info={name:L(b.name,200),title:L(b.title,120),artist:L(b.artist,120),album:L(b.album,120)},dur=+b.duration||0,need=b.need||{};
 if(!info.name&&!info.title)return res.status(400).json({error:'Nothing to identify'});
 const h=heur(info.name);let g=info.title&&info.artist?{artist:info.artist,title:info.title,album:info.album}:null,usedAi=false;
 if(!g){const a=await ai(info);if(a&&a.title){g={artist:a.artist||info.artist||h.artist,title:a.title,album:a.album||info.album};usedAi=true}}
 g=g||{artist:info.artist||h.artist,title:info.title||h.title,album:info.album};
 let hit=null;try{hit=await itunes(g.artist,g.title)}catch{}
 if(hit){g.artist=g.artist||hit.artistName;g.album=hit.collectionName||g.album}
 const [ly,cover]=await Promise.all([need.lyrics===false?null:lrclib(g.artist,g.title,g.album,dur).catch(()=>null),need.cover===false||!hit||!hit.artworkUrl100?'':image(hit.artworkUrl100.replace('100x100bb','400x400bb')).catch(()=>'')]);
 res.status(200).json({title:g.title,artist:g.artist,album:g.album,cover:cover||'',lrc:ly&&ly.syncedLyrics||'',plain:ly&&ly.plainLyrics||'',ai:usedAi});
};
module.exports.helpers={itunes,lrclib,image,limited,norm};
