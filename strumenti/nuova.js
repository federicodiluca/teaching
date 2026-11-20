#!/usr/bin/env node
/* npm run nuova: crea lo scheletro di una nuova attività e aggiorna catalogo, sitemap e README.
   Se il corso o l'unità non esistono ancora, crea anche quelli (voce nel catalogo e pagina di elenco).

   Fa le domande una alla volta; ogni domanda si può saltare passando la risposta come opzione:
     npm run nuova -- --corso tpsit-3 --unita reti --titolo "Il modello ISO/OSI" --tipo giochi --modalita "da soli"
   Opzioni: --corso --unita --titolo --nome (cartella) --tipo (giochi|lim) --modalita --icona --descrizione
            per un corso nuovo: --corso-nome --anno --colore --corso-icona;  per un'unità nuova: --unita-nome
            --si (niente conferma finale), --radice <cartella> (lavora su un'altra copia del sito, per i controlli).
   Nessuna dipendenza: basta Node.js. Non tocca nient'altro e non fa commit. */

const fs = require("fs"), path = require("path"), vm = require("vm"), readline = require("readline");

/* ---------- opzioni ---------- */
const OPZ = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (!a.startsWith("--")) continue;
  const k = a.slice(2), v = process.argv[i + 1];
  if (v === undefined || v.startsWith("--")) OPZ[k] = true; else { OPZ[k] = v; i++; }
}
const RADICE = path.resolve(OPZ.radice || path.join(__dirname, ".."));
const F = rel => path.join(RADICE, rel);
const leggi = rel => fs.readFileSync(F(rel), "utf8");
const scrivi = (rel, testo) => { fs.mkdirSync(path.dirname(F(rel)), { recursive: true }); fs.writeFileSync(F(rel), testo); };
const OGGI = new Date().toISOString().slice(0, 10);
const SITO = "https://teaching.federicodiluca.com/";
const MODALITA = ["da soli", "a coppie", "in laboratorio", "a squadre", "alla lavagna"];

/* ---------- domande ---------- */
const interattivo = process.stdin.isTTY;
let rl = null;
function chiedi(testo) {
  if (!interattivo) return Promise.reject(new Error("manca una risposta (" + testo.trim() + "): passatela come opzione, vedi in testa a strumenti/nuova.js"));
  rl = rl || readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(res => rl.question(testo, r => res(r.trim())));
}
async function domanda(chiave, testo, { predefinita = "", valida = () => "" } = {}) {
  if (OPZ[chiave] !== undefined && OPZ[chiave] !== true) {
    const v = String(OPZ[chiave]).trim(), err = valida(v);
    if (err) throw new Error("--" + chiave + ": " + err);
    return v;
  }
  if (!interattivo && predefinita) {
    const err = valida(predefinita);
    if (err) throw new Error("--" + chiave + ": " + err);
    return predefinita;
  }
  for (;;) {
    const r = (await chiedi(testo + (predefinita ? " [" + predefinita + "]" : "") + ": ")) || predefinita;
    const err = r ? valida(r) : "serve una risposta";
    if (!err) return r;
    console.log("  " + err);
  }
}
async function scelta(chiave, testo, voci, { altro = "", predefinita = "" } = {}) {
  // voci: [[valore, descrizione]]; con "altro" si può scrivere un valore nuovo
  if (OPZ[chiave] !== undefined && OPZ[chiave] !== true) return String(OPZ[chiave]).trim();
  if (!interattivo && predefinita) return voci[Number(predefinita) - 1][0];
  console.log("\n" + testo);
  voci.forEach(([v, d], i) => console.log(`  ${i + 1}. ${d || v}`));
  if (altro) console.log(`  ${voci.length + 1}. ${altro}`);
  for (;;) {
    const r = (await chiedi("Numero" + (predefinita ? " [" + predefinita + "]" : "") + ": ")) || predefinita;
    const n = Number(r);
    if (n >= 1 && n <= voci.length) return voci[n - 1][0];
    if (altro && n === voci.length + 1) return null;
    if (!/^\d+$/.test(r) && voci.some(v => v[0] === r)) return r;
    console.log("  Scegliete un numero da 1 a " + (voci.length + (altro ? 1 : 0)) + ".");
  }
}

/* ---------- utilità ---------- */
const slug = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const js = s => JSON.stringify(s);
const validaSlug = v => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v) ? "" : "solo minuscole, numeri e trattini (es. il-modello-osi)";
const senzaTrattinoLungo = v => /[–—]/.test(v) ? "niente trattino lungo: usate i due punti o il trattino normale" : "";

function catalogo() {
  const ctx = { window: {} };
  vm.runInNewContext(leggi("assets/catalogo.js"), ctx);
  return ctx.window;
}
function icone() {
  const t = leggi("assets/teaching.js");
  const blocco = t.slice(t.indexOf("var ICONE = {"), t.indexOf("};", t.indexOf("var ICONE = {")));
  return [...blocco.matchAll(/^\s{4}([a-z]+):\s*'/gm)].map(m => m[1]);
}

/* ---------- pagine ---------- */
function testa(titolo, descrizione, su) {
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titolo)}</title>
<meta name="description" content="${esc(descrizione)}">
<meta name="theme-color" content="#1d2433">
<link rel="icon" href="${su}assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${su}assets/teaching.css">
<script src="${su}assets/catalogo.js" defer></script>
<script src="${su}assets/teaching.js" defer></script>
</head>`;
}
function elenco(su, corpo, crumb, h1, p) {
  return `${corpo}
<div class="tg-wrap">
  <header class="tg-top">
    <a class="tg-logo" href="${su}">teaching<span></span></a>
    <button class="tg-iconbtn" id="tg-tema" type="button">Tema scuro</button>
  </header>
  <section class="tg-hero">
    <div class="tg-crumb">${crumb}</div><h1>${esc(h1)}</h1>
    <p>${esc(p)}</p>
  </section>
  <div class="tg-tools">
    <div id="tg-chips" style="display:contents"></div>
    <input class="tg-search" id="tg-cerca" type="search" placeholder="Cerca un'attività" aria-label="Cerca un'attività">
  </div>
  <main id="elenco"></main>
  <footer class="tg-foot">
    <span>Attività interattive di <a href="https://federicodiluca.com">Federico Di Luca</a>, docente di informatica.</span>
    <span><a href="https://github.com/federicodiluca/teaching">Codice su GitHub</a> &middot; Licenza CC BY-NC-SA 4.0</span>
  </footer>
</div>
</body>
</html>
`;
}
function paginaCorso(c) {
  return testa(`${c.nome} ${c.anno} · teaching`, `Attività interattive di ${c.nome}, ${c.anno}.`, "../") + "\n" +
    elenco("../", `<body class="tg-home" data-tg="elenco" data-corso="${c.id}">`,
      `<a href="../">teaching</a> /`, c.nome, `Le attività di ${c.nome}, ${c.anno}.`);
}
function paginaUnita(c, uSlug, uNome) {
  return testa(`${uNome} · teaching`, `Attività interattive: ${uNome}.`, "../../") + "\n" +
    elenco("../../", `<body class="tg-home" data-tg="elenco" data-corso="${c.id}" data-unita="${uSlug}">`,
      `<a href="../../">teaching</a> / <a href="../">${esc(c.nome)}</a> /`, uNome,
      `Le attività dell'unità ${uNome} (${c.nome}, ${c.anno}).`);
}

const COPPIA = "Si gioca in coppia: ad ogni esercizio tocca a uno dei due scrivere, mentre l'altro controlla e discute.";
const SOLI = "Si gioca da soli, quando e quanto volete.";
function paginaGiochi(a) {
  const solo = a.modalita !== "a coppie";
  const nomi = solo
    ? `<label>Il vostro nome: <input type="text" id="n1" placeholder="Scrivete qui il nome"></label>`
    : `<label>Primo nome: <input type="text" id="n1" placeholder="Nome"></label><label>Secondo nome: <input type="text" id="n2" placeholder="Nome"></label>`;
  const t = esc(a.titolo);
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${t}</title><meta name="description" content="${esc(a.descrizione)}"><link rel="stylesheet" href="../../../assets/giochi.css"><link rel="icon" href="../../../assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="../../../assets/teaching.css"><script src="../../../assets/catalogo.js" defer></script><script src="../../../assets/teaching.js" defer></script></head>
<body class="tg-act"${solo ? ' data-solo="1"' : ""}><header><h1>${t}</h1></header><nav id="nav"></nav><main>

<!-- DA SCRIVERE: testi e sezioni. Gli id delle sezioni finiscono negli indirizzi (#g1): una volta pubblicati non si rinominano. -->
<section id="inizio" data-g="Inizio" data-t="Inizio"><h2>${t}</h2>
<p class="lead">${esc(a.descrizione)}</p>
<ol><li><b>Smistamento</b> e <b>In ordine</b>: i giochi sull'argomento.</li><li><b>Quiz</b> e <b>Sfida finale</b>.</li></ol>
<p>${solo ? SOLI : COPPIA} Ogni gioco vi dice subito se avete sbagliato: tenete aperte le slide per consultarle.</p>
<div class="row">${nomi}</div></section>

<section id="g1" data-g="Giochi" data-t="1 Smistamento"><h2>Smistamento</h2><p class="lead">Fate clic su una carta e poi sulla categoria giusta.</p><div id="srt"></div></section>
<section id="g2" data-g="Giochi" data-t="2 In ordine"><h2>In ordine</h2><p class="lead">Trascinate le righe (oppure usate le frecce) per metterle in ordine, poi premete «Verifica».</p><div id="ord"></div></section>
<section id="qz1" data-g="Quiz" data-t="1 Vero o falso"><h2>Vero o falso?</h2><p class="lead">Scegliete e premete «Controlla». Dopo ogni risposta potete leggere la spiegazione.</p><div id="vf"></div></section>
<section id="qz2" data-g="Quiz" data-t="2 Risposta multipla"><h2>Risposta multipla</h2><p class="lead">Scegliete una risposta e premete «Controlla».</p><div id="mc"></div></section>
<section id="fin" data-g="Sfida finale" data-t="Sfida finale"><h2>Sfida finale</h2><p class="lead">Domande miste su tutto l'argomento, a tempo${solo ? "" : ", a turno"}. Ogni domanda vale 1 punto se giusta al primo controllo.</p><div id="tot"></div></section>
<section id="res" data-g="Risultato" data-t="Risultato"><h2>Risultato</h2><p id="who" class="lead"></p><table class="res" id="restab"></table><p class="msg" id="rmsg"></p></section>
</main><script src="../../../assets/giochi.js"></script><script>
/* DA SCRIVERE: dati di esempio, da sostituire con quelli della lezione.
   I giochi disponibili sono descritti in testa a assets/giochi.js.
   L'ultimo argomento di ogni gioco è la sua etichetta: è la chiave dei progressi salvati, dopo la pubblicazione non si cambia. */
const D = {
  // smistamento: [carta, id della categoria] e le categorie {id, t: titolo, s: sottotitolo}
  SORT: [
    ["Prima carta della categoria A", "a"],
    ["Seconda carta della categoria A", "a"],
    ["Prima carta della categoria B", "b"],
    ["Seconda carta della categoria B", "b"]
  ],
  SORT_BK: [{ id: "a", t: "Categoria A", s: "" }, { id: "b", t: "Categoria B", s: "" }],
  // in ordine: [passo, spiegazione], già nell'ordine giusto
  ORD: [
    ["Primo passo", "Che cosa succede per primo."],
    ["Secondo passo", "Che cosa succede dopo."],
    ["Terzo passo", "Che cosa succede alla fine."]
  ],
  // vero o falso: [affermazione, vera?, spiegazione]
  VF: [
    ["Un'affermazione vera.", true, "Perché è vera."],
    ["Un'affermazione falsa.", false, "Perché è falsa."]
  ],
  // risposta multipla: [domanda, [opzioni], risposta giusta, spiegazione]
  MC: [
    ["Una domanda?", ["La risposta giusta", "Una sbagliata", "Un'altra sbagliata"], "La risposta giusta", "Perché è giusta."],
    ["Un'altra domanda?", ["Sbagliata", "Giusta", "Sbagliata anche questa"], "Giusta", "Perché è giusta."]
  ]
};
SG('#srt', D.SORT, D.SORT_BK, 'Smistamento');
orderGame($('#ord'), asOrder(D.ORD), 'In ordine', false);
quiz();
const SFIDA = [...mcAll(), ...vfAll()];
mission($('#tot'), SFIDA, 'Sfida finale', Math.min(10, SFIDA.length));
</script></body></html>
`;
}
function paginaLim(a) {
  const t = esc(a.titolo), cls = "tg-" + a.nome;
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${t}</title>
<meta name="description" content="${esc(a.descrizione)}">
<link rel="icon" href="../../../assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="../../../assets/teaching.css">
<script src="../../../assets/catalogo.js" defer></script>
<script src="../../../assets/teaching.js" defer></script>
<style>
/* Attività da LIM: layout proprio. Solo variabili del sito (--tg-...), così tema scuro e chiaro funzionano da soli. */
body.${cls} { margin: 0; min-height: 100vh; }
.${cls} header { display: flex; align-items: center; gap: 1rem; max-width: 1100px; margin: 0 auto; padding: 1rem 1.2rem .4rem; }
.${cls} header h1 { margin: 0; font-size: clamp(1.4rem, 2.6vw, 2rem); }
.${cls} .pos { color: var(--tg-mute); margin-left: auto; font-variant-numeric: tabular-nums; }
.${cls} main { max-width: 1100px; margin: 0 auto; padding: 1rem 1.2rem 2rem; }
.${cls} .card { background: var(--tg-paper); border: 1px solid var(--tg-line); border-radius: 16px; padding: clamp(1.2rem, 3vw, 2.4rem); box-shadow: var(--tg-shadow-sm); }
.${cls} .card h2 { margin: 0 0 .6rem; font-size: clamp(1.4rem, 3vw, 2.4rem); }
.${cls} .card p { margin: 0; font-size: clamp(1.1rem, 2.2vw, 1.6rem); line-height: 1.45; }
.${cls} .comandi { display: flex; gap: .6rem; margin-top: 1rem; }
.${cls} .btn { font: inherit; font-weight: 600; cursor: pointer; padding: .6rem 1.1rem; background: var(--tg-acc); color: var(--tg-on-acc); border: 0; }
.${cls} .btn.sec { background: var(--tg-paper-2); color: var(--tg-ink); }
.${cls} .btn:disabled { opacity: .45; cursor: default; }
</style>
</head>
<body class="tg-lim ${cls}">
<header><h1>${t}</h1><span class="pos" id="pos"></span></header>
<main>
  <div class="card" id="vista"></div>
  <div class="comandi"><button class="btn sec" id="prec">&larr; Indietro</button><button class="btn" id="succ">Avanti &rarr;</button></div>
</main>
<script>
/* DA SCRIVERE: le schermate da mostrare alla lavagna. Si va avanti e indietro con i pulsanti o con le frecce. */
const SCHERMATE = [
  { titolo: "Prima schermata", testo: "Il testo da leggere insieme alla classe." },
  { titolo: "Seconda schermata", testo: "Una domanda da discutere, una consegna per le squadre..." }
];
let n = 0;
function mostra() {
  const s = SCHERMATE[n];
  document.getElementById("vista").innerHTML = "<h2></h2><p></p>";
  document.querySelector("#vista h2").textContent = s.titolo;
  document.querySelector("#vista p").textContent = s.testo;
  document.getElementById("pos").textContent = (n + 1) + " / " + SCHERMATE.length;
  document.getElementById("prec").disabled = n === 0;
  document.getElementById("succ").disabled = n === SCHERMATE.length - 1;
}
function vai(d) { n = Math.max(0, Math.min(SCHERMATE.length - 1, n + d)); mostra(); }
document.getElementById("prec").onclick = () => vai(-1);
document.getElementById("succ").onclick = () => vai(1);
document.addEventListener("keydown", e => {
  if (e.target.closest("input, textarea, select")) return;
  if (e.key === "ArrowRight") vai(1); else if (e.key === "ArrowLeft") vai(-1);
});
mostra();
</script>
</body>
</html>
`;
}

/* ---------- aggiornamento dei file comuni ---------- */
// aggiunge una voce in fondo a un array o a un oggetto di catalogo.js (window.NOME = [ ... ]; o { ... };)
function aggiungiInBlocco(testo, nome, voce, dopo) {
  const i = testo.indexOf("window." + nome + " = ");
  if (i < 0) throw new Error("catalogo.js: non trovo window." + nome);
  const chiusura = testo.indexOf(nome === "UNITA" ? "\n};" : "\n];", i);
  let punto = chiusura;
  if (dopo) {
    // dopo l'ultima voce indicata (la sua riga, o le sue righe fino a "}")
    const j = testo.lastIndexOf(dopo, chiusura);
    if (j > i) {
      const fine = nome === "UNITA" ? testo.indexOf("\n", j) : testo.indexOf("}", j) + 1;
      if (fine > 0 && fine < chiusura) punto = fine + (testo[fine] === "," ? 1 : 0);
    }
  }
  const prima = testo.slice(0, punto).replace(/,?\s*$/, ""), resto = testo.slice(punto).replace(/^,?/, "");
  const altra = resto.replace(/^\s*/, "")[0];
  return prima + ",\n" + voce + (altra === "]" || altra === "}" ? "" : ",") + resto;
}
// in testa a un blocco di catalogo.js
function inTesta(testo, nome, voce) {
  const i = testo.indexOf("\n", testo.indexOf("window." + nome + " = ")) + 1;
  return testo.slice(0, i) + voce + ",\n" + testo.slice(i);
}
// un corso nuovo va in ordine di anno: dopo l'ultimo corso esistente con anno minore o uguale (null = in testa)
const numAnno = c => parseInt(c.anno, 10) || 0;
const corsoPrima = (c, W) => W.CORSI.filter(x => x.id !== c.id && numAnno(x) <= numAnno(c)).pop() || null;
function aggiornaCatalogo(sel) {
  let t = leggi("assets/catalogo.js");
  const { c, nuovoCorso, uChiave, uNome, nuovaUnita, a, W } = sel;
  const prima = nuovoCorso ? corsoPrima(c, W) : null;
  const metti = (nome, voce, ancora) =>
    ancora ? aggiungiInBlocco(t, nome, voce, ancora) : nuovoCorso && !prima ? inTesta(t, nome, voce) : aggiungiInBlocco(t, nome, voce);
  if (nuovoCorso)
    t = metti("CORSI", `  { id: ${js(c.id)}, nome: ${js(c.nome)}, anno: ${js(c.anno)}, colore: ${js(c.colore)}, icona: ${js(c.icona)} }`,
      prima && `{ id: ${js(prima.id)}`);
  const daCorso = id => Object.keys(W.UNITA).filter(k => k.startsWith(id + "/")).pop();
  if (nuovaUnita) {
    const u = daCorso(c.id) || (prima && daCorso(prima.id));
    t = metti("UNITA", `  ${js(uChiave)}: ${js(uNome)}`, u && `  ${js(u)}:`);
  }
  const di = pref => W.CATALOGO.filter(x => x.percorso.startsWith(pref + "/")).pop();
  const ancora = di(uChiave) || di(c.id) || (prima && di(prima.id));
  t = metti("CATALOGO",
    `  { percorso: ${js(a.percorso)}, titolo: ${js(a.titolo)}, icona: ${js(a.icona)},\n` +
    `    descrizione: ${js(a.descrizione)},\n    modalita: ${js(a.modalita)} }`,
    ancora && `{ percorso: ${js(ancora.percorso)}`);
  scrivi("assets/catalogo.js", t);
}
function aggiornaSitemap(nuovi) {
  let righe = leggi("sitemap.xml").split("\n");
  const prof = r => { const m = r.match(/<loc>https:\/\/[^/]+\/(.*)<\/loc>/); return m ? m[1].split("/").filter(Boolean) : null; };
  for (const rel of nuovi) {
    const parti = rel.split("/"), riga = `  <url><loc>${SITO}${rel}/</loc><lastmod>${OGGI}</lastmod></url>`;
    if (righe.some(r => r.includes(`<loc>${SITO}${rel}/</loc>`))) continue;
    // dopo l'ultimo indirizzo della stessa profondità con il prefisso più lungo in comune
    let dove = -1, meglio = -1;
    righe.forEach((r, i) => {
      const p = prof(r);
      if (!p || p.length !== parti.length) return;
      let k = 0; while (k < p.length && p[k] === parti[k]) k++;
      if (k >= meglio) { meglio = k; dove = i; }
    });
    if (dove < 0) dove = righe.findIndex(r => r.includes("</urlset>")) - 1;
    righe.splice(dove + 1, 0, riga);
  }
  scrivi("sitemap.xml", righe.join("\n"));
}
function aggiornaReadme(sel) {
  let righe = leggi("README.md").split("\n");
  const { c, uNome, a, nuovoCorso, W } = sel;
  const inizio = righe.findIndex(r => /^\|\s*Corso\s*\|\s*Unità\s*\|\s*Attività\s*\|/.test(r));
  if (inizio < 0) return "README: tabella delle attività non trovata, da aggiornare a mano";
  let fine = inizio + 2; while (righe[fine] && righe[fine].startsWith("|")) fine++;
  const cella = r => r.split("|").slice(1, -1).map(x => x.trim());
  const etichetta = x => `${x.nome}, ${x.anno}`;
  const prima = nuovoCorso ? corsoPrima(c, W) : null;
  let corso = "", ultimaDelCorso = -1, ultimaPrima = -1;
  for (let i = inizio + 2; i < fine; i++) {
    const [k, u] = cella(righe[i]);
    if (k) corso = k;
    if (prima && corso === etichetta(prima)) ultimaPrima = i;
    if (corso !== etichetta(c)) continue;
    ultimaDelCorso = i;
    if (u === uNome) { righe[i] = righe[i].replace(/\s*\|\s*$/, ` · ${a.titolo} |`); scrivi("README.md", righe.join("\n")); return ""; }
  }
  const nuova = ultimaDelCorso >= 0 ? `| | ${uNome} | ${a.titolo} |` : `| ${etichetta(c)} | ${uNome} | ${a.titolo} |`;
  const dove = ultimaDelCorso >= 0 ? ultimaDelCorso + 1 : !nuovoCorso ? fine : prima ? (ultimaPrima >= 0 ? ultimaPrima + 1 : fine) : inizio + 2;
  righe.splice(dove, 0, nuova);
  scrivi("README.md", righe.join("\n"));
  return "";
}

/* ---------- via ---------- */
async function main() {
  const W = catalogo(), ICONE = icone();
  console.log("Nuova attività per teaching. Invio = valore tra parentesi quadre.");

  // corso
  let cId = await scelta("corso", "Corso:", W.CORSI.map(c => [c.id, `${c.nome}, ${c.anno} (${c.id})`]), { altro: "Un corso nuovo" });
  let c = W.CORSI.find(x => x.id === cId), nuovoCorso = !c;
  if (nuovoCorso) {
    cId = cId || await domanda("corso", "Cartella del corso (es. tpsit-3)", { valida: validaSlug });
    if (validaSlug(cId)) throw new Error("--corso: " + validaSlug(cId));
    c = W.CORSI.find(x => x.id === cId);
    nuovoCorso = !c;
  }
  if (nuovoCorso) {
    const nome = await domanda("corso-nome", "Nome del corso (es. TPSIT)", { valida: senzaTrattinoLungo });
    const anno = await domanda("anno", "Anno (es. 3° anno)", { predefinita: (cId.match(/-(\d)$/) || [])[1] ? cId.slice(-1) + "° anno" : "", valida: senzaTrattinoLungo });
    const colore = await domanda("colore", "Colore del corso", { predefinita: "#b45309", valida: v => /^#[0-9a-f]{6}$/i.test(v) ? "" : "un colore come #b45309" });
    const icona = await domanda("corso-icona", "Icona del corso (" + ICONE.join(", ") + ")", { predefinita: "terminal", valida: v => ICONE.includes(v) ? "" : "un nome tra quelli elencati" });
    c = { id: cId, nome, anno, colore, icona };
  }

  // unità
  const unita = Object.keys(W.UNITA).filter(k => k.startsWith(c.id + "/"));
  let uChiave = await scelta("unita", "Unità:", unita.map(k => [k.split("/")[1], W.UNITA[k]]), { altro: "Un'unità nuova" });
  if (uChiave && !uChiave.includes("/")) uChiave = c.id + "/" + uChiave;
  let nuovaUnita = !uChiave || !W.UNITA[uChiave], uNome = uChiave && W.UNITA[uChiave];
  if (nuovaUnita) {
    uNome = await domanda("unita-nome", "Nome dell'unità (es. Reti e protocolli)", { valida: senzaTrattinoLungo });
    const s = uChiave ? uChiave.split("/")[1] : await domanda("unita", "Cartella dell'unità", { predefinita: slug(uNome), valida: validaSlug });
    if (validaSlug(s)) throw new Error("--unita: " + validaSlug(s));
    uChiave = c.id + "/" + s;
  }

  // attività
  const titolo = await domanda("titolo", "Titolo dell'attività", { valida: senzaTrattinoLungo });
  const nome = await domanda("nome", "Cartella dell'attività", {
    predefinita: slug(titolo),
    valida: v => validaSlug(v) || (fs.existsSync(F(uChiave + "/" + v)) ? "esiste già: scegliete un altro nome" : "")
  });
  const tipo = await scelta("tipo", "Tipo di attività:", [
    ["giochi", "A schede con i giochi comuni (come Informatica 1): smistamento, riordino, quiz, sfida, risultato"],
    ["lim", "Con un layout proprio, pensata per la LIM (come il BEP o Che struttura è?)"]
  ], { predefinita: "1" });
  if (!["giochi", "lim"].includes(tipo)) throw new Error("--tipo: giochi oppure lim");
  const modalita = await scelta("modalita", "Come si gioca:", MODALITA.map(m => [m]), { predefinita: tipo === "lim" ? "5" : "1" });
  if (!MODALITA.includes(modalita)) throw new Error("--modalita: una tra " + MODALITA.join(", "));
  const icona = await domanda("icona", "Icona (" + ICONE.join(", ") + ")", { predefinita: "pencil", valida: v => ICONE.includes(v) ? "" : "un nome tra quelli elencati" });
  const descrizione = await domanda("descrizione", "Descrizione per l'elenco (una frase)", { valida: senzaTrattinoLungo });
  const a = { percorso: uChiave + "/" + nome, titolo, nome, tipo, modalita, icona, descrizione };

  // riepilogo
  const nuovi = [], file = [];
  if (nuovoCorso) { nuovi.push(c.id); file.push(c.id + "/index.html"); }
  if (nuovaUnita) { nuovi.push(uChiave); file.push(uChiave + "/index.html"); }
  nuovi.push(a.percorso); file.push(a.percorso + "/index.html");
  console.log("\nSto per creare:\n  " + file.join("\n  ") + "\ne aggiornare assets/catalogo.js, sitemap.xml e README.md.");
  if (!OPZ.si) {
    const ok = await chiedi("Procedo? [S/n] ");
    if (/^n/i.test(ok)) { console.log("Niente di fatto."); if (rl) rl.close(); return; }
  }

  if (nuovoCorso) scrivi(c.id + "/index.html", paginaCorso(c));
  if (nuovaUnita) scrivi(uChiave + "/index.html", paginaUnita(c, uChiave.split("/")[1], uNome));
  scrivi(a.percorso + "/index.html", tipo === "giochi" ? paginaGiochi(a) : paginaLim(a));
  aggiornaCatalogo({ c, nuovoCorso, uChiave, uNome, nuovaUnita, a, W });
  aggiornaSitemap(nuovi);
  const avviso = aggiornaReadme({ c, uNome, a, nuovoCorso, W });
  if (rl) rl.close();

  console.log(`
Fatto. Adesso:
  1. Aprite ${a.percorso}/index.html nel browser (doppio clic): funziona già, con dati di esempio.
  2. Cercate "DA SCRIVERE" nella pagina e mettete testi e dati della lezione.${tipo === "giochi" ? `
     I giochi disponibili sono descritti in testa a assets/giochi.js.` : ""}
  3. Controlli: cd tests, poi npm test.${tipo === "giochi" ? ` Quando la pagina è pronta, npm run fotografia:aggiorna
     la fa entrare nella fotografia dei giochi.` : ""}
  4. Commit e push.${avviso ? "\n  " + avviso : ""}`);
}

if (require.main === module) main().catch(e => { if (rl) rl.close(); console.error("\nErrore: " + e.message); process.exitCode = 1; });
module.exports = { paginaCorso, paginaUnita };  // per i controlli (tests/nuova.js)
