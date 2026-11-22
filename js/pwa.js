/* Installable app: registers the service worker and offers "Install app" (Chrome, Edge, Android) or shows the steps (iPhone, iPad, other browsers). */
(()=>{
const $=s=>document.querySelector(s),row=$('#ins'),btn=$('#sins'),hint=$('#sinh');let ev=null;
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function paint(){if(!row)return;if(standalone()){row.hidden=true;return}row.hidden=false;btn.hidden=!ev;
 hint.textContent=tr(ev?'Add V MUSIC to your home screen or desktop. It opens in its own window and works offline.':ios?'On iPhone or iPad: tap Share, then “Add to Home Screen”.':'Open your browser menu and choose “Install app” or “Add to Home screen”.')}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();ev=e;paint()});
addEventListener('appinstalled',()=>{ev=null;paint();try{msg(tr('Installed. Open V MUSIC from your home screen or desktop.'))}catch{}});
if(btn)btn.onclick=async()=>{if(!ev)return;ev.prompt();try{await ev.userChoice}catch{}ev=null;paint()};
['#lg','#lg2','#lg3'].forEach(s=>{const el=$(s);el&&el.addEventListener('change',()=>setTimeout(paint,0))});
matchMedia('(display-mode: standalone)').addEventListener&&matchMedia('(display-mode: standalone)').addEventListener('change',paint);
paint();
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
})();
