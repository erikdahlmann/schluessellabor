// ============================================================================
//  Schlüsselexperiment: Röntgenspektren und Bragg-Reflexion
//  Röntgenröhre (Mo- oder Cu-Anode), Kristall (NaCl, LiF) im Goniometer,
//  Geiger-Müller-Zählrohr unter 2θ. Bragg: n·λ = 2·d·sin θ.
//  Bremsspektrum nach Kramers mit Grenzwellenlänge λ_min = h·c/(e·U) (Duane-Hunt),
//  charakteristische Linien Kα, Kβ ab der K-Kante.
//  Modell: Netzebenen mit Gangunterschied, Schalenmodell der Anode.
// ============================================================================
import { viewHost } from '../js/lib/views.js';

const HC = 1239.84;                                                   // h·c in keV·pm
const ANODES = {
  mo: { name: 'Molybdän (Mo)', Z: 42, ka: 71.08, kb: 63.09, edge: 20.0, wa: 1.0, wb: 0.28 },
  cu: { name: 'Kupfer (Cu)', Z: 29, ka: 154.18, kb: 139.22, edge: 8.98, wa: 1.0, wb: 0.2 }
};
const CRYST = { nacl: { name: 'NaCl', d: 282.0 }, lif: { name: 'LiF', d: 201.4 } };
const REFL = [0, 1, 0.22, 0.05];                                      // Reflexionsvermögen 1., 2., 3. Ordnung
const WID = 0.22 * Math.PI / 180;                                     // Linienbreite im Winkel (Divergenz, Mosaik)

const svgMarkup = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Röntgengerät von oben: Röhre, Blende, Kristall und Zählrohr unter dem Winkel 2θ; rechts Anzeigen und gemessenes Spektrum">
<defs>
  <linearGradient id="xBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2024"/><stop offset="1" stop-color="#121518"/></linearGradient>
  <filter id="xSh" x="-10%" y="-10%" width="130%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity=".55"/></filter>
  <filter id="xGl"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <marker id="xA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="context-stroke"/></marker>
</defs>
<rect width="1000" height="620" fill="url(#xBg)"/>
<text x="40" y="34" fill="#8e979d" font-size="13">Röntgengerät von oben (Bleiglasgehäuse, nicht maßstäblich)</text>
<rect x="40" y="46" width="560" height="460" rx="10" fill="#161a1d" stroke="#2c3338"/>
<!-- Röhre -->
<ellipse cx="130" cy="300" rx="70" ry="46" fill="#9fb4c2" fill-opacity=".08" stroke="#6b7a85"/>
<rect x="72" y="292" width="26" height="16" rx="3" fill="#ff8a3d" filter="url(#xGl)" id="xCath"/>
<path d="M160 278 L176 322 L188 322 L172 278z" fill="#b8692f" id="xAnode"/>
<text x="130" y="370" fill="#8e979d" font-size="11" text-anchor="middle">Röntgenröhre</text>
<text id="xAnT" x="130" y="384" fill="#c9c3ba" font-size="11" text-anchor="middle"></text>
<rect x="232" y="286" width="10" height="11" fill="#6a7178"/><rect x="232" y="303" width="10" height="11" fill="#6a7178"/><text x="237" y="332" fill="#8e979d" font-size="10" text-anchor="middle">Blende</text>
<!-- Strahlen (nur Modell sichtbar) -->
<g id="xBeams" opacity="0">
  <line x1="178" y1="300" x2="380" y2="300" stroke="#c7b6ff" stroke-width="3" opacity=".5" filter="url(#xGl)"/>
  <line id="xRef" x1="380" y1="300" stroke="#c7b6ff" stroke-width="3" filter="url(#xGl)"/>
  <line id="xThru" x1="380" y1="300" x2="590" y2="300" stroke="#c7b6ff" stroke-width="2" opacity=".25"/>
</g>
<!-- Goniometer -->
<circle cx="380" cy="300" r="150" fill="none" stroke="#2c3338" stroke-dasharray="3 5"/>
<g id="xGon">
  <g id="xArm"><line x1="380" y1="300" x2="560" y2="300" stroke="#6a7178" stroke-width="6" stroke-linecap="round"/><rect x="510" y="290" width="70" height="20" rx="6" fill="#2b3034" stroke="#c4231b"/><text x="545" y="304" fill="#ece6dc" font-size="10" text-anchor="middle">GM</text></g>
  <g id="xCry"><rect x="356" y="295" width="48" height="10" fill="#e6ecef" stroke="#9aa3a9"/></g>
</g>
<path id="xArc1" fill="none" stroke="#f2ac74" stroke-width="1.4"/><text id="xArcT1" fill="#f2ac74" font-size="12" font-family="IBM Plex Mono, monospace"></text>
<path id="xArc2" fill="none" stroke="#86dcff" stroke-width="1.4"/><text id="xArcT2" fill="#86dcff" font-size="12" font-family="IBM Plex Mono, monospace"></text>
<text id="xCryT" x="380" y="480" fill="#c9c3ba" font-size="12" text-anchor="middle"></text>

<!-- rechts: Anzeigen und Spektrum (Realansicht) -->
<g id="xReal">
  <g font-family="IBM Plex Mono, monospace">
    <rect x="620" y="46" width="160" height="62" rx="6" fill="#160807" stroke="#3a1a14"/><text x="630" y="62" fill="#8e979d" font-size="10" font-family="IBM Plex Sans, sans-serif">Zählrate R</text><text id="xR" x="770" y="96" fill="#ff5a3c" font-size="24" text-anchor="end">0 /s</text>
    <rect x="800" y="46" width="160" height="62" rx="6" fill="#160807" stroke="#3a1a14"/><text x="810" y="62" fill="#8e979d" font-size="10" font-family="IBM Plex Sans, sans-serif">Winkel θ</text><text id="xTh" x="950" y="96" fill="#ff5a3c" font-size="24" text-anchor="end">0,0°</text>
  </g>
  <rect x="620" y="124" width="340" height="270" rx="8" fill="#0a0c0e" stroke="#2c3338"/>
  <text x="632" y="142" fill="#ece6dc" font-size="12" font-weight="600">Gemessenes Spektrum R(θ)</text>
  <g id="xAx" stroke="#2a3036" font-size="10" fill="#8e979d" font-family="IBM Plex Mono, monospace"></g>
  <path id="xSpec" fill="none" stroke="#ffb347" stroke-width="1.6"/>
  <line id="xMark" y1="150" y2="370" stroke="#7fd6a0" stroke-dasharray="4 3"/>
</g>
<!-- rechts: Bragg-Modell und Schalen (Modell) -->
<g id="xModel" opacity="0">
  <rect x="620" y="46" width="340" height="230" rx="8" fill="rgba(10,12,14,.92)" stroke="#5a4b8a"/>
  <text x="632" y="66" fill="#ece6dc" font-size="12" font-weight="600">Bragg-Reflexion an den Netzebenen</text>
  <g id="xLat"></g>
  <text id="xBraggT" x="632" y="266" fill="#c7b6ff" font-size="12" font-family="IBM Plex Mono, monospace"></text>
  <rect x="620" y="286" width="340" height="220" rx="8" fill="rgba(10,12,14,.92)" stroke="#5a4b8a"/>
  <text x="632" y="306" fill="#ece6dc" font-size="12" font-weight="600">Entstehung in der Anode</text>
  <g id="xShell"></g>
</g>
<text id="xInfo" x="40" y="530" fill="#c9c3ba" font-size="12"></text>
<text id="xInfo2" x="40" y="550" fill="#8e979d" font-size="12"></text>
</svg>`;

export default {
  intro: 'In einer Röntgenröhre werden Elektronen in der Anode abgebremst. Dabei entsteht Röntgenstrahlung. Ein Kristall reflektiert jede Wellenlänge nur unter einem bestimmten Winkel. Dreht man Kristall und Zählrohr, erhält man das Spektrum: einen breiten Untergrund mit scharfer Grenze und darauf die schmalen Linien des Anodenmaterials.',
  docs: {
    durchfuehrung: `
<h3>Aufbau</h3>
<p>Das Röntgengerät hat ein Gehäuse mit Bleiglasscheibe. Die Röhre beschleunigt Elektronen mit der Anodenspannung U auf eine Anode aus Molybdän oder Kupfer. Eine Blende formt einen schmalen Strahl. Er trifft im Goniometer auf einen Kristall (NaCl oder LiF). Das Zählrohr steht immer unter dem doppelten Kristallwinkel (θ-2θ-Kopplung).</p>
<h3>Durchführung</h3>
<ol>
<li>Anode, Kristall und U wählen. <b>Messung starten</b>: Kristall und Zählrohr fahren den Winkelbereich ab, die Zählrate wird aufgezeichnet (im Zeitraffer).</li>
<li>Den Winkel-Marker an den Anfang des Spektrums setzen (Grenzwinkel) und <b>Grenzwinkel übernehmen</b>.</li>
<li>Für mehrere Spannungen wiederholen und daraus h bestimmen.</li>
<li>Den Marker auf die Linien setzen und <b>Linie übernehmen</b>. Mit der Tabelle das Anodenmaterial bestätigen.</li>
<li>Unter 20 kV (Mo) bzw. 9 kV (Cu) messen: Wo bleiben die Linien?</li>
</ol>
<div class="callout">Strahlenschutz: Das Gerät ist ein Vollschutzgerät. Die Röhre lässt sich nur bei geschlossener Tür einschalten.</div>`,
    theorie: `
<h3>Bragg-Bedingung</h3>
<p>Die Atome im Kristall liegen in parallelen Netzebenen mit dem Abstand d. Strahlen, die an benachbarten Ebenen reflektiert werden, haben den Gangunterschied 2·d·sin θ. Nur wenn er ein Vielfaches von λ ist, verstärken sie sich:</p>
<span class="formula tex">n\\,\\lambda = 2\\, d \\sin\\theta \\qquad (\\text{NaCl: } d = 282{,}0\\,\\text{pm},\\ \\text{LiF: } d = 201{,}4\\,\\text{pm})</span>
<h3>Bremsspektrum und Grenzwellenlänge</h3>
<p>Elektronen werden in der Anode abgebremst und geben Energie als Photonen ab. Ein Photon kann höchstens die ganze Energie e·U eines Elektrons erhalten. Daraus folgt die kürzeste Wellenlänge (Duane-Hunt-Gesetz):</p>
<span class="formula tex">e\\, U = \\frac{h\\, c}{\\lambda_{\\min}} \\quad\\Rightarrow\\quad \\lambda_{\\min} = \\frac{h\\, c}{e\\, U}</span>
<p>Trägt man λ<sub>min</sub> über <span class="tex">\\frac{1}{U}</span> auf, ergibt sich eine Ursprungsgerade mit der Steigung <span class="tex">\\frac{h\\, c}{e}</span>.</p>
<h3>Charakteristische Linien</h3>
<p>Schlägt ein Elektron ein Elektron aus der innersten Schale (K) der Anodenatome, rückt ein Elektron aus einer höheren Schale nach. Die Energiedifferenz wird als Photon frei: Kα beim Übergang L → K, Kβ bei M → K. Die Linien entstehen erst, wenn e·U die Bindungsenergie der K-Schale übersteigt (Mo: 20,0 keV, Cu: 8,98 keV).</p>
<h3>Modellgrenzen</h3>
<ul><li>Das Bremsspektrum folgt der Kramers-Formel, die Absorption im Fenster ist vereinfacht. Kα₁ und Kα₂ erscheinen als eine Linie.</li><li>Die Zählrate schwankt nach Poisson. Die Messung läuft im Zeitraffer.</li></ul>
<h3>Was die Modellansicht zeigt</h3><ul><li>Den Röntgenstrahl (im echten Versuch unsichtbar), reflektiert in Richtung 2θ.</li><li>Rechts oben die Netzebenen mit zwei Strahlen und ihrem Gangunterschied 2·d·sin θ für die Wellenlänge am Marker.</li><li>Rechts unten die Schalen K, L, M der Anodenatome: Übergänge Kα und Kβ, und ein Elektron, das im Feld eines Kerns abgebremst wird (Bremsstrahlung).</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Röntgenröhre</td><td>Mo- oder Cu-Anode, U = 10 … 35 kV, I = 0,1 … 1 mA</td></tr>
<tr><td>Kristalle</td><td>NaCl (d = 282,0 pm), LiF (d = 201,4 pm)</td></tr>
<tr><td>Goniometer</td><td>θ-2θ-Kopplung, θ = 2° … 35°</td></tr>
<tr><td>Detektor</td><td>Geiger-Müller-Zählrohr mit Torzeit</td></tr>
</tbody></table>
<h3 style="margin-top:16px">Linientabelle</h3>
<table class="spec"><tbody>
<tr><td>Mo</td><td>Kα 71,1 pm (17,4 keV) · Kβ 63,1 pm (19,6 keV) · K-Kante 20,0 keV</td></tr>
<tr><td>Cu</td><td>Kα 154,2 pm (8,04 keV) · Kβ 139,2 pm (8,91 keV) · K-Kante 8,98 keV</td></tr>
</tbody></table>`,
    abi: `
<details class="q"><summary>Berechne λ<sub>min</sub> für U = 30 kV. <span class="op">AFB I</span></summary><p>λ<sub>min</sub> = h·c/(e·U) = 1240 keV·pm / 30 keV ≈ 41,3 pm.</p></details>
<details class="q"><summary>Mit NaCl liegt die Mo-Kα-Linie in 1. Ordnung bei θ = 7,24°. Berechne λ und die Energie. <span class="op">AFB II</span></summary><p>λ = 2·282 pm·sin 7,24° ≈ 71,1 pm. E = h·c/λ = 1240/71,1 keV ≈ 17,4 keV.</p></details>
<details class="q"><summary>Bei U = 25 kV beginnt das Spektrum (NaCl, 1. Ordnung) bei θ = 5,05°. Bestimme h. <span class="op">AFB II</span></summary><p>λ<sub>min</sub> = 2·282 pm·sin 5,05° ≈ 49,6 pm. h = e·U·λ<sub>min</sub>/c = 1,602·10⁻¹⁹ C · 25000 V · 49,6·10⁻¹² m / 2,998·10⁸ m/s ≈ 6,63·10⁻³⁴ J·s.</p></details>
<details class="q"><summary>Warum fehlen bei U = 15 kV die Mo-Linien? <span class="op">AFB II</span></summary><p>Die Elektronen haben nur 15 keV. Um ein K-Elektron aus Molybdän zu entfernen, braucht man 20,0 keV. Ohne Lücke in der K-Schale gibt es keine Kα- und Kβ-Übergänge.</p></details>
<details class="q"><summary>Erkläre, warum die Lage der Linien nicht von U abhängt, die Grenzwellenlänge aber schon. <span class="op">AFB III</span></summary><p>Die Linien gehören zu festen Energieniveaus der Anodenatome; ihre Energie ist eine Eigenschaft des Elements. Die Grenzwellenlänge hängt dagegen nur von der Energie der Elektronen ab, also von U.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, segmented, check, button, fmt, dataTable, toast, display, gauss } = ui;
    const S = { an: 'mo', cr: 'nacl', U: 35, I: 1, on: true, theta: 4, mark: 7.2, n: 1, scan: null, from: 2.5, to: 30, gate: 1, curves: [], cur: [], R: 0, ver: 0 };
    const A = () => ANODES[S.an], d = () => CRYST[S.cr].d;
    // spektrale Intensität (beliebige Einheiten) bei λ in pm
    function spec(lam) {
      const a = A(), lmin = HC / S.U; if (lam <= lmin) return 0;
      let I = 0.006 * a.Z * (lam / lmin - 1) / (lam * lam) * 1e4 * Math.exp(-((lam / (S.an === 'mo' ? 180 : 260)) ** 3)) * Math.exp(-0.002 * lam);
      return I;
    }
    function rate(thDeg) {
      if (!S.on) return 0;
      const th = thDeg * Math.PI / 180, a = A(); let R = 0;
      for (let n = 1; n <= 3; n++) {
        const lam = 2 * d() * Math.sin(th) / n; R += REFL[n] * spec(lam) * 2 * d() * Math.cos(th) / n * 0.032;
        if (S.U > a.edge) for (const [l, w] of [[a.ka, a.wa], [a.kb, a.wb]]) { const s = n * l / (2 * d()); if (s >= 1) continue; const thL = Math.asin(s); R += REFL[n] * w * 0.9 * (S.U / a.edge - 1) ** 1.5 * 160 * Math.exp(-0.5 * ((th - thL) / WID) ** 2); }
      }
      return (R * 55 + 4) * S.I * (S.an === 'cu' ? 1.6 : 1);
    }

    const gR = group('Röntgenröhre', { led: true }); gR.led(true);
    const cOn = check({ label: 'Hochspannung eingeschaltet', checked: true, onChange: v => { S.on = v; gR.led(v); } });
    const segA = segmented({ value: 'mo', options: [{ value: 'mo', label: 'Mo-Anode' }, { value: 'cu', label: 'Cu-Anode' }], onChange: v => { S.an = v; S.ver++; } });
    const sU = slider({ label: 'Anodenspannung U', min: 10, max: 35, step: 0.5, value: S.U, unit: 'kV', digits: 1, onInput: v => { S.U = v; } });
    const sI = slider({ label: 'Emissionsstrom I', min: 0.1, max: 1, step: 0.05, value: S.I, unit: 'mA', digits: 2, onInput: v => { S.I = v; } });
    gR.append(cOn, el('div', { class: 'ctl' }, el('div', { style: 'grid-column:1/-1' }, segA)), sU, sI);
    const gG = group('Goniometer');
    const segC = segmented({ value: 'nacl', options: [{ value: 'nacl', label: 'NaCl' }, { value: 'lif', label: 'LiF' }], onChange: v => { S.cr = v; S.ver++; } });
    const sTh = slider({ label: 'Kristallwinkel θ (von Hand)', min: 2, max: 35, step: 0.1, value: S.theta, unit: '°', digits: 1, onInput: v => { if (!S.scan) S.theta = v; } });
    const sFrom = slider({ label: 'Messbereich: von', min: 2, max: 20, step: 0.5, value: S.from, unit: '°', digits: 1, onInput: v => { S.from = v; } });
    const sTo = slider({ label: 'bis', min: 8, max: 35, step: 0.5, value: S.to, unit: '°', digits: 1, onInput: v => { S.to = v; } });
    const bScan = button('Messung starten', () => { if (S.scan) { stopScan(); return; } if (!S.on) { toast('Die Hochspannung ist aus.'); return; } S.scan = { th: S.from, pts: [], U: S.U, an: S.an, cr: S.cr }; S.cur = S.scan.pts; bScan.textContent = 'Messung stoppen'; }, 'btn small primary');
    gG.append(el('div', { class: 'ctl' }, el('label', { style: 'grid-column:1/-1' }, 'Kristall'), el('div', { style: 'grid-column:1/-1' }, segC)), sTh, sFrom, sTo, el('div', { class: 'bar' }, bScan, button('Spektren löschen', () => { S.curves.length = 0; S.cur = []; drawSpec(); })),
      el('p', { class: 'muted', style: 'font-size:12.5px;margin:8px 0 0' }, 'Schrittweite 0,1°, Torzeit 1 s, im Zeitraffer.'));
    const gM = group('Auswertung mit dem Winkel-Marker');
    const sMk = slider({ label: 'Marker θ', min: 2, max: 35, step: 0.05, value: S.mark, unit: '°', digits: 2, onInput: v => { S.mark = v; } });
    const segN = segmented({ value: 1, options: [{ value: 1, label: 'n = 1' }, { value: 2, label: 'n = 2' }, { value: 3, label: 'n = 3' }], onChange: v => { S.n = v; } });
    const dL = display('λ = 2d·sin θ / n'), dE = display('E = h·c / λ');
    gM.append(sMk, el('div', { class: 'ctl' }, el('label', { style: 'grid-column:1/-1' }, 'Beugungsordnung'), el('div', { style: 'grid-column:1/-1' }, segN)), dL, dE,
      el('div', { class: 'bar' }, button('Grenzwinkel übernehmen', () => take('Grenze'), 'btn small primary'), button('Linie übernehmen', () => take('Linie'))));
    controls.append(gR, gG, gM);
    const lamM = () => 2 * d() * Math.sin(S.mark * Math.PI / 180) / S.n;

    // ---- Messwerte ----
    const rows = [];
    const tbl = dataTable([
      { key: 'kind', label: 'Art', fmt: v => v }, { key: 'an', label: 'Anode', fmt: v => v }, { key: 'cr', label: 'Kristall', fmt: v => v }, { key: 'U', label: 'U in kV', digits: 1 },
      { key: 'n', label: 'n', digits: 0 }, { key: 'th', label: 'θ in °', digits: 2 }, { key: 'lam', label: 'λ in pm', digits: 1 }, { key: 'E', label: 'E in keV', digits: 2 }
    ], { onDelete: i => { rows.splice(i, 1); redraw(); } });
    const figS = el('div', { class: 'fig' }), figH = el('div', { class: 'fig' });
    const chS = new Chart(figS, { xlabel: 'θ in °', ylabel: 'R in 1/s', ymin: 0 }), chH = new Chart(figH, { xlabel: '1/U in 1/kV', ylabel: 'λ_min in pm' });
    const resH = el('div', { class: 'result' }), resLn = el('div', { class: 'result' });
    messwerte.append(
      el('div', { class: 'data' },
        el('div', { class: 'chartbox' }, el('h4', {}, 'Aufgenommene Spektren'), figS, resLn,
          csvTools(() => ({ meta: ['Röntgenspektren', 'letzte Messung: theta in Grad, R in 1/s'], columns: [{ key: 'th', label: 'theta in Grad' }, { key: 'R', label: 'R in 1/s' }], rows: (S.curves[S.curves.length - 1]?.pts || []).map(([th, R]) => ({ th, R })) }), 'roentgen_spektrum')),
        el('div', { class: 'chartbox' }, el('h4', {}, 'Duane-Hunt: λ_min über 1/U'), figH, resH)),
      el('div', { style: 'height:14px' }), tbl,
      el('div', { style: 'margin-top:8px' }, csvTools(() => ({ meta: ['Röntgen – Auswertung'], columns: [{ key: 'kind', label: 'Art' }, { key: 'an', label: 'Anode' }, { key: 'cr', label: 'Kristall' }, { key: 'U', label: 'U in kV' }, { key: 'n', label: 'n' }, { key: 'th', label: 'theta in Grad' }, { key: 'lam', label: 'lambda in pm' }, { key: 'E', label: 'E in keV' }], rows }), 'roentgen_auswertung')));
    const colU = U => `hsl(${30 + (35 - U) * 9},80%,62%)`;
    function drawSpec() {
      const series = S.curves.map(c => ({ name: `${c.an === 'mo' ? 'Mo' : 'Cu'} ${CRYST[c.cr].name} ${fmt(c.U, 1)} kV`, color: colU(c.U), points: c.pts }));
      if (S.scan) series.push({ color: '#ffffff', points: S.scan.pts });
      chS.set(series);
    }
    function redraw() {
      tbl.render(rows);
      const g = rows.filter(r => r.kind === 'Grenze').map(r => [1 / r.U, r.lam]); const fits = []; let t = '<span>Grenzwinkel für mindestens zwei Spannungen übernehmen.</span>';
      if (new Set(rows.filter(r => r.kind === 'Grenze').map(r => r.U)).size >= 2) { const f = fit.propFit(g.map(p => p[0]), g.map(p => p[1])); if (f) { fits.push({ f: f.f, color: '#ab93ff' }); const h = f.a * 1e-12 * 1000 * 1.602e-19 / 2.998e8; t = `<div><span>Steigung = h·c/e = ${fmt(f.a, 0)} pm·kV</span><br><b>h = ${fmt(h / 1e-34, 2)}·10⁻³⁴ J·s</b> <span>· Tabelle 6,63·10⁻³⁴ J·s</span></div>`; } }
      chH.set([{ color: '#ffb347', mode: 'dot', points: g }], fits); resH.innerHTML = t;
      const ls = rows.filter(r => r.kind === 'Linie');
      resLn.innerHTML = ls.length ? ls.map(r => { let best = null; for (const [k, a] of Object.entries(ANODES)) for (const [nm, l] of [['Kα', a.ka], ['Kβ', a.kb]]) { const dd = Math.abs(l - r.lam); if (!best || dd < best.dd) best = { dd, k, nm, l }; } return `<div><span>${fmt(r.lam, 1)} pm →</span> <b>${best.k === 'mo' ? 'Mo' : 'Cu'} ${best.nm} (${fmt(best.l, 1)} pm)</b></div>`; }).join('') : '<span>Linien mit dem Marker vermessen und übernehmen.</span>';
    }
    redraw();
    function take(kind) {
      const lam = lamM(); rows.push({ kind, an: S.an === 'mo' ? 'Mo' : 'Cu', cr: CRYST[S.cr].name, U: S.U, n: S.n, th: S.mark, lam, E: HC / lam }); redraw();
      toast(`Übernommen: λ = ${fmt(lam, 1)} pm, E = ${fmt(HC / lam, 2)} keV`);
    }
    function stopScan() { if (S.scan && S.scan.pts.length > 10) { S.curves.push(S.scan); if (S.curves.length > 6) S.curves.shift(); } S.scan = null; bScan.textContent = 'Messung starten'; drawSpec(); }

    // ======================= Ansicht 2D =======================
    async function view2d(box, MM) {
      box.insertAdjacentHTML('beforeend', svgMarkup());
      const svg = box.querySelector('svg'), q = id => svg.querySelector('#' + id);
      const PX0 = 640, PX1 = 950, PY0 = 370, PY1 = 152;
      let raf = 0, acc = 0, t0 = performance.now();
      function frame(now) {
        raf = requestAnimationFrame(frame);
        const model = MM.model, th = S.theta, thr = th * Math.PI / 180, t = (now - t0) / 1000;
        q('xCry').setAttribute('transform', `rotate(${-th} 380 300)`); q('xArm').setAttribute('transform', `rotate(${-2 * th} 380 300)`);
        const r1 = 60, r2 = 110;
        q('xArc1').setAttribute('d', `M${380 + r1} 300 A${r1} ${r1} 0 0 0 ${(380 + r1 * Math.cos(thr)).toFixed(1)} ${(300 - r1 * Math.sin(thr)).toFixed(1)}`); q('xArcT1').setAttribute('x', 380 + r1 + 6); q('xArcT1').setAttribute('y', 296); q('xArcT1').textContent = `θ = ${fmt(th, 1)}°`;
        q('xArc2').setAttribute('d', `M${380 + r2} 300 A${r2} ${r2} 0 0 0 ${(380 + r2 * Math.cos(2 * thr)).toFixed(1)} ${(300 - r2 * Math.sin(2 * thr)).toFixed(1)}`); q('xArcT2').setAttribute('x', 380 + r2 * Math.cos(2 * thr) + 8); q('xArcT2').setAttribute('y', 300 - r2 * Math.sin(2 * thr) - 6); q('xArcT2').textContent = '2θ';
        q('xCath').setAttribute('opacity', S.on ? 1 : 0.3); q('xAnT').textContent = A().name; q('xCryT').textContent = `Kristall ${CRYST[S.cr].name}, d = ${fmt(d(), 1)} pm`;
        const R = S.R;
        q('xBeams').setAttribute('opacity', model && S.on ? 1 : 0);
        q('xRef').setAttribute('x2', (380 + 200 * Math.cos(2 * thr)).toFixed(1)); q('xRef').setAttribute('y2', (300 - 200 * Math.sin(2 * thr)).toFixed(1)); q('xRef').setAttribute('opacity', Math.min(1, 0.15 + R / 600).toFixed(2));
        if (++acc % 4 === 0) {
          q('xR').textContent = `${Math.round(R)} /s`; q('xTh').textContent = `${fmt(th, 1)}°`;
          // Achsen und Spektrum
          const all = [...S.curves.flatMap(c => c.pts), ...(S.scan ? S.scan.pts : [])], ymax = Math.max(100, ...all.map(p => p[1])) * 1.1, X = v => PX0 + (v - 2) / 33 * (PX1 - PX0), Y = v => PY0 - v / ymax * (PY0 - PY1);
          let ax = `<line x1="${PX0}" y1="${PY0}" x2="${PX1}" y2="${PY0}"/><line x1="${PX0}" y1="${PY1}" x2="${PX0}" y2="${PY0}"/>`; for (let v = 5; v <= 35; v += 5) ax += `<text x="${X(v)}" y="${PY0 + 14}" text-anchor="middle" stroke="none">${v}°</text>`;
          q('xAx').innerHTML = ax;
          const c = S.scan ? S.scan : S.curves[S.curves.length - 1]; q('xSpec').setAttribute('d', c ? c.pts.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('') : '');
          q('xMark').setAttribute('x1', X(S.mark)); q('xMark').setAttribute('x2', X(S.mark));
        }
        q('xReal').setAttribute('opacity', model ? 0 : 1); q('xModel').setAttribute('opacity', model ? 1 : 0);
        q('xInfo').textContent = S.scan ? `Messung läuft: θ = ${fmt(S.theta, 1)}° (${fmt(S.scan.U, 1)} kV)` : `U = ${fmt(S.U, 1)} kV, I = ${fmt(S.I, 2)} mA`;
        q('xInfo2').textContent = `Marker: θ = ${fmt(S.mark, 2)}°, n = ${S.n} → λ = ${fmt(lamM(), 1)} pm, E = ${fmt(HC / lamM(), 2)} keV   ·   λ_min = h·c/(eU) = ${fmt(HC / S.U, 1)} pm`;
        if (model) {
          // Netzebenen mit zwei Strahlen und Gangunterschied (für den Marker-Winkel)
          const ox = 790, oy = 200, dd = 34, th2 = S.mark * Math.PI / 180, L = 120; let h = '';
          for (let k = 0; k < 3; k++) { for (let i = -6; i <= 6; i++) h += `<circle cx="${ox + i * 22}" cy="${oy + k * dd}" r="3.4" fill="${(i + k) % 2 ? '#86dcff' : '#c7c1b7'}"/>`; h += `<line x1="${ox - 140}" y1="${oy + k * dd}" x2="${ox + 140}" y2="${oy + k * dd}" stroke="#3a4248" stroke-dasharray="3 4"/>`; }
          const vis = Math.max(th2, 0.25), cx2 = Math.cos(vis), sy2 = Math.sin(vis);
          for (const [k, col] of [[0, '#f2ac74'], [1, '#ffd27a']]) { const px = ox + (k ? dd * cx2 / sy2 * 0 : 0), py = oy + k * dd; h += `<line x1="${px - L * cx2}" y1="${py - L * sy2}" x2="${px}" y2="${py}" stroke="${col}" stroke-width="2"/><line x1="${px}" y1="${py}" x2="${px + L * cx2}" y2="${py - L * sy2}" stroke="${col}" stroke-width="2" marker-end="url(#xA)"/>`; }
          // Zusatzweg 2·d·sin θ markieren
          const ax1 = ox - dd * sy2 * cx2, ay1 = oy + dd - dd * sy2 * sy2, bx1 = ox + dd * sy2 * cx2, by1 = ay1;
          h += `<path d="M${ax1.toFixed(1)} ${ay1.toFixed(1)} L${ox} ${oy + dd} L${bx1.toFixed(1)} ${by1.toFixed(1)}" stroke="#7fd6a0" stroke-width="3.5" fill="none"/>`;
          q('xLat').innerHTML = h;
          q('xBraggT').textContent = `2·d·sin θ = ${fmt(2 * d() * Math.sin(th2), 1)} pm = ${S.n}·λ → λ = ${fmt(lamM(), 1)} pm`;
          // Schalen und Übergänge
          const a = A(), sx = 700, sy = 400; let s = '';
          for (const [r, nm] of [[18, 'K'], [36, 'L'], [56, 'M']]) s += `<circle cx="${sx}" cy="${sy}" r="${r}" fill="none" stroke="#4a545c"/><text x="${sx + r - 6}" y="${sy - 4}" fill="#8e979d" font-size="10">${nm}</text>`;
          s += `<circle cx="${sx}" cy="${sy}" r="6" fill="#c4231b"/>`;
          const on = S.on && S.U > a.edge, ph = (t % 2.4) / 2.4;
          if (on) { s += `<line x1="${sx + 36}" y1="${sy}" x2="${sx + 21}" y2="${sy}" stroke="#86dcff" stroke-width="2" marker-end="url(#xA)"/><text x="${sx + 40}" y="${sy + 16}" fill="#86dcff" font-size="11">Kα</text><line x1="${sx}" y1="${sy - 56}" x2="${sx}" y2="${sy - 21}" stroke="#c7b6ff" stroke-width="2" marker-end="url(#xA)"/><text x="${sx + 6}" y="${sy - 42}" fill="#c7b6ff" font-size="11">Kβ</text>`; const ex = sx - 80 + ph * 70; s += `<circle cx="${ex.toFixed(1)}" cy="${sy - 18}" r="3.5" fill="#7fd6a0"/><text x="${sx - 86}" y="${sy - 26}" fill="#7fd6a0" font-size="10">e⁻ stößt K-Elektron heraus</text>`; }
          s += `<text x="${sx + 78}" y="${sy - 40}" fill="${on ? '#c7c1b7' : '#ffb347'}" font-size="11">${on ? `e·U = ${fmt(S.U, 1)} keV > ${fmt(a.edge, 2)} keV` : `e·U = ${fmt(S.U, 1)} keV < K-Kante ${fmt(a.edge, 2)} keV`}</text><text x="${sx + 78}" y="${sy - 24}" fill="#8e979d" font-size="11">${on ? 'Linien Kα und Kβ entstehen' : 'keine K-Linien'}</text>`;
          // Bremsstrahlung: Elektron biegt am Kern ab, Photon fliegt weg
          const bx = 860, by = 470, k = (t * 0.7) % 1;
          s += `<circle cx="${bx}" cy="${by}" r="5" fill="#c4231b"/><path d="M${bx - 90} ${by - 30} Q${bx - 10} ${by - 18} ${bx + 70} ${by + 22}" stroke="#7fd6a0" fill="none" stroke-dasharray="4 4"/>`;
          const px = (1 - k) ** 2 * (bx - 90) + 2 * (1 - k) * k * (bx - 10) + k * k * (bx + 70), py = (1 - k) ** 2 * (by - 30) + 2 * (1 - k) * k * (by - 18) + k * k * (by + 22);
          s += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3.5" fill="#7fd6a0"/>`;
          if (k > 0.5) { const q2 = (k - 0.5) * 2; let w = ''; for (let i = 0; i <= 30; i++) { const xx = bx + q2 * 40 + i, yy = by - 26 - q2 * 40 - i * 0.8 + Math.sin(i / 2.2 - t * 12) * 4; w += `${i ? 'L' : 'M'}${xx.toFixed(1)} ${yy.toFixed(1)}`; } s += `<path d="${w}" stroke="#c7b6ff" stroke-width="1.6" fill="none"/>`; }
          s += `<text x="${bx - 130}" y="${by + 26}" fill="#8e979d" font-size="11">Bremsstrahlung</text>`;
          q('xShell').innerHTML = s;
        }
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); } };
    }

    // ======================= Ansicht 3D =======================
    async function view3d(box, MM) {
      const { createLab, mats, makeDisplay, glassMaterial, label } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [0.12, 0.45, 0.72], target: [0.02, 0.15, 0], table: [1.8, 1.2], bloom: [0.85, 0.45, 0.82], room: 0.45, minDist: 0.15, maxDist: 2.4, fov: 36 });
      const { THREE, scene } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad · Röntgenstrahlen sind unsichtbar (Modellansicht zeigt sie)</div>');
      const housing = new THREE.MeshStandardMaterial({ color: 0xa3a6a3, roughness: 0.55, metalness: 0.2 });
      const bx = (w, h, d2, x, y, z, m = housing) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d2), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; scene.add(o); return o; };
      bx(0.62, 0.02, 0.36, 0, 0.01, 0); bx(0.62, 0.02, 0.36, 0, 0.33, 0); bx(0.02, 0.32, 0.36, -0.3, 0.17, 0); bx(0.02, 0.32, 0.36, 0.3, 0.17, 0); bx(0.62, 0.32, 0.02, 0, 0.17, -0.17);
      bx(0.2, 0.32, 0.02, 0.4, 0.17, 0.0, M.housing);
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.3), glassMaterial(THREE, [0.6, 0.85, 0.7])); win.position.set(0, 0.17, 0.18); win.renderOrder = 6; scene.add(win);
      const panel = bx(0.16, 0.3, 0.2, 0.4, 0.15, 0.08, M.housing); void panel;
      const disp = makeDisplay(THREE, 256, 96); const dm = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.045), new THREE.MeshBasicMaterial({ map: disp.tex, toneMapped: false })); dm.position.set(0.4, 0.25, 0.181); scene.add(dm);
      const dispU = makeDisplay(THREE, 256, 96); const du = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.045), new THREE.MeshBasicMaterial({ map: dispU.tex, toneMapped: false })); du.position.set(0.4, 0.19, 0.181); scene.add(du);
      // Röhre links
      const Y = 0.16, TX = -0.19;
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 32), glassMaterial(THREE)); tube.position.set(TX, Y, 0); scene.add(tube);
      const cath = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.02, 12), new THREE.MeshBasicMaterial({ color: 0xff8a3d, toneMapped: false })); cath.position.set(TX, Y + 0.05, 0); scene.add(cath);
      const anode = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 20), M.copper); anode.position.set(TX, Y - 0.04, 0); scene.add(anode);
      const glowT = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 16), new THREE.MeshBasicMaterial({ color: 0x6fd6b0, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); glowT.position.set(TX, Y, 0); scene.add(glowT);
      const coll = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 16), M.steel); coll.rotation.z = Math.PI / 2; coll.position.set(TX + 0.07, Y, 0); scene.add(coll);
      // Goniometer
      const GX = 0.05;
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.01, 40), M.housing); table.position.set(GX, Y - 0.03, 0); scene.add(table);
      const cry = new THREE.Group(); cry.position.set(GX, Y, 0); scene.add(cry);
      const cBox = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.004), new THREE.MeshStandardMaterial({ color: 0xeef3f5, roughness: 0.3 })); cry.add(cBox);
      const arm = new THREE.Group(); arm.position.set(GX, Y, 0); scene.add(arm);
      const armBar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.006, 0.012), M.steel); armBar.position.set(0.08, -0.025, 0); arm.add(armBar);
      const gm = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.07, 20), new THREE.MeshStandardMaterial({ color: 0x2b3034, metalness: 0.5, roughness: 0.4 })); gm.rotation.z = Math.PI / 2; gm.position.set(0.13, 0, 0); arm.add(gm);
      const gmTip = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.0095, 0.006, 20), M.red); gmTip.rotation.z = Math.PI / 2; gmTip.position.set(0.093, 0, 0); arm.add(gmTip);
      // Modell: Strahlen
      const bm = () => new THREE.MeshBasicMaterial({ color: 0xc7b6ff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      const beamIn = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, GX - TX - 0.04, 8), bm()); beamIn.rotation.z = Math.PI / 2; beamIn.position.set((GX + TX + 0.04) / 2, Y, 0); scene.add(beamIn);
      const beamOut = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.09, 8), bm()); beamOut.rotation.z = Math.PI / 2; beamOut.position.set(0.045, 0, 0); arm.add(beamOut);
      const lB = label(THREE, 'Modell: Röntgenstrahl (unsichtbar)', { color: '#c7b6ff', size: 0.014 }); lB.position.set(-0.05, Y + 0.06, 0.05); scene.add(lB);
      let acc = 0;
      const off = lab.onFrame((dt) => {
        const model = MM.model, th = S.theta * Math.PI / 180;
        cry.rotation.y = th; arm.rotation.y = 2 * th;
        cath.visible = S.on; glowT.material.opacity = S.on ? 0.06 + 0.1 * S.I : 0;
        beamIn.visible = beamOut.visible = lB.visible = model && S.on; beamOut.material.opacity = Math.min(0.9, 0.1 + S.R / 500);
        acc += dt; if (acc > 0.15) { acc = 0; disp.draw(String(Math.round(S.R)), '/s'); dispU.draw(S.on ? S.U.toFixed(1) : '0.0', 'kV'); }
      });
      return { destroy() { off(); lab.dispose(); } };
    }

    const host = viewHost(stage, { id: 'roentgen', views: { '2d': view2d, '3d': view3d }, initial: '2d', modelInfo: 'Röntgenstrahl, Netzebenen, Schalenmodell' });

    let raf = 0, last = performance.now(), gateT = 0, slow = 0;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      if (S.scan) {
        // Zeitraffer: 12 Winkelschritte pro Sekunde, jeder mit 1 s Torzeit gezählt
        gateT += dt * 12;
        while (gateT > 1 && S.scan) {
          gateT -= 1; const R = rate(S.scan.th), N = Math.max(0, Math.round(R * S.gate + gauss(Math.sqrt(R * S.gate))));
          S.scan.pts.push([+S.scan.th.toFixed(2), N / S.gate]); S.theta = S.scan.th; S.R = N / S.gate; sTh.set(S.theta);
          S.scan.th += 0.1; if (S.scan.th > S.to + 1e-6) stopScan();
        }
        if (S.scan && S.scan.pts.length % 6 === 0) drawSpec();
      } else {
        gateT += dt; if (gateT > 0.5) { gateT = 0; const R = rate(S.theta); S.R = Math.max(0, R + gauss(Math.sqrt(R * 2)) / 2); }
      }
      slow += dt; if (slow > 0.15) { slow = 0; dL.set(`${fmt(lamM(), 1)} pm`); dE.set(`${fmt(HC / lamM(), 2)} keV`); }
    }
    raf = requestAnimationFrame(loop);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); chS.destroy(); chH.destroy(); } };
  }
};
