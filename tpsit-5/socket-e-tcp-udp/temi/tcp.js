/* Socket e TCP/UDP (TPSIT 5): handshake TCP su un diagramma di sequenza. Solo definizioni: va caricato dopo assets/giochi.js.
   tcpLab(el, etichetta): apertura a tre vie, invio di dati e chiusura. Per ogni segmento si prevedono i flag e i numeri
   seq e ack, poi il segmento viaggia sul diagramma. I numeri iniziali sono casuali, come nei sistemi veri.
   Gli stili sono in giochi.css (sezione "simulatori"). */
function segmentiTCP() {
  const x = rnd(100, 900), y = rnd(1000, 9000), d = pick([100, 200, 300, 500]), r = pick([50, 80, 120]);
  return {
    x, y, d, r, seg: [
      { da: 'C', f: 'SYN', seq: x, ack: null, fase: 'Apertura', nota: `Il client chiede di aprire la connessione e sceglie il suo numero di sequenza iniziale (${x}).` },
      { da: 'S', f: 'SYN+ACK', seq: y, ack: x + 1, fase: 'Apertura', nota: `Il server accetta: sceglie il suo numero iniziale (${y}) e riscontra il SYN con ack = ${x} + 1.` },
      { da: 'C', f: 'ACK', seq: x + 1, ack: y + 1, fase: 'Apertura', nota: 'Il client riscontra il SYN del server: la connessione è aperta (three-way handshake).' },
      { da: 'C', f: 'ACK', seq: x + 1, ack: y + 1, dati: d, fase: 'Dati', nota: `Il client invia ${d} byte: seq indica il numero del primo byte inviato.` },
      { da: 'S', f: 'ACK', seq: y + 1, ack: x + 1 + d, dati: r, fase: 'Dati', nota: `Il server riscontra: ack = ${x + 1} + ${d}, cioè il prossimo byte che si aspetta. Intanto invia ${r} byte di risposta.` },
      { da: 'C', f: 'ACK', seq: x + 1 + d, ack: y + 1 + r, fase: 'Dati', nota: `Il client riscontra i ${r} byte del server.` },
      { da: 'C', f: 'FIN+ACK', seq: x + 1 + d, ack: y + 1 + r, fase: 'Chiusura', nota: 'Il client ha finito e chiede di chiudere (FIN).' },
      { da: 'S', f: 'FIN+ACK', seq: y + 1 + r, ack: x + 2 + d, fase: 'Chiusura', nota: 'Il server riscontra il FIN (che conta come un byte) e chiude anche lui.' },
      { da: 'C', f: 'ACK', seq: x + 2 + d, ack: y + 2 + r, fase: 'Chiusura', nota: 'Ultimo riscontro: la connessione è chiusa.' }
    ]
  };
}
function tcpLab(el, label = 'Handshake TCP') {
  const st = stat(label);
  let T, k, primo;
  el.innerHTML = `<div class="card tcp">${turn()}<div class="row"><button class="btn sec" data-a="n">Nuova connessione</button><span class="tcp-pos"></span></div>
   <div class="tcp-sq"></div>
   <div class="tcp-dom"><p class="q"></p><div class="tcp-campi"><div class="f"><label>Flag</label><select data-c="f"><option></option><option>SYN</option><option>SYN+ACK</option><option>ACK</option><option>FIN+ACK</option></select></div>
    <div class="f"><label>seq</label><input data-c="seq" type="text" inputmode="numeric" autocomplete="off"></div><div class="f"><label>ack</label><input data-c="ack" type="text" inputmode="numeric" autocomplete="off" placeholder="vuoto se non c'è"></div></div>
    <div class="row"><button class="btn" data-a="c">Invia il segmento</button><button class="btn sec" data-a="s">Mostra</button><span class="msg"></span></div></div>
   <p class="tcp-nota"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.tcp'), $q = x => c.querySelector(x), up = () => $q('.stat').textContent = `Segmenti giusti al primo colpo: ${st.ok} su ${st.tot}`;
  function nuovo() { T = segmentiTCP(); k = 0; primo = true; $q('.tcp-nota').textContent = ''; disegna(); domanda(); up(); }
  function disegna(anima) {
    const H = 70 + T.seg.length * 46, L = 70, R = 430;
    let s = `<line x1="${L}" y1="34" x2="${L}" y2="${H}" class="vita"/><line x1="${R}" y1="34" x2="${R}" y2="${H}" class="vita"/><text x="${L}" y="22" class="att">Client</text><text x="${R}" y="22" class="att">Server</text>`;
    let fase = '';
    T.seg.slice(0, k).forEach((g, i) => {
      const y1 = 52 + i * 46, y2 = y1 + 30, [a, b] = g.da === 'C' ? [L, R] : [R, L];
      if (g.fase !== fase) { fase = g.fase; s += `<text x="${L - 8}" y="${y1 + 4}" class="fase">${fase}</text>`; }
      s += `<line x1="${a}" y1="${y1}" x2="${b}" y2="${y2}" class="seg ${g.f.includes('SYN') ? 'syn' : g.f.includes('FIN') ? 'fin' : 'ack'}${anima && i === k - 1 ? ' vola' : ''}" pathLength="100" marker-end="url(#tcp-p)"/>`;
      const t = `${g.f}  seq=${g.seq}${g.ack !== null ? '  ack=' + g.ack : ''}${g.dati ? '  [' + g.dati + ' byte]' : ''}`;
      s += `<text x="${(L + R) / 2}" y="${(y1 + y2) / 2 - 8}" class="lab">${t}</text>`;
    });
    $q('.tcp-sq').innerHTML = `<svg viewBox="0 0 500 ${H}" class="tcp-svg"><defs><marker id="tcp-p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z"/></marker></defs>${s}</svg>`;
    $q('.tcp-pos').textContent = `Segmento ${Math.min(k + 1, T.seg.length)} di ${T.seg.length}`;
  }
  function domanda() {
    if (k >= T.seg.length) { $q('.tcp-dom').hidden = true; $q('.tcp-nota').innerHTML += ' <b>Fine: avete seguito tutta la vita della connessione.</b>'; return; }
    const g = T.seg[k]; $q('.tcp-dom').hidden = false; primo = true;
    $q('.tcp-dom .q').innerHTML = `<b>${g.fase}.</b> Ora invia ${g.da === 'C' ? 'il <b>client</b>' : 'il <b>server</b>'}${g.dati ? ` (con ${g.dati} byte di dati)` : ''}: che segmento parte?`;
    c.querySelectorAll('.tcp-campi [data-c]').forEach(f => { f.value = ''; f.classList.remove('ok', 'ko'); });
    $q('.msg').textContent = '';
  }
  function controlla(mostra) {
    const g = T.seg[k], v = n => $q(`[data-c=${n}]`).value.trim();
    const giusti = { f: v('f') === g.f, seq: v('seq') === String(g.seq), ack: g.ack === null ? v('ack') === '' : v('ack') === String(g.ack) };
    if (mostra) { $q('[data-c=f]').value = g.f; $q('[data-c=seq]').value = g.seq; $q('[data-c=ack]').value = g.ack === null ? '' : g.ack; if (primo) { st.tot++; primo = false; up(); } return; }
    Object.entries(giusti).forEach(([n, ok]) => { const f = $q(`[data-c=${n}]`); f.classList.toggle('ok', ok); f.classList.toggle('ko', !ok); });
    const tutto = Object.values(giusti).every(Boolean), m = $q('.msg');
    if (primo) { st.tot++; if (tutto) st.ok++; primo = false; up(); }
    if (!tutto) { m.textContent = g.ack === null && v('ack') ? 'Nel primo SYN non c\'è ancora niente da riscontrare: ack resta vuoto.' : 'I campi rossi non vanno: ricordate che ack è il prossimo numero atteso.'; m.style.color = 'var(--ko)'; return; }
    $q('.tcp-nota').textContent = g.nota; k++; disegna(true); domanda();
  }
  $q('[data-a=c]').onclick = () => controlla(false);
  $q('[data-a=s]').onclick = () => controlla(true);
  c.querySelectorAll('.tcp-campi input').forEach(i => i.onkeydown = e => { if (e.key === 'Enter') controlla(false); });
  $q('[data-a=n]').onclick = nuovo;
  nuovo();
}
