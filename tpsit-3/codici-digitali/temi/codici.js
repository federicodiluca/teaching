/* I codici digitali (TPSIT 3): giochi ad hoc. Solo definizioni: va caricato dopo assets/giochi.js.
   - hammingVenn(el, etichetta): Hamming (7,4) con i tre cerchi; si calcolano i bit di controllo, poi il rumore inverte un bit
     e si trova quale guardando i cerchi con la parità sbagliata. Parità pari, controlli nelle posizioni 1, 2, 4.
   - paritaGriglia(el, etichetta): parità incrociata (VRC per parola, LRC per colonna); un bit arriva sbagliato e si trova la casella.
   - crcPasso(el, etichetta): la divisione del CRC con gli XOR, un passo alla volta.
   - setteSegmenti(el, etichetta): un display a 7 segmenti da comporre o da leggere, con il codice abcdefg.
   - encoderGray(el, etichetta): un disco da girare letto in binario e in Gray; nei passaggi tra settori si vedono le letture possibili.
   Gli stili sono in assets/giochi.css (sezione "simulatori"). */
const BIT = (n, k) => n.toString(2).padStart(k, '0');

/* ---------- Hamming (7,4) con i cerchi ---------- */
const POS_VENN = { 1: [118, 118], 2: [342, 118], 4: [230, 322], 3: [230, 104], 5: [163, 226], 6: [297, 226], 7: [230, 186] };
const CERCHI_VENN = { 1: [170, 150, [1, 3, 5, 7]], 2: [290, 150, [2, 3, 6, 7]], 4: [230, 252, [4, 5, 6, 7]] };
function hammingVenn(el, label = 'Hamming con i cerchi') {
  const st = stat(label);
  let B, fase, errore, primo, timer;
  el.innerHTML = `<div class="card hv">${turn()}<div class="row"><button class="btn sec" data-a="n">Nuovi dati</button><span class="hv-fase"></span></div>
   <p class="q hv-dom"></p><div class="hv-box"><div class="hv-svg"></div><div class="hv-cw"></div></div>
   <div class="row hv-azioni"></div><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.hv'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Risposte giuste al primo colpo: ${st.ok} su ${st.tot}`;
  const pari = (cw, k) => CERCHI_VENN[k][2].reduce((s, p) => s + cw[p], 0) % 2 === 0;
  function nuovo() {
    clearTimeout(timer); B = { 1: 0, 2: 0, 4: 0 }; [3, 5, 6, 7].forEach(p => B[p] = rnd(0, 1)); fase = 'codifica'; errore = null; primo = true; $q('.msg').textContent = '';
    $q('.hv-fase').textContent = '1. Codifica';
    $q('.hv-dom').innerHTML = `Dati da trasmettere: <b>${[3, 5, 6, 7].map(p => B[p]).join('')}</b> (posizioni 3, 5, 6, 7). Fate clic sui bit di controllo <b>1, 2, 4</b> per metterli a 0 o 1: ogni cerchio deve avere un numero <b>pari</b> di 1.`;
    $q('.hv-azioni').innerHTML = '<button class="btn" data-a="v">Verifica la codeword</button>'; disegna();
  }
  function disegna(evid) {
    let s = '';
    Object.entries(CERCHI_VENN).forEach(([k, [x, y]]) => { const ok = pari(B, +k); s += `<circle cx="${x}" cy="${y}" r="112" class="cerchio c${k} ${fase === 'codifica' || fase === 'fine' ? (ok ? 'pari' : '') : fase === 'ricevuto' ? (ok ? 'pari' : 'dispari') : ''}"/>`; });
    Object.entries(CERCHI_VENN).forEach(([k, [x, y]]) => { s += `<text x="${x + (k === '1' ? -95 : k === '2' ? 95 : 0)}" y="${y + (k === '4' ? 128 : -100)}" class="cn">controllo ${k}</text>`; });
    Object.entries(POS_VENN).forEach(([p, [x, y]]) => { const ctrl = [1, 2, 4].includes(+p), cl = (fase === 'codifica' && ctrl) || fase === 'ricevuto';
      s += `<g class="bit${ctrl ? ' ctrl' : ''}${cl ? ' clic' : ''}${evid === +p ? ' evid' : ''}${B[p] ? ' uno' : ''}" data-p="${p}" transform="translate(${x},${y})"><circle r="22"/><text y="7">${B[p]}</text><text y="38" class="pn">pos ${p}</text></g>`; });
    $q('.hv-svg').innerHTML = `<svg viewBox="0 0 460 400" class="hv-s">${s}</svg>`;
    $q('.hv-cw').innerHTML = `<small>Codeword (posizioni 1 → 7)</small><div>${[1, 2, 3, 4, 5, 6, 7].map(p => `<span class="${[1, 2, 4].includes(p) ? 'ctrl' : ''}${evid === p ? ' evid' : ''}"><b>${B[p]}</b><i>${p}</i></span>`).join('')}</div>`;
  }
  c.addEventListener('click', e => {
    const g = e.target.closest('.bit.clic'); if (!g) return; const p = +g.dataset.p;
    if (fase === 'codifica') { B[p] ^= 1; disegna(); return; }
    if (fase === 'ricevuto') rispondi(p);
  });
  c.addEventListener('click', e => {
    const b = e.target.closest('.hv-azioni [data-a]'); if (!b) return; const a = b.dataset.a, m = $q('.msg');
    if (a === 'v') {
      const ok = [1, 2, 4].every(k => pari(B, k));
      if (primo) { st.tot++; if (ok) st.ok++; primo = false; up(); }
      if (!ok) { m.textContent = 'Non ancora: i cerchi non verdi hanno un numero dispari di 1.'; m.style.color = 'var(--ko)'; return; }
      m.textContent = 'Codeword giusta! Ora mandatela nel canale rumoroso.'; m.style.color = 'var(--ok)';
      fase = 'pronto'; $q('.hv-fase').textContent = '2. Trasmissione'; $q('.hv-azioni').innerHTML = '<button class="btn" data-a="t">⚡ Invia nel canale rumoroso</button>'; disegna();
    }
    if (a === 't') {
      errore = Math.random() < 0.15 ? 0 : rnd(1, 7); if (errore) B[errore] ^= 1; primo = true;
      $q('.hv-svg').classList.add('fulmine'); timer = setTimeout(() => $q('.hv-svg').classList.remove('fulmine'), 600);
      fase = 'ricevuto'; $q('.hv-fase').textContent = '3. Ricezione'; m.textContent = '';
      $q('.hv-dom').innerHTML = 'Il ricevitore controlla i tre cerchi: quelli <b class="ko">rossi</b> hanno la parità sbagliata. Fate clic sul bit che il rumore ha cambiato, oppure dite che non ci sono errori.';
      $q('.hv-azioni').innerHTML = '<button class="btn sec" data-a="0">Nessun errore</button>'; disegna();
    }
    if (a === '0') rispondi(0);
    if (a === 'n') nuovo();
  });
  function rispondi(p) {
    const ok = p === errore, m = $q('.msg'), sbag = [1, 2, 4].filter(k => !pari(B, k));
    if (primo) { st.tot++; if (ok) st.ok++; primo = false; up(); }
    const sindrome = sbag.reduce((s, k) => s + k, 0);
    const spieg = sbag.length ? `Cerchi sbagliati: ${sbag.join(' e ')}. La somma ${sbag.join(' + ')} = ${sindrome} è la posizione del bit sbagliato.` : 'Tutti i cerchi sono pari: nessun errore.';
    if (!ok) { m.textContent = 'No. ' + spieg; m.style.color = 'var(--ko)'; disegna(errore || undefined); return; }
    if (errore) B[errore] ^= 1;
    m.textContent = 'Esatto! ' + spieg + (errore ? ' Il bit è stato corretto.' : ''); m.style.color = 'var(--ok)';
    fase = 'fine'; $q('.hv-fase').textContent = 'Corretto'; $q('.hv-azioni').innerHTML = '<button class="btn" data-a="t">⚡ Invia di nuovo</button><button class="btn sec" data-a="n">Nuovi dati</button>'; disegna();
  }
  $q('[data-a=n]').onclick = nuovo; up(); nuovo();
}

/* ---------- parità incrociata ---------- */
function paritaGriglia(el, label = 'La parità incrociata') {
  const st = stat(label);
  let W, R, err, primo, mostra;
  el.innerHTML = `<div class="card pg2">${turn()}<div class="row"><button class="btn sec" data-a="n">Nuovo blocco</button><label class="pg2-chk"><input type="checkbox"> mostra i controlli di righe e colonne</label></div>
   <p class="q">Questo blocco è arrivato con la parità incrociata (parità pari): l'ultima colonna è il VRC di ogni parola, l'ultima riga è l'LRC. Un bit è sbagliato: fate clic sulla casella guasta.</p>
   <div class="pg2-gr"></div><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.pg2'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Caselle trovate al primo colpo: ${st.ok} su ${st.tot}`;
  function nuovo() {
    const n = 4, k = 4; W = Array.from({ length: n }, () => Array.from({ length: k }, () => rnd(0, 1)));
    R = W.map(r => [...r, r.reduce((a, b) => a ^ b, 0)]); R.push(R[0].map((_, j) => R.reduce((a, r) => a ^ r[j], 0)));
    err = [rnd(0, n - 1), rnd(0, k - 1)]; R[err[0]][err[1]] ^= 1; primo = true; $q('.msg').textContent = ''; disegna();
  }
  function disegna(giusta) {
    const rOk = R.map(r => r.reduce((a, b) => a ^ b, 0) === 0), cOk = R[0].map((_, j) => R.reduce((a, r) => a ^ r[j], 0) === 0);
    $q('.pg2-gr').innerHTML = `<table class="pg2-t"><tr><th></th>${R[0].map((_, j) => `<th>${j < R[0].length - 1 ? 'bit ' + (j + 1) : 'VRC'}</th>`).join('')}${mostra ? '<th></th>' : ''}</tr>` +
      R.map((r, i) => `<tr><th>${i < R.length - 1 ? 'parola ' + (i + 1) : 'LRC'}</th>${r.map((b, j) => `<td class="${j === r.length - 1 || i === R.length - 1 ? 'par' : ''}${mostra && (!rOk[i] || !cOk[j]) ? ' sosp' : ''}${mostra && !rOk[i] && !cOk[j] ? ' incrocio' : ''}${giusta && giusta[0] === i && giusta[1] === j ? ' giusta' : ''}" data-i="${i}" data-j="${j}">${b}</td>`).join('')}${mostra ? `<td class="ck ${rOk[i] ? 'ok' : 'ko'}">${rOk[i] ? '✓' : '✗'}</td>` : ''}</tr>`).join('') +
      (mostra ? `<tr><th></th>${cOk.map(o => `<td class="ck ${o ? 'ok' : 'ko'}">${o ? '✓' : '✗'}</td>`).join('')}<td></td></tr>` : '') + '</table>';
  }
  c.addEventListener('click', e => {
    const td = e.target.closest('.pg2-t td[data-i]'); if (!td) return; const i = +td.dataset.i, j = +td.dataset.j, ok = i === err[0] && j === err[1], m = $q('.msg');
    if (primo) { st.tot++; if (ok) st.ok++; primo = false; up(); }
    if (!ok) { m.textContent = 'No: contate gli 1 di quella riga e di quella colonna. La casella guasta è all\'incrocio della riga e della colonna con la parità sbagliata.'; m.style.color = 'var(--ko)'; td.classList.add('scossa'); setTimeout(() => td.classList.remove('scossa'), 400); return; }
    R[i][j] ^= 1; m.textContent = `Esatto: parola ${i + 1}, bit ${j + 1}. Invertendolo, tutte le righe e le colonne tornano pari.`; m.style.color = 'var(--ok)'; disegna([i, j]);
  });
  $q('.pg2-chk input').onchange = e => { mostra = e.target.checked; disegna(); };
  $q('[data-a=n]').onclick = nuovo; up(); nuovo();
}

/* ---------- CRC passo passo ---------- */
function crcPasso(el, label = 'Il CRC passo passo') {
  stat(label);
  let M, G, righe, k;
  el.innerHTML = `<div class="card crc">${turn()}<div class="row"><button class="btn sec" data-a="n">Altro messaggio</button><span class="crc-pos"></span></div>
   <p class="q crc-t"></p><div class="crc-div"></div><p class="crc-nota"></p>
   <div class="row"><button class="btn sec" data-a="i">◀ Indietro</button><button class="btn" data-a="a">Avanti ▶</button></div></div>`;
  const c = el.querySelector('.crc'), $q = s => c.querySelector(s);
  function nuovo() {
    G = pick(['1011', '1101']); const r = G.length - 1; M = BIT(rnd(8, 31), 5);
    const a = (M + '0'.repeat(r)).split('').map(Number); righe = [{ v: a.slice(), nota: `Al messaggio ${M} si aggiungono ${r} zeri (tanti quanti il grado del generatore ${G}).` }];
    for (let i = 0; i <= a.length - G.length; i++) {
      if (a[i] === 1) { for (let j = 0; j < G.length; j++) a[i + j] ^= +G[j]; righe.push({ v: a.slice(), da: i, nota: `Il primo 1 è in posizione ${i + 1}: sotto si scrive il generatore e si fa lo XOR bit per bit (1 se i bit sono diversi).` }); }
    }
    righe.push({ v: a.slice(), fine: true, nota: `Rimangono solo zeri a sinistra: il resto è <b>${a.slice(-r).join('')}</b>. Si trasmette ${M}<b>${a.slice(-r).join('')}</b>; chi riceve divide di nuovo e, se non ci sono errori, ottiene resto 0.` });
    $q('.crc-t').innerHTML = `Messaggio <b>${M}</b>, generatore <b>G = ${G}</b>.`; k = 0; disegna();
  }
  function disegna() {
    const n = righe[0].v.length; let h = '';
    righe.slice(0, k + 1).forEach((r, i) => {
      if (r.fine) return;
      if (i > 0) h += `<div class="crc-r g">${' '.repeat(r.da)}${G}<span>XOR</span></div>`;
      h += `<div class="crc-r${i === k ? ' ora' : ''}${i > 0 ? ' ris' : ''}">${r.v.map((b, j) => `<b class="${i > 0 && j >= r.da && j < r.da + G.length ? 'tocca' : ''}${j >= n - (G.length - 1) ? ' resto' : ''}">${b}</b>`).join('')}</div>`;
    });
    $q('.crc-div').innerHTML = h; $q('.crc-nota').innerHTML = righe[k].nota; $q('.crc-pos').textContent = `Passo ${k + 1} di ${righe.length}`;
    $q('[data-a=i]').disabled = k === 0; $q('[data-a=a]').disabled = k === righe.length - 1;
  }
  $q('[data-a=a]').onclick = () => { if (k < righe.length - 1) { k++; disegna(); } };
  $q('[data-a=i]').onclick = () => { if (k > 0) { k--; disegna(); } };
  $q('[data-a=n]').onclick = nuovo; nuovo();
}

/* ---------- display a 7 segmenti ---------- */
const SEG7 = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', A: 'abcefg', b: 'cdefg', C: 'adef', d: 'bcdeg', E: 'adefg', F: 'aefg' };
const FORMA_SEG = { a: 'M30 10H90L80 20H40Z', b: 'M92 12L102 22V78L92 88L82 78V22Z', c: 'M92 112L102 122V178L92 188L82 178V122Z', d: 'M30 190H90L80 180H40Z', e: 'M28 112L38 122V178L28 188L18 178V122Z', f: 'M28 12L38 22V78L28 88L18 78V22Z', g: 'M30 100L40 90H80L90 100L80 110H40Z' };
function setteSegmenti(el, label = 'Il display a 7 segmenti') {
  const st = stat(label);
  let modo = 'componi', liv = 1, cif, acc, primo;
  el.innerHTML = `<div class="card s7">${turn()}<div class="row"><button class="btn sec on" data-m="componi">Componi la cifra</button><button class="btn sec" data-m="leggi">Leggi il display</button><select class="s7-liv"><option value="1">Cifre 0-9</option><option value="2">Anche esadecimali A-F</option></select></div>
   <p class="q s7-dom"></p><div class="s7-box"><div class="s7-svg"></div><div class="s7-cod"></div></div><div class="row s7-az"></div><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.s7'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Giusti al primo colpo: ${st.ok} su ${st.tot}`;
  const cifre = () => Object.keys(SEG7).filter(k => liv === 2 || /\d/.test(k));
  function nuovo() {
    cif = pick(cifre()); primo = true; $q('.msg').textContent = '';
    acc = modo === 'componi' ? '' : SEG7[cif];
    $q('.s7-dom').innerHTML = modo === 'componi' ? `Accendete i segmenti per mostrare <b class="s7-big">${cif}</b>: fate clic sui segmenti.` : 'Quale simbolo mostra il display?';
    $q('.s7-az').innerHTML = modo === 'componi' ? '<button class="btn" data-a="v">Verifica</button><button class="btn sec" data-a="n">Altro</button>' : cifre().map(k => `<button class="btn sec s7-r" data-r="${k}">${k}</button>`).join('');
    disegna();
  }
  function disegna() {
    $q('.s7-svg').innerHTML = `<svg viewBox="0 0 120 200" class="s7-s"><rect x="4" y="2" width="112" height="196" rx="10" class="fondo"/>${'abcdefg'.split('').map(s => `<path d="${FORMA_SEG[s]}" class="seg${acc.includes(s) ? ' on' : ''}${modo === 'componi' ? ' clic' : ''}" data-s="${s}"/><text class="sl" ${posLett(s)}>${s}</text>`).join('')}</svg>`;
    $q('.s7-cod').innerHTML = `<small>Codice a b c d e f g</small><div>${'abcdefg'.split('').map(s => `<span class="${acc.includes(s) ? 'uno' : ''}"><i>${s}</i><b>${acc.includes(s) ? 1 : 0}</b></span>`).join('')}</div>`;
  }
  function posLett(s) { const p = { a: [60, 30], b: [72, 52], c: [72, 152], d: [60, 172], e: [48, 152], f: [48, 52], g: [60, 120] }[s]; return `x="${p[0]}" y="${p[1]}"`; }
  c.addEventListener('click', e => {
    const p = e.target.closest('.seg.clic'); if (p) { const s = p.dataset.s; acc = acc.includes(s) ? acc.replace(s, '') : acc + s; disegna(); return; }
    const r = e.target.closest('.s7-r'); if (r) { const ok = r.dataset.r === cif, m = $q('.msg'); if (primo) { st.tot++; if (ok) st.ok++; primo = false; up(); }
      m.textContent = ok ? 'Esatto!' : `No: è ${cif}.`; m.style.color = ok ? 'var(--ok)' : 'var(--ko)'; if (ok) setTimeout(nuovo, 900); return; }
    const b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'n') nuovo();
    if (b.dataset.a === 'v') { const ok = [...'abcdefg'].every(s => acc.includes(s) === SEG7[cif].includes(s)), m = $q('.msg'); if (primo) { st.tot++; if (ok) st.ok++; primo = false; up(); }
      m.textContent = ok ? 'Esatto!' : `Non ancora: per ${cif} servono i segmenti ${SEG7[cif].split('').join(', ')}.`; m.style.color = ok ? 'var(--ok)' : 'var(--ko)'; }
  });
  c.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { modo = b.dataset.m; c.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x === b)); nuovo(); });
  $q('.s7-liv').onchange = () => { liv = +$q('.s7-liv').value; nuovo(); };
  up(); nuovo();
}

/* ---------- encoder rotativo: binario contro Gray ---------- */
function encoderGray(el, obiettivi, label = 'Encoder: binario o Gray?') {
  const st = stat(label);
  let ang = 22.5, fatti = obiettivi.map(() => false);
  el.innerHTML = `<div class="card enc">${turn()}<ol class="git-mis"></ol><label class="enc-sl">Girate il disco<input type="range" min="0" max="359.5" step="0.5" value="22.5"></label>
   <div class="enc-box"><div><b>Disco in binario</b><div class="enc-d" data-t="b"></div><p class="enc-l" data-t="b"></p></div><div><b>Disco in Gray</b><div class="enc-d" data-t="g"></div><p class="enc-l" data-t="g"></p></div></div>
   <p class="enc-nota"></p><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.enc'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Obiettivi raggiunti: ${fatti.filter(Boolean).length} su ${obiettivi.length}`;
  const cod = (n, t) => t === 'g' ? n ^ (n >> 1) : n;
  function disco(t) {
    let s = '';
    for (let n = 0; n < 8; n++) { const v = cod(n, t);
      for (let b = 0; b < 3; b++) { const r1 = 22 + b * 22, r2 = r1 + 20, a1 = (n * 45 - 90) * Math.PI / 180, a2 = ((n + 1) * 45 - 90) * Math.PI / 180, on = (v >> (2 - b)) & 1;
        const P = (r, a) => `${100 + r * Math.cos(a)} ${100 + r * Math.sin(a)}`;
        s += `<path d="M${P(r1, a1)}L${P(r2, a1)}A${r2} ${r2} 0 0 1 ${P(r2, a2)}L${P(r1, a2)}A${r1} ${r1} 0 0 0 ${P(r1, a1)}Z" class="${on ? 'ner' : 'bia'}"/>`; }
      }
    let num = '';   /* i numeri dei settori restano dritti, fuori dagli anelli */
    for (let n = 0; n < 8; n++) { const am = ((n + .5) * 45 - 90 - ang) * Math.PI / 180; num += `<text x="${100 + 94 * Math.cos(am)}" y="${100 + 94 * Math.sin(am) + 4}" class="ns">${n}</text>`; }
    return `<svg viewBox="-8 -8 216 216" class="enc-s"><g style="transform:rotate(${-ang}deg);transform-origin:100px 100px">${s}</g>${num}<path d="M100 8V44" class="testina"/><circle cx="100" cy="100" r="6" class="perno"/></svg>`;
  }
  function aggiorna() {
    ang = +$q('.enc-sl input').value;
    const pos = ang / 45, n = Math.floor(pos) % 8, frac = pos - Math.floor(pos), bordo = frac < 0.06 || frac > 0.94;
    const a = frac > 0.5 ? n : (n + 7) % 8, b = (a + 1) % 8;   /* settori ai due lati del bordo */
    let stato = {};
    ['b', 'g'].forEach(t => {
      $q(`.enc-d[data-t=${t}]`).innerHTML = disco(t);
      const l = $q(`.enc-l[data-t=${t}]`);
      if (!bordo) { const v = cod(n, t); l.innerHTML = `Letto: <code>${BIT(v, 3)}</code> → settore <b>${n}</b>`; l.className = 'enc-l'; return; }
      const va = cod(a, t), vb = cod(b, t), diff = va ^ vb, cambi = BIT(diff, 3).split('').filter(x => x === '1').length;
      const poss = []; for (let m = 0; m < 8; m++) if ((m & ~diff) === (va & ~diff)) poss.push(m);
      const strane = poss.filter(v => v !== va && v !== vb);
      l.innerHTML = `Tra il settore ${a} e il ${b} cambiano <b>${cambi}</b> bit. Letture possibili mentre i sensori scattano: ${poss.map(v => `<code class="${v === va || v === vb ? '' : 'falsa'}">${BIT(v, 3)}</code>`).join(' ')}`;
      l.className = 'enc-l ' + (strane.length ? 'male' : 'bene');
      stato[t] = { a, b, cambi, false: strane.length };
    });
    $q('.enc-nota').innerHTML = bordo ? (stato.b && stato.b.false ? `<b>Attenzione:</b> in binario, per un istante, il disco può essere letto come un settore che non c'entra niente (in rosso). In Gray cambia un bit solo: la lettura è sempre uno dei due settori vicini.` : 'In questo passaggio cambia un solo bit in entrambi i dischi.') : 'Fermatevi esattamente sul confine tra due settori per vedere che cosa succede.';
    const s = { bordo, a, b, cambiB: stato.b ? stato.b.cambi : 0 };
    obiettivi.forEach((o, i) => { if (!fatti[i] && o.ok(s)) { fatti[i] = true; st.tot++; st.ok++; const m = $q('.msg'); m.textContent = fatti.every(Boolean) ? 'Tutti gli obiettivi raggiunti!' : 'Obiettivo raggiunto!'; m.style.color = 'var(--ok)'; } });
    $q('.git-mis').innerHTML = obiettivi.map((o, i) => `<li class="${fatti[i] ? 'fatta' : ''}">${fatti[i] ? '✔ ' : ''}${o.t}</li>`).join(''); up();
  }
  $q('.enc-sl input').oninput = aggiorna; aggiorna();
}
