// Fotografia del comportamento delle attività tg-act: con Math.random e l'ora fissati, ogni pagina genera
// sempre gli stessi esercizi. Si registra il testo di ogni scheda prima e dopo aver giocato (tutti i tipi
// di gioco) e lo si confronta con tests/fotografia.json: così un cambio al motore che altera i giochi si vede.
// Dopo un cambio voluto ai testi o ai giochi: npm run fotografia:aggiorna (e si controlla il diff del json).
const { catalogo, server, watch, chromium, fine } = require("./comune");
const fs = require("fs"), path = require("path");
const RIF = path.join(__dirname, "fotografia.json"), AGGIORNA = process.argv.includes("--aggiorna");

async function gioca(page, id) {
  return page.evaluate(id => {
    go(id);
    const sec = document.getElementById(id), fatto = [];
    const vis = el => el && el.offsetParent !== null;
    [...sec.querySelectorAll('[data-a="c"]')].filter(vis).slice(0, 2).forEach(b => { b.click(); fatto.push("controlla"); });
    const pool = sec.querySelector(".pool"), bk = [...sec.querySelectorAll(".bk")];
    if (pool && bk.length) {
      for (let g = 0; g < 200 && pool.querySelector(".chip"); g++) {
        const c = pool.querySelector(".chip");
        for (const b of bk) { if (c.parentNode !== pool) break; c.click(); b.click(); }
      }
      fatto.push("smistamento");
    }
    const ord = sec.querySelector("#ov"); if (ord && !ord.disabled) { ord.click(); fatto.push("ordine"); }
    const hl = sec.querySelector("button.line"); if (hl) { hl.click(); fatto.push("caccia"); }
    const tiles = [...sec.querySelectorAll(".tile")]; if (tiles.length) { tiles[0].click(); tiles[1].click(); fatto.push("memory"); }
    const ms = sec.querySelector("#ms-s");
    if (ms && !ms.disabled) {
      ms.click();
      for (let k = 0; k < 40; k++) {
        const c = sec.querySelector("#c"), n = sec.querySelector("#n");
        if (!c) break;
        c.click(); if (n) n.click();
      }
      fatto.push("missione");
    }
    return fatto;
  }, id);
}

(async () => {
  const { s, base } = await server();
  const browser = await chromium.launch();
  const errs = [], foto = {};
  for (const p of catalogo().filter(p => p.startsWith("informatica-1"))) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await ctx.addInitScript(() => {
      let a = 12345;
      Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
      const t0 = 1763560000000; Date.now = () => t0;
    });
    const page = await ctx.newPage();
    watch(page, errs, p);
    await page.goto(base + p + "/");
    const f = { nav: [], sez: {}, dopo: {}, giocati: {} };
    const ids = await page.$$eval("main section[id]", a => a.map(x => x.id));
    for (const id of ids) {
      f.sez[id] = await page.evaluate(id => { go(id); return { nav: document.querySelector("nav").innerText, testo: document.getElementById(id).innerText }; }, id);
    }
    await page.evaluate(id => go(id), ids[0]);
    await page.fill("#n1", "Ada"); if (await page.$("#n2")) await page.fill("#n2", "Bruno");
    for (const id of ids) if (id !== "inizio" && id !== "res") f.giocati[id] = await gioca(page, id);
    for (const id of ids) f.dopo[id] = await page.evaluate(id => { go(id); return document.getElementById(id).innerText; }, id);
    f.st = await page.evaluate(() => JSON.stringify(ST, (k, v) => k === "done" ? undefined : v));
    foto[p] = f;
    await ctx.close();
  }
  await browser.close(); s.close();
  const fails = [];
  if (AGGIORNA || !fs.existsSync(RIF)) {
    fs.writeFileSync(RIF, JSON.stringify(foto, null, 1) + "\n");
    console.log("Riferimento aggiornato:", RIF);
  } else {
    const rif = JSON.parse(fs.readFileSync(RIF, "utf8"));
    const diff = (x, y) => {
      const X = x.split("\n"), Y = y.split("\n"), o = [];
      for (let i = 0; i < Math.max(X.length, Y.length); i++) if (X[i] !== Y[i]) o.push("    era:  " + X[i] + "\n    ora:  " + Y[i]);
      return o.slice(0, 4).join("\n");
    };
    for (const p of new Set([...Object.keys(rif), ...Object.keys(foto)])) {
      const A = rif[p], B = foto[p], nome = p.split("/").pop();
      if (!A || !B) { fails.push(`${nome}: pagina ${A ? "sparita" : "nuova"} (se è voluto: npm run fotografia:aggiorna)`); continue; }
      for (const k of ["sez", "dopo"]) for (const id of Object.keys(A[k])) {
        const x = k === "sez" ? A[k][id].testo : A[k][id], y = B[k][id] === undefined ? "(manca)" : k === "sez" ? B[k][id].testo : B[k][id];
        if (x !== y) fails.push(`${nome} #${id} (${k === "sez" ? "all'apertura" : "dopo aver giocato"})
${diff(x, y)}`);
        if (k === "sez" && B.sez[id] && A.sez[id].nav !== B.sez[id].nav) fails.push(`${nome} #${id}: schede diverse
${diff(A.sez[id].nav, B.sez[id].nav)}`);
      }
      if (A.st !== B.st) fails.push(`${nome}: punteggi diversi dopo aver giocato
    era:  ${A.st.slice(0, 200)}
    ora:  ${B.st.slice(0, 200)}`);
    }
  }
  fine(errs, fails, "fotografia");
})();
