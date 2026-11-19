// QR code alla LIM: in tutte le attività, via http e via file://, a 1280 e 390 px e nel tema chiaro/scuro.
const { REPO, OUT, catalogo, server, decodePng, watch, chromium, fine } = require("./comune");
const path = require("path");

(async () => {
  const { s, base } = await server();
  const browser = await chromium.launch();
  const errs = [], fails = [];
  const list = catalogo();
  console.log(list.length, "attività");
  for (const [vw, scheme] of [[1280, "light"], [390, "light"], [390, "dark"]]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vw === 390 ? 844 : 800 }, colorScheme: scheme });
    for (const p of list) {
      if (scheme === "dark" && !p.includes("processi-e-thread")) continue;
      const page = await ctx.newPage();
      const label = `[${vw}/${scheme}] ${p}`;
      watch(page, errs, label);
      await page.goto(base + p + "/");
      await page.waitForTimeout(200);
      const name = p.split("/").pop() + "_" + vw + "_" + scheme;
      await page.screenshot({ path: path.join(OUT, "q_" + name + "_page.png") });
      await page.click('.tg-bar [data-a="qr"]');
      await page.waitForSelector(".tg-qr svg");
      const shot = await page.screenshot({ path: path.join(OUT, "q_" + name + "_qr.png") });
      const dec = decodePng(shot), href = await page.evaluate(() => location.href);
      const shown = await page.textContent(".tg-qr-url");
      if (dec !== href) fails.push(`${label}: QR=${dec} href=${href}`);
      if ("http://" + shown !== href) fails.push(`${label}: url scritto=${shown}`);
      await page.keyboard.press("Escape");
      if (await page.$(".tg-qr")) fails.push(label + ": Esc non chiude");
      await page.click('.tg-bar [data-a="qr"]');
      await page.waitForSelector(".tg-qr svg");
      await page.mouse.click(10, 10);
      if (await page.$(".tg-qr")) fails.push(label + ": clic non chiude");
      await page.close();
    }
    await ctx.close();
  }
  // file:// -> QR con l'indirizzo pubblico
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  for (const p of [list[0], list[list.length - 1]]) {
    const page = await ctx.newPage();
    watch(page, errs, "[file] " + p);
    await page.goto("file:///" + REPO + "/" + p + "/index.html");
    await page.click('.tg-bar [data-a="qr"]');
    await page.waitForSelector(".tg-qr svg");
    const dec = decodePng(await page.screenshot({ path: path.join(OUT, "q_file_" + p.split("/").pop() + ".png") }));
    const exp = "https://teaching.federicodiluca.com/" + p + "/";
    if (dec !== exp) fails.push(`[file] ${p}: QR=${dec} atteso=${exp}`);
    await page.close();
  }
  await browser.close(); s.close();
  fine(errs, fails, "QR");
})();
