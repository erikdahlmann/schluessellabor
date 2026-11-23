// ============================================================================
//  Schlüsselexperiment: Auf- und Entladevorgang bei Kondensatoren
//  2D-Aufbau (SVG): Netzgerät – Rastersteckplatte mit STE-Bausteinen –
//  Sensor-Interface (Spannung parallel zu C, Strom in Reihe).
// ============================================================================
import { viewHost } from '../js/lib/views.js';
const R_VALUES = [1e3, 2.2e3, 4.7e3, 10e3, 22e3, 47e3, 100e3];
const C_VALUES = [100e-6, 220e-6, 470e-6, 1000e-6, 2200e-6, 4700e-6];
const R_LEAK = 2.0e6;      // Leckwiderstand Elko (vereinfacht)
const R_I_V = 10e6;        // Innenwiderstand Spannungsmessung
const R_SHUNT = 1.0;       // Innenwiderstand Strommessung
const kOhm = r => r >= 1e3 ? `${(r / 1e3).toLocaleString('de-DE')} kΩ` : `${r} Ω`;
const uF = c => `${Math.round(c * 1e6).toLocaleString('de-DE')} µF`;

// Bauteiltoleranzen: pro Seitenaufruf fest, damit Messungen reproduzierbar bleiben
const tolC = new Map(C_VALUES.map(c => [c, 1 + (Math.random() * 0.3 - 0.1)]));   // −10 % … +20 %
const tolR = new Map(R_VALUES.map(r => [r, 1 + (Math.random() * 0.02 - 0.01)])); // ±1 %

const svgMarkup = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Versuchsaufbau RC-Glied: Netzgerät, Steckplatte mit Umschalter, Widerstand und Kondensator, Sensor-Interface">
<defs>
  <pattern id="kHoles" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#bfc2bd"/><circle cx="10" cy="10" r="2.2" fill="#8f938e"/><circle cx="10" cy="10" r="1.2" fill="#6d716c"/></pattern>
  <linearGradient id="kBench" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22262a"/><stop offset="1" stop-color="#15181b"/></linearGradient>
  <linearGradient id="kPsu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4046"/><stop offset="1" stop-color="#23282c"/></linearGradient>
  <radialGradient id="kKnob" cx=".35" cy=".3"><stop offset="0" stop-color="#555"/><stop offset="1" stop-color="#111"/></radialGradient>
  <filter id="kSh" x="-10%" y="-10%" width="130%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000" flood-opacity=".55"/></filter>
  <filter id="kGlow"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <g id="kSock"><circle r="8.5" fill="currentColor" stroke="#000" stroke-opacity=".5"/><circle r="3.6" fill="#c8a24a"/><circle r="2" fill="#5a4a20"/></g>
</defs>
<rect width="1000" height="620" fill="url(#kBench)"/>
<!-- Netzgerät -->
<g filter="url(#kSh)">
  <rect x="34" y="70" width="250" height="230" rx="10" fill="url(#kPsu)" stroke="#4a5157"/>
  <rect x="46" y="82" width="226" height="206" rx="6" fill="#1a1d20"/>
</g>
<text x="58" y="108" fill="#c9c3ba" font-size="14" font-family="IBM Plex Sans, system-ui, sans-serif">Netzgerät  0 … 12 V =</text>
<rect x="58" y="120" width="140" height="56" rx="4" fill="#170807" stroke="#3a1a17"/>
<text id="kPsuDisp" x="186" y="161" text-anchor="end" fill="#ff6a4d" font-size="34" font-family="IBM Plex Mono, ui-monospace, monospace" filter="url(#kGlow)">10.0</text>
<text x="192" y="169" fill="#ff6a4d" font-size="12" font-family="IBM Plex Sans, system-ui, sans-serif">V</text>
<g id="kKnobG" transform="translate(238 148)"><circle r="22" fill="url(#kKnob)" stroke="#000"/><rect id="kKnobMark" x="-1.5" y="-19" width="3" height="10" fill="#eee" rx="1"/></g>
<text x="238" y="186" fill="#8e979d" font-size="11" text-anchor="middle" font-family="IBM Plex Sans, system-ui, sans-serif">U</text>
<circle cx="66" cy="210" r="5" fill="#7fd6a0" filter="url(#kGlow)"/><text x="78" y="214" fill="#8e979d" font-size="11" font-family="IBM Plex Sans, system-ui, sans-serif">CV</text>
<use href="#kSock" x="200" y="252" color="#c4231b"/><use href="#kSock" x="240" y="252" color="#1f4fb8"/>
<text x="200" y="279" fill="#c9c3ba" font-size="13" text-anchor="middle">+</text><text x="240" y="279" fill="#c9c3ba" font-size="13" text-anchor="middle">−</text>

<!-- Rastersteckplatte -->
<g filter="url(#kSh)"><rect x="330" y="110" width="400" height="380" rx="8" fill="url(#kHoles)" stroke="#9a9d98"/></g>
<text x="342" y="482" fill="#55595a" font-size="11" font-family="IBM Plex Sans, system-ui, sans-serif">Rastersteckplatte · STE-Bausteine</text>
<!-- Masseschiene (Verbindungsbausteine) -->
<g fill="#e7e7e2" stroke="#9a9c97">
  <rect x="340" y="440" width="380" height="36" rx="3"/>
  <rect x="340" y="150" width="38" height="326" rx="3"/>
  <rect x="490" y="160" width="50" height="40" rx="3"/>
  <rect x="650" y="160" width="40" height="80" rx="3"/>
  <rect x="650" y="270" width="40" height="60" rx="3"/>
</g>
<path d="M352 458 H690 M359 458 V200 M490 180 H540 M650 180 H670 V222 M670 290 V330" stroke="#222" stroke-width="3" fill="none"/>
<path d="M359 150 V172" stroke="#222" stroke-width="3"/>
<!-- Umschalter -->
<g id="kSwitch" style="cursor:pointer">
  <rect x="380" y="146" width="110" height="68" rx="4" fill="#e7e7e2" stroke="#9a9c97"/>
  <text x="435" y="208" text-anchor="middle" fill="#555" font-size="10" font-family="IBM Plex Sans, system-ui, sans-serif">Umschalter</text>
  <circle cx="400" cy="164" r="4" fill="#222"/><circle cx="400" cy="196" r="4" fill="#222"/><circle cx="472" cy="180" r="4.5" fill="#222"/>
  <path d="M378 164 H400 M378 196 H400" stroke="#222" stroke-width="3"/><path d="M472 180 H490" stroke="#222" stroke-width="3"/>
  <line id="kLever" x1="472" y1="180" x2="402" y2="196" stroke="#111" stroke-width="4" stroke-linecap="round"/>
  <text x="408" y="160" fill="#a33" font-size="10" font-family="IBM Plex Sans, system-ui, sans-serif">Laden</text>
  <text x="408" y="210" fill="#235" font-size="10" font-family="IBM Plex Sans, system-ui, sans-serif" opacity="0">.</text>
</g>
<path d="M359 196 H380" stroke="#222" stroke-width="3"/>
<text x="388" y="232" fill="#2a2e31" font-size="11" font-family="IBM Plex Sans, system-ui, sans-serif">unten: Entladen</text>
<!-- Widerstand -->
<rect x="540" y="150" width="110" height="60" rx="4" fill="#e7e7e2" stroke="#9a9c97"/>
<path d="M540 180 H566 M624 180 H650" stroke="#222" stroke-width="3"/><rect x="566" y="171" width="58" height="18" fill="none" stroke="#222" stroke-width="3"/>
<text id="kRlabel" x="595" y="204" text-anchor="middle" fill="#333" font-size="12" font-family="IBM Plex Mono, ui-monospace, monospace">10 kΩ</text>
<!-- Messbuchsen Strom -->
<use href="#kSock" x="670" y="230" color="#c4231b"/><use href="#kSock" x="670" y="282" color="#151515"/>
<text x="694" y="261" fill="#2a2e31" font-size="11" font-family="IBM Plex Sans, system-ui, sans-serif">I</text>
<!-- Kondensator (Elko) -->
<rect x="630" y="330" width="80" height="110" rx="4" fill="#e7e7e2" stroke="#9a9c97"/>
<path d="M670 330 V372 M670 398 V440" stroke="#222" stroke-width="3"/>
<rect id="kPlateTop" x="648" y="370" width="44" height="5" fill="#222"/>
<path id="kPlateBot" d="M648 398 Q670 391 692 398" stroke="#222" stroke-width="5" fill="none"/>
<g id="kChargeTop" font-size="11" font-weight="700" fill="#c4231b" text-anchor="middle" opacity="0"><text x="654" y="366">+</text><text x="666" y="366">+</text><text x="678" y="366">+</text><text x="690" y="366">+</text></g>
<g id="kChargeBot" font-size="12" font-weight="700" fill="#1f4fb8" text-anchor="middle" opacity="0"><text x="654" y="412">−</text><text x="666" y="412">−</text><text x="678" y="412">−</text><text x="690" y="412">−</text></g>
<text x="642" y="358" fill="#333" font-size="10">+</text>
<text id="kClabel" x="670" y="432" text-anchor="middle" fill="#333" font-size="11" font-family="IBM Plex Mono, ui-monospace, monospace">1000 µF</text>
<use href="#kSock" x="712" y="350" color="#d8b21c"/><use href="#kSock" x="712" y="420" color="#151515"/>
<text x="712" y="388" fill="#2a2e31" font-size="11" text-anchor="middle" font-family="IBM Plex Sans, system-ui, sans-serif">U</text>

<!-- Sensor-Interface -->
<g filter="url(#kSh)"><rect x="770" y="70" width="200" height="270" rx="12" fill="#d9dbd7" stroke="#a9aca7"/></g>
<rect x="782" y="82" width="176" height="24" rx="4" fill="#1f4fb8"/>
<text x="870" y="99" text-anchor="middle" fill="#fff" font-size="13" font-family="IBM Plex Sans, system-ui, sans-serif" font-weight="600">Sensor-Interface</text>
<rect x="782" y="116" width="176" height="52" rx="5" fill="#0b1410" stroke="#1d2a23"/>
<text x="790" y="132" fill="#7ea592" font-size="10" font-family="IBM Plex Sans, system-ui, sans-serif">Kanal A · Spannung</text>
<text id="kDispU" x="950" y="160" text-anchor="end" fill="#b7ffd6" font-size="22" font-family="IBM Plex Mono, ui-monospace, monospace" filter="url(#kGlow)">0,000 V</text>
<rect x="782" y="176" width="176" height="52" rx="5" fill="#0b1410" stroke="#1d2a23"/>
<text x="790" y="192" fill="#7ea592" font-size="10" font-family="IBM Plex Sans, system-ui, sans-serif">Kanal B · Stromstärke</text>
<text id="kDispI" x="950" y="220" text-anchor="end" fill="#b7ffd6" font-size="22" font-family="IBM Plex Mono, ui-monospace, monospace" filter="url(#kGlow)">0,000 mA</text>
<circle id="kRec" cx="794" cy="248" r="6" fill="#3a3a3a"/><text id="kRecT" x="806" y="252" fill="#444" font-size="11" font-family="IBM Plex Sans, system-ui, sans-serif">bereit</text>
<text x="815" y="278" fill="#333" font-size="11" text-anchor="middle">A: U</text><text x="910" y="278" fill="#333" font-size="11" text-anchor="middle">B: I</text>
<use href="#kSock" x="800" y="304" color="#d8b21c"/><use href="#kSock" x="830" y="304" color="#151515"/>
<use href="#kSock" x="895" y="304" color="#c4231b"/><use href="#kSock" x="925" y="304" color="#151515"/>

<!-- Kabel -->
<g fill="none" stroke-linecap="round" stroke-width="6.5" opacity=".96">
  <path d="M200 252 C 210 340, 300 130, 359 150" stroke="#c4231b"/>
  <path d="M240 252 C 260 420, 300 470, 352 458" stroke="#1f4fb8"/>
  <path d="M670 230 C 760 220, 860 360, 895 304" stroke="#c4231b"/>
  <path d="M670 282 C 760 300, 900 380, 925 304" stroke="#151515"/>
  <path d="M712 350 C 760 360, 780 340, 800 304" stroke="#d8b21c"/>
  <path d="M712 420 C 790 430, 820 380, 830 304" stroke="#151515"/>
</g>

<!-- Stromfluss (technische Stromrichtung beim Laden = positiv) -->
<g fill="none" stroke="#86dcff" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="1 15" filter="url(#kGlow)">
  <path class="fl fc" d="M200 252 C 210 340, 300 130, 359 150 V172 L380 164 H400"/>
  <path class="fl fb" d="M472 180 H490 H540 H650 H670 V222"/>
  <path class="fl fb" d="M670 230 C 760 220, 860 360, 895 304"/>
  <path class="fl fb" d="M925 304 C 900 380, 760 300, 670 282"/>
  <path class="fl fb" d="M670 290 V372 M670 398 V458"/>
  <path class="fl fc" d="M670 458 H352 C 300 470, 260 420, 240 252"/>
  <path class="fl fd" d="M670 458 H359 V196 H400"/>
</g>

<g id="kElec" fill="#8fe3ff"></g>
<!-- Modell: vergrößerter Plattenkondensator -->
<g id="kModel" opacity="0">
  <rect x="340" y="498" width="390" height="114" rx="10" fill="rgba(10,12,14,.88)" stroke="#5a4b8a"/>
  <text x="352" y="516" fill="#c7b6ff" font-size="12">Modell: Kondensator</text>
  <text id="kMtxt" x="718" y="516" fill="#ece6dc" font-size="12" text-anchor="end" font-family="IBM Plex Mono, monospace">Q = 0</text>
  <g id="kMfield" opacity="0" stroke="#ffd36a" stroke-width="1.3">${[530, 544, 558, 572, 586].map(y => `<line x1="486" y1="${y}" x2="564" y2="${y}"/><path d="M524 ${y - 4} L532 ${y} L524 ${y + 4}" fill="none"/>`).join('')}</g>
  <rect x="476" y="522" width="7" height="72" fill="#c9ced2"/><rect x="567" y="522" width="7" height="72" fill="#c9ced2"/>
  <line x1="420" y1="558" x2="476" y2="558" stroke="#888" stroke-width="2"/><line x1="574" y1="558" x2="630" y2="558" stroke="#888" stroke-width="2"/>
  <g id="kMplus" fill="#ff6a4d" font-size="13" font-weight="700" text-anchor="middle"></g>
  <g id="kMminus" fill="#6fb4ff" font-size="14" font-weight="700" text-anchor="middle"></g>
  <text x="352" y="604" fill="#8fe3ff" font-size="10.5">● Elektronen</text><text x="430" y="604" fill="#86dcff" font-size="10.5" opacity=".8">– – technische Stromrichtung</text><text x="590" y="604" fill="#ffd36a" font-size="10.5">→ elektrisches Feld</text>
</g>
<!-- Schaltplan -->
<g transform="translate(34 360)">
  <rect width="260" height="220" rx="10" fill="#101316" stroke="#262d33"/>
  <text x="14" y="24" fill="#8e979d" font-size="12" font-family="IBM Plex Sans, system-ui, sans-serif">Schaltplan</text>
  <g stroke="#c7c1b7" stroke-width="2" fill="none">
    <path d="M40 60 V170 M30 104 H50 M34 116 H46"/>
    <path d="M40 60 H90 M40 170 H200 M90 92 V170"/>
    <path d="M118 76 H140"/><rect x="140" y="68" width="40" height="16"/><path d="M180 76 H200 V100"/>
    <circle cx="200" cy="112" r="11"/><path d="M200 123 V134 M186 134 H214 M190 142 Q200 138 210 142 M200 142 V170"/>
    <path d="M200 128 H232 V170"/><circle cx="232" cy="150" r="11" fill="#101316"/>
  </g>
  <line id="kSchLever" x1="118" y1="76" x2="90" y2="92" stroke="#ff4b3e" stroke-width="2.5"/>
  <circle cx="90" cy="60" r="3" fill="#c7c1b7"/><circle cx="90" cy="92" r="3" fill="#c7c1b7"/><circle cx="118" cy="76" r="3" fill="#c7c1b7"/>
  <path d="M90 60 H90" stroke="#c7c1b7"/>
  <g fill="#c7c1b7" font-size="12" font-family="IBM Plex Sans, system-ui, sans-serif">
    <text x="12" y="112">U₀</text><text x="160" y="62" text-anchor="middle">R</text><text x="194" y="116">A</text><text x="227" y="154">V</text><text x="172" y="143" font-size="11">C</text>
    <text x="64" y="54" font-size="10">Laden</text><text x="50" y="108" font-size="10" transform="translate(46 0)">Entl.</text>
  </g>
</g>
</svg>`;

export default {
  intro: 'Ein Elektrolytkondensator wird über einen Widerstand geladen und entladen. Ein Sensor-Interface erfasst Kondensatorspannung und Stromstärke – daraus bestimmt ihr die Zeitkonstante <i>τ = R·C</i>, die gespeicherte Ladung und die tatsächliche Kapazität des Bauteils.',
  docs: {
    durchfuehrung: `
<h3>Aufbau</h3>
<p>Netzgerät (Gleichspannung), Umschalter, Widerstand <i>R</i> und Elektrolytkondensator <i>C</i> werden auf der Rastersteckplatte in Reihe geschaltet. Kanal A des Sensor-Interfaces misst die Spannung <i>U<sub>C</sub></i> <b>parallel</b> zum Kondensator, Kanal B die Stromstärke <i>I</i> <b>in Reihe</b> (die Messbuchsen „I“ unterbrechen den Leiterzug). Polung des Elkos beachten: Pluspol an die positive Seite.</p>
<h3>Durchführung</h3>
<ol>
<li>Spannung <i>U<sub>0</sub></i> am Netzgerät einstellen (Elko-Nennspannung nicht überschreiten), <i>R</i> und <i>C</i> wählen.</li>
<li>Abtastintervall wählen. Faustregel: mindestens 50 Messpunkte pro Zeitkonstante.</li>
<li>Mit „Automatisch starten“ beginnt die Aufzeichnung beim Umlegen des Schalters. Schalter auf <b>Laden</b> legen.</li>
<li>Nach etwa 5 <i>τ</i> ist der Kondensator praktisch voll geladen: Messung stoppen bzw. automatisch enden lassen.</li>
<li>Schalter auf <b>Entladen</b> legen – die zweite Messreihe startet. Beide Vorgänge auswerten.</li>
<li>Variation: <i>R</i> bzw. <i>C</i> verändern, je eine Messreihe aufnehmen und die Zeitkonstanten vergleichen.</li>
</ol>
<div class="callout">Bei großen Zeitkonstanten (z. B. 4700 µF · 100 kΩ ≈ 8 min) hilft der Zeitraffer. Die Messwerte werden weiterhin mit der eingestellten Abtastrate in Versuchszeit erfasst.</div>`,
    theorie: `
<h3>Entladen</h3>
<p>Nach der Maschenregel gilt <i>U<sub>R</sub> + U<sub>C</sub> = 0</i>, also <span class="tex">R\\, I + \\frac{Q}{C} = 0</span> bzw. mit <i>I = Q̇</i>: <span class="tex">R\\, \\dot{Q} + \\frac{Q}{C} = 0</span>. Lösung:</p>
<span class="formula tex">Q(t) = Q_0\\, e^{-\\frac{t}{RC}} \\qquad U_C(t) = U_0\\, e^{-\\frac{t}{\\tau}} \\qquad I(t) = -\\frac{U_0}{R}\\, e^{-\\frac{t}{\\tau}}</span>
<h3>Laden</h3>
<span class="formula tex">U_C(t) = U_0 \\left(1 - e^{-\\frac{t}{\\tau}}\\right) \\qquad I(t) = \\frac{U_0}{R}\\, e^{-\\frac{t}{\\tau}} \\qquad \\tau = R\\, C</span>
<p>Nach <i>t = τ</i> ist die Stromstärke auf <b>37 %</b> gefallen (<i>e<sup>−1</sup></i>), beim Laden hat <i>U<sub>C</sub></i> <b>63 %</b> von <i>U₀</i> erreicht. Halbwertszeit: <i>t<sub>H</sub> = τ·ln 2</i>.</p>
<h3>Ladung aus dem I-t-Diagramm</h3>
<p>Die Fläche unter dem <i>I</i>-<i>t</i>-Graphen ist die geflossene Ladung: <i>Q = ∫ I dt</i>. Mit <span class="tex">C = \\frac{Q}{U_0}</span> erhält man die Kapazität ganz ohne Kenntnis von <i>R</i>.</p>
<h3>Linearisierung</h3>
<p>Trägt man <i>ln(|I|/I₀)</i> gegen <i>t</i> auf, ergibt sich eine Gerade mit der Steigung <span class="tex">-\\frac{1}{\\tau}</span>. So lässt sich der exponentielle Verlauf nachweisen.</p>
<h3>Energie</h3>
<span class="formula tex">E = \\tfrac{1}{2}\\, C\\, U_0^2</span>
<p>Beim Laden über einen Widerstand wird – unabhängig von <i>R</i> – genau dieselbe Energie im Widerstand in Wärme umgewandelt, wie im Kondensator gespeichert wird.</p>
<h3>Modellgrenzen dieser Simulation</h3>
<ul><li>Elko-Toleranz: Die tatsächliche Kapazität weicht wie bei realen Bauteilen um −10 % … +20 % vom Aufdruck ab (pro Seitenaufruf fest).</li>
<li>Leckstrom des Elkos über ca. 2 MΩ, Innenwiderstand der Spannungsmessung 10 MΩ, Strommessung 1 Ω. Rauschen und 12-bit-Auflösung des Interfaces sind nachgebildet.</li></ul><h3>Was die Modellansicht zeigt</h3><ul><li><b>Elektronen</b> (Punkte) bewegen sich in den Leitungen <b>entgegen</b> der technischen Stromrichtung (gestrichelt).</li><li>Kein Elektron fließt durch den Kondensator. Beim Laden sammeln sich Elektronen auf der einen Platte, auf der anderen fehlen sie gleich viele: beide Platten tragen den gleichen Betrag Q.</li><li>Mit der Ladung wächst das elektrische Feld zwischen den Platten und damit <span class="tex">U_C = \\frac{Q}{C}</span>. Je größer U<sub>C</sub>, desto langsamer wandern die Elektronen – der Strom klingt exponentiell ab.</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Netzgerät</td><td>0 … 12 V Gleichspannung</td></tr>
<tr><td>Widerstände (STE, Metallschicht)</td><td>1 kΩ … 100 kΩ, ±1 %</td></tr>
<tr><td>Elektrolytkondensatoren (STE)</td><td>100 µF … 4700 µF, 16 V, −10/+20 %</td></tr>
<tr><td>Sensor-Interface Kanal A</td><td>±10 V, 12 bit, Rᵢ = 10 MΩ</td></tr>
<tr><td>Sensor-Interface Kanal B</td><td>±30 mA, Rᵢ ≈ 1 Ω</td></tr>
<tr><td>Abtastintervall</td><td>10 ms … 1 s</td></tr>
</tbody></table>
<p class="muted" style="margin-top:12px">Aufbau angelehnt an übliche Schulausstattung (Rastersteckplatte mit Steckbausteinen, Messwerterfassungssystem). Das Handbuch zu den Schlüsselexperimenten von QUA-LiS NRW ordnet den Versuch dem Inhaltsfeld „Elektrodynamik und Energieübertragung“ zu.</p>`,
    abi: `
<details class="q"><summary>Begründe, warum die Stromstärke beim Laden zu Beginn maximal ist. <span class="op">AFB I–II</span></summary><p>Zu Beginn ist der Kondensator ungeladen, <i>U<sub>C</sub> = 0</i>. Die gesamte Spannung <i>U₀</i> liegt am Widerstand: <i>I₀ = U₀/R</i>. Mit wachsender Ladung steigt <i>U<sub>C</sub></i>, die Spannung am Widerstand und damit <i>I</i> sinken.</p></details>
<details class="q"><summary>Ein 1000-µF-Kondensator wird über 10 kΩ an 10 V geladen. Berechne τ, I₀ und die Spannung nach 20 s. <span class="op">AFB II</span></summary><p><i>τ = R·C = 10 s</i>, <i>I₀ = U₀/R = 1,0 mA</i>, <i>U<sub>C</sub>(20 s) = 10 V·(1 − e<sup>−2</sup>) ≈ 8,6 V</i>.</p></details>
<details class="q"><summary>Erläutere zwei Verfahren, die Kapazität aus den Messdaten zu bestimmen. <span class="op">AFB II–III</span></summary><p>1. Zeitkonstante aus der Halbwertszeit, dem 37-%-Wert oder der Steigung von <i>ln|I|</i> über <i>t</i> bestimmen, dann <i>C = τ/R</i>. 2. Fläche unter dem <i>I</i>-<i>t</i>-Graphen (Ladung <i>Q</i>) bestimmen, dann <i>C = Q/U₀</i>. Das zweite Verfahren ist unabhängig vom Wert von <i>R</i>.</p></details>
<details class="q"><summary>Warum weicht die gemessene Kapazität vom Aufdruck ab? <span class="op">AFB III</span></summary><p>Elektrolytkondensatoren haben große Fertigungstoleranzen (typisch −10 … +20 %), außerdem hängt <i>C</i> von Temperatur und Alter ab. Weitere Fehlerquellen: Toleranz von <i>R</i>, Leckstrom, Innenwiderstände der Messgeräte, Ablesen des Startzeitpunkts.</p></details>
<details class="q"><summary>Zeige, dass beim Laden im Widerstand die Energie ½·C·U₀² umgesetzt wird. <span class="op">AFB III</span></summary><p><i>W<sub>R</sub> = ∫ R·I² dt = R·(U₀/R)²·∫ e<sup>−2t/τ</sup> dt = (U₀²/R)·τ/2 = ½·C·U₀²</i>.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, selectBox, segmented, check, button, fmt, gauss, dataTable, toast } = ui;
    // Die aktuelle 2D-Ansicht stellt das SVG; ohne sie gehen Zugriffe ins Leere
    let curSvg = null;
    const dummy = { setAttribute() {}, style: {}, textContent: '', parentNode: { setAttribute() {} }, addEventListener() {} };
    const q = id => curSvg?.querySelector('#' + id) || dummy;
    // ---- Zustand ----
    const S = { U0: 10, Rn: 10e3, Cn: 1000e-6, sw: 'entladen', Q: 0, t: 0, speed: 1, dt: 0.05, auto: true, rec: false, run: null, phase: 0, phaseE: 0, mU: 0, mI: 0, It: 0, Ut: 0 };
    const real = () => ({ R: S.Rn * tolR.get(S.Rn), C: S.Cn * tolC.get(S.Cn) });
    const runs = [];

    // ---- Bedienfeld ----
    const gP = group('Netzgerät', { led: true }); gP.led(true); gP.querySelector('.led').classList.add('g');
    const sU = slider({ label: 'Spannung U₀', min: 0, max: 12, step: 0.1, value: S.U0, unit: 'V', digits: 1, onInput: v => { S.U0 = v; } });
    gP.append(sU);
    const gB = group('Bauteile');
    const sR = selectBox({ label: 'Widerstand R', value: S.Rn, options: R_VALUES.map(r => ({ value: r, label: kOhm(r) })), onChange: v => { S.Rn = +v; q('kRlabel').textContent = kOhm(S.Rn); tauOut(); } });
    const sC = selectBox({ label: 'Kondensator C (Elko, 16 V)', value: S.Cn, options: C_VALUES.map(c => ({ value: c, label: uF(c) })), onChange: v => { S.Cn = +v; q('kClabel').textContent = uF(S.Cn); tauOut(); } });
    const tauInfo = el('div', { class: 'muted', style: 'font-size:13px' });
    const tauOut = () => { tauInfo.innerHTML = `Nennwert τ = R·C = <b class="mono" style="color:var(--ink)">${fmt(S.Rn * S.Cn, S.Rn * S.Cn < 1 ? 2 : 1)} s</b>`; };
    tauOut(); gB.append(sR, sC, tauInfo);

    const gS = group('Umschalter');
    const seg = segmented({ value: 'entladen', options: [{ value: 'laden', label: 'Laden' }, { value: 'entladen', label: 'Entladen' }], onChange: v => setSwitch(v) });
    gS.append(seg, el('div', { style: 'height:8px' }), button('Kondensator kurzschließen', () => { S.Q = 0; toast('Kondensator vollständig entladen.'); }));

    const gM = group('Messwerterfassung', { led: true });
    const segDt = selectBox({ label: 'Abtastintervall Δt', value: 0.05, options: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1].map(v => ({ value: v, label: v < 1 ? `${v * 1000} ms` : '1 s' })), onChange: v => { S.dt = +v; } });
    const segSp = selectBox({ label: 'Zeitraffer', value: 1, options: [1, 2, 5, 10, 20, 50].map(v => ({ value: v, label: v === 1 ? 'Echtzeit' : `${v}-fach` })), onChange: v => { S.speed = +v; } });
    const cAuto = check({ label: 'Automatisch starten beim Umschalten', checked: true, onChange: v => { S.auto = v; } });
    const cStop = check({ label: 'Automatisch stoppen nach 6 τ', checked: true });
    const bRec = button('Messung starten', () => S.rec ? stopRec() : startRec(), 'btn small primary');
    gM.append(segDt, segSp, cAuto, cStop, el('div', { class: 'bar', style: 'margin-top:6px' }, bRec));

    const dU = ui.display('U_C'), dI = ui.display('I'), dT = ui.display('t (Messung)');
    const gD = group('Live-Werte'); gD.append(dU, dI, dT);
    controls.append(gP, gB, gS, gM, gD);

    // ---- Messwerte-Panel ----
    const chartSel = segmented({ value: 'U', options: [{ value: 'U', label: 'U(t)' }, { value: 'I', label: 'I(t)' }, { value: 'ln', label: 'ln|I|' }, { value: 'Q', label: 'Q(t)' }], onChange: v => { view = v; redraw(); } });
    let view = 'U';
    const fig = el('div', { class: 'fig' });
    const resBox = el('div', { class: 'result' });
    const chart = new Chart(fig, { xlabel: 't in s', ylabel: 'U_C in V' });
    const runTable = dataTable([
      { key: 'typ', label: 'Vorgang', fmt: v => v },
      { key: 'U0', label: 'U₀ in V', digits: 1 }, { key: 'R', label: 'R in kΩ', fmt: v => fmt(v / 1e3, 1) },
      { key: 'Cn', label: 'C (Aufdruck) in µF', fmt: v => fmt(v * 1e6, 0) },
      { key: 'tau', label: 'τ (Fit) in s', digits: 3 }, { key: 'Ctau', label: 'C = τ/R in µF', fmt: v => fmt(v * 1e6, 0) },
      { key: 'Qint', label: 'Q = ∫I dt in mC', fmt: v => fmt(v * 1e3, 3) }, { key: 'CQ', label: 'C = Q/ΔU in µF', fmt: v => fmt(v * 1e6, 0) }
    ], { onDelete: i => { runs.splice(i, 1); runTable.render(runs); } });
    let shown = null; // angezeigte Messreihe
    const shownRun = () => shown;
    const revealBtn = button('Tatsächliche Bauteilwerte aufdecken', () => {
      const { R, C } = real();
      toast(`Tatsächlich verbaut: R = ${fmt(R / 1e3, 2)} kΩ, C = ${fmt(C * 1e6, 0)} µF (Aufdruck ${uF(S.Cn)})`, 6000);
    });
    messwerte.append(
      el('div', { class: 'data' },
        el('div', { class: 'chartbox' }, el('h4', {}, el('span', { class: 'cht' }, 'Aktuelle Messreihe'), chartSel), fig, resBox,
          csvTools(() => ({
            meta: shown ? [`Auf-/Entladevorgang Kondensator – ${shown.typ}`, `U0 = ${shown.U0} V; R (Aufdruck) = ${shown.R} Ohm; C (Aufdruck) = ${shown.Cn * 1e6} uF; dt = ${shown.dt} s`] : [],
            columns: [{ key: 't', label: 't in s' }, { key: 'U', label: 'U_C in V' }, { key: 'I', label: 'I in mA' }],
            rows: shown ? shown.data.map(d => ({ t: d[0], U: +d[1].toFixed(4), I: +(d[2] * 1e3).toFixed(4) })) : []
          }), 'kondensator_messreihe')),
        el('div', {},
          el('h3', { style: 'margin-bottom:10px' }, 'Übersicht aller Messreihen'), runTable,
          el('div', { style: 'height:12px' }),
          csvTools(() => ({ columns: [{ key: 'typ', label: 'Vorgang' }, { key: 'U0', label: 'U0 in V' }, { key: 'R', label: 'R in Ohm' }, { key: 'Cn', label: 'C Aufdruck in F' }, { key: 'tau', label: 'tau in s' }, { key: 'Ctau', label: 'C=tau/R in F' }, { key: 'Qint', label: 'Q in C' }, { key: 'CQ', label: 'C=Q/dU in F' }], rows: runs }), 'kondensator_uebersicht'),
          revealBtn)));

    function redraw() {
      const d = shown?.data || [];
      const I0 = d.length ? (Math.abs(d[0][2]) || 1e-9) : 1;
      let pts = [], ylabel = '', fits = [];
      if (view === 'U') { pts = d.map(p => [p[0], p[1]]); ylabel = 'U_C in V'; }
      if (view === 'I') { pts = d.map(p => [p[0], p[2] * 1e3]); ylabel = 'I in mA'; if (shown?.fitI) fits.push({ f: t => shown.sign * shown.fitI.f(t) * 1e3, color: '#ab93ff', name: 'Exponentialfit' }); }
      if (view === 'ln') { pts = d.filter(p => Math.abs(p[2]) > I0 * 0.01).map(p => [p[0], Math.log(Math.abs(p[2]) / I0)]); ylabel = 'ln(|I|/I₀)'; if (shown?.fitI) fits.push({ f: t => Math.log(shown.fitI.A / I0) - t / shown.fitI.tau, color: '#ab93ff', name: 'Ausgleichsgerade' }); }
      if (view === 'Q') { let Q = 0; pts = d.map((p, i) => { if (i) Q += 0.5 * (p[2] + d[i - 1][2]) * (p[0] - d[i - 1][0]); return [p[0], Q * 1e3]; }); ylabel = 'Q in mC'; }
      chart.o.ylabel = ylabel; chart.o.includeZero = view !== 'ln';
      chart.set([{ points: pts, color: view === 'U' ? '#86dcff' : '#f2ac74', name: shown ? shown.typ : '' }], fits);
    }
    function showResult(r) {
      if (!r?.fitI) { resBox.innerHTML = '<span>Noch keine ausgewertete Messreihe.</span>'; return; }
      resBox.innerHTML = `<div><span>Zeitkonstante (Fit)</span><br><b>τ = ${fmt(r.tau, 3)} s</b></div>
        <div><span>Kapazität aus τ/R</span><br><b>${fmt(r.Ctau * 1e6, 0)} µF</b></div>
        <div><span>Ladung ∫I dt</span><br><b>${fmt(r.Qint * 1e3, 3)} mC</b></div>
        <div><span>Kapazität aus Q/ΔU</span><br><b>${fmt(r.CQ * 1e6, 0)} µF</b></div>
        <div><span>Bestimmtheitsmaß</span><br><b>R² = ${fmt(r.fitI.r2, 4)}</b></div>`;
    }
    showResult(null); redraw();

    // ---- Schalter ----
    function setSwitch(v) {
      if (v === S.sw) return; S.sw = v; seg.set(v);
      const lad = v === 'laden';
      q('kLever').setAttribute('y2', lad ? 164 : 196);
      q('kSchLever').setAttribute('y2', lad ? 60 : 92);
      if (S.auto) { if (S.rec) stopRec(); startRec(); }
    }

    function measure() {
      const { R, C } = real();
      const usrc = S.sw === 'laden' ? S.U0 : 0;
      const Uc = S.Q / C;
      const I = (usrc - Uc) / (R + R_SHUNT);
      const Um = Uc * R_I_V / (R_I_V + 1) + gauss(0.003);
      const q12 = v => Math.round(v / (20 / 4096)) * (20 / 4096);
      return { U: q12(Um), I: I + gauss(4e-7), Ut: Uc, It: I };
    }
    function startRec() {
      S.rec = true; S.t = 0; S.run = { typ: S.sw === 'laden' ? 'Laden' : 'Entladen', U0: S.U0, R: S.Rn, Cn: S.Cn, dt: S.dt, data: [], sign: S.sw === 'laden' ? 1 : -1, U_start: S.Q / real().C };
      const m = measure(); S.run.data.push([0, m.U, m.I]);
      shown = S.run; bRec.textContent = 'Messung stoppen'; gM.led(true);
      q('kRec').setAttribute('fill', '#ff4b3e'); q('kRecT').textContent = 'Aufzeichnung läuft';
    }
    function stopRec() {
      if (!S.rec) return; S.rec = false; bRec.textContent = 'Messung starten'; gM.led(false);
      q('kRec').setAttribute('fill', '#3a3a3a'); q('kRecT').textContent = 'bereit';
      const r = S.run; if (!r || r.data.length < 8) { redraw(); return; }
      const ts = r.data.map(p => p[0]), Is = r.data.map(p => Math.abs(p[2]));
      const I0 = Is[0]; const sel = r.data.filter((p, i) => Is[i] > I0 * 0.03);
      r.fitI = fit.expDecayFit(sel.map(p => p[0]), sel.map(p => Math.abs(p[2])));
      let Q = 0; for (let i = 1; i < r.data.length; i++) Q += 0.5 * (Math.abs(r.data[i][2]) + Math.abs(r.data[i - 1][2])) * (ts[i] - ts[i - 1]);
      const dU = Math.abs(r.data[r.data.length - 1][1] - r.data[0][1]);
      if (r.fitI) { r.tau = r.fitI.tau; r.Ctau = r.tau / r.R; } else { r.tau = NaN; r.Ctau = NaN; }
      r.Qint = Q; r.CQ = dU > 0.05 ? Q / dU : NaN;
      runs.push(r); runTable.render(runs); showResult(r); redraw();
    }

    // ======================= Ansichten =======================
    // Elektronen-Bahnen im 2D-Aufbau (Richtung = technische Stromrichtung beim Laden; Elektronen laufen entgegen)
    const TRACKS = [
      { d: 'M200 252 C 210 340, 300 130, 359 150 V172 L380 164 H400', mode: 'c' },
      { d: 'M472 180 H490 H540 H650 H670 V222', mode: 'b' },
      { d: 'M670 230 C 760 220, 860 360, 895 304', mode: 'b' },
      { d: 'M925 304 C 900 380, 760 300, 670 282', mode: 'b' },
      { d: 'M670 290 V370', mode: 'b' },
      { d: 'M670 400 V458', mode: 'b' },
      { d: 'M670 458 H352 C 300 470, 260 420, 240 252', mode: 'c' },
      { d: 'M670 458 H359 V196 H400', mode: 'd' }
    ];
    async function view2d(box, MM) {
      box.insertAdjacentHTML('beforeend', svgMarkup());
      box.insertAdjacentHTML('beforeend', '<div class="hint">Schalter auf der Steckplatte anklicken: Laden ↔ Entladen</div>');
      curSvg = box.querySelector('svg');
      const svg = curSvg, NS = 'http://www.w3.org/2000/svg';
      q('kRlabel').textContent = kOhm(S.Rn); q('kClabel').textContent = uF(S.Cn);
      q('kLever').setAttribute('y2', S.sw === 'laden' ? 164 : 196); q('kSchLever').setAttribute('y2', S.sw === 'laden' ? 60 : 92);
      q('kSwitch').addEventListener('click', () => setSwitch(S.sw === 'laden' ? 'entladen' : 'laden'));
      // Elektronen
      const eg = q('kElec'), tracks = TRACKS.map(t => {
        const p = document.createElementNS(NS, 'path'); p.setAttribute('d', t.d); p.setAttribute('fill', 'none'); eg.append(p);
        const len = p.getTotalLength(), n = Math.max(2, Math.floor(len / 17));
        const dots = Array.from({ length: n }, () => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', 3); eg.append(c); return c; });
        return { ...t, p, len, dots };
      });
      // Platten im Modellkondensator
      const plus = q('kMplus'), minus = q('kMminus'), fl = q('kMfield');
      let raf = 0;
      function frame() {
        raf = requestAnimationFrame(frame);
        const lad = S.sw === 'laden', model = MM.model;
        q('kModel').setAttribute('opacity', model ? 1 : 0);
        q('kChargeTop').style.display = q('kChargeBot').style.display = model ? '' : 'none';
        eg.style.display = model ? '' : 'none';
        if (!model) return;
        const I0ref = Math.max(S.U0, 1) / S.Rn, rel = Math.min(1, Math.abs(S.It) / I0ref);
        for (const t of tracks) {
          const active = t.mode === 'b' || (lad ? t.mode === 'c' : t.mode === 'd');
          for (let i = 0; i < t.dots.length; i++) {
            const c = t.dots[i];
            if (!active || rel < 0.004) { c.style.display = 'none'; continue; }
            c.style.display = '';
            const s = (((i * t.len / t.dots.length) - S.phaseE) % t.len + t.len) % t.len;
            const pt = t.p.getPointAtLength(s); c.setAttribute('cx', pt.x.toFixed(1)); c.setAttribute('cy', pt.y.toFixed(1));
            c.setAttribute('opacity', (0.35 + 0.65 * Math.min(1, rel * 3)).toFixed(2));
          }
        }
        // Modellkondensator: Ladungen und Feld
        const n = Math.round(Math.min(1, Math.abs(S.Ut) / 12) * 12);
        if (plus.childElementCount !== n) {
          let hp = '', hm = '';
          for (let i = 0; i < n; i++) { const y = 528 + (i % 6) * 13, x = (i < 6 ? 0 : 1) * 12; hp += `<text x="${452 + x}" y="${y}">+</text>`; hm += `<text x="${598 - x}" y="${y}">−</text>`; }
          plus.innerHTML = hp; minus.innerHTML = hm;
        }
        fl.setAttribute('opacity', Math.min(1, Math.abs(S.Ut) / 8).toFixed(2));
        q('kMtxt').textContent = `Q = ${fmt(Math.abs(S.Q) * 1e3, 2)} mC   ·   U = ${fmt(Math.abs(S.Ut), 2)} V`;
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); curSvg = null; } };
    }

    async function view3d(box, MM) {
      const { createLab, mats, cable, powerSupply, socket, label, glowPool, makeDisplay } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [0.03, 0.3, 0.4], target: [0.02, 0.04, 0], table: [3, 1.6], bloom: [0.35, 0.35, 0.985], room: 0.5, minDist: 0.15, maxDist: 2 });
      const { THREE, scene } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad · Umschalter auf der Platte anklicken</div>');
      // Rastersteckplatte
      const holeTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); g.fillStyle = '#a9ada8'; g.fillRect(0, 0, 512, 512); for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) { g.fillStyle = '#7d817c'; g.beginPath(); g.arc(16 + x * 32, 16 + y * 32, 5, 0, 7); g.fill(); g.fillStyle = '#4e524d'; g.beginPath(); g.arc(16 + x * 32, 16 + y * 32, 2.6, 0, 7); g.fill(); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.25, 1.1); t.colorSpace = THREE.SRGBColorSpace; return t; })();
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.012, 0.26), [M.housingLight, M.housingLight, new THREE.MeshStandardMaterial({ map: holeTex, roughness: 0.7 }), M.housingLight, M.housingLight, M.housingLight]);
      board.position.set(0, 0.006, 0); board.castShadow = board.receiveShadow = true; scene.add(board);
      const blockMat = new THREE.MeshStandardMaterial({ color: 0xd6d6d0, roughness: 0.6 });
      const printTex = draw => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#d9d9d3'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#1b1b1b'; g.lineWidth = 12; g.lineCap = 'round'; draw(g); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
      const block = (w, d, x, z, draw) => { const top = new THREE.MeshStandardMaterial({ map: printTex(draw), roughness: 0.55 }); const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.016, d), [blockMat, blockMat, top, blockMat, blockMat, blockMat]); m.position.set(x, 0.02, z); m.castShadow = true; scene.add(m); return m; };
      const Y0 = 0.0285; // Oberseite der Bausteine
      // Leiterbausteine (Verbindungen), Positionen in m: x nach rechts, z nach vorn
      const wire = (x, z, rot) => block(0.04, 0.04, x, z, g => { g.beginPath(); if (rot) { g.moveTo(128, 0); g.lineTo(128, 256); } else { g.moveTo(0, 128); g.lineTo(256, 128); } g.stroke(); });
      block(0.04, 0.04, -0.1, -0.08, g => { g.beginPath(); g.moveTo(0, 128); g.lineTo(256, 128); g.moveTo(128, 128); g.lineTo(128, 256); g.stroke(); });
      const sw = block(0.04, 0.04, -0.06, -0.08, g => { g.fillStyle = '#1b1b1b'; for (const [x, y] of [[40, 70], [40, 186], [216, 128]]) { g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill(); } g.beginPath(); g.moveTo(0, 70); g.lineTo(40, 70); g.moveTo(0, 186); g.lineTo(40, 186); g.moveTo(216, 128); g.lineTo(256, 128); g.stroke(); });
      const lever = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.003, 0.004), M.black); lever.geometry.translate(-0.013, 0, 0); lever.position.set(-0.06 + 0.0165, Y0 + 0.003, -0.08); scene.add(lever);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.004, 12, 10), M.red); knob.position.set(-0.026, 0, 0); lever.add(knob);
      block(0.04, 0.04, -0.02, -0.08, g => { g.strokeRect(70, 100, 116, 56); g.beginPath(); g.moveTo(0, 128); g.lineTo(70, 128); g.moveTo(186, 128); g.lineTo(256, 128); g.stroke(); });
      wire(0.02, -0.08, false);
      block(0.04, 0.04, 0.06, -0.08, g => { g.beginPath(); g.moveTo(0, 128); g.lineTo(128, 128); g.lineTo(128, 256); g.stroke(); });
      block(0.04, 0.04, 0.06, -0.04, g => { g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 80); g.moveTo(128, 176); g.lineTo(128, 256); g.stroke(); g.fillStyle = '#c4231b'; g.beginPath(); g.arc(128, 80, 20, 0, 7); g.fill(); g.fillStyle = '#151515'; g.beginPath(); g.arc(128, 176, 20, 0, 7); g.fill(); });
      const cBlock = block(0.04, 0.04, 0.06, 0.0, g => { g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 108); g.moveTo(128, 148); g.lineTo(128, 256); g.moveTo(80, 108); g.lineTo(176, 108); g.stroke(); g.beginPath(); g.moveTo(80, 152); g.quadraticCurveTo(128, 136, 176, 152); g.stroke(); });
      wire(0.06, 0.04, true);
      for (const x of [-0.1, -0.06, -0.02, 0.02]) wire(x, 0.08, false);
      block(0.04, 0.04, 0.06, 0.08, g => { g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 128); g.lineTo(0, 128); g.stroke(); });
      for (const z of [-0.04, 0.0, 0.04]) wire(-0.1, z, true);
      // Elko auf dem Kondensatorbaustein
      const elko = new THREE.Group(); elko.position.set(0.06, Y0, 0.0); scene.add(elko);
      const sleeve = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#1f3f8f'; g.fillRect(0, 0, 512, 256); g.fillStyle = '#c9ced6'; g.fillRect(380, 0, 70, 256); g.fillStyle = '#1f3f8f'; g.font = 'bold 60px sans-serif'; for (let y = 40; y < 256; y += 70) g.fillText('−', 398, y + 20); g.fillStyle = '#e6e8ea'; g.font = '600 34px "IBM Plex Sans", sans-serif'; g.save(); g.translate(150, 128); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.fillText('16 V', 0, 0); g.restore(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
      const elkoLbl = makeDisplay(THREE, 256, 64, { color: '#e6e8ea', bg: '#1f3f8f' });
      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.0125, 0.034, 40), new THREE.MeshStandardMaterial({ map: sleeve, roughness: 0.35, metalness: 0.2 })); can.position.y = 0.017; can.castShadow = true; elko.add(can);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.0118, 0.0118, 0.0012, 40), M.steel); lid.position.y = 0.0346; elko.add(lid);
      const lblM = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.005), new THREE.MeshBasicMaterial({ map: elkoLbl.tex })); lblM.position.set(0, 0.024, 0.01255); elko.add(lblM);
      // Widerstand auf dem R-Baustein
      const res = new THREE.Group(); res.position.set(-0.02, Y0 + 0.004, -0.08); scene.add(res);
      const rb = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0028, 0.016, 20), new THREE.MeshStandardMaterial({ color: 0x5b8fc9, roughness: 0.45 })); rb.rotation.z = Math.PI / 2; res.add(rb);
      for (const [x, c] of [[-0.005, 0x8b4513], [-0.002, 0x111111], [0.001, 0xff7a00], [0.005, 0xc8a24a]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.00295, 0.00295, 0.0012, 20), new THREE.MeshStandardMaterial({ color: c })); b.rotation.z = Math.PI / 2; b.position.x = x; res.add(b); }
      // Buchsen auf der Platte
      const sockA = socket(THREE, 'red'), sockB = socket(THREE, 'blue'); sockA.rotation.x = -Math.PI / 2; sockB.rotation.x = -Math.PI / 2;
      sockA.position.set(-0.13, Y0 - 0.006, -0.08); sockB.position.set(-0.13, Y0 - 0.006, 0.08); scene.add(sockA, sockB);
      const sI1 = socket(THREE, 'red'), sI2 = socket(THREE, 'black'), sU1 = socket(THREE, 'yellow'), sU2 = socket(THREE, 'black');
      for (const [s, x, z] of [[sI1, 0.085, -0.048], [sI2, 0.085, -0.032], [sU1, 0.085, -0.008], [sU2, 0.085, 0.008]]) { s.rotation.x = -Math.PI / 2; s.position.set(x, Y0 + 0.001, z); scene.add(s); }
      // Geräte
      const ps = powerSupply(THREE, { w: 0.2, h: 0.12, d: 0.18, label: 'Netzgerät 0 … 12 V =', displays: 1, knobs: 1, sockets: ['red', 'blue'] });
      ps.position.set(-0.36, 0, -0.02); ps.rotation.y = 0.45; scene.add(ps);
      const ifc = powerSupply(THREE, { w: 0.22, h: 0.14, d: 0.16, label: 'Sensor-Interface', displays: 2, knobs: 0, sockets: ['red', 'black', 'yellow', 'black'], color: 'light', dispColor: ['#b7ffd6', '#0b1410'] });
      ifc.position.set(0.37, 0, -0.02); ifc.rotation.y = -0.45; scene.add(ifc);
      // kleiner Bildschirm mit der aktuellen Kurve
      const scr = document.createElement('canvas'); scr.width = 320; scr.height = 160; const sg = scr.getContext('2d'); const scrTex = new THREE.CanvasTexture(scr); scrTex.colorSpace = THREE.SRGBColorSpace;
      const scrM = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), new THREE.MeshBasicMaterial({ map: scrTex, toneMapped: false })); scrM.position.set(0.04, 0.11, 0.0826); ifc.add(scrM);
      scene.updateMatrixWorld(true);
      const wp = o => o.getWorldPosition(new THREE.Vector3());
      const cA = cable(THREE, ps.socketWorld(0), wp(sockA), 0xc4231b, 0.02), cB = cable(THREE, ps.socketWorld(1), wp(sockB), 0x1f4fb8, 0.02);
      const cI1 = cable(THREE, wp(sI1), ifc.socketWorld(0), 0xc4231b, 0.03), cI2 = cable(THREE, wp(sI2), ifc.socketWorld(1), 0x151515, 0.04);
      const cU1 = cable(THREE, wp(sU1), ifc.socketWorld(2), 0xd8b21c, 0.05), cU2 = cable(THREE, wp(sU2), ifc.socketWorld(3), 0x151515, 0.06);
      scene.add(cA, cB, cI1, cI2, cU1, cU2);
      // Umschalter anklicken
      const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), cvs = lab.renderer.domElement;
      const onClick = e => { const r = cvs.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, lab.camera); if (ray.intersectObjects([sw, lever, knob], false).length) setSwitch(S.sw === 'laden' ? 'entladen' : 'laden'); };
      cvs.addEventListener('click', onClick);
      // ---- Modell: Elektronen in Leitern und ein vergrößerter Plattenkondensator ----
      const modelG = new THREE.Group(); scene.add(modelG);
      const P = (x, z, y = Y0 + 0.004) => new THREE.Vector3(x, y, z);
      const line3 = pts => new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05);
      // Bahnen in technischer Stromrichtung beim Laden
      const paths = [
        { c: cA.curve, mode: 'c' }, { c: line3([P(-0.13, -0.08), P(-0.1, -0.08), P(-0.08, -0.08)]), mode: 'c' },
        { c: line3([P(-0.044, -0.08), P(0.06, -0.08), P(0.06, -0.048)]), mode: 'b' },
        { c: cI1.curve, mode: 'b' }, { c: new THREE.CatmullRomCurve3([...cI2.curve.points].reverse()), mode: 'b' },
        { c: line3([P(0.06, -0.032), P(0.06, -0.006)]), mode: 'b' },
        { c: line3([P(0.06, 0.006), P(0.06, 0.08), P(-0.1, 0.08)]), mode: 'b' },
        { c: line3([P(-0.1, 0.08), P(-0.13, 0.08)]), mode: 'c' }, { c: new THREE.CatmullRomCurve3([...cB.curve.points].reverse()), mode: 'c' },
        { c: line3([P(-0.1, 0.08), P(-0.1, -0.06), P(-0.08, -0.068)]), mode: 'd' }
      ].map(p => ({ ...p, len: p.c.getLength(), pool: null }));
      for (const p of paths) p.pool = glowPool(THREE, modelG, Math.max(3, Math.round(p.len / 0.016)), 0x8fe3ff, 0.0075);
      // vergrößerter Plattenkondensator über dem Elko
      const capG = new THREE.Group(); capG.position.set(0.06, 0.12, 0.0); modelG.add(capG);
      const plateM = new THREE.MeshStandardMaterial({ color: 0xb9bec2, metalness: 0.9, roughness: 0.3, transparent: true, opacity: 0.85 });
      const pA = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.06, 0.06), plateM), pB = pA.clone(); pA.position.x = -0.018; pB.position.x = 0.018; capG.add(pA, pB);
      const plusP = glowPool(THREE, capG, 24, 0xff6a4d, 0.008), minusP = glowPool(THREE, capG, 24, 0x6fb4ff, 0.008);
      const fieldMat = new THREE.LineBasicMaterial({ color: 0xffd36a, transparent: true, opacity: 0, toneMapped: false });
      for (let i = 0; i < 5; i++) for (let k = 0; k < 3; k++) { const y = -0.024 + i * 0.012, z = -0.018 + k * 0.018; capG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.016, y, z), new THREE.Vector3(0.016, y, z)]), fieldMat)); }
      const lCap = label(THREE, 'Modell: Plattenkondensator', { color: '#c7b6ff', size: 0.011 }); lCap.position.set(0, 0.045, 0); capG.add(lCap);
      let lQ = label(THREE, 'Q', { color: '#ece6dc', size: 0.011 }); lQ.position.set(0, -0.045, 0); capG.add(lQ);
      const lead = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.06, Y0 + 0.036, 0), new THREE.Vector3(0.06, 0.088, 0)]), new THREE.LineDashedMaterial({ color: 0xab93ff, dashSize: 0.004, gapSize: 0.003 })); lead.computeLineDistances(); modelG.add(lead);
      let lastQtxt = '', lastScr = 0;
      const off = lab.onFrame((dt, t) => {
        ps.displays[0].draw(S.U0.toFixed(1), 'V'); ps.setKnob(0, S.U0 / 12);
        ifc.displays[0].draw(fmt(S.mU, 3), 'V'); ifc.displays[1].draw(fmt(S.mI * 1e3, 3), 'mA');
        elkoLbl.draw(uF(S.Cn).replace(' ', ''), '');
        lever.rotation.y = S.sw === 'laden' ? -0.42 : 0.42;
        // Bildschirm mit Messkurve
        if (t - lastScr > 0.25) {
          lastScr = t; sg.fillStyle = '#0b1410'; sg.fillRect(0, 0, 320, 160); sg.strokeStyle = '#1d3a2b'; sg.lineWidth = 1;
          for (let i = 1; i < 8; i++) { sg.beginPath(); sg.moveTo(i * 40, 0); sg.lineTo(i * 40, 160); sg.stroke(); } for (let i = 1; i < 4; i++) { sg.beginPath(); sg.moveTo(0, i * 40); sg.lineTo(320, i * 40); sg.stroke(); }
          const d = shownRun()?.data || []; if (d.length > 1) { const tmax = Math.max(d[d.length - 1][0], 1e-3); sg.strokeStyle = '#7dffb8'; sg.lineWidth = 3; sg.beginPath(); d.forEach((p, i) => { const x = p[0] / tmax * 312 + 4, y = 154 - p[1] / 12 * 148; i ? sg.lineTo(x, y) : sg.moveTo(x, y); }); sg.stroke(); }
          scrTex.needsUpdate = true;
        }
        // Modell
        modelG.visible = MM.model;
        if (!MM.model) return;
        const lad = S.sw === 'laden', I0ref = Math.max(S.U0, 1) / S.Rn, rel = Math.min(1, Math.abs(S.It) / I0ref);
        const off = -S.phaseE * 0.0009; // gleiche Phase wie in 2D, in m
        for (const p of paths) {
          const active = p.mode === 'b' || (lad ? p.mode === 'c' : p.mode === 'd');
          const n = p.pool.items.length;
          p.pool.items.forEach((s, i) => {
            s.visible = active && rel > 0.004; if (!s.visible) return;
            const u = ((((i / n) * p.len + off) % p.len) + p.len) % p.len / p.len;
            s.position.copy(p.c.getPointAt(u)); s.material.opacity = 0.35 + 0.65 * Math.min(1, rel * 3);
          });
        }
        const nq = Math.round(Math.min(1, Math.abs(S.Ut) / 12) * 24);
        plusP.items.forEach((s, i) => { s.visible = i < nq; s.position.set(-0.022, -0.025 + (i % 6) * 0.01, -0.02 + Math.floor(i / 6) * 0.0133); });
        minusP.items.forEach((s, i) => { s.visible = i < nq; s.position.set(0.022, -0.025 + (i % 6) * 0.01, -0.02 + Math.floor(i / 6) * 0.0133); });
        fieldMat.opacity = Math.min(0.9, Math.abs(S.Ut) / 8);
        const qt = `Q = ${fmt(Math.abs(S.Q) * 1e3, 2)} mC`; if (qt !== lastQtxt) { lastQtxt = qt; capG.remove(lQ); lQ.material.map.dispose(); lQ.material.dispose(); lQ = label(THREE, qt, { color: '#ece6dc', size: 0.011 }); lQ.position.set(0, -0.045, 0); capG.add(lQ); }
      });
      return { destroy() { off(); cvs.removeEventListener('click', onClick); lab.dispose(); } };
    }

    const host = viewHost(stage, { id: 'kondensator', views: { '2d': view2d, '3d': view3d }, initial: '3d', modelInfo: 'Elektronen, Ladungen und Feld' });

    // ---- Simulationsschleife ----
    let raf = 0, last = performance.now(), redrawAcc = 0;
    function step(dtSim) {
      const { R, C } = real();
      const usrc = S.sw === 'laden' ? S.U0 : 0;
      const k = 1 / ((R + R_SHUNT) * C) + 1 / (R_LEAK * C) + 1 / (R_I_V * C);
      const Qinf = usrc / (R + R_SHUNT) / k;
      S.Q = Qinf + (S.Q - Qinf) * Math.exp(-k * dtSim);
    }
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dtReal = Math.min(0.1, (now - last) / 1000); last = now;
      let remaining = dtReal * S.speed;
      if (S.rec) {
        while (remaining > 0) {
          const toNext = S.dt - (S.t % S.dt || 0);
          const h = Math.min(remaining, toNext < 1e-9 ? S.dt : toNext);
          step(h); S.t += h; remaining -= h;
          const n = Math.round(S.t / S.dt);
          if (Math.abs(S.t - n * S.dt) < 1e-7 && n > S.run.data.length - 1) {
            const m = measure(); S.run.data.push([+(n * S.dt).toFixed(6), m.U, m.I]);
            if (S.run.data.length > 60000) { stopRec(); break; }
          }
        }
        if (cStop.get() && S.t > 6 * S.Rn * S.Cn) stopRec();
      } else step(remaining);
      const m = measure(); S.mU = m.U; S.mI = m.I; S.It = m.It; S.Ut = m.Ut;
      dU.set(`${fmt(m.U, 3)} V`); dI.set(`${fmt(m.I * 1e3, 3)} mA`); dT.set(S.rec ? `${fmt(S.t, 2)} s` : '–');
      q('kDispU').textContent = `${fmt(m.U, 3)} V`; q('kDispI').textContent = `${fmt(m.I * 1e3, 3)} mA`;
      q('kPsuDisp').textContent = S.U0.toFixed(1);
      q('kKnobMark').parentNode.setAttribute('transform', `translate(238 148) rotate(${-135 + S.U0 / 12 * 270})`);
      // Ladung auf den Platten
      const frac = Math.min(1, Math.abs(m.Ut) / 12);
      q('kChargeTop').setAttribute('opacity', frac.toFixed(2)); q('kChargeBot').setAttribute('opacity', frac.toFixed(2));
      // Stromfluss
      const I0ref = Math.max(S.U0, 1) / S.Rn;
      S.phase += (m.It / I0ref) * dtReal * 90; S.phaseE += (m.It / I0ref) * dtReal * 40;
      const lad = S.sw === 'laden';
      for (const p of (curSvg ? curSvg.querySelectorAll('.fl') : [])) {
        const active = p.classList.contains('fb') || (lad ? p.classList.contains('fc') : p.classList.contains('fd'));
                p.style.opacity = active && host.M.model ? (0.7 * Math.min(1, Math.abs(m.It) / I0ref * 3)).toFixed(2) : 0;
        p.style.strokeDashoffset = (-S.phase).toFixed(1);
      }
      redrawAcc += dtReal; if (S.rec && redrawAcc > 0.25) { redrawAcc = 0; redraw(); }
    }
    raf = requestAnimationFrame(frame);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); chart.destroy(); } };
  }
};
