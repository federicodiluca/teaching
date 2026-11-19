/* Albero del file system di esempio e generatori per le attività sui percorsi e sul prompt di Windows.
   Solo definizioni: va caricato dopo assets/giochi.js, che fornisce rnd, pick, shuffle, P, lv...
   Modello dei nodi: {n: nome, d: true se cartella, c: figli, p: padre}. */

const FS_SPEC = {
  Users: { studente: {
    Documenti: { Scuola: { Informatica: { 'esercizi.docx': 0, 'appunti.txt': 0 }, Italiano: { 'tema.docx': 0 } }, 'Lettera.docx': 0 },
    Immagini: { Vacanze: { 'mare.jpg': 0, 'montagna.jpg': 0 }, 'profilo.png': 0 },
    Download: { 'setup.exe': 0 }
  } },
  Programmi: { Firefox: { 'firefox.exe': 0 } },
  Windows: { System32: { 'cmd.exe': 0 } }
};

function fsBuild(spec, name) {
  const root = { n: name || 'C:', d: true, c: [], p: null };
  (function add(nodo, s) {
    Object.keys(s).forEach(k => {
      const f = { n: k, d: typeof s[k] === 'object', c: [], p: nodo };
      nodo.c.push(f);
      if (f.d) add(f, s[k]);
    });
  })(root, spec);
  return root;
}
function fsAll(nodo, out) { out = out || []; out.push(nodo); nodo.c.forEach(x => fsAll(x, out)); return out; }
function fsDepth(nodo) { let k = 0; while (nodo.p) { nodo = nodo.p; k++; } return k; }
function fsAbs(nodo) {
  const parti = []; while (nodo.p) { parti.unshift(nodo.n); nodo = nodo.p; }
  return nodo.n + '\\' + parti.join('\\');
}
/* cartelle in forma "C:\" per la radice, altrimenti "C:\Users\studente" (come mostra il prompt) */
function fsPrompt(nodo) { const a = fsAbs(nodo); return nodo.p ? a.replace(/\\$/, '') : a; }
function fsRoot(nodo) { while (nodo.p) nodo = nodo.p; return nodo; }
/* Risolve un percorso come fa cmd: ".." sale, "." resta, i nomi non distinguono maiuscole e minuscole.
   Restituisce il nodo oppure null. */
function fsResolve(cwd, path) {
  let s = String(path).trim().replace(/\//g, '\\').replace(/^"(.*)"$/, '$1');
  let nodo = cwd;
  if (/^[a-z]:/i.test(s)) {
    if (s.slice(0, 2).toUpperCase() !== fsRoot(cwd).n.toUpperCase()) return null;
    nodo = fsRoot(cwd); s = s.slice(2);
  }
  if (s[0] === '\\') { nodo = fsRoot(cwd); s = s.slice(1); }
  const parti = s.split('\\').filter(x => x !== '');
  for (const p of parti) {
    if (p === '.') continue;
    if (p === '..') { if (nodo.p) nodo = nodo.p; continue; }
    if (!nodo.d) return null;
    const f = nodo.c.find(x => x.n.toLowerCase() === p.toLowerCase());
    if (!f) return null;
    nodo = f;
  }
  return nodo;
}
/* percorso relativo più corto da una cartella a un nodo, senza ".\" iniziale */
function fsRel(da, a) {
  const pa = [], pb = [];
  for (let x = da; x; x = x.p) pa.unshift(x);
  for (let x = a; x; x = x.p) pb.unshift(x);
  let i = 0; while (i < pa.length && i < pb.length && pa[i] === pb[i]) i++;
  const su = pa.length - i;
  const parti = Array(su).fill('..').concat(pb.slice(i).map(x => x.n));
  return parti.length ? parti.join('\\') : '.';
}
/* Disegna l'albero come fa il comando tree /f */
function fsTree(nodo, soloCartelle) {
  const righe = [nodo.p ? nodo.n : 'C:\\'];
  (function r(n, pre) {
    const fig = n.c.filter(x => !soloCartelle || x.d);
    fig.forEach((f, i) => {
      const ult = i === fig.length - 1;
      righe.push(pre + (ult ? '└── ' : '├── ') + f.n);
      if (f.d) r(f, pre + (ult ? '    ' : '│   '));
    });
  })(nodo, '');
  return righe.join('\n');
}

const FS_NOTA = 'Il separatore è la barra rovesciata \\ (sulla tastiera italiana: AltGr + ?). Maiuscole e minuscole non contano.';

/* ---------- generatori per mount / mountMenu / mission ---------- */
function fsFiles(T) { return fsAll(T).filter(x => !x.d); }
function fsDirs(T) { return fsAll(T).filter(x => x.d); }

/* livello 1: assoluto di un file; 2: relativo verso il basso; 3: relativo con ..  (o sia ../ sia giù) */
function gFsAssoluto(l, T) {
  T = T || fsBuild(FS_SPEC);
  const f = pick(fsFiles(T).filter(x => fsDepth(x) >= (l === 1 ? 2 : 3)));
  return {
    q: `Questo è il file system:${P(fsTree(T))}Scrivete il <b>percorso assoluto</b> del file <code>${f.n}</code>. ${FS_NOTA}`,
    fields: [{ label: 'Percorso assoluto', exp: fsAbs(f), kind: 'str' }],
    sol: `Si parte dalla radice <code>C:\\</code> e si scende cartella per cartella fino al file:${P(fsAbs(f))}`, sl: 'Soluzione: '
  };
}
function gFsRelativo(l, T) {
  T = T || fsBuild(FS_SPEC);
  const dirs = fsDirs(T), files = fsFiles(T);
  let da, a, tipo;
  for (let t = 0; t < 400; t++) {
    da = pick(dirs.filter(d => d.p)); a = pick(files);
    const r = fsRel(da, a), su = (r.match(/\.\./g) || []).length;
    if (l === 1 && su === 0 && r !== '.' && r.split('\\').length >= 2) break;
    if (l === 2 && su === 1) break;
    if (l === 3 && su >= 2) break;
  }
  const r = fsRel(da, a);
  const uno = l === 1;
  return {
    q: `Questo è il file system:${P(fsTree(T))}Il prompt si trova in <code>${fsPrompt(da)}</code>. Scrivete il <b>percorso relativo più breve</b> (senza <code>.\\</code> iniziale) per raggiungere il file <code>${a.n}</code> (<code>${fsAbs(a)}</code>). ${FS_NOTA}`,
    fields: [{ label: 'Percorso relativo', exp: r, kind: 'str' }],
    sol: `Dalla cartella corrente ${uno ? 'si scende' : 'si sale con <code>..</code> fino alla cartella in comune e poi si scende'}:${P(r)}`, sl: 'Soluzione: '
  };
}
function gFsCd(l, T) {
  T = T || fsBuild(FS_SPEC);
  const dirs = fsDirs(T);
  let cwd = pick(dirs.filter(d => fsDepth(d) >= 2)), cmds = [], cur = cwd, passi = l === 1 ? 2 : l === 2 ? 3 : 4;
  for (let k = 0; k < passi; k++) {
    const opz = [];
    if (cur.p) opz.push('..');
    cur.c.filter(x => x.d).forEach(x => opz.push(x.n));
    if (l >= 2 && cur.p && cur.p.p) opz.push('..\\..');
    if (l === 3) opz.push('\\');
    const c = pick(opz); cmds.push(c); cur = fsResolve(cur, c);
  }
  return {
    q: `Questo è il file system:${P(fsTree(T))}Il prompt è in <code>${fsPrompt(cwd)}</code>. Eseguite in ordine:${P(cmds.map(c => 'cd ' + c).join('\n'))}In quale cartella vi trovate alla fine? Scrivete il percorso assoluto (per la radice: <code>C:\\</code>).`,
    fields: [{ label: 'Cartella finale', exp: fsPrompt(cur), kind: 'str' }],
    sol: `Un comando alla volta, partendo da <code>${fsPrompt(cwd)}</code>:${P(cmds.reduce((acc, c) => { acc.n = fsResolve(acc.n, c); acc.r.push('cd ' + c + '  →  ' + fsPrompt(acc.n)); return acc }, { n: cwd, r: [] }).r.join('\n'))}`, sl: 'Soluzione: '
  };
}
function gFsTipo(l, T) {
  T = T || fsBuild(FS_SPEC);
  const f = pick(fsFiles(T)), assoluto = Math.random() < .5;
  const p = assoluto ? fsAbs(f) : fsRel(pick(fsDirs(T).filter(d => d.p)), f);
  const ass = /^[A-Za-z]:\\/.test(p);
  return {
    q: `Il percorso <code>${p}</code> è assoluto o relativo?`,
    fields: [{ label: 'Tipo', kind: 'choice', opts: ['Scegli...', 'assoluto', 'relativo'], exp: ass ? 'assoluto' : 'relativo' }],
    sol: ass ? 'Comincia da <code>C:\\</code>: parte dalla radice, vale da qualsiasi cartella.' : 'Non comincia dalla radice: dipende dalla cartella in cui si trova il prompt.', sl: 'Soluzione: '
  };
}
/* dato un percorso relativo con .., quale file apre? */
function gFsDove(l, T) {
  T = T || fsBuild(FS_SPEC);
  let da, a, r;
  for (let t = 0; t < 400; t++) {
    da = pick(fsDirs(T).filter(d => d.p)); a = pick(fsFiles(T)); r = fsRel(da, a);
    if ((r.match(/\.\./g) || []).length >= (l === 3 ? 2 : 1)) break;
  }
  return {
    q: `Il prompt è in <code>${fsPrompt(da)}</code> e scrivete <code>type ${r}</code>.${P(fsTree(T))}Quale file si apre? Scrivete il suo percorso assoluto.`,
    fields: [{ label: 'File aperto', exp: fsAbs(a), kind: 'str' }],
    sol: `Ogni <code>..</code> sale di una cartella a partire da <code>${fsPrompt(da)}</code>; poi si scende:${P(fsAbs(a))}`, sl: 'Soluzione: '
  };
}
/* assoluto -> relativo da una cartella */
function gFsConverti(l, T) {
  T = T || fsBuild(FS_SPEC);
  const da = pick(fsDirs(T).filter(d => d.p)), a = pick(fsFiles(T));
  return {
    q: `Il prompt è in <code>${fsPrompt(da)}</code>. Riscrivete <code>${fsAbs(a)}</code> come percorso <b>relativo</b> più breve. ${FS_NOTA}`,
    fields: [{ label: 'Percorso relativo', exp: fsRel(da, a), kind: 'str' }],
    sol: `Si sale con <code>..</code> fino alla cartella in comune, poi si scende:${P(fsRel(da, a))}`, sl: 'Soluzione: '
  };
}

const FS_ITEMS = [
  ['Percorso assoluto di un file', l => gFsAssoluto(Math.min(l, 2))],
  ['Percorso relativo', l => gFsRelativo(l)],
  ['Da assoluto a relativo', l => gFsConverti(l)],
  ['Dove mi porta cd?', l => gFsCd(l)],
  ['Quale file apre ..\\?', l => gFsDove(l)],
  ['Assoluto o relativo?', l => gFsTipo(l)]
];

/* ---------- caccia all'errore: quale percorso NON raggiunge il file? ---------- */
function gFsCaccia(T) {
  T = T || fsBuild(FS_SPEC);
  const da = pick(fsDirs(T).filter(d => d.p && fsDepth(d) >= 2)), a = pick(fsFiles(T).filter(f => f !== da));
  const giusti = new Set([fsRel(da, a), fsAbs(a)]);
  giusti.add('.\\' + fsRel(da, a).replace(/^\.$/, ''));
  const base = fsRel(da, a).split('\\');
  const sbagli = new Set();
  /* errori tipici: manca un .., ne avanza uno, nome sbagliato, barra dritta ignorata dopo drive */
  const su = base.filter(x => x === '..').length;
  const giu = base.filter(x => x !== '..');
  if (su > 0) sbagli.add(Array(su - 1).fill('..').concat(giu).join('\\') || '.');
  sbagli.add(Array(su + 1).fill('..').concat(giu).join('\\'));
  sbagli.add(giu.join('\\'));
  const err = [...sbagli].find(p => { const n = fsResolve(da, p); return n !== a; });
  const buoni = shuffle([fsRel(da, a), fsAbs(a), '.\\' + fsRel(da, a)]).filter(p => fsResolve(da, p) === a).slice(0, 2);
  const el = shuffle([...buoni, err]);
  return {
    t: `Il prompt è in <code>${fsPrompt(da)}</code> e volete raggiungere <code>${fsAbs(a)}</code>.${P(fsTree(T))}Quale di questi percorsi <b>non</b> funziona?`,
    lines: el, bad: el.indexOf(err),
    why: `Da <code>${fsPrompt(da)}</code>, <code>${err}</code> ${fsResolve(da, err) ? 'porta a <code>' + fsAbs(fsResolve(da, err)) + '</code>' : 'non esiste'}: non è il file cercato.`
  };
}

/* ---------- smistamento: assoluto o relativo ---------- */
const FS_SORT_BUCKETS = [{ id: 'ass', t: 'Assoluto', s: 'parte dalla radice' }, { id: 'rel', t: 'Relativo', s: 'parte dalla cartella corrente' }];
const FS_SORT_CARDS = [
  ['C:\\Users\\studente\\Documenti', 'ass'], ['C:\\Windows\\System32\\cmd.exe', 'ass'], ['C:\\Programmi\\Firefox', 'ass'], ['C:\\', 'ass'],
  ['..\\Immagini', 'rel'], ['Scuola\\Italiano\\tema.docx', 'rel'], ['..\\..', 'rel'], ['.\\appunti.txt', 'rel'], ['..', 'rel'], ['Vacanze\\mare.jpg', 'rel']
];

/* ---------- costruttore dell'albero personale ---------- */
const FS_NOMI_OK = /^[^\\/:*?"<>|]+$/;
