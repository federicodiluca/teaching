/* Metodologia di sviluppo (TPSIT 5): laboratorio di Git. Solo definizioni: va caricato dopo assets/giochi.js.
   gitLab(el, missioni, etichetta): un terminale simulato in cui si scrivono i comandi di Git; a fianco le tre aree
   (working directory, staging area, repository) e il grafo dei commit, che cresce a ogni comando.
   missioni = [{t: consegna, ok: s => vero quando la missione è compiuta}], s = stato del repository (vedi sotto).
   Comandi: git status, git add <file> | git add ., git commit -m "messaggio", git log --oneline, git branch [nome],
   git switch <nome>, git switch -c <nome>, git checkout <nome>, git checkout -b <nome>, git merge <nome>,
   modifica <file> (simula una modifica fatta nell'editor), clear. Gli stili sono in giochi.css (sezione "simulatori"). */

const COLORI_GIT = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];
function nuovoRepo(file) {
  /* versione di ogni file: wd = nella cartella, st = in staging (null = niente in staging), ultimo commit nel ramo corrente */
  return { commit: [], rami: { main: null }, corsie: { main: 0 }, head: 'main', file: Object.fromEntries(file.map(f => [f, { wd: 1, st: null, nuovo: true }])), cont: 0 };
}
function fotoCommit(s, id) { return id === null ? {} : s.commit.find(c => c.id === id).foto; }
function antenati(s, id) { const v = new Set(), q = [id]; while (q.length) { const x = q.pop(); if (x === null || v.has(x)) continue; v.add(x); q.push(...s.commit.find(c => c.id === x).genitori); } return v; }
function statoFile(s) {
  const base = fotoCommit(s, s.rami[s.head]);
  return Object.entries(s.file).map(([n, f]) => ({ n, staged: f.st !== null && f.st !== base[n], modificato: f.wd !== (f.st !== null ? f.st : base[n]), tracciato: n in base || f.st !== null }));
}
function eseguiGit(s, riga) {
  const out = [], p = riga.trim().match(/"[^"]*"|'[^']*'|\S+/g) || [];
  const err = m => ({ out: m, err: true });
  if (!p.length) return { out: '' };
  if (p[0] === 'modifica') {
    const n = p[1]; if (!n || !(n in s.file)) return err(`Non esiste il file «${n || ''}». File: ${Object.keys(s.file).join(', ')}`);
    s.file[n].wd++; return { out: `(avete modificato ${n} nell'editor)`, nota: `${n} ora è diverso dall'ultima versione salvata: è nella working directory, modificato.` };
  }
  if (p[0] !== 'git') return err(`Comando sconosciuto: ${p[0]}. Qui si usano i comandi git e «modifica <file>».`);
  const cmd = p[1], arg = p.slice(2), ramo = s.head, puntaA = s.rami[ramo];
  if (cmd === 'status') {
    const f = statoFile(s), st = f.filter(x => x.staged), mod = f.filter(x => x.modificato && x.tracciato), nt = f.filter(x => !x.tracciato);
    out.push(`On branch ${ramo}`);
    if (st.length) out.push('Changes to be committed:', ...st.map(x => '    ' + x.n));
    if (mod.length) out.push('Changes not staged for commit:', ...mod.map(x => '    modified: ' + x.n));
    if (nt.length) out.push('Untracked files:', ...nt.map(x => '    ' + x.n));
    if (!st.length && !mod.length && !nt.length) out.push('nothing to commit, working tree clean');
    return { out: out.join('\n'), nota: 'status non cambia niente: dice in che stato sono i file.' };
  }
  if (cmd === 'add') {
    if (!arg.length) return err('Nothing specified, nothing added. Scrivete il nome del file o un punto: git add .');
    const nomi = arg[0] === '.' ? Object.keys(s.file) : arg;
    for (const n of nomi) { if (!(n in s.file)) return err(`fatal: pathspec '${n}' did not match any files`); s.file[n].st = s.file[n].wd; }
    return { out: '', nota: `${arg[0] === '.' ? 'Tutti i file modificati vanno' : nomi.join(', ') + ' va'} nella staging area: saranno nel prossimo commit.` };
  }
  if (cmd === 'commit') {
    const m = arg[0] === '-m' && arg[1] ? arg[1].replace(/^["']|["']$/g, '') : null;
    if (!m) return err('Serve un messaggio: git commit -m "che cosa avete fatto"');
    const base = fotoCommit(s, puntaA), foto = { ...base }; let cambi = 0;
    for (const [n, f] of Object.entries(s.file)) if (f.st !== null && f.st !== base[n]) { foto[n] = f.st; cambi++; }
    if (!cambi) return err(`On branch ${ramo}\nnothing to commit (usate prima git add)`);
    const id = (++s.cont).toString(16).padStart(2, '0') + 'a' + (s.cont * 7919 % 4096).toString(16).padStart(3, '0');
    s.commit.push({ id, msg: m, genitori: puntaA === null ? [] : [puntaA], ramo, foto, corsia: s.corsie[ramo] });
    s.rami[ramo] = id; Object.values(s.file).forEach(f => { f.st = null; });
    return { out: `[${ramo} ${id}] ${m}\n ${cambi} file changed`, nota: `Nuovo commit sul branch ${ramo}: è una fotografia dei file in staging.` };
  }
  if (cmd === 'log') {
    if (puntaA === null) return err(`fatal: your current branch '${ramo}' does not have any commits yet`);
    const v = antenati(s, puntaA); return { out: s.commit.filter(c => v.has(c.id)).reverse().map(c => `${c.id} ${c.msg}`).join('\n'), nota: 'Il log elenca i commit raggiungibili dal branch corrente, dal più recente.' };
  }
  const sporco = () => statoFile(s).some(x => x.staged || (x.modificato && x.tracciato));
  const vai = n => { s.head = n; const f = fotoCommit(s, s.rami[n]); Object.entries(s.file).forEach(([k, x]) => { if (k in f) { x.wd = f[k]; } x.st = null; }); };
  const crea = n => { if (n in s.rami) return `fatal: a branch named '${n}' already exists`; if (puntaA === null) return 'fatal: prima serve almeno un commit'; s.rami[n] = puntaA; s.corsie[n] = Object.keys(s.corsie).length; return null; };
  if (cmd === 'branch') {
    if (!arg.length) return { out: Object.keys(s.rami).map(n => (n === ramo ? '* ' : '  ') + n).join('\n') };
    const e = crea(arg[0]); if (e) return err(e);
    return { out: '', nota: `Il branch ${arg[0]} è un nuovo puntatore allo stesso commit. Siete ancora su ${ramo}: per spostarvi git switch ${arg[0]}.` };
  }
  if (cmd === 'switch' || cmd === 'checkout') {
    const nuovoR = (cmd === 'switch' && arg[0] === '-c') || (cmd === 'checkout' && arg[0] === '-b'), n = nuovoR ? arg[1] : arg[0];
    if (!n) return err('Scrivete il nome del branch.');
    if (sporco()) return err('error: avete modifiche non salvate in un commit. Fate prima commit (o non cambiate branch).');
    if (nuovoR) { const e = crea(n); if (e) return err(e); }
    else if (!(n in s.rami)) return err(`fatal: invalid reference: ${n}`);
    vai(n); return { out: nuovoR ? `Switched to a new branch '${n}'` : `Switched to branch '${n}'`, nota: `HEAD ora indica ${n}: i prossimi commit andranno su questo branch.` };
  }
  if (cmd === 'merge') {
    const n = arg[0]; if (!n || !(n in s.rami)) return err(`merge: ${n || ''} - not something we can merge`);
    if (n === ramo) return err('Non si fa il merge di un branch con se stesso.');
    if (sporco()) return err('error: fate prima commit delle modifiche.');
    const lui = s.rami[n], an = antenati(s, puntaA);
    if (an.has(lui)) return { out: 'Already up to date.', nota: `${n} non ha niente che ${ramo} non abbia già.` };
    if (antenati(s, lui).has(puntaA) || puntaA === null) { s.rami[ramo] = lui; vai(ramo); return { out: `Updating ${puntaA}..${lui}\nFast-forward`, nota: `Fast-forward: ${ramo} non era andato avanti, quindi il suo puntatore si sposta semplicemente in avanti fino a ${n}. Nessun commit nuovo.` }; }
    const foto = { ...fotoCommit(s, puntaA) }, altra = fotoCommit(s, lui); Object.entries(altra).forEach(([k, v]) => { if (!(k in foto) || v > foto[k]) foto[k] = v; });
    const id = (++s.cont).toString(16).padStart(2, '0') + 'm' + (s.cont * 7919 % 4096).toString(16).padStart(3, '0');
    s.commit.push({ id, msg: `Merge branch '${n}'`, genitori: [puntaA, lui], ramo, foto, corsia: s.corsie[ramo] });
    s.rami[ramo] = id; vai(ramo);
    return { out: `Merge made by the 'ort' strategy.`, nota: `I due branch avevano commit diversi: Git crea un commit di merge con due genitori.` };
  }
  return err(`git: '${cmd}' non è tra i comandi di questo laboratorio.`);
}
function grafoGit(s) {
  if (!s.commit.length) return '<p class="git-vuoto">Ancora nessun commit.</p>';
  const dx = 64, dy = 46, x = i => 30 + i * dx, y = l => 26 + l * dy, pos = {};
  s.commit.forEach((c, i) => { pos[c.id] = [x(i), y(c.corsia)]; });
  const corsie = Math.max(...Object.values(s.corsie)) + 1, W = x(s.commit.length - 1) + 120, H = y(corsie - 1) + 50;
  let svg = '';
  s.commit.forEach(c => c.genitori.forEach(g => { const [x1, y1] = pos[g], [x2, y2] = pos[c.id]; svg += `<path d="M${x1} ${y1}C${(x1 + x2) / 2} ${y1} ${(x1 + x2) / 2} ${y2} ${x2} ${y2}" stroke="${COLORI_GIT[c.corsia % 6]}" />`; }));
  s.commit.forEach(c => { const [cx, cy] = pos[c.id]; svg += `<circle cx="${cx}" cy="${cy}" r="11" fill="${COLORI_GIT[c.corsia % 6]}"${c.genitori.length > 1 ? ' class="merge"' : ''}><title>${escH(c.id + ' ' + c.msg)}</title></circle><text x="${cx}" y="${cy + 26}" class="git-id">${c.id.slice(0, 4)}</text>`; });
  const etichette = {};
  Object.entries(s.rami).forEach(([n, id]) => { if (id !== null) (etichette[id] = etichette[id] || []).push(n); });
  Object.entries(etichette).forEach(([id, nomi]) => { const [cx, cy] = pos[id]; nomi.forEach((n, j) => { const t = (n === s.head ? 'HEAD → ' : '') + n; svg += `<g class="git-tag${n === s.head ? ' head' : ''}" transform="translate(${cx + 14},${cy - 16 - j * 18})"><rect width="${t.length * 7.4 + 10}" height="16" rx="4"/><text x="5" y="12">${escH(t)}</text></g>`; }); });
  return `<svg class="git-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${svg}</svg>`;
}
function gitLab(el, missioni, label = 'Laboratorio di Git', file = ['index.html', 'stile.css', 'README.md']) {
  const st = stat(label);
  let s, fatte, storia = [], ip = 0, sbagli = false;
  el.innerHTML = `<div class="card git">${turn()}<ol class="git-mis"></ol>
   <div class="git-box"><div class="git-term"><pre class="git-out"></pre><div class="git-riga"><span>$</span><input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Comando" placeholder="git status"></div></div>
    <div class="git-aree"><div><small>Working directory</small><div data-a="wd"></div></div><div><small>Staging area</small><div data-a="st"></div></div><div><small>Repository (ultimo commit)</small><div data-a="re"></div></div></div></div>
   <div class="git-grafo"></div><p class="git-nota"></p>
   <div class="row"><button class="btn sec" data-a="r">Ricomincia</button><span class="msg"></span></div><div class="stat"></div></div>`;
  const c = el.querySelector('.git'), $q = x => c.querySelector(x), inp = $q('.git-riga input');
  const up = () => $q('.stat').textContent = `Missioni compiute: ${fatte.filter(Boolean).length} su ${missioni.length} (senza errori: ${st.ok} su ${st.tot})`;
  function inizio() { s = nuovoRepo(file); fatte = missioni.map(() => false); $q('.git-out').textContent = 'Siete nella cartella del progetto, con il repository già creato (git init).\nScrivete un comando e premete Invio.\n'; disegna(); $q('.git-nota').textContent = ''; }
  function disegna() {
    const f = statoFile(s), base = fotoCommit(s, s.rami[s.head]);
    $q('[data-a=wd]').innerHTML = f.map(x => `<span class="git-f${x.modificato || !x.tracciato ? ' mod' : ''}">${x.n}${!x.tracciato ? ' (nuovo)' : x.modificato ? ' (modificato)' : ''}</span>`).join('');
    $q('[data-a=st]').innerHTML = f.filter(x => x.staged).map(x => `<span class="git-f st">${x.n}</span>`).join('') || '<em>vuota</em>';
    $q('[data-a=re]').innerHTML = Object.keys(base).map(n => `<span class="git-f re">${n}</span>`).join('') || '<em>nessun commit</em>';
    $q('.git-grafo').innerHTML = grafoGit(s);
    $q('.git-mis').innerHTML = missioni.map((m, i) => `<li class="${fatte[i] ? 'fatta' : i === fatte.indexOf(false) ? 'ora' : ''}">${fatte[i] ? '✔ ' : ''}${m.t}</li>`).join('');
    up();
  }
  inp.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') { if (ip > 0) { ip--; inp.value = storia[ip]; } e.preventDefault(); return; }
    if (e.key === 'ArrowDown') { if (ip < storia.length) { ip++; inp.value = storia[ip] || ''; } e.preventDefault(); return; }
    if (e.key !== 'Enter') return;
    const riga = inp.value; inp.value = ''; if (riga.trim()) { storia.push(riga); ip = storia.length; }
    const o = $q('.git-out');
    if (riga.trim() === 'clear') { o.textContent = ''; return; }
    const r = eseguiGit(s, riga);
    if (!r.err) s.ultimo = (riga.trim().match(/^git\s+(\S+)/) || [])[1] || '';   /* per le missioni del tipo «guardate lo stato» */
    o.textContent += `$ ${riga}\n` + (r.out ? r.out + '\n' : '');
    if (r.err) { sbagli = true; const m = $q('.msg'); m.textContent = 'Il comando non è andato: leggete il messaggio nel terminale.'; m.style.color = 'var(--ko)'; } else $q('.msg').textContent = '';
    $q('.git-nota').innerHTML = r.nota || '';
    o.scrollTop = o.scrollHeight;
    const i = fatte.indexOf(false);
    if (i >= 0 && !r.err && missioni[i].ok(s)) { fatte[i] = true; st.tot++; if (!sbagli) st.ok++; sbagli = false; const m = $q('.msg'); m.textContent = fatte.every(Boolean) ? 'Tutte le missioni compiute!' : 'Missione compiuta!'; m.style.color = 'var(--ok)'; }
    disegna();
  });
  $q('[data-a=r]').onclick = () => { inizio(); inp.focus(); };
  inizio();
}
