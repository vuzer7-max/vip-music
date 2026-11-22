/* POST /api/transcribe  {audio: base64 WAV chunk, prompt?}
   Listens to a chunk of the song with OpenAI Whisper (needs OPENAI_API_KEY) and returns timed text segments. */
const {helpers:H}=require('./identify.js');
module.exports=async(req,res)=>{
 res.setHeader('cache-control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'POST only'});
 const key=process.env.OPENAI_API_KEY;if(!key)return res.status(501).json({error:'OPENAI_API_KEY is not set'});
 const ip=String(req.headers['x-forwarded-for']||'').split(',')[0]||'x';if(H.limited(ip+'t'))return res.status(429).json({error:'Too many requests'});
 let b=req.body;if(typeof b==='string'){try{b=JSON.parse(b)}catch{b={}}}b=b||{};
 const buf=Buffer.from(String(b.audio||''),'base64');if(buf.length<2000||buf.length>3500000)return res.status(400).json({error:'Bad audio chunk'});
 try{const fd=new FormData();fd.append('file',new Blob([buf],{type:'audio/wav'}),'chunk.wav');fd.append('model','whisper-1');fd.append('response_format','verbose_json');fd.append('timestamp_granularities[]','segment');if(b.prompt)fd.append('prompt',String(b.prompt).slice(0,200));
  const r=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{authorization:'Bearer '+key},body:fd}),j=await r.json();
  if(!r.ok)return res.status(502).json({error:(j.error&&j.error.message)||'Transcription failed'});
  res.status(200).json({language:j.language||'',segments:(j.segments||[]).map(s=>({start:s.start,end:s.end,text:String(s.text||'').trim(),ns:s.no_speech_prob,lp:s.avg_logprob}))})
 }catch{res.status(502).json({error:'Transcription failed'})}};
