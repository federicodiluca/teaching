/* Prompt dei comandi di Windows simulato e generatori di domande sui comandi.
   Va caricato dopo assets/giochi.js e temi/filesystem.js. */

const PROMPT_ERR = {
  percorso: 'Impossibile trovare il percorso specificato.',
  file: 'Impossibile trovare il file specificato.',
  sintassi: 'La sintassi del nome del file, della directory o del volume non è corretta.',
  negato: 'Accesso negato.',
  esiste: 'Esiste già una sottodirectory o un file ',
  nonvuota: 'La directory non è vuota.',
  uso: 'Il processo non può accedere al file perché è utilizzato da un altro processo.',
  cmdsintassi: 'La sintassi del comando non è corretta.'
};
const PROMPT_SUGG = {
  ls: 'In cmd si usa dir (ls è di Linux e di PowerShell).', pwd: 'In cmd la cartella corrente è già nel prompt; cd da solo la stampa.',
  cat: 'In cmd si usa type.', rm: 'In cmd si usa del per i file e rd per le cartelle.', mv: 'In cmd si usa move (o ren per rinominare).',
  cp: 'In cmd si usa copy.', clear: 'In cmd si usa cls.', touch: 'In cmd non esiste un comando equivalente semplice: per un file vuoto si usa type nul > nome.',
  man: 'In cmd si usa help.'
};
const PROMPT_AIUTO = [
  ['CD', 'Mostra il nome della cartella corrente o la cambia.'], ['CLS', 'Cancella lo schermo.'], ['COPY', 'Copia un file in un altro punto.'],
  ['DEL', 'Elimina uno o più file.'], ['DIR', 'Mostra i file e le sottocartelle di una cartella.'], ['HELP', 'Mostra questo elenco.'],
  ['MD', 'Crea una cartella (come MKDIR).'], ['MOVE', 'Sposta un file o una cartella (e può rinominarlo).'], ['RD', 'Elimina una cartella vuota (RD /S anche non vuota).'],
  ['REN', 'Rinomina un file o una cartella.'], ['TREE', 'Mostra la struttura delle cartelle (TREE /F anche i file).'], ['TYPE', 'Mostra il contenuto di un file di testo.']
];

function pTokens(rest) {
  const t = [], sw = [];
  (rest.match(/"[^"]*"|\S+/g) || []).forEach(x => {
    if (/^\/[a-z]$/i.test(x)) sw.push(x.slice(1).toLowerCase()); else t.push(x.replace(/^"(.*)"$/, '$1'));
  });
  return { t, sw };
}
/* dir: cartella che contiene e nome dell'ultimo elemento di un percorso (che può non esistere) */
function pSplit(cwd, path) {
  const s = path.replace(/\//g, '\\').replace(/\\+$/, '');
  const i = s.lastIndexOf('\\');
  if (i < 0) return /^[a-z]:$/i.test(s) ? { dir: null, last: '' } : { dir: cwd, last: s };
  const d = i === 2 && /^[a-z]:/i.test(s) ? s.slice(0, 3) : s.slice(0, i) || '\\';
  return { dir: fsResolve(cwd, d), last: s.slice(i + 1) };
}
function pNome(d, n) { return d.c.find(x => x.n.toLowerCase() === n.toLowerCase()) || null; }
function pDentro(a, b) { for (let x = b; x; x = x.p) if (x === a) return true; return false; }
function pRimuovi(n) { n.p.c.splice(n.p.c.indexOf(n), 1); n.p = null; }

/* esegue una riga: restituisce {out, cls}. s = {T, cwd, hist} */
function pEsegui(s, riga) {
  riga = riga.trim();
  if (!riga) return { out: '' };
  const m = riga.match(/^([a-z]+)(.*)$/i);
  if (!m) return { out: `'${riga.split(/\s/)[0]}' non è riconosciuto come comando interno o esterno, un programma eseguibile o un file batch.` };
  const cmd = m[1].toLowerCase(), { t, sw } = pTokens(m[2].replace(/^\s*(\/d\s+)/i, ' '));
  const rest = m[2].trim();
  const R = o => ({ out: o });
  switch (cmd) {
    case 'cd': case 'chdir': {
      if (!t.length) return R(fsPrompt(s.cwd));
      const n = fsResolve(s.cwd, rest.replace(/^\/d\s+/i, ''));
      if (!n) return R(PROMPT_ERR.percorso);
      if (!n.d) return R(PROMPT_ERR.sintassi);
      s.cwd = n; return R('');
    }
    case 'dir': {
      const n = t.length ? fsResolve(s.cwd, t[0]) : s.cwd;
      if (!n) return R(PROMPT_ERR.file);
      const el = n.d ? n.c : [n];
      const ord = el.slice().sort((a, b) => (b.d - a.d) || a.n.localeCompare(b.n));
      const righe = [' Directory di ' + fsPrompt(n.d ? n : n.p), ''];
      if (n.d && n.p) righe.push('<DIR>          .', '<DIR>          ..');
      ord.forEach(x => righe.push(x.d ? '<DIR>          ' + x.n : '               ' + x.n));
      righe.push('', `      ${el.filter(x => !x.d).length} file`, `      ${el.filter(x => x.d).length} cartelle`);
      return R(righe.join('\n'));
    }
    case 'tree': {
      const n = t.length ? fsResolve(s.cwd, t[0]) : s.cwd;
      if (!n || !n.d) return R('Percorso non valido - ' + (t[0] || ''));
      return R(fsTree(n, !sw.includes('f')));
    }
    case 'mkdir': case 'md': {
      if (!t.length) return R(PROMPT_ERR.cmdsintassi);
      const out = [];
      t.forEach(p => {
        const ass = /^[a-z]:\\/i.test(p) || p[0] === '\\';
        let nodo = ass ? fsRoot(s.cwd) : s.cwd, esiste = true;
        const parti = p.replace(/\//g, '\\').replace(/^[a-z]:/i, '').split('\\').filter(Boolean);
        if (!parti.length || parti.some(x => !FS_NOMI_OK.test(x) && x !== '..' && x !== '.')) { out.push(PROMPT_ERR.sintassi); return; }
        parti.forEach((x, i) => {
          if (x === '.') return;
          if (x === '..') { nodo = nodo.p || nodo; return; }
          const f = pNome(nodo, x);
          if (f) { if (!f.d) { out.push(PROMPT_ERR.esiste + p + '.'); nodo = null; return; } nodo = f; if (i === parti.length - 1 && esiste) out.push(PROMPT_ERR.esiste + p + '.'); return; }
          esiste = false; const nuovo = { n: x, d: true, c: [], p: nodo }; nodo.c.push(nuovo); nodo = nuovo;
        });
      });
      return R(out.join('\n'));
    }
    case 'rmdir': case 'rd': {
      if (!t.length) return R(PROMPT_ERR.cmdsintassi);
      const n = fsResolve(s.cwd, t[0]);
      if (!n) return R(PROMPT_ERR.percorso);
      if (!n.d) return R('Il nome della directory non è valido.');
      if (!n.p || pDentro(n, s.cwd)) return R(PROMPT_ERR.uso);
      if (n.c.length && !sw.includes('s')) return R(PROMPT_ERR.nonvuota);
      pRimuovi(n); return R('');
    }
    case 'type': {
      if (!t.length) return R(PROMPT_ERR.cmdsintassi);
      const n = fsResolve(s.cwd, t[0]);
      if (!n) return R(PROMPT_ERR.file);
      if (n.d) return R(PROMPT_ERR.negato);
      return R(/\.txt$/i.test(n.n) ? 'Appunti: i percorsi si scrivono con la barra rovesciata.' : '(il contenuto di questo file non è testo leggibile)');
    }
    case 'copy': case 'move': case 'ren': case 'rename': {
      if (t.length < 2) return R(PROMPT_ERR.cmdsintassi);
      const src = fsResolve(s.cwd, t[0]);
      if (!src || !src.p) return R(PROMPT_ERR.file);
      if (cmd === 'copy' && src.d) return R(PROMPT_ERR.file);
      if (cmd === 'ren' || cmd === 'rename') {
        if (/[\\/:]/.test(t[1]) || !FS_NOMI_OK.test(t[1])) return R(PROMPT_ERR.cmdsintassi);
        if (pNome(src.p, t[1]) && pNome(src.p, t[1]) !== src) return R('Esiste già un file con lo stesso nome oppure impossibile trovare il file.');
        src.n = t[1]; return R('');
      }
      let dest = fsResolve(s.cwd, t[1]), nome = src.n, dir;
      if (dest && dest.d) dir = dest;
      else {
        const sp = pSplit(s.cwd, t[1]); dir = sp.dir; nome = sp.last;
        if (!dir || !dir.d || !nome) return R(PROMPT_ERR.percorso);
        if (!FS_NOMI_OK.test(nome)) return R(PROMPT_ERR.sintassi);
        dest = pNome(dir, nome);
        if (dest && dest.d) return R(PROMPT_ERR.negato);
      }
      if (src.d && pDentro(src, dir)) return R(PROMPT_ERR.uso);
      const esist = pNome(dir, nome);
      if (cmd === 'copy') {
        if (esist === src) return R('Impossibile copiare un file su se stesso.\n        0 file copiati.');
        if (esist) pRimuovi(esist);
        dir.c.push({ n: nome, d: false, c: [], p: dir }); return R('        1 file copiati.');
      }
      if (esist === src) return R('        0 file spostati.');
      if (esist) { if (esist.d) return R(PROMPT_ERR.negato); pRimuovi(esist); }
      pRimuovi(src); src.n = nome; src.p = dir; dir.c.push(src);
      return R(src.d ? '        1 directory spostate.' : '        1 file spostati.');
    }
    case 'del': case 'erase': {
      if (!t.length) return R(PROMPT_ERR.cmdsintassi);
      const n = fsResolve(s.cwd, t[0]);
      if (!n) return R(PROMPT_ERR.file);
      if (n.d) { n.c.filter(x => !x.d).forEach(pRimuovi); return R(''); }
      pRimuovi(n); return R('');
    }
    case 'cls': return { out: '', cls: true };
    case 'help': return R(PROMPT_AIUTO.map(x => x[0].padEnd(8) + x[1]).join('\n'));
    default: {
      const a = `'${cmd}' non è riconosciuto come comando interno o esterno, un programma eseguibile o un file batch.`;
      return R(PROMPT_SUGG[cmd] ? a + '\n[Suggerimento] ' + PROMPT_SUGG[cmd] : a);
    }
  }
}

/* monta un terminale in el. opzioni: start (percorso assoluto), dopo(s, riga) richiamata dopo ogni comando.
   Restituisce lo stato {T, cwd, hist} e una funzione reset(). */
function pMonta(el, start, dopo) {
  const s = { T: null, cwd: null, hist: [] }, id = 'trm-in' + (pMonta.n = (pMonta.n || 0) + 1);
  el.innerHTML = '<div class="trm" role="group" aria-label="Prompt dei comandi simulato"><pre class="trm-o" aria-live="polite"></pre><div class="trm-i"><label class="trm-p" for="' + id + '"></label><input type="text" id="' + id + '" autocomplete="off" autocapitalize="off" spellcheck="false"></div></div>';
  const o = el.querySelector('.trm-o'), inp = el.querySelector('input'), pp = el.querySelector('.trm-p');
  let su = -1;
  function prompt() { pp.textContent = fsPrompt(s.cwd) + '>'; }
  function reset(nuovoStart) {
    s.T = fsBuild(FS_SPEC); s.cwd = fsResolve(s.T, nuovoStart || start); s.hist = []; su = -1;
    o.textContent = 'Microsoft Windows [Versione simulata]\n(simulazione: i file sono finti e non toccano il vostro computer)\nScrivete help per l\'elenco dei comandi.\n';
    prompt(); inp.value = '';
  }
  inp.onkeydown = e => {
    if (e.key === 'ArrowUp' && s.hist.length) { su = su < 0 ? s.hist.length - 1 : Math.max(0, su - 1); inp.value = s.hist[su]; e.preventDefault(); }
    else if (e.key === 'ArrowDown') { su = su >= 0 && su < s.hist.length - 1 ? su + 1 : -1; inp.value = su < 0 ? '' : s.hist[su]; e.preventDefault(); }
    else if (e.key === 'Enter') {
      const riga = inp.value, pre = pp.textContent;
      const r = pEsegui(s, riga);
      if (riga.trim()) s.hist.push(riga.trim());
      su = -1;
      if (r.cls) o.textContent = ''; else o.textContent += pre + riga + '\n' + (r.out ? r.out + '\n' : '') + '\n';
      inp.value = ''; prompt(); o.scrollTop = o.scrollHeight;
      if (dopo) dopo(s, riga.trim());
    }
  };
  el.addEventListener('click', () => { if (!getSelection().toString()) inp.focus(); });
  reset();
  return { s, reset };
}

/* ---------- generatori ---------- */
const PROMPT_FUNZIONI = [
  ['Mostra il contenuto della cartella corrente', 'dir'], ['Cambia la cartella corrente', 'cd'], ['Crea una nuova cartella', 'mkdir'],
  ['Elimina un file', 'del'], ['Copia un file in un altro punto', 'copy'], ['Sposta un file', 'move'], ['Rinomina un file', 'ren'],
  ['Mostra la struttura ad albero delle cartelle', 'tree'], ['Cancella lo schermo', 'cls'], ['Mostra il testo contenuto in un file', 'type'],
  ['Mostra l\'elenco dei comandi', 'help'], ['Elimina una cartella vuota', 'rd']
];
function gCmdFunzione() {
  const [d, c] = pick(PROMPT_FUNZIONI);
  const altri = shuffle(PROMPT_FUNZIONI.filter(x => x[1] !== c).map(x => x[1])).slice(0, 3);
  return {
    q: `Quale comando del prompt di Windows fa questo? <b>${d}.</b>`,
    fields: [{ label: 'Comando', kind: 'choice', opts: ['Scegli...'].concat(shuffle([c, ...altri])), exp: c }],
    sol: `<code>${c}</code>: ${d.toLowerCase()}.`, sl: 'Soluzione: '
  };
}
/* argomento di mkdir con percorso relativo, senza cd */
function gCmdMkdir(l, T) {
  T = T || fsBuild(FS_SPEC);
  const da = pick(fsDirs(T).filter(d => d.p)), dest = pick(fsDirs(T).filter(d => d.p && d !== da)), nome = pick(['Musica', 'Backup', 'Progetti', 'Foto2026', 'Giochi', 'Storia']);
  const r = fsRel(da, dest);
  return {
    q: `Il prompt è in <code>${fsPrompt(da)}</code>. Volete creare la cartella <code>${nome}</code> dentro <code>${fsAbs(dest)}</code> <b>senza cambiare cartella</b>. Scrivete il comando completo con <code>mkdir</code> e un percorso relativo.`,
    fields: [{ label: 'Comando', exp: 'mkdir ' + (r === '.' ? '' : r + '\\') + nome, kind: 'str' }],
    sol: `Il percorso relativo fino a ${dest.n} è <code>${r}</code>, poi si aggiunge il nome nuovo:${P('mkdir ' + (r === '.' ? '' : r + '\\') + nome)}`, sl: 'Soluzione: '
  };
}
/* copy con due percorsi relativi */
function gCmdCopy(l, T) {
  T = T || fsBuild(FS_SPEC);
  let da, f, dest;
  for (let k = 0; k < 400; k++) {
    da = pick(fsDirs(T).filter(d => d.p)); f = pick(fsFiles(T)); dest = pick(fsDirs(T).filter(d => d.p && d !== f.p));
    if (fsRel(da, f) !== '.' && fsRel(da, dest) !== '.' && (l < 2 || (fsRel(da, f).match(/\.\./g) || []).length + (fsRel(da, dest).match(/\.\./g) || []).length >= 1)) break;
  }
  const cmd = 'copy ' + fsRel(da, f) + ' ' + fsRel(da, dest);
  return {
    q: `Il prompt è in <code>${fsPrompt(da)}</code>. Scrivete il comando che copia <code>${fsAbs(f)}</code> nella cartella <code>${fsAbs(dest)}</code> usando <b>percorsi relativi più brevi</b>, nella forma <code>copy origine destinazione</code>.`,
    fields: [{ label: 'Comando', exp: cmd, kind: 'str' }],
    sol: `Prima il file, poi la cartella di destinazione, entrambi relativi alla cartella corrente:${P(cmd)}`, sl: 'Soluzione: '
  };
}

/* caccia all'errore sui comandi */
const PROMPT_CACCIA = [
  { t: 'Volete creare la cartella <code>Foto</code> nella cartella corrente. Quale comando è <b>sbagliato</b> in cmd?', ok: ['mkdir Foto', 'md Foto'], ko: 'mkdir -p Foto', why: '<code>-p</code> è un\'opzione di Linux: cmd non la conosce e crea anche una cartella chiamata "-p".' },
  { t: 'Volete salire di una cartella. Quale comando <b>non funziona</b>?', ok: ['cd ..', 'cd..'], ko: 'cd ...', why: 'Salire di un livello si scrive con due punti. Tre punti non sono un percorso valido.' },
  { t: 'Volete tornare alla radice di C: da <b>qualsiasi</b> cartella. Quale comando non va bene?', ok: ['cd \\', 'cd C:\\'], ko: 'cd ..\\..', why: 'Sale solo di due livelli: arriva alla radice soltanto se partite da una cartella a profondità due.' },
  { t: 'Il prompt è in <code>C:\\Users\\studente\\Documenti\\Scuola\\Informatica</code>. Volete copiare <code>appunti.txt</code> in <code>C:\\Users\\studente\\Download</code>. Quale comando <b>non copia</b> il file in Download?', ok: ['copy appunti.txt C:\\Users\\studente\\Download', 'copy appunti.txt ..\\..\\..\\Download'], ko: 'copy appunti.txt ..\\Download', why: '<code>..\\Download</code> indica <code>Scuola\\Download</code>, che non esiste: copy crea un file chiamato Download dentro Scuola. Per arrivare a studente servono tre <code>..</code>.' },
  { t: 'Volete cancellare la cartella <code>Vacanze</code>, che contiene due foto. Quale comando <b>non la cancella</b>?', ok: ['rd /s Vacanze', 'rmdir /s Vacanze'], ko: 'rd Vacanze', why: 'Senza <code>/s</code> <code>rd</code> elimina solo cartelle vuote: risponde "La directory non è vuota".' },
  { t: 'Volete vedere l\'albero con anche i file. Quale comando <b>sbagliato</b>?', ok: ['tree /f', 'tree /F'], ko: 'tree -f', why: 'In Windows le opzioni si scrivono con la barra dritta <code>/</code>, non con il trattino.' },
  { t: 'Volete vedere il contenuto della cartella corrente. Quale comando <b>non esiste</b> in cmd?', ok: ['dir', 'dir .'], ko: 'ls', why: '<code>ls</code> è di Linux (e di PowerShell). In cmd si usa <code>dir</code>.' },
  { t: 'Volete rinominare <code>tema.docx</code> in <code>tema2.docx</code>. Quale comando <b>non va</b>?', ok: ['ren tema.docx tema2.docx', 'rename tema.docx tema2.docx'], ko: 'mv tema.docx tema2.docx', why: '<code>mv</code> è di Linux. In cmd si usa <code>ren</code> (o <code>move</code>).' }
];
function gCmdCaccia() {
  const c = pick(PROMPT_CACCIA), lines = shuffle([c.ok[0], c.ok[1], c.ko]);
  return { t: c.t, lines, bad: lines.indexOf(c.ko), why: c.why };
}

const PROMPT_SORT_BUCKETS = [{ id: 'nav', t: 'Spostarsi e guardare', s: 'non cambiano nulla' }, { id: 'file', t: 'Cambiare i file', s: 'copiare, spostare, togliere' }, { id: 'dir', t: 'Cartelle', s: 'creare e togliere' }];
const PROMPT_SORT_CARDS = [
  ['dir', 'nav'], ['cd ..', 'nav'], ['tree /f', 'nav'], ['type appunti.txt', 'nav'], ['cd \\', 'nav'],
  ['copy a.txt ..', 'file'], ['move a.txt ..', 'file'], ['ren a.txt b.txt', 'file'], ['del a.txt', 'file'],
  ['mkdir Foto', 'dir'], ['md Foto', 'dir'], ['rd Foto', 'dir']
];

/* missioni nel prompt: ciascuna parte da un albero nuovo */
const PROMPT_ABS = 'C:\\Users\\studente';
const PROMPT_MISSIONI = [
  { t: `Il prompt è in <code>${PROMPT_ABS}</code>. Entrate in <code>Documenti\\Scuola\\Informatica</code> con <b>un solo comando</b> <code>cd</code> e un percorso relativo.`, start: PROMPT_ABS,
    ok: s => s.hist.length === 1 && s.cwd === fsResolve(s.T, PROMPT_ABS + '\\Documenti\\Scuola\\Informatica') && !/:/.test(s.hist[0]) },
  { t: 'Il prompt è in <code>C:\\Users\\studente\\Immagini\\Vacanze</code>. Salite fino a <code>studente</code> con <b>un solo comando</b>.', start: PROMPT_ABS + '\\Immagini\\Vacanze',
    ok: s => s.hist.length === 1 && s.cwd === fsResolve(s.T, PROMPT_ABS) },
  { t: `Il prompt è in <code>${PROMPT_ABS}</code>. Create la cartella <code>Matematica</code> dentro <code>Documenti\\Scuola</code> <b>senza cambiare cartella</b>.`, start: PROMPT_ABS,
    ok: s => s.cwd === fsResolve(s.T, PROMPT_ABS) && !!fsResolve(s.T, PROMPT_ABS + '\\Documenti\\Scuola\\Matematica') },
  { t: 'Il prompt è in <code>...\\Documenti\\Scuola\\Informatica</code>. Copiate <code>appunti.txt</code> in <code>Download</code> usando un percorso relativo.', start: PROMPT_ABS + '\\Documenti\\Scuola\\Informatica',
    ok: s => !!fsResolve(s.T, PROMPT_ABS + '\\Download\\appunti.txt') && !!fsResolve(s.T, PROMPT_ABS + '\\Documenti\\Scuola\\Informatica\\appunti.txt') && !s.hist.some(c => /:/.test(c)) },
  { t: 'Il prompt è in <code>C:\\Users\\studente\\Documenti</code>. Spostate <code>Lettera.docx</code> dentro la cartella <code>Scuola</code>.', start: PROMPT_ABS + '\\Documenti',
    ok: s => !!fsResolve(s.T, PROMPT_ABS + '\\Documenti\\Scuola\\Lettera.docx') && !fsResolve(s.T, PROMPT_ABS + '\\Documenti\\Lettera.docx') },
  { t: 'Il prompt è in <code>...\\Scuola\\Italiano</code>. Rinominate <code>tema.docx</code> in <code>tema_finale.docx</code>.', start: PROMPT_ABS + '\\Documenti\\Scuola\\Italiano',
    ok: s => !!fsResolve(s.T, PROMPT_ABS + '\\Documenti\\Scuola\\Italiano\\tema_finale.docx') && !fsResolve(s.T, PROMPT_ABS + '\\Documenti\\Scuola\\Italiano\\tema.docx') },
  { t: 'Il prompt è in <code>C:\\Users\\studente\\Download</code>. Eliminate <code>setup.exe</code>.', start: PROMPT_ABS + '\\Download',
    ok: s => !fsResolve(s.T, PROMPT_ABS + '\\Download\\setup.exe') },
  { t: `Il prompt è in <code>${PROMPT_ABS}</code>. Mostrate l'albero di questa cartella <b>con tutti i file</b>.`, start: PROMPT_ABS,
    ok: s => s.hist.some(c => /^tree\s+\/f\s*$/i.test(c)) },
  { t: 'Il prompt è in <code>C:\\Windows\\System32</code>. Tornate alla radice <code>C:\\</code> con <b>un solo comando</b>.', start: 'C:\\Windows\\System32',
    ok: s => s.hist.length === 1 && s.cwd === fsRoot(s.T) }
];
