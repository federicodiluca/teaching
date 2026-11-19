/* giochi: motore comune delle attività tg-act (Informatica 1).
   Ogni pagina carica questo file subito prima del suo script, che contiene solo dati e giochi propri:
     <script src="../../../assets/giochi.js"></script><script> ...dati e chiamate... </script>
   Tutto è globale (come negli script delle pagine), così le pagine usano direttamente
   rnd, pick, mount, mission, sortGame... senza prefissi.

   Contratto con la pagina:
   - schede: <section id="..." data-t="etichetta"> dentro <main>; data-g="gruppo" per le sottoschede.
     La nav (#nav) si costruisce da sola; go(id) cambia scheda; la scheda "res" mostra il risultato.
   - nomi in #n1 e #n2 (#n2 assente se si gioca da soli); data-solo="1" sul body = da soli.
   - risultato in #who, #restab, #rmsg.
   - punteggi in ST: ST.g["gioco"] = {ok, tot}, ST.m["missione"] = {pts, t, count}.
   I progressi si salvano nel browser (localStorage) e si ripristinano qui, prima che la pagina monti i giochi. */

/* ---------- utilità ---------- */
const DBG={};const $=s=>document.querySelector(s);
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a,pick=a=>a[rnd(0,a.length-1)];
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(0,i);[a[i],a[j]]=[a[j],a[i]]}return a}
const B=(n,b)=>n.toString(b).toUpperCase(),fmt=x=>String(x).replace('.',','),sep=n=>n.toLocaleString('it-IT');
const lv=(l,a,b,c)=>[a,b,c][l-1];
function norm(s){s=String(s).trim().toUpperCase().replace(/\s+/g,'');if(s.includes('.')&&!s.includes(','))s=s.replace('.',',');
 let [i,f]=s.split(',');i=(i||'').replace(/^0+/,'')||'0';if(f!==undefined){f=f.replace(/0+$/,'');return f?i+','+f:i}return i}
function parseNum(s){s=String(s).trim().replace(/\s+/g,'');if(/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s))s=s.replace(/\./g,'');s=s.replace(',','.');const v=Number(s);return isNaN(v)||s===''?NaN:v}
function checkField(f,val){if(f.kind==='str')return norm(val)===norm(f.exp);if(f.kind==='choice')return val===f.exp;
 const v=parseNum(val),e=Number(f.exp);if(isNaN(v))return false;if(f.tol===0)return v===e;return Math.abs(v-e)<=Math.abs(e)*(f.tol||0.005)+1e-9}
const P=h=>`<pre>${h}</pre>`;

/* ---------- schede e navigazione ----------
   Prima riga: i gruppi (data-g, oppure la scheda stessa); seconda riga: le sottoschede del gruppo aperto. */
const SECS=[...document.querySelectorAll('main section')];SECS[0].classList.add('on');
const SOLO=!!document.querySelector('[data-solo]');
const GK=s=>s.dataset.g||s.id,GROUPS=[...new Set(SECS.map(GK))];
$('#nav').innerHTML=`<div class="nv" id="nv1"></div><div class="nv" id="nv2"></div>`;
function go(id){const cur=SECS.find(x=>x.id===id),g=GK(cur);SECS.forEach(x=>x.classList.toggle('on',x.id===id));
 $('#nv1').innerHTML=GROUPS.map(k=>{const first=SECS.find(s=>GK(s)===k);return `<button data-s="${first.id}" class="${k===g?'on':''}">${first.dataset.g||first.dataset.t}</button>`}).join('');
 const subs=SECS.filter(s=>GK(s)===g);$('#nv2').innerHTML=subs.length>1?subs.map(s=>`<button data-s="${s.id}" class="sub ${s.id===id?'on':''}">${s.dataset.t}</button>`).join(''):'';
 document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>go(b.dataset.s));if(id==='res')showRes();window.scrollTo(0,0)}
go(SECS[0].id);

/* ---------- giocatori e punteggi ---------- */
const PAIR={n:['Giocatore 1','Giocatore 2'],t:1},ST={g:{},m:{}},MISSIONI=[];
function names(){PAIR.n=[$('#n1').value.trim()||'Giocatore 1',($('#n2')?$('#n2').value.trim():'')||'Giocatore 2']}
const escH=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function turn(){if(SOLO)return '';names();PAIR.t^=1;return `<div class="turn">Tocca a <b>${escH(PAIR.n[PAIR.t])}</b> (scrive) · <b>${escH(PAIR.n[PAIR.t^1])}</b> controlla</div>`}
const stat=l=>ST.g[l]=ST.g[l]||{ok:0,tot:0};

/* ---------- progressi salvati nel browser ----------
   Una chiave per pagina ("tg-progressi:" + percorso dalla radice del sito). Si salvano solo i giochi
   con almeno una risposta, le missioni finite e i nomi; "done" (partita in corso) no.
   Ogni accesso a localStorage è in try/catch: in navigazione privata la pagina funziona senza salvare.
   teaching.js usa window.GIOCHI per l'avviso "Ripresi i progressi" e per "Ricomincia da capo". */
const GIOCHI=(function(){
 const me=document.currentScript,root=me?new URL('..',me.src).href:'';
 const qui=location.href.replace(/[?#].*$/,'').replace(/index\.html?$/,'');
 const chiave='tg-progressi:'+((root&&qui.indexOf(root)===0?qui.slice(root.length).replace(/\/$/,''):'')||location.pathname);
 const campi=['n1','n2'].map(id=>document.getElementById(id)).filter(Boolean);
 const num=x=>typeof x==='number'&&isFinite(x)&&x>=0;
 function istantanea(){const g={},m={};
  Object.keys(ST.g).forEach(k=>{const v=ST.g[k];if(v.tot)g[k]={ok:v.ok,tot:v.tot}});
  Object.keys(ST.m).forEach(k=>{m[k]=ST.m[k]});
  const nomi=campi.map(c=>c.value);
  if(!Object.keys(g).length&&!Object.keys(m).length&&!nomi.some(Boolean))return '';
  return JSON.stringify({st:{g,m},nomi})}
 let ripresi=false,azzerato=false;
 try{const d=JSON.parse(localStorage.getItem(chiave)||'null');
  if(d&&d.v===1&&d.d&&d.d.st){const s=d.d.st;
   Object.keys(s.g||{}).forEach(k=>{const v=s.g[k];if(v&&num(v.ok)&&num(v.tot)&&v.ok<=v.tot)ST.g[k]={ok:v.ok,tot:v.tot}});
   Object.keys(s.m||{}).forEach(k=>{const v=s.m[k];if(v&&num(v.pts)&&num(v.count)&&typeof v.t==='string')ST.m[k]={pts:v.pts,t:v.t,count:v.count}});
   if(s.ms&&num(s.ms.pts)&&typeof s.ms.t==='string')ST.m['Missione finale']={pts:s.ms.pts,t:s.ms.t,count:10};  // formato dei primi giorni
   (d.d.nomi||[]).forEach((n,i)=>{if(campi[i]&&typeof n==='string'&&n)campi[i].value=n});
   ripresi=istantanea()!==''}}catch(e){}
 let ultimo=istantanea();
 function salva(){if(azzerato)return;const s=istantanea();if(s===ultimo)return;ultimo=s;
  try{if(!s)localStorage.removeItem(chiave);else localStorage.setItem(chiave,'{"v":1,"t":'+Date.now()+',"d":'+s+'}')}catch(e){}}
 ['click','change','input','keyup'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(salva,0),true));
 window.addEventListener('pagehide',salva);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)salva()});
 setInterval(salva,4000);
 function ricomincia(){if(!window.confirm('Cancellare i risultati salvati su questo computer e ricominciare da capo?'))return;
  azzerato=true;try{localStorage.removeItem(chiave)}catch(e){}campi.forEach(c=>{c.value=''});
  location.replace(location.href.replace(/#.*$/,''))}
 return {chiave,ripresi,ricomincia,salva};
})();

/* ---------- esercizio con campi da compilare ----------
   genFn() restituisce {q, fields:[{label, kind:'str'|'num'|'choice', exp, opts, tol}], sol, sl}.
   sl = titolo della soluzione ("Spiegazione"); senza sl è "Procedimento". */
function fieldsHTML(ex){return ex.fields.map(f=>`<div class="f"><label>${f.label}</label>`+(f.kind==='choice'?`<select>${f.opts.map(o=>`<option>${o}</option>`).join('')}</select>`:`<input type="text" autocomplete="off" autocapitalize="off" spellcheck="false">`)+`</div>`).join('')}
function mount(el,genFn,label){const st=stat(label);el.innerHTML='';const box=document.createElement('div');el.appendChild(box);let ex,first;
 function draw(){ex=genFn();first=true;
  box.innerHTML=`<div class="card">${turn()}<p class="q">${ex.q}</p>${fieldsHTML(ex)}<div class="row"><button class="btn" data-a="c">Controlla</button><button class="btn sec" data-a="s">Mostra ${ex.sl?'la spiegazione':'il procedimento'}</button><button class="btn sec" data-a="n">Altro esercizio</button><span class="msg"></span></div><div class="sol" style="display:none"></div><div class="stat"></div></div>`;
  box.querySelector('[data-a=c]').onclick=check;box.querySelector('[data-a=n]').onclick=draw;
  box.querySelector('[data-a=s]').onclick=()=>{const s=box.querySelector('.sol');s.innerHTML='<b>'+(ex.sl||'Procedimento')+'</b>'+ex.sol;s.style.display='block'};
  box.querySelectorAll('input').forEach(i=>i.onkeydown=e=>{if(e.key==='Enter')check()});up()}
 const up=()=>box.querySelector('.stat').textContent=`Esatti: ${st.ok} su ${st.tot}`;
 function check(){const ins=[...box.querySelectorAll('.f input,.f select')];let all=true;
  ex.fields.forEach((f,i)=>{const ok=checkField(f,ins[i].value);ins[i].classList.remove('ok','ko');ins[i].classList.add(ok?'ok':'ko');if(!ok)all=false});
  if(first){st.tot++;if(all)st.ok++;first=false}const m=box.querySelector('.msg');m.textContent=all?'Esatto!':'Non ancora: controllate i campi rossi o aprite il procedimento.';m.style.color=all?'var(--ok)':'var(--ko)';up()}
 draw()}

/* ---------- allenatore: menu a tendina (e livelli) + esercizio ----------
   items = [["Nome", gen(livello)], ...] */
function mountMenu(el,items,label,levels){el.innerHTML=`<div class="row"><select class="mt">${items.map((a,i)=>`<option value="${i}">${a[0]}</option>`).join('')}</select>`+(levels?`<select class="ml"><option value="1">Livello 1: facile</option><option value="2">Livello 2: medio</option><option value="3">Livello 3: difficile</option></select>`:'')+`</div><div class="inner"></div>`;
 const m=()=>{const i=+el.querySelector('.mt').value,l=levels?+el.querySelector('.ml').value:1;mount(el.querySelector('.inner'),()=>items[i][1](l),label+': '+items[i][0]+(levels?' (liv. '+l+')':''))};
 el.querySelector('.mt').onchange=m;if(levels)el.querySelector('.ml').onchange=m;m()}

/* ---------- missione a tempo ----------
   poolFns = generatori come per mount; se ne pescano count a caso. Vale il primo controllo. */
function mission(el,poolFns,label,count=10){let T;MISSIONI.push(label);const nome='la '+label.charAt(0).toLowerCase()+label.slice(1);el.innerHTML=`<div class="row"><button class="btn" id="ms-s">Inizia ${nome}</button><span class="timer" id="ms-t"></span></div><div id="ms-x"></div>`;
 const tt=()=>{const s=Math.floor((Date.now()-T.t0)/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
 el.querySelector('#ms-s').onclick=()=>{T={t0:Date.now(),n:0,pts:0,qs:shuffle(poolFns).slice(0,count)};delete ST.m[label];el.querySelector('#ms-s').disabled=true;clearInterval(T.iv);T.iv=setInterval(()=>el.querySelector('#ms-t').textContent=tt(),500);Q()};
 function Q(){const ex=T.qs[T.n]();DBG.cur=ex;const x=el.querySelector('#ms-x');
  x.innerHTML=`<div class="card">${turn()}<div class="stat">Domanda ${T.n+1} di ${count} · punti: ${T.pts}</div><p class="q">${ex.q}</p>${fieldsHTML(ex)}<div class="row"><button class="btn" id="c">Controlla</button><button class="btn sec" id="n" style="display:none">Avanti</button><span class="msg" id="m"></span></div><div class="sol" id="sl" style="display:none"></div></div>`;
  x.querySelector('#c').onclick=()=>{const ins=[...x.querySelectorAll('.f input,.f select')];let all=true;ex.fields.forEach((f,i)=>{const ok=checkField(f,ins[i].value);ins[i].classList.add(ok?'ok':'ko');if(!ok)all=false;ins[i].disabled=true});
   if(all)T.pts++;const m=x.querySelector('#m');m.textContent=all?'Esatto! +1':`Sbagliato. ${ex.sl||'Procedimento'} sotto.`;m.style.color=all?'var(--ok)':'var(--ko)';
   if(!all){const s=x.querySelector('#sl');s.innerHTML='<b>'+(ex.sl||'Procedimento')+'</b>'+ex.sol;s.style.display='block'}
   x.querySelector('#c').disabled=true;const n=x.querySelector('#n');n.style.display='inline-block';n.textContent=T.n===count-1?'Vedi il risultato':'Avanti'};
  x.querySelector('#n').onclick=()=>{T.n++;if(T.n>=count){clearInterval(T.iv);ST.m[label]={pts:T.pts,t:tt(),count};x.innerHTML=`<div class="card"><p class="q">Finita: <b>${T.pts} su ${count}</b> in ${ST.m[label].t}.</p></div>`;el.querySelector('#ms-s').disabled=false;el.querySelector('#ms-s').textContent='Riprova '+nome}else Q()}}}

/* ---------- smistamento: clic sulla carta, poi sulla categoria ----------
   cards = [["testo", "idCategoria"], ...]; buckets = [{id, t, s}, ...] */
function sortGame(el,cards,buckets,label){const st=stat(label);let L,sel;
 function draw(){L={left:cards.length,err:0};sel=null;st.done=false;
  el.innerHTML=`<div class="pool"></div><div class="buckets"></div><div class="row"><span class="msg"></span><button class="btn sec" data-a="r">Ricomincia</button></div>`;
  const pool=el.querySelector('.pool'),bk=el.querySelector('.buckets');
  shuffle([...cards.keys()]).forEach(i=>{const c=document.createElement('div');c.className='chip';c.textContent=cards[i][0];c.dataset.i=i;
   c.onclick=()=>{el.querySelectorAll('.chip.sel').forEach(x=>x.classList.remove('sel'));if(sel===c){sel=null;hl(false);return}sel=c;c.classList.add('sel');hl(true)};pool.appendChild(c)});
  buckets.forEach(k=>{const d=document.createElement('div');d.className='bk';d.dataset.id=k.id;d.innerHTML=`<h3>${k.t}</h3><small>${k.s||''}</small>`;d.onclick=()=>put(d);bk.appendChild(d)});
  el.querySelector('[data-a=r]').onclick=draw;msg()}
 const hl=on=>el.querySelectorAll('.bk').forEach(x=>x.classList.toggle('hl',on));
 const msg=()=>{el.querySelector('.msg').textContent=L.left?`Carte da smistare: ${L.left}. Errori: ${L.err}.`:`Finito! Errori: ${L.err}.`};
 function put(d){if(!sel)return;hl(false);const c=sel;sel=null;
  if(cards[c.dataset.i][1]===d.dataset.id){c.classList.remove('sel');c.onclick=null;d.appendChild(c);L.left--;if(!L.left&&!st.done){st.done=true;st.tot++;if(L.err===0)st.ok++}}
  else{L.err++;c.classList.remove('sel');c.classList.add('wrong');setTimeout(()=>c.classList.remove('wrong'),400)}msg()}
 draw()}
const SG=(id,cards,bk,label)=>sortGame($(id),cards,bk,label);

/* ---------- riordino con trascinamento e frecce ----------
   items = [["titolo", "descrizione", "anno"], ...] nell'ordine giusto; years = mostra l'anno dopo la verifica */
function orderGame(el,items,label,years){const st=stat(label);let order,first,shown;
 function round(){let o;do{o=shuffle([...items.keys()])}while(o.every((v,i)=>v===i));order=o;first=true;shown=false;draw();el.querySelector('.msg').textContent='';el.querySelector('#ov').disabled=false}
 el.innerHTML=`<ol class="ord"></ol><div class="row"><button class="btn" id="ov">Verifica</button><button class="btn sec" id="or">Rimescola</button><span class="msg"></span></div><div class="stat"></div>`;
 function draw(){const ul=el.querySelector('.ord');ul.innerHTML='';
  order.forEach((idx,pos)=>{const e=items[idx];const li=document.createElement('li');li.draggable=!shown;
   li.innerHTML=`<div class="t"><b>${e[0]}</b><span>${e[1]}</span></div><div class="yr">${shown&&years?e[2]:''}</div>`+(shown?'':`<div class="mv"><button>▲</button><button>▼</button></div>`);
   if(shown)li.classList.add(idx===pos?'ok':'ko');
   else{const [u,d]=li.querySelectorAll('button');u.onclick=()=>mv(pos,-1);d.onclick=()=>mv(pos,1);
    li.ondragstart=ev=>{DBG.drag=pos;li.classList.add('drag');ev.dataTransfer.setData('text/plain',pos)};li.ondragend=()=>li.classList.remove('drag');
    li.ondragover=ev=>{ev.preventDefault();li.classList.add('over')};li.ondragleave=()=>li.classList.remove('over');
    li.ondrop=ev=>{ev.preventDefault();const f=DBG.drag;if(f===undefined||f===pos)return;const x=order.splice(f,1)[0];order.splice(pos,0,x);draw()}}
   ul.appendChild(li)});up()}
 function mv(p,d){const q=p+d;if(q<0||q>=order.length)return;[order[p],order[q]]=[order[q],order[p]];draw()}
 const up=()=>el.querySelector('.stat').textContent=`Giusti al primo tentativo: ${st.ok} su ${st.tot}`;
 el.querySelector('#ov').onclick=()=>{let ok=0;order.forEach((v,i)=>{if(v===i)ok++});shown=true;draw();const all=ok===items.length;if(first){st.tot++;if(all)st.ok++;first=false}
  const m=el.querySelector('.msg');m.textContent=all?'Perfetto! Tutto in ordine.':`Posizioni corrette: ${ok} su ${items.length}. Le righe rosse sono fuori posto: premete «Rimescola» per riprovare.`;m.style.color=all?'var(--ok)':'var(--ko)';el.querySelector('#ov').disabled=true;up()};
 el.querySelector('#or').onclick=round;round()}
const asOrder=a=>a.map(x=>[x[0],x[1],x[2]||'']);

/* ---------- caccia all'errore: fare clic sulla riga sbagliata ----------
   gen() restituisce {t: consegna, lines: [...], bad: indice della riga sbagliata, why: spiegazione} */
function hunt(el,gen,label='Caccia all\'errore'){const st=stat(label);let h,done;function draw(){h=gen();DBG.h=h;done=false;
 el.innerHTML=`<div class="card">${turn()}<p class="q">${h.t}</p><div></div><div class="row"><span class="msg"></span><button class="btn sec" id="hn">Altro esercizio</button></div><div class="stat"></div></div>`;
 const box=el.querySelector('.card div:not(.turn)');h.lines.forEach((l,i)=>{const b=document.createElement('button');b.className='line';b.textContent=l;b.onclick=()=>{if(done)return;done=true;st.tot++;
  if(i===h.bad){st.ok++;b.classList.add('ok');el.querySelector('.msg').textContent='Trovato! '+h.why;el.querySelector('.msg').style.color='var(--ok)'}
  else{b.classList.add('ko');box.children[h.bad].classList.add('ok');el.querySelector('.msg').textContent='No: la riga sbagliata era un\'altra. '+h.why;el.querySelector('.msg').style.color='var(--ko)'}up()};box.appendChild(b)});
 el.querySelector('#hn').onclick=draw;up()}
 const up=()=>el.querySelector('.stat').textContent=`Trovati: ${st.ok} su ${st.tot}`;draw()}

/* ---------- memory: due tessere alla volta, si tolgono se hanno lo stesso valore ----------
   gen() restituisce le tessere [[valore, "testo"], ...], due per ogni valore; nota = riga d'aiuto */
function memory(el,gen,label,nota=''){const st=stat(label);let first,lock,moves,pts,tiles;
 function draw(){const items=gen();
  tiles=shuffle(items).map((x,i)=>({v:x[0],t:x[1].trim(),s:'down',i}));DBG.tiles=tiles;first=null;lock=false;moves=0;pts=[0,0];
  el.innerHTML=`<div class="card"><div class="stat" id="mi"></div><div class="mem"></div><div class="row"><button class="btn sec" id="mr">Nuova partita</button><span class="msg" id="mm"></span></div></div>`;
  const g=el.querySelector('.mem');tiles.forEach(t=>{const d=document.createElement('div');d.className='tile';d.textContent='?';d.onclick=()=>flip(t,d);t.el=d;g.appendChild(d)});el.querySelector('#mr').onclick=draw;info()}
 const info=()=>{names();el.querySelector('#mi').innerHTML=(SOLO?`Coppie trovate: ${pts[0]+pts[1]} su ${tiles.length/2} · tentativi: ${moves}.`:`Tocca a <b>${escH(PAIR.n[moves%2])}</b> · coppie trovate: ${escH(PAIR.n[0])} ${pts[0]} · ${escH(PAIR.n[1])} ${pts[1]} · tentativi: ${moves}.`)+(nota?' '+nota:'')};
 function flip(t,d){if(lock||t.s!=='down')return;t.s='up';d.className='tile up';d.textContent=t.t;
  if(!first){first=t;return}const a=first;first=null;moves++;
  if(a.v===t.v){const who=(moves-1)%2;pts[who]++;[a,t].forEach(x=>{x.s='done';x.el.className='tile done'});
   if(tiles.every(x=>x.s==='done')){el.querySelector('#mm').textContent='Partita finita!';st.tot++;st.ok++}}
  else{lock=true;setTimeout(()=>{[a,t].forEach(x=>{x.s='down';x.el.className='tile';x.el.textContent='?'});lock=false;info()},1100)}info()}
 draw()}

/* ---------- quiz da dati: D.VF = [[affermazione, vero?, spiegazione]], D.MC = [[domanda, [opzioni], giusta, spiegazione]] ---------- */
function mcGen(i){const m=D.MC[i];return{q:m[0],sl:'Spiegazione',fields:[{label:'Risposta',kind:'choice',opts:['',...shuffle(m[1])],exp:m[2]}],sol:`<p>Risposta: <b>${m[2]}</b>. ${m[3]}</p>`}}
function vfGen(i){const v=D.VF[i];return{q:`Vero o falso? <b>${v[0]}</b>`,sl:'Spiegazione',fields:[{label:'Risposta',kind:'choice',opts:['','Vero','Falso'],exp:v[1]?'Vero':'Falso'}],sol:`<p>${v[1]?'Vero':'Falso'}. ${v[2]}</p>`}}
/* scenari: list = [[situazione, risposta, spiegazione]], opts = risposte possibili */
function scGen(list,opts,pre,lab){return()=>{const s=pick(list);return{q:`${pre} <b>${s[0]}</b>`,sl:'Spiegazione',fields:[{label:lab,kind:'choice',opts:['',...opts],exp:s[1]}],sol:`<p>Risposta: <b>${s[1]}</b>: ${s[2]}.</p>`}}}
let lastQ=-1;const rndIdx=n=>{let i;do{i=rnd(0,n-1)}while(i===lastQ&&n>1);lastQ=i;return i};
const mcAll=()=>D.MC.map((_,i)=>()=>mcGen(i)),vfAll=()=>D.VF.map((_,i)=>()=>vfGen(i));
function quiz(){mount($('#vf'),()=>vfGen(rndIdx(D.VF.length)),'Vero o falso');mount($('#mc'),()=>mcGen(rndIdx(D.MC.length)),'Risposta multipla')}

/* ---------- risultato ---------- */
function showRes(){names();$('#who').textContent=SOLO?($('#n1').value.trim()?`Nome: ${$('#n1').value.trim()}`:''):`Coppia: ${PAIR.n[0]} e ${PAIR.n[1]}`;const r=[];
 Object.keys(ST.g).forEach(k=>{const v=ST.g[k];if(v.tot)r.push([k,`${v.ok} su ${v.tot} esatti`])});
 const ml=[...new Set([...MISSIONI,...Object.keys(ST.m)])];
 ml.forEach(k=>r.push([k,ST.m[k]?`${ST.m[k].pts} su ${ST.m[k].count} in ${ST.m[k].t}`:'non ancora fatta']));
 $('#restab').innerHTML=r.map(x=>`<tr><th>${x[0]}</th><td>${x[1]}</td></tr>`).join('');
 const ms=Object.values(ST.m),cosa=ml.length===1?'la '+ml[0].toLowerCase():'le sfide';
 $('#rmsg').textContent=ms.length&&ms.every(v=>v.pts/v.count>=0.8)?'Ottimo lavoro!':`Rifate i giochi in cui avete sbagliato di più e poi riprovate ${cosa}.`}
