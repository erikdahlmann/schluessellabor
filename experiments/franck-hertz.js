// ============================================================================
//  Schlüsselexperiment: Franck-Hertz-Versuch mit Quecksilber
//  2D-Aufbau (SVG): Ofen mit Hg-Röhre (Kathode, Gitter, Auffänger), Betriebsgerät,
//  XY-Schreiber. Kennlinie aus einem Monte-Carlo-Modell: Elektronen gewinnen im
//  Feld Energie, stoßen ab 4,9 eV unelastisch mit Hg-Atomen und erreichen den
//  Auffänger nur, wenn ihre Restenergie die Gegenspannung überwindet.
//  Gleiche Zufallszahlen für alle Spannungen → glatte, reproduzierbare Kurve.
// ============================================================================
const EA = 4.89;                                    // Anregungsenergie Hg 6¹S₀ → 6³P₁ in eV
const UK = 2.0 + (Math.random() * 0.4 - 0.2);       // Kontaktspannung Kathode/Gitter
const NE = 500, NS_ = 140;                          // Elektronen, Wegschritte
const RND = Float32Array.from({ length: NE * NS_ }, Math.random);
const E0 = Float32Array.from({ length: NE }, () => -0.35 * Math.log(1 - Math.random() * 0.999)); // thermische Startenergie
const pHg = T => Math.pow(10, 10.122 - 3190 / (T + 273.15)); // Dampfdruck Hg in Pa (Näherung)

function collector(U, Ug, T) {
  // mittlere Zahl der Stoßgelegenheiten über die Laufstrecke ~ Teilchendichte
  const n = pHg(T) / (T + 273.15), n180 = pHg(180) / 453.15;
  const L = 18 * n / n180;                          // Laufstrecke / freie Weglänge (unelastisch, oberhalb EA)
  const p = 1 - Math.exp(-L / NS_);
  const Ueff = U - UK; if (Ueff <= 0) return 0;
  const dE = Ueff / NS_;
  let hit = 0;
  for (let e = 0; e < NE; e++) {
    let En = E0[e]; const o = e * NS_;
    for (let s = 0; s < NS_; s++) { En += dE; if (En >= EA && RND[o + s] < p) En -= EA; }
    if (En >= Ug) hit++;
  }
  const space = Math.pow(Ueff, 1.5) / (1 + Math.pow(Ueff / 22, 1.5));   // Raumladung, Sättigung
  const elastic = Math.exp(-L / 160);                                   // Streuverluste bei hoher Dichte
  return 1.0e-10 * space * elastic * hit / NE;
}

const svgMarkup = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Ofen mit Quecksilber-Franck-Hertz-Röhre, Betriebsgerät und XY-Schreiber mit der Kennlinie">
<defs>
  <linearGradient id="fBench" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2024"/><stop offset="1" stop-color="#121518"/></linearGradient>
  <linearGradient id="fBox" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4046"/><stop offset="1" stop-color="#23282c"/></linearGradient>
  <linearGradient id="fOven" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6d7276"/><stop offset=".5" stop-color="#9aa0a4"/><stop offset="1" stop-color="#5c6164"/></linearGradient>
  <filter id="fGlow"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="fSh" x="-10%" y="-10%" width="130%" height="150%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000" flood-opacity=".55"/></filter>
  <g id="fSock"><circle r="7.5" fill="currentColor" stroke="#000" stroke-opacity=".5"/><circle r="3.2" fill="#c8a24a"/></g>
</defs>
<rect width="1000" height="620" fill="url(#fBench)"/>
<!-- Ofen -->
<g filter="url(#fSh)">
  <rect x="40" y="60" width="300" height="300" rx="10" fill="url(#fOven)" stroke="#4a5157"/>
  <rect x="60" y="80" width="260" height="230" rx="6" fill="#141719" stroke="#3a4045"/>
  <rect x="60" y="360" width="260" height="14" fill="#2a2f33"/>
</g>
<rect id="fHeatGlow" x="62" y="82" width="256" height="226" rx="5" fill="#ff7a2a" opacity="0"/>
<g id="fCoils" stroke="#ff6a2a" stroke-width="2" fill="none" opacity="0"><path d="M70 296 q8 -10 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0"/></g>
<!-- Röhre -->
<rect x="90" y="150" width="200" height="80" rx="40" fill="#9fb4c2" fill-opacity=".08" stroke="#9fb4c2" stroke-opacity=".55" stroke-width="1.4"/>
<rect x="104" y="172" width="8" height="36" rx="2" fill="#3b3f44"/>
<rect id="fCath" x="112" y="178" width="5" height="24" fill="#222"/>
<g stroke="#c9d0d4" stroke-width="1.2"><line x1="240" y1="166" x2="240" y2="214" stroke-dasharray="2 2"/></g>
<rect x="266" y="166" width="5" height="48" fill="#c9d0d4"/>
<g id="fElec" fill="#86dcff" filter="url(#fGlow)"></g>
<g id="fFlash" fill="#c9b4ff" filter="url(#fGlow)"></g>
<text x="114" y="248" fill="#8e979d" font-size="10" text-anchor="middle">K</text><text x="240" y="248" fill="#8e979d" font-size="10" text-anchor="middle">G</text><text x="268" y="248" fill="#8e979d" font-size="10" text-anchor="middle">A</text>
<text x="190" y="104" fill="#c9c3ba" font-size="12" text-anchor="middle">Hg-Röhre im Ofen</text>
<!-- Thermometer -->
<rect x="300" y="96" width="14" height="190" rx="7" fill="#e8e6e0" opacity=".85"/>
<rect id="fThermo" x="304" y="270" width="6" height="10" rx="3" fill="#d23b2a"/>
<circle cx="307" cy="288" r="9" fill="#d23b2a"/>
<text id="fTtxt" x="190" y="340" fill="#ece6dc" font-size="16" text-anchor="middle" font-family="IBM Plex Mono, monospace">ϑ = 20 °C</text>
<!-- Leitungen -->
<g fill="none" stroke-width="5" stroke-linecap="round" opacity=".95">
  <path d="M120 372 V440 H420" stroke="#d8b21c"/>
  <path d="M190 372 V420 H420" stroke="#151515"/>
  <path d="M260 372 V400 H420" stroke="#c4231b"/>
  <path d="M640 450 H700 V300 H720" stroke="#1f4fb8"/>
  <path d="M640 480 H710 V330 H720" stroke="#151515"/>
</g>
<!-- Betriebsgerät -->
<g filter="url(#fSh)"><rect x="380" y="380" width="280" height="200" rx="10" fill="url(#fBox)" stroke="#4a5157"/></g>
<text x="396" y="404" fill="#c9c3ba" font-size="13">Franck-Hertz-Betriebsgerät</text>
<g font-family="IBM Plex Mono, monospace">
  <rect x="396" y="416" width="120" height="44" rx="4" fill="#170807" stroke="#3a1a17"/>
  <text x="404" y="430" fill="#c98e86" font-size="9" font-family="IBM Plex Sans, sans-serif">U_B Beschleunigung</text>
  <text id="fDU" x="508" y="454" text-anchor="end" fill="#ff6a4d" font-size="22" filter="url(#fGlow)">0,0 V</text>
  <rect x="526" y="416" width="120" height="44" rx="4" fill="#170807" stroke="#3a1a17"/>
  <text x="534" y="430" fill="#c98e86" font-size="9" font-family="IBM Plex Sans, sans-serif">U_G Gegenspannung</text>
  <text id="fDG" x="638" y="454" text-anchor="end" fill="#ff6a4d" font-size="22" filter="url(#fGlow)">1,5 V</text>
  <rect x="396" y="470" width="250" height="44" rx="4" fill="#0b1410" stroke="#1d2a23"/>
  <text x="404" y="484" fill="#7ea592" font-size="9" font-family="IBM Plex Sans, sans-serif">I_A Auffängerstrom</text>
  <text id="fDI" x="638" y="508" text-anchor="end" fill="#b7ffd6" font-size="22" filter="url(#fGlow)">0,00 nA</text>
</g>
<circle id="fRec" cx="404" cy="540" r="6" fill="#3a3a3a"/><text id="fRecT" x="416" y="544" fill="#8e979d" font-size="11">Rampe aus</text>
<use href="#fSock" x="560" y="556" color="#1f4fb8"/><use href="#fSock" x="590" y="556" color="#151515"/><text x="620" y="560" fill="#8e979d" font-size="10">Y</text>
<!-- XY-Schreiber -->
<g filter="url(#fSh)"><rect x="720" y="60" width="250" height="300" rx="10" fill="#d9dbd7" stroke="#a9aca7"/></g>
<text x="845" y="84" fill="#333" font-size="12" text-anchor="middle" font-weight="600">XY-Schreiber</text>
<rect x="736" y="96" width="218" height="220" fill="#f6f4ee" stroke="#a9aca7"/>
<g id="fGrid" stroke="#d6d2c6" stroke-width=".8"></g>
<path id="fCurve" fill="none" stroke="#1f4fb8" stroke-width="1.6"/>
<circle id="fPen" r="3" fill="#c4231b"/>
<text x="845" y="334" fill="#333" font-size="10" text-anchor="middle">U_B: 0 … 30 V</text>
<text x="745" y="110" fill="#333" font-size="10">I_A</text>
<!-- Energieschema -->
<g transform="translate(40 400)">
  <rect width="320" height="180" rx="10" fill="#101316" stroke="#262d33"/>
  <text x="14" y="22" fill="#8e979d" font-size="12">Energie eines Elektrons auf dem Weg K → G → A</text>
  <path id="fEpath" fill="none" stroke="#86dcff" stroke-width="2"/>
  <line x1="20" y1="150" x2="300" y2="150" stroke="#4a545c"/>
  <line id="fEaLine" x1="20" x2="250" stroke="#ab93ff" stroke-dasharray="4 4"/>
  <text id="fEaTxt" x="22" fill="#ab93ff" font-size="10">4,9 eV</text>
  <line id="fUgLine" x1="250" x2="300" stroke="#ff8a7a" stroke-dasharray="3 3"/>
  <text x="250" y="168" fill="#8e979d" font-size="10">Gegenfeld</text>
</g>
</svg>`;

export default {
  intro: 'Elektronen werden in einer Röhre mit Quecksilberdampf beschleunigt. Der Strom zum Auffänger steigt nicht gleichmäßig an, sondern bricht immer wieder ein – im Abstand von etwa 4,9 V. Die Atome nehmen Energie nur in festen Portionen auf: ein direkter Nachweis diskreter Energieniveaus.',
  docs: {
    durchfuehrung: `
<h3>Aufbau</h3>
<p>Die Franck-Hertz-Röhre enthält einen Tropfen Quecksilber und sitzt in einem Ofen. Bei 150 … 200 °C bildet sich Hg-Dampf. Aus der geheizten Kathode K treten Elektronen aus und werden zum Gitter G mit der Spannung <i>U<sub>B</sub></i> beschleunigt. Zwischen Gitter und Auffänger A liegt eine kleine Gegenspannung <i>U<sub>G</sub></i> (≈ 1,5 V). Der Auffängerstrom <i>I<sub>A</sub></i> liegt im Nanoampere-Bereich.</p>
<h3>Durchführung</h3>
<ol>
<li>Ofen auf ca. 180 °C heizen und warten, bis die Temperatur stabil ist (hier verkürzt).</li>
<li>Gegenspannung auf 1,5 V stellen.</li>
<li><b>Rampe starten</b>: <i>U<sub>B</sub></i> läuft von 0 bis 30 V, der XY-Schreiber zeichnet <i>I<sub>A</sub>(U<sub>B</sub>)</i>. Alternativ <i>U<sub>B</sub></i> von Hand verstellen und einzelne Punkte übernehmen.</li>
<li>Die Lage der Maxima ablesen (wird zusätzlich automatisch bestimmt) und die Abstände berechnen.</li>
<li>Variation: Ofentemperatur und Gegenspannung verändern und die Kurvenform vergleichen.</li>
</ol>
<div class="callout">Sicherheit: Der Ofen wird über 200 °C heiß. Bei zu niedriger Temperatur und hoher Spannung kann eine Gasentladung zünden (blaues Leuchten) – sofort die Spannung verringern, sonst wird die Röhre beschädigt.</div>`,
    theorie: `
<h3>Stöße zwischen Elektronen und Hg-Atomen</h3>
<p>Solange die Energie eines Elektrons kleiner als 4,9 eV ist, stößt es <b>elastisch</b>: Es verliert wegen der großen Atommasse praktisch keine Energie. Erreicht es 4,9 eV, kann es ein Hg-Atom anregen (<b>unelastischer Stoß</b>) und gibt genau diese Energie ab.</p>
<h3>Deutung der Kurve</h3>
<ul>
<li>Bis ca. 4,9 V (plus Kontaktspannung) steigt <i>I<sub>A</sub></i> an.</li>
<li>Danach regen immer mehr Elektronen kurz vor dem Gitter Atome an. Ihnen fehlt die Energie, um gegen <i>U<sub>G</sub></i> den Auffänger zu erreichen – der Strom sinkt.</li>
<li>Bei höherer Spannung gewinnen die Elektronen nach dem Stoß erneut genug Energie: Der Strom steigt wieder, bis ein zweiter Stoß möglich wird, usw.</li>
</ul>
<span class="formula">ΔU = U<sub>max,n+1</sub> − U<sub>max,n</sub> ≈ 4,9 V    ⇒    ΔE = e·ΔU ≈ 4,9 eV</span>
<h3>Ausgesandtes Licht</h3>
<p>Die angeregten Atome kehren in den Grundzustand zurück und senden ein Photon aus:</p>
<span class="formula">λ = h·c/ΔE = 1240 eV·nm / 4,89 eV ≈ 254 nm (UV)</span>
<p>Dieses Licht ist unsichtbar. Bei der Röhre mit Neon (ca. 19 eV) sieht man dagegen leuchtende Schichten.</p>
<h3>Lage des ersten Maximums</h3>
<p>Das erste Maximum liegt nicht bei 4,9 V, sondern um die <b>Kontaktspannung</b> (Unterschied der Austrittsarbeiten von Kathode und Gitter, ca. 2 V) verschoben. Für die Auswertung zählen deshalb nur die Abstände der Maxima.</p>
<h3>Einfluss der Temperatur</h3>
<p>Höhere Temperatur bedeutet mehr Hg-Atome und eine kürzere freie Weglänge. Die Elektronen stoßen dann sofort, wenn sie 4,9 eV erreichen: Die Maxima werden schärfer, der Strom insgesamt kleiner. Bei zu niedriger Temperatur verschwimmt die Struktur.</p>
<h3>Modellgrenzen</h3>
<ul><li>Die Kennlinie stammt aus einem einfachen Monte-Carlo-Modell mit einer Anregungsstufe; höhere Niveaus (z. B. 6,7 eV) und Ionisation sind nicht berücksichtigt.</li><li>Die Kontaktspannung ist pro Seitenaufruf zufällig zwischen 1,8 V und 2,2 V.</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Röhre</td><td>Tetrode/Triode mit Hg-Tropfen, Abstand K–G ≈ 8 mm</td></tr>
<tr><td>Ofen</td><td>bis 220 °C, Thermometer bzw. Thermoelement</td></tr>
<tr><td>Beschleunigungsspannung U<sub>B</sub></td><td>0 … 30 V, Rampe</td></tr>
<tr><td>Gegenspannung U<sub>G</sub></td><td>0 … 5 V</td></tr>
<tr><td>Auffängerstrom</td><td>Messverstärker, 0 … 10 nA</td></tr>
<tr><td>Aufzeichnung</td><td>XY-Schreiber oder Messwerterfassung</td></tr>
</tbody></table>
<p class="muted" style="margin-top:12px">James Franck und Gustav Hertz veröffentlichten den Versuch 1914 und erhielten dafür 1925 den Nobelpreis.</p>`,
    abi: `
<details class="q"><summary>Erkläre den Verlauf der Franck-Hertz-Kurve. <span class="op">AFB II</span></summary><p>Bis zur Anregungsenergie stoßen die Elektronen nur elastisch und erreichen den Auffänger, der Strom steigt. Ab 4,9 eV regen sie Hg-Atome an und verlieren diese Energie; vor dem Auffänger reicht die Restenergie nicht mehr gegen die Gegenspannung, der Strom sinkt. Mit wachsender Spannung wiederholt sich das bei 2·4,9 eV, 3·4,9 eV usw.</p></details>
<details class="q"><summary>Maxima liegen bei 7,0 V, 11,9 V, 16,8 V, 21,7 V und 26,6 V. Bestimme die Anregungsenergie und die Wellenlänge des ausgesandten Lichts. <span class="op">AFB II</span></summary><p>Mittlerer Abstand ΔU = (26,6 V − 7,0 V)/4 = 4,9 V ⇒ ΔE = 4,9 eV. λ = h·c/ΔE = 6,63·10⁻³⁴ J·s · 3,00·10⁸ m/s / (4,9 · 1,60·10⁻¹⁹ J) ≈ 254 nm.</p></details>
<details class="q"><summary>Warum liegt das erste Maximum nicht bei 4,9 V? <span class="op">AFB II</span></summary><p>Wegen der Kontaktspannung zwischen Kathode und Gitter (verschiedene Austrittsarbeiten) ist die tatsächliche Beschleunigungsspannung um ca. 2 V kleiner. Die Abstände der Maxima bleiben davon unberührt.</p></details>
<details class="q"><summary>Welche Funktion hat die Gegenspannung? Was passiert ohne sie? <span class="op">AFB II–III</span></summary><p>Sie sortiert die Elektronen nach ihrer Restenergie: Nur Elektronen mit E &gt; e·U<sub>G</sub> erreichen den Auffänger. Ohne Gegenspannung würden auch Elektronen nach einem Stoß (mit kleiner Restenergie) mitgezählt, die Einbrüche wären kaum zu sehen.</p></details>
<details class="q"><summary>Begründe, dass der Versuch das Bohr’sche Atommodell stützt. <span class="op">AFB III</span></summary><p>Die Hg-Atome nehmen Energie nur in einer bestimmten Portion (4,9 eV) auf. Das zeigt diskrete Energieniveaus in der Atomhülle. Die Wellenlänge des dabei ausgesandten Lichts (254 nm) stimmt mit einer Linie im Hg-Spektrum überein – Absorption und Emission gehören zum selben Übergang.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, check, button, fmt, gauss, dataTable, toast, display } = ui;
    stage.classList.add('ratio');
    stage.insertAdjacentHTML('beforeend', svgMarkup());
    const svg = stage.querySelector('svg');
    const q = id => svg.querySelector('#' + id);
    const NS = 'http://www.w3.org/2000/svg';

    const S = { heat: false, Tset: 180, T: 20, U: 0, Ug: 1.5, ramp: null, flashAcc: 0, discharge: false };

    // XY-Schreiber: Gitter
    { let g = ''; for (let i = 1; i < 6; i++) { const x = 736 + i * 218 / 6; g += `<line x1="${x}" y1="96" x2="${x}" y2="316"/>`; } for (let i = 1; i < 5; i++) { const y = 96 + i * 44; g += `<line x1="736" y1="${y}" x2="954" y2="${y}"/>`; } q('fGrid').innerHTML = g; }
    const XY = (U, I) => [736 + U / 30 * 218, 316 - Math.min(1, I / 6e-9) * 216];

    // ---- Bedienfeld ----
    const gO = group('Ofen', { led: true });
    const cHeat = check({ label: 'Ofenheizung einschalten', onChange: v => { S.heat = v; gO.led(v); } });
    const sT = slider({ label: 'Solltemperatur', min: 120, max: 210, step: 5, value: 180, unit: '°C', onInput: v => { S.Tset = v; } });
    gO.append(cHeat, sT);
    const gB = group('Betriebsgerät', { led: true }); gB.led(true); gB.querySelector('.led').classList.add('g');
    const sU = slider({ label: 'Beschleunigungsspannung U_B', min: 0, max: 30, step: 0.1, value: 0, unit: 'V', digits: 1, onInput: v => { S.U = v; } });
    const sG = slider({ label: 'Gegenspannung U_G', min: 0, max: 3, step: 0.1, value: 1.5, unit: 'V', digits: 1, onInput: v => { S.Ug = v; } });
    gB.append(sU, sG);
    const gR = group('Aufzeichnung', { led: true });
    const bRamp = button('Rampe 0 … 30 V starten', () => S.ramp ? stopRamp(false) : startRamp(), 'btn small primary');
    const bPt = button('Messpunkt übernehmen', () => takePoint());
    const bClr = button('Schreiber leeren', () => { pen.length = 0; q('fCurve').setAttribute('d', ''); });
    gR.append(el('div', { class: 'bar' }, bRamp, bPt, bClr));
    const dT = display('Ofentemperatur ϑ'), dI = display('Auffängerstrom I_A');
    const gL = group('Live-Werte'); gL.append(dT, dI);
    controls.append(gO, gB, gR, gL);

    // ---- Messwerte ----
    const curves = [], points = [];
    let shown = null;
    const figK = el('div', { class: 'fig' }), figM = el('div', { class: 'fig' });
    const chK = new Chart(figK, { xlabel: 'U_B in V', ylabel: 'I_A in nA', xmin: 0, xmax: 30 });
    const chM = new Chart(figM, { xlabel: 'Nummer n des Maximums', ylabel: 'U_max in V' });
    const resM = el('div', { class: 'result' });
    const tblMax = dataTable([{ key: 'n', label: 'n', digits: 0 }, { key: 'U', label: 'U_max in V', digits: 2 }, { key: 'dU', label: 'ΔU in V', fmt: v => v == null ? '–' : fmt(v, 2) }]);
    const tblRuns = dataTable([{ key: 'name', label: 'Kennlinie', fmt: v => v }, { key: 'nmax', label: 'Maxima', digits: 0 }, { key: 'dU', label: 'ΔU (Fit) in V', digits: 3 }, { key: 'lam', label: 'λ in nm', fmt: v => fmt(v, 0) }],
      { onDelete: i => { curves.splice(i, 1); shown = curves[curves.length - 1] || null; redraw(); } });
    messwerte.append(
      el('div', { class: 'data' },
        el('div', { class: 'chartbox' }, el('h4', {}, 'Kennlinie I_A(U_B)'), figK,
          csvTools(() => ({ meta: shown ? [`Franck-Hertz (Hg) – ${shown.name}`] : [], columns: [{ key: 'U', label: 'U_B in V' }, { key: 'I', label: 'I_A in nA' }], rows: shown ? shown.pts.map(p => ({ U: p[0], I: p[1] })) : points.map(p => ({ U: p[0], I: p[1] })) }), 'franck-hertz_kennlinie')),
        el('div', { class: 'chartbox' }, el('h4', {}, 'Auswertung: Lage der Maxima'), figM, resM)),
      el('div', { style: 'height:14px' }),
      el('div', { class: 'data' }, el('div', {}, el('h3', { style: 'margin-bottom:10px' }, 'Maxima der letzten Kennlinie'), tblMax),
        el('div', {}, el('h3', { style: 'margin-bottom:10px' }, 'Alle Kennlinien'), tblRuns)));

    function findMax(pts) {
      if (pts.length < 20) return [];
      const ys = pts.map(p => p[1]); const sm = ys.map((_, i) => { let s = 0, c = 0; for (let j = -4; j <= 4; j++) { const v = ys[i + j]; if (v != null) { s += v; c++; } } return s / c; });
      const top = Math.max(...sm), res = [];
      for (let i = 5; i < sm.length - 5; i++) {
        if (sm[i] >= sm[i - 1] && sm[i] > sm[i + 1] && sm[i] === Math.max(...sm.slice(i - 5, i + 6))) {
          let lo = sm[i]; for (let j = i + 1; j < Math.min(sm.length, i + 40); j++) lo = Math.min(lo, sm[j]);
          if (sm[i] - lo > 0.03 * top && pts[i][0] > 3) {
            // Parabel durch drei Punkte für genaue Lage
            const [x0, y0] = [pts[i - 1][0], sm[i - 1]], [x1, y1] = [pts[i][0], sm[i]], [x2, y2] = [pts[i + 1][0], sm[i + 1]];
            const d = (y0 - 2 * y1 + y2); const xm = d ? x1 + 0.5 * (x1 - x0) * (y0 - y2) / d : x1;
            res.push(xm);
          }
        }
      }
      return res;
    }
    function analyse(c) {
      c.max = findMax(c.pts);
      const l = c.max.length >= 2 ? fit.linFit(c.max.map((_, i) => i + 1), c.max) : null;
      c.dU = l ? l.a : NaN; c.lam = l ? 1239.84 / l.a : NaN; c.nmax = c.max.length; c.fit = l;
    }
    function redraw() {
      const cols = ['#86dcff', '#f2ac74', '#ab93ff', '#7fd6a0', '#ff8a7a', '#e5d36b'];
      const series = curves.map((c, i) => ({ name: c.name, color: cols[i % 6], points: c.pts }));
      if (points.length) series.push({ name: 'Einzelpunkte', color: '#ece6dc', mode: 'dot', points });
      chK.set(series);
      tblRuns.render(curves);
      if (shown && shown.max.length) {
        tblMax.render(shown.max.map((U, i) => ({ n: i + 1, U, dU: i ? U - shown.max[i - 1] : null })));
        chM.set([{ points: shown.max.map((U, i) => [i + 1, U]), color: '#f2ac74', mode: 'dot', name: 'Maxima' }], shown.fit ? [{ f: shown.fit.f, color: '#ab93ff', name: 'Ausgleichsgerade' }] : []);
        resM.innerHTML = shown.fit ? `<div><span>Steigung = Abstand ΔU</span><br><b>${fmt(shown.dU, 2)} V</b></div><div><span>Anregungsenergie</span><br><b>ΔE = ${fmt(shown.dU, 2)} eV</b></div><div><span>Wellenlänge des Lichts</span><br><b>λ = ${fmt(shown.lam, 0)} nm</b></div><div><span>Achsenabschnitt (≈ Kontaktspannung + U_G)</span><br><b>${fmt(shown.fit.b, 2)} V</b></div>`
          : '<span>Mindestens zwei Maxima nötig.</span>';
      } else { tblMax.render([]); chM.set([]); resM.innerHTML = '<span>Noch keine Kennlinie. „Rampe starten“ zeichnet eine auf.</span>'; }
    }
    redraw();

    // ---- Schreiber ----
    const pen = [];
    function penTo(U, I) { pen.push(XY(U, I)); if (pen.length > 1500) pen.shift(); q('fCurve').setAttribute('d', 'M' + pen.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L')); }

    function measureI() {
      if (S.discharge) return 6e-9 + gauss(4e-10);
      return Math.max(0, collector(S.U, S.Ug, S.T) * (S.T > 60 ? 1 : 0.6) + gauss(0.012e-9));
    }
    function startRamp() {
      if (S.T < 140) { toast('Der Ofen ist zu kalt. Erst auf mindestens 150 °C heizen.'); }
      S.ramp = { name: `ϑ = ${Math.round(S.T)} °C, U_G = ${fmt(S.Ug, 1)} V`, pts: [] };
      sU.set(0); S.U = 0; pen.length = 0; bRamp.textContent = 'Rampe stoppen'; gR.led(true);
      q('fRec').setAttribute('fill', '#ff4b3e'); q('fRecT').textContent = 'Rampe läuft';
    }
    function stopRamp(done) {
      const r = S.ramp; S.ramp = null; bRamp.textContent = 'Rampe 0 … 30 V starten'; gR.led(false);
      q('fRec').setAttribute('fill', '#3a3a3a'); q('fRecT').textContent = 'Rampe aus';
      if (r && r.pts.length > 40) { analyse(r); curves.push(r); shown = r; redraw(); toast(done ? `Kennlinie aufgenommen: ${r.nmax} Maxima gefunden.` : 'Rampe gestoppt, Teilkurve gespeichert.'); }
    }
    function takePoint() { const I = measureI(); points.push([+S.U.toFixed(1), +(I * 1e9).toFixed(3)]); penTo(S.U, I); redraw(); toast(`Punkt: U_B = ${fmt(S.U, 1)} V, I_A = ${fmt(I * 1e9, 2)} nA`); }

    // ---- Elektronen in der Röhre ----
    const eg = q('fElec'), fg = q('fFlash'); const parts = [];
    function spawn() {
      const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', 2); eg.append(c);
      parts.push({ x: 118, y: 180 + Math.random() * 20, E: Math.random() * 0.3, el: c });
    }
    function flash(x, y) {
      const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 5); fg.append(c);
      setTimeout(() => c.remove(), 140);
    }
    function energyPath() {
      // Weg K (x=20) → G (x=250) → A (x=300), Energie-Skala 10 px/eV, Grundlinie y=150
      const ox = 40, oy = 400, base = 150, sc = 10, Ueff = Math.max(0, S.U - UK);
      const eaY = base - EA * sc; q('fEaLine').setAttribute('y1', eaY); q('fEaLine').setAttribute('y2', eaY); q('fEaTxt').setAttribute('y', eaY - 4);
      q('fUgLine').setAttribute('y1', base - S.Ug * sc); q('fUgLine').setAttribute('y2', base - S.Ug * sc);
      let E = 0, d = `M20 ${base}`; const n = 80;
      for (let i = 1; i <= n; i++) { E += Ueff / n; if (E >= EA && S.T > 140) { d += ` L${(20 + 230 * i / n).toFixed(1)} ${(base - E * sc).toFixed(1)}`; E -= EA; } d += ` L${(20 + 230 * i / n).toFixed(1)} ${(base - Math.min(E, 12) * sc).toFixed(1)}`; }
      const Ea = E - S.Ug; d += ` L300 ${(base - Math.max(0, Ea) * sc).toFixed(1)}`;
      q('fEpath').setAttribute('d', d); q('fEpath').setAttribute('stroke', Ea >= 0 ? '#86dcff' : '#ff8a7a');
    }

    // ---- Schleife ----
    let raf = 0, last = performance.now(), acc = 0, spawnAcc = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      // Ofen (Zeitraffer)
      const target = S.heat ? S.Tset : 20;
      S.T += (target - S.T) * Math.min(1, dt / 2.5) + (S.heat ? gauss(0.02) : 0);
      q('fThermo').setAttribute('y', (280 - Math.min(180, (S.T - 10) / 220 * 180)).toFixed(1)); q('fThermo').setAttribute('height', Math.min(180, (S.T - 10) / 220 * 180).toFixed(1));
      q('fTtxt').textContent = `ϑ = ${Math.round(S.T)} °C`; dT.set(`${Math.round(S.T)} °C`);
      const hg = Math.max(0, Math.min(1, (S.T - 60) / 150));
      q('fHeatGlow').setAttribute('opacity', (hg * 0.08).toFixed(3)); q('fCoils').setAttribute('opacity', S.heat ? (0.3 + 0.5 * hg).toFixed(2) : 0);
      q('fCath').setAttribute('fill', '#ff8a3d');
      // Gasentladung bei zu kaltem Ofen
      const dis = S.T < 140 && S.U > 22;
      if (dis && !S.discharge) toast('Gasentladung! Der Ofen ist zu kalt – Spannung sofort verringern.', 4000);
      S.discharge = dis;
      svg.querySelector('rect[x="90"]').setAttribute('fill', dis ? '#6fa8ff' : '#9fb4c2'); svg.querySelector('rect[x="90"]').setAttribute('fill-opacity', dis ? '.45' : '.08');
      // Rampe
      if (S.ramp) {
        S.U = Math.min(30, S.U + dt * 2.2); sU.set(S.U);
        const I = measureI(); S.ramp.pts.push([+S.U.toFixed(2), +(I * 1e9).toFixed(4)]); penTo(S.U, I);
        if (S.U >= 30) stopRamp(true);
      }
      acc += dt;
      if (acc > 0.08) {
        acc = 0; const I = measureI();
        q('fDU').textContent = `${fmt(S.U, 1)} V`; q('fDG').textContent = `${fmt(S.Ug, 1)} V`; q('fDI').textContent = `${fmt(I * 1e9, 2)} nA`;
        dI.set(`${fmt(I * 1e9, 2)} nA`);
        const [px, py] = XY(S.U, I); q('fPen').setAttribute('cx', px); q('fPen').setAttribute('cy', py);
        energyPath();
        if (S.ramp && S.ramp.pts.length % 25 === 0) redraw();
      }
      // Elektronen (Darstellung: 1 px ≈ 0,045 V bei 30 V über 122 px)
      spawnAcc += dt * 40 * Math.min(1, S.U / 10);
      while (spawnAcc > 1) { spawnAcc -= 1; if (parts.length < 60) spawn(); }
      const Ueff = Math.max(0, S.U - UK), p = S.T > 140 ? 0.5 : 0.02;
      for (let i = parts.length - 1; i >= 0; i--) {
        const P = parts[i]; const x0 = P.x;
        const v = 30 + Math.sqrt(Math.max(0, P.E)) * 30;
        P.x += v * dt;
        if (P.x < 240) { P.E += Ueff * (P.x - x0) / 122; if (P.E >= EA && Math.random() < p * dt * 20) { P.E -= EA; flash(P.x, P.y); } }
        else P.E -= S.Ug * (P.x - x0) / 26;
        P.el.setAttribute('cx', P.x.toFixed(1)); P.el.setAttribute('cy', P.y.toFixed(1));
        P.el.setAttribute('fill', P.E < 0.4 ? '#4c6f80' : '#86dcff');
        if (P.x >= 266 || (P.x > 240 && P.E <= 0)) { P.el.remove(); parts.splice(i, 1); }
      }
    }
    raf = requestAnimationFrame(frame);
    return { destroy() { cancelAnimationFrame(raf); chK.destroy(); chM.destroy(); } };
  }
};
