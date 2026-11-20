// Progressi salvati nel browser: ripristino, contatori, "Ricomincia da capo", localStorage bloccato, 390 px.
const { REPO, OUT, catalogo, server, watch, chromium, fine } = require("./comune");
const fs = require("fs"), path = require("path");

// gioca nella sezione id: due "Controlla", uno smistamento completo, una missione intera
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
const stato = page => page.evaluate(() => JSON.stringify(ST, (k, v) => k === "done" ? undefined :
  (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(x => [x, v[x]])) : v)));
const tabella = page => page.evaluate(() => { go("res"); return document.getElementById("restab").innerText; });

(async () => {
  const { s, base } = await server();
  const browser = await chromium.launch();
  const errs = [], fails = [];
  const ok = (c, m) => { if (!c) fails.push(m); };
  // tutte le attività costruite con il motore comune dei giochi
  const act = catalogo().filter(p => fs.readFileSync(path.join(REPO, p, "index.html"), "utf8").includes("assets/giochi.js"));

  for (const p of act) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const nome = p.split("/").pop();
    watch(page, errs, p);
    page.on("dialog", d => d.accept());
    const url = base + p + "/";
    await page.goto(url);
    ok(!(await page.$(".tg-ripresi")), p + ": avviso senza dati salvati");
    ok(await page.evaluate(k => localStorage.getItem(k) === null, "tg-progressi:" + p), p + ": salvato senza aver giocato");
    await page.fill("#n1", "Ada");
    if (await page.$("#n2")) await page.fill("#n2", "Bruno");
    const ids = await page.$$eval("main section[id][data-t]", a => a.map(x => x.id).filter(x => x !== "inizio" && x !== "res"));
    const giocati = {};
    for (const id of ids) { const f = await gioca(page, id); if (f.length) giocati[id] = f; }
    await page.waitForTimeout(50);
    const prima = await stato(page), tabPrima = await tabella(page);
    const salvato = await page.evaluate(k => localStorage.getItem(k), "tg-progressi:" + p);
    ok(salvato && JSON.parse(salvato).v === 1, p + ": niente in localStorage");
    ok(!/"done"/.test(salvato || ""), p + ": salvato anche done");
    const giochi = Object.keys(JSON.parse(prima).g).length;
    const missioni = JSON.parse(prima).ms ? 1 : Object.keys(JSON.parse(prima).m || {}).length;

    // ricarica su un'altra scheda (link diretto): tutto deve tornare
    await page.goto(url + "#" + ids[0]);
    await page.reload();
    const dopo = await stato(page);
    ok(dopo === prima, `${p}: ST diverso dopo il ricaricamento\n  prima ${prima}\n  dopo  ${dopo}`);
    ok((await page.inputValue("#n1")) === "Ada", p + ": nome 1 non ripristinato");
    if (await page.$("#n2")) ok((await page.inputValue("#n2")) === "Bruno", p + ": nome 2 non ripristinato");
    ok(!!(await page.$(".tg-ripresi")), p + ": manca l'avviso di ripristino");
    // il contatore dentro il gioco mostra già i valori ripristinati
    {
      const g = JSON.parse(prima).g;
      const idc = Object.keys(giocati).find(id => giocati[id].includes("controlla"));
      if (idc) {
        const txt = await page.evaluate(id => { const s = document.getElementById(id).querySelector(".stat"); return s ? s.textContent : ""; }, idc);
        const m = txt.match(/(\d+) su (\d+)/);
        ok(m && +m[2] > 0, `${p}#${idc}: contatore del gioco non ripristinato ("${txt}")`);
      }
    }
    await page.screenshot({ path: path.join(OUT, "p_" + nome + "_ripresi.png") });
    ok((await tabella(page)) === tabPrima, `${p}: Risultato diverso dopo il ricaricamento`);
    ok(!(await page.$(".tg-ripresi")), p + ": l'avviso non sparisce cambiando scheda");
    await page.screenshot({ path: path.join(OUT, "p_" + nome + "_res.png"), fullPage: true });

    // si continua a giocare: i contatori ripartono dai valori ripristinati (stesso oggetto)
    const id1 = Object.keys(giocati).find(id => giocati[id].includes("controlla"));
    if (id1) {
      const a = JSON.parse(await stato(page)).g;
      await page.evaluate(id => { go(id); [...document.getElementById(id).querySelectorAll('[data-a="c"]')].filter(b => b.offsetParent)[0].click(); }, id1);
      const b = JSON.parse(await stato(page)).g;
      const diff = Object.keys(b).filter(k => !a[k] || b[k].tot !== a[k].tot);
      ok(diff.length === 1 && b[diff[0]].tot === (a[diff[0]] ? a[diff[0]].tot : 0) + 1, `${p}: dopo il ripristino il contatore non prosegue (${diff})`);
    }
    const id2 = Object.keys(giocati).find(id => giocati[id].includes("smistamento"));
    if (id2) {
      const a = JSON.parse(await stato(page)).g;
      await gioca(page, id2);
      const b = JSON.parse(await stato(page)).g;
      const diff = Object.keys(b).filter(k => b[k].tot !== (a[k] ? a[k].tot : 0));
      ok(diff.length >= 1, `${p}: smistamento dopo il ripristino non conteggiato`);
    }

    // Ricomincia da capo: "Annulla" non cancella nulla
    page.removeAllListeners("dialog");
    page.once("dialog", d => d.dismiss());
    await page.evaluate(() => go("res"));
    await page.click('#tg-res [data-a="azzera"]');
    ok(await page.evaluate(k => !!localStorage.getItem(k), "tg-progressi:" + p), p + ": Annulla ha cancellato");
    page.once("dialog", d => d.accept());
    await Promise.all([page.waitForNavigation(), page.click('#tg-res [data-a="azzera"]')]);
    await page.waitForTimeout(100);
    ok(page.url() === url, p + ": dopo Ricomincia url " + page.url());
    ok(await page.evaluate(k => localStorage.getItem(k) === null, "tg-progressi:" + p), p + ": chiave ancora presente");
    {
      const z = JSON.parse(await stato(page));
      ok(Object.values(z.g).every(v => v.ok === 0 && v.tot === 0) && !z.ms && !Object.keys(z.m || {}).length, p + ": ST non azzerato " + JSON.stringify(z));
    }
    ok((await page.inputValue("#n1")) === "", p + ": nome rimasto dopo Ricomincia");
    ok(!(await page.$(".tg-ripresi")), p + ": avviso dopo Ricomincia");
    await page.reload();
    ok(!(await page.$(".tg-ripresi")), p + ": avviso dopo Ricomincia e ricarica");

    console.log(`${p}: ${Object.keys(giocati).length} sezioni giocate, ${giochi} giochi, ${missioni} missioni`);
    await ctx.close();
  }

  // localStorage bloccato (navigazione privata rigida, dati bloccati): tutto funziona, niente errori
  for (const p of act) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.addInitScript(() => {
      Object.defineProperty(window, "localStorage", { get() { throw new DOMException("bloccato", "SecurityError"); } });
    });
    const page = await ctx.newPage();
    watch(page, errs, "[bloccato] " + p);
    page.on("dialog", d => d.accept());
    await page.goto(base + p + "/");
    await page.fill("#n1", "Ada");
    const ids = await page.$$eval("main section[id][data-t]", a => a.map(x => x.id).filter(x => x !== "inizio" && x !== "res"));
    for (const id of ids.slice(0, 3)) await gioca(page, id);
    await page.waitForTimeout(50);
    const t = await tabella(page);
    ok(t.length > 0, "[bloccato] " + p + ": Risultato vuoto");
    await page.click(".tg-bar [data-a=qr]"); await page.waitForSelector(".tg-qr svg"); await page.keyboard.press("Escape");
    await Promise.all([page.waitForNavigation(), page.click('#tg-res [data-a="azzera"]')]);
    if (p.endsWith("indirizzi-dns-e-url")) await page.screenshot({ path: path.join(OUT, "p_bloccato_390.png") });
    await ctx.close();
  }

  // a 390 px: avviso e Risultato
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage(); watch(page, errs, "[390]");
    const p = "informatica-1/reti/indirizzi-dns-e-url";
    await page.goto(base + p + "/");
    await page.fill("#n1", "Ada");
    for (const id of ["i1", "i2", "qz1", "fin"]) await gioca(page, id);
    await page.waitForTimeout(50);
    await page.reload();
    await page.screenshot({ path: path.join(OUT, "p_390_ripresi.png") });
    await page.click('.tg-ripresi [data-a="vedi"]');
    await page.screenshot({ path: path.join(OUT, "p_390_res.png"), fullPage: true });
    await ctx.close();
  }
  await browser.close(); s.close();
  fine(errs, fails, "progressi");
})();
