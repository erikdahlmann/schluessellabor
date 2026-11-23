// ============================================================================
//  Schlüsselexperiment: Doppelspalt – Wellenlängenbestimmung mit Laserlicht
//  2D-Aufbau (SVG): optische Bank (Seitenansicht) und Blick auf den Schirm.
//  Intensität: I(α) = cos²(π·g·sinα/λ) · sinc²(π·b·sinα/λ),  sinα = x/√(x²+a²)
//  Gemessen wird mit zwei verschiebbaren Markern auf dem Schirm (wie mit dem Lineal).
// ============================================================================
import { viewHost } from '../js/lib/views.js';
const LASERS = [
  { id: 'rot', name: 'Diodenlaser rot', lam: 635e-9 },
  { id: 'gruen', name: 'Diodenlaser grün', lam: 532e-9 },
  { id: 'violett', name: 'Diodenlaser blau-violett', lam: 405e-9 },
  { id: 'x', name: 'Laser X (unbekannt)', lam: (560 + Math.round(Math.random() * 110)) * 1e-9 }
];
const SLITS = [0.10e-3, 0.20e-3, 0.30e-3, 0.50e-3];   // Spaltmittenabstand g
const B_SLIT = 0.05e-3;                              // Spaltbreite b
const G_TOL = new Map(SLITS.map(g => [g, 1 + (Math.random() * 0.03 - 0.015)])); // Fertigung ±1,5 %
const NBAR = 440, X0 = 60, X1 = 940;                 // Schirm-Raster im SVG

// Wellenlänge → sRGB (Näherung nach Bruton)
function lamRGB(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = -(nm - 440) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; } else r = 1;
  const f = nm < 420 ? 0.35 + 0.65 * (nm - 380) / 40 : nm > 700 ? 0.35 + 0.65 * (780 - nm) / 80 : 1;
  return [r, g, b].map(c => Math.round(255 * Math.pow(Math.max(0, c) * f, 0.8)));
}
const sinc = u => Math.abs(u) < 1e-9 ? 1 : Math.sin(u) / u;

const svgMarkup = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Optische Bank mit Laser, Doppelspalt und Schirm; darunter das Interferenzmuster auf dem Schirm mit Maßstab und zwei Messmarkern">
<defs>
  <linearGradient id="dBench" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2024"/><stop offset="1" stop-color="#121518"/></linearGradient>
  <linearGradient id="dRail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9afb4"/><stop offset=".5" stop-color="#6c7378"/><stop offset="1" stop-color="#3d4347"/></linearGradient>
  <linearGradient id="dV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset=".3" stop-color="#666"/><stop offset=".5" stop-color="#fff"/><stop offset=".7" stop-color="#666"/><stop offset="1" stop-color="#000"/></linearGradient>
  <mask id="dMask" maskUnits="userSpaceOnUse" x="40" y="300" width="920" height="140"><rect x="40" y="300" width="920" height="140" fill="url(#dV)"/></mask>
  <filter id="dGlow"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="dBlur"><feGaussianBlur stdDeviation="1.1"/></filter>
  <filter id="dSh" x="-10%" y="-10%" width="130%" height="150%"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#000" flood-opacity=".55"/></filter>
</defs>
<rect width="1000" height="620" fill="url(#dBench)"/>
<text x="40" y="34" fill="#8e979d" font-size="13">Optische Bank (Seitenansicht, Abstände nicht maßstäblich)</text>
<!-- Schiene -->
<rect x="40" y="178" width="920" height="16" rx="3" fill="url(#dRail)" filter="url(#dSh)"/>
<g fill="#2a2f33"><rect x="60" y="194" width="14" height="26"/><rect x="926" y="194" width="14" height="26"/></g>
<!-- Laser -->
<g filter="url(#dSh)">
  <rect x="70" y="118" width="130" height="34" rx="6" fill="#2b3034" stroke="#454c52"/>
  <rect x="196" y="126" width="14" height="18" rx="2" fill="#5b6268"/>
  <rect x="112" y="152" width="20" height="28" fill="#3a4045"/><rect x="96" y="172" width="52" height="8" rx="2" fill="#4a5056"/>
</g>
<circle id="dLaserLed" cx="86" cy="135" r="4" fill="#3a1010"/>
<text x="136" y="140" fill="#c9c3ba" font-size="11" text-anchor="middle" id="dLaserName">Laser</text>
<text x="136" y="112" fill="#ffb347" font-size="10" text-anchor="middle">⚠ Laser Klasse 2</text>
<!-- Doppelspalt -->
<g filter="url(#dSh)">
  <rect x="300" y="106" width="22" height="56" rx="3" fill="#30363b" stroke="#4b5257"/>
  <rect x="306" y="120" width="10" height="28" fill="#0b0d0e"/>
  <rect x="301" y="162" width="20" height="18" fill="#3a4045"/><rect x="286" y="172" width="50" height="8" rx="2" fill="#4a5056"/>
</g>
<text x="311" y="98" fill="#c9c3ba" font-size="11" text-anchor="middle">Doppelspalt</text>
<text id="dSlitLbl" x="311" y="230" fill="#8e979d" font-size="11" text-anchor="middle">g = 0,20 mm</text>
<!-- Schirm -->
<g id="dScreenG" filter="url(#dSh)">
  <rect x="-8" y="60" width="16" height="112" rx="2" fill="#d9d6cf" stroke="#9c9a94"/>
  <rect x="-7" y="172" width="14" height="8" fill="#3a4045"/><rect x="-25" y="172" width="50" height="8" rx="2" fill="#4a5056"/>
</g>
<text id="dScreenLbl" x="0" y="50" fill="#c9c3ba" font-size="11" text-anchor="middle">Schirm</text>
<!-- Strahl -->
<g id="dBeam" opacity="0">
  <line x1="210" y1="135" x2="306" y2="135" stroke-width="2.4" filter="url(#dGlow)" id="dBeamIn"/>
  <path id="dFan" opacity=".22"/>
  <g id="dRays" stroke-width="1.2" opacity=".75" filter="url(#dGlow)"></g>
</g>
<!-- Abstand a -->
<g id="dDim" stroke="#8e979d" stroke-width="1.2" fill="#8e979d">
  <line id="dDimL" x1="311" y1="250" x2="700" y2="250"/>
  <path id="dDimA" d=""/>
</g>
<text id="dDimT" x="500" y="244" fill="#ece6dc" font-size="14" text-anchor="middle" font-family="IBM Plex Mono, monospace">a = 2,00 m</text>

<!-- Modell: Wellenbild in Draufsicht -->
<g id="dWaveG" opacity="0">
  <rect x="34" y="40" width="932" height="236" rx="8" fill="#0a0c0e" stroke="#5a4b8a"/>
  <foreignObject x="40" y="46" width="920" height="224"><canvas xmlns="http://www.w3.org/1999/xhtml" id="dWaveCv" width="460" height="112" style="width:100%;height:100%;display:block;image-rendering:auto"></canvas></foreignObject>
  <text x="50" y="66" fill="#c7b6ff" font-size="12">Modell (Draufsicht, nicht maßstäblich): ebene Welle → Doppelspalt → zwei Elementarwellen</text>
  <text x="50" y="262" fill="#8e979d" font-size="11">Gestrichelt: Wege von beiden Spalten zum Punkt von Marker 1 auf dem Schirm</text>
</g>
<g id="dPhG" opacity="0">
  <rect x="780" y="140" width="176" height="128" rx="8" fill="rgba(10,12,14,.88)" stroke="#323a42"/>
  <text x="792" y="158" fill="#ece6dc" font-size="11.5" font-weight="600">Zeiger am Marker 1</text>
  <path id="dPh1" stroke="#86dcff" stroke-width="2.4"/><path id="dPh2" stroke="#7fd6a0" stroke-width="2.4"/><path id="dPhR" stroke="#f2ac74" stroke-width="2.8" stroke-dasharray="1 0"/>
  <circle cx="830" cy="200" r="2.5" fill="#ece6dc"/>
  <text id="dPhT" x="792" y="244" fill="#c7c1b7" font-size="11" font-family="IBM Plex Mono, monospace"></text>
  <text id="dPhI" x="792" y="259" fill="#f2ac74" font-size="11" font-family="IBM Plex Mono, monospace"></text>
  <text id="dPhK" x="944" y="259" fill="#7fd6a0" font-size="11" text-anchor="end"></text>
</g>
<!-- Blick auf den Schirm -->
<text x="40" y="290" fill="#8e979d" font-size="13">Blick auf den Schirm (Marker ziehen, um Abstände zu messen)</text>
<rect x="40" y="300" width="920" height="140" rx="6" fill="#2b2c2d" stroke="#3b3d3f"/>
<g id="dPattern" mask="url(#dMask)" filter="url(#dBlur)"></g>
<g id="dHits"></g><text id="dHitN" x="950" y="318" fill="#ece6dc" font-size="12" text-anchor="end"></text>
<rect x="40" y="440" width="920" height="54" fill="#efe9dc" stroke="#9c968a"/>
<g id="dRuler" font-family="IBM Plex Mono, monospace" font-size="11" fill="#111"></g>
<!-- Marker -->
<g id="dM1" style="cursor:ew-resize">
  <line y1="300" y2="494" stroke="#7fd6a0" stroke-width="1.6"/><rect x="-14" y="496" width="28" height="50" fill="transparent"/>
  <path d="M0 500 l9 14 h-18z" fill="#7fd6a0"/><text y="540" fill="#7fd6a0" font-size="12" text-anchor="middle">1</text>
</g>
<g id="dM2" style="cursor:ew-resize">
  <line y1="300" y2="494" stroke="#ab93ff" stroke-width="1.6"/><rect x="-14" y="496" width="28" height="50" fill="transparent"/>
  <path d="M0 500 l9 14 h-18z" fill="#ab93ff"/><text y="540" fill="#ab93ff" font-size="12" text-anchor="middle">2</text>
</g>
<text id="dDx" x="960" y="590" fill="#ece6dc" font-size="16" text-anchor="end" font-family="IBM Plex Mono, monospace">Δx = –</text>
<text x="40" y="590" fill="#8e979d" font-size="12">Maßstab in mm, Nullpunkt = Mitte des Musters</text>
</svg>`;

export default {
  intro: 'Laserlicht fällt auf einen Doppelspalt. Auf dem Schirm entsteht ein Streifenmuster aus hellen und dunklen Stellen. Aus dem Abstand der Maxima, dem Spaltabstand <i>g</i> und dem Schirmabstand <i>a</i> bestimmt ihr die Wellenlänge <i>λ</i> – auch die eines unbekannten Lasers.',
  docs: {
    durchfuehrung: `
<h3>Aufbau</h3>
<p>Auf einer optischen Bank stehen ein Laser, ein Diahalter mit Doppelspalt und in großem Abstand <i>a</i> ein weißer Schirm. Der Doppelspalt hat zwei Spalte der Breite <i>b</i> = 0,05 mm im Mittenabstand <i>g</i>. Der Raum wird abgedunkelt.</p>
<h3>Durchführung</h3>
<ol>
<li>Laser einschalten und so ausrichten, dass er beide Spalte trifft. Nie in den Strahl blicken.</li>
<li>Schirmabstand <i>a</i> einstellen (z. B. 2,00 m) und mit dem Maßband messen.</li>
<li>Marker 1 auf die Mitte eines hellen Streifens links, Marker 2 auf die Mitte eines hellen Streifens rechts ziehen. Die Zahl <i>k</i> der Streifenabstände dazwischen zählen und einstellen.</li>
<li><b>Messwert übernehmen</b>: Daraus folgt der Streifenabstand <i>d = Δx/k</i>. Über viele Streifen zu messen verkleinert den Ablesefehler.</li>
<li>Für mehrere Abstände <i>a</i> und verschiedene Doppelspalte wiederholen. Danach den unbekannten Laser X ausmessen.</li>
</ol>
<div class="callout">Sicherheit: Laser der Klasse 2. Nicht in den direkten oder gespiegelten Strahl blicken, keine spiegelnden Gegenstände in den Strahlengang halten.</div>`,
    theorie: `
<h3>Gangunterschied</h3>
<p>Von beiden Spalten gehen Elementarwellen aus. In Richtung <i>α</i> haben sie den Gangunterschied <i>Δs = g·sin α</i>. Ist er ein Vielfaches der Wellenlänge, verstärken sich die Wellen (Maximum), bei einem ungeraden Vielfachen von <span class="tex">\\frac{\\lambda}{2}</span> löschen sie sich aus (Minimum).</p>
<span class="formula tex">\\text{Maxima: } g\\sin\\alpha_k = k\\,\\lambda \\qquad \\text{Minima: } g\\sin\\alpha_k = (2k+1)\\,\\frac{\\lambda}{2}</span>
<h3>Kleinwinkelnäherung</h3>
<p>Am Schirm gilt <span class="tex">\\tan\\alpha = \\frac{x}{a}</span>. Für kleine Winkel ist <i>sin α ≈ tan α</i>. Dann liegen die Maxima äquidistant:</p>
<span class="formula tex">x_k \\approx k\\,\\frac{\\lambda\\, a}{g} \\quad\\Rightarrow\\quad d = \\frac{\\lambda\\, a}{g} \\quad\\Rightarrow\\quad \\lambda = \\frac{d\\, g}{a}</span>
<p>Bei <i>a</i> = 2 m und <i>x</i> = 5 cm ist der Fehler der Näherung kleiner als 0,1 %.</p>
<h3>Einfluss der Spaltbreite</h3>
<p>Jeder einzelne Spalt beugt das Licht ebenfalls. Seine Beugungsfigur bildet die Hüllkurve: Die Helligkeit der Maxima nimmt nach außen ab, bei <i>b·sin α = λ</i> liegt die erste Nullstelle der Hüllkurve.</p>
<span class="formula tex">I(\\alpha) = I_0 \\cos^2\\!\\left(\\frac{\\pi g \\sin\\alpha}{\\lambda}\\right) \\cdot \\left[\\frac{\\sin u}{u}\\right]^2 \\quad\\text{mit}\\quad u = \\frac{\\pi b \\sin\\alpha}{\\lambda}</span>
<h3>Auswertung als Gerade</h3>
<p>Trägt man <i>d</i> über <span class="tex">\\frac{a}{g}</span> auf, liegen alle Messpunkte eines Lasers auf einer Ursprungsgeraden. Ihre Steigung ist <i>λ</i>.</p>
<h3>Modellgrenzen</h3>
<ul><li>Der Spaltabstand weicht um bis zu ±1,5 % vom Aufdruck ab.</li><li>Das Laserprofil und leichtes Speckle-Rauschen sind nachgebildet, Messfehler entstehen beim Setzen der Marker.</li></ul><h3>Was die Modellansicht zeigt</h3><ul><li><b>Wellenbild</b> (Draufsicht, λ stark vergrößert): Hinter den Spalten breiten sich zwei Elementarwellen aus. Wo Berg auf Berg trifft, entsteht Helligkeit; wo Berg auf Tal trifft, Dunkelheit.</li><li><b>Gangunterschied:</b> Die gestrichelten Wege führen zum Schirmpunkt von Marker 1; Δs wird in Vielfachen von λ angezeigt.</li><li><b>Zeiger:</b> Die Zeiger beider Wellen werden aneinandergesetzt. Die Länge des Summenzeigers zum Quadrat ist die Intensität.</li><li><b>Einzelne Photonen:</b> Jedes Photon trifft an einer zufälligen Stelle auf; die Wahrscheinlichkeit folgt der Intensitätsverteilung. Erst viele Photonen ergeben das Streifenmuster.</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Laser</td><td>635 nm · 532 nm · 405 nm, Klasse 2, &lt; 1 mW</td></tr>
<tr><td>Doppelspalte (Dia)</td><td>g = 0,10 · 0,20 · 0,30 · 0,50 mm</td></tr>
<tr><td>Spaltbreite</td><td>b = 0,05 mm</td></tr>
<tr><td>Schirmabstand</td><td>0,50 … 5,00 m</td></tr>
<tr><td>Schirm</td><td>weiß, Maßstab mm-Teilung</td></tr>
</tbody></table>
<p class="muted" style="margin-top:12px">Übliche Doppelspalt-Dias haben Spaltabstände von 0,1 mm bis 1 mm. LEIFIphysik behandelt den Doppelspalt mit derselben Kleinwinkelnäherung.</p>`,
    abi: `
<details class="q"><summary>Leite die Bedingung für die Lage der Maxima her. <span class="op">AFB II</span></summary><p>Die Wellen aus beiden Spalten haben in Richtung α den Gangunterschied Δs = g·sin α. Konstruktive Interferenz bei Δs = k·λ, also g·sin α<sub>k</sub> = k·λ. Mit tan α = x/a und der Kleinwinkelnäherung folgt x<sub>k</sub> = k·λ·a/g.</p></details>
<details class="q"><summary>Bei a = 2,50 m und g = 0,20 mm liegen zwischen dem 5. Maximum links und rechts 79 mm. Berechne λ. <span class="op">AFB II</span></summary><p>Zwischen den beiden 5. Maxima liegen k = 10 Streifenabstände: d = 7,9 mm. λ = d·g/a = 7,9·10⁻³ m · 0,20·10⁻³ m / 2,50 m ≈ 632 nm (rot).</p></details>
<details class="q"><summary>Wie ändert sich das Muster, wenn man grünes statt rotes Licht verwendet bzw. g verdoppelt? <span class="op">AFB I</span></summary><p>d = λ·a/g: Grünes Licht hat die kleinere Wellenlänge, die Streifen rücken zusammen. Bei doppeltem g halbiert sich der Streifenabstand.</p></details>
<details class="q"><summary>Begründe, warum man die Strecke über viele Streifen misst. <span class="op">AFB II</span></summary><p>Der Ablesefehler beim Setzen der Marker (etwa ±0,5 mm) fällt nur einmal an. Über k Streifen geteilt wird er k-mal kleiner als bei der Messung eines einzelnen Streifenabstands.</p></details>
<details class="q"><summary>Warum werden die Maxima nach außen dunkler, und warum fehlen manche? <span class="op">AFB III</span></summary><p>Die Beugung am Einzelspalt (Breite b) bildet die Hüllkurve. Wo ihr Minimum (b·sin α = λ) auf ein Doppelspaltmaximum fällt, fehlt dieses. Bei g = 0,20 mm und b = 0,05 mm fällt das 4. Maximum aus, weil g/b = 4.</p></details>
<details class="q"><summary>Erkläre, warum das Experiment den Wellencharakter des Lichts zeigt. <span class="op">AFB I–II</span></summary><p>Hinter dem Doppelspalt entstehen dunkle Stellen, wo mit nur einem Spalt Licht wäre. Auslöschung von Licht durch Licht lässt sich nur mit der Überlagerung von Wellen (Interferenz) erklären.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, selectBox, segmented, check, button, fmt, dataTable, toast, display } = ui;

    const S = { laser: LASERS[0], g: SLITS[1], a: 2.0, span: 100, on: true, k: 10, m1: -30, m2: 30, ver: 0, hits: [], photonRate: 0 };
    const gReal = () => S.g * G_TOL.get(S.g);
    const intensity = xm => { const lam = S.laser.lam, s = xm / Math.hypot(xm, S.a); return Math.cos(Math.PI * gReal() * s / lam) ** 2 * sinc(Math.PI * B_SLIT * s / lam) ** 2; };
    const rgb = () => lamRGB(S.laser.lam * 1e9);
    const changed = () => { S.ver++; S.hits.length = 0; };

    // ---- Bedienfeld ----
    const gL = group('Laser', { led: true }); gL.led(true);
    const cOn = check({ label: 'Laser eingeschaltet', checked: true, onChange: v => { S.on = v; gL.led(v); changed(); } });
    const sLas = selectBox({ label: 'Lichtquelle', value: 'rot', options: LASERS.map(l => ({ value: l.id, label: l.id === 'x' ? l.name : `${l.name} (${Math.round(l.lam * 1e9)} nm)` })), onChange: v => { S.laser = LASERS.find(l => l.id === v); changed(); } });
    gL.append(cOn, sLas);
    const gA = group('Aufbau');
    const sG = selectBox({ label: 'Doppelspalt (Spaltbreite b = 0,05 mm)', value: S.g, options: SLITS.map(g => ({ value: g, label: `g = ${fmt(g * 1e3, 2)} mm` })), onChange: v => { S.g = +v; changed(); } });
    const sA = slider({ label: 'Schirmabstand a', min: 0.5, max: 5, step: 0.05, value: S.a, unit: 'm', digits: 2, onInput: v => { S.a = v; changed(); } });
    const segSpan = segmented({ value: 100, options: [{ value: 50, label: '±25 mm' }, { value: 100, label: '±50 mm' }, { value: 200, label: '±100 mm' }], onChange: v => { const f = v / S.span; S.span = v; S.m1 = Math.max(-v / 2, Math.min(v / 2, S.m1 * f)); S.m2 = Math.max(-v / 2, Math.min(v / 2, S.m2 * f)); changed(); } });
    gA.append(sG, sA, el('div', { class: 'ctl' }, el('label', { style: 'grid-column:1/-1' }, 'Ausschnitt des Schirms'), el('div', { style: 'grid-column:1/-1' }, segSpan)));
    const gM = group('Messung mit den Markern');
    const sK = slider({ label: 'Streifenabstände k zwischen den Markern', min: 1, max: 20, step: 1, value: S.k, onInput: v => { S.k = v; S.ver++; } });
    const dDx = display('Δx (Marker 1 → 2)'), dD = display('d = Δx / k');
    gM.append(sK, dDx, dD, el('div', { class: 'bar' }, button('Messwert übernehmen', () => take(), 'btn small primary')),
      el('p', { class: 'muted', style: 'font-size:12.5px;margin:8px 0 0' }, 'Marker im 2D-Aufbau mit der Maus ziehen oder anklicken und mit den Pfeiltasten verschieben (Umschalt = 1 mm).'));
    const gP = group('Modell: einzelne Photonen');
    const sRate = segmented({ value: 0, options: [{ value: 0, label: 'aus' }, { value: 30, label: 'langsam' }, { value: 400, label: 'schnell' }], onChange: v => { S.photonRate = v; } });
    gP.append(el('p', { class: 'muted', style: 'font-size:12.5px;margin:0 0 8px' }, 'Der Schirm wird dunkel, das Muster baut sich Photon für Photon auf (nur in der Modellansicht).'), sRate,
      el('div', { class: 'bar', style: 'margin-top:8px' }, button('Schirm löschen', () => { S.hits.length = 0; })));
    controls.append(gL, gA, gM, gP);

    // ---- Messwerte ----
    const rows = [];
    const tbl = dataTable([
      { key: 'laser', label: 'Laser', fmt: v => v }, { key: 'g', label: 'g in mm', fmt: v => fmt(v * 1e3, 2) },
      { key: 'a', label: 'a in m', digits: 2 }, { key: 'k', label: 'k', digits: 0 }, { key: 'dx', label: 'Δx in mm', digits: 1 },
      { key: 'd', label: 'd in mm', digits: 2 }, { key: 'lam', label: 'λ in nm', fmt: v => fmt(v * 1e9, 0) }
    ], { onDelete: i => { rows.splice(i, 1); redraw(); } });
    const figP = el('div', { class: 'fig' }), figL = el('div', { class: 'fig' });
    const chP = new Chart(figP, { xlabel: 'x in mm', ylabel: 'I / I₀', ymin: 0, ymax: 1.05 });
    const chL = new Chart(figL, { xlabel: 'a/g in 10³', ylabel: 'd in mm' });
    const resL = el('div', { class: 'result' });
    messwerte.append(
      el('div', { class: 'data' },
        el('div', { class: 'chartbox' }, el('h4', {}, 'Intensitätsverlauf auf dem Schirm (Fotodiode)'), figP,
          el('p', { class: 'muted', style: 'font-size:13px;margin:8px 0 0' }, 'Gestrichelt: Hüllkurve der Beugung am Einzelspalt.')),
        el('div', { class: 'chartbox' }, el('h4', {}, 'Auswertung: d über a/g'), figL, resL,
          csvTools(() => ({ meta: ['Doppelspalt – Wellenlängenbestimmung', `Spaltbreite b = ${B_SLIT * 1e3} mm`], columns: [{ key: 'laser', label: 'Laser' }, { key: 'g', label: 'g in m' }, { key: 'a', label: 'a in m' }, { key: 'k', label: 'k' }, { key: 'dx', label: 'Delta x in mm' }, { key: 'd', label: 'd in mm' }, { key: 'lam', label: 'lambda in m' }], rows }), 'doppelspalt_messreihe'))),
      el('div', { style: 'height:14px' }), tbl,
      el('div', { class: 'bar', style: 'margin-top:12px' }, button('Wellenlänge von Laser X aufdecken', () => toast(`Laser X: λ = ${Math.round(LASERS[3].lam * 1e9)} nm`, 5000))));
    let profVer = -1;
    function drawProfile() {
      if (profVer === S.ver) return; profVer = S.ver;
      const pts = []; for (let i = 0; i <= 600; i++) { const xmm = -S.span / 2 + S.span * i / 600; pts.push([xmm, S.on ? intensity(xmm / 1000) : 0]); }
      const [r, g, b] = rgb(); chP.o.xmin = -S.span / 2; chP.o.xmax = S.span / 2;
      chP.set([{ points: pts, color: `rgb(${r},${g},${b})` }], S.on ? [{ f: x => { const s = (x / 1000) / Math.hypot(x / 1000, S.a); return sinc(Math.PI * B_SLIT * s / S.laser.lam) ** 2; }, color: '#8e979d' }] : []);
    }
    function redraw() {
      tbl.render(rows);
      const ids = [...new Set(rows.map(r => r.laser))], cols = { 'rot': '#ff6a5a', 'grün': '#7fd67f', 'blau-violett': '#9d8cff', 'X': '#f2ac74' };
      const series = [], fits = []; let txt = '';
      for (const id of ids) {
        const pts = rows.filter(r => r.laser === id).map(r => [r.a / r.g / 1000, r.d]);
        series.push({ name: id, color: cols[id] || '#86dcff', mode: 'dot', points: pts });
        if (pts.length >= 2) { const f = fit.propFit(pts.map(p => p[0]), pts.map(p => p[1])); if (!f) continue; fits.push({ f: f.f, color: cols[id] || '#86dcff' }); txt += `<div><span>Laser ${id}: Steigung = λ</span><br><b>${fmt(f.a * 1000, 0)} nm</b> <span>· R² = ${fmt(f.r2, 4)}</span></div>`; }
      }
      chL.set(series, fits); resL.innerHTML = txt || '<span>Mindestens zwei Messungen je Laser (verschiedene a oder g) für die Ausgleichsgerade.</span>';
    }
    redraw();
    function take() {
      if (!S.on) { toast('Laser ist ausgeschaltet.'); return; }
      const dx = Math.abs(S.m2 - S.m1); if (dx < 0.5) { toast('Die Marker liegen aufeinander. Erst zwei helle Streifen markieren.'); return; }
      const d = dx / S.k, lam = d * 1e-3 * S.g / S.a, name = S.laser.id === 'x' ? 'X' : S.laser.name.replace('Diodenlaser ', '');
      rows.push({ laser: name, g: S.g, a: S.a, k: S.k, dx, d, lam }); redraw(); toast(`Übernommen: d = ${fmt(d, 2)} mm → λ ≈ ${fmt(lam * 1e9, 0)} nm`);
    }
    // Photonen: Auftreffort nach der Intensitätsverteilung ziehen (Verwerfungsmethode)
    function photonHit() { for (let k = 0; k < 200; k++) { const x = (Math.random() - 0.5) * S.span; if (Math.random() < intensity(x / 1000)) return [x, (Math.random() + Math.random() + Math.random() - 1.5) * 0.55]; } return null; }

    // ---- Wellenmodell (gemeinsam): Feld zweier Elementarwellen, nicht maßstäblich ----
    // Sichtbares Verhältnis g/λ: wächst mit dem echten g/λ, bleibt aber im Bereich 2,5 … 7
    const gOverLamVis = () => { const r = gReal() / S.laser.lam; return 2.5 + 4.5 * Math.min(1, (r - 130) / (1300 - 130)); };

    // ======================= Ansicht 2D =======================
    async function view2d(box, MM) {
      box.insertAdjacentHTML('beforeend', svgMarkup());
      const svg = box.querySelector('svg'), q = id => svg.querySelector('#' + id), NS = 'http://www.w3.org/2000/svg';
      const speck = Array.from({ length: NBAR }, () => 0.86 + 0.14 * Math.random());
      const pat = q('dPattern'), bars = [], bw = (X1 - X0) / NBAR;
      for (let i = 0; i < NBAR; i++) { const r = document.createElementNS(NS, 'rect'); r.setAttribute('x', (X0 + i * bw).toFixed(2)); r.setAttribute('y', 300); r.setAttribute('width', (bw + 0.6).toFixed(2)); r.setAttribute('height', 140); pat.append(r); bars.push(r); }
      const xToSvg = mm => 500 + mm * (X1 - X0) / S.span, svgToX = sx => (sx - 500) * S.span / (X1 - X0);
      // Wellenbild-Leinwand (Modell) über der optischen Bank
      const cv = q('dWaveCv'), cx = cv.getContext('2d'), W = cv.width, Hc = cv.height, img = cx.createImageData(W, Hc);
      function drawRuler() {
        const step = S.span <= 50 ? 1 : 2, lab = S.span <= 50 ? 5 : S.span <= 100 ? 10 : 20; let h = '';
        for (let mm = -S.span / 2; mm <= S.span / 2 + 1e-9; mm += step) { const x = xToSvg(mm), major = Math.abs(mm % lab) < 1e-9, mid = !major && Math.abs(mm % (lab / 2)) < 1e-9; h += `<rect x="${(x - 0.5).toFixed(1)}" y="440" width="1" height="${major ? 18 : mid ? 12 : 7}"/>`; if (major) h += `<text x="${x.toFixed(1)}" y="475" text-anchor="middle">${mm}</text>`; }
        q('dRuler').innerHTML = h;
      }
      function drawSetup() {
        const sx = 360 + (S.a - 0.5) / 4.5 * 560;
        q('dScreenG').setAttribute('transform', `translate(${sx} 0)`); q('dScreenLbl').setAttribute('x', sx); q('dDimL').setAttribute('x2', sx);
        q('dDimA').setAttribute('d', `M311 250 l8 -4 v8z M${sx} 250 l-8 -4 v8z M311 242 v16 M${sx} 242 v16`);
        q('dDimT').setAttribute('x', (311 + sx) / 2); q('dDimT').textContent = `a = ${fmt(S.a, 2)} m`;
        q('dSlitLbl').textContent = `g = ${fmt(S.g * 1e3, 2)} mm`; q('dLaserName').textContent = S.laser.id === 'x' ? 'Laser X' : `${Math.round(S.laser.lam * 1e9)} nm`;
        const [r, g, b] = rgb(), col = `rgb(${r},${g},${b})`;
        q('dLaserLed').setAttribute('fill', S.on ? '#ff4b3e' : '#3a1010'); q('dBeam').setAttribute('opacity', S.on ? 1 : 0); q('dBeamIn').setAttribute('stroke', col);
        q('dFan').setAttribute('d', `M316 135 L${sx - 8} 72 L${sx - 8} 168 Z`); q('dFan').setAttribute('fill', col);
        const rays = q('dRays'); rays.setAttribute('stroke', col); let h = ''; for (let k = -3; k <= 3; k++) h += `<line x1="316" y1="135" x2="${sx - 8}" y2="${135 + k * 13}" opacity="${1 - Math.abs(k) * 0.25}"/>`; rays.innerHTML = h;
      }
      function drawPattern(dark) {
        const [r, g, b] = rgb();
        for (let i = 0; i < NBAR; i++) {
          const I = S.on && !dark ? intensity(svgToX(X0 + (i + 0.5) * bw) / 1000) * speck[i] : 0, v = Math.pow(I, 0.55);
          const mix = (c, bg) => Math.min(255, Math.round(bg + (Math.min(255, c * 1.25) - bg) * v + 255 * Math.max(0, I - 0.75) * 0.6));
          bars[i].setAttribute('fill', `rgb(${mix(r, 43)},${mix(g, 44)},${mix(b, 45)})`);
        }
      }
      function drawMarkers() {
        for (const [id, v] of [['dM1', S.m1], ['dM2', S.m2]]) q(id).setAttribute('transform', `translate(${xToSvg(v).toFixed(1)} 0)`);
        const dx = Math.abs(S.m2 - S.m1); q('dDx').textContent = `Δx = ${fmt(dx, 1)} mm   ·   k = ${S.k}   ·   d = ${fmt(dx / S.k, 2)} mm`;
      }
      // Wellenfeld zeichnen (Draufsicht): links ebene Welle, rechts zwei Kreiswellen
      function drawWaves(t) {
        const [r, g, b] = rgb(), lamPx = 11, gPx = gOverLamVis() * lamPx, sx0 = 70, cy = Hc / 2, k = 2 * Math.PI / lamPx, w = 2 * Math.PI * 1.1;
        const d = img.data; let i = 0;
        for (let y = 0; y < Hc; y++) for (let x = 0; x < W; x++, i += 4) {
          let a;
          if (x < sx0) a = Math.cos(k * x - w * t);
          else if (x < sx0 + 2) { const inS = Math.abs(Math.abs(y - cy) - gPx / 2) < 2; a = inS ? Math.cos(k * x - w * t) : -2; }
          else { const r1 = Math.hypot(x - sx0, y - cy + gPx / 2), r2 = Math.hypot(x - sx0, y - cy - gPx / 2); a = (Math.cos(k * r1 - w * t) + Math.cos(k * r2 - w * t)) * 0.5 * Math.min(1.3, 9 / Math.sqrt(r1 + r2 + 1)); }
          if (a === -2) { d[i] = 70; d[i + 1] = 76; d[i + 2] = 82; d[i + 3] = 255; continue; }
          const v = Math.max(0, a) ** 1.4, n = Math.max(0, -a) * 0.18;
          d[i] = 10 + r * v + 20 * n; d[i + 1] = 12 + g * v + 24 * n; d[i + 2] = 14 + b * v + 30 * n; d[i + 3] = 255;
        }
        cx.putImageData(img, 0, 0);
        // Gangunterschied zu einem Schirmpunkt (Marker 1) im Modellmaßstab
        const xs = W - 4, sinA = Math.sin(Math.atan((S.m1 / 1000) / S.a));
        const ds = gReal() * sinA / S.laser.lam;                         // echter Gangunterschied in Vielfachen von λ
        const yHit = cy + Math.tan(Math.asin(Math.max(-0.95, Math.min(0.95, ds / gOverLamVis())))) * (xs - sx0); // gleiche Δs/λ im Modell
        cx.strokeStyle = 'rgba(255,255,255,.8)'; cx.lineWidth = 1; cx.setLineDash([3, 3]);
        cx.beginPath(); cx.moveTo(sx0, cy - gPx / 2); cx.lineTo(xs, yHit); cx.moveTo(sx0, cy + gPx / 2); cx.lineTo(xs, yHit); cx.stroke(); cx.setLineDash([]);
        cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(xs - 2, yHit, 3, 0, 7); cx.fill();
        return ds;
      }
      function drawPhasor(ds) {
        const ph = 2 * Math.PI * ds, L = 26, ox = 830, oy = 188;
        const x1 = ox + L, y1 = oy, x2 = x1 + L * Math.cos(ph), y2 = oy - L * Math.sin(ph);
        q('dPh1').setAttribute('d', `M${ox} ${oy} L${x1} ${y1}`); q('dPh2').setAttribute('d', `M${x1} ${y1} L${x2.toFixed(1)} ${y2.toFixed(1)}`);
        q('dPhR').setAttribute('d', `M${ox} ${oy} L${x2.toFixed(1)} ${y2.toFixed(1)}`);
        const frac = ((ds % 1) + 1) % 1;
        q('dPhT').textContent = `Δs = ${fmt(ds, 2)}·λ`; q('dPhI').textContent = `I/I₀ = ${fmt(Math.cos(Math.PI * ds) ** 2, 2)}`;
        q('dPhK').textContent = Math.min(frac, 1 - frac) < 0.08 ? 'Maximum' : Math.abs(frac - 0.5) < 0.08 ? 'Minimum' : '';
      }
      // Marker ziehen
      let drag = null;
      const toSvgX = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()).x; };
      for (const [id, key] of [['dM1', 'm1'], ['dM2', 'm2']]) {
        const m = q(id); m.addEventListener('pointerdown', e => { drag = key; svg.setPointerCapture(e.pointerId); e.preventDefault(); });
        m.setAttribute('tabindex', '0'); m.setAttribute('role', 'slider'); m.setAttribute('aria-label', `Marker ${key.slice(1)}`);
        m.addEventListener('keydown', e => { const d = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0; if (!d) return; e.preventDefault(); S[key] = Math.max(-S.span / 2, Math.min(S.span / 2, +(S[key] + d * (e.shiftKey ? 1 : 0.1)).toFixed(1))); S.ver++; });
      }
      svg.addEventListener('pointermove', e => { if (!drag) return; S[drag] = Math.round(Math.max(-S.span / 2, Math.min(S.span / 2, svgToX(toSvgX(e)))) * 10) / 10; S.ver++; });
      svg.addEventListener('pointerup', () => { drag = null; });
      let raf = 0, ver = -1, wasDark = null, nHits = 0;
      const hitG = q('dHits'), t0 = performance.now();
      function frame(now) {
        raf = requestAnimationFrame(frame);
        const model = MM.model, dark = model && S.photonRate > 0;
        if (ver !== S.ver || wasDark !== dark) { ver = S.ver; wasDark = dark; drawSetup(); drawRuler(); drawPattern(dark); drawMarkers(); hitG.innerHTML = ''; nHits = 0; }
        q('dWaveG').setAttribute('opacity', model ? 1 : 0); q('dPhG').setAttribute('opacity', model ? 1 : 0);
        if (model) { const ds = drawWaves((now - t0) / 1000); drawPhasor(ds); }
        // Photonen-Treffer
        if (dark && S.on) {
          const [r, g, b] = rgb(); let h = '';
          for (; nHits < S.hits.length; nHits++) { const [x, y] = S.hits[nHits]; if (Math.abs(x) > S.span / 2) continue; h += `<circle cx="${xToSvg(x).toFixed(1)}" cy="${(370 + y * 70).toFixed(1)}" r="1.3"/>`; }
          if (h) hitG.insertAdjacentHTML('beforeend', h); hitG.setAttribute('fill', `rgb(${Math.min(255, r + 60)},${Math.min(255, g + 60)},${Math.min(255, b + 60)})`);
          q('dHitN').textContent = `${S.hits.length} Photonen`;
        } else q('dHitN').textContent = '';
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); } };
    }

    // ======================= Ansicht 3D =======================
    async function view3d(box, MM) {
      const { createLab, mats, label } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [1.3, 0.9, 2.1], target: [1.35, 0.15, 0], table: [5, 1.6], bloom: [1.0, 0.45, 0.8], room: 0.25, minDist: 0.2, maxDist: 5, fov: 36 });
      const { THREE, scene } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad · Gemessen wird im 2D-Aufbau</div><div class="hud hud3d"><button class="btn small" data-v="total">Gesamt</button><button class="btn small" data-v="screen">Schirm</button><button class="btn small" data-v="slit">Spalt</button></div>');
      const YB = 0.16, XS = 0.25; // Strahlhöhe, Spaltposition
      const rail = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.03, 0.08), new THREE.MeshStandardMaterial({ color: 0x6c7378, metalness: 0.9, roughness: 0.35 })); rail.position.set(2.35, 0.015, 0); rail.castShadow = rail.receiveShadow = true; scene.add(rail);
      const rider = (x, h) => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.025, 0.1), M.housing); b.position.y = 0.042; const r = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, h, 16), M.steel); r.position.y = 0.055 + h / 2; g.add(b, r); g.position.x = x; scene.add(g); return g; };
      // Laser
      rider(0.0, YB - 0.075);
      const laser = new THREE.Group(); laser.position.set(0, YB, 0); scene.add(laser);
      const lb = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.14, 32), new THREE.MeshStandardMaterial({ color: 0x2b3034, metalness: 0.6, roughness: 0.35 })); lb.rotation.z = Math.PI / 2; lb.castShadow = true; laser.add(lb);
      const lt = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.02, 24), M.steel); lt.rotation.z = Math.PI / 2; lt.position.x = 0.08; laser.add(lt);
      const ap = new THREE.Mesh(new THREE.CircleGeometry(0.003, 16), new THREE.MeshBasicMaterial({ color: 0xff2020, toneMapped: false })); ap.rotation.y = Math.PI / 2; ap.position.x = 0.0905; laser.add(ap);
      // Spalt
      rider(XS, YB - 0.075);
      const slit = new THREE.Group(); slit.position.set(XS, YB, 0); scene.add(slit);
      slit.add(new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.07, 0.07), M.black));
      const dia = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.05), new THREE.MeshStandardMaterial({ color: 0x0a0b0c, roughness: 0.4, metalness: 0.2 })); dia.rotation.y = -Math.PI / 2; dia.position.x = -0.0035; slit.add(dia);
      // Schirm mit Textur des Musters
      const screen = new THREE.Group(); scene.add(screen);
      const cvs = document.createElement('canvas'); cvs.width = 1024; cvs.height = 256; const sg = cvs.getContext('2d'); const sTex = new THREE.CanvasTexture(cvs); sTex.colorSpace = THREE.SRGBColorSpace;
      const scrMat = new THREE.MeshBasicMaterial({ map: sTex, toneMapped: false });
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.1), scrMat); scr.rotation.y = -Math.PI / 2; screen.add(scr);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.11, 0.41), new THREE.MeshStandardMaterial({ color: 0xd9d6cf, roughness: 0.9 })); back.position.x = 0.0045; screen.add(back);
      const sRod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, YB - 0.11, 16), M.steel); sRod.position.set(0.005, -(YB - 0.11) / 2 - 0.05, 0); screen.add(sRod);
      const sFoot = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.025, 0.1), M.housing); sFoot.position.set(0.005, -YB + 0.042, 0); screen.add(sFoot);
      // Strahl und Fächer
      const bm = new THREE.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, XS - 0.09, 8), bm); beam.rotation.z = Math.PI / 2; beam.position.set((XS + 0.09) / 2, YB, 0); scene.add(beam);
      const fanGeo = new THREE.BufferGeometry(), fanMat = new THREE.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
      const fan = new THREE.Mesh(fanGeo, fanMat); scene.add(fan);
      // Modell: Wellenfeld als Fläche (Draufsicht) zwischen Spalt und Schirm, Shader
      const waveMat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
        uniforms: { t: { value: 0 }, col: { value: new THREE.Color(1, 0.2, 0.2) }, lam: { value: 0.02 }, g: { value: 0.1 }, len: { value: 1 } },
        vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
        fragmentShader: `uniform float t; uniform vec3 col; uniform float lam; uniform float g; uniform float len; varying vec2 vP;
          void main(){ float x = (vP.x + 0.5) * len; float y = vP.y; float k = 6.2831/lam;
            float r1 = length(vec2(x, y - g*0.5)), r2 = length(vec2(x, y + g*0.5));
            float a = (cos(k*r1 - 7.0*t) + cos(k*r2 - 7.0*t)) * 0.5;
            float fade = smoothstep(0.0, 0.02, x) * (1.0 - smoothstep(len*0.85, len, x)) * (1.0 - smoothstep(0.08, 0.16, abs(y)));
            float v = pow(max(a, 0.0), 1.5);
            gl_FragColor = vec4(col * v * 1.4, v * 0.85 * fade); }`
      });
      const wave = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.32, 1, 1), waveMat); wave.rotation.x = -Math.PI / 2; scene.add(wave);
      const lW = label(THREE, 'Modell: Wellenberge zweier Elementarwellen (λ stark vergrößert)', { color: '#c7b6ff', size: 0.028 }); scene.add(lW);
      // Kamera
      const camViews = () => ({ total: [[XS + S.a * 0.25, 0.42, 0.55 + 0.22 * S.a], [XS + S.a * 0.6, 0.13, 0]], screen: [[XS + S.a - 0.55, YB + 0.05, 0.0], [XS + S.a, YB, 0]], slit: [[XS - 0.25, YB + 0.18, 0.28], [XS + 0.15, YB, 0]] });
      let camAnim = null;
      { const [p, t] = camViews().total; lab.camera.position.set(...p); lab.controls.target.set(...t); lab.controls.update(); }
      box.querySelector('.hud').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; const [p, t] = camViews()[b.dataset.v]; camAnim = { p0: lab.camera.position.clone(), t0: lab.controls.target.clone(), p1: new THREE.Vector3(...p), t1: new THREE.Vector3(...t), k: 0 }; });
      let ver = -1, dark = null, nHits = 0;
      function paintScreen(isDark) {
        const [r, g, b] = rgb(); sg.fillStyle = '#d9d6cf'; sg.fillRect(0, 0, 1024, 256);
        if (isDark) { sg.fillStyle = '#1b1c1d'; sg.fillRect(0, 0, 1024, 256); return; }
        if (!S.on) return;
        for (let i = 0; i < 1024; i++) {
          const xm = (i / 1024 - 0.5) * 0.4, I = intensity(xm), v = Math.pow(I, 0.6);
          const grd = sg.createLinearGradient(0, 0, 0, 256); const c = `rgba(${r},${g},${b},${(v * 0.95).toFixed(3)})`;
          grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(0.38, c); grd.addColorStop(0.5, `rgba(${Math.min(255, r + 120 * v)},${Math.min(255, g + 90 * v)},${Math.min(255, b + 90 * v)},${v.toFixed(3)})`); grd.addColorStop(0.62, c); grd.addColorStop(1, 'rgba(0,0,0,0)');
          sg.fillStyle = grd; sg.fillRect(i, 0, 1, 256);
        }
      }
      const off = lab.onFrame((dt, t) => {
        const [r, g, b] = rgb(), col = new THREE.Color(r / 255, g / 255, b / 255), model = MM.model, isDark = model && S.photonRate > 0;
        const XSc = XS + S.a;
        if (ver !== S.ver || dark !== isDark) {
          ver = S.ver; dark = isDark; nHits = 0;
          screen.position.set(XSc, YB, 0); paintScreen(isDark); sTex.needsUpdate = true;
          bm.color.copy(col); fanMat.color.copy(col); ap.material.color.copy(col);
          const pos = new Float32Array([XS, YB, 0, XSc - 0.002, YB + 0.03, -0.2, XSc - 0.002, YB + 0.03, 0.2, XS, YB, 0, XSc - 0.002, YB - 0.03, 0.2, XSc - 0.002, YB - 0.03, -0.2]);
          fanGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); fanGeo.computeBoundingSphere();
          wave.scale.set(S.a, 1, 1); wave.position.set(XS + S.a / 2, YB - 0.04, 0); waveMat.uniforms.len.value = S.a; waveMat.uniforms.col.value.copy(col);
          waveMat.uniforms.lam.value = 0.022; waveMat.uniforms.g.value = gOverLamVis() * 0.022;
          lW.position.set(XS + S.a / 2, YB + 0.02, -0.2);
        }
        if (isDark && S.on && nHits < S.hits.length) {
          sg.fillStyle = `rgb(${Math.min(255, r + 60)},${Math.min(255, g + 60)},${Math.min(255, b + 60)})`;
          for (; nHits < S.hits.length; nHits++) { const [x, y] = S.hits[nHits]; const px = (x / 1000 / 0.4 + 0.5) * 1024; if (px < 0 || px > 1024) continue; sg.fillRect(px, 128 + y * 90, 2, 2); }
          sTex.needsUpdate = true;
        }
        bm.opacity = S.on ? 0.9 : 0; fanMat.opacity = S.on ? (isDark ? 0.02 : 0.05) : 0; ap.visible = S.on;
        wave.visible = lW.visible = model && S.on; waveMat.uniforms.t.value = t;
        if (camAnim) { camAnim.k = Math.min(1, camAnim.k + dt * 1.4); const k = 1 - (1 - camAnim.k) ** 3; lab.camera.position.lerpVectors(camAnim.p0, camAnim.p1, k); lab.controls.target.lerpVectors(camAnim.t0, camAnim.t1, k); if (camAnim.k >= 1) camAnim = null; }
      });
      return { destroy() { off(); lab.dispose(); } };
    }

    const host = viewHost(stage, { id: 'doppelspalt', views: { '2d': view2d, '3d': view3d }, initial: '2d', modelInfo: 'Elementarwellen, Gangunterschied, Zeiger, Photonen' });

    // ---- Hauptschleife ----
    let raf = 0, last = performance.now(), acc = 0;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const dx = Math.abs(S.m2 - S.m1); dDx.set(`${fmt(dx, 1)} mm`); dD.set(`${fmt(dx / S.k, 2)} mm`);
      drawProfile();
      if (host.M.model && S.photonRate > 0 && S.on && S.hits.length < 20000) { acc += dt * S.photonRate; while (acc > 1) { acc -= 1; const h = photonHit(); if (h) S.hits.push(h); } } else acc = 0;
    }
    raf = requestAnimationFrame(loop);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); chP.destroy(); chL.destroy(); } };
  }
};
