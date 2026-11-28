/* JavaScript (TPSIT 3): giochi ad hoc. Solo definizioni: va caricato dopo assets/giochi.js.
   - alberoDOM(el, etichetta): un pezzo di HTML diventa l'albero del DOM; data una chiamata come querySelector('nav a')
     si fa clic sui nodi che restituisce. La risposta la calcola il browser sullo stesso HTML.
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
