/* Runs the free in-browser Whisper model off the main thread, so the page never freezes. */
import {pipeline,env} from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
env.allowLocalModels=false;let asr;
self.onmessage=async e=>{const m=e.data;if(m.type!=='run')return;
 try{if(!asr)asr=await pipeline('automatic-speech-recognition','Xenova/whisper-base',{progress_callback:p=>{if(p.status==='progress')self.postMessage({type:'dl',p:p.progress})}});
  self.postMessage({type:'listen'});const out=await asr(m.audio,{chunk_length_s:30,stride_length_s:5,return_timestamps:true,task:'transcribe'});self.postMessage({type:'done',chunks:out.chunks||[]})}
 catch(err){self.postMessage({type:'err',msg:String(err&&err.message||err)})}};
