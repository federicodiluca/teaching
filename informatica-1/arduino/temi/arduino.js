/* Generatori di esercizi per le attività su Arduino ed elettronica di base.
   Solo definizioni: va caricato dopo assets/giochi.js, che fornisce rnd, pick, shuffle, fmt, sep, P...
   Ogni generatore restituisce {q, fields, sol, sl} come richiesto da mount() in giochi.js;
   le funzioni huntXxx() restituiscono {t, lines, bad, why} come richiesto da hunt(). */

const AC = s => `<code>${s}</code>`;

/* Legge di Ohm: si cerca la terza grandezza */
function ohmGen() {
  const R = pick([100, 220, 330, 470, 1000, 2200, 4700, 10000]), V = pick([3, 5, 9, 12]), I = V / R * 1000;   // I in mA
  const t = rnd(0, 2);
  if (t === 0) return {
    q: `Un resistore da <b>${sep(R)} Ω</b> è collegato a <b>${V} V</b>. Quanti milliampere (mA) lo attraversano?`,
    fields: [{ label: 'Corrente (mA)', kind: 'num', exp: I, tol: 0.01 }],
    sl: 'Procedimento', sol: P(`I = V / R = ${V} / ${sep(R)} = ${fmt(+(I / 1000).toPrecision(4))} A\n= ${fmt(+I.toPrecision(4))} mA (1 A = 1000 mA)`)
  };
  if (t === 1) return {
    q: `Ai capi di un resistore da <b>${sep(R)} Ω</b> passa una corrente di <b>${fmt(+I.toPrecision(4))} mA</b>. Quanti volt ci sono?`,
    fields: [{ label: 'Tensione (V)', kind: 'num', exp: V, tol: 0.01 }],
    sl: 'Procedimento', sol: P(`I = ${fmt(+I.toPrecision(4))} mA = ${fmt(+(I / 1000).toPrecision(4))} A\nV = R x I = ${sep(R)} x ${fmt(+(I / 1000).toPrecision(4))} = ${V} V`)
  };
  return {
    q: `Con una tensione di <b>${V} V</b> circola una corrente di <b>${fmt(+I.toPrecision(4))} mA</b>. Quanti ohm vale la resistenza?`,
    fields: [{ label: 'Resistenza (Ω)', kind: 'num', exp: R, tol: 0.01 }],
    sl: 'Procedimento', sol: P(`I = ${fmt(+(I / 1000).toPrecision(4))} A\nR = V / I = ${V} / ${fmt(+(I / 1000).toPrecision(4))} = ${sep(R)} Ω`)
  };
}

/* Resistore in serie a un LED: R = (Vs - Vf) / I */
function ledRes() {
  const col = pick([['rosso', 2], ['giallo', 2], ['verde', 2], ['blu', 3], ['bianco', 3]]), I = pick([10, 15, 20]), vs = 5, R = (vs - col[1]) / I * 1000;
  return {
    q: `LED <b>${col[0]}</b> (tensione di soglia Vf ≈ ${col[1]} V) alimentato a ${vs} V con corrente desiderata <b>${I} mA</b>. Quanti ohm deve valere il resistore in serie? (R = (Vs − Vf) / I)`,
    fields: [{ label: 'Resistenza (Ω)', kind: 'num', exp: R, tol: 0.01 }],
    sl: 'Procedimento', sol: P(`tensione sul resistore: ${vs} − ${col[1]} = ${vs - col[1]} V\nI = ${I} mA = ${fmt(I / 1000)} A\nR = ${vs - col[1]} / ${fmt(I / 1000)} = ${fmt(+R.toFixed(1))} Ω\nSi sceglie un valore commerciale uguale o superiore (per esempio 220 Ω).`)
  };
}

/* Codice colori dei resistori: due cifre e moltiplicatore */
const COLORI = ['nero', 'marrone', 'rosso', 'arancione', 'giallo', 'verde', 'blu', 'viola', 'grigio', 'bianco'];
function codiceColori() {
  const a = rnd(1, 9), b = rnd(0, 9), m = rnd(0, 3), val = (a * 10 + b) * Math.pow(10, m);
  return {
    q: `Un resistore ha le bande <b>${COLORI[a]} - ${COLORI[b]} - ${COLORI[m]}</b> (prima cifra, seconda cifra, moltiplicatore). Quanti ohm vale?`,
    fields: [{ label: 'Valore (Ω)', kind: 'num', exp: val, tol: 0 }],
    sl: 'Procedimento', sol: P(`nero 0, marrone 1, rosso 2, arancione 3, giallo 4, verde 5, blu 6, viola 7, grigio 8, bianco 9\ncifre: ${a} e ${b}\nmoltiplicatore ${COLORI[m]}: x${Math.pow(10, m)}\nvalore = ${a}${b} x ${Math.pow(10, m)} = ${sep(val)} Ω`)
  };
}

/* ADC a 10 bit: dal valore letto alla tensione */
function adcGen() {
  const v = pick([0, 205, 256, 341, 512, 614, 768, 1023]), volt = v * 5 / 1023;
  return {
    q: `<code>analogRead(A0)</code> restituisce <b>${v}</b> (ADC a 10 bit, da 0 a 1023, riferimento 5 V). Quanti volt ci sono sul pin? (volt = valore x 5 / 1023)`,
    fields: [{ label: 'Tensione (V)', kind: 'num', exp: volt, tol: 0.01 }],
    sl: 'Procedimento', sol: P(`volt = ${v} x 5 / 1023 = ${fmt(+volt.toFixed(3))} V\nOgni gradino vale circa 5 / 1024 ≈ 4,9 mV.`)
  };
}

/* map(): conversione proporzionale con numeri interi */
function mapGen() {
  const x = pick([0, 100, 256, 400, 512, 700, 1023]), r = pick([[0, 255], [0, 180], [50, 1000], [0, 100]]),
    y = Math.trunc((x - 0) * (r[1] - r[0]) / (1023 - 0)) + r[0];
  return {
    q: `Quanto restituisce <code>map(${x}, 0, 1023, ${r[0]}, ${r[1]})</code>? (map lavora con interi: i decimali sono troncati)`,
    fields: [{ label: 'Risultato', kind: 'num', exp: y, tol: 0 }],
    sl: 'Procedimento', sol: P(`(${x} − 0) x (${r[1]} − ${r[0]}) / (1023 − 0) + ${r[0]}\n= ${x} x ${r[1] - r[0]} / 1023 + ${r[0]}\n= ${fmt(+(x * (r[1] - r[0]) / 1023 + r[0]).toFixed(2))} → troncato: ${y}`)
  };
}

/* PWM: da valore di analogWrite a duty cycle */
function dutyGen() {
  const t = rnd(0, 1);
  if (t === 0) { const v = pick([0, 64, 128, 191, 255]), d = v / 255 * 100;
    return { q: `<code>analogWrite(9, ${v});</code> Qual è il duty cycle in percentuale? (valori da 0 a 255)`, fields: [{ label: 'Duty cycle (%)', kind: 'num', exp: d, tol: 0.02 }], sl: 'Procedimento', sol: P(`duty = ${v} / 255 x 100 = ${fmt(+d.toFixed(1))} %`) }; }
  const d = pick([0, 25, 50, 75, 100]), v = Math.round(d * 255 / 100);
  return { q: `Si vuole un duty cycle del <b>${d}%</b> su un pin PWM. Quale valore si passa ad <code>analogWrite</code>? (valori da 0 a 255, arrotondate all'intero)`, fields: [{ label: 'Valore', kind: 'num', exp: v, tol: 0.02 }], sl: 'Procedimento', sol: P(`valore = ${d} / 100 x 255 = ${fmt(+(d * 2.55).toFixed(2))} ≈ ${v}`) };
}

/* Sensore TMP36: 10 mV per grado, 0,5 V a 0 °C */
function tmpGen() {
  const t = pick([0, 10, 18, 20, 25, 30, 37]), volt = t / 100 + 0.5;
  return {
    q: `Il sensore TMP36 dà <b>${fmt(+volt.toFixed(2))} V</b>. Quanti gradi Celsius misura? (gradi = (volt − 0,5) x 100)`,
    fields: [{ label: 'Temperatura (°C)', kind: 'num', exp: t, tol: 0 }],
    sl: 'Procedimento', sol: P(`gradi = (${fmt(+volt.toFixed(2))} − 0,5) x 100 = ${t} °C`)
  };
}

/* HC-SR04: distanza dal tempo dell'eco */
function ultraGen() {
  const us = pick([580, 1166, 2332, 4664, 5830, 11660]), cm = us * 0.0343 / 2;
  return {
    q: `L'eco del sensore HC-SR04 dura <b>${sep(us)} µs</b> (andata e ritorno). A quanti centimetri è l'ostacolo? (cm = tempo x 0,0343 / 2)`,
    fields: [{ label: 'Distanza (cm)', kind: 'num', exp: cm, tol: 0.02 }],
    sl: 'Procedimento', sol: P(`il suono viaggia a 0,0343 cm per microsecondo\ncm = ${sep(us)} x 0,0343 / 2 = ${fmt(+cm.toFixed(1))} cm\nSi divide per 2 perché il suono fa andata e ritorno.`)
  };
}

/* Quanti lampeggi in un minuto con due delay */
function blinkGen() {
  const a = pick([250, 500, 1000, 1500]), b = pick([250, 500, 1000, 1500]), n = 60000 / (a + b);
  return {
    q: `Il loop accende il LED, fa <code>delay(${a})</code>, lo spegne e fa <code>delay(${b})</code>. Quanti lampeggi completi (acceso+spento) fa in un minuto? (le altre istruzioni durano pochissimo)`,
    fields: [{ label: 'Lampeggi al minuto', kind: 'num', exp: n, tol: 0.02 }],
    sl: 'Procedimento', sol: P(`un lampeggio dura ${a} + ${b} = ${a + b} ms\n1 minuto = 60 000 ms\nlampeggi = 60 000 / ${a + b} = ${fmt(+n.toFixed(2))}`)
  };
}

/* Luci in sequenza con il for: tempo di una andata */
function sequenzaLed() {
  const a = rnd(2, 4), b = a + rnd(2, 5), d = pick([50, 100, 150, 200]), n = b - a + 1;
  return {
    q: `<pre>for (int pin = ${a}; pin &lt;= ${b}; pin++) {\n  digitalWrite(pin, HIGH);\n  delay(${d});\n  digitalWrite(pin, LOW);\n}</pre>Quanti LED si accendono e quanti millisecondi dura il ciclo completo?`,
    fields: [{ label: 'LED accesi', kind: 'num', exp: n, tol: 0 }, { label: 'Durata (ms)', kind: 'num', exp: n * d, tol: 0 }],
    sl: 'Procedimento', sol: P(`pin da ${a} a ${b}: ${n} LED\nogni LED resta acceso ${d} ms\ndurata = ${n} x ${d} = ${n * d} ms`)
  };
}

/* Pulsante: che cosa legge digitalRead con pull-down o pull-up */
function pullGen() {
  const modo = pick(['pull-down (resistore da 10 kΩ verso GND)', 'INPUT_PULLUP (pulsante tra il pin e GND)']), prem = rnd(0, 1) === 1,
    r = modo.startsWith('pull-down') ? (prem ? 'HIGH' : 'LOW') : (prem ? 'LOW' : 'HIGH');
  return {
    q: `Pulsante con <b>${modo}</b>, <b>${prem ? 'premuto' : 'rilasciato'}</b>. Che cosa restituisce <code>digitalRead</code>?`,
    fields: [{ label: 'digitalRead', kind: 'choice', opts: ['', 'HIGH', 'LOW'], exp: r }],
    sl: 'Spiegazione', sol: `<p>${r}. ${modo.startsWith('pull-down') ? 'Con il pull-down il pin è tirato a LOW a riposo e va a HIGH quando si preme.' : 'Con INPUT_PULLUP la logica è invertita: a riposo il pin è HIGH e premendo diventa LOW.'}</p>`
  };
}

/* Caccia all'errore: output e input digitali */
function huntDig() {
  return pick([
    { t: 'Il LED sul pin 8 non si accende. Quale riga è sbagliata?', lines: ['void setup() {', '  // manca qualcosa?', '}', 'void loop() {', '  digitalWrite(8, HIGH);', '}'], bad: 1, why: 'Manca pinMode(8, OUTPUT) nel setup(): il pin non è configurato come uscita.' },
    { t: 'Deve accendere il LED quando il pulsante (INPUT_PULLUP) è premuto. Quale riga è sbagliata?', lines: ['pinMode(2, INPUT_PULLUP);', 'pinMode(13, OUTPUT);', 'if (digitalRead(2) == HIGH)', '    digitalWrite(13, HIGH);'], bad: 2, why: 'Con INPUT_PULLUP la logica è invertita: premuto significa LOW.' },
    { t: 'Deve confrontare lo stato del pulsante. Quale riga è sbagliata?', lines: ['int stato = digitalRead(2);', 'if (stato = HIGH) {', '    digitalWrite(13, HIGH);', '}'], bad: 1, why: '= assegna e rende la condizione sempre vera: per confrontare serve ==.' },
    { t: 'Deve far lampeggiare il LED ogni secondo. Quale riga è sbagliata?', lines: ['digitalWrite(LED, HIGH);', 'delay(1);', 'digitalWrite(LED, LOW);', 'delay(1);'], bad: 1, why: 'delay è in millisecondi: delay(1) è una pausa di un millisecondo, ci vuole delay(1000).' },
    { t: 'Il monitor seriale mostra caratteri strani. Quale riga è sbagliata?', lines: ['void setup() {', '  Serial.begin(9600);', '}', '// il monitor seriale è impostato a 115200 baud'], bad: 3, why: 'La velocità del monitor seriale deve coincidere con quella di Serial.begin, altrimenti si leggono caratteri strani.' },
    { t: 'Il programma scrive due messaggi su righe diverse. Quale riga è sbagliata?', lines: ['Serial.begin(9600);', 'Serial.print("Valore: ");', 'Serial.print(valore);', 'Serial.print("Fine");'], bad: 2, why: 'Per andare a capo si usa println: con print tutto resta sulla stessa riga.' },
    { t: 'Il LED dovrebbe lampeggiare. Quale riga è sbagliata?', lines: ['void setup() {', '  pinMode(13, OUTPUT);', '}', 'void loop();', '{', '  digitalWrite(13, HIGH);', '}'], bad: 3, why: 'Dopo void loop() non va il punto e virgola: è la definizione della funzione.' }
  ]);
}

/* Caccia all'errore: sensori, PWM e attuatori */
function huntSens() {
  return pick([
    { t: 'Il LED sul pin 8 deve avere una luminosità regolabile. Quale riga è sbagliata?', lines: ['const int LED = 8;', 'void setup() { pinMode(LED, OUTPUT); }', 'void loop() {', '  analogWrite(LED, 128);', '}'], bad: 0, why: 'Il pin 8 non è un pin PWM: servono i pin segnati con ~ (3, 5, 6, 9, 10, 11).' },
    { t: 'Il dimmer non regola bene la luce. Quale riga è sbagliata?', lines: ['int valore = analogRead(A0);', 'analogWrite(9, valore);'], bad: 1, why: 'analogRead dà 0-1023 ma analogWrite accetta 0-255: serve map(valore, 0, 1023, 0, 255) oppure valore / 4.' },
    { t: 'Deve leggere il potenziometro. Quale riga è sbagliata?', lines: ['void setup() {', '  Serial.begin(9600);', '}', 'void loop() {', '  int v = digitalRead(A0);', '  Serial.println(v);', '}'], bad: 4, why: 'Un sensore analogico si legge con analogRead, non con digitalRead (che dà solo HIGH o LOW).' },
    { t: 'Deve calcolare la distanza con l\'HC-SR04. Quale riga è sbagliata?', lines: ['long durata = pulseIn(ECHO, HIGH);', 'float cm = durata * 0.0343;', 'Serial.println(cm);'], bad: 1, why: 'Si deve dividere per 2: l\'eco comprende andata e ritorno del suono.' },
    { t: 'Deve muovere il servomotore a 90 gradi. Quale riga è sbagliata?', lines: ['#include <Servo.h>', 'Servo motore;', 'void setup() { motore.attach(9); }', 'void loop() { motore.write(900); }'], bad: 3, why: 'Il servomotore ruota da 0° a 180°: write(900) non è un angolo valido, ci vuole write(90).' },
    { t: 'Deve suonare la nota La a 440 Hz. Quale riga è sbagliata?', lines: ['const int BUZZER = 8;', 'void setup() { }', 'void loop() {', '  tone(BUZZER, 440);', '  delay(500);', '  // il tono non viene mai fermato', '}'], bad: 5, why: 'Manca noTone(BUZZER) (oppure la durata come terzo argomento): senza non si ferma mai.' },
    { t: 'Deve calcolare la temperatura con il TMP36. Quale riga è sbagliata?', lines: ['int v = analogRead(A0);', 'float volt = v * 5.0 / 1023.0;', 'float gradi = volt * 100;'], bad: 2, why: 'Il TMP36 vale 0,5 V a 0 °C: la formula giusta è (volt - 0.5) * 100.' }
  ]);
}
