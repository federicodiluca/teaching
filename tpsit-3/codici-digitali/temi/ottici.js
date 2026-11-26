/* Codici ottici (TPSIT 3): EAN-13 disegnato e QR Code vero. Solo definizioni: va caricato dopo assets/giochi.js
   e, per il QR, dopo assets/qr.js (la libreria di Kazuhiko Arase già usata dal pulsante QR).
   - eanLab(el, etichetta): si calcola la cifra di controllo, poi il codice a barre compare barra per barra e il laser lo legge;
     facendo clic su una cifra si vedono i suoi 7 moduli.
   - qrLab(el, etichetta): si genera un QR Code dal testo e si riconoscono le zone facendo clic sui moduli.
   Gli stili sono in assets/giochi.css (sezione "simulatori"). */
const EAN_L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const EAN_R = EAN_L.map(c => [...c].map(b => b === '1' ? '0' : '1').join(''));
const EAN_G = EAN_R.map(c => [...c].reverse().join(''));
const EAN_P = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLG', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
function eanCheck(d12) { const s = [...d12].reduce((t, c, i) => t + (+c) * (i % 2 ? 3 : 1), 0); return (10 - s % 10) % 10; }
/* moduli del codice: [{bit, cifra (indice 1..12) o -1 per le guardie}] */
function eanModuli(d13) {
  const m = [], add = (bits, k) => [...bits].forEach(b => m.push({ b: +b, k }));
  add('101', -1); const p = EAN_P[+d13[0]];
  for (let i = 1; i <= 6; i++) add((p[i - 1] === 'L' ? EAN_L : EAN_G)[+d13[i]], i);
  add('01010', -1); for (let i = 7; i <= 12; i++) add(EAN_R[+d13[i]], i); add('101', -1);
  return m;
}
function eanLab(el, label = 'Il codice EAN-13') {
  const st = stat(label);
  let d12, d13, primo, sel = -1;
  el.innerHTML = `<div class="card ean">${turn()}<div class="row"><button class="btn sec" data-a="n">Altro prodotto</button></div>
   <p class="q ean-dom"></p><div class="ean-cif"></div>
   <div class="row ean-ris"><div class="f"><label>Cifra di controllo</label><input type="text" inputmode="numeric" autocomplete="off" maxlength="1"></div><button class="btn" data-a="c">Controlla</button><button class="btn sec" data-a="p">Mostra i pesi</button></div>
   <div class="ean-svg"></div><p class="ean-nota"></p><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.ean'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Cifre di controllo giuste al primo colpo: ${st.ok} su ${st.tot}`;
  function nuovo() {
    d12 = pick(['80', '80', '81', '83', '40', '76']) + Array.from({ length: 10 }, () => rnd(0, 9)).join('').slice(0, 10); d13 = null; primo = true; sel = -1;
    $q('.ean-dom').innerHTML = `Ecco le prime 12 cifre di un prodotto. Calcolate la tredicesima: cifre in posizione dispari × 1, in posizione pari × 3, poi check = (10 − somma mod 10) mod 10.`;
    $q('.ean-ris').hidden = false; $q('.ean-ris input').value = ''; $q('.msg').textContent = ''; $q('.ean-nota').textContent = ''; $q('.ean-svg').innerHTML = ''; cifre(false);
  }
  function cifre(pesi) {
    $q('.ean-cif').innerHTML = [...d12].map((x, i) => `<span><b>${x}</b>${pesi ? `<i>×${i % 2 ? 3 : 1}</i>` : ''}</span>`).join('') + `<span class="chk"><b>${d13 ? d13[12] : '?'}</b>${pesi ? '<i>check</i>' : ''}</span>`;
  }
  function disegna(anima) {
    const m = eanModuli(d13), W = 2.2, H = 80, x0 = 22; let s = '';
    m.forEach((x, i) => { if (!x.b) return; const lunga = x.k === -1; s += `<rect x="${x0 + i * W}" y="10" width="${W}" height="${lunga ? H + 10 : H}" class="barra${sel >= 0 && x.k === sel ? ' sel' : ''}${lunga ? ' guardia' : ''}" style="${anima ? `animation-delay:${i * 8}ms` : ''}"/>`; });
    s += `<text x="${x0 - 12}" y="${H + 24}" class="cn" data-k="0">${d13[0]}</text>`;
    for (let k = 1; k <= 12; k++) { const inizio = (k <= 6 ? 3 + (k - 1) * 7 : 3 + 42 + 5 + (k - 7) * 7) + 3.5; s += `<text x="${x0 + inizio * W}" y="${H + 24}" class="cn${sel === k ? ' sel' : ''}" data-k="${k}">${d13[k]}</text>`; }
    s += `<line x1="10" x2="10" y1="2" y2="${H + 30}" class="laser${anima ? ' va' : ''}"/>`;
    $q('.ean-svg').innerHTML = `<svg viewBox="0 0 260 ${H + 32}" class="ean-s${anima ? ' nuovo' : ''}">${s}</svg>`;
  }
  c.addEventListener('click', e => {
    const t = e.target.closest('.ean-s .cn'); if (!t || !d13) return; const k = +t.dataset.k;
    sel = k === sel ? -1 : k; disegna(false);
    $q('.ean-nota').innerHTML = k === 0 ? `La prima cifra (${d13[0]}) non ha barre proprie: decide se le 6 cifre di sinistra usano il codice L o G (schema ${EAN_P[+d13[0]]}).` :
      `La cifra ${d13[k]} in posizione ${k + 1} è scritta con 7 moduli: <code>${(k <= 6 ? (EAN_P[+d13[0]][k - 1] === 'L' ? EAN_L : EAN_G) : EAN_R)[+d13[k]]}</code> (codice ${k <= 6 ? EAN_P[+d13[0]][k - 1] : 'R'}; 1 = barra nera).`;
  });
  $q('[data-a=p]').onclick = () => cifre(true);
  $q('[data-a=c]').onclick = () => {
    const ok = $q('.ean-ris input').value.trim() === String(eanCheck(d12)), m = $q('.msg');
    if (primo) { st.tot++; if (ok) st.ok++; primo = false; up(); }
    if (!ok) { const s = [...d12].reduce((t, x, i) => t + (+x) * (i % 2 ? 3 : 1), 0); m.textContent = `No: la somma pesata è ${s}, ${s} mod 10 = ${s % 10}, quindi check = ${eanCheck(d12)}.`; m.style.color = 'var(--ko)'; cifre(true); return; }
    d13 = d12 + eanCheck(d12); m.textContent = 'Esatto! Ecco il codice a barre: fate clic su una cifra per vedere le sue barre.'; m.style.color = 'var(--ok)';
    $q('.ean-ris').hidden = true; cifre(false); disegna(true);
    setTimeout(() => { $q('.ean-nota').innerHTML = '<b>Bip!</b> Il lettore ha letto il codice e ricalcolato la cifra di controllo: torna, il codice è valido. Le barre lunghe ai lati e al centro sono le guardie, che dicono al lettore dove inizia e finisce.'; }, 1500);
  };
  $q('[data-a=n]').onclick = nuovo; up(); nuovo();
}

/* ---------- QR Code: le zone ---------- */
function zoneQR(n, ver) {
  const Z = Array.from({ length: n }, () => Array(n).fill('Area dati e correzione errori'));
  const metti = (r0, c0, h, w, z) => { for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) if (r >= 0 && c >= 0 && r < n && c < n) Z[r][c] = z; };
  for (let i = 8; i < n - 8; i++) { Z[6][i] = 'Timing Pattern'; Z[i][6] = 'Timing Pattern'; }
  /* format information: riga 8 e colonna 8 accanto ai tre finder (le celle dei timing restano timing) */
  for (let i = 0; i <= 8; i++) { if (i !== 6) { Z[8][i] = 'Format Information'; Z[i][8] = 'Format Information'; } }
  for (let i = n - 8; i < n; i++) { Z[8][i] = 'Format Information'; Z[i][8] = 'Format Information'; }
  if (ver >= 2) metti(n - 9, n - 9, 5, 5, 'Alignment Pattern');
  /* i finder con il loro separatore bianco */
  [[0, 0], [0, n - 7], [n - 7, 0]].forEach(([r, c]) => metti(r - 1, c - 1, 9, 9, 'Finder Pattern'));
  for (let i = 0; i <= 8; i++) { if (i !== 6 && i !== 7) { Z[8][i] = 'Format Information'; Z[i][8] = 'Format Information'; } }
  for (let i = n - 8; i < n; i++) { if (i > n - 8) Z[8][i] = 'Format Information'; if (i > n - 8) Z[i][8] = 'Format Information'; }
  return Z;
}
function qrLab(el, label = 'Le zone del QR Code') {
  const st = stat(label);
  const ZONE = ['Quiet Zone', 'Finder Pattern', 'Alignment Pattern', 'Timing Pattern', 'Format Information', 'Area dati e correzione errori'];
  const SPIEGA = { 'Quiet Zone': 'il bordo bianco di almeno 4 moduli che separa il codice da ciò che ha intorno', 'Finder Pattern': 'i tre quadrati agli angoli: dicono al lettore dov\'è il codice e come è girato', 'Alignment Pattern': 'il quadratino che corregge le deformazioni (dalla versione 2 in su)', 'Timing Pattern': 'le righe di moduli alternati che danno il passo della griglia', 'Format Information': 'la fascia attorno ai finder con il livello di correzione e la maschera', 'Area dati e correzione errori': 'il resto: i dati e i codici di correzione degli errori' };
  let Z, n, scelta = null, trovate, primo;
  el.innerHTML = `<div class="card qrl">${turn()}<div class="row qrl-in"><input type="text" value="https://teaching.federicodiluca.com" aria-label="Testo del QR" autocomplete="off"><button class="btn sec" data-a="g">Genera</button></div>
   <p class="q">Scegliete una zona e fate clic su un modulo che le appartiene. Quando la trovate, la zona si colora.</p><div class="url-tip qrl-z">${ZONE.map(z => `<button class="btn sec" data-z="${z}">${z}</button>`).join('')}</div>
   <div class="qrl-box"><div class="qrl-svg"></div><ul class="qrl-tr"></ul></div><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.qrl'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Zone trovate: ${trovate.size} su ${ZONE.length} · al primo colpo: ${st.ok} su ${st.tot}`;
  function genera() {
    const testo = $q('.qrl-in input').value || 'teaching'; const q = qrcode(0, 'M'); q.addData(testo); q.make(); n = q.getModuleCount();
    const ver = (n - 17) / 4; Z = zoneQR(n, ver); trovate = new Set(); primo = {};
    const M = 4, T = n + 2 * M; let s = `<rect x="0" y="0" width="${T}" height="${T}" class="qz${trovate.has('Quiet Zone') ? ' ok' : ''}" data-z="Quiet Zone"/>`;
    for (let r = 0; r < n; r++) for (let cc = 0; cc < n; cc++) s += `<rect x="${cc + M}" y="${r + M}" width="1.02" height="1.02" class="mod${q.isDark(r, cc) ? ' nero' : ''}" data-z="${Z[r][cc]}"/>`;
    $q('.qrl-svg').innerHTML = `<svg viewBox="0 0 ${T} ${T}" class="qrl-s" shape-rendering="crispEdges">${s}</svg><small>Versione ${ver}: ${n} × ${n} moduli (21 + 4 × ${ver - 1})</small>`;
    $q('.msg').textContent = ''; aggiorna();
  }
  function aggiorna() {
    c.querySelectorAll('.qrl-s [data-z]').forEach(r => r.classList.toggle('trovata', trovate.has(r.dataset.z)));
    c.querySelectorAll('.qrl-s [data-z]').forEach(r => { r.dataset.c = ZONE.indexOf(r.dataset.z); });
    $q('.qrl-tr').innerHTML = [...trovate].map(z => `<li class="z${ZONE.indexOf(z)}"><b>${z}</b>: ${SPIEGA[z]}</li>`).join('');
    up();
  }
  c.querySelectorAll('[data-z]').forEach(b => { if (b.tagName === 'BUTTON') b.onclick = () => { scelta = b.dataset.z; c.querySelectorAll('.qrl-z [data-z]').forEach(x => x.classList.toggle('on', x === b)); }; });
  c.addEventListener('click', e => {
    const r = e.target.closest('.qrl-s [data-z]'); if (!r) return; const m = $q('.msg');
    if (!scelta) { m.textContent = 'Prima scegliete una zona.'; m.style.color = 'var(--mute)'; return; }
    const ok = r.dataset.z === scelta; if (!(scelta in primo)) { primo[scelta] = ok; st.tot++; if (ok) st.ok++; }
    if (!ok) { m.textContent = `No: quello fa parte di «${r.dataset.z}».`; m.style.color = 'var(--ko)'; up(); return; }
    trovate.add(scelta); m.textContent = trovate.size === ZONE.length ? 'Avete trovato tutte le zone!' : 'Trovata!'; m.style.color = 'var(--ok)'; aggiorna();
  });
  $q('[data-a=g]').onclick = genera; $q('.qrl-in input').onkeydown = e => { if (e.key === 'Enter') genera(); };
  genera();
}
