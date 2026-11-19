// Link rotti, senza browser:
// - ogni href/src interno di ogni pagina HTML porta a un file esistente (anche gli script caricati da teaching.js);
// - ogni attività del catalogo ha la sua pagina, la sua unità, il suo corso e una voce nella sitemap;
// - ogni indirizzo della sitemap e gli indirizzi canonici puntano a pagine esistenti.
// I link esterni (altri siti) non si controllano qui: dipendono dalla rete.
const fs = require("fs"), path = require("path"), vm = require("vm");
const { REPO, fine } = require("./comune");
const SITO = "https://teaching.federicodiluca.com/";
const fails = [];

function tutti(dir, out = []) {
  for (const n of fs.readdirSync(dir)) {
    if (n.startsWith(".") || n === "node_modules" || n === "tests") continue;
    const f = path.join(dir, n);
    if (fs.statSync(f).isDirectory()) tutti(f, out); else if (n.endsWith(".html")) out.push(f);
  }
  return out;
}
// da indirizzo del sito o percorso relativo a file sul disco ("/cartella/" -> "/cartella/index.html")
function file(da, url) {
  let p = url.split("#")[0].split("?")[0];
  if (!p) return null;
  p = decodeURIComponent(p);
  let f = p.startsWith("/") ? path.join(REPO, p) : path.resolve(path.dirname(da), p);
  if (p.endsWith("/") || (fs.existsSync(f) && fs.statSync(f).isDirectory())) f = path.join(f, "index.html");
  return f;
}
const rel = f => path.relative(REPO, f).replace(/\\/g, "/");

// 1) link interni nelle pagine
let n = 0;
for (const pg of tutti(REPO)) {
  const html = fs.readFileSync(pg, "utf8");
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    let u = m[1];
    if (/^(mailto:|tel:|javascript:|data:|#)/.test(u) || u.includes("${")) continue;
    if (/^https?:\/\//.test(u)) { if (!u.startsWith(SITO)) continue; u = "/" + u.slice(SITO.length); }
    n++;
    const f = file(pg, u);
    if (f && !fs.existsSync(f)) fails.push(`${rel(pg)}: link rotto "${m[1]}"`);
  }
}
// file caricati dagli script condivisi (qr.js)
for (const f of ["assets/qr.js", "assets/giochi.js", "assets/giochi.css", "assets/favicon.svg"])
  if (!fs.existsSync(path.join(REPO, f))) fails.push(`manca ${f}`);

// 2) catalogo e sitemap
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(REPO, "assets/catalogo.js"), "utf8"), ctx);
const { CORSI, UNITA, CATALOGO } = ctx.window;
const sitemap = fs.readFileSync(path.join(REPO, "sitemap.xml"), "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
for (const u of urls) {
  if (!u.startsWith(SITO)) { fails.push(`sitemap: indirizzo fuori dal sito ${u}`); continue; }
  const f = file(path.join(REPO, "x"), "/" + u.slice(SITO.length));
  if (!fs.existsSync(f)) fails.push(`sitemap: ${u} non esiste`);
}
const ICONE = fs.readFileSync(path.join(REPO, "assets/teaching.js"), "utf8");
for (const a of CATALOGO) {
  const [c, u] = a.percorso.split("/");
  if (!fs.existsSync(path.join(REPO, a.percorso, "index.html"))) fails.push(`catalogo: manca la pagina ${a.percorso}/index.html`);
  if (!urls.includes(SITO + a.percorso + "/")) fails.push(`sitemap: manca ${a.percorso}/`);
  if (!CORSI.some(x => x.id === c)) fails.push(`catalogo: corso sconosciuto ${c}`);
  if (!UNITA[c + "/" + u]) fails.push(`catalogo: unità sconosciuta ${c}/${u}`);
  if (!fs.existsSync(path.join(REPO, c, u, "index.html"))) fails.push(`manca la pagina dell'unità ${c}/${u}/`);
  if (a.icona && !new RegExp("\\n    " + a.icona + ": '").test(ICONE)) fails.push(`catalogo: icona "${a.icona}" non definita in teaching.js`);
}
for (const c of CORSI) if (!fs.existsSync(path.join(REPO, c.id, "index.html"))) fails.push(`manca la pagina del corso ${c.id}/`);

console.log(`Pagine: ${tutti(REPO).length}, link interni controllati: ${n}, indirizzi in sitemap: ${urls.length}`);
fine([], fails, "link rotti");
