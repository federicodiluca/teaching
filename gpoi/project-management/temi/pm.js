/* Project management (GPOI): giochi ad hoc. Solo definizioni: va caricato dopo assets/giochi.js.
   - earnedValue(el, etichetta): la curva a S del pianificato (BCWS) con il valore realizzato (BCWP) e il costo reale (ACWP)
     fino alla data di controllo; si leggono i valori, si calcolano CV e SV e si interpreta lo stato del progetto.
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
