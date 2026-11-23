// ============================================================================
//  Schlüsselexperiment: Doppelspaltversuch mit Elektronen (nach Jönsson 1961)
//  Elektronen (20 … 60 kV) treffen einzeln auf einen Doppelspalt (g = 2 µm).
//  Elektronenlinsen vergrößern das Muster 20 000-fach auf den Detektor.
//  λ = h/p mit p = √(2·m·e·U·(1 + eU/(2mc²)))   (de Broglie, relativistisch)
//  Modell: Wahrscheinlichkeitswelle hinter dem Spalt, Welcher-Weg-Messung.
// ============================================================================
import { viewHost } from '../js/lib/views.js';

const H = 6.626e-34, ME = 9.109e-31, QE = 1.602e-19, C = 2.998e8;
const G_SLIT = 2.0e-6, B_SLIT = 0.5e-6, A = 0.35, V = 20000;        // Spaltabstand, Spaltbreite, Abstand, Vergrößerung
const lamOf = U => H / Math.sqrt(2 * ME * QE * U * (1 + QE * U / (2 * ME * C * C)));
const lamNR = U => H / Math.sqrt(2 * ME * QE * U);
const sinc = u => Math.abs(u) < 1e-9 ? 1 : Math.sin(u) / u;
const NBAR = 300, X0 = 60, X1 = 940;

const svgMarkup = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Elektronenstrahlröhre mit Kanone, Doppelspalt, Linsen und Detektor; darunter das Detektorbild mit einzelnen Treffern, Maßstab und Messmarkern">
<defs>
  <linearGradient id="eBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2024"/><stop offset="1" stop-color="#121518"/></linearGradient>
  <linearGradient id="eTube" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb4c2" stop-opacity=".25"/><stop offset=".5" stop-color="#9fb4c2" stop-opacity=".05"/><stop offset="1" stop-color="#9fb4c2" stop-opacity=".2"/></linearGradient>
  <filter id="eGlow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="1000" height="620" fill="url(#eBg)"/>
<text x="40" y="34" fill="#8e979d" font-size="13">Elektronenstrahlröhre (Seitenansicht, nicht maßstäblich), Vakuum</text>
<g id="eSetup">
  <rect x="60" y="110" width="880" height="96" rx="48" fill="url(#eTube)" stroke="#6b7a85"/>
  <rect x="88" y="146" width="22" height="24" rx="3" fill="#ff8a3d" filter="url(#eGlow)"/><text x="99" y="230" fill="#8e979d" font-size="11" text-anchor="middle">Kathode</text>
  <rect x="124" y="132" width="10" height="52" fill="#6a7178"/><rect x="124" y="152" width="10" height="12" fill="#121518"/>
  <rect x="170" y="126" width="8" height="64" fill="#8a9095"/><rect x="170" y="154" width="8" height="8" fill="#121518"/><text x="174" y="230" fill="#8e979d" font-size="11" text-anchor="middle">Anode</text>
  <text id="eUT" x="140" y="96" fill="#ece6dc" font-size="13" text-anchor="middle" font-family="IBM Plex Mono, monospace">U = 50 kV</text>
  <rect x="330" y="122" width="6" height="72" fill="#8a9095"/>
  <rect id="eS1" x="330" y="150" width="6" height="4" fill="#121518"/><rect id="eS2" x="330" y="162" width="6" height="4" fill="#121518"/>
  <rect id="eB1" x="324" y="146" width="18" height="11" fill="#c4231b" opacity="0"/><rect id="eB2" x="324" y="159" width="18" height="11" fill="#c4231b" opacity="0"/>
  <text x="333" y="230" fill="#8e979d" font-size="11" text-anchor="middle">Doppelspalt g = 2 µm</text>
  <g id="eWW" opacity="0"><circle cx="352" cy="146" r="7" fill="none" stroke="#f2ac74" stroke-width="2"/><circle cx="352" cy="170" r="7" fill="none" stroke="#f2ac74" stroke-width="2"/><text x="364" y="100" fill="#f2ac74" font-size="11">Welcher-Weg-Detektor</text></g>
  <g fill="#b8692f" stroke="#6b3612"><rect x="500" y="100" width="34" height="18" rx="4"/><rect x="500" y="198" width="34" height="18" rx="4"/><rect x="650" y="100" width="34" height="18" rx="4"/><rect x="650" y="198" width="34" height="18" rx="4"/></g>
  <text x="592" y="240" fill="#8e979d" font-size="11" text-anchor="middle">Elektronenlinsen (Vergrößerung 20 000-fach)</text>
  <rect x="900" y="118" width="10" height="80" fill="#7dffb8" opacity=".55" filter="url(#eGlow)"/><text x="905" y="230" fill="#8e979d" font-size="11" text-anchor="middle">Detektor</text>
  <path d="M178 158 L330 158" stroke="#86dcff" stroke-width="1.4" opacity=".0" id="eBeam"/>
</g>
<g id="eWaveG" opacity="0">
  <rect x="34" y="40" width="932" height="236" rx="8" fill="#0a0c0e" stroke="#5a4b8a"/>
  <foreignObject x="40" y="46" width="920" height="224"><canvas xmlns="http://www.w3.org/1999/xhtml" id="eWaveCv" width="460" height="112" style="width:100%;height:100%;display:block"></canvas></foreignObject>
  <text id="eWaveT" x="50" y="66" fill="#c7b6ff" font-size="12"></text>
  <text id="eWaveT2" x="50" y="262" fill="#8e979d" font-size="11"></text>
</g>
<text x="40" y="290" fill="#8e979d" font-size="13">Detektorbild: jeder Punkt ist ein Elektron</text>
<text id="eN" x="960" y="290" fill="#ece6dc" font-size="13" text-anchor="end"></text>
<rect x="40" y="300" width="920" height="140" rx="6" fill="#06100b" stroke="#1f3a2c"/>
<g id="eHist" opacity="0"></g>
<g id="eHits" fill="#b8ffd8"></g>
<path id="eCurve" fill="none" stroke="#c7b6ff" stroke-width="1.6" opacity="0"/>
<rect x="40" y="440" width="920" height="54" fill="#efe9dc" stroke="#9c968a"/>
<g id="eRuler" font-family="IBM Plex Mono, monospace" font-size="11" fill="#111"></g>
<g id="eM1" style="cursor:ew-resize"><line y1="300" y2="494" stroke="#7fd6a0" stroke-width="1.6"/><rect x="-14" y="496" width="28" height="50" fill="transparent"/><path d="M0 500 l9 14 h-18z" fill="#7fd6a0"/><text y="540" fill="#7fd6a0" font-size="12" text-anchor="middle">1</text></g>
<g id="eM2" style="cursor:ew-resize"><line y1="300" y2="494" stroke="#ab93ff" stroke-width="1.6"/><rect x="-14" y="496" width="28" height="50" fill="transparent"/><path d="M0 500 l9 14 h-18z" fill="#ab93ff"/><text y="540" fill="#ab93ff" font-size="12" text-anchor="middle">2</text></g>
<text id="eDx" x="960" y="590" fill="#ece6dc" font-size="15" text-anchor="end" font-family="IBM Plex Mono, monospace">Δx = –</text>
<text x="40" y="590" fill="#8e979d" font-size="12">Maßstab in mm auf dem Detektor (nach der Vergrößerung)</text>
</svg>`;

export default {
  intro: 'Elektronen fliegen einzeln durch einen Doppelspalt. Jedes trifft den Detektor an genau einer Stelle, wie ein Teilchen. Nach Tausenden Treffern entsteht ein Streifenmuster, wie bei einer Welle. Aus dem Streifenabstand folgt die Wellenlänge der Elektronen, und sie passt zu λ = h/p.',
  docs: {
    durchfuehrung: `
<h3>Aufbau</h3>
<p>In einer Vakuumröhre werden Elektronen aus einer Glühkathode mit der Spannung U beschleunigt. Sie treffen auf eine Folie mit zwei Spalten im Abstand g = 2 µm (Breite 0,5 µm). Weil die Wellenlänge nur wenige Pikometer beträgt, ist das Muster sehr klein. Elektronenlinsen vergrößern es 20 000-fach auf den Detektor. Der Detektor meldet jedes einzelne Elektron als hellen Punkt.</p>
<h3>Durchführung</h3>
<ol>
<li>Strahlstrom auf „einzeln“ stellen. Beobachten, wo die Elektronen auftreffen. Ist ein Muster vorhersagbar?</li>
<li>Auf „schnell“ stellen und warten, bis sich ein deutliches Streifenmuster aufgebaut hat.</li>
<li>Marker 1 und 2 auf die Mitten zweier heller Streifen setzen, die Zahl k der Streifenabstände dazwischen einstellen und <b>Messwert übernehmen</b>.</li>
<li>Für mehrere Beschleunigungsspannungen wiederholen.</li>
<li>Einen Spalt schließen und danach die Welcher-Weg-Messung einschalten. Was passiert mit den Streifen?</li>
</ol>`,
    theorie: `
<h3>De-Broglie-Wellenlänge</h3>
<p>Ein Elektron mit dem Impuls p verhält sich bei der Ausbreitung wie eine Welle mit der Wellenlänge</p>
<span class="formula tex">\\lambda = \\frac{h}{p} \\quad\\text{mit}\\quad p = \\sqrt{2\\, m\\, e\\, U} \\quad\\Rightarrow\\quad \\lambda = \\frac{h}{\\sqrt{2\\, m\\, e\\, U}}</span>
<p>Bei 50 kV ist λ ≈ 5,4 pm. Ab etwa 10 kV merkt man die Relativitätstheorie: Der genaue Impuls ist <span class="tex">p = \\sqrt{2\\, m\\, e\\, U \\left(1 + \\frac{e\\, U}{2\\, m\\, c^2}\\right)}</span>. Bei 50 kV ist λ dadurch rund 2,4 % kleiner.</p>
<h3>Streifenabstand</h3>
<p>Wie beim Licht gilt für die Maxima g·sin α<sub>k</sub> = k·λ. Ohne Vergrößerung wäre der Streifenabstand <span class="tex">d_0 = \\frac{\\lambda\\, a}{g}</span>. Auf dem Detektor ist er V-mal so groß:</p>
<span class="formula tex">d = \\frac{V \\lambda\\, a}{g} \\quad\\Rightarrow\\quad \\lambda = \\frac{d\\, g}{V a} \\qquad (a = 0{,}35\\,\\text{m},\\ V = 20\\,000)</span>
<h3>Wahrscheinlichkeitsdeutung</h3>
<p>Wo ein einzelnes Elektron auftrifft, lässt sich nicht vorhersagen. Vorhersagbar ist nur die Wahrscheinlichkeit: Sie ist proportional zu |ψ|², dem Quadrat der Amplitude der Materiewelle. Viele Elektronen zeigen deshalb das Interferenzmuster, auch wenn sie einzeln nacheinander kommen.</p>
<h3>Welcher Weg?</h3>
<p>Ist nur ein Spalt offen, verschwinden die Streifen. Mit beiden Spalten offen ist das Muster nicht die Summe der beiden Einzelmuster: An manchen Stellen kommen mit zwei offenen Spalten weniger Elektronen an als mit einem. Misst man, durch welchen Spalt jedes Elektron geht, verschwindet das Interferenzmuster ebenfalls. Weg-Information und Interferenz schließen sich aus.</p>
<h3>Modellgrenzen</h3>
<ul><li>Spaltmaße und Vergrößerung sind an den Versuch von Claus Jönsson (Tübingen 1961) angelehnt, aber vereinfacht.</li><li>Die Welcher-Weg-Messung ist ein Gedankenexperiment. Hier wird sie als vollständiger Verlust der Interferenz dargestellt.</li></ul>
<h3>Was die Modellansicht zeigt</h3><ul><li><b>Wahrscheinlichkeitswelle</b> (Draufsicht, λ stark vergrößert): Hinter beiden Spalten breitet sich ψ aus und überlagert sich. Wo sich die Wellen verstärken, ist die Trefferwahrscheinlichkeit hoch.</li><li>Mit Welcher-Weg-Messung sind die Wellen beider Spalte unterscheidbar (blau und grün). Sie überlagern sich nicht mehr zu Streifen.</li><li>Über dem Detektor stehen das Histogramm der Treffer und die berechnete Kurve |ψ|².</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Beschleunigungsspannung</td><td>20 … 60 kV</td></tr>
<tr><td>Doppelspalt</td><td>g = 2,0 µm, b = 0,5 µm (Kupferfolie)</td></tr>
<tr><td>Abstand Spalt–Linsensystem</td><td>a = 0,35 m</td></tr>
<tr><td>Vergrößerung</td><td>V = 20 000 (Elektronenlinsen)</td></tr>
<tr><td>Detektor</td><td>Einzelelektronen-Nachweis, Bild 100 mm breit</td></tr>
</tbody></table>
<p class="muted" style="margin-top:12px">Echte Schulversuche zeigen meist die Elektronenbeugung an Graphit. Den Doppelspalt mit Elektronen gibt es als Film- und Bildmaterial (Jönsson 1961, Tonomura 1989).</p>`,
    abi: `
<details class="q"><summary>Berechne die De-Broglie-Wellenlänge für U = 40 kV (nichtrelativistisch). <span class="op">AFB I</span></summary><p>λ = h/√(2meU) = 6,626·10⁻³⁴ / √(2·9,109·10⁻³¹·1,602·10⁻¹⁹·4,0·10⁴) ≈ 6,1·10⁻¹² m.</p></details>
<details class="q"><summary>Auf dem Detektor liegen zwischen 10 Streifenabständen 182 mm (U = 50 kV). Bestimme λ. <span class="op">AFB II</span></summary><p>d = 18,2 mm. λ = d·g/(V·a) = 18,2·10⁻³ · 2,0·10⁻⁶ / (20000 · 0,35) ≈ 5,2·10⁻¹² m. Erwartet (relativistisch): 5,36 pm.</p></details>
<details class="q"><summary>Erkläre, warum das Streifenmuster auch entsteht, wenn sich immer nur ein Elektron in der Röhre befindet. <span class="op">AFB II</span></summary><p>Das Muster entsteht nicht durch Wechselwirkung vieler Elektronen. Für jedes einzelne Elektron gibt die Wahrscheinlichkeitswelle |ψ|² an, wo es mit welcher Wahrscheinlichkeit auftrifft. Erst die Summe vieler Einzeltreffer macht diese Verteilung sichtbar.</p></details>
<details class="q"><summary>Begründe, warum Elektronen weder reine Teilchen noch reine Wellen sind. <span class="op">AFB III</span></summary><p>Beim Nachweis verhalten sie sich wie Teilchen: ein Punkt, ganze Ladung, ganze Energie. Bei der Ausbreitung zeigen sie Interferenz wie eine Welle. Keines der beiden klassischen Modelle beschreibt beides. Die Quantenphysik beschreibt Elektronen als Quantenobjekte mit einer Wahrscheinlichkeitswelle.</p></details>
<details class="q"><summary>Was passiert, wenn man feststellt, durch welchen Spalt die Elektronen fliegen? <span class="op">AFB II</span></summary><p>Das Interferenzmuster verschwindet. Es bleibt die breite Verteilung der Beugung am Einzelspalt. Weg-Information und Interferenzfähigkeit schließen sich aus (Komplementarität).</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, segmented, check, button, fmt, dataTable, toast, display } = ui;
    const S = { U: 50000, open: 'both', ww: false, rate: 30, span: 100, k: 5, m1: -20, m2: 20, hits: [], ver: 0 };
    const changed = () => { S.ver++; S.hits.length = 0; };
    // Wahrscheinlichkeitsdichte auf dem Detektor (x in mm, nach der Vergrößerung)
    function prob(xmm) {
      const lam = lamOf(S.U), s = (xmm * 1e-3 / V) / A, env = sinc(Math.PI * B_SLIT * s / lam) ** 2;
      if (S.open !== 'both') return env * 0.5;
      if (S.ww) return env;                                  // Summe der beiden Einzelmuster
      return env * 2 * Math.cos(Math.PI * G_SLIT * s / lam) ** 2;
    }
    const PMAX = 2;

    const gQ = group('Elektronenkanone', { led: true }); gQ.led(true);
    const sU = slider({ label: 'Beschleunigungsspannung U', min: 20, max: 60, step: 1, value: 50, unit: 'kV', digits: 0, onInput: v => { S.U = v * 1000; changed(); } });
    const segR = segmented({ value: 30, options: [{ value: 0, label: 'aus' }, { value: 2, label: 'einzeln' }, { value: 30, label: 'langsam' }, { value: 600, label: 'schnell' }], onChange: v => { S.rate = v; gQ.led(v > 0); } });
    const dLam = display('λ = h/p (de Broglie)');
    gQ.append(sU, el('div', { class: 'ctl' }, el('label', { style: 'grid-column:1/-1' }, 'Strahlstrom'), el('div', { style: 'grid-column:1/-1' }, segR)), dLam);
    const gS = group('Spalte');
    const segO = segmented({ value: 'both', options: [{ value: 'both', label: 'beide offen' }, { value: 'left', label: 'nur oben' }, { value: 'right', label: 'nur unten' }], onChange: v => { S.open = v; changed(); } });
    const cWW = check({ label: 'Welcher-Weg-Messung', checked: false, onChange: v => { S.ww = v; changed(); } });
    gS.append(el('div', { class: 'ctl' }, el('div', { style: 'grid-column:1/-1' }, segO)), cWW, el('div', { class: 'bar' }, button('Detektor löschen', () => { S.hits.length = 0; S.ver++; })));
    const gM = group('Messung mit den Markern');
    const sK = slider({ label: 'Streifenabstände k zwischen den Markern', min: 1, max: 10, step: 1, value: S.k, onInput: v => { S.k = v; } });
    const dDx = display('Δx (Marker 1 → 2)'), dL2 = display('λ = Δx·g / (k·V·a)');
    gM.append(sK, dDx, dL2, el('div', { class: 'bar' }, button('Messwert übernehmen', () => take(), 'btn small primary')));
    controls.append(gQ, gS, gM);

    const rows = [];
    const tbl = dataTable([
      { key: 'U', label: 'U in kV', fmt: v => fmt(v / 1000, 0) }, { key: 'k', label: 'k', digits: 0 }, { key: 'dx', label: 'Δx in mm', digits: 1 },
      { key: 'd', label: 'd in mm', digits: 2 }, { key: 'lam', label: 'λ gemessen in pm', fmt: v => fmt(v * 1e12, 2) }, { key: 'lamDB', label: 'λ = h/p in pm', fmt: v => fmt(v * 1e12, 2) }
    ], { onDelete: i => { rows.splice(i, 1); redraw(); } });
    const figL = el('div', { class: 'fig' }), figP = el('div', { class: 'fig' });
    const chL = new Chart(figL, { xlabel: '1/√U in 1/√V', ylabel: 'λ in pm' }), chP = new Chart(figP, { xlabel: 'x in mm', ylabel: 'Treffer je Bereich', ymin: 0 });
    const resL = el('div', { class: 'result' });
    messwerte.append(
      el('div', { class: 'data' },
        el('div', { class: 'chartbox' }, el('h4', {}, 'Auswertung: λ über 1/√U'), figL, resL,
          csvTools(() => ({ meta: ['Elektronen-Doppelspalt', `g = ${G_SLIT} m, a = ${A} m, V = ${V}`], columns: [{ key: 'U', label: 'U in V' }, { key: 'k', label: 'k' }, { key: 'dx', label: 'Delta x in mm' }, { key: 'd', label: 'd in mm' }, { key: 'lam', label: 'lambda in m' }, { key: 'lamDB', label: 'lambda h/p in m' }], rows }), 'elektronen_doppelspalt')),
        el('div', { class: 'chartbox' }, el('h4', {}, 'Verteilung der Treffer'), figP,
          el('p', { class: 'muted', style: 'font-size:13px;margin:8px 0 0' }, 'Violett gestrichelt: berechnete Wahrscheinlichkeit |ψ|², auf die Trefferzahl skaliert.'))),
      el('div', { style: 'height:14px' }), tbl);
    function redraw() {
      tbl.render(rows);
      const pts = rows.map(r => [1 / Math.sqrt(r.U), r.lam * 1e12]); const fits = []; let txt = '<span>Mindestens zwei Spannungen messen.</span>';
      if (new Set(rows.map(r => r.U)).size >= 2) { const f = fit.propFit(pts.map(p => p[0]), pts.map(p => p[1])); if (f) { fits.push({ f: f.f, color: '#ab93ff' }); const h = f.a * 1e-12 * Math.sqrt(2 * ME * QE); txt = `<div><span>Steigung = h/√(2me)</span><br><b>h = ${fmt(h / 1e-34, 2)}·10⁻³⁴ J·s</b> <span>· Tabelle 6,63·10⁻³⁴ J·s</span></div>`; } }
      chL.set([{ color: '#7dffb8', mode: 'dot', points: pts }], fits); resL.innerHTML = txt;
    }
    redraw();
    let histVer = -1, histN = -1;
    function drawHist() {
      if (histVer === S.ver && Math.abs(histN - S.hits.length) < 50) return; histVer = S.ver; histN = S.hits.length;
      const nb = 120, cnt = new Array(nb).fill(0); for (const [x] of S.hits) { const b = Math.floor((x + S.span / 2) / S.span * nb); if (b >= 0 && b < nb) cnt[b]++; }
      const pts = []; cnt.forEach((c, i) => { const x0 = -S.span / 2 + i * S.span / nb; pts.push([x0, c], [x0 + S.span / nb, c]); });
      // erwartete Trefferzahl je Bereich: N · p(x)·Δx / ∫p
      let Z = 0; for (let i = 0; i < 2000; i++) Z += prob(-S.span / 2 + S.span * (i + 0.5) / 2000) * S.span / 2000;
      const N = S.hits.length, bw = S.span / nb;
      chP.o.xmin = -S.span / 2; chP.o.xmax = S.span / 2;
      chP.set([{ color: '#7dffb8', points: pts }], N > 20 ? [{ f: x => N * prob(x) * bw / Z, color: '#ab93ff' }] : []);
    }
    function take() {
      const dx = Math.abs(S.m2 - S.m1); if (dx < 1) { toast('Die Marker liegen aufeinander.'); return; }
      if (S.hits.length < 300) { toast('Noch zu wenige Treffer. Strahlstrom auf „schnell“ stellen und warten.'); return; }
      const d = dx / S.k, lam = d * 1e-3 * G_SLIT / (V * A);
      rows.push({ U: S.U, k: S.k, dx, d, lam, lamDB: lamOf(S.U) }); redraw(); toast(`Übernommen: λ ≈ ${fmt(lam * 1e12, 2)} pm (h/p = ${fmt(lamOf(S.U) * 1e12, 2)} pm)`);
    }
    function hit() { for (let k = 0; k < 400; k++) { const x = (Math.random() - 0.5) * S.span; if (Math.random() * PMAX < prob(x)) return [x, (Math.random() - 0.5) * 0.92]; } return null; }

    // ======================= Ansicht 2D =======================
    async function view2d(box, MM) {
      box.insertAdjacentHTML('beforeend', svgMarkup());
      const svg = box.querySelector('svg'), q = id => svg.querySelector('#' + id);
      const xToSvg = mm => 500 + mm * (X1 - X0) / S.span, svgToX = sx => (sx - 500) * S.span / (X1 - X0);
      { let h = ''; for (let mm = -50; mm <= 50; mm += 1) { const x = xToSvg(mm), maj = mm % 10 === 0, mid = !maj && mm % 5 === 0; h += `<rect x="${(x - 0.5).toFixed(1)}" y="440" width="1" height="${maj ? 18 : mid ? 12 : 7}"/>`; if (maj) h += `<text x="${x.toFixed(1)}" y="475" text-anchor="middle">${mm}</text>`; } q('eRuler').innerHTML = h; }
      const cv = q('eWaveCv'), cx = cv.getContext('2d'), W = cv.width, Hc = cv.height, img = cx.createImageData(W, Hc);
      function drawWaves(t) {
        const lamPx = 7 + (lamOf(S.U) - lamOf(60000)) / (lamOf(20000) - lamOf(60000)) * 5, gPx = 4.5 * lamPx, sx0 = 70, cy = Hc / 2, k = 2 * Math.PI / lamPx, w = 2 * Math.PI * 1.1;
        const o1 = S.open !== 'right', o2 = S.open !== 'left', d = img.data; let i = 0;
        for (let y = 0; y < Hc; y++) for (let x = 0; x < W; x++, i += 4) {
          let r = 0, g = 0, b = 0;
          if (x < sx0) { const a = Math.max(0, Math.cos(k * x - w * t)) ** 1.4; r = 120 * a; g = 110 * a; b = 255 * a; }
          else if (x < sx0 + 2) { const inS = (o1 && Math.abs(y - (cy - gPx / 2)) < 2) || (o2 && Math.abs(y - (cy + gPx / 2)) < 2); if (!inS) { r = 70; g = 76; b = 82; } }
          else {
            const r1 = Math.hypot(x - sx0, y - cy + gPx / 2), r2 = Math.hypot(x - sx0, y - cy - gPx / 2), f = Math.min(1.3, 9 / Math.sqrt((r1 + r2) / 2 + 1));
            const v1 = o1 ? Math.cos(k * r1 - w * t) * f : 0, v2 = o2 ? Math.cos(k * r2 - w * t) * f : 0;
            if (S.ww) { const a1 = Math.max(0, v1) ** 1.4, a2 = Math.max(0, v2) ** 1.4; r = 40 * a2; g = 210 * a2 + 90 * a1; b = 255 * a1; }
            else { const a = Math.max(0, (v1 + v2) * 0.5 * (o1 && o2 ? 1 : 1.6)) ** 1.4; r = 150 * a; g = 130 * a; b = 255 * a; }
          }
          d[i] = 10 + r; d[i + 1] = 12 + g; d[i + 2] = 14 + b; d[i + 3] = 255;
        }
        cx.putImageData(img, 0, 0);
        q('eWaveT').textContent = 'Modell (Draufsicht, λ stark vergrößert): Wahrscheinlichkeitswelle ψ hinter dem Doppelspalt';
        q('eWaveT2').textContent = S.ww ? 'Mit Weg-Information: Die Wellen beider Spalte bleiben unterscheidbar und interferieren nicht.' : S.open !== 'both' ? 'Nur ein Spalt offen: eine einzige Welle, keine Interferenzstreifen.' : 'Helle Richtungen: hohe Trefferwahrscheinlichkeit. Wo genau ein Elektron landet, ist Zufall.';
      }
      let drag = null;
      const toSvgX = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()).x; };
      for (const [id, key] of [['eM1', 'm1'], ['eM2', 'm2']]) {
        const m = q(id); m.addEventListener('pointerdown', e => { drag = key; svg.setPointerCapture(e.pointerId); e.preventDefault(); });
        m.setAttribute('tabindex', '0'); m.setAttribute('role', 'slider'); m.setAttribute('aria-label', `Marker ${key.slice(1)}`);
        m.addEventListener('keydown', e => { const d = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0; if (!d) return; e.preventDefault(); S[key] = Math.max(-S.span / 2, Math.min(S.span / 2, +(S[key] + d * (e.shiftKey ? 1 : 0.1)).toFixed(1))); });
      }
      svg.addEventListener('pointermove', e => { if (!drag) return; S[drag] = Math.round(Math.max(-S.span / 2, Math.min(S.span / 2, svgToX(toSvgX(e)))) * 10) / 10; });
      svg.addEventListener('pointerup', () => { drag = null; });
      let raf = 0, ver = -1, nDrawn = 0, flash = [];
      const t0 = performance.now();
      function frame(now) {
        raf = requestAnimationFrame(frame);
        const model = MM.model, t = (now - t0) / 1000;
        if (ver !== S.ver) {
          ver = S.ver; nDrawn = 0; q('eHits').innerHTML = '';
          q('eUT').textContent = `U = ${fmt(S.U / 1000, 0)} kV`;
          q('eB1').setAttribute('opacity', S.open === 'right' ? 1 : 0); q('eB2').setAttribute('opacity', S.open === 'left' ? 1 : 0);
          q('eWW').setAttribute('opacity', S.ww ? 1 : 0);
          let d = ''; for (let i = 0; i <= 400; i++) { const x = -S.span / 2 + S.span * i / 400; d += `${i ? 'L' : 'M'}${xToSvg(x).toFixed(1)} ${(436 - prob(x) / PMAX * 120).toFixed(1)}`; } q('eCurve').setAttribute('d', d);
        }
        let h = '';
        for (; nDrawn < S.hits.length; nDrawn++) { const [x, y] = S.hits[nDrawn]; h += `<rect x="${(xToSvg(x) - 0.8).toFixed(1)}" y="${(370 + y * 66 - 0.8).toFixed(1)}" width="1.6" height="1.6"/>`; if (S.rate <= 30) flash.push({ x, y, t }); }
        if (h) q('eHits').insertAdjacentHTML('beforeend', h);
        // frische Treffer kurz aufblitzen lassen
        flash = flash.filter(f => t - f.t < 0.5);
        q('eHist').innerHTML = flash.map(f => `<circle cx="${xToSvg(f.x).toFixed(1)}" cy="${(370 + f.y * 66).toFixed(1)}" r="${(2 + 8 * (t - f.t)).toFixed(1)}" fill="none" stroke="#b8ffd8" opacity="${(1 - (t - f.t) * 2).toFixed(2)}"/>`).join(''); q('eHist').setAttribute('opacity', 1);
        q('eN').textContent = `${S.hits.length} Elektronen`;
        for (const [id, v] of [['eM1', S.m1], ['eM2', S.m2]]) q(id).setAttribute('transform', `translate(${xToSvg(v).toFixed(1)} 0)`);
        const dx = Math.abs(S.m2 - S.m1); q('eDx').textContent = `Δx = ${fmt(dx, 1)} mm   ·   k = ${S.k}   ·   d = ${fmt(dx / S.k, 2)} mm`;
        q('eWaveG').setAttribute('opacity', model ? 1 : 0); q('eCurve').setAttribute('opacity', model ? 0.9 : 0);
        if (model) drawWaves(t);
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); } };
    }

    // ======================= Ansicht 3D =======================
    async function view3d(box, MM) {
      const { createLab, mats, cable, powerSupply, label, glassMaterial, glowPool } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [0.1, 0.42, 0.95], target: [0.15, 0.17, 0], table: [2.2, 1.4], bloom: [0.9, 0.5, 0.8], room: 0.2, minDist: 0.15, maxDist: 3, fov: 36 });
      const { THREE, scene } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad · Gemessen wird im 2D-Aufbau</div>');
      const Y = 0.17, XK = -0.32, XS = -0.08, XD = 0.52, R = 0.04;
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(R, R, XD - XK + 0.06, 40, 1, true), glassMaterial(THREE)); glass.rotation.z = Math.PI / 2; glass.position.set((XK + XD) / 2, Y, 0); scene.add(glass);
      for (const x of [XK - 0.03, XD + 0.03]) { const cap = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.004, R + 0.004, 0.012, 40), M.housing); cap.rotation.z = Math.PI / 2; cap.position.set(x, Y, 0); scene.add(cap); }
      for (const x of [XK + 0.05, XD - 0.08]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, Y - R, 12), M.steel); st.position.set(x, (Y - R) / 2, 0); scene.add(st); const f = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.012, 0.08), M.housing); f.position.set(x, 0.006, 0); scene.add(f); const cl = new THREE.Mesh(new THREE.TorusGeometry(R + 0.004, 0.004, 8, 32), M.black); cl.rotation.y = Math.PI / 2; cl.position.set(x, Y, 0); scene.add(cl); }
      // Kanone
      const cath = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.01, 16), new THREE.MeshBasicMaterial({ color: 0xff8a3d, toneMapped: false })); cath.rotation.z = Math.PI / 2; cath.position.set(XK, Y, 0); scene.add(cath);
      const wehnelt = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 24, 1, true), M.steel); wehnelt.rotation.z = Math.PI / 2; wehnelt.position.set(XK + 0.012, Y, 0); scene.add(wehnelt);
      const anode = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.003, 32), M.steel); anode.rotation.z = Math.PI / 2; anode.position.set(XK + 0.06, Y, 0); scene.add(anode);
      // Spaltfolie und Linsen
      const foil = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.002, 32), M.copper); foil.rotation.z = Math.PI / 2; foil.position.set(XS, Y, 0); scene.add(foil);
      for (const x of [0.12, 0.27]) { const coil = new THREE.Mesh(new THREE.TorusGeometry(R + 0.012, 0.01, 12, 40), M.copper); coil.rotation.y = Math.PI / 2; coil.position.set(x, Y, 0); coil.castShadow = true; scene.add(coil); }
      // Detektorschirm mit Treffern
      const cvs = document.createElement('canvas'); cvs.width = 512; cvs.height = 512; const sg = cvs.getContext('2d'); const sTex = new THREE.CanvasTexture(cvs); sTex.colorSpace = THREE.SRGBColorSpace;
      const scr = new THREE.Mesh(new THREE.CircleGeometry(R - 0.002, 48), new THREE.MeshBasicMaterial({ map: sTex, toneMapped: false })); scr.rotation.y = -Math.PI / 2; scr.position.set(XD, Y, 0); scene.add(scr);
      const wwRing = new THREE.Mesh(new THREE.TorusGeometry(0.006, 0.0012, 8, 24), new THREE.MeshBasicMaterial({ color: 0xf2ac74, toneMapped: false })); wwRing.rotation.y = Math.PI / 2; wwRing.position.set(XS + 0.01, Y, 0); scene.add(wwRing);
      const psu = powerSupply(THREE, { w: 0.24, h: 0.13, d: 0.2, label: 'Hochspannung 0 … 60 kV', displays: 1, knobs: 2, sockets: ['red', 'black'] }); psu.position.set(-0.38, 0, 0.32); psu.rotation.y = 0.4; scene.add(psu); scene.updateMatrixWorld(true);
      scene.add(cable(THREE, psu.socketWorld(0), new THREE.Vector3(XK - 0.03, Y, 0.0), 0xc4231b, 0.1), cable(THREE, psu.socketWorld(1), new THREE.Vector3(XK + 0.06, Y - R, 0), 0x151515, 0.08));
      // Modell
      const waveMat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
        uniforms: { t: { value: 0 }, lam: { value: 0.006 }, g: { value: 0.024 }, o1: { value: 1 }, o2: { value: 1 }, ww: { value: 0 } },
        vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
        fragmentShader: `uniform float t, lam, g, o1, o2, ww; varying vec2 vP;
          void main(){ float x = vP.x + 0.3; float y = vP.y; float k = 6.2831/lam;
            float v1 = o1 * cos(k*length(vec2(x, y - g*0.5)) - 7.0*t), v2 = o2 * cos(k*length(vec2(x, y + g*0.5)) - 7.0*t);
            float fade = smoothstep(0.0, 0.01, x) * (1.0 - smoothstep(0.5, 0.6, x)) * (1.0 - smoothstep(0.022, 0.036, abs(y)));
            vec3 c; float a;
            if (ww > 0.5) { float a1 = pow(max(v1,0.),1.5), a2 = pow(max(v2,0.),1.5); c = vec3(0.1, 0.8*a2 + 0.35*a1, a1); a = max(a1, a2); }
            else { a = pow(max((v1 + v2) * 0.5 * (o1*o2 > 0.5 ? 1.0 : 1.6), 0.), 1.5); c = vec3(0.6, 0.5, 1.0) * a; }
            gl_FragColor = vec4(c * 1.4, min(1., a) * 0.85 * fade); }`
      });
      const wave = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.075), waveMat); wave.rotation.x = -Math.PI / 2; wave.position.set(XS + 0.3, Y, 0); scene.add(wave);
      const lW = label(THREE, 'Modell: Wahrscheinlichkeitswelle ψ (λ stark vergrößert)', { color: '#c7b6ff', size: 0.016 }); lW.position.set(0.15, Y + 0.075, 0); scene.add(lW);
      const ePool = glowPool(THREE, scene, 20, 0x86dcff, 0.008); const fly = [];
      let ver = -1, nDrawn = 0, flyAcc = 0;
      const off = lab.onFrame((dt, t) => {
        const model = MM.model;
        psu.displays[0].draw((S.U / 1000).toFixed(0), 'kV'); psu.setKnob(0, (S.U - 20000) / 40000);
        if (ver !== S.ver) { ver = S.ver; nDrawn = 0; sg.fillStyle = '#06100b'; sg.fillRect(0, 0, 512, 512); waveMat.uniforms.o1.value = S.open !== 'right' ? 1 : 0; waveMat.uniforms.o2.value = S.open !== 'left' ? 1 : 0; waveMat.uniforms.ww.value = S.ww ? 1 : 0; wwRing.visible = S.ww; }
        if (nDrawn < S.hits.length) { sg.fillStyle = '#b8ffd8'; for (; nDrawn < S.hits.length; nDrawn++) { const [x, y] = S.hits[nDrawn]; sg.fillRect(256 - x / S.span * 480 - 1, 256 + y * 200 - 1, 2.4, 2.4); } sTex.needsUpdate = true; }
        wave.visible = lW.visible = model; waveMat.uniforms.t.value = t;
        waveMat.uniforms.lam.value = 0.0045 + (lamOf(S.U) - lamOf(60000)) / (lamOf(20000) - lamOf(60000)) * 0.003; waveMat.uniforms.g.value = waveMat.uniforms.lam.value * 4.5;
        // Modell: Elektronen als Punkte von der Kathode bis zum Spalt, dahinter nur die Welle
        if (model && S.rate > 0) { flyAcc += dt * Math.min(8, S.rate); while (flyAcc > 1) { flyAcc -= 1; if (fly.length < 20) fly.push({ t0: t, z: (Math.random() - 0.5) * 0.004 }); } }
        for (let i = fly.length - 1; i >= 0; i--) if (t - fly[i].t0 > 0.5 || !model) fly.splice(i, 1);
        ePool.items.forEach((s, i) => { const f = fly[i]; s.visible = !!f; if (!f) return; const k = (t - f.t0) / 0.5; s.position.set(XK + 0.01 + (XS - XK - 0.01) * k, Y, f.z); s.material.opacity = k < 0.85 ? 1 : (1 - k) / 0.15; });
      });
      return { destroy() { off(); lab.dispose(); } };
    }

    const host = viewHost(stage, { id: 'elektronen-doppelspalt', views: { '2d': view2d, '3d': view3d }, initial: '2d', modelInfo: 'Wahrscheinlichkeitswelle ψ, Welcher-Weg' });

    let raf = 0, last = performance.now(), acc = 0, slow = 0;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      if (S.rate > 0 && S.hits.length < 30000) { acc += dt * S.rate; while (acc > 1) { acc -= 1; const h = hit(); if (h) S.hits.push(h); } } else acc = 0;
      slow += dt; if (slow > 0.15) { slow = 0; dLam.set(`${fmt(lamOf(S.U) * 1e12, 2)} pm`); const dx = Math.abs(S.m2 - S.m1); dDx.set(`${fmt(dx, 1)} mm`); dL2.set(`${fmt(dx / S.k * 1e-3 * G_SLIT / (V * A) * 1e12, 2)} pm`); drawHist(); }
    }
    raf = requestAnimationFrame(loop);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); chL.destroy(); chP.destroy(); } };
  }
};
