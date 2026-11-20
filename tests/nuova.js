// npm run nuova: su una copia del sito crea corsi, unità e attività e controlla che tutto torni
// (catalogo in ordine, sitemap, README, link, pagine che si aprono e si giocano senza errori).
const fs = require("fs"), os = require("os"), path = require("path"), vm = require("vm"), { spawnSync } = require("child_process");
const VERO = path.resolve(__dirname, "..");
const COPIA = path.join(os.tmpdir(), "teaching-nuova-" + process.pid);  // si cancella alla fine se tutto va bene
process.env.TG_RADICE = COPIA;  // server e controlli di comune.js lavorano sulla copia
const { OUT, server, watch, chromium, fine } = require("./comune");
const { paginaCorso, paginaUnita } = require("../strumenti/nuova.js");

const fails = [], errs = [];
const leggi = f => fs.readFileSync(path.join(COPIA, f), "utf8");
const lf = s => s.replace(/\r\n/g, "\n");
function catalogo(dir) {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(dir, "assets/catalogo.js"), "utf8"), ctx);
  return ctx.window;
}
function nuova(args) {
  return spawnSync(process.execPath, [path.join(COPIA, "strumenti/nuova.js"), "--radice", COPIA, "--si", ...args],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

// 1) i modelli delle pagine di corso e di unità sono quelli delle pagine vere
const W0 = catalogo(VERO);
for (const c of W0.CORSI) {
  if (lf(fs.readFileSync(path.join(VERO, c.id, "index.html"), "utf8")) !== paginaCorso(c)) fails.push("modello del corso diverso da " + c.id + "/index.html");
}
for (const k of Object.keys(W0.UNITA)) {
  const c = W0.CORSI.find(x => k.startsWith(x.id + "/"));
  if (lf(fs.readFileSync(path.join(VERO, k, "index.html"), "utf8")) !== paginaUnita(c, k.split("/")[1], W0.UNITA[k])) fails.push("modello dell'unità diverso da " + k + "/index.html");
}

// 2) copia del sito e quattro attività nuove
fs.rmSync(COPIA, { recursive: true, force: true });
fs.cpSync(VERO, COPIA, { recursive: true, filter: s => !/[\\/](\.git|node_modules|risultati)([\\/]|$)/.test(path.relative(VERO, s)) });
const CASI = [
  ["informatica-2/reti-e-protocolli/il-modello-iso-osi", ["--corso", "informatica-2", "--corso-nome", "Informatica", "--anno", "2° anno", "--colore", "#b45309", "--corso-icona", "cpu",
    "--unita", "reti-e-protocolli", "--unita-nome", "Reti e protocolli", "--titolo", "Il modello ISO/OSI", "--tipo", "lim",
    "--modalita", "alla lavagna", "--icona", "network", "--descrizione", "I sette livelli raccontati alla lavagna."]],
  ["informatica-2/reti-e-protocolli/indirizzi-e-sottoreti", ["--corso", "informatica-2", "--unita", "reti-e-protocolli", "--titolo", "Indirizzi e sottoreti",
    "--tipo", "giochi", "--modalita", "a coppie", "--icona", "globe", "--descrizione", "Maschere e sottoreti, a coppie."]],
  ["informatica-1/reti/prova-di-rete", ["--corso", "informatica-1", "--unita", "reti", "--titolo", "Prova di rete",
    "--tipo", "giochi", "--modalita", "da soli", "--icona", "network", "--descrizione", "Una prova da soli."]],
  ["gpoi/mercati-digitali/l-e-commerce", ["--corso", "gpoi", "--unita", "mercati-digitali", "--unita-nome", "Mercati digitali",
    "--titolo", "L'e-commerce", "--tipo", "giochi", "--modalita", "a squadre", "--icona", "building", "--descrizione", "Negozi online a confronto."]]
];
for (const [p, args] of CASI) {
  const r = nuova(args);
  if (r.status !== 0) fails.push(`nuova ${p}: uscita ${r.status} ${r.stderr}`);
  if (!fs.existsSync(path.join(COPIA, p, "index.html"))) fails.push(`nuova ${p}: pagina non creata`);
}
// errori: cartella che esiste già, trattino lungo; in entrambi i casi non si tocca niente
const prima = leggi("assets/catalogo.js");
for (const [nome, args] of [
  ["cartella esistente", ["--corso", "informatica-1", "--unita", "reti", "--titolo", "Prova di rete", "--tipo", "giochi", "--modalita", "da soli", "--icona", "network", "--descrizione", "x"]],
  ["trattino lungo", ["--corso", "informatica-1", "--unita", "reti", "--titolo", "Reti — ripasso", "--tipo", "giochi", "--modalita", "da soli", "--icona", "network", "--descrizione", "x"]],
  ["icona sconosciuta", ["--corso", "informatica-1", "--unita", "reti", "--titolo", "Altra prova", "--tipo", "giochi", "--modalita", "da soli", "--icona", "nessuna", "--descrizione", "x"]]
]) {
  const r = nuova(args);
  if (r.status === 0) fails.push("errore non segnalato: " + nome);
  if (leggi("assets/catalogo.js") !== prima) fails.push("catalogo toccato nonostante l'errore: " + nome);
}

// 3) catalogo, sitemap e README
const W = catalogo(COPIA);
const ids = W.CORSI.map(c => c.id).join(",");
if (ids !== "informatica-1,informatica-2,tpsit-3,tpsit-4,tpsit-5,gpoi") fails.push("ordine dei corsi: " + ids);
const uk = Object.keys(W.UNITA);
const ultimaI1 = uk.filter(u => u.startsWith("informatica-1/")).pop();
if (uk.indexOf("informatica-2/reti-e-protocolli") !== uk.indexOf(ultimaI1) + 1) fails.push("unità di Informatica 2 fuori posto: " + uk.join(", "));
if (uk[uk.length - 1] !== "gpoi/mercati-digitali") fails.push("unità di GPOI fuori posto: " + uk.join(", "));
const ps = W.CATALOGO.map(a => a.percorso);
const pos = p => ps.indexOf(p);
if (pos("informatica-1/reti/prova-di-rete") !== pos("informatica-1/reti/web-ricerca-e-sicurezza") + 1) fails.push("Prova di rete fuori posto");
if (pos("informatica-2/reti-e-protocolli/il-modello-iso-osi") !== pos(ps.filter(p => p.startsWith("informatica-1/")).pop()) + 1) fails.push("ISO/OSI fuori posto");
if (pos("informatica-2/reti-e-protocolli/indirizzi-e-sottoreti") !== pos("informatica-2/reti-e-protocolli/il-modello-iso-osi") + 1) fails.push("Sottoreti fuori posto");
if (ps[ps.length - 1] !== "gpoi/mercati-digitali/l-e-commerce") fails.push("e-commerce fuori posto");
const voce = W.CATALOGO.find(a => a.percorso === "gpoi/mercati-digitali/l-e-commerce");
if (!voce || voce.titolo !== "L'e-commerce" || voce.modalita !== "a squadre" || voce.icona !== "building") fails.push("voce del catalogo: " + JSON.stringify(voce));
const sm = leggi("sitemap.xml");
for (const p of ["informatica-2", "informatica-2/reti-e-protocolli", "gpoi/mercati-digitali", ...CASI.map(c => c[0])])
  if ((sm.match(new RegExp("/" + p + "/</loc>", "g")) || []).length !== 1) fails.push("sitemap: " + p);
const tab = leggi("README.md").split("\n").filter(r => r.startsWith("|"));
const riga = s => tab.findIndex(r => r.includes(s));
if (!tab.some(r => r === "| Informatica, 2° anno | Reti e protocolli | Il modello ISO/OSI · Indirizzi e sottoreti |")) fails.push("README: riga di Informatica 2");
if (!(riga("Informatica, 2° anno") > riga("| Arduino |") && riga("Informatica, 2° anno") < riga("TPSIT, 3° anno"))) fails.push("README: Informatica 2 fuori posto");
if (!tab.some(r => / \| Reti di calcolatori \| .* · Prova di rete \|$/.test(r))) fails.push("README: Prova di rete");
if (!tab.some(r => r === "| | Mercati digitali | L'e-commerce |")) fails.push("README: riga di Mercati digitali");

// 4) link-rotti sulla copia (catalogo, pagine, sitemap allineati)
const lr = spawnSync(process.execPath, [path.join(__dirname, "link-rotti.js")], { encoding: "utf8", env: process.env });
if (lr.status !== 0) fails.push("link-rotti sulla copia:\n" + lr.stdout);

// 5) le pagine nuove si aprono e funzionano
(async () => {
  const { s, base } = await server();
  const browser = await chromium.launch();
  for (const [vw, tema] of [[1280, "dark"], [390, "light"]]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vw === 390 ? 844 : 800 } });
    await ctx.addInitScript(t => { try { localStorage.setItem("tg-tema", t); } catch (e) {} }, tema);
    const apri = async (p, label) => {
      const page = await ctx.newPage();
      watch(page, errs, `[${vw}] ${label}`);
      await page.goto(base + p);
      await page.waitForTimeout(150);
      return page;
    };
    // home: Informatica 2 prima di TPSIT 4
    let page = await apri("", "home");
    const home = await page.textContent("main");
    if (!home.includes("Il modello ISO/OSI") || home.indexOf("2° anno") > home.indexOf("4° anno")) fails.push(`[${vw}] home: Informatica 2 assente o fuori posto`);
    await page.close();
    for (const p of ["informatica-2/", "informatica-2/reti-e-protocolli/", "gpoi/mercati-digitali/"]) {
      page = await apri(p, p);
      if (!(await page.$$("main#elenco a.tg-card")).length) fails.push(`[${vw}] ${p}: nessuna attività nell'elenco`);
      await page.close();
    }
    // da LIM
    page = await apri("informatica-2/reti-e-protocolli/il-modello-iso-osi/", "lim");
    if (!(await page.$(".tg-bar"))) fails.push(`[${vw}] lim: manca la barra`);
    if ((await page.textContent("#pos")) !== "1 / 2") fails.push(`[${vw}] lim: posizione iniziale`);
    await page.click("#succ");
    if ((await page.textContent("#pos")) !== "2 / 2") fails.push(`[${vw}] lim: Avanti`);
    await page.keyboard.press("ArrowLeft");
    if ((await page.textContent("#pos")) !== "1 / 2") fails.push(`[${vw}] lim: freccia sinistra`);
    await page.screenshot({ path: path.join(OUT, `n_lim_${vw}.png`), fullPage: true });
    await page.close();
    // a schede con i giochi: a coppie e da soli
    for (const [p, coppie] of [["informatica-2/reti-e-protocolli/indirizzi-e-sottoreti/", true], ["informatica-1/reti/prova-di-rete/", false]]) {
      page = await apri(p, p);
      const st = await page.evaluate(() => ({
        gruppi: [...document.querySelectorAll("#nv1 button")].map(b => b.textContent.trim()).join(","),
        n2: !!document.querySelector("#n2"), turni: document.querySelectorAll(".turn").length
      }));
      if (st.gruppi !== "Inizio,Giochi,Quiz,Sfida finale,Risultato") fails.push(`[${vw}] ${p}: schede ${st.gruppi}`);
      if (st.n2 !== coppie || !!st.turni !== coppie) fails.push(`[${vw}] ${p}: modalità ${JSON.stringify(st)}`);
      await page.evaluate(() => go("g1"));
      await page.click("#srt .pool .card >> nth=0").catch(() => {});
      await page.evaluate(() => go("fin"));
      await page.click("#ms-s");
      const dom = await page.textContent("#ms-x .stat");
      if (!/Domanda 1 di 4/.test(dom)) fails.push(`[${vw}] ${p}: sfida «${dom}»`);
      await page.screenshot({ path: path.join(OUT, `n_giochi_${coppie ? "coppie" : "soli"}_${vw}.png`), fullPage: true });
      await page.click('#nv1 [data-s="res"]');
      if (!(await page.$$("#restab tr")).length) fails.push(`[${vw}] ${p}: risultato vuoto`);
      await page.close();
    }
    await ctx.close();
  }
  await browser.close(); s.close();
  if (!fails.length && !errs.length) fs.rmSync(COPIA, { recursive: true, force: true });
  else console.log("Copia di prova lasciata in " + COPIA);
  fine(errs, fails, "nuova");
})();
