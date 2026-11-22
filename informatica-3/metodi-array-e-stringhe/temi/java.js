/* Metodi, array e stringhe in Java. Generatori condivisi dalle pagine dell'unità.
   Solo definizioni: va caricato dopo assets/giochi.js e assets/codice.js.
   - pp...: programmi per l'esecuzione passo passo (traccia), {t, lang, code, run}; gli array stanno nello heap (H)
   - ...Gen: esercizi con campi per mount() e mission(), {q, fields, sol, sl}
   - hunt...: caccia all'errore, {t, lines, bad, why} */

const J = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const PJ = righe => `<pre>${J(righe.join('\n'))}</pre>`;
/* i campi di un array nello heap: 0, 1, 2... e length */
const campiArray = a => Object.assign({}, ...a.map((x, i) => ({ [i]: x })), { length: a.length });

/* ---------- metodi ---------- */
function ppMetodo() {
  const a = rnd(2, 9), b = rnd(2, 9);
  return {
    t: 'Un metodo che restituisce un valore: i parametri nascono alla chiamata e spariscono con il <code>return</code>.', lang: 'java',
    code: ['static int area(int base, int altezza) {', '    int a = base * altezza;', '    return a;', '}', '', 'public static void main(String[] args) {', `    int b = ${a};`, `    int h = ${b};`, '    int r = area(b, h);', '    System.out.println("Area: " + r);', '}'],
    run(S) {
      S(5, {}, '', 'Si parte dal main.'); S(6, { b: a }); S(7, { b: a, h: b });
      S(8, { b: a, h: b }, '', 'Chiamata: i valori di b e h vengono copiati nei parametri base e altezza.');
      S(0, { b: a, h: b, base: a, altezza: b }, '', 'Ora si esegue il metodo, con i suoi parametri.');
      S(1, { b: a, h: b, base: a, altezza: b, a: a * b }, '', 'a è una variabile locale del metodo.');
      S(2, { b: a, h: b, base: a, altezza: b, a: a * b }, '', `return restituisce ${a * b} a chi ha chiamato.`);
      S(8, { b: a, h: b, r: a * b }, '', 'Finito il metodo, base, altezza e a non esistono più; il valore va in r.');
      S(9, { b: a, h: b, r: a * b }, `Area: ${a * b}\n`);
    }
  };
}
function ppPerValore() {
  const n = rnd(2, 9);
  return {
    t: 'Passaggio per valore: il metodo lavora su una copia, la variabile del main non cambia.', lang: 'java',
    code: ['static void raddoppia(int x) {', '    x = x * 2;', '    System.out.println("Nel metodo: " + x);', '}', '', 'public static void main(String[] args) {', `    int n = ${n};`, '    raddoppia(n);', '    System.out.println("Nel main: " + n);', '}'],
    run(S) {
      S(6, { n }); S(7, { n }, '', 'Si chiama il metodo passando n.');
      S(0, { n, x: n }, '', 'x riceve una copia del valore di n.');
      S(1, { n, x: n * 2 }, '', 'Cambia x, non n.');
      S(2, { n, x: n * 2 }, `Nel metodo: ${n * 2}\n`);
      S(7, { n }, '', 'Il metodo è finito: x non esiste più.');
      S(8, { n }, `Nel main: ${n}\n`, 'n vale ancora ' + n + '.');
    }
  };
}
function ppRicorsione() {
  const N = rnd(3, 4);
  const code = ['static int fatt(int n) {', '    if (n <= 1) return 1;', '    return n * fatt(n - 1);', '}', '', 'public static void main(String[] args) {', `    System.out.println(fatt(${N}));`, '}'];
  return {
    t: `Un metodo ricorsivo: fatt(${N}) chiama fatt(${N - 1}), e così via fino al caso base.`, lang: 'java', code,
    run(S) {
      const pila = [];
      const v = () => Object.assign({}, ...pila.map((x, i) => ({ ['n (chiamata ' + (i + 1) + ')']: x })));
      S(6, {}, '', `Il main chiama fatt(${N}).`);
      for (let n = N; n >= 1; n--) {
        pila.push(n); S(0, v(), '', `Nuova chiamata: n = ${n}. Le chiamate precedenti aspettano.`);
        if (n <= 1) { S(1, v(), '', 'Caso base: restituisce 1 senza chiamare altro.'); break; }
        S(1, v(), '', `${n} &lt;= 1 è falso.`); S(2, v(), '', `Per calcolare ${n} * fatt(${n - 1}) serve prima fatt(${n - 1}).`);
      }
      let r = 1; pila.pop();
      while (pila.length) { const n = pila[pila.length - 1]; r *= n; S(2, v(), '', `fatt(${n - 1}) è tornato: ${n} * ${r / n} = ${r}.`); pila.pop(); }
      S(6, {}, `${r}\n`, `Tutte le chiamate sono finite: fatt(${N}) = ${r}.`);
    }
  };
}

/* ---------- array (nello heap) ---------- */
function ppArrayMax() {
  const v = Array.from({ length: rnd(4, 5) }, () => rnd(1, 30));
  return {
    t: 'Il massimo di un array: si parte dal primo elemento e si confronta con gli altri.', lang: 'java',
    code: [`int[] v = {${v.join(', ')}};`, 'int max = v[0];', 'for (int i = 1; i < v.length; i++) {', '    if (v[i] > max) {', '        max = v[i];', '    }', '}', 'System.out.println("Massimo: " + max);'],
    run(S, H) {
      const a = H.nuovo('int[]', campiArray(v)); S(0, { v: a }, '', 'Un array in Java è un oggetto: v contiene il riferimento.');
      let max = v[0]; S(1, { v: a, max }, '', 'Il primo elemento fa da massimo provvisorio.');
      for (let i = 1; i < v.length; i++) {
        S(2, { v: a, max, i }, '', `${i} &lt; ${v.length} è vero.`);
        S(3, { v: a, max, i }, '', `v[${i}] = ${v[i]}: è maggiore di ${max}? ${v[i] > max ? 'sì' : 'no'}.`);
        if (v[i] > max) { max = v[i]; S(4, { v: a, max, i }, '', 'Nuovo massimo.'); }
      }
      S(2, { v: a, max, i: v.length }, '', `${v.length} &lt; ${v.length} è falso: si esce.`);
      S(7, { v: a, max }, `Massimo: ${max}\n`);
    }
  };
}
function ppArrayMedia() {
  const v = Array.from({ length: 4 }, () => rnd(4, 10));
  return {
    t: 'La media dei voti con un for-each: si sommano tutti gli elementi e si divide per <code>length</code>.', lang: 'java',
    code: [`int[] voti = {${v.join(', ')}};`, 'int somma = 0;', 'for (int x : voti) {', '    somma += x;', '}', 'double media = (double) somma / voti.length;', 'System.out.println("Media: " + media);'],
    run(S, H) {
      const a = H.nuovo('int[]', campiArray(v)); S(0, { voti: a });
      let s = 0; S(1, { voti: a, somma: s });
      for (const x of v) { S(2, { voti: a, somma: s, x }, '', `x prende il valore dell'elemento successivo: ${x}.`); s += x; S(3, { voti: a, somma: s, x }); }
      const m = s / v.length;
      S(5, { voti: a, somma: s, media: m }, '', 'Il cast a double evita la divisione intera.');
      S(6, { voti: a, somma: s, media: m }, `Media: ${Number.isInteger(m) ? m + '.0' : String(m)}\n`);
    }
  };
}
function ppArrayCopia() {
  const v = Array.from({ length: 3 }, () => rnd(1, 9)), z = rnd(10, 99);
  return {
    t: '<code>b = a</code> non copia l\'array: copia il riferimento. Per una copia vera serve un array nuovo.', lang: 'java',
    code: [`int[] a = {${v.join(', ')}};`, 'int[] b = a;', `b[0] = ${z};`, 'System.out.println(a[0]);', 'int[] c = new int[a.length];', 'for (int i = 0; i < a.length; i++) c[i] = a[i];', 'c[1] = 0;', 'System.out.println(a[1]);'],
    run(S, H) {
      const A = H.nuovo('int[]', campiArray(v)); S(0, { a: A });
      S(1, { a: A, b: A }, '', 'b punta allo stesso array di a.');
      H.campo(A, '0', z); S(2, { a: A, b: A }, '', 'Si cambia l\'unico array che esiste...');
      S(3, { a: A, b: A }, z + '\n', '...quindi anche a[0] è cambiato.');
      const C = H.nuovo('int[]', campiArray([0, 0, 0])); S(4, { a: A, b: A, c: C }, '', 'new crea un array nuovo, pieno di zeri.');
      [z, v[1], v[2]].forEach((x, i) => H.campo(C, String(i), x)); S(5, { a: A, b: A, c: C }, '', 'Si copiano gli elementi uno per uno.');
      H.campo(C, '1', 0); S(6, { a: A, b: A, c: C }, '', 'Si cambia solo la copia.');
      S(7, { a: A, b: A, c: C }, v[1] + '\n', 'L\'originale non cambia.');
    }
  };
}

/* ---------- esercizi ---------- */
const PAROLE_J = ['informatica', 'programma', 'variabile', 'computer', 'tastiera', 'algoritmo', 'compilatore'];
function stringGen() {
  const s = pick(PAROLE_J), n = s.length, i = rnd(0, n - 3), j = rnd(i + 1, Math.min(n, i + 5)), c = s[rnd(0, n - 1)];
  const [expr, val, perche] = pick([
    [`s.length()`, String(n), 'length() conta i caratteri.'],
    [`s.charAt(${i})`, s[i], `Gli indici partono da 0: il carattere in posizione ${i} è '${s[i]}'.`],
    [`s.substring(${i}, ${j})`, s.slice(i, j), `Da ${i} compreso a ${j} escluso.`],
    [`s.indexOf('${c}')`, String(s.indexOf(c)), `Posizione della prima '${c}', contando da 0.`],
    [`s.toUpperCase()`, s.toUpperCase(), 'Restituisce una stringa nuova in maiuscolo; s resta com\'è.'],
    [`s.charAt(s.length() - 1)`, s[n - 1], 'L\'ultimo carattere è in posizione length() - 1.'],
    [`s.substring(${i})`, s.slice(i), `Da ${i} fino alla fine.`]
  ]);
  return { q: `Con <code>String s = "${s}";</code> quanto vale <code>${J(expr)}</code>?`, fields: [{ label: 'Risultato', kind: 'str', exp: val }], sl: 'Spiegazione', sol: `<p>${J(val)}. ${J(perche)}</p>` };
}
function arrayGen() {
  const v = Array.from({ length: rnd(4, 6) }, () => rnd(0, 20)), i = rnd(0, v.length - 1);
  const [expr, val, perche] = pick([
    ['v.length', v.length, 'length è un attributo, senza parentesi.'],
    [`v[${i}]`, v[i], 'Il primo elemento è v[0].'],
    ['v[v.length - 1]', v[v.length - 1], 'L\'ultimo elemento è in posizione length - 1.'],
    [`v[0] + v[${i}]`, v[0] + v[i], 'Si sommano i due elementi.'],
    ['v[1] * 2', v[1] * 2, 'v[1] è il secondo elemento.']
  ]);
  return { q: `Con <code>int[] v = {${v.join(', ')}};</code> quanto vale <code>${expr}</code>?`, fields: [{ label: 'Valore', kind: 'num', exp: val, tol: 0 }], sl: 'Spiegazione', sol: `<p>${val}. ${J(perche)}</p>` };
}
function huntArray() {
  return pick([
    { t: 'Deve stampare tutti gli elementi. Quale riga è sbagliata?', lines: ['int[] v = {4, 8, 15};', 'for (int i = 0; i <= v.length; i++) {', '    System.out.println(v[i]);', '}'], bad: 1, why: 'Con <= si arriva a v[3], che non esiste: ArrayIndexOutOfBoundsException. Serve i < v.length.' },
    { t: 'Quale riga non compila?', lines: ['int[] v = new int[5];', 'int n = v.length();', 'v[0] = 1;'], bad: 1, why: 'Per gli array length è un attributo, senza parentesi: v.length. Per le String invece è length().' },
    { t: 'Quale riga è sbagliata?', lines: ['String[] nomi = new String[3];', 'nomi[1] = "Ada";', 'nomi[3] = "Bruno";'], bad: 2, why: 'Un array di 3 elementi ha indici 0, 1, 2: nomi[3] non esiste.' },
    { t: 'Deve sommare gli elementi. Quale riga è sbagliata?', lines: ['int[] v = {3, 5, 7};', 'int s = 0;', 'for (int x : v) {', '    s += v[x];', '}'], bad: 3, why: 'Nel for-each x è già il valore di un elemento, non un indice: s += x;' },
    { t: 'Quale riga non compila?', lines: ['int[] v = new int[3];', 'v = {1, 2, 3};', 'System.out.println(v[0]);'], bad: 1, why: 'La forma con le graffe si usa solo nella dichiarazione: int[] v = {1, 2, 3}; altrimenti v = new int[]{1, 2, 3};' }
  ]);
}

/* che cosa scrive una chiamata a un metodo */
function metodoGen() {
  const a = rnd(2, 9), b = rnd(2, 9);
  const [code, chiamata, out, perche] = pick([
    [['static int somma(int x, int y) {', '    return x + y;', '}'], `System.out.println(somma(${a}, ${b}) * 2);`, String((a + b) * 2), `somma restituisce ${a + b}, poi si moltiplica per 2.`],
    [['static int max(int x, int y) {', '    if (x > y) return x;', '    return y;', '}'], `System.out.println(max(${a}, ${b}));`, String(Math.max(a, b)), 'Il primo return eseguito fa uscire dal metodo.'],
    [['static boolean pari(int n) {', '    return n % 2 == 0;', '}'], `System.out.println(pari(${a}));`, String(a % 2 === 0), 'Il metodo restituisce un boolean.'],
    [['static void saluta(String nome) {', '    System.out.println("Ciao " + nome);', '}'], `saluta("Ada"); saluta("Bruno");`, 'Ciao Ada / Ciao Bruno', 'Un metodo void non restituisce niente: qui stampa due righe (separate da /).'],
    [['static int area(int l) { return l * l; }', 'static int area(int b, int h) { return b * h; }'], `System.out.println(area(${a}) + area(${a}, ${b}));`, String(a * a + a * b), 'Overloading: con un argomento si usa il primo metodo, con due il secondo.']
  ]);
  return { q: `Che cosa scrive? (se le righe sono più di una, separatele con /)${PJ([...code, '', chiamata])}`, fields: [{ label: 'Output', kind: 'str', exp: out }], sl: 'Spiegazione', sol: `<p>${J(out)}. ${J(perche)}</p>` };
}
/* contare le vocali con charAt, passo passo */
function ppVocali() {
  const s = pick(['java', 'ciao', 'scuola', 'codice', 'metodo']);
  return {
    t: `Contare le vocali di "${s}" con un ciclo e <code>charAt</code>.`, lang: 'java',
    code: [`String s = "${s}";`, 'int vocali = 0;', 'for (int i = 0; i < s.length(); i++) {', '    char c = s.charAt(i);', '    if ("aeiou".indexOf(c) >= 0) {', '        vocali++;', '    }', '}', 'System.out.println(vocali);'],
    run(S) {
      let v = 0; S(0, { s }); S(1, { s, vocali: v });
      for (let i = 0; i < s.length; i++) {
        S(2, { s, vocali: v, i }, '', `${i} &lt; ${s.length} è vero.`);
        const c = s[i]; S(3, { s, vocali: v, i, c }, '', `Il carattere in posizione ${i} è '${c}'.`);
        const voc = 'aeiou'.includes(c); S(4, { s, vocali: v, i, c }, '', voc ? `'${c}' è una vocale.` : `'${c}' non è una vocale: indexOf restituisce -1.`);
        if (voc) { v++; S(5, { s, vocali: v, i, c }); }
      }
      S(2, { s, vocali: v, i: s.length }, '', `${s.length} &lt; ${s.length} è falso: si esce.`);
      S(8, { s, vocali: v }, v + '\n');
    }
  };
}
function huntMetodi() {
  return pick([
    { t: 'Il metodo deve restituire il doppio. Quale riga è sbagliata?', lines: ['static int doppio(int x) {', '    int d = x * 2;', '    System.out.println(d);', '}'], bad: 2, why: 'Un metodo int deve restituire un valore: return d; (stamparlo non basta).' },
    { t: 'Quale riga non compila?', lines: ['static void stampa(int n) {', '    System.out.println(n);', '    return n;', '}'], bad: 2, why: 'Un metodo void non restituisce niente: return n; non è ammesso.' },
    { t: 'Quale riga non compila?', lines: ['static int quadrato(int n) {', '    return n * n;', '}', 'int q = quadrato("3");'], bad: 3, why: 'Il parametro è int: "3" è una String.' },
    { t: 'Deve sommare a e b. Quale riga è sbagliata?', lines: ['static int somma(int a, int b) {', '    int s = a + b;', '}', 'System.out.println(somma(2, 3));'], bad: 2, why: 'Manca return s; prima della graffa: il metodo non restituisce niente.' },
    { t: 'La ricorsione non finisce mai. Quale riga è sbagliata?', lines: ['static int fatt(int n) {', '    return n * fatt(n - 1);', '}'], bad: 1, why: 'Manca il caso base: if (n <= 1) return 1; prima della chiamata ricorsiva.' }
  ]);
}
function huntStringhe() {
  return pick([
    { t: 'Deve dire se la parola è "si". Quale riga è sbagliata?', lines: ['String r = in.nextLine();', 'if (r == "si") {', '    System.out.println("OK");', '}'], bad: 1, why: 'Le stringhe si confrontano con r.equals("si").' },
    { t: 'Deve mettere in maiuscolo il nome. Quale riga è sbagliata?', lines: ['String nome = "ada";', 'nome.toUpperCase();', 'System.out.println(nome);'], bad: 1, why: 'Le String non si modificano: toUpperCase restituisce una stringa nuova, da assegnare: nome = nome.toUpperCase();' },
    { t: 'Deve stampare l\'ultima lettera. Quale riga è sbagliata?', lines: ['String s = "java";', 'char u = s.charAt(s.length());', 'System.out.println(u);'], bad: 1, why: 'L\'ultimo carattere è in posizione length() - 1: s.charAt(4) non esiste.' },
    { t: 'Quale riga non compila?', lines: ['String s = "ciao";', 'int n = s.length;', 'System.out.println(n);'], bad: 1, why: 'Per le String length() è un metodo, con le parentesi.' },
    { t: 'Deve prendere "for" da "informatica". Quale riga è sbagliata?', lines: ['String s = "informatica";', 'String p = s.substring(2, 4);', 'System.out.println(p);'], bad: 1, why: 'Il secondo indice è escluso: per "for" serve substring(2, 5).' }
  ]);
}
