/* Sistemi operativi (TPSIT 3): simulatori dell'unità. Solo definizioni: va caricato dopo assets/giochi.js.
   - scheduling(el, etichetta): si colora il diagramma di Gantt (FCFS, SJF, Round Robin), si verifica,
     si guarda la simulazione istante per istante (CPU e coda dei pronti) e si calcola l'attesa media.
   Gli stili sono in assets/giochi.css (sezione "simulatori"). */

const COLORI_SO = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

/* simulazione istante per istante: per ogni istante chi usa la CPU, la coda dei pronti e che cosa è successo */
function pianifica(P, alg, q) {
  const n = P.length, rem = P.map(p => p.b), fine = Array(n), arrivato = Array(n).fill(false), Q = [], linea = [], fotogrammi = [];
  let t = 0, cur = -1, usato = 0, finiti = 0;
  for (let guardia = 0; guardia < 200; guardia++) {
    const ev = [];
    P.forEach((p, i) => { if (!arrivato[i] && p.a <= t) { arrivato[i] = true; Q.push(i); if (t > 0 || P.some(x => x.a > 0)) ev.push(`arriva ${p.n}`); } });
    if (cur >= 0 && rem[cur] === 0) { fine[cur] = t; finiti++; ev.push(`${P[cur].n} termina`); cur = -1; }
    if (finiti === n) { fotogrammi.push({ t, run: -1, coda: [], ev, fine: true }); break; }
    if (cur >= 0 && alg === 'rr' && usato === q) { ev.push(`${P[cur].n} ha finito il quanto e torna in fondo alla coda`); Q.push(cur); cur = -1; }
    if (cur < 0 && Q.length) {
      let k = 0;
      if (alg === 'sjf') Q.forEach((i, j) => { if (P[i].b < P[Q[k]].b) k = j; });
      cur = Q.splice(k, 1)[0]; usato = 0;
      ev.push(`${P[cur].n} prende la CPU` + (alg === 'sjf' ? ' (è il più breve tra quelli pronti)' : alg === 'fcfs' ? ' (è il primo arrivato in coda)' : ' (è il primo della coda)'));
    }
    fotogrammi.push({ t, run: cur, coda: Q.slice(), ev });
    linea.push(cur);
    if (cur >= 0) { rem[cur]--; usato++; }
    t++;
  }
  const attese = P.map((p, i) => fine[i] - p.a - p.b);
  return { linea, fotogrammi, fine, attese, media: attese.reduce((s, x) => s + x, 0) / n };
}
function processiSO(arrivi) {
  const n = rnd(3, 4), P = [];
  for (let i = 0; i < n; i++) P.push({ n: 'P' + (i + 1), a: arrivi ? (i === 0 ? 0 : rnd(0, 6)) : 0, b: rnd(1, 6) });
  if (arrivi) P.sort((x, y) => x.a - y.a).forEach((p, i) => p.n = 'P' + (i + 1));
  return P;
}
function scheduling(el, label = 'Il diagramma di Gantt') {
  const st = stat(label);
  let PR, alg, q, S, colore = 0, first, mio = [], k = -1, timer;
  el.innerHTML = `<div class="card sch">${turn()}<div class="row"><select class="sch-alg"><option value="fcfs">FCFS</option><option value="sjf">SJF (senza prelazione)</option><option value="rr2">Round Robin, quanto 2</option><option value="rr3">Round Robin, quanto 3</option></select>
   <select class="sch-liv"><option value="0">Livello 1: arrivano tutti a 0</option><option value="1">Livello 2: arrivi diversi</option></select><button class="btn sec" data-a="n">Nuovi processi</button></div>
   <table class="res sch-tab"></table>
   <p class="q"><b>1. Prevedete.</b> Scegliete un processo e fate clic sulle caselle del diagramma (una casella = un'unità di tempo). Si può anche trascinare.</p>
   <div class="sch-pal"></div><div class="sch-gantt" data-g="mio"></div>
   <div class="row"><button class="btn" data-a="c">Verifica</button><button class="btn sec" data-a="x">Cancella</button><button class="btn sec" data-a="s">Guarda la simulazione</button><span class="msg"></span></div>
   <div class="sch-sim" hidden><p class="q"><b>2. La simulazione.</b> Istante per istante: chi usa la CPU e chi aspetta in coda.</p>
    <div class="sch-stato"><div class="sch-clock"></div><div class="sch-cpu"><small>CPU</small><span></span></div><div class="sch-coda"><small>Coda dei pronti</small><span></span></div></div>
    <div class="sch-gantt" data-g="sim"></div><p class="sch-nota"></p>
    <div class="row"><button class="btn sec" data-a="i">◀</button><button class="btn sec" data-a="p">▶ Avvia</button><button class="btn sec" data-a="a">▶|</button></div></div>
   <div class="sch-att" hidden><p class="q"><b>3. Calcolate</b> il tempo medio di attesa (attesa = fine − arrivo − durata).</p><div class="f"><label>Attesa media</label><input type="text" autocomplete="off"></div><div class="row"><button class="btn" data-a="m">Controlla</button><span class="msg"></span></div><div class="sol" hidden></div></div>
   <div class="stat"></div></div>`;
  const c = el.querySelector('.sch'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Diagrammi giusti al primo colpo: ${st.ok} su ${st.tot}`;
  const chip = i => i < 0 ? '<span class="sch-chip libera">—</span>' : `<span class="sch-chip" style="--pc:${COLORI_SO[i]}">${PR[i].n}</span>`;
  function gantt(box, linea, segna) {
    box.innerHTML = `<div class="sch-celle">${linea.map((x, t) => `<div class="sch-cella${x >= 0 ? ' piena' : ''}${segna ? ' ' + segna(t) : ''}" data-t="${t}" style="${x >= 0 ? '--pc:' + COLORI_SO[x] : ''}">${x >= 0 ? PR[x].n : ''}</div>`).join('')}</div>` +
      `<div class="sch-tempi">${linea.map((_, t) => `<span>${t}</span>`).join('')}<span>${linea.length}</span></div>`;
  }
  function nuovo() {
    const v = $q('.sch-alg').value; alg = v.startsWith('rr') ? 'rr' : v; q = alg === 'rr' ? +v.slice(2) : 0;
    PR = processiSO($q('.sch-liv').value === '1'); S = pianifica(PR, alg, q); mio = S.linea.map(() => null); first = true; k = -1; ferma();
    $q('.sch-tab').innerHTML = `<tr><th>Processo</th><th>Arrivo</th><th>Durata (burst)</th></tr>` + PR.map((p, i) => `<tr><td>${chip(i)}</td><td>${p.a}</td><td>${p.b}</td></tr>`).join('');
    colore = 0;
    $q('.sch-pal').innerHTML = PR.map((p, i) => `<button class="sch-chip${i === 0 ? ' scelto' : ''}" data-c="${i}" style="--pc:${COLORI_SO[i]}">${p.n}</button>`).join('') + `<button class="sch-chip libera" data-c="-1">CPU libera</button>`;
    disegnaMio(); $q('.sch-sim').hidden = true; $q('.sch-att').hidden = true; $q('.msg').textContent = ''; up();
  }
  function disegnaMio(segna) { gantt($q('[data-g=mio]'), mio.map(x => x === null ? -1 : x), segna); c.querySelectorAll('[data-g=mio] .sch-cella').forEach((d, t) => { if (mio[t] === -1) d.classList.add('vuota-scelta'); }); }
  /* clic: colora la casella (o la svuota se ha già quel colore); trascinando si continua a colorare o a svuotare */
  let premuto = false, cancella = false;
  c.addEventListener('pointerdown', e => { const d = e.target.closest('[data-g=mio] .sch-cella'); if (!d) return; premuto = true; cancella = mio[+d.dataset.t] === colore; dipingi(d); e.preventDefault(); });
  c.addEventListener('pointerover', e => { if (!premuto) return; const d = e.target.closest('[data-g=mio] .sch-cella'); if (d) dipingi(d); });
  document.addEventListener('pointerup', () => { premuto = false; });
  function dipingi(d) {
    const t = +d.dataset.t; mio[t] = cancella ? null : colore; const x = mio[t];
    d.className = 'sch-cella' + (x !== null && x >= 0 ? ' piena' : '') + (x === -1 ? ' vuota-scelta' : '');
    d.style.cssText = x !== null && x >= 0 ? '--pc:' + COLORI_SO[x] : ''; d.textContent = x !== null && x >= 0 ? PR[x].n : '';
  }
  $q('.sch-pal').onclick = e => { const b = e.target.closest('[data-c]'); if (!b) return; colore = +b.dataset.c; c.querySelectorAll('.sch-pal .sch-chip').forEach(x => x.classList.toggle('scelto', x === b)); };
  $q('[data-a=x]').onclick = () => { mio = mio.map(() => null); disegnaMio(); $q('.msg').textContent = ''; };
  $q('[data-a=c]').onclick = () => {
    const ok = S.linea.every((x, t) => (mio[t] === null ? -1 : mio[t]) === x);
    if (first) { st.tot++; if (ok) st.ok++; first = false; up(); }
    disegnaMio(t => (mio[t] === null ? -1 : mio[t]) === S.linea[t] ? 'ok' : 'ko');
    const m = $q('.msg'); m.textContent = ok ? 'Esatto! Ora calcolate l\'attesa media.' : 'Le caselle rosse non vanno: guardate la simulazione o correggete.'; m.style.color = ok ? 'var(--ok)' : 'var(--ko)';
    if (ok) $q('.sch-att').hidden = false;
  };
  /* simulazione */
  function mostra() {
    const f = S.fotogrammi[Math.max(0, k)];
    gantt($q('[data-g=sim]'), S.linea.map((x, t) => t < k ? x : -1), t => t === k ? 'ora' : '');
    $q('.sch-clock').innerHTML = `<span>t = <b>${k < 0 ? 0 : f.t}</b></span>`;
    $q('.sch-cpu span').innerHTML = k < 0 ? '' : chip(f.run);
    $q('.sch-coda span').innerHTML = k < 0 ? '' : f.coda.length ? f.coda.map(chip).join('') : '<em>vuota</em>';
    $q('.sch-nota').innerHTML = k < 0 ? 'Premete ▶ per far partire il tempo.' : `<b>t = ${f.t}:</b> ` + (f.ev.length ? f.ev.join('; ') : f.run >= 0 ? `${PR[f.run].n} continua` : 'nessun processo pronto: la CPU resta libera') + (f.fine ? '. <b>Tutti i processi sono terminati.</b>' : '.');
    $q('[data-a=i]').disabled = k < 0; $q('[data-a=a]').disabled = k >= S.fotogrammi.length - 1;
  }
  function avanti() { if (k < S.fotogrammi.length - 1) { k++; mostra(); } if (k >= S.fotogrammi.length - 1) ferma(); }
  function ferma() { clearInterval(timer); timer = null; const b = $q('[data-a=p]'); if (b) b.textContent = '▶ Avvia'; }
  $q('[data-a=s]').onclick = () => { $q('.sch-sim').hidden = false; k = -1; mostra(); $q('.sch-sim').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };
  $q('[data-a=a]').onclick = () => { ferma(); avanti(); };
  $q('[data-a=i]').onclick = () => { ferma(); if (k >= 0) { k--; mostra(); } };
  $q('[data-a=p]').onclick = () => { if (timer) return ferma(); if (k >= S.fotogrammi.length - 1) k = -1; $q('[data-a=p]').textContent = '⏸ Pausa'; avanti(); timer = setInterval(avanti, 900); };
  $q('[data-a=m]').onclick = () => {
    const ok = checkField({ kind: 'num', exp: S.media, tol: 0.01 }, $q('.sch-att input').value), m = $q('.sch-att .msg');
    m.textContent = ok ? 'Esatto!' : 'Non ancora: guardate il procedimento.'; m.style.color = ok ? 'var(--ok)' : 'var(--ko)';
    const s = $q('.sch-att .sol'); s.hidden = false;
    s.innerHTML = '<b>Procedimento</b>' + P(P_ATT());
  };
  const P_ATT = () => PR.map((p, i) => `${p.n}: fine ${S.fine[i]} − arrivo ${p.a} − durata ${p.b} = ${S.attese[i]}`).join('\n') + `\nmedia = (${S.attese.join(' + ')}) : ${PR.length} = ${fmt(+S.media.toFixed(2))}`;
  $q('[data-a=n]').onclick = nuovo; $q('.sch-alg').onchange = nuovo; $q('.sch-liv').onchange = nuovo;
  nuovo();
}

/* ---------- allocazione della memoria: first-fit, best-fit, worst-fit, next-fit ----------
   memoriaFit(el, etichetta): la RAM è una striscia di blocchi; arrivano dei processi e si fa clic sulla zona
   libera che l'algoritmo sceglierebbe (o su «Nessuna zona basta»). */
const LETTERE = i => String.fromCharCode(65 + i);
function sceltaFit(seg, req, alg, ultimo) {
  const lib = seg.map((s, i) => [s, i]).filter(([s]) => s.tipo === 'libera' && s.kb >= req);
  if (!lib.length) return -1;
  if (alg === 'first') return lib[0][1];
  if (alg === 'best') return lib.reduce((a, b) => b[0].kb < a[0].kb ? b : a)[1];
  if (alg === 'worst') return lib.reduce((a, b) => b[0].kb > a[0].kb ? b : a)[1];
  const dopo = lib.find(([, i]) => i > ultimo); return (dopo || lib[0])[1];
}
function memoriaFit(el, label = 'Allocazione della memoria') {
  const st = stat(label);
  let seg, coda, alg, ultimo, giro, attesa;
  el.innerHTML = `<div class="card mem-fit">${turn()}<div class="row"><select class="mf-alg"><option value="first">first-fit</option><option value="best">best-fit</option><option value="worst">worst-fit</option><option value="next">next-fit</option></select><button class="btn sec" data-a="n">Nuova memoria</button></div>
   <p class="mf-regola"></p><div class="mf-ram"></div><div class="mf-arrivi"></div><p class="q mf-dom"></p>
   <div class="row"><button class="btn sec" data-a="no">Nessuna zona basta</button><span class="msg"></span></div><div class="stat"></div></div>`;
  const c = el.querySelector('.mem-fit'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Scelte giuste al primo colpo: ${st.ok} su ${st.tot}`;
  const REGOLE = { first: 'first-fit: la <b>prima</b> zona libera, da sinistra, abbastanza grande.', best: 'best-fit: la zona libera <b>più piccola</b> tra quelle abbastanza grandi.',
    worst: 'worst-fit: la zona libera <b>più grande</b>.', next: 'next-fit: come first-fit, ma si comincia a cercare <b>dopo l\'ultima zona usata</b> (e se serve si riparte dall\'inizio).' };
  function nuovo() {
    alg = $q('.mf-alg').value; ultimo = 0; giro = 0;
    const lib = Array.from({ length: rnd(4, 5) }, () => pick([20, 30, 40, 50, 60, 80, 100]));
    seg = [{ tipo: 'so', kb: 60, nome: 'S.O.' }];
    lib.forEach((kb, i) => { seg.push({ tipo: 'libera', kb }); if (i < lib.length - 1) seg.push({ tipo: 'proc', kb: pick([20, 30, 40]), nome: 'X' + (i + 1) }); });
    coda = Array.from({ length: 4 }, (_, i) => ({ nome: 'P' + (i + 1), kb: pick([15, 25, 35, 45, 55, 70, 90]) }));
    $q('.mf-regola').innerHTML = REGOLE[alg]; $q('.msg').textContent = ''; disegna(); domanda(); up();
  }
  function disegna(evid) {
    let n = 0;
    $q('.mf-ram').innerHTML = seg.map((s, i) => {
      const lab = s.tipo === 'libera' ? LETTERE(n++) : s.nome;
      return `<button class="mf-blocco ${s.tipo}${evid === i ? ' giusta' : ''}${s.tipo === 'proc' && /^P/.test(s.nome) ? ' nuovo' : ''}" data-i="${i}" style="flex-grow:${s.kb}" ${s.tipo === 'libera' ? '' : 'tabindex="-1"'}><b>${lab}</b><small>${s.kb} KB</small></button>`;
    }).join('');
    $q('.mf-arrivi').innerHTML = '<small>In arrivo</small>' + coda.map((p, i) => `<span class="mf-proc${i === giro ? ' ora' : i < giro ? ' fatto' : ''}">${p.nome} · ${p.kb} KB${p.esito ? ' → ' + p.esito : ''}</span>`).join('');
  }
  function domanda() {
    if (giro >= coda.length) {
      const lib = seg.filter(s => s.tipo === 'libera'), libere = lib.reduce((s, x) => s + x.kb, 0);
      $q('.mf-dom').innerHTML = `<b>Finito.</b> Restano ${libere} KB liberi divisi in ${lib.length} zone (la più grande è di ${Math.max(0, ...lib.map(s => s.kb))} KB): questa è la <b>frammentazione esterna</b>. «Nuova memoria» per riprovare.`;
      $q('[data-a=no]').disabled = true; attesa = null; return;
    }
    const p = coda[giro]; attesa = { p, giusta: sceltaFit(seg, p.kb, alg, ultimo), primo: true };
    $q('.mf-dom').innerHTML = `Arriva <b>${p.nome}</b> da <b>${p.kb} KB</b>${alg === 'next' && giro ? ` (l'ultimo processo caricato è ${coda[giro - 1].nome})` : ''}: in quale zona libera va?`;
    $q('[data-a=no]').disabled = false;
  }
  function rispondi(i) {
    if (!attesa) return;
    const ok = i === attesa.giusta, m = $q('.msg');
    if (attesa.primo) { st.tot++; if (ok) st.ok++; attesa.primo = false; up(); }
    if (!ok) {
      m.textContent = attesa.giusta < 0 ? 'No: nessuna zona è abbastanza grande, il processo deve aspettare.' : 'No: guardate la zona evidenziata e la regola.'; m.style.color = 'var(--ko)';
      if (attesa.giusta >= 0) disegna(attesa.giusta);
      const b = c.querySelector(`.mf-blocco[data-i="${i}"]`); if (b) b.classList.add('scossa');
      return;
    }
    m.textContent = 'Esatto!'; m.style.color = 'var(--ok)';
    const p = attesa.p;
    if (i < 0) p.esito = 'aspetta';
    else {
      const s = seg[i], resto = s.kb - p.kb; p.esito = 'zona ' + LETTERE(seg.slice(0, i).filter(x => x.tipo === 'libera').length);
      seg.splice(i, 1, { tipo: 'proc', kb: p.kb, nome: p.nome }, ...(resto > 0 ? [{ tipo: 'libera', kb: resto }] : [])); ultimo = i;
    }
    giro++; disegna(); domanda();
  }
  $q('.mf-ram').onclick = e => { const b = e.target.closest('.mf-blocco.libera'); if (b) rispondi(+b.dataset.i); };
  $q('[data-a=no]').onclick = () => rispondi(-1);
  $q('[data-a=n]').onclick = nuovo; $q('.mf-alg').onchange = nuovo;
  nuovo();
}

/* ---------- sostituzione delle pagine: FIFO e LRU ----------
   pagine(el, etichetta): arriva un riferimento alla volta; si dice se è un hit o quale frame viene sostituito.
   I frame sono caselle fisse: una pagina resta nel suo frame finché non viene sostituita. */
function sostituzione(R, nf, alg) {
  const fr = Array(nf).fill(null), entrata = Array(nf).fill(-1), uso = Array(nf).fill(-1), passi = [];
  R.forEach((r, t) => {
    let j = fr.indexOf(r), tipo = 'hit', vittima = -1;
    if (j < 0) {
      tipo = 'fault'; j = fr.indexOf(null);
      if (j < 0) { const crit = alg === 'fifo' ? entrata : uso; j = crit.indexOf(Math.min(...crit)); vittima = fr[j]; }
      fr[j] = r; entrata[j] = t;
    }
    uso[j] = t; passi.push({ r, tipo, frame: j, vittima, fr: fr.slice() });
  });
  return passi;
}
function pagine(el, label = 'Sostituzione delle pagine') {
  const st = stat(label);
  let R, nf, alg, passi, k, primo;
  el.innerHTML = `<div class="card pag-sim">${turn()}<div class="row"><select class="pg-alg"><option value="fifo">FIFO</option><option value="lru">LRU</option></select><button class="btn sec" data-a="n">Nuova sequenza</button></div>
   <p class="pg-regola"></p><div class="pg-tab"></div><p class="q pg-dom"></p><div class="row pg-scelte"></div><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.pag-sim'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Risposte giuste al primo colpo: ${st.ok} su ${st.tot}`;
  function nuovo() {
    alg = $q('.pg-alg').value; nf = 3; R = Array.from({ length: 10 }, () => rnd(1, 5)); passi = sostituzione(R, nf, alg); k = 0; primo = true;
    $q('.pg-regola').innerHTML = alg === 'fifo' ? 'FIFO: se serve spazio esce la pagina <b>entrata per prima</b>.' : 'LRU: se serve spazio esce la pagina <b>usata meno di recente</b>.';
    $q('.msg').textContent = ''; disegna(); domanda(); up();
  }
  function disegna() {
    const righe = Array.from({ length: nf }, (_, f) => `<tr><th><span class="pg-l">Frame </span><span class="pg-s">F</span>${f + 1}</th>${R.map((_, t) => {
      if (t >= k) return '<td></td>'; const p = passi[t], v = p.fr[f];
      return `<td class="${p.frame === f ? (p.tipo === 'fault' ? 'entra' : 'usa') : ''}">${v === null ? '' : v}</td>`; }).join('')}</tr>`).join('');
    $q('.pg-tab').innerHTML = `<table class="pg"><tr><th><span class="pg-l">Riferimento</span><span class="pg-s">Rif.</span></th>${R.map((r, t) => `<th class="${t === k ? 'ora' : ''}">${r}</th>`).join('')}</tr>${righe}
      <tr><th><span class="pg-l">Page fault</span><span class="pg-s">PF</span></th>${R.map((_, t) => `<td class="pf">${t < k && passi[t].tipo === 'fault' ? 'F' : ''}</td>`).join('')}</tr></table>`;
  }
  function domanda() {
    if (k >= R.length) {
      const f = passi.filter(p => p.tipo === 'fault').length;
      $q('.pg-dom').innerHTML = `<b>Finito:</b> ${f} page fault su ${R.length} riferimenti. Provate l'altro algoritmo con «Nuova sequenza».`; $q('.pg-scelte').innerHTML = ''; return;
    }
    const prima = k ? passi[k - 1].fr : Array(nf).fill(null);
    $q('.pg-dom').innerHTML = `Arriva il riferimento alla pagina <b>${R[k]}</b>. Che cosa succede?`;
    $q('.pg-scelte').innerHTML = `<button class="btn sec" data-r="hit">C'è già: hit</button>` + prima.map((v, f) => `<button class="btn sec" data-r="${f}">${v === null ? `Va nel frame ${f + 1} (libero)` : `Esce la pagina ${v} (frame ${f + 1})`}</button>`).join('');
    primo = true;
  }
  $q('.pg-scelte').onclick = e => {
    const b = e.target.closest('[data-r]'); if (!b) return; const p = passi[k];
    const ok = b.dataset.r === 'hit' ? p.tipo === 'hit' : p.tipo === 'fault' && +b.dataset.r === p.frame;
    if (primo) { st.tot++; if (ok) st.ok++; primo = false; up(); }
    const m = $q('.msg');
    if (!ok) {
      m.textContent = 'No: ' + (p.tipo === 'hit' ? `la pagina ${p.r} è già in memoria.` : p.vittima < 0 ? `c'è un frame libero: il frame ${p.frame + 1}.` : `esce la pagina ${p.vittima}, ${alg === 'fifo' ? 'entrata per prima' : 'usata meno di recente'}.`);
      m.style.color = 'var(--ko)'; b.classList.add('scossa'); return;
    }
    m.textContent = p.tipo === 'hit' ? 'Esatto: hit, nessun page fault.' : 'Esatto: page fault.'; m.style.color = 'var(--ok)';
    k++; disegna(); domanda();
  };
  $q('[data-a=n]').onclick = nuovo; $q('.pg-alg').onchange = nuovo;
  nuovo();
}
