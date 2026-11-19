/* Numeri e basi: conversioni, interruttori, caccia all'errore, memory.
   Codice di argomento condiviso tra la pagina dell'attività e Palestra dei numeri.
   Usa il motore comune (assets/giochi.js), che va caricato prima. Solo definizioni:
   le pagine decidono quali giochi montare e in che ordine. */
function solDec2Bin(n,base=2){let L=[],x=n;if(x===0)return `0 : ${base} = 0 resto 0\n`;while(x>0){const q=Math.floor(x/base),r=x%base;L.push(`${x} : ${base} = ${q}  resto ${B(r,base)}`);x=q}return L.join('\n')+`\nSi leggono i resti dal basso verso l'alto: ${B(n,base)}\n`}
function solPoly(bits){const n=bits.length;let t=[],v=[];[...bits].forEach((c,i)=>{const p=n-1-i;t.push(`${c}×2^${p}`);if(c==='1')v.push(Math.pow(2,p))});return t.join(' + ')+`\n= ${v.join(' + ')} = ${v.reduce((a,b)=>a+b,0)}\n`}
function solFracToBin(k,m){let x=k/Math.pow(2,m),bits='',L=[];for(let i=0;i<m;i++){const y=x*2,b=Math.floor(y);L.push(`${fmt(x)} × 2 = ${fmt(y)}  → ${b}`);bits+=b;x=y-b}return L.join('\n')+`\nSi leggono le cifre intere dall'alto verso il basso: ,${bits}\n`}
function groups(bits,k){const p=(k-bits.length%k)%k;return ('0'.repeat(p)+bits).match(new RegExp('.{'+k+'}','g'))}
function solGroup(bits,k,base){const g=groups(bits,k);return `Gruppi da ${k} bit (da destra): ${g.join(' ')}  →  ${g.map(x=>B(parseInt(x,2),base)).join('')}\n`}
function gBin2Dec(l){const bits=lv(l,rnd(4,5),rnd(6,8),rnd(9,12));const n=rnd(1<<(bits-1),(1<<bits)-1),b=B(n,2);
 return{q:`Convertite in decimale il numero binario <b>${b}</b>`,fields:[{label:'Decimale',exp:String(n),kind:'str'}],sol:P(solPoly(b))}}
function gDec2Bin(l){const n=lv(l,rnd(5,31),rnd(32,255),rnd(256,4095));return{q:`Convertite in binario il numero decimale <b>${n}</b>`,fields:[{label:'Binario',exp:B(n,2),kind:'str'}],sol:P(solDec2Bin(n))}}
function gBinFrac2Dec(l){const ib=lv(l,3,4,rnd(4,6)),m=lv(l,2,3,rnd(3,4));const n=rnd(1<<(ib-1),(1<<ib)-1),k=rnd(0,(1<<m)-1)|1;const bi=B(n,2),bf=B(k,2).padStart(m,'0');const val=n+k/(1<<m);
 const fp=[...bf].map((c,i)=>`${c}×2^-${i+1}`).join(' + '),fv=[...bf].map((c,i)=>c==='1'?fmt(1/Math.pow(2,i+1)):null).filter(x=>x);
 return{q:`Convertite in decimale il numero binario <b>${bi},${bf}</b>`,fields:[{label:'Decimale',exp:fmt(val),kind:'str'}],sol:P(`Parte intera ${bi}:\n${solPoly(bi)}Parte frazionaria ,${bf}:\n${fp}\n= ${fv.join(' + ')} = ${fmt(k/(1<<m))}\nTotale: ${n} + ${fmt(k/(1<<m))} = ${fmt(val)}`)}}
function gDecFrac2Bin(l){const m=lv(l,2,4,5),n=rnd(1,lv(l,15,63,255)),k=rnd(0,(1<<m)-1)|1;const val=n+k/(1<<m),bf=B(k,2).padStart(m,'0');
 return{q:`Convertite in binario il numero decimale <b>${fmt(val)}</b>`,fields:[{label:'Binario',exp:B(n,2)+','+bf,kind:'str'}],sol:P(`Parte intera ${n}:\n${solDec2Bin(n)}Parte frazionaria ${fmt(k/(1<<m))}:\n${solFracToBin(k,m)}Risultato: ${B(n,2)},${bf}`)}}
function gBin2OctHex(l){const len=lv(l,rnd(6,8),rnd(9,12),rnd(13,16));const n=(1<<(len-1))+rnd(0,(1<<(len-1))-1),b=B(n,2);
 return{q:`Convertite il numero binario <b>${b}</b> in ottale e in esadecimale`,fields:[{label:'Ottale',exp:B(n,8),kind:'str'},{label:'Esadecimale',exp:B(n,16),kind:'str'}],sol:P(`Ottale:\n${solGroup(b,3,8)}Esadecimale:\n${solGroup(b,4,16)}`)}}
function gDec2All(l){const n=lv(l,rnd(16,255),rnd(256,4095),rnd(4096,65535)),b=B(n,2);
 return{q:`Convertite il numero decimale <b>${n}</b> in binario, ottale ed esadecimale`,fields:[{label:'Binario',exp:b,kind:'str'},{label:'Ottale',exp:B(n,8),kind:'str'},{label:'Esadecimale',exp:B(n,16),kind:'str'}],sol:P(`Binario:\n${solDec2Bin(n)}Ottale:\n${solGroup(b,3,8)}Esadecimale:\n${solGroup(b,4,16)}`)}}
function gHex2OctDec(l){const d=lv(l,2,3,4);const n=(1<<(4*(d-1)))*rnd(1,15)+rnd(0,(1<<(4*(d-1)))-1),h=B(n,16),b=B(n,2),digs=[...h];
 return{q:`Convertite il numero esadecimale <b>${h}</b> in ottale e in decimale`,fields:[{label:'Ottale',exp:B(n,8),kind:'str'},{label:'Decimale',exp:String(n),kind:'str'}],
 sol:P(`Esadecimale → binario (ogni cifra = 4 bit): ${digs.map(c=>B(parseInt(c,16),2).padStart(4,'0')).join(' ')} = ${b}\nBinario → ottale:\n${solGroup(b,3,8)}Decimale:\n${digs.map((c,i)=>`${c}(=${parseInt(c,16)})×16^${d-1-i}`).join(' + ')} = ${n}\n`)}}
function gOct2BinHex(l){const d=lv(l,2,3,4);const n=(1<<(3*(d-1)))*rnd(1,7)+rnd(0,(1<<(3*(d-1)))-1),o=B(n,8),b=B(n,2);
 return{q:`Convertite il numero ottale <b>${o}</b> in binario e in esadecimale`,fields:[{label:'Binario',exp:b,kind:'str'},{label:'Esadecimale',exp:B(n,16),kind:'str'}],
 sol:P(`Ottale → binario (ogni cifra = 3 bit): ${[...o].map(c=>B(parseInt(c,8),2).padStart(3,'0')).join(' ')} = ${b}\nBinario → esadecimale:\n${solGroup(b,4,16)}`)}}
const NUM_ITEMS=[["Binario → decimale",gBin2Dec],["Decimale → binario",gDec2Bin],["Binario con virgola → decimale",gBinFrac2Dec],["Decimale con virgola → binario",gDecFrac2Bin],["Binario → ottale e esadecimale",gBin2OctHex],["Decimale → binario, ottale, esadecimale",gDec2All],["Esadecimale → ottale e decimale",gHex2OctDec],["Ottale → binario e esadecimale",gOct2BinHex]];

/* interruttori */
let bits=Array(8).fill(0),tg=0,tgDone=false;const val=()=>bits.reduce((a,v,i)=>a+v*(128>>i),0);
function drawSw(){const sw=$('#sw');sw.innerHTML='';bits.forEach((v,i)=>{const d=document.createElement('div');d.className='bit'+(v?' on':'');d.innerHTML=`<b>${v}</b><small>${128>>i}</small>`;d.onclick=()=>{bits[i]^=1;drawSw();chk()};sw.appendChild(d)});
 const n=val();$('#sv').innerHTML=`Binario ${B(n,2).padStart(8,'0')} · Decimale ${n} · Ottale ${B(n,8)} · Esadecimale ${B(n,16)}`}
function newTg(){tg=rnd(1,255);tgDone=false;$('#tgq').innerHTML=`Fate comparire il numero decimale <b>${tg}</b>`;$('#tgm').textContent='';bits=Array(8).fill(0);drawSw()}
function chk(){if(val()===tg&&!tgDone){tgDone=true;const s=stat('Interruttori: numeri trovati');s.ok++;s.tot++;$('#tgm').textContent='Esatto!';$('#tgm').style.color='var(--ok)'}}
function interruttori(){$('#tgn').onclick=newTg;newTg();}
/* caccia all'errore */
function gHunt(){const t=rnd(1,3);
 if(t===1){const n=rnd(20,255);let x=n,L=[],bi=-1;const steps=[];while(x>0){steps.push(x);x=Math.floor(x/2)}const idx=rnd(0,steps.length-2);let why='';
  steps.forEach((x,i)=>{const q=Math.floor(x/2),r=x%2;let rr=r;if(i===idx){rr=1-r;why=`${x} : 2 fa ${q} con resto ${r}, non ${rr}.`}L.push(`${x} : 2 = ${q}  resto ${rr}`)});
  return{t:`Una di queste divisioni per convertire ${n} in binario è sbagliata. Fate clic sulla riga errata.`,lines:L,bad:idx,why}}
 if(t===2){const len=rnd(8,12),n=(1<<(len-1))+rnd(0,(1<<(len-1))-1),b=B(n,2),g=groups(b,4);const idx=rnd(0,g.length-1);const L=[];let why='';
  g.forEach((x,i)=>{let d=B(parseInt(x,2),16);if(i===idx){let w;do{w=B(rnd(0,15),16)}while(w===d);why=`${x} vale ${d}, non ${w}.`;d=w}L.push(`${x} → ${d}`)});
  return{t:`Conversione di ${b} in esadecimale a gruppi di 4 bit: una riga è sbagliata. Quale?`,lines:L,bad:idx,why}}
 const len=rnd(5,7),n=(1<<(len-1))+rnd(0,(1<<(len-1))-1),b=B(n,2),L=[];const idx=rnd(0,len-1);let why='';
 [...b].forEach((c,i)=>{const p=len-1-i;let v=c==='1'?Math.pow(2,p):0;if(i===idx){let w;do{w=pick([1,2,4,8,16,32,64,0].filter(z=>z!==v))}while(w===v);why=`${c}×2^${p} vale ${v}, non ${w}.`;v=w}L.push(`${c}×2^${p} = ${v}`)});
 return{t:`Per convertire ${b} in decimale si calcolano i termini: una riga è sbagliata. Quale?`,lines:L,bad:idx,why}}
/* memory */
function memNum(){const items=[];const kinds=[['bin','dec'],['hex','dec'],['oct','bin'],['hex','bin'],['dec','oct'],['bin','hex']];const used=new Set();
 kinds.forEach(k=>{let n;do{n=rnd(9,255)}while(used.has(n));used.add(n);const nm={bin:2,dec:10,oct:8,hex:16},lab={bin:'(2)',dec:'',oct:'(8)',hex:'(16)'};
  items.push([n,B(n,nm[k[0]])+' '+lab[k[0]].trim()],[n,B(n,nm[k[1]])+' '+lab[k[1]].trim()])});
 return items}
