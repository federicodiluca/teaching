// Esegue tutti i controlli uno dopo l'altro e fallisce se anche uno solo non passa.
// uso: npm test            (tutti)
//      npm test -- qr       (solo quelli il cui nome contiene "qr")
const { spawnSync } = require("child_process");
const path = require("path");
const CONTROLLI = ["link-rotti", "qr", "link-diretti", "progressi", "modalita", "migrazione", "fotografia", "schermate"];
const filtro = process.argv[2];
const esiti = [];
for (const c of CONTROLLI.filter(c => !filtro || c.includes(filtro))) {
  console.log(`\n=== ${c} ===`);
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [path.join(__dirname, c + ".js")], { stdio: "inherit" });
  esiti.push([c, r.status === 0, Math.round((Date.now() - t0) / 1000)]);
}
console.log("\n=== riepilogo ===");
for (const [c, ok, s] of esiti) console.log(`${ok ? "ok   " : "NO   "} ${c} (${s} s)`);
if (esiti.some(e => !e[1])) process.exit(1);
