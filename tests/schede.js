// Schede da stampare: in ogni attività a schede ogni gioco annotato produce il suo pezzo di foglio,
// le soluzioni ci sono (e si tolgono), "Altra versione" cambia gli esercizi, Stampa chiama la stampa,
// e in stampa resta solo il foglio. Le attività da LIM non hanno il pulsante.
const { OUT, catalogo, server, watch, chromium, fine } = require("./comune");
const path = require("path");

(async () => {
  const { s, base } = await server();
  const browser = await chromium.launch();
  const errs = [], fails = [];
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => { window.__stampe = 0; window.print = () => { window.__stampe++; }; });
  let voci = 0;
  for (const p of catalogo()) {
    const page = await ctx.newPage();
    watch(page, errs, p);
    await page.goto(base + p + "/");
    await page.waitForTimeout(150);
    const act = await page.evaluate(() => document.body.classList.contains("tg-act"));
    const btn = await page.$('.tg-bar [data-a="scheda"]');
    if (!act) { if (btn) fails.push(p + ": pulsante Scheda in un'attività da LIM"); await page.close(); continue; }
    if (!btn) { fails.push(p + ": manca il pulsante Scheda"); await page.close(); continue; }
    await btn.click();
    await page.waitForSelector(".tg-sch-foglio");
    const n = await page.$$eval(".tg-sch-voci input[data-i]", a => a.length);
    voci += n;
    // con le scelte di partenza c'è almeno un esercizio e ci sono le soluzioni
    const base1 = await page.evaluate(() => ({ es: document.querySelectorAll(".tg-sch-foglio .tg-sch-es").length, sol: document.querySelectorAll(".tg-sch-sol li").length, html: document.querySelector(".tg-sch-foglio").innerHTML,
      nascosti: [...document.querySelectorAll(".tg-sch-foglio .tg-sch-es, .tg-sch-sol")].filter(e => !e.offsetHeight).length }));
    if (base1.nascosti) fails.push(`${p}: ${base1.nascosti} pezzi del foglio non si vedono`);
    if (!base1.es || base1.sol < base1.es) fails.push(`${p}: foglio di partenza ${base1.es} esercizi, ${base1.sol} soluzioni`);
    // ogni gioco da solo
    for (let i = 0; i < n; i++) {
      const r = await page.evaluate(i => {
        document.querySelectorAll(".tg-sch-voci input[data-i]").forEach(cb => { cb.checked = +cb.dataset.i === i; });
        const q = document.querySelector(`[data-q="${i}"]`); if (q) q.value = "3";
        const l = document.querySelector(`[data-l="${i}"]`); if (l) l.value = "3";
        document.querySelector(".tg-sch-opz").dispatchEvent(new Event("change"));
        return { titolo: document.querySelector(`.tg-sch-voci input[data-i="${i}"]`).closest("label").textContent.trim(),
          es: document.querySelectorAll(".tg-sch-foglio .tg-sch-es").length, sol: document.querySelectorAll(".tg-sch-sol li").length,
          vuoti: [...document.querySelectorAll(".tg-sch-foglio .q")].filter(x => !x.textContent.trim()).length,
          und: !/\/javascript\//.test(location.pathname) && /undefined|NaN|\[object/.test(document.querySelector(".tg-sch-foglio").textContent) /* nelle pagine di JavaScript undefined e NaN sono contenuto */ };
      }, i);
      if (!r.es || r.sol !== r.es || r.vuoti || r.und) fails.push(`${p}: «${r.titolo}» ${JSON.stringify(r)}`);
    }
    // altra versione, soluzioni, stampa
    await page.evaluate(() => { document.querySelectorAll(".tg-sch-voci input[data-i]").forEach((cb, i) => { cb.checked = i < 3; }); document.querySelector(".tg-sch-opz").dispatchEvent(new Event("change")); });
    const v1 = await page.innerHTML(".tg-sch-foglio");
    let diversa = false;
    for (let k = 0; k < 4 && !diversa; k++) { await page.click('.tg-sch [data-a="nuova"]'); diversa = (await page.innerHTML(".tg-sch-foglio")) !== v1; }
    if (!diversa) fails.push(p + ": Altra versione non cambia nulla");
    await page.click('.tg-sch [data-a="sol"]');
    if (await page.$(".tg-sch-sol")) fails.push(p + ": le soluzioni non si tolgono");
    await page.click('.tg-sch [data-a="sol"]');
    await page.click('.tg-sch [data-a="stampa"]');
    if ((await page.evaluate(() => window.__stampe)) !== 1) fails.push(p + ": Stampa non stampa");
    const nome = p.split("/").pop();
    await page.screenshot({ path: path.join(OUT, `s_${nome}_schermo.png`) });
    await page.emulateMedia({ media: "print" });
    const vis = await page.evaluate(() => ({
      altro: [...document.body.children].filter(e => !e.classList.contains("tg-sch") && getComputedStyle(e).display !== "none" && e.tagName !== "SCRIPT").map(e => e.tagName + "." + e.className),
      opz: getComputedStyle(document.querySelector(".tg-sch-opz")).display
    }));
    if (vis.altro.length || vis.opz !== "none") fails.push(`${p}: in stampa si vede altro ${JSON.stringify(vis)}`);
    await page.screenshot({ path: path.join(OUT, `s_${nome}_stampa.png`), fullPage: true });
    await page.emulateMedia({ media: "screen" });
    await page.keyboard.press("Escape");
    if (await page.$(".tg-sch")) fails.push(p + ": Esc non chiude");
    if (await page.evaluate(() => document.body.classList.contains("tg-sch-aperta"))) fails.push(p + ": la pagina resta bloccata");
    await page.close();
  }
  // telefono
  const c2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pg = await c2.newPage();
  watch(pg, errs, "390");
  await pg.goto(base + "informatica-1/computer-e-codici/numeri-e-basi/");
  await pg.click('.tg-bar [data-a="scheda"]');
  await pg.waitForSelector(".tg-sch-foglio .tg-sch-es", { state: "attached" });
  if (await pg.evaluate(() => document.documentElement.scrollWidth > innerWidth)) fails.push("390: scorrimento orizzontale");
  await pg.screenshot({ path: path.join(OUT, "s_390.png") });
  await c2.close();
  console.log(voci, "giochi annotati per le schede");
  await browser.close(); s.close();
  fine(errs, fails, "schede");
})();
