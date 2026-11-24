// ============================================================================
//  Schlüsselexperiment: Leiterschleife – Induktion durch Bewegung im Magnetfeld
//  Rechteckige Schleife (Höhe l, Länge a, N Windungen) fährt auf einem Wagen
//  durch ein begrenztes homogenes Feld (Breite d = 10 cm).
//  Φ = B·l·x_in,  U = N·dΦ/dt = N·B·l·v·w  (w = +1 Eintritt, 0 ganz drin, −1 Austritt)
//  Geschlossene Schleife: I = U/R, Bremskraft F = N·B·l·I·w (Lenz).
// ============================================================================
import { viewHost } from '../js/lib/views.js';

const D = 0.10, XF0 = -D / 2, XF1 = D / 2;         // Feldbereich in m
const POLE_H = 0.12, X_START = -0.20, R_CLOSED = 1.0;
const inF = x => x > XF0 && x < XF1 ? 1 : 0;
const RANGES = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000];   // mV

const svgMarkup = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Blick entlang der Feldlinien: Leiterschleife auf einem Wagen fährt durch das Feld zwischen den Magnetpolen; unten die aufgenommene Spannung">
<defs>
  <linearGradient id="lBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2024"/><stop offset="1" stop-color="#121518"/></linearGradient>
  <linearGradient id="lG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3f9c4c"/><stop offset="1" stop-color="#226a2c"/></linearGradient>
  <filter id="lSh" x="-10%" y="-10%" width="130%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity=".55"/></filter>
  <filter id="lGl"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <marker id="lArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="context-stroke"/></marker>
</defs>
<rect width="1000" height="620" fill="url(#lBg)"/>
<!-- hinterer Pol (S) -->
<rect x="265" y="112" width="130" height="156" rx="6" fill="url(#lG)" filter="url(#lSh)"/>
<text x="330" y="262" fill="#dff5e2" font-size="13" text-anchor="middle">S (hinten)</text>
<rect x="265" y="112" width="130" height="156" rx="6" fill="none" stroke="#e05a4f" stroke-width="1.5" stroke-dasharray="6 5"/>
<text x="330" y="104" fill="#e8a49c" font-size="12" text-anchor="middle">N (vorn, nicht gezeichnet)</text>
<g id="lBx" opacity="0" stroke="#86dcff" stroke-width="1.4"></g>
<rect id="lFlux" fill="#86dcff" opacity="0"/>
<!-- Schiene -->
<rect x="10" y="330" width="980" height="10" rx="3" fill="#8a9095"/>
<rect x="900" y="296" width="60" height="34" rx="4" fill="#3a3f44"/><text x="930" y="290" fill="#8e979d" font-size="11" text-anchor="middle">Motor</text>
<line id="lString" y1="312" x2="900" y2="312" stroke="#ddd" stroke-width="1"/>
<!-- Wagen mit Schleife -->
<g id="lCart">
  <rect id="lBody" y="300" height="26" rx="4" fill="#4a5056"/>
  <circle id="lW1" cy="328" r="6" fill="#222"/><circle id="lW2" cy="328" r="6" fill="#222"/>
  <rect id="lMast" y="0" width="6" fill="#9aa0a6"/>
  <rect id="lLoop" fill="none" stroke="#c97a3c" stroke-linejoin="round"/>
</g>
<path id="lLead" fill="none" stroke="#c4231b" stroke-width="2"/><path id="lLead2" fill="none" stroke="#151515" stroke-width="2"/>
<g id="lMod" opacity="0">
  <line id="lV" stroke="#f2ac74" stroke-width="2.6" marker-end="url(#lArr)"/><text id="lVt" fill="#f2ac74" font-size="13" font-weight="600">v</text>
  <line id="lF1" stroke="#ff7a8a" stroke-width="2.4" marker-end="url(#lArr)"/><line id="lF2" stroke="#ff7a8a" stroke-width="2.4" marker-end="url(#lArr)"/>
  <line id="lFb" stroke="#ffd27a" stroke-width="3" marker-end="url(#lArr)"/><text id="lFbt" fill="#ffd27a" font-size="12"></text>
  <text id="lPhi" x="420" y="36" fill="#cfefff" font-size="13" font-family="IBM Plex Mono, monospace"></text>
  <text id="lUt" x="420" y="56" fill="#ece6dc" font-size="13" font-family="IBM Plex Mono, monospace"></text>
  <text x="420" y="76" fill="#c7c1b7" font-size="12">⊗ B in die Zeichenebene · blau: Fläche im Feld</text>
  <text x="420" y="94" fill="#c7c1b7" font-size="12">rot: Lorentzkraft auf die Elektronen in den Seiten im Feld</text>
</g>
<!-- Messwerterfassung -->
<rect x="780" y="30" width="190" height="62" rx="8" fill="#c9cbc8" filter="url(#lSh)"/>
<text x="792" y="50" fill="#333" font-size="11">Messwerterfassung</text>
<rect x="792" y="56" width="166" height="28" rx="4" fill="#081210"/><text id="lUd" x="950" y="77" fill="#7dffb8" font-size="17" font-family="IBM Plex Mono, monospace" text-anchor="end"></text>
<rect x="30" y="384" width="940" height="210" rx="10" fill="#c9cbc8" filter="url(#lSh)"/>
<rect x="44" y="396" width="912" height="170" rx="5" fill="#081210"/>
<g id="lGrid" stroke="#173328"></g>
<rect id="lSel" y="396" height="170" fill="#ffd27a" opacity=".08"/>
<line id="lS1" y1="396" y2="566" stroke="#ffd27a" stroke-dasharray="5 4"/><line id="lS2" y1="396" y2="566" stroke="#ffd27a" stroke-dasharray="5 4"/>
<path id="lTr" fill="none" stroke="#7dffb8" stroke-width="2" filter="url(#lGl)"/>
<text id="lScT" x="48" y="584" fill="#333" font-size="11" font-family="IBM Plex Mono, monospace"></text>
<text id="lRec" x="950" y="584" fill="#b0261c" font-size="11" text-anchor="end"></text>
</svg>`;

export default {
  intro: 'Eine Leiterschleife fährt auf einem Wagen durch das Feld zwischen zwei Magnetpolen. Solange sich die Fläche im Feld ändert, wird eine Spannung induziert. Ihr messt sie mit der Messwerterfassung und prüft, wie sie von Geschwindigkeit, Windungszahl, Schleifenhöhe und Feldstärke abhängt.',
  docs: {
    durchfuehrung: `
<h3>Aufbau</h3>
<p>Ein Wagen fährt auf einer Schiene. Er trägt eine rechteckige Leiterschleife, die senkrecht steht. Die Schiene führt durch den Spalt eines Magneten mit breiten Polschuhen (10 cm × 12 cm). Ein Motor zieht den Wagen mit einstellbarer, konstanter Geschwindigkeit. Die Enden der Schleife sind an eine Messwerterfassung angeschlossen, die U(t) aufzeichnet.</p>
<h3>Durchführung</h3>
<ol>
<li>Wagen mit dem Motor durch das Feld fahren lassen. Die Aufnahme startet von selbst. Den Verlauf von U(t) beschreiben und den drei Phasen (Eintritt, ganz im Feld, Austritt) zuordnen.</li>
<li>Den Auswertebereich (Anfang, Ende) auf den Abschnitt mit konstanter Spannung beim Eintritt legen. <b>Messwert übernehmen</b> speichert den Mittelwert Ū und die Fläche unter der Kurve.</li>
<li>Für mindestens vier Geschwindigkeiten wiederholen. Danach Windungszahl, Höhe l und Feldstärke B einzeln verändern.</li>
<li>Die lange Schleife (14 cm) verwenden. Warum gibt es jetzt keinen Abschnitt ohne Spannung?</li>
<li>Mit „Von Hand“ den Wagen langsam und schnell hin- und herschieben. Was zeigt die Messwerterfassung?</li>
<li>Die Schleife über den Strommesser schließen und die Bremskraft beobachten.</li>
</ol>`,
    theorie: `
<h3>Magnetischer Fluss</h3>
<p>Durch die Schleife geht nur der Teil des Feldes, der innerhalb der Schleife liegt. Ist die Schleife um die Strecke x_in in das Feld eingetaucht, gilt</p>
<span class="formula tex">\\Phi = B\\, A_\\text{im Feld} = B\\, l\\, x_\\text{in}</span>
<h3>Induktionsspannung</h3>
<span class="formula tex">U_\\text{ind} = -N\\, \\frac{\\mathrm{d}\\Phi}{\\mathrm{d}t} \\qquad |U_\\text{ind}| = N\\, B\\, l\\, \\frac{\\mathrm{d}x_\\text{in}}{\\mathrm{d}t} = N\\, B\\, l\\, v</span>
<p>Beim Eintritt wächst die Fläche im Feld, beim Austritt nimmt sie ab. Die Spannung hat dann das andere Vorzeichen. Liegt die Schleife ganz im Feld, ändert sich der Fluss nicht, und die Spannung ist null.</p>
<h3>Erklärung mit der Lorentzkraft</h3>
<p>Die Elektronen in der Leiterseite, die sich im Feld bewegt, erfahren die Lorentzkraft F = e·v·B entlang des Drahtes. Sind beide senkrechten Seiten im Feld, wirken die Kräfte in beiden Seiten gleich stark und heben sich im Umlauf auf.</p>
<h3>Fläche unter der Kurve</h3>
<span class="formula tex">\\int U\\, \\mathrm{d}t = N\\, \\Delta\\Phi = N\\, B\\, l\\, \\Delta x_\\text{in}</span>
<p>Die Fläche unter dem Eintrittspuls hängt nicht von der Geschwindigkeit ab. Bei langsamer Fahrt ist der Puls niedriger, dauert aber länger.</p>
<h3>Lenzsche Regel</h3>
<p>Ist die Schleife geschlossen, fließt der Strom I = U/R. Auf die stromdurchflossene Seite im Feld wirkt die Kraft</p>
<span class="formula tex">F = N\\, B\\, l\\, I = \\frac{N^2 B^2 l^2\\, v}{R}</span>
<p>Sie ist der Bewegung entgegengerichtet. Der Motor muss diese Kraft zusätzlich aufbringen. Die Arbeit wird im Widerstand zu Wärme.</p>
<h3>Modellgrenzen</h3>
<ul><li>Das Feld ist im Spalt homogen und außerhalb null. Ein echtes Feld nimmt am Rand allmählich ab, die Kanten der Kurve sind dann abgerundet.</li>
<li>Die Messwerterfassung misst ohne Strom (offene Schleife). Das Rauschen beträgt etwa 0,4 mV.</li>
<li>Die Selbstinduktion der Schleife ist vernachlässigt.</li></ul>
<h3>Was die Modellansicht zeigt</h3>
<ul><li>Das Magnetfeld als ⊗-Zeichen und die Fläche der Schleife im Feld (blau) mit dem aktuellen Fluss.</li><li>Die Geschwindigkeit (orange) und die Lorentzkraft auf die Elektronen in den Leiterseiten im Feld (rot).</li><li>Bei geschlossener Schleife die Bremskraft auf den Wagen (gelb).</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Magnet</td><td>Polschuhe 10 cm × 12 cm, B = 0,05 … 0,40 T (mit Hallsonde gemessen)</td></tr>
<tr><td>Leiterschleife</td><td>N = 1 · 10 · 50 Windungen, Höhe l = 4 cm oder 8 cm, Länge a = 6 cm oder 14 cm</td></tr>
<tr><td>Antrieb</td><td>Motor mit Faden, v = 0,05 … 0,40 m/s</td></tr>
<tr><td>Messwerterfassung</td><td>200 Messwerte je Sekunde, Bereich automatisch, Mittelwert und Fläche im markierten Bereich</td></tr>
<tr><td>Strommesser</td><td>Schleife geschlossen über R = 1 Ω</td></tr>
</tbody></table>`,
    abi: `
<details class="q"><summary>Skizziere U(t) für eine Schleife der Länge 6 cm, die mit konstanter Geschwindigkeit durch ein 10 cm breites Feld fährt. <span class="op">AFB II</span></summary><p>Rechteckpuls positiv während des Eintritts (Dauer a/v), dann null, solange die Schleife ganz im Feld ist (Dauer (d − a)/v), dann gleich großer negativer Puls beim Austritt.</p></details>
<details class="q"><summary>N = 50, l = 8 cm, v = 0,2 m/s, Ū = 0,24 V. Berechne B. <span class="op">AFB I</span></summary><p>B = Ū / (N·l·v) = 0,24 V / (50 · 0,08 m · 0,2 m/s) = 0,30 T.</p></details>
<details class="q"><summary>Begründe, warum die Fläche unter dem Eintrittspuls nicht von v abhängt. <span class="op">AFB II</span></summary><p>∫U dt = N·ΔΦ. Die Flussänderung beim Eintritt ist immer B·l·a, egal wie schnell sie geschieht. Bei doppelter Geschwindigkeit ist der Puls doppelt so hoch und halb so lang.</p></details>
<details class="q"><summary>Erkläre mit der Energieerhaltung, warum die geschlossene Schleife gebremst wird. <span class="op">AFB III</span></summary><p>Im Widerstand wird die elektrische Leistung U·I in Wärme umgesetzt. Diese Energie muss aus der Bewegung kommen. Deshalb wirkt eine Kraft gegen die Bewegung, und es gilt F·v = U·I. Würde die Kraft die Bewegung unterstützen, entstünde Energie aus dem Nichts.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, segmented, check, button, fmt, dataTable, toast, display, gauss } = ui;
    const S = { N: 10, l: 0.08, a: 0.06, B: 0.30, v: 0.10, mode: 'motor', closed: false, x: X_START, vx: 0, dir: 0, delay: 0, post: 0, hx: X_START,
      rec: [], recOn: false, recT: 0, recDt: 0.005, r1: 35, r2: 44, U: 0, I: 0, F: 0, w: 0, recVer: 0 };
    const xEnd = () => 0.20 + S.a;
    const flux = x => S.B * S.l * Math.max(0, Math.min(x, XF1) - Math.max(x - S.a, XF0));

    const gS = group('Schleife und Magnet');
    const segN = segmented({ value: 10, options: [1, 10, 50].map(n => ({ value: n, label: `${n} Wdg.` })), onChange: v => { S.N = v; } });
    const segL = segmented({ value: 0.08, options: [{ value: 0.04, label: 'l = 4 cm' }, { value: 0.08, label: 'l = 8 cm' }], onChange: v => { S.l = v; } });
    const segA = segmented({ value: 0.06, options: [{ value: 0.06, label: 'a = 6 cm' }, { value: 0.14, label: 'a = 14 cm' }], onChange: v => { if (S.dir) return; S.a = v; S.x = Math.min(S.x, xEnd()); S.hx = S.x; } });
    const sB = slider({ label: 'Magnetfeld B', min: 0.05, max: 0.4, step: 0.01, value: S.B, unit: 'T', digits: 2, onInput: v => { S.B = v; } });
    const cC = check({ label: 'Schleife über Strommesser schließen (1 Ω)', checked: false, onChange: v => { S.closed = v; } });
    gS.append(el('div', { class: 'ctl' }, el('label', { style: 'grid-column:1/-1' }, 'Windungszahl N'), el('div', { style: 'grid-column:1/-1' }, segN)),
      el('div', { class: 'ctl' }, el('label', { style: 'grid-column:1/-1' }, 'Höhe l und Länge a'), el('div', { style: 'grid-column:1/-1' }, segL), el('div', { style: 'grid-column:1/-1;margin-top:6px' }, segA)), sB, cC);
    const gM = group('Bewegung', { led: true });
    const segM = segmented({ value: 'motor', options: [{ value: 'motor', label: 'Motor' }, { value: 'hand', label: 'Von Hand' }], onChange: v => { S.mode = v; S.dir = 0; S.hx = S.x; sX.set(S.x * 100); boxMotor.hidden = v !== 'motor'; boxHand.hidden = v !== 'hand'; } });
    const sV = slider({ label: 'Geschwindigkeit v', min: 0.05, max: 0.4, step: 0.01, value: S.v, unit: 'm/s', digits: 2, onInput: v => { S.v = v; } });
    const boxMotor = el('div', {}, sV, el('div', { class: 'bar' }, button('Durch das Feld ▶', () => motor(1), 'btn small primary'), button('◀ Zurück', () => motor(-1))));
    const sX = slider({ label: 'Wagen schieben (Vorderkante)', min: -20, max: 34, step: 0.1, value: X_START * 100, unit: 'cm', digits: 1, onInput: v => { S.hx = Math.min(v / 100, xEnd()); } });
    const bRec = button('Aufnahme starten', () => { if (S.recOn) stopRec(); else startRec(); });
    const boxHand = el('div', { hidden: true }, sX, el('div', { class: 'bar' }, bRec));
    gM.append(el('div', { class: 'ctl' }, el('div', { style: 'grid-column:1/-1' }, segM)), boxMotor, boxHand);
    const gA = group('Auswertung der Aufnahme');
    const s1 = slider({ label: 'Bereich Anfang', min: 0, max: 100, step: 0.5, value: S.r1, unit: '%', digits: 1, onInput: v => { S.r1 = v; S.recVer++; } });
    const s2 = slider({ label: 'Bereich Ende', min: 0, max: 100, step: 0.5, value: S.r2, unit: '%', digits: 1, onInput: v => { S.r2 = v; S.recVer++; } });
    const dRange = display('Bereich'), dMean = display('Mittelwert Ū'), dInt = display('Fläche ∫U dt');
    gA.append(s1, s2, dRange, dMean, dInt, el('div', { class: 'bar' }, button('Messwert übernehmen', () => take(), 'btn small primary')));
    controls.append(gS, gM, gA);

    function startRec() { S.rec = []; S.recT = 0; S.recOn = true; S.recVer++; bRec.textContent = 'Aufnahme stoppen'; }
    function stopRec() { S.recOn = false; S.recVer++; bRec.textContent = 'Aufnahme starten'; }
    function motor(d) {
      if (S.mode !== 'motor') return;
      if (d > 0 && S.x >= xEnd() - 1e-6) { toast('Der Wagen steht schon am Ende. Erst zurückfahren.'); return; }
      if (d < 0 && S.x <= X_START + 1e-6) { toast('Der Wagen steht schon am Anfang.'); return; }
      S.dir = d; S.delay = 0.3; S.post = 0; startRec(); gM.led(true);
    }
    function analyse() {
      const r = S.rec, n = r.length; if (n < 4) return null;
      const a = Math.min(S.r1, S.r2) / 100, b = Math.max(S.r1, S.r2) / 100;
      const i1 = Math.round(a * (n - 1)), i2 = Math.round(b * (n - 1)); if (i2 - i1 < 2) return null;
      let s = 0, area = 0; for (let i = i1; i <= i2; i++) { s += r[i][1]; if (i > i1) area += (r[i][1] + r[i - 1][1]) / 2 * (r[i][0] - r[i - 1][0]); }
      return { t1: r[i1][0], t2: r[i2][0], mean: s / (i2 - i1 + 1), area };
    }

    const rows = [];
    const tbl = dataTable([
      { key: 'N', label: 'N', digits: 0 }, { key: 'l', label: 'l in cm', fmt: v => fmt(v * 100, 0) }, { key: 'B', label: 'B in T', digits: 2 }, { key: 'v', label: 'v in m/s', digits: 2 },
      { key: 'U', label: 'Ū in mV', fmt: v => fmt(v * 1000, 1) }, { key: 'A', label: '∫U dt in mV·s', fmt: v => fmt(v * 1000, 2) }
    ], { onDelete: i => { rows.splice(i, 1); redraw(); } });
    const figR = el('div', { class: 'fig' }), figV = el('div', { class: 'fig' }), figT = el('div', { class: 'fig' });
    const chR = new Chart(figR, { xlabel: 't in s', ylabel: 'U in mV', includeZero: true });
    const chV = new Chart(figV, { xlabel: 'v in m/s', ylabel: 'Ū in mV' }), chT = new Chart(figT, { xlabel: 'N·B·l·v in mV', ylabel: 'Ū in mV' });
    const resV = el('div', { class: 'result' }), resT = el('div', { class: 'result' });
    messwerte.append(
      el('div', { class: 'chartbox' }, el('h4', {}, 'Letzte Aufnahme U(t) mit Auswertebereich'), figR,
        csvTools(() => ({ meta: ['Leiterschleife, letzte Aufnahme', `N = ${S.N}, l = ${S.l} m, B = ${S.B} T`], columns: [{ key: 't', label: 't in s' }, { key: 'u', label: 'U in V' }], rows: S.rec.map(([t, u]) => ({ t, u })) }), 'leiterschleife_aufnahme')),
      el('div', { style: 'height:14px' }),
      el('div', { class: 'data' },
        el('div', { class: 'chartbox' }, el('h4', {}, 'Ū über v'), figV, resV,
          csvTools(() => ({ meta: ['Leiterschleife, Messreihe'], columns: [{ key: 'N', label: 'N' }, { key: 'l', label: 'l in m' }, { key: 'B', label: 'B in T' }, { key: 'v', label: 'v in m/s' }, { key: 'U', label: 'U in V' }, { key: 'A', label: 'Flaeche in V*s' }], rows }), 'leiterschleife_messreihe')),
        el('div', { class: 'chartbox' }, el('h4', {}, 'Ū über N·B·l·v'), figT, resT)),
      el('div', { style: 'height:14px' }), tbl);
    const COLS = ['#f2ac74', '#86dcff', '#7fd6a0', '#c7b6ff', '#ffd27a', '#ff8a7a'];
    function redraw() {
      tbl.render(rows);
      const keys = [...new Set(rows.map(r => `${r.N}|${r.l}|${r.B}`))], sv = [], fv = []; let tv = '';
      keys.forEach((k, i) => {
        const rs = rows.filter(r => `${r.N}|${r.l}|${r.B}` === k), col = COLS[i % COLS.length], [N, l, B] = k.split('|').map(Number);
        sv.push({ name: `N=${N}, l=${fmt(l * 100, 0)} cm, B=${fmt(B, 2)} T`, color: col, mode: 'dot', points: rs.map(r => [r.v, r.U * 1000]) });
        if (new Set(rs.map(r => r.v)).size >= 2) { const f = fit.propFit(rs.map(r => r.v), rs.map(r => r.U * 1000)); if (f) { fv.push({ f: f.f, color: col }); tv += `<div><span>N=${N}, l=${fmt(l * 100, 0)} cm: Steigung ${fmt(f.a, 1)} mV·s/m</span><br><b>B = Steigung/(N·l) = ${fmt(f.a / 1000 / (N * l), 3)} T</b></div>`; } }
      });
      chV.set(sv, fv); resV.innerHTML = tv || '<span>Je Einstellung mindestens zwei Geschwindigkeiten messen.</span>';
      const pts = rows.map(r => [r.N * r.B * r.l * r.v * 1000, r.U * 1000]); let tt = '<span>Messungen mit verschiedenen N, l, B ergänzen.</span>'; const ft = [];
      if (rows.length >= 3) { const f = fit.propFit(pts.map(p => p[0]), pts.map(p => p[1])); if (f) { ft.push({ f: f.f, color: '#ab93ff' }); tt = `<div><span>Ursprungsgerade, R² = ${fmt(f.r2, 4)}</span><br><b>Steigung ${fmt(f.a, 3)} (erwartet 1)</b></div>`; } }
      chT.set([{ color: '#ab93ff', mode: 'dot', points: pts }], ft); resT.innerHTML = tt;
    }
    redraw();
    function take() {
      if (S.mode !== 'motor') { toast('Für die Messreihe den Motor verwenden. Nur dann ist v bekannt.'); return; }
      if (S.recOn) { toast('Die Aufnahme läuft noch.'); return; }
      const a = analyse(); if (!a) { toast('Erst eine Fahrt aufnehmen und den Bereich wählen.'); return; }
      rows.push({ N: S.recCfg.N, l: S.recCfg.l, B: S.recCfg.B, v: S.recCfg.v, U: Math.abs(a.mean), A: Math.abs(a.area) }); redraw();
      toast(`Übernommen: Ū = ${fmt(Math.abs(a.mean) * 1000, 1)} mV bei v = ${fmt(S.recCfg.v, 2)} m/s`);
    }
    let lastVer = -1;
    function drawRec() {
      if (lastVer === S.recVer && S.recOn) { /* läuft: trotzdem gedrosselt neu */ }
      lastVer = S.recVer;
      const pts = S.rec.filter((_, i) => i % 2 === 0).map(([t, u]) => [t, u * 1000]);
      const a = analyse(), ser = [{ color: '#7dffb8', points: pts }];
      if (a && !S.recOn) { const ys = pts.map(p => p[1]), lo = Math.min(0, ...ys), hi = Math.max(0, ...ys); ser.push({ color: '#ffd27a', points: [[a.t1, lo], [a.t1, hi]] }, { color: '#ffd27a', points: [[a.t2, lo], [a.t2, hi]] }); }
      chR.set(ser);
      dRange.set(a ? `${fmt(a.t1, 2)} s … ${fmt(a.t2, 2)} s` : '–'); dMean.set(a ? `${fmt(a.mean * 1000, 1)} mV` : '–'); dInt.set(a ? `${fmt(a.area * 1000, 2)} mV·s` : '–');
    }
    drawRec();
    const scopeRange = () => { const m = Math.max(...S.rec.map(r => Math.abs(r[1])), S.N * S.B * S.l * 0.15 * 0.4, 0.0008) * 1000 * 1.15; return RANGES.find(r => r >= m) || 2000; };

    // ======================= Ansicht 2D =======================
    async function view2d(box, MM) {
      box.insertAdjacentHTML('beforeend', svgMarkup());
      const svg = box.querySelector('svg'), q = id => svg.querySelector('#' + id);
      const SC = 1300, X0 = 330, YC = 190, X = x => X0 + x * SC;
      { let h = ''; for (let i = 1; i < 10; i++) h += `<line x1="${44 + i * 91.2}" y1="396" x2="${44 + i * 91.2}" y2="566"/>`; for (let i = 1; i < 4; i++) h += `<line x1="44" y1="${396 + i * 42.5}" x2="956" y2="${396 + i * 42.5}"${i === 2 ? ' stroke="#2a5a46"' : ''}/>`; q('lGrid').innerHTML = h; }
      { let h = ''; for (let x = 280; x <= 380; x += 25) for (let y = 128; y <= 256; y += 25) h += `<path d="M${x - 5} ${y - 5} L${x + 5} ${y + 5} M${x + 5} ${y - 5} L${x - 5} ${y + 5}"/>`; q('lBx').innerHTML = h; }
      let raf = 0;
      function frame() {
        raf = requestAnimationFrame(frame);
        const model = MM.model, xl = S.x, xt = xl - S.a, h = S.l * SC;
        const L = X(xt), Rr = X(xl), top = YC - h / 2, bot = YC + h / 2;
        q('lBody').setAttribute('x', L - 10); q('lBody').setAttribute('width', Rr - L + 20);
        q('lW1').setAttribute('cx', L); q('lW2').setAttribute('cx', Rr);
        q('lMast').setAttribute('x', (L + Rr) / 2 - 3); q('lMast').setAttribute('y', bot); q('lMast').setAttribute('height', 300 - bot);
        const lw = S.N === 1 ? 2.5 : S.N === 10 ? 4.5 : 7;
        q('lLoop').setAttribute('x', L); q('lLoop').setAttribute('y', top); q('lLoop').setAttribute('width', Rr - L); q('lLoop').setAttribute('height', h); q('lLoop').setAttribute('stroke-width', lw);
        q('lString').setAttribute('x1', Rr + 10); q('lString').setAttribute('opacity', S.mode === 'motor' ? 1 : 0);
        q('lLead').setAttribute('d', `M${L} ${top} C${L - 20} ${top - 70}, ${(L + 780) / 2} 110, 780 58`); q('lLead2').setAttribute('d', `M${L + 6} ${top} C${L - 10} ${top - 60}, ${(L + 780) / 2} 120, 780 70`);
        // Modell
        q('lBx').setAttribute('opacity', model ? 0.7 : 0); q('lMod').setAttribute('opacity', model ? 1 : 0);
        const fx0 = Math.max(xt, XF0), fx1 = Math.min(xl, XF1);
        q('lFlux').setAttribute('opacity', model && fx1 > fx0 ? 0.25 : 0);
        if (fx1 > fx0) { q('lFlux').setAttribute('x', X(fx0)); q('lFlux').setAttribute('width', (fx1 - fx0) * SC); q('lFlux').setAttribute('y', top); q('lFlux').setAttribute('height', h); }
        if (model) {
          const vv = S.vx, vl = Math.max(-60, Math.min(60, vv * 300));
          q('lV').setAttribute('x1', (L + Rr) / 2); q('lV').setAttribute('x2', (L + Rr) / 2 + vl); q('lV').setAttribute('y1', 288); q('lV').setAttribute('y2', 288); q('lV').setAttribute('opacity', Math.abs(vl) > 3 ? 1 : 0);
          q('lVt').setAttribute('x', (L + Rr) / 2 + vl + (vl > 0 ? 6 : -16)); q('lVt').setAttribute('y', 292); q('lVt').setAttribute('opacity', Math.abs(vl) > 3 ? 1 : 0);
          const fl = Math.max(-40, Math.min(40, vv * 260)); // Kraft auf Elektronen: v nach rechts → nach unten
          for (const [id, xs] of [['lF1', xl], ['lF2', xt]]) { const on = inF(xs) && Math.abs(fl) > 3; const px = X(xs); q(id).setAttribute('x1', px + 12); q(id).setAttribute('x2', px + 12); q(id).setAttribute('y1', YC - fl / 2); q(id).setAttribute('y2', YC + fl / 2); q(id).setAttribute('opacity', on ? 1 : 0); }
          const fb = S.closed ? S.F : 0, fbl = Math.max(-80, Math.min(80, fb * 2500));
          q('lFb').setAttribute('x1', L - 10); q('lFb').setAttribute('x2', L - 10 + fbl); q('lFb').setAttribute('y1', 313); q('lFb').setAttribute('y2', 313); q('lFb').setAttribute('opacity', Math.abs(fbl) > 3 ? 1 : 0);
          q('lFbt').setAttribute('x', L - 10 + fbl + (fbl < 0 ? -110 : 6)); q('lFbt').setAttribute('y', 317); q('lFbt').textContent = Math.abs(fbl) > 3 ? `Bremskraft ${fmt(Math.abs(fb) * 1000, 1)} mN` : '';
          q('lPhi').textContent = `Φ = B·l·x_in = ${fmt(flux(xl) * 1000, 3)} mWb`;
          q('lUt').textContent = `U = N·B·l·v = ${fmt(S.U * 1000, 1)} mV${S.closed ? `   I = ${fmt(S.I * 1000, 0)} mA` : ''}`;
        }
        q('lUd').textContent = `${fmt((S.U + 0.0002) * 1000, 1)} mV`;
        // Aufnahme
        const rng = scopeRange(), dur = Math.max(2, S.rec.length ? S.rec[S.rec.length - 1][0] : 0) * (S.recOn ? 1.1 : 1);
        const XS = t => 44 + t / dur * 912, YS = u => 481 - Math.max(-84, Math.min(84, u * 1000 / rng * 85));
        let d = ''; for (let i = 0; i < S.rec.length; i += 2) d += `${d ? 'L' : 'M'}${XS(S.rec[i][0]).toFixed(1)} ${YS(S.rec[i][1]).toFixed(1)}`;
        q('lTr').setAttribute('d', d);
        const a = !S.recOn ? analyse() : null;
        for (const [id, tv] of [['lS1', a?.t1], ['lS2', a?.t2]]) { q(id).setAttribute('x1', a ? XS(tv) : -10); q(id).setAttribute('x2', a ? XS(tv) : -10); }
        q('lSel').setAttribute('x', a ? XS(a.t1) : -10); q('lSel').setAttribute('width', a ? XS(a.t2) - XS(a.t1) : 0);
        q('lScT').textContent = `±${fmt(rng, 0)} mV   ${fmt(dur, 1)} s   ${a ? `Bereich: Ū = ${fmt(a.mean * 1000, 1)} mV, ∫U dt = ${fmt(a.area * 1000, 2)} mV·s` : ''}`;
        q('lRec').textContent = S.recOn ? '● Aufnahme läuft' : '';
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); } };
    }

    // ======================= Ansicht 3D =======================
    async function view3d(box, MM) {
      const { createLab, mats, label, arrow } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [0.02, 0.42, 0.8], target: [0.0, 0.11, -0.05], table: [1.8, 1.2], bloom: [0.5, 0.4, 0.9], room: 0.8, minDist: 0.15, maxDist: 2.2, fov: 38 });
      const { THREE, scene } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad · vorderer Pol durchsichtig gezeichnet</div>');
      const add = (geo, mat, x, y, z, parent = scene) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = !mat.transparent; parent.add(m); return m; };
      const YR = 0.045, YC = 0.16, GAP = 0.035;
      // Schiene auf Füßen
      add(new THREE.BoxGeometry(0.86, 0.012, 0.03), new THREE.MeshStandardMaterial({ color: 0xa8aeb3, metalness: 0.8, roughness: 0.35 }), 0.08, YR, 0);
      for (const x of [-0.32, 0.48]) add(new THREE.BoxGeometry(0.02, YR, 0.06), M.black, x, YR / 2, 0);
      add(new THREE.BoxGeometry(0.06, 0.05, 0.06), M.housing, 0.53, YR + 0.03, 0);
      // Magnet: Joch unter der Schiene, Pole beidseitig
      const iron = new THREE.MeshStandardMaterial({ color: 0x3a4045, metalness: 0.6, roughness: 0.45 });
      add(new THREE.BoxGeometry(0.12, 0.03, 0.2), iron, 0, 0.015, 0);
      add(new THREE.BoxGeometry(0.12, 0.2, 0.03), iron, 0, 0.11, -GAP - 0.04);
      add(new THREE.BoxGeometry(D, POLE_H, 0.025), new THREE.MeshStandardMaterial({ color: 0x2f8a3c, roughness: 0.45 }), 0, YC, -GAP - 0.0125);
      add(new THREE.BoxGeometry(0.12, 0.2, 0.03), new THREE.MeshStandardMaterial({ color: 0x3a4045, transparent: true, opacity: 0.18, depthWrite: false }), 0, 0.11, GAP + 0.04);
      add(new THREE.BoxGeometry(D, POLE_H, 0.025), new THREE.MeshStandardMaterial({ color: 0xc4231b, transparent: true, opacity: 0.22, depthWrite: false }), 0, YC, GAP + 0.0125);
      const lN = label(THREE, 'N', { color: '#ffffff', size: 0.02 }); lN.position.set(0, YC + POLE_H / 2 + 0.02, GAP + 0.02); const lS = label(THREE, 'S', { color: '#ffffff', size: 0.02 }); lS.position.set(0, YC + POLE_H / 2 + 0.02, -GAP - 0.02); scene.add(lN, lS);
      // Wagen mit Schleife
      const cart = new THREE.Group(); scene.add(cart);
      const body = add(new THREE.BoxGeometry(1, 0.02, 0.04), M.housing, 0, YR + 0.016, 0, cart);
      const mast = add(new THREE.BoxGeometry(0.006, 1, 0.006), M.steel, 0, 0, 0, cart);
      const loopG = new THREE.Group(); cart.add(loopG);
      const wheels = []; for (let i = 0; i < 4; i++) { const w = add(new THREE.CylinderGeometry(0.008, 0.008, 0.006, 16), M.black, 0, YR + 0.006, 0, cart); w.rotation.x = Math.PI / 2; wheels.push(w); }
      let cfg = '';
      function buildLoop() {
        loopG.clear(); const r = S.N === 1 ? 0.0015 : S.N === 10 ? 0.0028 : 0.0045, a = S.a, l = S.l;
        const pts = [[-a / 2, -l / 2], [a / 2, -l / 2], [a / 2, l / 2], [-a / 2, l / 2], [-a / 2, -l / 2]].map(([x, y]) => new THREE.Vector3(x, y, 0));
        const path = new THREE.CurvePath(); for (let i = 0; i < 4; i++) path.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
        const m = new THREE.Mesh(new THREE.TubeGeometry(path, 64, r, 8, true), M.copper); m.castShadow = true; loopG.add(m);
        body.scale.x = a + 0.03; mast.scale.y = YC - l / 2 - YR - 0.02; mast.position.y = YR + 0.026 + mast.scale.y / 2;
        wheels.forEach((w, i) => w.position.set((i < 2 ? -1 : 1) * (a / 2 + 0.005), YR + 0.0, (i % 2 ? 1 : -1) * 0.022));
      }
      // Messwerterfassung mit Bildschirm
      const ifc = new THREE.Group(); ifc.position.set(0.3, 0, -0.32); ifc.rotation.y = -0.3; scene.add(ifc);
      add(new THREE.BoxGeometry(0.22, 0.13, 0.12), M.housingLight, 0, 0.065, 0, ifc);
      const sc = document.createElement('canvas'); sc.width = 320; sc.height = 200; const sg = sc.getContext('2d'); const tex = new THREE.CanvasTexture(sc); tex.colorSpace = THREE.SRGBColorSpace;
      add(new THREE.PlaneGeometry(0.16, 0.1), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), 0, 0.07, 0.0605, ifc);
      const leadMat = [new THREE.LineBasicMaterial({ color: 0xc4231b }), new THREE.LineBasicMaterial({ color: 0x222222 })];
      const leads = leadMat.map(m => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(40 * 3), 3)); const l = new THREE.Line(g, m); l.frustumCulled = false; scene.add(l); return l; });
      const string = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xdddddd })); scene.add(string);
      // Modell
      const modelG = new THREE.Group(); scene.add(modelG);
      for (const x of [-0.03, 0, 0.03]) for (const y of [-0.04, 0, 0.04]) { const a = arrow(THREE, 0x86dcff, { radius: 0.0008, head: 0.006 }); a.set(new THREE.Vector3(x, YC + y, GAP - 0.002), new THREE.Vector3(0, 0, -2 * GAP + 0.004)); modelG.add(a); }
      const fluxP = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x86dcff, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })); modelG.add(fluxP);
      const aV = arrow(THREE, 0xf2ac74, { radius: 0.0016, head: 0.01 }), aF1 = arrow(THREE, 0xff7a8a, { radius: 0.0012, head: 0.008 }), aF2 = arrow(THREE, 0xff7a8a, { radius: 0.0012, head: 0.008 }), aB = arrow(THREE, 0xffd27a, { radius: 0.002, head: 0.012 });
      modelG.add(aV, aF1, aF2, aB);
      let acc = 0;
      const off = lab.onFrame(dt => {
        const key = `${S.N}|${S.a}|${S.l}`; if (key !== cfg) { cfg = key; buildLoop(); }
        const xc = S.x - S.a / 2; cart.position.x = xc; loopG.position.set(0, YC, 0);
        const lt = new THREE.Vector3(S.x - S.a, YC + S.l / 2, 0), dst = [new THREE.Vector3(0.28, 0.08, -0.26), new THREE.Vector3(0.29, 0.08, -0.26)];
        leads.forEach((ld, k) => { const c = new THREE.CatmullRomCurve3([lt.clone().add(new THREE.Vector3(k * 0.004, 0, 0)), lt.clone().add(new THREE.Vector3(-0.02, 0.08, 0)), new THREE.Vector3((lt.x + 0.28) / 2, 0.27, -0.14), dst[k]]); const arr = ld.geometry.attributes.position.array; c.getPoints(39).forEach((p, i) => { arr[i * 3] = p.x; arr[i * 3 + 1] = p.y; arr[i * 3 + 2] = p.z; }); ld.geometry.attributes.position.needsUpdate = true; });
        string.geometry.setFromPoints([new THREE.Vector3(S.x + 0.015, YR + 0.02, 0), new THREE.Vector3(0.5, YR + 0.03, 0)]); string.visible = S.mode === 'motor';
        acc += dt;
        if (acc > 0.06) {
          acc = 0; sg.fillStyle = '#081210'; sg.fillRect(0, 0, 320, 200); sg.strokeStyle = '#173328';
          for (let i = 1; i < 10; i++) { sg.beginPath(); sg.moveTo(i * 32, 0); sg.lineTo(i * 32, 200); sg.stroke(); } sg.strokeStyle = '#2a5a46'; sg.beginPath(); sg.moveTo(0, 100); sg.lineTo(320, 100); sg.stroke();
          const rng = scopeRange(), dur = Math.max(2, S.rec.length ? S.rec[S.rec.length - 1][0] : 0) * (S.recOn ? 1.1 : 1);
          sg.strokeStyle = '#7dffb8'; sg.lineWidth = 2.5; sg.shadowColor = '#7dffb8'; sg.shadowBlur = 8; sg.beginPath();
          S.rec.forEach(([t, u], i) => { if (i % 2) return; const x = t / dur * 320, y = 100 - Math.max(-95, Math.min(95, u * 1000 / rng * 95)); i ? sg.lineTo(x, y) : sg.moveTo(x, y); });
          sg.stroke(); sg.shadowBlur = 0; sg.fillStyle = '#7dffb8'; sg.font = '18px "IBM Plex Mono", monospace'; sg.fillText(`${fmt((S.U + 0.0002) * 1000, 1)} mV`, 8, 22); tex.needsUpdate = true;
        }
        modelG.visible = MM.model; if (!MM.model) return;
        const fx0 = Math.max(S.x - S.a, XF0), fx1 = Math.min(S.x, XF1);
        fluxP.visible = fx1 > fx0; if (fluxP.visible) { fluxP.scale.set(fx1 - fx0, S.l, 1); fluxP.position.set((fx0 + fx1) / 2, YC, 0.001); }
        const v = S.vx; aV.set(new THREE.Vector3(xc, YR + 0.04, 0.03), new THREE.Vector3(Math.max(-0.08, Math.min(0.08, v * 0.4)), 0, 0));
        const fl = Math.max(-0.05, Math.min(0.05, v * 0.25));
        aF1.visible = !!inF(S.x) && Math.abs(fl) > 0.003; if (aF1.visible) aF1.set(new THREE.Vector3(S.x, YC + fl / 2, 0.012), new THREE.Vector3(0, -fl, 0));
        aF2.visible = !!inF(S.x - S.a) && Math.abs(fl) > 0.003; if (aF2.visible) aF2.set(new THREE.Vector3(S.x - S.a, YC + fl / 2, 0.012), new THREE.Vector3(0, -fl, 0));
        const fb = S.closed ? Math.max(-0.1, Math.min(0.1, S.F * 3)) : 0; aB.visible = Math.abs(fb) > 0.003; if (aB.visible) aB.set(new THREE.Vector3(xc, YR + 0.03, 0.03), new THREE.Vector3(fb, 0, 0));
      });
      return { destroy() { off(); lab.dispose(); } };
    }

    const host = viewHost(stage, { id: 'leiterschleife', views: { '2d': view2d, '3d': view3d }, initial: '2d', modelInfo: 'Feld, Fluss, Lorentzkraft, Lenz' });

    let raf = 0, last = performance.now(), slow = 0, recAcc = 0;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      const n = 10, h = dt / n;
      for (let i = 0; i < n; i++) {
        const x0 = S.x;
        if (S.mode === 'motor') {
          if (S.dir) {
            if (S.delay > 0) S.delay -= h;
            else { const goal = S.dir > 0 ? xEnd() : X_START; S.x += S.dir * S.v * h; if ((S.dir > 0 && S.x >= goal) || (S.dir < 0 && S.x <= goal)) { S.x = goal; S.dir = 0; S.post = 0.4; gM.led(false); } }
          } else if (S.post > 0) { S.post -= h; if (S.post <= 0 && S.recOn) stopRec(); }
        } else S.x += (S.hx - S.x) * Math.min(1, h * 10);
        const vNow = h > 0 ? (S.x - x0) / h : 0;
        S.vx += (vNow - S.vx) * (S.mode === 'motor' ? 1 : Math.min(1, h * 60));
        S.w = inF(S.x) - inF(S.x - S.a);
        S.U = S.N * S.B * S.l * S.vx * S.w;
        S.I = S.closed ? S.U / R_CLOSED : 0; S.F = -S.N * S.B * S.l * S.I * S.w;
        if (S.recOn) {
          S.recT += h; recAcc += h;
          if (recAcc >= S.recDt) { recAcc -= S.recDt; S.rec.push([S.recT, S.U + 0.0002 + gauss(0.0004)]); if (S.rec.length === 1) S.recCfg = { N: S.N, l: S.l, B: S.B, v: S.v }; }
          if (S.recT > 30) stopRec();
        }
      }
      if (S.mode === 'hand' && Math.abs(sX.get() / 100 - S.hx) > 1e-4 && S.hx === xEnd()) sX.set(S.hx * 100);
      slow += dt; if (slow > 0.15) { slow = 0; drawRec(); }
    }
    raf = requestAnimationFrame(loop);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); chR.destroy(); chV.destroy(); chT.destroy(); } };
  }
};
