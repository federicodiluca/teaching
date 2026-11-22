/* Java: le basi. Generatori condivisi dalle pagine dell'unità (e riusabili altrove).
   Solo definizioni: va caricato dopo assets/giochi.js e assets/codice.js.
   - pp...: programmi per l'esecuzione passo passo (traccia), {t, lang, code, run}
   - ...Gen: esercizi con campi per mount() e mission(), {q, fields, sol, sl}
   - hunt...: caccia all'errore, {t, lines, bad, why} */

const J = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const PJ = righe => `<pre>${J(righe.join('\n'))}</pre>`;

/* ---------- passo passo ---------- */
function ppJavaCiao() {
  const nome = pick(['Ada', 'Bruno', 'Carla', 'Dario']), anni = rnd(14, 18);
  return {
    t: 'Il primo programma: <code>print</code> non va a capo, <code>println</code> sì; con <code>+</code> si concatenano testo e numeri.', lang: 'java',
    code: ['public class Ciao {', '    public static void main(String[] args) {', `        String nome = "${nome}";`, `        int anni = ${anni};`,
      '        System.out.print("Ciao, ");', '        System.out.println(nome + "!");', '        System.out.println("Hai " + anni + " anni");', '        System.out.println("Tra un anno: " + (anni + 1));', '    }', '}'],
    run(S) {
      S(1, {}, '', 'L\'esecuzione parte sempre dal metodo main.');
      S(2, { nome }, '', 'String è una classe: si scrive con la maiuscola.');
      S(3, { nome, anni });
      S(4, { nome, anni }, 'Ciao, ', 'print non va a capo: la prossima scritta continua sulla stessa riga.');
      S(5, { nome, anni }, nome + '!\n', 'println scrive e poi va a capo.');
      S(6, { nome, anni }, `Hai ${anni} anni\n`, 'Testo + numero: il numero diventa testo.');
      S(7, { nome, anni }, `Tra un anno: ${anni + 1}\n`, 'Le parentesi fanno calcolare prima la somma: senza, uscirebbe ' + anni + '1.');
    }
  };
}
function ppJavaScanner() {
  const nome = pick(['Ada', 'Bruno', 'Carla', 'Dario']), voto = rnd(3, 10);
  return {
    t: `Leggere dalla tastiera con <code>Scanner</code>. L'utente scrive <b>${nome}</b> e poi <b>${voto}</b>.`, lang: 'java',
    code: ['Scanner in = new Scanner(System.in);', 'System.out.print("Nome: ");', 'String nome = in.nextLine();', 'System.out.print("Voto: ");', 'int voto = in.nextInt();',
      'boolean promosso = voto >= 6;', 'System.out.println(nome + " promosso: " + promosso);'],
    run(S) {
      S(0, {}, '', 'Lo Scanner legge da System.in, cioè dalla tastiera (serve import java.util.Scanner).');
      S(1, {}, 'Nome: ');
      S(2, { nome }, nome + '\n', 'nextLine legge tutta la riga come String.');
      S(3, { nome }, 'Voto: ');
      S(4, { nome, voto }, voto + '\n', 'nextInt legge un numero intero.');
      S(5, { nome, voto, promosso: voto >= 6 }, '', `${voto} >= 6 è ${voto >= 6}: boolean vale true o false.`);
      S(6, { nome, voto, promosso: voto >= 6 }, `${nome} promosso: ${voto >= 6}\n`);
    }
  };
}
function ppJavaIf() {
  const t = rnd(-5, 35);
  return {
    t: `Selezione con <code>if</code>, <code>else if</code>, <code>else</code>: la temperatura è ${t} gradi.`, lang: 'java',
    code: [`int t = ${t};`, 'if (t < 10) {', '    System.out.println("Freddo");', '} else if (t < 25) {', '    System.out.println("Mite");', '} else {', '    System.out.println("Caldo");', '}', 'System.out.println("Fine");'],
    run(S) {
      S(0, { t });
      if (t < 10) { S(1, { t }, '', `${t} &lt; 10 è vero.`); S(2, { t }, 'Freddo\n', 'Gli altri rami si saltano.'); }
      else {
        S(1, { t }, '', `${t} &lt; 10 è falso.`);
        if (t < 25) { S(3, { t }, '', `${t} &lt; 25 è vero.`); S(4, { t }, 'Mite\n'); }
        else { S(3, { t }, '', `${t} &lt; 25 è falso: resta l'else.`); S(6, { t }, 'Caldo\n'); }
      }
      S(8, { t }, 'Fine\n', 'Dopo la selezione si continua in ogni caso.');
    }
  };
}
function ppJavaSwitch() {
  const g = rnd(1, 7), conBreak = Math.random() < .5;
  const nomi = ['', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'];
  const code = [`int g = ${g};`, 'switch (g) {'];
  code.push('    case 6:', '        System.out.println("Sabato");', ...(conBreak ? ['        break;'] : []),
    '    case 7:', '        System.out.println("Weekend!");', '        break;', '    default:', '        System.out.println("Si va a scuola");', '}');
  return {
    t: `<code>switch</code> ${conBreak ? 'con' : 'senza'} <code>break</code> dopo il caso 6: oggi è ${nomi[g]} (g = ${g}).`, lang: 'java', code,
    run(S) {
      const L = s => code.findIndex(r => r.trim() === s);
      S(0, { g }); S(1, { g }, '', 'Si cerca il case uguale a g.');
      if (g === 6) {
        S(L('case 6:'), { g }, '', 'Trovato il case 6.'); S(L('System.out.println("Sabato");'), { g }, 'Sabato\n');
        if (conBreak) { S(L('break;'), { g }, '', 'break: si esce dallo switch.'); return; }
        S(L('System.out.println("Weekend!");'), { g }, 'Weekend!\n', 'Senza break si prosegue nel case successivo (fall-through).');
        S(code.lastIndexOf('        break;'), { g }, '', 'Qui c\'è il break: si esce.'); return;
      }
      if (g === 7) { S(L('case 7:'), { g }, '', 'Trovato il case 7.'); S(L('System.out.println("Weekend!");'), { g }, 'Weekend!\n'); S(code.lastIndexOf('        break;'), { g }, '', 'break: si esce.'); return; }
      S(L('default:'), { g }, '', 'Nessun case uguale a ' + g + ': si va al default.'); S(L('System.out.println("Si va a scuola");'), { g }, 'Si va a scuola\n');
    }
  };
}
function ppJavaWhile() {
  const obiettivo = pick([50, 100, 200]), dep = pick([15, 20, 25, 30]);
  return {
    t: `Un salvadanaio: ogni settimana si mettono ${dep} euro finché non si arriva a ${obiettivo}. Ciclo <code>while</code>.`, lang: 'java',
    code: ['int soldi = 0;', 'int settimane = 0;', `while (soldi < ${obiettivo}) {`, `    soldi += ${dep};`, '    settimane++;', '}', 'System.out.println(settimane + " settimane, " + soldi + " euro");'],
    run(S) {
      let soldi = 0, settimane = 0; S(0, { soldi }); S(1, { soldi, settimane });
      while (soldi < obiettivo) { S(2, { soldi, settimane }, '', `${soldi} &lt; ${obiettivo} è vero: si entra.`); soldi += dep; S(3, { soldi, settimane }, '', `+= aggiunge ${dep}.`); settimane++; S(4, { soldi, settimane }, '', '++ aumenta di 1.'); }
      S(2, { soldi, settimane }, '', `${soldi} &lt; ${obiettivo} è falso: si esce.`);
      S(6, { soldi, settimane }, `${settimane} settimane, ${soldi} euro\n`);
    }
  };
}
function ppJavaFor() {
  const n = rnd(3, 5), base = rnd(2, 9);
  return {
    t: `La tabellina del ${base} fino a ${n} con un ciclo <code>for</code>.`, lang: 'java',
    code: [`for (int i = 1; i <= ${n}; i++) {`, `    int r = ${base} * i;`, `    System.out.println("${base} x " + i + " = " + r);`, '}', 'System.out.println("Fatto");'],
    run(S) {
      for (let i = 1; i <= n; i++) {
        S(0, { i }, '', i === 1 ? `Inizializzazione: i = 1; 1 &lt;= ${n} è vero.` : `i++: i = ${i}; ${i} &lt;= ${n} è vero.`);
        S(1, { i, r: base * i }, '', 'r è dichiarata dentro il ciclo: esiste solo durante il giro.');
        S(2, { i, r: base * i }, `${base} x ${i} = ${base * i}\n`);
      }
      S(0, { i: n + 1 }, '', `i++: i = ${n + 1}; ${n + 1} &lt;= ${n} è falso: si esce.`);
      S(4, {}, 'Fatto\n', 'Fuori dal for non esistono più né i né r.');
    }
  };
}
function ppJavaDoWhile() {
  const ok = rnd(1, 5), ins = [...shuffle([0, rnd(6, 9), -1]).slice(0, rnd(1, 2)), ok];
  return {
    t: `Un menu con <code>do ... while</code>: si ripete finché la scelta non è tra 1 e 5. L'utente scrive <b>${ins.join(', ')}</b>.`, lang: 'java',
    code: ['int scelta;', 'do {', '    System.out.print("Scelta (1-5): ");', '    scelta = in.nextInt();', '} while (scelta < 1 || scelta > 5);', 'System.out.println("Hai scelto " + scelta);'],
    run(S) {
      let s = null; S(0, { scelta: s }, '', 'Dichiarata ma non inizializzata: il compilatore non permette di leggerla prima di un valore.');
      for (const x of ins) {
        S(1, { scelta: s }, '', 'Il blocco del do si esegue almeno una volta.'); S(2, { scelta: s }, 'Scelta (1-5): ');
        s = x; S(3, { scelta: s }, x + '\n');
        S(4, { scelta: s }, '', s < 1 || s > 5 ? `${s} non va bene: la condizione è vera, si ripete.` : `${s} va bene: la condizione è falsa, si esce.`);
      }
      S(5, { scelta: s }, `Hai scelto ${s}\n`);
    }
  };
}

/* ---------- esercizi ---------- */
/* "1" + 2 + 3 o 1 + 2 + "3": il + si valuta da sinistra a destra */
function concatGen() {
  const a = rnd(1, 9), b = rnd(1, 9), c = rnd(1, 9);
  const [expr, out, perche] = pick([
    [`"${a}" + ${b} + ${c}`, `${a}${b}${c}`, `"${a}" + ${b} è già testo ("${a}${b}"), poi si aggiunge ${c}.`],
    [`${a} + ${b} + "${c}"`, `${a + b}${c}`, `Da sinistra: ${a} + ${b} = ${a + b} (numeri), poi + "${c}" concatena.`],
    [`"${a}" + (${b} + ${c})`, `${a}${b + c}`, `Le parentesi fanno sommare prima ${b} + ${c} = ${b + c}.`],
    [`${a} + ${b} + "" + ${c}`, `${a + b}${c}`, `${a} + ${b} = ${a + b}, poi + "" lo trasforma in testo e si attacca ${c}.`],
    [`"Somma: " + ${a} + ${b}`, `Somma: ${a}${b}`, 'Dopo il testo ogni + concatena: servirebbero le parentesi.']
  ]);
  return { q: `Che cosa scrive <code>System.out.println(${J(expr)});</code>?`, fields: [{ label: 'Output', kind: 'str', exp: out }], sl: 'Spiegazione', sol: `<p>${J(perche)}</p>` };
}
/* divisione tra interi, resto e cast */
function divJavaGen() {
  const a = rnd(7, 40), b = rnd(2, 9);
  const [expr, val, perche] = pick([
    [`${a} / ${b}`, Math.trunc(a / b), 'Tra due int la divisione è intera: la parte decimale si scarta.'],
    [`${a} % ${b}`, a % b, `% dà il resto: ${a} = ${b} × ${Math.trunc(a / b)} + ${a % b}.`],
    [`${a} / ${b}.0`, +(a / b).toFixed(3), `${b}.0 è un double: la divisione è decimale.`],
    [`(double) ${a} / ${b}`, +(a / b).toFixed(3), 'Il cast si applica ad a prima della divisione: diventa decimale.'],
    [`(int) ${a}.9`, a, 'Il cast a int tronca, non arrotonda.'],
    [`(double) (${a} / ${b})`, Math.trunc(a / b), 'Prima la divisione intera, poi la conversione: troppo tardi, vale ' + Math.trunc(a / b) + '.0.']
  ]);
  return { q: `Quanto vale <code>${J(expr)}</code> in Java? (se è decimale bastano tre cifre dopo la virgola)`, fields: [{ label: 'Valore', kind: 'num', exp: val, tol: 0.001 }], sl: 'Spiegazione', sol: `<p>${fmt(val)}. ${J(perche)}</p>` };
}
/* print o println: che cosa compare sullo schermo */
function printGen() {
  const a = pick(['A', 'B', 'C']), b = pick(['1', '2', '3']), c = pick(['x', 'y', 'z']);
  const forme = pick([
    [[`System.out.print("${a}");`, `System.out.print("${b}");`, `System.out.println("${c}");`], `${a}${b}${c}`],
    [[`System.out.println("${a}");`, `System.out.print("${b}");`, `System.out.print("${c}");`], `${a} / ${b}${c}`],
    [[`System.out.print("${a}");`, `System.out.println();`, `System.out.print("${b}" + "${c}");`], `${a} / ${b}${c}`],
    [[`System.out.println("${a}" + "${b}");`, `System.out.println("${c}");`], `${a}${b} / ${c}`]
  ]);
  return { q: `Che cosa compare sullo schermo? Scrivete le righe separate da <b>/</b>.${PJ(forme[0])}`, fields: [{ label: 'Righe', kind: 'str', exp: forme[1] }], sl: 'Spiegazione',
    sol: `<p>${J(forme[1])}: print scrive senza andare a capo, println va a capo dopo aver scritto (anche senza argomenti).</p>` };
}

/* ---------- caccia all'errore ---------- */
function huntJavaBase() {
  return pick([
    { t: 'Il file si chiama Ciao.java. Quale riga impedisce la compilazione?', lines: ['public class ciao {', '    public static void main(String[] args) {', '        System.out.println("Ciao!");', '    }', '}'], bad: 0, why: 'La classe pubblica deve chiamarsi come il file, maiuscole comprese: Ciao.' },
    { t: 'Quale riga è sbagliata?', lines: ['public class Saluto {', '    public static void main(String[] args) {', '        system.out.println("Ciao!");', '    }', '}'], bad: 2, why: 'Java distingue maiuscole e minuscole: System con la S maiuscola.' },
    { t: 'Quale riga è sbagliata?', lines: ['public class Prova {', '    public static void main(String[] args) {', '        int x = 5', '        System.out.println(x);', '    }', '}'], bad: 2, why: 'Manca il punto e virgola alla fine dell\'istruzione.' },
    { t: 'Il programma compila ma non parte. Quale riga è sbagliata?', lines: ['public class Avvio {', '    public void main(String[] args) {', '        System.out.println("Via");', '    }', '}'], bad: 1, why: 'Il main deve essere static: public static void main(String[] args).' },
    { t: 'Quale riga è sbagliata?', lines: ['public class Dati {', '    public static void main(String[] args) {', '        string nome = "Ada";', '        System.out.println(nome);', '    }', '}'], bad: 2, why: 'In Java è String, con la maiuscola: è una classe, non un tipo primitivo.' },
    { t: 'Quale riga non compila?', lines: ['int a = 10;', 'double b = 2.5;', 'int c = a * b;', 'System.out.println(c);'], bad: 2, why: 'a * b è un double: non entra in un int senza cast, per esempio (int) (a * b).' },
    { t: 'Quale riga è sbagliata?', lines: ['Scanner in = new Scanner(System.in);', 'int n = in.nextInt();', 'boolean pari = n % 2 == 0;', 'bool dispari = !pari;'], bad: 3, why: 'In Java il tipo si chiama boolean, non bool come in C++.' }
  ]);
}
function huntJavaCicli() {
  return pick([
    { t: 'Deve stampare i numeri da 1 a 5. Quale riga è sbagliata?', lines: ['for (int i = 1; i < 5; i++) {', '    System.out.println(i);', '}'], bad: 0, why: 'Con i < 5 si arriva a 4: serve i <= 5.' },
    { t: 'Questo ciclo non finisce mai. Quale riga è sbagliata?', lines: ['int i = 0;', 'while (i < 10) {', '    System.out.println(i);', '    i--;', '}'], bad: 3, why: 'i diminuisce invece di aumentare: resta sempre minore di 10.' },
    { t: 'Deve dire se x è uguale a 3. Quale riga è sbagliata?', lines: ['int x = 4;', 'if (x = 3) {', '    System.out.println("Tre");', '}'], bad: 1, why: 'Il confronto si scrive ==; con = Java non compila, perché una condizione deve essere boolean.' },
    { t: 'Deve confrontare due stringhe. Quale riga è sbagliata?', lines: ['String a = in.nextLine();', 'String b = "si";', 'if (a == b) {', '    System.out.println("Hai detto si");', '}'], bad: 2, why: 'Le stringhe si confrontano con a.equals(b): == confronta i riferimenti, non il testo.' },
    { t: 'Con g = 1 stampa anche "Martedì". Quale riga manca di qualcosa?', lines: ['switch (g) {', '    case 1: System.out.println("Lunedì");', '    case 2: System.out.println("Martedì"); break;', '}'], bad: 1, why: 'Manca il break dopo il case 1: senza, l\'esecuzione prosegue nel case 2.' },
    { t: 'Deve sommare i numeri da 1 a 10. Quale riga è sbagliata?', lines: ['for (int i = 1; i <= 10; i++) {', '    int somma = 0;', '    somma += i;', '}'], bad: 1, why: 'L\'accumulatore va dichiarato prima del ciclo: dentro riparte da 0 e sparisce alla fine del giro.' }
  ]);
}

/* quanto vale x dopo alcuni operatori composti (+=, -=, *=, /=, %=, ++, --) */
function opGen() {
  let x = rnd(5, 20); const righe = [`int x = ${x};`], passi = [`x = ${x}`];
  for (let i = 0; i < rnd(2, 3); i++) {
    const k = rnd(2, 5), op = pick(['+=', '-=', '*=', '/=', '%=', '++', '--']);
    if (op === '++') { x++; righe.push('x++;'); } else if (op === '--') { x--; righe.push('x--;'); }
    else { righe.push(`x ${op} ${k};`); x = op === '+=' ? x + k : op === '-=' ? x - k : op === '*=' ? x * k : op === '/=' ? Math.trunc(x / k) : x % k; }
    passi.push(`${righe[righe.length - 1]} → x = ${x}`);
  }
  return { q: `Quanto vale <code>x</code> alla fine?${PJ(righe)}`, fields: [{ label: 'x', kind: 'num', exp: x, tol: 0 }], sl: 'Procedimento', sol: P(passi.join('\n') + '\n(x è int: /= fa la divisione intera)') };
}
/* condizioni con && || ! */
function condJavaGen() {
  const a = rnd(0, 12), b = rnd(0, 12), s = pick(['si', 'no']);
  const [e, v] = pick([
    [`a > 5 && b > 5`, a > 5 && b > 5], [`a > 5 || b > 5`, a > 5 || b > 5], [`!(a == b)`, a !== b],
    [`a % 2 == 0 && b % 2 == 0`, a % 2 === 0 && b % 2 === 0], [`a >= b || a == 0`, a >= b || a === 0],
    [`risposta.equals("si")`, s === 'si'], [`!risposta.equals("si") && a < 10`, s !== 'si' && a < 10]
  ]);
  return { q: `Con <code>int a = ${a}; int b = ${b}; String risposta = "${s}";</code> quanto vale <code>${J(e)}</code>?`, fields: [{ label: 'Valore', kind: 'choice', opts: ['', 'true', 'false'], exp: String(v) }],
    sl: 'Spiegazione', sol: `<p>${v}. && è vero solo se lo sono entrambe le parti, || se almeno una lo è, ! inverte; le stringhe si confrontano con equals.</p>` };
}
/* quante volte si esegue il corpo di un for */
function forCountGen() {
  const a = rnd(0, 5), p = pick([1, 1, 2, 3]), k = rnd(3, 8), b = a + p * k - rnd(0, 1) * p, minore = Math.random() < .5;
  let n = 0, ult = null; for (let i = a; minore ? i < b : i <= b; i += p) { n++; ult = i; }
  return { q: `Quante volte si esegue il corpo del ciclo, e quanto vale <code>i</code> l'ultima volta?${PJ([`for (int i = ${a}; i ${minore ? '<' : '<='} ${b}; i${p === 1 ? '++' : ' += ' + p}) {`, '    // corpo', '}'])}`,
    fields: [{ label: 'Volte', kind: 'num', exp: n, tol: 0 }, { label: 'Ultimo valore di i', kind: 'num', exp: ult, tol: 0 }],
    sl: 'Procedimento', sol: P(`i vale: ${Array.from({ length: n }, (_, j) => a + j * p).join(', ')}\nvolte = ${n}`) };
}
function huntJavaTipi() {
  return pick([
    { t: 'Quale riga non compila?', lines: ['int eta = 16;', 'int altezza = 1.75;', 'String nome = "Ada";'], bad: 1, why: '1.75 è un double: non entra in un int. Serve double altezza = 1.75;' },
    { t: 'Quale riga non compila?', lines: ['char iniziale = "A";', 'boolean ok = true;', 'double media = 7.5;'], bad: 0, why: 'Un char si scrive tra apici singoli: \'A\'. Tra virgolette è una String.' },
    { t: 'Quale riga non compila?', lines: ['long abitanti = 8000000000;', 'int classi = 25;', 'double pi = 3.14;'], bad: 0, why: 'Il numero è troppo grande per un int: per un long serve la L finale, 8000000000L.' },
    { t: 'Quale riga non compila?', lines: ['double prezzo = 2.5;', 'float peso = 2.5;', 'int quanti = 3;'], bad: 1, why: '2.5 è un double: per un float serve 2.5f.' },
    { t: 'Quale riga non compila?', lines: ['String saluto = \'ciao\';', 'int n = 4;', 'boolean pari = n % 2 == 0;'], bad: 0, why: 'Le stringhe vanno tra virgolette doppie: "ciao".' },
    { t: 'Quale riga non compila?', lines: ['int a = 7;', 'int b = 2;', 'int media = (a + b) / 2.0;'], bad: 2, why: 'Dividendo per 2.0 il risultato è double: non entra in un int senza cast.' }
  ]);
}
