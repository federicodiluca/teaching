/* Organizzazione aziendale (GPOI): giochi ad hoc. Solo definizioni: va caricato dopo assets/giochi.js.
   Meccanica comune: si sceglie una carta e poi si fa clic sul posto dove va (funziona anche al telefono e alla LIM).
   - organigramma(el, casi, etichetta): si costruisce l'organigramma di un'azienda descritta, poi si riconosce la struttura.
   - porter(el, etichetta): la catena del valore di Porter da completare.
   - piramide(el, carte, etichetta): la piramide di Anthony da riempire.
   - corsie(el, etichetta): l'ordine online come processo a corsie (chi fa che cosa, e in che ordine).
   - isoleErp(el, etichetta): lo stesso ordine con i programmi a isole e con l'ERP.
   Gli stili sono in assets/giochi.css (sezione "simulatori"). */

/* pool di carte: restituisce {disegna(), scelta} e chiama scegli(carta) al clic */
function poolCarte(box, carte, presa) {
  box.innerHTML = carte.map((c, i) => `<button class="og-carta${presa === i ? ' presa' : ''}${c.usata ? ' usata' : ''}" data-c="${i}" ${c.usata ? 'disabled' : ''}>${escH(c.t)}</button>`).join('') || '<em>Tutte le carte sono al loro posto.</em>';
}

/* ---------- organigramma ---------- */
function organigramma(el, casi, label = 'L\'organigramma') {
  const st = stat(label);
  let C, carte, posti, presa, primo, fase;
  el.innerHTML = `<div class="card og">${turn()}<div class="row"><select class="mt">${casi.map((c, i) => `<option value="${i}">${escH(c.nome)}</option>`).join('')}</select></div>
   <p class="q og-t"></p><div class="og-pool"></div><div class="og-alb"></div><div class="og-str"></div><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.og'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Organigrammi giusti al primo colpo: ${st.ok} su ${st.tot}`;
  function carica() {
    C = casi[+$q('.mt').value]; presa = null; primo = true; fase = 'costruisci'; $q('.msg').textContent = ''; $q('.og-str').innerHTML = '';
    posti = []; (function giro(n, padre, liv) { const i = posti.length; posti.push({ padre, liv, giusto: n.t, dentro: liv === 0 ? n.t : null }); (n.f || []).forEach(f => giro(f, i, liv + 1)); })(C.albero, -1, 0);
    carte = shuffle(posti.slice(1).map(p => ({ t: p.giusto, usata: false })));
    $q('.og-t').innerHTML = C.t + ' <b>Scegliete una carta e fate clic sul riquadro vuoto dove va.</b>'; disegna();
  }
  function disegna(ver) {
    poolCarte($q('.og-pool'), carte, presa);
    const html = i => { const p = posti[i], figli = posti.map((q, j) => [q, j]).filter(([q]) => q.padre === i);
      const ok = ver ? (p.dentro && padreGiusto(i)) : null;
      return `<li><button class="og-posto liv${p.liv}${p.dentro ? ' pieno' : ''}${ok === true ? ' ok' : ok === false ? ' ko' : ''}" data-p="${i}" ${i === 0 ? 'disabled' : ''}>${p.dentro ? escH(p.dentro) : '?'}</button>${figli.length ? `<ul>${figli.map(([, j]) => html(j)).join('')}</ul>` : ''}</li>`; };
    $q('.og-alb').innerHTML = `<ul class="og-tree">${html(0)}</ul>`;
  }
  /* giusto se la carta sta sotto la carta che dev'essere suo padre (i fratelli si possono scambiare) */
  function padreGiusto(i) { const p = posti[i], atteso = posti.find(q => q.giusto === p.dentro); return atteso && posti[atteso.padre] && posti[p.padre].dentro === posti[atteso.padre].giusto; }
  c.addEventListener('click', e => {
    if (fase !== 'costruisci') return;
    const k = e.target.closest('.og-carta'); if (k) { presa = +k.dataset.c; disegna(); return; }
    const b = e.target.closest('.og-posto'); if (!b) return; const i = +b.dataset.p, p = posti[i];
    if (p.dentro) { const ci = carte.findIndex(x => x.t === p.dentro); carte[ci].usata = false; p.dentro = null; presa = null; disegna(); return; }
    if (presa === null) { $q('.msg').textContent = 'Prima scegliete una carta.'; $q('.msg').style.color = 'var(--mute)'; return; }
    p.dentro = carte[presa].t; carte[presa].usata = true; presa = null; disegna();
    if (carte.every(x => x.usata)) controlla();
  });
  function controlla() {
    const ok = posti.slice(1).every((_, j) => padreGiusto(j + 1)), m = $q('.msg');
    if (primo) { st.tot++; if (ok) st.ok++; primo = false; up(); }
    disegna(true);
    if (!ok) { m.textContent = 'Alcuni riquadri (in rosso) sono sotto il capo sbagliato: fate clic per toglierli e riprovate.'; m.style.color = 'var(--ko)'; return; }
    m.textContent = 'Organigramma giusto! Ora: che struttura è?'; m.style.color = 'var(--ok)'; fase = 'struttura';
    $q('.og-str').innerHTML = `<div class="row">${['Funzionale', 'Divisionale', 'A matrice'].map(s => `<button class="btn sec" data-s="${s}">${s}</button>`).join('')}</div>`;
  }
  c.addEventListener('click', e => {
    const b = e.target.closest('[data-s]'); if (!b || fase !== 'struttura') return; const m = $q('.msg'), ok = b.dataset.s === C.struttura;
    m.textContent = ok ? `Esatto: ${C.struttura.toLowerCase()}. ${C.perche}` : 'No, guardate come sono raggruppate le unità sotto la direzione.'; m.style.color = ok ? 'var(--ok)' : 'var(--ko)'; if (ok) fase = 'fine';
  });
  $q('.mt').onchange = carica; up(); carica();
}
const CASI_ORGANIGRAMMA = [
  { nome: 'Le bici di Marta', struttura: 'Funzionale', t: 'Marta ha una piccola azienda che produce un solo modello di bicicletta. Sotto di lei ci sono tre uffici: chi compra i materiali e produce, chi vende e chi tiene i conti; la produzione ha due reparti, telai e montaggio.',
    perche: 'Le unità sono raggruppate per funzione (produzione, vendite, amministrazione).',
    albero: { t: 'Direzione generale', f: [{ t: 'Produzione', f: [{ t: 'Reparto telai' }, { t: 'Reparto montaggio' }] }, { t: 'Commerciale' }, { t: 'Amministrazione' }] } },
  { nome: 'BiciGroup', struttura: 'Divisionale', t: 'L\'azienda di Marta è cresciuta: ora fa bici da città e bici elettriche, due mercati molto diversi. Ogni linea ha la sua produzione e le sue vendite.',
    perche: 'Le unità sono raggruppate per prodotto: ogni divisione ha le sue funzioni.',
    albero: { t: 'Direzione generale', f: [{ t: 'Divisione bici da città', f: [{ t: 'Produzione bici da città' }, { t: 'Vendite bici da città' }] }, { t: 'Divisione e-bike', f: [{ t: 'Produzione e-bike' }, { t: 'Vendite e-bike' }] }] } },
  { nome: 'Pasta Sole', struttura: 'Divisionale', t: 'Un pastificio vende in Italia e all\'estero, con clienti, leggi e lingue diverse. Per ogni area ha un marketing e una rete di vendita propri.',
    perche: 'Le unità sono raggruppate per area geografica: è una struttura divisionale.',
    albero: { t: 'Direzione generale', f: [{ t: 'Area Italia', f: [{ t: 'Marketing Italia' }, { t: 'Vendite Italia' }] }, { t: 'Area estero', f: [{ t: 'Marketing estero' }, { t: 'Vendite estero' }] }] } }
];

/* ---------- catena del valore di Porter ---------- */
function porter(el, label = 'La catena del valore') {
  const st = stat(label);
  const PRIM = ['Logistica interna', 'Operations', 'Logistica esterna', 'Marketing e vendite', 'Servizi'], SUPP = ['Attività infrastrutturali', 'Gestione delle risorse umane', 'Sviluppo della tecnologia', 'Approvvigionamenti'];
  const DESCR = { 'Logistica interna': 'ricevere e immagazzinare le materie prime', Operations: 'trasformarle nel prodotto', 'Logistica esterna': 'distribuire il prodotto finito', 'Marketing e vendite': 'far conoscere e vendere il prodotto', Servizi: 'assistenza dopo la vendita',
    'Attività infrastrutturali': 'direzione, amministrazione, finanza, qualità', 'Gestione delle risorse umane': 'selezione, formazione, retribuzioni', 'Sviluppo della tecnologia': 'ricerca, progettazione, sistemi informativi', Approvvigionamenti: 'acquisto di tutto ciò che serve' };
  let carte, posti, presa, primo, sbagli;
  el.innerHTML = `<div class="card por">${turn()}<div class="row"><button class="btn sec" data-a="n">Ricomincia</button></div>
   <p class="q">Scegliete un'attività e fate clic sul posto giusto: le <b>attività primarie</b> in basso, in ordine dalle materie prime al cliente; le <b>attività di supporto</b> sopra, perché servono a tutte.</p>
   <div class="og-pool"></div><div class="por-svg"></div><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.por'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Catene completate senza errori: ${st.ok} su ${st.tot}`;
  function nuovo() { carte = shuffle([...PRIM, ...SUPP].map(t => ({ t, usata: false }))); posti = [...SUPP.map(t => ({ giusto: t })), ...PRIM.map(t => ({ giusto: t }))]; presa = null; primo = true; sbagli = false; $q('.msg').textContent = ''; disegna(); }
  function disegna() {
    poolCarte($q('.og-pool'), carte, presa);
    let s = '<path d="M10 10H600L700 165L600 320H10Z" class="corpo"/><text x="655" y="170" class="marg">Margine</text>';
    SUPP.forEach((_, i) => { const p = posti[i], y = 14 + i * 38; s += `<g class="posto${p.dentro ? ' pieno' : ''}" data-p="${i}"><rect x="16" y="${y}" width="${578 + (i < 2 ? 0 : 0)}" height="32" rx="6"/><text x="305" y="${y + 21}">${p.dentro ? escH(p.dentro) : '?'}</text></g>`; });
    PRIM.forEach((_, i) => { const p = posti[4 + i], x = 16 + i * 116; s += `<g class="posto prim${p.dentro ? ' pieno' : ''}" data-p="${4 + i}"><rect x="${x}" y="172" width="110" height="140" rx="6"/>${p.dentro ? testoACapo(p.dentro, x + 55, 230) : `<text x="${x + 55}" y="246">?</text>`}${p.dentro ? `<text x="${x + 55}" y="296" class="dsc">${i + 1}</text>` : ''}</g>`; });
    s += '<text x="300" y="168" class="sez">ATTIVITÀ DI SUPPORTO ↑ · ATTIVITÀ PRIMARIE ↓</text>';
    $q('.por-svg').innerHTML = `<svg viewBox="0 0 720 330" class="por-s">${s}</svg>`;
  }
  function testoACapo(t, x, y) { const p = t.split(' '); const r = p.length > 1 ? [p.slice(0, Math.ceil(p.length / 2)).join(' '), p.slice(Math.ceil(p.length / 2)).join(' ')] : [t]; return r.map((l, i) => `<text x="${x}" y="${y + i * 18}">${escH(l)}</text>`).join(''); }
  c.addEventListener('click', e => {
    const k = e.target.closest('.og-carta'); if (k) { presa = +k.dataset.c; disegna(); return; }
    const g = e.target.closest('.posto'); if (!g) return; const i = +g.dataset.p, p = posti[i], m = $q('.msg');
    if (p.dentro) return; if (presa === null) { m.textContent = 'Prima scegliete un\'attività.'; m.style.color = 'var(--mute)'; return; }
    const t = carte[presa].t;
    if (t !== p.giusto) { sbagli = true; m.textContent = SUPP.includes(t) !== SUPP.includes(p.giusto) ? `No: «${t}» è un'attività ${SUPP.includes(t) ? 'di supporto' : 'primaria'}.` : `No: «${t}» va in un altro posto (${DESCR[t]}).`; m.style.color = 'var(--ko)'; g.classList.add('scossa'); setTimeout(() => g.classList.remove('scossa'), 400); return; }
    p.dentro = t; carte[presa].usata = true; presa = null; m.textContent = `Giusto: ${t.toLowerCase()} = ${DESCR[t]}.`; m.style.color = 'var(--ok)'; disegna();
    if (carte.every(x => x.usata)) { st.tot++; if (!sbagli) st.ok++; up(); m.textContent = 'Catena completa! Le attività primarie creano il prodotto e lo portano al cliente; quelle di supporto le rendono possibili. Il margine è il valore che resta.'; $q('.por-svg svg').classList.add('completa'); }
  });
  $q('[data-a=n]').onclick = nuovo; up(); nuovo();
}

/* ---------- piramide di Anthony ---------- */
function piramide(el, carteDati, label = 'La piramide di Anthony') {
  const st = stat(label);
  const LIV = [['s', 'Attività strategiche', 'alta direzione · lungo periodo · decisioni rare e non ripetitive'], ['t', 'Attività tattiche', 'direzioni funzionali · medio periodo · programmazione e controllo'], ['o', 'Attività operative', 'personale esecutivo · giorno per giorno · attività ripetitive']];
  let carte, dentro, presa, primo;
  el.innerHTML = `<div class="card pir">${turn()}<div class="row"><button class="btn sec" data-a="n">Altre carte</button></div>
   <p class="q">Scegliete una carta e fate clic sul livello della piramide a cui appartiene.</p><div class="og-pool"></div><div class="pir-svg"></div><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.pir'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Carte messe giuste al primo colpo: ${st.ok} su ${st.tot}`;
  function nuovo() { carte = shuffle(carteDati).slice(0, 8).map(([t, l]) => ({ t, l, usata: false })); dentro = { s: [], t: [], o: [] }; presa = null; primo = {}; $q('.msg').textContent = ''; disegna(); }
  function disegna() {
    poolCarte($q('.og-pool'), carte, presa);
    const forme = ['M300 10L392 110H208Z', 'M208 110H392L484 220H116Z', 'M116 220H484L576 330H24Z'];
    $q('.pir-svg').innerHTML = `<svg viewBox="0 0 600 340" class="pir-s">${LIV.map(([id, n, d], i) => `<g class="livello l${i}" data-l="${id}"><path d="${forme[i]}"/><text x="300" y="${[78, 168, 278][i]}" class="ln">${n}</text><text x="300" y="${[96, 188, 298][i]}" class="ld">${i === 0 ? '' : d}</text></g>`).join('')}</svg>` +
      `<div class="pir-col">${LIV.map(([id, n, d]) => `<div><b>${n}</b><small>${d}</small><ul>${dentro[id].map(t => `<li>${escH(t)}</li>`).join('')}</ul></div>`).join('')}</div>`;
  }
  c.addEventListener('click', e => {
    const k = e.target.closest('.og-carta'); if (k) { presa = +k.dataset.c; disegna(); return; }
    const g = e.target.closest('.livello'); if (!g) return; const m = $q('.msg');
    if (presa === null) { m.textContent = 'Prima scegliete una carta.'; m.style.color = 'var(--mute)'; return; }
    const cc = carte[presa], ok = cc.l === g.dataset.l;
    if (!(presa in primo)) { primo[presa] = ok; st.tot++; if (ok) st.ok++; up(); }
    if (!ok) { m.textContent = `No: «${cc.t}» non è a quel livello.`; m.style.color = 'var(--ko)'; g.classList.add('scossa'); setTimeout(() => g.classList.remove('scossa'), 400); return; }
    dentro[cc.l].push(cc.t); cc.usata = true; presa = null; m.textContent = carte.every(x => x.usata) ? 'Piramide completa! Salendo le decisioni sono meno frequenti e guardano più lontano; scendendo i dati sono più dettagliati.' : 'Giusto!'; m.style.color = 'var(--ok)'; disegna();
  });
  $q('[data-a=n]').onclick = nuovo; up(); nuovo();
}

/* ---------- processo a corsie ---------- */
function corsie(el, label = 'Il processo a corsie') {
  const st = stat(label);
  const LANE = ['Cliente', 'Vendite', 'Magazzino', 'Contabilità'];
  const ATT = [['Invia l\'ordine dal sito', 0], ['Controlla l\'ordine e la disponibilità', 1], ['Prepara e imballa la merce', 2], ['Spedisce il pacco', 2], ['Emette la fattura', 3], ['Riceve il pacco e paga', 0]];
  let carte, griglia, presa, primo, sbagli;
  el.innerHTML = `<div class="card cor">${turn()}<div class="row"><button class="btn sec" data-a="n">Ricomincia</button></div>
   <p class="q">L'ordine online come <b>processo a corsie</b>: ogni corsia è un ufficio, le colonne sono le fasi in ordine. Scegliete un'attività e mettetela nella corsia giusta, nella colonna del suo turno.</p>
   <div class="og-pool"></div><div class="cor-gr"></div><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.cor'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Processi completati senza errori: ${st.ok} su ${st.tot}`;
  function nuovo() { carte = shuffle(ATT.map(([t, l], i) => ({ t, l, ord: i, usata: false }))); griglia = {}; presa = null; sbagli = false; $q('.msg').textContent = ''; disegna(); }
  function disegna() {
    poolCarte($q('.og-pool'), carte, presa);
    $q('.cor-gr').innerHTML = `<table class="cor-t"><tr><th></th>${ATT.map((_, j) => `<th>fase ${j + 1}</th>`).join('')}</tr>${LANE.map((n, i) => `<tr><th>${n}</th>${ATT.map((_, j) => { const v = griglia[i + ',' + j]; return `<td data-i="${i}" data-j="${j}" class="${v ? 'pieno' : ''}">${v ? escH(v) + '<span class="fr">→</span>' : ''}</td>`; }).join('')}</tr>`).join('')}</table>`;
  }
  c.addEventListener('click', e => {
    const k = e.target.closest('.og-carta'); if (k) { presa = +k.dataset.c; disegna(); return; }
    const td = e.target.closest('.cor-t td'); if (!td) return; const m = $q('.msg');
    if (presa === null) { m.textContent = 'Prima scegliete un\'attività.'; m.style.color = 'var(--mute)'; return; }
    const i = +td.dataset.i, j = +td.dataset.j, cc = carte[presa];
    if (cc.l !== i || cc.ord !== j) { sbagli = true; m.textContent = cc.l !== i ? `No: «${cc.t}» non lo fa ${LANE[i].toLowerCase() === 'cliente' ? 'il cliente' : 'l\'ufficio ' + LANE[i].toLowerCase()}.` : 'La corsia è giusta, ma non è il suo turno: guardate che cosa deve succedere prima.'; m.style.color = 'var(--ko)'; td.classList.add('scossa'); setTimeout(() => td.classList.remove('scossa'), 400); return; }
    griglia[i + ',' + j] = cc.t; cc.usata = true; presa = null; m.textContent = 'Giusto!'; m.style.color = 'var(--ok)'; disegna();
    if (carte.every(x => x.usata)) { st.tot++; if (!sbagli) st.ok++; up(); m.textContent = 'Processo completo! Il diagramma a corsie mostra in un colpo d\'occhio chi fa che cosa e i passaggi tra un ufficio e l\'altro.'; }
  });
  $q('[data-a=n]').onclick = nuovo; up(); nuovo();
}

/* ---------- isole o ERP: il viaggio di un ordine ---------- */
function isoleErp(el, label = 'Isole o ERP') {
  stat(label);
  const REP = ['Vendite', 'Magazzino', 'Produzione', 'Contabilità'];
  let modo, ordine, archivi, passo, conti;
  el.innerHTML = `<div class="card erp">${turn()}<div class="row"><button class="btn sec on" data-m="isole">Programmi a isole</button><button class="btn sec" data-m="erp">Sistema ERP</button></div>
   <p class="q erp-t"></p><div class="erp-rep"></div><div class="erp-az"></div><p class="msg"></p><table class="res erp-cfr"></table></div>`;
  const c = el.querySelector('.erp'), $q = s => c.querySelector(s), risultati = {};
  function nuovo() {
    ordine = { cliente: pick(['Rossi S.r.l.', 'Bianchi & figli', 'Verdi S.p.A.']), articolo: pick(['TAV-120', 'SED-045', 'LIB-300']), qta: rnd(10, 40) };
    archivi = REP.map(() => null); passo = 0; conti = { ricopiature: 0, errori: 0, modifiche: 0 }; $q('.msg').textContent = '';
    $q('.erp-t').innerHTML = modo === 'isole' ? 'Ogni reparto ha il suo programma e il suo archivio: i dati dell\'ordine si ricopiano a mano dal foglio del reparto precedente. Ricopiateli voi, reparto dopo reparto.' : 'Con l\'ERP c\'è un solo database: l\'ordine si inserisce una volta, e ogni reparto lo vede subito.';
    disegna();
  }
  function disegna() {
    $q('.erp-rep').innerHTML = REP.map((r, i) => { const a = modo === 'erp' ? (archivi[0] ? archivi[0] : null) : archivi[i];
      const diverso = a && modo === 'isole' && archivi[0] && (a.cliente !== archivi[0].cliente || a.articolo !== archivi[0].articolo || a.qta !== archivi[0].qta);
      return `<div class="erp-r${i === passo && passo < 4 ? ' ora' : ''}${diverso ? ' diverso' : ''}"><b>${r}</b>${modo === 'isole' ? '<small>archivio proprio</small>' : '<small>stesso database</small>'}${a ? `<dl><dt>Cliente</dt><dd>${escH(a.cliente)}</dd><dt>Articolo</dt><dd>${escH(a.articolo)}</dd><dt>Quantità</dt><dd>${a.qta}</dd></dl>` : '<em>nessun dato</em>'}</div>`; }).join(modo === 'erp' ? '<span class="erp-db">⇄</span>' : '<span class="erp-fr">→</span>');
    const az = $q('.erp-az');
    if (passo < 4 && (modo === 'isole' || passo === 0)) {
      const fonte = passo === 0 ? ordine : archivi[passo - 1];
      az.innerHTML = `<div class="erp-foglio"><small>${passo === 0 ? 'Ordine arrivato per email' : 'Foglio stampato dal reparto ' + REP[passo - 1]}</small><p>${escH(fonte.cliente)} · ${escH(fonte.articolo)} · quantità ${fonte.qta}</p></div>
       <div class="row erp-campi"><label>Cliente<input data-k="cliente" autocomplete="off"></label><label>Articolo<input data-k="articolo" autocomplete="off"></label><label>Quantità<input data-k="qta" inputmode="numeric" autocomplete="off"></label><button class="btn" data-a="s">Salva in ${REP[passo]}</button></div>`;
    } else if (passo < 4) az.innerHTML = `<div class="row"><button class="btn" data-a="v">Il reparto ${REP[passo]} apre l'ordine</button></div>`;
    else if (!conti.cambio) az.innerHTML = `<div class="row"><button class="btn" data-a="c">Il cliente cambia la quantità a ${ordine.qta + 5}</button></div>`;
    else az.innerHTML = modo === 'isole' ? `<p>Correggete la quantità in ogni archivio: fate clic sui reparti ancora sbagliati.</p>` : '';
  }
  c.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'), m = $q('.msg');
    if (b && b.dataset.a === 's') {
      const v = {}; c.querySelectorAll('.erp-campi input').forEach(i => v[i.dataset.k] = i.value.trim()); v.qta = +v.qta || 0;
      if (!v.cliente || !v.articolo) { m.textContent = 'Compilate tutti i campi.'; m.style.color = 'var(--mute)'; return; }
      archivi[passo] = v; conti.ricopiature++;
      const giusto = ordine; if (v.cliente !== giusto.cliente || v.articolo !== giusto.articolo || v.qta !== giusto.qta) conti.errori++;
      passo++; if (modo === 'erp') { passo = 1; archivi = archivi.map(() => v); }
      m.textContent = modo === 'erp' ? 'Inserito una volta sola.' : ''; disegna(); return;
    }
    if (b && b.dataset.a === 'v') { passo++; m.textContent = `${REP[passo - 1]} vede l'ordine senza ricopiare niente.`; m.style.color = 'var(--ok)'; disegna(); return; }
    if (b && b.dataset.a === 'c') {
      conti.cambio = true; ordine.qta += 5;
      if (modo === 'erp') { archivi = archivi.map(a => ({ ...a, qta: ordine.qta })); conti.modifiche = 1; m.textContent = 'Modificata una volta: tutti i reparti vedono subito la nuova quantità.'; m.style.color = 'var(--ok)'; fine(); }
      else { m.textContent = 'Ora ogni archivio ha la quantità vecchia: va corretto uno per uno.'; m.style.color = 'var(--ko)'; }
      disegna(); return;
    }
    const r = e.target.closest('.erp-r'); if (r && modo === 'isole' && conti.cambio) {
      const i = [...c.querySelectorAll('.erp-r')].indexOf(r); if (archivi[i].qta === ordine.qta) return;
      archivi[i] = { ...archivi[i], qta: ordine.qta }; conti.modifiche++; disegna();
      if (archivi.every(a => a.qta === ordine.qta)) { m.textContent = 'Tutti gli archivi sono di nuovo allineati.'; m.style.color = 'var(--ok)'; fine(); }
    }
  });
  function fine() {
    risultati[modo] = conti;
    $q('.erp-cfr').innerHTML = `<tr><th></th><th>A isole</th><th>ERP</th></tr>` + [['Volte che si sono scritti i dati', 'ricopiature'], ['Ricopiature con errori', 'errori'], ['Correzioni per un cambio di quantità', 'modifiche']].map(([n, k]) => `<tr><td>${n}</td><td>${risultati.isole ? risultati.isole[k] : '—'}</td><td>${risultati.erp ? risultati.erp[k] : '—'}</td></tr>`).join('');
    if (!risultati.erp || !risultati.isole) $q('.msg').textContent += ` Ora provate con ${modo === 'isole' ? 'il sistema ERP' : 'i programmi a isole'} e confrontate.`;
  }
  c.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { modo = b.dataset.m; c.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x === b)); nuovo(); });
  modo = 'isole'; nuovo();
}
