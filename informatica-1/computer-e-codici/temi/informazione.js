/* Informazione e codifiche: unità di misura, ASCII, bit o byte, prefissi.
   Codice di argomento condiviso tra la pagina dell'attività e Palestra dei numeri.
   Usa il motore comune (assets/giochi.js), che va caricato prima. Solo definizioni:
   le pagine decidono quali giochi montare e in che ordine. */
function gKiB(l){const n=pick(lv(l,[1,2,4,8],[16,64,100,256],[500,1000,2048])),m=Math.random()<0.5;
 if(m)return{q:`Quanti <b>byte</b> sono <b>${sep(n)} KiB</b>? (1 KiB = 1024 byte)`,fields:[{label:'Byte',exp:String(n*1024),kind:'num',tol:0}],sol:P(`${sep(n)} × 1024 = ${sep(n*1024)} byte`)};
 return{q:`Quanti <b>KiB</b> sono <b>${sep(n)} MiB</b>? (1 MiB = 1024 KiB)`,fields:[{label:'KiB',exp:String(n*1024),kind:'num',tol:0}],sol:P(`${sep(n)} × 1024 = ${sep(n*1024)} KiB`)}}
function gGB(l){const x=pick(lv(l,[1,2,4],[8,16,32,64,128],[250,500,1000,2000])),g=x*1e9/1073741824;
 return{q:`Un disco dichiara <b>${sep(x)} GB</b> (1 GB = 1.000.000.000 byte). Quanti <b>GiB</b> (1 GiB = 1.073.741.824 byte) risultano nel sistema operativo? Due decimali.`,fields:[{label:'GiB',exp:String(g),kind:'num',tol:0.01}],sol:P(`${sep(x)} × 1.000.000.000 = ${sep(x*1e9)} byte\n${sep(x*1e9)} : 1.073.741.824 = ${fmt(g.toFixed(2))} GiB`)}}
function gFiles(l){const g=pick(lv(l,[1,2,4],[4,8,16,32],[16,64,256,500])),mb=pick(lv(l,[5,10,20,50],[2,3,4,6,8,12],[3,7,12,15,25])),n=Math.floor(g*1000/mb);
 return{q:`Quanti file da <b>${mb} MB</b> entrano al massimo in una memoria da <b>${g} GB</b>? (1 GB = 1000 MB)`,fields:[{label:'File',exp:String(n),kind:'num',tol:0}],sol:P(`${g} GB = ${sep(g*1000)} MB\n${sep(g*1000)} : ${mb} = ${fmt((g*1000/mb).toFixed(2))} → ${sep(n)} file interi`)}}
function gBitByte(l){const t=rnd(1,3),n=pick(lv(l,[1,2,4,10],[16,25,50,100],[125,250,500,1000]));
 if(t===1)return{q:`Quanti <b>bit</b> sono <b>${n} byte</b>?`,fields:[{label:'Bit',exp:String(n*8),kind:'num',tol:0}],sol:P(`${n} × 8 = ${n*8} bit`)};
 if(t===2)return{q:`Una connessione da <b>${n*8} Mbit/s</b> può scaricare quanti <b>MB al secondo</b>?`,fields:[{label:'MB/s',exp:String(n),kind:'num',tol:0.005}],sol:P(`${n*8} : 8 = ${n} MB/s`)};
 return{q:`Quanti <b>byte</b> sono <b>${sep(n*8)} bit</b>?`,fields:[{label:'Byte',exp:String(n),kind:'num',tol:0}],sol:P(`${sep(n*8)} : 8 = ${n} byte`)}}
function gBitsFor(l){const N=pick(lv(l,[4,8,10,16,26],[27,50,100,128,200],[256,300,1000,5000,100000]));const k=Math.ceil(Math.log2(N));
 return{q:`Quanti <b>bit</b> servono, al minimo, per distinguere <b>${sep(N)}</b> informazioni diverse (per esempio ${sep(N)} simboli)?`,fields:[{label:'Bit',exp:String(k),kind:'str'}],sol:P(`2^${k-1} = ${sep(Math.pow(2,k-1))} (troppo poco se ${N} > ${Math.pow(2,k-1)})\n2^${k} = ${sep(Math.pow(2,k))} ≥ ${sep(N)}\nServono ${k} bit.`)}}
function gChar(l){const kinds=lv(l,['up'],['up','low','dig'],['up','low','dig','sp']);const k=pick(kinds);let c,code;
 if(k==='up'){code=rnd(65,90)}else if(k==='low'){code=rnd(97,122)}else if(k==='dig'){code=rnd(48,57)}else code=32;c=String.fromCharCode(code);const show=code===32?'lo spazio':`il carattere <b>${c}</b>`;
 return{q:`Qual è il codice ASCII di ${show}? Scrivetelo in decimale e in binario a 8 bit.`,fields:[{label:'Decimale',exp:String(code),kind:'str'},{label:'Binario (8 bit)',exp:B(code,2),kind:'str'}],sol:P(k==='up'?`Le maiuscole partono da A = 65: ${c} è la lettera numero ${code-64}, quindi ${code}`:k==='low'?`Le minuscole partono da a = 97: ${c} è la lettera numero ${code-96}, quindi ${code}`:k==='dig'?`Le cifre partono da 0 = 48: ${c} = 48 + ${code-48} = ${code}`:`Lo spazio ha codice 32`)+`\n${code} = ${B(code,2).padStart(8,'0')} in binario`}}
const WORDS=['CIAO','BYTE','DATI','RETE','BIT','FILE','PIXEL','CODICE','NUMERO','MEMORIA','SCUOLA','LOGICA','WINDOWS','LINUX'];
function gDecode(l){const w=pick(lv(l,WORDS.filter(x=>x.length<=4),WORDS.filter(x=>x.length<=6),WORDS)),codes=[...w].map(c=>c.charCodeAt(0));
 return{q:`Decodificate questo messaggio ASCII (lettere maiuscole): <b>${codes.join(' ')}</b>`,fields:[{label:'Parola',exp:w,kind:'str'}],sol:P(codes.map(c=>`${c} → ${String.fromCharCode(c)}`).join('\n')+`\nRisultato: ${w}`)}}
function gTxt(l){const k=pick(lv(l,[1,2,4],[2,3,5,10],[16,20,50,100])),n=k*1024;
 return{q:`Un testo di <b>${sep(n)} caratteri</b> viene salvato in ASCII (1 byte per carattere). Quanti <b>KiB</b> occupa?`,fields:[{label:'KiB',exp:String(k),kind:'num',tol:0}],sol:P(`${sep(n)} caratteri × 1 byte = ${sep(n)} byte\n${sep(n)} : 1024 = ${k} KiB`)}}
const INFO_ITEMS=[["Unità binarie (KiB, MiB)",gKiB],["GB e GiB",gGB],["Quanti file entrano",gFiles],["Bit e byte",gBitByte],["Quanti bit per n informazioni",gBitsFor],["Codice ASCII di un carattere",gChar],["Decifrare un messaggio ASCII",gDecode],["Dimensione di un testo",gTxt]];

function smistaBitByte(){sortGame($('#bb'),[["Velocità di una connessione (Mbit/s)","bit"],["Dimensione di un file (MB)","byte"],["Capienza di un disco (GB)","byte"],["Bitrate di un video (Mbit/s)","bit"],["Profondità del colore di un'immagine (per esempio 24)","bit"],["Peso di una foto (MiB)","byte"],["Velocità di una fibra ottica (Gbit/s)","bit"],["Contenuto di una chiavetta USB (GB)","byte"],["Dimensione della RAM (GB)","byte"],["Velocità dichiarata dall'operatore di telefonia (Mbit/s)","bit"]],
 [{id:"bit",t:"Si misura in bit",s:"Velocità di trasmissione e profondità del colore"},{id:"byte",t:"Si misura in byte",s:"Dimensione di file e capacità di memorie"}],'Bit o byte?');}
function smistaPrefissi(){sortGame($('#pre'),[["kB","d"],["MB","d"],["GB","d"],["KiB","b"],["MiB","b"],["GiB","b"],["1 MB = 1.000.000 byte","d"],["1 MiB = 1.048.576 byte","b"],["1 KiB = 1024 byte","b"],["1 kB = 1000 byte","d"],["1 GB = 1.000.000.000 byte","d"],["1 GiB = 1.073.741.824 byte","b"]],
 [{id:"d",t:"Prefissi decimali",s:"Potenze di 10: i produttori di dischi li usano"},{id:"b",t:"Prefissi binari",s:"Potenze di 2: 1024 e suoi multipli"}],'Prefissi decimali o binari?');}
