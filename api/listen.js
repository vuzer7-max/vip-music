/* POST /api/listen  {audio: base64 WAV clip, duration}
   Recognises the song from ~12 seconds of audio with AudD (needs AUDD_API_TOKEN), then finds the original cover (iTunes) and lyrics (LRCLIB). */
const {helpers:H}=require('./identify.js');
module.exports=async(req,res)=>{
 res.setHeader('cache-control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST only'});
 const tok=process.env.AUDD_API_TOKEN;if(!tok)return res.status(501).json({error:'AUDD_API_TOKEN is not set'});
 const ip=String(req.headers['x-forwarded-for']||'').split(',')[0]||'x';if(H.limited(ip))return res.status(429).json({error:'Too many requests'});
 let b=req.body;if(typeof b==='string'){try{b=JSON.parse(b)}catch{b={}}}b=b||{};
 const buf=Buffer.from(String(b.audio||''),'base64');if(buf.length<2000||buf.length>3000000)return res.status(400).json({error:'Bad audio clip'});
 try{const fd=new FormData();fd.append('api_token',tok);fd.append('file',new Blob([buf],{type:'audio/wav'}),'clip.wav');fd.append('return','apple_music,spotify');
  const r=await fetch('https://api.audd.io/',{method:'POST',body:fd}),j=await r.json(),m=j&&j.result;
  if(!m||!m.title)return res.status(200).json({found:false});
  const g={artist:m.artist||'',title:m.title,album:m.album||''},dur=+b.duration||0;let hit=null;try{hit=await H.itunes(g.artist,g.title)}catch{}
  const [ly,cover]=await Promise.all([H.lrclib(g.artist,g.title,g.album,dur).catch(()=>null),hit&&hit.artworkUrl100?H.image(hit.artworkUrl100.replace('100x100bb','400x400bb')).catch(()=>''):'']);
  res.status(200).json({found:true,title:g.title,artist:g.artist,album:hit&&hit.collectionName||g.album,cover:cover||'',lrc:ly&&ly.syncedLyrics||'',plain:ly&&ly.plainLyrics||''})
 }catch(e){res.status(502).json({error:'Recognition failed'})}};
