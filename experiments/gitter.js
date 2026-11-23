// ============================================================================
//  Schlüsselexperiment: Optisches Gitter – scharfe Maxima, Wellenlänge, Spektren
//  2D-Aufbau (SVG): Draufsicht mit echten Winkeln und Blick auf den Schirm.
//  Maxima: g·sin α_k = k·λ, Lage x_k = a·tan α_k (große Winkel, keine Kleinwinkelnäherung)
//  Modell: Wellenfeld hinter N Spalten und Zeigerkette aus N Zeigern.
// ============================================================================
import { viewHost } from '../js/lib/views.js';
import { lamRGB, rgbStr, maxima, screenBins, binColor, WHITE } from '../js/lib/optik.js';

const SOURCES = [
  { id: 'rot', name: 'Diodenlaser rot', nm: 635 },
  { id: 'gruen', name: 'Diodenlaser grün', nm: 532 },
  { id: 'violett', name: 'Diodenlaser blau-violett', nm: 405 },
  { id: 'x', name: 'Laser X (unbekannt)', nm: 575 + Math.round(Math.random() * 90) },
  { id: 'weiss', name: 'Glühlampe mit Spalt (weißes Licht)', nm: 0 }
];
const GRATINGS = [100, 300, 600];                                       // Linien pro mm
const G_TOL = new Map(GRATINGS.map(n => [n, 1 + (Math.random() * 0.02 - 0.01)]));
const NBAR = 460, X0 = 60, X1 = 940;

const svgMarkup = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Draufsicht auf Laser, Gitter und Schirm mit den gebeugten Strahlen; darunter das Bild auf dem Schirm mit Maßstab und zwei Messmarkern">
<defs>
  <linearGradient id="gBench" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2024"/><stop offset="1" stop-color="#121518"/></linearGradient>
  <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset=".28" stop-color="#777"/><stop offset=".5" stop-color="#fff"/><stop offset=".72" stop-color="#777"/><stop offset="1" stop-color="#000"/></linearGradient>
  <mask id="gMask" maskUnits="userSpaceOnUse" x="40" y="300" width="920" height="140"><rect x="40" y="300" width="920" height="140" fill="url(#gV)"/></mask>
  <clipPath id="gClip"><rect x="40" y="44" width="920" height="228"/></clipPath>
  <filter id="gGlow"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="gBlur"><feGaussianBlur stdDeviation="0.8"/></filter>
  <filter id="gSh" x="-10%" y="-10%" width="130%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity=".55"/></filter>
</defs>
<rect width="1000" height="620" fill="url(#gBench)"/>
<text x="40" y="34" fill="#8e979d" font-size="13">Draufsicht, maßstäblich: Winkel und Abstände wie im echten Aufbau</text>
<rect x="40" y="44" width="920" height="228" rx="6" fill="#0d1012" stroke="#22282d"/>
<g id="gTop" clip-path="url(#gClip)">
  <g id="gRays" filter="url(#gGlow)"></g>
  <path id="gArc" fill="none" stroke="#ece6dc" stroke-width="1.2"/>
  <text id="gArcT" fill="#ece6dc" font-size="12" font-family="IBM Plex Mono, monospace"></text>
  <line id="gScreen" stroke="#d9d6cf" stroke-width="5"/>
  <line id="gAxis" stroke="#4a545c" stroke-dasharray="4 4"/>
</g>
<g filter="url(#gSh)">
  <rect x="58" y="146" width="118" height="24" rx="5" fill="#2b3034" stroke="#454c52"/>
  <rect x="174" y="152" width="12" height="12" rx="2" fill="#5b6268"/>
</g>
<circle id="gLed" cx="72" cy="158" r="4" fill="#3a1010"/>
<text id="gSrcT" x="118" y="140" fill="#c9c3ba" font-size="11" text-anchor="middle">Laser</text>
<rect x="216" y="128" width="8" height="60" rx="2" fill="#6a7178" filter="url(#gSh)"/>
<text x="220" y="120" fill="#c9c3ba" font-size="11" text-anchor="middle">Gitter</text>
<text id="gGT" x="220" y="204" fill="#8e979d" font-size="11" text-anchor="middle"></text>
<text id="gAT" fill="#ece6dc" font-size="13" text-anchor="middle" font-family="IBM Plex Mono, monospace"></text>
<text id="gMiss" x="950" y="264" fill="#ffb347" font-size="11" text-anchor="end"></text>

<!-- Modell: Wellenbild hinter N Spalten -->
<g id="gWaveG" opacity="0">
  <rect x="34" y="40" width="932" height="236" rx="8" fill="#0a0c0e" stroke="#5a4b8a"/>
  <foreignObject x="40" y="46" width="920" height="224"><canvas xmlns="http://www.w3.org/1999/xhtml" id="gWaveCv" width="460" height="112" style="width:100%;height:100%;display:block"></canvas></foreignObject>
  <text id="gWaveT" x="50" y="66" fill="#c7b6ff" font-size="12"></text>
  <text x="50" y="262" fill="#8e979d" font-size="11">Hell nur dort, wo die Wellen aller Spalte im Gleichtakt ankommen. Schon kleine Abweichungen löschen sich aus.</text>
</g>
<g id="gPhG" opacity="0">
  <rect x="748" y="118" width="208" height="150" rx="8" fill="rgba(10,12,14,.9)" stroke="#323a42"/>
  <text x="760" y="136" fill="#ece6dc" font-size="11.5" font-weight="600">Zeigerkette am Marker 1</text>
  <g id="gPhC" stroke-width="2" stroke-linecap="round"></g><path id="gPhR" stroke="#f2ac74" stroke-width="2.6"/>
  <text id="gPhT" x="760" y="244" fill="#c7c1b7" font-size="11" font-family="IBM Plex Mono, monospace"></text>
  <text id="gPhI" x="760" y="259" fill="#f2ac74" font-size="11" font-family="IBM Plex Mono, monospace"></text>
</g>

<text x="40" y="290" fill="#8e979d" font-size="13">Blick auf den Schirm (Marker ziehen, um Abstände zu messen)</text>
<rect x="40" y="300" width="920" height="140" rx="6" fill="#18191b" stroke="#3b3d3f"/>
<g id="gPattern" mask="url(#gMask)" filter="url(#gBlur)"></g>
<g id="gOrd" font-size="11" fill="#8e979d" text-anchor="middle" font-family="IBM Plex Mono, monospace"></g>
<rect x="40" y="440" width="920" height="54" fill="#efe9dc" stroke="#9c968a"/>
<g id="gRuler" font-family="IBM Plex Mono, monospace" font-size="11" fill="#111"></g>
<g id="gM1" style="cursor:ew-resize">
  <line y1="300" y2="494" stroke="#7fd6a0" stroke-width="1.6"/><rect x="-14" y="496" width="28" height="50" fill="transparent"/>
  <path d="M0 500 l9 14 h-18z" fill="#7fd6a0"/><text y="540" fill="#7fd6a0" font-size="12" text-anchor="middle">1</text>
</g>
<g id="gM2" style="cursor:ew-resize">
  <line y1="300" y2="494" stroke="#ab93ff" stroke-width="1.6"/><rect x="-14" y="496" width="28" height="50" fill="transparent"/>
  <path d="M0 500 l9 14 h-18z" fill="#ab93ff"/><text y="540" fill="#ab93ff" font-size="12" text-anchor="middle">2</text>
</g>
<text id="gDx" x="960" y="590" fill="#ece6dc" font-size="15" text-anchor="end" font-family="IBM Plex Mono, monospace">Δx = –</text>
<text x="40" y="590" fill="#8e979d" font-size="12">Maßstab in mm, Nullpunkt = Maximum 0. Ordnung</text>
</svg>`;

export default {
  intro: 'Ein Gitter hat Hunderte Spalte pro Millimeter. Laserlicht erzeugt dahinter wenige, sehr scharfe und weit auseinanderliegende Lichtpunkte. Aus ihrem Abstand bestimmt ihr die Wellenlänge. Weißes Licht wird in farbige Spektren zerlegt.',
  docs: {
    durchfuehrung: `
<h3>Aufbau</h3>
<p>Auf der optischen Bank stehen ein Laser, ein Diahalter mit dem Gitter und ein breiter weißer Schirm im Abstand <i>a</i>. Auf dem Gitter steht die Zahl der Linien pro Millimeter, zum Beispiel 300/mm. Daraus folgt die Gitterkonstante <i>g</i> = 1 mm / 300 ≈ 3,33 µm. Für weißes Licht ersetzt man den Laser durch eine Glühlampe mit Kondensor, Spalt und Linse.</p>
<h3>Durchführung</h3>
<ol>
<li>Laser einschalten und senkrecht auf das Gitter richten. Nie in den Strahl blicken.</li>
<li>Schirmabstand <i>a</i> einstellen und messen. Beim 600er-Gitter liegen die Maxima weit außen: Den Ausschnitt des Schirms entsprechend wählen.</li>
<li>Ordnung <i>k</i> wählen. Marker 1 auf das linke, Marker 2 auf das rechte Maximum dieser Ordnung ziehen.</li>
<li><b>Messwert übernehmen.</b> Aus Δx folgt <i>x<sub>k</sub></i> = Δx/2, daraus der Winkel und die Wellenlänge.</li>
<li>Mit anderen Gittern, Ordnungen und Abständen wiederholen. Danach Laser X ausmessen und weißes Licht ansehen.</li>
</ol>
<div class="callout">Sicherheit: Laser der Klasse 2. Am Gitter entstehen mehrere Strahlen in verschiedene Richtungen. Kopf nicht in Strahlhöhe bringen.</div>`,
    theorie: `
<h3>Gangunterschied benachbarter Spalte</h3>
<p>Benachbarte Spalte haben den Abstand <i>g</i>. In Richtung <i>α</i> hat Licht aus zwei Nachbarspalten den Gangunterschied <i>Δs = g·sin α</i>. Ist er ein Vielfaches von <i>λ</i>, kommen die Wellen aller Spalte im Gleichtakt an.</p>
<span class="formula">Maxima: g·sin α<sub>k</sub> = k·λ    (k = 0, 1, 2, …)</span>
<h3>Auswertung am ebenen Schirm</h3>
<p>Am Gitter sind die Winkel groß. Die Kleinwinkelnäherung ist hier falsch. Man rechnet exakt:</p>
<span class="formula">tan α<sub>k</sub> = x<sub>k</sub> / a    ⇒    λ = g·sin α<sub>k</sub> / k</span>
<p>Beispiel: 600/mm, rotes Licht, a = 1 m. Das 1. Maximum liegt bei x ≈ 41 cm, also α ≈ 22°. Die Näherung sin α ≈ tan α ergäbe λ etwa 8 % zu groß.</p>
<h3>Warum sind die Maxima so scharf?</h3>
<p>Bei zwei Spalten wird die Helligkeit langsam schwächer, wenn man sich vom Maximum entfernt. Bei <i>N</i> Spalten reicht schon eine kleine Abweichung: Der Gangunterschied zwischen dem ersten und dem letzten Spalt beträgt dann eine ganze Wellenlänge, und die Wellen löschen sich paarweise aus. Die Breite eines Maximums nimmt mit 1/<i>N</i> ab. Ein Laserfleck beleuchtet einige Hundert Spalte.</p>
<span class="formula">I(α) = I₀ · [ sin(N·φ/2) / (N·sin(φ/2)) ]²   mit   φ = 2π·g·sin α / λ</span>
<h3>Spektren</h3>
<p>Weißes Licht enthält alle Wellenlängen. Jede Farbe hat ihr eigenes Maximum: Violett wird am wenigsten, Rot am stärksten gebeugt. Das Maximum 0. Ordnung bleibt weiß. Ab der 2. Ordnung überlappen die Spektren: Das Violett der 3. Ordnung liegt schon im Rot der 2. Ordnung.</p>
<h3>Modellgrenzen</h3>
<ul><li>Die Gitterkonstante weicht um bis zu ±1 % vom Aufdruck ab.</li><li>Die Helligkeit der Ordnungen folgt einer einfachen Hüllkurve (Spaltbreite ≈ 0,32·g).</li></ul>
<h3>Was die Modellansicht zeigt</h3><ul><li><b>Wellenbild</b> (Draufsicht, λ stark vergrößert): Hinter N Spalten überlagern sich N Elementarwellen. Nur in wenigen Richtungen entsteht Helligkeit. Mit dem Regler N seht ihr, wie die Richtungen schärfer werden.</li><li><b>Zeigerkette:</b> Jeder Spalt liefert einen Zeiger. Benachbarte Zeiger sind um φ = 2π·Δs/λ gedreht. Im Maximum liegen alle in einer Linie. Schon kurz daneben rollt sich die Kette zu einem Kreis zusammen, und der Summenzeiger wird null.</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Laser</td><td>635 nm · 532 nm · 405 nm, Klasse 2, &lt; 1 mW</td></tr>
<tr><td>Gitter (Dia)</td><td>100 · 300 · 600 Linien/mm</td></tr>
<tr><td>Glühlampe</td><td>12 V, mit Kondensor, Spalt und Linse f = 100 mm</td></tr>
<tr><td>Schirmabstand</td><td>0,20 … 1,50 m</td></tr>
<tr><td>Schirm</td><td>weiß, 2 m breit, mm-Teilung</td></tr>
</tbody></table>`,
    abi: `
<details class="q"><summary>Ein Gitter mit 500 Linien/mm wird mit grünem Licht (532 nm) beleuchtet. Wie viele Maxima gibt es höchstens? <span class="op">AFB II</span></summary><p>g = 2,0 µm. Aus sin α ≤ 1 folgt k ≤ g/λ = 3,76. Also k = 0, ±1, ±2, ±3: höchstens 7 Maxima.</p></details>
<details class="q"><summary>Bei a = 0,80 m und 300/mm liegen die beiden Maxima 1. Ordnung 32,6 cm auseinander. Berechne λ exakt und mit der Kleinwinkelnäherung. <span class="op">AFB II</span></summary><p>x₁ = 16,3 cm, tan α = 0,2038, α = 11,52°, sin α = 0,1997. λ = g·sin α = 3,333 µm · 0,1997 ≈ 666 nm. Näherung: λ ≈ g·x/a = 679 nm, also 2 % zu groß.</p></details>
<details class="q"><summary>Begründe, warum das Gitter genauere Messungen als der Doppelspalt erlaubt. <span class="op">AFB II</span></summary><p>Die Maxima sind sehr schmal und hell, ihre Mitte lässt sich genau festlegen. Sie liegen außerdem weit auseinander. Beides verkleinert den relativen Ablesefehler.</p></details>
<details class="q"><summary>Zeige, dass sich das Spektrum 2. und 3. Ordnung für sichtbares Licht (400–750 nm) überlappt. <span class="op">AFB III</span></summary><p>Rotes Ende 2. Ordnung: sin α = 2·750 nm/g = 1500 nm/g. Violettes Ende 3. Ordnung: sin α = 3·400 nm/g = 1200 nm/g. Da 1200 &lt; 1500, beginnt die 3. Ordnung vor dem Ende der 2. Ordnung, unabhängig von g.</p></details>
<details class="q"><summary>Erkläre mit Zeigern, warum ein Maximum schmaler wird, wenn mehr Spalte beleuchtet sind. <span class="op">AFB III</span></summary><p>N Zeiger, je um φ gedreht. Der Summenzeiger wird null, wenn sich die Kette schließt: N·φ = 2π. Die erste Nullstelle neben dem Maximum liegt also bei φ = 2π/N. Je größer N, desto kleiner dieser Winkelabstand.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, selectBox, segmented, check, button, fmt, dataTable, toast, display } = ui;
    const S = { src: SOURCES[0], lpm: 300, a: 1.0, span: 1000, on: true, k: 1, m1: -150, m2: 150, ver: 0, N: 6 };
    const gM = () => 1e-3 / S.lpm * G_TOL.get(S.lpm);                    // echte Gitterkonstante in m
    const lines = () => S.src.id === 'weiss' ? WHITE : [{ nm: S.src.nm, w: 1 }];
    const white = () => S.src.id === 'weiss';
    const changed = () => { S.ver++; };

    // ---- Bedienfeld ----
    const gL = group('Lichtquelle', { led: true }); gL.led(true);
    const cOn = check({ label: 'Lichtquelle eingeschaltet', checked: true, onChange: v => { S.on = v; gL.led(v); changed(); } });
    const sSrc = selectBox({ label: 'Lichtquelle', value: 'rot', options: SOURCES.map(s => ({ value: s.id, label: s.id === 'x' || s.id === 'weiss' ? s.name : `${s.name} (${s.nm} nm)` })), onChange: v => { S.src = SOURCES.find(s => s.id === v); changed(); } });
    gL.append(cOn, sSrc);
    const gA = group('Aufbau');
    const sG = selectBox({ label: 'Gitter', value: S.lpm, options: GRATINGS.map(n => ({ value: n, label: `${n} Linien/mm (g = ${fmt(1000 / n, 2)} µm)` })), onChange: v => { S.lpm = +v; changed(); } });
    const sA = slider({ label: 'Schirmabstand a', min: 0.2, max: 1.5, step: 0.01, value: S.a, unit: 'm', digits: 2, onInput: v => { S.a = v; changed(); } });
    const segSpan = segmented({ value: 1000, options: [{ value: 200, label: '±10 cm' }, { value: 600, label: '±30 cm' }, { value: 1000, label: '±50 cm' }, { value: 2000, label: '±1 m' }], onChange: v => { const f = v / S.span; S.span = v; S.m1 = Math.max(-v / 2, Math.min(v / 2, S.m1 * f)); S.m2 = Math.max(-v / 2, Math.min(v / 2, S.m2 * f)); changed(); } });
    gA.append(sG, sA, el('div', { class: 'ctl' }, el('label', { style: 'grid-column:1/-1' }, 'Ausschnitt des Schirms'), el('div', { style: 'grid-column:1/-1' }, segSpan)));
    const gMs = group('Messung mit den Markern');
    const sK = slider({ label: 'Ordnung k (Marker auf −k und +k)', min: 1, max: 4, step: 1, value: 1, onInput: v => { S.k = v; S.ver++; } });
    const dDx = display('Δx (Marker 1 → 2)'), dAl = display('α_k = arctan(Δx / 2a)'), dLam = display('λ = g·sin α_k / k');
    gMs.append(sK, dDx, dAl, dLam, el('div', { class: 'bar' }, button('Messwert übernehmen', () => take(), 'btn small primary')),
      el('p', { class: 'muted', style: 'font-size:12.5px;margin:8px 0 0' }, 'Marker im 2D-Aufbau ziehen oder anklicken und mit den Pfeiltasten verschieben (Umschalt = 1 mm).'));
    const gN = group('Modell: Spaltanzahl N');
    const sN = slider({ label: 'beleuchtete Spalte im Modell', min: 2, max: 12, step: 1, value: S.N, onInput: v => { S.N = v; drawNChart(); } });
    gN.append(el('p', { class: 'muted', style: 'font-size:12.5px;margin:0 0 6px' }, 'Im echten Versuch sind es einige Hundert. N = 2 ist der Doppelspalt.'), sN);
    controls.append(gL, gA, gMs, gN);

    // ---- Messwerte ----
    const rows = [];
    const tbl = dataTable([
      { key: 'src', label: 'Quelle', fmt: v => v }, { key: 'lpm', label: 'Linien/mm', digits: 0 }, { key: 'a', label: 'a in m', digits: 2 },
      { key: 'k', label: 'k', digits: 0 }, { key: 'dx', label: 'Δx in mm', digits: 0 }, { key: 'al', label: 'α in °', digits: 2 },
      { key: 'lam', label: 'λ in nm', fmt: v => fmt(v * 1e9, 0) }, { key: 'lamN', label: 'λ genähert', fmt: v => fmt(v * 1e9, 0) }
    ], { onDelete: i => { rows.splice(i, 1); redraw(); } });
    const figL = el('div', { class: 'fig' }), figN = el('div', { class: 'fig' });
    const chL = new Chart(figL, { xlabel: 'k · Linien pro mm', ylabel: 'sin α_k' });
    const chN = new Chart(figN, { xlabel: 'Gangunterschied benachbarter Spalte Δs / λ', ylabel: 'I / I₀', ymin: 0, ymax: 1.05, xmin: -0.25, xmax: 2.25, includeZero: false });
    const resL = el('div', { class: 'result' });
    messwerte.append(
      el('div', { class: 'data' },
        el('div', { class: 'chartbox' }, el('h4', {}, 'Auswertung: sin α über k · Linienzahl'), figL, resL,
          csvTools(() => ({ meta: ['Optisches Gitter – Wellenlängenbestimmung'], columns: [{ key: 'src', label: 'Quelle' }, { key: 'lpm', label: 'Linien pro mm' }, { key: 'a', label: 'a in m' }, { key: 'k', label: 'k' }, { key: 'dx', label: 'Delta x in mm' }, { key: 'al', label: 'alpha in Grad' }, { key: 'lam', label: 'lambda in m' }, { key: 'lamN', label: 'lambda Kleinwinkel in m' }], rows }), 'gitter_messreihe')),
        el('div', { class: 'chartbox' }, el('h4', {}, 'Modell: Helligkeit hinter N Spalten'), figN,
          el('p', { class: 'muted', style: 'font-size:13px;margin:8px 0 0' }, 'Grau gestrichelt: Doppelspalt (N = 2). Die Maxima liegen an derselben Stelle, werden mit wachsendem N aber schmaler.'))),
      el('div', { style: 'height:14px' }), tbl,
      el('div', { class: 'bar', style: 'margin-top:12px' }, button('Wellenlänge von Laser X aufdecken', () => toast(`Laser X: λ = ${SOURCES[3].nm} nm`, 5000))));
    const nI = (N, u) => { const ph = Math.PI * u; const d = Math.sin(ph); return Math.abs(d) < 1e-6 ? 1 : (Math.sin(N * ph) / (N * d)) ** 2; };
    function drawNChart() {
      const p2 = [], pN = []; for (let i = 0; i <= 800; i++) { const u = -0.25 + 2.5 * i / 800; p2.push([u, nI(2, u)]); pN.push([u, nI(S.N, u)]); }
      chN.set([{ points: p2, color: '#6b747b', width: 1.2 }, { points: pN, color: '#f2ac74', name: `N = ${S.N}` }]);
    }
    drawNChart();
    function redraw() {
      tbl.render(rows);
      const cols = { rot: '#ff6a5a', 'grün': '#7fd67f', 'blau-violett': '#9d8cff', X: '#f2ac74' };
      const ids = [...new Set(rows.map(r => r.src))], series = [], fits = []; let txt = '';
      for (const id of ids) {
        const pts = rows.filter(r => r.src === id).map(r => [r.k * r.lpm, Math.sin(r.al * Math.PI / 180)]);
        series.push({ name: id, color: cols[id] || '#86dcff', mode: 'dot', points: pts });
        if (pts.length >= 2) { const f = fit.propFit(pts.map(p => p[0]), pts.map(p => p[1])); if (!f) continue; fits.push({ f: f.f, color: cols[id] || '#86dcff' }); txt += `<div><span>${id}: Steigung = λ</span><br><b>${fmt(f.a * 1e6, 0)} nm</b> <span>· R² = ${fmt(f.r2, 4)}</span></div>`; }
      }
      chL.set(series, fits); resL.innerHTML = txt || '<span>Mindestens zwei Messungen je Laser (andere Ordnung oder anderes Gitter) für die Ursprungsgerade.</span>';
    }
    redraw();
    const calc = () => { const dx = Math.abs(S.m2 - S.m1), al = Math.atan(dx / 2 / 1000 / S.a); return { dx, al, lam: gM() * Math.sin(al) / S.k, lamN: (1e-3 / S.lpm) * (dx / 2 / 1000) / S.a / S.k }; };
    function take() {
      if (!S.on) { toast('Die Lichtquelle ist ausgeschaltet.'); return; }
      if (white()) { toast('Weißes Licht hat keine einzelne Wellenlänge. Für Messungen einen Laser wählen.'); return; }
      const c = calc(); if (c.dx < 1) { toast('Die Marker liegen aufeinander. Erst die beiden Maxima der Ordnung k markieren.'); return; }
      const name = S.src.id === 'x' ? 'X' : S.src.name.replace('Diodenlaser ', '');
      // λ ohne Fertigungsfehler aus Sicht der Schüler: g laut Aufdruck
      const lam = (1e-3 / S.lpm) * Math.sin(c.al) / S.k;
      rows.push({ src: name, lpm: S.lpm, a: S.a, k: S.k, dx: c.dx, al: c.al * 180 / Math.PI, lam, lamN: c.lamN }); redraw();
      toast(`Übernommen: α = ${fmt(c.al * 180 / Math.PI, 1)}°, λ ≈ ${fmt(lam * 1e9, 0)} nm (genähert ${fmt(c.lamN * 1e9, 0)} nm)`);
    }
    // sichtbares g/λ im Modell (Reihenfolge bleibt erhalten, Winkel bleiben erkennbar)
    const gVis = () => { const r = gM() / ((white() ? 560 : S.src.nm) * 1e-9); return 1.6 + 3.4 * Math.min(1, Math.max(0, (r - 1.4) / (25 - 1.4))); };

    // ======================= Ansicht 2D =======================
    async function view2d(box, MM) {
      box.insertAdjacentHTML('beforeend', svgMarkup());
      const svg = box.querySelector('svg'), q = id => svg.querySelector('#' + id), NS = 'http://www.w3.org/2000/svg';
      const pat = q('gPattern'), bars = [], bw = (X1 - X0) / NBAR;
      for (let i = 0; i < NBAR; i++) { const r = document.createElementNS(NS, 'rect'); r.setAttribute('x', (X0 + i * bw).toFixed(2)); r.setAttribute('y', 300); r.setAttribute('width', (bw + 0.6).toFixed(2)); r.setAttribute('height', 140); pat.append(r); bars.push(r); }
      const xToSvg = mm => 500 + mm * (X1 - X0) / S.span, svgToX = sx => (sx - 500) * S.span / (X1 - X0);
      const cv = q('gWaveCv'), cx = cv.getContext('2d'), W = cv.width, Hc = cv.height, img = cx.createImageData(W, Hc);
      function drawRuler() {
        const step = S.span <= 200 ? 2 : S.span <= 600 ? 5 : S.span <= 1000 ? 10 : 20, lab = step * 5; let h = '';
        for (let mm = -S.span / 2; mm <= S.span / 2 + 1e-9; mm += step) { const x = xToSvg(mm), major = Math.abs(mm % lab) < 1e-9; h += `<rect x="${(x - 0.5).toFixed(1)}" y="440" width="1" height="${major ? 18 : 8}"/>`; if (major) h += `<text x="${x.toFixed(1)}" y="475" text-anchor="middle">${mm}</text>`; }
        q('gRuler').innerHTML = h;
      }
      function drawTop() {
        const CY = 158, GX = 220, ppm = Math.min(700 / S.a, 104 / (S.span / 2000)), sx = GX + S.a * ppm;
        const half = S.span / 2000 * ppm;
        q('gScreen').setAttribute('x1', sx); q('gScreen').setAttribute('x2', sx); q('gScreen').setAttribute('y1', CY - half); q('gScreen').setAttribute('y2', CY + half);
        q('gAxis').setAttribute('x1', 186); q('gAxis').setAttribute('x2', 960); q('gAxis').setAttribute('y1', CY); q('gAxis').setAttribute('y2', CY);
        q('gGT').textContent = `${S.lpm}/mm`; q('gSrcT').textContent = white() ? 'Glühlampe' : S.src.id === 'x' ? 'Laser X' : `${S.src.nm} nm`;
        q('gLed').setAttribute('fill', S.on ? (white() ? '#ffd27a' : rgbStr(S.src.nm)) : '#3a1010');
        q('gAT').setAttribute('x', (GX + sx) / 2); q('gAT').setAttribute('y', 262); q('gAT').textContent = `a = ${fmt(S.a, 2)} m`;
        let h = '', miss = 0, first = null;
        if (S.on) {
          h += `<line x1="186" y1="${CY}" x2="${GX}" y2="${CY}" stroke="${white() ? '#fff4dc' : rgbStr(S.src.nm)}" stroke-width="2.4"/>`;
          const ms = maxima(white() ? WHITE.filter((_, i) => i % 7 === 0) : lines(), gM(), S.a, 6);
          for (const m of ms) {
            const onScreen = Math.abs(m.x) <= S.span / 2, L = onScreen ? S.a * ppm / Math.cos(m.alpha) : 1400;
            const ex = GX + L * Math.cos(m.alpha), ey = CY - L * Math.sin(m.alpha);
            if (!onScreen) miss++;
            h += `<line x1="${GX}" y1="${CY}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="${rgbStr(m.nm)}" stroke-width="${m.k === 0 ? 2 : 1.4}" opacity="${white() ? 0.55 : onScreen ? 0.9 : 0.35}"/>`;
            if (m.k === 1 && !first) first = m;
          }
          if (first && !white()) {
            const r = 70; q('gArc').setAttribute('d', `M${GX + r} ${CY} A${r} ${r} 0 0 0 ${(GX + r * Math.cos(first.alpha)).toFixed(1)} ${(CY - r * Math.sin(first.alpha)).toFixed(1)}`);
            q('gArcT').setAttribute('x', GX + r + 8); q('gArcT').setAttribute('y', CY - 10); q('gArcT').textContent = `α₁ = ${fmt(first.alpha * 180 / Math.PI, 1)}°`;
          } else { q('gArc').setAttribute('d', ''); q('gArcT').textContent = ''; }
        } else { q('gArc').setAttribute('d', ''); q('gArcT').textContent = ''; }
        q('gRays').innerHTML = h;
        q('gMiss').textContent = miss && !white() ? `${miss} Strahlen gehen am Schirm vorbei` : '';
      }
      function drawPattern() {
        const acc = S.on ? screenBins(lines(), gM(), S.a, S.span, NBAR, { sigma: white() ? 2.2 : 1.5, gain: white() ? 1.6 : 2.6 }) : new Float32Array(NBAR * 3);
        for (let i = 0; i < NBAR; i++) { const [r, g, b] = binColor(acc, i); bars[i].setAttribute('fill', `rgb(${r},${g},${b})`); }
        let h = '';
        if (S.on && !white()) for (const m of maxima(lines(), gM(), S.a, 6)) if (Math.abs(m.x) <= S.span / 2 - 4) h += `<text x="${xToSvg(m.x).toFixed(1)}" y="316">${m.k}</text>`;
        q('gOrd').innerHTML = h;
      }
      function drawMarkers() {
        for (const [id, v] of [['gM1', S.m1], ['gM2', S.m2]]) q(id).setAttribute('transform', `translate(${xToSvg(v).toFixed(1)} 0)`);
        const c = calc(); q('gDx').textContent = `Δx = ${fmt(c.dx, 0)} mm   ·   k = ${S.k}   ·   α = ${fmt(c.al * 180 / Math.PI, 2)}°`;
      }
      function drawWaves(t) {
        const nm = white() ? 560 : S.src.nm, [r, g, b] = white() ? [255, 240, 215] : lamRGB(nm);
        const N = S.N, lamPx = 9, gPx = gVis() * lamPx, sx0 = 64, cy = Hc / 2, k = 2 * Math.PI / lamPx, w = 2 * Math.PI * 1.1;
        const ys = Array.from({ length: N }, (_, j) => cy + (j - (N - 1) / 2) * gPx);
        const d = img.data; let i = 0;
        for (let y = 0; y < Hc; y++) for (let x = 0; x < W; x++, i += 4) {
          let a;
          if (x < sx0) a = Math.cos(k * x - w * t);
          else if (x < sx0 + 2) { let inS = false; for (const yy of ys) if (Math.abs(y - yy) < 1.2) inS = true; if (!inS) { d[i] = 70; d[i + 1] = 76; d[i + 2] = 82; d[i + 3] = 255; continue; } a = Math.cos(k * x - w * t); }
          else { a = 0; let rs = 0; for (const yy of ys) { const rr = Math.hypot(x - sx0, y - yy); a += Math.cos(k * rr - w * t); rs += rr; } a = a / N * Math.min(1.6, 10 / Math.sqrt(rs / N + 1)) * Math.sqrt(N) * 0.7; }
          const v = Math.max(0, a) ** 1.4, n = Math.max(0, -a) * 0.15;
          d[i] = 10 + r * v + 20 * n; d[i + 1] = 12 + g * v + 24 * n; d[i + 2] = 14 + b * v + 30 * n; d[i + 3] = 255;
        }
        cx.putImageData(img, 0, 0);
        // Richtungen der Maxima im Modellmaßstab einzeichnen
        cx.strokeStyle = 'rgba(255,255,255,.35)'; cx.setLineDash([2, 4]); cx.beginPath();
        for (let kk = -3; kk <= 3; kk++) { const s = kk / gVis(); if (Math.abs(s) >= 1) continue; const al = Math.asin(s); cx.moveTo(sx0, cy); cx.lineTo(sx0 + 400 * Math.cos(al), cy - 400 * Math.sin(al)); }
        cx.stroke(); cx.setLineDash([]);
        q('gWaveT').textContent = `Modell (Draufsicht, λ stark vergrößert): ebene Welle → ${N} Spalte → ${N} Elementarwellen. Gepunktet: Richtungen der Maxima`;
      }
      function drawPhasor() {
        const nm = white() ? 560 : S.src.nm, sinA = Math.sin(Math.atan((S.m1 / 1000) / S.a)), ds = gM() * sinA / (nm * 1e-9), ph = 2 * Math.PI * ds, N = S.N;
        const L = 100 / N; let x = 790, y = 196, h = '';
        const hue = j => `hsl(${200 + j * 120 / N},70%,70%)`;
        for (let j = 0; j < N; j++) { const nx = x + L * Math.cos(j * ph), ny = y - L * Math.sin(j * ph); h += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} L${nx.toFixed(1)} ${ny.toFixed(1)}" stroke="${hue(j)}"/>`; x = nx; y = ny; }
        q('gPhC').innerHTML = h; q('gPhR').setAttribute('d', `M790 196 L${x.toFixed(1)} ${y.toFixed(1)}`);
        q('gPhT').textContent = `Δs = ${fmt(ds, 2)}·λ   N = ${N}`; q('gPhI').textContent = `I/I₀ = ${fmt(nI(N, ds), 2)}`;
      }
      let drag = null;
      const toSvgX = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()).x; };
      for (const [id, key] of [['gM1', 'm1'], ['gM2', 'm2']]) {
        const m = q(id); m.addEventListener('pointerdown', e => { drag = key; svg.setPointerCapture(e.pointerId); e.preventDefault(); });
        m.setAttribute('tabindex', '0'); m.setAttribute('role', 'slider'); m.setAttribute('aria-label', `Marker ${key.slice(1)}`);
        m.addEventListener('keydown', e => { const d = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0; if (!d) return; e.preventDefault(); S[key] = Math.max(-S.span / 2, Math.min(S.span / 2, +(S[key] + d * (e.shiftKey ? 1 : 0.2)).toFixed(1))); S.ver++; });
      }
      svg.addEventListener('pointermove', e => { if (!drag) return; S[drag] = Math.round(Math.max(-S.span / 2, Math.min(S.span / 2, svgToX(toSvgX(e)))) * 2) / 2; S.ver++; });
      svg.addEventListener('pointerup', () => { drag = null; });
      let raf = 0, ver = -1; const t0 = performance.now();
      function frame(now) {
        raf = requestAnimationFrame(frame);
        const model = MM.model;
        if (ver !== S.ver) { ver = S.ver; drawTop(); drawRuler(); drawPattern(); drawMarkers(); }
        q('gWaveG').setAttribute('opacity', model ? 1 : 0); q('gPhG').setAttribute('opacity', model ? 1 : 0);
        if (model) { drawWaves((now - t0) / 1000); drawPhasor(); }
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); } };
    }

    // ======================= Ansicht 3D =======================
    async function view3d(box, MM) {
      const { createLab, mats, label } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [-0.35, 0.75, 1.25], target: [0.55, 0.12, 0], table: [3, 2.2], bloom: [0.9, 0.45, 0.8], room: 0.22, minDist: 0.2, maxDist: 4, fov: 40 });
      const { THREE, scene } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad · Gemessen wird im 2D-Aufbau</div>');
      const YB = 0.16, XG = 0.0, SW = 2.0;
      const rail = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.03, 0.08), new THREE.MeshStandardMaterial({ color: 0x6c7378, metalness: 0.9, roughness: 0.35 })); rail.position.set(0.5, 0.015, 0); rail.castShadow = rail.receiveShadow = true; scene.add(rail);
      const rider = (x, h) => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.025, 0.1), M.housing); b.position.y = 0.042; const r = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, h, 16), M.steel); r.position.y = 0.055 + h / 2; g.add(b, r); g.position.x = x; scene.add(g); return g; };
      // Lichtquelle (Laser bzw. Lampengehäuse)
      rider(-0.3, YB - 0.075);
      const laser = new THREE.Group(); laser.position.set(-0.3, YB, 0); scene.add(laser);
      const lb = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.14, 32), new THREE.MeshStandardMaterial({ color: 0x2b3034, metalness: 0.6, roughness: 0.35 })); lb.rotation.z = Math.PI / 2; lb.castShadow = true; laser.add(lb);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.09), M.housing); lamp.position.x = -0.02; lamp.castShadow = true; laser.add(lamp);
      const ap = new THREE.Mesh(new THREE.CircleGeometry(0.004, 16), new THREE.MeshBasicMaterial({ color: 0xff2020, toneMapped: false })); ap.rotation.y = Math.PI / 2; ap.position.x = 0.071; laser.add(ap);
      // Gitter im Diahalter
      rider(XG, YB - 0.075);
      const holder = new THREE.Group(); holder.position.set(XG, YB, 0); scene.add(holder);
      holder.add(new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.07, 0.07), M.black));
      const gridTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#9aa6b0'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#5c6670'; for (let i = 0; i < 128; i += 2) g.fillRect(i, 0, 1, 128); return new THREE.CanvasTexture(c); })();
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.036, 0.036), new THREE.MeshStandardMaterial({ map: gridTex, metalness: 0.9, roughness: 0.15, transparent: true, opacity: 0.85 })); glass.rotation.y = -Math.PI / 2; glass.position.x = -0.0035; holder.add(glass);
      // breiter Schirm
      const screen = new THREE.Group(); scene.add(screen);
      const cvs = document.createElement('canvas'); cvs.width = 2048; cvs.height = 128; const sg = cvs.getContext('2d'); const sTex = new THREE.CanvasTexture(cvs); sTex.colorSpace = THREE.SRGBColorSpace;
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(SW, 0.12), new THREE.MeshBasicMaterial({ map: sTex, toneMapped: false })); scr.rotation.y = -Math.PI / 2; screen.add(scr);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.14, SW + 0.02), new THREE.MeshStandardMaterial({ color: 0x8d8a84, roughness: 0.9 })); back.position.x = 0.006; screen.add(back);
      for (const z of [-0.8, 0.8]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, YB - 0.07, 12), M.steel); r.position.set(0.006, -(YB - 0.07) / 2 - 0.07, z); screen.add(r); const f = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.12), M.housing); f.position.set(0.006, -YB + 0.01, z); screen.add(f); }
      // Strahlen: Laser = einzelne Zylinder, Weißlicht = farbige Fächer
      const beamIn = new THREE.Mesh(new THREE.CylinderGeometry(0.0013, 0.0013, 1, 8), new THREE.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      scene.add(beamIn);
      const rays = Array.from({ length: 13 }, () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.0011, 0.0011, 1, 6), new THREE.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); m.visible = false; scene.add(m); return m; });
      const up = new THREE.Vector3(0, 1, 0);
      const setBeam = (m, a, b) => { const d = b.clone().sub(a), L = d.length(); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(up, d.normalize()); m.scale.set(1, L, 1); };
      const fanGeo = new THREE.BufferGeometry(), fan = new THREE.Mesh(fanGeo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); scene.add(fan);
      // Modell: Wellenfeld hinter N Spalten (Shader)
      const waveMat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
        uniforms: { t: { value: 0 }, col: { value: new THREE.Color(1, 0.2, 0.2) }, lam: { value: 0.012 }, g: { value: 0.04 }, n: { value: 6 } },
        vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
        fragmentShader: `uniform float t; uniform vec3 col; uniform float lam; uniform float g; uniform float n; varying vec2 vP;
          void main(){ float x = vP.x + 0.25; float y = vP.y; float k = 6.2831/lam; float a = 0.0;
            for (int j = 0; j < 12; j++) { if (float(j) >= n) break; float yj = (float(j) - (n - 1.0) * 0.5) * g; a += cos(k*length(vec2(x, y - yj)) - 7.0*t); }
            a /= sqrt(n) * 1.4;
            float fade = smoothstep(0.0, 0.01, x) * (1.0 - smoothstep(0.38, 0.5, x)) * (1.0 - smoothstep(0.18, 0.25, abs(y)));
            float v = pow(max(a, 0.0), 1.6);
            gl_FragColor = vec4(col * v * 1.3, min(1.0, v * 0.8) * fade); }`
      });
      const wave = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), waveMat); wave.rotation.x = -Math.PI / 2; wave.position.set(XG + 0.25 - 0.0, YB - 0.03, 0); scene.add(wave);
      const lW = label(THREE, 'Modell: Wellen hinter N Spalten (λ stark vergrößert)', { color: '#c7b6ff', size: 0.024 }); lW.position.set(0.2, YB + 0.07, -0.22); scene.add(lW);
      let ver = -1, nLast = -1;
      const off = lab.onFrame((dt, t) => {
        const model = MM.model, isW = white(), nm = isW ? 560 : S.src.nm, [r, g, b] = isW ? [255, 244, 225] : lamRGB(nm);
        const col = new THREE.Color(r / 255, g / 255, b / 255), XSc = XG + S.a;
        if (ver !== S.ver) {
          ver = S.ver;
          screen.position.set(XSc, YB, 0);
          lb.visible = !isW; lamp.visible = isW; ap.material.color.copy(col);
          // Schirmtextur
          const acc = S.on ? screenBins(lines(), gM(), S.a, SW * 1000, 2048, { sigma: isW ? 2.4 : 2.2, gain: isW ? 1.6 : 2.6 }) : new Float32Array(2048 * 3);
          const im = sg.createImageData(2048, 128);
          for (let i = 0; i < 2048; i++) { const [cr, cg, cb] = binColor(acc, 2047 - i, [62, 61, 58]); for (let y = 0; y < 128; y++) { const v = Math.exp(-(((y - 64) / 34) ** 4)), o = (y * 2048 + i) * 4; im.data[o] = 62 + (cr - 62) * v; im.data[o + 1] = 61 + (cg - 61) * v; im.data[o + 2] = 58 + (cb - 58) * v; im.data[o + 3] = 255; } }
          sg.putImageData(im, 0, 0); sTex.needsUpdate = true;
          setBeam(beamIn, new THREE.Vector3(-0.23, YB, 0), new THREE.Vector3(XG, YB, 0)); beamIn.material.color.copy(col);
          const ms = S.on && !isW ? maxima(lines(), gM(), S.a, 6).filter(m => Math.abs(m.x) < SW * 500) : [];
          rays.forEach((m, i) => { const mx = ms[i]; m.visible = !!mx; if (!mx) return; setBeam(m, new THREE.Vector3(XG, YB, 0), new THREE.Vector3(XSc - 0.003, YB, -mx.x / 1000)); m.material.color.copy(col); m.material.opacity = mx.k === 0 ? 0.9 : 0.75; });
          // Weißlicht-Fächer
          const pos = [], cols = [];
          if (S.on && isW) for (let k = -3; k <= 3; k++) { if (!k) continue; for (let i = 0; i < 30; i++) { const n1 = 400 + i * 10, n2 = n1 + 10, s1 = k * n1 * 1e-9 / gM(), s2 = k * n2 * 1e-9 / gM(); if (Math.abs(s2) >= 0.99) continue; const z1 = -S.a * Math.tan(Math.asin(s1)), z2 = -S.a * Math.tan(Math.asin(s2)); if (Math.abs(z1) > SW / 2) continue; pos.push(XG, YB, 0, XSc - 0.003, YB, z1, XSc - 0.003, YB, z2); const [cr, cg, cb] = lamRGB(n1 + 5); for (let v = 0; v < 3; v++) cols.push(cr / 255, cg / 255, cb / 255); } }
          if (S.on && isW) { pos.push(XG, YB, 0, XSc - 0.003, YB + 0.004, 0, XSc - 0.003, YB - 0.004, 0); for (let v = 0; v < 3; v++) cols.push(1, 1, 1); }
          fanGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); fanGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); fanGeo.computeBoundingSphere();
          beamIn.visible = S.on;
        }
        if (nLast !== S.N) { nLast = S.N; waveMat.uniforms.n.value = S.N; }
        wave.visible = lW.visible = model && S.on; waveMat.uniforms.t.value = t; waveMat.uniforms.col.value.copy(col);
        waveMat.uniforms.g.value = gVis() * 0.012;
      });
      return { destroy() { off(); lab.dispose(); } };
    }

    const host = viewHost(stage, { id: 'gitter', views: { '2d': view2d, '3d': view3d }, initial: '2d', modelInfo: 'Wellen hinter N Spalten, Zeigerkette' });

    let raf = 0;
    function loop() {
      raf = requestAnimationFrame(loop);
      const c = calc(); dDx.set(`${fmt(c.dx, 0)} mm`); dAl.set(`${fmt(c.al * 180 / Math.PI, 2)} °`); dLam.set(white() ? '–' : `${fmt((1e-3 / S.lpm) * Math.sin(c.al) / S.k * 1e9, 0)} nm`);
    }
    raf = requestAnimationFrame(loop);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); chL.destroy(); chN.destroy(); } };
  }
};
