/* Simulatori per le attività su Arduino. Solo definizioni: va caricato dopo assets/giochi.js, assets/codice.js
   e temi/arduino.js (che definisce COLORI).
   - resistoreLab(el, etichetta): codice colori su un resistore disegnato, da leggere o da costruire.
   - arduinoSim(el, sketch, etichetta): uno sketch che gira riga per riga accanto a una scheda con LED, pulsante
     e monitor seriale. sketch = [{nome, t, code: [righe], prog: {setup: [istr], loop: [istr]}, pulsante: {pin, pullup}}]
     istruzioni: {l: riga, op: 'mode'|'w'|'d'|'r'|'if'|'print', ...} (vedi esegui sotto).
   - pwmLab(el, obiettivi, etichetta): analogWrite e duty cycle con l'onda quadra; potenziometro, map() e servo.
   Gli stili sono in assets/giochi.css (sezione "simulatori"). */

/* ---------- codice colori ---------- */
const HEX_COLORI = ['#111', '#7a4a1e', '#d32f2f', '#f57c00', '#fbc02d', '#2e7d32', '#1565c0', '#7b1fa2', '#9e9e9e', '#fafafa'];
function resistoreLab(el, label = 'Il codice colori') {
  const st = stat(label);
  let modo = 'leggi', B, primo;
  el.innerHTML = `<div class="card res-lab">${turn()}<div class="row"><button class="btn sec on" data-m="leggi">Leggi il valore</button><button class="btn sec" data-m="costruisci">Costruisci il resistore</button><button class="btn sec" data-a="n">Altro resistore</button></div>
   <p class="q rl-dom"></p><div class="rl-svg"></div>
   <div class="rl-leg">${COLORI.map((c, i) => `<span><i style="background:${HEX_COLORI[i]}"></i>${c} ${i}</span>`).join('')}</div>
   <div class="row rl-ris"><div class="f"><label>Valore (Ω)</label><input type="text" autocomplete="off" inputmode="numeric"></div><button class="btn" data-a="c">Controlla</button><span class="msg"></span></div><div class="stat"></div></div>`;
  const c = el.querySelector('.res-lab'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Giusti al primo colpo: ${st.ok} su ${st.tot}`;
  const valore = b => (b[0] * 10 + b[1]) * Math.pow(10, b[2]);
  const testo = v => v >= 1e6 ? fmt(v / 1e6) + ' MΩ' : v >= 1000 ? fmt(v / 1000) + ' kΩ' : v + ' Ω';
  function nuovo() {
    primo = true; $q('.msg').textContent = '';
    const scelta = [pick([1, 2, 3, 4, 5, 6, 8]), pick([0, 2, 7, 5, 0]), rnd(0, 3)];
    if (modo === 'leggi') { B = scelta; $q('.rl-dom').innerHTML = 'Leggete le bande da sinistra: prima cifra, seconda cifra, moltiplicatore (la banda oro è la tolleranza, ±5%). Quanti ohm vale?'; $q('.rl-ris').hidden = false; }
    else { B = [1, 0, 0]; c.dataset.obiettivo = valore(scelta); $q('.rl-dom').innerHTML = `Costruite un resistore da <b>${testo(valore(scelta))}</b>: fate clic su ogni banda per cambiarne il colore.`; $q('.rl-ris').hidden = true; }
    disegna();
  }
  function disegna(ok) {
    const xs = [118, 150, 182];
    $q('.rl-svg').innerHTML = `<svg viewBox="0 0 400 110" class="rl"><path d="M10 55H80M320 55H390" class="gamba"/><rect x="80" y="25" width="240" height="60" rx="26" class="corpo${ok ? ' giusto' : ''}"/>` +
      xs.map((x, i) => `<rect x="${x}" y="25" width="18" height="60" fill="${HEX_COLORI[B[i]]}" class="banda${modo === 'costruisci' ? ' clic' : ''}" data-b="${i}"><title>${COLORI[B[i]]}</title></rect>`).join('') +
      `<rect x="270" y="25" width="14" height="60" fill="#c9a227"/>` + (modo === 'costruisci' ? `<text x="200" y="104" class="val">${testo(valore(B))}</text>` : '') + '</svg>';
  }
  c.addEventListener('click', e => {
    const b = e.target.closest('.banda.clic'); if (!b) return; const i = +b.dataset.b; B[i] = (B[i] + 1) % (i === 2 ? 7 : 10); if (i === 0 && B[0] === 0) B[0] = 1;
    const ok = valore(B) === +c.dataset.obiettivo; disegna(ok);
    if (ok) { if (primo) { st.tot++; st.ok++; primo = false; up(); } const m = $q('.msg'); $q('.rl-ris').hidden = false; $q('.rl-ris .f').hidden = true; $q('[data-a=c]').hidden = true; m.textContent = 'Esatto! Il resistore è giusto.'; m.style.color = 'var(--ok)'; }
  });
  $q('[data-a=c]').onclick = () => {
    const ok = checkField({ kind: 'num', exp: valore(B), tol: 0 }, $q('.rl-ris input').value.replace(/\./g, '')), m = $q('.msg');
    if (primo) { st.tot++; if (ok) st.ok++; primo = false; up(); }
    m.textContent = ok ? 'Esatto!' : `No: ${COLORI[B[0]]} ${B[0]}, ${COLORI[B[1]]} ${B[1]}, moltiplicatore ${COLORI[B[2]]} = ×${Math.pow(10, B[2])}, quindi ${B[0]}${B[1]} × ${Math.pow(10, B[2])} = ${sep(valore(B))} Ω.`; m.style.color = ok ? 'var(--ok)' : 'var(--ko)';
  };
  c.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { modo = b.dataset.m; c.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x === b)); $q('.rl-ris .f').hidden = false; $q('[data-a=c]').hidden = false; $q('.rl-ris input').value = ''; nuovo(); });
  $q('[data-a=n]').onclick = () => { $q('.rl-ris .f').hidden = false; $q('[data-a=c]').hidden = false; $q('.rl-ris input').value = ''; nuovo(); };
  up(); nuovo();
}

/* ---------- Arduino virtuale ----------
   istruzioni: {l, op: 'mode', pin, m: 'OUTPUT'|'INPUT'|'INPUT_PULLUP'} · {l, op: 'w', pin, v: 1|0} · {l, op: 'd', ms}
   {l, op: 'r', pin, x: 'nome variabile'} · {l, op: 'if', se: v => bool, si: [istr], no: [istr]} · {l, op: 'print', s: v => testo}
   {l, op: 'serial'} (Serial.begin) */
function* eseguiSketch(prog, ctx) {
  function* blocco(lista) {
    for (const i of lista) {
      if (i.op === 'mode') { ctx.modo[i.pin] = i.m; yield { l: i.l }; }
      else if (i.op === 'w') { ctx.pin[i.pin] = i.v; yield { l: i.l }; }
      else if (i.op === 'd') { yield { l: i.l, ms: i.ms }; }
      else if (i.op === 'r') { ctx.v[i.x] = ctx.leggi(i.pin); yield { l: i.l }; }
      else if (i.op === 'print') { ctx.seriale(i.s(ctx.v)); yield { l: i.l }; }
      else if (i.op === 'serial') { yield { l: i.l }; }
      else if (i.op === 'if') { yield { l: i.l }; yield* blocco(i.se(ctx.v) ? i.si : (i.no || [])); }
    }
  }
  yield* blocco(prog.setup);
  for (let giri = 0; giri < 100000; giri++) yield* blocco(prog.loop);
}
function arduinoSim(el, sketch, label = 'Arduino virtuale') {
  stat(label);
  let S, gen, ctx, timer, premuto = false, vel = 1, inPausa = true;
  el.innerHTML = `<div class="card ard">${turn()}<div class="row"><select class="mt">${sketch.map((s, i) => `<option value="${i}">${escH(s.nome)}</option>`).join('')}</select>
    <button class="btn" data-a="p">▶ Avvia</button><button class="btn sec" data-a="r">⏮ Riavvia</button><select class="ard-vel" aria-label="Velocità"><option value="0.5">lento</option><option value="1" selected>normale</option><option value="3">veloce</option></select></div>
   <p class="q ard-t"></p><div class="ard-box"><div class="ard-cod"></div><div class="ard-lato"><div class="ard-svg"></div><button class="btn sec ard-btn" hidden>Tieni premuto il pulsante</button><div class="ard-ser"><small>Monitor seriale</small><pre></pre></div></div></div><p class="ard-nota"></p></div>`;
  const c = el.querySelector('.ard'), $q = s => c.querySelector(s);
  function carica() {
    ferma(); S = sketch[+$q('.mt').value]; $q('.ard-t').innerHTML = S.t; $q('.ard-cod').innerHTML = codiceHTML(S.code, 'cpp');
    ctx = { pin: {}, modo: {}, v: {}, leggi: p => { const pu = ctx.modo[p] === 'INPUT_PULLUP'; return S.pulsante && S.pulsante.pin === p ? (premuto ? (pu ? 0 : 1) : (pu ? 1 : 0)) : 0; }, seriale: t => { const pre = $q('.ard-ser pre'); pre.textContent = (pre.textContent + t + '\n').split('\n').slice(-12).join('\n'); } };
    gen = eseguiSketch(S.prog, ctx); $q('.ard-ser pre').textContent = ''; $q('.ard-btn').hidden = !S.pulsante;
    $q('.ard-ser').hidden = !S.code.some(r => /Serial/.test(r)); evidenzia(-1); disegna(); $q('.ard-nota').textContent = 'Premete «Avvia»: prima si esegue setup() una volta, poi loop() all\'infinito.';
  }
  function evidenzia(l) { c.querySelectorAll('.ard-cod .cod li').forEach((li, i) => li.classList.toggle('on', i === l)); }
  function disegna() {
    const leds = Object.keys(S.leds || {}).map(Number);
    const px = p => 78 + (13 - p) * 20;
    let s = `<rect x="20" y="20" width="330" height="150" rx="10" class="scheda"/><text x="40" y="160" class="marca">ARDUINO UNO</text>`;
    for (let p = 13; p >= 2; p--) s += `<rect x="${px(p) - 7}" y="28" width="14" height="14" class="pin${ctx.pin[p] ? ' alto' : ''}"/><text x="${px(p)}" y="56" class="np">${p}</text>`;
    s += `<rect x="290" y="110" width="22" height="14" rx="2" class="l13${ctx.pin[13] ? ' alto' : ''}"/><text x="301" y="138" class="np">L</text>`;
    leds.forEach((p, i) => { const x = 60 + i * 70, on = ctx.pin[p] && ctx.modo[p] === 'OUTPUT';
      s += `<path d="M${px(p)} 28V8H${x}V215" class="filo"/><g class="led-a${on ? ' on' : ''}" style="--lc:${S.leds[p]}" transform="translate(${x},235)"><circle r="16"/><text y="36" class="np">pin ${p}</text></g>`; });
    if (S.pulsante) { const p = S.pulsante.pin, x = 60 + leds.length * 70 + 20;
      s += `<path d="M${px(p)} 28V12H${x}V215" class="filo"/><g class="puls${premuto ? ' giu' : ''}" transform="translate(${x},235)"><rect x="-18" y="-18" width="36" height="36" rx="6"/><circle r="10"/><text y="36" class="np">pin ${p}${S.pulsante.pullup ? ' (pull-up)' : ''}</text></g>`; }
    $q('.ard-svg').innerHTML = `<svg viewBox="0 0 380 290" class="ard-s">${s}</svg>`;
  }
  function passo() {
    const r = gen.next().value; if (!r) return ferma(); evidenzia(r.l); disegna();
    $q('.ard-nota').textContent = r.ms ? `delay(${r.ms}): la scheda aspetta ${fmt(r.ms / 1000)} s senza fare altro.` : '';
    timer = setTimeout(passo, (r.ms ? Math.min(r.ms, 3000) : 350) / vel);
  }
  function ferma() { clearTimeout(timer); timer = null; inPausa = true; const b = $q('[data-a=p]'); if (b) b.textContent = '▶ Avvia'; }
  $q('[data-a=p]').onclick = () => { if (!inPausa) return ferma(); inPausa = false; $q('[data-a=p]').textContent = '⏸ Pausa'; passo(); };
  $q('[data-a=r]').onclick = carica; $q('.mt').onchange = carica; $q('.ard-vel').onchange = () => { vel = +$q('.ard-vel').value; };
  const premi = v => { premuto = v; $q('.ard-btn').classList.toggle('giu', v); disegna(); };
  const b = $q('.ard-btn'); b.addEventListener('pointerdown', e => { e.preventDefault(); premi(true); }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => b.addEventListener(t, () => premi(false)));
  c.addEventListener('pointerdown', e => { if (e.target.closest('.puls')) { e.preventDefault(); premi(true); } });
  document.addEventListener('pointerup', () => { if (premuto) premi(false); });
  carica();
}
const SKETCH_DIGITALI = [
  { nome: 'Blink', t: 'Il LED sul pin 13 lampeggia: acceso un secondo, spento un secondo.', leds: { 13: '#ef4444' },
    code: ['void setup() {', '  pinMode(13, OUTPUT);', '}', 'void loop() {', '  digitalWrite(13, HIGH);', '  delay(1000);', '  digitalWrite(13, LOW);', '  delay(1000);', '}'],
    prog: { setup: [{ l: 1, op: 'mode', pin: 13, m: 'OUTPUT' }], loop: [{ l: 4, op: 'w', pin: 13, v: 1 }, { l: 5, op: 'd', ms: 1000 }, { l: 6, op: 'w', pin: 13, v: 0 }, { l: 7, op: 'd', ms: 1000 }] } },
  { nome: 'Semaforo', t: 'Tre LED come un semaforo: verde, giallo, rosso.', leds: { 10: '#ef4444', 9: '#facc15', 8: '#22c55e' },
    code: ['void setup() {', '  pinMode(10, OUTPUT); // rosso', '  pinMode(9, OUTPUT);  // giallo', '  pinMode(8, OUTPUT);  // verde', '}', 'void loop() {', '  digitalWrite(8, HIGH);', '  delay(3000);', '  digitalWrite(8, LOW);', '  digitalWrite(9, HIGH);', '  delay(1000);', '  digitalWrite(9, LOW);', '  digitalWrite(10, HIGH);', '  delay(3000);', '  digitalWrite(10, LOW);', '}'],
    prog: { setup: [{ l: 1, op: 'mode', pin: 10, m: 'OUTPUT' }, { l: 2, op: 'mode', pin: 9, m: 'OUTPUT' }, { l: 3, op: 'mode', pin: 8, m: 'OUTPUT' }],
      loop: [{ l: 6, op: 'w', pin: 8, v: 1 }, { l: 7, op: 'd', ms: 3000 }, { l: 8, op: 'w', pin: 8, v: 0 }, { l: 9, op: 'w', pin: 9, v: 1 }, { l: 10, op: 'd', ms: 1000 }, { l: 11, op: 'w', pin: 9, v: 0 }, { l: 12, op: 'w', pin: 10, v: 1 }, { l: 13, op: 'd', ms: 3000 }, { l: 14, op: 'w', pin: 10, v: 0 }] } },
  { nome: 'Pulsante (pull-down)', t: 'Il LED si accende mentre tenete premuto il pulsante: con la resistenza di pull-down, premuto vale HIGH.', leds: { 13: '#ef4444' }, pulsante: { pin: 2, pullup: false },
    code: ['void setup() {', '  pinMode(2, INPUT);', '  pinMode(13, OUTPUT);', '}', 'void loop() {', '  int stato = digitalRead(2);', '  if (stato == HIGH) {', '    digitalWrite(13, HIGH);', '  } else {', '    digitalWrite(13, LOW);', '  }', '}'],
    prog: { setup: [{ l: 1, op: 'mode', pin: 2, m: 'INPUT' }, { l: 2, op: 'mode', pin: 13, m: 'OUTPUT' }],
      loop: [{ l: 5, op: 'r', pin: 2, x: 'stato' }, { l: 6, op: 'if', se: v => v.stato === 1, si: [{ l: 7, op: 'w', pin: 13, v: 1 }], no: [{ l: 9, op: 'w', pin: 13, v: 0 }] }] } },
  { nome: 'Pulsante con INPUT_PULLUP', t: 'Con INPUT_PULLUP la logica si inverte: a riposo il pin legge HIGH, premuto legge LOW.', leds: { 13: '#ef4444' }, pulsante: { pin: 2, pullup: true },
    code: ['void setup() {', '  pinMode(2, INPUT_PULLUP);', '  pinMode(13, OUTPUT);', '  Serial.begin(9600);', '}', 'void loop() {', '  int stato = digitalRead(2);', '  Serial.println(stato);', '  if (stato == LOW) {', '    digitalWrite(13, HIGH);', '  } else {', '    digitalWrite(13, LOW);', '  }', '  delay(300);', '}'],
    prog: { setup: [{ l: 1, op: 'mode', pin: 2, m: 'INPUT_PULLUP' }, { l: 2, op: 'mode', pin: 13, m: 'OUTPUT' }, { l: 3, op: 'serial' }],
      loop: [{ l: 6, op: 'r', pin: 2, x: 'stato' }, { l: 7, op: 'print', s: v => String(v.stato) }, { l: 8, op: 'if', se: v => v.stato === 0, si: [{ l: 9, op: 'w', pin: 13, v: 1 }], no: [{ l: 11, op: 'w', pin: 13, v: 0 }] }, { l: 13, op: 'd', ms: 300 }] } }
];

/* ---------- PWM, potenziometro e servo ---------- */
function pwmLab(el, obiettivi, label = 'PWM e servo') {
  const st = stat(label);
  let fatti;
  el.innerHTML = `<div class="card pwm">${turn()}<ol class="git-mis"></ol><div class="pwm-box">
    <div class="pwm-p"><b>LED sul pin 9</b><label><span>analogWrite(9, <output class="pv">0</output>)</span><input type="range" min="0" max="255" value="0" class="pw"></label><svg viewBox="0 0 300 90" class="onda"></svg>
     <div class="pwm-num"><span>duty cycle <b class="dc"></b></span><span>tensione media <b class="vm"></b></span></div><div class="pwm-led"><i></i></div></div>
    <div class="pwm-p"><b>Potenziometro su A0 e servo sul pin 6</b><label><span>posizione della manopola</span><input type="range" min="0" max="1023" value="0" class="po"></label>
     <svg viewBox="0 0 300 130" class="servo"></svg><div class="pwm-num"><span>analogRead(A0) = <b class="ar"></b></span><span>map(…, 0, 1023, 0, 180) = <b class="an"></b>°</span></div></div></div>
   <p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.pwm'), $q = s => c.querySelector(s);
  const up = () => $q('.stat').textContent = `Obiettivi raggiunti: ${fatti.filter(Boolean).length} su ${obiettivi.length}`;
  function aggiorna() {
    const p = +$q('.pw').value, a = +$q('.po').value, d = p / 255, ang = Math.trunc(a * 180 / 1023);
    $q('.pv').textContent = p; $q('.dc').textContent = fmt(+(d * 100).toFixed(1)) + ' %'; $q('.vm').textContent = fmt(+(d * 5).toFixed(2)) + ' V';
    let path = 'M10 70'; for (let k = 0; k < 4; k++) { const x0 = 10 + k * 70, x1 = x0 + 70 * d; path += d === 0 ? `H${x0 + 70}` : d === 1 ? `V20H${x0 + 70}` : `V20H${x1}V70H${x0 + 70}`; }
    $q('.onda').innerHTML = `<path d="M10 75H290" class="asse"/><text x="4" y="24" class="np">5V</text><text x="4" y="74" class="np">0</text><path d="${path}" class="sq"/>`;
    $q('.pwm-led i').style.opacity = 0.08 + 0.92 * d; $q('.pwm-led i').style.boxShadow = `0 0 ${4 + 30 * d}px ${2 + 10 * d}px rgba(239,68,68,${d})`;
    $q('.ar').textContent = a; $q('.an').textContent = ang;
    const rad = (180 - ang) * Math.PI / 180, x = 150 + 80 * Math.cos(rad), y = 110 - 80 * Math.sin(rad);
    $q('.servo').innerHTML = `<path d="M60 110A90 90 0 0 1 240 110" class="arco"/><text x="54" y="126" class="np">0°</text><text x="150" y="14" class="np">90°</text><text x="246" y="126" class="np">180°</text><line x1="150" y1="110" x2="${x}" y2="${y}" class="braccio"/><circle cx="150" cy="110" r="10" class="perno"/>`;
    const s = { pwm: p, duty: d * 100, pot: a, angolo: ang };
    obiettivi.forEach((o, i) => { if (!fatti[i] && o.ok(s)) { fatti[i] = true; st.tot++; st.ok++; const m = $q('.msg'); m.textContent = fatti.every(Boolean) ? 'Tutti gli obiettivi raggiunti!' : 'Obiettivo raggiunto: ' + o.t.replace(/<[^>]+>/g, ''); m.style.color = 'var(--ok)'; } });
    $q('.git-mis').innerHTML = obiettivi.map((o, i) => `<li class="${fatti[i] ? 'fatta' : ''}">${fatti[i] ? '✔ ' : ''}${o.t}</li>`).join(''); up();
  }
  fatti = obiettivi.map(() => false);
  $q('.pw').oninput = aggiorna; $q('.po').oninput = aggiorna;
  aggiorna();
}
