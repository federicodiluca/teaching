// Schermate di controllo (in tests/risultati, e come artefatto su GitHub Actions): tutte le pagine in scuro (predefinito) e chiaro, 1280 e 390; stati di gioco; provini.
const { OUT, catalogo, server, watch, fine, chromium } = require("./comune");
const path = require("path"), fs = require("fs");

async function provini(browser, files, nome, cols, w) {
  const page = await browser.newPage({ viewport: { width: cols * w + (cols + 1) * 8, height: 800 } });
  const html = `<body style="margin:0;background:#888;display:grid;grid-template-columns:repeat(${cols},${w}px);gap:8px;padding:8px;font:12px sans-serif">` +
    files.map(f => `<figure style="margin:0"><img style="width:${w}px;display:block" src="file:///${f.replace(/\\/g, "/")}"><figcaption>${path.basename(f)}</figcaption></figure>`).join("") + "</body>";
  const tmp = path.join(OUT, "_prov.html"); fs.writeFileSync(tmp, html);
  await page.goto("file:///" + tmp.replace(/\\/g, "/")); await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, nome), fullPage: true }); await page.close();
}

(async () => {
  const { s, base } = await server();
  const browser = await chromium.launch();
  const errs = [], shots = { d1280: [], l1280: [], d390: [], extra: [] };
  const pagine = ["", "informatica-1/", "gpoi/aziende-e-mercati/", ...catalogo().map(p => p + "/")];
  for (const [tema, w, h, k] of [["dark", 1280, 800, "d1280"], ["light", 1280, 800, "l1280"], ["dark", 390, 844, "d390"]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: "light" });
    if (tema === "light") await ctx.addInitScript(() => { try { localStorage.setItem("tg-tema", "light"); } catch (e) {} });
    for (const p of pagine) {
      const page = await ctx.newPage(); watch(page, errs, `[${tema}${w}] ${p}`);
      await page.goto(base + p); await page.waitForTimeout(250);
      const f = path.join(OUT, `z_${k}_${(p.split("/").filter(Boolean).pop() || "home")}.png`);
      await page.screenshot({ path: f }); shots[k].push(f); await page.close();
    }
    await ctx.close();
  }
  // stati di gioco, in scuro (predefinito) e uno in chiaro
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage(); watch(page, errs, "[stati]");
  const snap = async n => { const f = path.join(OUT, "z_x_" + n + ".png"); await page.screenshot({ path: f }); shots.extra.push(f); };
  await page.goto(base + "informatica-1/computer-e-codici/numeri-e-basi/#s3"); await page.waitForTimeout(200);
  await page.click("#hunt button.line >> nth=0"); await snap("caccia");
  await page.goto(base + "informatica-1/computer-e-codici/numeri-e-basi/#s4"); await page.waitForTimeout(200);
  await page.click("#mem .tile >> nth=0"); await page.click("#mem .tile >> nth=1"); await snap("memory");
  await page.goto(base + "informatica-1/computer-e-codici/numeri-e-basi/#s2"); await page.waitForTimeout(200);
  await page.click("#all [data-a=c]"); await page.click("#all [data-a=s]"); await snap("allenatore");
  await page.goto(base + "informatica-1/sistemi-operativi/storia-e-licenze/#st1"); await page.waitForTimeout(200);
  await page.click("#ov"); await snap("riordino");
  await page.goto(base + "informatica-1/reti/la-rete-e-i-suoi-pezzi/#c2"); await page.waitForTimeout(200);
  await page.click(".pool .chip >> nth=0"); await snap("smistamento");
  await page.goto(base + "informatica-1/reti/la-rete-e-i-suoi-pezzi/#res"); await page.waitForTimeout(200); await snap("risultato");
  await page.goto(base + "informatica-1/computer-e-codici/immagini-e-video/#s1"); await page.waitForTimeout(200); await snap("pixel");
  await page.goto(base + "informatica-1/computer-e-codici/logica-e-tavole-di-verita/#s1"); await page.waitForTimeout(200); await snap("tavole");
  await page.goto(base + "gpoi/aziende-e-mercati/bep/"); await page.waitForTimeout(300); await snap("bep_grafico");
  await page.click(".tg-bar [data-a=tema]"); await page.waitForTimeout(300); await snap("bep_grafico_chiaro");
  await page.click(".tg-bar [data-a=tema]"); await page.waitForTimeout(200);
  await page.goto(base + "gpoi/aziende-e-mercati/bep/#p2"); await page.waitForTimeout(300); await snap("bep_consiglio");
  await page.goto(base + "gpoi/organizzazione-d-impresa/che-struttura-e/"); await page.waitForTimeout(300);
  const ok = await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /inizia|comincia|via|avanti/i.test(x.textContent)); if (b) { b.click(); return b.textContent; } return null; });
  await page.waitForTimeout(300); await snap("che_1");
  await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /rivela|soluzione|mostra/i.test(x.textContent)); if (b) b.click(); });
  await page.waitForTimeout(300); await page.evaluate(() => window.scrollTo(0, 400)); await snap("che_svg");
  await page.goto(base + "tpsit-4/processi-sequenziali-e-paralleli/processi-e-thread/#holt"); await page.waitForTimeout(300); await snap("tp_holt");
  await page.goto(base + "tpsit-4/processi-sequenziali-e-paralleli/processi-e-thread/#stati"); await page.waitForTimeout(300); await snap("tp_stati");
  await ctx.close();
  await provini(browser, shots.d1280, "P_scuro_1280.png", 4, 420);
  await provini(browser, shots.l1280, "P_chiaro_1280.png", 4, 420);
  await provini(browser, shots.d390, "P_scuro_390.png", 8, 190);
  await provini(browser, shots.extra, "P_stati.png", 4, 420);
  await browser.close(); s.close();
  fine(errs, [], "schermate");
})();
