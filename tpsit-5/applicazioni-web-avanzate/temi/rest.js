/* Applicazioni web avanzate (TPSIT 5): client HTTP simulato. Solo definizioni: va caricato dopo assets/giochi.js.
   restLab(el, missioni, etichetta): si sceglie il metodo, si scrive l'URL e (per POST e PUT) il corpo JSON, si invia
   la richiesta a un piccolo server finto con la risorsa /api/studenti e si legge la risposta: codice di stato,
   intestazioni e corpo. Nulla esce dal browser.
   missioni = [{t: consegna, ok: (richiesta, risposta, db) => vero quando è compiuta}]
   Gli stili sono in giochi.css (sezione "simulatori"). */
const HOST_REST = 'https://scuola.example';
const MOTIVI = { 200: 'OK', 201: 'Created', 204: 'No Content', 400: 'Bad Request', 404: 'Not Found', 405: 'Method Not Allowed' };
const SPIEGA_REST = {
  200: 'Richiesta riuscita: il corpo contiene la risorsa richiesta.', 201: 'Risorsa creata: l\'intestazione Location dice il suo indirizzo.',
  204: 'Riuscita, ma non c\'è niente da restituire: il corpo è vuoto.', 400: 'La richiesta è sbagliata: di solito il JSON non è valido o manca un campo.',
  404: 'La risorsa non esiste a quell\'indirizzo.', 405: 'Quel metodo non si può usare su questo indirizzo.'
};
function dbRest() {
  return [{ id: 1, nome: 'Ada Lovelace', classe: '5M', voto: 9 }, { id: 2, nome: 'Alan Turing', classe: '5M', voto: 8 }, { id: 3, nome: 'Grace Hopper', classe: '5L', voto: 7 }];
}
function serverRest(db, metodo, url, corpo) {
  const r = (status, body, h = {}) => ({ status, body, h: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...h } });
  let u; try { u = new URL(url, HOST_REST); } catch (e) { return r(400, { errore: 'URL non valido' }); }
  const parti = u.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  if (parti[0] !== 'api' || parti[1] !== 'studenti' || parti.length > 3) return r(404, { errore: 'Risorsa inesistente: ' + u.pathname });
  const id = parti[2] !== undefined ? +parti[2] : null;
  if (parti[2] !== undefined && !(Number.isInteger(id) && id > 0)) return r(404, { errore: 'Id non valido: ' + parti[2] });
  const leggi = () => { try { return { ok: true, v: JSON.parse(corpo) }; } catch (e) { return { ok: false }; } };
  const valido = v => v && typeof v.nome === 'string' && v.nome.trim() && typeof v.classe === 'string' && typeof v.voto === 'number';
  if (id === null) {
    if (metodo === 'GET') { const c = u.searchParams.get('classe'); return r(200, c ? db.filter(s => s.classe === c) : db); }
    if (metodo === 'POST') {
      const j = leggi(); if (!j.ok) return r(400, { errore: 'Il corpo non è JSON valido' });
      if (!valido(j.v)) return r(400, { errore: 'Servono nome (testo), classe (testo) e voto (numero)' });
      const nuovo = { id: Math.max(0, ...db.map(s => s.id)) + 1, nome: j.v.nome, classe: j.v.classe, voto: j.v.voto }; db.push(nuovo);
      return r(201, nuovo, { Location: '/api/studenti/' + nuovo.id });
    }
    return r(405, { errore: metodo + ' non si usa sull\'elenco: per modificare o cancellare indicate uno studente, /api/studenti/{id}' }, { Allow: 'GET, POST' });
  }
  const i = db.findIndex(s => s.id === id);
  if (metodo === 'POST') return r(405, { errore: 'Per aggiungere uno studente si fa POST su /api/studenti, senza id' }, { Allow: 'GET, PUT, DELETE' });
  if (i < 0) return r(404, { errore: 'Nessuno studente con id ' + id });
  if (metodo === 'GET') return r(200, db[i]);
  if (metodo === 'PUT') {
    const j = leggi(); if (!j.ok) return r(400, { errore: 'Il corpo non è JSON valido' });
    if (!valido(j.v)) return r(400, { errore: 'PUT sostituisce tutta la risorsa: servono nome, classe e voto' });
    db[i] = { id, nome: j.v.nome, classe: j.v.classe, voto: j.v.voto }; return r(200, db[i]);
  }
  if (metodo === 'DELETE') { db.splice(i, 1); return r(204); }
  return r(405, { errore: 'Metodo non permesso' });
}
function restLab(el, missioni, label = 'Client REST') {
  const st = stat(label);
  let db, fatte, sbagli = false;
  el.innerHTML = `<div class="card rest">${turn()}<ol class="git-mis"></ol>
   <div class="rest-req"><select class="rest-met" aria-label="Metodo"><option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option></select><input class="rest-url" type="text" spellcheck="false" autocomplete="off" aria-label="URL"><button class="btn" data-a="i">Invia</button></div>
   <div class="rest-corpo"><small>Corpo della richiesta (JSON)</small><textarea spellcheck="false" aria-label="Corpo JSON"></textarea></div>
   <div class="rest-ris"><div class="rest-stato"><small>Risposta</small><span>Ancora nessuna richiesta.</span></div><pre class="rest-h"></pre><pre class="rest-b"></pre></div>
   <p class="rest-nota"></p>
   <details class="rest-db"><summary>Che cosa c'è sul server adesso</summary><pre></pre></details>
   <div class="row"><button class="btn sec" data-a="r">Ricomincia</button><span class="msg"></span></div><div class="stat"></div></div>`;
  const c = el.querySelector('.rest'), $q = x => c.querySelector(x);
  const up = () => $q('.stat').textContent = `Missioni compiute: ${fatte.filter(Boolean).length} su ${missioni.length} (senza errori: ${st.ok} su ${st.tot})`;
  function corpoAttivo() { const m = $q('.rest-met').value, on = m === 'POST' || m === 'PUT'; $q('.rest-corpo').classList.toggle('spento', !on); $q('.rest-corpo textarea').disabled = !on; }
  function inizio() {
    db = dbRest(); fatte = missioni.map(() => false); sbagli = false;
    $q('.rest-met').value = 'GET'; $q('.rest-url').value = HOST_REST + '/api/studenti';
    $q('.rest-corpo textarea').value = '{\n  "nome": "Margaret Hamilton",\n  "classe": "5M",\n  "voto": 10\n}';
    $q('.rest-stato span').textContent = 'Ancora nessuna richiesta.'; $q('.rest-h').textContent = ''; $q('.rest-b').textContent = ''; $q('.rest-nota').textContent = '';
    corpoAttivo(); disegna();
  }
  function disegna() {
    $q('.git-mis').innerHTML = missioni.map((m, i) => `<li class="${fatte[i] ? 'fatta' : i === fatte.indexOf(false) ? 'ora' : ''}">${fatte[i] ? '✔ ' : ''}${m.t}</li>`).join('');
    $q('.rest-db pre').textContent = JSON.stringify(db, null, 2); up();
  }
  function invia() {
    const metodo = $q('.rest-met').value, url = $q('.rest-url').value.trim(), corpo = $q('.rest-corpo textarea').value;
    const ris = serverRest(db, metodo, url, metodo === 'POST' || metodo === 'PUT' ? corpo : ''), req = { metodo, url, corpo };
    const s = $q('.rest-stato span'); s.innerHTML = `<b class="c${String(ris.status)[0]}">${ris.status} ${MOTIVI[ris.status]}</b>`;
    $q('.rest-h').textContent = Object.entries(ris.h).map(([k, v]) => `${k}: ${v}`).join('\n');
    $q('.rest-b').textContent = ris.body === undefined ? '(corpo vuoto)' : JSON.stringify(ris.body, null, 2);
    $q('.rest-nota').textContent = SPIEGA_REST[ris.status];
    /* una missione conta «senza errori» se prima di compierla non ci sono state risposte 4xx non volute */
    const i = fatte.indexOf(false), m = $q('.msg');
    if (i >= 0 && missioni[i].ok(req, ris, db)) { fatte[i] = true; st.tot++; if (!sbagli) st.ok++; sbagli = false; m.textContent = fatte.every(Boolean) ? 'Tutte le missioni compiute!' : 'Missione compiuta!'; m.style.color = 'var(--ok)'; }
    else { m.textContent = ''; if (ris.status >= 400) sbagli = true; }
    disegna();
  }
  $q('.rest-met').onchange = corpoAttivo;
  $q('[data-a=i]').onclick = invia;
  $q('.rest-url').onkeydown = e => { if (e.key === 'Enter') invia(); };
  $q('[data-a=r]').onclick = inizio;
  inizio();
}
