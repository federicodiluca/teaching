/* Il deadlock (TPSIT 4): giochi ad hoc. Solo definizioni: va caricato dopo assets/giochi.js.
   - holtLab(el, etichetta): un grafo di Holt (processi, risorse con le istanze, richieste e assegnazioni). Si dice se c'è
     deadlock, si indicano i processi bloccati, poi si guarda la riduzione del grafo passo passo.
   Gli stili sono in assets/giochi.css (sezione "simulatori"). */

/* riduzione del grafo: chi può avere tutto ciò che chiede finisce e restituisce le sue risorse */
function riduciHolt(G) {
  const disp = G.ist.map((n, r) => n - G.ass.filter(a => a[1] === r).length), fatti = G.proc.map(() => false), passi = [];
  for (let giro = 0; giro < G.proc.length; giro++) {
    const p = G.proc.findIndex((_, i) => !fatti[i] && G.ric.filter(x => x[0] === i).every(x => disp[x[1]] >= 1));
    if (p < 0) break;
    fatti[p] = true; G.ass.filter(a => a[0] === p).forEach(a => disp[a[1]]++); passi.push(p);
  }
  return { passi, bloccati: G.proc.map((_, i) => i).filter(i => !fatti[i]) };
}
function grafoHolt(liv) {
  const voglio = Math.random() < 0.5;
  for (let t = 0; t < 2000; t++) {
    const np = rnd(3, 4), nr = liv === 1 ? rnd(2, 3) : 3, ist = Array.from({ length: nr }, () => liv === 1 ? 1 : rnd(1, 2)), ass = [], ric = [];
    ist.forEach((n, r) => { for (let k = 0; k < n; k++) if (Math.random() < 0.85) ass.push([rnd(0, np - 1), r]); });
    for (let p = 0; p < np; p++) if (Math.random() < 0.75) { const r = rnd(0, nr - 1); if (!ass.some(a => a[0] === p && a[1] === r)) ric.push([p, r]); }
    const G = { proc: Array.from({ length: np }, (_, i) => 'P' + (i + 1)), ist, ass, ric };
    if (ric.length < 2 || ass.length < 2) continue;
    const R = riduciHolt(G);
    if ((R.bloccati.length > 0) !== voglio) continue;
    return G;
  }
}
function holtLab(el, label = 'Il grafo di Holt') {
  const st = stat(label);
  let G, R, fase, scelti, primo, k, liv = 1;
  el.innerHTML = `<div class="card holt">${turn()}<div class="row"><select class="hl-liv"><option value="1">Livello 1: un'istanza per risorsa</option><option value="2">Livello 2: più istanze</option></select><button class="btn sec" data-a="n">Altro grafo</button></div>
   <p class="q hl-dom"></p><div class="hl-svg"></div><div class="row hl-az"></div><p class="msg"></p><div class="hl-leg"><span class="ric">→ richiesta (processo → risorsa)</span><span class="ass">→ assegnazione (risorsa → processo)</span></div><div class="stat"></div></div>`;
  const c = el.querySelector('.holt'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Grafi analizzati giusti al primo colpo: ${st.ok} su ${st.tot}`;
  function nuovo() { liv = +$q('.hl-liv').value; G = grafoHolt(liv); R = riduciHolt(G); fase = 'domanda'; scelti = new Set(); primo = true; k = -1; $q('.msg').textContent = ''; azioni(); disegna(); }
  function azioni() {
    const a = $q('.hl-az');
    if (fase === 'domanda') { $q('.hl-dom').innerHTML = 'Guardate il grafo: c\'è deadlock?'; a.innerHTML = '<button class="btn" data-r="si">Sì, c\'è deadlock</button><button class="btn sec" data-r="no">No</button>'; }
    else if (fase === 'quali') { $q('.hl-dom').innerHTML = 'Fate clic sui processi bloccati nel deadlock, poi confermate.'; a.innerHTML = '<button class="btn" data-a="ok">Conferma</button>'; }
    else if (fase === 'fine') { $q('.hl-dom').innerHTML = 'Riduzione finita: premete «Altro grafo» per continuare.'; a.innerHTML = ''; }
    else { $q('.hl-dom').innerHTML = 'La riduzione del grafo: un processo che può ottenere tutto ciò che chiede finisce e libera le sue risorse.'; a.innerHTML = `<button class="btn" data-a="pas">${k + 1 < R.passi.length ? 'Riduci ancora ▶' : 'Fine'}</button>`; }
  }
  function disegna() {
    const np = G.proc.length, nr = G.ist.length, W = 460, H = 300, PX = i => 60 + i * (W - 120) / Math.max(1, np - 1), RX = r => 90 + r * (W - 180) / Math.max(1, nr - 1), PY = 60, RY = 230;
    const finiti = new Set(R.passi.slice(0, k + 1));
    let s = '<defs><marker id="hl-f" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z"/></marker></defs>';
    const curva = (x1, y1, x2, y2, cl, off) => `<path d="M${x1} ${y1}Q${(x1 + x2) / 2 + off} ${(y1 + y2) / 2} ${x2} ${y2}" class="${cl}" marker-end="url(#hl-f)"/>`;
    G.ass.forEach(([p, r], i) => { if (finiti.has(p)) return; s += curva(RX(r), RY - 22, PX(p), PY + 24, 'ass', -18); });
    G.ric.forEach(([p, r]) => { if (finiti.has(p)) return; s += curva(PX(p), PY + 24, RX(r), RY - 24, 'ric', 18); });
    G.ist.forEach((n, r) => { s += `<g class="ris" transform="translate(${RX(r)},${RY})"><rect x="-28" y="-22" width="56" height="44" rx="6"/><text y="38" class="nm">R${r + 1}</text>${Array.from({ length: n }, (_, j) => `<circle cx="${(j - (n - 1) / 2) * 16}" cy="0" r="5"/>`).join('')}</g>`; });
    G.proc.forEach((nome, i) => { const blo = fase === 'fine' && R.bloccati.includes(i);
      s += `<g class="pro${scelti.has(i) ? ' scelto' : ''}${finiti.has(i) ? ' finito' : ''}${blo ? ' bloccato' : ''}${fase === 'quali' ? ' clic' : ''}" data-p="${i}" transform="translate(${PX(i)},${PY})"><circle r="24"/><text y="6">${nome}</text></g>`; });
    $q('.hl-svg').innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="hl-s">${s}</svg>`;
  }
  c.addEventListener('click', e => {
    const m = $q('.msg'), r = e.target.closest('[data-r]');
    if (r && fase === 'domanda') {
      const ok = (r.dataset.r === 'si') === (R.bloccati.length > 0);
      if (!ok) { if (primo) { st.tot++; primo = false; up(); } m.textContent = R.bloccati.length ? 'No: c\'è un gruppo di processi che si aspettano a vicenda. Guardate la riduzione.' : 'No: c\'è un ordine in cui tutti i processi riescono a finire. Guardate la riduzione.'; m.style.color = 'var(--ko)'; fase = 'riduci'; azioni(); disegna(); return; }
      if (!R.bloccati.length) { if (primo) { st.tot++; st.ok++; primo = false; up(); } m.textContent = 'Esatto: nessun deadlock. Vediamo perché con la riduzione.'; m.style.color = 'var(--ok)'; fase = 'riduci'; }
      else { m.textContent = 'Esatto, c\'è deadlock. Quali processi sono bloccati?'; m.style.color = 'var(--ok)'; fase = 'quali'; }
      azioni(); disegna(); return;
    }
    const p = e.target.closest('.pro.clic'); if (p) { const i = +p.dataset.p; scelti.has(i) ? scelti.delete(i) : scelti.add(i); disegna(); return; }
    const b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'ok') { const ok = scelti.size === R.bloccati.length && R.bloccati.every(i => scelti.has(i));
      if (primo) { st.tot++; if (ok) st.ok++; primo = false; up(); }
      m.textContent = ok ? 'Esatto! Ora guardate la riduzione: questi processi non finiranno mai.' : `No: i processi bloccati sono ${R.bloccati.map(i => G.proc[i]).join(', ')}.`; m.style.color = ok ? 'var(--ok)' : 'var(--ko)'; fase = 'riduci'; azioni(); disegna(); }
    if (b.dataset.a === 'pas') {
      if (k + 1 < R.passi.length) { k++; const pp = R.passi[k]; m.textContent = `${G.proc[pp]} ottiene ciò che chiede (o non chiede niente), finisce e restituisce le sue risorse.`; m.style.color = 'var(--ink)'; }
      else { fase = 'fine'; m.textContent = R.bloccati.length ? `Nessun altro processo può avanzare: ${R.bloccati.map(i => G.proc[i]).join(', ')} sono in deadlock.` : 'Tutti i processi sono finiti: il grafo si riduce completamente, quindi non c\'è deadlock.'; m.style.color = R.bloccati.length ? 'var(--ko)' : 'var(--ok)'; }
      azioni(); disegna();
    }
    if (b.dataset.a === 'n') nuovo();
  });
  $q('.hl-liv').onchange = nuovo; $q('[data-a=n]').onclick = nuovo; up(); nuovo();
}

/* ---------- il banchiere da giocare ----------
   banchiereLab(el, etichetta): la cassa in monete e tre clienti con la barra del prestito (pieno = già prestato,
   bordo = massimo dichiarato). Si fa clic sul cliente da servire: se gli manca al massimo quanto c'è in cassa
   arriva al massimo e restituisce tutto. Se nessuno può finire si dichiara lo stato non sicuro. */
function statoBanca() {
  const voglio = Math.random() < 0.6;
  for (let t = 0; t < 2000; t++) {
    const max = [rnd(4, 9), rnd(4, 9), rnd(4, 9)], pres = max.map(m => rnd(1, m - 1)), cassa = rnd(1, 5);
    const ok = sicuro(cassa, max, pres).ok;
    if (ok !== voglio) continue;
    return { max, pres, cassa };
  }
}
function banchiereLab(el, label = 'Il banchiere in azione') {
  const st = stat(label);
  let S, cassa, pres, fatti, primo, finito;
  el.innerHTML = `<div class="card bnk">${turn()}<p class="q">Servite i clienti uno alla volta: scegliete chi può arrivare al suo massimo con le monete in cassa. Quando restituisce, la cassa cresce.</p>
   <div class="bk-cassa"></div><div class="bk-cli"></div><div class="row"><button class="btn sec" data-a="ns">Nessuno può finire: stato non sicuro</button><button class="btn sec" data-a="n">Altra situazione</button></div><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.bnk'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Situazioni risolte senza errori: ${st.ok} su ${st.tot}`;
  const conta = ok => { if (primo) { st.tot++; if (ok) st.ok++; primo = false; up(); } };
  function nuovo() { S = statoBanca(); cassa = S.cassa; pres = S.pres.slice(); fatti = [false, false, false]; primo = true; finito = false; $q('.msg').textContent = ''; disegna(); }
  function disegna(evid) {
    $q('.bk-cassa').innerHTML = `<b>In cassa: ${cassa}</b><span class="bk-mon">${'<i></i>'.repeat(cassa)}</span>`;
    $q('.bk-cli').innerHTML = S.max.map((m, i) => `<button class="bk-c${fatti[i] ? ' fatto' : ''}${evid === i ? ' no' : ''}" data-c="${i}" ${fatti[i] || finito ? 'disabled' : ''}><b>Cliente ${'ABC'[i]}</b>
      <span class="bk-bar">${Array.from({ length: m }, (_, j) => `<i class="${j < pres[i] ? 'p' : ''}"></i>`).join('')}</span>
      <small>${fatti[i] ? 'ha restituito tutto' : `prestato ${pres[i]} su ${m}, gli mancano <b>${m - pres[i]}</b>`}</small></button>`).join('');
  }
  c.addEventListener('click', e => {
    const m = $q('.msg'), b = e.target.closest('[data-c]');
    if (b && !finito) { const i = +b.dataset.c, manca = S.max[i] - pres[i];
      if (manca > cassa) { conta(false); m.textContent = `Al cliente ${'ABC'[i]} mancano ${manca} monete ma in cassa ce ne sono ${cassa}: non può arrivare al massimo, quindi non restituisce niente.`; m.style.color = 'var(--ko)'; disegna(i); return; }
      cassa -= manca; pres[i] = S.max[i]; disegna();
      setTimeout(() => { cassa += S.max[i]; pres[i] = 0; fatti[i] = true;
        if (fatti.every(x => x)) { finito = true; conta(true); m.textContent = 'Tutti i clienti hanno finito: lo stato è sicuro. L\'ordine che avete trovato è una sequenza sicura.'; m.style.color = 'var(--ok)'; }
        else { m.textContent = `Il cliente ${'ABC'[i]} riceve ${manca}, arriva a ${S.max[i]} e restituisce tutto: ora in cassa ci sono ${cassa} monete.`; m.style.color = 'var(--ink)'; }
        disegna(); }, 600);
      return; }
    const a = e.target.closest('[data-a]'); if (!a) return;
    if (a.dataset.a === 'n') return nuovo();
    if (finito) return;
    const puo = S.max.map((mx, i) => !fatti[i] && mx - pres[i] <= cassa).indexOf(true);
    if (puo >= 0) { conta(false); m.textContent = `Non ancora: al cliente ${'ABC'[puo]} mancano ${S.max[puo] - pres[puo]} monete e in cassa ce ne sono ${cassa}.`; m.style.color = 'var(--ko)'; return; }
    finito = true; conta(true); m.textContent = 'Esatto: nessun cliente può arrivare al massimo. È uno stato non sicuro: il banchiere non avrebbe dovuto arrivarci.'; m.style.color = 'var(--ok)'; disegna();
  });
  up(); nuovo();
}
