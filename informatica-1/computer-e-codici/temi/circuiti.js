/* Circuiti logici con le porte AND, OR e NOT. Solo definizioni: va caricato dopo assets/giochi.js.
   circuito(el, etichetta): un circuito disegnato in SVG, diverso a ogni situazione. Gli interruttori degli ingressi
   sono già impostati: si prevede se il LED d'uscita si accende, poi si avvia la simulazione e la corrente scorre
   porta dopo porta. Dopo la simulazione gli interruttori si possono cambiare per esplorare il circuito.
   Gli stili sono in assets/giochi.css (sezione "simulatori"). */

/* un nodo è {v: 'A'} (ingresso) oppure {op: 'AND'|'OR'|'NOT', f: [figli]} */
function alberoCircuito(liv) {
  const op2 = () => pick(['AND', 'OR']), I = v => ({ v });
  const modelli = {
    1: [() => ({ op: op2(), f: [I('A'), I('B')] }), () => ({ op: 'NOT', f: [I('A')] })],
    2: [() => ({ op: op2(), f: [{ op: op2(), f: [I('A'), I('B')] }, I('C')] }), () => ({ op: 'NOT', f: [{ op: op2(), f: [I('A'), I('B')] }] }),
      () => ({ op: op2(), f: [{ op: 'NOT', f: [I('A')] }, I('B')] })],
    3: [() => ({ op: op2(), f: [{ op: op2(), f: [I('A'), I('B')] }, { op: op2(), f: [I('C'), I('D')] }] }),
      () => ({ op: 'NOT', f: [{ op: op2(), f: [{ op: op2(), f: [I('A'), I('B')] }, I('C')] }] }),
      () => ({ op: op2(), f: [{ op: 'NOT', f: [I('A')] }, { op: op2(), f: [I('B'), I('C')] }] })]
  };
  return pick(modelli[liv])();
}
const valuta = (n, x) => n.v ? x[n.v] : n.op === 'NOT' ? 1 - valuta(n.f[0], x) : n.op === 'AND' ? valuta(n.f[0], x) & valuta(n.f[1], x) : valuta(n.f[0], x) | valuta(n.f[1], x);
const espressione = (n, alto = true) => n.v ? n.v : n.op === 'NOT' ? 'NOT ' + espressione(n.f[0], false) : (alto ? '' : '(') + espressione(n.f[0], false) + ' ' + n.op + ' ' + espressione(n.f[1], false) + (alto ? '' : ')');
const variabili = n => n.v ? [n.v] : [...new Set(n.f.flatMap(variabili))].sort();
function profondita(n) { return n.v ? 0 : 1 + Math.max(...n.f.map(profondita)); }

function circuito(el, label = 'Il circuito logico') {
  const st = stat(label);
  let T, X, fase, liv = 1, previsione, timer;
  el.innerHTML = `<div class="card circ">${turn()}<div class="row"><select class="cc-liv"><option value="1">Livello 1: una porta</option><option value="2">Livello 2: due porte</option><option value="3">Livello 3: tre porte</option></select><button class="btn sec" data-a="n">Nuova situazione</button></div>
   <div class="cc-svg"></div><p class="cc-espr"></p><p class="q cc-dom"></p>
   <div class="row cc-prev"><button class="btn" data-p="1">💡 Il LED si accende</button><button class="btn sec" data-p="0">Il LED resta spento</button></div>
   <div class="row cc-dopo" hidden><button class="btn" data-a="s">▶ Avvia la simulazione</button></div><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.circ'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Previsioni giuste: ${st.ok} su ${st.tot}`;
  function nuovo() {
    clearInterval(timer); liv = +$q('.cc-liv').value; T = alberoCircuito(liv); X = {}; variabili(T).forEach(v => X[v] = rnd(0, 1));
    fase = 'prevedi'; previsione = null; $q('.msg').textContent = '';
    $q('.cc-espr').innerHTML = `Espressione: <code>${espressione(T)}</code>`;
    $q('.cc-dom').innerHTML = 'Gli interruttori sono già impostati (1 = acceso). Il LED d\'uscita si accende o resta spento?';
    $q('.cc-prev').hidden = false; $q('.cc-dopo').hidden = true; disegna(-1);
  }
  /* disegno: gli ingressi a sinistra, le porte in colonne per profondità, il LED a destra.
     acceso = fino a quale profondità la corrente è già passata (-1 = niente) */
  function disegna(acceso) {
    const foglie = [], dx = 108, dy = 62; let k = 0;
    const pos = new Map();
    (function piazza(n) { if (n.v) { pos.set(n, { x: 70, y: 40 + k++ * dy }); foglie.push(n); return; } n.f.forEach(piazza); const ys = n.f.map(f => pos.get(f).y); pos.set(n, { x: 70 + profondita(n) * dx, y: ys.reduce((a, b) => a + b, 0) / ys.length }); })(T);
    const D = profondita(T), W = 70 + D * dx + 136, H = 40 + Math.max(1, k - 1) * dy + 50, mostra = d => acceso >= d;
    let fili = '', porte = '', ingressi = '';
    const val = n => valuta(n, X);
    (function fila(n) {
      if (n.v) return; const p = pos.get(n);
      n.f.forEach((f, i) => {
        const q = pos.get(f), xin = p.x - 28, yin = n.f.length === 1 ? p.y : p.y + (i === 0 ? -10 : 10), xo = f.v ? q.x + 26 : q.x + 30, mx = (xo + xin) / 2;
        const on = mostra(profondita(f)) && val(f);
        fili += `<path class="filo${mostra(profondita(f)) ? (on ? ' on' : ' off') : ''}" d="M${xo} ${q.y}H${mx}V${yin}H${xin}"/>`;
        fila(f);
      });
      const o = mostra(profondita(n)) ? val(n) : null;
      porte += `<g class="porta" transform="translate(${p.x},${p.y})">${formaPorta(n.op)}<text x="0" y="${n.op === 'NOT' ? 26 : 30}" class="nome">${n.op}</text>${o === null ? '' : `<text x="40" y="-8" class="usc ${o ? 'u1' : 'u0'}">${o}</text>`}</g>`;
    })(T);
    foglie.forEach(n => { const p = pos.get(n), v = X[n.v]; ingressi += `<g class="ingr${fase !== 'prevedi' ? ' cliccabile' : ''}" data-v="${n.v}" transform="translate(${p.x},${p.y})"><rect x="-26" y="-16" width="52" height="32" rx="16" class="${v ? 'v1' : 'v0'}"/><circle cx="${v ? 10 : -10}" cy="0" r="11"/><text x="-40" y="5" class="lett">${n.v}</text><text x="0" y="32" class="bit">${v}</text></g>`; });
    const r = pos.get(T), fine = 70 + D * dx, out = mostra(D) ? val(T) : null;
    fili += `<path class="filo${out === null ? '' : out ? ' on' : ' off'}" d="M${fine + 30} ${r.y}H${fine + 90}"/>`;
    const led = `<g class="led${out ? ' acceso' : ''}" transform="translate(${fine + 108},${r.y})"><circle r="17"/><path d="M-6 17v10M6 17v10"/></g>`;
    $q('.cc-svg').innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="cc">${fili}${porte}${ingressi}${led}</svg>`;
  }
  function formaPorta(op) {
    if (op === 'NOT') return '<path class="corpo" d="M-28 -16L16 0L-28 16Z"/><circle class="corpo" cx="22" cy="0" r="6"/>';
    if (op === 'AND') return '<path class="corpo" d="M-28 -22H6A22 22 0 0 1 6 22H-28Z"/>';
    return '<path class="corpo" d="M-30 -22Q-12 0 -30 22Q12 22 30 0Q12 -22 -30 -22Z"/>';
  }
  function simula() {
    clearInterval(timer); fase = 'simula'; let d = 0; const D = profondita(T); disegna(0);
    timer = setInterval(() => { d++; disegna(d); if (d >= D) { clearInterval(timer); fase = 'esplora'; finito(); } }, 700);
  }
  function finito() {
    const out = valuta(T, X), m = $q('.msg');
    if (previsione !== null) { const ok = previsione === out; m.textContent = (ok ? 'Esatto! ' : 'No: ') + `il LED ${out ? 'si accende' : 'resta spento'}. Ora potete cambiare gli interruttori e vedere che cosa succede.`; m.style.color = ok ? 'var(--ok)' : 'var(--ko)'; previsione = null; }
    $q('.cc-dom').innerHTML = 'Fate clic sugli interruttori per esplorare: l\'uscita si ricalcola subito.'; disegna(99);
  }
  c.addEventListener('click', e => {
    const g = e.target.closest('.ingr.cliccabile'); if (!g || fase !== 'esplora') return;
    X[g.dataset.v] ^= 1; disegna(99);
  });
  c.querySelectorAll('.cc-prev [data-p]').forEach(b => b.onclick = () => {
    previsione = +b.dataset.p; st.tot++; if (previsione === valuta(T, X)) st.ok++; up();
    $q('.cc-prev').hidden = true; $q('.cc-dopo').hidden = false; $q('.cc-dom').innerHTML = 'Ora avviate la simulazione e guardate la corrente passare porta dopo porta.';
  });
  $q('[data-a=s]').onclick = () => { $q('.cc-dopo').hidden = true; simula(); };
  $q('[data-a=n]').onclick = nuovo; $q('.cc-liv').onchange = nuovo;
  up(); nuovo();
}
