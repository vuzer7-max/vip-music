/* Glass dropdown: replaces the browser's own list for every <select> (also the ones created later).
   The <select> stays in the page, so value and change events work as before. */
(()=>{
let dd=null,src=null,hi=-1,btns=[];
const E=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const CK='<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function close(back){if(!dd)return;const d=dd,s=src;dd=src=null;btns=[];hi=-1;d.classList.remove('on');setTimeout(()=>d.remove(),170);s.setAttribute('aria-expanded','false');if(back)try{s.focus({preventScroll:true})}catch{}}
function mark(i){if(!btns.length)return;hi=(i+btns.length)%btns.length;btns.forEach((b,k)=>b.classList.toggle('hl',k===hi));btns[hi].scrollIntoView({block:'nearest'})}
function pick(v){const s=src;close(1);if(!s)return;const mo=s.classList.contains('mo');if(mo||s.value!==v){s.value=v;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}))}}
function open(s){if(dd&&src===s){close(1);return}close();if(s.disabled)return;
 const mo=s.classList.contains('mo'),opts=[...s.options].filter(o=>!(mo&&o.value===''));if(!opts.length)return;
 dd=document.createElement('div');dd.className='dd';dd.setAttribute('role','listbox');src=s;
 dd.innerHTML=opts.map(o=>`<button type="button" role="option" tabindex="-1" data-v="${E(o.value)}" aria-selected="${o.selected&&!mo}"${o.disabled?' disabled':''}>${mo?'':'<i>'+(o.selected?CK:'')+'</i>'}<span>${E(o.textContent)}</span></button>`).join('');
 document.body.appendChild(dd);btns=[...dd.querySelectorAll('button')];
 s.setAttribute('aria-haspopup','listbox');s.setAttribute('aria-expanded','true');
 const r=s.getBoundingClientRect(),vw=innerWidth,vh=innerHeight;dd.style.minWidth=Math.max(r.width,mo?210:150)+'px';dd.style.maxHeight=Math.min(320,vh*.6,vh-16)+'px';
 const h=dd.offsetHeight,w=dd.offsetWidth;let top=r.bottom+6,up=false;
 if(top+h>vh-8){if(r.top-6-h>=8){top=r.top-6-h;up=true}else top=Math.max(8,vh-8-h)}
 dd.style.top=top+'px';dd.style.left=Math.min(Math.max(8,mo?r.right-w:r.left),vw-w-8)+'px';dd.classList.toggle('up',up);
 dd.onclick=e=>{const b=e.target.closest('button');if(b&&!b.disabled)pick(b.dataset.v)};
 dd.onmousemove=e=>{const b=e.target.closest('button');if(b)mark(btns.indexOf(b))};
 mark(Math.max(0,opts.findIndex(o=>o.selected&&!mo)));requestAnimationFrame(()=>dd&&dd.classList.add('on'))}
const sel=e=>e.target&&e.target.closest&&!e.target.closest('.dd')?e.target.closest('select'):null;
document.addEventListener('mousedown',e=>{if(sel(e))e.preventDefault()},true);
document.addEventListener('click',e=>{const s=sel(e);if(!s)return;e.preventDefault();e.stopPropagation();try{s.focus({preventScroll:true})}catch{}open(s)},true);
let t0=null;
document.addEventListener('touchstart',e=>{const s=sel(e);t0=s?{s,x:e.touches[0].clientX,y:e.touches[0].clientY}:null},{capture:true,passive:true});
document.addEventListener('touchend',e=>{if(!t0)return;const t=e.changedTouches[0],o=t0;t0=null;if(Math.abs(t.clientX-o.x)<10&&Math.abs(t.clientY-o.y)<10){e.preventDefault();open(o.s)}},{capture:true,passive:false});
document.addEventListener('pointerdown',e=>{if(dd&&!e.target.closest('.dd')&&e.target.closest('select')!==src)close()},true);
document.addEventListener('scroll',e=>{if(dd&&!dd.contains(e.target))close()},true);
addEventListener('resize',()=>close());addEventListener('blur',()=>close());
document.addEventListener('keydown',e=>{
 if(dd){const k=e.key;if(k==='Escape'||k==='Tab'){if(k==='Escape'){e.preventDefault();e.stopPropagation()}close(k==='Escape');return}
  if(k==='ArrowDown'||k==='ArrowUp'||k==='Home'||k==='End'){e.preventDefault();e.stopPropagation();mark(k==='Home'?0:k==='End'?btns.length-1:hi+(k==='ArrowDown'?1:-1));return}
  if(k==='Enter'||k===' '){e.preventDefault();e.stopPropagation();if(btns[hi]&&!btns[hi].disabled)pick(btns[hi].dataset.v);return}return}
 const s=document.activeElement;if(s&&s.tagName==='SELECT'&&(e.key==='ArrowDown'||e.key==='ArrowUp'||e.key==='Enter'||e.key===' ')){e.preventDefault();e.stopPropagation();open(s)}},true);
})();
