/* Fogli di calcolo (Informatica 1): un piccolo foglio di calcolo vero e i giochi che lo usano.
   Solo definizioni: va caricato dopo assets/giochi.js.
   - FC: il motore. FC.calcola(celle) restituisce get('B2') con il valore calcolato; le celle sono numeri, testi o
     testi che cominciano con = (formule). Formule all'italiana: ; tra gli argomenti, virgola decimale, nomi delle
     funzioni in italiano (SOMMA, MEDIA, MAX, MIN, CONTA.NUMERI, CONTA.VALORI, CONTA.VUOTE, CONTA.SE, SOMMA.SE, MEDIA.SE,
     SE, E, O, ARROTONDA, RADQ, ASS, CERCA.VERT, CERCA.ORIZZ, CONCAT, LUNGHEZZA, MAIUSC, MINUSC, MAIUSC.INIZ) e gli
     errori di Excel (#DIV/0!, #VALORE!, #NOME?, #RIF!, #NUM!, #N/D, riferimento circolare).
     FC.sposta(formula, righe, colonne) è il quadratino di riempimento: sposta i riferimenti relativi e lascia quelli col $.
   - formulaLab(el, etichetta): una consegna, si scrive la formula e il foglio la calcola dal vivo. Il controllo la
     prova anche con altri numeri, quindi non basta scrivere il risultato a mano.
   - dollariLab(el, etichetta): si mettono i $ facendo clic sui riferimenti, poi si copia la formula con il quadratino
     e si vede, cella per cella, dove sono finiti i riferimenti.
   - prevediCella(): generatore per mount e mission, che cosa mostra la cella con una formula (anche gli errori).
   Gli stili sono in assets/giochi.css (sezione "fogli di calcolo"). */

const FC = (() => {
  const ERR = e => ({ err: e }), isErr = v => v && typeof v === 'object' && 'err' in v;
  const colN = s => [...s].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
  const colL = n => { let s = ''; n++; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  const rif = s => { const m = /^(\$?)([A-Z]{1,3})(\$?)(\d+)$/.exec(s.toUpperCase()); return m && { c: colN(m[2]), r: +m[4] - 1, ac: !!m[1], ar: !!m[3] }; };
  const nomeCella = (c, r) => colL(c) + (r + 1);

  /* ---------- lettura della formula ---------- */
  const TOK = /\s+|("(?:[^"]|"")*")|(\$?[A-Za-z]{1,3}\$?\d+)(?![A-Za-z0-9.(])|(\d+(?:[.,]\d+)?)|([A-Za-zÀ-ÿ][A-Za-z0-9.À-ÿ]*)|(<=|>=|<>|[-+*/^&=<>%();:])|(#[A-Za-z0-9/.!?]+)/y;
  function tokens(f) {
    const out = []; TOK.lastIndex = 0;
    while (TOK.lastIndex < f.length) {
      const i = TOK.lastIndex, m = TOK.exec(f);
      if (!m) throw new Error(`non capisco il simbolo «${f[i]}»`);
      if (m[1]) out.push({ t: 'str', v: m[1].slice(1, -1).replace(/""/g, '"') });
      else if (m[2]) out.push({ t: 'ref', v: m[2].toUpperCase() });
      else if (m[3]) out.push({ t: 'num', v: +m[3].replace(',', '.') });
      else if (m[4]) out.push({ t: 'id', v: m[4].toUpperCase() });
      else if (m[5]) out.push({ t: 'op', v: m[5] });
      else if (m[6]) out.push({ t: 'errlit', v: m[6].toUpperCase() });
    }
    return out;
  }
  function analizza(f) {
    const T = tokens(f); let i = 0;
    const vede = v => T[i] && T[i].t === 'op' && T[i].v === v, prendi = v => { if (!vede(v)) throw new Error(v === ')' ? 'manca una parentesi chiusa' : `manca «${v}»`); i++; };
    const bin = (sotto, ops) => () => { let a = sotto(); while (T[i] && T[i].t === 'op' && ops.includes(T[i].v)) { const op = T[i++].v; a = { k: 'bin', op, a, b: sotto() }; } return a; };
    function primario() {
      const t = T[i++];
      if (!t) throw new Error('la formula finisce a metà');
      if (t.t === 'num') return { k: 'val', v: t.v };
      if (t.t === 'str') return { k: 'val', v: t.v };
      if (t.t === 'errlit') return { k: 'val', v: ERR(t.v) };
      if (t.t === 'ref') { if (vede(':')) { i++; const b = T[i++]; if (!b || b.t !== 'ref') throw new Error('dopo i due punti ci vuole un\'altra cella'); return { k: 'range', a: rif(t.v), b: rif(b.v) }; } return { k: 'ref', a: rif(t.v) }; }
      if (t.t === 'id') {
        if (vede('(')) { i++; const args = []; if (!vede(')')) { for (;;) { args.push(vede(';') || vede(')') ? { k: 'val', v: null } : confronto()); if (vede(';')) { i++; continue; } break; } } prendi(')'); return { k: 'fn', n: t.v, args }; }
        if (t.v === 'VERO') return { k: 'val', v: true };
        if (t.v === 'FALSO') return { k: 'val', v: false };
        return { k: 'val', v: ERR('#NOME?') };
      }
      if (t.t === 'op' && t.v === '(') { const e = confronto(); prendi(')'); return e; }
      if (t.t === 'op' && (t.v === '-' || t.v === '+')) { const e = unario(); return t.v === '-' ? { k: 'neg', a: e } : e; }
      throw new Error(`il simbolo «${t.v}» è fuori posto`);
    }
    function unario() { let e = primario(); while (vede('%')) { i++; e = { k: 'pct', a: e }; } return e; }
    const potenza = bin(unario, ['^']), prodotto = bin(potenza, ['*', '/']), somma = bin(prodotto, ['+', '-']), conc = bin(somma, ['&']);
    const confronto = bin(conc, ['=', '<>', '<', '>', '<=', '>=']);
    const e = confronto();
    if (i < T.length) throw new Error(T[i].v === ')' ? 'c\'è una parentesi chiusa di troppo' : `il simbolo «${T[i].v}» è fuori posto`);
    return e;
  }

  /* ---------- valori ---------- */
  const fmt = (v, dec = 6) => {
    if (v === null || v === undefined) return '';
    if (isErr(v)) return v.err === 'CIRC' ? 'Rif. circolare' : v.err;
    if (v === true) return 'VERO'; if (v === false) return 'FALSO';
    if (typeof v === 'number') { if (!isFinite(v)) return '#NUM!'; return String(+v.toFixed(dec)).replace('.', ','); }
    return String(v);
  };
  const num = v => { if (isErr(v)) return v; if (v === null || v === '') return 0; if (typeof v === 'boolean') return +v; if (typeof v === 'number') return v;
    const s = String(v).trim().replace(',', '.'); return s !== '' && !isNaN(+s) ? +s : ERR('#VALORE!'); };
  const txt = v => isErr(v) ? v : v === null ? '' : typeof v === 'number' || typeof v === 'boolean' ? fmt(v) : String(v);
  const piatto = args => args.flatMap(a => a && a.range ? a.range.flat().map(v => ({ v, r: true })) : [{ v: a, r: false }]);
  const primoErr = l => l.find(x => isErr(x.v));
  const numeri = args => { const l = piatto(args), e = primoErr(l); if (e) return e.v; const out = [];
    for (const x of l) { if (x.r) { if (typeof x.v === 'number') out.push(x.v); } else { const n = num(x.v); if (isErr(n)) return n; out.push(n); } } return out; };
  function confr(a, b) {
    const tipo = v => v === null ? 0 : typeof v === 'number' ? 1 : typeof v === 'string' ? 2 : 3;
    if (a === null) a = typeof b === 'string' ? '' : typeof b === 'boolean' ? false : 0;
    if (b === null) b = typeof a === 'string' ? '' : typeof a === 'boolean' ? false : 0;
    const ta = tipo(a), tb = tipo(b); if (ta !== tb) return ta - tb;
    if (ta === 2) { a = a.toLowerCase(); b = b.toLowerCase(); }
    return a < b ? -1 : a > b ? 1 : 0;
  }
  function criterio(c) {
    if (typeof c === 'number' || typeof c === 'boolean') return v => v === c;
    const m = /^(<=|>=|<>|<|>|=)?(.*)$/.exec(String(c ?? '')), op = m[1] || '=', s = m[2], n = s.trim() !== '' && !isNaN(+s.replace(',', '.')) ? +s.replace(',', '.') : null;
    return v => {
      if (n !== null) { if (typeof v !== 'number') return op === '<>'; const d = v - n; return { '=': d === 0, '<>': d !== 0, '<': d < 0, '>': d > 0, '<=': d <= 0, '>=': d >= 0 }[op]; }
      if (op === '=' && s === '') return v === null || v === '';
      if (typeof v !== 'string') return op === '<>';
      const d = confr(v, s); return { '=': d === 0, '<>': d !== 0, '<': d < 0, '>': d > 0, '<=': d <= 0, '>=': d >= 0 }[op];
    };
  }
  const arrot = (n, d) => { const f = 10 ** d, s = Math.sign(n); return s * Math.round(+(Math.abs(n) * f).toPrecision(15)) / f; };
  function cerca(v, tab, idx, appr, vert) {
    if (isErr(v)) return v; const n = num(idx); if (isErr(n)) return n;
    const T = vert ? tab : tab[0].map((_, c) => tab.map(r => r[c])), k = Math.trunc(n);
    if (k < 1) return ERR('#VALORE!'); if (k > T[0].length) return ERR('#RIF!');
    let riga = -1;
    if (appr === false || appr === 0) riga = T.findIndex(r => r[0] !== null && confr(r[0], v) === 0);
    else for (let i = 0; i < T.length; i++) { if (T[i][0] === null) continue; if (confr(T[i][0], v) <= 0 && typeof T[i][0] === typeof v) riga = i; else if (confr(T[i][0], v) > 0) break; }
    return riga < 0 ? ERR('#N/D') : T[riga][k - 1];
  }
  const testo1 = (a, f) => { const t = txt(a[0]); return isErr(t) ? t : f(t); };
  const FUNZ = {
    SOMMA: a => { const n = numeri(a); return isErr(n) ? n : n.reduce((s, x) => s + x, 0); },
    MEDIA: a => { const n = numeri(a); return isErr(n) ? n : n.length ? n.reduce((s, x) => s + x, 0) / n.length : ERR('#DIV/0!'); },
    MAX: a => { const n = numeri(a); return isErr(n) ? n : n.length ? Math.max(...n) : 0; },
    MIN: a => { const n = numeri(a); return isErr(n) ? n : n.length ? Math.min(...n) : 0; },
    'CONTA.NUMERI': a => piatto(a).filter(x => typeof x.v === 'number' || (!x.r && !isErr(num(x.v)) && x.v !== null)).length,
    'CONTA.VALORI': a => piatto(a).filter(x => x.v !== null && x.v !== '').length,
    'CONTA.VUOTE': a => { if (!a[0] || !a[0].range) return ERR('#VALORE!'); return piatto([a[0]]).filter(x => x.v === null || x.v === '').length; },
    'CONTA.SE': a => { if (!a[0] || !a[0].range) return ERR('#VALORE!'); if (isErr(a[1])) return a[1]; const ok = criterio(a[1]); return a[0].range.flat().filter(ok).length; },
    'SOMMA.SE': a => { if (!a[0] || !a[0].range) return ERR('#VALORE!'); const ok = criterio(a[1]), c = a[0].range.flat(), s = (a[2] && a[2].range ? a[2].range.flat() : c);
      return c.reduce((t, v, i) => ok(v) && typeof s[i] === 'number' ? t + s[i] : t, 0); },
    'MEDIA.SE': a => { if (!a[0] || !a[0].range) return ERR('#VALORE!'); const ok = criterio(a[1]), c = a[0].range.flat(), s = (a[2] && a[2].range ? a[2].range.flat() : c);
      const l = c.map((v, i) => ok(v) && typeof s[i] === 'number' ? s[i] : null).filter(x => x !== null); return l.length ? l.reduce((t, x) => t + x, 0) / l.length : ERR('#DIV/0!'); },
    SE: a => { if (a.length < 2 || a.length > 3) return ERR('#VALORE!'); const c = a[0]; if (isErr(c)) return c; if (c && c.range) return ERR('#VALORE!');
      const b = typeof c === 'string' ? ERR('#VALORE!') : num(c); if (isErr(b)) return b; return b ? (a[1] ?? 0) : (a.length > 2 ? (a[2] ?? 0) : false); },
    E: a => { const l = piatto(a); const e = primoErr(l); if (e) return e.v; return l.every(x => !!num(x.v)); },
    O: a => { const l = piatto(a); const e = primoErr(l); if (e) return e.v; return l.some(x => !!num(x.v)); },
    ARROTONDA: a => { if (a.length !== 2) return ERR('#VALORE!'); const n = num(a[0]), d = num(a[1]); return isErr(n) ? n : isErr(d) ? d : arrot(n, Math.trunc(d)); },
    RADQ: a => { const n = num(a[0]); return isErr(n) ? n : n < 0 ? ERR('#NUM!') : Math.sqrt(n); },
    ASS: a => { const n = num(a[0]); return isErr(n) ? n : Math.abs(n); },
    'CERCA.VERT': a => a.length < 3 || !a[1] || !a[1].range ? ERR('#VALORE!') : cerca(a[0], a[1].range, a[2], a.length > 3 ? a[3] : true, true),
    'CERCA.ORIZZ': a => a.length < 3 || !a[1] || !a[1].range ? ERR('#VALORE!') : cerca(a[0], a[1].range, a[2], a.length > 3 ? a[3] : true, false),
    CONCAT: a => { const l = piatto(a), e = primoErr(l); return e ? e.v : l.map(x => txt(x.v)).join(''); },
    LUNGHEZZA: a => testo1(a, t => t.length),
    MAIUSC: a => testo1(a, t => t.toUpperCase()),
    MINUSC: a => testo1(a, t => t.toLowerCase()),
    'MAIUSC.INIZ': a => testo1(a, t => t.toLowerCase().replace(/(^|[^a-zà-ÿ])([a-zà-ÿ])/g, (m, p, l) => p + l.toUpperCase()))
  };

  /* ---------- calcolo del foglio ---------- */
  function calcola(celle) {
    const memo = {}, inCorso = new Set();
    function get(nome) {
      nome = nome.toUpperCase();
      if (nome in memo) return memo[nome];
      const raw = celle[nome];
      if (raw === undefined || raw === null || raw === '') return null;
      if (typeof raw !== 'string' || raw[0] !== '=') return raw;
      if (inCorso.has(nome)) return ERR('CIRC');
      inCorso.add(nome);
      let v; try { v = valuta(analizza(raw.slice(1)), get); } catch (e) { v = ERR('#NOME?'); }
      inCorso.delete(nome);
      if (v && v.range) v = ERR('#VALORE!');
      if (typeof v === 'number' && !isFinite(v)) v = ERR('#NUM!');
      return (memo[nome] = v);
    }
    return get;
  }
  function valuta(n, get) {
    const v = x => valuta(x, get);
    switch (n.k) {
      case 'val': return n.v;
      case 'ref': return get(nomeCella(n.a.c, n.a.r));
      case 'range': { const r0 = Math.min(n.a.r, n.b.r), r1 = Math.max(n.a.r, n.b.r), c0 = Math.min(n.a.c, n.b.c), c1 = Math.max(n.a.c, n.b.c), R = [];
        for (let r = r0; r <= r1; r++) { const riga = []; for (let c = c0; c <= c1; c++) riga.push(get(nomeCella(c, r))); R.push(riga); } return { range: R }; }
      case 'neg': { const a = num(v(n.a)); return isErr(a) ? a : -a; }
      case 'pct': { const a = num(v(n.a)); return isErr(a) ? a : a / 100; }
      case 'fn': { const f = FUNZ[n.n]; if (!f) return ERR('#NOME?'); const args = n.args.map(v);
        if (!['CONTA.VALORI', 'CONTA.NUMERI', 'CONTA.VUOTE', 'SE', 'CONTA.SE', 'SOMMA.SE', 'MEDIA.SE'].includes(n.n)) { const e = args.find(isErr); if (e) return e; }
        if (n.n === 'SE' && isErr(args[0])) return args[0];
        return f(args); }
      case 'bin': {
        let a = v(n.a), b = v(n.b);
        if (a && a.range || b && b.range) return ERR('#VALORE!');
        if (isErr(a)) return a; if (isErr(b)) return b;
        if (n.op === '&') return txt(a) + txt(b);
        if (['=', '<>', '<', '>', '<=', '>='].includes(n.op)) { const d = confr(a, b); return { '=': d === 0, '<>': d !== 0, '<': d < 0, '>': d > 0, '<=': d <= 0, '>=': d >= 0 }[n.op]; }
        a = num(a); b = num(b); if (isErr(a)) return a; if (isErr(b)) return b;
        if (n.op === '+') return a + b; if (n.op === '-') return a - b; if (n.op === '*') return a * b;
        if (n.op === '/') return b === 0 ? ERR('#DIV/0!') : a / b;
        if (n.op === '^') { const p = a ** b; return isFinite(p) && !isNaN(p) ? p : ERR('#NUM!'); }
      }
    }
    return ERR('#VALORE!');
  }
  /* il quadratino di riempimento: sposta di dr righe e dc colonne i riferimenti senza $ */
  function sposta(f, dr, dc) {
    return f.replace(/("(?:[^"]|"")*")|(?<![A-Za-z0-9.$])(\$?)([A-Za-z]{1,3})(\$?)(\d+)(?![A-Za-z0-9.(])/g, (m, s, a, col, b, row) => {
      if (s) return s;
      const c = a ? colN(col.toUpperCase()) : colN(col.toUpperCase()) + dc, r = b ? +row : +row + dr;
      return c < 0 || r < 1 ? '#RIF!' : `${a}${colL(c)}${b}${r}`;
    });
  }
  /* controlla la sintassi: '' se va bene, altrimenti il motivo */
  function sintassi(f) { try { analizza(f.slice(1)); return ''; } catch (e) { return e.message; } }
  const uguale = (a, b) => { if (isErr(a) || isErr(b)) return isErr(a) && isErr(b) && a.err === b.err;
    if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
    if (typeof a === 'string' && typeof b === 'string') return a.trim().toLowerCase() === b.trim().toLowerCase();
    return a === b; };
  return { calcola, sposta, sintassi, fmt, isErr, uguale, colL, colN, rif, nomeCella };
})();

/* che cosa vuol dire ogni errore, con le parole delle slide */
const FC_ERRORI = {
  '#DIV/0!': '#DIV/0! vuol dire divisione per zero: il divisore vale 0 oppure è una cella vuota.',
  '#VALORE!': '#VALORE! vuol dire tipo sbagliato: per esempio si fa un calcolo con un testo.',
  '#NOME?': '#NOME? vuol dire che Excel non riconosce un nome: una funzione scritta male oppure un testo senza virgolette.',
  '#RIF!': '#RIF! vuol dire riferimento non valido: la cella non esiste, per esempio oltre il bordo del foglio o oltre le colonne della tabella.',
  '#NUM!': '#NUM! vuol dire valore numerico non valido per la funzione, come la radice quadrata di un numero negativo.',
  '#N/D': '#N/D vuol dire non disponibile: la funzione di ricerca non ha trovato il valore.',
  CIRC: 'È un riferimento circolare: la formula usa la cella in cui è scritta.'
};

/* ---------- disegno di un foglio ----------
   foglioHTML(celle, get, {col, righe, segna: {B2: 'classe'}, mostra: {B2: 'testo al posto del valore'}}) */
function foglioHTML(celle, get, o) {
  let h = '<div class="fc-wrap"><table class="fc"><thead><tr><th></th>';
  for (let c = 0; c < o.col; c++) h += `<th>${FC.colL(c)}</th>`;
  h += '</tr></thead><tbody>';
  for (let r = 0; r < o.righe; r++) {
    h += `<tr><th>${r + 1}</th>`;
    for (let c = 0; c < o.col; c++) {
      const n = FC.nomeCella(c, r), v = get(n), cl = [o.segna && o.segna[n] || ''];
      let t;
      if (o.mostra && n in o.mostra) t = o.mostra[n];
      else { t = FC.fmt(v, 4); cl.push(FC.isErr(v) ? 'fc-e' : typeof v === 'number' ? 'fc-n' : typeof v === 'boolean' ? 'fc-b' : ''); }
      if (typeof celle[n] === 'string' && celle[n][0] === '=') cl.push('fc-f');
      h += `<td data-c="${n}" class="${cl.join(' ').trim()}">${escH(t)}</td>`;
    }
    h += '</tr>';
  }
  return h + '</tbody></table></div>';
}
const fcNum = (a, b, dec = 0) => dec ? Math.round((a + Math.random() * (b - a)) * 10 ** dec) / 10 ** dec : rnd(a, b);
const FC_NOMI = ['Anna', 'Luca', 'Sara', 'Marco', 'Giulia', 'Matteo', 'Elisa', 'Davide', 'Chiara', 'Paolo', 'Marta', 'Simone'];

/* ---------- la formula giusta ----------
   ogni consegna: t testo, col/righe del foglio, gen(i) i dati (i = numero della prova, per variare i casi),
   cella dove scrivere, sol la formula di riferimento, trappole [[formula sbagliata tipica, che cosa le manca]], nota dopo il successo */
const FC_VOTI = lab => i => { const c = { A1: 'Studente', B1: 'Voto', A8: lab }; shuffle(FC_NOMI).slice(0, 6).forEach((n, k) => { c['A' + (k + 2)] = n; c['B' + (k + 2)] = rnd(3, 10); });
  if (i >= 0) c.B2 = i % 2 ? rnd(8, 10) : rnd(3, 5); return c; };
const FC_CONSEGNE = [
  { t: 'In B8 calcolate la <b>media</b> dei voti.', col: 2, righe: 8, gen: FC_VOTI('Media'), cella: 'B8', sol: '=MEDIA(B2:B7)',
    trappole: [['=B2+B3+B4+B5+B6+B7/6', 'Attenzione alla precedenza: la divisione si fa prima dell\'addizione, quindi qui si divide solo B7. Servono le parentesi, oppure la funzione MEDIA.'], ['=SOMMA(B2:B7)', 'Questa è la somma: per la media va divisa per il numero dei voti, oppure si usa MEDIA.']],
    nota: 'La funzione MEDIA fa da sola somma e divisione: =MEDIA(B2:B7). Va bene anche =SOMMA(B2:B7)/6.' },
  { t: 'In B8 calcolate il <b>voto più alto</b>.', col: 2, righe: 8, gen: FC_VOTI('Più alto'), cella: 'B8', sol: '=MAX(B2:B7)', trappole: [['=MIN(B2:B7)', 'Questo è il voto più basso.']], nota: 'MAX restituisce il valore più grande dell\'intervallo, MIN il più piccolo.' },
  { t: 'In B8 calcolate il <b>voto più basso</b>.', col: 2, righe: 8, gen: FC_VOTI('Più basso'), cella: 'B8', sol: '=MIN(B2:B7)', trappole: [['=MAX(B2:B7)', 'Questo è il voto più alto.']], nota: 'MIN restituisce il valore più piccolo dell\'intervallo.' },
  { t: 'In B8 contate <b>quanti voti sono insufficienti</b>, cioè minori di 6.', col: 2, righe: 8, gen: FC_VOTI('Insufficienti'), cella: 'B8', sol: '=CONTA.SE(B2:B7;"<6")',
    trappole: [['=CONTA.SE(B2:B7;"<=6")', 'Il 6 è sufficiente: il criterio è minore di 6, non minore o uguale.'], ['=CONTA.NUMERI(B2:B7)', 'Così si contano tutti i voti: serve CONTA.SE con un criterio.']],
    nota: 'CONTA.SE(intervallo;criterio) conta le celle che rispettano il criterio; il criterio con un confronto va tra virgolette: "<6".' },
  { t: 'In B8 contate <b>quanti hanno preso almeno 8</b>.', col: 2, righe: 8, gen: FC_VOTI('Almeno 8'), cella: 'B8', sol: '=CONTA.SE(B2:B7;">=8")',
    trappole: [['=CONTA.SE(B2:B7;">8")', 'Almeno 8 vuol dire anche 8: il criterio è ">=8".']], nota: 'Il criterio ">=8" conta i voti maggiori o uguali a 8.' },
  { t: 'In B8 calcolate la <b>differenza</b> tra il voto più alto e il più basso.', col: 2, righe: 8, gen: FC_VOTI('Differenza'), cella: 'B8', sol: '=MAX(B2:B7)-MIN(B2:B7)', trappole: [], nota: 'Le funzioni si possono usare dentro un calcolo: =MAX(B2:B7)-MIN(B2:B7).' },
  { t: 'In B8 calcolate la <b>media arrotondata a una cifra decimale</b>.', col: 2, righe: 8, gen: FC_VOTI('Media'), cella: 'B8', sol: '=ARROTONDA(MEDIA(B2:B7);1)',
    trappole: [['=MEDIA(B2:B7)', 'Questa è la media senza arrotondare: mettetela dentro ARROTONDA(…;1).'], ['=ARROTONDA(MEDIA(B2:B7);0)', 'Il secondo argomento di ARROTONDA è il numero di cifre decimali: qui ne serve una.']],
    nota: 'Una funzione può stare dentro un\'altra: =ARROTONDA(MEDIA(B2:B7);1). Il secondo argomento dice quante cifre decimali tenere.' },
  { t: 'In C2 scrivete il <b>giudizio</b> di Anna: «Sufficiente» se il voto è almeno 6, altrimenti «Insufficiente».', col: 3, righe: 4, cella: 'C2', sol: '=SE(B2>=6;"Sufficiente";"Insufficiente")',
    gen: i => ({ A1: 'Studente', B1: 'Voto', C1: 'Giudizio', A2: 'Anna', B2: i >= 0 ? [rnd(3, 5), 6, rnd(7, 10)][i % 3] : rnd(3, 10), A3: 'Luca', B3: rnd(3, 10), A4: 'Sara', B4: rnd(3, 10) }),
    trappole: [['=SE(B2>6;"Sufficiente";"Insufficiente")', 'Con > il 6 diventa insufficiente: il test è B2>=6.']],
    nota: 'SE(test;se_vero;se_falso): i testi da restituire vanno tra virgolette.' },
  { t: 'Nel negozio: in D2 calcolate il <b>totale</b> del mouse, cioè prezzo per quantità.', col: 4, righe: 4, cella: 'D2', sol: '=B2*C2',
    gen: () => ({ A1: 'Prodotto', B1: 'Prezzo', C1: 'Quantità', D1: 'Totale', A2: 'Mouse', B2: fcNum(8, 30), C2: rnd(1, 9), A3: 'Tastiera', B3: fcNum(15, 60), C3: rnd(1, 9), A4: 'Cuffie', B4: fcNum(10, 80), C4: rnd(1, 9) }),
    trappole: [['=B2+C2', 'Il totale è prezzo per quantità: si moltiplica con *.']], nota: 'Si moltiplica con l\'asterisco: =B2*C2. Se cambiate il prezzo, il totale si aggiorna da solo.' },
  { t: 'In C2 calcolate l\'<b>IVA al 22%</b> del prezzo in B2.', col: 3, righe: 3, cella: 'C2', sol: '=B2*22%',
    gen: () => ({ A1: 'Prodotto', B1: 'Prezzo', C1: 'IVA', A2: 'Zaino', B2: fcNum(20, 90), A3: 'Astuccio', B3: fcNum(5, 25) }),
    trappole: [['=B2*22', 'Così si moltiplica per 22, non per il 22%: scrivete 22% oppure 0,22.'], ['=B2+B2*22%', 'Questo è il prezzo con l\'IVA: la consegna chiede solo l\'IVA.']], nota: 'Il simbolo % divide per 100: =B2*22% è uguale a =B2*0,22.' },
  { t: 'In C2 scrivete <b>nome e cognome</b> separati da uno spazio.', col: 3, righe: 3, cella: 'C2', sol: '=A2&" "&B2',
    gen: () => { const n = shuffle(FC_NOMI); return { A1: 'Nome', B1: 'Cognome', C1: 'Nome completo', A2: n[0], B2: pick(['Rossi', 'Bianchi', 'Verdi', 'Russo', 'Ferrari', 'Esposito']), A3: n[1], B3: pick(['Romano', 'Colombo', 'Ricci', 'Greco']) }; },
    trappole: [['=A2&B2', 'Manca lo spazio in mezzo: =A2&" "&B2.']], nota: 'L\'operatore & unisce i testi; va bene anche =CONCAT(A2;" ";B2).' },
  { t: 'Cinque misure di tempo in secondi: in H2 calcolate l\'<b>errore assoluto</b>, cioè metà della differenza tra la misura più grande e la più piccola.', col: 8, righe: 2, cella: 'H2', sol: '=(MAX(B2:F2)-MIN(B2:F2))/2',
    gen: () => { const c = { A1: 'Prova', B1: 'T1', C1: 'T2', D1: 'T3', E1: 'T4', F1: 'T5', G1: 'Media', H1: 'Errore', A2: 'Pendolo' }; 'BCDEF'.split('').forEach(l => c[l + '2'] = fcNum(1.2, 1.6, 2)); c.G2 = '=MEDIA(B2:F2)'; return c; },
    trappole: [['=MAX(B2:F2)-MIN(B2:F2)/2', 'Attenzione alla precedenza: così si divide per 2 solo il MIN. La differenza va tra parentesi: =(MAX(B2:F2)-MIN(B2:F2))/2.']],
    nota: 'Le parentesi decidono che cosa si calcola prima: =(MAX(B2:F2)-MIN(B2:F2))/2.' },
  { t: 'Alcuni studenti erano assenti: in B8 contate <b>quanti hanno fatto la verifica</b>, cioè quanti voti ci sono.', col: 2, righe: 8, cella: 'B8', sol: '=CONTA.NUMERI(B2:B7)',
    gen: i => { const c = FC_VOTI('Presenti')(-1), k = shuffle([2, 3, 4, 5, 6, 7]).slice(0, i >= 0 ? 1 + i % 3 : rnd(1, 3)); k.forEach(r => c['B' + r] = 'assente'); return c; },
    trappole: [['=CONTA.VALORI(B2:B7)', 'CONTA.VALORI conta anche le celle con il testo «assente»: serve CONTA.NUMERI, che conta solo i numeri.']],
    nota: 'CONTA.NUMERI conta solo le celle con un numero; CONTA.VALORI conta tutte le celle non vuote.' },
  { t: 'Il listino: in F2 trovate il <b>prezzo</b> del prodotto con il codice scritto in E2, con CERCA.VERT e la corrispondenza esatta.', col: 6, righe: 6, cella: 'F2', sol: '=CERCA.VERT(E2;A2:C6;3;FALSO)',
    gen: () => { const c = { A1: 'Codice', B1: 'Prodotto', C1: 'Prezzo', E1: 'Codice', F1: 'Prezzo' }, p = shuffle(['Penna', 'Matita', 'Gomma', 'Righello', 'Quaderno', 'Colla', 'Forbici']);
      for (let k = 0; k < 5; k++) { c['A' + (k + 2)] = 'P0' + (k + 1); c['B' + (k + 2)] = p[k]; c['C' + (k + 2)] = fcNum(1, 9, 1); } c.E2 = 'P0' + rnd(1, 5); return c; },
    trappole: [['=CERCA.VERT(E2;A2:C6;2;FALSO)', 'L\'indice 2 restituisce la seconda colonna, il nome del prodotto: il prezzo è nella terza.']],
    nota: 'CERCA.VERT(valore;tabella;indice;FALSO) cerca il valore nella prima colonna della tabella e restituisce la colonna numero indice della stessa riga.' }
];
function formulaLab(el, label = 'La formula giusta') {
  const st = stat(label);
  let mazzo = [], C, celle, primo, fatto, tentativi;
  el.innerHTML = `<div class="card fclab">${turn()}<div class="row"><button class="btn sec" data-a="n">Altra consegna</button></div>
   <p class="q fc-cons"></p><div class="fc-foglio"></div>
   <div class="fc-barra"><span class="fc-nome"></span><span class="fc-fx">fx</span><input type="text" class="fc-in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="=" aria-label="Formula"></div>
   <p class="fc-aiuto">Mentre scrivete, il foglio calcola dal vivo. Fate clic su una cella per inserire il suo riferimento nella formula.</p>
   <div class="row"><button class="btn" data-a="v">Verifica</button><button class="btn sec" data-a="s" hidden>Soluzione</button></div><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.fclab'), $q = s => c.querySelector(s), inp = $q('.fc-in'), up = () => $q('.stat').textContent = `Formule giuste al primo colpo: ${st.ok} su ${st.tot}`;
  let cursore = 0;
  function disegna() {
    const f = inp.value.trim(), celleOra = { ...celle };
    if (f) celleOra[C.cella] = f[0] === '=' ? f : (isNaN(+f.replace(',', '.')) ? f : +f.replace(',', '.'));
    const get = FC.calcola(celleOra), segna = { [C.cella]: 'fc-qui' };
    $q('.fc-foglio').innerHTML = foglioHTML(celleOra, get, { col: C.col, righe: C.righe, segna, mostra: f ? (f[0] === '=' && FC.sintassi(f) ? { [C.cella]: '…' } : {}) : { [C.cella]: '' } });
  }
  function nuovo() {
    if (!mazzo.length) mazzo = shuffle(FC_CONSEGNE.slice());
    C = mazzo.pop(); celle = C.gen(-1); primo = true; fatto = false; tentativi = 0;
    $q('.fc-cons').innerHTML = C.t; $q('.fc-nome').textContent = C.cella; inp.value = ''; inp.disabled = false; cursore = 0;
    $q('[data-a=s]').hidden = true; $q('[data-a=v]').disabled = false; $q('.msg').textContent = ''; disegna();
  }
  function verifica() {
    if (fatto) return;
    const f = inp.value.trim(), m = $q('.msg'), ko = t => { m.innerHTML = t; m.style.color = 'var(--ko)'; tentativi++; if (primo) { st.tot++; primo = false; up(); } if (tentativi >= 1) $q('[data-a=s]').hidden = false; };
    if (!f) { m.textContent = 'Scrivete la formula nella barra della formula.'; m.style.color = 'var(--mute)'; return; }
    if (f[0] !== '=') return ko('Una formula comincia sempre con il simbolo <b>=</b>: senza, il foglio la tratta come un testo o un numero scritto a mano.');
    const err = FC.sintassi(f); if (err) return ko(`Il foglio non riesce a leggere la formula: ${escH(err)}.`);
    const prova = dati => { const a = FC.calcola({ ...dati, [C.cella]: f })(C.cella), b = FC.calcola({ ...dati, [C.cella]: C.sol })(C.cella); return { a, b, ok: FC.uguale(a, b) }; };
    const ora = prova(celle);
    if (FC.isErr(ora.a)) return ko(`La cella mostra <b>${escH(FC.fmt(ora.a))}</b>. ${FC_ERRORI[ora.a.err] || ''}`);
    if (!ora.ok) {
      const t = C.trappole.find(([tf]) => FC.uguale(FC.calcola({ ...celle, [C.cella]: tf })(C.cella), ora.a) && !FC.uguale(FC.calcola({ ...celle, [C.cella]: tf })(C.cella), ora.b));
      return ko(`La cella mostra ${escH(FC.fmt(ora.a)) || 'niente'}, ma non è quello che chiede la consegna. ` + (t ? t[1] : 'Rileggete la consegna e controllate le celle che usate.'));
    }
    for (let i = 0; i < 6; i++) { const p = prova(C.gen(i)); if (!p.ok) {
      const t = C.trappole.find(([tf]) => !FC.uguale(FC.calcola({ ...C.gen(i), [C.cella]: tf })(C.cella), p.b));
      return ko(/[A-Z]+\d/i.test(f.slice(1)) ? 'Con questi numeri il risultato torna, ma con altri numeri no: la formula non vale in generale. ' + (t && FC.uguale(FC.calcola({ ...celle, [C.cella]: t[0] })(C.cella), ora.a) ? t[1] : 'Controllate i riferimenti e la condizione.')
        : 'Il risultato torna, ma avete scritto i numeri a mano: se cambiano i dati la cella resta uguale. Usate i riferimenti alle celle.'); } }
    fatto = true; if (primo) { st.tot++; st.ok++; primo = false; up(); }
    inp.disabled = true; $q('[data-a=v]').disabled = true; $q('[data-a=s]').hidden = true;
    m.innerHTML = `Esatto! ${escH(C.nota)} Provate a cambiare un numero nel foglio: con «Altra consegna» si continua.`; m.style.color = 'var(--ok)';
    $q('.fc-foglio').querySelector(`[data-c="${C.cella}"]`)?.classList.add('fc-ok');
  }
  inp.addEventListener('input', disegna);
  ['keyup', 'click', 'blur'].forEach(ev => inp.addEventListener(ev, () => { cursore = inp.selectionStart ?? inp.value.length; }));
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); verifica(); } });
  c.addEventListener('click', e => {
    const td = e.target.closest('.fc td[data-c]');
    if (td && !fatto) { const n = td.dataset.c; if (n === C.cella) { inp.focus(); return; }
      let v = inp.value; if (!v) { v = '='; cursore = 1; }
      inp.value = v.slice(0, cursore) + n + v.slice(cursore); cursore += n.length; inp.focus(); inp.setSelectionRange(cursore, cursore); disegna(); return; }
    const b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'n') nuovo();
    if (b.dataset.a === 'v') verifica();
    if (b.dataset.a === 's') { const m = $q('.msg'); m.innerHTML = `Una soluzione: <code>${escH(C.sol)}</code>. ${escH(C.nota)}`; m.style.color = 'var(--ink)'; }
  });
  up(); nuovo();
}

/* ---------- i $ al posto giusto ----------
   ogni schema: t testo, col/righe, celle, da (cella con la formula), f (formula senza $), area da riempire, sol (formula giusta) */
const FC_DOLLARI = [
  { t: 'I prezzi sono in euro e il cambio in dollari è in F1. La formula in C2 va copiata fino a C6.', col: 6, righe: 6, da: 'C2', f: '=B2*F1', area: 'C2:C6', sol: '=B2*$F$1', liv: 1,
    gen: () => { const c = { A1: 'Prodotto', B1: 'Euro', C1: 'Dollari', E1: 'Cambio', F1: pick([1.08, 1.1, 1.12, 1.15]) }; ['Libro', 'Zaino', 'Felpa', 'Cuffie', 'Lampada'].forEach((p, k) => { c['A' + (k + 2)] = p; c['B' + (k + 2)] = fcNum(10, 80); }); return c; },
    nota: 'Il cambio è uno solo, in F1: copiando in giù la riga non deve cambiare, quindi $F$1 (bastava anche F$1).' },
  { t: 'In C2 la percentuale delle vendite di gennaio sul totale in B7. La formula va copiata fino a C6.', col: 3, righe: 7, da: 'C2', f: '=B2/B7*100', area: 'C2:C6', sol: '=B2/$B$7*100', liv: 1,
    gen: () => { const c = { A1: 'Mese', B1: 'Vendite', C1: '% sul totale', A7: 'Totale', B7: '=SOMMA(B2:B6)' }; ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio'].forEach((m, k) => { c['A' + (k + 2)] = m; c['B' + (k + 2)] = rnd(10, 90); }); return c; },
    nota: 'Il totale sta sempre in B7: $B$7 (o B$7) impedisce che scenda a B8, B9… che sono vuote e danno #DIV/0!.' },
  { t: 'Lo sconto è in F1. In C2 il prezzo scontato; la formula va copiata fino a C6.', col: 6, righe: 6, da: 'C2', f: '=B2*(1-F1)', area: 'C2:C6', sol: '=B2*(1-$F$1)', liv: 1,
    gen: () => { const c = { A1: 'Articolo', B1: 'Prezzo', C1: 'Scontato', E1: 'Sconto', F1: pick([0.1, 0.2, 0.25, 0.3]) }; ['Scarpe', 'Giacca', 'Maglia', 'Borsa', 'Cintura'].forEach((p, k) => { c['A' + (k + 2)] = p; c['B' + (k + 2)] = fcNum(20, 120); }); return c; },
    nota: 'Lo sconto è uno solo: $F$1. Il prezzo invece cambia a ogni riga, quindi B2 resta relativo.' },
  { t: 'Il totale progressivo: in C3 si somma il totale della riga sopra e la spesa della riga. La formula va copiata fino a C7.', col: 3, righe: 7, da: 'C3', f: '=C2+B3', area: 'C3:C7', sol: '=C2+B3', liv: 1,
    gen: () => { const c = { A1: 'Giorno', B1: 'Spesa', C1: 'Totale', C2: '=B2' }; ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].forEach((g, k) => { c['A' + (k + 2)] = g; c['B' + (k + 2)] = rnd(2, 30); }); return c; },
    nota: 'Qui non serve nessun $: a ogni riga si vuole proprio la cella sopra e la spesa della stessa riga, quindi i riferimenti relativi vanno bene così.' },
  { t: 'La tavola pitagorica: in B2 il prodotto tra il numero della colonna A e quello della riga 1. La formula va copiata in tutto B2:F6.', col: 6, righe: 6, da: 'B2', f: '=A2*B1', area: 'B2:F6', sol: '=$A2*B$1', liv: 2,
    gen: () => { const c = {}; for (let k = 1; k <= 5; k++) { c['A' + (k + 1)] = k; c[FC.colL(k) + '1'] = k; } return c; },
    nota: 'Riferimenti misti: $A2 blocca la colonna A ma lascia scorrere la riga, B$1 blocca la riga 1 ma lascia scorrere la colonna.' },
  { t: 'I capitali sono nella colonna A e i tassi nella riga 2. In B3 l\'interesse di un anno; la formula va copiata in tutto B3:D6.', col: 4, righe: 6, da: 'B3', f: '=A3*B2', area: 'B3:D6', sol: '=$A3*B$2', liv: 2,
    gen: () => { const c = { A1: 'Interessi', A2: 'Capitale', B2: 0.02, C2: 0.03, D2: 0.05 }; [1000, 2000, 5000, 10000].forEach((v, k) => c['A' + (k + 3)] = v); return c; },
    nota: 'Il capitale è sempre nella colonna A ($A3), il tasso sempre nella riga 2 (B$2).' },
  { t: 'I prezzi dei biglietti sono nella riga 2 e il numero di persone in A3:A6. In B3 il costo totale; la formula va copiata in tutto B3:D6.', col: 4, righe: 6, da: 'B3', f: '=B2*A3', area: 'B3:D6', sol: '=B$2*$A3', liv: 2,
    gen: () => { const c = { A1: 'Persone', B1: 'Cinema', C1: 'Teatro', D1: 'Museo', A2: 'Prezzo', B2: pick([7, 8, 9]), C2: pick([15, 20, 25]), D2: pick([10, 12]) }; for (let k = 0; k < 4; k++) c['A' + (k + 3)] = k + 1; return c; },
    nota: 'Il prezzo sta sempre nella riga 2 (B$2), le persone sempre nella colonna A ($A3).' }
];
function dollariLab(el, label = 'I $ al posto giusto') {
  const st = stat(label);
  let S, celle, pezzi, primo, fatto, mazzo = {};
  el.innerHTML = `<div class="card dollab">${turn()}<div class="row"><select class="fc-liv"><option value="1">Livello 1: si copia in giù</option><option value="2">Livello 2: in giù e a destra</option></select><button class="btn sec" data-a="n">Altro schema</button></div>
   <p class="q fc-cons"></p><div class="fc-foglio"></div>
   <p class="fc-aiuto">Fate clic su un riferimento per cambiarlo: A1 → $A$1 → A$1 → $A1 → A1. Poi copiate la formula con il quadratino.</p>
   <div class="fc-form"></div><div class="row"><button class="btn" data-a="c">Copia con il quadratino</button><button class="btn sec" data-a="r" hidden>Riprova</button></div>
   <div class="fc-barra fc-sola"><span class="fc-nome"></span><span class="fc-fx">fx</span><code class="fc-mostra"></code></div><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.dollab'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Schemi giusti alla prima copia: ${st.ok} su ${st.tot}`;
  const area = () => { const [a, b] = S.area.split(':').map(FC.rif), l = []; for (let r = a.r; r <= b.r; r++) for (let k = a.c; k <= b.c; k++) l.push([FC.nomeCella(k, r), r - FC.rif(S.da).r, k - FC.rif(S.da).c]); return l; };
  const formula = () => pezzi.map(p => p.ref ? (p.ac ? '$' : '') + p.col + (p.ar ? '$' : '') + p.row : p.t).join('');
  let copiate = null;
  function disegna() {
    const ce = { ...celle }, segna = {}, mostra = {};
    if (copiate) copiate.forEach(([n, f, ok]) => { ce[n] = f; segna[n] = ok ? 'fc-ok' : 'fc-ko'; });
    else { ce[S.da] = formula(); area().forEach(([n]) => { if (n !== S.da) { segna[n] = 'fc-vuota'; mostra[n] = ''; } }); segna[S.da] = 'fc-qui'; }
    $q('.fc-foglio').innerHTML = foglioHTML(ce, FC.calcola(ce), { col: S.col, righe: S.righe, segna, mostra });
    $q('.fc-form').innerHTML = `<span class="fc-cella">${S.da}</span> <code>` + pezzi.map((p, i) => p.ref ? `<button class="fc-ref${p.ac || p.ar ? ' bloccato' : ''}" data-i="${i}" ${copiate ? 'disabled' : ''}>${(p.ac ? '$' : '') + p.col + (p.ar ? '$' : '') + p.row}</button>` : `<span>${escH(p.t)}</span>`).join('') + '</code>';
  }
  function mostraCella(n) { const ce = { ...celle }; if (copiate) copiate.forEach(([k, f]) => ce[k] = f); else ce[S.da] = formula(); $q('.fc-nome').textContent = n; $q('.fc-mostra').textContent = ce[n] === undefined ? '' : String(typeof ce[n] === 'number' ? FC.fmt(ce[n]) : ce[n]); }
  function nuovo() {
    const liv = +$q('.fc-liv').value, l = FC_DOLLARI.filter(x => x.liv === liv);
    if (!mazzo[liv] || !mazzo[liv].length) mazzo[liv] = shuffle(l.slice());
    S = mazzo[liv].pop(); celle = S.gen(); primo = true; fatto = false; copiate = null;
    pezzi = S.f.split(/(\$?[A-Z]{1,3}\$?\d+)/).filter(Boolean).map(t => { const r = /^(\$?)([A-Z]{1,3})(\$?)(\d+)$/.exec(t); return r ? { ref: true, ac: !!r[1], col: r[2], ar: !!r[3], row: r[4] } : { t }; });
    $q('.fc-cons').textContent = S.t; $q('[data-a=c]').hidden = false; $q('[data-a=r]').hidden = true; $q('.msg').textContent = ''; disegna(); mostraCella(S.da);
  }
  function copia() {
    const f = formula(), conti = area().map(([n, dr, dc]) => {
      const mia = FC.sposta(f, dr, dc), giusta = FC.sposta(S.sol, dr, dc);
      return [n, mia, giusta];
    });
    const ce = { ...celle }; conti.forEach(([n, f]) => ce[n] = f); const get = FC.calcola(ce);
    const ceG = { ...celle }; conti.forEach(([n, , g]) => ceG[n] = g); const getG = FC.calcola(ceG);
    copiate = conti.map(([n, f]) => [n, f, FC.uguale(get(n), getG(n))]);
    const sbagliate = copiate.filter(x => !x[2]), ok = !sbagliate.length;
    if (primo) { st.tot++; if (ok) st.ok++; primo = false; up(); }
    disegna(); $q('[data-a=c]').hidden = true; const m = $q('.msg');
    if (ok) { fatto = true; m.innerHTML = `Tutte le celle sono giuste! ${escH(S.nota)} Fate clic sulle celle per vedere dove sono finiti i riferimenti.`; m.style.color = 'var(--ok)'; $q('[data-a=r]').hidden = true; }
    else { const [n, f] = sbagliate[0], v = get(n); m.innerHTML = `${sbagliate.length} cell${sbagliate.length === 1 ? 'a è sbagliata' : 'e sono sbagliate'}. Per esempio in ${n} la formula è diventata <code>${escH(f)}</code>${FC.isErr(v) ? ` e la cella mostra ${escH(FC.fmt(v))}` : ''}: fate clic sulle celle rosse per vedere dove sono finiti i riferimenti, poi riprovate.`; m.style.color = 'var(--ko)'; $q('[data-a=r]').hidden = false; }
    mostraCella(sbagliate.length ? sbagliate[0][0] : S.da);
  }
  c.addEventListener('click', e => {
    const r = e.target.closest('.fc-ref'); if (r && !copiate) { const p = pezzi[+r.dataset.i], k = (p.ac ? 1 : 0) + (p.ar ? 2 : 0), nx = { 0: 3, 3: 2, 2: 1, 1: 0 }[k]; p.ac = !!(nx & 1); p.ar = !!(nx & 2); disegna(); mostraCella(S.da); return; }
    const td = e.target.closest('.fc td[data-c]'); if (td) { mostraCella(td.dataset.c); return; }
    const b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'n') nuovo();
    if (b.dataset.a === 'c' && !copiate) copia();
    if (b.dataset.a === 'r' && !fatto) { copiate = null; $q('[data-a=c]').hidden = false; b.hidden = true; $q('.msg').textContent = ''; disegna(); mostraCella(S.da); }
  });
  $q('.fc-liv').onchange = nuovo; up(); nuovo();
}

/* ---------- che cosa mostra la cella? ----------
   generatore per mount: un piccolo foglio A1:C4, una formula in D1; le risposte sbagliate sono calcolate dal motore
   su formule vicine (gli errori tipici), così sono sempre coerenti con il foglio. */
const FC_PREVEDI = [
  () => { const c = { A1: rnd(2, 9), B1: rnd(2, 9), C1: rnd(2, 5) }; return { c, f: '=A1+B1*C1', alt: ['=(A1+B1)*C1', '=A1+B1+C1'], s: 'Come in matematica, la moltiplicazione si fa prima dell\'addizione: prima B1*C1, poi si aggiunge A1.' }; },
  () => { const c = { A1: rnd(2, 9), B1: rnd(2, 9), C1: rnd(2, 9) }; return { c, f: '=MAX(A1:C1)-MIN(A1:C1)/2', alt: ['=(MAX(A1:C1)-MIN(A1:C1))/2', '=MAX(A1:C1)-MIN(A1:C1)'], s: 'La divisione si fa prima della sottrazione: qui si divide per 2 solo il MIN. Per dividere la differenza servono le parentesi.' }; },
  () => { const c = { A1: rnd(2, 9), A2: rnd(2, 9), A3: 'dieci', A4: rnd(2, 9) }; return { c, f: '=SOMMA(A1:A4)', alt: ['#VALORE!', '=A1+A2+A4+10'], s: 'Dentro un intervallo SOMMA ignora le celle con il testo: somma solo i numeri.' }; },
  () => { const c = { A1: rnd(2, 9), A2: 'dieci' }; return { c, f: '=A1+A2', alt: ['=A1', '=A1+10', '#NOME?'], s: 'Con l\'operatore + un testo non si può sommare: la cella mostra #VALORE!, tipo di operando sbagliato.' }; },
  () => { const c = { A1: rnd(10, 40), B1: rnd(2, 5) }; return { c, f: '=A1/B2', alt: ['=A1', '0', '#VALORE!'], s: 'B2 è vuota e una cella vuota vale 0: dividere per zero dà #DIV/0!.' }; },
  () => { const c = { A1: rnd(2, 9), A2: rnd(2, 9), A3: rnd(2, 9) }; return { c, f: '=SOMA(A1:A3)', alt: ['=SOMMA(A1:A3)', '#VALORE!', '#RIF!'], s: 'SOMA non è il nome di una funzione: Excel mostra #NOME?.' }; },
  () => { const a = rnd(2, 5), c = { A1: a, B1: a + rnd(2, 6) }; return { c, f: '=RADQ(A1-B1)', alt: ['=RADQ(B1-A1)', '#VALORE!', '0'], s: 'A1-B1 è negativo e la radice quadrata di un numero negativo non esiste: #NUM!.' }; },
  () => { const c = { A1: rnd(1, 9), B1: 'ok', C1: rnd(1, 9), A2: rnd(1, 9), B2: 'no' }; return { c, f: '=CONTA.NUMERI(A1:C2)', alt: ['=CONTA.VALORI(A1:C2)', '6', '=CONTA.VUOTE(A1:C2)'], s: 'CONTA.NUMERI conta solo le celle con un numero: non conta i testi e le celle vuote.' }; },
  () => { const c = { A1: rnd(1, 9), B1: 'ok', C1: rnd(1, 9), A2: rnd(1, 9) }; return { c, f: '=CONTA.VALORI(A1:C2)', alt: ['=CONTA.NUMERI(A1:C2)', '6', '=CONTA.VUOTE(A1:C2)'], s: 'CONTA.VALORI conta tutte le celle non vuote, con numeri o testi.' }; },
  () => { const c = { A1: rnd(1, 9), C1: rnd(1, 9), B2: 'x' }; return { c, f: '=CONTA.VUOTE(A1:C2)', alt: ['=CONTA.VALORI(A1:C2)', '6', '0'], s: 'CONTA.VUOTE conta le celle vuote dell\'intervallo: A1:C2 ha 6 celle.' }; },
  () => { const c = {}; ['A1', 'B1', 'C1', 'A2', 'B2', 'C2'].forEach(n => c[n] = rnd(3, 9)); const k = pick([5, 6, 7]); return { c, f: `=CONTA.SE(A1:C2;">=${k}")`, alt: [`=CONTA.SE(A1:C2;">${k}")`, `=CONTA.SE(A1:C2;"<${k}")`, '6'], s: `Il criterio ">=${k}" conta le celle con un valore maggiore o uguale a ${k}.` }; },
  () => { const v = rnd(3, 9), c = { A1: v }; return { c, f: '=SE(A1>=6;"Promosso";"Rimandato")', alt: [v >= 6 ? '=SE(A1<6;"Promosso";"Rimandato")' : '=SE(A1<6;"Rimandato";"Promosso")', 'VERO', '#NOME?'], s: 'SE controlla il test A1>=6: se è vero restituisce il secondo argomento, altrimenti il terzo.' }; },
  () => { const c = { A1: rnd(2, 9), A2: rnd(2, 9), A4: rnd(2, 9) }; return { c, f: '=MEDIA(A1:A4)', alt: ['=SOMMA(A1:A4)/4', '=SOMMA(A1:A4)', '#DIV/0!'], s: 'MEDIA ignora le celle vuote: qui divide per 3, non per 4.' }; },
  () => { const c = { A1: pick([50, 80, 120, 200, 250]) }; return { c, f: '=A1*20%', alt: ['=A1*20', '=A1+20', '=A1*2'], s: 'Il simbolo % divide per 100: A1*20% è il 20 per cento di A1.' }; },
  () => { const c = { A1: 'P01', B1: 'Penna', A2: 'P02', B2: 'Gomma', A3: 'P03', B3: 'Colla' }; return { c, f: '=CERCA.VERT("P04";A1:B3;2;FALSO)', alt: ['"Colla"', '#RIF!', '#VALORE!'], s: 'Con FALSO CERCA.VERT vuole la corrispondenza esatta: P04 non c\'è e la cella mostra #N/D.' }; },
  () => { const c = { A1: 'P01', B1: 'Penna', A2: 'P02', B2: 'Gomma', A3: 'P03', B3: 'Colla' }, k = pick(['P01', 'P02', 'P03']); return { c, f: `=CERCA.VERT("${k}";A1:B3;3;FALSO)`, alt: [`=CERCA.VERT("${k}";A1:B3;2;FALSO)`, '#N/D', '#VALORE!'], s: 'La tabella A1:B3 ha solo 2 colonne: l\'indice 3 non esiste e la cella mostra #RIF!.' }; },
  () => { const c = { A1: 'P01', B1: 'Penna', A2: 'P02', B2: 'Gomma', A3: 'P03', B3: 'Colla' }, k = pick(['P01', 'P02', 'P03']); return { c, f: `=CERCA.VERT("${k}";A1:B3;2;FALSO)`, alt: ['#N/D', `"${k}"`, '#RIF!'], s: `CERCA.VERT trova ${k} nella prima colonna e restituisce il valore della seconda colonna nella stessa riga.` }; },
  () => { const c = { A1: rnd(10, 99) }, d = pick([3, 7]); return { c, f: `=ARROTONDA(A1/${d};1)`, alt: [`=A1/${d}`, `=ARROTONDA(A1/${d};0)`, `=ARROTONDA(A1/${d};2)`], s: 'ARROTONDA(numero;1) tiene una sola cifra decimale.' }; },
  () => { const c = { A1: rnd(2, 9), B1: rnd(2, 9) }; return { c, f: '=A1&B1', alt: ['=A1+B1', '=A1*B1', '#VALORE!'], s: 'L\'operatore & unisce i valori come testo: non somma, li mette uno dopo l\'altro.' }; },
  () => { const c = { A1: pick(['mario', 'LUCA', 'giulia', 'ANNA']), B1: pick(['rossi', 'BIANCHI', 'verdi']) }; return { c, f: '=MAIUSC.INIZ(A1&" "&B1)', alt: ['=MAIUSC(A1&" "&B1)', '=MINUSC(A1&" "&B1)', '=A1&B1'], s: 'MAIUSC.INIZ mette la maiuscola solo all\'iniziale di ogni parola.' }; },
  () => { const c = { A1: pick(['Informatica', 'Excel', 'Fogli Google', 'Cella']) }; return { c, f: '=LUNGHEZZA(A1)', alt: ['=LUNGHEZZA(A1)+1', '=LUNGHEZZA(A1)-1', '1'], s: 'LUNGHEZZA conta i caratteri del testo, spazi compresi.' }; },
  () => { const c = { A1: rnd(2, 9), B1: rnd(2, 9) }; return { c, f: '=A1+B1+D1', alt: ['=A1+B1', '0', '#RIF!'], s: 'La formula è in D1 e usa D1 stessa: è un riferimento circolare, la formula non si può calcolare.' }; }
];
const FC_COPIA = () => {
  const mio = { c: rnd(0, 2), r: rnd(1, 4) }, da = FC.nomeCella(mio.c + 2, mio.r), dr = rnd(1, 4) * (Math.random() < 0.2 ? 0 : 1), dc = rnd(0, 2) * (dr && Math.random() < 0.5 ? 0 : 1) || (dr ? 0 : 1);
  const r1 = { c: mio.c, r: mio.r }, r2 = { c: rnd(0, 3), r: rnd(0, 2) }, modi = [['', ''], ['$', '$'], ['$', ''], ['', '$']], m1 = pick([modi[0], modi[0], modi[2], modi[3]]), m2 = pick([modi[1], modi[1], modi[2], modi[3]]);
  const ref = (p, m) => `${m[0]}${FC.colL(p.c)}${m[1]}${p.r + 1}`, op = pick(['*', '+', '/']), f = `=${ref(r1, m1)}${op}${ref(r2, m2)}`;
  const a = FC.nomeCella(mio.c + 2 + dc, mio.r + dr), giusta = FC.sposta(f, dr, dc);
  const tutto = f.replace(/\$/g, ''), alt = [FC.sposta(tutto, dr, dc), f, FC.sposta(f.replace(/\$/g, '').replace(/([A-Z]+)(\d+)/g, '$$$1$$$2'), dr, dc).replace(/\$/g, ''), FC.sposta(f, dc, dr)].filter(x => x !== giusta);
  const opts = [giusta, ...[...new Set(alt)].slice(0, 3)];
  return { q: `<p>In <b>${da}</b> c'è la formula <code>${escH(f)}</code>. Con il quadratino di riempimento la copiate in <b>${a}</b>: che formula diventa?</p>`, sl: 'Spiegazione',
    fields: [{ label: 'Formula', kind: 'choice', opts: ['', ...shuffle(opts)], exp: giusta }],
    sol: `<p>Diventa <code>${escH(giusta)}</code>. Da ${da} a ${a} ci si sposta di ${dr} rig${dr === 1 ? 'a' : 'he'} e ${dc} colonn${dc === 1 ? 'a' : 'e'}: i riferimenti senza $ si spostano della stessa quantità, la parte con il $ davanti resta ferma.</p>` };
};
function prevediCella() {
  if (Math.random() < 0.2) return FC_COPIA();
  const P = pick(FC_PREVEDI)(), celle = { ...P.c, D1: P.f }, get = FC.calcola(celle), giusta = FC.fmt(get('D1'));
  const vals = P.alt.map(a => a[0] === '=' ? FC.fmt(FC.calcola({ ...P.c, D1: a })('D1')) : a[0] === '"' ? a.slice(1, -1) : a);
  const opts = [giusta]; for (const v of [...vals, '0', '#VALORE!', '#NOME?', '#RIF!']) if (opts.length < 4 && v !== '' && !opts.includes(v)) opts.push(v);
  const tab = foglioHTML(celle, get, { col: 4, righe: 4, segna: { D1: 'fc-qui' }, mostra: { D1: '?' } });
  return { q: `<p>In <b>D1</b> c'è la formula <code>${escH(P.f)}</code>. Che cosa mostra la cella?</p>${tab}`, sl: 'Spiegazione',
    fields: [{ label: 'D1 mostra', kind: 'choice', opts: ['', ...shuffle(opts)], exp: giusta }],
    sol: `<p>D1 mostra <b>${escH(giusta)}</b>. ${escH(P.s)}${FC.isErr(get('D1')) && FC_ERRORI[get('D1').err] ? ' ' + escH(FC_ERRORI[get('D1').err]) : ''}</p>` };
}
