// Modalità dal link: ?solo e ?coppie cambiano nomi, frasi, turni e risultato; il QR porta con sé la modalità scelta.
const { REPO, OUT, server, decodePng, watch, chromium, fine } = require("./comune");
const path = require("path");

const COPPIE = "informatica-1/computer-e-codici/numeri-e-basi";      // pagina pensata a coppie
const SOLI = "informatica-1/computer-e-codici/palestra-dei-numeri";  // pagina pensata da soli

(async () => {
  const { s, base } = await server();
  const browser = await chromium.launch();
  const errs = [], fails = [];
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  async function apri(p, query, label) {
    const page = await ctx.newPage();
    watch(page, errs, label);
    await page.goto(base + p + "/" + query);
    await page.waitForTimeout(150);
    return page;
  }
  const stato = page => page.evaluate(() => ({
    n2: !!document.querySelector("#n2"),
    etichetta: document.querySelector("#n1").closest("label").textContent.trim(),
    turni: document.querySelectorAll(".turn").length,
    testo: document.querySelector("main").textContent,
    solo: SOLO
  }));
  async function risultato(page, nomi) {
    await page.evaluate(() => go(SECS[0].id));
    await page.fill("#n1", nomi[0]);
    if (nomi[1]) await page.fill("#n2", nomi[1]);
    await page.click('#nv1 [data-s="res"]');
    return page.textContent("#who");
  }

  // pagina a coppie, così com'è
  let page = await apri(COPPIE, "", "coppie");
  let st = await stato(page);
  if (!st.n2 || st.solo || !st.turni) fails.push("coppie: la pagina a coppie non è più a coppie " + JSON.stringify({ n2: st.n2, turni: st.turni }));
  await page.close();

  // pagina a coppie aperta con ?solo
  page = await apri(COPPIE, "?solo", "coppie?solo");
  st = await stato(page);
  if (st.n2) fails.push("coppie?solo: c'è ancora il secondo nome");
  if (!st.solo) fails.push("coppie?solo: SOLO è falso");
  if (st.etichetta !== "Il vostro nome:") fails.push("coppie?solo: etichetta " + st.etichetta);
  if (st.turni) fails.push("coppie?solo: " + st.turni + " righe di turno");
  for (const f of ["turno", "in coppia", "giocatore"]) if (st.testo.toLowerCase().includes(f)) fails.push("coppie?solo: nel testo resta «" + f + "»");
  if (!st.testo.includes("Si gioca da soli")) fails.push("coppie?solo: manca «Si gioca da soli»");
  let who = await risultato(page, ["Ada"]);
  if (who !== "Nome: Ada") fails.push("coppie?solo: risultato «" + who + "»");
  await page.screenshot({ path: path.join(OUT, "m_coppie_solo_res.png") });
  await page.close();

  // pagina da soli aperta con ?coppie
  page = await apri(SOLI, "?coppie", "soli?coppie");
  st = await stato(page);
  if (!st.n2) fails.push("soli?coppie: manca il secondo nome");
  if (st.solo) fails.push("soli?coppie: SOLO è vero");
  if (st.etichetta !== "Primo nome:") fails.push("soli?coppie: etichetta " + st.etichetta);
  if (!st.turni) fails.push("soli?coppie: nessuna riga di turno");
  if (!st.testo.includes("Si gioca in coppia") || st.testo.includes("Si gioca da soli")) fails.push("soli?coppie: frase iniziale non adattata");
  await page.evaluate(() => go(SECS[0].id));
  await page.screenshot({ path: path.join(OUT, "m_soli_coppie_inizio.png") });
  who = await risultato(page, ["Ada", "Bruno"]);
  if (who !== "Coppia: Ada e Bruno") fails.push("soli?coppie: risultato «" + who + "»");
  // i nomi si salvano e tornano anche nella modalità cambiata
  await page.reload();
  await page.waitForTimeout(150);
  const nomi = await page.evaluate(() => [document.querySelector("#n1").value, document.querySelector("#n2").value]);
  if (nomi.join() !== "Ada,Bruno") fails.push("soli?coppie: nomi ripresi " + nomi.join());
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.close();

  // QR: parte dalla modalità in uso e cambia codice con i pulsanti, senza chiudersi
  async function qrLetto(page) {
    await page.waitForSelector(".tg-qr svg");
    await page.waitForTimeout(50);
    return decodePng(await page.screenshot());
  }
  const casi = [
    [COPPIE, "?solo#s2", "solo", { solo: "?solo#s2", coppie: "#s2" }],
    [SOLI, "", "solo", { solo: "", coppie: "?coppie" }],
    [COPPIE, "", "coppie", { solo: "?solo", coppie: "" }]
  ];
  for (const vw of [1280, 390]) {
    const c2 = await browser.newContext({ viewport: { width: vw, height: vw === 390 ? 844 : 800 } });
    for (const [p, query, attivo, attesi] of casi) {
      const label = `qr ${vw} ${p.split("/").pop()}${query}`;
      const pg = await c2.newPage();
      watch(pg, errs, label);
      await pg.goto(base + p + "/" + query);
      await pg.waitForTimeout(150);
      await pg.click('.tg-bar [data-a="qr"]');
      const on = await pg.getAttribute(".tg-qr-modo .on", "data-m");
      if (on !== attivo) fails.push(`${label}: pulsante acceso ${on}, atteso ${attivo}`);
      for (const m of [attivo === "solo" ? "coppie" : "solo", attivo]) {
        await pg.click(`.tg-qr-modo [data-m="${m}"]`);
        if (!(await pg.$(".tg-qr"))) { fails.push(label + ": il pulsante chiude il QR"); break; }
        const dec = await qrLetto(pg), exp = base + p + "/" + attesi[m];
        const scritto = await pg.textContent(".tg-qr-url");
        if (dec !== exp) fails.push(`${label} ${m}: QR=${dec} atteso=${exp}`);
        if ("http://" + scritto !== exp) fails.push(`${label} ${m}: scritto=${scritto}`);
      }
      if (p === COPPIE && query) await pg.screenshot({ path: path.join(OUT, `m_qr_${vw}.png`) });
      if (!(await pg.$(".tg-qr-modo"))) fails.push(label + ": mancano i pulsanti");
      await pg.keyboard.press("Escape");
      if (await pg.$(".tg-qr")) fails.push(label + ": Esc non chiude");
      await pg.close();
    }
    await c2.close();
  }

  // le attività da LIM non hanno modalità
  page = await apri("gpoi/aziende-e-mercati/bep", "", "bep");
  await page.click('.tg-bar [data-a="qr"]');
  await page.waitForSelector(".tg-qr svg");
  if (await page.$(".tg-qr-modo")) fails.push("bep: pulsanti della modalità dove non servono");
  await page.close();

  // da disco: il QR porta all'indirizzo pubblico con la modalità
  page = await ctx.newPage();
  watch(page, errs, "file");
  await page.goto("file:///" + REPO + "/" + COPPIE + "/index.html?solo");
  await page.click('.tg-bar [data-a="qr"]');
  const dec = await qrLetto(page), exp = "https://teaching.federicodiluca.com/" + COPPIE + "/?solo";
  if (dec !== exp) fails.push(`file: QR=${dec} atteso=${exp}`);
  await page.close();

  await browser.close(); s.close();
  fine(errs, fails, "modalità");
})();
