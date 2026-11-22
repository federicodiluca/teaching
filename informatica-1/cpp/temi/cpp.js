/* Generatori di esercizi per le attività su C++ (primi passi, selezione, iterazione).
   Solo definizioni: va caricato dopo assets/giochi.js, che fornisce rnd, pick, shuffle, fmt, P...
   Ogni generatore restituisce {q, fields, sol, sl} come richiesto da mount() in giochi.js;
   le funzioni huntXxx() restituiscono {t, lines, bad, why} come richiesto da hunt(). */

const COD = s => `<code>${s}</code>`;

/* Divisione tra interi, divisione reale, resto e cast */
function divInt() {
  const b = pick([2, 4, 5]), a = rnd(3, 30);
  const e = pick([
    [`int a = ${a}, b = ${b}; int r = a / b;`, Math.trunc(a / b), 'Entrambi gli operandi sono interi: la divisione è intera e il risultato è troncato.'],
    [`int a = ${a}, b = ${b}; int r = a % b;`, a % b, 'L\'operatore % dà il resto della divisione intera.'],
    [`int a = ${a}, b = ${b}; double r = (double)a / b;`, a / b, 'Il cast a double rende reale la divisione: il risultato non viene troncato.'],
    [`int a = ${a}, b = ${b}; double r = a / b;`, Math.trunc(a / b), 'Conta il tipo dei numeri che si dividono, non quello della variabile: a / b è intera e il risultato è troncato prima dell\'assegnamento.'],
    [`double a = ${a}, b = ${b}; double r = a / b;`, a / b, 'Con operandi double la divisione è reale.']
  ]);
  return {
    q: `Che valore ha <b>r</b> alla fine? ${COD(e[0])} (usate il punto per i decimali)`,
    fields: [{ label: 'r', kind: 'num', exp: e[1], tol: 0 }],
    sl: 'Spiegazione', sol: `<p>r = ${fmt(+e[1].toFixed(4))}. ${e[2]}</p>`
  };
}

/* Incremento e assegnamento composto */
function compostoGen() {
  let x = rnd(5, 20);
  const passi = [], ops = [['x++', v => v + 1], ['x--', v => v - 1], ['x += 5', v => v + 5], ['x -= 3', v => v - 3], ['x *= 2', v => v * 2], ['x /= 2', v => Math.trunc(v / 2)], ['x %= 4', v => v % 4]];
  const x0 = x, sel = shuffle(ops).slice(0, 3);
  sel.forEach(o => { x = o[1](x); passi.push(`${o[0]}; // x = ${x}`); });
  return {
    q: `Con <code>int x = ${x0};</code> si eseguono in ordine: ${COD(sel.map(o => o[0] + ';').join(' '))} Quanto vale x alla fine?`,
    fields: [{ label: 'x', kind: 'num', exp: x, tol: 0 }],
    sl: 'Passo per passo', sol: P(`x = ${x0}\n${passi.join('\n')}`)
  };
}

/* Che cosa stampa un ciclo while con contatore decrescente */
function whileOut() {
  const n = rnd(4, 9), p = pick([1, 2, 3]), out = [];
  for (let i = n; i > 0; i -= p) out.push(i);
  return {
    q: `Che cosa stampa? <pre>int n = ${n};\nwhile (n &gt; 0) {\n    cout &lt;&lt; n &lt;&lt; " ";\n    n -= ${p};\n}</pre>(scrivete i numeri separati da spazi)`,
    fields: [{ label: 'Output', kind: 'str', exp: out.join(' ') }],
    sl: 'Trace table', sol: P(`n parte da ${n}; a ogni giro si stampa n e poi si sottrae ${p}.\nstampa: ${out.join(' ')}\nsi esce quando n vale ${n - p * out.length} (non è più &gt; 0)`)
  };
}

/* Che cosa stampa un ciclo for con passo */
function forOut() {
  const a = rnd(0, 4), p = pick([1, 2, 3, 5]), k = rnd(3, 6), b = a + p * (k - 1), out = [];
  for (let i = a; i <= b; i += p) out.push(i);
  return {
    q: `Che cosa stampa? <pre>for (int i = ${a}; i &lt;= ${b}; i += ${p})\n    cout &lt;&lt; i &lt;&lt; " ";</pre>(scrivete i numeri separati da spazi)`,
    fields: [{ label: 'Output', kind: 'str', exp: out.join(' ') }, { label: 'Numero di iterazioni', kind: 'num', exp: out.length, tol: 0 }],
    sl: 'Passo per passo', sol: P(`i parte da ${a} e aumenta di ${p} finché i &lt;= ${b}\nvalori: ${out.join(', ')}\niterazioni: ${out.length}`)
  };
}

/* Quante iterazioni con &lt; e &lt;= (errore di uno) */
function ciclo10() {
  const a = pick([0, 1]), b = rnd(5, 12), cond = pick(['&lt;', '&lt;=']), n = cond === '&lt;' ? b - a : b - a + 1;
  return {
    q: `Quante volte viene eseguito il corpo del ciclo? ${COD(`for (int i = ${a}; i ${cond} ${b}; i++)`)}`,
    fields: [{ label: 'Iterazioni', kind: 'num', exp: n, tol: 0 }],
    sl: 'Spiegazione', sol: P(`i va da ${a} fino a ${cond === '&lt;' ? b - 1 : b} compresi\niterazioni = ${n}\nCon &lt; l'ultimo valore ${b} è escluso, con &lt;= è incluso.`)
  };
}

/* Cicli annidati: quante volte il blocco interno */
function annidati() {
  const r = rnd(2, 6), c = rnd(2, 8);
  return {
    q: `Quanti asterischi stampa? <pre>for (int r = 1; r &lt;= ${r}; r++) {\n    for (int c = 1; c &lt;= ${c}; c++)\n        cout &lt;&lt; "*";\n    cout &lt;&lt; endl;\n}</pre>`,
    fields: [{ label: 'Asterischi', kind: 'num', exp: r * c, tol: 0 }, { label: 'Righe', kind: 'num', exp: r, tol: 0 }],
    sl: 'Spiegazione', sol: P(`il ciclo interno stampa ${c} asterischi per ogni riga\nrighe = ${r}\nasterischi = ${r} x ${c} = ${r * c}`)
  };
}

/* Fattoriale con un ciclo for */
function fattoriale() {
  const n = rnd(3, 7); let f = 1; const t = [];
  for (let i = 1; i <= n; i++) { f *= i; t.push(`i = ${i}: fatt = ${f}`); }
  return {
    q: `Calcolo di ${n}!: <pre>int fatt = 1;\nfor (int i = 1; i &lt;= ${n}; i++)\n    fatt *= i;</pre>Quanto vale <b>fatt</b> alla fine?`,
    fields: [{ label: 'fatt', kind: 'num', exp: f, tol: 0 }],
    sl: 'Trace table', sol: P(`fatt parte da 1 (un prodotto parte da 1, non da 0)\n${t.join('\n')}`)
  };
}

/* Condizioni composte con && || ! in C++ */
function condGen() {
  const x = rnd(-5, 15), y = rnd(-5, 15);
  const e = pick([
    ['x >= 1 &amp;&amp; x &lt;= 10', x >= 1 && x <= 10], ['x &lt; 0 || x &gt; 10', x < 0 || x > 10], ['!(x &gt; y)', !(x > y)],
    ['x == y || x &gt; 5', x === y || x > 5], ['x != y &amp;&amp; y &gt;= 0', x !== y && y >= 0], ['x % 2 == 0', x % 2 === 0]
  ]);
  return {
    q: `Con <b>x = ${x}</b> e <b>y = ${y}</b>, la condizione ${COD(e[0])} vale true o false?`,
    fields: [{ label: 'Valore', kind: 'choice', opts: ['', 'true', 'false'], exp: e[1] ? 'true' : 'false' }],
    sl: 'Spiegazione', sol: `<p>${e[1] ? 'true' : 'false'}. Si valutano i singoli confronti e poi si combinano: && vuole entrambe vere, || ne vuole almeno una, ! inverte.</p>`
  };
}

/* Catena else if: voto e giudizio */
function elseIfOut() {
  const v = pick([0, 3, 5, 6, 7, 8, 10, 11]), g = v < 1 || v > 10 ? 'Voto non valido' : v < 6 ? 'Insufficiente' : v < 8 ? 'Sufficiente o discreto' : 'Buono o ottimo';
  return {
    q: `Che cosa stampa con <b>voto = ${v}</b>? <pre>if (voto &lt; 1 || voto &gt; 10)  cout &lt;&lt; "Voto non valido";\nelse if (voto &lt; 6)       cout &lt;&lt; "Insufficiente";\nelse if (voto &lt; 8)       cout &lt;&lt; "Sufficiente o discreto";\nelse                     cout &lt;&lt; "Buono o ottimo";</pre>`,
    fields: [{ label: 'Output', kind: 'choice', opts: ['', 'Voto non valido', 'Insufficiente', 'Sufficiente o discreto', 'Buono o ottimo'], exp: g }],
    sl: 'Spiegazione', sol: `<p>${g}. Si controllano le condizioni in ordine e si esegue solo il primo ramo vero.</p>`
  };
}

/* Switch con e senza break */
function switchOut() {
  const liv = rnd(1, 3), brk = rnd(0, 1), nomi = ['Facile', 'Medio', 'Difficile'];
  let out;
  if (!brk) { out = []; for (let c = liv; c <= 3; c++) out.push(nomi[c - 1]); } else out = [nomi[liv - 1]];
  const bs = brk ? ' break;' : '';
  return {
    q: `Che cosa stampa con <b>livello = ${liv}</b>? <pre>switch (livello) {\n    case 1: cout &lt;&lt; "Facile ";${bs}\n    case 2: cout &lt;&lt; "Medio ";${bs}\n    case 3: cout &lt;&lt; "Difficile ";${bs}\n}</pre>(scrivete le parole stampate separate da spazi)`,
    fields: [{ label: 'Output', kind: 'str', exp: out.join(' ') }],
    sl: 'Spiegazione', sol: `<p>Stampa: ${out.join(' ')}. ${brk ? 'Il break esce dallo switch dopo il case scelto.' : 'Senza break l\'esecuzione prosegue nei case successivi.'}</p>`
  };
}

/* Caccia all'errore: primi passi (sintassi e tipi) */
function huntBase() {
  return pick([
    { t: 'Quale riga impedisce la compilazione?', lines: ['#include <iostream>', 'using namespace std;', 'int main() {', '    cout << "Ciao" << endl', '    return 0;', '}'], bad: 3, why: 'Manca il punto e virgola a fine istruzione; il compilatore lo segnala spesso alla riga dopo.' },
    { t: 'Quale riga impedisce la compilazione?', lines: ['int main() {', '    int eta;', '    Cin >> eta;', '    cout << eta << endl;', '    return 0;', '}'], bad: 2, why: 'Il C++ è case sensitive: cin si scrive tutto minuscolo.' },
    { t: 'Quale riga è sbagliata?', lines: ['int main() {', '    int a;', '    cout << "Numero: ";', '    cin << a;', '    return 0;', '}'], bad: 3, why: 'cin si usa con >>: cin >> a; (cout invece usa <<).' },
    { t: 'Quale riga è sbagliata?', lines: ['int main() {', '    double prezzo = 3,5;', '    cout << prezzo << endl;', '    return 0;', '}'], bad: 1, why: 'Nei numeri reali si usa il punto, non la virgola: 3.5.' },
    { t: 'Quale riga è sbagliata?', lines: ['int main() {', '    int a = 3, b = 4;', '    double media = (a + b) / 2;', '    cout << media << endl;', '    return 0;', '}'], bad: 2, why: 'Dividendo due interi si ottiene una divisione intera e il risultato viene troncato: serve (a + b) / 2.0.' },
    { t: 'Quale riga è sbagliata?', lines: ['int main() {', '    int totale;', '    totale += 5;', '    cout << totale << endl;', '    return 0;', '}'], bad: 1, why: 'La variabile non è inizializzata: contiene un valore casuale. Va inizializzata, per esempio int totale = 0;' },
    { t: 'Quale riga è sbagliata?', lines: ['int main() {', '    const double IVA = 0.22;', '    double prezzo = 100;', '    IVA = 0.10;', '    return 0;', '}'], bad: 3, why: 'Una costante dichiarata con const non si può modificare: il compilatore dà errore.' },
    { t: 'Quale riga è sbagliata?', lines: ['int main() {', '    int x = 5;', '    cout << y << endl;', '    return 0;', '}'], bad: 2, why: 'La variabile y non è stata dichiarata: errore "y was not declared in this scope".' }
  ]);
}

/* Caccia all'errore: selezione */
function huntSel() {
  return pick([
    { t: 'Il programma deve scrivere "ok" solo se x vale 5. Quale riga è sbagliata?', lines: ['int x;', 'cin >> x;', 'if (x = 5)', '    cout << "ok";'], bad: 2, why: '= assegna 5 a x e la condizione è sempre vera: per confrontare serve ==.' },
    { t: 'Deve stampare "positivo" solo se x è maggiore di 0. Quale riga è sbagliata?', lines: ['int x;', 'cin >> x;', 'if (x > 0);', '    cout << "positivo";'], bad: 2, why: 'Il ; dopo la condizione chiude l\'if: l\'istruzione successiva viene eseguita sempre.' },
    { t: 'Deve controllare che x sia tra 1 e 10. Quale riga è sbagliata?', lines: ['int x;', 'cin >> x;', 'if (1 <= x <= 10)', '    cout << "valido";'], bad: 2, why: 'La forma matematica non funziona: è sempre vera. Serve x >= 1 && x <= 10.' },
    { t: 'Deve stampare il giudizio corretto per ogni voto. Quale riga è sbagliata?', lines: ['if (voto < 10)', '    cout << "Buono";', 'else if (voto < 6)', '    cout << "Insufficiente";'], bad: 0, why: 'Le condizioni sono nell\'ordine sbagliato: ogni voto sotto 10 entra nel primo ramo e il secondo non viene mai raggiunto. Si va dal caso più restrittivo al più generale.' },
    { t: 'Deve eseguire due istruzioni solo se x è negativo. Quale riga è sbagliata?', lines: ['if (x < 0)', '    cout << "negativo" << endl;', '    x = -x;', 'cout << x << endl;'], bad: 2, why: 'Senza graffe solo la prima istruzione dipende dall\'if: x = -x viene eseguita sempre. Meglio mettere sempre le graffe.' },
    { t: 'Deve stampare il nome del giorno. Quale riga è sbagliata?', lines: ['switch (g) {', '    case 1: cout << "Lunedì";', '    case 2: cout << "Martedì"; break;', '    default: cout << "Altro";', '}'], bad: 1, why: 'Manca il break: con g = 1 stampa anche "Martedì" perché l\'esecuzione prosegue nei case successivi.' },
    { t: 'Deve dividere solo se b non è zero. Quale riga è sbagliata?', lines: ['if (b != 0)', '    cout << a / b;', 'else', '    cout << "Divisione per zero";', 'if (b == 0 && a / b > 1)'], bad: 4, why: 'La condizione calcola a / b proprio quando b è zero: va evitata la divisione per zero.' }
  ]);
}

/* Caccia all'errore: cicli */
function huntIter() {
  return pick([
    { t: 'Il conto alla rovescia non finisce mai. Quale riga è sbagliata?', lines: ['int n = 5;', 'while (n > 0) {', '    cout << n << " ";', '}'], bad: 3, why: 'Dentro il ciclo manca n--: la variabile della condizione non cambia mai e il ciclo è infinito.' },
    { t: 'Il ciclo non fa niente di quello che deve. Quale riga è sbagliata?', lines: ['int i = 1;', 'while (i <= 5);', '{', '    cout << i++;', '}'], bad: 1, why: 'Il ; dopo while diventa il corpo del ciclo: il programma resta bloccato su una riga vuota.' },
    { t: 'Deve stampare 10 volte "Ciao". Quale riga è sbagliata?', lines: ['for (int i = 1; i < 10; i++)', '    cout << "Ciao" << endl;'], bad: 0, why: 'Con i < 10 il ciclo si ferma a 9: stampa solo 9 volte. Serve i <= 10.' },
    { t: 'Deve sommare i numeri letti. Quale riga è sbagliata?', lines: ['for (int i = 1; i <= n; i++) {', '    double somma = 0;', '    cin >> numero;', '    somma += numero;', '}'], bad: 1, why: 'L\'accumulatore va inizializzato prima del ciclo: dentro riparte da zero a ogni iterazione.' },
    { t: 'Deve calcolare la media di tre voti interi. Quale riga è sbagliata?', lines: ['int somma = 20;', 'int conta = 3;', 'double media = somma / conta;', 'cout << media;'], bad: 2, why: 'La divisione tra interi viene troncata: l\'accumulatore o il cast devono essere double.' },
    { t: 'Deve richiedere un dato finché non è positivo. Quale riga è sbagliata?', lines: ['do {', '    cin >> lato;', '} while (lato > 0)', 'cout << lato * lato;'], bad: 2, why: 'Manca il ; dopo while(condizione) e la condizione è al contrario: si ripete finché lato <= 0.' },
    { t: 'Deve calcolare il prodotto 1 x 2 x ... x n. Quale riga è sbagliata?', lines: ['int fatt = 0;', 'for (int i = 1; i <= n; i++)', '    fatt *= i;', 'cout << fatt;'], bad: 0, why: 'Un prodotto parte da 1: con 0 il risultato resterebbe sempre 0.' }
  ]);
}

/* ---------- programmi per l'esecuzione passo passo (traccia in assets/codice.js) ----------
   Ogni generatore restituisce {t, lang, code, run}: run(S) esegue il programma e chiama S(riga, variabili, scritto, nota). */
function ppWhile() {
  const n0 = rnd(4, 8), p = pick([1, 2, 3]);
  return {
    t: 'Conto alla rovescia con <code>while</code>.', lang: 'cpp',
    code: [`int n = ${n0};`, 'while (n > 0) {', '    cout << n << " ";', `    n = n - ${p};`, '}', 'cout << "Via!" << endl;'],
    run(S) {
      let n = n0; S(0, { n }, '', `Si crea la variabile n con valore ${n0}.`);
      while (n > 0) {
        S(1, { n }, '', `${n} &gt; 0 è vero: si entra nel ciclo.`);
        S(2, { n }, n + ' ', 'Si scrive il valore di n.');
        n -= p; S(3, { n }, '', `n diminuisce di ${p}.`);
      }
      S(1, { n }, '', `${n} &gt; 0 è falso: si esce dal ciclo.`);
      S(5, { n }, 'Via!\n', 'La riga dopo il ciclo si esegue una volta sola.');
    }
  };
}
function ppForSomma() {
  const N = rnd(3, 6);
  return {
    t: `Somma dei numeri da 1 a ${N} con <code>for</code> (accumulatore).`, lang: 'cpp',
    code: ['int somma = 0;', `for (int i = 1; i <= ${N}; i++) {`, '    somma = somma + i;', '}', 'cout << "Somma: " << somma << endl;'],
    run(S) {
      let s = 0; S(0, { somma: s }, '', 'L\'accumulatore parte da 0, prima del ciclo.');
      for (let i = 1; i <= N; i++) {
        S(1, { somma: s, i }, '', i === 1 ? `Inizializzazione: i = 1. Condizione 1 &lt;= ${N} vera.` : `i++: i vale ${i}. ${i} &lt;= ${N} è vero.`);
        s += i; S(2, { somma: s, i }, '', `somma = ${s - i} + ${i} = ${s}.`);
      }
      S(1, { somma: s, i: N + 1 }, '', `i++: i vale ${N + 1}. ${N + 1} &lt;= ${N} è falso: si esce.`);
      S(4, { somma: s }, `Somma: ${s}\n`, 'Fuori dal ciclo i non esiste più: era dichiarata nel for.');
    }
  };
}
function ppFattoriale() {
  const N = rnd(3, 6);
  return {
    t: `Il fattoriale di ${N}: un accumulatore che moltiplica parte da 1.`, lang: 'cpp',
    code: [`int n = ${N};`, 'int f = 1;', 'for (int i = 2; i <= n; i++) {', '    f = f * i;', '}', 'cout << n << "! = " << f << endl;'],
    run(S) {
      let f = 1; S(0, { n: N }); S(1, { n: N, f }, '', 'Il prodotto parte da 1, non da 0.');
      for (let i = 2; i <= N; i++) { S(2, { n: N, f, i }, '', `${i} &lt;= ${N} è vero.`); f *= i; S(3, { n: N, f, i }, '', `f = ${f / i} × ${i} = ${f}.`); }
      S(2, { n: N, f, i: N + 1 }, '', `${N + 1} &lt;= ${N} è falso: si esce.`);
      S(5, { n: N, f }, `${N}! = ${f}\n`);
    }
  };
}
function ppDoWhile() {
  const ok = rnd(1, 10), sbagli = shuffle([rnd(-5, 0), rnd(11, 20), 0, rnd(11, 15)]).slice(0, rnd(1, 2)), ins = [...sbagli, ok];
  return {
    t: `Validare l'input con <code>do ... while</code>. L'utente scrive, uno dopo l'altro: <b>${ins.join(', ')}</b>.`, lang: 'cpp',
    code: ['int voto;', 'do {', '    cout << "Voto (1-10): ";', '    cin >> voto;', '} while (voto < 1 || voto > 10);', 'cout << "Hai inserito " << voto << endl;'],
    run(S) {
      let v = null; S(0, { voto: v }, '', 'La variabile esiste ma non ha ancora un valore.');
      for (const x of ins) {
        S(1, { voto: v }, '', 'Con do ... while il blocco si esegue almeno una volta.');
        S(2, { voto: v }, 'Voto (1-10): ');
        v = x; S(3, { voto: v }, x + '\n', `L'utente scrive ${x}.`);
        const fuori = v < 1 || v > 10;
        S(4, { voto: v }, '', fuori ? `${v} è fuori dall'intervallo: la condizione è vera, si ripete.` : `${v} va bene: la condizione è falsa, si esce.`);
      }
      S(5, { voto: v }, `Hai inserito ${v}\n`);
    }
  };
}
function ppAnnidati() {
  const R = rnd(2, 3), C = rnd(2, 4);
  return {
    t: `Cicli annidati: un rettangolo di ${R} righe e ${C} colonne.`, lang: 'cpp',
    code: [`for (int r = 1; r <= ${R}; r++) {`, `    for (int c = 1; c <= ${C}; c++) {`, '        cout << "*";', '    }', '    cout << endl;', '}'],
    run(S) {
      for (let r = 1; r <= R; r++) {
        S(0, { r }, '', `${r} &lt;= ${R}: si esegue la riga ${r}.`);
        for (let c = 1; c <= C; c++) { S(1, { r, c }, '', c === 1 ? 'Il ciclo interno riparte da 1.' : ''); S(2, { r, c }, '*'); }
        S(1, { r, c: C + 1 }, '', `${C + 1} &lt;= ${C} è falso: finisce il ciclo interno.`);
        S(4, { r }, '\n', 'A capo: la riga è finita.');
      }
      S(0, { r: R + 1 }, '', `${R + 1} &lt;= ${R} è falso: finisce anche il ciclo esterno.`);
    }
  };
}
function ppElseIf() {
  const v = rnd(2, 10);
  return {
    t: `Selezione multipla con <code>else if</code>: il voto è ${v}.`, lang: 'cpp',
    code: [`int voto = ${v};`, 'if (voto >= 8) {', '    cout << "Buono";', '} else if (voto >= 6) {', '    cout << "Sufficiente";', '} else {', '    cout << "Insufficiente";', '}'],
    run(S) {
      S(0, { voto: v });
      if (v >= 8) { S(1, { voto: v }, '', `${v} &gt;= 8 è vero.`); S(2, { voto: v }, 'Buono', 'Gli altri rami si saltano.'); return; }
      S(1, { voto: v }, '', `${v} &gt;= 8 è falso: si passa all'else if.`);
      if (v >= 6) { S(3, { voto: v }, '', `${v} &gt;= 6 è vero.`); S(4, { voto: v }, 'Sufficiente', 'L\'else finale si salta.'); return; }
      S(3, { voto: v }, '', `${v} &gt;= 6 è falso: resta l'else.`); S(6, { voto: v }, 'Insufficiente');
    }
  };
}
