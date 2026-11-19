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

```
index.html                 home con l'elenco di tutte le attività
sitemap.xml, robots.txt   per i motori di ricerca
assets/
  catalogo.js              elenco di corsi, unità e attività (l'unico file da aggiornare)
  teaching.css             stile condiviso
  teaching.js              elenco, filtri, tema scuro e barra in alto nelle attività
<corso>/index.html         elenco delle attività del corso
<corso>/<unità>/index.html elenco delle attività dell'unità
<corso>/<unità>/<attività>/index.html   l'attività
```

## Aggiungere un'attività

1. Crea la cartella `<corso>/<unità>/<nome-attivita>/` e mettici l'attività come `index.html`
   (un unico file con stile e script inclusi).
2. Se l'attività usa la struttura comune (header, nav con le schede, `main`, `.card`, `.btn`), scrivi `<body class="tg-act">`:
   prende la veste grafica del sito senza cambiare nulla del suo codice.
3. Prima di `</head>` aggiungi le quattro righe comuni (ogni `../` sale di una cartella, quindi sono tre):
   ```html
   <link rel="icon" href="../../../assets/favicon.svg" type="image/svg+xml">
   <link rel="stylesheet" href="../../../assets/teaching.css">
   <script src="../../../assets/catalogo.js" defer></script>
   <script src="../../../assets/teaching.js" defer></script>
   ```
4. Aggiungi una voce in `assets/catalogo.js` e il nuovo indirizzo in `sitemap.xml`. Se il corso o l'unità sono nuovi, aggiungili in `CORSI`
   e `UNITA` e copia una pagina `index.html` di corso o di unità esistente, cambiando `data-corso` e `data-unita`.
5. Commit e push: in un minuto è online.

## Licenza

[CC BY-NC-SA 4.0](LICENSE): puoi usare e modificare le attività per la didattica, citando l'autore e
condividendo le modifiche con la stessa licenza; non per scopi commerciali.

---

Fatto da [Federico Di Luca](https://federicodiluca.com).
