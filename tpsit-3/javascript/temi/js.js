/* JavaScript (TPSIT 3): giochi ad hoc. Solo definizioni: va caricato dopo assets/giochi.js.
   - alberoDOM(el, etichetta): un pezzo di HTML diventa l'albero del DOM; data una chiamata come querySelector('nav a')
     si fa clic sui nodi che restituisce. La risposta la calcola il browser sullo stesso HTML.
   - eventLoop(el, etichetta): console.log, setTimeout e Promise.then: si prevede l'ordine di stampa, poi si segue
     il passo passo con stack, coda dei microtask e coda dei task.
   Gli stili sono in assets/giochi.css (sezione "simulatori"). */

const ALBERI_DOM = [
  { html: `<nav id="menu">
  <ul class="lista">
    <li class="voce attiva"><a href="/">Home</a></li>
    <li class="voce"><a href="/news">Notizie</a></li>
    <li class="voce"><a href="/contatti">Contatti</a></li>
  </ul>
</nav>
<main>
  <h1 class="titolo">Benvenuti</h1>
  <p class="intro">Il sito della <b>classe</b></p>
  <ul class="lista"><li>Uno</li><li>Due</li></ul>
</main>`, sel: ['li', 'ul > li', '.voce', '#menu li', 'li.attiva a', 'main li', '.lista li:first-child', 'a', 'nav a', 'main .lista', 'p b', '.titolo', 'ul', 'li:last-child', 'h2', 'main > ul li', '.voce a', '#menu', '.lista'] },
  { html: `<div id="negozio">
  <div class="card">
    <h2>Mouse</h2>
    <p class="prezzo">15 €</p>
    <button class="compra">Compra</button>
  </div>
  <div class="card offerta">
    <h2>Tastiera</h2>
    <p class="prezzo">25 €</p>
    <button class="compra">Compra</button>
  </div>
</div>
<footer><p>Contatti</p></footer>`, sel: ['.card', '.offerta .prezzo', 'button', '.card h2', '#negozio p', 'p', '.card:last-child button', 'footer p', 'div > p', '.card.offerta', 'div', '.prezzo', '.compra', 'h3', '#negozio > div', '.offerta h2'] },
  { html: `<form id="iscrizione">
  <label for="nome">Nome</label>
  <input id="nome" type="text">
  <label for="mail">Email</label>
  <input id="mail" type="email" class="obbligatorio">
  <input type="checkbox" class="obbligatorio">
  <button type="submit">Invia</button>
</form>`, sel: ['input', '[type="text"]', '.obbligatorio', 'label', '#mail', 'form > :first-child', 'button[type="submit"]', 'label + input', 'textarea', 'input.obbligatorio', '#iscrizione input', 'input[type="email"]'] }
];
function alberoDOM(el, label = "L'albero del DOM") {
  const st = stat(label);
  let T, frag, nodi, chiamata, giusti, tutti, scelti, primo, fatto;
  el.innerHTML = `<div class="card dom-al">${turn()}<div class="row"><button class="btn sec" data-a="n">Altra chiamata</button></div>
   <details class="dt-src"><summary>Il codice HTML</summary><pre class="dt-html"></pre></details>
   <p class="q dt-q"></p><div class="dt-albero"></div><div class="row"><button class="btn" data-a="v">Verifica</button><button class="btn sec" data-a="null">Nessun elemento</button></div><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.dom-al'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Chiamate giuste al primo colpo: ${st.ok} su ${st.tot}`;
  const etichetta = n => { let s = '&lt;' + n.tagName.toLowerCase(); for (const a of n.attributes) s += ` <span class="dt-at">${a.name}</span>="${escH(a.value)}"`; s += '&gt;';
    if (!n.children.length && n.textContent.trim()) s += ` <span class="dt-tx">"${escH(n.textContent.trim())}"</span>`;
    else { const t = [...n.childNodes].filter(x => x.nodeType === 3 && x.textContent.trim()).map(x => x.textContent.trim()); if (t.length) s += ` <span class="dt-tx">"${escH(t.join(' … '))}"</span>`; }
    return s; };
  function ramo(lista) { return '<ul>' + lista.map(n => `<li><button class="dt-n" data-k="${nodi.indexOf(n)}">${etichetta(n)}</button>${n.children.length ? ramo([...n.children]) : ''}</li>`).join('') + '</ul>'; }
  function nuovo() {
    T = pick(ALBERI_DOM); const t = document.createElement('template'); t.innerHTML = T.html; frag = t.content; nodi = [...frag.querySelectorAll('*')];
    const s = pick(T.sel), r = Math.random();
    const id = s.match(/^#([\w-]+)$/), cl = s.match(/^\.([\w-]+)$/), tg = s.match(/^[a-z][a-z0-9]*$/);
    if (id && r < 0.6) chiamata = { t: `document.getElementById('${id[1]}')`, tutti: false };
    else if (cl && r < 0.5) chiamata = { t: `document.getElementsByClassName('${cl[1]}')`, tutti: true };
    else if (tg && r < 0.4) chiamata = { t: `document.getElementsByTagName('${s}')`, tutti: true };
    else chiamata = Math.random() < 0.5 ? { t: `document.querySelector('${s}')`, tutti: false } : { t: `document.querySelectorAll('${s}')`, tutti: true };
    chiamata.s = s; tutti = chiamata.tutti; const ris = tutti ? [...frag.querySelectorAll(s)] : [frag.querySelector(s)].filter(Boolean);
    giusti = new Set(ris.map(n => nodi.indexOf(n))); scelti = new Set(); primo = true; fatto = false;
    $q('.dt-html').textContent = T.html;
    $q('.dt-q').innerHTML = `Che cosa restituisce <code>${escH(chiamata.t)}</code>? ${tutti ? 'Fate clic su <b>tutti</b> gli elementi della lista' : 'Fate clic sull\'<b>unico</b> elemento restituito'}, poi verificate.`;
    $q('.dt-albero').innerHTML = `<div class="dt-rad">document</div>` + ramo([...frag.children]);
    $q('.msg').textContent = ''; c.querySelectorAll('[data-a=v],[data-a=null]').forEach(b => b.disabled = false);
  }
  function segna() { c.querySelectorAll('.dt-n').forEach(b => b.classList.toggle('on', scelti.has(+b.dataset.k))); }
  function verifica(vuoto) {
    if (fatto) return;
    if (vuoto) scelti = new Set();
    else if (!scelti.size) { const m = $q('.msg'); m.textContent = 'Non avete scelto nessun nodo: se pensate che non ci sia, premete «Nessun elemento».'; m.style.color = 'var(--mute)'; return; }
    const ok = scelti.size === giusti.size && [...giusti].every(k => scelti.has(k));
    if (primo) { st.tot++; if (ok) st.ok++; primo = false; up(); }
    fatto = true; c.querySelectorAll('[data-a=v],[data-a=null]').forEach(b => b.disabled = true);
    c.querySelectorAll('.dt-n').forEach(b => { const k = +b.dataset.k; b.classList.toggle('giusto', giusti.has(k)); b.classList.toggle('sbagliato', scelti.has(k) && !giusti.has(k)); });
    const m = $q('.msg'), nomi = giusti.size;
    const cosa = !nomi ? (tutti ? 'una lista vuota (length 0)' : 'null: nessun elemento corrisponde') : tutti ? `una lista di ${nomi} element${nomi === 1 ? 'o' : 'i'}, in ordine di documento` : 'il primo elemento che corrisponde, in ordine di documento';
    m.innerHTML = (ok ? 'Esatto! ' : 'Non proprio. ') + `La chiamata restituisce ${cosa}.` + (!ok && !tutti && [...frag.querySelectorAll(chiamata.s)].some(x => scelti.has(nodi.indexOf(x))) ? ' Ricordate: querySelector e getElementById restituiscono solo il primo, non una lista.' : '');
    m.style.color = ok ? 'var(--ok)' : 'var(--ko)';
  }
  c.addEventListener('click', e => {
    const n = e.target.closest('.dt-n'); if (n && !fatto) { const k = +n.dataset.k; if (tutti) scelti.has(k) ? scelti.delete(k) : scelti.add(k); else scelti = scelti.has(k) ? new Set() : new Set([k]); segna(); return; }
    const a = e.target.closest('[data-a]'); if (!a) return;
    if (a.dataset.a === 'n') nuovo(); else if (a.dataset.a === 'v') verifica(false); else if (a.dataset.a === 'null') verifica(true);
  });
  up(); nuovo();
}

/* ---------- l'event loop: chi stampa prima? ----------
   eventLoop(el, etichetta): un programma con console.log, setTimeout e Promise.then. Si mette in ordine l'output
   facendo clic sulle lettere, poi si guarda l'esecuzione passo passo con stack, coda dei microtask e coda dei task.
   Un'istruzione è ['log', 'A'] | ['timer', ritardo, [istruzioni]] | ['then', [istruzioni]]. */
function programmaEL(liv) {
  let lettera = 0; const L = () => 'ABCDEFGH'[lettera++];
  const foglia = () => ['log', L()];
  for (let t = 0; t < 200; t++) {
    lettera = 0; const n = rnd(4, liv === 1 ? 5 : 6), P = [];
    for (let i = 0; i < n; i++) {
      const r = Math.random();
      if (r < 0.34) P.push(foglia());
      else if (r < 0.67) P.push(['timer', liv === 1 ? 0 : pick([0, 0, 100, 50]), liv === 2 && Math.random() < 0.35 ? [foglia(), Math.random() < 0.5 ? ['then', [foglia()]] : foglia()] : [foglia()]]);
      else P.push(['then', liv === 2 && Math.random() < 0.35 ? [foglia(), Math.random() < 0.5 ? ['timer', 0, [foglia()]] : ['then', [foglia()]]] : [foglia()]]);
    }
    const tipi = new Set(P.map(x => x[0]));
    if (tipi.size === 3 && lettera <= 7) return P;
  }
}
function codiceEL(P, ind = '') {
  return P.flatMap(x => x[0] === 'log' ? [`${ind}console.log('${x[1]}');`]
    : x[0] === 'timer' ? [`${ind}setTimeout(() => {`, ...codiceEL(x[2], ind + '  '), `${ind}}, ${x[1]});`]
    : [`${ind}Promise.resolve().then(() => {`, ...codiceEL(x[1], ind + '  '), `${ind}});`]);
}
/* simulazione: restituisce l'output e le fotografie per il passo passo */
function simulaEL(P) {
  const out = [], micro = [], task = [], foto = []; let seq = 0, ora = 0;
  const nome = b => b.map(x => x[0] === 'log' ? x[1] : x[0] === 'timer' ? 'timer' : 'then').join(' ');
  const scatta = (stack, txt) => foto.push({ stack, micro: micro.map(m => m.et), task: task.slice().sort((a, b) => a.due - b.due || a.seq - b.seq).map(t => t.et), out: out.slice(), txt });
  const esegui = (b, dove) => b.forEach(x => {
    if (x[0] === 'log') { out.push(x[1]); scatta(dove, `${dove}: console.log('${x[1]}') stampa ${x[1]} subito.`); }
    else if (x[0] === 'timer') { const et = `timer ${x[1]} ms → ${nome(x[2])}`; task.push({ b: x[2], due: ora + x[1], seq: seq++, et }); scatta(dove, `${dove}: setTimeout non esegue niente adesso, mette la funzione nella coda dei task${x[1] ? ` (pronta tra ${x[1]} ms)` : ''}.`); }
    else { const et = `then → ${nome(x[1])}`; micro.push({ b: x[1], et }); scatta(dove, `${dove}: la Promise è già risolta, quindi la funzione del then va nella coda dei microtask.`); }
  });
  scatta('script principale', 'Parte lo script principale.');
  esegui(P, 'script principale');
  scatta('', 'Lo script principale è finito: lo stack è vuoto e l\'event loop guarda le code. Prima tutti i microtask.');
  const svuota = () => { while (micro.length) { const m = micro.shift(); scatta('microtask', `Dal fronte della coda dei microtask: ${m.et}.`); esegui(m.b, 'microtask'); } };
  svuota();
  while (task.length) {
    task.sort((a, b) => a.due - b.due || a.seq - b.seq); const t = task.shift(); ora = Math.max(ora, t.due);
    scatta('task', `Nessun microtask in attesa: l'event loop prende il primo task pronto, ${t.et}.`); esegui(t.b, 'task'); svuota();
  }
  scatta('', 'Code vuote: il programma è finito.');
  return { out, foto };
}
function eventLoop(el, label = 'Chi stampa prima?') {
  const st = stat(label);
  let P, S, ord, primo, k, fatto;
  el.innerHTML = `<div class="card evl">${turn()}<div class="row"><select class="el-liv"><option value="1">Livello 1: tutto subito</option><option value="2">Livello 2: ritardi e annidamenti</option></select><button class="btn sec" data-a="n">Altro programma</button></div>
   <ol class="cod el-cod"></ol><p class="q">In che ordine compaiono le lettere nella console? Fate clic sulle lettere nell'ordine giusto.</p>
   <div class="el-lettere"></div><div class="el-scelta"></div><div class="row"><button class="btn" data-a="v">Verifica</button><button class="btn sec" data-a="r">Cancella</button></div>
   <div class="el-sim" hidden><div class="el-col"><b>Stack</b><div class="el-stack"></div></div><div class="el-col"><b>Coda dei microtask</b><div class="el-micro"></div></div><div class="el-col"><b>Coda dei task</b><div class="el-task"></div></div><div class="el-col"><b>Console</b><div class="el-out"></div></div></div>
   <p class="el-txt"></p><div class="row el-pas"></div><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.evl'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Ordini giusti al primo colpo: ${st.ok} su ${st.tot}`;
  function nuovo() {
    P = programmaEL(+$q('.el-liv').value); S = simulaEL(P); ord = []; primo = true; k = -1; fatto = false;
    $q('.el-cod').innerHTML = codiceEL(P).map(r => `<li><code>${escH(r)}</code></li>`).join('');
    $q('.el-lettere').innerHTML = S.out.slice().sort().map(l => `<button class="btn sec el-l" data-l="${l}">${l}</button>`).join('');
    $q('.el-sim').hidden = true; $q('.el-txt').textContent = ''; $q('.el-pas').innerHTML = ''; $q('.msg').textContent = ''; scelta();
  }
  function scelta() { $q('.el-scelta').innerHTML = `Console: ${ord.length ? ord.map(l => `<span class="el-chip">${l}</span>`).join('') : '<i>vuota</i>'}`; c.querySelectorAll('.el-l').forEach(b => b.disabled = fatto || ord.includes(b.dataset.l)); }
  function passo() {
    const f = S.foto[k], lista = (a, cl) => a.length ? a.map(x => `<span class="${cl}">${escH(x)}</span>`).join('') : '<i>vuota</i>';
    $q('.el-sim').hidden = false;
    $q('.el-stack').innerHTML = f.stack ? `<span class="el-s">${escH(f.stack)}</span>` : '<i>vuoto</i>';
    $q('.el-micro').innerHTML = lista(f.micro, 'el-m'); $q('.el-task').innerHTML = lista(f.task, 'el-t'); $q('.el-out').innerHTML = f.out.map(l => `<span class="el-chip">${l}</span>`).join('') || '<i>vuota</i>';
    $q('.el-txt').textContent = f.txt;
    $q('.el-pas').innerHTML = k + 1 < S.foto.length ? '<button class="btn" data-a="p">Passo ▶</button><button class="btn sec" data-a="f">Fino alla fine</button>' : '';
  }
  c.addEventListener('click', e => {
    const l = e.target.closest('.el-l'); if (l && !fatto) { ord.push(l.dataset.l); scelta(); return; }
    const a = e.target.closest('[data-a]'); if (!a) return; const m = $q('.msg');
    if (a.dataset.a === 'n') return nuovo();
    if (a.dataset.a === 'r' && !fatto) { ord = []; scelta(); }
    if (a.dataset.a === 'v' && !fatto) {
      if (ord.length < S.out.length) { m.textContent = 'Mancano alcune lettere.'; m.style.color = 'var(--mute)'; return; }
      const ok = ord.join('') === S.out.join(''); if (primo) { st.tot++; if (ok) st.ok++; primo = false; up(); }
      fatto = true; scelta();
      m.innerHTML = (ok ? 'Esatto!' : `No: l'ordine giusto è <b>${S.out.join(' ')}</b>.`) + ' Seguite l\'esecuzione passo passo: prima tutto lo script, poi tutti i microtask (then), poi un task (setTimeout) alla volta.'; m.style.color = ok ? 'var(--ok)' : 'var(--ko)';
      k = 0; passo();
    }
    if (a.dataset.a === 'p') { k++; passo(); }
    if (a.dataset.a === 'f') { k = S.foto.length - 1; passo(); }
  });
  $q('.el-liv').onchange = nuovo; up(); nuovo();
}
