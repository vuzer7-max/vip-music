/* Built-in library: the two songs that ship with the site. Lyrics (and the original cover for "Детство") are looked up on first load and cached. */
function removeTrack(t){const i=tracks.indexOf(t);if(i<0)return;const was=q[cur]===t;tracks.splice(i,1);const qi=q.indexOf(t);if(qi>=0){q.splice(qi,1);if(was)cur=-1;else if(qi<cur)cur--}
 if(was){aud.pause();aud.removeAttribute('src');aud.load();$('#pt').textContent=tr('Nothing playing');$('#pa').textContent=tr('Add music to begin');$('#pi').hidden=true;$('#vi').hidden=true;document.title='V MUSIC';applyPal(null);heart();showLy()}
 if(t.url.startsWith('blob:'))URL.revokeObjectURL(t.url);favs.delete(t.key);sv('vm.fav',[...favs]);Object.keys(pls).forEach(n=>{pls[n]=pls[n].filter(k=>k!==t.key)});sv('vm.pl',pls);
 if(t.lib){const r=ld('vm.rm',[]);r.push(t.key);sv('vm.rm',r)}try{['vm.ly.','vm.cv.','vm.lyai.'].forEach(p=>localStorage.removeItem(p+t.key))}catch{}
 render();msg(tr('Song removed.'))}
(function(){
const LIB=[
 {file:'assets/music/samoe-svetloe-chuvstvo.m4a',title:'Самое-самое светлое чувство',artist:'Abdusattor Orifboyev',cover:'assets/covers/samoe-svetloe-chuvstvo.jpg',dur:179.1,pic:1},
 {file:'assets/music/detstvo.m4a',title:'Детство',artist:'Юрий Шатунов',cover:'assets/covers/detstvo.jpg',dur:227.6,pic:0}];
const rm=ld('vm.rm',[]);
LIB.forEach(m=>{const key='lib|'+m.file;if(rm.includes(key)||tracks.some(t=>t.key===key))return;const t={key,base:m.artist+' - '+m.title,url:m.file,artist:m.artist,title:m.title,dur:m.dur,hasPic:m.pic,lib:1};tracks.push(t);setArt(t,m.cover)});
render();tracks.filter(t=>t.lib).forEach(t=>afterAdd(t,null));
})();
