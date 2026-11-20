/* Generatori di esercizi per le attività su architettura dei calcolatori e componenti.
   Solo definizioni: va caricato dopo assets/giochi.js, che fornisce rnd, pick, fmt, sep, P...
   Ogni generatore restituisce {q, fields, sol, sl} come richiesto da mount() in giochi.js. */

/* Frequenza e periodo del clock: f = 1/T (T in ns, f in GHz) */
function clockGen() {
  const dir = rnd(0, 1), T = pick([0.2, 0.25, 0.5, 1, 2, 4]), f = 1 / T;
  if (dir === 0) return {
    q: `Un segnale di clock ha periodo T = <b>${fmt(T)} ns</b>. Quanti GHz vale la frequenza?`,
    fields: [{ label: 'Frequenza (GHz)', kind: 'num', exp: f, tol: 0 }],
    sl: 'Procedimento', sol: P(`f = 1 / T = 1 / ${fmt(T)} ns = ${fmt(f)} GHz\n(1 ns è un miliardesimo di secondo: 1 / 1 ns = 1 miliardo di cicli al secondo = 1 GHz)`)
  };
  return {
    q: `Una CPU lavora a <b>${fmt(f)} GHz</b>. Quanti nanosecondi dura un ciclo di clock?`,
    fields: [{ label: 'Periodo (ns)', kind: 'num', exp: T, tol: 0 }],
    sl: 'Procedimento', sol: P(`T = 1 / f = 1 / ${fmt(f)} GHz = ${fmt(T)} ns`)
  };
}

/* Tempo per leggere un file dalla memoria di massa */
function lettura() {
  const g = pick([2, 4, 5, 10, 20]), v = pick([100, 200, 500, 1000, 2000]), mb = g * 1000, s = mb / v;
  return {
    q: `Un file da <b>${g} GB</b> viene letto da un disco con velocità di trasferimento di <b>${sep(v)} MB/s</b>. Quanti secondi servono? (1 GB = 1000 MB)`,
    fields: [{ label: 'Tempo (s)', kind: 'num', exp: s, tol: 0 }],
    sl: 'Procedimento', sol: P(`${g} GB = ${sep(mb)} MB\ntempo = ${sep(mb)} MB / ${sep(v)} MB/s = ${fmt(s)} s`)
  };
}

/* Costo di un disco dal prezzo al gigabyte */
function costoGB() {
  const tipo = pick([['SSD', 0.30, [256, 512, 1000]], ['HDD', 0.02, [500, 1000, 2000, 4000]]]), gb = pick(tipo[2]), c = gb * tipo[1];
  return {
    q: `Un <b>${tipo[0]}</b> da <b>${sep(gb)} GB</b> costa circa ${fmt(tipo[1].toFixed(2))} € al GB. Quanti euro costa il disco?`,
    fields: [{ label: 'Costo (€)', kind: 'num', exp: c, tol: 0.01 }],
    sl: 'Procedimento', sol: P(`costo = ${sep(gb)} GB x ${fmt(tipo[1].toFixed(2))} €/GB = ${fmt(+c.toFixed(2))} €`)
  };
}

/* Quanto pesa un'immagine non compressa a 24 bit (3 byte per pixel) */
function immagineRaw() {
  const r = pick([['HD', 1280, 720], ['Full HD', 1920, 1080], ['4K UHD', 3840, 2160]]), px = r[1] * r[2], mb = px * 3 / 1e6;
  return {
    q: `Un'immagine <b>${r[0]}</b> (${sep(r[1])} x ${sep(r[2])} pixel) non compressa usa 24 bit (RGB) per pixel. Quanti MB occupa? (1 MB = 1 000 000 byte)`,
    fields: [{ label: 'Dimensione (MB)', kind: 'num', exp: mb, tol: 0.01 }],
    sl: 'Procedimento', sol: P(`pixel = ${sep(r[1])} x ${sep(r[2])} = ${sep(px)}\n24 bit = 3 byte per pixel\nbyte = ${sep(px)} x 3 = ${sep(px * 3)}\nMB = ${fmt(+mb.toFixed(2))}`)
  };
}

/* Frequenza e core: un confronto fra due CPU a parità di lavoro parallelo */
function coreGen() {
  const n = pick([2, 4, 8, 10]), g = pick([1.5, 2, 2.5, 3]), tot = n * g;
  return {
    q: `Un programma ben parallelizzabile gira su una CPU con <b>${n} core a ${fmt(g)} GHz</b>. Se la potenza fosse la somma delle frequenze dei core, a quanti GHz equivarrebbe? (è solo un confronto grossolano)`,
    fields: [{ label: 'GHz equivalenti', kind: 'num', exp: tot, tol: 0 }],
    sl: 'Procedimento', sol: P(`${n} x ${fmt(g)} GHz = ${fmt(tot)} GHz\nPer questo dieci core a 2 GHz possono battere un solo core a 4 GHz: la frequenza da sola non basta a confrontare le CPU.`)
  };
}
