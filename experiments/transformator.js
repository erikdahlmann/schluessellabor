// ============================================================================
//  Schlüsselexperiment: Transformator – Spannungs- und Stromübersetzung
//  Zwei gekoppelte Spulen auf einem U-Kern mit Joch (50 Hz).
//  L = A_L·N², M = k·√(L1·L2). Ersatzschaltung mit Wicklungswiderständen:
//    U1 = (R1 + jωL1)·I1 + jωM·I2,   0 = jωM·I1 + (R2 + jωL2 + Z_L)·I2
//  Ideal: U2/U1 = N2/N1, I1/I2 = N2/N1. Hochstromspule: Nagel glüht und schmilzt.
//  Modell: magnetischer Fluss im Kern, Streufluss ohne Joch, Zeitverläufe.
// ============================================================================
import { viewHost } from '../js/lib/views.js';

const W = 2 * Math.PI * 50;
const CORE = { yoke: { AL: 15e-6, k: 0.985 }, open: { AL: 0.7e-6, k: 0.5 } };
const N1S = [250, 500, 1000], N2S = [6, 250, 500, 1000];
const Rcoil = n => n <= 10 ? 0.0006 : 2.5 * (n / 500) ** 1.9;
const LOADS = [
  { id: 'open', name: 'offen (kein Verbraucher)', R: 1e9 }, { id: 'lamp', name: 'Lampe 6 V / 3 W', R: 12 },
  { id: 'r100', name: 'Widerstand 100 Ω', R: 100 }, { id: 'r10', name: 'Widerstand 10 Ω', R: 10 },
  { id: 'r1', name: 'Widerstand 1 Ω', R: 1 }, { id: 'nail', name: 'Eisennagel (Hochstrom)', R: 0.004 }
];
// komplexe Zahlen als [re, im]
const cAdd = (a, b) => [a[0] + b[0], a[1] + b[1]], cMul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cDiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cAbs = a => Math.hypot(a[0], a[1]), cArg = a => Math.atan2(a[1], a[0]);

function solve(U1, N1, N2, yoke, RL) {
  const c = yoke ? CORE.yoke : CORE.open, L1 = c.AL * N1 * N1, L2 = c.AL * N2 * N2, Mm = c.k * Math.sqrt(L1 * L2);
  const Z22 = [Rcoil(N2) + RL, W * L2], jwM = [0, W * Mm];
  const Zin = cAdd([Rcoil(N1), W * L1], cDiv(cMul(jwM, jwM).map(v => -v), Z22));
  const I1 = cDiv([U1, 0], Zin), I2 = cDiv(cMul(jwM, I1).map(v => -v), Z22), U2 = cMul(I2, [-RL, 0]).map(v => -v);
  const Phi = cDiv(cAdd(cMul([0, W * L1], I1), cMul(jwM, I2)), [0, W * N1]);   // Fluss je Windung (Primärseite)
  return { I1, I2, U2, Phi, L1, L2, M: Mm };
}

const svgMarkup = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Transformator: U-Kern mit Joch, Primär- und Sekundärspule, Messgeräte, Spannungsquelle und Verbraucher">
<defs>
  <linearGradient id="tBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2024"/><stop offset="1" stop-color="#121518"/></linearGradient>
  <pattern id="tLam" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#5c6268"/><rect width="6" height="1.2" fill="#4a5056"/></pattern>
  <pattern id="tCu" width="6" height="5" patternUnits="userSpaceOnUse"><rect width="6" height="5" fill="#b8692f"/><rect width="6" height="1.4" y="3.6" fill="#7a3e16"/></pattern>
  <filter id="tSh" x="-10%" y="-10%" width="130%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity=".55"/></filter>
  <filter id="tGl"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <radialGradient id="tLampG"><stop offset="0" stop-color="#fff6d8"/><stop offset=".4" stop-color="#ffd27a"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
</defs>
<rect width="1000" height="620" fill="url(#tBg)"/>
<!-- Kern -->
<g filter="url(#tSh)">
  <rect x="330" y="200" width="60" height="250" fill="url(#tLam)"/><rect x="610" y="200" width="60" height="250" fill="url(#tLam)"/>
  <rect x="330" y="450" width="340" height="60" fill="url(#tLam)"/>
  <rect id="tYoke" x="330" y="140" width="340" height="60" fill="url(#tLam)"/>
</g>
<text id="tYokeT" x="500" y="176" fill="#ece6dc" font-size="12" text-anchor="middle">Joch</text>
<!-- Fluss (Modell) -->
<g id="tFluxG" opacity="0">
  <path id="tFlux" d="M360 170 H640 V480 H360 Z" fill="none" stroke="#86dcff" stroke-width="4" stroke-dasharray="10 16"/>
  <g id="tLeak" fill="none" stroke="#86dcff" stroke-width="2" stroke-dasharray="6 10" opacity="0"><path d="M340 200 C300 90 420 70 430 200"/><path d="M380 200 C370 120 460 110 460 200"/><path d="M660 200 C700 90 580 70 570 200"/><path d="M620 200 C630 120 540 110 540 200"/><path d="M360 200 C330 30 670 30 640 200"/></g>
</g>
<!-- Spulen -->
<rect x="312" y="250" width="96" height="160" rx="8" fill="url(#tCu)" stroke="#5a2c0e" filter="url(#tSh)"/>
<rect id="tC2" x="592" y="250" width="96" height="160" rx="8" fill="url(#tCu)" stroke="#5a2c0e" filter="url(#tSh)"/>
<rect x="318" y="320" width="84" height="22" rx="4" fill="rgba(10,12,14,.75)"/><text id="tN1" x="360" y="336" fill="#ece6dc" font-size="13" text-anchor="middle"></text>
<rect x="598" y="320" width="84" height="22" rx="4" fill="rgba(10,12,14,.75)"/><text id="tN2" x="640" y="336" fill="#ece6dc" font-size="13" text-anchor="middle"></text>
<!-- Primärkreis -->
<path d="M312 280 H180 V230 M312 380 H180 V430" stroke="#c4231b" stroke-width="2.4" fill="none"/>
<circle cx="120" cy="330" r="40" fill="#2b3034" stroke="#6a7178" stroke-width="2"/><path d="M96 330 q12 -18 24 0 q12 18 24 0" stroke="#ffb347" stroke-width="2.4" fill="none"/>
<path d="M120 290 V230 H180 M120 370 V430 H180" stroke="#c4231b" stroke-width="2.4" fill="none"/>
<text x="120" y="398" fill="#8e979d" font-size="11" text-anchor="middle">~ 50 Hz</text>
<g font-family="IBM Plex Mono, monospace">
  <rect x="150" y="96" width="150" height="56" rx="6" fill="#160807" stroke="#3a1a14"/><text x="160" y="112" fill="#8e979d" font-size="10" font-family="IBM Plex Sans, sans-serif">U₁ (Effektivwert)</text><text id="tU1" x="290" y="142" fill="#ff5a3c" font-size="22" text-anchor="end">0,0 V</text>
  <rect x="150" y="470" width="150" height="56" rx="6" fill="#160807" stroke="#3a1a14"/><text x="160" y="486" fill="#8e979d" font-size="10" font-family="IBM Plex Sans, sans-serif">I₁</text><text id="tI1" x="290" y="516" fill="#ff5a3c" font-size="22" text-anchor="end">0 mA</text>
  <rect x="700" y="96" width="150" height="56" rx="6" fill="#160807" stroke="#3a1a14"/><text x="710" y="112" fill="#8e979d" font-size="10" font-family="IBM Plex Sans, sans-serif">U₂</text><text id="tU2" x="840" y="142" fill="#ff5a3c" font-size="22" text-anchor="end">0,0 V</text>
  <rect x="700" y="470" width="150" height="56" rx="6" fill="#160807" stroke="#3a1a14"/><text x="710" y="486" fill="#8e979d" font-size="10" font-family="IBM Plex Sans, sans-serif">I₂</text><text id="tI2" x="840" y="516" fill="#ff5a3c" font-size="22" text-anchor="end">0 mA</text>
</g>
<!-- Sekundärkreis und Verbraucher -->
<path d="M688 280 H820 V230 M688 380 H820 V430" stroke="#1f4fb8" stroke-width="2.4" fill="none"/>
<g id="tLoad"></g>
<text id="tLoadT" x="880" y="420" fill="#8e979d" font-size="11" text-anchor="middle"></text>
<!-- Zeitverläufe (Modell) -->
<g id="tPlotG" opacity="0">
  <rect x="40" y="540" width="920" height="74" rx="6" fill="rgba(10,12,14,.9)" stroke="#5a4b8a"/>
  <line x1="60" y1="577" x2="940" y2="577" stroke="#2a3036"/>
  <path id="tPU1" fill="none" stroke="#ff8a7a" stroke-width="1.8"/><path id="tPPhi" fill="none" stroke="#86dcff" stroke-width="1.8"/><path id="tPU2" fill="none" stroke="#7fd6a0" stroke-width="1.8" stroke-dasharray="5 3"/>
  <text x="60" y="556" fill="#ff8a7a" font-size="11">U₁(t)</text><text x="104" y="556" fill="#86dcff" font-size="11">Φ(t)</text><text x="142" y="556" fill="#7fd6a0" font-size="11">U₂(t)</text>
  <text id="tUN" x="940" y="556" fill="#ece6dc" font-size="12" text-anchor="end" font-family="IBM Plex Mono, monospace"></text>
</g>
<text id="tWarn" x="500" y="60" fill="#ffb347" font-size="13" text-anchor="middle"></text>
</svg>`;

export default {
  intro: 'Zwei Spulen sitzen auf einem gemeinsamen Eisenkern. Eine Wechselspannung an der ersten Spule erzeugt in der zweiten eine Spannung, ohne dass die Spulen elektrisch verbunden sind. Das Verhältnis der Spannungen folgt dem Verhältnis der Windungszahlen. Mit wenigen Windungen fließt auf der zweiten Seite ein so großer Strom, dass ein Nagel glüht und schmilzt.',
  docs: {
    durchfuehrung: `
<h3>Aufbau</h3>
<p>Ein lamellierter U-Kern aus Eisen trägt zwei Spulen. Ein Joch schließt den Kern oben. Die Primärspule (N₁) liegt an einem Wechselspannungs-Netzgerät (50 Hz), die Sekundärspule (N₂) an einem Verbraucher. Zwei Multimeter messen jeweils Spannung und Stromstärke (Effektivwerte).</p>
<h3>Durchführung</h3>
<ol>
<li><b>Unbelastet:</b> Verbraucher „offen“. U₁ einstellen und U₂ für verschiedene Kombinationen von N₁ und N₂ messen.</li>
<li><b>Belastet:</b> Widerstand 1 Ω oder 10 Ω anschließen und I₁ und I₂ messen.</li>
<li>Joch abnehmen und den Versuch wiederholen. Was ändert sich?</li>
<li><b>Hochstrom (Lehrerversuch):</b> Sekundärspule mit 6 Windungen, Eisennagel als Verbraucher, Netzspannung 230 V an N₁ = 500.</li>
</ol>
<div class="callout">Sicherheit: 230 V nur als Lehrerversuch mit geschlossenem, berührsicherem Aufbau. Der schmelzende Nagel spritzt: Schutzscheibe und feuerfeste Unterlage.</div>`,
    theorie: `
<h3>Induktion im gemeinsamen Kern</h3>
<p>Der Wechselstrom in der Primärspule erzeugt im Eisen einen magnetischen Fluss Φ, der sich ständig ändert. Der Kern führt diesen Fluss auch durch die Sekundärspule. In jeder Windung beider Spulen wird dieselbe Spannung induziert:</p>
<span class="formula">U<sub>ind</sub> = −N · dΦ/dt    ⇒    U₁ / N₁ = U₂ / N₂</span>
<span class="formula">unbelastet:  U₂ / U₁ = N₂ / N₁</span>
<h3>Stromübersetzung</h3>
<p>Fließt sekundär ein großer Strom, muss der Primärkreis die Leistung liefern. Beim idealen Transformator gilt P₁ = P₂, also U₁·I₁ = U₂·I₂:</p>
<span class="formula">belastet (ideal):  I₁ / I₂ = N₂ / N₁</span>
<h3>Leerlaufstrom</h3>
<p>Auch ohne Verbraucher fließt primär ein kleiner Strom. Er baut das Magnetfeld im Kern auf. Weil die Spule einen großen induktiven Widerstand X = ω·L hat, bleibt er klein.</p>
<h3>Ohne Joch</h3>
<p>Ohne Joch ist der Eisenkreis offen. Ein großer Teil der Feldlinien schließt sich durch die Luft und erreicht die Sekundärspule nicht (Streufluss). Die Induktivität sinkt stark: Der Leerlaufstrom steigt, U₂ wird deutlich kleiner als N₂/N₁·U₁.</p>
<h3>Hochstrom</h3>
<p>Mit N₁ = 500 an 230 V und N₂ = 6 entstehen nur etwa 2,8 V. Der Nagel hat aber nur wenige Milliohm. Es fließen mehrere Hundert Ampere, und die Leistung I²·R bringt ihn in Sekunden zum Glühen und Schmelzen.</p>
<h3>Modellgrenzen</h3>
<ul><li>Gerechnet wird mit Wicklungswiderständen, Hauptinduktivität und Kopplungsgrad. Eisenverluste und Sättigung fehlen.</li><li>Die Lampe ist als fester Widerstand von 12 Ω gerechnet.</li></ul>
<h3>Was die Modellansicht zeigt</h3><ul><li>Den magnetischen Fluss im Kern: Die Striche laufen im Takt der Wechselspannung hin und her, ihre Helligkeit folgt |Φ|.</li><li>Ohne Joch die Streufeldlinien durch die Luft.</li><li>Unten die Zeitverläufe U₁(t), Φ(t) und U₂(t). Die Spannung ist groß, wo sich Φ am schnellsten ändert. Rechts U/N für beide Spulen.</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Kern</td><td>U-Kern mit Joch, lamelliert, A<sub>L</sub> ≈ 15 µH (ohne Joch ≈ 0,7 µH)</td></tr>
<tr><td>Spulen</td><td>250 · 500 · 1000 Windungen, Hochstromspule 6 Windungen</td></tr>
<tr><td>Netzgerät</td><td>0 … 24 V~ (50 Hz); Netzspannung 230 V nur als Lehrerversuch</td></tr>
<tr><td>Verbraucher</td><td>Lampe 6 V/3 W, Widerstände 100 Ω, 10 Ω, 1 Ω, Eisennagel in Schmelzrinne</td></tr>
</tbody></table>`,
    abi: `
<details class="q"><summary>N₁ = 500, N₂ = 1000, U₁ = 6 V. Berechne U₂ (ideal, unbelastet). <span class="op">AFB I</span></summary><p>U₂ = U₁·N₂/N₁ = 6 V · 2 = 12 V.</p></details>
<details class="q"><summary>Ein idealer Transformator (N₁ = 1000, N₂ = 250) liefert sekundär 2,0 A. Berechne I₁. <span class="op">AFB I</span></summary><p>I₁ = I₂·N₂/N₁ = 2,0 A · 0,25 = 0,5 A.</p></details>
<details class="q"><summary>Begründe, warum ein Transformator mit Gleichspannung nicht funktioniert. <span class="op">AFB II</span></summary><p>Gleichstrom erzeugt einen konstanten Fluss. Ohne Änderung des Flusses wird keine Spannung induziert. Außerdem begrenzt dann nur der kleine ohmsche Widerstand der Primärspule den Strom; sie würde heiß.</p></details>
<details class="q"><summary>Erkläre, warum U₂ ohne Joch viel kleiner ist. <span class="op">AFB II</span></summary><p>Ohne geschlossenen Eisenkreis schließen sich viele Feldlinien durch die Luft, bevor sie die Sekundärspule erreichen. Durch die Sekundärspule geht nur ein Teil des Flusses, also wird dort weniger Spannung induziert.</p></details>
<details class="q"><summary>Warum glüht der Nagel, obwohl U₂ nur wenige Volt beträgt? <span class="op">AFB III</span></summary><p>Entscheidend ist die Leistung P = U²/R. Unter Last sinkt U₂ auf etwa 1,5 V, weil auch die Wicklungen Widerstand haben. Mit R ≈ 4 mΩ fließen fast 400 A, die Leistung im Nagel ist P = I²·R ≈ 600 W. Der Primärkreis liefert sie bei kleinem Strom: I₁ ≈ I₂·6/500 ≈ 5 A.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, selectBox, segmented, check, button, fmt, dataTable, toast, display } = ui;
    const S = { U: 6, mains: false, on: true, N1: 500, N2: 250, yoke: true, load: LOADS[0], t: 0, T: 20, melted: false, ver: 0 };
    const U1 = () => S.on ? (S.mains ? 230 : S.U) : 0;
    const res = () => solve(U1(), S.N1, S.N2, S.yoke, S.load.R);

    const gP = group('Primärseite', { led: true }); gP.led(true);
    const cOn = check({ label: 'Netzgerät eingeschaltet', checked: true, onChange: v => { S.on = v; gP.led(v); } });
    const sU = slider({ label: 'Spannung U₁ (Effektivwert)', min: 0, max: 24, step: 0.1, value: S.U, unit: 'V', digits: 1, onInput: v => { S.U = v; } });
    const cM = check({ label: 'Netzspannung 230 V (Lehrerversuch)', checked: false, onChange: v => { if (v && S.N1 < 500) { toast('230 V nur an N₁ = 500 oder 1000 Windungen.'); cM.set(false); return; } S.mains = v; } });
    const segN1 = segmented({ value: 500, options: N1S.map(n => ({ value: n, label: `${n}` })), onChange: v => { if (S.mains && v < 500) { S.mains = false; cM.set(false); } S.N1 = v; S.ver++; } });
    gP.append(cOn, sU, cM, el('div', { class: 'ctl' }, el('label', { style: 'grid-column:1/-1' }, 'Windungszahl N₁'), el('div', { style: 'grid-column:1/-1' }, segN1)));
    const gS = group('Sekundärseite');
    const segN2 = segmented({ value: 250, options: N2S.map(n => ({ value: n, label: n === 6 ? '6 (Hochstrom)' : `${n}` })), onChange: v => { S.N2 = v; S.ver++; } });
    const sL = selectBox({ label: 'Verbraucher', value: 'open', options: LOADS.map(l => ({ value: l.id, label: l.name })), onChange: v => { S.load = LOADS.find(l => l.id === v); S.ver++; } });
    const cY = check({ label: 'Joch aufgelegt', checked: true, onChange: v => { S.yoke = v; S.ver++; } });
    gS.append(el('div', { class: 'ctl' }, el('label', { style: 'grid-column:1/-1' }, 'Windungszahl N₂'), el('div', { style: 'grid-column:1/-1' }, segN2)), sL, cY,
      el('div', { class: 'bar' }, button('Neuen Nagel einlegen', () => { S.T = 20; S.melted = false; S.ver++; })));
    const gM = group('Messung');
    const dR = display('U₂/U₁ · N₁/N₂'), dRI = display('I₁/I₂ · N₁/N₂');
    gM.append(dR, dRI, el('div', { class: 'bar' }, button('Messwerte übernehmen', () => take(), 'btn small primary')));
    controls.append(gP, gS, gM);

    const rows = [];
    const tbl = dataTable([
      { key: 'N1', label: 'N₁', digits: 0 }, { key: 'N2', label: 'N₂', digits: 0 }, { key: 'yoke', label: 'Joch', fmt: v => v ? 'ja' : 'nein' }, { key: 'load', label: 'Verbraucher', fmt: v => v },
      { key: 'U1', label: 'U₁ in V', digits: 2 }, { key: 'I1', label: 'I₁ in A', digits: 3 }, { key: 'U2', label: 'U₂ in V', digits: 3 }, { key: 'I2', label: 'I₂ in A', digits: 3 }
    ], { onDelete: i => { rows.splice(i, 1); redraw(); } });
    const figU = el('div', { class: 'fig' }), figI = el('div', { class: 'fig' });
    const chU = new Chart(figU, { xlabel: 'N₂/N₁', ylabel: 'U₂/U₁' }), chI = new Chart(figI, { xlabel: 'N₂/N₁', ylabel: 'I₁/I₂' });
    const resU = el('div', { class: 'result' }), resI = el('div', { class: 'result' });
    messwerte.append(
      el('div', { class: 'data' },
        el('div', { class: 'chartbox' }, el('h4', {}, 'Spannungsübersetzung (unbelastet)'), figU, resU,
          csvTools(() => ({ meta: ['Transformator, 50 Hz'], columns: [{ key: 'N1', label: 'N1' }, { key: 'N2', label: 'N2' }, { key: 'yoke', label: 'Joch' }, { key: 'load', label: 'Verbraucher' }, { key: 'U1', label: 'U1 in V' }, { key: 'I1', label: 'I1 in A' }, { key: 'U2', label: 'U2 in V' }, { key: 'I2', label: 'I2 in A' }], rows }), 'transformator_messreihe')),
        el('div', { class: 'chartbox' }, el('h4', {}, 'Stromübersetzung (belastet mit 1 Ω oder 10 Ω)'), figI, resI)),
      el('div', { style: 'height:14px' }), tbl);
    function redraw() {
      tbl.render(rows);
      const fitSet = (pts, col) => { const f = pts.length >= 2 ? fit.propFit(pts.map(p => p[0]), pts.map(p => p[1])) : null; return f; };
      const uY = rows.filter(r => r.load === 'offen' && r.yoke && r.U1 > 0).map(r => [r.N2 / r.N1, r.U2 / r.U1]);
      const uN = rows.filter(r => r.load === 'offen' && !r.yoke && r.U1 > 0).map(r => [r.N2 / r.N1, r.U2 / r.U1]);
      const fU = fitSet(uY), fUn = fitSet(uN);
      chU.set([{ name: 'mit Joch', color: '#86dcff', mode: 'dot', points: uY }, { name: 'ohne Joch', color: '#f2ac74', mode: 'dot', points: uN }], [{ f: x => x, color: '#4a545c' }, ...(fU ? [{ f: fU.f, color: '#86dcff' }] : []), ...(fUn ? [{ f: fUn.f, color: '#f2ac74' }] : [])]);
      resU.innerHTML = fU ? `<div><span>Steigung mit Joch (ideal 1)</span><br><b>${fmt(fU.a, 3)}</b>${fUn ? ` <span>· ohne Joch ${fmt(fUn.a, 3)}</span>` : ''}</div>` : '<span>Grau: ideal U₂/U₁ = N₂/N₁. Messungen mit Verbraucher „offen“.</span>';
      const iY = rows.filter(r => (r.load === 'Widerstand 1 Ω' || r.load === 'Widerstand 10 Ω') && r.I2 > 0.001).map(r => [r.N2 / r.N1, r.I1 / r.I2]);
      const fI = fitSet(iY);
      chI.set([{ color: '#7fd6a0', mode: 'dot', points: iY }], [{ f: x => x, color: '#4a545c' }, ...(fI ? [{ f: fI.f, color: '#7fd6a0' }] : [])]);
      resI.innerHTML = fI ? `<div><span>Steigung (ideal 1)</span><br><b>${fmt(fI.a, 3)}</b></div>` : '<span>Grau: ideal I₁/I₂ = N₂/N₁.</span>';
    }
    redraw();
    const meas = () => { const r = res(); return { U1: U1(), I1: cAbs(r.I1), U2: S.load.id === 'nail' && S.melted ? cAbs(r.U2) * 0 + U1() * S.N2 / S.N1 : cAbs(r.U2), I2: S.melted && S.load.id === 'nail' ? 0 : cAbs(r.I2) }; };
    function take() {
      if (!S.on) { toast('Das Netzgerät ist aus.'); return; }
      const m = meas(); rows.push({ N1: S.N1, N2: S.N2, yoke: S.yoke, load: S.load.name.replace(' (kein Verbraucher)', '').replace(' (Hochstrom)', ''), ...m }); redraw();
      toast(`Übernommen: U₂ = ${fmt(m.U2, 2)} V, I₂ = ${fmt(m.I2, 3)} A`);
    }
    const fA = v => v >= 10 ? `${fmt(v, 0)} A` : v >= 1 ? `${fmt(v, 2)} A` : `${fmt(v * 1000, 0)} mA`;
    const fV = v => v >= 100 ? `${fmt(v, 0)} V` : v >= 10 ? `${fmt(v, 1)} V` : `${fmt(v, 2)} V`;
    const nailCol = T => T < 500 ? '#6a6f74' : T < 800 ? '#8a2a14' : T < 1000 ? '#d0451c' : T < 1200 ? '#ff7a2a' : '#ffd27a';

    // ======================= Ansicht 2D =======================
    async function view2d(box, MM) {
      box.insertAdjacentHTML('beforeend', svgMarkup());
      const svg = box.querySelector('svg'), q = id => svg.querySelector('#' + id);
      let raf = 0, ver = -1, dash = 0, last = performance.now();
      function drawLoad() {
        const id = S.load.id; let h = '';
        if (id === 'open') h = '<circle cx="820" cy="230" r="4" fill="#1f4fb8"/><circle cx="820" cy="430" r="4" fill="#1f4fb8"/>';
        else if (id === 'lamp') h = '<path d="M820 230 H880 V300 M820 430 H880 V360" stroke="#1f4fb8" stroke-width="2.4" fill="none"/><circle id="tLampGl" cx="880" cy="330" r="60" fill="url(#tLampG)" opacity="0"/><circle cx="880" cy="330" r="22" fill="#e9e3d6" fill-opacity=".2" stroke="#c9c3ba"/>';
        else if (id === 'nail') h = `<path d="M820 230 H880 V290 M820 430 H880 V370" stroke="#b8692f" stroke-width="8" fill="none"/><rect id="tNail" x="874" y="290" width="12" height="80" rx="3" fill="#6a6f74"/>`;
        else h = '<path d="M820 230 H880 V290 M820 430 H880 V370" stroke="#1f4fb8" stroke-width="2.4" fill="none"/><rect x="866" y="290" width="28" height="80" rx="4" fill="#d9c48a" stroke="#7a6a3a"/>';
        q('tLoad').innerHTML = h; q('tLoadT').textContent = S.load.name;
      }
      function frame(now) {
        raf = requestAnimationFrame(frame);
        const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
        const model = MM.model, r = res(), m = meas();
        if (ver !== S.ver) { ver = S.ver; drawLoad(); q('tN1').textContent = `N₁ = ${S.N1}`; q('tN2').textContent = `N₂ = ${S.N2}`; q('tC2').setAttribute('height', S.N2 === 6 ? 60 : 160); q('tC2').setAttribute('y', S.N2 === 6 ? 300 : 250); }
        q('tYoke').setAttribute('transform', S.yoke ? '' : 'translate(0 -80)'); q('tYoke').setAttribute('opacity', S.yoke ? 1 : 0.35); q('tYokeT').setAttribute('y', S.yoke ? 176 : 96);
        q('tU1').textContent = fV(m.U1); q('tI1').textContent = fA(m.I1); q('tU2').textContent = fV(m.U2); q('tI2').textContent = fA(m.I2);
        const lg = q('tLampGl'); if (lg) lg.setAttribute('opacity', Math.min(1, m.I2 * m.I2 * 12 / 3).toFixed(2));
        const nl = q('tNail'); if (nl) { nl.setAttribute('fill', S.melted ? '#2a2c2e' : nailCol(S.T)); nl.setAttribute('filter', S.T > 700 && !S.melted ? 'url(#tGl)' : ''); nl.setAttribute('height', S.melted ? 30 : 80); }
        q('tWarn').textContent = S.melted && S.load.id === 'nail' ? 'Der Nagel ist durchgeschmolzen. Stromkreis unterbrochen.' : S.mains ? 'Netzspannung 230 V: Lehrerversuch' : '';
        q('tFluxG').setAttribute('opacity', model ? 1 : 0); q('tPlotG').setAttribute('opacity', model ? 1 : 0);
        if (model) {
          const ph = W * S.t, phiA = cAbs(r.Phi) * Math.SQRT2, phiNow = phiA * Math.cos(ph + cArg(r.Phi)), phiMax = (U1() / (W * S.N1)) * Math.SQRT2 || 1e-9;
          dash += phiNow / phiMax * dt * 60; q('tFlux').setAttribute('stroke-dashoffset', (-dash).toFixed(1));
          q('tFlux').setAttribute('opacity', (0.25 + 0.75 * Math.abs(phiNow) / phiMax * (S.yoke ? 1 : 0.6)).toFixed(2));
          q('tLeak').setAttribute('opacity', S.yoke ? 0 : (0.2 + 0.8 * Math.abs(phiNow) / phiMax).toFixed(2)); q('tLeak').setAttribute('stroke-dashoffset', (-dash * 0.7).toFixed(1));
          // Zeitverläufe über zwei Perioden, Markierung bei der aktuellen Phase
          const u1A = U1() * Math.SQRT2 || 1, u2A = cAbs(r.U2) * Math.SQRT2, sc = 30;
          let a = '', b = '', c = ''; for (let i = 0; i <= 200; i++) { const x = 60 + i * 4.4, p = i / 100 * 2 * Math.PI; a += `${i ? 'L' : 'M'}${x.toFixed(1)} ${(577 - Math.cos(p) * sc).toFixed(1)}`; b += `${i ? 'L' : 'M'}${x.toFixed(1)} ${(577 - (phiA / phiMax) * Math.cos(p + cArg(r.Phi)) * sc * 0.9).toFixed(1)}`; c += `${i ? 'L' : 'M'}${x.toFixed(1)} ${(577 - (u2A / (u1A * Math.max(1, S.N2 / S.N1))) * Math.cos(p + cArg(r.U2)) * sc).toFixed(1)}`; }
          q('tPU1').setAttribute('d', a); q('tPPhi').setAttribute('d', b); q('tPU2').setAttribute('d', c);
          q('tUN').textContent = `U₁/N₁ = ${fmt(m.U1 / S.N1 * 1000, 2)} mV   U₂/N₂ = ${fmt(m.U2 / S.N2 * 1000, 2)} mV`;
        }
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); } };
    }

    // ======================= Ansicht 3D =======================
    async function view3d(box, MM) {
      const { createLab, mats, cable, powerSupply, makeDisplay, label, glowPool } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [0.05, 0.36, 0.7], target: [0.03, 0.1, 0], table: [1.8, 1.2], bloom: [0.8, 0.45, 0.85], room: 0.5, minDist: 0.15, maxDist: 2.4, fov: 36 });
      const { THREE, scene } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad</div>');
      const lamTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#5c6268'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#464c52'; for (let i = 0; i < 64; i += 4) g.fillRect(0, i, 64, 1); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); return t; })();
      const iron = new THREE.MeshStandardMaterial({ map: lamTex, metalness: 0.7, roughness: 0.45 });
      const cuTex = (() => { const c = document.createElement('canvas'); c.width = 32; c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#b8692f'; g.fillRect(0, 0, 32, 128); g.fillStyle = '#7a3e16'; for (let i = 0; i < 128; i += 4) g.fillRect(0, i, 32, 1.2); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 6); t.colorSpace = THREE.SRGBColorSpace; return t; })();
      const cu = new THREE.MeshStandardMaterial({ map: cuTex, metalness: 0.8, roughness: 0.35 });
      const bx = (w, h, d, x, y, z, m = iron) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; scene.add(o); return o; };
      const legH = 0.12, CW = 0.04;
      bx(0.2, CW, CW, 0, CW / 2, 0); bx(CW, legH, CW, -0.08, CW + legH / 2, 0); bx(CW, legH, CW, 0.08, CW + legH / 2, 0);
      const yoke = bx(0.2, CW, CW, 0, CW + legH + CW / 2, 0);
      const coil1 = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.09, 32), cu); coil1.position.set(-0.08, CW + legH / 2, 0); coil1.castShadow = true; scene.add(coil1);
      const coil2 = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.09, 32), cu); coil2.position.set(0.08, CW + legH / 2, 0); coil2.castShadow = true; scene.add(coil2);
      const hiC = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.007, 12, 32), M.copper); hiC.rotation.x = Math.PI / 2; hiC.position.set(0.08, CW + legH / 2, 0); scene.add(hiC);
      let l1 = null, l2 = null;
      const psu = powerSupply(THREE, { w: 0.24, h: 0.12, d: 0.18, label: 'Netzgerät ~ 0 … 24 V', displays: 1, knobs: 2, sockets: ['red', 'black'] }); psu.position.set(-0.36, 0, -0.08); psu.rotation.y = 0.45; scene.add(psu);
      const meter = x => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.15, 0.03), new THREE.MeshStandardMaterial({ color: 0xd8b21c, roughness: 0.5 })); b.position.y = 0.075; g.add(b); const d1 = makeDisplay(THREE, 256, 96), d2 = makeDisplay(THREE, 256, 96); const m1 = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.028), new THREE.MeshBasicMaterial({ map: d1.tex, toneMapped: false })); m1.position.set(0, 0.12, 0.0155); const m2 = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.028), new THREE.MeshBasicMaterial({ map: d2.tex, toneMapped: false })); m2.position.set(0, 0.085, 0.0155); g.add(m1, m2); g.position.set(x, 0, 0.02); g.rotation.y = -Math.sign(x) * 0.5; scene.add(g); return [d1, d2]; };
      const [dU1, dI1] = meter(-0.2), [dU2, dI2] = meter(0.3);
      scene.updateMatrixWorld(true);
      scene.add(cable(THREE, psu.socketWorld(0), new THREE.Vector3(-0.1, 0.06, 0.035), 0xc4231b, 0.03), cable(THREE, psu.socketWorld(1), new THREE.Vector3(-0.06, 0.06, 0.035), 0x151515, 0.03));
      // Verbraucher
      const loadG = new THREE.Group(); loadG.position.set(0.18, 0, 0.12); scene.add(loadG);
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0x555048, toneMapped: false }), nailMat = new THREE.MeshStandardMaterial({ color: 0x7a7f84, metalness: 0.8, roughness: 0.4, emissive: 0x000000 });
      const bulbLight = new THREE.PointLight(0xffb060, 0, 0.6, 2); bulbLight.position.set(0, 0.06, 0); loadG.add(bulbLight);
      function buildLoad() {
        for (let i = loadG.children.length - 1; i >= 0; i--) if (loadG.children[i] !== bulbLight) loadG.remove(loadG.children[i]);
        const id = S.load.id;
        if (id === 'lamp') { const b = new THREE.Mesh(new THREE.SphereGeometry(0.016, 24, 16), bulbMat); b.position.y = 0.05; const s = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.03, 16), M.steel); s.position.y = 0.025; loadG.add(b, s); }
        else if (id === 'nail') { for (const z of [-0.035, 0.035]) { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.012), M.copper); bar.position.set(0, 0.025, z); loadG.add(bar); } if (!S.melted) { const n = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.08, 12), nailMat); n.rotation.x = Math.PI / 2; n.position.y = 0.04; loadG.add(n); } const tray = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.008, 0.1), new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.9 })); tray.position.y = 0.004; loadG.add(tray); }
        else if (id !== 'open') { const r = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.08), new THREE.MeshStandardMaterial({ color: 0xd9c48a, roughness: 0.6 })); r.position.y = 0.015; loadG.add(r); }
        coil2.visible = S.N2 !== 6; hiC.visible = S.N2 === 6;
        if (l1) scene.remove(l1); if (l2) scene.remove(l2);
        l1 = label(THREE, `N₁ = ${S.N1}`, { color: '#ece6dc', size: 0.012 }); l1.position.set(-0.08, 0.2, 0.04); l2 = label(THREE, `N₂ = ${S.N2}`, { color: '#ece6dc', size: 0.012 }); l2.position.set(0.08, 0.2, 0.04); scene.add(l1, l2);
      }
      // Modell: Fluss als Leuchtpunkte entlang des Kernwegs
      const fPool = glowPool(THREE, scene, 40, 0x86dcff, 0.012); let fPhase = 0;
      const loopPt = u => { const x0 = -0.08, x1 = 0.08, y0 = CW / 2, y1 = CW + legH + CW / 2, per = 2 * (x1 - x0) + 2 * (y1 - y0); let s = u * per; if (s < y1 - y0) return [x1, y0 + s]; s -= y1 - y0; if (s < x1 - x0) return [x1 - s, y1]; s -= x1 - x0; if (s < y1 - y0) return [x0, y1 - s]; s -= y1 - y0; return [x0 + s, y0]; };
      let ver = -1, yokeY = yoke.position.y;
      const off = lab.onFrame((dt) => {
        const model = MM.model, r = res(), m = meas();
        if (ver !== S.ver) { ver = S.ver; buildLoad(); }
        const target = S.yoke ? CW + legH + CW / 2 : CW + legH + CW / 2 + 0.07; yokeY += (target - yokeY) * Math.min(1, dt * 6); yoke.position.y = yokeY; yoke.position.z = S.yoke ? 0 : Math.min(0.08, (yokeY - (CW + legH + CW / 2)) * 1.2);
        psu.displays[0].draw(m.U1.toFixed(m.U1 >= 100 ? 0 : 1), 'V~'); psu.setKnob(0, S.U / 24);
        dU1.draw(m.U1 >= 100 ? m.U1.toFixed(0) : m.U1.toFixed(2), 'V'); dI1.draw(m.I1 >= 10 ? m.I1.toFixed(1) : m.I1.toFixed(3), 'A'); dU2.draw(m.U2 >= 100 ? m.U2.toFixed(0) : m.U2.toFixed(2), 'V'); dI2.draw(m.I2 >= 10 ? m.I2.toFixed(0) : m.I2.toFixed(3), 'A');
        const P = m.I2 * m.I2 * 12;
        if (S.load.id === 'lamp') { const k = Math.min(1, P / 3); bulbMat.color.setRGB(0.33 + 1.4 * k, 0.31 + 1.0 * k, 0.28 + 0.4 * k); bulbLight.intensity = 0.3 * k; }
        else if (S.load.id === 'nail' && !S.melted) { const c = new THREE.Color(nailCol(S.T)); nailMat.emissive.copy(S.T > 500 ? c : new THREE.Color(0)); nailMat.emissiveIntensity = S.T > 500 ? Math.min(3, (S.T - 450) / 250) : 0; bulbLight.color.set(0xff7a2a); bulbLight.intensity = S.T > 700 ? Math.min(0.5, (S.T - 700) / 1000) : 0; }
        else bulbLight.intensity = 0;
        if (S.load.id === 'nail' && S.melted && loadG.children.some(o => o.material === nailMat)) buildLoad();
        const phiMax = (U1() / (W * S.N1)) * Math.SQRT2 || 1e-9, phiNow = cAbs(r.Phi) * Math.SQRT2 * Math.cos(W * S.t + cArg(r.Phi));
        fPhase += dt * 0.6 * phiNow / phiMax;
        fPool.items.forEach((s, i) => { s.visible = model && U1() > 0; if (!s.visible) return; const [x, y] = loopPt((((i / fPool.items.length) + fPhase) % 1 + 1) % 1); s.position.set(x, y, 0.024); s.material.opacity = 0.25 + 0.75 * Math.abs(phiNow) / phiMax * (S.yoke ? 1 : 0.5); });
      });
      return { destroy() { off(); lab.dispose(); } };
    }

    const host = viewHost(stage, { id: 'transformator', views: { '3d': view3d, '2d': view2d }, initial: '3d', modelInfo: 'magnetischer Fluss, Streufeld, Zeitverläufe' });

    let raf = 0, last = performance.now(), slow = 0;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      S.t += dt * 0.02;                                                  // 50 Hz stark verlangsamt für die Anzeige
      if (S.load.id === 'nail' && !S.melted) { const I = cAbs(res().I2); S.T += (I * I * 0.004 - 4 * (S.T - 20) / 100 * 1.5) / 2.3 * dt; if (S.T > 1500) { S.melted = true; toast('Der Nagel ist durchgeschmolzen.', 4000); } }
      else if (S.load.id !== 'nail') S.T = 20;
      slow += dt; if (slow > 0.2) { slow = 0; const m = meas(); dR.set(m.U1 > 0 ? fmt(m.U2 / m.U1 * S.N1 / S.N2, 3) : '–'); dRI.set(m.I2 > 1e-4 ? fmt(m.I1 / m.I2 * S.N1 / S.N2, 3) : '–'); }
    }
    raf = requestAnimationFrame(loop);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); chU.destroy(); chI.destroy(); } };
  }
};
