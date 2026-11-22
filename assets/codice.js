/* codice: strumenti sul codice per le attività tg-act. Va caricato dopo assets/giochi.js:
     <script src="../../../assets/giochi.js"></script><script src="../../../assets/codice.js"></script><script> ... </script>
   Per ora contiene l'esecuzione passo passo (traccia). Gli stili sono in giochi.css (sezione "codice"). */

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
   il valore nuovo di una variabile o che cosa viene scritto; i punti vanno nel risultato). */
function valoreTraccia(x,lang){if(typeof x==='string')return '"'+x+'"';if(typeof x==='boolean')return lang==='flow'?(x?'Vero':'Falso'):String(x);
 if(Array.isArray(x))return (lang==='php'?'[':'{')+x.map(y=>valoreTraccia(y,lang)).join(', ')+(lang==='php'?']':'}');if(x===null||x===undefined)return lang==='php'?'null':lang==='js'?String(x):'?';
 return typeof x==='number'?String(+x.toFixed(6)).replace('.',lang==='flow'?',':'.'):String(x)}
function normTraccia(s){return String(s).trim().toLowerCase().replace(/^["']|["']$/g,'').replace(/\s+/g,' ').replace(/,(?=\d)/g,'.').replace(/^vero$/,'true').replace(/^falso$/,'false')}
function passiTraccia(ex){if(ex.steps)return ex.steps.map(p=>({l:p.l,v:{...p.v},out:p.out||'',nota:p.nota||''}));const st=[];
 ex.run((l,v,out,nota)=>{st.push({l,v:JSON.parse(JSON.stringify(v||{})),out:out===undefined||out===null?'':String(out),nota:nota||''})});return st}
function traccia(el,gen,label='Passo passo'){const st=stat(label);let ex,P,k,modo='g',giro,chiesti,attesa,timer;
 /* gen può essere anche un elenco [["Nome", gen], ...]: compare un menu per scegliere il programma */
 const menu=Array.isArray(gen)?gen:null;
 el.innerHTML=`<div class="card trc" tabindex="0">${turn()}${menu?`<div class="row"><select class="mt">${menu.map((a,i)=>`<option value="${i}">${escH(a[0])}</option>`).join('')}</select></div>`:''}<p class="q"></p><div class="row trc-modo"><button class="btn sec on" data-m="g">Guarda</button><button class="btn sec" data-m="p">Prevedi</button><span class="trc-pos"></span></div>
  <div class="trc-box"><div class="trc-cod"></div><div class="trc-lato"><table class="trc-var"><thead><tr><th>Variabile</th><th>Valore</th></tr></thead><tbody></tbody></table><div class="trc-out"><small>Output</small><pre></pre></div></div></div>
  <p class="trc-nota"></p><div class="trc-ask"></div>
  <div class="row"><button class="btn sec" data-a="r" title="Ricomincia">⏮</button><button class="btn sec" data-a="i" title="Indietro (freccia a sinistra)">◀ Indietro</button><button class="btn" data-a="a" title="Avanti (freccia a destra)">Avanti ▶</button><button class="btn sec" data-a="x">Automatico</button><button class="btn sec" data-a="n">Altro programma</button></div><div class="stat"></div></div>`;
 const c=el.querySelector('.trc'),$$=s=>c.querySelector(s),up=()=>$$('.stat').textContent=modo==='p'?`Previsioni esatte: ${st.ok} su ${st.tot}`:'';
 function nuovo(){ex=menu?menu[+$$('.mt').value][1]():gen();P=passiTraccia(ex);k=-1;giro++;fermaAuto();attesa=null;$$('.q').innerHTML=ex.t;$$('.trc-cod').innerHTML=codiceHTML(ex.code,ex.lang);
  /* in Prevedi si chiede su alcuni passi (al massimo 4) in cui cambia una variabile o si scrive qualcosa */
  const cand=[];P.forEach((p,i)=>{const prima=i?P[i-1].v:{};const cambia=Object.keys(p.v).filter(n=>JSON.stringify(p.v[n])!==JSON.stringify(prima[n])&&n in prima);
   if(p.out.trim())cand.push({i,tipo:'out'});else if(cambia.length)cand.push({i,tipo:'var',nome:pick(cambia)})});
  chiesti=shuffle(cand).slice(0,4).sort((a,b)=>a.i-b.i);mostra()}
 function mostra(){const p=P[k]||{l:-1,v:{},out:'',nota:''},prima=k>0?P[k-1].v:{};
  c.querySelectorAll('.cod li').forEach((li,i)=>li.classList.toggle('on',i===p.l));
  const nomi=[...new Set(P.slice(0,k+1).flatMap(q=>Object.keys(q.v)))];
  $$('.trc-var tbody').innerHTML=nomi.length?nomi.map(n=>`<tr class="${k>=0&&JSON.stringify(p.v[n])!==JSON.stringify(prima[n])?'nuovo':''}"><td><code>${escH(n)}</code></td><td><code>${n in p.v?escH(valoreTraccia(p.v[n],ex.lang)):''}</code></td></tr>`).join(''):'<tr><td colspan="2" class="vuoto">ancora nessuna</td></tr>';
  $$('.trc-out pre').textContent=P.slice(0,k+1).map(q=>q.out).join('');
  $$('.trc-nota').innerHTML=k<0?'Premete «Avanti» per eseguire la prima riga.':k===P.length-1?(p.nota?p.nota+' ':'')+'<b>Fine del programma.</b>':p.nota||'';
  $$('.trc-pos').textContent=`Passo ${k+1} di ${P.length}`;$$('[data-a=i]').disabled=k<0;$$('[data-a=a]').disabled=k>=P.length-1||!!attesa;
  const s=c.querySelector('.cod li.on');if(s&&s.scrollIntoView&&c.contains(document.activeElement))s.scrollIntoView({block:'nearest'});up()}
 function avanti(){if(attesa||k>=P.length-1)return;const q=modo==='p'&&chiesti.find(x=>x.i===k+1&&!x.fatto);if(q)return domanda(q);k++;mostra();if(k>=P.length-1)fermaAuto()}
 function domanda(q){fermaAuto();attesa=q;const p=P[q.i],riga=ex.code[p.l].trim();
  const exp=q.tipo==='out'?p.out.replace(/\n$/,''):valoreTraccia(p.v[q.nome],ex.lang);q.exp=exp;
  $$('.trc-ask').innerHTML=`<div class="trc-dom"><p>Si esegue <code>${escH(riga)}</code>. ${q.tipo==='out'?'Che cosa viene scritto?':`Quanto varrà <code>${escH(q.nome)}</code>?`}</p><div class="row"><input type="text" autocomplete="off" spellcheck="false"><button class="btn" data-a="c">Controlla</button><span class="msg"></span></div></div>`;
  c.querySelectorAll('.cod li').forEach((li,i)=>li.classList.toggle('dopo',i===p.l));
  const inp=$$('.trc-ask input');inp.focus();inp.onkeydown=e=>{if(e.key==='Enter')controlla()};$$('[data-a=c]').onclick=controlla;mostra()}
 function controlla(){const q=attesa;if(!q)return;const inp=$$('.trc-ask input'),ok=normTraccia(inp.value)===normTraccia(q.exp);
  st.tot++;if(ok)st.ok++;q.fatto=true;attesa=null;
  $$('.trc-ask').innerHTML=`<p class="msg" style="color:var(--${ok?'ok':'ko'})">${ok?'Esatto!':'No: '+(q.tipo==='out'?'viene scritto':'vale')+' <code>'+escH(q.exp)+'</code>.'}</p>`;
  c.querySelectorAll('.cod li.dopo').forEach(li=>li.classList.remove('dopo'));k++;mostra();c.focus()}
 function fermaAuto(){clearInterval(timer);timer=null;const b=$$('[data-a=x]');if(b)b.textContent='Automatico'}
 c.querySelectorAll('.trc-modo button').forEach(b=>b.onclick=()=>{modo=b.dataset.m;c.querySelectorAll('.trc-modo button').forEach(x=>x.classList.toggle('on',x===b));
  k=-1;attesa=null;chiesti.forEach(q=>delete q.fatto);$$('.trc-ask').innerHTML='';fermaAuto();mostra()});
 $$('[data-a=a]').onclick=avanti;$$('[data-a=i]').onclick=()=>{if(attesa||k<0)return;k--;mostra()};
 $$('[data-a=r]').onclick=()=>{attesa=null;$$('.trc-ask').innerHTML='';chiesti.forEach(q=>delete q.fatto);k=-1;fermaAuto();mostra()};
 $$('[data-a=n]').onclick=nuovo;if(menu)$$('.mt').onchange=nuovo;
 $$('[data-a=x]').onclick=()=>{if(timer)return fermaAuto();$$('[data-a=x]').textContent='Ferma';timer=setInterval(()=>{if(attesa||k>=P.length-1)return fermaAuto();avanti()},1100)};
 c.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(e.key==='ArrowRight'){e.preventDefault();avanti()}else if(e.key==='ArrowLeft'){e.preventDefault();$$('[data-a=i]').click()}});
 giro=0;nuovo()}
