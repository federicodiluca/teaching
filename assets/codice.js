/* codice: strumenti sul codice per le attività tg-act. Va caricato dopo assets/giochi.js:
     <script src="../../../assets/giochi.js"></script><script src="../../../assets/codice.js"></script><script> ... </script>
   Contiene l'esecuzione passo passo (traccia) e il laboratorio dal vivo per HTML, CSS e JavaScript (laboratorio).
   Gli stili sono in giochi.css (sezione "codice"). */

/* ---------- colori della sintassi ----------
   lang: 'cpp' | 'java' | 'js' | 'php' | 'flow' (pseudocodice di Flowgorithm) | 'sql' */
const PAROLE={
 cpp:'int double float char bool string void return if else while for do switch case break continue default const auto cout cin endl using namespace std include true false',
 java:'public private protected class interface static void int double float char boolean long byte short String new return if else while for do switch case break continue default final this super null true false extends implements import package try catch finally throw throws',
 js:'let const var function return if else while for do switch case break continue default new true false null undefined of in typeof class this try catch throw async await',
 php:'echo print function return if else elseif while for foreach as do switch case break continue default new true false null array class public private this',
 flow:'Se Altrimenti Mentre Per Fai finché Lettura Scrittura Dichiarazione Assegnazione da a passo Fine Inizio Vero Falso Intero Reale Stringa Booleano',
 sql:'SELECT FROM WHERE AND OR NOT JOIN INNER LEFT RIGHT ON GROUP BY ORDER HAVING AS INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE PRIMARY KEY FOREIGN REFERENCES DISTINCT COUNT SUM AVG MIN MAX ASC DESC NULL IS IN LIKE BETWEEN'
};
const PAROLE_SET={};
function evidenzia(riga,lang){const kw=PAROLE_SET[lang]||(PAROLE_SET[lang]=new Set((PAROLE[lang]||'').split(' ')));
 const re=/(\/\/.*$|--.*$|#include.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|([^\w\s"'$]+|\s+)/g;let h='',m;
 while((m=re.exec(riga))){if(m[1]!==undefined&&!(m[1].startsWith('--')&&lang!=='sql'))h+=`<span class="c">${escH(m[1])}</span>`;
  else if(m[1]!==undefined){h+=escH(m[1][0]);re.lastIndex=m.index+1}
  else if(m[2]!==undefined)h+=`<span class="s">${escH(m[2])}</span>`;else if(m[3]!==undefined)h+=`<span class="n">${m[3]}</span>`;
  else if(m[4]!==undefined)h+=kw.has(lang==='sql'?m[4].toUpperCase():m[4])?`<span class="k">${m[4]}</span>`:m[4].startsWith('$')?`<span class="v">${m[4]}</span>`:m[4];
  else h+=escH(m[5])}
 return h}
function codiceHTML(righe,lang){return `<ol class="cod">${righe.map(r=>`<li><code>${evidenzia(r,lang)||' '}</code></li>`).join('')}</ol>`}

/* ---------- esecuzione passo passo ----------
   traccia(el, gen, etichetta)
   gen() restituisce {t: consegna, lang, code: [righe], run: S => {...}}
   run esegue il programma "a mano" chiamando S(riga, {variabili}, scritto, nota) dopo ogni riga eseguita:
     riga = indice della riga appena eseguita (da 0), variabili = valori dopo quella riga,
     scritto = testo stampato da quella riga (facoltativo), nota = spiegazione del passo (facoltativa).
   In alternativa a run si può dare steps: [{l, v, out, nota}] già pronti (out = solo il testo nuovo).
   Due modi: "Guarda" (si va avanti e indietro, per spiegare) e "Prevedi" (prima di alcuni passi si chiede
   il valore nuovo di una variabile o che cosa viene scritto; i punti vanno nel risultato).

   Oggetti in memoria: run riceve anche H, la memoria dinamica (heap). H.nuovo('Classe', {campi}) crea un oggetto
   e restituisce il suo riferimento, da mettere nelle variabili o nei campi di altri oggetti; H.campo(rif, 'nome', valore)
   cambia un campo; H.di(rif) dà i campi per leggerli. Se il programma usa H, accanto al codice compaiono lo stack
   (le variabili) e lo heap (gli oggetti), collegati da frecce; gli oggetti senza più riferimenti diventano grigi. */
const isRif=x=>!!x&&typeof x==='object'&&!Array.isArray(x)&&'@' in x;
function valoreTraccia(x,lang){if(isRif(x))return '→ oggetto';if(typeof x==='string')return '"'+x+'"';if(typeof x==='boolean')return lang==='flow'?(x?'Vero':'Falso'):String(x);
 if(Array.isArray(x))return (lang==='php'?'[':'{')+x.map(y=>valoreTraccia(y,lang)).join(', ')+(lang==='php'?']':'}');
 if(x===null||x===undefined)return lang==='js'?String(x):lang==='java'||lang==='php'?'null':'?';
 return typeof x==='number'?String(+x.toFixed(6)).replace('.',lang==='flow'?',':'.'):String(x)}
function normTraccia(s){return String(s).trim().toLowerCase().replace(/^["']|["']$/g,'').replace(/\s+/g,' ').replace(/,(?=\d)/g,'.').replace(/^vero$/,'true').replace(/^falso$/,'false')}
function passiTraccia(ex){if(ex.steps)return ex.steps.map(p=>({l:p.l,v:{...p.v},h:p.h||{},out:p.out||'',nota:p.nota||''}));const st=[],ogg={};let n=0;
 const H={nuovo:(c,f)=>{n++;ogg[n]={c,f:{...(f||{})}};return {'@':n}},campo:(r,k,v)=>{ogg[r['@']].f[k]=v},di:r=>ogg[r['@']].f};
 ex.run((l,v,out,nota)=>{st.push({l,v:JSON.parse(JSON.stringify(v||{})),h:JSON.parse(JSON.stringify(ogg)),out:out===undefined||out===null?'':String(out),nota:nota||''})},H);
 return st}
/* oggetti raggiungibili dalle variabili (direttamente o attraverso i campi di altri oggetti) */
function raggiungibili(v,h){const vis=new Set(),coda=Object.values(v).filter(isRif).map(r=>r['@']);
 while(coda.length){const id=coda.pop();if(vis.has(id)||!h[id])continue;vis.add(id);Object.values(h[id].f).forEach(x=>{if(isRif(x))coda.push(x['@']);if(Array.isArray(x))x.filter(isRif).forEach(r=>coda.push(r['@']))})}
 return vis}
function traccia(el,gen,label='Passo passo'){const st=stat(label);let ex,P,k,modo='g',giro,chiesti,attesa,timer;
 /* gen può essere anche un elenco [["Nome", gen], ...]: compare un menu per scegliere il programma */
 const menu=Array.isArray(gen)?gen:null;
 el.innerHTML=`<div class="card trc" tabindex="0">${turn()}${menu?`<div class="row"><select class="mt">${menu.map((a,i)=>`<option value="${i}">${escH(a[0])}</option>`).join('')}</select></div>`:''}<p class="q"></p><div class="row trc-modo"><button class="btn sec on" data-m="g">Guarda</button><button class="btn sec" data-m="p">Prevedi</button><span class="trc-pos"></span></div>
  <div class="trc-box"><div class="trc-cod"></div><div class="trc-lato"><div class="trc-memoria"><table class="trc-var"><thead><tr><th>Variabile</th><th>Valore</th></tr></thead><tbody></tbody></table><div class="trc-heap"><div class="trc-tit">Heap: oggetti</div><div class="trc-ogg"></div></div><svg class="trc-frecce" aria-hidden="true"><defs><marker id="pt-${escH(label.replace(/\W/g,''))}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker></defs><g></g></svg></div><div class="trc-out"><small>Output</small><pre></pre></div></div></div>
  <p class="trc-nota"></p><div class="trc-ask"></div>
  <div class="row"><button class="btn sec" data-a="r" title="Ricomincia">⏮</button><button class="btn sec" data-a="i" title="Indietro (freccia a sinistra)">◀ Indietro</button><button class="btn" data-a="a" title="Avanti (freccia a destra)">Avanti ▶</button><button class="btn sec" data-a="x">Automatico</button><button class="btn sec" data-a="n">Altro programma</button></div><div class="stat"></div></div>`;
 const c=el.querySelector('.trc'),$$=s=>c.querySelector(s),up=()=>$$('.stat').textContent=modo==='p'?`Previsioni esatte: ${st.ok} su ${st.tot}`:'';
 function nuovo(){ex=menu?menu[+$$('.mt').value][1]():gen();P=passiTraccia(ex);k=-1;giro++;fermaAuto();attesa=null;$$('.q').innerHTML=ex.t;$$('.trc-cod').innerHTML=codiceHTML(ex.code,ex.lang);
  /* in Prevedi si chiede su alcuni passi (al massimo 4) in cui cambia una variabile o si scrive qualcosa */
  const cand=[];P.forEach((p,i)=>{const prima=i?P[i-1]:{v:{},h:{}};const cambia=Object.keys(p.v).filter(n=>!isRif(p.v[n])&&JSON.stringify(p.v[n])!==JSON.stringify(prima.v[n])&&n in prima.v);
   /* campi di oggetti già esistenti che cambiano, se una variabile punta all'oggetto: si chiede var.campo */
   const campi=[];Object.keys(p.h).forEach(id=>{if(!prima.h[id])return;const nv=Object.keys(p.v).find(n=>isRif(p.v[n])&&p.v[n]['@']==id);if(!nv)return;
    Object.keys(p.h[id].f).forEach(f=>{const x=p.h[id].f[f];if(!isRif(x)&&f in prima.h[id].f&&JSON.stringify(x)!==JSON.stringify(prima.h[id].f[f]))campi.push({nome:nv+'.'+f,val:x})})});
   if(p.out.trim())cand.push({i,tipo:'out'});else if(campi.length){const q=pick(campi);cand.push({i,tipo:'var',nome:q.nome,val:q.val})}else if(cambia.length)cand.push({i,tipo:'var',nome:pick(cambia)})});
  chiesti=shuffle(cand).slice(0,4).sort((a,b)=>a.i-b.i);
  const mem=P.some(p=>Object.keys(p.h).length);$$('.trc-box').classList.toggle('mem',mem);$$('.trc-heap').style.display=mem?'':'none';
  $$('.trc-var th').textContent=mem?'Stack: variabili':'Variabile';mostra()}
 function cella(x){return isRif(x)?`<span class="rif" data-r="${x['@']}" title="riferimento a un oggetto"></span>`:`<code>${escH(valoreTraccia(x,ex.lang))}</code>`}
 function mostra(){const p=P[k]||{l:-1,v:{},h:{},out:'',nota:''},pp=k>0?P[k-1]:{v:{},h:{}},prima=pp.v;
  c.querySelectorAll('.cod li').forEach((li,i)=>li.classList.toggle('on',i===p.l));
  const nomi=[...new Set(P.slice(0,k+1).flatMap(q=>Object.keys(q.v)))];
  $$('.trc-var tbody').innerHTML=nomi.length?nomi.map(n=>`<tr class="${k>=0&&JSON.stringify(p.v[n])!==JSON.stringify(prima[n])?'nuovo':''}"><td><code>${escH(n)}</code></td><td>${n in p.v?cella(p.v[n]):''}</td></tr>`).join(''):'<tr><td colspan="2" class="vuoto">ancora nessuna</td></tr>';
  const vivi=raggiungibili(p.v,p.h);
  $$('.trc-ogg').innerHTML=Object.keys(p.h).map(id=>{const o=p.h[id],o0=pp.h[id];return `<div class="ogg${vivi.has(+id)?'':' orfano'}${!o0?' nuovo':''}" data-o="${id}"><b>${escH(o.c)}</b>${vivi.has(+id)?'':'<small>nessun riferimento: lo eliminerà il garbage collector</small>'}<table>${Object.keys(o.f).map(f=>`<tr class="${o0&&JSON.stringify(o.f[f])!==JSON.stringify(o0.f[f])?'nuovo':''}"><td><code>${escH(f)}</code></td><td>${cella(o.f[f])}</td></tr>`).join('')}</table></div>`}).join('')||'<p class="vuoto">ancora nessun oggetto</p>';
  requestAnimationFrame(frecce);
  $$('.trc-out pre').textContent=P.slice(0,k+1).map(q=>q.out).join('');
  $$('.trc-nota').innerHTML=k<0?'Premete «Avanti» per eseguire la prima riga.':k===P.length-1?(p.nota?p.nota+' ':'')+'<b>Fine del programma.</b>':p.nota||'';
  $$('.trc-pos').textContent=`Passo ${k+1} di ${P.length}`;$$('[data-a=i]').disabled=k<0;$$('[data-a=a]').disabled=k>=P.length-1||!!attesa;
  const s=c.querySelector('.cod li.on');if(s&&s.scrollIntoView&&c.contains(document.activeElement))s.scrollIntoView({block:'nearest'});up()}
 function avanti(){if(attesa||k>=P.length-1)return;const q=modo==='p'&&chiesti.find(x=>x.i===k+1&&!x.fatto);if(q)return domanda(q);k++;mostra();if(k>=P.length-1)fermaAuto()}
 function domanda(q){fermaAuto();attesa=q;const p=P[q.i],riga=ex.code[p.l].trim();
  const exp=q.tipo==='out'?p.out.replace(/\n$/,''):valoreTraccia('val' in q?q.val:p.v[q.nome],ex.lang);q.exp=exp;
  $$('.trc-ask').innerHTML=`<div class="trc-dom"><p>Si esegue <code>${escH(riga)}</code>. ${q.tipo==='out'?'Che cosa viene scritto?':`Quanto varrà <code>${escH(q.nome)}</code>?`}</p><div class="row"><input type="text" autocomplete="off" spellcheck="false"><button class="btn" data-a="c">Controlla</button><span class="msg"></span></div></div>`;
  c.querySelectorAll('.cod li').forEach((li,i)=>li.classList.toggle('dopo',i===p.l));
  const inp=$$('.trc-ask input');inp.focus();inp.onkeydown=e=>{if(e.key==='Enter')controlla()};$$('[data-a=c]').onclick=controlla;mostra()}
 function controlla(){const q=attesa;if(!q)return;const inp=$$('.trc-ask input'),ok=normTraccia(inp.value)===normTraccia(q.exp);
  st.tot++;if(ok)st.ok++;q.fatto=true;attesa=null;
  $$('.trc-ask').innerHTML=`<p class="msg" style="color:var(--${ok?'ok':'ko'})">${ok?'Esatto!':'No: '+(q.tipo==='out'?'viene scritto':'vale')+' <code>'+escH(q.exp)+'</code>.'}</p>`;
  c.querySelectorAll('.cod li.dopo').forEach(li=>li.classList.remove('dopo'));k++;mostra();c.focus()}
 /* frecce dai riferimenti (nelle variabili o nei campi) agli oggetti */
 const idFreccia='pt-'+label.replace(/\W/g,'');
 function frecce(){const box=$$('.trc-memoria'),svg=$$('.trc-frecce'),g=svg.querySelector('g');g.innerHTML='';if(!$$('.trc-box').classList.contains('mem'))return;
  const B=box.getBoundingClientRect();svg.setAttribute('width',B.width);svg.setAttribute('height',B.height);
  box.querySelectorAll('.rif').forEach(r=>{const o=box.querySelector(`.ogg[data-o="${r.dataset.r}"]`);if(!o)return;const a=r.getBoundingClientRect(),b=o.getBoundingClientRect();
   const x1=a.left+a.width/2-B.left,y1=a.top+a.height/2-B.top;let x2,y2,c1,c2;
   if(b.left>=a.right-2){x2=b.left-B.left;y2=Math.min(Math.max(y1,b.top-B.top+12),b.bottom-B.top-12);c1=[x1+40,y1];c2=[x2-40,y2]}
   else if(b.top>=a.bottom){x2=b.left-B.left+24;y2=b.top-B.top;c1=[x1,y1+30];c2=[x2,y2-30]}
   else if(b.bottom<=a.top){x2=b.left-B.left+24;y2=b.bottom-B.top;c1=[x1,y1-30];c2=[x2,y2+30]}
   else{x2=b.right-B.left;y2=b.top-B.top+14;c1=[x1+40,y1];c2=[x2+40,y2]}
   const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',`M${x1} ${y1}C${c1} ${c2} ${x2} ${y2}`);path.setAttribute('marker-end',`url(#${idFreccia})`);
   if(o.classList.contains('orfano'))path.setAttribute('class','orfano');g.appendChild(path)})}
 window.addEventListener('resize',()=>requestAnimationFrame(frecce));
 function fermaAuto(){clearInterval(timer);timer=null;const b=$$('[data-a=x]');if(b)b.textContent='Automatico'}
 c.querySelectorAll('.trc-modo button').forEach(b=>b.onclick=()=>{modo=b.dataset.m;c.querySelectorAll('.trc-modo button').forEach(x=>x.classList.toggle('on',x===b));
  k=-1;attesa=null;chiesti.forEach(q=>delete q.fatto);$$('.trc-ask').innerHTML='';fermaAuto();mostra()});
 $$('[data-a=a]').onclick=avanti;$$('[data-a=i]').onclick=()=>{if(attesa||k<0)return;k--;mostra()};
 $$('[data-a=r]').onclick=()=>{attesa=null;$$('.trc-ask').innerHTML='';chiesti.forEach(q=>delete q.fatto);k=-1;fermaAuto();mostra()};
 $$('[data-a=n]').onclick=nuovo;if(menu)$$('.mt').onchange=nuovo;
 $$('[data-a=x]').onclick=()=>{if(timer)return fermaAuto();$$('[data-a=x]').textContent='Ferma';timer=setInterval(()=>{if(attesa||k>=P.length-1)return fermaAuto();avanti()},1100)};
 c.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(e.key==='ArrowRight'){e.preventDefault();avanti()}else if(e.key==='ArrowLeft'){e.preventDefault();$$('[data-a=i]').click()}});
 giro=0;nuovo()}

/* ---------- laboratorio dal vivo (HTML, CSS, JavaScript) ----------
   laboratorio(el, sfide, etichetta)
   sfide = [{t: consegna, nome: titolo breve, html, css, js: codice di partenza,
             edit: ['css'] quali parti si modificano (le altre si vedono ma non si cambiano; default tutte quelle presenti),
             controlli: [[descrizione, funzione], ...], sol: {html, css, js} soluzione da mostrare}]
   L'anteprima gira in un iframe; i controlli girano in una seconda copia nascosta della pagina, dopo ogni modifica,
   così possono premere pulsanti e scrivere nei campi senza toccare l'anteprima.
   Ogni funzione riceve (doc, win, log) e restituisce true se il controllo è superato.
   Le funzioni vengono copiate nell'iframe come testo: devono usare solo i loro argomenti.
   log = elenco dei testi scritti con console.log. Aiuti per i controlli: stile(doc, 'selettore', 'proprietà').
   Punti: una sfida vale 1 se la si completa senza aprire la soluzione. */
function laboratorio(el,sfide,label='Laboratorio'){const st=stat(label),id='lab'+Math.random().toString(36).slice(2);let n=0,cod,fatti={},timer,ultimo='';
 const PARTI=[['html','HTML'],['css','CSS'],['js','JavaScript']];
 el.innerHTML=`<div class="card lab">${turn()}<div class="row">${sfide.length>1?`<select class="mt">${sfide.map((s,i)=>`<option value="${i}">${i+1}. ${escH(s.nome||'Sfida '+(i+1))}</option>`).join('')}</select>`:''}<span class="lab-stato"></span></div>
  <p class="q"></p><div class="lab-box"><div class="lab-ed"><div class="lab-tab"></div><div class="lab-aree"></div></div>
  <div class="lab-vista"><div class="lab-tit">Anteprima</div><iframe title="Anteprima" sandbox="allow-scripts allow-modals"></iframe><iframe class="lab-prova" title="Controlli" sandbox="allow-scripts" aria-hidden="true" tabindex="-1"></iframe><div class="lab-con"><div class="lab-tit">Console</div><pre></pre></div></div></div>
  <ul class="lab-chk"></ul><div class="row"><button class="btn sec" data-l="r">Ricomincia la sfida</button><button class="btn sec" data-l="s">Mostra la soluzione</button><button class="btn" data-l="n">Sfida successiva ▶</button></div><div class="stat"></div></div>`;
 const c=el.querySelector('.lab'),q=s=>c.querySelector(s),fr=q('iframe'),prova=q('.lab-prova');
 const up=()=>{q('.stat').textContent=`Sfide completate: ${Object.values(fatti).filter(x=>x==='ok').length} su ${sfide.length}`};
 function carica(i){n=i;const s=sfide[n];if(q('.mt'))q('.mt').value=n;cod={html:s.html||'',css:s.css||'',js:s.js||''};
  const edit=s.edit||PARTI.map(p=>p[0]).filter(k=>s[k]!==undefined);
  const parti=PARTI.filter(p=>s[p[0]]!==undefined||edit.includes(p[0]));
  q('.q').innerHTML=s.t;
  q('.lab-tab').innerHTML=parti.map((p,j)=>`<button class="${j===parti.findIndex(x=>edit.includes(x[0]))?'on':''}" data-p="${p[0]}">${p[1]}${edit.includes(p[0])?'':' 🔒'}</button>`).join('');
  q('.lab-aree').innerHTML=parti.map(p=>`<textarea data-p="${p[0]}" spellcheck="false" autocomplete="off" autocapitalize="off" ${edit.includes(p[0])?'':'readonly'} aria-label="${p[1]}"></textarea>`).join('');
  c.querySelectorAll('.lab-aree textarea').forEach(t=>{t.value=cod[t.dataset.p];t.oninput=()=>{cod[t.dataset.p]=t.value;programma()};
   t.onkeydown=e=>{if(e.key==='Tab'&&!e.shiftKey&&!t.readOnly){e.preventDefault();const a=t.selectionStart;t.setRangeText('  ',a,t.selectionEnd,'end');t.oninput()}}});
  mostraParte((q('.lab-tab .on')||q('.lab-tab button')).dataset.p);
  q('[data-l=n]').style.display=n<sfide.length-1?'':'none';esegui()}
 function mostraParte(p){c.querySelectorAll('.lab-tab button').forEach(b=>b.classList.toggle('on',b.dataset.p===p));c.querySelectorAll('.lab-aree textarea').forEach(t=>t.style.display=t.dataset.p===p?'':'none')}
 function programma(){clearTimeout(timer);timer=setTimeout(esegui,350)}
 function esegui(){const s=sfide[n];q('.lab-con pre').textContent='';
  const ctl=(s.controlli||[]).map(x=>'('+x[1].toString()+')').join(',');
  const pagina=chk=>`<!doctype html><html><head><meta charset="utf-8">${spia(chk)}<style>body{font-family:system-ui,sans-serif;margin:12px}${cod.css}</style></head><body>${cod.html}${js}</body></html>`;
  const spia=chk=>`<script>(function(){var P=function(t,x){if(${chk?'t==="chk"':'t!=="chk"'})parent.postMessage({lab:${JSON.stringify(id)},t:t,x:x},'*')},log=[];
   var testo=function(a){return Array.prototype.map.call(a,function(v){try{return typeof v==='object'?JSON.stringify(v):String(v)}catch(e){return String(v)}}).join(' ')};
   ['log','info','warn','error'].forEach(function(k){var o=console[k];console[k]=function(){var t=testo(arguments);log.push(t);P('log',(k==='error'?'✖ ':k==='warn'?'⚠ ':'')+t);o&&o.apply(console,arguments)}});
   window.onerror=function(m,u,r){P('log','✖ Errore'+(r?' alla riga '+r:'')+': '+m)};
   window.stile=function(doc,sel,pr){var e=doc.querySelector(sel);return e?getComputedStyle(e).getPropertyValue(pr).trim():''};
   window.__controlla=function(){var C=[${ctl}],r=C.map(function(f){try{return !!f(document,window,log)}catch(e){return false}});P('chk',r)};
   ${chk?"window.addEventListener('load',function(){setTimeout(__controlla,30)});":''}})()<\/script>`;
  const js=cod.js?`<script>${cod.js.replace(/<\/script/gi,'<\\/script')}\n<\/script>`:'';
  prova.style.width=(fr.clientWidth||400)+'px';fr.srcdoc=pagina(false);prova.srcdoc=pagina(true)}
 window.addEventListener('message',e=>{const d=e.data;if(!d||d.lab!==id)return;
  if(d.t==='log'){const p=q('.lab-con pre');p.textContent+=(p.textContent?'\n':'')+d.x}
  if(d.t==='chk'){const s=sfide[n];q('.lab-chk').innerHTML=(s.controlli||[]).map((x,i)=>`<li class="${d.x[i]?'ok':''}">${d.x[i]?'✔':'○'} ${x[0]}</li>`).join('');
   const tutti=d.x.length&&d.x.every(Boolean);
   if(tutti&&!fatti[n]){fatti[n]='ok';st.tot++;st.ok++;up()}
   q('.lab-stato').innerHTML=tutti?'<b style="color:var(--ok)">Sfida completata!</b>':fatti[n]==='sol'?'<span style="color:var(--mute)">Soluzione mostrata</span>':''}});
 q('[data-l=r]').onclick=()=>carica(n);
 q('[data-l=s]').onclick=()=>{const s=sfide[n];if(!s.sol)return;if(!fatti[n]){fatti[n]='sol';st.tot++;up()}
  c.querySelectorAll('.lab-aree textarea').forEach(t=>{if(s.sol[t.dataset.p]!==undefined){t.value=s.sol[t.dataset.p];cod[t.dataset.p]=t.value}});esegui()};
 q('[data-l=n]').onclick=()=>carica(Math.min(n+1,sfide.length-1));
 c.querySelector('.lab-tab').onclick=e=>{const b=e.target.closest('button');if(b)mostraParte(b.dataset.p)};
 if(q('.mt'))q('.mt').onchange=()=>carica(+q('.mt').value);
 up();carica(0)}

/* ---------- completa il codice ----------
   completa(el, gen, etichetta)
   gen() restituisce {t: consegna, lang, code: [righe con ⟦0⟧, ⟦1⟧... al posto dei buchi], buchi: [...], why: spiegazione}
   ogni buco: {exp: risposta, opts: [scelte] (menu a tendina) oppure niente (si scrive), alt: [altre risposte accettate],
               dis: [risposte sbagliate plausibili, servono a trasformare un buco da scrivere in una scelta nelle missioni e nelle schede]}
   Nelle risposte scritte non contano gli spazi e le virgolette singole valgono come doppie.
   comeCompleta(ex) trasforma un esercizio in uno normale (per mission e schede). */
const normCod=s=>String(s).replace(/\s+/g,'').replace(/'/g,'"');
const BUCO=/⟦(\d+)⟧/g;
function rigaBuchi(riga,lang,campo){return riga.split(/(⟦\d+⟧)/).map(p=>{const m=p.match(/^⟦(\d+)⟧$/);return m?campo(+m[1]):evidenzia(p,lang)}).join('')}
function riempi(riga,ex){return riga.replace(BUCO,(_,i)=>ex.buchi[+i].exp)}
function comeCompleta(ex){const L=ex.code.map(r=>r.replace(BUCO,(_,i)=>'[ '+(+i+1)+' ]'));
 return {q:ex.t+P(L.map(escH).join('\n')),sl:'Spiegazione',
  fields:ex.buchi.map((b,i)=>({label:'Spazio '+(i+1),kind:'choice',opts:['',...shuffle([...new Set(b.opts||[b.exp,...(b.dis||[])])]).map(escH)],exp:b.exp})),
  sol:(ex.why?'<p>'+ex.why+'</p>':'')+P(ex.code.map(r=>escH(riempi(r,ex))).join('\n'))}}
function completa(el,gen,label='Completa il codice'){const st=stat(label);perScheda(el,{tipo:'es',titolo:label,gen:()=>comeCompleta(gen())});let ex,first;
 function draw(){ex=gen();first=true;
  const campo=i=>{const b=ex.buchi[i];return b.opts?`<select class="cmp-f" data-i="${i}" aria-label="Spazio ${i+1}"><option></option>${b.opts.map(o=>`<option>${escH(o)}</option>`).join('')}</select>`
   :`<input class="cmp-f" data-i="${i}" aria-label="Spazio ${i+1}" size="${Math.max(3,String(b.exp).length+1)}" autocomplete="off" autocapitalize="off" spellcheck="false">`};
  el.innerHTML=`<div class="card">${turn()}<p class="q">${ex.t}</p><ol class="cod cmp">${ex.code.map(r=>`<li><code>${rigaBuchi(r,ex.lang||'js',campo)||' '}</code></li>`).join('')}</ol>
   <div class="row"><button class="btn" data-a="c">Controlla</button><button class="btn sec" data-a="s">Mostra la soluzione</button><button class="btn sec" data-a="n">Altro esercizio</button><span class="msg"></span></div><div class="sol" style="display:none"></div><div class="stat"></div></div>`;
  el.querySelector('[data-a=c]').onclick=controlla;el.querySelector('[data-a=n]').onclick=draw;
  el.querySelector('[data-a=s]').onclick=()=>{const s=el.querySelector('.sol');s.innerHTML='<b>Soluzione</b>'+(ex.why?'<p>'+ex.why+'</p>':'')+codiceHTML(ex.code.map(r=>riempi(r,ex)),ex.lang||'js');s.style.display='block';first=false};
  el.querySelectorAll('input.cmp-f').forEach(i=>i.onkeydown=e=>{if(e.key==='Enter')controlla()});up()}
 function controlla(){let tutti=true;el.querySelectorAll('.cmp-f').forEach(f=>{const b=ex.buchi[+f.dataset.i],v=f.value;
   const ok=b.opts?v===String(b.exp):[b.exp,...(b.alt||[])].some(x=>normCod(x)===normCod(v));f.classList.toggle('ok',ok);f.classList.toggle('ko',!ok);if(!ok)tutti=false});
  if(first){st.tot++;if(tutti)st.ok++;first=false}
  const m=el.querySelector('.msg');m.textContent=tutti?'Esatto! Il programma funziona.':'Gli spazi in rosso non vanno: correggeteli e ricontrollate.';m.style.color=tutti?'var(--ok)':'var(--ko)';up()}
 const up=()=>el.querySelector('.stat').textContent=`Giusti al primo controllo: ${st.ok} su ${st.tot}`;
 draw()}

/* ---------- riordina le righe (Parsons) ----------
   riordina(el, gen, etichetta)
   gen() restituisce {t, lang, code: [righe nell'ordine giusto], extra: [righe in più da scartare], why,
     out: testo che il programma deve scrivere con console.log (se c'è, vale qualunque ordine che lo scrive: il codice viene eseguito),
     liberi: [[da, a], ...] posizioni di code che possono stare in qualsiasi ordine tra loro (per esempio due dichiarazioni)}
   comeRiordina(ex) lo trasforma in un esercizio normale: si scrivono le lettere nell'ordine giusto. */
function eseguiRighe(righe){const out=[];const con={log:(...a)=>out.push(a.map(v=>typeof v==='object'&&v!==null?JSON.stringify(v):String(v)).join(' '))};
 try{new Function('console',righe.join('\n'))(con);return out.join('\n')}catch(e){return '✖ '+e.message}}
function giusteRiordina(ex,K){const E=ex.extra||[];if(K.some(r=>E.includes(r)&&!ex.code.includes(r)))return false;
 if(ex.out!==undefined)return K.length>0&&eseguiRighe(K)===ex.out;
 if(K.length!==ex.code.length)return false;const lib=ex.liberi||[];
 for(let i=0;i<K.length;i++){const g=lib.find(x=>i>=x[0]&&i<=x[1]);
  if(g){const a=ex.code.slice(g[0],g[1]+1).sort().join('\n'),b=K.slice(g[0],g[1]+1).sort().join('\n');if(a!==b)return false;i=g[1]}else if(K[i]!==ex.code[i])return false}
 return true}
function comeRiordina(ex){const R=shuffle([...ex.code,...(ex.extra||[])]),Lt=i=>String.fromCharCode(65+i),idx=r=>Lt(R.indexOf(r));
 return {q:ex.t+(ex.extra&&ex.extra.length?' Una riga non serve: lasciatela fuori.':'')+P(R.map((r,i)=>Lt(i)+'   '+escH(r)).join('\n')),sl:'Spiegazione',
  fields:[{label:'Lettere in ordine',exp:ex.code.map(idx).join(''),kind:'str'}],sol:'<p>Ordine: <b>'+ex.code.map(idx).join(' ')+'</b>.'+(ex.why?' '+ex.why:'')+'</p>'+P(ex.code.map(escH).join('\n'))}}
function riordina(el,gen,label='Riordina le righe'){const st=stat(label);let ex,R,first=true,dopo;
 const prova=gen();perScheda(el,{tipo:'ordina',titolo:label,items:prova.code.map(r=>[escH(r),''])});
 /* R = righe come appaiono: {r: testo, via: scartata} */
 function nuovo(){ex=gen();first=true;mescola()}
 function mescola(){const tutte=[...ex.code,...(ex.extra||[])];let o;do{o=shuffle(tutte.map((r,i)=>i))}while(tutte.length>1&&o.every((v,i)=>v===i));
  R=o.map(i=>({r:tutte[i],via:false}));dopo=null;draw()}
 function draw(){const E=ex.extra||[];
  el.innerHTML=`<div class="card">${turn()}<p class="q">${ex.t}${E.length?` <b>${E.length===1?'Una riga è in più':E.length+' righe sono in più'}:</b> scartatela con ✕.`:''}</p><ol class="cod par"></ol>
   <div class="row"><button class="btn" data-a="c">Verifica</button><button class="btn sec" data-a="r">Rimescola</button><button class="btn sec" data-a="s">Mostra la soluzione</button><button class="btn sec" data-a="n">Altro programma</button><span class="msg"></span></div><div class="sol" style="display:none"></div><div class="stat"></div></div>`;
  const ol=el.querySelector('.par');
  R.forEach((x,pos)=>{const li=document.createElement('li');li.draggable=true;if(x.via)li.classList.add('via');
   li.innerHTML=`<code>${evidenzia(x.r,ex.lang||'js')||' '}</code><span class="mv">${E.length?`<button title="${x.via?'Rimetti':'Scarta'}" aria-label="${x.via?'Rimetti':'Scarta'}">${x.via?'↺':'✕'}</button>`:''}<button title="Su" aria-label="Su">▲</button><button title="Giù" aria-label="Giù">▼</button></span>`;
   const bs=[...li.querySelectorAll('button')],d=bs.pop(),u=bs.pop(),v=bs.pop();
   if(v)v.onclick=()=>{x.via=!x.via;draw()};u.onclick=()=>mv(pos,-1);d.onclick=()=>mv(pos,1);
   li.ondragstart=ev=>{DBG.drag=pos;li.classList.add('drag');ev.dataTransfer.setData('text/plain',pos)};li.ondragend=()=>li.classList.remove('drag');
   li.ondragover=ev=>{ev.preventDefault();li.classList.add('over')};li.ondragleave=()=>li.classList.remove('over');
   li.ondrop=ev=>{ev.preventDefault();const f=DBG.drag;if(f===undefined||f===pos)return;R.splice(pos,0,R.splice(f,1)[0]);dopo=null;draw()};ol.appendChild(li)});
  el.querySelector('[data-a=c]').onclick=verifica;el.querySelector('[data-a=r]').onclick=mescola;el.querySelector('[data-a=n]').onclick=nuovo;
  el.querySelector('[data-a=s]').onclick=()=>{const s=el.querySelector('.sol');s.innerHTML='<b>Soluzione</b>'+(ex.why?'<p>'+ex.why+'</p>':'')+codiceHTML(ex.code,ex.lang||'js')+(ex.out!==undefined?`<p>Scrive: <code>${escH(ex.out).replace(/\n/g,' ⏎ ')}</code></p>`:'');s.style.display='block';first=false};
  if(dopo){const m=el.querySelector('.msg');m.textContent=dopo[0];m.style.color=dopo[1]}up()}
 function mv(p,d){const q=p+d;if(q<0||q>=R.length)return;[R[p],R[q]]=[R[q],R[p]];dopo=null;draw()}
 function verifica(){const K=R.filter(x=>!x.via).map(x=>x.r),ok=giusteRiordina(ex,K);if(first){st.tot++;if(ok)st.ok++;first=false}
  if(ok)dopo=['Esatto! Il programma è in ordine.'+(ex.out!==undefined?' Scrive: '+ex.out.replace(/\n/g,' ⏎ '):''),'var(--ok)'];
  else{const o=ex.out!==undefined?eseguiRighe(K):null;dopo=['Non ancora.'+(o!==null?' Così il programma scrive: '+(o||'(niente)').replace(/\n/g,' ⏎ ')+'.':'')+' Spostate le righe e riprovate.','var(--ko)']}
  draw()}
 const up=()=>el.querySelector('.stat').textContent=`Giusti al primo tentativo: ${st.ok} su ${st.tot}`;
 nuovo()}
