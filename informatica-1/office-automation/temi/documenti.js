/* Documenti e presentazioni (Informatica 1): giochi ad hoc. Solo definizioni: va caricato dopo assets/giochi.js.
   - formattaLab(el, etichetta): il modello e il vostro documento uno accanto all'altro; con i comandi dei gruppi
     Carattere e Paragrafo si rende il documento uguale al modello, il testo cambia dal vivo.
   - sommarioLab(el, etichetta): si assegnano gli stili Titolo 1, 2, 3 alle righe; la numerazione a più livelli
     compare dal vivo, il sommario invece si aggiorna solo con «Aggiorna sommario», come in Word.
   - stampaUnione(el, etichetta): una lettera con i campi unione da scegliere e la regola SE; «Completa unione»
     genera una lettera per ogni riga dei dati e la confronta con quella attesa.
   - schemaDiapositiva(el, etichetta): schema principale, layout e diapositive; si prevede dove compare una
     modifica, oppure dove farla perché compaia solo dove serve.
   Gli stili sono in assets/giochi.css (sezione "documenti e presentazioni"). */

/* ---------- formatta come il modello ---------- */
const FM_TESTI = [
  ['Il pendolo semplice è formato da un filo inestensibile e da una piccola massa appesa alla sua estremità.', 'Abbiamo misurato cinque volte il tempo di dieci oscillazioni con un cronometro digitale.', 'Il periodo non dipende dalla massa, ma soltanto dalla lunghezza del filo.'],
  ['Una rete locale collega i computer di un edificio, come quelli dei laboratori della scuola.', 'Lo switch smista i pacchetti tra i dispositivi della stessa rete locale.', 'Il router collega la rete locale a Internet attraverso il modem.'],
  ['La gita di classe partirà alle otto in punto dal parcheggio della scuola.', 'Ogni studente deve portare il pranzo al sacco e una bottiglia d\'acqua.', 'Il rientro è previsto per le diciotto, sempre davanti alla scuola.']
];
const FM_PROP = {
  b: { g: 'c', vals: [false, true] }, i: { g: 'c', vals: [false, true] }, u: { g: 'c', vals: [false, true] },
  size: { g: 'c', vals: [11, 14, 18] }, col: { g: 'c', vals: ['nero', 'rosso', 'blu'] },
  al: { g: 'p', vals: ['sinistra', 'centro', 'destra', 'giustificato'] }, inter: { g: 'p', vals: ['1', '1,5', '2'] },
  rientro: { g: 'p', vals: [false, true] }, elenco: { g: 'p', vals: ['nessuno', 'puntato', 'numerato'] }
};
const FM_BASE = { b: false, i: false, u: false, size: 11, col: 'nero', al: 'sinistra', inter: '1', rientro: false, elenco: 'nessuno' };
function fmDoc(s, righe) {
  const st = `font-weight:${s.b ? 700 : 400};font-style:${s.i ? 'italic' : 'normal'};text-decoration:${s.u ? 'underline' : 'none'};font-size:${{ 11: 15, 14: 19, 18: 24 }[s.size]}px;text-align:${{ sinistra: 'left', centro: 'center', destra: 'right', giustificato: 'justify' }[s.al]};line-height:${{ '1': 1.25, '1,5': 1.85, '2': 2.45 }[s.inter]};text-indent:${s.rientro ? '2em' : '0'}`;
  const cl = `fm-t fm-${s.col}`;
  if (s.elenco === 'nessuno') return righe.map(r => `<p class="${cl}" style="${st}">${escH(r)}</p>`).join('');
  const t = s.elenco === 'puntato' ? 'ul' : 'ol';
  return `<${t} class="fm-l">${righe.map(r => `<li class="${cl}" style="${st}">${escH(r)}</li>`).join('')}</${t}>`;
}
function formattaLab(el, label = 'Formatta come il modello') {
  const st = stat(label);
  let ob, mio, righe, usate, clic, diff, primo, fatto;
  el.innerHTML = `<div class="card fmlab">${turn()}<div class="row"><select class="fm-liv"><option value="1">Livello 1: gruppo Carattere</option><option value="2">Livello 2: gruppo Paragrafo</option><option value="3">Livello 3: tutti e due</option></select><button class="btn sec" data-a="n">Altro modello</button></div>
   <p class="q">Usate i comandi della scheda Home finché il vostro documento non è uguale al modello.</p>
   <div class="fm-cmd"></div><div class="fm-due"><div><b>Il modello</b><div class="fm-doc fm-ob"></div></div><div><b>Il vostro documento</b><div class="fm-doc fm-mio"></div></div></div><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.fmlab'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Modelli ricopiati senza clic a vuoto: ${st.ok} su ${st.tot}`;
  const B = (k, v, t, tit = '') => `<button class="btn sec fm-b${mio[k] === v ? ' on' : ''}" data-k="${k}" data-v="${v}" title="${tit}">${t}</button>`;
  const T = (k, t, tit) => `<button class="btn sec fm-b${mio[k] ? ' on' : ''}" data-k="${k}" data-v="${!mio[k]}" title="${tit}" aria-pressed="${mio[k]}">${t}</button>`;
  function comandi() {
    let h = '';
    if (usate.includes('b')) h += `<div class="fm-g"><span class="fm-gt">Gruppo Carattere</span><div class="fm-r">${T('b', '<b>G</b>', 'Grassetto')}${T('i', '<i>C</i>', 'Corsivo')}${T('u', '<u>S</u>', 'Sottolineato')}
      <label>Dimensione <select data-k="size">${[11, 14, 18].map(v => `<option${v === mio.size ? ' selected' : ''}>${v}</option>`).join('')}</select> pt</label></div>
      <div class="fm-r">Colore: ${['nero', 'rosso', 'blu'].map(v => B('col', v, `<span class="fm-${v}">A</span> ${v}`)).join('')}</div></div>`;
    if (usate.includes('al')) h += `<div class="fm-g"><span class="fm-gt">Gruppo Paragrafo</span><div class="fm-r">${['sinistra', 'centro', 'destra', 'giustificato'].map(v => B('al', v, v === 'sinistra' ? 'A sinistra' : v === 'centro' ? 'Al centro' : v === 'destra' ? 'A destra' : 'Giustificato')).join('')}</div>
      <div class="fm-r"><label>Interlinea <select data-k="inter">${['1', '1,5', '2'].map(v => `<option${v === mio.inter ? ' selected' : ''}>${v}</option>`).join('')}</select></label>${T('rientro', 'Rientro prima riga', '')}</div>
      <div class="fm-r">Elenco: ${['nessuno', 'puntato', 'numerato'].map(v => B('elenco', v, v)).join('')}</div></div>`;
    $q('.fm-cmd').innerHTML = h;
  }
  const uguali = () => usate.every(k => ob[k] === mio[k]);
  function aggiorna() {
    comandi(); $q('.fm-mio').innerHTML = fmDoc(mio, righe);
    if (uguali() && !fatto) { fatto = true; const pulito = clic <= diff; if (primo) { st.tot++; if (pulito) st.ok++; primo = false; up(); }
      const m = $q('.msg'); m.textContent = `Uguale al modello${pulito ? ', senza clic a vuoto' : ` (con ${clic} clic, ne bastavano ${diff})`}! Con «Altro modello» si continua.`; m.style.color = 'var(--ok)'; $q('.fm-due').classList.add('ok'); }
  }
  function nuovo() {
    const liv = +$q('.fm-liv').value; usate = Object.keys(FM_PROP).filter(k => liv === 3 || FM_PROP[k].g === (liv === 1 ? 'c' : 'p'));
    righe = pick(FM_TESTI); mio = { ...FM_BASE };
    do { ob = { ...FM_BASE }; const k = shuffle(usate).slice(0, liv === 3 ? rnd(3, 5) : rnd(2, 3)); k.forEach(p => ob[p] = pick(FM_PROP[p].vals.slice(1))); } while (uguali());
    diff = usate.filter(k => ob[k] !== mio[k]).length; clic = 0; primo = true; fatto = false;
    $q('.fm-ob').innerHTML = fmDoc(ob, righe); $q('.msg').textContent = ''; $q('.fm-due').classList.remove('ok'); aggiorna();
  }
  const imposta = (k, v) => { if (fatto) return; const val = typeof FM_BASE[k] === 'boolean' ? v === 'true' || v === true : typeof FM_BASE[k] === 'number' ? +v : v; if (mio[k] !== val) { mio[k] = val; clic++; aggiorna(); } };
  c.addEventListener('click', e => { const b = e.target.closest('.fm-b'); if (b) imposta(b.dataset.k, b.dataset.v); });
  c.addEventListener('change', e => { const s = e.target.closest('.fm-cmd select'); if (s) imposta(s.dataset.k, s.value); });
  $q('.fm-liv').onchange = nuovo; $q('[data-a=n]').onclick = nuovo; up(); nuovo();
}

/* ---------- il sommario ---------- */
const SO_DOCUMENTI = [
  ['Relazione di laboratorio', [['Introduzione', []], ['Materiali e metodi', [['Strumenti', []], ['Procedimento', []]]], ['Risultati', [['Le misure', []], ['Il grafico', []]]], ['Conclusioni', []]]],
  ['Ricerca sulle reti', [['Che cos\'è una rete', [['LAN e WAN', []]]], ['I dispositivi', [['Lo switch', []], ['Il router', []], ['L\'access point', []]]], ['La sicurezza', []]]],
  ['Regolamento del torneo', [['Le squadre', []], ['Le partite', [['Il calendario', []], ['Il punteggio', [['La vittoria', []], ['Il pareggio', []]]]]], ['Le premiazioni', []]]],
  ['Guida ai fogli di calcolo', [['Le celle', []], ['Le formule', [['Gli operatori', []], ['I riferimenti', [['Relativi', []], ['Assoluti', []]]]]], ['I grafici', []]]],
  ['Diario della gita', [['La partenza', []], ['Il museo', [['La sala delle macchine', []], ['Il laboratorio', []]]], ['Il ritorno', []]]]
];
const SO_FRASI = t => { const m = /^[A-Z][a-zà-ù']/.test(t) ? t[0].toLowerCase() + t.slice(1) : t; return pick([`In questo paragrafo si parla di ${m}.`, `Qui trovate tutto su ${m}.`, `Questa parte spiega ${m} con qualche esempio.`]); };
function sommarioLab(el, label = 'Il sommario') {
  const st = stat(label);
  let D, righe, voci, primo, fatto, aggiornato, campo;
  el.innerHTML = `<div class="card solab">${turn()}<div class="row"><button class="btn sec" data-a="n">Altro documento</button></div>
   <p class="q">Assegnate a ogni riga lo stile giusto (gruppo Stili della scheda Home) perché il sommario venga come quello richiesto. Le righe di testo restano Normale.</p>
   <div class="so-due"><div><b>Il sommario richiesto</b><div class="so-som so-ob"></div></div><div><b>Il campo Sommario del documento</b><div class="so-som so-mio"></div><button class="btn sec" data-a="a">Aggiorna sommario</button></div></div>
   <div class="so-doc"></div><div class="row"><button class="btn" data-a="v">Verifica</button></div><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.solab'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Documenti giusti al primo colpo: ${st.ok} su ${st.tot}`;
  const numera = livelli => { const n = [0, 0, 0]; return livelli.map(l => { if (!l) return ''; n[l - 1]++; for (let k = l; k < 3; k++) n[k] = 0; return n.slice(0, l).join('.'); }); };
  const somm = livelli => { const num = numera(livelli), v = righe.map((r, i) => livelli[i] ? `<div class="so-v l${livelli[i]}"><span>${num[i]} ${escH(r.t)}</span><i></i><span>${r.p}</span></div>` : '').join('');
    return v || '<i class="so-vuoto">Nessuna voce di sommario trovata.</i>'; };
  function nuovo() {
    D = pick(SO_DOCUMENTI); righe = []; let p = 1;
    const giu = (nodi, l) => nodi.forEach(([t, f]) => { righe.push({ t, liv: l, p }); if (Math.random() < 0.7) righe.push({ t: SO_FRASI(t), liv: 0, p }); if (righe.length % 3 === 0) p++; giu(f, l + 1); });
    giu(D[1], 1); voci = righe.map(() => 0); primo = true; fatto = false; aggiornato = true; campo = voci.slice();
    $q('.so-ob').innerHTML = somm(righe.map(r => r.liv)); $q('.msg').textContent = ''; disegna();
  }
  function disegna() {
    const num = numera(voci);
    $q('.so-doc').innerHTML = `<div class="so-tit">${escH(D[0])}</div>` + righe.map((r, i) => `<div class="so-r"><select data-i="${i}" ${fatto ? 'disabled' : ''}>${['Normale', 'Titolo 1', 'Titolo 2', 'Titolo 3'].map((s, k) => `<option value="${k}"${voci[i] === k ? ' selected' : ''}>${s}</option>`).join('')}</select><span class="so-t l${voci[i]}">${voci[i] ? `<b>${num[i]}</b> ` : ''}${escH(r.t)}</span></div>`).join('');
    $q('.so-mio').innerHTML = somm(campo);
  }
  c.addEventListener('change', e => { const s = e.target.closest('.so-doc select'); if (!s || fatto) return; voci[+s.dataset.i] = +s.value; aggiornato = false; disegna(); });
  c.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b) return; const m = $q('.msg');
    if (b.dataset.a === 'n') nuovo();
    if (b.dataset.a === 'a') { campo = voci.slice(); aggiornato = true; disegna(); }
    if (b.dataset.a === 'v' && !fatto) {
      const sbagliate = righe.filter((r, i) => r.liv !== voci[i]).length;
      if (sbagliate) { if (primo) { st.tot++; primo = false; up(); } m.textContent = `${sbagliate} rig${sbagliate === 1 ? 'a ha' : 'he hanno'} lo stile sbagliato. Titolo 1 è per i capitoli, Titolo 2 per i paragrafi, Titolo 3 per i sottoparagrafi; il testo resta Normale.`; m.style.color = 'var(--ko)'; return; }
      if (!aggiornato || campo.some((v, i) => v !== voci[i])) { m.textContent = 'Gli stili sono giusti, ma il sommario non è aggiornato: è un campo, non si aggiorna da solo. Premete «Aggiorna sommario» (in Word: clic destro e Aggiorna campo).'; m.style.color = 'var(--ko)'; return; }
      fatto = true; if (primo) { st.tot++; st.ok++; primo = false; up(); }
      m.textContent = 'Esatto! Il sommario usa gli stili dei titoli e la numerazione a più livelli. Ricordate di aggiornarlo sempre come ultimo passaggio.'; m.style.color = 'var(--ok)'; disegna();
    }
  });
  up(); nuovo();
}

/* ---------- la stampa unione ---------- */
const SU_NOMI = [['Anna', 'Rossi'], ['Luca', 'Bianchi'], ['Sara', 'Verdi'], ['Marco', 'Russo'], ['Giulia', 'Ferrari'], ['Matteo', 'Esposito'], ['Elisa', 'Romano'], ['Davide', 'Colombo']];
const SU_OP = [['>=', 'Maggiore o uguale a'], ['>', 'Maggiore di'], ['<', 'Minore di'], ['<=', 'Minore o uguale a'], ['=', 'Uguale a'], ['<>', 'Diverso da']];
const SU_MODELLI = [
  { t: 'Convocazione a colloquio', campi: ['Nome', 'Cognome', 'Età', 'Data', 'Ora'],
    pezzi: ['Gentile ', 'Nome', ' ', 'Cognome', ',\nla convochiamo per un colloquio il giorno ', 'Data', ' alle ore ', 'Ora', '.\n', null, '\nCordiali saluti.'],
    se: ['Età', '>=', 18, 'Visto che lei è maggiorenne, può venire da solo.', 'Dovrà venire accompagnato da un genitore.'] },
  { t: 'Gita scolastica', campi: ['Nome', 'Classe', 'Età', 'Data', 'Meta'],
    pezzi: ['Ciao ', 'Nome', ' della classe ', 'Classe', ',\nil giorno ', 'Data', ' andremo in gita a ', 'Meta', '.\n', null, '\nA presto!'],
    se: ['Età', '<', 18, 'Fai firmare l\'autorizzazione a un genitore.', 'Puoi firmare tu l\'autorizzazione.'] }
];
function suDati(M) {
  const eta = shuffle([pick([15, 16]), 17, 18, pick([19, 20])]), meta = pick(['Torino', 'Firenze', 'Ravenna', 'Verona']), data = `${rnd(10, 28)}/${pick(['03', '04', '05'])}/2027`;
  return shuffle(SU_NOMI).slice(0, 4).map(([n, c], k) => ({ Nome: n, Cognome: c, Età: eta[k], Data: M.t.startsWith('Gita') ? data : `${rnd(10, 28)}/${pick(['01', '02'])}/2027`, Ora: pick(['9:00', '10:30', '15:00', '16:30']), Classe: pick(['1A', '1B', '1C']), Meta: meta }));
}
function suLettera(M, scelte, se, r) {
  const ok = { '>=': (a, b) => a >= b, '>': (a, b) => a > b, '<': (a, b) => a < b, '<=': (a, b) => a <= b, '=': (a, b) => a == b, '<>': (a, b) => a != b };
  let k = 0;
  return M.pezzi.map((p, i) => { if (p === null) { const v = r[se[0]]; return se[0] && se[1] && se[2] !== '' && ok[se[1]](isNaN(+v) ? v : +v, isNaN(+se[2]) ? se[2] : +se[2]) ? M.se[3] : M.se[4]; }
    if (i % 2 === 1) { const f = scelte[k++]; return f ? String(r[f]) : '«?»'; } return p; }).join('');
}
function stampaUnione(el, label = 'La stampa unione') {
  const st = stat(label);
  let M, dati, scelte, se, k, primo, fatto;
  el.innerHTML = `<div class="card sulab">${turn()}<div class="row"><button class="btn sec" data-a="n">Altra lettera</button></div>
   <p class="q">Scheda Lettere: scegliete il campo unione per ogni spazio e impostate la regola SE, così che le lettere vengano come quelle attese.</p>
   <div class="su-due"><div><b>I destinatari (origine dati)</b><div class="su-dati"></div></div><div><b>Le lettere attese</b><div class="su-ob"></div></div></div>
   <b>Il documento principale</b><div class="su-doc"></div>
   <div class="row"><button class="btn sec" data-a="p">Anteprima risultati</button><button class="btn" data-a="v">Completa unione</button></div><div class="su-ant"></div><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.sulab'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Unioni giuste al primo colpo: ${st.ok} su ${st.tot}`;
  const giuste = r => suLettera(M, M.pezzi.filter((p, i) => i % 2 === 1 && p !== null), M.se, r);
  const html = t => escH(t).replace(/\n/g, '<br>');
  function nuovo() {
    M = pick(SU_MODELLI); dati = suDati(M); scelte = M.pezzi.filter((p, i) => i % 2 === 1 && p !== null).map(() => ''); se = ['', '', '']; k = -1; primo = true; fatto = false;
    $q('.su-dati').innerHTML = `<div class="fc-wrap"><table class="fc su-tab"><thead><tr>${M.campi.map(f => `<th>${f}</th>`).join('')}</tr></thead><tbody>${dati.map(r => `<tr>${M.campi.map(f => `<td>${escH(r[f])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    const due = [dati[0], dati.find(r => giuste(r).includes(M.se[3]) !== giuste(dati[0]).includes(M.se[3]))];
    $q('.su-ob').innerHTML = due.map(r => `<div class="su-let">${html(giuste(r))}</div>`).join('');
    $q('.msg').textContent = ''; $q('.su-ant').innerHTML = ''; doc();
  }
  function doc() {
    let j = 0;
    const sel = (i, opts, v, cl) => `<select data-${cl}="${i}" ${fatto ? 'disabled' : ''}><option value=""></option>${opts.map(([val, t]) => `<option value="${val}"${String(v) === String(val) ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
    $q('.su-doc').innerHTML = '<div class="su-let su-mod">' + M.pezzi.map((p, i) => p === null
      ? `<span class="su-se">{ SE ${sel(0, M.campi.map(f => [f, '«' + f + '»']), se[0], 's')} ${sel(1, SU_OP, se[1], 's')} ${sel(2, [14, 15, 16, 17, 18, 19, 20].map(v => [v, v]), se[2], 's')} «${escH(M.se[3])}» altrimenti «${escH(M.se[4])}» }</span>`
      : i % 2 === 1 ? sel(j, M.campi.map(f => [f, '«' + f + '»']), scelte[j++], 'c') : html(p)).join('') + '</div>';
  }
  function anteprima() { k = (k + 1) % dati.length; $q('.su-ant').innerHTML = `<b>Anteprima: destinatario ${k + 1} di ${dati.length}</b><div class="su-let">${html(suLettera(M, scelte, se, dati[k]))}</div>`; }
  c.addEventListener('change', e => { const s = e.target.closest('.su-doc select'); if (!s || fatto) return;
    if (s.dataset.c !== undefined) scelte[+s.dataset.c] = s.value; else se[+s.dataset.s] = s.value;
    if (k >= 0) { k--; anteprima(); } });
  c.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b) return; const m = $q('.msg');
    if (b.dataset.a === 'n') nuovo();
    if (b.dataset.a === 'p') anteprima();
    if (b.dataset.a === 'v' && !fatto) {
      if (scelte.some(x => !x) || se.some(x => x === '')) { m.textContent = 'Completate prima tutti gli spazi e la regola SE.'; m.style.color = 'var(--mute)'; return; }
      const esito = dati.map(r => [suLettera(M, scelte, se, r), giuste(r)]), sbagliate = esito.filter(([a, g]) => a !== g).length;
      if (primo) { st.tot++; if (!sbagliate) st.ok++; primo = false; up(); }
      $q('.su-ant').innerHTML = `<b>Le lettere generate</b>` + esito.map(([a, g]) => `<div class="su-let ${a === g ? 'giusta' : 'sbagliata'}">${html(a)}</div>`).join('');
      if (sbagliate) { m.textContent = `${sbagliate} letter${sbagliate === 1 ? 'a non è uguale' : 'e non sono uguali'} a quella attesa (in rosso): controllate i campi e la regola SE, poi riprovate.`; m.style.color = 'var(--ko)'; }
      else { fatto = true; doc(); m.textContent = `Esatto! Una lettera per ogni destinatario, ${dati.length} in tutto: la regola SE ha scelto la frase giusta per ognuno.`; m.style.color = 'var(--ok)'; }
    }
  });
  up(); nuovo();
}

/* ---------- lo schema diapositiva ---------- */
const SD_MOD = [['il logo della scuola', 'logo'], ['il titolo in rosso', 'rosso'], ['lo sfondo azzurro', 'sfondo'], ['il numero di diapositiva', 'num']];
function schemaDiapositiva(el, label = 'Lo schema diapositiva') {
  const st = stat(label);
  let L, dove, mod, nascosta, tipo, giuste, scelte, primo, fatto;
  el.innerHTML = `<div class="card sdlab">${turn()}<div class="row"><select class="sd-liv"><option value="1">Livello 1</option><option value="2">Livello 2: con la grafica di sfondo nascosta</option></select><button class="btn sec" data-a="n">Altra modifica</button></div>
   <p class="q sd-q"></p><div class="sd-due"><div class="sd-sch"></div><div class="sd-sl"></div></div><div class="row sd-azioni"></div><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.sdlab'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Risposte giuste al primo colpo: ${st.ok} su ${st.tot}`;
  const NOMI = { M: 'Schema principale', T: 'Layout «Titolo»', C: 'Layout «Titolo e contenuto»' };
  const vede = (i, d = dove) => d === 'M' ? !(mod === 'logo' && nascosta === i) : d === 'T' || d === 'C' ? L[i] === d && !(mod === 'logo' && nascosta === i) : d === 's' + i;
  const thumb = (cls, lay, on, testo, extra = '') => `<div class="sd-d ${cls}${on ? ' m-' + mod : ''}" ${extra}><div class="sd-ti"></div>${lay === 'C' ? '<div class="sd-co"><i></i><i></i><i></i></div>' : '<div class="sd-st"></div>'}${on && mod === 'logo' ? '<span class="sd-logo"></span>' : ''}${on && mod === 'num' ? '<span class="sd-num">#</span>' : ''}<span class="sd-n">${testo}</span></div>`;
  function disegna(mostra) {
    const on = d => mostra && (d === dove || (dove === 'M' && (d === 'T' || d === 'C')));
    $q('.sd-sch').innerHTML = `<b>Visualizza: Schema diapositiva</b>${thumb('sd-m', 'C', on('M'), 'Schema principale', tipo === 'B' && !fatto ? 'data-d="M"' : '')}<div class="sd-lay">${thumb('', 'T', on('T'), 'Layout Titolo', tipo === 'B' && !fatto ? 'data-d="T"' : '')}${thumb('', 'C', on('C'), 'Layout Titolo e contenuto', tipo === 'B' && !fatto ? 'data-d="C"' : '')}</div>`;
    $q('.sd-sl').innerHTML = `<b>Le diapositive</b><div class="sd-g">${L.map((l, i) => thumb(`sd-s${scelte.has(i) ? ' scelta' : ''}${mostra && tipo === 'A' && giuste.has(i) !== scelte.has(i) ? (scelte.has(i) ? ' errore' : ' mancata') : ''}`, l, mostra && vede(i), `${i + 1}${nascosta === i ? ' · grafica di sfondo nascosta' : ''}`, `data-s="${i}"`)).join('')}</div>`;
  }
  function nuovo() {
    const liv = +$q('.sd-liv').value;
    L = ['T', ...shuffle(['C', 'C', 'C', 'T', 'C'])];
    [, mod] = pick(SD_MOD); tipo = Math.random() < 0.5 ? 'A' : 'B'; nascosta = liv === 2 ? rnd(1, 5) : -1;
    if (liv === 2 && mod !== 'logo' && Math.random() < 0.7) mod = 'logo';
    dove = pick(['M', 'T', 'C', 's' + rnd(1, 5)]); if (tipo === 'B' && dove[0] === 's' && dove === 's' + nascosta) dove = 'M';
    giuste = new Set(L.map((_, i) => i).filter(i => vede(i))); scelte = new Set(); primo = true; fatto = false;
    const cosa = SD_MOD.find(x => x[1] === mod)[0], qui = dove === 'M' ? 'nello schema principale' : dove[0] === 's' ? `solo nella diapositiva ${+dove.slice(1) + 1}` : `nel ${NOMI[dove].replace('Layout', 'layout')}`;
    if (tipo === 'A') {
      $q('.sd-q').innerHTML = `Mettete <b>${cosa}</b> ${qui}. Su quali diapositive si vedrà? Fate clic sulle diapositive, poi verificate.`;
      $q('.sd-azioni').innerHTML = '<button class="btn" data-a="v">Verifica</button>';
    } else {
      const per = dove === 'M' ? 'su tutte le diapositive' : dove[0] === 's' ? `solo sulla diapositiva ${+dove.slice(1) + 1}` : `su tutte e sole le diapositive con il ${NOMI[dove].replace('Layout', 'layout')}`;
      $q('.sd-q').innerHTML = `Volete <b>${cosa}</b> ${per}${nascosta >= 0 && dove === 'M' && mod === 'logo' ? ' (tranne quella con la grafica di sfondo nascosta)' : ''}. Dove lo mettete? Fate clic sullo schema, su un layout o su una diapositiva.`;
      $q('.sd-azioni').innerHTML = '';
    }
    $q('.msg').textContent = ''; disegna(false);
  }
  const spiega = () => dove === 'M' ? 'Una modifica nello schema principale vale per tutti i layout e quindi per tutte le diapositive' + (nascosta >= 0 && mod === 'logo' ? ', tranne quella con la grafica di sfondo nascosta, che non mostra il logo.' : '.')
    : dove[0] === 's' ? 'Una modifica fatta su una diapositiva resta solo su quella diapositiva.' : `Una modifica in un layout vale solo per le diapositive che usano quel layout${nascosta >= 0 && mod === 'logo' ? ' (e la grafica di sfondo nascosta toglie il logo)' : ''}.`;
  function chiudi(ok) { if (primo) { st.tot++; if (ok) st.ok++; primo = false; up(); } fatto = true; $q('.sd-azioni').innerHTML = ''; disegna(true);
    const m = $q('.msg'); m.textContent = (ok ? 'Esatto! ' : 'Non proprio. ') + spiega(); m.style.color = ok ? 'var(--ok)' : 'var(--ko)'; }
  c.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (b) { if (b.dataset.a === 'n') nuovo(); if (b.dataset.a === 'v' && !fatto) chiudi(giuste.size === scelte.size && [...giuste].every(i => scelte.has(i))); return; }
    if (fatto) return;
    const s = e.target.closest('.sd-s');
    if (tipo === 'A' && s) { const i = +s.dataset.s; scelte.has(i) ? scelte.delete(i) : scelte.add(i); disegna(false); return; }
    if (tipo === 'B') { const d = e.target.closest('[data-d]'), sl = s ? 's' + s.dataset.s : d && d.dataset.d; if (!sl) return;
      const ris = new Set(L.map((_, i) => i).filter(i => vede(i, sl))), ok = ris.size === giuste.size && [...giuste].every(i => ris.has(i));
      chiudi(ok);
      if (!ok) { const m = $q('.msg'); m.textContent = `Non proprio: messo lì, si vedrebbe su ${ris.size ? 'diapositive diverse da quelle volute' : 'nessuna diapositiva voluta'}. Il posto giusto era: ${dove[0] === 's' ? 'la diapositiva ' + (+dove.slice(1) + 1) : NOMI[dove]}. ` + spiega(); } }
  });
  $q('.sd-liv').onchange = nuovo; up(); nuovo();
}
