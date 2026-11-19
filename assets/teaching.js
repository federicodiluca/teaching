/* teaching: script condiviso.
   - Nelle pagine indice (body data-tg="elenco") disegna l'elenco delle attività dal catalogo.
   - Nelle pagine delle attività aggiunge in alto una barra con il ritorno all'indice e lo schermo intero.
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

  /* ---------- barra nelle attività ---------- */
  function barra() {
    var qui = location.href.replace(/index\.html?$/, "").replace(/[?#].*$/, "");
    var rel = qui.indexOf(ROOT) === 0 ? qui.slice(ROOT.length).replace(/\/$/, "") : "";
    var p = rel.split("/");
    var c = corso(p[0]), u = UNITA[p[0] + "/" + p[1]];
    var bar = document.createElement("div");
    bar.className = "tg-bar";
    bar.innerHTML = '<a class="tg-logo" href="' + ROOT + '" title="Tutte le attività">teaching</a>' +
      '<span class="tg-path">' + (p[0] ? '<a href="' + link(p[0]) + '">' + esc(c.nome) + "</a>" : "") +
      (u ? '<span>/</span><a href="' + link(p[0] + "/" + p[1]) + '">' + esc(u) + "</a>" : "") + "</span>" +
      (document.fullscreenEnabled ? '<button type="button">Schermo intero</button>' : "");
    document.body.insertBefore(bar, document.body.firstChild);
    var b = bar.querySelector("button");
    if (b) {
      b.addEventListener("click", function () {
        if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen();
      });
      document.addEventListener("fullscreenchange", function () {
        b.textContent = document.fullscreenElement ? "Esci da schermo intero" : "Schermo intero";
      });
    }
  }

  function avvia() {
    if (document.body.dataset.tg === "elenco") { tema(); elenco(); } else { barra(); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", avvia); else avvia();
})();
