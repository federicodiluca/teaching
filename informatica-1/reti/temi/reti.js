/* Reti di calcolatori (Informatica 1): giochi ad hoc. Solo definizioni: va caricato dopo assets/giochi.js.
   - viaggio(el, etichetta): il viaggio di un pacchetto tra PC, switch, router e server; a ogni passo si sceglie dove va.
   - dnsLab(el, etichetta): la risoluzione di un nome di dominio, domanda dopo domanda, dal browser al server autorevole.
   - urlLab(el, etichetta): si etichettano le parti di un indirizzo (protocollo, dominio, porta, percorso, parametri, frammento).
   - phishing(el, etichetta): un'email sospetta in cui trovare tutti i segnali di phishing.
   - passwordLab(el, etichetta): il tempo per indovinare una password scritta dal vivo e la sfida tra due password.
   - reteCasa(el, etichetta): modem, router, switch, access point e dispositivi da collegare (cavo o Wi-Fi) fino a Internet.
   Gli stili sono in assets/giochi.css (sezione "simulatori"). */

/* ---------- viaggio di un pacchetto ---------- */
const NODI_RETE = { pcA: [60, 70, 'PC di Ada'], pcB: [60, 190, 'PC di Bruno'], sw: [200, 130, 'Switch'], ap: [200, 250, 'Access point'], tel: [80, 290, 'Telefono'],
  r1: [360, 130, 'Router di casa'], net: [520, 130, 'Internet'], r2: [680, 130, 'Router del server'], srv: [800, 70, 'Server web'], dns: [800, 210, 'Server DNS'] };
const LINK_RETE = [['pcA', 'sw'], ['pcB', 'sw'], ['sw', 'r1'], ['ap', 'sw'], ['tel', 'ap'], ['r1', 'net'], ['net', 'r2'], ['r2', 'srv'], ['r2', 'dns']];
const VIAGGI = [
  { t: 'Ada manda un file a Bruno, nella stessa rete di casa.', da: 'pcA', percorso: ['pcA', 'sw', 'pcB'], spiega: { sw: 'Lo switch collega i dispositivi della stessa rete locale e manda il pacchetto solo al destinatario.', pcB: 'Arrivato: non è servito il router, perché mittente e destinatario sono nella stessa LAN.' } },
  { t: 'Ada apre un sito web che sta su un server lontano.', da: 'pcA', percorso: ['pcA', 'sw', 'r1', 'net', 'r2', 'srv'], spiega: { sw: 'Prima tappa: lo switch della rete di casa.', r1: 'Il destinatario è in un\'altra rete: serve il router, che fa da porta verso Internet.', net: 'Il pacchetto attraversa Internet, passando da router in router.', r2: 'Il router della rete del server lo fa entrare nella sua rete.', srv: 'Arrivato al server web, che risponderà con la pagina.' } },
  { t: 'Dal telefono in Wi-Fi si chiede l\'indirizzo IP di un nome di dominio.', da: 'tel', percorso: ['tel', 'ap', 'sw', 'r1', 'net', 'r2', 'dns'], spiega: { ap: 'L\'access point collega i dispositivi senza fili alla rete.', sw: 'Dall\'access point si passa alla rete cablata.', r1: 'Il server DNS è fuori casa: serve il router.', net: 'Si attraversa Internet.', r2: 'Si entra nella rete del server DNS.', dns: 'Il server DNS risponde con l\'indirizzo IP corrispondente al nome.' } }
];
function viaggio(el, label = 'Il viaggio del pacchetto') {
  const st = stat(label);
  let V, k, primo;
  el.innerHTML = `<div class="card via">${turn()}<div class="row"><select class="mt">${VIAGGI.map((v, i) => `<option value="${i}">Viaggio ${i + 1}</option>`).join('')}</select></div>
   <p class="q via-t"></p><div class="via-svg"></div><p class="via-dom"></p><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.via'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Tappe giuste al primo colpo: ${st.ok} su ${st.tot}`;
  function carica() { V = VIAGGI[+$q('.mt').value]; k = 0; primo = true; $q('.via-t').innerHTML = V.t; $q('.msg').textContent = ''; disegna(); }
  function disegna() {
    const qui = V.percorso[k], fatto = V.percorso.slice(0, k + 1), fine = k === V.percorso.length - 1;
    let s = '';
    LINK_RETE.forEach(([a, b]) => { const [x1, y1] = NODI_RETE[a], [x2, y2] = NODI_RETE[b], usato = fatto.includes(a) && fatto.includes(b) && Math.abs(fatto.indexOf(a) - fatto.indexOf(b)) === 1;
      s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="lk${b === 'net' || a === 'net' ? ' internet' : ''}${usato ? ' usato' : ''}"/>`; });
    Object.entries(NODI_RETE).forEach(([id, [x, y, nome]]) => {
      const vicino = !fine && LINK_RETE.some(([a, b]) => (a === qui && b === id) || (b === qui && a === id));
      s += `<g class="nodo ${id === 'net' ? 'nuvola' : ''}${id === qui ? ' qui' : ''}${fatto.includes(id) ? ' visto' : ''}${vicino ? ' scegli' : ''}" data-n="${id}" transform="translate(${x},${y})">${id === 'net' ? '<ellipse rx="56" ry="30"/>' : '<rect x="-56" y="-20" width="112" height="40" rx="10"/>'}<text y="5">${nome}</text></g>`;
    });
    const [px, py] = NODI_RETE[qui];
    s += `<g class="pacchetto" style="transform:translate(${px}px,${py - 34}px)"><rect x="-14" y="-10" width="28" height="20" rx="4"/><path d="M-14 -10L0 2L14 -10"/></g>`;
    $q('.via-svg').innerHTML = `<svg viewBox="0 0 870 330" class="via-s">${s}</svg>`;
    $q('.via-dom').innerHTML = fine ? '<b>Arrivato!</b> Scegliete un altro viaggio dal menu.' : `Il pacchetto è a <b>${NODI_RETE[qui][2]}</b>. Fate clic sul dispositivo dove va adesso (quelli collegati sono evidenziati).`;
  }
  c.addEventListener('click', e => {
    const g = e.target.closest('.nodo.scegli'); if (!g) return; const giusto = V.percorso[k + 1], ok = g.dataset.n === giusto, m = $q('.msg');
    if (primo) { st.tot++; if (ok) st.ok++; primo = false; up(); }
    if (!ok) { m.textContent = 'No, non è la strada giusta: pensate a dove si trova il destinatario.'; m.style.color = 'var(--ko)'; g.classList.add('scossa'); return; }
    k++; primo = true; m.textContent = V.spiega[giusto] || ''; m.style.color = 'var(--ink)'; disegna();
  });
  $q('.mt').onchange = carica; up(); carica();
}

/* ---------- risoluzione DNS ---------- */
function dnsLab(el, label = 'La risoluzione DNS') {
  const st = stat(label);
  const DOMINI = [['www.scuola.it', 'it', 'scuola.it'], ['www.wikipedia.org', 'org', 'wikipedia.org'], ['mail.esempio.com', 'com', 'esempio.com'], ['www.comune.roma.it', 'it', 'roma.it']];
  let D, ip, k, primo;
  const ATTORI = { browser: 'Browser', resolver: 'Resolver DNS del provider', root: 'Server radice (.)', tld: 'Server del TLD', aut: 'Server autorevole' };
  el.innerHTML = `<div class="card dns">${turn()}<div class="row"><button class="btn sec" data-a="n">Altro nome</button></div><p class="q dns-t"></p>
   <div class="dns-att">${Object.entries(ATTORI).map(([id, n]) => `<button class="dns-a" data-x="${id}"><b>${n}</b><small></small></button>`).join('')}</div>
   <ol class="dns-log"></ol><p class="dns-dom"></p><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.dns'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Passaggi giusti al primo colpo: ${st.ok} su ${st.tot}`;
  let PASSI;
  function nuovo() {
    D = pick(DOMINI); ip = `${rnd(80, 212)}.${rnd(0, 255)}.${rnd(0, 255)}.${rnd(1, 254)}`; k = 0; primo = true; $q('.msg').textContent = '';
    PASSI = [
      { a: 'resolver', txt: `Il browser chiede al resolver del provider: «qual è l'IP di ${D[0]}?»` },
      { a: 'root', txt: `Il resolver non lo sa: chiede a un server radice, che risponde «per .${D[1]} chiedi al server del TLD .${D[1]}».` },
      { a: 'tld', txt: `Il server del TLD .${D[1]} risponde: «per ${D[2]} chiedi al suo server autorevole».` },
      { a: 'aut', txt: `Il server autorevole di ${D[2]} conosce la risposta: ${D[0]} ha l'IP ${ip}.` },
      { a: 'resolver', txt: `La risposta torna al resolver, che la tiene in memoria (cache) per le prossime volte.` },
      { a: 'browser', txt: `Il resolver risponde al browser: ora il browser può collegarsi a ${ip}.` }];
    $q('.dns-t').innerHTML = `Nella barra degli indirizzi scrivete <code>${D[0]}</code>. Il computer però conosce solo gli indirizzi IP: chi trova l'IP?`;
    c.querySelectorAll('.dns-a small').forEach(s => s.textContent = ''); disegna();
  }
  function disegna() {
    const da = k === 0 ? 'browser' : PASSI[k - 1].a;
    c.querySelectorAll('.dns-a').forEach(b => { b.classList.toggle('qui', b.dataset.x === da); b.classList.toggle('fatto', PASSI.slice(0, k).some(p => p.a === b.dataset.x)); });
    $q('.dns-log').innerHTML = PASSI.slice(0, k).map(p => `<li>${p.txt}</li>`).join('');
    $q('.dns-dom').innerHTML = k >= PASSI.length ? `<b>Risolto:</b> ${D[0]} → <code>${ip}</code>. Con «Altro nome» si riparte.` : `Adesso la domanda (o la risposta) è da <b>${ATTORI[da]}</b>: a chi va?`;
  }
  c.addEventListener('click', e => {
    const b = e.target.closest('.dns-a'); if (!b || k >= PASSI.length) return; const ok = b.dataset.x === PASSI[k].a, m = $q('.msg');
    if (primo) { st.tot++; if (ok) st.ok++; primo = false; up(); }
    if (!ok) { m.textContent = 'No: pensate a chi può sapere la prossima informazione.'; m.style.color = 'var(--ko)'; b.classList.add('scossa'); setTimeout(() => b.classList.remove('scossa'), 400); return; }
    m.textContent = ''; k++; primo = true; disegna();
  });
  $q('[data-a=n]').onclick = nuovo; up(); nuovo();
}

/* ---------- anatomia di un URL ---------- */
function urlLab(el, label = 'Le parti di un URL') {
  const st = stat(label);
  const ESEMPI = [
    [['https', 'protocollo'], ['://', null], ['www.scuola.it', 'dominio'], ['/orari/classe.html', 'percorso'], ['?giorno=lunedi', 'parametri'], ['#mattina', 'frammento']],
    [['http', 'protocollo'], ['://', null], ['localhost', 'dominio'], [':8080', 'porta'], ['/api/studenti', 'percorso'], ['?classe=1M', 'parametri']],
    [['https', 'protocollo'], ['://', null], ['it.wikipedia.org', 'dominio'], ['/wiki/Internet', 'percorso'], ['#Storia', 'frammento']],
    [['ftp', 'protocollo'], ['://', null], ['files.esempio.com', 'dominio'], [':21', 'porta'], ['/documenti/compito.pdf', 'percorso']]
  ];
  const TIPI = ['protocollo', 'dominio', 'porta', 'percorso', 'parametri', 'frammento'];
  const ART_URL = { protocollo: 'il protocollo', dominio: 'il dominio', porta: 'la porta', percorso: 'il percorso', parametri: 'la parte dei parametri', frammento: 'il frammento' };
  let E, scelto, fatti, primo;
  el.innerHTML = `<div class="card url">${turn()}<div class="row"><button class="btn sec" data-a="n">Altro indirizzo</button></div>
   <p class="q">Scegliete un'etichetta e poi fate clic sulla parte dell'indirizzo che le corrisponde.</p><div class="url-tip">${TIPI.map(t => `<button class="btn sec" data-t="${t}">${t}</button>`).join('')}</div>
   <div class="url-riga"></div><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.url'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Parti giuste al primo colpo: ${st.ok} su ${st.tot}`;
  function nuovo() { E = pick(ESEMPI); scelto = null; fatti = {}; primo = {}; c.querySelectorAll('[data-t]').forEach(b => b.classList.remove('on')); $q('.msg').textContent = ''; disegna(); }
  function disegna() { $q('.url-riga').innerHTML = E.map(([p, t], i) => t ? `<button class="url-p${fatti[i] ? ' fatto' : ''}" data-i="${i}">${escH(p)}${fatti[i] ? `<small>${t}</small>` : ''}</button>` : `<span class="url-s">${p}</span>`).join(''); }
  c.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { scelto = b.dataset.t; c.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('on', x === b)); });
  c.addEventListener('click', e => {
    const b = e.target.closest('.url-p'); if (!b) return; const i = +b.dataset.i, m = $q('.msg');
    if (!scelto) { m.textContent = 'Prima scegliete un\'etichetta.'; m.style.color = 'var(--mute)'; return; }
    if (fatti[i]) return; const ok = E[i][1] === scelto;
    if (!(i in primo)) { primo[i] = ok; st.tot++; if (ok) st.ok++; up(); }
    if (!ok) { m.textContent = `No: questa parte non è ${ART_URL[scelto]}.`; m.style.color = 'var(--ko)'; b.classList.add('scossa'); setTimeout(() => b.classList.remove('scossa'), 400); return; }
    fatti[i] = true; disegna();
    const tutte = E.every(([, t], j) => !t || fatti[j]);
    m.textContent = tutte ? 'Tutte le parti sono al loro posto!' : 'Giusto!'; m.style.color = 'var(--ok)';
  });
  $q('[data-a=n]').onclick = nuovo; up(); nuovo();
}

/* ---------- caccia al phishing ---------- */
function phishing(el, label = 'Caccia al phishing') {
  const st = stat(label);
  const MAIL = [
    { da: ['Banca Sicura', 'assistenza@banca-sicura-verifica.xyz'], ogg: 'URGENTE: il tuo conto verrà bloccato entro 24 ore', corpo: [
      ['Gentile cliente,', null], ['abbiamo rilevato un accesso sospetto al tuo conto.', null],
      ['Se non confermi i tuoi dati entro 24 ore il conto sarà bloccato per sempre!', 'urgenza: mettono fretta e paura per non farvi ragionare'],
      ['Clicca qui per verificare: www.banca-sicura.it', 'il link mostra un indirizzo ma porta altrove (http://banca-sicura.login-verifica.ru)'],
      ['Inserisci nome utente, password e codice della carta.', 'una banca vera non chiede mai la password per email'],
      ['Grazie per la colaborazione, il servizzio clienti', 'errori di ortografia: colaborazione, servizzio']], allegato: null, mitt: 'il mittente ha un dominio strano, non quello della banca' },
    { da: ['Consegne Express', 'tracking@consegne-express-pacchi.top'], ogg: 'Il tuo pacco è in giacenza', corpo: [
      ['Ciao,', null], ['non siamo riusciti a consegnare il tuo pacco.', null],
      ['Per riceverlo devi pagare subito 1,99 € di spese di spedizione.', 'chiedono un piccolo pagamento: serve a rubare i dati della carta'],
      ['Apri il modulo allegato e compilalo.', null],
      ['Se non paghi entro oggi il pacco tornerà al mittente.', 'urgenza: «entro oggi»']], allegato: ['modulo_consegna.pdf.exe', 'l\'allegato finisce in .exe: è un programma, non un PDF'], mitt: 'il mittente ha un dominio strano (.top) e non sapete di aspettare un pacco' }
  ];
  let M, trovati, sbagli;
  el.innerHTML = `<div class="card phi">${turn()}<div class="row"><button class="btn sec" data-a="n">Un'altra email</button><span class="phi-cont"></span></div>
   <p class="q">Questa email è un tentativo di phishing. Fate clic su tutti gli elementi sospetti.</p><div class="phi-mail"></div><ul class="phi-trov"></ul><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.phi'), $q = s => c.querySelector(s);
  const segni = () => [['mitt', M.mitt], ...M.corpo.map((r, i) => [i, r[1]]).filter(x => x[1]), ...(M.allegato ? [['all', M.allegato[1]]] : [])];
  const up = () => { $q('.stat').textContent = `Email analizzate senza clic sbagliati: ${st.ok} su ${st.tot}`; $q('.phi-cont').textContent = `Segnali trovati: ${Object.keys(trovati).length} su ${segni().length}`; };
  function nuovo() {
    M = M === MAIL[0] ? MAIL[1] : MAIL[0]; trovati = {}; sbagli = false; $q('.msg').textContent = '';
    $q('.phi-mail').innerHTML = `<div class="phi-h"><span class="phi-x" data-s="mitt"><b>Da:</b> ${M.da[0]} &lt;${M.da[1]}&gt;</span><span><b>Oggetto:</b> ${escH(M.ogg)}</span></div><div class="phi-c">${M.corpo.map((r, i) => `<p class="phi-x" data-s="${i}">${escH(r[0])}</p>`).join('')}${M.allegato ? `<p class="phi-x phi-all" data-s="all">📎 ${M.allegato[0]}</p>` : ''}</div>`;
    $q('.phi-trov').innerHTML = ''; up();
  }
  c.addEventListener('click', e => {
    const x = e.target.closest('.phi-x'); if (!x) return; const s = x.dataset.s, seg = segni().find(g => String(g[0]) === s), m = $q('.msg');
    if (!seg) { sbagli = true; m.textContent = 'Questa riga di per sé non è sospetta.'; m.style.color = 'var(--mute)'; x.classList.add('scossa'); setTimeout(() => x.classList.remove('scossa'), 400); return; }
    if (trovati[s]) return; trovati[s] = true; x.classList.add('trovato');
    $q('.phi-trov').innerHTML += `<li>⚠ ${seg[1]}</li>`;
    if (Object.keys(trovati).length === segni().length) { st.tot++; if (!sbagli) st.ok++; m.textContent = 'Avete trovato tutti i segnali! In caso di dubbio: non cliccate, non rispondete, segnalate.'; m.style.color = 'var(--ok)'; }
    else m.textContent = '';
    up();
  });
  $q('[data-a=n]').onclick = nuovo; nuovo();
}

/* ---------- la password giusta ----------
   passwordLab(el, etichetta): due parti. Il laboratorio: si scrive una password (mai salvata né inviata) e si vede
   quanti tentativi servono e quanto tempo ci mette un attaccante che prova dieci miliardi di password al secondo.
   La sfida: due password, si sceglie la più robusta, poi compaiono i tempi e il motivo. */
const PW_COMUNI = ['password', 'qwerty', 'ciao', 'admin', 'juventus', 'inter', 'milan', 'roma', 'napoli', 'amore', 'italia', 'calcio', 'gatto', 'cane', 'pippo', 'ciccio', 'iloveyou', 'welcome', 'letmein', 'dragon', 'football', 'scuola', 'marco', 'giulia', 'luca', 'sole', 'mare', 'abc', 'asdf'];
function forzaPassword(pw) {
  const motivi = []; let alf = 0;
  const cl = [[/[a-z]/, 26, 'minuscole'], [/[A-Z]/, 26, 'maiuscole'], [/[0-9]/, 10, 'cifre'], [/[^a-zA-Z0-9]/, 33, 'simboli']];
  const usate = cl.filter(([re]) => re.test(pw)); usate.forEach(([, n]) => alf += n);
  let bit = pw.length ? pw.length * Math.log2(Math.max(alf, 2)) : 0;
  const basso = pw.toLowerCase().replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/@/g, 'a').replace(/\$/g, 's');
  const parola = PW_COMUNI.find(w => basso.includes(w));
  if (parola && basso.length - parola.length < 8) { const resto = basso.replace(parola, '').length; bit = Math.min(bit, 14 + resto * Math.log2(Math.max(alf, 2)) * 0.7); motivi.push(`contiene una parola comunissima («${parola}»): è tra le prime che si provano, anche scritta con 0 al posto di o`); }
  if (/^(.)\1+$/.test(pw)) { bit = Math.min(bit, 6); motivi.push('è un solo carattere ripetuto'); }
  if (/(0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf)/i.test(pw)) { bit = Math.min(bit, bit * 0.5); motivi.push('contiene una sequenza della tastiera o dei numeri'); }
  if (/(19|20)\d\d/.test(pw)) { bit -= 6; motivi.push('contiene un anno: date di nascita e anni si provano subito'); }
  if (pw.length && pw.length < 8) motivi.push('è più corta di 8 caratteri');
  if (pw.length >= 8 && pw.length < 14 && usate.length < 3) motivi.push(`usa solo ${usate.map(x => x[2]).join(' e ')}: aggiungete altri tipi di carattere o allungatela`);
  if (pw.length >= 14) motivi.push('è lunga: la lunghezza è ciò che conta di più');
  bit = Math.max(0, bit);
  const sec = Math.pow(2, bit) / 2 / 1e10;
  return { bit, sec, motivi, usate: usate.map(x => x[2]) };
}
function tempoLeggibile(s) {
  const U = [[3.15e9 * 1000, 'più di mille secoli'], [3.15e7 * 100, 'secoli'], [3.15e7, 'anni'], [86400 * 30, 'mesi'], [86400, 'giorni'], [3600, 'ore'], [60, 'minuti'], [1, 'secondi']];
  if (s < 1) return 'meno di un secondo';
  if (s >= U[0][0]) return U[0][1];
  for (const [v, n] of U.slice(1)) if (s >= v) { const q = Math.floor(s / v); return n === 'secoli' ? `circa ${Math.floor(s / 3.15e9)} secoli` : `circa ${q} ${q === 1 ? { anni: 'anno', mesi: 'mese', giorni: 'giorno', ore: 'ora', minuti: 'minuto', secondi: 'secondo' }[n] : n}`; }
}
const PW_SFIDE = ['juventus2008', 'Gatto!', 'p4ssw0rd', 'Marco1999', 'qwerty123', 'ciaociao', 'aaaaaaaaaaaa', 'Tr3n0!', 'mela-treno-nuvola-37', 'BiciclettaGialla', 'Xk7#pQ', 'cavallo batteria graffetta', 'ilmiocanesichiamaFuffi', 'Sole2024!', '7wK!r2Lm#9qZ', 'giulia', 'Napoli1926', 'lampone.ventilatore.8', 'Az1!', 'trenoverdetrenoblu', 'Fragola#71', 'zebra7k2', 'Mz9kq2Wt', 'nuvolarossa', 'Pk3!x'];
function passwordLab(el, label = 'La password giusta') {
  const st = stat(label);
  let A, B, primo, fatto;
  el.innerHTML = `<div class="card pwl">${turn()}<p class="q"><b>Il laboratorio.</b> Scrivete una password inventata (mai quella vera!): non viene salvata né inviata da nessuna parte.</p>
   <input class="pw-in" type="text" autocomplete="off" spellcheck="false" placeholder="per esempio: gatto2010"><div class="pw-bar"><i></i></div><p class="pw-t"></p><ul class="pw-mot"></ul>
   <hr><p class="q"><b>La sfida.</b> Quale delle due password resiste di più a un attaccante che ne prova dieci miliardi al secondo?</p>
   <div class="pw-duello"></div><div class="row"><button class="btn sec" data-a="n">Altra coppia</button></div><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.pwl'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Sfide indovinate al primo colpo: ${st.ok} su ${st.tot}`;
  const colore = b => b < 35 ? 'var(--ko)' : b < 60 ? '#f59e0b' : 'var(--ok)';
  function analizza() {
    const pw = $q('.pw-in').value, F = forzaPassword(pw), bar = $q('.pw-bar i');
    bar.style.width = Math.min(100, F.bit / 90 * 100) + '%'; bar.style.background = colore(F.bit);
    $q('.pw-t').innerHTML = pw ? `Tempo per indovinarla: <b>${tempoLeggibile(F.sec)}</b>` : '';
    $q('.pw-mot').innerHTML = pw ? F.motivi.map(m => `<li>${escH(m)}</li>`).join('') : '';
  }
  function nuovo() {
    let a, b; do { [a, b] = shuffle(PW_SFIDE).slice(0, 2); } while (Math.abs(forzaPassword(a).bit - forzaPassword(b).bit) < 8 || tempoLeggibile(forzaPassword(a).sec) === tempoLeggibile(forzaPassword(b).sec));
    A = a; B = b; primo = true; fatto = false; $q('.msg').textContent = '';
    $q('.pw-duello').innerHTML = [A, B].map((p, i) => `<button class="pw-c" data-i="${i}"><code>${escH(p)}</code><span class="pw-r"></span></button>`).join('');
  }
  c.addEventListener('click', e => {
    const b = e.target.closest('.pw-c'); if (!b || fatto) return; fatto = true;
    const F = [A, B].map(forzaPassword), vince = F[0].bit > F[1].bit ? 0 : 1, ok = +b.dataset.i === vince;
    if (primo) { st.tot++; if (ok) st.ok++; primo = false; up(); }
    c.querySelectorAll('.pw-c').forEach((x, i) => { x.classList.add(i === vince ? 'giusto' : 'debole'); x.querySelector('.pw-r').textContent = tempoLeggibile(F[i].sec); });
    const m = $q('.msg'), w = F[vince], l = F[1 - vince];
    m.innerHTML = (ok ? 'Esatto! ' : 'No. ') + `<code>${escH([A, B][vince])}</code> resiste ${tempoLeggibile(w.sec)}, l’altra ${tempoLeggibile(l.sec)}.` + (l.motivi.length ? ` La più debole ${escH(l.motivi[0])}.` : ''); m.style.color = ok ? 'var(--ok)' : 'var(--ko)';
  });
  $q('.pw-in').addEventListener('input', analizza); $q('[data-a=n]').onclick = nuovo; up(); nuovo(); analizza();
}

/* ---------- la rete di casa ----------
   reteCasa(el, etichetta): si collegano i pezzi facendo clic su due nodi (cavo o Wi-Fi lo decide il tipo di dispositivo).
   Un collegamento sbagliato viene rifiutato con il motivo; quando tutti i dispositivi raggiungono Internet si vede
   il percorso di ciascuno. */
const CASA_INFRA = { net: [70, 45, 'Internet', 'infra'], modem: [70, 150, 'Modem', 'infra'], router: [70, 265, 'Router', 'infra'], sw: [235, 215, 'Switch', 'infra'], ap: [235, 345, 'Access point', 'infra'] };
const CASA_DISP = [['pc', 'PC fisso', 'cavo'], ['port', 'Portatile', 'entrambi'], ['tel', 'Smartphone', 'wifi'], ['tab', 'Tablet', 'wifi'], ['stampa', 'Stampante', 'cavo'], ['tv', 'Smart TV', 'cavo'], ['cons', 'Console', 'cavo']];
function collegaCasa(a, b, tipo) {
  const infra = x => ['net', 'modem', 'router', 'sw', 'ap'].includes(x), coppia = (x, y) => (a === x && b === y) || (a === y && b === x);
  if (coppia('net', 'modem')) return { ok: true, t: 'cavo' };
  if (coppia('modem', 'router')) return { ok: true, t: 'cavo' };
  if (coppia('router', 'sw') || coppia('router', 'ap') || coppia('sw', 'ap')) return { ok: true, t: 'cavo' };
  if (a === 'net' || b === 'net') return { ok: false, m: 'La linea dell’operatore che arriva da Internet entra nel modem.' };
  if (infra(a) && infra(b)) return { ok: false, m: (coppia('modem', 'sw') || coppia('modem', 'ap')) ? 'Tra il modem e la rete di casa ci vuole il router: è lui che collega la rete locale a Internet e smista i pacchetti.' : 'Questo collegamento non serve: pensate a chi passa i pacchetti a chi.' };
  if (!infra(a) && !infra(b)) return { ok: false, m: 'Due dispositivi non si collegano direttamente tra loro: in mezzo serve lo switch (con il cavo) o l’access point (senza fili).' };
  const d = infra(a) ? b : a, i = infra(a) ? a : b, t = tipo[d], nome = CASA_DISP.find(x => x[0] === d)[1];
  if (i === 'modem') return { ok: false, m: 'Il modem parla con la linea dell’operatore: i dispositivi si collegano al router, allo switch o all’access point.' };
  if (i === 'ap') return t === 'cavo' ? { ok: false, m: `${nome} qui ha solo la porta per il cavo: collegatelo allo switch o al router.` } : { ok: true, t: 'wifi' };
  return t === 'wifi' ? { ok: false, m: `${nome} non ha la porta per il cavo di rete: si collega senza fili all’access point.` } : { ok: true, t: 'cavo' };
}
function reteCasa(el, label = 'La rete di casa') {
  const st = stat(label);
  let disp, pos, tipo, link, sel, errori, fatto;
  el.innerHTML = `<div class="card casa">${turn()}<p class="q">Collegate i pezzi facendo clic su due nodi, uno dopo l’altro: ogni dispositivo deve arrivare a Internet. Il tipo di collegamento (cavo o Wi-Fi) dipende dal dispositivo.</p>
   <div class="cs-svg"></div><div class="row"><button class="btn sec" data-a="u">Togli l’ultimo collegamento</button><button class="btn sec" data-a="n">Altra casa</button></div><p class="msg"></p><div class="cs-leg"><span class="cavo">— cavo</span><span class="wifi">- - Wi-Fi</span></div><div class="stat"></div></div>`;
  const c = el.querySelector('.casa'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Case collegate senza errori: ${st.ok} su ${st.tot}`;
  function nuovo() {
    const scelti = shuffle(CASA_DISP).slice(0, rnd(3, 5));
    if (!scelti.some(x => x[2] === 'wifi')) scelti[0] = CASA_DISP[2];
    if (!scelti.some(x => x[2] === 'cavo')) scelti[1] = CASA_DISP[0];
    disp = scelti; pos = { ...CASA_INFRA }; tipo = {};
    disp.forEach((d, i) => { pos[d[0]] = [400, 45 + i * (300 / Math.max(1, disp.length - 1)), d[1], d[2]]; tipo[d[0]] = d[2]; });
    link = []; sel = null; errori = 0; fatto = false; $q('.msg').textContent = ''; disegna();
  }
  function raggiunge() { const vicini = id => link.filter(l => l.includes(id)).map(l => l[0] === id ? l[1] : l[0]);
    const vis = new Set(['net']), coda = ['net'], da = {}; while (coda.length) { const x = coda.shift(); vicini(x).forEach(y => { if (!vis.has(y)) { vis.add(y); da[y] = x; coda.push(y); } }); }
    return { vis, da }; }
  function disegna(percorsi) {
    let s = '';
    link.forEach(([a, b, t]) => { const [x1, y1] = pos[a], [x2, y2] = pos[b]; s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="lk ${t}${percorsi ? ' usato' : ''}"/>`; });
    const R = raggiunge();
    Object.entries(pos).forEach(([id, [x, y, nome, k]]) => {
      const w = id === 'net' ? 0 : 126;
      s += `<g class="nodo ${k === 'infra' ? 'inf' : 'dis'}${sel === id ? ' qui' : ''}${R.vis.has(id) && id !== 'net' ? ' visto' : ''}" data-n="${id}" transform="translate(${x},${y})">${id === 'net' ? '<ellipse rx="62" ry="30"/>' : `<rect x="-${w / 2}" y="-22" width="${w}" height="44" rx="10"/>`}<text y="${k === 'infra' ? 5 : 0}">${nome}</text>${k !== 'infra' ? `<text y="16" class="sub">${k === 'wifi' ? 'solo Wi-Fi' : k === 'cavo' ? 'solo cavo' : 'cavo o Wi-Fi'}</text>` : ''}</g>`;
    });
    $q('.cs-svg').innerHTML = `<svg viewBox="0 0 470 390" class="via-s cs-s">${s}</svg>`;
  }
  c.addEventListener('click', e => {
    const g = e.target.closest('.cs-s .nodo'), m = $q('.msg');
    if (g && !fatto) { const id = g.dataset.n;
      if (!sel) { sel = id; disegna(); return; }
      if (sel === id) { sel = null; disegna(); return; }
      const a = sel; sel = null;
      if (link.some(l => (l[0] === a && l[1] === id) || (l[0] === id && l[1] === a))) { m.textContent = 'Questo collegamento c’è già.'; m.style.color = 'var(--mute)'; disegna(); return; }
      const r = collegaCasa(a, id, tipo);
      if (!r.ok) { errori++; m.textContent = r.m; m.style.color = 'var(--ko)'; disegna(); return; }
      link.push([a, id, r.t]); m.textContent = r.t === 'wifi' ? 'Collegato senza fili.' : 'Collegato con il cavo.'; m.style.color = 'var(--ink)';
      const R = raggiunge();
      if (disp.every(d => R.vis.has(d[0]))) { fatto = true; st.tot++; if (!errori) st.ok++; up();
        const strada = id => { const p = [id]; while (p[p.length - 1] !== 'net') p.push(R.da[p[p.length - 1]]); return p.map(x => pos[x][2]).join(' → '); };
        m.innerHTML = `Tutta la casa è in rete${errori ? ` (con ${errori} collegament${errori === 1 ? 'o rifiutato' : 'i rifiutati'})` : ', senza errori'}!<br>` + disp.map(d => escH(strada(d[0]))).join('<br>'); m.style.color = 'var(--ok)'; disegna(true); return; }
      disegna(); return; }
    const b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'n') nuovo();
    if (b.dataset.a === 'u' && !fatto && link.length) { link.pop(); sel = null; m.textContent = ''; disegna(); }
  });
  up(); nuovo();
}
