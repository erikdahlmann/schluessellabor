// ============================================================================
//  Schlüsselexperiment: Photoeffekt – Gegenfeldmethode, Bestimmung von h
//  2D-Aufbau (SVG): Quecksilberdampflampe, Interferenzfilter, Fotozelle,
//  Gegenspannungsquelle und Messverstärker (nA) bzw. Elektrometer (Kondensatormethode).
//  Modell: I(U) = I_ph·(1 − U/U₀)² für U < U₀, dazu ein kleiner Gegenstrom aus der Anode.
// ============================================================================
const E = 1.602176634e-19, H = 6.62607015e-34, C0 = 299792458;
const LINES = [
  { id: 'gelb', name: 'gelb', nm: 578.0, qe: 0.30 },
  { id: 'gruen', name: 'grün', nm: 546.1, qe: 0.55 },
  { id: 'blau', name: 'blau', nm: 435.8, qe: 0.85 },
  { id: 'violett', name: 'violett', nm: 404.7, qe: 0.70 },
  { id: 'uv', name: 'UV', nm: 365.0, qe: 1.00 }
];
const W_EFF = 1.78 + (Math.random() * 0.1 - 0.05);  // effektive Austrittsarbeit inkl. Kontaktspannung, eV
const I_REV = 0.003;                                 // Gegenstrom aus der Anode, Anteil von I_ph (macht U₀ einige Prozent zu klein)
const U0of = l => Math.max(0, 1239.84 / l.nm - W_EFF);

function lineColor(id) { return { gelb: '#ffd84a', gruen: '#62e06e', blau: '#4f8dff', violett: '#9a5cff', uv: '#b98cff' }[id]; }

const svgMarkup = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Quecksilberdampflampe, Filter, Fotozelle mit Kathode und Anode, Gegenspannungsquelle und Messverstärker">
<defs>
  <linearGradient id="pBench" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2024"/><stop offset="1" stop-color="#121518"/></linearGradient>
  <linearGradient id="pBox" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4046"/><stop offset="1" stop-color="#23282c"/></linearGradient>
  <radialGradient id="pGlass" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#9fb4c2" stop-opacity=".18"/><stop offset=".85" stop-color="#9fb4c2" stop-opacity=".05"/><stop offset="1" stop-color="#cfe2ee" stop-opacity=".35"/></radialGradient>
  <linearGradient id="pCath" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a4a28"/><stop offset="1" stop-color="#c9a85a"/></linearGradient>
  <filter id="pGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="pSh" x="-10%" y="-10%" width="130%" height="150%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000" flood-opacity=".55"/></filter>
  <g id="pSock"><circle r="8" fill="currentColor" stroke="#000" stroke-opacity=".5"/><circle r="3.4" fill="#c8a24a"/></g>
</defs>
<rect width="1000" height="620" fill="url(#pBench)"/>
<!-- Lampe -->
<g filter="url(#pSh)">
  <rect x="40" y="110" width="150" height="150" rx="10" fill="url(#pBox)" stroke="#4a5157"/>
  <rect x="80" y="260" width="70" height="40" fill="#2a2f33"/><rect x="60" y="296" width="110" height="10" rx="3" fill="#3a4045"/>
</g>
<circle id="pLampGlow" cx="115" cy="185" r="34" fill="#c9d6ff" opacity=".0" filter="url(#pGlow)"/>
<rect x="104" y="150" width="22" height="70" rx="11" fill="#dfe8ff" opacity=".35"/>
<rect x="190" y="168" width="34" height="34" fill="#2a2f33" stroke="#4a5157"/>
<text x="115" y="132" fill="#c9c3ba" font-size="12" text-anchor="middle">Hg-Dampflampe</text>
<circle id="pLampLed" cx="58" cy="246" r="4" fill="#333"/>
<!-- Filter -->
<g filter="url(#pSh)"><rect x="262" y="140" width="22" height="90" rx="3" fill="#30363b" stroke="#4b5257"/></g>
<rect id="pFilter" x="266" y="160" width="14" height="50" rx="2" fill="#62e06e" opacity=".8"/>
<text x="273" y="128" fill="#c9c3ba" font-size="12" text-anchor="middle">Filter</text>
<text id="pFilterLbl" x="273" y="252" fill="#8e979d" font-size="11" text-anchor="middle">546 nm</text>
<!-- Linse/Blende -->
<path d="M340 150 Q352 185 340 220 Q328 185 340 150Z" fill="#9fc4ff" opacity=".25" stroke="#9fc4ff" stroke-opacity=".5"/>
<text x="340" y="252" fill="#8e979d" font-size="11" text-anchor="middle" id="pIntLbl">Blende 100 %</text>
<!-- Lichtbündel -->
<path id="pBeam1" d="M224 175 L262 172 L262 198 L224 195Z" fill="#dfe8ff" opacity=".35"/>
<path id="pBeam2" d="M284 172 L340 168 L655 172 L655 198 L340 202 L284 198Z" fill="#62e06e" opacity=".35"/>
<!-- Fotozelle -->
<g filter="url(#pSh)"><rect x="520" y="300" width="120" height="28" rx="4" fill="#2a2f33"/></g>
<circle cx="580" cy="185" r="112" fill="url(#pGlass)" stroke="#9fb4c2" stroke-opacity=".5" stroke-width="1.4"/>
<rect x="560" y="290" width="40" height="14" fill="#9fb4c2" opacity=".25"/>
<path d="M640 115 A88 88 0 0 1 640 255" fill="none" stroke="url(#pCath)" stroke-width="10"/>
<path d="M640 115 A88 88 0 0 1 640 255" fill="none" stroke="#e8c97a" stroke-width="2" opacity=".5"/>
<text x="700" y="110" fill="#c9c3ba" font-size="12">Kathode (Kalium)</text>
<circle cx="600" cy="185" r="18" fill="none" stroke="#c9d0d4" stroke-width="2.2"/>
<line x1="600" y1="203" x2="600" y2="300" stroke="#c9d0d4" stroke-width="2"/>
<text x="560" y="150" fill="#c9c3ba" font-size="12" text-anchor="end">Anode (Ring)</text>
<line x1="700" y1="185" x2="700" y2="300" stroke="#c9a85a" stroke-width="2"/>
<g id="pElectrons" fill="#86dcff" filter="url(#pGlow)"></g>
<text x="580" y="58" fill="#c9c3ba" font-size="12" text-anchor="middle">Fotozelle (Vakuum)</text>
<!-- Leitungen -->
<g fill="none" stroke-width="5" stroke-linecap="round" opacity=".95">
  <path d="M600 300 V360 H430 V420" stroke="#c4231b"/>
  <path d="M700 300 V360 H780 V420" stroke="#151515"/>
  <path d="M470 470 H720" stroke="#1f4fb8"/>
</g>
<!-- Gegenspannungsquelle -->
<g filter="url(#pSh)"><rect x="340" y="420" width="250" height="150" rx="10" fill="url(#pBox)" stroke="#4a5157"/></g>
<text x="356" y="444" fill="#c9c3ba" font-size="13">Gegenspannung 0 … 3 V</text>
<rect x="356" y="456" width="150" height="50" rx="4" fill="#170807" stroke="#3a1a17"/>
<text id="pDispU" x="496" y="493" text-anchor="end" fill="#ff6a4d" font-size="30" font-family="IBM Plex Mono, monospace" filter="url(#pGlow)">0.000</text>
<text x="512" y="500" fill="#ff6a4d" font-size="12">V</text>
<text x="356" y="536" fill="#8e979d" font-size="11">+ an der Kathode, − an der Anode</text>
<use href="#pSock" x="430" y="556" color="#c4231b"/><use href="#pSock" x="470" y="556" color="#1f4fb8"/>
<!-- Messverstärker -->
<g filter="url(#pSh)"><rect x="640" y="420" width="300" height="150" rx="10" fill="#d9dbd7" stroke="#a9aca7"/></g>
<rect x="652" y="432" width="276" height="22" rx="4" fill="#1f4fb8"/>
<text id="pAmpTitle" x="790" y="448" text-anchor="middle" fill="#fff" font-size="12.5" font-weight="600">Messverstärker · Strom</text>
<rect x="652" y="462" width="276" height="62" rx="5" fill="#0b1410" stroke="#1d2a23"/>
<text id="pAmpLbl" x="662" y="478" fill="#7ea592" font-size="10">Fotostrom</text>
<text id="pDispI" x="916" y="512" text-anchor="end" fill="#b7ffd6" font-size="30" font-family="IBM Plex Mono, monospace" filter="url(#pGlow)">0,000 nA</text>
<use href="#pSock" x="720" y="550" color="#1f4fb8"/><use href="#pSock" x="780" y="550" color="#151515"/>
<text x="840" y="554" fill="#444" font-size="11" id="pAmpRange">Bereich 10 nA</text>
<!-- Energieskizze -->
<g transform="translate(40 340)">
  <rect width="270" height="230" rx="10" fill="#101316" stroke="#262d33"/>
  <text x="14" y="24" fill="#8e979d" font-size="12">Energiebilanz eines Elektrons</text>
  <g id="pBars"></g>
</g>
</svg>`;

export default {
  intro: 'Licht einer Quecksilberdampflampe löst Elektronen aus der Kathode einer Fotozelle. Eine Gegenspannung bremst sie ab. Bei welcher Spannung <i>U₀</i> kein Strom mehr fließt, hängt nur von der Frequenz des Lichts ab – nicht von seiner Helligkeit. Aus <i>U₀(f)</i> bestimmt ihr das Planck’sche Wirkungsquantum <i>h</i>.',
  docs: {
    durchfuehrung: `
<h3>Aufbau</h3>
<p>Das Licht einer Quecksilberdampflampe fällt durch ein Interferenzfilter (eine Spektrallinie) und eine Irisblende auf die Kathode einer Vakuum-Fotozelle. Zwischen Kathode und Ringanode liegt eine regelbare <b>Gegenspannung</b>: Die Anode ist negativ gegenüber der Kathode. Ein empfindlicher Messverstärker misst den Fotostrom (Nanoampere).</p>
<h3>Durchführung (Gegenfeldmethode)</h3>
<ol>
<li>Lampe einschalten und einige Minuten warten, bis sie ihre volle Helligkeit erreicht (hier verkürzt).</li>
<li>Filter wählen. Bei <i>U</i> = 0 fließt der größte Fotostrom.</li>
<li>Gegenspannung langsam erhöhen, bis der Strom gerade null ist. Diese Spannung ist <i>U₀</i>. <b>U₀ übernehmen</b>.</li>
<li>Für alle fünf Linien wiederholen. Zusätzlich bei einer Linie die Blende verändern: <i>U₀</i> bleibt gleich, nur der Strom ändert sich.</li>
<li>Optional: <b>Kennlinie aufnehmen</b> zeigt den ganzen Verlauf <i>I(U)</i>.</li>
</ol>
<h3>Variante: Kondensatormethode</h3>
<p>Ohne äußere Spannung lädt sich die Fotozelle selbst auf, bis keine Elektronen mehr die Anode erreichen. Ein Elektrometerverstärker (sehr großer Eingangswiderstand) zeigt dann direkt <i>U₀</i>. Bei schwachem Licht dauert das Aufladen länger, der Endwert bleibt gleich.</p>
<div class="callout">Sicherheit: Die Hg-Lampe sendet UV-Strahlung aus. Nicht direkt in die Lampe blicken, Gehäuse geschlossen lassen. Die heiße Lampe nicht berühren.</div>`,
    theorie: `
<h3>Einstein’sche Gleichung</h3>
<p>Licht besteht aus Photonen der Energie <i>E = h·f</i>. Ein Photon gibt seine ganze Energie an ein Elektron ab. Ein Teil wird gebraucht, um das Elektron aus dem Metall zu lösen (Austrittsarbeit <i>W<sub>A</sub></i>), der Rest ist Bewegungsenergie:</p>
<span class="formula">h·f = W<sub>A</sub> + E<sub>kin,max</sub></span>
<h3>Gegenfeldmethode</h3>
<p>Die schnellsten Elektronen erreichen die Anode gerade nicht mehr, wenn ihre Bewegungsenergie gleich der Arbeit im Gegenfeld ist:</p>
<span class="formula">e·U₀ = E<sub>kin,max</sub>    ⇒    U₀ = (h/e)·f − W<sub>A</sub>/e</span>
<p>Im <i>U₀</i>-<i>f</i>-Diagramm liegen die Messpunkte auf einer Geraden. Die <b>Steigung ist h/e</b>, der Achsenabschnitt <i>−W<sub>A</sub>/e</i>. Der Schnittpunkt mit der f-Achse ist die Grenzfrequenz <i>f<sub>G</sub> = W<sub>A</sub>/h</i>.</p>
<h3>Was die Wellenvorstellung nicht erklärt</h3>
<ul><li><i>U₀</i> hängt nicht von der Lichtintensität ab, nur von der Frequenz.</li>
<li>Unterhalb der Grenzfrequenz werden auch bei großer Helligkeit keine Elektronen ausgelöst.</li>
<li>Der Strom setzt ohne Verzögerung ein.</li></ul>
<h3>Modellgrenzen und Fehlerquellen</h3>
<ul><li>Zwischen Kathode und Anode besteht eine Kontaktspannung. Sie verschiebt alle <i>U₀</i>-Werte gleich, verändert die Steigung also nicht. Die gemessene „Austrittsarbeit“ ist deshalb eine effektive Größe.</li>
<li>Auch aus der Anode werden einige Elektronen ausgelöst. Dieser kleine Gegenstrom lässt den Strom schon kurz vor <i>U₀</i> null werden – die Werte fallen etwas zu klein aus.</li>
<li>Der Stromverlauf vor <i>U₀</i> ist hier vereinfacht als Parabel angesetzt.</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Lichtquelle</td><td>Hg-Hochdrucklampe, Linien 578 · 546 · 436 · 405 · 365 nm</td></tr>
<tr><td>Filter</td><td>Interferenzfilter je Linie, Irisblende</td></tr>
<tr><td>Fotozelle</td><td>Kalium-Kathode (Kugelschicht), Ringanode, Vakuum</td></tr>
<tr><td>Gegenspannung</td><td>0 … 3 V, Auflösung 1 mV</td></tr>
<tr><td>Messverstärker</td><td>Strom 10 nA (Rauschen ≈ 5 pA) · Elektrometer Rᵢ &gt; 10¹³ Ω</td></tr>
</tbody></table>
<p class="muted" style="margin-top:12px">Literaturwert: h = 6,626·10⁻³⁴ J·s, h/e = 4,136·10⁻¹⁵ V·s. Schulmessungen liegen meist innerhalb von 5–10 %.</p>`,
    abi: `
<details class="q"><summary>Erkläre, warum U₀ nicht von der Lichtintensität abhängt. <span class="op">AFB II</span></summary><p>Höhere Intensität bedeutet mehr Photonen pro Sekunde, nicht energiereichere. Jedes Elektron erhält die Energie genau eines Photons h·f. Die maximale Bewegungsenergie und damit U₀ bleiben gleich; nur die Zahl der Elektronen (der Strom) wächst.</p></details>
<details class="q"><summary>Gemessen: U₀ = 1,62 V bei 365 nm und U₀ = 0,36 V bei 578 nm. Bestimme h und W<sub>A</sub>. <span class="op">AFB II</span></summary><p>f₁ = c/λ = 8,21·10¹⁴ Hz, f₂ = 5,19·10¹⁴ Hz. h/e = ΔU₀/Δf = 1,26 V / 3,02·10¹⁴ Hz ≈ 4,17·10⁻¹⁵ V·s ⇒ h ≈ 6,7·10⁻³⁴ J·s. W<sub>A</sub> = h·f₂ − e·U₀ ≈ 2,16 eV − 0,36 eV ≈ 1,8 eV.</p></details>
<details class="q"><summary>Berechne die Grenzwellenlänge für W<sub>A</sub> = 1,8 eV. Wird die Zelle von rotem Licht (650 nm) ausgelöst? <span class="op">AFB II</span></summary><p>λ<sub>G</sub> = h·c/W<sub>A</sub> = 1240 eV·nm / 1,8 eV ≈ 690 nm. Rotes Licht mit 650 nm hat genug Energie (1,91 eV), es fließt ein kleiner Strom; U₀ ≈ 0,1 V.</p></details>
<details class="q"><summary>Begründe, dass die Steigung der U₀-f-Geraden nicht vom Kathodenmaterial abhängt. <span class="op">AFB III</span></summary><p>Aus e·U₀ = h·f − W<sub>A</sub> folgt U₀ = (h/e)·f − W<sub>A</sub>/e. Das Material geht nur über W<sub>A</sub> in den Achsenabschnitt ein. Die Steigung h/e ist eine Naturkonstante – Geraden verschiedener Kathoden verlaufen parallel.</p></details>
<details class="q"><summary>Warum steigt der Strom bei der Kondensatormethode bei schwachem Licht langsamer an? <span class="op">AFB II</span></summary><p>Bei schwachem Licht treffen pro Sekunde weniger Elektronen auf die Anode; der Kondensator aus Kathode, Anode und Leitungen lädt sich langsamer auf. Der Endwert U₀ ist aber derselbe, weil er nur von der Energie der einzelnen Elektronen abhängt.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, selectBox, segmented, check, button, fmt, gauss, dataTable, toast, display } = ui;
    stage.classList.add('ratio');
    stage.insertAdjacentHTML('beforeend', svgMarkup());
    const svg = stage.querySelector('svg');
    const q = id => svg.querySelector('#' + id);
    const NS = 'http://www.w3.org/2000/svg';

    const S = { on: false, warm: 0, line: LINES[1], ap: 1, U: 0, mode: 'gegen', Uel: 0, sweep: null };
    const Iph = () => 4.0e-9 * S.line.qe * S.ap * S.warm;  // A
    function current(U) {
      const U0 = U0of(S.line), ip = Iph();
      const fwd = U < U0 ? ip * (1 - U / U0) ** 2 : 0;
      return fwd - I_REV * ip * (1 - Math.exp(-Math.max(U, 0) / 0.4));
    }

    // ---- Bedienfeld ----
    const gL = group('Lampe und Filter', { led: true });
    const cOn = check({ label: 'Hg-Lampe einschalten', onChange: v => { S.on = v; gL.led(v); } });
    const sF = selectBox({ label: 'Interferenzfilter', value: 'gruen', options: LINES.map(l => ({ value: l.id, label: `${l.name} – ${fmt(l.nm, 1)} nm` })), onChange: v => { S.line = LINES.find(l => l.id === v); S.Uel = 0; paintStatic(); } });
    const sAp = slider({ label: 'Irisblende (Lichtstärke)', min: 10, max: 100, step: 5, value: 100, unit: '%', onInput: v => { S.ap = v / 100; paintStatic(); } });
    gL.append(cOn, sF, sAp);
    const gM = group('Messmethode');
    const segM = segmented({ value: 'gegen', options: [{ value: 'gegen', label: 'Gegenfeld (I = 0)' }, { value: 'kond', label: 'Kondensator' }], onChange: v => { S.mode = v; S.Uel = 0; paintStatic(); gU.style.display = v === 'gegen' ? '' : 'none'; } });
    gM.append(segM);
    const gU = group('Gegenspannung', { led: true }); gU.led(true); gU.querySelector('.led').classList.add('g');
    const sU = slider({ label: 'Gegenspannung U', min: 0, max: 3, step: 0.001, value: 0, unit: 'V', digits: 3, onInput: v => { S.U = v; } });
    const fine = el('div', { class: 'bar' }, ...[-0.05, -0.005, 0.005, 0.05].map(d => button((d > 0 ? '+' : '−') + fmt(Math.abs(d), 3), () => sU.set(Math.max(0, Math.min(3, +(S.U + d).toFixed(3))), true))));
    gU.append(sU, fine);
    const gR = group('Messung');
    const dI = display('Anzeige'), dF = display('Frequenz f');
    const bTake = button('U₀ übernehmen', () => take(), 'btn small primary');
    const bSweep = button('Kennlinie aufnehmen', () => startSweep());
    gR.append(dI, dF, el('div', { class: 'bar' }, bTake, bSweep));
    controls.append(gL, gM, gU, gR);

    // ---- Messwerte ----
    const rows = [], curves = [];
    const tbl = dataTable([
      { key: 'farbe', label: 'Linie', fmt: v => v }, { key: 'nm', label: 'λ in nm', digits: 1 },
      { key: 'f', label: 'f in 10¹⁴ Hz', fmt: v => fmt(v / 1e14, 3) }, { key: 'ap', label: 'Blende in %', fmt: v => fmt(v * 100, 0) },
      { key: 'meth', label: 'Methode', fmt: v => v }, { key: 'U0', label: 'U₀ in V', digits: 3 }
    ], { onDelete: i => { rows.splice(i, 1); redraw(); } });
    const figA = el('div', { class: 'fig' }), figB = el('div', { class: 'fig' });
    const chA = new Chart(figA, { xlabel: 'f in 10¹⁴ Hz', ylabel: 'U₀ in V', xmin: 0, xgrow: true });
    const chB = new Chart(figB, { xlabel: 'U in V', ylabel: 'I in nA' });
    const resA = el('div', { class: 'result' });
    messwerte.append(
      el('div', { class: 'data' },
        el('div', { class: 'chartbox' }, el('h4', {}, 'Auswertung: U₀ über f'), figA, resA,
          csvTools(() => ({ meta: ['Photoeffekt – Gegenfeldmethode'], columns: [{ key: 'farbe', label: 'Linie' }, { key: 'nm', label: 'lambda in nm' }, { key: 'f', label: 'f in Hz' }, { key: 'ap', label: 'Blende' }, { key: 'meth', label: 'Methode' }, { key: 'U0', label: 'U0 in V' }], rows }), 'photoeffekt_messreihe')),
        el('div', { class: 'chartbox' }, el('h4', {}, 'Kennlinien I(U)'), figB,
          el('p', { class: 'muted', style: 'font-size:13px;margin:8px 0 0' }, 'Kennlinien bei gleicher Linie und verschiedener Blende schneiden die U-Achse an derselben Stelle.'),
          csvTools(() => ({ meta: ['Photoeffekt – Kennlinien'], columns: [{ key: 'kurve', label: 'Kennlinie' }, { key: 'U', label: 'U in V' }, { key: 'I', label: 'I in nA' }], rows: curves.flatMap(c => c.pts.map(p => ({ kurve: c.name, U: p[0], I: p[1] }))) }), 'photoeffekt_kennlinien'))),
      el('div', { style: 'height:14px' }), tbl);

    function redraw() {
      tbl.render(rows);
      const pts = rows.map(r => [r.f / 1e14, r.U0]);
      const f = pts.length >= 2 ? fit.linFit(pts.map(p => p[0]), pts.map(p => p[1])) : null;
      chA.set([{ points: pts, color: '#f2ac74', mode: 'dot', name: 'Messwerte' }], f ? [{ f: f.f, color: '#ab93ff', name: 'Ausgleichsgerade' }] : []);
      if (f && new Set(rows.map(r => r.nm)).size >= 2) {
        const he = f.a / 1e14, h = he * E, W = -f.b, fg = -f.b / f.a;
        resA.innerHTML = `<div><span>Steigung h/e</span><br><b>${fmt(he / 1e-15, 3)}·10⁻¹⁵ V·s</b></div><div><span>Planck’sches Wirkungsquantum</span><br><b>h = ${fmt(h / 1e-34, 2)}·10⁻³⁴ J·s</b></div><div><span>Abweichung</span><br><b>${fmt((h / H - 1) * 100, 1)} %</b></div><div><span>Austrittsarbeit (effektiv)</span><br><b>${fmt(W, 2)} eV</b></div><div><span>Grenzfrequenz</span><br><b>${fmt(fg, 2)}·10¹⁴ Hz</b></div>`;
      } else resA.innerHTML = '<span>Mindestens zwei verschiedene Spektrallinien messen.</span>';
      chB.set(curves.map(c => ({ name: c.name, color: c.color, points: c.pts })));
    }
    redraw();

    function take() {
      if (S.warm < 0.9) { toast(S.on ? 'Die Lampe ist noch nicht warm.' : 'Erst die Lampe einschalten.'); return; }
      let U0, meth;
      if (S.mode === 'gegen') {
        const I = current(S.U);
        if (I > 0.05 * Iph() + 3e-12) { toast('Es fließt noch Strom. Gegenspannung weiter erhöhen, bis die Anzeige null zeigt.'); return; }
        if (S.U > U0of(S.line) + 0.15) toast('Hinweis: Die Spannung liegt schon deutlich über dem Wert, bei dem der Strom null wird.');
        U0 = S.U; meth = 'Gegenfeld';
      } else {
        if (S.Uel < 0.97 * Ufinal()) { toast('Die Spannung steigt noch. Warten, bis die Anzeige stehen bleibt.'); return; }
        U0 = S.Uel; meth = 'Kondensator';
      }
      const l = S.line;
      rows.push({ farbe: l.name, nm: l.nm, f: C0 / (l.nm * 1e-9), ap: S.ap, meth, U0: +U0.toFixed(3) }); redraw();
      toast(`Übernommen: ${l.name}, U₀ = ${fmt(U0, 3)} V`);
    }
    const Ufinal = () => { // Leerlaufspannung: Strom (inkl. Gegenstrom) wird null
      let lo = 0, hi = U0of(S.line) + 0.01; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; current(m) > 0 ? lo = m : hi = m; } return lo;
    };
    function startSweep() {
      if (S.warm < 0.9) { toast('Erst die Lampe einschalten und warten.'); return; }
      if (S.mode !== 'gegen') { segM.set('gegen'); S.mode = 'gegen'; gU.style.display = ''; }
      const name = `${S.line.name}, ${Math.round(S.ap * 100)} %`;
      const c = { name, color: lineColor(S.line.id), pts: [] }; curves.push(c); if (curves.length > 8) curves.shift();
      S.sweep = { c, U: 0 }; bSweep.disabled = true;
    }

    // ---- statische Farben ----
    function paintStatic() {
      const col = lineColor(S.line.id);
      q('pFilter').setAttribute('fill', col);
      q('pFilterLbl').textContent = `${Math.round(S.line.nm)} nm`;
      q('pIntLbl').textContent = `Blende ${Math.round(S.ap * 100)} %`;
      q('pBeam2').setAttribute('fill', col);
      q('pAmpTitle').textContent = S.mode === 'gegen' ? 'Messverstärker · Strom' : 'Elektrometerverstärker · Spannung';
      q('pAmpLbl').textContent = S.mode === 'gegen' ? 'Fotostrom' : 'Spannung an der Fotozelle';
      q('pAmpRange').textContent = S.mode === 'gegen' ? 'Bereich 10 nA' : 'Bereich 3 V';
      dF.set(`${fmt(C0 / (S.line.nm * 1e-9) / 1e14, 2)}·10¹⁴ Hz`);
    }
    paintStatic();

    // ---- Elektronen-Animation ----
    const eg = q('pElectrons'); const parts = [];
    const CX = 586.7, AX = 600, AY = 185, K = 110; // Mittelpunkt des Kathodenbogens, Anode
    function spawn() {
      const ang = (Math.random() - 0.5) * 1.7, sx = CX + 88 * Math.cos(ang) - 5, sy = 185 + 88 * Math.sin(ang);
      const ek = Math.random() * U0of(S.line); // eV, gleichverteilt bis E_kin,max
      const D = Math.hypot(sx - AX, sy - AY) - 16;
      const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', 2.6); eg.append(c);
      parts.push({ sx, sy, D, s: 0, v: Math.sqrt(ek) * K, el: c });
    }
    function energyBars(U) {
      const hf = 1239.84 / S.line.nm, W = W_EFF, ek = Math.max(0, hf - W), sc = 46;
      const base = 205, x = 30;
      const bar = (x, h, y, col, txt) => `<rect x="${x}" y="${(y - h).toFixed(1)}" width="44" height="${Math.max(0, h).toFixed(1)}" rx="3" fill="${col}"/><text x="${x + 22}" y="${(y - h - 6).toFixed(1)}" fill="#c7c1b7" font-size="11" text-anchor="middle">${txt}</text>`;
      let h = bar(x, hf * sc, base, lineColor(S.line.id), `h·f = ${fmt(hf, 2)} eV`);
      h += bar(x + 80, W * sc, base, '#5b6268', `W = ${fmt(W, 2)}`) + bar(x + 80, ek * sc, base - W * sc, '#86dcff', `E<tspan font-size="8">kin</tspan>`);
      const eu = S.mode === 'gegen' ? U : S.Uel;
      h += bar(x + 160, Math.min(eu, 3) * sc, base, eu >= ek - 1e-3 ? '#ff4b3e' : '#ff8a7a', `e·U = ${fmt(eu, 2)} eV`);
      h += `<line x1="20" y1="${base}" x2="250" y2="${base}" stroke="#4a545c"/>`;
      q('pBars').innerHTML = h;
    }

    // ---- Schleife ----
    let raf = 0, last = performance.now(), spawnAcc = 0, barAcc = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      S.warm += ((S.on ? 1 : 0) - S.warm) * Math.min(1, dt / (S.on ? 1.5 : 0.6));
      q('pLampGlow').setAttribute('opacity', (S.warm * 0.85).toFixed(2));
      q('pLampLed').setAttribute('fill', S.on ? '#7fd6a0' : '#333');
      q('pBeam1').setAttribute('opacity', (S.warm * 0.4).toFixed(2));
      q('pBeam2').setAttribute('opacity', (S.warm * (0.12 + 0.3 * S.ap)).toFixed(2));
      // Kennlinie automatisch
      if (S.sweep) {
        S.sweep.U += dt * 0.6; const U = Math.min(S.sweep.U, Math.max(2, U0of(S.line) + 0.4));
        sU.set(U); S.U = U;
        S.sweep.c.pts.push([+U.toFixed(3), +((current(U) + gauss(5e-12)) * 1e9).toFixed(4)]);
        if (U >= Math.max(2, U0of(S.line) + 0.4) - 1e-6) { S.sweep = null; bSweep.disabled = false; toast('Kennlinie aufgenommen.'); }
        redraw();
      }
      // Kondensatormethode: Aufladen mit Fotostrom
      if (S.mode === 'kond') {
        const Cc = 1.0e-10; // F (Zelle + Leitung + Eingang)
        const I = current(S.Uel); S.Uel = Math.max(0, S.Uel + I / Cc * dt);
      }
      // Anzeigen
      const Ushow = S.mode === 'gegen' ? S.U : S.Uel;
      q('pDispU').textContent = (S.mode === 'gegen' ? S.U : 0).toFixed(3);
      if (S.mode === 'gegen') {
        const I = (current(S.U) + gauss(5e-12)) * 1e9;
        q('pDispI').textContent = `${fmt(I, 3)} nA`; dI.set(`${fmt(I, 3)} nA`);
      } else {
        const u = S.Uel + gauss(0.001);
        q('pDispI').textContent = `${fmt(u, 3)} V`; dI.set(`${fmt(u, 3)} V`);
      }
      // Elektronen
      spawnAcc += dt * 60 * S.line.qe * S.ap * S.warm;
      while (spawnAcc > 1) { spawnAcc -= 1; if (parts.length < 120) spawn(); }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        const acc = K * K * Ushow / (2 * p.D); // Bremsweg = D genau dann, wenn E_kin = e·U
        p.v -= acc * dt; p.s += p.v * dt;
        const f = Math.max(0, p.s) / (p.D + 16);
        p.el.setAttribute('cx', (p.sx + (AX - p.sx) * f).toFixed(1)); p.el.setAttribute('cy', (p.sy + (AY - p.sy) * f).toFixed(1));
        if (p.s >= p.D || p.s < 0) { p.el.remove(); parts.splice(i, 1); }
      }
      barAcc += dt; if (barAcc > 0.1) { barAcc = 0; energyBars(S.U); }
    }
    raf = requestAnimationFrame(frame);
    return { destroy() { cancelAnimationFrame(raf); chA.destroy(); chB.destroy(); } };
  }
};
