/* Generatori di esercizi per le attività su problem solving, algoritmi e Flowgorithm.
   Solo definizioni: va caricato dopo assets/giochi.js, che fornisce rnd, pick, shuffle, fmt, P...
   Ogni generatore restituisce {q, fields, sol, sl} come richiesto da mount() in giochi.js. */

/* Trace table di un ciclo Mentre: somma dei numeri da 1 a n */
function traceSomma() {
  const n = rnd(3, 6), righe = [];
  let i = 1, s = 0;
  while (i <= n) { s += i; i++; righe.push(`${righe.length + 1}° giro: i = ${i}, somma = ${s}`); }
  return {
    q: `Eseguite a mano: <code>i = 1, somma = 0; Mentre i &lt;= ${n}: somma = somma + i; i = i + 1</code>. Quanto vale <b>somma</b> alla fine e quante volte viene eseguito il blocco?`,
    fields: [{ label: 'Valore finale di somma', kind: 'num', exp: s, tol: 0 }, { label: 'Esecuzioni del blocco', kind: 'num', exp: n, tol: 0 }],
    sl: 'Trace table', sol: P(`Inizio: i = 1, somma = 0\n${righe.join('\n')}\nUscita: i = ${n + 1} non è più &lt;= ${n}, il ciclo termina.`)
  };
}

/* Contatore e accumulatore: quanti promossi e che somma di voti */
function contaVoti() {
  const k = rnd(4, 6), v = Array.from({ length: k }, () => rnd(3, 10)), pro = v.filter(x => x >= 6).length, s = v.reduce((a, b) => a + b, 0);
  return {
    q: `Un algoritmo legge i voti <b>${v.join(', ')}</b>. Il contatore <code>promossi</code> aumenta di 1 se voto &gt;= 6, l'accumulatore <code>somma</code> somma tutti i voti (entrambi partono da 0). Quanto valgono alla fine?`,
    fields: [{ label: 'promossi', kind: 'num', exp: pro, tol: 0 }, { label: 'somma', kind: 'num', exp: s, tol: 0 }],
    sl: 'Procedimento', sol: P(`Voti &gt;= 6: ${v.filter(x => x >= 6).join(', ') || 'nessuno'} → promossi = ${pro}\nsomma = ${v.join(' + ')} = ${s}\nmedia = ${s} / ${k} = ${fmt((s / k).toFixed(2))}`)
  };
}

/* Massimo e minimo: il primo valore è il provvisorio */
function maxMin() {
  const k = rnd(4, 6), v = Array.from({ length: k }, () => rnd(-9, 9));
  return {
    q: `Un algoritmo legge in ordine i numeri <b>${v.join(', ')}</b>; il primo valore è usato come massimo e minimo provvisori. Quali valori hanno <b>massimo</b> e <b>minimo</b> alla fine?`,
    fields: [{ label: 'massimo', kind: 'num', exp: Math.max(...v), tol: 0 }, { label: 'minimo', kind: 'num', exp: Math.min(...v), tol: 0 }],
    sl: 'Procedimento', sol: P(`Si confronta ogni nuovo valore con massimo e minimo provvisori.\nmassimo = ${Math.max(...v)}, minimo = ${Math.min(...v)}\n(Partire da 0 sarebbe un errore se i valori fossero tutti negativi.)`)
  };
}

/* Espressione booleana con && || ! */
function boolGen() {
  const a = rnd(0, 20), b = rnd(0, 20), c = pick([5, 10, 12]);
  const e = pick([
    [`a &gt; ${c} &amp;&amp; b &gt; ${c}`, a > c && b > c],
    [`a &gt; ${c} || b &gt; ${c}`, a > c || b > c],
    [`!(a &gt; ${c})`, !(a > c)],
    [`a &gt;= b &amp;&amp; b &gt; ${c}`, a >= b && b > c],
    [`a == b || a &lt; ${c}`, a === b || a < c]
  ]);
  return {
    q: `Con <b>a = ${a}</b> e <b>b = ${b}</b>, quanto vale l'espressione <code>${e[0]}</code>?`,
    fields: [{ label: 'Valore', kind: 'choice', opts: ['', 'Vero', 'Falso'], exp: e[1] ? 'Vero' : 'Falso' }],
    sl: 'Spiegazione', sol: `<p>${e[1] ? 'Vero' : 'Falso'}. AND è vero solo se entrambe le parti sono vere, OR se almeno una lo è, NOT inverte.</p>`
  };
}

/* Resto della divisione intera (operatore %) */
function moduloGen() {
  const a = rnd(5, 60), b = rnd(2, 9);
  return {
    q: `Quanto vale <code>${a} % ${b}</code>? (resto della divisione intera)`,
    fields: [{ label: 'Risultato', kind: 'num', exp: a % b, tol: 0 }],
    sl: 'Procedimento', sol: P(`${a} = ${b} x ${Math.floor(a / b)} + ${a % b}\nil resto è ${a % b}`)
  };
}

/* Modello delle tariffe telefoniche: quale conviene con n minuti */
function tariffe() {
  const n = pick([30, 60, 90, 100, 150, 200, 300, 400]), c1 = 0.26 * n, c2 = 30, c3 = 10 + 0.15 * n,
    m = Math.min(c1, c2, c3), nome = m === c1 ? 'Tariffa 1' : m === c2 ? 'Tariffa 2' : 'Tariffa 3';
  return {
    q: `Tariffa 1: C = 0,26·n. Tariffa 2: C = 30. Tariffa 3: C = 10 + 0,15·n (n = minuti, C = costo in euro). Con <b>n = ${n}</b> minuti, quale tariffa conviene?`,
    fields: [{ label: 'Tariffa più conveniente', kind: 'choice', opts: ['', 'Tariffa 1', 'Tariffa 2', 'Tariffa 3'], exp: nome }],
    sl: 'Calcolo', sol: P(`Tariffa 1: 0,26 x ${n} = ${fmt(+c1.toFixed(2))} €\nTariffa 2: 30 €\nTariffa 3: 10 + 0,15 x ${n} = ${fmt(+c3.toFixed(2))} €\nconviene la ${nome.toLowerCase()}`)
  };
}

/* Ciclo Per: quante volte si esegue il blocco e quanto vale la somma dei contatori */
function forGen() {
  const a = rnd(0, 3), p = pick([1, 1, 2, 3]), k = rnd(3, 6), b = a + p * (k - 1) + rnd(0, p - 1), vals = [];
  for (let i = a; i <= b; i += p) vals.push(i);
  return {
    q: `Ciclo <b>Per i da ${a} a ${b}</b> con passo <b>${p}</b> (incrementa). Quante volte viene eseguito il blocco e quanto vale la somma dei valori assunti da i?`,
    fields: [{ label: 'Esecuzioni del blocco', kind: 'num', exp: vals.length, tol: 0 }, { label: 'Somma dei valori di i', kind: 'num', exp: vals.reduce((x, y) => x + y, 0), tol: 0 }],
    sl: 'Procedimento', sol: P(`i assume: ${vals.join(', ')}\nesecuzioni = ${vals.length}\nsomma = ${vals.join(' + ')} = ${vals.reduce((x, y) => x + y, 0)}`)
  };
}

/* Selezione annidata: dal voto al giudizio (Insufficiente / Sufficiente / Buono) */
function giudizioGen() {
  const v = rnd(1, 10), g = v >= 6 ? (v >= 8 ? 'Buono' : 'Sufficiente') : 'Insufficiente';
  return {
    q: `Algoritmo: <code>Se voto &gt;= 6: (Se voto &gt;= 8: "Buono", altrimenti "Sufficiente"), altrimenti "Insufficiente"</code>. Che cosa scrive con <b>voto = ${v}</b>?`,
    fields: [{ label: 'Scrittura', kind: 'choice', opts: ['', 'Buono', 'Sufficiente', 'Insufficiente'], exp: g }],
    sl: 'Spiegazione', sol: `<p>${g}: ${v >= 6 ? `${v} &gt;= 6 è vero` + (v >= 8 ? ' e anche ' + v + ' &gt;= 8' : ', ma ' + v + ' &gt;= 8 è falso') : v + ' &gt;= 6 è falso'}.</p>`
  };
}

/* Caccia all'errore negli algoritmi: righe di pseudocodice con un errore logico */
function erroreAlgoritmo() {
  return pick([
    { t: 'Questo algoritmo deve sommare i numeri da 1 a 5. Quale riga è sbagliata?', lines: ['somma = 0', 'Per i da 1 a 5', '    somma = 0', '    somma = somma + i', 'Scrittura somma'], bad: 2, why: 'L\'accumulatore va inizializzato prima del ciclo: dentro il ciclo ripartirebbe da zero a ogni giro.' },
    { t: 'Questo algoritmo deve trovare il massimo di N numeri. Quale riga è sbagliata?', lines: ['Lettura x', 'massimo = 0', 'Per i da 2 a N', '    Lettura x', '    Se x > massimo, massimo = x'], bad: 1, why: 'Il massimo provvisorio deve essere il primo valore letto: partire da 0 sbaglia se i numeri sono tutti negativi.' },
    { t: 'Questo algoritmo deve calcolare l\'area di un triangolo. Quale riga è sbagliata?', lines: ['Lettura base', 'Lettura altezza', 'area = base * altezza', 'Scrittura "Area: " & area'], bad: 2, why: 'Manca la divisione per 2: l\'area del triangolo è base * altezza / 2.' },
    { t: 'Questo algoritmo deve ripetere finché la lettura non è positiva. Quale riga è sbagliata?', lines: ['Fai', '    Lettura lato', 'finché lato > 0', 'area = lato * lato'], bad: 2, why: 'Si deve ripetere finché il dato NON è valido: la condizione giusta è lato <= 0.' },
    { t: 'Questo algoritmo deve dire se un numero è pari. Quale riga è sbagliata?', lines: ['Lettura numero', 'resto = numero % 2', 'Se resto == 1', '    Scrittura "pari"', 'Altrimenti', '    Scrittura "dispari"'], bad: 2, why: 'Un numero è pari quando il resto è 0, non 1: la condizione è resto == 0.' },
    { t: 'Questo algoritmo deve calcolare la media di N voti. Quale riga è sbagliata?', lines: ['somma = 0', 'Per i da 1 a N', '    Lettura voto', '    somma = somma + voto', 'media = somma / voto'], bad: 4, why: 'La media si calcola dividendo la somma per il numero dei voti (N), non per l\'ultimo voto letto.' }
  ]);
}
