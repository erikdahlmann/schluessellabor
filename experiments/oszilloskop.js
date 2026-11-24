// ============================================================================
//  Schlüsselexperiment: Oszilloskop bzw. Messwerterfassungssystem
//  Zweikanal-Oszilloskop mit Funktionsgenerator. Kanal 2: Spannung am Kondensator
//  eines RC-Glieds (Tiefpass, R = 1 kΩ, C = 1 µF, f_g ≈ 159 Hz).
//  Yt-Betrieb mit Triggerung, XY-Betrieb (Lissajous), Cursor für ΔU und Δt.
//  Modell: Braunsche Röhre mit Ablenkplatten, Sägezahn der Zeitablenkung.
// ============================================================================
import { viewHost } from '../js/lib/views.js';

const RC = 1e3 * 1e-6;                          // s
const TDIVS = [1e-4, 2e-4, 5e-4, 1e-3, 2e-3, 5e-3, 1e-2, 2e-2, 5e-2, 0.1, 0.2];
const VDIVS = [0.2, 0.5, 1, 2, 5];
const tLabel = t => t < 1e-3 ? `${Math.round(t * 1e6)} µs` : t < 1 ? `${Math.round(t * 1e3)} ms` : `${t} s`;

// Fourier-Koeffizienten: [n, b_n] für sin(n x)
function series(wave) {
  if (wave === 'sin') return [[1, 1]];
  const out = [];
  for (let n = 1; n <= 79; n += 2) out.push([n, wave === 'rect' ? 4 / (Math.PI * n) : (8 / (Math.PI * Math.PI)) * ((n - 1) / 2 % 2 ? -1 : 1) / (n * n)]);
  return out;
}
const wave1 = (wave, x) => wave === 'sin' ? Math.sin(x) : wave === 'rect' ? (Math.sin(x) >= 0 ? 1 : -1) : (2 / Math.PI) * Math.asin(Math.sin(x));

const svgMarkup = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Oszilloskop mit zwei Kanälen, Funktionsgenerator und RC-Glied">
<defs>
  <linearGradient id="oBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2024"/><stop offset="1" stop-color="#121518"/></linearGradient>
  <filter id="oGl"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="oSh" x="-10%" y="-10%" width="130%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity=".55"/></filter>
  <marker id="oArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="context-stroke"/></marker>
</defs>
<rect width="1000" height="620" fill="url(#oBg)"/>
<rect x="24" y="46" width="512" height="414" rx="12" fill="#c9cbc8" filter="url(#oSh)"/>
<rect x="40" y="60" width="480" height="384" rx="8" fill="#06110c"/>
<g id="oGrid" stroke="#173328"></g>
<path id="oT1" fill="none" stroke="#7dffb8" stroke-width="2" filter="url(#oGl)"/>
<path id="oT2" fill="none" stroke="#ffd65a" stroke-width="2" filter="url(#oGl)"/>
<circle id="oSpot" r="4" fill="#e6fff0" filter="url(#oGl)" opacity="0"/>
<g id="oCur">
  <line id="oCu1" x1="40" x2="520" stroke="#ff9a7a" stroke-width="1.3" stroke-dasharray="6 4"/><line id="oCu2" x1="40" x2="520" stroke="#ff9a7a" stroke-width="1.3" stroke-dasharray="6 4"/>
  <line id="oCt1" y1="60" y2="444" stroke="#86dcff" stroke-width="1.3" stroke-dasharray="6 4"/><line id="oCt2" y1="60" y2="444" stroke="#86dcff" stroke-width="1.3" stroke-dasharray="6 4"/>
  <line data-c="y1" id="oCu1h" x1="40" x2="520" stroke="transparent" stroke-width="14" style="cursor:ns-resize"/><line data-c="y2" id="oCu2h" x1="40" x2="520" stroke="transparent" stroke-width="14" style="cursor:ns-resize"/>
  <line data-c="x1" id="oCt1h" y1="60" y2="444" stroke="transparent" stroke-width="14" style="cursor:ew-resize"/><line data-c="x2" id="oCt2h" y1="60" y2="444" stroke="transparent" stroke-width="14" style="cursor:ew-resize"/>
</g>
<line id="oTrig" x1="40" x2="52" stroke="#ff9a7a" stroke-width="3"/>
<text id="oInfo" x="46" y="456" fill="#333" font-size="11" font-family="IBM Plex Mono, monospace"></text>
<text id="oRun" x="514" y="76" fill="#ff9a7a" font-size="11" text-anchor="end"></text>
<!-- Funktionsgenerator -->
<rect x="566" y="46" width="404" height="112" rx="10" fill="#2b3034" filter="url(#oSh)"/>
<text x="580" y="66" fill="#c9c3ba" font-size="12">Funktionsgenerator</text>
<rect x="580" y="74" width="200" height="40" rx="4" fill="#160807"/><text id="oGf" x="772" y="103" fill="#ff5a3c" font-size="22" font-family="IBM Plex Mono, monospace" text-anchor="end"></text>
<rect x="790" y="74" width="166" height="40" rx="4" fill="#160807"/><text id="oGu" x="948" y="103" fill="#ff5a3c" font-size="18" font-family="IBM Plex Mono, monospace" text-anchor="end"></text>
<text id="oGw" x="580" y="140" fill="#c9c3ba" font-size="12"></text>
<!-- RC-Glied -->
<rect x="566" y="176" width="404" height="128" rx="10" fill="#e8e4da" filter="url(#oSh)"/>
<text x="580" y="196" fill="#333" font-size="12">Schaltung</text>
<g stroke="#333" stroke-width="2" fill="none">
  <path d="M600 230 H660"/><rect x="660" y="222" width="60" height="16" fill="#f4efe3"/><path d="M720 230 H820 V246"/><path d="M806 250 H834 M806 258 H834"/><path d="M820 262 V286 H600"/>
</g>
<text x="690" y="216" fill="#333" font-size="12" text-anchor="middle">R = 1 kΩ</text><text x="842" y="258" fill="#333" font-size="12">C = 1 µF</text>
<circle cx="600" cy="230" r="5" fill="#2f9e6a"/><text x="590" y="222" fill="#2f9e6a" font-size="12" text-anchor="end">CH1</text>
<circle id="oC2dot" cx="780" cy="230" r="5" fill="#d4a017"/><text id="oC2lab" x="780" y="222" fill="#b8860b" font-size="12" text-anchor="middle">CH2</text>
<text x="956" y="280" fill="#555" font-size="11" text-anchor="end">Grenzfrequenz</text><text x="956" y="296" fill="#555" font-size="11" text-anchor="end">f_g = 1/(2πRC) ≈ 159 Hz</text>
<!-- Anzeigen -->
<text x="570" y="336" fill="#8e979d" font-size="12">Cursor</text>
<text id="oDU" x="570" y="362" fill="#ff9a7a" font-size="16" font-family="IBM Plex Mono, monospace"></text>
<text id="oDT" x="570" y="388" fill="#86dcff" font-size="16" font-family="IBM Plex Mono, monospace"></text>
<text id="oDF" x="570" y="414" fill="#86dcff" font-size="14" font-family="IBM Plex Mono, monospace"></text>
<text id="oSet" x="570" y="444" fill="#c9c3ba" font-size="12"></text>
<!-- Modell: Braunsche Röhre -->
<g id="oTube" opacity="0">
  <path d="M60 520 H250 L520 482 V598 L250 560 H60 Z" fill="#1d2a30" stroke="#5c7a86" stroke-width="1.5"/>
  <rect x="68" y="530" width="10" height="20" fill="#ff8a3c"/><text x="64" y="578" fill="#c7c1b7" font-size="11">Kathode</text>
  <rect x="96" y="526" width="6" height="28" fill="#9aa"/><text x="88" y="592" fill="#c7c1b7" font-size="11">Anode</text>
  <rect id="oYp1" x="150" y="526" width="44" height="5" fill="#ffd65a"/><rect id="oYp2" x="150" y="549" width="44" height="5" fill="#ffd65a"/><text x="146" y="520" fill="#ffd65a" font-size="11">Y-Platten</text>
  <rect x="210" y="530" width="30" height="20" fill="none" stroke="#86dcff" stroke-dasharray="3 2"/><text x="204" y="576" fill="#86dcff" font-size="11">X-Platten</text>
  <path id="oBeam" fill="none" stroke="#7dffb8" stroke-width="2" filter="url(#oGl)"/>
  <circle id="oBeamSpot" r="4" fill="#e6fff0" filter="url(#oGl)"/>
  <text x="60" y="474" fill="#c7c1b7" font-size="11">Braunsche Röhre von der Seite: U_Y lenkt nach oben und unten ab</text>
  <rect x="560" y="482" width="410" height="116" rx="8" fill="#0b0d0f" stroke="#2a3238"/>
  <text id="oSawT" x="572" y="500" fill="#86dcff" font-size="12">Zeitablenkung: Sägezahnspannung an den X-Platten</text>
  <path id="oSaw" fill="none" stroke="#86dcff" stroke-width="2"/><circle id="oSawDot" r="4" fill="#fff"/>
</g>
</svg>`;

export default {
  intro: 'Mit dem Oszilloskop werden schnell veränderliche Spannungen sichtbar. Ihr stellt Zeit- und Spannungsablenkung und die Triggerung ein, messt mit den Cursorn Periodendauer und Scheitelwert und untersucht mit dem zweiten Kanal, wie ein RC-Glied eine Wechselspannung verändert.',
  docs: {
    durchfuehrung: `
<h3>Aufbau</h3>
<p>Ein Funktionsgenerator liefert Sinus-, Rechteck- oder Dreieckspannung. Sie liegt an Kanal 1 des Oszilloskops und an einem RC-Glied aus R = 1 kΩ und C = 1 µF. Kanal 2 zeigt die Spannung am Kondensator.</p>
<h3>Durchführung</h3>
<ol>
<li>Sinus mit f = 200 Hz und Û = 4 V einstellen. Zeit- und Spannungsablenkung so wählen, dass zwei bis drei Perioden den Bildschirm füllen.</li>
<li>Trigger ausschalten (Auto) und wieder einschalten. Triggerpegel und Flanke verändern. Was bewirkt die Triggerung?</li>
<li>Kopplung DC, AC und GND mit einem Offset ausprobieren.</li>
<li>Im 2D-Aufbau die blauen Cursor auf eine Periode legen, die roten auf Maximum und Minimum. <b>Periode und Amplitude übernehmen.</b> Für mehrere Frequenzen wiederholen und f = 1/T mit der Anzeige des Generators vergleichen.</li>
<li>Kanal 2 einschalten. Für Frequenzen zwischen 20 Hz und 2 kHz jeweils die Amplitude an beiden Kanälen messen (Cursor erst auf CH1, dann auf CH2) und mit den blauen Cursorn den zeitlichen Abstand zweier Nulldurchgänge. <b>Phasenverschiebung übernehmen.</b></li>
<li>Im XY-Betrieb die Lissajous-Figur betrachten. Wie ändert sie sich mit der Frequenz?</li>
</ol>`,
    theorie: `
<h3>Braunsche Röhre</h3>
<p>Elektronen aus einer Glühkathode werden zur Anode hin beschleunigt und fliegen als feiner Strahl auf einen Leuchtschirm. Zwei Plattenpaare lenken den Strahl ab. Die Ablenkung auf dem Schirm ist proportional zur Spannung an den Platten:</p>
<span class="formula tex">y = \\frac{l\\, s}{2\\, d\\, U_B}\\, U_Y</span>
<p>Dabei sind l die Plattenlänge, s der Abstand zum Schirm, d der Plattenabstand und U_B die Beschleunigungsspannung.</p>
<h3>Zeitablenkung und Trigger</h3>
<p>An den X-Platten liegt eine Sägezahnspannung. Sie führt den Strahl gleichmäßig von links nach rechts und springt dann zurück. An den Y-Platten liegt das Messsignal. So entsteht der Graph U(t). Der Trigger startet jeden Durchlauf an derselben Stelle des Signals, zum Beispiel beim Durchgang durch einen Pegel mit steigender Flanke. Dann liegen alle Durchläufe übereinander, und das Bild steht.</p>
<h3>Ablesen</h3>
<span class="formula tex">T = \\Delta x\\, [\\text{Div}] \\cdot \\text{Zeitablenkung} \\qquad \\hat{U} = \\frac{\\Delta y\\, [\\text{Div}]}{2} \\cdot \\text{Spannungsablenkung} \\qquad f = \\frac{1}{T}</span>
<h3>RC-Glied als Tiefpass</h3>
<p>Am Kondensator kommt bei hohen Frequenzen weniger Spannung an, und sie läuft der Eingangsspannung hinterher:</p>
<span class="formula tex">\\frac{\\hat{U}_C}{\\hat{U}} = \\frac{1}{\\sqrt{1 + (2\\pi f R C)^2}} \\qquad \\tan\\varphi = 2\\pi f R C \\qquad \\varphi = 360^\\circ \\cdot \\frac{\\Delta t}{T}</span>
<p>Bei der Grenzfrequenz f_g = 1/(2πRC) ist das Verhältnis 1/√2 ≈ 0,71 und die Phasenverschiebung 45°.</p>
<h3>Messwerterfassungssystem</h3>
<p>Ein Messwerterfassungssystem tastet die Spannung in festen Zeitabständen ab und speichert die Werte. Es arbeitet wie ein Speicheroszilloskop. Die Abtastrate muss mindestens doppelt so groß sein wie die höchste Frequenz im Signal.</p>
<h3>Modellgrenzen</h3>
<ul><li>Rechteck und Dreieck sind aus 40 Oberschwingungen zusammengesetzt. An den Sprüngen des Rechtecks sieht man deshalb kleine Überschwinger.</li><li>Der Eingangswiderstand des Oszilloskops belastet das RC-Glied nicht.</li></ul>
<h3>Was die Modellansicht zeigt</h3>
<ul><li>Die Braunsche Röhre in der Seitenansicht. Der Strahl wird im Takt des Signals zwischen den Y-Platten abgelenkt.</li><li>Die Sägezahnspannung der Zeitablenkung mit der aktuellen Stelle des Strahls. Der Strahl läuft in Zeitlupe.</li><li>Im 3D-Aufbau wird das Gehäuse durchsichtig, und man sieht die Röhre mit dem Strahl.</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Oszilloskop</td><td>2 Kanäle, 10 × 8 Div, 0,2 … 5 V/Div, 0,1 ms … 0,2 s/Div, Kopplung DC/AC/GND, Trigger mit Pegel und Flanke, XY-Betrieb, 2 Cursorpaare</td></tr>
<tr><td>Funktionsgenerator</td><td>Sinus, Rechteck, Dreieck, 10 Hz … 10 kHz, Û = 0,1 … 8 V, Offset ±4 V</td></tr>
<tr><td>RC-Glied</td><td>R = 1 kΩ, C = 1 µF, Grenzfrequenz 159 Hz</td></tr>
</tbody></table>`,
    abi: `
<details class="q"><summary>Auf dem Schirm sind 2 ms/Div eingestellt. Eine Periode ist 4,0 Div lang. Berechne f. <span class="op">AFB I</span></summary><p>T = 4,0 · 2 ms = 8 ms, f = 1/T = 125 Hz.</p></details>
<details class="q"><summary>Erkläre, warum ohne Trigger das Bild über den Schirm läuft. <span class="op">AFB II</span></summary><p>Jeder Durchlauf des Strahls beginnt dann an einer zufälligen Stelle des Signals. Die Kurven der einzelnen Durchläufe sind gegeneinander verschoben. Mit Trigger beginnt jeder Durchlauf am gleichen Signalwert mit gleicher Flanke.</p></details>
<details class="q"><summary>Bei f = 159 Hz misst man Û_C/Û ≈ 0,71. Begründe und berechne die Phasenverschiebung. <span class="op">AFB II</span></summary><p>Das ist die Grenzfrequenz: 2πfRC = 1. Dann ist Û_C/Û = 1/√2 und tan φ = 1, also φ = 45°. Δt = T/8 ≈ 0,79 ms.</p></details>
<details class="q"><summary>Im XY-Betrieb zeigt sich bei RC-Glied und hoher Frequenz eine flache, fast waagerechte Ellipse. Erkläre. <span class="op">AFB III</span></summary><p>Bei hoher Frequenz ist Û_C klein, die Figur wird in y-Richtung flach. Die Phasenverschiebung nähert sich 90°, die Achsen der Ellipse liegen dann parallel zu den Koordinatenachsen.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, segmented, selectBox, button, fmt, dataTable, toast, display } = ui;
    const S = { wave: 'sin', rng: 100, fine: 2, U: 4, off: 0, v1: 1, v2: 1, c1: 'DC', c2: 'DC', ch2: true, td: 1e-3, trig: 'rise', lvl: 0, xy: false, cch: 1,
      cu: { y1: 2, y2: -2, x1: 1, x2: 6 }, t: 0, sw: 0, swPrev: 0 };
    const f = () => S.rng * S.fine;
    const ser = () => series(S.wave);
    const raw1 = t => S.U * wave1(S.wave, 2 * Math.PI * f() * t) + S.off;
    const raw2 = t => { const w = 2 * Math.PI * f(); let s = 0; for (const [n, b] of ser()) { const x = n * w * RC; s += b / Math.sqrt(1 + x * x) * Math.sin(n * w * t - Math.atan(x)); } return S.U * s + S.off; };
    const disp = (v, c) => c === 'GND' ? 0 : c === 'AC' ? v - S.off : v;
    const ch1 = t => disp(raw1(t), S.c1), ch2 = t => disp(raw2(t), S.c2);
    function nextCross(t0) {
      if (S.trig === 'auto') return null;
      const T = 1 / f(), n = 500; let p = ch1(t0) - S.lvl;
      for (let i = 1; i <= n; i++) { const t = t0 + T * i / n, v = ch1(t) - S.lvl; if (S.trig === 'rise' ? (p < 0 && v >= 0) : (p > 0 && v <= 0)) return t - T / n * (v / (v - p)); p = v; }
      return null;
    }
    const sweepDur = () => S.td * 10;
    // Linienzüge in Div-Koordinaten (x 0…10, y −4…4)
    function traces() {
      if (S.xy) {
        const T = 1 / f(), a = [], n = 400; for (let i = 0; i <= n; i++) { const t = S.t + T * i / n; a.push([5 + ch1(t) / S.v1, ch2(t) / S.v2]); }
        return { t1: a, t2: [], frac: 1 };
      }
      const dur = sweepDur(), start = S.sw, frac = dur < 0.08 ? 1 : Math.max(0, Math.min(1, (S.t - start) / dur));
      const st = frac === 0 ? S.swPrev : start, fr = frac === 0 ? 1 : frac, n = 600, t1 = [], t2 = [];
      for (let i = 0; i <= n * fr; i++) { const t = st + dur * i / n; t1.push([10 * i / n, ch1(t) / S.v1]); if (S.ch2) t2.push([10 * i / n, ch2(t) / S.v2]); }
      return { t1, t2, frac: fr };
    }

    // --- Bedienung
    const gG = group('Funktionsgenerator', { led: true }); gG.led(true);
    const segW = segmented({ value: 'sin', options: [{ value: 'sin', label: 'Sinus' }, { value: 'rect', label: 'Rechteck' }, { value: 'tri', label: 'Dreieck' }], onChange: v => { S.wave = v; } });
    const segR = segmented({ value: 100, options: [{ value: 10, label: '× 10 Hz' }, { value: 100, label: '× 100 Hz' }, { value: 1000, label: '× 1 kHz' }], onChange: v => { S.rng = v; } });
    const sFine = slider({ label: 'Feinregler', min: 1, max: 10, step: 0.01, value: S.fine, digits: 2, onInput: v => { S.fine = v; } });
    const sU = slider({ label: 'Amplitude Û', min: 0.1, max: 8, step: 0.1, value: S.U, unit: 'V', digits: 1, onInput: v => { S.U = v; } });
    const sO = slider({ label: 'Offset', min: -4, max: 4, step: 0.1, value: 0, unit: 'V', digits: 1, onInput: v => { S.off = v; } });
    gG.append(el('div', { class: 'ctl' }, el('div', { style: 'grid-column:1/-1' }, segW)), el('div', { class: 'ctl' }, el('label', { style: 'grid-column:1/-1' }, 'Frequenzbereich'), el('div', { style: 'grid-column:1/-1' }, segR)), sFine, sU, sO);
    const gY = group('Kanäle');
    const segV1 = segmented({ value: 1, options: VDIVS.map(v => ({ value: v, label: `${fmt(v, v < 1 ? 1 : 0)}` })), onChange: v => { S.v1 = v; } });
    const segC1 = segmented({ value: 'DC', options: ['DC', 'AC', 'GND'].map(v => ({ value: v, label: v })), onChange: v => { S.c1 = v; } });
    const segV2 = segmented({ value: 1, options: VDIVS.map(v => ({ value: v, label: `${fmt(v, v < 1 ? 1 : 0)}` })), onChange: v => { S.v2 = v; } });
    const segC2 = segmented({ value: 'on', options: [{ value: 'on', label: 'CH2 ein (U_C)' }, { value: 'off', label: 'CH2 aus' }], onChange: v => { S.ch2 = v === 'on'; } });
    gY.append(el('div', { class: 'ctl' }, el('label', { style: 'grid-column:1/-1' }, 'CH1 in V/Div · Kopplung'), el('div', { style: 'grid-column:1/-1' }, segV1), el('div', { style: 'grid-column:1/-1;margin-top:6px' }, segC1)),
      el('div', { class: 'ctl' }, el('label', { style: 'grid-column:1/-1' }, 'CH2 in V/Div'), el('div', { style: 'grid-column:1/-1' }, segV2), el('div', { style: 'grid-column:1/-1;margin-top:6px' }, segC2)));
    const gX = group('Zeitablenkung und Trigger');
    const selT = selectBox({ label: 'Zeitablenkung', value: String(S.td), options: TDIVS.map(t => ({ value: String(t), label: tLabel(t) + '/Div' })), onChange: v => { S.td = +v; S.sw = S.t; } });
    const segTr = segmented({ value: 'rise', options: [{ value: 'auto', label: 'Auto (aus)' }, { value: 'rise', label: '↗ steigend' }, { value: 'fall', label: '↘ fallend' }], onChange: v => { S.trig = v; } });
    const sL = slider({ label: 'Triggerpegel', min: -8, max: 8, step: 0.1, value: 0, unit: 'V', digits: 1, onInput: v => { S.lvl = v; } });
    const segXY = segmented({ value: 'yt', options: [{ value: 'yt', label: 'Yt-Betrieb' }, { value: 'xy', label: 'XY-Betrieb' }], onChange: v => { S.xy = v === 'xy'; } });
    gX.append(selT, el('div', { class: 'ctl' }, el('label', { style: 'grid-column:1/-1' }, 'Trigger (CH1)'), el('div', { style: 'grid-column:1/-1' }, segTr)), sL, el('div', { class: 'ctl' }, el('div', { style: 'grid-column:1/-1' }, segXY)));
    const gC = group('Cursor und Messung');
    const segCC = segmented({ value: 1, options: [{ value: 1, label: 'rote Cursor an CH1' }, { value: 2, label: 'an CH2' }], onChange: v => { S.cch = v; } });
    const dU = display('ΔU (rot)'), dT = display('Δt (blau)');
    gC.append(el('div', { class: 'ctl' }, el('div', { style: 'grid-column:1/-1' }, segCC)), dU, dT,
      el('div', { class: 'bar' }, button('Periode und Amplitude übernehmen', () => takeTU(), 'btn small primary')),
      el('div', { class: 'bar' }, button('Phasenverschiebung übernehmen', () => takePh())),
      el('p', { class: 'muted', style: 'font-size:12.5px;margin:8px 0 0' }, 'Cursor im 2D-Aufbau mit der Maus verschieben.'));
    controls.append(gG, gY, gX, gC);
    const cDU = () => Math.abs(S.cu.y1 - S.cu.y2) * (S.cch === 1 ? S.v1 : S.v2), cDT = () => Math.abs(S.cu.x1 - S.cu.x2) * S.td;

    // --- Messwerte
    const rows = [], phs = [];
    const tbl = dataTable([
      { key: 'fg', label: 'f Generator in Hz', digits: 1 }, { key: 'ch', label: 'Kanal', fmt: v => 'CH' + v }, { key: 'T', label: 'T in ms', fmt: v => fmt(v * 1000, 3) },
      { key: 'fm', label: 'f = 1/T in Hz', digits: 1 }, { key: 'U', label: 'Û in V', digits: 2 }
    ], { onDelete: i => { rows.splice(i, 1); redraw(); } });
    const tblP = dataTable([{ key: 'fg', label: 'f in Hz', digits: 1 }, { key: 'dt', label: 'Δt in ms', fmt: v => fmt(v * 1000, 3) }, { key: 'phi', label: 'φ in °', digits: 1 }], { onDelete: i => { phs.splice(i, 1); redraw(); } });
    const figF = el('div', { class: 'fig' }), figA = el('div', { class: 'fig' }), figP = el('div', { class: 'fig' });
    const chF = new Chart(figF, { xlabel: 'f Generator in Hz', ylabel: 'f = 1/T in Hz' }), chA = new Chart(figA, { xlabel: 'f in Hz', ylabel: 'Û_C / Û' }), chP = new Chart(figP, { xlabel: 'f in Hz', ylabel: 'φ in °' });
    const resF = el('div', { class: 'result' }), resA = el('div', { class: 'result' }), resP = el('div', { class: 'result' });
    messwerte.append(
      el('div', { class: 'data' },
        el('div', { class: 'chartbox' }, el('h4', {}, 'Gemessene über eingestellte Frequenz'), figF, resF,
          csvTools(() => ({ meta: ['Oszilloskop: Periode und Amplitude'], columns: [{ key: 'fg', label: 'f_Generator in Hz' }, { key: 'ch', label: 'Kanal' }, { key: 'T', label: 'T in s' }, { key: 'U', label: 'U_hat in V' }], rows }), 'oszilloskop_messreihe')),
        el('div', { class: 'chartbox' }, el('h4', {}, 'RC-Glied: Amplitudenverhältnis'), figA, resA)),
      el('div', { style: 'height:14px' }),
      el('div', { class: 'data' },
        el('div', { class: 'chartbox' }, el('h4', {}, 'RC-Glied: Phasenverschiebung'), figP, resP,
          csvTools(() => ({ meta: ['Oszilloskop: Phasenverschiebung RC-Glied'], columns: [{ key: 'fg', label: 'f in Hz' }, { key: 'dt', label: 'dt in s' }, { key: 'phi', label: 'phi in Grad' }], rows: phs }), 'oszilloskop_phase')),
        el('div', {}, el('h4', { style: 'margin:0 0 8px' }, 'Phasenverschiebungen'), tblP)),
      el('div', { style: 'height:14px' }), tbl);
    const thA = x => 1 / Math.sqrt(1 + (2 * Math.PI * x * RC) ** 2), thP = x => Math.atan(2 * Math.PI * x * RC) * 180 / Math.PI;
    function redraw() {
      tbl.render(rows); tblP.render(phs);
      const p1 = rows.map(r => [r.fg, r.fm]); let t1 = '<span>Mindestens zwei Frequenzen messen.</span>'; const f1 = [];
      if (rows.length >= 2) { const q = fit.propFit(p1.map(p => p[0]), p1.map(p => p[1])); if (q) { f1.push({ f: q.f, color: '#ab93ff' }); t1 = `<div><span>Ursprungsgerade, R² = ${fmt(q.r2, 4)}</span><br><b>Steigung ${fmt(q.a, 3)} (erwartet 1)</b></div>`; } }
      chF.set([{ color: '#7dffb8', mode: 'dot', points: p1 }], f1); resF.innerHTML = t1;
      const pairs = []; for (const fg of [...new Set(rows.map(r => r.fg))]) { const a = rows.filter(r => r.fg === fg && r.ch === 1).at(-1), b = rows.filter(r => r.fg === fg && r.ch === 2).at(-1); if (a && b) pairs.push([fg, b.U / a.U]); }
      pairs.sort((a, b) => a[0] - b[0]);
      const fmax = Math.max(500, ...pairs.map(p => p[0]), ...phs.map(p => p.fg));
      chA.set([{ color: '#ffd65a', mode: 'dot', points: pairs }], pairs.length ? [{ f: thA, color: '#ab93ff', name: 'Theorie' }] : []);
      resA.innerHTML = pairs.length ? `<div><span>${pairs.length} Frequenzen mit beiden Kanälen</span><br><b>Grenzfrequenz bei 0,71 ablesen (Theorie 159 Hz)</b></div>` : '<span>Bei derselben Frequenz Û an CH1 und an CH2 messen.</span>';
      chP.set([{ color: '#86dcff', mode: 'dot', points: phs.map(p => [p.fg, p.phi]).sort((a, b) => a[0] - b[0]) }], phs.length ? [{ f: thP, color: '#ab93ff', name: 'Theorie' }] : []);
      resP.innerHTML = phs.length ? `<div><span>tan φ = 2πfRC</span><br><b>φ = 45° bei f_g = 159 Hz</b></div>` : '<span>Δt zwischen gleichen Nulldurchgängen von CH1 und CH2 messen.</span>';
      chA.o.xmax = chP.o.xmax = fmax; chA.draw(); chP.draw();
    }
    redraw();
    function takeTU() {
      if (S.xy) { toast('Im XY-Betrieb gibt es keine Zeitachse.'); return; }
      const T = cDT(), dUc = cDU(); if (T <= 0 || dUc <= 0) { toast('Erst die Cursor setzen.'); return; }
      if (S.cch === 2 && !S.ch2) { toast('Kanal 2 ist aus.'); return; }
      rows.push({ fg: f(), ch: S.cch, T, fm: 1 / T, U: dUc / 2 }); redraw();
      toast(`Übernommen: T = ${fmt(T * 1000, 3)} ms, Û = ${fmt(dUc / 2, 2)} V an CH${S.cch}`);
    }
    function takePh() {
      if (!S.ch2 || S.xy) { toast('Dafür Kanal 2 und Yt-Betrieb einschalten.'); return; }
      const dt = cDT(); if (dt <= 0) { toast('Blaue Cursor auf die Nulldurchgänge von CH1 und CH2 legen.'); return; }
      const phi = 360 * dt * f(); if (phi > 180) { toast('Δt ist größer als eine halbe Periode. Benachbarte Nulldurchgänge wählen.'); return; }
      phs.push({ fg: f(), dt, phi }); redraw(); toast(`Übernommen: Δt = ${fmt(dt * 1000, 3)} ms, φ = ${fmt(phi, 1)}°`);
    }

    // Strahl im Modell: Zeitlupe, ein Durchlauf in 1,6 s
    const modelSpot = () => { const tr = traces(); const a = tr.t1; if (!a.length) return null; const u = (performance.now() / 1600) % 1, i = Math.min(a.length - 1, Math.floor(u * a.length)); return { x: a[i][0], y: a[i][1], u }; };

    // ======================= Ansicht 2D =======================
    async function view2d(box, MM) {
      box.insertAdjacentHTML('beforeend', svgMarkup());
      const svg = box.querySelector('svg'), q = id => svg.querySelector('#' + id);
      const X = d => 40 + d * 48, Y = d => 252 - Math.max(-4.3, Math.min(4.3, d)) * 48;
      { let h = ''; for (let i = 1; i < 10; i++) h += `<line x1="${X(i)}" y1="60" x2="${X(i)}" y2="444"${i === 5 ? ' stroke="#2a5a46"' : ''}/>`; for (let i = 1; i < 8; i++) h += `<line x1="40" y1="${60 + i * 48}" x2="520" y2="${60 + i * 48}"${i === 4 ? ' stroke="#2a5a46"' : ''}/>`; q('oGrid').innerHTML = h; }
      let drag = null;
      svg.querySelectorAll('#oCur [data-c]').forEach(h => h.addEventListener('pointerdown', e => { drag = h.dataset.c; svg.setPointerCapture(e.pointerId); e.preventDefault(); }));
      svg.addEventListener('pointermove', e => { if (!drag) return; const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const c = p.matrixTransform(svg.getScreenCTM().inverse());
        if (drag[0] === 'y') S.cu[drag] = Math.round(Math.max(-4, Math.min(4, (252 - c.y) / 48)) * 50) / 50; else S.cu[drag] = Math.round(Math.max(0, Math.min(10, (c.x - 40) / 48)) * 50) / 50; });
      svg.addEventListener('pointerup', () => { drag = null; });
      let raf = 0;
      const path = a => a.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('');
      function frame() {
        raf = requestAnimationFrame(frame);
        const tr = traces();
        q('oT1').setAttribute('d', path(tr.t1)); q('oT2').setAttribute('d', path(tr.t2));
        const slow = !S.xy && sweepDur() >= 0.08 && tr.frac < 1;
        if (slow) { const l = tr.t1.at(-1); q('oSpot').setAttribute('cx', X(l[0])); q('oSpot').setAttribute('cy', Y(l[1])); }
        q('oSpot').setAttribute('opacity', slow ? 1 : 0);
        for (const [id, v] of [['oCu1', S.cu.y1], ['oCu1h', S.cu.y1], ['oCu2', S.cu.y2], ['oCu2h', S.cu.y2]]) { q(id).setAttribute('y1', Y(v)); q(id).setAttribute('y2', Y(v)); }
        for (const [id, v] of [['oCt1', S.cu.x1], ['oCt1h', S.cu.x1], ['oCt2', S.cu.x2], ['oCt2h', S.cu.x2]]) { q(id).setAttribute('x1', X(v)); q(id).setAttribute('x2', X(v)); }
        q('oCur').setAttribute('opacity', S.xy ? 0 : 1);
        q('oCu1').setAttribute('stroke', S.cch === 1 ? '#ff9a7a' : '#ffd65a'); q('oCu2').setAttribute('stroke', S.cch === 1 ? '#ff9a7a' : '#ffd65a');
        q('oTrig').setAttribute('y1', Y(S.lvl / S.v1)); q('oTrig').setAttribute('y2', Y(S.lvl / S.v1)); q('oTrig').setAttribute('opacity', S.trig === 'auto' || S.xy ? 0 : 1);
        q('oInfo').textContent = S.xy ? `XY · X: CH1 ${fmt(S.v1, 1)} V/Div · Y: CH2 ${fmt(S.v2, 1)} V/Div` : `CH1 ${fmt(S.v1, 1)} V/Div ${S.c1}   CH2 ${S.ch2 ? fmt(S.v2, 1) + ' V/Div' : 'aus'}   ${tLabel(S.td)}/Div`;
        q('oRun').textContent = S.xy ? '' : S.trig === 'auto' ? 'kein Trigger' : nextCross(S.t) == null ? 'Pegel außerhalb: kein Trigger' : 'getriggert';
        q('oGf').textContent = f() >= 1000 ? `${fmt(f() / 1000, 3)} kHz` : `${fmt(f(), 1)} Hz`; q('oGu').textContent = `Û ${fmt(S.U, 1)} V`;
        q('oGw').textContent = `${S.wave === 'sin' ? 'Sinus' : S.wave === 'rect' ? 'Rechteck' : 'Dreieck'}${S.off ? ` · Offset ${fmt(S.off, 1)} V` : ''}`;
        q('oC2dot').setAttribute('opacity', S.ch2 ? 1 : 0.25); q('oC2lab').setAttribute('opacity', S.ch2 ? 1 : 0.25);
        q('oDU').textContent = `ΔU = ${fmt(cDU(), 2)} V (CH${S.cch})`; q('oDT').textContent = `Δt = ${fmt(cDT() * 1000, 3)} ms`; q('oDF').textContent = `1/Δt = ${fmt(1 / Math.max(1e-9, cDT()), 1)} Hz`;
        q('oSet').textContent = S.trig === 'auto' ? 'Trigger aus' : `Trigger ${S.trig === 'rise' ? 'steigend' : 'fallend'} bei ${fmt(S.lvl, 1)} V`;
        const model = MM.model; q('oTube').setAttribute('opacity', model ? 1 : 0);
        if (model) {
          const sp = modelSpot();
          if (sp) {
            const yd = Math.max(-4.2, Math.min(4.2, sp.y)), ys = 540 - yd * 13, ym = 540 - yd * 2.2;
            q('oBeam').setAttribute('d', `M78 540 H150 Q172 540 194 ${ym.toFixed(1)} L520 ${ys.toFixed(1)}`); q('oBeamSpot').setAttribute('cx', 520); q('oBeamSpot').setAttribute('cy', ys);
            q('oYp1').setAttribute('fill', yd > 0.05 ? '#ff8a7a' : yd < -0.05 ? '#86dcff' : '#ffd65a'); q('oYp2').setAttribute('fill', yd > 0.05 ? '#86dcff' : yd < -0.05 ? '#ff8a7a' : '#ffd65a');
            let d = ''; for (let k = 0; k < 3; k++) d += `${k ? 'L' : 'M'}${580 + k * 120} 584 L${700 + k * 120} 510 `; q('oSaw').setAttribute('d', d.replace(/ L(\d+) 510 $/, ' L$1 510'));
            const k = Math.floor(sp.u * 3), u3 = sp.u * 3 - k; q('oSawDot').setAttribute('cx', 580 + k * 120 + u3 * 120); q('oSawDot').setAttribute('cy', 584 - u3 * 74);
            q('oSaw').setAttribute('opacity', S.xy ? 0 : 1); q('oSawDot').setAttribute('opacity', S.xy ? 0 : 1); q('oSawT').textContent = S.xy ? 'XY-Betrieb: an den X-Platten liegt CH1, an den Y-Platten CH2' : 'Zeitablenkung: Sägezahnspannung an den X-Platten';
            q('oSpot').setAttribute('opacity', 1); q('oSpot').setAttribute('cx', X(S.xy ? sp.x : sp.u * 10)); q('oSpot').setAttribute('cy', Y(sp.y));
          }
        }
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); } };
    }

    // ======================= Ansicht 3D =======================
    async function view3d(box, MM) {
      const { createLab, mats, cable, powerSupply, glassMaterial, glowSprite } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [0.08, 0.36, 0.72], target: [0.02, 0.13, 0], table: [1.8, 1.2], bloom: [0.6, 0.4, 0.88], room: 0.55, minDist: 0.2, maxDist: 2.2, fov: 38 });
      const { THREE, scene } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad · Cursor im 2D-Aufbau verschieben</div>');
      const osc = new THREE.Group(); osc.position.set(-0.08, 0, 0); scene.add(osc);
      const hMat = new THREE.MeshStandardMaterial({ color: 0xc9cbc8, roughness: 0.5, metalness: 0.1, transparent: true, opacity: 1 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.36), hMat); body.position.set(0, 0.1, -0.08); body.castShadow = true; osc.add(body);
      const front = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.005), new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.6 })); front.position.set(0, 0.1, 0.1025); osc.add(front);
      const sc = document.createElement('canvas'); sc.width = 400; sc.height = 320; const sg = sc.getContext('2d'); const tex = new THREE.CanvasTexture(sc); tex.colorSpace = THREE.SRGBColorSpace;
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.12), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); scr.position.set(-0.07, 0.11, 0.106); osc.add(scr);
      for (let i = 0; i < 8; i++) { const k = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.01, 0.012, 20), M.knob); k.rotation.x = Math.PI / 2; k.position.set(0.04 + (i % 4) * 0.034, 0.16 - Math.floor(i / 4) * 0.045, 0.11); osc.add(k); }
      for (const [x, c] of [[0.06, 0x2f9e6a], [0.12, 0xd4a017]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.012, 16), new THREE.MeshStandardMaterial({ color: c, metalness: 0.6, roughness: 0.3 })); b.rotation.x = Math.PI / 2; b.position.set(x, 0.035, 0.11); osc.add(b); }
      const gen = powerSupply(THREE, { label: 'Funktionsgenerator', displays: 2, knobs: 3, w: 0.24, h: 0.11, d: 0.2 }); gen.position.set(0.3, 0, -0.02); gen.rotation.y = -0.45; scene.add(gen);
      // Steckbrett mit R und C
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.1), new THREE.MeshStandardMaterial({ color: 0xe8e4da, roughness: 0.6 })); board.position.set(0.16, 0.006, 0.2); scene.add(board);
      const res = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.03, 12), new THREE.MeshStandardMaterial({ color: 0xd8c7a0 })); res.rotation.z = Math.PI / 2; res.position.set(0.13, 0.018, 0.2); scene.add(res);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.016, 0.008), new THREE.MeshStandardMaterial({ color: 0xc4231b, roughness: 0.4 })); cap.position.set(0.19, 0.02, 0.2); scene.add(cap);
      const V = (x, y, z) => new THREE.Vector3(x, y, z);
      scene.add(cable(THREE, gen.socketWorld(0), V(0.1, 0.014, 0.2), 0xc4231b, 0.03), cable(THREE, V(0.1, 0.014, 0.21), V(-0.02, 0.035, 0.11), 0x2f9e6a, 0.03), cable(THREE, V(0.16, 0.014, 0.2), V(0.04, 0.035, 0.11), 0xd4a017, 0.03));
      // Modell: Röhre im Gehäuse
      const tubeG = new THREE.Group(); tubeG.position.set(-0.07, 0.11, 0); osc.add(tubeG);
      const glass = new THREE.MeshStandardMaterial({ color: 0x9fd0e0, transparent: true, opacity: 0.22, roughness: 0.1, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false });
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 24, 1, true), glass); neck.rotation.x = Math.PI / 2; neck.position.z = -0.17; tubeG.add(neck);
      const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.018, 0.1, 32, 1, true), glass); cone.rotation.x = Math.PI / 2; cone.position.z = 0.04; tubeG.add(cone);
      const cath = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.01, 12), new THREE.MeshBasicMaterial({ color: 0xff8a3c, toneMapped: false })); cath.rotation.x = Math.PI / 2; cath.position.z = -0.24; tubeG.add(cath);
      const plateM = new THREE.MeshStandardMaterial({ color: 0xffd65a, metalness: 0.6, roughness: 0.3 }), plateX = new THREE.MeshStandardMaterial({ color: 0x86dcff, metalness: 0.6, roughness: 0.3 });
      for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.002, 0.03), plateM); p.position.set(0, s * 0.008, -0.15); tubeG.add(p); const q = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.02, 0.025), plateX); q.position.set(s * 0.009, 0, -0.11); tubeG.add(q); }
      const beamGeo = new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), V(0, 0, 0), V(0, 0, 0), V(0, 0, 0)]);
      const beam = new THREE.Line(beamGeo, new THREE.LineBasicMaterial({ color: 0x7dffb8, toneMapped: false })); tubeG.add(beam);
      const bspot = glowSprite(THREE, 0xc8ffe0, 0.012); tubeG.add(bspot);
      let acc = 0;
      const off = lab.onFrame(dt => {
        gen.displays[0].draw(f() >= 1000 ? fmt(f() / 1000, 2) : fmt(f(), 0), f() >= 1000 ? 'kHz' : 'Hz'); gen.displays[1].draw(fmt(S.U, 1), 'V');
        const model = MM.model; tubeG.visible = model; hMat.opacity = model ? 0.25 : 1; hMat.depthWrite = !model; front.visible = !model; scr.material.transparent = model; scr.material.opacity = model ? 0.75 : 1;
        acc += dt;
        if (acc > 0.04) {
          acc = 0; sg.fillStyle = '#06110c'; sg.fillRect(0, 0, 400, 320); sg.strokeStyle = '#173328'; sg.lineWidth = 1;
          for (let i = 1; i < 10; i++) { sg.beginPath(); sg.moveTo(i * 40, 0); sg.lineTo(i * 40, 320); sg.stroke(); } for (let i = 1; i < 8; i++) { sg.beginPath(); sg.moveTo(0, i * 40); sg.lineTo(400, i * 40); sg.stroke(); }
          const tr = traces(), Xc = d => d * 40, Yc = d => 160 - Math.max(-4.2, Math.min(4.2, d)) * 40;
          for (const [a, c] of [[tr.t1, '#7dffb8'], [tr.t2, '#ffd65a']]) { if (!a.length) continue; sg.strokeStyle = c; sg.shadowColor = c; sg.shadowBlur = 8; sg.lineWidth = 2.5; sg.beginPath(); a.forEach((p, i) => i ? sg.lineTo(Xc(p[0]), Yc(p[1])) : sg.moveTo(Xc(p[0]), Yc(p[1]))); sg.stroke(); }
          sg.shadowBlur = 0;
          if (!S.xy) { sg.setLineDash([6, 4]); sg.strokeStyle = '#ff9a7a'; for (const y of [S.cu.y1, S.cu.y2]) { sg.beginPath(); sg.moveTo(0, Yc(y)); sg.lineTo(400, Yc(y)); sg.stroke(); } sg.strokeStyle = '#86dcff'; for (const x of [S.cu.x1, S.cu.x2]) { sg.beginPath(); sg.moveTo(Xc(x), 0); sg.lineTo(Xc(x), 320); sg.stroke(); } sg.setLineDash([]); }
          tex.needsUpdate = true;
        }
        if (!model) return;
        const sp = modelSpot(); if (!sp) return;
        const sx = ((S.xy ? sp.x : sp.u * 10) - 5) / 5 * 0.072, sy = Math.max(-4.2, Math.min(4.2, sp.y)) / 4 * 0.058;
        const pts = [V(0, 0, -0.235), V(0, 0, -0.165), V(sx * 0.12, sy * 0.15, -0.12), V(sx, sy, 0.088)];
        beamGeo.setFromPoints(pts); bspot.position.copy(pts[3]);
      });
      return { destroy() { off(); lab.dispose(); } };
    }

    const host = viewHost(stage, { id: 'oszilloskop', views: { '2d': view2d, '3d': view3d }, initial: '2d', modelInfo: 'Braunsche Röhre, Zeitablenkung' });
    let raf = 0, last = performance.now(), slow = 0;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; S.t += dt;
      const dur = sweepDur();
      if (dur < 0.08) { const c = nextCross(S.t); S.sw = c ?? S.t; }
      else if (S.t >= S.sw + dur) { S.swPrev = S.sw; const c = nextCross(S.t); S.sw = c ?? S.t; }
      slow += dt; if (slow > 0.2) { slow = 0; dU.set(`${fmt(cDU(), 2)} V`); dT.set(`${fmt(cDT() * 1000, 3)} ms`); }
    }
    raf = requestAnimationFrame(loop);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); chF.destroy(); chA.destroy(); chP.destroy(); } };
  }
};
