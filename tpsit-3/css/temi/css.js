/* CSS (TPSIT 3): giochi ad hoc. Solo definizioni: va caricato dopo assets/giochi.js.
   - duelloCSS(el, etichetta): un pezzo di HTML con un elemento evidenziato e alcune regole che gli danno colori diversi.
     Si sceglie il colore finale; poi la pagina viene disegnata davvero (in uno shadow DOM, quindi decide il browser)
     e si vede per ogni regola se colpisce l'elemento, la sua specificità e chi vince.
   - flexLab(el, etichetta): scatole da portare nelle posizioni tratteggiate scegliendo le proprietà flex del contenitore.
   Gli stili sono in assets/giochi.css (sezione "simulatori"). */

const DUELLO_HTML = [
  { righe: ['<nav id="menu">', '  <ul class="lista">', '    <li class="voce"><a class="link" href="#">Notizie</a></li>', '    <li class="voce"><a class="link attivo" href="#">Home</a></li>', '  </ul>', '</nav>'], riga: 3, bersaglio: 'a.attivo', nome: 'il link «Home»',
    si: ['a', '.link', '.attivo', 'a.attivo', '#menu a', 'nav .link', 'li a', 'ul li a.link', '#menu .attivo', '.lista .voce a', 'nav ul li a', '.voce .attivo', '#menu li .link'],
    no: ['p a', '.voce.attivo', '#main a', 'ul > a', 'span.link', '.menu a', 'nav > a', '#attivo'] },
  { righe: ['<main id="main">', '  <article class="card">', '    <p class="testo">Ciao <span class="evid">mondo</span></p>', '  </article>', '</main>'], riga: 2, bersaglio: 'span.evid', nome: 'la parola «mondo»',
    si: ['span', '.evid', 'p span', '.card .evid', '#main span', 'article p .evid', 'p.testo span.evid', '#main .card span', '.testo span', 'main article span'],
    no: ['section span', '.testo.evid', '#menu span', 'article > span', '.card > .evid', 'span.testo', '#evid'] },
  { righe: ['<form id="iscrizione">', '  <label class="etichetta">Nome</label>', '  <input type="text" class="campo">', '  <button class="invia">Invia</button>', '</form>'], riga: 2, bersaglio: 'input', nome: 'la casella di testo',
    si: ['input', '[type="text"]', 'input.campo', '#iscrizione input', 'form .campo', 'input[type="text"]', '#iscrizione [type="text"]', 'form input', '.campo', 'form > input.campo'],
    no: ['textarea', '.campo.errore', '#login input', 'label input', '.invia', 'input[type="email"]', 'form > .etichetta'] }
];
const COLORI_DUELLO = [['red', 'rosso'], ['blue', 'blu'], ['green', 'verde'], ['darkorange', 'arancione'], ['purple', 'viola']];
function specCSS(s) {
  const id = (s.match(/#[\w-]+/g) || []).length, cl = (s.match(/\.[\w-]+/g) || []).length + (s.match(/\[[^\]]*\]/g) || []).length;
  const tg = (s.replace(/\[[^\]]*\]/g, '').replace(/[#.][\w-]+/g, ' ').match(/(^|[\s>+~])[a-z][a-z0-9]*/g) || []).length;
  return [id, cl, tg];
}
function duelloCSS(el, label = 'Il duello delle regole') {
  const st = stat(label);
  let T, regole, inline, primo, giocato;
  el.innerHTML = `<div class="card duello">${turn()}<div class="row"><select class="du-liv"><option value="1">Livello 1: solo selettori</option><option value="2">Livello 2: con !important e stile inline</option></select><button class="btn sec" data-a="n">Altro duello</button></div>
   <p class="q du-q"></p><ol class="cod du-html"></ol><div class="du-reg"></div><p class="q">Di che colore sarà?</p><div class="du-col"></div><div class="du-vista" hidden></div><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.duello'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Duelli indovinati al primo colpo: ${st.ok} su ${st.tot}`;
  function nuovo() {
    const liv = +$q('.du-liv').value; T = pick(DUELLO_HTML);
    const nsi = rnd(2, 3), sel = [...shuffle(T.si).slice(0, nsi), ...shuffle(T.no).slice(0, 4 - nsi)], col = shuffle(COLORI_DUELLO);
    regole = shuffle(sel).map((s, i) => ({ s, col: col[i], imp: false }));
    inline = null;
    if (liv === 2) {
      const r = Math.random();
      if (r < 0.45) { const deboli = regole.filter(x => T.si.includes(x.s)).sort((a, b) => cmpSpec(specCSS(a.s), specCSS(b.s))); deboli[0].imp = true; }
      else if (r < 0.8) inline = col[4];
      else { regole.filter(x => T.si.includes(x.s))[0].imp = true; inline = col[4]; }
    }
    primo = true; giocato = false; disegna();
  }
  function cmpSpec(a, b) { for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; }
  function disegna() {
    $q('.du-q').innerHTML = `Le regole qui sotto sono scritte in quest'ordine nel foglio di stile. Di che colore diventa <b>${T.nome}</b>, la riga evidenziata?`;
    const righe = T.righe.map((r, i) => i === T.riga && inline ? r.replace(/<(a|span|input)\b/, `<$1 style="color: ${inline[0]}"`) : r);
    $q('.du-html').innerHTML = righe.map((r, i) => `<li class="${i === T.riga ? 'on' : ''}"><code>${escH(r)}</code></li>`).join('');
    $q('.du-reg').innerHTML = regole.map((r, i) => `<div class="du-r" data-i="${i}"><span class="du-n">${i + 1}</span><code>${escH(r.s)} { color: <span class="du-sw" style="background:${r.col[0]}"></span>${r.col[0]}${r.imp ? ' !important' : ''}; }</code><span class="du-esito"></span></div>`).join('');
    const opz = [...regole.map(r => r.col), ...(inline ? [inline] : [])];
    $q('.du-col').innerHTML = opz.map(o => `<button class="btn sec du-c" data-c="${o[0]}"><span class="du-sw" style="background:${o[0]}"></span>${o[1]}</button>`).join('') + '<button class="btn sec du-c" data-c="nessuno">nessuna regola: colore di partenza</button>';
    $q('.du-vista').hidden = true; $q('.msg').textContent = '';
  }
  /* il browser decide: la pagina vera dentro uno shadow DOM */
  function vero() {
    const box = $q('.du-vista'); box.hidden = false; box.innerHTML = '<p class="du-lab">Così la disegna il browser:</p><div class="du-host"></div>';
    const host = box.querySelector('.du-host'), sh = host.attachShadow({ mode: 'open' });
    const css = regole.map(r => `${r.s} { color: ${r.col[0]}${r.imp ? ' !important' : ''}; }`).join('\n');
    const righe = T.righe.map((r, i) => i === T.riga && inline ? r.replace(/<(a|span|input)\b/, `<$1 style="color: ${inline[0]}"`) : r);
    sh.innerHTML = `<style>:host{display:block;color:#888;font:16px system-ui,sans-serif} ul{margin:0;padding-left:20px} input{font:inherit;padding:4px} ${T.bersaglio}{outline:3px dashed #f59e0b;outline-offset:3px} ${css}</style>${righe.join('')}`;
    const t = sh.querySelector(T.bersaglio); if (t.tagName === 'INPUT') t.value = 'Testo di prova';
    const finale = getComputedStyle(t).color, prova = document.createElement('span'); box.appendChild(prova);
    const rgb = n => { prova.style.color = n; return getComputedStyle(prova).color; };
    const vince = [...regole.map(r => r.col), ...(inline ? [inline] : [])].find(o => rgb(o[0]) === finale); prova.remove();
    regole.forEach((r, i) => { const colpisce = t.matches(r.s), s = specCSS(r.s), d = $q(`.du-r[data-i="${i}"]`);
      d.classList.toggle('fuori', !colpisce); d.classList.toggle('vince', !!vince && vince[0] === r.col[0]);
      d.querySelector('.du-esito').textContent = colpisce ? `colpisce · specificità (${s.join(', ')})${r.imp ? ' · !important' : ''}` : 'non colpisce l\'elemento'; });
    return { t, vince, regole };
  }
  c.addEventListener('click', e => {
    const b = e.target.closest('.du-c'); if (!b || giocato) return;
    giocato = true; const { t, vince } = vero(), m = $q('.msg'), scelta = b.dataset.c, giusto = vince ? vince[0] : 'nessuno', ok = scelta === giusto;
    if (primo) { st.tot++; if (ok) st.ok++; primo = false; up(); }
    c.querySelectorAll('.du-c').forEach(x => x.classList.toggle('giusto', x.dataset.c === giusto));
    if (!ok) b.classList.add('sbagliato');
    const r = vince && regole.find(x => x.col[0] === vince[0]);
    let perche = !vince ? 'Nessuna regola colpisce l\'elemento.' : !r ? 'Lo stile inline (attributo style) batte qualunque selettore; solo !important può superarlo.'
      : r.imp ? `La regola ${regole.indexOf(r) + 1} ha !important: batte tutte le altre, anche lo stile inline, qualunque sia la specificità.`
      : (() => { const pari = regole.filter(x => t.matches(x.s) && !x.imp && cmpSpec(specCSS(x.s), specCSS(r.s)) === 0).length > 1;
        return pari ? `Le regole con la specificità più alta (${specCSS(r.s).join(', ')}) sono pari: vince quella scritta per ultima, la ${regole.indexOf(r) + 1}.` : `La regola ${regole.indexOf(r) + 1} ha la specificità più alta (${specCSS(r.s).join(', ')}) tra quelle che colpiscono l\'elemento.`; })();
    m.innerHTML = (ok ? 'Esatto! ' : `No: diventa ${vince ? vince[1] : 'del colore di partenza'}. `) + perche; m.style.color = ok ? 'var(--ok)' : 'var(--ko)';
  });
  $q('.du-liv').onchange = nuovo; $q('[data-a=n]').onclick = nuovo; up(); nuovo();
}

/* ---------- il flexbox da regolare ----------
   flexLab(el, etichetta): le scatole tratteggiate mostrano dove devono finire; si scelgono i valori delle proprietà
   del contenitore e le scatole vere si spostano dal vivo. Il controllo confronta le posizioni disegnate dal browser,
   quindi vale anche una combinazione diversa che porta allo stesso risultato. */
const FLEX_PROP = [
  ['flex-direction', ['row', 'column', 'row-reverse', 'column-reverse']],
  ['justify-content', ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly']],
  ['align-items', ['flex-start', 'center', 'flex-end']]
];
function flexLab(el, label = 'Il flexbox da regolare') {
  const st = stat(label);
  let n, obiettivo, scelta, primo, fatto, usate, clic;
  el.innerHTML = `<div class="card flexlab">${turn()}<div class="row"><select class="fx-liv"><option value="1">Livello 1: justify-content</option><option value="2">Livello 2: anche align-items</option><option value="3">Livello 3: anche flex-direction</option></select><button class="btn sec" data-a="n">Altro schema</button></div>
   <p class="q">Scegliete i valori delle proprietà del contenitore finché le scatole colorate non finiscono dentro quelle tratteggiate.</p>
   <div class="fx-area"><div class="fx-box fx-ob"></div><div class="fx-box fx-vero"></div></div><div class="fx-prop"></div><pre class="fx-css"></pre><p class="msg"></p><div class="stat"></div></div>`;
  const c = el.querySelector('.flexlab'), $q = s => c.querySelector(s), up = () => $q('.stat').textContent = `Schemi risolti senza tentativi a vuoto: ${st.ok} su ${st.tot}`;
  const stile = v => usate.map(([p], i) => `${p}: ${v[i]};`).join(' ');
  function nuovo() {
    const liv = +$q('.fx-liv').value; usate = liv === 1 ? [FLEX_PROP[1]] : liv === 2 ? FLEX_PROP.slice(1) : FLEX_PROP;
    n = rnd(2, 4);
    do { obiettivo = usate.map(([, vals]) => pick(vals)); } while (obiettivo.every((v, i) => v === usate[i][1][0]));
    scelta = usate.map(([, vals]) => vals[0]); primo = true; fatto = false; clic = 0;
    const scatole = Array.from({ length: n }, (_, i) => `<i>${i + 1}</i>`).join('');
    $q('.fx-ob').innerHTML = scatole; $q('.fx-vero').innerHTML = scatole; $q('.fx-ob').style.cssText = stile(obiettivo);
    $q('.fx-prop').innerHTML = usate.map(([p, vals], i) => `<div class="fx-p"><code>${p}</code><div class="fx-v">${vals.map(v => `<button class="btn sec" data-i="${i}" data-v="${v}">${v}</button>`).join('')}</div></div>`).join('');
    $q('.msg').textContent = ''; aggiorna();
  }
  function aggiorna() {
    $q('.fx-vero').style.cssText = stile(scelta);
    $q('.fx-css').textContent = `.contenitore {\n  display: flex;\n${usate.map(([p], i) => `  ${p}: ${scelta[i]};`).join('\n')}\n}`;
    c.querySelectorAll('.fx-v button').forEach(b => b.classList.toggle('on', scelta[+b.dataset.i] === b.dataset.v));
    const a = [...$q('.fx-ob').children].map(x => x.getBoundingClientRect()), b = [...$q('.fx-vero').children].map(x => x.getBoundingClientRect());
    const ok = clic > 0 && a.every((r, i) => Math.abs(r.left - b[i].left) < 2 && Math.abs(r.top - b[i].top) < 2);
    $q('.fx-area').classList.toggle('ok', ok);
    if (ok && !fatto) { fatto = true; const pulito = clic <= usate.length; if (primo) { st.tot++; if (pulito) st.ok++; primo = false; up(); }
      const m = $q('.msg'), diverso = scelta.some((v, i) => v !== obiettivo[i]);
      m.innerHTML = `Perfetto, le scatole sono al loro posto${pulito ? ' al primo colpo' : ` (con ${clic} clic)`}!` + (diverso ? ` Avete trovato una strada diversa da quella pensata (${usate.map(([p], i) => `<code>${p}: ${obiettivo[i]}</code>`).join(', ')}) ma il risultato è lo stesso.` : ''); m.style.color = 'var(--ok)'; }
  }
  c.addEventListener('click', e => { const b = e.target.closest('.fx-v button'); if (!b || fatto) return; if (scelta[+b.dataset.i] !== b.dataset.v) clic++; scelta[+b.dataset.i] = b.dataset.v; aggiorna(); });
  $q('.fx-liv').onchange = nuovo; $q('[data-a=n]').onclick = nuovo; up(); nuovo();
}
