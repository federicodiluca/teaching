/* Catalogo del sito: l'unico file da aggiornare quando si aggiunge un'attività.
   percorso = cartella dell'attività (corso/unità/nome), senza barre iniziali o finali. */

window.CORSI = [
  { id: "informatica-1", nome: "Informatica", anno: "1° anno", colore: "#2f5bea", icona: "terminal" },
  { id: "tpsit-4", nome: "TPSIT", anno: "4° anno", colore: "#7c3aed", icona: "cpu" },
  { id: "gpoi", nome: "GPOI", anno: "5° anno", colore: "#0f766e", icona: "building" }
];

window.UNITA = {
  "informatica-1/computer-e-codici": "Computer e codici",
  "informatica-1/sistemi-operativi": "Sistemi operativi",
  "informatica-1/reti": "Reti di calcolatori",
  "tpsit-4/processi-sequenziali-e-paralleli": "Processi sequenziali e paralleli",
  "gpoi/aziende-e-mercati": "Aziende e mercati",
  "gpoi/organizzazione-d-impresa": "Organizzazione d'impresa"
};

/* icona: nome di un'icona di assets/teaching.js (ICONE).
   modalita: "a coppie", "da soli", "a squadre", "in laboratorio", "alla lavagna" */
window.CATALOGO = [
  { percorso: "informatica-1/computer-e-codici/numeri-e-basi", titolo: "Numeri e basi", icona: "binary",
    descrizione: "Interruttori, allenatore, caccia all'errore e memory per le conversioni tra decimale, binario, ottale ed esadecimale.",
    modalita: "a coppie" },
  { percorso: "informatica-1/computer-e-codici/aritmetica-binaria", titolo: "Aritmetica binaria", icona: "calc",
    descrizione: "Somme in colonna in binario e cosa succede quando i bit non bastano.",
    modalita: "a coppie" },
  { percorso: "informatica-1/computer-e-codici/logica-e-tavole-di-verita", titolo: "Logica e tavole di verità", icona: "gate",
    descrizione: "Costruire, riconoscere e confrontare tavole di verità.",
    modalita: "a coppie" },
  { percorso: "informatica-1/computer-e-codici/immagini-e-video", titolo: "Immagini e video", icona: "image",
    descrizione: "Un editor di pixel, il disegno dal codice e i calcoli sulle dimensioni di immagini e video.",
    modalita: "a coppie" },
  { percorso: "informatica-1/computer-e-codici/informazione-e-codifiche", titolo: "Informazione e codifiche", icona: "bytes",
    descrizione: "Bit, byte, prefissi e codice ASCII.",
    modalita: "a coppie" },
  { percorso: "informatica-1/computer-e-codici/palestra-dei-numeri", titolo: "Palestra dei numeri", icona: "dumbbell",
    descrizione: "Tutti i giochi sui numeri in una pagina, con esercizi sempre nuovi e il procedimento mostrato a ogni errore.",
    modalita: "da soli" },
  { percorso: "informatica-1/sistemi-operativi/storia-e-licenze", titolo: "Storia dei sistemi operativi e licenze", icona: "layers",
    descrizione: "Linea del tempo, livelli del software, avvio del computer, file e licenze.",
    modalita: "da soli" },
  { percorso: "informatica-1/reti/la-rete-e-i-suoi-pezzi", titolo: "La rete e i suoi pezzi", icona: "network",
    descrizione: "Comunicazione, tipi di rete, client e server, mezzi trasmissivi e dispositivi.",
    modalita: "da soli" },
  { percorso: "informatica-1/reti/indirizzi-dns-e-url", titolo: "Indirizzi IP, DNS e URL", icona: "globe",
    descrizione: "Si esplora la rete della scuola dal prompt dei comandi, poi indirizzi IPv4 e IPv6, domini e URL.",
    modalita: "in laboratorio" },
  { percorso: "informatica-1/reti/web-ricerca-e-sicurezza", titolo: "Il Web, la ricerca e i rischi", icona: "shield",
    descrizione: "Protocolli, tag HTML, motori di ricerca, minacce della rete e come difendersi.",
    modalita: "da soli" },
  { percorso: "tpsit-4/processi-sequenziali-e-paralleli/processi-e-thread", titolo: "Processi e thread", icona: "threads",
    descrizione: "Quiz a votazione, smistamento, stati dei processi, grafo delle precedenze e grafo di Holt: pensato per la LIM.",
    modalita: "alla lavagna" },
  { percorso: "gpoi/aziende-e-mercati/bep", titolo: "Il BEP vivo", icona: "bep",
    descrizione: "Ripasso del Break Even Point su un caso reale: si muovono costi e prezzi e si vede il punto di pareggio spostarsi.",
    modalita: "alla lavagna" },
  { percorso: "gpoi/organizzazione-d-impresa/che-struttura-e", titolo: "Che struttura è?", icona: "org",
    descrizione: "Casi aziendali da leggere insieme: ogni squadra sceglie la struttura organizzativa giusta e la motiva.",
    modalita: "a squadre" }
];
