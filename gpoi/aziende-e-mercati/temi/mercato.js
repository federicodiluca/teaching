/* Il mercato e il prezzo (GPOI): domanda e offerta sul grafico. Solo definizioni: va caricato dopo assets/giochi.js.
   mercatoLab(el, etichetta): domanda Q = a − b·P e offerta Q = c + d·P sul grafico (prezzo in verticale).
   - Equilibrio: si trascina la linea del prezzo e si vedono quantità domandata, offerta ed eccesso, fino all'equilibrio.
   - Spostamenti: un evento sposta una curva; si sceglie quale e dove, poi si guarda il nuovo equilibrio.
   Gli stili sono in assets/giochi.css (sezione "simulatori"). */
const EVENTI_MERCATO = [
  ['Aumenta il reddito dei consumatori (bene normale)', 'D', 1, 'con più reddito si compra di più a ogni prezzo'],
  ['Il bene passa di moda', 'D', -1, 'cala la voglia di comprarlo a ogni prezzo'],
  ['Aumenta il prezzo di un bene succedaneo', 'D', 1, 'il sostituto costa di più, quindi si compra questo'],
  ['Aumenta il prezzo di un bene complementare', 'D', -1, 'se costa di più ciò che si usa insieme, se ne compra meno di entrambi'],
  ['Aumenta il costo delle materie prime', 'O', -1, 'produrre costa di più: a ogni prezzo si offre meno'],
  ['Una nuova tecnologia rende la produzione più efficiente', 'O', 1, 'produrre costa meno: a ogni prezzo si offre di più'],
  ['Entrano nel mercato nuove imprese', 'O', 1, 'più imprese, più offerta a ogni prezzo'],
  ['Una tassa sulla produzione colpisce le imprese', 'O', -1, 'la tassa è un costo in più: l\'offerta cala']
];
function mercatoLab(el, label = 'Domanda e offerta sul grafico') {
  const st = stat(label);
  let a, b, cc, d, pe, qe, P, modo = 'eq', ev, sposta = 0, trovato, primo, trasc = false;
  el.innerHTML = `<div class="card mer">${turn()}<div class="row"><button class="btn sec on" data-m="eq">Equilibrio</button><button class="btn sec" data-m="sp">Spostamenti</button><button class="btn sec" data-a="n">Nuovo mercato</button></div>
   <p class="q mer-t"></p><div class="mer-box"><div class="mer-svg"></div><div class="mer-lato"></div></div><input type="range" class="mer-sl" min="0" max="100" step="0.5" aria-label="Prezzo"><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.mer'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Risposte giuste al primo colpo: ${st.ok} su ${st.tot}`;
  const Qd = (p, grezzo) => { const q = a + sposta * (ev && ev[1] === 'D' ? 20 : 0) - b * p; return grezzo ? q : Math.max(0, q); },
    Qs = (p, grezzo) => { const q = cc + sposta * (ev && ev[1] === 'O' ? 20 : 0) + d * p; return grezzo ? q : Math.max(0, q); };
  const PMAX = () => Math.ceil((a + 25) / b), QMAX = () => Math.ceil((a + 30) / 10) * 10;
  function nuovo() {
    b = rnd(2, 5); d = rnd(2, 5); pe = rnd(6, 14); cc = rnd(0, 20); a = cc + (b + d) * pe; qe = a - b * pe;
    sposta = 0; ev = null; trovato = false; primo = true; P = Math.round(pe * (Math.random() < .5 ? 0.5 : 1.5)); $q('.msg').textContent = '';
    const sl = $q('.mer-sl'); sl.max = PMAX(); sl.value = P; sl.hidden = modo !== 'eq';
    if (modo === 'eq') $q('.mer-t').innerHTML = `Domanda: <b>Q = ${a} − ${b}·P</b>. Offerta: <b>Q = ${cc} + ${d}·P</b>. Trascinate la linea del prezzo (o usate il cursore) fino al prezzo di equilibrio.`;
    else { ev = pick(EVENTI_MERCATO); $q('.mer-t').innerHTML = `Il mercato è in equilibrio a P = ${pe}, Q = ${qe}. Succede questo: <b>${ev[0]}</b>. Quale curva si sposta, e dove?`; P = pe; }
    disegna();
  }
  function disegna(fine) {
    const W = 420, H = 300, x0 = 46, y0 = 260, qm = QMAX(), pm = PMAX(), X = q => x0 + q / qm * (W - x0 - 14), Y = p => y0 - p / pm * (y0 - 14);
    /* si disegna solo il tratto con quantità positiva (f(p) > 0), senza schiacciare la curva sull'asse */
    const retta = (f, cls, et) => { const pts = []; for (let p = 0; p <= pm + 1e-9; p += pm / 80) { const q = f(p, true); if (q >= 0 && q <= qm) pts.push([X(q), Y(p)]); }
      const ult = pts[pts.length - 1] || [0, 0]; return `<polyline points="${pts.map(x => x.join(',')).join(' ')}" class="${cls}"/>` + (et ? `<text x="${ult[0] + 6}" y="${ult[1] + 4}" class="cl ${et.toLowerCase() === 'd' ? 'd' : 'o'}">${et}</text>` : ''); };
    let s = `<line x1="${x0}" y1="${y0}" x2="${W - 6}" y2="${y0}" class="ax"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="8" class="ax"/><text x="${W - 10}" y="${y0 + 18}" class="al">Q</text><text x="${x0 - 30}" y="16" class="al">P</text>`;
    for (let q = 0; q <= qm; q += qm / 5) s += `<text x="${X(q)}" y="${y0 + 16}" class="tk">${q}</text>`;
    for (let p = 0; p <= pm; p += Math.ceil(pm / 6)) s += `<text x="${x0 - 8}" y="${Y(p) + 4}" class="tk dx">${p}</text>`;
    if (modo === 'sp' && sposta) { const s0 = sposta; sposta = 0; s += retta(Qd, 'cur d vecchia') + retta(Qs, 'cur o vecchia'); sposta = s0; }
    s += retta(Qd, 'cur d', 'D') + retta(Qs, 'cur o', 'O');
    if (modo === 'eq') {
      const qd = Qd(P), qs = Qs(P), y = Y(P);
      if (Math.abs(qd - qs) > 0.01) s += `<line x1="${X(Math.min(qd, qs))}" y1="${y}" x2="${X(Math.max(qd, qs))}" y2="${y}" class="ecc ${qd > qs ? 'dom' : 'off'}"/>`;
      s += `<line x1="${x0}" y1="${y}" x2="${W - 10}" y2="${y}" class="prezzo"/><circle cx="${x0}" cy="${y}" r="9" class="mani"/><text x="${x0 + 12}" y="${y - 6}" class="pl">P = ${fmt(P)}</text>`;
      s += `<circle cx="${X(qd)}" cy="${y}" r="5" class="pt d"/><circle cx="${X(qs)}" cy="${y}" r="5" class="pt o"/>`;
      $q('.mer-lato').innerHTML = `<p>Prezzo <b>${fmt(P)}</b></p><p class="d">Quantità domandata <b>${fmt(+qd.toFixed(1))}</b></p><p class="o">Quantità offerta <b>${fmt(+qs.toFixed(1))}</b></p><p class="${Math.abs(qd - qs) < 0.01 ? 'eq' : qd > qs ? 'dom' : 'off'}">${Math.abs(qd - qs) < 0.01 ? '<b>Equilibrio!</b>' : qd > qs ? `<b>Eccesso di domanda</b> di ${fmt(+(qd - qs).toFixed(1))}: il prezzo tende a salire` : `<b>Eccesso di offerta</b> di ${fmt(+(qs - qd).toFixed(1))}: il prezzo tende a scendere`}</p>`;
    } else {
      const pn = (a + sposta * (ev[1] === 'D' ? 20 : 0) - cc - sposta * (ev[1] === 'O' ? 20 : 0)) / (b + d), qn = Qd(pn);
      s += `<circle cx="${X(qe)}" cy="${Y(pe)}" r="5" class="pt vecchio"/>` + (sposta ? `<circle cx="${X(qn)}" cy="${Y(pn)}" r="7" class="pt nuovo"/><line x1="${x0}" y1="${Y(pn)}" x2="${X(qn)}" y2="${Y(pn)}" class="guida"/><line x1="${X(qn)}" y1="${Y(pn)}" x2="${X(qn)}" y2="${y0}" class="guida"/>` : '');
      $q('.mer-lato').innerHTML = sposta ? `<p>Prima: P = ${pe}, Q = ${qe}</p><p><b>Dopo: P = ${fmt(+pn.toFixed(1))}, Q = ${fmt(+qn.toFixed(1))}</b></p><p>Prezzo ${pn > pe ? '↑ sale' : '↓ scende'}, quantità ${qn > qe ? '↑ sale' : '↓ scende'}.</p>` :
        `<div class="mer-scelte">${[['D', 1, 'Domanda → (aumenta)'], ['D', -1, 'Domanda ← (diminuisce)'], ['O', 1, 'Offerta → (aumenta)'], ['O', -1, 'Offerta ← (diminuisce)']].map(([k, v, t]) => `<button class="btn sec" data-k="${k}" data-v="${v}">${t}</button>`).join('')}</div>`;
    }
    $q('.mer-svg').innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="mer-s">${s}</svg>`;
  }
  function prezzoDa(ev2) { const svg = $q('.mer-s'), r = svg.getBoundingClientRect(), y = (ev2.clientY - r.top) / r.height * 300; return Math.max(0, Math.min(PMAX(), (260 - y) / (260 - 14) * PMAX())); }
  function imposta(p) {
    P = Math.round(p * 2) / 2; $q('.mer-sl').value = P; disegna();
    if (!trovato && Math.abs(Qd(P) - Qs(P)) < 0.01) { trovato = true; st.tot++; st.ok++; up(); const m = $q('.msg'); m.textContent = `Trovato! A P = ${pe} domanda e offerta valgono entrambe ${qe}: a questo prezzo tutto ciò che si offre viene comprato.`; m.style.color = 'var(--ok)'; }
  }
  c.addEventListener('pointerdown', e => { if (modo !== 'eq' || !e.target.closest('.mer-s')) return; trasc = true; imposta(prezzoDa(e)); e.preventDefault(); });
  c.addEventListener('pointermove', e => { if (trasc) imposta(prezzoDa(e)); });
  document.addEventListener('pointerup', () => { trasc = false; });
  $q('.mer-sl').oninput = e => imposta(+e.target.value);
  c.addEventListener('click', e => {
    const b2 = e.target.closest('.mer-scelte [data-k]'); if (!b2) return; const ok = b2.dataset.k === ev[1] && +b2.dataset.v === ev[2], m = $q('.msg');
    if (primo) { st.tot++; if (ok) st.ok++; primo = false; up(); }
    if (!ok) { m.textContent = 'No: pensate a chi riguarda l\'evento, a chi compra (domanda) o a chi produce (offerta).'; m.style.color = 'var(--ko)'; return; }
    m.textContent = `Esatto: ${ev[3]}. La curva ${ev[1] === 'D' ? 'di domanda' : 'di offerta'} si sposta ${ev[2] > 0 ? 'a destra' : 'a sinistra'}.`; m.style.color = 'var(--ok)';
    let t = 0; const anim = setInterval(() => { t += 0.1; sposta = Math.min(1, t) * ev[2]; disegna(); if (t >= 1) clearInterval(anim); }, 40);
  });
  c.querySelectorAll('[data-m]').forEach(b2 => b2.onclick = () => { modo = b2.dataset.m; c.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x === b2)); nuovo(); });
  $q('[data-a=n]').onclick = nuovo; up(); nuovo();
}
