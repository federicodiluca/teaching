/* teaching: script condiviso.
   - Tema: scuro di partenza, chiaro a scelta (pulsante in alto, scelta ricordata nel browser).
   - Nelle pagine indice (body data-tg="elenco") disegna l'elenco delle attività dal catalogo, con le icone.
   - Nelle pagine delle attività aggiunge in alto una barra con il ritorno all'indice, il QR code
     della pagina, lo schermo intero e il tema; mette l'icona dell'attività accanto al titolo.
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

  /* ---------- icone ----------
     Disegnate su griglia 24×24 nello stile del portfolio (federicodiluca.com): tratto in currentColor,
     classe "f" = riempimento trasparente nel colore del corso, "d" = pieno, "a" = tratto giallo del cursore, "y" = pieno giallo.
     I riempimenti vanno prima dei tratti. */
  var ICONE = {
    /* corsi */
    terminal: '<rect class="f" x="3" y="4" width="18" height="16" rx="2"/><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3"/><path class="a" d="M12.5 15H17"/>',
    cpu: '<rect class="f" x="9" y="9" width="6" height="6" rx="1"/><rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
    building: '<path class="f" d="M15 10h4a1 1 0 0 1 1 1v10h-5z"/><path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 10h4a1 1 0 0 1 1 1v10M2.5 21h19M8 8h3M8 12h3M8 16h3"/>',
    /* attività */
    binary: '<rect class="f" x="3" y="4" width="18" height="16" rx="3"/><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9.5l2-1.5v7.5"/><rect x="11.5" y="8" width="4" height="7.5" rx="2"/><rect class="y" x="17" y="13.6" width="2.4" height="1.9" rx=".5"/>',
    calc: '<rect class="f" x="4" y="3" width="16" height="18" rx="2.5"/><rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 7.5h8"/><path class="a" d="M8 13h3M9.5 11.5v3M13 12h3M13 14h3M8 17.5h3M13 17.5h3"/>',
    gate: '<path class="f" d="M7 5h4.5a7 7 0 0 1 0 14H7z"/><path d="M7 5h4.5a7 7 0 0 1 0 14H7zM3 9h4M3 15h4"/><path class="a" d="M18.5 12h3"/>',
    image: '<rect class="f" x="3" y="5" width="18" height="14" rx="2"/><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/><circle class="a" cx="16" cy="9" r="1.5"/>',
    bytes: '<rect class="f" x="3" y="4" width="18" height="16" rx="3"/><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M6.5 16l3-8 3 8M7.6 13.2h3.8"/><path class="a" d="M15.5 8.5v7M18 8.5v2.5M18 13.5v2"/>',
    dumbbell: '<path class="f" d="M5 7h3v10H5zM16 7h3v10h-3z"/><path d="M5 7h3v10H5zM16 7h3v10h-3zM8 12h8M2.5 9.5v5M21.5 9.5v5"/>',
    layers: '<path class="f" d="M12 3l9 5-9 5-9-5z"/><path d="M12 3l9 5-9 5-9-5zM3 12.5l9 5 9-5"/><path class="a" d="M3 16.5l9 5 9-5"/>',
    network: '<path d="M4 5L12 8.5M4 5L12 15.5M4 12L12 8.5M4 12L12 15.5M4 19L12 8.5M4 19L12 15.5"/><path class="a" d="M12 8.5L20 12M12 15.5L20 12"/><circle class="d" cx="4" cy="5" r="1.5"/><circle class="d" cx="4" cy="12" r="1.5"/><circle class="d" cx="4" cy="19" r="1.5"/><circle class="d" cx="12" cy="8.5" r="1.5"/><circle class="d" cx="12" cy="15.5" r="1.5"/><circle class="f" cx="20" cy="12" r="3"/><circle class="d" cx="20" cy="12" r="1.7"/>',
    globe: '<path class="f" d="M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z"/><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z"/>',
    shield: '<path class="f" d="M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6z"/><path d="M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6z"/><path class="a" d="M9 12l2 2 4-4"/>',
    threads: '<rect class="f" x="3" y="4" width="18" height="16" rx="2"/><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M6.5 8.5h6M10 12h7.5M6.5 15.5h4"/><path class="a" d="M15 8.5h2.5M13 15.5h4.5"/>',
    bep: '<path class="f" d="M14.7 10.7 20 6v3z"/><path d="M3.5 3.5v17h17M4 20 20 6"/><path class="a" d="M4 14l16-5"/><circle class="d" cx="14.7" cy="10.7" r="1.6"/>',
    org: '<rect class="f" x="9" y="3" width="6" height="5" rx="1"/><rect x="9" y="3" width="6" height="5" rx="1"/><rect x="2.5" y="16" width="6" height="5" rx="1"/><rect x="15.5" y="16" width="6" height="5" rx="1"/><path d="M5.5 16v-3.5h13V16"/><path class="a" d="M12 8v4.5"/>',
    plug: '<path class="f" d="M7 8h10v4a5 5 0 0 1-10 0z"/><path d="M7 8h10v4a5 5 0 0 1-10 0zM9.5 8V3M14.5 8V3"/><path class="a" d="M12 17v4"/>',
    branch: '<circle class="f" cx="6" cy="6" r="2.5"/><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="8" r="2.5"/><path d="M6 8.5v7"/><path class="a" d="M18 10.5c0 4-6 3-11 5.5"/>',
    file: '<path class="f" d="M6 3h8l5 5v13H6z"/><path d="M6 3h8l5 5v13H6zM14 3v5h5"/><path class="a" d="M9 13h7M9 17h5"/>',
    server: '<rect class="f" x="4" y="4" width="16" height="7" rx="1.5"/><rect x="4" y="4" width="16" height="7" rx="1.5"/><rect x="4" y="13" width="16" height="7" rx="1.5"/><path class="a" d="M7.5 7.5h3M7.5 16.5h3"/><path d="M16 7.5h.01M16 16.5h.01"/>',
    /* giochi */
    home: '<path class="f" d="M5 10.5 12 4l7 6.5V20H5z"/><path d="M3 12l9-8.5 9 8.5M5 10.5V20h14v-9.5"/><path class="a" d="M10 20v-5h4v5"/>',
    pencil: '<path class="f" d="M4 20l1-4L15.5 5.5l3 3L8 19z"/><path d="M4 20l1-4L15.5 5.5a2.1 2.1 0 0 1 3 3L8 19zM13.5 7.5l3 3"/><path class="a" d="M13 20h7"/>',
    question: '<path class="f" d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-6l-5 4v-4H6a2 2 0 0 1-2-2z"/><path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-6l-5 4v-4H6a2 2 0 0 1-2-2z"/><path class="a" d="M9.8 8a2.2 2.2 0 1 1 3.2 2c-.6.3-1 .8-1 1.5M12 14.2v.1"/>',
    sort: '<rect class="f" x="8.5" y="2.5" width="7" height="5" rx="1"/><rect x="8.5" y="2.5" width="7" height="5" rx="1"/><path d="M3 14v5a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-5M13 14v5a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-5"/><path class="a" d="M12 7.5v1.5M12 9 7 12M12 9l5 3"/>',
    order: '<rect class="f" x="9" y="3.5" width="11" height="4.5" rx="1"/><rect x="9" y="3.5" width="11" height="4.5" rx="1"/><rect x="9" y="10" width="11" height="4.5" rx="1"/><rect x="9" y="16.5" width="11" height="4.5" rx="1"/><path class="a" d="M5 4v16M3 17.5 5 20l2-2.5"/>',
    cards: '<rect class="f" x="10.5" y="4.5" width="9.5" height="14" rx="2" transform="rotate(8 15.25 11.5)"/><rect x="4" y="5" width="9.5" height="14" rx="2" transform="rotate(-8 8.75 12)"/><rect x="10.5" y="4.5" width="9.5" height="14" rx="2" transform="rotate(8 15.25 11.5)"/><path class="a" d="M13.9 9.6a1.6 1.6 0 1 1 2.2 1.5c-.5.2-.8.6-.8 1.2M15.1 14.4v.1"/>',
    search: '<circle class="f" cx="10.5" cy="10.5" r="6.5"/><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/><path class="a" d="M8 10.5h5"/>',
    switch: '<rect class="f" x="2.5" y="7" width="19" height="10" rx="5"/><rect x="2.5" y="7" width="19" height="10" rx="5"/><circle class="d" cx="16.5" cy="12" r="3"/><path class="a" d="M6.5 12h3"/>',
    pixels: '<rect class="f" x="4" y="4" width="16" height="16" rx="2"/><rect x="4" y="4" width="16" height="16" rx="2"/><path class="d" d="M8 8h4v4H8zM12 12h4v4h-4z"/>',
    stopwatch: '<circle class="f" cx="12" cy="13.5" r="7.5"/><circle cx="12" cy="13.5" r="7.5"/><path d="M10 2.5h4M12 2.5V6M18.3 6.7l1.5-1.5"/><path class="a" d="M12 13.5V9.5"/><circle class="d" cx="12" cy="13.5" r="1.2"/>',
    trophy: '<path class="f" d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4.5v1.5A3.5 3.5 0 0 0 8 11M17 6h2.5v1.5A3.5 3.5 0 0 1 16 11M12 14v3.5M8 20.5h8"/><path class="a" d="M9.5 20.5c0-1.7 1.1-3 2.5-3s2.5 1.3 2.5 3"/>',
    flask: '<path class="f" d="M6.2 16h11.6l1.7 3.2a1.2 1.2 0 0 1-1 1.8h-13a1.2 1.2 0 0 1-1-1.8z"/><path d="M9.5 3h5M10 3v6.5L4.5 19.2a1.2 1.2 0 0 0 1 1.8h13a1.2 1.2 0 0 0 1-1.8L14 9.5V3"/><path class="a" d="M6.5 16h11"/>',
    /* barra e pulsanti */
    qr: '<rect class="f" x="3" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect class="d" x="6" y="6" width="2" height="2" rx=".5"/><rect class="d" x="16" y="6" width="2" height="2" rx=".5"/><rect class="d" x="6" y="16" width="2" height="2" rx=".5"/><path class="a" d="M14 14h3M20.5 14v3M14 17.5V21M17.5 21H21"/>',
    expand: '<path class="f" d="M8 8h8v8H8z"/><path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/>',
    shrink: '<path class="f" d="M9.5 9.5h5v5h-5z"/><path d="M9 4v4a1 1 0 0 1-1 1H4M20 9h-4a1 1 0 0 1-1-1V4M15 20v-4a1 1 0 0 1 1-1h4M4 15h4a1 1 0 0 1 1 1v4"/>',
    sun: '<circle class="f" cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="4"/><path class="a" d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    moon: '<path class="f" d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/><path class="a" d="M17 3.5v3M15.5 5h3"/>',
    copy: '<rect class="f" x="8" y="8" width="12" height="12" rx="2"/><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    print: '<path class="f" d="M7 14h10v7H7z"/><path d="M7 9V3h10v6M7 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M7 14h10v7H7z"/><path class="a" d="M17 12h.5"/>',
    restart: '<circle class="f" cx="12" cy="12" r="8"/><path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4"/><path class="a" d="M12 8v4l2.5 2.5"/>',
    check: '<circle class="f" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path class="a" d="M8 12.5l2.5 2.5L16 9.5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    user: '<circle class="f" cx="12" cy="8" r="3.5"/><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    users: '<circle class="f" cx="9" cy="8" r="3.2"/><circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path class="a" d="M15.5 4.9a3.2 3.2 0 0 1 0 6.2M17 14.2a6 6 0 0 1 4 5.8"/>'
  };
  function ico(nome, cls) {
    return ICONE[nome] ? '<svg class="tg-ico' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICONE[nome] + "</svg>" : "";
  }

  /* ---------- tema: scuro di partenza, chiaro a scelta ---------- */
  var TEMA = leggi("tg-tema") === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", TEMA);
  var pulsantiTema = [];
  function aggiornaTema() {
    pulsantiTema.forEach(function (b) {
      var verso = TEMA === "dark" ? "Tema chiaro" : "Tema scuro";
      b.innerHTML = ico(TEMA === "dark" ? "sun" : "moon") + "<span>" + verso + "</span>";
      b.title = "Passa al " + verso.toLowerCase();
    });
  }
  function cambiaTema() {
    TEMA = TEMA === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", TEMA);
    salva("tg-tema", TEMA);
    aggiornaTema();
    window.dispatchEvent(new Event("resize"));   // i grafici su canvas (il BEP) si ridisegnano con i nuovi colori
  }
  function pulsanteTema(b) { pulsantiTema.push(b); b.addEventListener("click", cambiaTema); aggiornaTema(); }
  function tema() { var b = document.getElementById("tg-tema"); if (b) pulsanteTema(b); }

  /* colore del corso della pagina (barra, icone, riquadri) */
  function coloreCorso(id) {
    if (id && CORSI.some(function (c) { return c.id === id; })) document.documentElement.style.setProperty("--tg-c", corso(id).colore);
  }
  function voce(p) { return CAT.filter(function (a) { return a.percorso === p; })[0]; }

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
      /* più corsi con lo stesso nome (TPSIT 3, 4, 5): nel filtro si aggiunge l'anno */
      var nomeChip = function (c) {
        return usati.filter(function (x) { return x.nome === c.nome; }).length > 1 ? c.nome + " " + parseInt(c.anno, 10) : c.nome;
      };
      chips.innerHTML = '<button class="tg-chip" aria-pressed="true" data-c="">Tutte</button>' +
        usati.map(function (c) {
          return '<button class="tg-chip" aria-pressed="false" data-c="' + esc(c.id) + '" style="--c:' + esc(c.colore) + '"><i></i>' + esc(nomeChip(c)) + "</button>";
        }).join("");
      chips.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        stato.corso = b.dataset.c;
        chips.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        disegna();
      });
    }
    if (cerca) {
      var sb = document.createElement("span");
      sb.className = "tg-searchbox";
      cerca.parentNode.insertBefore(sb, cerca);
      sb.innerHTML = ico("search");
      sb.appendChild(cerca);
      cerca.addEventListener("input", function () { stato.testo = cerca.value.trim().toLowerCase(); disegna(); });
    }
    /* pagina di un corso o di un'unità: colore e icona del corso nell'intestazione */
    if (fC) {
      coloreCorso(fC);
      var hero = document.querySelector(".tg-hero");
      if (hero && corso(fC).icona) hero.insertAdjacentHTML("afterbegin", '<span class="tg-badge">' + ico(corso(fC).icona) + "</span>");
    }

    function disegna() {
      var lista = voci.filter(function (a) {
        if (stato.corso && a.percorso.indexOf(stato.corso + "/") !== 0) return false;
        if (!stato.testo) return true;
        var u = UNITA[a.percorso.split("/").slice(0, 2).join("/")] || "";
        return (a.titolo + " " + a.descrizione + " " + u + " " + (a.modalita || "")).toLowerCase().indexOf(stato.testo) >= 0;
      });
      if (!lista.length) { box.innerHTML = '<p class="tg-empty">' + ico("search") + "Nessuna attività trovata.</p>"; return; }

      var html = "", ordine = [];
      lista.forEach(function (a) { var c = a.percorso.split("/")[0]; if (ordine.indexOf(c) < 0) ordine.push(c); });
      ordine.forEach(function (cid) {
        var c = corso(cid);
        html += '<section class="tg-course" style="--c:' + esc(c.colore) + '">';
        if (!fC) html += '<h2><span class="tg-badge sm">' + ico(c.icona) + '</span><a href="' + link(cid) + '">' + esc(c.nome) + "</a><small>" + esc(c.anno) + "</small></h2>";
        var unita = [];
        lista.forEach(function (a) { var p = a.percorso.split("/"); if (p[0] === cid && unita.indexOf(p[1]) < 0) unita.push(p[1]); });
        unita.forEach(function (u) {
          var chiave = cid + "/" + u;
          if (!fU) html += '<h3 class="tg-unit"><a href="' + link(chiave) + '">' + esc(UNITA[chiave] || u) + "</a></h3>";
          html += '<div class="tg-grid">';
          lista.forEach(function (a) {
            if (a.percorso.indexOf(chiave + "/") !== 0) return;
            html += '<a class="tg-card" href="' + link(a.percorso) + '"><span class="tg-head"><span class="tg-badge">' + ico(a.icona) +
              "</span><h3>" + esc(a.titolo) + "</h3></span><p>" + esc(a.descrizione) +
              '</p><span class="tg-meta"><b>' + esc(a.modalita || "") + "</b><span>Apri " + ico("arrow") + "</span></span></a>";
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
    return SITO + (rel ? rel + "/" : "") + location.search + location.hash;
  }

  /* lo stesso indirizzo con la modalità scelta: ?solo o ?coppie solo se diversa da quella della pagina */
  function conModo(url, modo, pagina) {
    var m = url.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
    var q = (m[2] || "").slice(1).split("&").filter(function (x) { return x && !/^(solo|coppie)(=|$)/.test(x); });
    if (modo !== pagina) q.push(modo);
    return m[1] + (q.length ? "?" + q.join("&") : "") + (m[3] || "");
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
      '<span class="tg-btns"><button type="button" data-a="qr" title="Mostra il QR code di questa pagina">' + ico("qr") + "<span>QR</span></button>" +
      (giochiDaStampare().length ? '<button type="button" data-a="scheda" title="Prepara una scheda di esercizi da stampare">' + ico("print") + "<span>Scheda</span></button>" : "") +
      (document.fullscreenEnabled ? '<button type="button" data-a="fs"></button>' : "") +
      '<button type="button" data-a="tema"></button></span>';
    document.body.insertBefore(bar, document.body.firstChild);
    coloreCorso(p[0]);
    bar.querySelector('[data-a="qr"]').addEventListener("click", qr);
    if (bar.querySelector('[data-a="scheda"]')) bar.querySelector('[data-a="scheda"]').addEventListener("click", scheda);
    pulsanteTema(bar.querySelector('[data-a="tema"]'));
    var b = bar.querySelector('[data-a="fs"]');
    if (b) {
      var fs = function () {
        var on = !!document.fullscreenElement;
        b.innerHTML = ico(on ? "shrink" : "expand") + "<span>" + (on ? "Esci da schermo intero" : "Schermo intero") + "</span>";
        b.title = on ? "Esci da schermo intero" : "Schermo intero";
      };
      fs();
      b.addEventListener("click", function () {
        if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen();
      });
      document.addEventListener("fullscreenchange", fs);
    }
    intestazione();
  }

  /* ---------- scheda da stampare (attività tg-act) ----------
     I giochi si annotano in SCHEDA (giochi.js) mentre si montano. Qui si sceglie che cosa mettere nel foglio,
     si vede l'anteprima e si stampa: esercizi sempre nuovi dagli stessi generatori dei giochi, smistamenti e
     riordini come tabelle, e in fondo (a richiesta) le soluzioni con il procedimento. */
  function giochiDaStampare() {
    return document.body.classList.contains("tg-act") && typeof SCHEDA === "object" && SCHEDA ? SCHEDA : [];
  }
  function mescola(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  // un esercizio su carta: domanda, campi da riempire (le scelte diventano caselle), soluzione a parte
  function esercizio(voce, livello, visti) {
    var ex = null;
    for (var k = 0; k < 12; k++) {
      var e;
      try { e = voce.gen(livello); } catch (err) { return null; }
      if (!e || !e.q || !e.fields) return null;
      var chiave = e.q + "|" + e.fields.map(function (f) { return f.exp; }).join("|");
      ex = e;
      if (!visti[chiave]) { visti[chiave] = 1; break; }
    }
    return ex;
  }
  /* la risposta di una scelta come appare tra le opzioni (le opzioni possono essere testo già escapato) */
  function scelta(f) {
    var t = document.createElement("textarea"), o = (f.opts || []).filter(function (x) { t.innerHTML = x; return t.value === String(f.exp); })[0];
    return o !== undefined ? o : esc(f.exp);
  }
  function valore(x) { return typeof x === "number" ? String(x).replace(".", ",") : String(x); }
  function foglio(scelte, soluzioni) {
    var titolo = (document.querySelector("h1") || {}).textContent || document.title;
    var p = percorso().split("/"), c = corso(p[0]), u = UNITA[p[0] + "/" + p[1]];
    var html = '<div class="tg-sch-testa"><div><p class="tg-sch-sopra">' + esc(c.nome + (c.anno ? ", " + c.anno : "") + (u ? " · " + u : "")) +
      "</p><h1>" + esc(titolo) + '</h1></div><p class="tg-sch-nome">Nome <span></span> Classe <span class="c"></span> Data <span class="c"></span></p></div>';
    var sol = [], n = 0;
    scelte.forEach(function (s) {
      var v = s.voce, blocco = "";
      if (v.tipo === "es") {
        var visti = {};
        for (var i = 0; i < s.quanti; i++) {
          var ex = esercizio(v, s.livello, visti);
          if (!ex) break;
          n++;
          blocco += '<li class="tg-sch-es"><div class="q">' + ex.q + "</div>" + ex.fields.map(function (f) {
            if (f.kind === "choice") {
              return '<p class="f"><b>' + f.label + "</b> " + f.opts.filter(Boolean).map(function (o) { return '<span class="ck">' + o + "</span>"; }).join(" ") + "</p>";
            }
            return '<p class="f"><b>' + f.label + '</b> <span class="riga"></span></p>';
          }).join("") + "</li>";
          sol.push('<li value="' + n + '"><b>' + ex.fields.map(function (f) { return (ex.fields.length > 1 ? f.label + ": " : "") + (f.kind === "choice" ? scelta(f) : valore(f.exp)); }).join(" · ") +
            "</b>" + (ex.sol ? '<div class="sp">' + ex.sol + "</div>" : "") + "</li>");
        }
        if (blocco) blocco = '<ol class="tg-sch-lista" start="' + (n - (blocco.match(/tg-sch-es/g) || []).length + 1) + '">' + blocco + "</ol>";
      } else if (v.tipo === "smista") {
        n++;
        var carte = mescola(v.cards).slice(0, 14);
        var cat = {};
        v.buckets.forEach(function (b) { cat[b.id] = b.t; });
        blocco = '<ol class="tg-sch-lista" start="' + n + '"><li class="tg-sch-es"><div class="q">Scrivete accanto a ogni voce la categoria giusta: ' +
          v.buckets.map(function (b) { return "<b>" + b.t + "</b>" + (b.s ? " (" + b.s + ")" : ""); }).join(", ") + '.</div><table class="tg-sch-tab">' +
          carte.map(function (x) { return "<tr><td>" + esc(x[0]) + '</td><td class="vuota"></td></tr>'; }).join("") + "</table></li></ol>";
        sol.push('<li value="' + n + '">' + carte.map(function (x) { return esc(x[0]) + ": <b>" + cat[x[1]] + "</b>"; }).join("; ") + ".</li>");
      } else if (v.tipo === "ordina") {
        n++;
        var ord = v.items.map(function (x, i) { return [x, i]; }), mix;
        do { mix = mescola(ord); } while (mix.length > 1 && mix.every(function (x, i) { return x[1] === i; }));
        blocco = '<ol class="tg-sch-lista" start="' + n + '"><li class="tg-sch-es"><div class="q">Mettete in ordine: scrivete nella casella il numero ' +
          "della posizione (1 = primo).</div><table class=\"tg-sch-tab\">" +
          mix.map(function (x) { return '<tr><td class="num"></td><td><b>' + x[0][0] + "</b>" + (x[0][1] ? "<br><small>" + x[0][1] + "</small>" : "") + "</td></tr>"; }).join("") + "</table></li></ol>";
        sol.push('<li value="' + n + '">' + v.items.map(function (x) { return x[0] + (v.years && x[2] ? " (" + x[2] + ")" : ""); }).join(" → ") + ".</li>");
      }
      if (blocco) html += '<div class="tg-sch-gioco"><h2>' + esc(v.titolo.replace(/^Allenatore: /, "")) + (s.livello && v.livelli ? " · livello " + s.livello : "") + "</h2>" + blocco + "</div>";
    });
    if (!n) html += '<p class="tg-sch-vuoto">Scegliete almeno un gioco a sinistra.</p>';
    if (soluzioni && sol.length) html += '<div class="tg-sch-sol"><h2>Soluzioni</h2><ol>' + sol.join("") + "</ol></div>";
    html += '<p class="tg-sch-piede">' + esc(indirizzo().replace(/^https?:\/\//, "").replace(/[?#].*$/, "")) + "</p>";
    return html;
  }
  function scheda() {
    if (document.querySelector(".tg-sch")) return;
    var voci = giochiDaStampare(), prima = document.activeElement;
    var nomeSez = function (id) { var s = document.getElementById(id); return s ? (s.getAttribute("data-g") || "") : ""; };
    var box = document.createElement("div");
    box.className = "tg-sch";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Scheda da stampare");
    // di partenza: gli esercizi semplici; se non ce ne sono, la prima voce dell'allenatore o la prima in assoluto
    var acceso = voci.map(function (v) { return v.tipo === "es" && !v.menu; });
    if (acceso.indexOf(true) < 0 && voci.length) {
      var k = voci.map(function (v) { return v.tipo; }).indexOf("es");
      acceso[k < 0 ? 0 : k] = true;
    }
    var righe = voci.map(function (v, i) {
      var es = v.tipo === "es";
      return '<label class="tg-sch-voce"><input type="checkbox" data-i="' + i + '"' + (acceso[i] ? " checked" : "") + ">" +
        '<span class="t">' + esc(v.titolo.replace(/^Allenatore: /, "")) + (nomeSez(v.sez) && nomeSez(v.sez) !== v.titolo ? "<small>" + esc(nomeSez(v.sez)) + "</small>" : "") + "</span>" +
        (es ? '<select data-q="' + i + '" aria-label="Quanti esercizi">' + [1, 2, 3, 4, 5, 6, 8, 10].map(function (q) { return "<option" + (q === 3 ? " selected" : "") + ">" + q + "</option>"; }).join("") + "</select>" : "") +
        (v.livelli ? '<select data-l="' + i + '" aria-label="Livello"><option value="1">liv. 1</option><option value="2">liv. 2</option><option value="3">liv. 3</option></select>' : "") +
        "</label>";
    }).join("");
    box.innerHTML = '<aside class="tg-sch-opz"><h2>' + ico("print") + "Scheda da stampare</h2>" +
      "<p>Esercizi sempre nuovi, dagli stessi giochi della pagina. Per la classe o per casa.</p>" +
      '<div class="tg-sch-voci">' + righe + "</div>" +
      '<label class="tg-sch-voce"><input type="checkbox" data-a="sol" checked><span class="t">Soluzioni in fondo</span></label>' +
      '<div class="tg-sch-cmd"><button type="button" class="pri" data-a="stampa">' + ico("print") + "Stampa</button>" +
      '<button type="button" data-a="nuova">' + ico("restart") + "Altra versione</button>" +
      '<button type="button" data-a="chiudi">' + ico("close") + "Chiudi</button></div></aside>" +
      '<div class="tg-sch-carta"><article class="tg-sch-foglio"></article></div>';
    document.body.appendChild(box);
    document.body.classList.add("tg-sch-aperta");

    function disegna() {
      var scelte = [];
      [].forEach.call(box.querySelectorAll(".tg-sch-voci input[data-i]"), function (cb) {
        if (!cb.checked) return;
        var i = +cb.getAttribute("data-i"), q = box.querySelector('[data-q="' + i + '"]'), l = box.querySelector('[data-l="' + i + '"]');
        scelte.push({ voce: voci[i], quanti: q ? +q.value : 1, livello: l ? +l.value : 1 });
      });
      box.querySelector(".tg-sch-foglio").innerHTML = foglio(scelte, box.querySelector('[data-a="sol"]').checked);
    }
    function chiudi() {
      box.remove();
      document.body.classList.remove("tg-sch-aperta");
      document.removeEventListener("keydown", tasto, true);
      if (prima && prima.focus) prima.focus();
    }
    function tasto(e) { if (e.key === "Escape") { e.preventDefault(); chiudi(); } }
    box.querySelector(".tg-sch-opz").addEventListener("change", disegna);
    box.querySelector('[data-a="nuova"]').addEventListener("click", disegna);
    box.querySelector('[data-a="chiudi"]').addEventListener("click", chiudi);
    box.querySelector('[data-a="stampa"]').addEventListener("click", function () { window.print(); });
    document.addEventListener("keydown", tasto, true);
    disegna();
    box.querySelector(".tg-sch-opz button").focus();
  }

  /* icona dell'attività accanto al titolo (tutte le attività, anche quelle da LIM) */
  function intestazione() {
    var a = voce(percorso()), h1 = document.querySelector("h1");
    if (!a || !a.icona || !h1 || h1.closest(".tg-titolo")) return;
    var t = document.createElement("span");
    t.className = "tg-titolo";
    h1.parentNode.insertBefore(t, h1);
    t.innerHTML = '<span class="tg-badge">' + ico(a.icona) + "</span>";
    t.appendChild(h1);
  }

  /* icone nelle schede dei giochi (tg-act): il tipo di gioco si riconosce da cosa c'è nella sezione */
  function tipoScheda(s) {
    if (s.id === "inizio") return "home";
    if (s.id === "res") return "trophy";
    if (s.querySelector("#ms-s")) return "stopwatch";
    if (s.querySelector("#lab")) return "terminal";
    if (s.querySelector(".pool")) return "sort";
    if (s.querySelector(".ord")) return "order";
    if (s.querySelector(".mem")) return "cards";
    if (s.querySelector("button.line")) return "search";
    if (s.querySelector(".sw")) return "switch";
    if (s.querySelector(".grid")) return "pixels";
    if (s.querySelector("select.mt")) return "dumbbell";
    if (s.querySelector(".f select")) return "question";
    return "pencil";
  }
  function iconeSchede() {
    var nav = document.getElementById("nav");
    if (!nav || !document.body.classList.contains("tg-act")) return;
    var cache = {};
    function decora() {
      [].forEach.call(nav.querySelectorAll("#nv1 button[data-s]"), function (b) {
        if (b.querySelector(".tg-ico")) return;
        var id = b.dataset.s, s = document.getElementById(id);
        if (!s) return;
        if (!cache[id]) cache[id] = tipoScheda(s);
        b.insertAdjacentHTML("afterbegin", ico(cache[id]));
      });
    }
    decora();
    new MutationObserver(decora).observe(nav, { childList: true, subtree: true });
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
    /* nelle attività tg-act si sceglie anche la modalità che il codice porta con sé (vedi giochi.js) */
    var pagina = typeof MODO_PAGINA === "string" ? MODO_PAGINA : "";
    var modo = pagina && (typeof SOLO === "boolean" ? (SOLO ? "solo" : "coppie") : pagina);
    box.innerHTML = '<div class="tg-qr-code"></div><p class="tg-qr-url"></p>' +
      (pagina ? '<div class="tg-qr-modo" role="group" aria-label="Modalità">' +
        '<button type="button" data-m="solo">' + ico("user") + "Da soli</button>" +
        '<button type="button" data-m="coppie">' + ico("users") + "A coppie</button></div>" : "") +
      '<p class="tg-qr-hint">Inquadrate il codice con la fotocamera del telefono. Clic o Esc per chiudere.</p>';
    document.body.appendChild(box);
    box.focus();
    [].forEach.call(box.querySelectorAll("[data-m]"), function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        modo = b.getAttribute("data-m");
        aggiorna();
      });
    });

    function aggiorna() {
      var url = pagina ? conModo(indirizzo(), modo, pagina) : indirizzo();
      [].forEach.call(box.querySelectorAll("[data-m]"), function (b) {
        var on = b.getAttribute("data-m") === modo;
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
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
      else if (e.key === "Tab") {
        /* il fuoco resta nel riquadro: gira tra i pulsanti della modalità, se ci sono */
        e.preventDefault();
        var bb = [].slice.call(box.querySelectorAll("button"));
        if (!bb.length) { box.focus(); return; }
        var i = bb.indexOf(document.activeElement) + (e.shiftKey ? -1 : 1);
        bb[(i + bb.length) % bb.length].focus();
      }
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
      /* il browser, a fine caricamento, scorre da solo fino alla sezione #id (ormai visibile)
         e la nav fissa ne coprirebbe il titolo: si riparte dall'alto, come cambiando scheda */
      if (location.hash && document.readyState !== "complete") {
        window.addEventListener("load", function () { setTimeout(function () { window.scrollTo(0, 0); }, 0); }, { once: true });
      }
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
      if (location.hash && document.readyState !== "complete") {
        window.addEventListener("load", function () { setTimeout(function () { window.scrollTo(0, 0); }, 0); }, { once: true });
      }
      window.addEventListener("hashchange", vai);
    }
    /* Processi e thread ha già il suo routing (#quiz, #holt...); Che struttura è non ha schede. */
  }

  /* ---------- progressi salvati nel browser (solo tg-act) ----------
     Il salvataggio e il ripristino stanno nel motore dei giochi (assets/giochi.js, oggetto GIOCHI),
     che ripristina i punteggi prima di montare i giochi. Qui ci sono solo l'avviso in alto
     e il pulsante "Ricomincia da capo" nella schermata finale. */
  var prog = null;

  function progressi() {
    try { prog = typeof GIOCHI === "object" && GIOCHI && typeof GIOCHI.ricomincia === "function" ? GIOCHI : null; } catch (e) {}
    if (!prog || !document.body.classList.contains("tg-act")) { prog = null; return; }
    var ripresi = prog.ripresi, ricomincia = prog.ricomincia;

    /* avviso in alto: chi si siede a un PC condiviso vede subito che ci sono risultati di prima */
    if (ripresi) {
      var main = document.querySelector("main");
      if (!main) return;
      var av = document.createElement("div");
      av.className = "tg-ripresi";
      av.setAttribute("role", "status");
      av.innerHTML = "<span>" + ico("restart") + "Ripresi i progressi salvati in questo browser.</span>" +
        (typeof window.go === "function" && document.getElementById("res") ? '<button type="button" class="btn sec" data-a="vedi">Vedi il risultato</button>' : "") +
        '<button type="button" class="btn sec" data-a="azzera">' + ico("restart") + "Ricomincia da capo</button>" +
        '<button type="button" class="tg-x" data-a="chiudi" aria-label="Chiudi l\'avviso">' + ico("close") + "</button>";
      main.insertBefore(av, main.firstChild);
      av.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        if (b.dataset.a === "azzera") { ricomincia(); return; }
        if (b.dataset.a === "vedi") window.go("res");
        av.remove();
      });
      /* sparisce anche al primo cambio di scheda (si osserva dopo l'apertura iniziale da #id) */
      setTimeout(function () {
        var mo = new MutationObserver(function () { av.remove(); mo.disconnect(); });
        [].forEach.call(document.querySelectorAll("main section[id]"), function (s) {
          mo.observe(s, { attributes: true, attributeFilter: ["class"] });
        });
      }, 0);
    }
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
      var html = '<div class="tg-res-top"><div class="tg-ring" style="--p:' + pc + '"><b>' + (tot ? pc + "%" : ico("trophy")) + "</b></div>" +
        "<div><strong>" + (tot ? ok + " risposte giuste su " + tot : "Nessun gioco ancora completato") + "</strong>" +
        "<span>" + fatte.length + " di " + righe.length + " attività svolte</span></div></div><ul class=\"tg-res-list\">";
      righe.forEach(function (r) {
        var p = r.tot ? Math.round(r.ok * 100 / r.tot) : 0;
        html += '<li class="' + (r.tot ? (p >= 80 ? "ok" : p >= 50 ? "mid" : "ko") : "todo") + '">' + ico(r.tot ? "check" : "stopwatch") + '<span class="n">' + esc(r.nome) +
          '</span><span class="bar"><i style="width:' + p + '%"></i></span><span class="v">' + esc(r.val) + "</span></li>";
      });
      html += '</ul><div class="tg-res-act"><button type="button" class="btn" data-a="copia">' + ico("copy") + "<span>Copia il risultato</span></button>" +
        '<button type="button" class="btn sec" data-a="stampa">' + ico("print") + "Stampa</button>" +
        (prog ? '<button type="button" class="btn sec" data-a="azzera">' + ico("restart") + "Ricomincia da capo</button>" : "") + "</div>";
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
      if (b.dataset.a === "azzera") { if (prog) prog.ricomincia(); return; }
      var l = b.querySelector("span") || b;
      var t = testo(), fatto = function () { l.textContent = "Copiato!"; setTimeout(function () { l.textContent = "Copia il risultato"; }, 1800); };
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
    if (document.body.dataset.tg === "elenco") { tema(); elenco(); } else { barra(); progressi(); risultato(); schede(); iconeSchede(); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", avvia); else avvia();
})();
