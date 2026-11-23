// ============================================================================
//  Schlüsselexperiment: Franck-Hertz-Versuch mit Quecksilber oder Neon
//  2D-Aufbau (SVG) und 3D-Aufbau (Three.js): Röhre (im Ofen bei Hg), Betriebsgerät,
//  XY-Schreiber bzw. Oszilloskop. Kennlinie aus einem Monte-Carlo-Modell: Elektronen
//  gewinnen im Feld Energie, stoßen ab E_A unelastisch und erreichen den Auffänger nur,
//  wenn ihre Restenergie die Gegenspannung überwindet. Gleiche Zufallszahlen für alle
//  Spannungen → glatte, reproduzierbare Kurve.
//  Neon: Anregung bei ca. 18,7 eV, die angeregten Atome leuchten rot-orange – in der
//  Röhre entstehen sichtbare Leuchtschichten, die mit wachsender Spannung zur Kathode wandern.
// ============================================================================
import { viewHost } from '../js/lib/views.js';

const GASES = {
  hg: { id: 'hg', name: 'Quecksilber (Hg)', EA: 4.89, UK: 2.0 + (Math.random() * 0.4 - 0.2), Umax: 30, Ug: 1.5, UgMax: 3, oven: true, Iscale: 1.0e-10, sat: 22, ramp: 2.2, flash: '#b98cff' },
  ne: { id: 'ne', name: 'Neon (Ne)', EA: 18.7, UK: 1.0 + (Math.random() * 0.4 - 0.2), Umax: 80, Ug: 7, UgMax: 12, oven: false, Iscale: 2.3e-11, sat: 58, ramp: 5.5, flash: '#ff7a2a' }
};
const NE = 500, NS_ = 140;                          // Elektronen, Wegschritte
const RND = Float32Array.from({ length: NE * NS_ }, Math.random);
const E0 = Float32Array.from({ length: NE }, () => -0.35 * Math.log(1 - Math.random() * 0.999)); // Startenergie (thermisch, Raumladung)
const pHg = T => Math.pow(10, 10.122 - 3190 / (T + 273.15)); // Dampfdruck Hg in Pa (Näherung)
// Laufstrecke / freie Weglänge für unelastische Stöße
function pathRatio(gas, T) {
  if (gas.id === 'ne') return 12;                   // Neon-Füllung ca. 10 hPa, Raumtemperatur
  const n = pHg(T) / (T + 273.15), n180 = pHg(180) / 453.15;
  return 18 * n / n180;
}
function collector(U, Ug, T, gas) {
  const L = pathRatio(gas, T), p = 1 - Math.exp(-L / NS_);
  const Ueff = U - gas.UK; if (Ueff <= 0) return 0;
  const dE = Ueff / NS_; let hit = 0;
  for (let e = 0; e < NE; e++) {
    let En = E0[e]; const o = e * NS_;
    for (let s = 0; s < NS_; s++) { En += dE; if (En >= gas.EA && RND[o + s] < p) En -= gas.EA; }
    if (En >= Ug) hit++;
  }
  const space = Math.pow(Ueff, 1.5) / (1 + Math.pow(Ueff / gas.sat, 1.5));   // Raumladung, Sättigung
  const elastic = Math.exp(-L / 160);
  return gas.Iscale * space * elastic * hit / NE;
}

const svgMarkup = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Franck-Hertz-Röhre, Betriebsgerät und XY-Schreiber mit der Kennlinie">
<defs>
  <linearGradient id="fBench" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2024"/><stop offset="1" stop-color="#121518"/></linearGradient>
  <linearGradient id="fBox" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4046"/><stop offset="1" stop-color="#23282c"/></linearGradient>
  <linearGradient id="fOven" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6d7276"/><stop offset=".5" stop-color="#9aa0a4"/><stop offset="1" stop-color="#5c6164"/></linearGradient>
  <linearGradient id="fZone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff5a1a" stop-opacity="0"/><stop offset=".5" stop-color="#ff8a3a" stop-opacity="1"/><stop offset="1" stop-color="#ff5a1a" stop-opacity="0"/></linearGradient>
  <filter id="fGlow"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="fBig" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="fSh" x="-10%" y="-10%" width="130%" height="150%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000" flood-opacity=".55"/></filter>
  <g id="fSock"><circle r="7.5" fill="currentColor" stroke="#000" stroke-opacity=".5"/><circle r="3.2" fill="#c8a24a"/></g>
</defs>
<rect width="1000" height="620" fill="url(#fBench)"/>
<!-- Ofen (nur Hg) -->
<g id="fOvenG">
  <g filter="url(#fSh)">
    <rect x="40" y="60" width="300" height="300" rx="10" fill="url(#fOven)" stroke="#4a5157"/>
    <rect x="60" y="80" width="260" height="230" rx="6" fill="#141719" stroke="#3a4045"/>
    <rect x="60" y="360" width="260" height="14" fill="#2a2f33"/>
  </g>
  <rect id="fHeatGlow" x="62" y="82" width="256" height="226" rx="5" fill="#ff7a2a" opacity="0"/>
  <g id="fCoils" stroke="#ff6a2a" stroke-width="2" fill="none" opacity="0"><path d="M70 296 q8 -10 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0"/></g>
  <rect x="300" y="96" width="14" height="190" rx="7" fill="#e8e6e0" opacity=".85"/>
  <rect id="fThermo" x="304" y="270" width="6" height="10" rx="3" fill="#d23b2a"/>
  <circle cx="307" cy="288" r="9" fill="#d23b2a"/>
</g>
<g id="fStandG"><rect x="170" y="230" width="40" height="130" fill="#2a2f33"/><rect x="120" y="356" width="140" height="14" rx="3" fill="#3a4045"/></g>
<!-- Röhre -->
<g id="fZones" filter="url(#fBig)"></g>
<rect id="fTube" x="90" y="150" width="200" height="80" rx="40" fill="#9fb4c2" fill-opacity=".08" stroke="#9fb4c2" stroke-opacity=".55" stroke-width="1.4"/>
<rect x="104" y="172" width="8" height="36" rx="2" fill="#3b3f44"/>
<rect id="fCath" x="112" y="178" width="5" height="24" fill="#222"/>
<g stroke="#c9d0d4" stroke-width="1.2"><line x1="240" y1="166" x2="240" y2="214" stroke-dasharray="2 2"/></g>
<rect x="266" y="166" width="5" height="48" fill="#c9d0d4"/>
<g id="fAtoms" fill="#59626a"></g>
<g id="fElec" fill="#86dcff" filter="url(#fGlow)"></g>
<g id="fFlash" filter="url(#fGlow)"></g>
<text x="114" y="248" fill="#8e979d" font-size="10" text-anchor="middle">K</text><text x="240" y="248" fill="#8e979d" font-size="10" text-anchor="middle">G</text><text x="268" y="248" fill="#8e979d" font-size="10" text-anchor="middle">A</text>
<text id="fTubeLbl" x="190" y="104" fill="#c9c3ba" font-size="12" text-anchor="middle">Hg-Röhre im Ofen</text>
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
<text id="fXYlbl" x="845" y="334" fill="#333" font-size="10" text-anchor="middle">U_B: 0 … 30 V</text>
<text x="745" y="110" fill="#333" font-size="10">I_A</text>
<!-- Energieschema (Modell) -->
<g id="fModelG" opacity="0"><g transform="translate(40 400)">
  <rect width="320" height="180" rx="10" fill="#101316" stroke="#5a4b8a"/>
  <text x="14" y="22" fill="#c7b6ff" font-size="12">Modell: Energie eines Elektrons auf dem Weg K → G → A</text>
  <path id="fEpath" fill="none" stroke="#86dcff" stroke-width="2"/>
  <line x1="20" y1="150" x2="300" y2="150" stroke="#4a545c"/>
  <line id="fEaLine" x1="20" x2="250" stroke="#ab93ff" stroke-dasharray="4 4"/>
  <text id="fEaTxt" x="22" fill="#ab93ff" font-size="10">4,9 eV</text>
  <line id="fUgLine" x1="250" x2="300" stroke="#ff8a7a" stroke-dasharray="3 3"/>
  <text x="250" y="168" fill="#8e979d" font-size="10">Gegenfeld</text>
</g></g>
</svg>`;

export default {
  intro: 'Elektronen werden in einer Röhre mit Quecksilber- oder Neondampf beschleunigt. Der Strom zum Auffänger steigt nicht gleichmäßig an, sondern bricht immer wieder ein – im Abstand von etwa 4,9 V. Die Atome nehmen Energie nur in festen Portionen auf: ein direkter Nachweis diskreter Energieniveaus.',
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
<p>Dieses Licht ist unsichtbar.</p>
<h3>Neon: Leuchtschichten</h3>
<p>Bei Neon liegt die Anregung bei etwa 18,7 eV, der Abstand der Maxima also bei rund 19 V. Die angeregten Atome geben ihre Energie in zwei Schritten ab; der zweite Schritt (≈ 2 eV) liefert rot-oranges Licht. Wo die Elektronen die Anregungsenergie erreichen, leuchtet das Gas: Es entsteht eine leuchtende Schicht. Bei höherer Spannung wird die Energie früher erreicht – die Schicht wandert zur Kathode, und am Gitter taucht eine zweite auf. So sieht man die Anregungszonen direkt.</p>
<h3>Lage des ersten Maximums</h3>
<p>Das erste Maximum liegt nicht bei 4,9 V, sondern um die <b>Kontaktspannung</b> (Unterschied der Austrittsarbeiten von Kathode und Gitter, ca. 2 V) verschoben. Für die Auswertung zählen deshalb nur die Abstände der Maxima.</p>
<h3>Einfluss der Temperatur</h3>
<p>Höhere Temperatur bedeutet mehr Hg-Atome und eine kürzere freie Weglänge. Die Elektronen stoßen dann sofort, wenn sie 4,9 eV erreichen: Die Maxima werden schärfer, der Strom insgesamt kleiner. Bei zu niedriger Temperatur verschwimmt die Struktur.</p>
<h3>Modellgrenzen</h3>
<ul><li>Die Kennlinie stammt aus einem einfachen Monte-Carlo-Modell mit einer Anregungsstufe; höhere Niveaus (z. B. 6,7 eV) und Ionisation sind nicht berücksichtigt.</li><li>Die Kontaktspannung ist pro Seitenaufruf zufällig (Hg 1,8 … 2,2 V, Ne 0,8 … 1,2 V). Die Lage der Neon-Leuchtschichten ist aus der Energiebilanz berechnet; Streuung und Raumladung verschieben sie im echten Versuch etwas.</li></ul><h3>Was die Modellansicht zeigt</h3><ul><li><b>Elektronen</b> starten fast in Ruhe an der Kathode und werden im homogenen Feld gleichmäßig beschleunigt: Sie werden immer schneller (längerer Schweif, hellere Farbe). Es gilt E<sub>kin</sub> = ½·m·v², also v ~ √E.</li><li>Erst wenn E<sub>kin</sub> die Anregungsenergie E<sub>A</sub> erreicht, kann ein Stoß Energie übertragen (Lichtblitz). Das Elektron verliert genau E<sub>A</sub>, ist danach fast in Ruhe und wird wieder beschleunigt.</li><li>Hinter dem Gitter bremst die Gegenspannung. Langsame (dunkle) Elektronen kehren um und erreichen den Auffänger nicht.</li><li>Die <b>Energieleiter</b> zeigt den Sägezahn: Energie gewinnen, abgeben, wieder gewinnen.</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Röhre</td><td>Tetrode/Triode mit Hg-Tropfen, Abstand K–G ≈ 8 mm</td></tr>
<tr><td>Ofen</td><td>bis 220 °C, Thermometer bzw. Thermoelement</td></tr>
<tr><td>Beschleunigungsspannung U<sub>B</sub></td><td>0 … 30 V, Rampe</td></tr>
<tr><td>Gegenspannung U<sub>G</sub></td><td>0 … 5 V</td></tr>
<tr><td>Auffängerstrom</td><td>Messverstärker, 0 … 10 nA</td></tr>
<tr><td>Aufzeichnung</td><td>XY-Schreiber oder Messwerterfassung</td></tr>
<tr><td>Neon-Röhre</td><td>ca. 10 hPa, U<sub>B</sub> 0 … 80 V, U<sub>G</sub> ≈ 7 V, ohne Ofen</td></tr>
</tbody></table>
<p class="muted" style="margin-top:12px">James Franck und Gustav Hertz veröffentlichten den Versuch 1914 und erhielten dafür 1925 den Nobelpreis.</p>`,
    abi: `
<details class="q"><summary>Erkläre den Verlauf der Franck-Hertz-Kurve. <span class="op">AFB II</span></summary><p>Bis zur Anregungsenergie stoßen die Elektronen nur elastisch und erreichen den Auffänger, der Strom steigt. Ab 4,9 eV regen sie Hg-Atome an und verlieren diese Energie; vor dem Auffänger reicht die Restenergie nicht mehr gegen die Gegenspannung, der Strom sinkt. Mit wachsender Spannung wiederholt sich das bei 2·4,9 eV, 3·4,9 eV usw.</p></details>
<details class="q"><summary>Maxima liegen bei 7,0 V, 11,9 V, 16,8 V, 21,7 V und 26,6 V. Bestimme die Anregungsenergie und die Wellenlänge des ausgesandten Lichts. <span class="op">AFB II</span></summary><p>Mittlerer Abstand ΔU = (26,6 V − 7,0 V)/4 = 4,9 V ⇒ ΔE = 4,9 eV. λ = h·c/ΔE = 6,63·10⁻³⁴ J·s · 3,00·10⁸ m/s / (4,9 · 1,60·10⁻¹⁹ J) ≈ 254 nm.</p></details>
<details class="q"><summary>Warum liegt das erste Maximum nicht bei 4,9 V? <span class="op">AFB II</span></summary><p>Wegen der Kontaktspannung zwischen Kathode und Gitter (verschiedene Austrittsarbeiten) ist die tatsächliche Beschleunigungsspannung um ca. 2 V kleiner. Die Abstände der Maxima bleiben davon unberührt.</p></details>
<details class="q"><summary>Welche Funktion hat die Gegenspannung? Was passiert ohne sie? <span class="op">AFB II–III</span></summary><p>Sie sortiert die Elektronen nach ihrer Restenergie: Nur Elektronen mit E &gt; e·U<sub>G</sub> erreichen den Auffänger. Ohne Gegenspannung würden auch Elektronen nach einem Stoß (mit kleiner Restenergie) mitgezählt, die Einbrüche wären kaum zu sehen.</p></details>
<details class="q"><summary>In einer Neon-Röhre sieht man bei 60 V drei leuchtende Schichten. Erkläre ihre Entstehung und ihre Wanderung bei steigender Spannung. <span class="op">AFB III</span></summary><p>Die Elektronen gewinnen auf dem Weg zum Gitter gleichmäßig Energie. Wo sie 18,7 eV erreichen, regen sie Neonatome an, die danach rot-orange leuchten. Nach dem Stoß beginnt der Energiegewinn von vorn: Bei 3·18,7 eV ≈ 56 V gibt es drei solche Zonen. Bei höherer Spannung wird die Anregungsenergie auf kürzerem Weg erreicht, die Schichten rücken zur Kathode.</p></details>
<details class="q"><summary>Begründe, dass der Versuch das Bohr’sche Atommodell stützt. <span class="op">AFB III</span></summary><p>Die Hg-Atome nehmen Energie nur in einer bestimmten Portion (4,9 eV) auf. Das zeigt diskrete Energieniveaus in der Atomhülle. Die Wellenlänge des dabei ausgesandten Lichts (254 nm) stimmt mit einer Linie im Hg-Spektrum überein – Absorption und Emission gehören zum selben Übergang.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, selectBox, check, button, fmt, gauss, dataTable, toast, display } = ui;

    const S = { gas: GASES.hg, heat: false, Tset: 180, T: 20, U: 0, Ug: 1.5, ramp: null, discharge: false, I: 0 };
    const pen = [];   // Punkte des XY-Schreibers [U, I]

    // ---- Bedienfeld ----
    const gGas = group('Röhre');
    const sGas = selectBox({ label: 'Gasfüllung', value: 'hg', options: [{ value: 'hg', label: 'Quecksilber (Ofen nötig, UV-Licht)' }, { value: 'ne', label: 'Neon (Raumtemperatur, Leuchtschichten)' }], onChange: v => setGas(v) });
    gGas.append(sGas);
    const gO = group('Ofen', { led: true });
    const cHeat = check({ label: 'Ofenheizung einschalten', onChange: v => { S.heat = v; gO.led(v); } });
    const sT = slider({ label: 'Solltemperatur', min: 120, max: 210, step: 5, value: 180, unit: '°C', onInput: v => { S.Tset = v; } });
    gO.append(cHeat, sT);
    const gB = group('Betriebsgerät', { led: true }); gB.led(true); gB.querySelector('.led').classList.add('g');
    const sU = slider({ label: 'Beschleunigungsspannung U_B', min: 0, max: 30, step: 0.1, value: 0, unit: 'V', digits: 1, onInput: v => { S.U = v; } });
    const sG = slider({ label: 'Gegenspannung U_G', min: 0, max: 3, step: 0.1, value: 1.5, unit: 'V', digits: 1, onInput: v => { S.Ug = v; } });
    gB.append(sU, sG);
    const gR = group('Aufzeichnung', { led: true });
    const bRamp = button('Rampe starten', () => S.ramp ? stopRamp(false) : startRamp(), 'btn small primary');
    const bPt = button('Messpunkt übernehmen', () => takePoint());
    const bClr = button('Schreiber leeren', () => { pen.length = 0; });
    gR.append(el('div', { class: 'bar' }, bRamp, bPt, bClr));
    const dT = display('Ofentemperatur ϑ'), dI = display('Auffängerstrom I_A');
    const gL = group('Live-Werte'); gL.append(dT, dI);
    controls.append(gGas, gO, gB, gR, gL);
    function setGas(id) {
      if (S.ramp) stopRamp(false);
      S.gas = GASES[id]; const g = S.gas;
      sU.input.max = g.Umax; sU.set(0, true); sG.input.max = g.UgMax; sG.set(g.Ug, true);
      gO.style.display = g.oven ? '' : 'none'; pen.length = 0; points.length = 0;
      chK.o.xmax = g.Umax; redraw();
    }

    // ---- Messwerte ----
    const curves = [], points = []; let shown = null;
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
          csvTools(() => ({ meta: shown ? [`Franck-Hertz – ${shown.name}`] : [], columns: [{ key: 'U', label: 'U_B in V' }, { key: 'I', label: 'I_A in nA' }], rows: shown ? shown.pts.map(p => ({ U: p[0], I: p[1] })) : points.map(p => ({ U: p[0], I: p[1] })) }), 'franck-hertz_kennlinie')),
        el('div', { class: 'chartbox' }, el('h4', {}, 'Auswertung: Lage der Maxima'), figM, resM)),
      el('div', { style: 'height:14px' }),
      el('div', { class: 'data' }, el('div', {}, el('h3', { style: 'margin-bottom:10px' }, 'Maxima der letzten Kennlinie'), tblMax),
        el('div', {}, el('h3', { style: 'margin-bottom:10px' }, 'Alle Kennlinien'), tblRuns)));
    function findMax(pts, minU) {
      if (pts.length < 20) return [];
      const ys = pts.map(p => p[1]); const sm = ys.map((_, i) => { let s = 0, c = 0; for (let j = -4; j <= 4; j++) { const v = ys[i + j]; if (v != null) { s += v; c++; } } return s / c; });
      const top = Math.max(...sm), res = [];
      for (let i = 5; i < sm.length - 5; i++) {
        if (sm[i] >= sm[i - 1] && sm[i] > sm[i + 1] && sm[i] === Math.max(...sm.slice(i - 5, i + 6))) {
          let lo = sm[i]; for (let j = i + 1; j < Math.min(sm.length, i + 40); j++) lo = Math.min(lo, sm[j]);
          if (sm[i] - lo > 0.03 * top && pts[i][0] > minU) {
            const [x0, y0] = [pts[i - 1][0], sm[i - 1]], [x1, y1] = [pts[i][0], sm[i]], [, y2] = [pts[i + 1][0], sm[i + 1]];
            const d = (y0 - 2 * y1 + y2); res.push(d ? x1 + 0.5 * (x1 - x0) * (y0 - y2) / d : x1);
          }
        }
      }
      return res;
    }
    function analyse(c) {
      c.max = findMax(c.pts, c.gas === 'ne' ? 10 : 3);
      const l = c.max.length >= 2 ? fit.linFit(c.max.map((_, i) => i + 1), c.max) : null;
      c.dU = l ? l.a : NaN; c.lam = l ? 1239.84 / l.a : NaN; c.nmax = c.max.length; c.fit = l;
    }
    function redraw() {
      const cols = ['#86dcff', '#f2ac74', '#ab93ff', '#7fd6a0', '#ff8a7a', '#e5d36b'];
      const series = curves.filter(c => c.gas === S.gas.id).map((c, i) => ({ name: c.name, color: cols[i % 6], points: c.pts }));
      if (points.length) series.push({ name: 'Einzelpunkte', color: '#ece6dc', mode: 'dot', points });
      chK.set(series); tblRuns.render(curves);
      if (shown && shown.max.length) {
        tblMax.render(shown.max.map((U, i) => ({ n: i + 1, U, dU: i ? U - shown.max[i - 1] : null })));
        chM.set([{ points: shown.max.map((U, i) => [i + 1, U]), color: '#f2ac74', mode: 'dot', name: 'Maxima' }], shown.fit ? [{ f: shown.fit.f, color: '#ab93ff', name: 'Ausgleichsgerade' }] : []);
        resM.innerHTML = shown.fit ? `<div><span>Steigung = Abstand ΔU</span><br><b>${fmt(shown.dU, 2)} V</b></div><div><span>Anregungsenergie</span><br><b>ΔE = ${fmt(shown.dU, 2)} eV</b></div><div><span>Wellenlänge des Lichts</span><br><b>λ = ${fmt(shown.lam, 0)} nm</b></div><div><span>Achsenabschnitt (≈ Kontaktspannung + U_G)</span><br><b>${fmt(shown.fit.b, 2)} V</b></div>`
          + (shown.gas === 'ne' ? '<div><span>Hinweis Neon</span><br><span>Das sichtbare rot-orange Licht stammt aus einem Folgeübergang (≈ 2 eV), nicht aus der Anregung selbst.</span></div>' : '')
          : '<span>Mindestens zwei Maxima nötig.</span>';
      } else { tblMax.render([]); chM.set([]); resM.innerHTML = '<span>Noch keine Kennlinie. „Rampe starten“ zeichnet eine auf.</span>'; }
    }
    redraw();
    function measureI() {
      if (S.discharge) return 6e-9 + gauss(4e-10);
      return Math.max(0, collector(S.U, S.Ug, S.T, S.gas) + gauss(0.012e-9));
    }
    function startRamp() {
      if (S.gas.oven && S.T < 150) toast('Der Ofen ist noch zu kalt. Für eine gute Kurve auf 160 … 190 °C heizen und warten.');
      const g = S.gas;
      S.ramp = { gas: g.id, name: g.oven ? `Hg, ϑ = ${Math.round(S.T)} °C, U_G = ${fmt(S.Ug, 1)} V` : `Ne, U_G = ${fmt(S.Ug, 1)} V`, pts: [] };
      sU.set(0); S.U = 0; pen.length = 0; bRamp.textContent = 'Rampe stoppen'; gR.led(true);
    }
    function stopRamp(done) {
      const r = S.ramp; S.ramp = null; bRamp.textContent = 'Rampe starten'; gR.led(false);
      if (r && r.pts.length > 40) { analyse(r); curves.push(r); shown = r; redraw(); toast(done ? `Kennlinie aufgenommen: ${r.nmax} Maxima gefunden.` : 'Rampe gestoppt, Teilkurve gespeichert.'); }
    }
    function takePoint() { const I = measureI(); points.push([+S.U.toFixed(1), +(I * 1e9).toFixed(3)]); pen.push([S.U, I]); redraw(); toast(`Punkt: U_B = ${fmt(S.U, 1)} V, I_A = ${fmt(I * 1e9, 2)} nA`); }

    // ---- Teilchenmodell (gemeinsam): x = 0 Kathode … 1 Gitter … 1,2 Auffänger ----
    const parts = [], flashes = []; let spawnAcc = 0;
    // Kinematik: E = ½·m·v²  →  v ~ √E. Das Feld zwischen Kathode und Gitter ist homogen,
    // das Elektron wird also gleichmäßig beschleunigt. Nach einem Stoß hat es fast keine
    // Bewegungsenergie mehr und startet wieder (fast) aus der Ruhe. Hinter dem Gitter bremst U_G.
    const VK = 0.55, V0 = 0.015;           // Bildschirm-Geschwindigkeit bei E = E_A, Mindesttempo
    const vOf = (E, g) => V0 + VK * Math.sqrt(Math.max(0, E) / g.EA);
    function stepParticles(dt) {
      const g = S.gas, Ueff = Math.max(0, S.U - g.UK), L = pathRatio(g, S.T);
      const active = !g.oven || S.T > 140;
      spawnAcc += dt * 26 * Math.min(1, Ueff / (g.EA * 1.5));
      while (spawnAcc > 1) { spawnAcc -= 1; if (parts.length < 70) parts.push({ x: 0, y: Math.random() * 2 - 1, E: Math.random() * 0.06 * g.EA, dir: 1, hit: 0 }); }
      const n = 4, h = dt / n;             // Teilschritte: sonst springen schnelle Elektronen über Stoßorte
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; let gone = false;
        if (p.hit > 0) p.hit -= dt;
        for (let k = 0; k < n && !gone; k++) {
          const dx = vOf(p.E, g) * h * p.dir;
          if (p.x < 1) {
            p.E += Ueff * dx;              // Energiegewinn = e·E-Feld·Weg
            if (active && p.E >= g.EA && Math.random() < 1 - Math.exp(-L * dx)) {
              p.E -= g.EA; p.hit = 0.25;
              if (flashes.length < 80) flashes.push({ x: p.x, y: p.y, ttl: 0.35 });
            }
          } else p.E -= S.Ug * dx / 0.2;   // Gegenfeld: bremst auf dem Hinweg, beschleunigt zurück
          p.x += dx;
          if (p.x > 1 && p.E <= 0.002 * g.EA && p.dir > 0) { p.dir = -1; p.E = 0.002 * g.EA; }
          if (p.x >= 1.2 || (p.dir < 0 && p.x <= 1)) gone = true;
        }
        if (gone) parts.splice(i, 1);
      }
      for (let i = flashes.length - 1; i >= 0; i--) { flashes[i].ttl -= dt; if (flashes[i].ttl <= 0) flashes.splice(i, 1); }
    }
    // Farbe und Schweif nach Geschwindigkeit
    const eFrac = p => Math.min(1, Math.max(0, p.E) / S.gas.EA);
    const eCol = p => { const f = eFrac(p); return `rgb(${Math.round(60 + 150 * f)},${Math.round(90 + 150 * f)},${Math.round(110 + 145 * f)})`; };
    // Leuchtschichten in Neon: dort, wo die Elektronen n·E_A erreichen
    function zones() {
      const g = S.gas, Ueff = Math.max(0, S.U - g.UK); if (g.id !== 'ne' || Ueff < g.EA) return [];
      const z = [], w = 3.2 / Ueff, I = Math.min(1, S.I / 4e-9);
      for (let n = 1; n * g.EA < Ueff; n++) z.push({ x: Math.min(1, n * g.EA / Ueff + 0.6 / Ueff), w, a: (0.35 + 0.65 * I) * Math.min(1, (Ueff - n * g.EA) / 3) });
      return z;
    }
    function energyPathD(base, sc) {
      const g = S.gas, Ueff = Math.max(0, S.U - g.UK); let E = 0, d = `M20 ${base}`; const n = 80;
      const active = !g.oven || S.T > 140;
      for (let i = 1; i <= n; i++) { E += Ueff / n; if (E >= g.EA && active) { d += ` L${(20 + 230 * i / n).toFixed(1)} ${(base - E * sc).toFixed(1)}`; E -= g.EA; } d += ` L${(20 + 230 * i / n).toFixed(1)} ${(base - Math.min(E, g.EA * 2.4) * sc).toFixed(1)}`; }
      const Ea = E - S.Ug; return { d: d + ` L300 ${(base - Math.max(0, Ea) * sc).toFixed(1)}`, ok: Ea >= 0 };
    }

    // ======================= Ansicht 2D =======================
    async function view2d(box, MM) {
      box.insertAdjacentHTML('beforeend', svgMarkup());
      const svg = box.querySelector('svg'), q = id => svg.querySelector('#' + id);
      { let g = ''; for (let i = 1; i < 6; i++) { const x = 736 + i * 218 / 6; g += `<line x1="${x}" y1="96" x2="${x}" y2="316"/>`; } for (let i = 1; i < 5; i++) { const y = 96 + i * 44; g += `<line x1="736" y1="${y}" x2="954" y2="${y}"/>`; } q('fGrid').innerHTML = g; }
      { let a = ''; for (let i = 0; i < 46; i++) a += `<circle cx="${(122 + Math.random() * 140).toFixed(1)}" cy="${(166 + Math.random() * 48).toFixed(1)}" r="1.6"/>`; q('fAtoms').innerHTML = a; }
      const XY = (U, I) => [736 + U / S.gas.Umax * 218, 316 - Math.min(1, I / 6e-9) * 216];
      const px = x => x <= 1 ? 117 + x * 123 : 240 + (x - 1) * 130, py = y => 190 + y * 17;
      let raf = 0, acc = 0;
      function frame() {
        raf = requestAnimationFrame(frame);
        const g = S.gas, model = MM.model, hg = g.oven;
        q('fOvenG').style.display = hg ? '' : 'none'; q('fStandG').style.display = hg ? 'none' : '';
        q('fTubeLbl').textContent = hg ? 'Hg-Röhre im Ofen' : 'Ne-Röhre (Raumtemperatur)';
        q('fTtxt').textContent = hg ? `ϑ = ${Math.round(S.T)} °C` : '';
        q('fThermo').setAttribute('y', (280 - Math.min(180, (S.T - 10) / 220 * 180)).toFixed(1)); q('fThermo').setAttribute('height', Math.min(180, (S.T - 10) / 220 * 180).toFixed(1));
        const hgl = Math.max(0, Math.min(1, (S.T - 60) / 150));
        q('fHeatGlow').setAttribute('opacity', (hgl * 0.08).toFixed(3)); q('fCoils').setAttribute('opacity', S.heat ? (0.3 + 0.5 * hgl).toFixed(2) : 0);
        q('fCath').setAttribute('fill', '#ff8a3d');
        q('fTube').setAttribute('fill', S.discharge ? '#6fa8ff' : '#9fb4c2'); q('fTube').setAttribute('fill-opacity', S.discharge ? '.45' : '.08');
        // Leuchtschichten (real sichtbar bei Neon)
        q('fZones').innerHTML = zones().map(z => `<ellipse cx="${px(z.x).toFixed(1)}" cy="190" rx="${Math.max(4, z.w * 123).toFixed(1)}" ry="26" fill="#ff7a2a" opacity="${z.a.toFixed(2)}"/>`).join('');
        // Modell
        q('fModelG').setAttribute('opacity', model ? 1 : 0); q('fAtoms').style.display = model ? '' : 'none';
        q('fElec').innerHTML = model ? parts.map(p => { const x = px(p.x), y = py(p.y), c = eCol(p), t = vOf(p.E, g) * 60 * p.dir; return `<line x1="${(x - t).toFixed(1)}" y1="${y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${c}" stroke-width="1.6" stroke-linecap="round" opacity=".55"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${p.hit > 0 ? 3 : 2}" fill="${c}"/>`; }).join('') : '';
        q('fFlash').innerHTML = model ? flashes.map(f => `<circle cx="${px(f.x).toFixed(1)}" cy="${py(f.y).toFixed(1)}" r="${(3 + 5 * f.ttl / 0.35).toFixed(1)}" fill="${g.flash}" opacity="${(f.ttl / 0.35).toFixed(2)}"/>`).join('') : '';
        acc++;
        if (acc % 4 === 0) {
          q('fDU').textContent = `${fmt(S.U, 1)} V`; q('fDG').textContent = `${fmt(S.Ug, 1)} V`; q('fDI').textContent = `${fmt(S.I * 1e9, 2)} nA`;
          q('fXYlbl').textContent = `U_B: 0 … ${g.Umax} V`;
          q('fCurve').setAttribute('d', pen.length ? 'M' + pen.map(p => XY(p[0], p[1]).map(v => v.toFixed(1)).join(' ')).join(' L') : '');
          const [ppx, ppy] = XY(S.U, S.I); q('fPen').setAttribute('cx', ppx); q('fPen').setAttribute('cy', ppy);
          q('fRec').setAttribute('fill', S.ramp ? '#ff4b3e' : '#3a3a3a'); q('fRecT').textContent = S.ramp ? 'Rampe läuft' : 'Rampe aus';
          if (model) {
            const sc = 48 / g.EA, base = 150, eaY = base - g.EA * sc;
            q('fEaLine').setAttribute('y1', eaY); q('fEaLine').setAttribute('y2', eaY); q('fEaTxt').setAttribute('y', eaY - 4); q('fEaTxt').textContent = `E_A = ${fmt(g.EA, 1)} eV`;
            q('fUgLine').setAttribute('y1', base - S.Ug * sc); q('fUgLine').setAttribute('y2', base - S.Ug * sc);
            const e = energyPathD(base, sc); q('fEpath').setAttribute('d', e.d); q('fEpath').setAttribute('stroke', e.ok ? '#86dcff' : '#ff8a7a');
          }
        }
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); } };
    }

    // ======================= Ansicht 3D =======================
    async function view3d(box, MM) {
      const { createLab, mats, cable, powerSupply, socket, label, glassMaterial, glowPool } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [-0.05, 0.34, 0.62], target: [-0.08, 0.14, 0], table: [3, 1.6], bloom: [0.85, 0.5, 0.8], room: 0.35, minDist: 0.15, maxDist: 2.4, fov: 34 });
      const { THREE, scene } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad</div>');
      const OX = -0.24, OY = 0.16; // Röhrenmitte
      // Ofen
      const oven = new THREE.Group(); oven.position.set(OX, 0, 0); scene.add(oven);
      const steel = new THREE.MeshStandardMaterial({ color: 0x9aa0a4, metalness: 0.85, roughness: 0.35 });
      const shell = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), steel); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; oven.add(m); };
      shell(0.3, 0.012, 0.22, 0, 0.026, 0); shell(0.3, 0.012, 0.22, 0, 0.3, 0); shell(0.012, 0.28, 0.22, -0.144, 0.163, 0); shell(0.012, 0.28, 0.22, 0.144, 0.163, 0); shell(0.3, 0.28, 0.012, 0, 0.163, -0.104);
      const frontFrame = new THREE.Mesh(new THREE.RingGeometry(0.085, 0.13, 48), steel); frontFrame.position.set(0, 0.163, 0.11); oven.add(frontFrame);
      const win = new THREE.Mesh(new THREE.CircleGeometry(0.085, 48), glassMaterial(THREE, [0.8, 0.7, 0.6])); win.position.set(0, 0.163, 0.111); win.renderOrder = 6; oven.add(win);
      const inner = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.26, 0.2), new THREE.MeshStandardMaterial({ color: 0x15181b, roughness: 0.9, side: THREE.BackSide })); inner.position.y = 0.163; oven.add(inner);
      const coilMat = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false });
      for (let i = 0; i < 2; i++) { const c = new THREE.Mesh(new THREE.TorusKnotGeometry(0.1, 0.0025, 200, 6, 1, 18), coilMat); c.scale.set(1.2, 0.08, 0.7); c.position.set(0, 0.05 + i * 0.22, -0.02); oven.add(c); }
      const heatLight = new THREE.PointLight(0xff6a2a, 0, 0.5, 2); heatLight.position.set(0, 0.08, 0); oven.add(heatLight);
      const thermo = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16, 12), glassMaterial(THREE)); thermo.position.set(0.1, 0.36, 0); oven.add(thermo);
      const merc = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 1, 8), new THREE.MeshBasicMaterial({ color: 0xd23b2a })); oven.add(merc);
      const legs = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.02, 0.18), M.black); legs.position.y = 0.01; oven.add(legs);
      // Stativ für die Neon-Röhre
      const nstand = new THREE.Group(); nstand.position.set(OX, 0, 0); scene.add(nstand);
      const nb = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.1), M.housing); nb.position.y = 0.01; const nr = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, OY - 0.04, 16), M.steel); nr.position.y = (OY - 0.04) / 2 + 0.02;
      const nh = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.03), M.housing); nh.position.y = OY - 0.035; nstand.add(nb, nr, nh);
      // Röhre (gemeinsam)
      const tube = new THREE.Group(); tube.position.set(OX, OY, 0); scene.add(tube);
      const glass = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.12, 12, 40), glassMaterial(THREE)); glass.rotation.z = Math.PI / 2; glass.renderOrder = 5; tube.add(glass);
      const cath = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.014, 20), new THREE.MeshBasicMaterial({ color: 0xff8a3d, toneMapped: false })); cath.rotation.z = Math.PI / 2; cath.position.x = -0.062; tube.add(cath);
      const grid = new THREE.Group(); grid.position.x = 0.04; tube.add(grid);
      grid.add(new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.0008, 6, 40), M.steel)); grid.children[0].rotation.y = Math.PI / 2;
      for (let i = -3; i <= 3; i++) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.0004, 0.0004, 0.036, 4), M.steel); w.position.z = i * 0.005; grid.add(w); }
      const anode = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.002, 32), M.steel); anode.rotation.z = Math.PI / 2; anode.position.x = 0.064; tube.add(anode);
      const zoneMat = () => new THREE.MeshBasicMaterial({ color: 0xff6a1a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      const zoneMeshes = Array.from({ length: 5 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), zoneMat()); m.visible = false; tube.add(m); return m; });
      const dischargeM = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.11, 8, 24), new THREE.MeshBasicMaterial({ color: 0x6fa8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); dischargeM.rotation.z = Math.PI / 2; tube.add(dischargeM);
      // Geräte
      const ctl = powerSupply(THREE, { w: 0.24, h: 0.13, d: 0.2, label: 'Franck-Hertz-Betriebsgerät', displays: 3, knobs: 3, sockets: ['yellow', 'black', 'red', 'blue', 'black'] });
      ctl.position.set(0.1, 0, 0.18); ctl.rotation.y = -0.15; scene.add(ctl);
      const osc = powerSupply(THREE, { w: 0.26, h: 0.18, d: 0.22, label: 'Oszilloskop (XY)', displays: 0, knobs: 4, sockets: ['blue', 'black'], color: 'light' });
      osc.position.set(0.32, 0, -0.06); osc.rotation.y = -0.5; scene.add(osc);
      const sc = document.createElement('canvas'); sc.width = 320; sc.height = 220; const sg = sc.getContext('2d'); const scTex = new THREE.CanvasTexture(sc); scTex.colorSpace = THREE.SRGBColorSpace;
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.096), new THREE.MeshBasicMaterial({ map: scTex, toneMapped: false })); scr.position.set(-0.04, 0.1, 0.1166); osc.add(scr);
      const sK = socket(THREE, 'yellow'), sGd = socket(THREE, 'red'); sK.position.set(OX - 0.03, 0.034, 0.112); sGd.position.set(OX + 0.03, 0.034, 0.112); scene.add(sK, sGd);
      scene.updateMatrixWorld(true);
      const wp = o => o.getWorldPosition(new THREE.Vector3());
      scene.add(cable(THREE, wp(sK), ctl.socketWorld(0), 0xd8b21c, 0.02), cable(THREE, wp(sGd), ctl.socketWorld(2), 0xc4231b, 0.03), cable(THREE, ctl.socketWorld(3), osc.socketWorld(0), 0x1f4fb8, 0.03), cable(THREE, ctl.socketWorld(4), osc.socketWorld(1), 0x151515, 0.04));
      // Modell
      const modelG = new THREE.Group(); tube.add(modelG);
      const ePool = glowPool(THREE, modelG, 70, 0x86dcff, 0.005), fPool = glowPool(THREE, modelG, 80, 0xb98cff, 0.016);
      const atomGeo = new THREE.SphereGeometry(0.0016, 8, 6), atomMat = new THREE.MeshStandardMaterial({ color: 0x8a939a, roughness: 0.5 });
      for (let i = 0; i < 60; i++) { const a = new THREE.Mesh(atomGeo, atomMat); a.position.set(-0.055 + Math.random() * 0.11, (Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.04); modelG.add(a); }
      const lM = label(THREE, 'Elektronen stoßen mit Gasatomen', { color: '#c7b6ff', size: 0.012 }); lM.position.set(0, 0.05, 0); modelG.add(lM);
      const X3 = x => x <= 1 ? -0.056 + x * 0.096 : 0.04 + (x - 1) * 0.12;
      let acc = 0;
      const off = lab.onFrame(dt => {
        const g = S.gas, hg = g.oven, model = MM.model;
        oven.visible = hg; nstand.visible = !hg;
        const hgl = Math.max(0, Math.min(1, (S.T - 40) / 170));
        coilMat.color.setRGB(0.95 * hgl * (S.heat ? 1 : 0.5), 0.28 * hgl * hgl, 0.05 * hgl ** 3); heatLight.intensity = 0; inner.material.emissive.setRGB(0.55, 0.16, 0.03); inner.material.emissiveIntensity = hg ? 0.3 * hgl : 0;
        const th = Math.min(0.15, Math.max(0.005, (S.T - 10) / 220 * 0.15)); merc.scale.y = th; merc.position.set(0.1, 0.285 + th / 2, 0);
        // Leuchtschichten
        const zs = zones();
        zoneMeshes.forEach((m, i) => { const z = zs[i]; m.visible = !!z; if (!z) return; m.position.x = X3(z.x); m.scale.set(Math.max(0.003, z.w * 0.096), 0.02, 0.02); m.material.opacity = z.a * 0.75; });
        dischargeM.material.opacity = S.discharge ? 0.35 : 0;
        acc += dt;
        if (acc > 0.08) {
          acc = 0;
          ctl.displays[0].draw(S.U.toFixed(1), 'V'); ctl.displays[1].draw(S.Ug.toFixed(1), 'V'); ctl.displays[2].draw((S.I * 1e9).toFixed(2), 'nA');
          ctl.setKnob(0, S.U / g.Umax); ctl.setKnob(1, S.Ug / g.UgMax);
          sg.fillStyle = '#081210'; sg.fillRect(0, 0, 320, 220); sg.strokeStyle = '#173328'; sg.lineWidth = 1;
          for (let i = 1; i < 10; i++) { sg.beginPath(); sg.moveTo(i * 32, 0); sg.lineTo(i * 32, 220); sg.stroke(); } for (let i = 1; i < 8; i++) { sg.beginPath(); sg.moveTo(0, i * 27.5); sg.lineTo(320, i * 27.5); sg.stroke(); }
          if (pen.length > 1) { sg.strokeStyle = '#7dffb8'; sg.lineWidth = 2.5; sg.shadowColor = '#7dffb8'; sg.shadowBlur = 8; sg.beginPath(); pen.forEach((p, i) => { const x = p[0] / g.Umax * 310 + 5, y = 212 - Math.min(1, p[1] / 6e-9) * 204; i ? sg.lineTo(x, y) : sg.moveTo(x, y); }); sg.stroke(); sg.shadowBlur = 0; }
          const x = S.U / g.Umax * 310 + 5, y = 212 - Math.min(1, S.I / 6e-9) * 204; sg.fillStyle = '#c8ffe0'; sg.beginPath(); sg.arc(x, y, 3.5, 0, 7); sg.fill();
          scTex.needsUpdate = true;
        }
        modelG.visible = model; if (!model) return;
        ePool.items.forEach((s, i) => { const p = parts[i]; s.visible = !!p; if (p) { s.position.set(X3(p.x), p.y * 0.016, (p.y * 7.3 % 1 - 0.5) * 0.03); s.material.color.set(eCol(p)); s.scale.setScalar(0.005 * (0.7 + 0.8 * eFrac(p))); } });
        fPool.items.forEach((s, i) => { const f = flashes[i]; s.visible = !!f; if (f) { s.position.set(X3(f.x), f.y * 0.016, (f.y * 7.3 % 1 - 0.5) * 0.03); s.material.color.set(g.flash); s.material.opacity = f.ttl / 0.35; } });
      });
      return { destroy() { off(); lab.dispose(); } };
    }

    const host = viewHost(stage, { id: 'franck-hertz', views: { '3d': view3d, '2d': view2d }, initial: '3d', modelInfo: 'Elektronen, Stöße und Energie' });

    // ---- Hauptschleife ----
    let raf = 0, last = performance.now(), acc = 0;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const target = S.heat ? S.Tset : 20;
      S.T += (target - S.T) * Math.min(1, dt / 2.5) + (S.heat ? gauss(0.02) : 0);
      dT.set(S.gas.oven ? `${Math.round(S.T)} °C` : '– (Neon: Raumtemperatur)');
      const dis = S.gas.oven && S.T < 140 && S.U > 22;
      if (dis && !S.discharge) toast('Gasentladung! Der Ofen ist zu kalt – Spannung sofort verringern.', 4000);
      S.discharge = dis;
      if (S.ramp) {
        S.U = Math.min(S.gas.Umax, S.U + dt * S.gas.ramp); sU.set(S.U);
        const I = measureI(); S.ramp.pts.push([+S.U.toFixed(2), +(I * 1e9).toFixed(4)]); pen.push([S.U, I]);
        if (S.U >= S.gas.Umax) stopRamp(true);
      }
      acc += dt;
      if (acc > 0.08) { acc = 0; S.I = measureI(); dI.set(`${fmt(S.I * 1e9, 2)} nA`); if (S.ramp && S.ramp.pts.length % 25 === 0) redraw(); }
      if (host.M.model) stepParticles(dt); else { parts.length = 0; flashes.length = 0; }
    }
    raf = requestAnimationFrame(loop);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); chK.destroy(); chM.destroy(); } };
  }
};
