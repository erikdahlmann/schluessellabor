// ============================================================================
//  Schlüsselexperiment: Linienspektren und Spektralanalyse
//  Spektrallampe → Spalt → Linse → Gitter → Schirm. Jede Linie gehört zu einem
//  Übergang zwischen zwei Energieniveaus: E_Ph = h·f = h·c/λ = E_oben − E_unten.
//  Modell: Energieniveauschema mit Übergängen und ausgesandten Photonen.
// ============================================================================
import { viewHost } from '../js/lib/views.js';
import { lamRGB, rgbStr, maxima, screenBins, binColor } from '../js/lib/optik.js';

const HC = 1239.84;                                                     // h·c in eV·nm
// Niveaus (eV) und Linien (nm, relative Helligkeit, oberes/unteres Niveau); Werte nach NIST, gerundet
const LAMPS = [
  { id: 'h', name: 'Wasserstoff (H)', short: 'H',
    levels: [1, 2, 3, 4, 5, 6].map(n => ({ id: 'n' + n, name: `n = ${n}`, E: -13.606 / n / n })), ion: 0, brk: -3.75,
    lines: [[656.3, 1, 'n3', 'n2'], [486.1, 0.45, 'n4', 'n2'], [434.0, 0.22, 'n5', 'n2'], [410.2, 0.12, 'n6', 'n2']] },
  { id: 'he', name: 'Helium (He)', short: 'He',
    levels: [{ id: 'g', name: '1s² ¹S', E: 0 }, { id: '2s3', name: '2s ³S', E: 19.82 }, { id: '2s1', name: '2s ¹S', E: 20.62 }, { id: '2p3', name: '2p ³P', E: 20.96 }, { id: '2p1', name: '2p ¹P', E: 21.22 }, { id: '3s3', name: '3s ³S', E: 22.72 }, { id: '3d', name: '3d', E: 23.07 }, { id: '3p1', name: '3p ¹P', E: 23.09 }, { id: '4s3', name: '4s ³S', E: 23.59 }, { id: '4d', name: '4d', E: 23.74 }], ion: 24.59, brk: 19.3,
    lines: [[706.5, 0.3, '3s3', '2p3'], [667.8, 0.45, '3d', '2p1'], [587.6, 1, '3d', '2p3'], [501.6, 0.35, '3p1', '2s1'], [492.2, 0.14, '4d', '2p1'], [471.3, 0.13, '4s3', '2p3'], [447.1, 0.32, '4d', '2p3']] },
  { id: 'na', name: 'Natrium (Na)', short: 'Na',
    levels: [{ id: '3s', name: '3s', E: 0 }, { id: '3p', name: '3p', E: 2.104 }, { id: '4s', name: '4s', E: 3.191 }, { id: '3d', name: '3d', E: 3.617 }, { id: '5s', name: '5s', E: 4.116 }, { id: '4d', name: '4d', E: 4.283 }, { id: '5d', name: '5d', E: 4.592 }], ion: 5.139,
    lines: [[589.3, 1, '3p', '3s'], [568.8, 0.08, '4d', '3p'], [615.4, 0.06, '5s', '3p'], [498.3, 0.05, '5d', '3p']] },
  { id: 'hg', name: 'Quecksilber (Hg)', short: 'Hg',
    levels: [{ id: 'g', name: '6¹S₀', E: 0 }, { id: 'p0', name: '6³P₀', E: 4.667 }, { id: 'p1', name: '6³P₁', E: 4.886 }, { id: 'p2', name: '6³P₂', E: 5.461 }, { id: 'P1', name: '6¹P₁', E: 6.704 }, { id: 's1', name: '7³S₁', E: 7.730 }, { id: 'd', name: '6¹D₂', E: 8.844 }], ion: 10.44, brk: 4.3,
    lines: [[404.7, 0.4, 's1', 'p0'], [435.8, 0.75, 's1', 'p1'], [546.1, 1, 's1', 'p2'], [577.9, 0.55, 'd', 'P1']] }
];
LAMPS.forEach(L => { L.lines = L.lines.map(([nm, w, up, lo]) => ({ nm, w, up, lo })); });
const X = { ...LAMPS[1 + Math.floor(Math.random() * 3)] };              // unbekannte Lampe: He, Na oder Hg
const LAMP_LIST = [...LAMPS, { id: 'x', name: 'Lampe X (unbekannt)', short: 'X', ref: X }];
const real = L => L.ref || L;
const LPM = 600, G_TRUE = 1e-3 / LPM * (1 + (Math.random() * 0.016 - 0.008));
const NBAR = 460, X0 = 60, X1 = 940;
const mixColor = L => { let r = 0, g = 0, b = 0, s = 0; for (const l of real(L).lines) { const c = lamRGB(l.nm); r += c[0] * l.w; g += c[1] * l.w; b += c[2] * l.w; s += l.w; } const m = Math.max(r, g, b) / s || 1; return [r / s / m * 255, g / s / m * 255, b / s / m * 255].map(Math.round); };

// Energieniveauschema auf eine Canvas zeichnen (für 2D und 3D)
function drawLevels(c, W, H, L, events, t, hiNm) {
  const R = real(L);
  c.fillStyle = '#0a0c0e'; c.fillRect(0, 0, W, H);
  const top = 34, bot = H - 22, left = 92, right = W - 70;
  const Es = R.levels.map(l => l.E), Emax = R.ion, brk = R.brk;
  const Emin = Math.min(...Es.filter(e => !brk || e > brk || e === 0));
  const yOf = E => { if (brk) { if (E < brk) return bot; return bot - 26 - (E - brk) / (Emax - brk) * (bot - 26 - top); } return bot - (E - Emin) / (Emax - Emin) * (bot - top); };
  c.font = '600 13px "IBM Plex Sans", sans-serif'; c.fillStyle = '#ece6dc'; c.textBaseline = 'middle';
  c.fillText(L.id === 'x' ? 'Energieniveaus Lampe X' : `Energieniveaus ${R.short}`, 12, 16);
  // Ionisationsgrenze
  c.strokeStyle = '#4a545c'; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(left, yOf(Emax)); c.lineTo(right, yOf(Emax)); c.stroke(); c.setLineDash([]);
  c.font = '11px "IBM Plex Sans", sans-serif'; c.fillStyle = '#8e979d'; c.fillText(R.id === 'h' ? 'E = 0 (Ionisation)' : `Ionisation ${R.ion.toFixed(2).replace('.', ',')} eV`, left + 4, yOf(Emax) - 9);
  if (brk) { c.strokeStyle = '#8e979d'; const yb = bot - 13; c.beginPath(); c.moveTo(left - 6, yb + 3); c.lineTo(left + 6, yb - 3); c.moveTo(left - 6, yb + 8); c.lineTo(left + 6, yb + 2); c.stroke(); }
  const upCount = {};
  for (const l of R.levels) {
    const y = yOf(l.E); c.strokeStyle = '#c7c1b7'; c.lineWidth = 2; c.beginPath(); c.moveTo(left, y); c.lineTo(right, y); c.stroke(); c.lineWidth = 1;
    c.fillStyle = '#c7c1b7'; c.textAlign = 'right'; c.font = '11px "IBM Plex Mono", monospace';
    c.fillText(`${l.E.toFixed(2).replace('.', ',')} eV`, left - 6, y); c.textAlign = 'left'; c.fillStyle = '#8e979d'; c.fillText(l.name, right + 5, y); upCount[l.id] = 0;
  }
  // Übergänge als Pfeile
  const n = R.lines.length, xs = R.lines.map((_, i) => left + 30 + i * (right - left - 60) / Math.max(1, n - 1));
  R.lines.forEach((ln, i) => {
    const up = R.levels.find(l => l.id === ln.up), lo = R.levels.find(l => l.id === ln.lo), x = xs[i], y1 = yOf(up.E), y2 = yOf(lo.E);
    const hi = hiNm && Math.abs(hiNm - ln.nm) < 0.5, col = rgbStr(ln.nm, 40);
    c.strokeStyle = col; c.fillStyle = col; c.globalAlpha = hiNm && !hi ? 0.35 : 0.95; c.lineWidth = hi ? 3 : 1.8;
    c.beginPath(); c.moveTo(x, y1); c.lineTo(x, y2 - 7); c.stroke();
    c.beginPath(); c.moveTo(x, y2); c.lineTo(x - 5, y2 - 9); c.lineTo(x + 5, y2 - 9); c.closePath(); c.fill();
    c.save(); c.translate(x - 5, (y1 + y2) / 2); c.rotate(-Math.PI / 2); c.textAlign = 'center'; c.font = `${hi ? 600 : 500} 10.5px "IBM Plex Mono", monospace`; c.fillText(L.id === 'x' ? '?' : `${String(ln.nm).replace('.', ',')} nm`, 0, -2); c.restore();
    c.globalAlpha = 1; c.lineWidth = 1;
  });
  // laufende Übergänge: Elektron springt nach oben, fällt, Photon fliegt weg
  for (const ev of events) {
    const i = R.lines.indexOf(ev.line); if (i < 0) continue;
    const up = R.levels.find(l => l.id === ev.line.up), lo = R.levels.find(l => l.id === ev.line.lo), x = xs[i], y1 = yOf(up.E), y2 = yOf(lo.E), a = t - ev.t0;
    const col = rgbStr(ev.line.nm, 60);
    if (a < 0.35) { c.fillStyle = '#86dcff'; c.globalAlpha = a / 0.35; c.beginPath(); c.arc(x + 9, y1, 4, 0, 7); c.fill(); c.globalAlpha = 1; }
    else if (a < 0.7) { const k = (a - 0.35) / 0.35, y = y1 + (y2 - y1) * k; c.fillStyle = '#86dcff'; c.beginPath(); c.arc(x + 9, y, 4, 0, 7); c.fill(); }
    if (a > 0.6 && a < 1.8) {
      const k = (a - 0.6) / 1.2, px = x + 12 + k * (W - x), py = (y1 + y2) / 2, lamPx = 4 + ev.line.nm / 90;
      c.strokeStyle = col; c.lineWidth = 2; c.globalAlpha = 1 - k * 0.6; c.beginPath();
      for (let s = -24; s <= 24; s++) { const yy = py + Math.sin((s / lamPx) * Math.PI * 2 - t * 18) * 6 * Math.exp(-(s * s) / 200); s === -24 ? c.moveTo(px + s, yy) : c.lineTo(px + s, yy); }
      c.stroke(); c.globalAlpha = 1; c.lineWidth = 1;
    }
  }
}

const svgMarkup = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Draufsicht auf Spektrallampe, Spalt, Linse, Gitter und Schirm, daneben Vergleichsspektren oder das Energieniveauschema; darunter das Spektrum auf dem Schirm">
<defs>
  <linearGradient id="lBench" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2024"/><stop offset="1" stop-color="#121518"/></linearGradient>
  <linearGradient id="lV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset=".22" stop-color="#999"/><stop offset=".5" stop-color="#fff"/><stop offset=".78" stop-color="#999"/><stop offset="1" stop-color="#000"/></linearGradient>
  <mask id="lMask" maskUnits="userSpaceOnUse" x="40" y="300" width="920" height="140"><rect x="40" y="300" width="920" height="140" fill="url(#lV)"/></mask>
  <clipPath id="lClip"><rect x="40" y="44" width="520" height="228"/></clipPath>
  <filter id="lGlow"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="lBig"><feGaussianBlur stdDeviation="7"/></filter>
  <filter id="lSh" x="-10%" y="-10%" width="130%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity=".55"/></filter>
</defs>
<rect width="1000" height="620" fill="url(#lBench)"/>
<text x="40" y="34" fill="#8e979d" font-size="13">Draufsicht, maßstäblich (Gitter 600 Linien/mm)</text>
<rect x="40" y="44" width="520" height="228" rx="6" fill="#0d1012" stroke="#22282d"/>
<g clip-path="url(#lClip)">
  <g id="lRays" filter="url(#lGlow)"></g>
  <line id="lScreen" stroke="#d9d6cf" stroke-width="5"/>
</g>
<circle id="lLampGlow" cx="86" cy="158" r="26" filter="url(#lBig)" opacity=".8"/>
<rect x="62" y="128" width="48" height="60" rx="6" fill="#262b2f" stroke="#454c52" filter="url(#lSh)"/>
<rect id="lTube" x="80" y="136" width="12" height="44" rx="6"/>
<text id="lLampT" x="86" y="122" fill="#c9c3ba" font-size="11" text-anchor="middle">Lampe</text>
<rect x="128" y="138" width="4" height="40" fill="#6a7178"/><text x="130" y="200" fill="#8e979d" font-size="10" text-anchor="middle">Spalt</text>
<ellipse cx="162" cy="158" rx="5" ry="22" fill="#9fc4ff" fill-opacity=".25" stroke="#9fc4ff" stroke-opacity=".6"/><text x="162" y="194" fill="#8e979d" font-size="10" text-anchor="middle">Linse</text>
<rect x="196" y="130" width="7" height="56" rx="2" fill="#6a7178" filter="url(#lSh)"/><text x="200" y="122" fill="#c9c3ba" font-size="11" text-anchor="middle">Gitter</text>
<text id="lAT" fill="#ece6dc" font-size="12" text-anchor="middle" font-family="IBM Plex Mono, monospace"></text>

<!-- rechts: Vergleichsspektren (Realansicht) bzw. Energieniveaus (Modell) -->
<g id="lRefG">
  <rect x="576" y="44" width="384" height="228" rx="6" fill="#0d1012" stroke="#22282d"/>
  <text x="590" y="64" fill="#ece6dc" font-size="12.5" font-weight="600">Vergleichsspektren (Tabellenwerte)</text>
  <g id="lRef"></g>
</g>
<g id="lLvG" opacity="0">
  <rect x="576" y="44" width="384" height="228" rx="6" fill="#0a0c0e" stroke="#5a4b8a"/>
  <foreignObject x="578" y="46" width="380" height="224"><canvas xmlns="http://www.w3.org/1999/xhtml" id="lLvCv" width="760" height="448" style="width:100%;height:100%;display:block"></canvas></foreignObject>
</g>
<text id="lInfo" x="960" y="290" fill="#c7b6ff" font-size="12" text-anchor="end"></text>

<text x="40" y="290" fill="#8e979d" font-size="13">Blick auf den Schirm</text>
<rect x="40" y="300" width="920" height="140" rx="6" fill="#141517" stroke="#3b3d3f"/>
<g id="lPattern" mask="url(#lMask)"></g>
<rect x="40" y="440" width="920" height="54" fill="#efe9dc" stroke="#9c968a"/>
<g id="lRuler" font-family="IBM Plex Mono, monospace" font-size="11" fill="#111"></g>
<g id="lM1" style="cursor:ew-resize">
  <line y1="300" y2="494" stroke="#7fd6a0" stroke-width="1.4"/><rect x="-14" y="496" width="28" height="50" fill="transparent"/>
  <path d="M0 500 l9 14 h-18z" fill="#7fd6a0"/><text y="540" fill="#7fd6a0" font-size="12" text-anchor="middle">1</text>
</g>
<g id="lM2" style="cursor:ew-resize">
  <line y1="300" y2="494" stroke="#ab93ff" stroke-width="1.4"/><rect x="-14" y="496" width="28" height="50" fill="transparent"/>
  <path d="M0 500 l9 14 h-18z" fill="#ab93ff"/><text y="540" fill="#ab93ff" font-size="12" text-anchor="middle">2</text>
</g>
<text id="lDx" x="960" y="590" fill="#ece6dc" font-size="15" text-anchor="end" font-family="IBM Plex Mono, monospace">Δx = –</text>
<text x="40" y="590" fill="#8e979d" font-size="12">Maßstab in mm, Nullpunkt = Maximum 0. Ordnung</text>
</svg>`;

export default {
  intro: 'Das Licht einer Spektrallampe wird am Gitter zerlegt. Auf dem Schirm erscheinen einzelne farbige Linien statt eines durchgehenden Spektrums. Jedes Element hat sein eigenes Linienmuster. Daran erkennt ihr eine unbekannte Lampe und schließt auf die Energieniveaus der Atome.',
  docs: {
    durchfuehrung: `
<h3>Aufbau</h3>
<p>Die Spektrallampe steht direkt hinter einem schmalen Spalt. Eine Linse bildet den Spalt scharf auf dem Schirm ab. Direkt hinter der Linse steht ein Gitter mit 600 Linien/mm. Auf dem Schirm entstehen links und rechts der hellen Mitte farbige Bilder des Spalts: die Spektrallinien. Der Raum muss gut abgedunkelt sein.</p>
<h3>Durchführung</h3>
<ol>
<li>Lampe einschalten und einige Minuten warten, bis sie voll leuchtet. Die Lampe wird heiß.</li>
<li>Schirmabstand <i>a</i> einstellen und messen.</li>
<li>Marker 1 auf eine Linie links, Marker 2 auf dieselbe Linie rechts ziehen. Ordnung <i>k</i> einstellen (meist 1).</li>
<li><b>Messwert übernehmen.</b> Aus Δx folgen der Winkel und die Wellenlänge. Für alle gut sichtbaren Linien wiederholen.</li>
<li>Die Messwerte mit den Vergleichsspektren vergleichen und Lampe X bestimmen.</li>
</ol>
<div class="callout">Sicherheit: Quecksilberlampen senden auch UV-Licht aus. Nicht direkt in die Lampe blicken. Heiße Lampen erst nach dem Abkühlen anfassen.</div>`,
    theorie: `
<h3>Wellenlänge am Gitter</h3>
<span class="formula tex">\\tan\\alpha_k = \\frac{x_k}{a} \\qquad \\lambda = \\frac{g \\sin\\alpha_k}{k}</span>
<p>Die Winkel sind groß. Darum wird ohne Kleinwinkelnäherung gerechnet (siehe Versuch Gitter).</p>
<h3>Linien und Energieniveaus</h3>
<p>Ein Atom kann nur bestimmte Energien haben. In der Lampe stoßen Elektronen mit den Atomen und heben sie auf ein höheres Niveau. Fällt das Atom auf ein tieferes Niveau zurück, sendet es ein Photon aus. Seine Energie ist genau die Differenz der beiden Niveaus.</p>
<span class="formula tex">E_{\\text{Ph}} = h f = \\frac{h\\, c}{\\lambda} = E_{\\text{oben}} - E_{\\text{unten}} \\qquad h\\, c = 1240\\,\\text{eV}\\cdot\\text{nm}</span>
<p>Weil es nur wenige Niveaus gibt, gibt es nur wenige Energiedifferenzen und damit nur wenige Wellenlängen. Jedes Element hat ein eigenes Niveauschema und darum ein eigenes Linienspektrum. Das nutzt die Spektralanalyse.</p>
<h3>Wasserstoff: Balmer-Serie</h3>
<p>Die sichtbaren Linien des Wasserstoffs enden alle auf dem Niveau n = 2. Mit <span class="tex">E_n = -\\frac{13{,}6\\,\\text{eV}}{n^2}</span> folgt:</p>
<span class="formula tex">\\frac{1}{\\lambda} = R_H \\left(\\frac{1}{2^2} - \\frac{1}{n^2}\\right) \\qquad R_H = 1{,}097 \\cdot 10^{7}\\,\\text{m}^{-1}</span>
<p>Trägt man <span class="tex">\\frac{1}{\\lambda}</span> über <span class="tex">\\left(\\frac{1}{4} - \\frac{1}{n^2}\\right)</span> auf, erhält man eine Ursprungsgerade mit der Steigung R<sub>H</sub>.</p>
<h3>Bezug zum Franck-Hertz-Versuch</h3>
<p>Beim Quecksilber liegt das Niveau 6³P₁ bei 4,89 eV. Fällt das Atom von dort in den Grundzustand, entsteht UV-Licht mit 254 nm. Das ist dieselbe Energie, die die Elektronen im Franck-Hertz-Versuch abgeben.</p>
<h3>Modellgrenzen</h3>
<ul><li>Gezeigt sind nur die hellsten sichtbaren Linien. Die Natrium-Doppellinie (589,0 und 589,6 nm) erscheint als eine Linie.</li><li>Die Helligkeiten sind gerundete Schätzwerte. Die Gitterkonstante weicht um bis zu ±0,8 % vom Aufdruck ab.</li></ul>
<h3>Was die Modellansicht zeigt</h3><ul><li>Rechts oben steht das <b>Energieniveauschema</b> der Lampe. Jeder farbige Pfeil ist ein Übergang, der eine sichtbare Linie erzeugt.</li><li>Ein Elektron (blau) sitzt kurz auf dem oberen Niveau, fällt hinunter und sendet ein Photon in der Farbe der Linie aus.</li><li>Der Übergang zur Linie unter Marker 1 ist hervorgehoben. So seht ihr, welche Energiedifferenz ihr gerade messt.</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Spektrallampen</td><td>H₂, He, Na, Hg (Fassung E27 bzw. Pico 9), mit Drossel</td></tr>
<tr><td>Spalt</td><td>verstellbar, ca. 0,2 mm</td></tr>
<tr><td>Linse</td><td>f = 100 mm</td></tr>
<tr><td>Gitter</td><td>600 Linien/mm</td></tr>
<tr><td>Schirmabstand</td><td>0,25 … 1,00 m</td></tr>
</tbody></table>
<h3 style="margin-top:16px">Linientabelle</h3>
<table class="spec"><tbody>
${LAMPS.map(L => `<tr><td>${L.name}</td><td>${L.lines.map(l => String(l.nm).replace('.', ',')).sort().join(' · ')} nm</td></tr>`).join('')}
</tbody></table>`,
    abi: `
<details class="q"><summary>Berechne die Energie eines Photons der Hg-Linie 546,1 nm in eV. <span class="op">AFB I</span></summary><p>E = h·c/λ = 1240 eV·nm / 546,1 nm ≈ 2,27 eV.</p></details>
<details class="q"><summary>Begründe, warum ein Gas ein Linienspektrum, ein glühender Draht aber ein kontinuierliches Spektrum aussendet. <span class="op">AFB II</span></summary><p>Im Gas sind die Atome weit voneinander entfernt. Jedes Atom hat seine festen Niveaus, also gibt es nur bestimmte Energiedifferenzen. Im festen Draht beeinflussen sich die Atome stark, aus den Niveaus werden breite Bänder. Dann sind fast alle Energien möglich.</p></details>
<details class="q"><summary>Die rote H-Linie liegt bei 656 nm. Zeige, dass sie zum Übergang n = 3 → n = 2 gehört. <span class="op">AFB II</span></summary><p>ΔE = 13,6 eV·(1/4 − 1/9) = 1,89 eV. λ = 1240 eV·nm / 1,89 eV ≈ 656 nm.</p></details>
<details class="q"><summary>Lampe X zeigt Linien bei 436, 546 und 578 nm. Welches Element ist es? <span class="op">AFB I</span></summary><p>Quecksilber: 435,8 nm (blau), 546,1 nm (grün) und die gelbe Doppellinie bei 577/579 nm.</p></details>
<details class="q"><summary>Erkläre den Zusammenhang zwischen dem Franck-Hertz-Versuch und dem Hg-Spektrum. <span class="op">AFB III</span></summary><p>Beide zeigen dieselben festen Energieniveaus. Beim Franck-Hertz-Versuch geben Elektronen 4,9 eV an Hg-Atome ab. Die angeregten Atome senden danach UV-Licht mit λ = 1240/4,89 nm ≈ 254 nm aus. Absorption und Emission gehören zum selben Niveau.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, selectBox, segmented, check, button, fmt, dataTable, toast, display } = ui;
    const S = { lamp: LAMP_LIST[0], a: 0.5, span: 1000, on: true, k: 1, m1: -200, m2: 200, ver: 0 };
    const lines = () => real(S.lamp).lines;
    const changed = () => { S.ver++; };

    const gL = group('Spektrallampe', { led: true }); gL.led(true);
    const cOn = check({ label: 'Lampe eingeschaltet', checked: true, onChange: v => { S.on = v; gL.led(v); changed(); } });
    const sL = selectBox({ label: 'Lampe', value: 'h', options: LAMP_LIST.map(L => ({ value: L.id, label: L.name })), onChange: v => { S.lamp = LAMP_LIST.find(L => L.id === v); changed(); } });
    gL.append(cOn, sL);
    const gA = group('Aufbau');
    const sA = slider({ label: 'Schirmabstand a', min: 0.25, max: 1.0, step: 0.01, value: S.a, unit: 'm', digits: 2, onInput: v => { S.a = v; changed(); } });
    const segSpan = segmented({ value: 1000, options: [{ value: 600, label: '±30 cm' }, { value: 1000, label: '±50 cm' }, { value: 1600, label: '±80 cm' }], onChange: v => { const f = v / S.span; S.span = v; S.m1 = Math.max(-v / 2, Math.min(v / 2, S.m1 * f)); S.m2 = Math.max(-v / 2, Math.min(v / 2, S.m2 * f)); changed(); } });
    gA.append(sA, el('div', { class: 'ctl' }, el('label', { style: 'grid-column:1/-1' }, 'Ausschnitt des Schirms'), el('div', { style: 'grid-column:1/-1' }, segSpan)));
    const gM = group('Messung mit den Markern');
    const sK = slider({ label: 'Ordnung k', min: 1, max: 2, step: 1, value: 1, onInput: v => { S.k = v; S.ver++; } });
    const dDx = display('Δx (Marker 1 → 2)'), dLam = display('λ = g·sin α / k'), dE = display('E_Ph = h·c / λ');
    gM.append(sK, dDx, dLam, dE, el('div', { class: 'bar' }, button('Messwert übernehmen', () => take(), 'btn small primary')),
      el('p', { class: 'muted', style: 'font-size:12.5px;margin:8px 0 0' }, 'Marker 1 auf eine Linie links, Marker 2 auf dieselbe Linie rechts. Ziehen oder Pfeiltasten (Umschalt = 1 mm).'));
    controls.append(gL, gA, gM);

    // ---- Messwerte ----
    const rows = [];
    const tbl = dataTable([
      { key: 'lamp', label: 'Lampe', fmt: v => v }, { key: 'a', label: 'a in m', digits: 2 }, { key: 'k', label: 'k', digits: 0 },
      { key: 'dx', label: 'Δx in mm', digits: 0 }, { key: 'al', label: 'α in °', digits: 2 }, { key: 'lam', label: 'λ in nm', digits: 1 }, { key: 'E', label: 'E_Ph in eV', digits: 2 }
    ], { onDelete: i => { rows.splice(i, 1); redraw(); } });
    const figB = el('div', { class: 'fig' }); const chB = new Chart(figB, { xlabel: '1/2² − 1/n²', ylabel: '1/λ in 1/µm' });
    const resB = el('div', { class: 'result' }), resId = el('div', { class: 'result' });
    messwerte.append(
      el('div', { class: 'data' },
        el('div', { class: 'chartbox' }, el('h4', {}, 'Wasserstoff: Balmer-Gerade'), figB, resB,
          csvTools(() => ({ meta: ['Linienspektren – Gitter 600 Linien/mm'], columns: [{ key: 'lamp', label: 'Lampe' }, { key: 'a', label: 'a in m' }, { key: 'k', label: 'k' }, { key: 'dx', label: 'Delta x in mm' }, { key: 'al', label: 'alpha in Grad' }, { key: 'lam', label: 'lambda in nm' }, { key: 'E', label: 'E_Ph in eV' }], rows }), 'linienspektren_messreihe')),
        el('div', { class: 'chartbox' }, el('h4', {}, 'Spektralanalyse: Welche Tabellenlinie passt?'), resId)),
      el('div', { style: 'height:14px' }), tbl,
      el('div', { class: 'bar', style: 'margin-top:12px' }, button('Lampe X aufdecken', () => toast(`Lampe X ist ${X.name}.`, 5000))));
    function redraw() {
      tbl.render(rows);
      const hs = rows.filter(r => r.lamp === 'H').map(r => { const n = 3 + LAMPS[0].lines.reduce((b, l, i, a) => Math.abs(l.nm - r.lam) < Math.abs(a[b].nm - r.lam) ? i : b, 0); return [0.25 - 1 / n / n, 1000 / r.lam]; });
      const fits = []; let txt = '<span>Mindestens zwei H-Linien messen. Jede Linie wird ihrem Übergang n → 2 zugeordnet.</span>';
      if (hs.length >= 2) { const f = fit.propFit(hs.map(p => p[0]), hs.map(p => p[1])); if (f) { fits.push({ f: f.f, color: '#ab93ff' }); txt = `<div><span>Steigung = Rydberg-Konstante</span><br><b>R<sub>H</sub> = ${fmt(f.a, 2)}·10⁶ m⁻¹</b> <span>· Tabelle 10,97·10⁶ m⁻¹</span></div>`; } }
      chB.set([{ name: 'H-Linien', color: '#ff7a6a', mode: 'dot', points: hs }], fits); resB.innerHTML = txt;
      // Zuordnung jeder Messung zur nächsten Tabellenlinie aller Elemente
      if (!rows.length) { resId.innerHTML = '<span>Noch keine Messwerte.</span>'; return; }
      resId.innerHTML = rows.map(r => { let best = null; for (const L of LAMPS) for (const l of L.lines) { const d = Math.abs(l.nm - r.lam); if (!best || d < best.d) best = { d, L, l }; } return `<div><span>${r.lamp}: ${fmt(r.lam, 1)} nm →</span> <b style="color:${rgbStr(best.l.nm, 40)}">${best.L.short} ${fmt(best.l.nm, 1)} nm</b> <span>(Abweichung ${fmt(best.d, 1)} nm)</span></div>`; }).join('');
    }
    redraw();
    const calc = () => { const dx = Math.abs(S.m2 - S.m1), al = Math.atan(dx / 2 / 1000 / S.a), lam = (1e-3 / LPM) * Math.sin(al) / S.k * 1e9; return { dx, al, lam, E: HC / lam }; };
    function take() {
      if (!S.on) { toast('Die Lampe ist ausgeschaltet.'); return; }
      const c = calc(); if (c.dx < 1) { toast('Die Marker liegen aufeinander. Erst eine Linie links und rechts markieren.'); return; }
      rows.push({ lamp: S.lamp.short, a: S.a, k: S.k, dx: c.dx, al: c.al * 180 / Math.PI, lam: c.lam, E: c.E }); redraw();
      toast(`Übernommen: λ ≈ ${fmt(c.lam, 1)} nm, E ≈ ${fmt(c.E, 2)} eV`);
    }
    // Linie unter Marker 1 (zum Hervorheben im Modell)
    const lineAtM1 = () => { let best = null; for (const m of maxima(lines(), G_TRUE, S.a, 2)) { if (m.k === 0) continue; const d = Math.abs(m.x - S.m1); if (d < 6 && (!best || d < best.d)) best = { d, nm: m.nm }; } return best?.nm || 0; };
    // Übergänge zufällig nach Helligkeit auslösen (gemeinsam für 2D und 3D)
    const events = []; let evAcc = 0;
    function stepEvents(dt, t) {
      for (let i = events.length - 1; i >= 0; i--) if (t - events[i].t0 > 1.9) events.splice(i, 1);
      if (!S.on) return;
      evAcc += dt * 2.2; const ls = lines(), sw = ls.reduce((s, l) => s + Math.sqrt(l.w), 0);
      while (evAcc > 1) { evAcc -= 1; let r = Math.random() * sw, pick = ls[0]; for (const l of ls) { r -= Math.sqrt(l.w); if (r <= 0) { pick = l; break; } } if (events.length < 6) events.push({ line: pick, t0: t + Math.random() * 0.3 }); }
    }

    // ======================= Ansicht 2D =======================
    async function view2d(box, MM) {
      box.insertAdjacentHTML('beforeend', svgMarkup());
      const svg = box.querySelector('svg'), q = id => svg.querySelector('#' + id), NS = 'http://www.w3.org/2000/svg';
      const pat = q('lPattern'), bars = [], bw = (X1 - X0) / NBAR;
      for (let i = 0; i < NBAR; i++) { const r = document.createElementNS(NS, 'rect'); r.setAttribute('x', (X0 + i * bw).toFixed(2)); r.setAttribute('y', 300); r.setAttribute('width', (bw + 0.6).toFixed(2)); r.setAttribute('height', 140); pat.append(r); bars.push(r); }
      const xToSvg = mm => 500 + mm * (X1 - X0) / S.span, svgToX = sx => (sx - 500) * S.span / (X1 - X0);
      const lv = q('lLvCv'), lc = lv.getContext('2d'); lc.setTransform(2, 0, 0, 2, 0, 0);
      // Vergleichsspektren
      { let h = ''; const x0 = 650, x1 = 940, X = nm => x0 + (nm - 400) / 320 * (x1 - x0);
        LAMPS.forEach((L, i) => { const y = 82 + i * 44; h += `<text x="590" y="${y + 13}" fill="#c7c1b7" font-size="12">${L.short}</text><rect x="${x0}" y="${y}" width="${x1 - x0}" height="20" fill="#050607" stroke="#2a3036"/>`; for (const l of L.lines) h += `<rect x="${(X(l.nm) - 1.2).toFixed(1)}" y="${y}" width="2.4" height="20" fill="${rgbStr(l.nm, 30)}" opacity="${(0.45 + 0.55 * Math.sqrt(l.w)).toFixed(2)}"/>`; });
        for (let nm = 400; nm <= 700; nm += 50) h += `<text x="${X(nm)}" y="266" fill="#8e979d" font-size="10" text-anchor="middle" font-family="IBM Plex Mono, monospace">${nm}</text>`;
        h += `<text x="940" y="64" fill="#8e979d" font-size="10" text-anchor="end">λ in nm</text>`; q('lRef').innerHTML = h; }
      function drawRuler() {
        const step = S.span <= 600 ? 5 : 10, lab = step * 10; let h = '';
        for (let mm = -S.span / 2; mm <= S.span / 2 + 1e-9; mm += step) { const x = xToSvg(mm), major = Math.abs(mm % lab) < 1e-9, mid = !major && Math.abs(mm % (lab / 2)) < 1e-9; h += `<rect x="${(x - 0.5).toFixed(1)}" y="440" width="1" height="${major ? 18 : mid ? 12 : 7}"/>`; if (major) h += `<text x="${x.toFixed(1)}" y="475" text-anchor="middle">${mm}</text>`; }
        q('lRuler').innerHTML = h;
      }
      function drawTop() {
        const CY = 158, GX = 200, ppm = Math.min(340 / S.a, 104 / (S.span / 2000)), sx = GX + S.a * ppm, half = S.span / 2000 * ppm;
        q('lScreen').setAttribute('x1', sx); q('lScreen').setAttribute('x2', sx); q('lScreen').setAttribute('y1', CY - half); q('lScreen').setAttribute('y2', CY + half);
        const [r, g, b] = mixColor(S.lamp), col = `rgb(${r},${g},${b})`;
        q('lTube').setAttribute('fill', S.on ? col : '#3a3f44'); q('lLampGlow').setAttribute('fill', col); q('lLampGlow').setAttribute('opacity', S.on ? 0.75 : 0);
        q('lLampT').textContent = S.lamp.short === 'X' ? 'Lampe X' : S.lamp.short;
        q('lAT').setAttribute('x', (GX + sx) / 2); q('lAT').setAttribute('y', 262); q('lAT').textContent = `a = ${fmt(S.a, 2)} m`;
        let h = '';
        if (S.on) {
          h += `<line x1="112" y1="${CY}" x2="${GX}" y2="${CY}" stroke="${col}" stroke-width="2.4"/>`;
          for (const m of maxima(lines(), G_TRUE, S.a, 2)) { const on = Math.abs(m.x) <= S.span / 2, L = on ? S.a * ppm / Math.cos(m.alpha) : 900; h += `<line x1="${GX}" y1="${CY}" x2="${(GX + L * Math.cos(m.alpha)).toFixed(1)}" y2="${(CY - L * Math.sin(m.alpha)).toFixed(1)}" stroke="${m.k === 0 ? col : rgbStr(m.nm)}" stroke-width="1.3" opacity="${on ? 0.85 : 0.3}"/>`; }
        }
        q('lRays').innerHTML = h;
      }
      function drawPattern() {
        const acc = S.on ? screenBins(lines(), G_TRUE, S.a, S.span, NBAR, { kmax: 3, sigma: 1.1, gain: 2.4, bFrac: 0.3 }) : new Float32Array(NBAR * 3);
        for (let i = 0; i < NBAR; i++) { const [r, g, b] = binColor(acc, i, [20, 21, 23]); bars[i].setAttribute('fill', `rgb(${r},${g},${b})`); }
      }
      function drawMarkers() {
        for (const [id, v] of [['lM1', S.m1], ['lM2', S.m2]]) q(id).setAttribute('transform', `translate(${xToSvg(v).toFixed(1)} 0)`);
        const c = calc(); q('lDx').textContent = `Δx = ${fmt(c.dx, 0)} mm   ·   k = ${S.k}   ·   λ = ${fmt(c.lam, 1)} nm`;
      }
      let drag = null;
      const toSvgX = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()).x; };
      for (const [id, key] of [['lM1', 'm1'], ['lM2', 'm2']]) {
        const m = q(id); m.addEventListener('pointerdown', e => { drag = key; svg.setPointerCapture(e.pointerId); e.preventDefault(); });
        m.setAttribute('tabindex', '0'); m.setAttribute('role', 'slider'); m.setAttribute('aria-label', `Marker ${key.slice(1)}`);
        m.addEventListener('keydown', e => { const d = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0; if (!d) return; e.preventDefault(); S[key] = Math.max(-S.span / 2, Math.min(S.span / 2, +(S[key] + d * (e.shiftKey ? 1 : 0.2)).toFixed(1))); S.ver++; });
      }
      svg.addEventListener('pointermove', e => { if (!drag) return; S[drag] = Math.round(Math.max(-S.span / 2, Math.min(S.span / 2, svgToX(toSvgX(e)))) * 2) / 2; S.ver++; });
      svg.addEventListener('pointerup', () => { drag = null; });
      let raf = 0, ver = -1;
      function frame(now) {
        raf = requestAnimationFrame(frame);
        const model = MM.model;
        if (ver !== S.ver) { ver = S.ver; drawTop(); drawRuler(); drawPattern(); drawMarkers(); }
        q('lRefG').setAttribute('opacity', model ? 0 : 1); q('lLvG').setAttribute('opacity', model ? 1 : 0);
        const hi = lineAtM1();
        if (model) {
          drawLevels(lc, 380, 224, S.lamp, events, now / 1000, hi);
          q('lInfo').textContent = hi ? (() => { const l = lines().find(l => l.nm === hi), R = real(S.lamp), up = R.levels.find(v => v.id === l.up), lo = R.levels.find(v => v.id === l.lo); return `Marker 1: ${S.lamp.short === 'X' ? 'Linie' : fmt(hi, 1) + ' nm'} ↔ Übergang ${up.name} → ${lo.name}, ΔE = ${fmt(up.E - lo.E, 2)} eV`; })() : 'Marker 1 auf eine Linie setzen: Der zugehörige Übergang wird hervorgehoben.';
        } else q('lInfo').textContent = '';
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); } };
    }

    // ======================= Ansicht 3D =======================
    async function view3d(box, MM) {
      const { createLab, mats, label, glowPool } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [-0.45, 0.55, 0.95], target: [0.25, 0.14, 0], table: [2.4, 2], bloom: [1.0, 0.5, 0.75], room: 0.15, minDist: 0.2, maxDist: 3.5, fov: 40 });
      const { THREE, scene } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad · Gemessen wird im 2D-Aufbau</div>');
      const YB = 0.16, XG = 0.0, SW = 1.6;
      const rail = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.03, 0.08), new THREE.MeshStandardMaterial({ color: 0x6c7378, metalness: 0.9, roughness: 0.35 })); rail.position.set(0.25, 0.015, 0); rail.castShadow = rail.receiveShadow = true; scene.add(rail);
      const rider = (x, h) => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.025, 0.1), M.housing); b.position.y = 0.042; const r = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, h, 16), M.steel); r.position.y = 0.055 + h / 2; g.add(b, r); g.position.x = x; scene.add(g); return g; };
      // Lampengehäuse mit leuchtender Röhre
      const lampG = new THREE.Group(); lampG.position.set(-0.33, 0, 0); scene.add(lampG);
      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.24, 0.1), M.housing); housing.position.y = 0.12; housing.castShadow = true; lampG.add(housing);
      const winMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
      const tubeM = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 20), winMat); tubeM.position.set(0.051, YB, 0); lampG.add(tubeM);
      const slotBack = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.14), new THREE.MeshBasicMaterial({ color: 0x050505 })); slotBack.rotation.y = Math.PI / 2; slotBack.position.set(0.0505, YB, 0); lampG.add(slotBack);
      const lampLight = new THREE.PointLight(0xffffff, 0.15, 0.6, 2); lampLight.position.set(0.09, YB, 0); lampG.add(lampLight);
      // Spalt, Linse, Gitter
      rider(-0.24, YB - 0.075); const slit = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.07, 0.06), M.black); slit.position.set(-0.24, YB, 0); scene.add(slit);
      rider(-0.13, YB - 0.075); const lens = new THREE.Mesh(new THREE.SphereGeometry(0.03, 32, 16), new THREE.MeshPhysicalMaterial({ color: 0xdfefff, roughness: 0.05, transmission: 0.9, thickness: 0.01, transparent: true, opacity: 0.5 })); lens.scale.set(0.18, 1, 1); lens.position.set(-0.13, YB, 0); scene.add(lens);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.003, 8, 40), M.black); ring.rotation.y = Math.PI / 2; ring.position.copy(lens.position); scene.add(ring);
      rider(XG, YB - 0.075); const holder = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.07, 0.07), M.black); holder.position.set(XG, YB, 0); scene.add(holder);
      // Schirm
      const screen = new THREE.Group(); scene.add(screen);
      const cvs = document.createElement('canvas'); cvs.width = 2048; cvs.height = 128; const sg = cvs.getContext('2d'); const sTex = new THREE.CanvasTexture(cvs); sTex.colorSpace = THREE.SRGBColorSpace;
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(SW, 0.14), new THREE.MeshBasicMaterial({ map: sTex, toneMapped: false })); scr.rotation.y = -Math.PI / 2; screen.add(scr);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.16, SW + 0.02), new THREE.MeshStandardMaterial({ color: 0x77746f, roughness: 0.9 })); back.position.x = 0.006; screen.add(back);
      for (const z of [-0.65, 0.65]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, YB - 0.08, 12), M.steel); r.position.set(0.006, -(YB - 0.08) / 2 - 0.08, z); screen.add(r); const f = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.12), M.housing); f.position.set(0.006, -YB + 0.01, z); screen.add(f); }
      // Strahlen
      const rayMat = () => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      const beamIn = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 1, 8), rayMat()); beamIn.material.opacity = 0.3; scene.add(beamIn);
      const rays = Array.from({ length: 40 }, () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.0009, 0.0009, 1, 6), rayMat()); m.visible = false; scene.add(m); return m; });
      const up = new THREE.Vector3(0, 1, 0);
      const setBeam = (m, a, b) => { const d = b.clone().sub(a), L = d.length(); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(up, d.normalize()); m.scale.set(1, L, 1); };
      // Modell: Niveauschema als Tafel über dem Aufbau, Photonen aus der Lampe
      const lvCv = document.createElement('canvas'); lvCv.width = 760; lvCv.height = 448; const lvc = lvCv.getContext('2d'); lvc.setTransform(2, 0, 0, 2, 0, 0);
      const lvTex = new THREE.CanvasTexture(lvCv); lvTex.colorSpace = THREE.SRGBColorSpace;
      const board = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.224), new THREE.MeshBasicMaterial({ map: lvTex, toneMapped: false, transparent: true, opacity: 0.96, side: THREE.DoubleSide })); board.position.set(0.02, 0.4, -0.32); board.rotation.y = 0.3; scene.add(board);
      const lB = label(THREE, 'Modell: Energieniveaus und Übergänge', { color: '#c7b6ff', size: 0.018 }); lB.position.set(0.02, 0.535, -0.32); scene.add(lB);
      const phPool = glowPool(THREE, scene, 30, 0xffffff, 0.014); const phs = [];
      let ver = -1, lastEv = 0;
      const off = lab.onFrame((dt, t) => {
        const model = MM.model, [r, g, b] = mixColor(S.lamp), col = new THREE.Color(r / 255, g / 255, b / 255), XSc = XG + S.a;
        stepEvents(dt, t);
        if (ver !== S.ver) {
          ver = S.ver; screen.position.set(XSc, YB, 0);
          winMat.color.copy(S.on ? col.clone().multiplyScalar(1.6) : new THREE.Color(0x2a2d30)); lampLight.color.copy(col); lampLight.intensity = S.on ? 0.15 : 0;
          const acc = S.on ? screenBins(lines(), G_TRUE, S.a, SW * 1000, 2048, { kmax: 3, sigma: 1.6, gain: 2.6, bFrac: 0.3 }) : new Float32Array(2048 * 3);
          const im = sg.createImageData(2048, 128);
          for (let i = 0; i < 2048; i++) { const [cr, cg, cb] = binColor(acc, 2047 - i, [40, 40, 38]); for (let y = 0; y < 128; y++) { const v = Math.exp(-(((y - 64) / 40) ** 6)), o = (y * 2048 + i) * 4; im.data[o] = 40 + (cr - 40) * v; im.data[o + 1] = 40 + (cg - 40) * v; im.data[o + 2] = 38 + (cb - 38) * v; im.data[o + 3] = 255; } }
          sg.putImageData(im, 0, 0); sTex.needsUpdate = true;
          setBeam(beamIn, new THREE.Vector3(-0.27, YB, 0), new THREE.Vector3(XG, YB, 0)); beamIn.material.color.copy(col); beamIn.visible = S.on;
          const ms = S.on ? maxima(lines(), G_TRUE, S.a, 2).filter(m => Math.abs(m.x) < SW * 500) : [];
          rays.forEach((m, i) => { const mx = ms[i]; m.visible = !!mx; if (!mx) return; setBeam(m, new THREE.Vector3(XG, YB, 0), new THREE.Vector3(XSc - 0.003, YB, -mx.x / 1000)); const [cr, cg, cb] = mx.k === 0 ? [r, g, b] : lamRGB(mx.nm); m.material.color.setRGB(cr / 255, cg / 255, cb / 255); m.material.opacity = mx.k === 0 ? 0.12 : 0.12 + 0.28 * Math.sqrt(mx.w); });
        }
        board.visible = lB.visible = model;
        if (model) {
          drawLevels(lvc, 380, 224, S.lamp, events, t, lineAtM1()); lvTex.needsUpdate = true;
          // für jeden neuen Übergang ein Photon aus dem Lampenfenster
          for (const ev of events) if (ev.t0 > lastEv && t - ev.t0 > 0.6) { lastEv = ev.t0; phs.push({ nm: ev.line.nm, t0: t, z: (Math.random() - 0.5) * 0.03, y: (Math.random() - 0.5) * 0.06 }); }
        }
        for (let i = phs.length - 1; i >= 0; i--) if (t - phs[i].t0 > 1.2 || !model) phs.splice(i, 1);
        phPool.items.forEach((s, i) => { const p = phs[i]; s.visible = !!p; if (!p) return; const k = (t - p.t0) / 1.2; s.position.set(-0.28 + k * 0.28, YB + p.y * (1 - k), p.z * (1 - k)); const [cr, cg, cb] = lamRGB(p.nm); s.material.color.setRGB(cr / 255, cg / 255, cb / 255); s.material.opacity = 1 - k * 0.5; });
      });
      return { destroy() { off(); lab.dispose(); } };
    }

    const host = viewHost(stage, { id: 'linienspektren', views: { '2d': view2d, '3d': view3d }, initial: '2d', modelInfo: 'Energieniveaus, Übergänge, Photonen' });

    let raf = 0, last = performance.now();
    function loop(now) {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (host.M.model && host.kind === '2d') stepEvents(dt, now / 1000);
      const c = calc(); dDx.set(`${fmt(c.dx, 0)} mm`); dLam.set(`${fmt(c.lam, 1)} nm`); dE.set(`${fmt(c.E, 2)} eV`);
    }
    raf = requestAnimationFrame(loop);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); chB.destroy(); } };
  }
};
