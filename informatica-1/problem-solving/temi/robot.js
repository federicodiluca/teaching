/* Il robot da programmare. Solo definizioni: va caricato dopo assets/giochi.js.
   robotLab(el, livelli, etichetta): una griglia con muri, il robot e la batteria. Si compone un programma con i blocchi
   Avanti, Gira a sinistra, Gira a destra e Ripeti N volte; il robot lo esegue un passo alla volta.
   livelli = [{t: consegna, mappa: ['#####', '#R.B#', ...], dir: 0..3 (0 = destra, 1 = giù, 2 = sinistra, 3 = su), max: blocchi}]
   Nella mappa: # muro, R robot, B batteria, . libero. Un blocco Ripeti conta 1, più i blocchi che contiene.
   Gli stili sono in assets/giochi.css (sezione "simulatori"). */
const DIR_ROBOT = [[1, 0], [0, 1], [-1, 0], [0, -1]];
function contaBlocchi(p) { return p.reduce((s, b) => s + 1 + (b.corpo ? contaBlocchi(b.corpo) : 0), 0); }
function srotola(p) { return p.flatMap(b => b.corpo ? Array.from({ length: b.n }, () => srotola(b.corpo)).flat() : [b.c]); }
function robotLab(el, livelli, label = 'Il robot') {
  const st = stat(label);
  let L = 0, prog, aperto, R, timer, fatti = {};
  el.innerHTML = `<div class="card rob">${turn()}<div class="row"><select class="mt">${livelli.map((l, i) => `<option value="${i}">Livello ${i + 1}</option>`).join('')}</select><span class="rob-liv"></span></div>
   <p class="q rob-t"></p><div class="rob-box"><div class="rob-gr"></div>
    <div class="rob-ed"><small>Il vostro programma</small><ol class="rob-prog"></ol><p class="rob-cont"></p>
     <div class="rob-pal"><button class="btn sec" data-c="A">⬆ Avanti</button><button class="btn sec" data-c="S">↺ Gira a sinistra</button><button class="btn sec" data-c="D">↻ Gira a destra</button>
      <span class="rob-rip"><button class="btn sec" data-r="2">Ripeti 2</button><button class="btn sec" data-r="3">3</button><button class="btn sec" data-r="4">4</button><button class="btn sec" data-r="5">5</button><button class="btn sec" data-r="6">6 volte</button></span><button class="btn sec" data-a="chiudi">Fine ripeti</button></div>
     <div class="row"><button class="btn" data-a="v">▶ Esegui</button><button class="btn sec" data-a="u">Annulla l'ultimo</button><button class="btn sec" data-a="x">Svuota</button></div></div></div>
   <p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.rob'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Livelli risolti: ${Object.keys(fatti).length} su ${livelli.length}`;
  function carica(i) {
    clearTimeout(timer); L = i; $q('.mt').value = i; prog = []; aperto = null; const lv = livelli[L];
    $q('.rob-t').innerHTML = lv.t; $q('.rob-liv').textContent = `al massimo ${lv.max} blocchi`; $q('.msg').textContent = ''; reset(); disegnaProg();
  }
  function reset() { const lv = livelli[L]; lv.mappa.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === 'R') R = { x, y, d: lv.dir || 0 }; })); disegna(); }
  function cella(x, y) { const r = livelli[L].mappa[y]; return r && r[x] !== undefined ? r[x] : '#'; }
  function disegna(urto) {
    const m = livelli[L].mappa, W = m[0].length, H = m.length, s = 52;
    let g = '';
    m.forEach((r, y) => [...r].forEach((ch, x) => { g += `<rect x="${x * s}" y="${y * s}" width="${s}" height="${s}" class="${ch === '#' ? 'muro' : 'pav'}"/>`; if (ch === 'B') g += `<g transform="translate(${x * s + s / 2},${y * s + s / 2})" class="batt"><rect x="-10" y="-15" width="20" height="30" rx="3"/><rect x="-5" y="-19" width="10" height="5"/><path d="M2 -9L-4 2H1L-2 10L5 -2H0Z"/></g>`; }));
    g += `<g class="robot${urto ? ' urto' : ''}" style="transform:translate(${R.x * s + s / 2}px,${R.y * s + s / 2}px) rotate(${R.d * 90}deg)"><rect x="-17" y="-15" width="34" height="30" rx="7"/><circle cx="6" cy="-6" r="4" class="occhio"/><circle cx="6" cy="6" r="4" class="occhio"/><path d="M17 -6L25 0L17 6Z" class="naso"/></g>`;
    $q('.rob-gr').innerHTML = `<svg viewBox="-2 -2 ${W * s + 4} ${H * s + 4}" class="rob-s">${g}</svg>`;
  }
  function disegnaProg() {
    const riga = (b, i, dentro) => b.corpo ? `<li class="rip${b === aperto ? ' aperto' : ''}" data-i="${i}"><span>Ripeti ${b.n} volte</span><ol>${b.corpo.map((x, j) => riga(x, i + '.' + j, true)).join('')}${b === aperto ? '<li class="segnaposto">…i blocchi vanno qui…</li>' : ''}</ol></li>`
      : `<li data-i="${i}">${b.c === 'A' ? '⬆ Avanti' : b.c === 'S' ? '↺ Gira a sinistra' : '↻ Gira a destra'}</li>`;
    $q('.rob-prog').innerHTML = prog.map((b, i) => riga(b, String(i))).join('') || '<li class="vuoto">Ancora vuoto: usate i blocchi qui sotto.</li>';
    const n = contaBlocchi(prog), max = livelli[L].max;
    $q('.rob-cont').innerHTML = `Blocchi usati: <b class="${n > max ? 'troppi' : ''}">${n}</b> su ${max}`;
    $q('[data-a=chiudi]').disabled = !aperto; c.querySelectorAll('[data-r]').forEach(b => b.disabled = !!aperto);
  }
  function aggiungi(b) { (aperto ? aperto.corpo : prog).push(b); disegnaProg(); }
  c.querySelectorAll('[data-c]').forEach(b => b.onclick = () => aggiungi({ c: b.dataset.c }));
  c.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { const r = { n: +b.dataset.r, corpo: [] }; prog.push(r); aperto = r; disegnaProg(); });
  $q('[data-a=chiudi]').onclick = () => { aperto = null; disegnaProg(); };
  $q('[data-a=u]').onclick = () => { if (aperto && aperto.corpo.length) aperto.corpo.pop(); else { const t = prog.pop(); if (t === aperto) aperto = null; } disegnaProg(); };
  $q('[data-a=x]').onclick = () => { prog = []; aperto = null; disegnaProg(); reset(); $q('.msg').textContent = ''; };
  $q('[data-a=v]').onclick = () => {
    clearTimeout(timer); aperto = null; disegnaProg(); reset(); const passi = srotola(prog), m = $q('.msg'); m.textContent = ''; let i = 0;
    const lv = livelli[L], n = contaBlocchi(prog);
    (function passo() {
      if (i >= passi.length) {
        const ok = cella(R.x, R.y) === 'B';
        if (ok && n <= lv.max) { if (!fatti[L]) { fatti[L] = true; st.tot++; st.ok++; up(); } m.textContent = L < livelli.length - 1 ? 'Batteria raggiunta! Tra un attimo il livello successivo.' : 'Batteria raggiunta! Avete risolto tutti i livelli.'; m.style.color = 'var(--ok)'; if (L < livelli.length - 1) { const prossimo = L + 1; timer = setTimeout(() => carica(prossimo), 1800); } }
        else if (ok) { m.textContent = `Batteria raggiunta, ma con ${n} blocchi: il massimo è ${lv.max}. Provate con Ripeti.`; m.style.color = 'var(--hl, var(--ko))'; }
        else { m.textContent = 'Il programma è finito ma il robot non è sulla batteria.'; m.style.color = 'var(--ko)'; }
        return;
      }
      const cmd = passi[i++];
      if (cmd === 'S') R.d = (R.d + 3) % 4; else if (cmd === 'D') R.d = (R.d + 1) % 4;
      else { const [dx, dy] = DIR_ROBOT[R.d]; if (cella(R.x + dx, R.y + dy) === '#') { disegna(true); m.textContent = 'Bum! Il robot ha urtato un muro.'; m.style.color = 'var(--ko)'; return; } R.x += dx; R.y += dy; }
      disegna(); timer = setTimeout(passo, 420);
    })();
  };
  $q('.mt').onchange = () => carica(+$q('.mt').value);
  up(); carica(0);
}
const LIVELLI_ROBOT = [
  { t: 'Portate il robot alla batteria.', mappa: ['######', '#R..B#', '######'], dir: 0, max: 3 },
  { t: 'Ora c\'è da girare.', mappa: ['######', '#R..##', '###.##', '###B##', '######'], dir: 0, max: 5 },
  { t: 'Il corridoio è lungo, ma i blocchi sono pochi: serve un ciclo.', mappa: ['#########', '#R.....B#', '#########'], dir: 0, max: 2 },
  { t: 'Una scala: cercate il pezzo che si ripete.', mappa: ['#######', '#R.####', '##..###', '###..##', '####B##', '#######'], dir: 0, max: 5 },
  { t: 'Il giro del cortile: tre lati uguali, con pochi blocchi.', mappa: ['#####', '#R..#', '###.#', '#B..#', '#####'], dir: 0, max: 4 }
];
