// Link diretti alle schede (#id): apertura, indirizzo che segue la scheda, cronologia, tasto Indietro, BEP, file://.
const { REPO, OUT, catalogo, server, decodePng, watch, chromium, fine } = require("./comune");
const path = require("path");

(async () => {
  const { s, base } = await server();
  const browser = await chromium.launch();
  const errs = [], fails = [];
  const ok = (c, m) => { if (!c) fails.push(m); };
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const act = catalogo().filter(p => p.startsWith("informatica-1"));
  let nSez = 0;
  for (const p of act) {
    const page = await ctx.newPage();
    watch(page, errs, p);
    await page.goto(base + p + "/");
    const ids = await page.$$eval("main section[id][data-t]", a => a.map(x => x.id));
    const all = await page.$$eval("section", a => a.length);
    ok(ids.length === all && ids.length > 2, `${p}: sezioni con id/data-t ${ids.length} su ${all}`);
    // 1) apertura diretta di ogni sezione
    for (const id of ids) {
      await page.goto("about:blank");
      await page.goto(base + p + "/#" + id);
      const st = await page.evaluate(id => ({
        on: [...document.querySelectorAll("section.on")].map(x => x.id),
        btn: [...document.querySelectorAll("nav button.on")].map(b => b.dataset.s),
        hash: location.hash
      }), id);
      nSez++;
      const exp = id === ids[0] ? "" : "#" + id;
      ok(st.on.length === 1 && st.on[0] === id, `${p}#${id}: sezione aperta ${st.on}`);
      ok(st.btn.includes(id) || st.btn.length >= 1, `${p}#${id}: pulsante ${st.btn}`);
      ok(st.hash === exp || (id === ids[0] && st.hash === "#" + id), `${p}#${id}: hash ${st.hash}`);
    }
    // sottoscheda: il pulsante sub giusto è acceso
    const sub = await page.evaluate(() => { const s = [...document.querySelectorAll("section[data-g]")].find((x, i, a) => a.filter(y => y.dataset.g === x.dataset.g).indexOf(x) === 1); return s ? s.id : null; });
    if (sub) {
      await page.goto("about:blank"); await page.goto(base + p + "/#" + sub);
      const b = await page.$$eval("nav button.sub.on", a => a.map(x => x.dataset.s));
      ok(b.length === 1 && b[0] === sub, `${p}#${sub}: sottoscheda accesa ${b}`);
      await page.screenshot({ path: path.join(OUT, "l_" + p.split("/").pop() + "_sub.png") });
    }
    // 2) clic sulle schede: l'indirizzo segue, la cronologia non cresce
    await page.goto(base + p + "/");
    const h0 = await page.evaluate(() => history.length);
    for (const id of ids.slice(1, 5)) {
      await page.evaluate(id => go(id), id);  // equivalente al clic: il clic chiama go
      ok((await page.evaluate(() => location.hash)) === "#" + id, `${p}: dopo go(${id}) hash errato`);
    }
    await page.click('nav button[data-s="res"]');
    ok((await page.evaluate(() => location.hash)) === "#res", `${p}: clic su Risultato non aggiorna l'hash`);
    await (await page.$$("nav button"))[0].click();
    ok((await page.evaluate(() => location.hash)) === "", `${p}: tornando a Inizio l'hash resta`);
    ok((await page.evaluate(() => history.length)) === h0, `${p}: la cronologia è cresciuta`);
    // 3) hash scritto a mano
    await page.evaluate(id => { location.hash = id; }, ids[2]);
    await page.waitForTimeout(100);
    ok((await page.$$eval("section.on", a => a.map(x => x.id)))[0] === ids[2], `${p}: hashchange non apre la scheda`);
    await page.close();
  }
  // 4) tasto Indietro: home -> attività -> scheda -> altra pagina -> Indietro (con e senza bfcache)
  for (const bf of [true, false]) {
    const c2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await c2.newPage(); watch(page, errs, "indietro");
    await page.goto(base);
    await page.click('a[href*="indirizzi-dns-e-url"]');
    await page.waitForLoadState();
    await page.click('nav button:has-text("Quiz")');
    await page.click('nav button.sub:has-text("2")');
    const u = page.url();
    ok(u.endsWith("#qz2"), "indietro: url dopo i clic " + u);
    if (!bf) await page.evaluate(() => window.addEventListener("unload", () => {}));  // disattiva la bfcache
    await page.click(".tg-bar .tg-path a >> nth=1");
    await page.waitForLoadState();
    await page.goBack(); await page.waitForTimeout(300);
    ok(page.url() === u, `indietro (bfcache ${bf}): url ${page.url()}`);
    ok((await page.$$eval("section.on", a => a.map(x => x.id)))[0] === "qz2", `indietro (bfcache ${bf}): scheda aperta sbagliata`);
    await page.click('.tg-bar [data-a="qr"]'); await page.waitForSelector(".tg-qr svg");
    ok(decodePng(await page.screenshot({ path: path.join(OUT, "l_qr_qz2.png") })) === u, "QR dopo Indietro non contiene la scheda");
    await page.keyboard.press("Escape");
    await page.goBack(); await page.waitForTimeout(300);
    ok(page.url() === base, "secondo Indietro non torna alla home: " + page.url());
    await c2.close();
  }
  // 5) BEP
  {
    const page = await ctx.newPage(); watch(page, errs, "bep");
    const u = base + "gpoi/aziende-e-mercati/bep/";
    await page.goto(u + "#p2");
    ok(await page.evaluate(() => document.getElementById("tab2").classList.contains("on") && !document.getElementById("p2").classList.contains("hidden")), "bep #p2 non apre la scheda 2");
    await page.screenshot({ path: path.join(OUT, "l_bep_p2.png") });
    await page.click("#tab1");
    ok(page.url() === u, "bep: tab1 non toglie l'hash " + page.url());
    await page.click("#tab2");
    ok(page.url() === u + "#p2", "bep: tab2 non mette #p2 " + page.url());
    await page.close();
  }
  // 6) Processi e thread: il suo routing resta com'era
  {
    const page = await ctx.newPage(); watch(page, errs, "tp");
    await page.goto(base + "tpsit-4/processi-sequenziali-e-paralleli/processi-e-thread/#holt");
    ok(await page.evaluate(() => !document.getElementById("p-holt").hidden), "tp #holt non aperto");
    await page.close();
  }
  // 7) file://
  {
    const page = await ctx.newPage(); watch(page, errs, "file");
    await page.goto("file:///" + REPO + "/informatica-1/computer-e-codici/numeri-e-basi/index.html#s4");
    ok((await page.$$eval("section.on", a => a.map(x => x.id)))[0] === "s4", "file: #s4 non aperto");
    await page.click('nav button[data-s="s2"]');
    ok(page.url().endsWith("index.html#s2"), "file: hash non aggiornato " + page.url());
    await page.click('.tg-bar [data-a="qr"]'); await page.waitForSelector(".tg-qr svg");
    const d = decodePng(await page.screenshot());
    ok(d === "https://teaching.federicodiluca.com/informatica-1/computer-e-codici/numeri-e-basi/#s2", "file: QR " + d);
    await page.close();
  }
  await browser.close(); s.close();
  console.log("sezioni provate:", nSez);
  fine(errs, fails, "link diretti");
})();
