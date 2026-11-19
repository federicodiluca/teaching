// Strumenti comuni ai controlli: server locale del sito, catalogo, lettura dei QR, raccolta degli errori.
const fs = require("fs"), path = require("path"), vm = require("vm"), http = require("http");
const { chromium } = require("playwright");
const jsQR = require("jsqr"), { PNG } = require("pngjs");

const REPO = path.resolve(__dirname, "..");
const OUT = path.join(__dirname, "risultati");
fs.mkdirSync(OUT, { recursive: true });

// i percorsi delle attività, letti da assets/catalogo.js
function catalogo() {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(REPO, "assets/catalogo.js"), "utf8"), ctx);
  return ctx.window.CATALOGO.map(a => a.percorso);
}

// server statico del repo su una porta libera (come GitHub Pages: /cartella/ -> /cartella/index.html)
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".xml": "text/xml", ".txt": "text/plain" };
function server() {
  return new Promise(res => {
    const s = http.createServer((req, rsp) => {
      const p = decodeURIComponent(req.url.split(/[?#]/)[0]);
      let f = path.join(REPO, p);
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
      if (!f.startsWith(REPO) || !fs.existsSync(f)) { rsp.writeHead(404); rsp.end("404"); return; }
      rsp.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" });
      rsp.end(fs.readFileSync(f));
    }).listen(0, () => res({ s, base: "http://localhost:" + s.address().port + "/" }));
  });
}

// legge un QR code da uno screenshot PNG
function decodePng(buf) {
  const png = PNG.sync.read(buf);
  const r = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  return r ? r.data : null;
}

// raccoglie errori e avvisi della console e gli errori JavaScript della pagina
function watch(page, errs, label) {
  page.on("console", m => { if (m.type() === "error" || m.type() === "warning") errs.push(label + " console." + m.type() + ": " + m.text()); });
  page.on("pageerror", e => errs.push(label + " pageerror: " + e.message));
}

// stampa il riepilogo e fa fallire il processo se qualcosa non va
function fine(errs, fails, nome) {
  console.log("Errori in console:", errs.length ? "\n  " + errs.join("\n  ") : "nessuno");
  console.log("Controlli falliti:", fails.length ? "\n  " + fails.join("\n  ") : "nessuno");
  if (errs.length || fails.length) { process.exitCode = 1; console.log("NON SUPERATO: " + (nome || "")); }
}

module.exports = { REPO, OUT, catalogo, server, decodePng, watch, fine, chromium };
