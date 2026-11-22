/* XML e RegEx (TPSIT 5): tester di espressioni regolari. Solo definizioni: va caricato dopo assets/giochi.js.
   regexLab(el, sfide, etichetta): si scrive un pattern; per ogni stringa si vede subito se corrisponde per intero
   (come matches() in Java) e, nel testo libero, si vedono evidenziate tutte le corrispondenze (come find()).
   sfide = [{t: consegna, nome, si: [stringhe che devono corrispondere], no: [stringhe che non devono], sol: 'pattern', aiuto}]
   Gli stili sono in giochi.css (sezione "simulatori"). */
function regexLab(el, sfide, label = 'Tester di espressioni regolari') {
  const st = stat(label);
  let n = 0, fatte = {};
  el.innerHTML = `<div class="card rx">${turn()}<div class="row"><select class="mt">${sfide.map((s, i) => `<option value="${i}">${i + 1}. ${escH(s.nome)}</option>`).join('')}</select><span class="rx-stato"></span></div>
   <p class="q"></p><div class="rx-pat"><span>Pattern</span><input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Pattern"></div><p class="rx-err"></p>
   <div class="rx-casi"><div><small>Devono corrispondere</small><ul data-l="si"></ul></div><div><small>Non devono corrispondere</small><ul data-l="no"></ul></div></div>
   <details class="rx-libero"><summary>Prova su un testo libero (find: tutte le corrispondenze)</summary><textarea spellcheck="false" aria-label="Testo di prova"></textarea><div class="rx-trov"></div></details>
   <div class="row"><button class="btn sec" data-a="h">Un aiuto</button><button class="btn sec" data-a="s">Mostra la soluzione</button><button class="btn" data-a="n">Sfida successiva ▶</button><span class="msg"></span></div><div class="stat"></div></div>`;
  const c = el.querySelector('.rx'), $q = x => c.querySelector(x), inp = $q('.rx-pat input'), ta = $q('.rx-libero textarea');
  const up = () => $q('.stat').textContent = `Sfide risolte: ${Object.values(fatte).filter(x => x === 'ok').length} su ${sfide.length}`;
  function carica(i) {
    n = i; const s = sfide[n]; $q('.mt').value = n; $q('.q').innerHTML = s.t; inp.value = ''; $q('.msg').textContent = '';
    ta.value = [...s.si, ...s.no].join('\n'); $q('[data-a=n]').style.display = n < sfide.length - 1 ? '' : 'none'; prova(); inp.focus();
  }
  function prova() {
    const s = sfide[n], p = inp.value; let re = null, reG = null;
    try { if (p) { re = new RegExp('^(?:' + p + ')$'); reG = new RegExp(p, 'g'); } $q('.rx-err').textContent = ''; } catch (e) { $q('.rx-err').textContent = 'Il pattern non è valido: ' + e.message.replace(/^Invalid regular expression: /, ''); }
    const riga = (x, deve) => { const ok = re ? re.test(x) === deve : null; return { ok, html: `<li class="${ok === null ? '' : ok ? 'ok' : 'ko'}"><code>${escH(x)}</code><span>${ok === null ? '' : ok ? '✔' : '✘'}</span></li>` }; };
    const si = s.si.map(x => riga(x, true)), no = s.no.map(x => riga(x, false));
    $q('[data-l=si]').innerHTML = si.map(r => r.html).join(''); $q('[data-l=no]').innerHTML = no.map(r => r.html).join('');
    /* testo libero: evidenzia le corrispondenze */
    let h = '';
    if (reG) { const t = ta.value; let i = 0, m, conta = 0; reG.lastIndex = 0;
      while ((m = reG.exec(t)) && conta < 500) { if (!m[0].length) { reG.lastIndex++; continue; } h += escH(t.slice(i, m.index)) + `<mark>${escH(m[0])}</mark>`; i = m.index + m[0].length; conta++; }
      h += escH(t.slice(i)); $q('.rx-trov').innerHTML = `<small>${conta} corrispondenz${conta === 1 ? 'a' : 'e'} trovate</small><pre>${h}</pre>`; }
    else $q('.rx-trov').innerHTML = '';
    const tutte = re && [...si, ...no].every(r => r.ok);
    if (tutte && !fatte[n]) { fatte[n] = 'ok'; st.tot++; st.ok++; up(); }
    $q('.rx-stato').innerHTML = tutte ? '<b style="color:var(--ok)">Sfida risolta!</b>' : fatte[n] === 'sol' ? '<span style="color:var(--mute)">Soluzione mostrata</span>' : '';
  }
  inp.oninput = prova; ta.oninput = prova;
  $q('.mt').onchange = () => carica(+$q('.mt').value);
  $q('[data-a=n]').onclick = () => carica(Math.min(n + 1, sfide.length - 1));
  $q('[data-a=h]').onclick = () => { const m = $q('.msg'); m.innerHTML = sfide[n].aiuto || 'Pensate a quali caratteri servono e quante volte si ripetono.'; m.style.color = 'var(--mute)'; };
  $q('[data-a=s]').onclick = () => { if (!fatte[n]) { fatte[n] = 'sol'; st.tot++; up(); } inp.value = sfide[n].sol; prova(); };
  up(); carica(0);
}
