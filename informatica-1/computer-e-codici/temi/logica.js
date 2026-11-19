/* Logica: espressioni, tavole di verità, riconoscere ed eguagliare espressioni.
   Codice di argomento condiviso tra la pagina dell'attività e Palestra dei numeri.
   Usa il motore comune (assets/giochi.js), che va caricato prima. Solo definizioni:
   le pagine decidono quali giochi montare e in che ordine. */
const E2=[["A AND B",(a,b)=>a&b],["A OR B",(a,b)=>a|b],["A AND (NOT B)",(a,b)=>a&(1-b)],["(NOT A) AND B",(a,b)=>(1-a)&b],["NOT (A OR B)",(a,b)=>1-(a|b)],["NOT (A AND B)",(a,b)=>1-(a&b)],["(NOT A) OR B",(a,b)=>(1-a)|b],["A OR (NOT B)",(a,b)=>a|(1-b)],["(NOT A) AND (NOT B)",(a,b)=>(1-a)&(1-b)],["(NOT A) OR (NOT B)",(a,b)=>(1-a)|(1-b)],
["(A OR B) AND (NOT (A AND B))",(a,b)=>(a|b)&(1-(a&b))],["(A AND (NOT B)) OR ((NOT A) AND B)",(a,b)=>(a&(1-b))|((1-a)&b)],["A AND (A OR B)",(a,b)=>a&(a|b)],["A OR (A AND B)",(a,b)=>a|(a&b)],["NOT (NOT A)",(a)=>a]];
const E3=[["(A AND B) OR C",(a,b,c)=>(a&b)|c],["A AND (B OR C)",(a,b,c)=>a&(b|c)],["(NOT A) AND (B OR C)",(a,b,c)=>(1-a)&(b|c)],["(A OR B) AND (NOT C)",(a,b,c)=>(a|b)&(1-c)],["A OR (B AND C)",(a,b,c)=>a|(b&c)],["(A AND B) AND C",(a,b,c)=>a&b&c],["NOT (A OR B OR C)",(a,b,c)=>1-(a|b|c)],["(A OR B) AND (B OR C)",(a,b,c)=>(a|b)&(b|c)],["(A AND (NOT B)) OR C",(a,b,c)=>(a&(1-b))|c],["NOT (A AND B) OR C",(a,b,c)=>(1-(a&b))|c],["A AND B AND (NOT C)",(a,b,c)=>a&b&(1-c)],["(A XOR B) AND C: (A OR B) AND (NOT (A AND B)) AND C",(a,b,c)=>((a|b)&(1-(a&b)))&c]];
const NV=e=>e[1].length<2?2:e[1].length;
const rowsOf=n=>[...Array(1<<n).keys()].map(r=>[...Array(n)].map((_,i)=>(r>>(n-1-i))&1));
const outs=(e,n)=>rowsOf(n).map(v=>e[1](...v)),outStr=(e,n)=>outs(e,n).join('');
const exprList=l=>lv(l,E2.slice(0,6),E2,E3);
/* tavole */
function tavole(el){const st=stat('Tavole di verità');let e,n,ans,first;
 el.innerHTML=`<div class="row"><select id="tl"><option value="1">Livello 1: espressioni semplici a 2 ingressi</option><option value="2">Livello 2: espressioni composte a 2 ingressi</option><option value="3">Livello 3: 3 ingressi</option></select></div><div id="tx"></div>`;
 function gen(){const l=+el.querySelector('#tl').value;e=pick(exprList(l));n=NV(e);ans=rowsOf(n).map(()=>'?');first=true;DBG.tv={e,n,ans};
  el.querySelector('#tx').innerHTML=`<div class="card">${turn()}<p class="q">Compilate la tavola di verità di <b>${e[0]}</b></p><div id="tt"></div><div class="row"><button class="btn" id="tv">Verifica</button><button class="btn sec" id="tn">Altra espressione</button><span class="msg" id="tm"></span></div><div class="stat" id="ts"></div></div>`;draw(false);
  el.querySelector('#tv').onclick=()=>{const ok=rowsOf(n).every((v,i)=>String(e[1](...v))===ans[i]);if(first){st.tot++;if(ok)st.ok++;first=false}draw(true);const m=el.querySelector('#tm');m.textContent=ok?'Perfetto!':'Alcune righe sono sbagliate: la correzione è tra parentesi.';m.style.color=ok?'var(--ok)':'var(--ko)';sts()};el.querySelector('#tn').onclick=gen;sts()}
 const sts=()=>el.querySelector('#ts').textContent=`Perfette: ${st.ok} su ${st.tot}`;
 function draw(show){const nm=['A','B','C'].slice(0,n);let h='<table class="tv"><tr>'+nm.map(x=>`<th>${x}</th>`).join('')+'<th>Uscita</th></tr>';
  rowsOf(n).forEach((v,i)=>{const x=e[1](...v);let c='out';if(show)c+=(String(x)===ans[i]?' ok':' ko');h+=`<tr>${v.map(y=>`<td>${y}</td>`).join('')}<td class="${c}" data-i="${i}">${ans[i]}${show&&String(x)!==ans[i]?' (→ '+x+')':''}</td></tr>`});
  el.querySelector('#tt').innerHTML=h+'</table>';if(!show)el.querySelectorAll('td.out').forEach(td=>td.onclick=()=>{const i=+td.dataset.i;ans[i]=ans[i]==='?'?'0':ans[i]==='0'?'1':'0';td.textContent=ans[i]})}
 gen();el.querySelector('#tl').onchange=gen}
/* riconosci */
function ricon(el){const st=stat("Riconosci l'espressione");let done;
 el.innerHTML=`<div class="row"><select id="rl"><option value="1">2 ingressi</option><option value="3">3 ingressi</option></select></div><div id="rx"></div>`;
 function gen(){const three=el.querySelector('#rl').value==='3';const pool=three?E3:E2.filter(x=>x[1].length===2);const n=three?3:2;
  const e=pick(pool);const sig=outStr(e,n);const others=shuffle(pool.filter(x=>outStr(x,n)!==sig));const seen=new Set([sig]);const opts=[e];for(const x of others){const s=outStr(x,n);if(!seen.has(s)){seen.add(s);opts.push(x)}if(opts.length===4)break}
  done=false;const rows=rowsOf(n),nm=['A','B','C'].slice(0,n);
  let t='<table class="tv"><tr>'+nm.map(x=>`<th>${x}</th>`).join('')+'<th>Uscita</th></tr>'+rows.map(v=>`<tr>${v.map(y=>`<td>${y}</td>`).join('')}<td><b>${e[1](...v)}</b></td></tr>`).join('')+'</table>';
  el.querySelector('#rx').innerHTML=`<div class="card">${turn()}<p class="q">Quale espressione produce questa tavola di verità?</p>${t}<div id="ro"></div><div class="row"><span class="msg"></span><button class="btn sec" id="rn">Altra tavola</button></div><div class="stat"></div></div>`;
  shuffle(opts).forEach(o=>{const b=document.createElement('button');b.className='line';b.textContent=o[0];b.onclick=()=>{if(done)return;done=true;st.tot++;const m=el.querySelector('.msg');
   if(o===e){st.ok++;b.classList.add('ok');m.textContent='Esatto!';m.style.color='var(--ok)'}else{b.classList.add('ko');[...el.querySelectorAll('#ro .line')].find(x=>x.textContent===e[0]).classList.add('ok');m.textContent='No: provate a calcolare la tavola di ogni espressione.';m.style.color='var(--ko)'}up()};el.querySelector('#ro').appendChild(b)});
  el.querySelector('#rn').onclick=gen;up()}
 const up=()=>el.querySelector('.stat').textContent=`Esatte: ${st.ok} su ${st.tot}`;gen();el.querySelector('#rl').onchange=gen}
/* equivalenti */
function equiv(el){const st=stat('Uguali o diverse?');let done;
 function pair(){const eq=Math.random()<0.5,two=E2.filter(x=>x[1].length===2);let a,b;if(eq){const g=shuffle(two);outer:for(const x of g)for(const y of g)if(x!==y&&outStr(x,2)===outStr(y,2)){a=x;b=y;break outer}}else{const g=shuffle(two);do{a=pick(g);b=pick(g)}while(outStr(a,2)===outStr(b,2))}
  if(eq){const cands=[];two.forEach(x=>two.forEach(y=>{if(x!==y&&outStr(x,2)===outStr(y,2))cands.push([x,y])}));[a,b]=pick(cands)}return [a,b]}
 function gen(){const [a,b]=pair();done=false;el.innerHTML=`<div class="card">${turn()}<p class="q">Le due espressioni hanno sempre la stessa uscita (cioè sono equivalenti)?</p><p class="val">① ${a[0]}<br>② ${b[0]}</p><div class="row"><button class="btn" data-v="1">Sì, sono equivalenti</button><button class="btn" data-v="0">No, sono diverse</button></div><div class="msg"></div><div id="eq"></div><div class="row"><button class="btn sec" id="en">Altra coppia</button></div><div class="stat"></div></div>`;
  el.querySelectorAll('[data-v]').forEach(btn=>btn.onclick=()=>{if(done)return;done=true;st.tot++;const same=outStr(a,2)===outStr(b,2),ok=(btn.dataset.v==='1')===same;if(ok)st.ok++;const m=el.querySelector('.msg');m.textContent=(ok?'Esatto! ':'No. ')+(same?'Le uscite sono uguali per tutte le righe.':'Le uscite differiscono in almeno una riga.');m.style.color=ok?'var(--ok)':'var(--ko)';
   el.querySelector('#eq').innerHTML='<table class="tv"><tr><th>A</th><th>B</th><th>①</th><th>②</th></tr>'+rowsOf(2).map(v=>`<tr><td>${v[0]}</td><td>${v[1]}</td><td>${a[1](...v)}</td><td>${b[1](...v)}</td></tr>`).join('')+'</table>';up()});
  el.querySelector('#en').onclick=gen;up()}
 const up=()=>el.querySelector('.stat').textContent=`Esatte: ${st.ok} su ${st.tot}`;gen()}
/* trova gli ingressi */
function ingr(el){const st=stat('Quando vale 1?');let first,e,n;
 el.innerHTML=`<div class="row"><select id="il"><option value="2">2 ingressi</option><option value="3">3 ingressi</option></select></div><div id="ix"></div>`;
 function gen(){n=+el.querySelector('#il').value;e=pick(n===3?E3:E2.filter(x=>x[1].length===2));first=true;const rows=rowsOf(n),nm=['A','B','C'].slice(0,n);
  el.querySelector('#ix').innerHTML=`<div class="card">${turn()}<p class="q">Per quali combinazioni di ingressi l'uscita di <b>${e[0]}</b> vale <b>1</b>? Selezionatele tutte.</p>${rows.map((v,i)=>`<label class="cb"><input type="checkbox" data-i="${i}"> ${nm.map((x,j)=>x+'='+v[j]).join(' ')}</label>`).join('')}<div class="row"><button class="btn" id="ik">Controlla</button><button class="btn sec" id="in">Altra espressione</button><span class="msg"></span></div><div class="stat"></div></div>`;
  el.querySelector('#ik').onclick=()=>{let ok=true;el.querySelectorAll('input[type=checkbox]').forEach(c=>{const i=+c.dataset.i,want=e[1](...rows[i])===1;const lab=c.parentElement;lab.style.color=(c.checked===want)?'var(--ok)':'var(--ko)';if(c.checked!==want)ok=false});
   if(first){st.tot++;if(ok)st.ok++;first=false}const m=el.querySelector('.msg');m.textContent=ok?'Esatto!':'Controllate le combinazioni in rosso.';m.style.color=ok?'var(--ok)':'var(--ko)';up()};el.querySelector('#in').onclick=gen;up()}
 const up=()=>el.querySelector('.stat').textContent=`Esatte: ${st.ok} su ${st.tot}`;gen();el.querySelector('#il').onchange=gen}
/* missione: domande di logica con campo di testo sull'uscita */
function gOut(l){const e=pick(exprList(l)),n=NV(e),rows=rowsOf(n),r=rnd(0,rows.length-1),v=rows[r],nm=['A','B','C'];
 return{q:`Quanto vale l'uscita di <b>${e[0]}</b> quando ${v.map((x,i)=>nm[i]+'='+x).join(', ')}?`,fields:[{label:'Uscita (0 o 1)',exp:String(e[1](...v)),kind:'str'}],sol:P(`Sostituite i valori: ${e[0].replace(/[ABC]/g,m=>v[nm.indexOf(m)])}\nCalcolate partendo dalle parentesi più interne: ${e[1](...v)}`)}}
function gCount(l){const e=pick(exprList(l)),n=NV(e),c=outs(e,n).reduce((a,b)=>a+b,0);
 return{q:`Nella tavola di verità di <b>${e[0]}</b>, in quante righe (su ${1<<n}) l'uscita vale 1?`,fields:[{label:'Righe con uscita 1',exp:String(c),kind:'str'}],sol:P(`Uscite in ordine: ${outs(e,n).join(' ')}\nUscite uguali a 1: ${c}`)}}
function gSerie(l){const e=pick(exprList(l)),n=NV(e);return{q:`Scrivete la colonna delle uscite di <b>${e[0]}</b>, dalla prima all'ultima riga (ingressi in ordine ${'0'.repeat(n)}, ..., ${'1'.repeat(n)}), come sequenza di ${1<<n} cifre.`,fields:[{label:'Uscite',exp:outStr(e,n),kind:'str'}],sol:P(`Righe: ${rowsOf(n).map(v=>v.join('')).join(' ')}\nUscite: ${outs(e,n).join(' ')}`)}}
const LOGICA_ITEMS=[["Quanto vale l'uscita?",gOut],["Contare gli 1",gCount],["Scrivere la colonna delle uscite",gSerie]];
