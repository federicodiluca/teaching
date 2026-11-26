/* Codici pesati (TPSIT 3): dentro UTF-8 e la somma in BCD. Solo definizioni: va caricato dopo assets/giochi.js.
   - utf8Lab(el, etichetta): si scrive un carattere qualsiasi e si vedono code point e byte UTF-8 con i bit colorati;
     in modalità sfida si costruiscono i bit dei byte facendo clic.
   - bcdSomma(el, etichetta): la somma in BCD cifra per cifra, con la correzione +6 (0110) quando una cifra supera 9.
   Gli stili sono in assets/giochi.css (sezione "simulatori"). */
const BITS = (n, k) => n.toString(2).padStart(k, '0');
/* i byte UTF-8 di un code point: [{pre: bit fissi, dati: bit del code point}] */
function utf8Byte(cp) {
  if (cp < 0x80) return [{ pre: '0', dati: BITS(cp, 7) }];
  const n = cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4, tot = [0, 0, 11, 16, 21][n], b = BITS(cp, tot), out = [];
  const primo = 7 - n; out.push({ pre: '1'.repeat(n) + '0', dati: b.slice(0, primo) });
  for (let i = 0, p = primo; i < n - 1; i++, p += 6) out.push({ pre: '10', dati: b.slice(p, p + 6) });
  return out;
}
const hexByte = y => parseInt(y.pre + y.dati, 2).toString(16).toUpperCase().padStart(2, '0');
function utf8Lab(el, label = 'Dentro UTF-8') {
  const st = stat(label);
  const SFIDE = ['é', 'à', 'ü', 'ñ', 'ç', 'ß', 'Ω', 'π', '€', '©', 'A', 'z', '😀'];
  let modo = 'esplora', ch, mio, primo;
  el.innerHTML = `<div class="card u8">${turn()}<div class="row"><button class="btn sec on" data-m="esplora">Esplora</button><button class="btn sec" data-m="sfida">Sfida: costruite i byte</button></div>
   <div class="row u8-in"><label>Carattere <input type="text" value="è" maxlength="2" autocomplete="off"></label><button class="btn sec" data-a="n">Altro carattere</button></div>
   <div class="u8-info"></div><div class="u8-byte"></div><div class="row u8-az"></div><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.u8'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = modo === 'sfida' ? `Caratteri codificati giusti al primo colpo: ${st.ok} su ${st.tot}` : '';
  function carica() {
    const t = $q('.u8-in input').value; ch = [...t][0] || 'A'; const cp = ch.codePointAt(0), B = utf8Byte(cp);
    mio = B.map(y => y.dati.replace(/./g, '0')); primo = true; $q('.msg').textContent = '';
    const fascia = cp < 0x80 ? 'U+0000 - U+007F: 1 byte (come l\'ASCII)' : cp < 0x800 ? 'U+0080 - U+07FF: 2 byte' : cp < 0x10000 ? 'U+0800 - U+FFFF: 3 byte' : 'oltre U+FFFF: 4 byte';
    const tot = B.reduce((s, y) => s + y.dati.length, 0);
    $q('.u8-info').innerHTML = `<span class="u8-ch">${escH(ch)}</span><div><b>Code point U+${cp.toString(16).toUpperCase().padStart(4, '0')}</b> = ${cp} in decimale<br>${fascia}<br>${modo === 'esplora' ? `in binario su ${tot} bit: <code class="u8-cp">${B.map((y, i) => `<span class="d${i}">${y.dati}</span>`).join('')}</code>` : `in binario su ${tot} bit: <code>${BITS(cp, tot)}</code>`}</div>`;
    disegna(B);
    $q('.u8-az').innerHTML = modo === 'sfida' ? '<button class="btn" data-a="v">Verifica</button>' : '';
    up();
  }
  function disegna(B, ok) {
    $q('.u8-byte').innerHTML = B.map((y, i) => `<div class="u8-b"><small>byte ${i + 1}</small><div>${[...y.pre].map(b => `<span class="fis">${b}</span>`).join('')}${[...(modo === 'esplora' ? y.dati : mio[i])].map((b, j) => `<span class="dat d${i}${modo === 'sfida' ? ' clic' : ''}" data-i="${i}" data-j="${j}">${b}</span>`).join('')}</div><b class="hx">${modo === 'esplora' || ok ? hexByte(y) : '??'}</b></div>`).join('');
  }
  c.addEventListener('click', e => {
    const s = e.target.closest('.dat.clic'); if (s) { const i = +s.dataset.i, j = +s.dataset.j, a = [...mio[i]]; a[j] = a[j] === '1' ? '0' : '1'; mio[i] = a.join(''); disegna(utf8Byte(ch.codePointAt(0))); return; }
    const b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'n') { $q('.u8-in input').value = modo === 'sfida' ? pick(SFIDE.filter(x => x !== ch)) : pick(SFIDE); carica(); }
    if (b.dataset.a === 'v') { const B = utf8Byte(ch.codePointAt(0)), ok = B.every((y, i) => y.dati === mio[i]), m = $q('.msg');
      if (primo) { st.tot++; if (ok) st.ok++; primo = false; up(); }
      if (ok) { disegna(B, true); m.textContent = `Esatto! In UTF-8 «${ch}» è ${B.map(hexByte).join(' ')}.`; m.style.color = 'var(--ok)'; }
      else { m.textContent = 'Non ancora: i bit del code point vanno, nell\'ordine, negli spazi liberi dei byte (i bit fissi grigi non si toccano).'; m.style.color = 'var(--ko)'; } }
  });
  $q('.u8-in input').oninput = carica;
  c.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { modo = b.dataset.m; c.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x === b)); if (modo === 'sfida') $q('.u8-in input').value = pick(SFIDE); carica(); });
  carica();
}

/* ---------- somma in BCD ---------- */
function bcdSomma(el, label = 'La somma in BCD') {
  stat(label);
  let a, b, passi, k;
  el.innerHTML = `<div class="card bcd">${turn()}<div class="row"><button class="btn sec" data-a="n">Altra somma</button><span class="bcd-pos"></span></div>
   <p class="q bcd-t"></p><div class="bcd-gr"></div><p class="bcd-nota"></p>
   <div class="row"><button class="btn sec" data-a="i">◀ Indietro</button><button class="btn" data-a="a">Avanti ▶</button></div></div>`;
  const c = el.querySelector('.bcd'), $q = s => c.querySelector(s);
  const n4 = x => BITS(x, 4);
  function nuovo() {
    do { a = rnd(15, 89); b = rnd(15, 89); } while (a + b > 99 || ((a % 10) + (b % 10) <= 9 && Math.random() < 0.7));
    const ua = a % 10, ub = b % 10, da = Math.floor(a / 10), db = Math.floor(b / 10), su = ua + ub, rip = su > 9 ? 1 : 0, sd = da + db + rip;
    passi = [
      { nota: `Ogni cifra decimale si scrive con 4 bit: ${a} = ${n4(da)} ${n4(ua)}, ${b} = ${n4(db)} ${n4(ub)}.`, u: null, d: null },
      { nota: `Unità: ${n4(ua)} + ${n4(ub)} = ${BITS(su, 5).replace(/^0/, '')} (${su}).` + (su > 9 ? ' Supera 9: in BCD non è una cifra valida!' : ' Non supera 9: va bene così.'), u: { v: su, corr: false }, d: null },
      ...(su > 9 ? [{ nota: `Correzione: si aggiunge 6 = 0110. ${BITS(su, 5)} + 0110 = ${BITS(su + 6, 5)}: le ultime 4 cifre sono l'unità (${n4(su - 10)} = ${su - 10}), il primo 1 è il riporto sulle decine.`, u: { v: su - 10, corr: true }, d: null, rip: true }] : []),
      { nota: `Decine: ${n4(da)} + ${n4(db)}${rip ? ' + riporto 1' : ''} = ${n4(sd)} (${sd}).`, u: { v: su > 9 ? su - 10 : su, corr: su > 9 }, d: { v: sd } },
      { nota: `Risultato in BCD: ${n4(sd)} ${n4(su > 9 ? su - 10 : su)} = ${a + b}. Se avessimo sommato in binario puro senza correzione, il risultato non si leggerebbe cifra per cifra.`, u: { v: su > 9 ? su - 10 : su, corr: su > 9 }, d: { v: sd }, fine: true }];
    $q('.bcd-t').innerHTML = `Calcoliamo in BCD <b>${a} + ${b}</b>.`; k = 0; disegna();
  }
  function disegna() {
    const p = passi[k], ua = a % 10, ub = b % 10, da = Math.floor(a / 10), db = Math.floor(b / 10);
    const cella = (v, cls = '') => `<td class="${cls}">${v === null || v === undefined ? '' : v}</td>`;
    $q('.bcd-gr').innerHTML = `<table class="bcd-t"><tr><th></th><th>decine</th><th>unità</th><th></th></tr>
      <tr><th></th>${cella(p.rip || (passi[k].d && (a % 10) + (b % 10) > 9) ? 'riporto 1' : '', 'rip')}${cella('')}<td></td></tr>
      <tr><th>${a}</th>${cella(n4(da))}${cella(n4(ua))}<td>${a}</td></tr>
      <tr><th>+ ${b}</th>${cella(n4(db))}${cella(n4(ub))}<td>${b}</td></tr>
      <tr class="som"><th>=</th>${cella(p.d ? n4(p.d.v) : '', p.d ? 'nuovo' : '')}${cella(p.u ? (p.u.v > 9 ? BITS(p.u.v, 5) : n4(p.u.v)) : '', p.u ? (p.u.v > 9 ? 'nonval' : p.u.corr ? 'corr' : 'nuovo') : '')}<td>${p.fine ? a + b : ''}</td></tr></table>`;
    $q('.bcd-nota').innerHTML = p.nota; $q('.bcd-pos').textContent = `Passo ${k + 1} di ${passi.length}`;
    $q('[data-a=i]').disabled = k === 0; $q('[data-a=a]').disabled = k === passi.length - 1;
  }
  $q('[data-a=a]').onclick = () => { if (k < passi.length - 1) { k++; disegna(); } };
  $q('[data-a=i]').onclick = () => { if (k > 0) { k--; disegna(); } };
  $q('[data-a=n]').onclick = nuovo; nuovo();
}
