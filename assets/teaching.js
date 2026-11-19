/* teaching: script condiviso.
   - Nelle pagine indice (body data-tg="elenco") disegna l'elenco delle attività dal catalogo.
   - Nelle pagine delle attività aggiunge in alto una barra con il ritorno all'indice, il QR code
     della pagina e lo schermo intero.
   Funziona sia online sia aprendo i file con un doppio clic (percorsi relativi). */
(function () {
  "use strict";

  var me = document.currentScript;
  var ROOT = new URL("..", me.src).href;              // radice del sito
  var CORSI = window.CORSI || [], UNITA = window.UNITA || {}, CAT = window.CATALOGO || [];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function corso(id) { return CORSI.find(function (c) { return c.id === id; }) || { id: id, nome: id, anno: "", colore: "#5d6474" }; }
  function link(p) { return ROOT + p + "/"; }
  function leggi(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function salva(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---------- tema (solo pagine indice) ---------- */
  function tema() {
    var btn = document.getElementById("tg-tema");
    var t = leggi("tg-tema");
    if (t) document.documentElement.setAttribute("data-theme", t);
    if (!btn) return;
    function scuro() {
      var a = document.documentElement.getAttribute("data-theme");
      return a ? a === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    }
    function etichetta() { btn.textContent = scuro() ? "Tema chiaro" : "Tema scuro"; }
    etichetta();
    btn.addEventListener("click", function () {
      var nuovo = scuro() ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", nuovo);
      salva("tg-tema", nuovo); etichetta();
    });
  }

  /* ---------- elenco ---------- */
  function elenco() {
    var box = document.getElementById("elenco");
    var fC = document.body.dataset.corso || "", fU = document.body.dataset.unita || "";
    var voci = CAT.filter(function (a) {
      var p = a.percorso.split("/");
      return (!fC || p[0] === fC) && (!fU || p[1] === fU);
    });
    var stato = { corso: "", testo: "" };

    var chips = document.getElementById("tg-chips");
    var cerca = document.getElementById("tg-cerca");
    if (chips && !fC) {
      var usati = CORSI.filter(function (c) { return voci.some(function (a) { return a.percorso.indexOf(c.id + "/") === 0; }); });
      chips.innerHTML = '<button class="tg-chip" aria-pressed="true" data-c="">Tutte</button>' +
        usati.map(function (c) {
          return '<button class="tg-chip" aria-pressed="false" data-c="' + esc(c.id) + '" style="--c:' + esc(c.colore) + '"><i></i>' + esc(c.nome) + "</button>";
        }).join("");
      chips.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        stato.corso = b.dataset.c;
        chips.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        disegna();
      });
    }
    if (cerca) cerca.addEventListener("input", function () { stato.testo = cerca.value.trim().toLowerCase(); disegna(); });

    function disegna() {
      var lista = voci.filter(function (a) {
        if (stato.corso && a.percorso.indexOf(stato.corso + "/") !== 0) return false;
        if (!stato.testo) return true;
        var u = UNITA[a.percorso.split("/").slice(0, 2).join("/")] || "";
        return (a.titolo + " " + a.descrizione + " " + u + " " + (a.modalita || "")).toLowerCase().indexOf(stato.testo) >= 0;
      });
      if (!lista.length) { box.innerHTML = '<p class="tg-empty">Nessuna attività trovata.</p>'; return; }

      var html = "", ordine = [];
      lista.forEach(function (a) { var c = a.percorso.split("/")[0]; if (ordine.indexOf(c) < 0) ordine.push(c); });
      ordine.forEach(function (cid) {
        var c = corso(cid);
        html += '<section class="tg-course" style="--c:' + esc(c.colore) + '">';
        if (!fC) html += '<h2><a href="' + link(cid) + '">' + esc(c.nome) + "</a><small>" + esc(c.anno) + "</small></h2>";
        var unita = [];
        lista.forEach(function (a) { var p = a.percorso.split("/"); if (p[0] === cid && unita.indexOf(p[1]) < 0) unita.push(p[1]); });
        unita.forEach(function (u) {
          var chiave = cid + "/" + u;
          if (!fU) html += '<h3 class="tg-unit"><a href="' + link(chiave) + '">' + esc(UNITA[chiave] || u) + "</a></h3>";
          html += '<div class="tg-grid">';
          lista.forEach(function (a) {
            if (a.percorso.indexOf(chiave + "/") !== 0) return;
            html += '<a class="tg-card" href="' + link(a.percorso) + '"><h3>' + esc(a.titolo) + "</h3><p>" + esc(a.descrizione) +
              '</p><span class="tg-meta"><b>' + esc(a.modalita || "") + "</b><span>Apri &rarr;</span></span></a>";
          });
          html += "</div>";
        });
        html += "</section>";
      });
      box.innerHTML = html;
    }
    disegna();
  }

  /* percorso della pagina rispetto alla radice, es. "informatica-1/reti/indirizzi-dns-e-url" */
  function percorso() {
    var qui = location.href.replace(/[?#].*$/, "").replace(/index\.html?$/, "");
    return qui.indexOf(ROOT) === 0 ? qui.slice(ROOT.length).replace(/\/$/, "") : "";
  }

  /* indirizzo da condividere: quello della pagina, scheda compresa.
     Se la pagina è aperta dal disco (file://) si usa l'indirizzo pubblico corrispondente. */
  var SITO = "https://teaching.federicodiluca.com/";
  function indirizzo() {
    if (/^https?:$/.test(location.protocol)) return location.href;
    var rel = percorso();
    return SITO + (rel ? rel + "/" : "") + location.hash;
  }

  /* ---------- barra nelle attività ---------- */
  function barra() {
    var p = percorso().split("/");
    var c = corso(p[0]), u = UNITA[p[0] + "/" + p[1]];
    var bar = document.createElement("div");
    bar.className = "tg-bar";
    bar.innerHTML = '<a class="tg-logo" href="' + ROOT + '" title="Tutte le attività">teaching</a>' +
      '<span class="tg-path">' + (p[0] ? '<a href="' + link(p[0]) + '">' + esc(c.nome) + "</a>" : "") +
      (u ? '<span>/</span><a href="' + link(p[0] + "/" + p[1]) + '">' + esc(u) + "</a>" : "") + "</span>" +
      '<span class="tg-btns"><button type="button" data-a="qr" title="Mostra il QR code di questa pagina">QR</button>' +
      (document.fullscreenEnabled ? '<button type="button" data-a="fs">Schermo intero</button>' : "") + "</span>";
    document.body.insertBefore(bar, document.body.firstChild);
    bar.querySelector('[data-a="qr"]').addEventListener("click", qr);
    var b = bar.querySelector('[data-a="fs"]');
    if (b) {
      b.addEventListener("click", function () {
        if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen();
      });
      document.addEventListener("fullscreenchange", function () {
        b.textContent = document.fullscreenElement ? "Esci da schermo intero" : "Schermo intero";
      });
    }
  }

  /* ---------- QR code della pagina, a tutto schermo ----------
     Il generatore (assets/qr.js, licenza MIT) si carica solo al primo clic. */
  var qrLib = null;
  function caricaQr(fatto) {
    if (window.qrcode) { fatto(); return; }
    if (!qrLib) {
      qrLib = [];
      var s = document.createElement("script");
      s.src = ROOT + "assets/qr.js";
      s.onload = s.onerror = function () { var f = qrLib; qrLib = null; f.forEach(function (g) { g(); }); };
      document.head.appendChild(s);
    }
    qrLib.push(fatto);
  }

  function disegnoQr(testo) {
    if (!window.qrcode) return "";
    try {
      qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];
      var q = qrcode(0, "M");
      q.addData(testo, "Byte");
      q.make();
      var n = q.getModuleCount(), m = 4, d = "";
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += "M" + (c + m) + " " + (r + m) + "h1v1h-1z";
      return '<svg viewBox="0 0 ' + (n + 2 * m) + " " + (n + 2 * m) + '" shape-rendering="crispEdges" role="img" aria-label="QR code">' +
        '<rect width="100%" height="100%" fill="#fff"/><path fill="#000" d="' + d + '"/></svg>';
    } catch (e) { return ""; }
  }

  function qr() {
    if (document.querySelector(".tg-qr")) return;
    var prima = document.activeElement;
    var box = document.createElement("div");
    box.className = "tg-qr";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "QR code di questa pagina");
    box.tabIndex = -1;
    box.innerHTML = '<div class="tg-qr-code"></div><p class="tg-qr-url"></p>' +
      '<p class="tg-qr-hint">Inquadrate il codice con la fotocamera del telefono. Clic o Esc per chiudere.</p>';
    document.body.appendChild(box);
    box.focus();

    function aggiorna() {
      var url = indirizzo();
      box.querySelector(".tg-qr-url").textContent = url.replace(/^https?:\/\//, "");
      caricaQr(function () {
        box.querySelector(".tg-qr-code").innerHTML = disegnoQr(url) ||
          '<p class="tg-qr-err">QR non disponibile: usate l\'indirizzo qui sotto.</p>';
      });
    }
    function chiudi() {
      box.remove();
      document.removeEventListener("keydown", tasto, true);
      window.removeEventListener("hashchange", aggiorna);
      if (prima && prima.focus) prima.focus();
    }
    function tasto(e) {
      if (e.key === "Escape") { e.preventDefault(); chiudi(); }
      else if (e.key === "Tab") { e.preventDefault(); box.focus(); }
    }
    box.addEventListener("click", chiudi);
    document.addEventListener("keydown", tasto, true);
    window.addEventListener("hashchange", aggiorna);
    aggiorna();
  }

  /* ---------- link diretto a una scheda ----------
     .../attivita/#<id-sezione> apre quella scheda; cambiando scheda l'indirizzo si aggiorna
     con replaceState (senza aggiungere passi alla cronologia), così QR e link copiati portano lì.
     Non si duplica la navigazione delle pagine: si usa la loro funzione go(id) e si osserva
     quale sezione ha la classe "on". */
  function hash(id) {
    var url = location.href.replace(/#.*$/, "") + (id ? "#" + id : "");
    if (url === location.href) return;
    try { history.replaceState(history.state, "", url); }
    catch (e) { if (id) location.replace("#" + id); }
  }

  function schede() {
    var body = document.body;
    if (body.classList.contains("tg-act") && typeof window.go === "function") {
      var secs = [].slice.call(document.querySelectorAll("main section[id][data-t]"));
      if (!secs.length) return;
      var sez = function (id) { return secs.filter(function (s) { return s.id === id; })[0]; };
      var apri = function () {
        var id = decodeURIComponent(location.hash.slice(1)), s = id && sez(id);
        if (s && !s.classList.contains("on")) window.go(id);
      };
      var segui = function () {
        var s = secs.filter(function (x) { return x.classList.contains("on"); })[0];
        if (s) hash(s === secs[0] ? "" : s.id);
      };
      apri();
      var mo = new MutationObserver(segui);
      secs.forEach(function (s) { mo.observe(s, { attributes: true, attributeFilter: ["class"] }); });
      window.addEventListener("hashchange", apri);
      return;
    }
    /* Il BEP vivo: due schede, pulsanti #tab1 e #tab2 per i pannelli #p1 e #p2 */
    if (body.classList.contains("tg-bep")) {
      var coppie = [["p1", "tab1"], ["p2", "tab2"]].filter(function (c) {
        return document.getElementById(c[0]) && document.getElementById(c[1]);
      });
      if (coppie.length < 2) return;
      var vai = function () {
        var id = decodeURIComponent(location.hash.slice(1));
        coppie.forEach(function (c) {
          var b = document.getElementById(c[1]);
          if (c[0] === id && !b.classList.contains("on")) b.click();
        });
      };
      coppie.forEach(function (c, i) {
        document.getElementById(c[1]).addEventListener("click", function () { hash(i ? c[0] : ""); });
      });
      vai();
      window.addEventListener("hashchange", vai);
    }
    /* Processi e thread ha già il suo routing (#quiz, #holt...); Che struttura è non ha schede. */
  }

  /* ---------- schermata finale ----------
     Le attività con la struttura comune scrivono il riepilogo in #restab (righe "x su y").
     Qui lo si osserva e lo si ridisegna come pannello con barre, totale e "Copia il risultato". */
  function risultato() {
    var tab = document.getElementById("restab");
    if (!tab || !document.body.classList.contains("tg-act")) return;
    var box = document.createElement("div");
    box.id = "tg-res";
    tab.parentNode.insertBefore(box, tab);
    tab.classList.add("tg-hidden");

    function disegna() {
      var righe = [].map.call(tab.querySelectorAll("tr"), function (tr) {
        var nome = (tr.querySelector("th") || {}).textContent || "";
        var val = (tr.querySelector("td") || {}).textContent || "";
        var m = val.match(/(\d+)\s+su\s+(\d+)/);
        return { nome: nome, val: val, ok: m ? +m[1] : null, tot: m ? +m[2] : null };
      });
      if (!righe.length) { box.innerHTML = ""; return; }
      var fatte = righe.filter(function (r) { return r.tot; });
      var ok = fatte.reduce(function (s, r) { return s + r.ok; }, 0);
      var tot = fatte.reduce(function (s, r) { return s + r.tot; }, 0);
      var pc = tot ? Math.round(ok * 100 / tot) : 0;
      var html = '<div class="tg-res-top"><div class="tg-ring" style="--p:' + pc + '"><b>' + (tot ? pc + "%" : "-") + "</b></div>" +
        "<div><strong>" + (tot ? ok + " risposte giuste su " + tot : "Nessun gioco ancora completato") + "</strong>" +
        "<span>" + fatte.length + " di " + righe.length + " attività svolte</span></div></div><ul class=\"tg-res-list\">";
      righe.forEach(function (r) {
        var p = r.tot ? Math.round(r.ok * 100 / r.tot) : 0;
        html += '<li class="' + (r.tot ? (p >= 80 ? "ok" : p >= 50 ? "mid" : "ko") : "todo") + '"><span class="n">' + esc(r.nome) +
          '</span><span class="bar"><i style="width:' + p + '%"></i></span><span class="v">' + esc(r.val) + "</span></li>";
      });
      html += '</ul><div class="tg-res-act"><button type="button" class="btn" data-a="copia">Copia il risultato</button>' +
        '<button type="button" class="btn sec" data-a="stampa">Stampa</button></div>';
      box.innerHTML = html;
    }

    function testo() {
      var who = (document.getElementById("who") || {}).textContent || "";
      var r = [].map.call(tab.querySelectorAll("tr"), function (tr) {
        return "- " + tr.querySelector("th").textContent + ": " + tr.querySelector("td").textContent;
      });
      return [document.title, who].concat(r, [new Date().toLocaleString("it-IT"), location.href.split("#")[0]])
        .filter(Boolean).join("\n");
    }

    box.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.a === "stampa") { window.print(); return; }
      var t = testo(), fatto = function () { b.textContent = "Copiato!"; setTimeout(function () { b.textContent = "Copia il risultato"; }, 1800); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(fatto, function () { manuale(t); });
      else manuale(t);
      function manuale(s) {
        var ta = document.createElement("textarea"); ta.value = s; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); fatto(); } catch (err) { window.prompt("Copia il testo:", s); }
        ta.remove();
      }
    });

    new MutationObserver(disegna).observe(tab, { childList: true, subtree: true, characterData: true });
    disegna();
  }

  function avvia() {
    if (document.body.dataset.tg === "elenco") { tema(); elenco(); } else { barra(); risultato(); schede(); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", avvia); else avvia();
})();
