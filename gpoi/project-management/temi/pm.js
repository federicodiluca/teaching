/* Project management (GPOI): giochi ad hoc. Solo definizioni: va caricato dopo assets/giochi.js.
   - earnedValue(el, etichetta): la curva a S del pianificato (BCWS) con il valore realizzato (BCWP) e il costo reale (ACWP)
     fino alla data di controllo; si leggono i valori, si calcolano CV e SV e si interpreta lo stato del progetto.
   - ganttLab(el, progetti, etichetta): il diagramma di Gantt da costruire, con percorso critico e margini.
   Gli stili sono in assets/giochi.css (sezione "simulatori"). */
function earnedValue(el, label = 'L\'earned value sul grafico') {
  const st = stat(label);
  let BAC, N, T, f, g, val, primo;
  el.innerHTML = `<div class="card ev">${turn()}<div class="row"><button class="btn sec" data-a="n">Altro progetto</button></div>
   <p class="q ev-t"></p><div class="ev-svg"></div>
   <div class="ev-campi"><div class="f"><label>BCWS (k€)</label><input data-k="bcws" inputmode="numeric" autocomplete="off"></div><div class="f"><label>BCWP (k€)</label><input data-k="bcwp" inputmode="numeric" autocomplete="off"></div><div class="f"><label>ACWP (k€)</label><input data-k="acwp" inputmode="numeric" autocomplete="off"></div>
    <div class="f"><label>CV = BCWP − ACWP</label><input data-k="cv" autocomplete="off"></div><div class="f"><label>SV = BCWP − BCWS</label><input data-k="sv" autocomplete="off"></div>
    <div class="f"><label>Costi</label><select data-k="costi"><option></option><option>sotto budget</option><option>sopra budget</option></select></div><div class="f"><label>Tempi</label><select data-k="tempi"><option></option><option>in anticipo</option><option>in ritardo</option></select></div></div>
   <div class="row"><button class="btn" data-a="c">Controlla</button><button class="btn sec" data-a="s">Mostra la spiegazione</button></div><p class="msg"></p><div class="sol" hidden></div><div class="stat"></div></div>`;
  const c = el.querySelector('.ev'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Analisi giuste al primo colpo: ${st.ok} su ${st.tot}`;
  const S = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);   /* forma a S */
  const PV = t => Math.round(BAC * S(t / N)), EV = t => Math.round(BAC * S(t * f / N)), AC = t => Math.round(EV(t) * g);
  function nuovo() {
    BAC = pick([120, 150, 200, 240, 300]); N = pick([10, 12]); T = rnd(4, N - 3); f = pick([0.75, 0.85, 1.15, 1.25]); g = pick([0.8, 0.9, 1.1, 1.25]); primo = true;
    val = { bcws: PV(T), bcwp: EV(T), acwp: AC(T) }; val.cv = val.bcwp - val.acwp; val.sv = val.bcwp - val.bcws;
    if (!val.cv || !val.sv) return nuovo();
    $q('.ev-t').innerHTML = `Un progetto ha un budget totale (BAC) di <b>${BAC} k€</b> e dura <b>${N} settimane</b>. Siamo alla fine della settimana <b>${T}</b>: leggete i valori sul grafico e analizzate lo stato del progetto.`;
    c.querySelectorAll('.ev-campi [data-k]').forEach(i => { i.value = ''; i.classList.remove('ok', 'ko'); }); $q('.msg').textContent = ''; $q('.sol').hidden = true; disegna();
  }
  function disegna() {
    const W = 460, H = 280, x0 = 50, y0 = 240, X = t => x0 + t / N * (W - x0 - 20), Y = v => y0 - v / (BAC * 1.3) * (y0 - 14);
    const linea = (fn, t1, cls) => { const p = []; for (let t = 0; t <= t1 + 1e-9; t += 0.25) p.push(`${X(t)},${Y(fn(t))}`); return `<polyline points="${p.join(' ')}" class="${cls}"/>`; };
    let s = `<line x1="${x0}" y1="${y0}" x2="${W - 10}" y2="${y0}" class="ax"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="10" class="ax"/>`;
    for (let t = 0; t <= N; t += 2) s += `<text x="${X(t)}" y="${y0 + 16}" class="tk">${t}</text>`;
    for (let v = 0; v <= BAC * 1.3; v += BAC / 4) s += `<line x1="${x0}" x2="${W - 10}" y1="${Y(v)}" y2="${Y(v)}" class="gr"/><text x="${x0 - 6}" y="${Y(v) + 4}" class="tk dx">${Math.round(v)}</text>`;
    s += `<text x="${W - 14}" y="${y0 - 6}" class="tk dx">settimane</text><text x="${x0 + 4}" y="20" class="tk sx">k€</text>`;
    s += linea(PV, N, 'pv') + linea(EV, T, 'evl') + linea(AC, T, 'ac');
    s += `<line x1="${X(T)}" x2="${X(T)}" y1="10" y2="${y0}" class="oggi"/><text x="${X(T) + 4}" y="22" class="tk sx">oggi</text>`;
    [['pv', val.bcws], ['evl', val.bcwp], ['ac', val.acwp]].forEach(([k, v]) => { s += `<circle cx="${X(T)}" cy="${Y(v)}" r="5" class="p ${k}"/><text x="${X(T) + 8}" y="${Y(v) + 4}" class="vl ${k}">${v}</text>`; });
    $q('.ev-svg').innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="ev-s">${s}</svg><div class="ev-leg"><span class="pv">BCWS: lavoro pianificato</span><span class="evl">BCWP: lavoro realizzato (earned value)</span><span class="ac">ACWP: costo reale</span></div>`;
  }
  function attesi() { return { ...val, costi: val.cv > 0 ? 'sotto budget' : 'sopra budget', tempi: val.sv > 0 ? 'in anticipo' : 'in ritardo' }; }
  $q('[data-a=c]').onclick = () => {
    const A = attesi(); let tutto = true;
    c.querySelectorAll('.ev-campi [data-k]').forEach(i => { const k = i.dataset.k, v = i.value.trim().replace('−', '-'); const ok = typeof A[k] === 'number' ? +v === A[k] && v !== '' : v === A[k]; i.classList.toggle('ok', ok); i.classList.toggle('ko', !ok); if (!ok) tutto = false; });
    if (primo) { st.tot++; if (tutto) st.ok++; primo = false; up(); }
    const m = $q('.msg'); m.textContent = tutto ? 'Analisi giusta!' : 'I campi rossi non vanno: rileggete i valori a «oggi» e i segni di CV e SV.'; m.style.color = tutto ? 'var(--ok)' : 'var(--ko)';
  };
  $q('[data-a=s]').onclick = () => {
    const A = attesi(), s = $q('.sol'); s.hidden = false;
    s.innerHTML = '<b>Spiegazione</b>' + P(`a fine settimana ${T}: BCWS = ${A.bcws}, BCWP = ${A.bcwp}, ACWP = ${A.acwp}\nCV = ${A.bcwp} − ${A.acwp} = ${A.cv}: ${A.cv > 0 ? 'positivo, il lavoro fatto è costato meno del previsto (sotto budget)' : 'negativo, il lavoro fatto è costato più del previsto (sopra budget)'}\nSV = ${A.bcwp} − ${A.bcws} = ${A.sv}: ${A.sv > 0 ? 'positivo, è stato fatto più lavoro del pianificato (in anticipo)' : 'negativo, è stato fatto meno lavoro del pianificato (in ritardo)'}`);
  };
  $q('[data-a=n]').onclick = nuovo; up(); nuovo();
}

/* ---------- il diagramma di Gantt da costruire ----------
   ganttLab(el, progetti, etichetta): per ogni attività si sceglie la settimana di inizio facendo clic sulla riga;
   ogni attività deve iniziare il prima possibile, dopo che sono finite quelle da cui dipende.
   Alla verifica si vedono durata totale, percorso critico (attività senza margine) e margini.
   progetti = [{nome, t, att: [[nome, durata, [indici dei predecessori]], ...]}] */
function pianificaGantt(att) {
  const n = att.length, ES = Array(n).fill(0), EF = Array(n).fill(0);
  att.forEach((a, i) => { ES[i] = Math.max(0, ...a[2].map(p => EF[p])); EF[i] = ES[i] + a[1]; });
  const fine = Math.max(...EF), LF = Array(n).fill(fine), LS = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { const succ = att.map((x, j) => [x, j]).filter(([x]) => x[2].includes(i)).map(([, j]) => LS[j]); LF[i] = succ.length ? Math.min(...succ) : fine; LS[i] = LF[i] - att[i][1]; }
  return { ES, EF, LS, fine, margine: ES.map((e, i) => LS[i] - e) };
}
function ganttLab(el, progetti, label = 'Il diagramma di Gantt') {
  const st = stat(label);
  let Pr, piano, inizio, primo, verificato;
  el.innerHTML = `<div class="card gnt">${turn()}<div class="row"><select class="mt">${progetti.map((p, i) => `<option value="${i}">${escH(p.nome)}</option>`).join('')}</select></div>
   <p class="q gnt-t"></p><div class="gnt-gr"></div><div class="row"><button class="btn" data-a="v">Verifica</button><button class="btn sec" data-a="r">Cancella</button></div><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.gnt'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Diagrammi giusti al primo colpo: ${st.ok} su ${st.tot}`;
  function carica() { Pr = progetti[+$q('.mt').value]; piano = pianificaGantt(Pr.att); inizio = Pr.att.map(() => null); primo = true; verificato = false; $q('.msg').textContent = ''; $q('.gnt-t').innerHTML = Pr.t + ' Per ogni attività fate clic sulla settimana in cui inizia: <b>il prima possibile</b>, ma solo quando sono finite le attività da cui dipende.'; disegna(); }
  function disegna() {
    const T = piano.fine + 3;
    $q('.gnt-gr').innerHTML = `<table class="gnt-tab"><tr><th>Attività</th><th>Durata</th><th>Dopo</th>${Array.from({ length: T }, (_, w) => `<th class="w">${w + 1}</th>`).join('')}</tr>` +
      Pr.att.map((a, i) => { const s = inizio[i], crit = verificato && piano.margine[i] === 0;
        return `<tr class="${crit ? 'crit' : ''}"><td class="nm">${i + 1}. ${escH(a[0])}</td><td>${a[1]} sett.</td><td>${a[2].map(p => p + 1).join(', ') || '—'}</td>` +
          Array.from({ length: T }, (_, w) => { const dentro = s !== null && w >= s && w < s + a[1], marg = verificato && piano.margine[i] > 0 && w >= piano.EF[i] && w < piano.EF[i] + piano.margine[i];
            return `<td class="c${dentro ? ' bar' : ''}${marg ? ' marg' : ''}" data-i="${i}" data-w="${w}"></td>`; }).join('') + '</tr>'; }).join('') +
      (verificato ? `<tr><td class="nm">Fine progetto</td><td></td><td></td>${Array.from({ length: T }, (_, w) => `<td class="${w === piano.fine - 1 ? 'mile' : ''}">${w === piano.fine - 1 ? '◆' : ''}</td>`).join('')}</tr>` : '') + '</table>' +
      `<p class="gnt-num">${Pr.att.map((a, i) => `<span>${i + 1}. ${escH(a[0])}</span>`).join('')}</p>`;
  }
  c.addEventListener('click', e => {
    const td = e.target.closest('.gnt-tab td.c'); if (!td || verificato) return; const i = +td.dataset.i, w = +td.dataset.w;
    inizio[i] = w; disegna();
  });
  $q('[data-a=r]').onclick = () => { inizio = inizio.map(() => null); verificato = false; $q('.msg').textContent = ''; disegna(); };
  $q('[data-a=v]').onclick = () => {
    const m = $q('.msg');
    if (inizio.some(x => x === null)) { m.textContent = 'Mancano alcune attività: fate clic sulla loro riga.'; m.style.color = 'var(--mute)'; return; }
    const errori = Pr.att.map((a, i) => { const pronto = Math.max(0, ...a[2].map(p => inizio[p] + Pr.att[p][1])); return inizio[i] < pronto ? `«${a[0]}» parte prima che siano finite le attività ${a[2].map(p => p + 1).join(', ')}` : inizio[i] > pronto ? `«${a[0]}» potrebbe partire prima, nella settimana ${pronto + 1}` : null; }).filter(Boolean);
    const ok = !errori.length; if (primo) { st.tot++; if (ok) st.ok++; primo = false; up(); }
    if (!ok) { m.innerHTML = 'Non ancora: ' + errori.join('; ') + '.'; m.style.color = 'var(--ko)'; return; }
    verificato = true; disegna();
    const crit = Pr.att.map((a, i) => piano.margine[i] === 0 ? a[0] : null).filter(Boolean);
    m.innerHTML = `Giusto! Il progetto dura <b>${piano.fine} settimane</b>. In rosso il <b>percorso critico</b> (${crit.join(' → ')}): se una di queste attività ritarda, ritarda tutto il progetto. Le zone chiare sono i <b>margini</b> delle altre attività.`; m.style.color = 'var(--ok)';
  };
  $q('.mt').onchange = carica; up(); carica();
}
const PROGETTI_GANTT = [
  { nome: 'Il sito della scuola', t: 'Il nuovo sito della scuola.', att: [['Raccolta dei requisiti', 2, []], ['Progetto grafico', 2, [0]], ['Database dei contenuti', 3, [0]], ['Sviluppo delle pagine', 3, [1, 2]], ['Scrittura dei testi', 2, [1]], ['Test e messa online', 1, [3, 4]]] },
  { nome: 'Una app per la mensa', t: 'Una app per prenotare i pasti in mensa.', att: [['Studio di fattibilità', 1, []], ['Analisi dei requisiti', 2, [0]], ['Progetto dell\'interfaccia', 2, [1]], ['Server e database', 4, [1]], ['Sviluppo dell\'app', 3, [2]], ['Integrazione e collaudo', 2, [3, 4]], ['Formazione del personale', 1, [5]]] },
  { nome: 'Il nuovo laboratorio', t: 'Rinnovare il laboratorio di informatica.', att: [['Inventario e richieste', 1, []], ['Acquisto dei PC', 3, [0]], ['Cablaggio della rete', 2, [0]], ['Installazione dei PC', 2, [1, 2]], ['Configurazione del server', 2, [2]], ['Prove con una classe', 1, [3, 4]]] }
];
