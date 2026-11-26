/* La macchina di Von Neumann in azione. Solo definizioni: va caricato dopo assets/giochi.js.
   vonNeumann(el, etichetta): una CPU (unità di controllo con PC e IR, ALU con l'accumulatore ACC) e una RAM con
   un piccolo programma (LOAD, ADD, SUB, STORE, HALT), collegate da bus indirizzi e bus dati. Il ciclo
   fetch, decode, execute avanza una fase alla volta: in «Guarda» si spiega, in «Prevedi» prima di alcune fasi
   si chiede quanto varrà ACC o una cella della RAM. Gli stili sono in assets/giochi.css (sezione "simulatori"). */
function programmaVN() {
  const a = rnd(2, 9), b = rnd(2, 9), c = rnd(1, Math.min(a + b - 1, 9));
  const tipo = pick(['somma', 'sommaSottrai']);
  const codice = tipo === 'somma' ? [['LOAD', 5], ['ADD', 6], ['STORE', 7], ['HALT']] : [['LOAD', 5], ['ADD', 6], ['SUB', 7], ['STORE', 8], ['HALT']];
  const ram = Array(10).fill(null); codice.forEach((x, i) => ram[i] = x);
  ram[5] = a; ram[6] = b; if (tipo === 'sommaSottrai') { ram[7] = c; }
  return { ram, t: tipo === 'somma' ? `Il programma somma i numeri delle celle 5 e 6 e mette il risultato nella cella 7.` : `Il programma calcola cella 5 + cella 6 − cella 7 e mette il risultato nella cella 8.` };
}
/* le fasi di tutto il programma: ognuna dice che cosa si accende e che cosa cambia */
function fasiVN(ram0) {
  const ram = ram0.map(x => Array.isArray(x) ? x.slice() : x), F = [];
  let pc = 0, ir = null, acc = 0;
  const foto = (fase, nota, extra = {}) => F.push({ fase, nota, pc, ir: ir && ir.join(' '), acc, ram: ram.map(x => Array.isArray(x) ? x.join(' ') : x), ...extra });
  for (let guardia = 0; guardia < 20; guardia++) {
    foto('Fetch', `Il PC vale ${pc}: l'indirizzo ${pc} va sul bus indirizzi e la RAM seleziona la cella ${pc}.`, { busA: pc, cella: pc });
    ir = ram[pc]; foto('Fetch', `La RAM manda l'istruzione «${ir.join(' ')}» sul bus dati: arriva nel registro istruzioni IR.`, { busD: ir.join(' '), cella: pc, reg: 'ir' });
    pc++; foto('Fetch', `Il PC aumenta di 1 e vale ${pc}: punta già all'istruzione successiva.`, { reg: 'pc' });
    const [op, x] = ir;
    const spiega = { LOAD: `carica in ACC il valore della cella ${x}`, ADD: `somma ad ACC il valore della cella ${x}`, SUB: `sottrae ad ACC il valore della cella ${x}`, STORE: `scrive il valore di ACC nella cella ${x}`, HALT: 'ferma il programma' };
    foto('Decode', `L'unità di controllo decodifica «${ir.join(' ')}»: ${spiega[op]}.`, { cu: true });
    if (op === 'HALT') { foto('Execute', 'HALT: il programma è finito.', { fine: true }); break; }
    if (op === 'STORE') { ram[x] = acc; foto('Execute', `L'indirizzo ${x} va sul bus indirizzi e il valore di ACC (${acc}) va sul bus dati: la cella ${x} ora vale ${acc}.`, { busA: x, busD: acc, cella: x, chiedi: { cosa: 'cella', x, val: acc } }); continue; }
    const v = ram[x], prima = acc;
    acc = op === 'LOAD' ? v : op === 'ADD' ? acc + v : acc - v;
    foto('Execute', op === 'LOAD' ? `L'indirizzo ${x} va sul bus indirizzi, il valore ${v} torna sul bus dati e finisce in ACC.` : `Il valore ${v} della cella ${x} arriva all'ALU, che calcola ${prima} ${op === 'ADD' ? '+' : '−'} ${v} = ${acc}: il risultato va in ACC.`,
      { busA: x, busD: v, cella: x, reg: 'acc', alu: op !== 'LOAD', chiedi: { cosa: 'acc', val: acc } });
  }
  return F;
}
function vonNeumann(el, label = 'La macchina di Von Neumann') {
  const st = stat(label);
  let P, F, k, modo = 'g', attesa = null, timer;
  el.innerHTML = `<div class="card vn">${turn()}<div class="row vn-modo"><button class="btn sec on" data-m="g">Guarda</button><button class="btn sec" data-m="p">Prevedi</button><button class="btn sec" data-a="n">Altro programma</button><span class="vn-pos"></span></div>
   <p class="q vn-t"></p><div class="vn-svg"></div><p class="vn-nota"></p><div class="vn-dom"></div>
   <div class="row"><button class="btn sec" data-a="i">◀ Indietro</button><button class="btn" data-a="a">Avanti ▶</button><button class="btn sec" data-a="x">Automatico</button></div><div class="stat"></div></div>`;
  const c = el.querySelector('.vn'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = modo === 'p' ? `Previsioni esatte: ${st.ok} su ${st.tot}` : '';
  function nuovo() { P = programmaVN(); F = fasiVN(P.ram); k = -1; attesa = null; ferma(); $q('.vn-t').innerHTML = P.t; $q('.vn-dom').innerHTML = ''; disegna(); }
  function disegna() {
    const f = F[k] || { fase: '', nota: 'Premete «Avanti»: si parte dal fetch della prima istruzione (PC = 0).', pc: 0, ir: null, acc: 0, ram: P.ram.map(x => Array.isArray(x) ? x.join(' ') : x) };
    const on = (cond, cls = 'on') => cond ? cls : '';
    let s = `<rect x="10" y="10" width="300" height="250" rx="14" class="box"/><text x="22" y="34" class="tit">CPU</text>
      <rect x="25" y="48" width="270" height="92" rx="10" class="cu ${on(f.cu)}"/><text x="38" y="68" class="sub">Unità di controllo</text>
      <g class="${on(f.reg === 'pc')}"><rect x="38" y="78" width="80" height="48" rx="8" class="reg"/><text x="78" y="96" class="rn">PC</text><text x="78" y="118" class="rv">${f.pc}</text></g>
      <g class="${on(f.reg === 'ir')}"><rect x="130" y="78" width="150" height="48" rx="8" class="reg"/><text x="205" y="96" class="rn">IR</text><text x="205" y="118" class="rv">${f.ir || '—'}</text></g>
      <rect x="25" y="152" width="270" height="94" rx="10" class="alu ${on(f.alu)}"/><text x="38" y="172" class="sub">ALU</text>
      <g class="${on(f.reg === 'acc')}"><rect x="130" y="182" width="150" height="50" rx="8" class="reg"/><text x="205" y="200" class="rn">ACC</text><text x="205" y="222" class="rv">${f.acc}</text></g>
      <text x="38" y="215" class="op">${f.alu ? (f.ir || '').split(' ')[0] === 'ADD' ? '+' : '−' : ''}</text>`;
    /* bus */
    s += `<g class="bus ${on(f.busA !== undefined)}"><path d="M310 90H470"/><text x="390" y="80" class="bn">bus indirizzi</text>${f.busA !== undefined ? `<rect x="368" y="86" width="44" height="22" rx="6" class="pacco"/><text x="390" y="102" class="pv">${f.busA}</text>` : ''}</g>`;
    s += `<g class="bus dati ${on(f.busD !== undefined)}"><path d="M310 190H470"/><text x="390" y="180" class="bn">bus dati</text>${f.busD !== undefined ? `<rect x="345" y="186" width="90" height="22" rx="6" class="pacco"/><text x="390" y="202" class="pv">${f.busD}</text>` : ''}</g>`;
    /* RAM */
    s += `<rect x="470" y="10" width="220" height="250" rx="14" class="box"/><text x="482" y="34" class="tit">RAM</text>`;
    f.ram.forEach((v, i) => { const y = 44 + i * 21; s += `<g class="cella ${on(f.cella === i)}${i === f.pc && !f.fine ? ' pc' : ''}"><rect x="482" y="${y}" width="196" height="19" rx="4"/><text x="496" y="${y + 14}" class="ind">${i}</text><text x="530" y="${y + 14}" class="cv">${v === null ? '' : v}</text></g>`; });
    $q('.vn-svg').innerHTML = `<svg viewBox="0 0 700 270" class="vn-s">${s}</svg>`;
    $q('.vn-nota').innerHTML = (f.fase ? `<b class="fase">${f.fase}.</b> ` : '') + f.nota + (f.fine ? ' <b>Fine del programma.</b>' : '');
    $q('.vn-pos').textContent = `Fase ${k + 1} di ${F.length}`;
    $q('[data-a=i]').disabled = k < 0 || !!attesa; $q('[data-a=a]').disabled = k >= F.length - 1 || !!attesa; up();
  }
  function avanti() {
    if (attesa || k >= F.length - 1) return ferma();
    const f = F[k + 1];
    if (modo === 'p' && f.chiedi && !f.chiesto) {
      ferma(); attesa = f; f.chiesto = true; const q = f.chiedi;
      $q('.vn-dom').innerHTML = `<div class="trc-dom"><p>Si esegue «${F[k].ir}». ${q.cosa === 'acc' ? 'Quanto varrà <b>ACC</b>?' : `Quanto varrà la <b>cella ${q.x}</b>?`}</p><div class="row"><input type="text" inputmode="numeric" autocomplete="off"><button class="btn" data-a="c">Controlla</button></div></div>`;
      const inp = $q('.vn-dom input'); inp.focus(); inp.onkeydown = e => { if (e.key === 'Enter') controlla(); }; $q('[data-a=c]').onclick = controlla; disegna(); return;
    }
    k++; disegna();
  }
  function controlla() {
    const q = attesa.chiedi, ok = String(q.val) === $q('.vn-dom input').value.trim(); st.tot++; if (ok) st.ok++;
    $q('.vn-dom').innerHTML = `<p class="msg" style="color:var(--${ok ? 'ok' : 'ko'})">${ok ? 'Esatto!' : 'No: vale ' + q.val + '.'}</p>`; attesa = null; k++; disegna();
  }
  function ferma() { clearInterval(timer); timer = null; const b = $q('[data-a=x]'); if (b) b.textContent = 'Automatico'; }
  $q('[data-a=a]').onclick = avanti; $q('[data-a=i]').onclick = () => { if (k >= 0 && !attesa) { k--; disegna(); } };
  $q('[data-a=x]').onclick = () => { if (timer) return ferma(); $q('[data-a=x]').textContent = 'Ferma'; timer = setInterval(avanti, 1600); };
  $q('[data-a=n]').onclick = nuovo;
  c.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { modo = b.dataset.m; c.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x === b)); F.forEach(f => delete f.chiesto); k = -1; attesa = null; $q('.vn-dom').innerHTML = ''; ferma(); disegna(); });
  nuovo();
}
