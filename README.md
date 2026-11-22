# teaching

**[teaching.federicodiluca.com](https://teaching.federicodiluca.com)**

Giochi, ripassi e attività interattive che uso nelle mie lezioni di informatica alle superiori.
Ogni attività è una pagina web autonoma: si apre dal browser, da computer o da telefono,
senza installare nulla, senza account e senza raccogliere dati degli studenti.

## Cosa c'è

| Corso | Unità | Attività |
|---|---|---|
| Informatica, 1° anno | Computer e codici | Numeri e basi · Aritmetica binaria · Logica e tavole di verità · Immagini e video · Informazione e codifiche · Palestra dei numeri |
| | Sistemi operativi | Storia dei sistemi operativi e licenze · Percorsi assoluti e relativi · Prompt dei comandi di Windows |
| | Reti di calcolatori | La rete e i suoi pezzi · Indirizzi IP, DNS e URL · Il Web, la ricerca e i rischi |
| | Architettura dei calcolatori e AI | L'informatica intorno a te · Architettura dei calcolatori |
| | Problem solving e algoritmi | Problem solving e algoritmi · Algoritmi con Flowgorithm |
| | C e C++ | Dall'algoritmo al codice · Primi passi in C++ · La selezione in C++ · L'iterazione in C++ |
| | Arduino | Arduino ed elettronica · Arduino: output e input digitali · Arduino: sensori, PWM e attuatori |
| TPSIT, 3° anno | La rappresentazione delle informazioni | Informazione e comunicazione · Digitale e binario · Sistemi di numerazione posizionali · Conversioni di numeri reali e tra basi binarie · Immagini, suoni e video |
| | HTML | La struttura di una pagina HTML · Titoli, paragrafi e formattazione · Liste, link e ancore · Immagini e tabelle · I form · Tag semantici e buone pratiche |
| | I codici digitali | Codici digitali pesati · Codici digitali non pesati · Rilevazione e correzione degli errori · Le codifiche nella vita quotidiana · Codici a barre e QR Code |
| | CSS | Sintassi e selettori · Cascata, ereditarietà e specificità · Il box model · Testo, colori e sfondi · Display e Flexbox · Pseudo-classi, unità e media query |
| | Sistemi operativi | Il sistema operativo · La gestione del processore · La gestione della memoria · Il file system |
| | JavaScript | Le basi di JavaScript · Funzioni, oggetti e array · DOM ed eventi · Errori e librerie standard · JSON e API |
| TPSIT, 4° anno | Processi sequenziali e paralleli | Processi e thread |
| | Comunicazione e sincronizzazione | La comunicazione tra processi · La sincronizzazione tra processi · I semafori · Applicazione dei semafori · Semafori passo passo |
| | Problemi e soluzioni della concorrenza | Produttori e consumatori · Lettori e scrittori · Il deadlock · I monitor · Lo scambio di messaggi · Problemi classici passo passo |
| TPSIT, 5° anno | Architettura di rete | Sistemi distribuiti · Modelli architetturali · Applicazioni web e client-server · Applicazioni di rete |
| | XML e RegEx | Il metalinguaggio XML · XML Schema (XSD) · Le espressioni regolari · RegEx in Java e validazione |
| | Socket e TCP/UDP | Porte, TCP e UDP · Il socket e le sue API · Client e server in Java · Unicast e multicast |
| | Metodologia di sviluppo | DevOps e SRE · Integrazione e rilascio continui · Git: concetti e aree · Git: comandi e branch · GitHub e buone pratiche |
| | JSON, markdown e YAML | Il formato JSON · I file markdown · Il formato YAML |
| | Applicazioni web avanzate | Le applicazioni lato server · PHP: il linguaggio · PHP: form e sessioni · PHP e MySQL · Web service e REST |
| GPOI, 5° anno | Aziende e mercati | Il BEP vivo · L'azienda e i costi · Il mercato e il prezzo |
| | Organizzazione aziendale | Che struttura è? · Organizzazione e processi · Sistema informativo ed ERP |
| | Project management | Il progetto: fasi e obiettivi · Organizzazione, persone e comunicazione · La stima dei costi |
| | PM nei progetti informatici | Progetti informatici e modelli di sviluppo · I requisiti · Pianificazione, documentazione e qualità |

## Come è fatto

- **HTML, CSS e JavaScript puri**: nessun framework, nessuna build, nessuna dipendenza esterna.
- Pubblicato con **GitHub Pages** sul dominio personalizzato (file `CNAME`).
- Gli indirizzi seguono `corso/unità/attività/` e non cambiano nel tempo, così i link dati alle classi restano validi.
- Funziona anche offline: basta aprire `index.html` con un doppio clic.
- **Una sola veste per tutto il sito**: i colori sono token in `assets/teaching.css` (`--tg-bg`, `--tg-paper`,
  `--tg-ink`, `--tg-acc`, `--tg-ok`...). Il **tema scuro** è quello di partenza; il pulsante in alto passa al chiaro
  e la scelta resta nel browser. In stampa la pagina è sempre chiara. Ogni corso ha il suo colore (`colore` in
  `catalogo.js`), usato per la riga sotto la barra e per le icone.
- **Icone SVG** disegnate per il sito nello stile del portfolio (griglia 24×24, tratto, riempimento trasparente nel
  colore del corso, accento giallo come il cursore del logo): sono in `ICONE` dentro `assets/teaching.js` e compaiono
  sulle card, accanto ai titoli delle attività, nelle schede dei giochi, nella barra e nel risultato.
- Ogni attività ha in alto una barra comune con il ritorno all'elenco, lo schermo intero e il pulsante **QR**:
  mostra a tutto schermo il QR code della pagina con l'indirizzo scritto in grande, così alla LIM gli studenti
  la aprono dal telefono. Si chiude con un clic o con Esc. Se la pagina è aperta dal disco, il QR porta comunque
  all'indirizzo pubblico su teaching.federicodiluca.com.
- **Link diretto a un gioco**: `.../attivita/#<id-della-scheda>` apre subito quella scheda (e la sottoscheda),
  per esempio `informatica-1/reti/indirizzi-dns-e-url/#qz2`. Cambiando scheda l'indirizzo si aggiorna da solo
  (senza aggiungere passi alla cronologia), quindi il QR e i link copiati portano sempre alla scheda aperta.
  Vale per le attività `tg-act`, per le due schede del BEP (`#p2`) e per Processi e thread, che lo faceva già
  (`#quiz`, `#smistamento`, `#stati`, `#precedenze`, `#holt`). Le pagine «passo passo» aprono allo stesso modo lo scenario
  (per esempio `tpsit-4/problemi-e-soluzioni-della-concorrenza/problemi-classici-passo-passo/#filosofi`).
- **Progressi salvati nel browser** (attività `tg-act`): punteggi e nomi restano in `localStorage`, una chiave
  per pagina (`tg-progressi:<percorso>`), e tornano ricaricando o riaprendo la pagina, con un avviso in alto.
  Non esce nulla dal browser. Nella scheda Risultato, **Ricomincia da capo** cancella il salvataggio e riparte
  pulito: da usare a fine ora sui PC di laboratorio condivisi. In navigazione privata o con i dati bloccati
  la pagina funziona lo stesso, senza salvare.
- **Da soli o a coppie, dal link** (attività `tg-act`): ogni pagina ha la sua modalità (`data-solo`), ma
  `?solo` o `?coppie` nell'indirizzo la cambiano. Per esempio `informatica-1/computer-e-codici/numeri-e-basi/?solo`
  per i compiti a casa, o `.../palestra-dei-numeri/?coppie` in classe. Cambiano i campi dei nomi, le frasi sui
  turni, i turni nei giochi e l'intestazione del risultato. Nel QR ci sono i pulsanti **Da soli** e **A coppie**:
  il codice cambia subito e porta con sé la modalità scelta (e la scheda aperta).
- **Scheda da stampare** (attività `tg-act`, pulsante **Scheda** nella barra): un foglio di esercizi per la classe
  o per casa, preparato dagli stessi giochi della pagina. A sinistra si scelgono i giochi, quanti esercizi e il
  livello; a destra c'è l'anteprima del foglio, con nome, classe e data in alto. Smistamenti e riordini diventano
  tabelle da completare. Le soluzioni (con il procedimento) vanno in fondo, su una pagina a parte, e si possono
  togliere. **Altra versione** rifà gli esercizi con numeri nuovi, così ogni banco può avere la sua.
  I giochi si annotano da soli in `SCHEDA` (giochi.js) mentre si montano: le attività nuove ce l'hanno già.

```
index.html                 home: una scheda per unità con le sue attività; cercando, le schede delle attività trovate
sitemap.xml, robots.txt   per i motori di ricerca
assets/
  catalogo.js              elenco di corsi, unità e attività (l'unico file da aggiornare)
  teaching.css             stile condiviso
  teaching.js              elenco, filtri, tema scuro; nelle attività barra in alto con il QR, scheda da stampare,
                           link alle schede,
                           avviso dei progressi ripresi e schermata finale
  giochi.js, giochi.css    motore comune delle attività di Informatica 1: schede, giocatori, esercizi,
                           allenatore, missione a tempo, smistamento, riordino, memory, caccia all'errore,
                           quiz da dati, risultato e salvataggio dei progressi
  codice.js                strumenti sul codice (dopo giochi.js): colori della sintassi, esecuzione passo passo
                           (traccia), con i modi Guarda (per spiegare) e Prevedi (per ripassare), e laboratorio
                           dal vivo per HTML, CSS e JavaScript con anteprima, console e controlli automatici
  qr.js                    generatore di QR code (Kazuhiko Arase, licenza MIT), caricato solo al clic su "QR"
<corso>/index.html         elenco delle attività del corso
<corso>/<unità>/index.html elenco delle attività dell'unità
<corso>/<unità>/<attività>/index.html   l'attività
informatica-1/computer-e-codici/temi/   codice di argomento (numeri, aritmetica, logica, immagini, informazione)
                                        condiviso tra le pagine dell'unità e Palestra dei numeri
tpsit-4/temi/passo-passo.js  simulatore delle pagine «passo passo» di TPSIT (semafori e problemi classici)
strumenti/nuova.js         npm run nuova: prepara una nuova attività (non fa parte del sito)
tests/                     controlli automatici (Playwright), non fanno parte del sito
.github/workflows/         i controlli girano su GitHub a ogni push
```

## Controlli automatici

A ogni push su `main` (e a ogni pull request) GitHub Actions esegue i controlli in `tests/`; l'esito si vede
nella scheda **Actions** del repository, con una spunta verde o una croce rossa accanto al commit.

| Controllo | Cosa verifica |
|---|---|
| `link-rotti` | ogni link interno porta a un file esistente; catalogo, pagine di corso e unità, sitemap e icone sono allineati |
| `qr` | il QR di ogni attività si legge e porta all'indirizzo giusto, anche aprendo i file dal disco |
| `link-diretti` | ogni scheda si apre con `#id`, l'indirizzo segue la scheda, il tasto Indietro funziona |
| `progressi` | su tutte le attività con `giochi.js`: si gioca davvero, si ricarica, i punteggi tornano; "Ricomincia da capo"; navigazione privata |
| `modalita` | `?solo` e `?coppie` cambiano nomi, frasi, turni e risultato; i pulsanti del QR cambiano il codice |
| `migrazione` | i salvataggi nel formato vecchio si leggono ancora; i nomi con caratteri HTML non rompono la pagina |
| `fotografia` | con il caso fissato, i giochi generano gli stessi esercizi e gli stessi testi di `tests/fotografia.json` |
| `schermate` | tutte le pagine in tema scuro e chiaro, a 1280 e 390 px, senza errori in console |
| `schede` | in ogni attività a schede ogni gioco finisce sul foglio con la sua soluzione; altra versione, stampa, solo il foglio in stampa |
| `nuova` | su una copia del sito `npm run nuova` crea corsi, unità e attività: catalogo in ordine, sitemap, README, link e pagine funzionanti |

Tutti controllano anche che la console del browser resti senza errori. Le schermate si scaricano dall'esecuzione
(artefatto **schermate**). Per lanciarli sul proprio computer serve Node.js:

```bash
cd tests
npm ci
npx playwright install chromium
npm test              # tutti
npm test -- qr        # solo uno
```

Se si cambiano apposta i testi o i giochi di Informatica 1, la `fotografia` lo segnala: si controlla che le
differenze elencate siano quelle volute e si aggiorna il riferimento con `npm run fotografia:aggiorna`.

## Aggiungere un'attività

Il comando che prepara tutto (serve solo Node.js, senza installare niente), dalla cartella del repository:

```bash
npm run nuova
```

Fa le domande una alla volta (corso, unità, titolo, tipo, modalità, icona, descrizione) e poi:

- crea `<corso>/<unità>/<nome-attivita>/index.html`, che funziona già con dati di esempio: basta cercare
  `DA SCRIVERE` e mettere testi e dati della lezione. Due tipi: **a schede con i giochi comuni** (smistamento,
  riordino, quiz, sfida finale, risultato) oppure **da LIM** (schermate da scorrere con i pulsanti o le frecce);
- aggiunge la voce in `assets/catalogo.js`, l'indirizzo in `sitemap.xml` e il titolo nella tabella di questo README;
- se il corso o l'unità sono nuovi, crea anche le loro pagine di elenco e le voci in `CORSI` e `UNITA`
  (un corso nuovo si mette in ordine di anno).

Le risposte si possono anche passare tutte insieme, per esempio:

```bash
npm run nuova -- --corso tpsit-3 --corso-nome TPSIT --anno "3° anno" --colore "#b45309" --corso-icona cpu \
  --unita reti-e-protocolli --unita-nome "Reti e protocolli" --titolo "Il modello ISO/OSI" \
  --tipo giochi --modalita "da soli" --icona network --descrizione "I sette livelli, un gioco alla volta."
```

Il comando non fa commit. Quando la pagina è pronta: `npm test` (dentro `tests/`), per una pagina a schede
`npm run fotografia:aggiorna` così entra nella fotografia dei giochi, poi commit e push.

Com'è fatta una pagina, per scriverla o sistemarla a mano:

1. La pagina è `<corso>/<unità>/<nome-attivita>/index.html`.
2. **Attività a schede con i giochi comuni** (come quelle di Informatica 1): tieni lo schema, scrivendo solo
   testi, dati e chiamate ai giochi:
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
   Nella `mission` vanno bene anche i generatori di `hunt`: diventano la scelta della riga sbagliata.
   Con `data-g="Gruppo"` sulle sezioni le schede si raggruppano in sottoschede. Gli `id` delle sezioni finiscono
   negli indirizzi dati alle classi (`#s1`): una volta pubblicati non vanno rinominati, e neanche le etichette dei
   giochi, che sono le chiavi dei progressi salvati. Accanto al CSS comune basta la riga
   `<link rel="stylesheet" href="../../../assets/giochi.css">` prima di quelle del punto 4.
   Se più pagine usano gli stessi generatori di esercizi, mettili in un file `temi/<argomento>.js` dell'unità
   (solo definizioni) e caricalo dopo `giochi.js`, come fanno le pagine di Computer e codici.
   **Esecuzione passo passo**: carica anche `assets/codice.js` dopo `giochi.js` e chiama
   `traccia($('#tra'), gen, 'Etichetta')` (oppure un elenco `[['Nome', gen], ...]` per avere un menu di programmi).
   `gen()` restituisce `{t, lang, code: [righe], run(S)}`: `run` esegue il programma in JavaScript e dopo ogni riga
   chiama `S(riga, {variabili}, scritto, nota)`. Esempi in `informatica-1/cpp/temi/cpp.js` (funzioni `pp...`).
   **Laboratorio dal vivo**: `laboratorio($('#lab'), [sfide], 'Etichetta')`; ogni sfida ha `t`, `nome`, il codice di
   partenza (`html`, `css`, `js`), `edit` (le parti modificabili), `controlli: [[descrizione, (doc, win, log) => ...], ...]`
   e `sol`. I controlli girano in una copia nascosta della pagina (possono premere pulsanti) e devono usare solo i loro
   argomenti; `stile(doc, 'selettore', 'proprietà')` legge lo stile calcolato. Esempi in TPSIT 3: Il box model,
   DOM ed eventi, Liste e link.
3. **Attività con un layout proprio** (pensate per la LIM): `<body class="tg-lim tg-<nome>">`, con stile e script
   nella pagina e poche regole dedicate in `teaching.css`. Nessuna risorsa esterna (font, librerie da CDN):
   tutto deve funzionare anche offline.
   Le attività da LIM ricevono il tema scuro da `teaching.css`: le loro variabili di colore (`--bg`, `--card`,
   `--ink`...) vengono ridefinite sui token del sito, quindi conviene usare variabili anche nel loro CSS e negli SVG
   generati, invece di colori scritti a mano.
4. In entrambi i casi, prima di `</head>` vanno le quattro righe comuni (ogni `../` sale di una cartella, quindi sono tre):
   ```html
   <link rel="icon" href="../../../assets/favicon.svg" type="image/svg+xml">
   <link rel="stylesheet" href="../../../assets/teaching.css">
   <script src="../../../assets/catalogo.js" defer></script>
   <script src="../../../assets/teaching.js" defer></script>
   ```
5. Aggiungi una voce in `assets/catalogo.js` (con `icona`: il nome di un'icona di `ICONE`, o disegnane una nuova) e il nuovo indirizzo in `sitemap.xml`. Se il corso o l'unità sono nuovi, aggiungili in `CORSI`
   e `UNITA` e copia una pagina `index.html` di corso o di unità esistente, cambiando `data-corso` e `data-unita`.
6. Commit e push: in un minuto è online. Nella scheda Actions si vede se i controlli sono passati; per una nuova
   attività `tg-act` conviene aggiornare la fotografia (`npm run fotografia:aggiorna`), così entra nei controlli.

## Licenza

[CC BY-NC-SA 4.0](LICENSE): puoi usare e modificare le attività per la didattica, citando l'autore e
condividendo le modifiche con la stessa licenza; non per scopi commerciali.

---

Fatto da [Federico Di Luca](https://federicodiluca.com).
