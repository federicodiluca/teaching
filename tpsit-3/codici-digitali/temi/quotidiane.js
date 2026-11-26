/* Codifiche quotidiane (TPSIT 3): il codice fiscale pezzo per pezzo e la cifra di controllo della partita IVA.
   Solo definizioni: va caricato dopo assets/giochi.js.
   - cfLab(el, etichetta): dai dati di una persona si costruisce il codice fiscale in sei pezzi (anche il carattere di controllo,
     con le tabelle ufficiali dei caratteri dispari e pari). Per ogni pezzo si prova a scriverlo, oppure lo si fa comparire.
   - luhnLab(el, etichetta): la cifra di controllo della partita IVA passo passo (X, Y, Z come nelle slide).
   Gli stili sono in assets/giochi.css (sezione "simulatori"). */
const VOC_CF = 'AEIOU', MESI_CF = 'ABCDEHLMPRST', MESI_NOME = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const COMUNI_CF = [['Rimini', 'H294'], ['Bologna', 'A944'], ['Milano', 'F205'], ['Roma', 'H501'], ['Napoli', 'F839'], ['Torino', 'L219'], ['Firenze', 'D612'], ['Genova', 'D969'], ['Venezia', 'L736'], ['Palermo', 'G273'], ['Bari', 'A662']];
const DISPARI_CF = { 0: 1, 1: 0, 2: 5, 3: 7, 4: 9, 5: 13, 6: 15, 7: 17, 8: 19, 9: 21, A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21, K: 2, L: 4, M: 18, N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14, U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23 };
const pariCF = ch => /\d/.test(ch) ? +ch : ch.charCodeAt(0) - 65;
const lettere = s => s.toUpperCase().normalize('NFD').replace(/[^A-Z]/g, '');
const consCF = s => [...lettere(s)].filter(ch => !VOC_CF.includes(ch)), vocCF = s => [...lettere(s)].filter(ch => VOC_CF.includes(ch));
function cfPezzi(p) {
  const cog = (consCF(p.cognome).join('') + vocCF(p.cognome).join('') + 'XXX').slice(0, 3);
  const c = consCF(p.nome), nom = c.length > 3 ? c[0] + c[2] + c[3] : (c.join('') + vocCF(p.nome).join('') + 'XXX').slice(0, 3);
  const am = String(p.anno).slice(2) + MESI_CF[p.mese], gg = String(p.giorno + (p.sesso === 'F' ? 40 : 0)).padStart(2, '0'), com = p.comune;
  const primi = cog + nom + am + gg + com;
  const somma = [...primi].reduce((s, ch, i) => s + (i % 2 === 0 ? DISPARI_CF[ch] : pariCF(ch)), 0), ctrl = String.fromCharCode(65 + somma % 26);
  return [
    { v: cog, n: 'Cognome', sp: `consonanti del cognome (${consCF(p.cognome).join(' ') || 'nessuna'}), poi le vocali, poi X se mancano lettere` },
    { v: nom, n: 'Nome', sp: c.length > 3 ? `il nome ha ${c.length} consonanti (${c.join(' ')}): si prendono la 1ª, la 3ª e la 4ª` : `consonanti del nome (${c.join(' ') || 'nessuna'}), poi le vocali, poi X` },
    { v: am, n: 'Anno e mese', sp: `ultime due cifre dell'anno (${String(p.anno).slice(2)}) e la lettera del mese: ${MESI_NOME[p.mese]} = ${MESI_CF[p.mese]}` },
    { v: gg, n: 'Giorno e sesso', sp: p.sesso === 'F' ? `giorno ${p.giorno} + 40 perché è una donna = ${gg}` : `giorno ${p.giorno} su due cifre (per gli uomini non si aggiunge niente)` },
    { v: com, n: 'Comune', sp: `il codice catastale del comune di nascita` },
    { v: ctrl, n: 'Controllo', sp: `si convertono i 15 caratteri con la tabella dei dispari (posizioni 1, 3, 5...) e dei pari (2, 4, 6...): somma ${somma}, resto della divisione per 26 = ${somma % 26} → ${ctrl}` }
  ];
}
function cfLab(el, label = 'Il codice fiscale pezzo per pezzo') {
  const st = stat(label);
  const PERSONE = [['Rossi', 'Mario', 'M'], ['Bianchi', 'Giulia', 'F'], ['Esposito', 'Francesca', 'F'], ['Ricci', 'Luca', 'M'], ['Fo', 'Ida', 'F'], ['Colombo', 'Alessandro', 'M'], ['Greco', 'Chiara', 'F'], ['Neri', 'Stefano', 'M']];
  let P, pz, k, primo;
  el.innerHTML = `<div class="card cf">${turn()}<div class="row"><button class="btn sec" data-a="n">Altra persona</button></div>
   <div class="cf-dati"></div><div class="cf-cod"></div><div class="cf-dom"></div><p class="msg"></p><ol class="cf-sp"></ol><div class="stat"></div></div>`;
  const c = el.querySelector('.cf'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Pezzi giusti al primo colpo: ${st.ok} su ${st.tot}`;
  function nuovo() {
    const [cog, nom, ses] = pick(PERSONE), com = pick(COMUNI_CF);
    P = { cognome: cog, nome: nom, sesso: ses, giorno: rnd(1, 28), mese: rnd(0, 11), anno: rnd(1975, 2011), comune: com[1], nomeComune: com[0] };
    pz = cfPezzi(P); k = 0; primo = true; $q('.msg').textContent = ''; $q('.cf-sp').innerHTML = '';
    $q('.cf-dati').innerHTML = `<b>${P.cognome} ${P.nome}</b>, ${P.sesso === 'F' ? 'nata' : 'nato'} a <b>${P.nomeComune}</b> (codice catastale ${P.comune}) il <b>${P.giorno} ${MESI_NOME[P.mese]} ${P.anno}</b>, sesso <b>${P.sesso}</b>.`;
    disegna();
  }
  function disegna() {
    $q('.cf-cod').innerHTML = pz.map((p, i) => `<span class="cf-p p${i}${i < k ? ' fatto' : i === k ? ' ora' : ''}"><b>${i < k ? p.v : '·'.repeat(p.v.length)}</b><small>${p.n}</small></span>`).join('');
    $q('.cf-dom').innerHTML = k >= pz.length ? '<p><b>Ecco il codice fiscale completo.</b> Attenzione: quello vero può essere diverso se due persone hanno lo stesso codice (omocodia).</p>' :
      `<div class="row"><div class="f"><label>${pz[k].n} (${pz[k].v.length} caratter${pz[k].v.length === 1 ? 'e' : 'i'})</label><input type="text" autocomplete="off" autocapitalize="characters" maxlength="${pz[k].v.length}"></div><button class="btn" data-a="c">Controlla</button><button class="btn sec" data-a="s">Mostra</button></div>`;
    const inp = $q('.cf-dom input'); if (inp) inp.onkeydown = e => { if (e.key === 'Enter') controlla(false); };
  }
  function controlla(mostra) {
    const p = pz[k], v = ($q('.cf-dom input').value || '').trim().toUpperCase(), ok = !mostra && v === p.v, m = $q('.msg');
    if (primo) { st.tot++; if (ok) st.ok++; up(); }
    if (!ok && !mostra) { primo = false; m.textContent = 'Non ancora: riprovate o premete «Mostra».'; m.style.color = 'var(--ko)'; return; }
    m.textContent = ok ? 'Esatto!' : ''; m.style.color = 'var(--ok)';
    $q('.cf-sp').innerHTML += `<li class="p${k}"><b>${p.n}: ${p.v}</b>: ${p.sp}.</li>`;
    k++; primo = true; disegna(); const inp = $q('.cf-dom input'); if (inp) inp.focus();
  }
  c.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b) return; if (b.dataset.a === 'n') nuovo(); if (b.dataset.a === 'c') controlla(false); if (b.dataset.a === 's') controlla(true); });
  up(); nuovo();
}

/* ---------- partita IVA passo passo ---------- */
function luhnLab(el, label = 'La partita IVA passo passo') {
  stat(label);
  let d, k, passi;
  el.innerHTML = `<div class="card lu">${turn()}<div class="row"><label>Prime 10 cifre <input type="text" inputmode="numeric" maxlength="10" autocomplete="off"></label><button class="btn sec" data-a="n">Casuali</button><span class="lu-pos"></span></div>
   <div class="lu-tab"></div><p class="lu-nota"></p><div class="row"><button class="btn sec" data-a="i">◀ Indietro</button><button class="btn" data-a="a">Avanti ▶</button></div></div>`;
  const c = el.querySelector('.lu'), $q = s => c.querySelector(s);
  function carica() {
    const v = $q('.lu input').value.replace(/\D/g, ''); if (v.length !== 10) { $q('.lu-nota').textContent = 'Servono 10 cifre.'; return; }
    d = [...v].map(Number); const od = [0, 2, 4, 6, 8].map(i => d[i]), ev = [1, 3, 5, 7, 9].map(i => d[i]);
    const X = od.reduce((a, b) => a + b, 0), Y = ev.reduce((a, b) => a + b, 0) * 2, Z = ev.filter(x => x >= 5).length, T = X + Y + Z, C = (10 - T % 10) % 10;
    passi = [{ f: '', nota: 'Le cifre in posizione dispari (1, 3, 5, 7, 9) e pari (2, 4, 6, 8, 10) si trattano in modo diverso.' },
      { f: 'X', nota: `X = somma delle cifre in posizione dispari: ${od.join(' + ')} = <b>${X}</b>.` },
      { f: 'Y', nota: `Y = somma delle cifre in posizione pari, moltiplicata per 2: (${ev.join(' + ')}) × 2 = <b>${Y}</b>.` },
      { f: 'Z', nota: `Z = quante cifre in posizione pari sono maggiori o uguali a 5: <b>${Z}</b> (raddoppiate superano 9).` },
      { f: 'T', nota: `T = X + Y + Z = ${X} + ${Y} + ${Z} = <b>${T}</b>.` },
      { f: 'C', nota: `C = (10 − ${T} mod 10) mod 10 = (10 − ${T % 10}) mod 10 = <b>${C}</b>. Partita IVA completa: <b>${v}${C}</b>. Se si sbaglia una cifra, il controllo non torna più.` }];
    k = 0; disegna();
  }
  function disegna() {
    const f = passi[k].f, seen = s => passi.slice(0, k + 1).some(p => p.f === s);
    $q('.lu-tab').innerHTML = `<table class="lu-t"><tr><th>posizione</th>${d.map((_, i) => `<th>${i + 1}</th>`).join('')}<th>11</th></tr><tr><th>cifra</th>${d.map((x, i) => `<td class="${i % 2 === 0 ? (seen('X') ? 'disp' : '') : (seen('Y') ? 'pari' : '')}${f === 'Z' && i % 2 && x >= 5 ? ' z' : ''}">${x}</td>`).join('')}<td class="${seen('C') ? 'ctrl' : ''}">${seen('C') ? passi[5].nota.match(/<b>(\d)<\/b>\. Partita/)[1] : '?'}</td></tr>
      <tr><th></th>${d.map((x, i) => `<td class="mini">${i % 2 && seen('Y') ? '×2 = ' + 2 * x : ''}</td>`).join('')}<td></td></tr></table>`;
    $q('.lu-nota').innerHTML = passi[k].nota; $q('.lu-pos').textContent = `Passo ${k + 1} di ${passi.length}`;
    $q('[data-a=i]').disabled = k === 0; $q('[data-a=a]').disabled = k === passi.length - 1;
  }
  $q('[data-a=a]').onclick = () => { if (k < passi.length - 1) { k++; disegna(); } };
  $q('[data-a=i]').onclick = () => { if (k > 0) { k--; disegna(); } };
  $q('[data-a=n]').onclick = () => { $q('.lu input').value = Array.from({ length: 10 }, () => rnd(0, 9)).join(''); carica(); };
  $q('.lu input').oninput = () => { if ($q('.lu input').value.replace(/\D/g, '').length === 10) carica(); };
  $q('[data-a=n]').click();
}
