/* First-visit welcome: asks the visitor to sign up (or continue as a guest). */
(function(){
const gate=$('#gate'),done=()=>{gate.hidden=true;sv('vm.skip',1)};
$('#gate .logo').insertAdjacentHTML('afterbegin',LOGO);
const _s=setLang;setLang=l=>{_s(l);$('#lg3').value=l};$('#lg3').value=LANG;$('#lg3').onchange=e=>setLang(e.target.value);
if(!USER&&!ld('vm.skip',0))gate.hidden=false;
$('#gskip').onclick=done;
$('#gf').onsubmit=async e=>{e.preventDefault();const f=e.target,p=f.p.value;if(p.length<8)return msg(tr('Password must be at least 8 characters.'));try{const salt=[...crypto.getRandomValues(new Uint8Array(8))].join('-');USER={name:f.n.value.trim(),email:f.m.value.trim().toLowerCase(),salt,hash:await hx(p,salt)};sv('vm.user',USER);sv('vm.in',1);f.reset();upAcc();done();msg(tr('Welcome, {0}!',USER.name))}catch{msg(tr('Sign up isn\u2019t available in this browser.'))}};
})();
