// Salvataggi nel formato dei primi giorni, nomi con caratteri HTML, alcune schermate di controllo.
const { OUT, server, watch, chromium, fine } = require("./comune");
const path = require("path");
(async () => {
  const { s, base } = await server();
  const browser = await chromium.launch();
  const errs = [], fails = [];
  const ok = (c, m) => { if (!c) fails.push(m); };
  // 1) vecchio formato salvato ieri: {st:{g, ms:{pts,t,label}}, nomi}
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage(); watch(page, errs, "migrazione");
    const p = "informatica-1/computer-e-codici/numeri-e-basi";
    await page.goto(base);
    await page.evaluate(k => localStorage.setItem(k, JSON.stringify({ v: 1, t: 1, d: {
      st: { g: { "Caccia all'errore": { ok: 3, tot: 4 }, "Memory delle equivalenze": { ok: 0, tot: 0 } }, ms: { pts: 7, t: "01:02", label: "Missione" } },
      nomi: ["Ada", "Bruno"] } })), "tg-progressi:" + p);
    await page.goto(base + p + "/#s3");
    const st = await page.evaluate(() => JSON.stringify(ST));
    ok(/"Missione finale":\{"pts":7,"t":"01:02","count":10\}/.test(st), "migrazione: " + st);
    ok((await page.textContent("#hunt .stat")) === "Trovati: 3 su 4", "contatore caccia: " + await page.textContent("#hunt .stat"));
    ok(/Tocca a <b>(Ada|Bruno)<\/b>/.test(await page.innerHTML("#hunt")), "nomi nel turno");
    await page.screenshot({ path: path.join(OUT, "v_migrazione_s3.png") });
    await page.evaluate(() => go("res"));
    await page.screenshot({ path: path.join(OUT, "v_migrazione_res.png"), fullPage: true });
    ok((await page.textContent("#restab")).includes("Missione finale7 su 10 in 01:02"), "riga missione: " + await page.textContent("#restab"));
    // nomi con caratteri HTML: niente iniezione
    await page.evaluate(() => go("inizio"));
    await page.fill("#n1", "<i>x</i>");
    await page.evaluate(() => go("s3"));
    await page.click("#hn");
    ok(!(await page.$("#hunt .turn i")), "il nome è finito come HTML");
    await ctx.close();
  }
  // 2) screenshot: pagina a schede semplici e Palestra, 1280 e 390
  for (const [w, h] of [[1280, 800], [390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage(); watch(page, errs, "vis" + w);
    await page.goto(base + "informatica-1/computer-e-codici/aritmetica-binaria/#s2");
    await page.screenshot({ path: path.join(OUT, `v_aritmetica_${w}.png`) });
    await page.goto(base + "informatica-1/computer-e-codici/palestra-dei-numeri/#num_s4");
    await page.screenshot({ path: path.join(OUT, `v_palestra_mem_${w}.png`) });
    await page.goto(base + "informatica-1/sistemi-operativi/storia-e-licenze/#st1");
    await page.screenshot({ path: path.join(OUT, `v_storia_${w}.png`) });
    await page.goto(base + "informatica-1/computer-e-codici/palestra-dei-numeri/#res");
    await page.screenshot({ path: path.join(OUT, `v_palestra_res_${w}.png`), fullPage: true });
    await ctx.close();
  }
  await browser.close(); s.close();
  fine(errs, fails, "migrazione e nomi");
})();
