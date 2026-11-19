# teaching

**[teaching.federicodiluca.com](https://teaching.federicodiluca.com)**

Giochi, ripassi e attività interattive che uso nelle mie lezioni di informatica alle superiori.
Ogni attività è una pagina web autonoma: si apre dal browser, da computer o da telefono,
senza installare nulla, senza account e senza raccogliere dati degli studenti.

## Cosa c'è

| Corso | Unità | Attività |
|---|---|---|
| Informatica, 1° anno | Computer e codici | Numeri e basi · Aritmetica binaria · Logica e tavole di verità · Immagini e video · Informazione e codifiche · Palestra dei numeri |
| | Sistemi operativi | Storia dei sistemi operativi e licenze |
| | Reti di calcolatori | La rete e i suoi pezzi · Indirizzi IP, DNS e URL · Il Web, la ricerca e i rischi |
| TPSIT, 4° anno | Processi sequenziali e paralleli | Processi e thread |
| GPOI, 5° anno | Aziende e mercati | Il BEP vivo |
| | Organizzazione d'impresa | Che struttura è? |

## Come è fatto

- **HTML, CSS e JavaScript puri**: nessun framework, nessuna build, nessuna dipendenza esterna.
- Pubblicato con **GitHub Pages** sul dominio personalizzato (file `CNAME`).
- Gli indirizzi seguono `corso/unità/attività/` e non cambiano nel tempo, così i link dati alle classi restano validi.
- Funziona anche offline: basta aprire `index.html` con un doppio clic.
- Ogni attività ha in alto una barra comune con il ritorno all'elenco, lo schermo intero e il pulsante **QR**:
  mostra a tutto schermo il QR code della pagina con l'indirizzo scritto in grande, così alla LIM gli studenti
  la aprono dal telefono. Si chiude con un clic o con Esc. Se la pagina è aperta dal disco, il QR porta comunque
  all'indirizzo pubblico su teaching.federicodiluca.com.
- **Link diretto a un gioco**: `.../attivita/#<id-della-scheda>` apre subito quella scheda (e la sottoscheda),
  per esempio `informatica-1/reti/indirizzi-dns-e-url/#qz2`. Cambiando scheda l'indirizzo si aggiorna da solo
  (senza aggiungere passi alla cronologia), quindi il QR e i link copiati portano sempre alla scheda aperta.
  Vale per le attività `tg-act`, per le due schede del BEP (`#p2`) e per Processi e thread, che lo faceva già
  (`#quiz`, `#smistamento`, `#stati`, `#precedenze`, `#holt`).
- **Progressi salvati nel browser** (attività `tg-act`): punteggi e nomi restano in `localStorage`, una chiave
  per pagina (`tg-progressi:<percorso>`), e tornano ricaricando o riaprendo la pagina, con un avviso in alto.
  Non esce nulla dal browser. Nella scheda Risultato, **Ricomincia da capo** cancella il salvataggio e riparte
  pulito: da usare a fine ora sui PC di laboratorio condivisi. In navigazione privata o con i dati bloccati
  la pagina funziona lo stesso, senza salvare.

```
index.html                 home con l'elenco di tutte le attività
sitemap.xml, robots.txt   per i motori di ricerca
assets/
  catalogo.js              elenco di corsi, unità e attività (l'unico file da aggiornare)
  teaching.css             stile condiviso
  teaching.js              elenco, filtri, tema scuro; nelle attività barra in alto con il QR, link alle schede,
                           avviso dei progressi ripresi e schermata finale
  giochi.js, giochi.css    motore comune delle attività di Informatica 1: schede, giocatori, esercizi,
                           allenatore, missione a tempo, smistamento, riordino, memory, caccia all'errore,
                           quiz da dati, risultato e salvataggio dei progressi
  qr.js                    generatore di QR code (Kazuhiko Arase, licenza MIT), caricato solo al clic su "QR"
<corso>/index.html         elenco delle attività del corso
<corso>/<unità>/index.html elenco delle attività dell'unità
<corso>/<unità>/<attività>/index.html   l'attività
informatica-1/computer-e-codici/temi/   codice di argomento (numeri, aritmetica, logica, immagini, informazione)
                                        condiviso tra le pagine dell'unità e Palestra dei numeri
```

## Aggiungere un'attività

1. Crea la cartella `<corso>/<unità>/<nome-attivita>/` e mettici l'attività come `index.html`.
2. **Attività a schede con i giochi comuni** (come quelle di Informatica 1): copia una pagina esistente e
   tieni lo schema, scrivendo solo testi, dati e chiamate ai giochi:
   ```html
   <body class="tg-act">                      <!-- data-solo="1" se si gioca da soli -->
   <header><h1>Titolo</h1></header><nav id="nav"></nav><main>
   <section id="inizio" data-t="Inizio">... <input type="text" id="n1"> <input type="text" id="n2"></section>
   <section id="s1" data-t="1 Smistamento"><div id="srt"></div></section>
   <section id="ms-sec" data-t="Missione finale"><div id="ms"></div></section>
   <section id="res" data-t="Risultato"><h2>Risultato</h2><p id="who" class="lead"></p>
     <table class="res" id="restab"></table><p class="msg" id="rmsg"></p></section>
   </main>
   <script src="../../../assets/giochi.js"></script>
   <script>
   SG('#srt', [["carta", "a"], ...], [{id: "a", t: "Categoria A"}, ...], 'Smistamento');
   mission($('#ms'), [gen1, gen2, ...], 'Missione finale');
   </script>
   ```
   I giochi disponibili sono descritti in testa a `assets/giochi.js`: `mount` (esercizio con campi), `mountMenu`
   (allenatore con menu e livelli), `mission` (a tempo), `SG`/`sortGame`, `orderGame`, `memory`, `hunt`, `quiz`.
   Con `data-g="Gruppo"` sulle sezioni le schede si raggruppano in sottoschede. Gli `id` delle sezioni finiscono
   negli indirizzi dati alle classi (`#s1`): una volta pubblicati non vanno rinominati, e neanche le etichette dei
   giochi, che sono le chiavi dei progressi salvati. Accanto al CSS comune basta la riga
   `<link rel="stylesheet" href="../../../assets/giochi.css">` prima di quelle del punto 4.
   Se più pagine usano gli stessi generatori di esercizi, mettili in un file `temi/<argomento>.js` dell'unità
   (solo definizioni) e caricalo dopo `giochi.js`, come fanno le pagine di Computer e codici.
3. **Attività con un layout proprio** (pensate per la LIM): `<body class="tg-lim tg-<nome>">`, con stile e script
   nella pagina e poche regole dedicate in `teaching.css`. Nessuna risorsa esterna (font, librerie da CDN):
   tutto deve funzionare anche offline.
4. In entrambi i casi, prima di `</head>` vanno le quattro righe comuni (ogni `../` sale di una cartella, quindi sono tre):
3. Prima di `</head>` aggiungi le quattro righe comuni (ogni `../` sale di una cartella, quindi sono tre):
   ```html
   <link rel="icon" href="../../../assets/favicon.svg" type="image/svg+xml">
   <link rel="stylesheet" href="../../../assets/teaching.css">
   <script src="../../../assets/catalogo.js" defer></script>
   <script src="../../../assets/teaching.js" defer></script>
   ```
5. Aggiungi una voce in `assets/catalogo.js` e il nuovo indirizzo in `sitemap.xml`. Se il corso o l'unità sono nuovi, aggiungili in `CORSI`
   e `UNITA` e copia una pagina `index.html` di corso o di unità esistente, cambiando `data-corso` e `data-unita`.
6. Commit e push: in un minuto è online.

## Licenza

[CC BY-NC-SA 4.0](LICENSE): puoi usare e modificare le attività per la didattica, citando l'autore e
condividendo le modifiche con la stessa licenza; non per scopi commerciali.

---

Fatto da [Federico Di Luca](https://federicodiluca.com).
