/* passo-passo: simulatore da LIM di processi che si sincronizzano con i semafori.
   La classe fa da scheduler: si sceglie quale processo esegue la prossima istruzione e si guarda
   che cosa succede a semafori, code, variabili condivise e sezioni critiche.

   SIM({titolo, scenari: [scenario, ...]}) con
   scenario = {
     id, nome, desc,                       id finisce nell'indirizzo (#id): non rinominarlo
     sem: {nome: valore iniziale},
     vars: {nome: valore iniziale},        variabili condivise (solo dati JSON)
     procs: [{nome, rip, code: [istr...]}],  rip = quante volte ripete il codice (1 se assente)
     vista(v, st) -> html                  facoltativa: disegno delle variabili condivise
     fine(v, st) -> [tipo, testo]          facoltativa: commento quando tutti hanno finito
   }
   istruzioni:
     {P: 'mutex'}  {V: 'mutex'}            primitive di Dijkstra (V risveglia il primo in coda, altrimenti incrementa)
     {P: 's', se: v => ..., t: 'testo'}    P o V eseguita solo se la condizione è vera
     {PP: ['a', 'b']}                      prende due semafori insieme, oppure nessuno (allocazione totale)
     {t: 'testo', f: (v, L, nome) => ..., sc: true}   operazione; L = variabili locali del processo;
                                           sc = istruzione dentro la sezione critica; f può restituire
                                           ['ko', 'testo'] o ['ok', 'testo'] per segnalare un problema
*/
function SIM(cfg) {
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let sc, st, hist, auto = null, avvisi = [];

  const testo = i => i.t || (i.P ? `P(${i.P})` : i.V ? `V(${i.V})` : i.PP ? `P(${i.PP.join(', ')}) insieme` : "");

  function nuovo() {
    const s = { sem: {}, vars: JSON.parse(JSON.stringify(sc.vars || {})), procs: [], log: [], doppie: [], passo: 0 };
    Object.keys(sc.sem || {}).forEach(k => s.sem[k] = { v: sc.sem[k], coda: [] });
    sc.procs.forEach(p => s.procs.push({ pc: 0, giro: 1, stato: "pronto", su: null, L: {}, ultimo: -1 }));
    return s;
  }

  function avanza(i) {
    const p = st.procs[i], code = sc.procs[i].code, rip = sc.procs[i].rip || 1;
    p.ultimo = p.pc; p.pc++;
    if (p.pc >= code.length) {
      if (p.giro < rip) { p.giro++; p.pc = 0; }
      else { p.stato = "finito"; p.pc = code.length; }
    }
  }
  const nome = i => sc.procs[i].nome;
  const log = t => st.log.unshift(t);

  function controllaDoppie() {
    for (let k = 0; k < st.doppie.length; k++) {
      const j = st.doppie[k], ins = sc.procs[j].code[st.procs[j].pc];
      if (ins.PP.every(s => st.sem[s].v > 0)) {
        ins.PP.forEach(s => st.sem[s].v--);
        st.doppie.splice(k--, 1);
        st.procs[j].stato = "pronto"; st.procs[j].su = null;
        log(`${nome(j)} ottiene insieme ${ins.PP.join(" e ")} e riparte`);
        avanza(j);
      }
    }
  }

  function esegui(i) {
    const p = st.procs[i];
    if (!p || p.stato !== "pronto") return false;
    hist.push(JSON.stringify(st));
    st.passo++;
    const ins = sc.procs[i].code[p.pc], n = nome(i);
    avvisi = [];
    if ((ins.P || ins.V) && ins.se && !ins.se(st.vars)) {
      log(`${n}: ${testo(ins)} → la condizione è falsa, non fa nulla`);
      avanza(i);
    } else if (ins.P) {
      const s = st.sem[ins.P];
      if (s.v > 0) { s.v--; log(`${n}: P(${ins.P}) → ${ins.P} era verde, ora vale ${s.v}`); avanza(i); }
      else { s.coda.push(i); p.stato = "bloccato"; p.su = ins.P; log(`${n}: P(${ins.P}) → ${ins.P} è rosso, ${n} va in coda`); }
    } else if (ins.V) {
      const s = st.sem[ins.V];
      if (s.coda.length) {
        const j = s.coda.shift(), q = st.procs[j];
        q.stato = "pronto"; q.su = null;
        log(`${n}: V(${ins.V}) → risveglia ${nome(j)}, che supera la sua P; ${ins.V} resta ${s.v}`);
        avanza(j);
      } else { s.v++; log(`${n}: V(${ins.V}) → nessuno in coda, ${ins.V} vale ${s.v}`); }
      avanza(i);
      controllaDoppie();
    } else if (ins.PP) {
      if (ins.PP.every(s => st.sem[s].v > 0)) {
        ins.PP.forEach(s => st.sem[s].v--);
        log(`${n}: prende insieme ${ins.PP.join(" e ")}`);
        avanza(i);
      } else {
        p.stato = "bloccato"; p.su = ins.PP.join(" e "); st.doppie.push(i);
        log(`${n}: ${ins.PP.join(" e ")} non sono libere entrambe → aspetta senza prenderne nessuna`);
      }
    } else {
      const r = ins.f ? ins.f(st.vars, p.L, n) : null;
      log(`${n}: ${testo(ins)}`);
      if (r) avvisi.push(r);
      avanza(i);
    }
    disegna();
    return true;
  }

  function stato() {
    const out = avvisi.slice();
    const dentro = st.procs.map((p, i) => i).filter(i => {
      return inSC(i);
    });
    if (dentro.length > 1) out.push(["ko", `${dentro.map(nome).join(" e ")} sono nella sezione critica nello stesso momento: mutua esclusione violata.`]);
    const pronti = st.procs.filter(p => p.stato === "pronto").length,
      bloccati = st.procs.map((p, i) => i).filter(i => st.procs[i].stato === "bloccato"),
      finiti = st.procs.every(p => p.stato === "finito");
    if (!pronti && bloccati.length) {
      out.push(["ko", bloccati.length === st.procs.length
        ? "Stallo: tutti i processi sono bloccati e nessuno potrà mai risvegliarli."
        : `${bloccati.map(nome).join(", ")} ${bloccati.length > 1 ? "restano bloccati" : "resta bloccato"} per sempre: nessun processo potrà eseguire la V che serve.`]);
    }
    if (finiti) {
      const f = sc.fine ? sc.fine(st.vars, st) : null;
      out.push(f || ["ok", "Tutti i processi hanno finito."]);
    }
    return out;
  }

  /* dentro la sezione critica: ha già eseguito qualcosa in questo giro e la prossima istruzione è critica */
  function inSC(i) {
    const p = st.procs[i], ins = sc.procs[i].code[p.pc];
    return p.stato !== "finito" && !!ins && !!ins.sc && p.ultimo >= 0 && p.ultimo < p.pc;
  }

  function badge(i) {
    const p = st.procs[i], ins = sc.procs[i].code[p.pc];
    if (p.stato === "finito") return '<span class="pp-b fin">Finito</span>';
    if (p.stato === "bloccato") return `<span class="pp-b blo">In attesa su ${esc(p.su)}</span>`;
    if (inSC(i)) return '<span class="pp-b sc">In sezione critica</span>';
    return '<span class="pp-b pro">Pronto</span>';
  }

  function disegna() {
    $("#pp-scen").innerHTML = cfg.scenari.map(s => `<button type="button" data-s="${s.id}" aria-pressed="${s === sc}">${esc(s.nome)}</button>`).join("");
    $("#pp-desc").innerHTML = sc.desc;
    $("#pp-procs").innerHTML = sc.procs.map((pr, i) => {
      const p = st.procs[i], rip = pr.rip || 1;
      const loc = Object.keys(p.L).map(k => `${esc(k)} = ${esc(p.L[k])}`).join(", ");
      return `<div class="pp-p ${p.stato}" data-i="${i}"><div class="pp-ph"><b>${esc(pr.nome)}</b>${badge(i)}</div>` +
        (rip > 1 ? `<div class="pp-giro">giro ${p.giro} di ${rip}</div>` : "") +
        `<ol class="pp-code">${pr.code.map((ins, k) => `<li class="${k === p.pc && p.stato !== "finito" ? "cur" : ""}${ins.sc ? " sc" : ""}${k === p.ultimo ? " last" : ""}">${esc(testo(ins))}</li>`).join("")}</ol>` +
        (loc ? `<div class="pp-loc">${loc}</div>` : "") +
        `<button type="button" class="pp-go" data-i="${i}" ${p.stato === "pronto" ? "" : "disabled"}>Esegui ${esc(pr.nome)}${i < 9 ? ` <kbd>${i + 1}</kbd>` : ""}</button></div>`;
    }).join("");
    $("#pp-sems").innerHTML = Object.keys(st.sem).map(k => {
      const s = st.sem[k];
      return `<div class="pp-s ${s.v > 0 ? "verde" : "rosso"}"><span class="pp-sn">${esc(k)}</span><span class="pp-sv">${s.v}</span>` +
        `<span class="pp-sc">${s.coda.length ? "coda: " + s.coda.map(nome).join(", ") : "coda vuota"}</span></div>`;
    }).join("") + (Object.keys(st.sem).length ? "" : '<p class="pp-sc">Nessun semaforo in questo scenario.</p>') + (st.doppie.length ? `<div class="pp-s rosso"><span class="pp-sn">attesa doppia</span><span class="pp-sc">${st.doppie.map(nome).join(", ")}</span></div>` : "");
    $("#pp-vars").innerHTML = sc.vista ? sc.vista(st.vars, st)
      : Object.keys(st.vars).map(k => `<div class="pp-var"><span>${esc(k)}</span><b>${esc(JSON.stringify(st.vars[k]))}</b></div>`).join("");
    $("#pp-vh").hidden = !sc.vista && !Object.keys(st.vars).length;
    const av = stato();
    $("#pp-msg").innerHTML = av.map(a => `<p class="${a[0]}">${esc(a[1])}</p>`).join("");
    $("#pp-log").innerHTML = st.log.slice(0, 7).map(t => `<li>${esc(t)}</li>`).join("") || "<li>Ancora nessuna istruzione eseguita.</li>";
    $("#pp-passo").textContent = `Passi eseguiti: ${st.passo}`;
    $("#pp-undo").disabled = !hist.length;
    if (auto && !st.procs.some(p => p.stato === "pronto")) ferma();
  }

  function scegli(id) {
    ferma();
    sc = cfg.scenari.find(s => s.id === id) || cfg.scenari[0];
    st = nuovo(); hist = []; avvisi = [];
    try { history.replaceState(null, "", "#" + sc.id); } catch (e) {}
    disegna();
  }
  function caso() {
    const ok = st.procs.map((p, i) => i).filter(i => st.procs[i].stato === "pronto");
    if (ok.length) esegui(ok[Math.floor(Math.random() * ok.length)]);
  }
  function ferma() { if (auto) { clearInterval(auto); auto = null; } const b = $("#pp-auto"); if (b) b.textContent = "Automatico"; }

  /* scheletro della pagina */
  document.querySelector("main").innerHTML =
    `<nav class="pp-scen" id="pp-scen" aria-label="Scenari"></nav><p class="pp-desc" id="pp-desc"></p>` +
    `<div class="pp-ctl"><button type="button" class="pp-btn" id="pp-rnd">Passo a caso</button><button type="button" class="pp-btn sec" id="pp-auto">Automatico</button>` +
    `<button type="button" class="pp-btn sec" id="pp-undo">Annulla</button><button type="button" class="pp-btn sec" id="pp-reset">Ricomincia</button><span id="pp-passo"></span></div>` +
    `<div class="pp-grid"><div class="pp-procs" id="pp-procs"></div><aside class="pp-side"><h2>Semafori</h2><div id="pp-sems"></div>` +
    `<h2 id="pp-vh">Dati condivisi</h2><div id="pp-vars"></div><div id="pp-msg" class="pp-msg" aria-live="polite"></div><h2>Ultimi eventi</h2><ol class="pp-log" id="pp-log"></ol></aside></div>`;
  $("#pp-scen").addEventListener("click", e => { const b = e.target.closest("[data-s]"); if (b) scegli(b.dataset.s); });
  $("#pp-procs").addEventListener("click", e => { const b = e.target.closest("[data-i]"); if (b) esegui(+b.dataset.i); });
  $("#pp-rnd").onclick = caso;
  $("#pp-auto").onclick = () => { if (auto) ferma(); else { auto = setInterval(caso, 900); $("#pp-auto").textContent = "Ferma"; caso(); } };
  $("#pp-undo").onclick = () => { ferma(); const s = hist.pop(); if (s) { st = JSON.parse(s); avvisi = []; disegna(); } };
  $("#pp-reset").onclick = () => scegli(sc.id);
  document.addEventListener("keydown", e => {
    if (e.target.closest && e.target.closest("input,textarea,select")) return;
    if (/^[1-9]$/.test(e.key)) esegui(+e.key - 1);
  });
  window.addEventListener("hashchange", () => { const id = location.hash.slice(1); if (id && (!sc || id !== sc.id)) scegli(id); });
  scegli(location.hash.slice(1));
  window.PP = { esegui, caso, stato: () => st, scenario: () => sc, scegli }; /* per i controlli automatici */
}
