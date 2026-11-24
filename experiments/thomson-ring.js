// ============================================================================
//  Schlüsselexperiment: Thomson'scher Ringversuch
//  Spule (R_c = 2 Ω, L_c = 0,15 H) mit langem Eisenkern, Ring über dem Kern.
//  Gegeninduktivität M(z) = M0·e^(−z/λ) (λ = 8 cm, oberhalb des Kernendes schneller abfallend).
//  Ring: L_r·dI_r/dt + R_r·I_r = −d(M·I)/dt,  Kraft F = I·I_r·dM/dz (abstoßend, Lenz).
//  Wechselspannung: Ring schwebt. Gleichspannung: Ring springt beim Einschalten.
// ============================================================================
import { viewHost } from '../js/lib/views.js';

const RC_ = 2, LC = 0.15, M0 = 1e-4, LAM = 0.08, CORE = 0.30, COIL_H = 0.16, G = 9.81, L_R = 6e-8;
const RINGS = {
  al: { name: 'Aluminiumring', m: 0.021, R: 8.3e-5, c: 900, a: 0.0043, col: '#cfd6dc', slit: false, T0: 20 },
  slit: { name: 'Aluminiumring geschlitzt', m: 0.021, R: Infinity, c: 900, a: 0.0043, col: '#cfd6dc', slit: true, T0: 20 },
  cu: { name: 'Kupferring', m: 0.070, R: 5.3e-5, c: 385, a: 0.0039, col: '#d8935a', slit: false, T0: 20 },
  cold: { name: 'Aluminiumring, in flüssigem Stickstoff gekühlt', m: 0.021, R: 8.3e-5, c: 900, a: 0.0043, col: '#e8f4ff', slit: false, T0: -196 }
};
// Grundversuch (Handbuch): Ring hängt neben der waagerechten Spule, Gleichstrom aus dem Akku
const RC_H = 5, LC_H = 0.108, M0H = 4e-4, LAMH = 0.05, LP = 0.35, D0 = 0.01, UB_MAX = 12;
const PHASE = ['', 'Phase 1: Einschalten · der Ring wird abgestoßen', 'Phase 2: Strom konstant · der Ring kriecht zurück', 'Strom fließt konstant · der Ring ruht', 'Phase 3: Ausschalten · der Ring wird angezogen', 'Phase 4: Strom aus · der Ring pendelt aus'];
const gOf = z => z <= CORE ? Math.exp(-z / LAM) : Math.exp(-CORE / LAM) * Math.exp(-(z - CORE) / 0.015);
const dgOf = z => z <= CORE ? -gOf(z) / LAM : -gOf(z) / 0.015;

const svgMarkup = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Thomsonscher Ringversuch von der Seite: Spule mit langem Eisenkern, Ring auf dem Kern, Stelltransformator">
<defs>
  <linearGradient id="tBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2024"/><stop offset="1" stop-color="#121518"/></linearGradient>
  <linearGradient id="tCu" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6b3612"/><stop offset=".35" stop-color="#e3a46e"/><stop offset=".6" stop-color="#b8692f"/><stop offset="1" stop-color="#5a2c0e"/></linearGradient>
  <linearGradient id="tFe" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a2f33"/><stop offset=".5" stop-color="#6a737a"/><stop offset="1" stop-color="#2a2f33"/></linearGradient>
  <filter id="tSh" x="-10%" y="-10%" width="130%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity=".55"/></filter>
  <filter id="tGl"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <marker id="tArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="context-stroke"/></marker>
</defs>
<rect width="1000" height="620" fill="url(#tBg)"/>
<rect x="0" y="560" width="1000" height="60" fill="#25292c"/>
<g id="tField" fill="none" stroke="#86dcff" stroke-width="1.3" opacity="0"></g>
<rect x="160" y="536" width="200" height="24" rx="3" fill="#6b5139" filter="url(#tSh)"/>
<rect x="250" y="${560 - 24 - 128 - 240 - 6}" width="20" height="${240 + 128 + 6}" fill="url(#tFe)"/>
<g stroke="#1f2427" stroke-width=".6" opacity=".6" id="tLam"></g>
<rect x="204" y="${536 - 128}" width="112" height="128" rx="6" fill="url(#tCu)" filter="url(#tSh)"/>
<g id="tWind" stroke="#4a250c" stroke-width="1" opacity=".55"></g>
<text x="260" y="${536 - 60}" fill="#fff3e4" font-size="12" text-anchor="middle">500 Wdg.</text>
<g id="tCoilSym"></g>
<!-- Maßstab -->
<rect x="300" y="${408 - 240 - 8}" width="26" height="256" rx="2" fill="#efece4"/>
<g id="tScale" stroke="#333" font-size="9" fill="#333"></g>
<!-- Ring -->
<g id="tRing"><ellipse id="tRingB" rx="30" ry="8" fill="none" stroke-width="9"/><ellipse id="tRingF" rx="30" ry="8" fill="none" stroke-width="9" stroke-dasharray="0 0"/></g>
<g id="tRingSym"></g>
<line id="tFup" stroke="#ff7a8a" stroke-width="3" marker-end="url(#tArr)" opacity="0"/><text id="tFupT" fill="#ff7a8a" font-size="12" opacity="0"></text>
<line id="tFg" stroke="#7fd6a0" stroke-width="3" marker-end="url(#tArr)" opacity="0"/><text id="tFgT" fill="#7fd6a0" font-size="12" opacity="0">F_G</text>
<text id="tHot" fill="#ff9a5a" font-size="12" text-anchor="middle"></text>
<!-- Stelltrafo / Netzgerät -->
<rect x="470" y="380" width="200" height="150" rx="10" fill="#2b3034" filter="url(#tSh)"/>
<text id="tSrcT" x="484" y="400" fill="#c9c3ba" font-size="12"></text>
<rect x="484" y="408" width="172" height="38" rx="4" fill="#160807"/><text id="tUd" x="648" y="436" fill="#ff5a3c" font-size="22" font-family="IBM Plex Mono, monospace" text-anchor="end"></text>
<circle id="tLamp" cx="500" cy="500" r="9" fill="#5a1a14"/><text x="516" y="504" fill="#c9c3ba" font-size="11" id="tOnT"></text>
<circle cx="626" cy="494" r="22" fill="#151515" stroke="#444"/><line id="tKnob" x1="626" y1="494" x2="626" y2="476" stroke="#fff" stroke-width="3"/>
<path d="M470 470 C420 470 400 520 360 530" stroke="#c4231b" stroke-width="3" fill="none"/><path d="M470 480 C430 485 410 540 360 545" stroke="#151515" stroke-width="3" fill="none"/>
<!-- Messgerät -->
<rect x="470" y="250" width="200" height="110" rx="10" fill="#d7d2c4" filter="url(#tSh)"/>
<text x="484" y="270" fill="#333" font-size="11">Spulenstrom</text>
<rect x="484" y="278" width="172" height="32" rx="3" fill="#1d2a1d"/><text id="tId" x="648" y="302" fill="#b7ffd6" font-size="17" font-family="IBM Plex Mono, monospace" text-anchor="end"></text>
<text id="tZ" x="484" y="332" fill="#333" font-size="12" font-family="IBM Plex Mono, monospace"></text>
<text id="tZm" x="484" y="350" fill="#333" font-size="12" font-family="IBM Plex Mono, monospace"></text>
<!-- Anzeigen -->
<text x="700" y="270" fill="#8e979d" font-size="12">Ring</text>
<text id="tR1" x="700" y="294" fill="#ece6dc" font-size="14"></text>
<text id="tR2" x="700" y="318" fill="#ece6dc" font-size="14" font-family="IBM Plex Mono, monospace"></text>
<text id="tR3" x="700" y="342" fill="#ece6dc" font-size="14" font-family="IBM Plex Mono, monospace"></text>
<text id="tR4" x="700" y="366" fill="#c9c3ba" font-size="12"></text>
<!-- Modell: Verlauf -->
<g id="tPlot" opacity="0">
  <rect x="700" y="40" width="270" height="190" rx="8" fill="#0b0d0f" stroke="#2a3238"/>
  <line x1="712" y1="135" x2="960" y2="135" stroke="#2a3238"/>
  <path id="tPI" fill="none" stroke="#f2ac74" stroke-width="1.8"/><path id="tPR" fill="none" stroke="#86dcff" stroke-width="1.8"/><path id="tPF" fill="none" stroke="#ff7a8a" stroke-width="1.8"/>
  <text x="712" y="58" fill="#f2ac74" font-size="11">I Spule</text><text x="770" y="58" fill="#86dcff" font-size="11">I Ring</text><text x="822" y="58" fill="#ff7a8a" font-size="11">Kraft auf den Ring</text>
  <text x="712" y="222" fill="#8e979d" font-size="10">letzte 60 ms (Zeitlupe)</text>
</g>
<text id="tModT" x="30" y="596" fill="#c7c1b7" font-size="12" opacity="0">⊙ / ⊗ Stromrichtung · blau: Feldlinien des Spulenfelds · rot: Kraft auf den Ring</text>
</svg>`;

export default {
  intro: 'Im Grundversuch hängt ein Aluminiumring an zwei Fäden neben einer Spule mit langem Eisenkern. Beim Einschalten wird er abgestoßen, beim Ausschalten angezogen. In der zweiten Variante liegt der Ring auf einem senkrechten Kern: Er springt beim Einschalten und schwebt bei Wechselspannung. Ihr untersucht, wovon Sprunghöhe und Schwebehöhe abhängen, und erklärt das mit dem Induktionsgesetz und der Lenzschen Regel.',
  docs: {
    durchfuehrung: `
<h3>Grundversuch: hängender Ring</h3>
<p>Eine Spule (500 Windungen, R = 5 Ω) liegt waagerecht. Ihr langer Eisenkern ragt zur Seite heraus. Ein Aluminiumring hängt an zwei Fäden (bifilar, 35 cm) um den Kern, 1 cm vor dem Spulenende. Ein Akku mit Taster liefert den Strom, ein Maßstab unter dem Ring zeigt die Auslenkung.</p>
<ol>
<li>Taster drücken und gedrückt halten. Den Ring genau beobachten und vier Phasen unterscheiden: Was passiert beim Einschalten, während der Strom fließt, beim Ausschalten und danach?</li>
<li>Größte Auslenkung und die Zeit bis zum Umkehrpunkt notieren, <b>Messwert übernehmen</b>. Mit 6 V und 12 V vergleichen.</li>
<li>Den Spulenstrom nach dem Einschalten auswerten: Halbwertszeit ablesen, daraus L = R·T½/ln 2. Ist das Feld schon aufgebaut, wenn der Ring umkehrt?</li>
<li>Mit geschlitztem Ring, Kupferring und gekühltem Ring wiederholen.</li>
</ol>
<h3>Variante: senkrechter Kern</h3>
<p>Eine Spule mit 500 Windungen steht auf einem Holzsockel. In ihr steckt ein langer, geblätterter Eisenkern, der 30 cm aus der Spule herausragt. Über den Kern wird ein Ring gelegt. Die Spule hängt an einem Stelltransformator (Wechselspannung 0 … 230 V) oder an einem Netzgerät (Gleichspannung 0 … 40 V). Ein Maßstab neben dem Kern zeigt die Höhe des Rings über der Spule.</p>
<h3>Durchführung</h3>
<ol>
<li>Gleichspannung 40 V, Aluminiumring. Einschalten und den Ring beobachten. Nach einiger Zeit ausschalten.</li>
<li>Den Versuch mit dem geschlitzten Ring und mit dem Kupferring wiederholen.</li>
<li>Wechselspannung wählen, langsam hochregeln und den Ring schweben lassen. Die Schwebehöhe für mehrere Spannungen ablesen und <b>Messwert übernehmen</b>.</li>
<li>Den Ring mit „Ring festhalten“ auf der Spule halten und die Temperatur beobachten.</li>
<li>Den gekühlten Ring verwenden (gedanklich in flüssigem Stickstoff, −196 °C) und mit dem warmen Ring vergleichen.</li>
</ol>
<p><b>Sicherheit:</b> Ein festgehaltener Ring wird in Sekunden heiß. Der gekühlte Ring kann vom Kern fliegen. Nicht über den Kern beugen.</p>`,
    theorie: `
<h3>Die vier Phasen des Grundversuchs</h3>
<ul><li><b>Einschalten:</b> Das Feld der Spule wächst. Der Ringstrom ist dem Spulenstrom entgegengerichtet, der Ring wird abgestoßen. Bewegt er sich weg, wird er durch das inhomogene Feld gebremst.</li>
<li><b>Strom konstant:</b> Das Feld ändert sich nicht mehr. Der Ring pendelt zurück. Weil er sich dabei im inhomogenen Feld bewegt, wird wieder ein Strom induziert, der die Bewegung bremst: Der Ring kriecht zurück.</li>
<li><b>Ausschalten:</b> Das Feld bricht zusammen. Der Ringstrom fließt jetzt in Richtung des Spulenstroms, der Ring wird kurz angezogen.</li>
<li><b>Strom aus:</b> Ohne Feld pendelt der Ring wie ein Fadenpendel.</li></ul>
<p>Feldänderung und induzierte Spannung haben immer entgegengesetzte Vorzeichen. Das ist das Minuszeichen im Induktionsgesetz.</p>
<h3>Aufbau des Feldes</h3>
<p>Der Spulenstrom steigt nach dem Einschalten wie I(t) = I₀·(1 − e^(−t·R/L)). Mit R = 5 Ω und L = 108 mH ist das Feld nach etwa 70 ms zu 95 % aufgebaut. Der Ring braucht etwa 200 ms bis zum Umkehrpunkt. Die Bremsung vor dem Umkehrpunkt kommt also vom inhomogenen, schon konstanten Feld.</p>
<span class="formula tex">T_{1/2} = \\frac{L}{R}\\, \\ln 2 \\quad\\Rightarrow\\quad L = \\frac{R\\, T_{1/2}}{\\ln 2}</span>
<h3>Induktion im Ring</h3>
<p>Der Spulenstrom I erzeugt im Eisenkern ein Magnetfeld. Ein Teil davon geht durch den Ring. Der Fluss durch den Ring ist Φ = M·I. M ist die Gegeninduktivität. Sie nimmt mit der Höhe z über der Spule ab. Ändert sich Φ, wird im Ring eine Spannung induziert, und im Ring fließt ein großer Strom:</p>
<span class="formula tex">U_\\text{ind} = -\\frac{\\mathrm{d}\\Phi}{\\mathrm{d}t} = -\\frac{\\mathrm{d}(M I)}{\\mathrm{d}t} \\qquad L_R\\, \\frac{\\mathrm{d}I_R}{\\mathrm{d}t} + R_R\\, I_R = U_\\text{ind}</span>
<h3>Lenzsche Regel</h3>
<p>Der Ringstrom ist so gerichtet, dass sein Magnetfeld der Flussänderung entgegenwirkt. Beim Einschalten fließt er entgegengesetzt zum Spulenstrom. Entgegengesetzte Ströme stoßen sich ab. Die Kraft auf den Ring ist</p>
<span class="formula tex">F = I\\, I_R\\, \\frac{\\mathrm{d}M}{\\mathrm{d}z}</span>
<p>Das Feld der Spule läuft am Ort des Rings auseinander. Deshalb hat die Lorentzkraft auf den Ringstrom eine Komponente nach oben.</p>
<h3>Gleichspannung</h3>
<p>Nur während der Strom ansteigt, ändert sich der Fluss. Der Ring springt kurz hoch und fällt zurück. Beim Ausschalten kehrt sich der Ringstrom um, und der Ring wird kurz angezogen.</p>
<h3>Wechselspannung</h3>
<p>Der Fluss ändert sich ständig. Der Ringstrom läuft wegen der Induktivität des Rings dem induzierten Wert etwas hinterher. Im Mittel bleibt eine abstoßende Kraft. Der Ring schwebt dort, wo sie so groß ist wie seine Gewichtskraft:</p>
<span class="formula tex">\\bar{F} = \\frac{\\hat{I}^2 M^2}{2\\lambda} \\cdot \\frac{\\omega^2 L_R}{R_R^2 + \\omega^2 L_R^2} = m\\, g</span>
<p>Ein kleinerer Widerstand (gekühlter Ring, Kupfer) ergibt eine größere Kraft. Der geschlitzte Ring hat keinen geschlossenen Stromkreis und bleibt liegen.</p>
<h3>Erwärmung</h3>
<p>Im Ring wird die Leistung P = I_R²·R_R in Wärme umgesetzt. Ein festgehaltener Ring liegt im stärksten Feld und wird sehr schnell heiß. Mit der Temperatur wächst der Widerstand.</p>
<h3>Modellgrenzen</h3>
<ul><li>Grundversuch: Gegeninduktivität M = 0,4 mH·e^(−d/5 cm) mit dem Abstand d vom Spulenende, Fadenpendel 35 cm, kleine Luftdämpfung.</li><li>Senkrechter Kern: Spule R = 2 Ω, L = 0,15 H, Abklinglänge λ = 8 cm, über dem Kernende viel schneller.</li><li>Die Rückwirkung des Ringstroms auf den Spulenstrom ist vernachlässigt.</li><li>Ring: 5 mm × 10 mm Querschnitt, mittlerer Radius 2,5 cm, L_R = 60 nH.</li></ul>
<h3>Was die Modellansicht zeigt</h3>
<ul><li>Die Feldlinien des Spulenfelds. Ihre Helligkeit folgt der Stromstärke.</li><li>Die Stromrichtung in Spule und Ring. Sie ist meist entgegengesetzt.</li><li>Kraft auf den Ring und Gewichtskraft als Pfeile, dazu den Verlauf von Spulenstrom, Ringstrom und Kraft in Zeitlupe.</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Spule</td><td>500 Windungen; Grundversuch R = 5 Ω, L = 108 mH (mit Kern); senkrechter Aufbau R = 2 Ω, L = 0,15 H</td></tr>
<tr><td>Grundversuch</td><td>Akku 0 … 12 V mit Taster, Ring bifilar an 35 cm langen Fäden, Maßstab 0 … 15 cm</td></tr>
<tr><td>Eisenkern</td><td>geblättert, ragt 30 cm aus der Spule</td></tr>
<tr><td>Spannung</td><td>Stelltransformator 0 … 230 V~ (50 Hz) oder Netzgerät 0 … 40 V=</td></tr>
<tr><td>Ringe</td><td>Aluminium 21 g, Aluminium geschlitzt, Kupfer 70 g, Aluminium gekühlt (−196 °C)</td></tr>
<tr><td>Maßstab</td><td>0 … 30 cm über der Spule</td></tr>
</tbody></table>`,
    abi: `
<details class="q"><summary>Beschreibe und erkläre die vier Phasen beim hängenden Ring. <span class="op">AFB II</span></summary><p>Einschalten: Abstoßung (Ringstrom gegen Spulenstrom). Strom konstant: Rückkehr, gebremst durch Induktion im inhomogenen Feld. Ausschalten: Anziehung (Ringstrom in Richtung Spulenstrom). Danach freies Pendeln. In allen Fällen wirkt der Ringstrom der Änderung des Flusses durch den Ring entgegen.</p></details>
<details class="q"><summary>Der Spulenstrom erreicht nach 15 ms die Hälfte seines Endwerts (R = 5 Ω). Berechne L. <span class="op">AFB I</span></summary><p>L = R·T½/ln 2 = 5 Ω · 0,015 s / 0,693 ≈ 108 mH.</p></details>
<details class="q"><summary>Erkläre, warum der Ring beim Einschalten nach oben springt. <span class="op">AFB II</span></summary><p>Der Fluss durch den Ring nimmt zu. Im Ring wird ein Strom induziert, der nach Lenz der Zunahme entgegenwirkt, also dem Spulenstrom entgegengesetzt fließt. Entgegengesetzte Ströme stoßen sich ab. Weil das Feld am Ring auseinanderläuft, hat die Lorentzkraft eine Komponente nach oben.</p></details>
<details class="q"><summary>Warum bleibt der geschlitzte Ring liegen? <span class="op">AFB I</span></summary><p>Es wird zwar eine Spannung induziert, aber der Stromkreis ist offen. Ohne Strom wirkt keine Kraft.</p></details>
<details class="q"><summary>Begründe, warum ein gekühlter Ring höher schwebt. <span class="op">AFB II</span></summary><p>Der Widerstand des Metalls sinkt stark mit der Temperatur. Bei gleicher induzierter Spannung fließt ein größerer Strom, und der Strom ist besser gegenphasig zum Spulenstrom. Die mittlere Kraft wird größer, das Gleichgewicht mit der Gewichtskraft liegt weiter oben, wo das Feld schwächer ist.</p></details>
<details class="q"><summary>Erkläre mit der Energieerhaltung, warum ein festgehaltener Ring heiß wird. <span class="op">AFB III</span></summary><p>Der Ring nimmt über die Induktion Energie aus dem Feld der Spule auf. Da er sich nicht bewegen kann, wird keine mechanische Arbeit verrichtet. Die ganze Leistung I_R²·R wird im Ring in Wärme umgesetzt, und sie ist am Ort des stärksten Feldes am größten.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, segmented, check, button, fmt, dataTable, toast, display } = ui;
    const S = { mode: 'ac', Uac: 150, Udc: 40, on: false, ring: 'al', hold: false, slow: false, t: 0, I: 0, Ir: 0, Psi: 0, z: 0, v: 0, T: 20, state: 'core',
      jump: 0, zAvg: 0, vAvg: 0, Ieff: 0, hist: [], F: 0, flyX: 0, setup: 'h', Ub: 12, onPrev: false, phase: 0, tOn: 0, xmax: 0, tTurn: null, irec: [], irecShow: [] };
    const H = () => S.setup === 'h';
    let hostRef = null;
    const ring = () => RINGS[S.ring];
    const Rr = () => ring().slit ? Infinity : ring().R * Math.max(0.12, 1 + ring().a * (S.T - 20));
    function resetRing() { S.z = 0; S.v = 0; S.Ir = 0; S.Psi = M0 * gOf(0) * S.I; S.T = ring().T0; S.state = 'core'; S.jump = 0; S.zAvg = 0; S.vAvg = 0; S.flyX = 0; }

    const gA = group('Aufbau');
    const segA = segmented({ value: 'h', options: [{ value: 'h', label: 'Ring hängt (Grundversuch)' }, { value: 'v', label: 'senkrechter Kern' }], onChange: v => setSetup(v) });
    gA.append(el('div', { class: 'ctl' }, el('div', { style: 'grid-column:1/-1' }, segA)));
    const gH = group('Akku mit Taster', { led: true });
    const sUB = slider({ label: 'Spannung U', min: 0, max: UB_MAX, step: 0.5, value: S.Ub, unit: 'V', digits: 1, onInput: v => { S.Ub = v; } });
    const bT = button('Taster gedrückt halten', null, 'btn small primary');
    const press = on => { if (!H()) return; S.on = on; gH.led(on); bT.textContent = on ? 'Taster gedrückt …' : 'Taster gedrückt halten'; };
    bT.addEventListener('pointerdown', e => { e.preventDefault(); press(true); }); for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) bT.addEventListener(ev, () => { if (S.on) press(false); });
    bT.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); press(true); } }); bT.addEventListener('keyup', () => press(false));
    const bT2 = button('Schalter: ein / aus', () => press(!S.on));
    gH.append(sUB, el('div', { class: 'bar' }, bT, bT2));
    const gQ = group('Spannungsquelle', { led: true });
    const segM = segmented({ value: 'ac', options: [{ value: 'ac', label: 'Wechselspannung ~' }, { value: 'dc', label: 'Gleichspannung =' }], onChange: v => { S.mode = v; sAC.hidden = v !== 'ac'; sDC.hidden = v !== 'dc'; } });
    const sAC = slider({ label: 'Stelltrafo U_eff', min: 0, max: 230, step: 1, value: S.Uac, unit: 'V', digits: 0, onInput: v => { S.Uac = v; } });
    const sDC = slider({ label: 'Netzgerät U', min: 0, max: 40, step: 0.5, value: S.Udc, unit: 'V', digits: 1, onInput: v => { S.Udc = v; } }); sDC.hidden = true;
    const bOn = button('Einschalten', () => { S.on = !S.on; bOn.textContent = S.on ? 'Ausschalten' : 'Einschalten'; gQ.led(S.on); if (S.on) S.jump = S.z; }, 'btn small primary');
    gQ.append(el('div', { class: 'ctl' }, el('div', { style: 'grid-column:1/-1' }, segM)), sAC, sDC, el('div', { class: 'bar' }, bOn));
    const gR = group('Ring');
    const segR = segmented({ value: 'al', options: [{ value: 'al', label: 'Aluminium' }, { value: 'slit', label: 'geschlitzt' }, { value: 'cu', label: 'Kupfer' }, { value: 'cold', label: 'gekühlt' }], onChange: v => { S.ring = v; resetRing(); } });
    const cH = check({ label: 'Ring auf der Spule festhalten', checked: false, onChange: v => { S.hold = v; if (v && S.state === 'core') { S.z = 0; S.v = 0; } } });
    const cS = check({ label: 'Zeitlupe (1 : 5)', checked: false, onChange: v => { S.slow = v; } });
    gR.append(el('div', { class: 'ctl' }, el('div', { style: 'grid-column:1/-1' }, segR)), cH, cS, el('div', { class: 'bar' }, button('Ring zurücklegen', () => resetRing())));
    const gD = group('Messung');
    const dZ = display('Höhe über der Spule'), dJ = display('Höchster Punkt seit dem Einschalten'), dT = display('Temperatur des Rings');
    gD.append(dZ, dJ, dT, el('div', { class: 'bar' }, button('Messwert übernehmen', () => take(), 'btn small primary')));
    const gDH = group('Beobachtung und Messung');
    const dPh = display('Phase'), dX = display('Auslenkung x'), dXm = display('größte Auslenkung / Zeit bis zum Umkehrpunkt');
    gDH.append(dPh, dX, dXm, el('div', { class: 'bar' }, button('Messwert übernehmen', () => takeH(), 'btn small primary')));
    function setSetup(v) {
      S.setup = v; S.on = false; gQ.led(false); gH.led(false); bOn.textContent = 'Einschalten'; resetRing(); S.I = 0; S.Psi = 0; S.phase = 0;
      gH.hidden = v !== 'h'; gDH.hidden = v !== 'h'; gQ.hidden = v === 'h'; gD.hidden = v === 'h'; cH.hidden = v === 'h';
      if (v === 'h') { S.mode = 'dc'; } else { segM.set('ac'); S.mode = 'ac'; sAC.hidden = false; sDC.hidden = true; }
      hostRef?.refresh();
    }
    controls.append(gA, gH, gQ, gR, gDH, gD);

    // Messwerte Grundversuch
    const rowsH = [];
    const tblH = dataTable([
      { key: 'ringN', label: 'Ring', fmt: v => v }, { key: 'U', label: 'U in V', digits: 1 }, { key: 'x', label: 'größte Auslenkung in cm', fmt: v => fmt(v * 100, 1) },
      { key: 'tt', label: 'Zeit bis Umkehr in ms', fmt: v => fmt(v * 1000, 0) }, { key: 'th', label: 'T½ Spulenstrom in ms', fmt: v => fmt(v * 1000, 1) }, { key: 'L', label: 'L = R·T½/ln 2 in mH', fmt: v => fmt(v * 1000, 0) }
    ], { onDelete: i => { rowsH.splice(i, 1); tblH.render(rowsH); } });
    const figIH = el('div', { class: 'fig' }), resIH = el('div', { class: 'result' });
    const chIH = new Chart(figIH, { xlabel: 't in ms', ylabel: 'I in A' });
    const tHalf = () => { const r = S.irecShow; if (r.length < 20) return null; const Iinf = r[r.length - 1][2] / RC_H; if (Iinf < 0.05) return null; for (let i = 1; i < r.length; i++) if (r[i][1] >= Iinf / 2) { const a = r[i - 1], b = r[i]; return a[0] + (b[0] - a[0]) * (Iinf / 2 - a[1]) / (b[1] - a[1]); } return null; };
    function drawIH() {
      const th = tHalf(), r = S.irecShow;
      chIH.set([{ color: '#f2ac74', points: r.map(p => [p[0] * 1000, p[1]]) }, ...(th ? [{ color: '#ffd27a', mode: 'dot', points: [[th * 1000, r[r.length - 1][2] / RC_H / 2]] }] : [])]);
      resIH.innerHTML = th ? `<div><span>Halbwertszeit des Stromanstiegs</span><br><b>T½ = ${fmt(th * 1000, 1)} ms → L = ${fmt(RC_H * th / Math.LN2 * 1000, 0)} mH</b></div><div><span>95 % erreicht nach</span><br><b>${fmt(3 * LC_H / RC_H * 1000, 0)} ms</b></div>` : '<span>Taster drücken: Der Strom nach dem Einschalten wird aufgezeichnet.</span>';
    }
    messwerte.append(el('h3', { style: 'margin:0 0 10px' }, 'Grundversuch: hängender Ring'),
      el('div', { class: 'chartbox' }, el('h4', {}, 'Spulenstrom nach dem Einschalten'), figIH, resIH,
        csvTools(() => ({ meta: ['Thomson-Ring Grundversuch, Spulenstrom', `R = ${RC_H} Ohm`], columns: [{ key: 't', label: 't in s' }, { key: 'i', label: 'I in A' }], rows: S.irecShow.map(([t, i]) => ({ t, i })) }), 'thomson_spulenstrom')),
      el('div', { style: 'height:10px' }), tblH, el('h3', { style: 'margin:22px 0 10px' }, 'Variante senkrechter Kern'));
    drawIH();
    function takeH() {
      if (S.tTurn == null) { toast('Erst den Taster drücken und den Umkehrpunkt abwarten.'); return; }
      const th = tHalf();
      rowsH.push({ ringN: RINGS[S.ring].name.split(',')[0], U: S.Ub, x: S.xmax, tt: S.tTurn, th: th ?? NaN, L: th ? RC_H * th / Math.LN2 : NaN }); tblH.render(rowsH);
      toast(`Übernommen: größte Auslenkung ${fmt(S.xmax * 100, 1)} cm nach ${fmt(S.tTurn * 1000, 0)} ms`);
    }
    const rows = [];
    const tbl = dataTable([
      { key: 'mode', label: 'Spannung', fmt: v => v === 'ac' ? 'Wechsel' : 'Gleich' }, { key: 'ringN', label: 'Ring', fmt: v => v }, { key: 'U', label: 'U in V', digits: 1 },
      { key: 'h', label: 'Höhe in cm', fmt: v => fmt(v * 100, 1) }, { key: 'kind', label: 'gemessen', fmt: v => v }
    ], { onDelete: i => { rows.splice(i, 1); redraw(); } });
    const figA = el('div', { class: 'fig' }), figD = el('div', { class: 'fig' });
    const chA = new Chart(figA, { xlabel: 'U_eff in V', ylabel: 'Schwebehöhe in cm' }), chD = new Chart(figD, { xlabel: 'U in V', ylabel: 'Sprunghöhe in cm' });
    const resA = el('div', { class: 'result' }), resD = el('div', { class: 'result' });
    messwerte.append(
      el('div', { class: 'data' },
        el('div', { class: 'chartbox' }, el('h4', {}, 'Wechselspannung: Schwebehöhe'), figA, resA,
          csvTools(() => ({ meta: ['Thomsonscher Ringversuch'], columns: [{ key: 'mode', label: 'Spannung' }, { key: 'ringN', label: 'Ring' }, { key: 'U', label: 'U in V' }, { key: 'h', label: 'Hoehe in m' }], rows }), 'thomson_messreihe')),
        el('div', { class: 'chartbox' }, el('h4', {}, 'Gleichspannung: Sprunghöhe beim Einschalten'), figD, resD)),
      el('div', { style: 'height:14px' }), tbl);
    const RC = { al: '#cfd6dc', cu: '#f2ac74', cold: '#86dcff', slit: '#888' };
    function redraw() {
      tbl.render(rows);
      const sa = [], sd = []; let ta = '';
      for (const k of Object.keys(RINGS)) {
        const ra = rows.filter(r => r.ring === k && r.mode === 'ac').sort((a, b) => a.U - b.U), rd = rows.filter(r => r.ring === k && r.mode === 'dc').sort((a, b) => a.U - b.U);
        if (ra.length) { sa.push({ name: RINGS[k].name.split(',')[0], color: RC[k], points: ra.map(r => [r.U, r.h * 100]) }, { color: RC[k], mode: 'dot', points: ra.map(r => [r.U, r.h * 100]) });
          const lf = ra.filter(r => r.h > 0.003); if (lf.length >= 2) { const f = fit.linFit(lf.map(r => Math.log(r.U)), lf.map(r => r.h)); if (f) ta += `<div><span>${RINGS[k].name.split(',')[0]}: Höhe über ln U</span><br><b>Steigung ${fmt(f.a * 100, 1)} cm</b> <span>(Abklinglänge λ des Felds)</span></div>`; } }
        if (rd.length) sd.push({ name: RINGS[k].name.split(',')[0], color: RC[k], points: rd.map(r => [r.U, r.h * 100]) }, { color: RC[k], mode: 'dot', points: rd.map(r => [r.U, r.h * 100]) });
      }
      chA.set(sa); chD.set(sd);
      resA.innerHTML = ta || '<span>Schwebehöhen für mehrere Spannungen messen. Trägt man sie über ln U auf, ergibt sich eine Gerade.</span>';
      resD.innerHTML = '<span>Sprunghöhe: höchster Punkt nach dem Einschalten (Ring vorher zurücklegen).</span>';
    }
    redraw();
    function take() {
      if (S.mode === 'ac') {
        if (!S.on) { toast('Erst einschalten.'); return; }
        if (S.hold) { toast('Der Ring wird festgehalten.'); return; }
        if (S.state !== 'core') { toast('Der Ring ist vom Kern geflogen. Zurücklegen.'); return; }
        if (Math.abs(S.vAvg) > 0.01) { toast('Warten, bis der Ring ruhig schwebt.'); return; }
        const h = Math.round(S.zAvg * 1000) / 1000;
        rows.push({ mode: 'ac', ring: S.ring, ringN: RINGS[S.ring].name.split(',')[0], U: S.Uac, h, kind: 'Schwebehöhe' }); redraw(); toast(`Übernommen: Schwebehöhe ${fmt(h * 100, 1)} cm bei ${S.Uac} V`);
      } else {
        if (S.jump <= 0 && !S.on) { toast('Erst einschalten und den Sprung abwarten.'); return; }
        const h = Math.round(S.jump * 1000) / 1000;
        rows.push({ mode: 'dc', ring: S.ring, ringN: RINGS[S.ring].name.split(',')[0], U: S.Udc, h, kind: S.state === 'core' ? 'Sprunghöhe' : 'vom Kern geflogen' }); redraw(); toast(`Übernommen: Sprunghöhe ${fmt(h * 100, 1)} cm bei ${fmt(S.Udc, 1)} V`);
      }
    }

    // Feldlinien (r, h) in m, h ab Spulenoberkante; gespiegelt für links
    const fieldLines = [1, 2, 3, 4].map(k => { const pts = []; const top = CORE * (1 - 0.18 * (k - 1)), rx = 0.05 + 0.035 * k; for (let i = 0; i <= 30; i++) { const u = i / 30, a = u * Math.PI; pts.push([0.013 + rx * Math.sin(a) * (1 + 0.15 * k * Math.sin(a)), top - (top + COIL_H + 0.02) * (1 - Math.cos(a)) / 2]); } return pts; });

    // ======================= Ansicht 2D =======================
    async function view2d(box, MM) {
      box.insertAdjacentHTML('beforeend', svgMarkup());
      const svg = box.querySelector('svg'), q = id => svg.querySelector('#' + id);
      const SC = 800, CX = 260, Y0 = 408, X = r => CX + r * SC, Y = h => Y0 - h * SC;
      { let h = ''; for (let i = 0; i <= 30; i++) { const y = Y(i / 100); h += `<line x1="300" y1="${y}" x2="${i % 5 ? 307 : 312}" y2="${y}"/>`; if (i % 5 === 0) h += `<text x="314" y="${y + 3}" stroke="none">${i}</text>`; } q('tScale').innerHTML = h; }
      { let h = ''; for (let y = 414; y < 532; y += 6) h += `<line x1="206" y1="${y}" x2="314" y2="${y}"/>`; q('tWind').innerHTML = h; let l = ''; for (let x = 253; x < 270; x += 4) l += `<line x1="${x}" y1="${Y(CORE) - 6}" x2="${x}" y2="536"/>`; q('tLam').innerHTML = l; }
      { let h = ''; for (const pts of fieldLines) for (const s of [1, -1]) h += `<path d="${pts.map((p, i) => `${i ? 'L' : 'M'}${(CX + s * p[0] * SC).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('')}"/>`; q('tField').innerHTML = h; }
      let raf = 0;
      const sym = (x, y, r, s) => s > 0 ? `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#111" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="2" fill="#111"/>` : `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#111" stroke-width="1.6"/><path d="M${x - r * .6} ${y - r * .6} L${x + r * .6} ${y + r * .6} M${x + r * .6} ${y - r * .6} L${x - r * .6} ${y + r * .6}" stroke="#111" stroke-width="1.6"/>`;
      function frame() {
        raf = requestAnimationFrame(frame);
        const model = MM.model, rg = ring(), Imax = S.mode === 'ac' ? 7 : 20;
        // Ring
        let rx = CX, ry = Y(S.z) - 5;
        if (S.state === 'fly') rx = CX + S.flyX * SC; if (S.state === 'off') { rx = CX + 0.2 * SC; ry = 552; }
        const tcol = S.T > 150 ? `rgb(255,${Math.max(80, 220 - (S.T - 150) * 0.4)},${Math.max(40, 200 - (S.T - 150) * 0.5)})` : S.T < -50 ? '#e8f4ff' : rg.col;
        for (const id of ['tRingB', 'tRingF']) { const e = q(id); e.setAttribute('cx', rx); e.setAttribute('cy', ry); e.setAttribute('stroke', tcol); }
        q('tRingB').setAttribute('stroke-opacity', .55); q('tRingF').setAttribute('stroke-dasharray', rg.slit ? '88 6 200' : '0'); q('tRingF').setAttribute('pathLength', 300);
        q('tRing').setAttribute('filter', S.T > 250 ? 'url(#tGl)' : '');
        q('tHot').setAttribute('x', rx); q('tHot').setAttribute('y', ry - 18); q('tHot').textContent = S.T > 120 ? `heiß: ${fmt(S.T, 0)} °C` : S.T < -100 ? 'kalt' : '';
        // Quelle
        const U = S.mode === 'ac' ? S.Uac : S.Udc;
        q('tSrcT').textContent = S.mode === 'ac' ? 'Stelltransformator ~' : 'Netzgerät =';
        q('tUd').textContent = `${fmt(U, S.mode === 'ac' ? 0 : 1)} V`; q('tLamp').setAttribute('fill', S.on ? '#ff3b2a' : '#5a1a14'); q('tOnT').textContent = S.on ? 'ein' : 'aus';
        const fr = S.mode === 'ac' ? S.Uac / 230 : S.Udc / 40, an = -2.4 + fr * 4.8; q('tKnob').setAttribute('x2', 626 + Math.sin(an) * 18); q('tKnob').setAttribute('y2', 494 - Math.cos(an) * 18);
        q('tId').textContent = S.mode === 'ac' ? `${fmt(S.Ieff, 2)} A~` : `${fmt(S.I, 2)} A`;
        q('tZ').textContent = `Höhe z = ${S.state === 'core' ? fmt(S.z * 100, 1) + ' cm' : 'vom Kern'}`; q('tZm').textContent = `höchster Punkt ${fmt(S.jump * 100, 1)} cm`;
        q('tR1').textContent = rg.name.split(',')[0] + (S.hold ? ' (festgehalten)' : '');
        q('tR2').textContent = `m = ${fmt(rg.m * 1000, 0)} g   T = ${fmt(S.T, 0)} °C`;
        q('tR3').textContent = rg.slit ? 'R = ∞ (offen)' : `R = ${fmt(Rr() * 1e6, 1)} µΩ`;
        q('tR4').textContent = S.state === 'off' ? 'Der Ring ist vom Kern geflogen.' : S.mode === 'ac' && S.on && !S.hold && S.state === 'core' && S.z > 0.003 ? 'Der Ring schwebt.' : '';
        // Modell
        q('tField').setAttribute('opacity', model ? Math.min(0.9, Math.abs(S.I) / Imax * 1.2).toFixed(2) : 0); q('tPlot').setAttribute('opacity', model ? 1 : 0); q('tModT').setAttribute('opacity', model ? 1 : 0);
        let cs = '', rs = '';
        if (model) {
          if (Math.abs(S.I) > 0.05) for (let k = 0; k < 4; k++) { const y = 424 + k * 30; cs += sym(212, y, 6, S.I > 0 ? 1 : -1) + sym(308, y, 6, S.I > 0 ? -1 : 1); }
          if (Math.abs(S.Ir) > 5 && S.state !== 'off') { const r = Math.min(9, 4 + Math.log10(Math.abs(S.Ir)) * 1.2); rs += sym(rx - 30, ry, r, S.Ir > 0 ? 1 : -1) + sym(rx + 30, ry, r, S.Ir > 0 ? -1 : 1); }
          const fl = Math.max(-120, Math.min(120, S.F / (rg.m * G) * 40)), wl = 40;
          for (const [id, len, t] of [['tFup', -fl, `F = ${fmt(S.F, 2)} N`], ['tFg', wl, null]]) { const e = q(id); e.setAttribute('x1', rx + (id === 'tFup' ? 44 : 56)); e.setAttribute('x2', rx + (id === 'tFup' ? 44 : 56)); e.setAttribute('y1', ry); e.setAttribute('y2', ry + len); e.setAttribute('opacity', Math.abs(len) > 3 && S.state !== 'off' ? 1 : 0); }
          q('tFupT').setAttribute('x', rx + 50); q('tFupT').setAttribute('y', ry - fl - 4); q('tFupT').textContent = `F = ${fmt(S.F, 2)} N`; q('tFupT').setAttribute('opacity', Math.abs(fl) > 3 ? 1 : 0);
          q('tFgT').setAttribute('x', rx + 62); q('tFgT').setAttribute('y', ry + wl + 4); q('tFgT').setAttribute('opacity', S.state !== 'off' ? 1 : 0);
          const h = S.hist, n = h.length;
          if (n > 2) { const mI = Math.max(1, ...h.map(p => Math.abs(p[1]))), mR = Math.max(1, ...h.map(p => Math.abs(p[2]))), mF = Math.max(0.05, ...h.map(p => Math.abs(p[3])));
            const XP = i => 712 + i / (n - 1) * 248; const mk = (k, m) => h.map((p, i) => `${i ? 'L' : 'M'}${XP(i).toFixed(1)} ${(135 - p[k] / m * 70).toFixed(1)}`).join('');
            q('tPI').setAttribute('d', mk(1, mI)); q('tPR').setAttribute('d', mk(2, mR)); q('tPF').setAttribute('d', mk(3, mF)); }
        } else { for (const id of ['tFup', 'tFupT', 'tFg', 'tFgT']) q(id).setAttribute('opacity', 0); }
        q('tCoilSym').innerHTML = cs; q('tRingSym').innerHTML = rs;
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); } };
    }

    // ======================= Ansicht 3D =======================
    async function view3d(box, MM) {
      const { createLab, mats, cable, label, arrow, glowPool, makeDisplay } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [0.4, 0.46, 0.86], target: [0.06, 0.2, 0], table: [1.6, 1.2], bloom: [0.6, 0.4, 0.88], room: 0.6, minDist: 0.2, maxDist: 2.2, fov: 38 });
      const { THREE, scene } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad</div>');
      const add = (geo, mat, x, y, z, parent = scene) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = !mat.transparent; parent.add(m); return m; };
      const B0 = 0.03, CT = B0 + COIL_H;                       // Sockelhöhe, Spulenoberkante
      add(new THREE.BoxGeometry(0.26, B0, 0.26), new THREE.MeshStandardMaterial({ color: 0x6b5139, roughness: 0.8 }), 0, B0 / 2, 0);
      const coil = add(new THREE.CylinderGeometry(0.07, 0.07, COIL_H, 48, 1, true), M.copper, 0, B0 + COIL_H / 2, 0);
      const wc = document.createElement('canvas'); wc.width = 64; wc.height = 256; const wg = wc.getContext('2d'); wg.fillStyle = '#b8692f'; wg.fillRect(0, 0, 64, 256); wg.strokeStyle = 'rgba(60,25,5,.6)'; for (let y = 0; y < 256; y += 4) { wg.beginPath(); wg.moveTo(0, y); wg.lineTo(64, y + 1); wg.stroke(); }
      const wt = new THREE.CanvasTexture(wc); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(6, 1); wt.colorSpace = THREE.SRGBColorSpace;
      coil.material = new THREE.MeshStandardMaterial({ map: wt, metalness: 0.8, roughness: 0.35, side: THREE.DoubleSide });
      for (const y of [B0, CT]) { const rim = add(new THREE.CylinderGeometry(0.075, 0.075, 0.006, 48), M.black, 0, y, 0); }
      add(new THREE.BoxGeometry(0.025, COIL_H + CORE + 0.01, 0.025), new THREE.MeshStandardMaterial({ color: 0x4a5258, metalness: 0.7, roughness: 0.4 }), 0, B0 + (COIL_H + CORE + 0.01) / 2, 0);
      // Maßstab
      const sc = document.createElement('canvas'); sc.width = 64; sc.height = 640; const sg = sc.getContext('2d'); sg.fillStyle = '#efece4'; sg.fillRect(0, 0, 64, 640); sg.fillStyle = '#222'; sg.font = '20px "IBM Plex Sans"';
      for (let i = 0; i <= 30; i++) { const y = 630 - i * 20; sg.fillRect(0, y, i % 5 ? 14 : 26, 2); if (i % 5 === 0) sg.fillText(String(i), 30, y + 7); }
      const stex = new THREE.CanvasTexture(sc); stex.colorSpace = THREE.SRGBColorSpace;
      const ruler = add(new THREE.PlaneGeometry(0.03, 0.32), new THREE.MeshStandardMaterial({ map: stex, roughness: 0.7 }), 0.06, CT + 0.155, 0.04); ruler.rotation.y = -0.3;
      add(new THREE.CylinderGeometry(0.003, 0.003, CT, 8), M.steel, 0.065, CT / 2, 0.035);
      // Ring
      const ringG = new THREE.Group(); scene.add(ringG);
      let ringKey = '', ringMat = null;
      function buildRing() {
        ringG.clear(); const rg = ring(); ringMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(rg.col), metalness: 0.9, roughness: 0.28, emissive: 0x000000 });
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.0275, 0.0275, 0.01, 48, 1, true, rg.slit ? 0.1 : 0, rg.slit ? Math.PI * 2 - 0.2 : Math.PI * 2), ringMat); m.material.side = THREE.DoubleSide; m.castShadow = true; ringG.add(m);
        const m2 = new THREE.Mesh(new THREE.CylinderGeometry(0.0225, 0.0225, 0.01, 48, 1, true, rg.slit ? 0.1 : 0, rg.slit ? Math.PI * 2 - 0.2 : Math.PI * 2), ringMat); ringG.add(m2);
        for (const y of [-0.005, 0.005]) { const t = new THREE.Mesh(new THREE.RingGeometry(0.0225, 0.0275, 48, 1, rg.slit ? 0.1 : 0, rg.slit ? Math.PI * 2 - 0.2 : Math.PI * 2), ringMat); t.rotation.x = -Math.PI / 2; t.position.y = y; t.material.side = THREE.DoubleSide; ringG.add(t); }
      }
      // Stelltrafo
      const st = new THREE.Group(); st.position.set(0.32, 0, -0.05); st.rotation.y = -0.5; scene.add(st);
      add(new THREE.BoxGeometry(0.2, 0.14, 0.2), M.housing, 0, 0.07, 0, st);
      const knob = add(new THREE.CylinderGeometry(0.035, 0.038, 0.025, 32), M.knob, 0, 0.152, 0, st);
      const kmark = add(new THREE.BoxGeometry(0.004, 0.004, 0.03), new THREE.MeshBasicMaterial({ color: 0xffffff }), 0, 0.166, 0.015, knob.parent);
      const disp = makeDisplay(THREE, 256, 96); const dm = add(new THREE.PlaneGeometry(0.09, 0.034), new THREE.MeshBasicMaterial({ map: disp.tex, toneMapped: false }), -0.03, 0.09, 0.1005, st);
      const lampM = new THREE.MeshBasicMaterial({ color: 0x5a1a14, toneMapped: false }); add(new THREE.SphereGeometry(0.007, 16, 12), lampM, 0.06, 0.09, 0.1, st);
      scene.add(cable(THREE, new THREE.Vector3(0.2, 0.04, 0.04), new THREE.Vector3(0.08, 0.02, 0.06), 0xc4231b, 0.02), cable(THREE, new THREE.Vector3(0.21, 0.04, 0.0), new THREE.Vector3(0.08, 0.02, 0.02), 0x151515, 0.02));
      // Modell
      const modelG = new THREE.Group(); scene.add(modelG);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x86dcff, transparent: true, opacity: 0.6, toneMapped: false });
      for (const pts of fieldLines) for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; const g = new THREE.BufferGeometry().setFromPoints(pts.map(([r, h]) => new THREE.Vector3(r * Math.cos(a), CT + h, r * Math.sin(a)))); modelG.add(new THREE.Line(g, lineMat)); }
      const aF = arrow(THREE, 0xff7a8a, { radius: 0.0025, head: 0.016 }), aG = arrow(THREE, 0x7fd6a0, { radius: 0.0025, head: 0.016 }); modelG.add(aF, aG);
      const ePool = glowPool(THREE, modelG, 16, 0x86dcff, 0.008), cPool = glowPool(THREE, modelG, 20, 0xf2ac74, 0.008); let eph = 0, cph = 0;
      const off = lab.onFrame(dt => {
        if (ringKey !== S.ring) { ringKey = S.ring; buildRing(); }
        let x = 0, y = CT + S.z + 0.005;
        if (S.state === 'fly') x = S.flyX; if (S.state === 'off') { x = 0.2; y = 0.005; }
        ringG.position.set(x, y, 0); ringG.rotation.z = S.state === 'off' ? 0 : 0;
        const h = Math.max(0, (S.T - 200) / 400); ringMat.emissive.setRGB(h, h * 0.25, 0);
        const U = S.mode === 'ac' ? S.Uac : S.Udc; disp.draw(fmt(U, S.mode === 'ac' ? 0 : 1), S.mode === 'ac' ? 'V~' : 'V'); lampM.color.set(S.on ? 0xff3b2a : 0x5a1a14);
        knob.rotation.y = 2.4 - (S.mode === 'ac' ? S.Uac / 230 : S.Udc / 40) * 4.8;
        modelG.visible = MM.model; if (!MM.model) return;
        lineMat.opacity = Math.min(0.5, Math.abs(S.I) / (S.mode === 'ac' ? 7 : 20) * 1.2);
        const rg = ring(), p0 = new THREE.Vector3(x - 0.05, y, 0.02);
        aF.visible = S.state !== 'off'; if (aF.visible) aF.set(p0, new THREE.Vector3(0, Math.max(-0.15, Math.min(0.15, S.F / (rg.m * G) * 0.05)), 0));
        aG.visible = S.state !== 'off'; if (aG.visible) aG.set(new THREE.Vector3(x - 0.05, y, -0.02), new THREE.Vector3(0, -0.05, 0));
        eph += dt * Math.sign(S.Ir) * Math.min(3, Math.abs(S.Ir) / 400); cph += dt * Math.sign(S.I) * Math.min(3, Math.abs(S.I) / 2);
        ePool.items.forEach((s, i) => { const a = i / 16 * Math.PI * 2 + eph; s.visible = Math.abs(S.Ir) > 5 && S.state !== 'off'; s.position.set(x + 0.025 * Math.cos(a), y, 0.025 * Math.sin(a)); });
        cPool.items.forEach((s, i) => { const a = (i % 10) / 10 * Math.PI * 2 + cph; s.visible = Math.abs(S.I) > 0.05; s.position.set(0.073 * Math.cos(a), B0 + 0.04 + Math.floor(i / 10) * 0.08, 0.073 * Math.sin(a)); });
      });
      return { destroy() { off(); lab.dispose(); } };
    }

    // ======================= Grundversuch: hängender Ring =======================
    const svgH = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Thomsonscher Ringversuch: Aluminiumring hängt an zwei Fäden neben einer waagerechten Spule mit langem Eisenkern">
<defs>
  <linearGradient id="hBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2024"/><stop offset="1" stop-color="#121518"/></linearGradient>
  <linearGradient id="hCu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b3612"/><stop offset=".35" stop-color="#e3a46e"/><stop offset=".6" stop-color="#b8692f"/><stop offset="1" stop-color="#5a2c0e"/></linearGradient>
  <linearGradient id="hFe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2f33"/><stop offset=".5" stop-color="#6a737a"/><stop offset="1" stop-color="#2a2f33"/></linearGradient>
  <linearGradient id="hAl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d969c"/><stop offset=".5" stop-color="#eef2f4"/><stop offset="1" stop-color="#8d969c"/></linearGradient>
  <filter id="hSh" x="-10%" y="-10%" width="130%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity=".55"/></filter>
  <marker id="hArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="context-stroke"/></marker>
</defs>
<rect width="1000" height="620" fill="url(#hBg)"/>
<rect x="0" y="560" width="1000" height="60" fill="#25292c"/>
<g id="hField" fill="none" stroke="#86dcff" stroke-width="1.3" opacity="0"></g>
<rect x="300" y="60" width="190" height="10" rx="3" fill="#9aa0a6"/><rect x="300" y="60" width="10" height="500" fill="#9aa0a6"/>
<rect x="150" y="408" width="510" height="24" fill="url(#hFe)"/>
<rect x="480" y="360" width="160" height="120" rx="6" fill="url(#hCu)" filter="url(#hSh)"/>
<g stroke="#4a250c" stroke-width="1" opacity=".55" id="hWind"></g>
<text x="560" y="424" fill="#fff3e4" font-size="12" text-anchor="middle">500 Wdg.</text>
<rect x="500" y="480" width="20" height="80" fill="#6b5139"/><rect x="600" y="480" width="20" height="80" fill="#6b5139"/>
<rect x="160" y="432" width="16" height="128" fill="#6b5139"/>
<g id="hCoilSym"></g>
<rect x="300" y="452" width="180" height="18" fill="#efece4"/><g id="hScale" stroke="#333" font-size="9" fill="#333"></g>
<line id="hT1" stroke="#ddd" stroke-width="1"/><line id="hT2" stroke="#ddd" stroke-width="1" stroke-dasharray="3 2"/>
<rect id="hRing" width="10" height="55" rx="3" fill="url(#hAl)" stroke="#5d646a"/>
<g id="hRingSym"></g>
<line id="hF" stroke="#ff7a8a" stroke-width="3" marker-end="url(#hArr)" opacity="0"/><text id="hFt" fill="#ff7a8a" font-size="12" opacity="0"></text>
<text id="hHot" fill="#ff9a5a" font-size="12" text-anchor="middle"></text>
<rect x="700" y="380" width="260" height="150" rx="10" fill="#2b3034" filter="url(#hSh)"/>
<text x="714" y="400" fill="#c9c3ba" font-size="12">Akku mit Taster</text>
<rect x="714" y="408" width="120" height="38" rx="4" fill="#160807"/><text id="hU" x="826" y="436" fill="#ff5a3c" font-size="22" font-family="IBM Plex Mono, monospace" text-anchor="end"></text>
<rect id="hBtn" x="860" y="410" width="80" height="40" rx="8" fill="#5a1a14" stroke="#222"/><text x="900" y="436" fill="#fff" font-size="12" text-anchor="middle">Taster</text>
<path d="M700 470 C640 470 660 520 640 470" stroke="#c4231b" stroke-width="3" fill="none"/>
<rect x="700" y="250" width="260" height="110" rx="10" fill="#d7d2c4" filter="url(#hSh)"/>
<text x="714" y="270" fill="#333" font-size="11">Spulenstrom</text>
<rect x="714" y="278" width="232" height="32" rx="3" fill="#1d2a1d"/><text id="hI" x="938" y="302" fill="#b7ffd6" font-size="17" font-family="IBM Plex Mono, monospace" text-anchor="end"></text>
<text id="hX" x="714" y="332" fill="#333" font-size="12" font-family="IBM Plex Mono, monospace"></text>
<text id="hXm" x="714" y="350" fill="#333" font-size="12" font-family="IBM Plex Mono, monospace"></text>
<text id="hPh" x="30" y="600" fill="#ffd27a" font-size="15"></text>
<g id="hPlot" opacity="0">
  <rect x="700" y="40" width="270" height="190" rx="8" fill="#0b0d0f" stroke="#2a3238"/>
  <line x1="712" y1="135" x2="960" y2="135" stroke="#2a3238"/>
  <path id="hPI" fill="none" stroke="#f2ac74" stroke-width="1.8"/><path id="hPR" fill="none" stroke="#86dcff" stroke-width="1.8"/><path id="hPX" fill="none" stroke="#7fd6a0" stroke-width="1.8"/>
  <text x="712" y="58" fill="#f2ac74" font-size="11">I Spule</text><text x="770" y="58" fill="#86dcff" font-size="11">I Ring</text><text x="822" y="58" fill="#7fd6a0" font-size="11">Auslenkung x</text>
  <text x="712" y="222" fill="#8e979d" font-size="10">letzte 3 s</text>
</g>
<text id="hModT" x="30" y="578" fill="#c7c1b7" font-size="12" opacity="0">⊙ / ⊗ Stromrichtung · blau: Feldlinien · rot: Kraft auf den Ring</text>
</svg>`;
    const sym2 = (x, y, r, s) => s > 0 ? `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#111" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="2" fill="#111"/>` : `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#111" stroke-width="1.6"/><path d="M${x - r * .6} ${y - r * .6} L${x + r * .6} ${y + r * .6} M${x + r * .6} ${y - r * .6} L${x - r * .6} ${y + r * .6}" stroke="#111" stroke-width="1.6"/>`;
    async function view2dH(box, MM) {
      box.insertAdjacentHTML('beforeend', svgH());
      const svg = box.querySelector('svg'), q = id => svg.querySelector('#' + id);
      const XE = 480, SC = 1000, XR0 = XE - D0 * SC - 5;
      { let h = ''; for (let x = 484; x < 638; x += 5) h += `<line x1="${x}" y1="362" x2="${x}" y2="478"/>`; q('hWind').innerHTML = h; }
      { let h = ''; for (let c = 0; c <= 17; c++) { const x = XE - c * 10; h += `<line x1="${x}" y1="452" x2="${x}" y2="${c % 5 ? 458 : 462}"/>`; if (c % 5 === 0) h += `<text x="${x}" y="469" text-anchor="middle" stroke="none">${c}</text>`; } q('hScale').innerHTML = h; }
      { let h = ''; for (let k = 1; k <= 4; k++) for (const s of [-1, 1]) h += `<path d="M150 ${420 + s * 6 * k} C ${150 - 15 * k} ${420 + s * 42 * k}, ${660 + 25 * k} ${420 + s * 42 * k}, 660 ${420 + s * 4 * k}"/>`; for (let k = 1; k <= 3; k++) for (const s of [-1, 1]) h += `<path d="M${470 - 40 * k} ${420 + s * 13} C ${450 - 40 * k} ${420 + s * 26 * k}, ${600} ${420 + s * 32 * k}, 660 ${420 + s * 8}"/>`; q('hField').innerHTML = h; }
      let raf = 0;
      function frame() {
        raf = requestAnimationFrame(frame);
        const model = MM.model, rg = ring(), x = S.z, xr = XR0 - x * SC, lift = x * x / (2 * LP) * SC, ry = 392.5 - lift;
        q('hRing').setAttribute('x', xr - 5); q('hRing').setAttribute('y', ry);
        q('hRing').setAttribute('fill', S.T < -50 ? '#e8f4ff' : rg.slit ? '#9aa4aa' : S.ring === 'cu' ? '#d8935a' : 'url(#hAl)');
        q('hT1').setAttribute('x1', XR0); q('hT1').setAttribute('y1', 70); q('hT1').setAttribute('x2', xr); q('hT1').setAttribute('y2', ry);
        q('hT2').setAttribute('x1', XR0 + 4); q('hT2').setAttribute('y1', 70); q('hT2').setAttribute('x2', xr + 4); q('hT2').setAttribute('y2', ry);
        q('hHot').setAttribute('x', xr); q('hHot').setAttribute('y', ry - 10); q('hHot').textContent = S.T < -100 ? 'kalt' : rg.slit ? 'geschlitzt' : '';
        q('hU').textContent = `${fmt(S.Ub, 1)} V`; q('hBtn').setAttribute('fill', S.on ? '#e04a3a' : '#5a1a14');
        q('hI').textContent = `${fmt(S.I, 2)} A`;
        q('hX').textContent = `Auslenkung x = ${fmt(Math.max(0, x) * 100, 1)} cm`; q('hXm').textContent = S.tTurn != null ? `größte: ${fmt(S.xmax * 100, 1)} cm nach ${fmt(S.tTurn * 1000, 0)} ms` : 'größte: –';
        q('hPh').textContent = PHASE[S.phase] || '';
        q('hField').setAttribute('opacity', model ? Math.min(0.85, Math.abs(S.I) / 2.4).toFixed(2) : 0); q('hPlot').setAttribute('opacity', model ? 1 : 0); q('hModT').setAttribute('opacity', model ? 1 : 0);
        let cs = '', rs = '';
        if (model) {
          if (Math.abs(S.I) > 0.03) for (let k = 0; k < 4; k++) { const xx = 500 + k * 40; cs += sym2(xx, 366, 6, S.I > 0 ? 1 : -1) + sym2(xx, 474, 6, S.I > 0 ? -1 : 1); }
          if (Math.abs(S.Ir) > 3) rs += sym2(xr, ry + 2, 6, S.Ir > 0 ? 1 : -1) + sym2(xr, ry + 53, 6, S.Ir > 0 ? -1 : 1);
          const fl = Math.max(-140, Math.min(140, S.F * 300));
          q('hF').setAttribute('x1', xr); q('hF').setAttribute('x2', xr - fl); q('hF').setAttribute('y1', ry - 18); q('hF').setAttribute('y2', ry - 18); q('hF').setAttribute('opacity', Math.abs(fl) > 3 ? 1 : 0);
          q('hFt').setAttribute('x', xr - fl - (fl > 0 ? 70 : -6)); q('hFt').setAttribute('y', ry - 24); q('hFt').textContent = `F = ${fmt(Math.abs(S.F) * 1000, 0)} mN`; q('hFt').setAttribute('opacity', Math.abs(fl) > 3 ? 1 : 0);
          const h = S.hist, n = h.length;
          if (n > 2) { const mI = Math.max(0.1, ...h.map(p => Math.abs(p[1]))), mR = Math.max(1, ...h.map(p => Math.abs(p[2]))), mX = Math.max(0.005, ...h.map(p => Math.abs(p[4] ?? 0)));
            const XP = i => 712 + i / (n - 1) * 248, mk = (k, m) => h.map((p, i) => `${i ? 'L' : 'M'}${XP(i).toFixed(1)} ${(135 - (p[k] ?? 0) / m * 70).toFixed(1)}`).join('');
            q('hPI').setAttribute('d', mk(1, mI)); q('hPR').setAttribute('d', mk(2, mR)); q('hPX').setAttribute('d', mk(4, mX)); }
        } else { q('hF').setAttribute('opacity', 0); q('hFt').setAttribute('opacity', 0); }
        q('hCoilSym').innerHTML = cs; q('hRingSym').innerHTML = rs;
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); } };
    }
    async function view3dH(box, MM) {
      const { createLab, mats, cable, label, arrow, glowPool, powerSupply } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [-0.05, 0.42, 0.78], target: [-0.08, 0.16, 0], table: [1.6, 1.2], bloom: [0.5, 0.4, 0.9], room: 0.6, minDist: 0.2, maxDist: 2.2, fov: 38 });
      const { THREE, scene } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad · Taster in der Bedienleiste gedrückt halten</div>');
      const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; scene.add(m); return m; };
      const YA = 0.08, XE = 0;                                    // Kernachse, Spulenende (Ringseite)
      const wood = new THREE.MeshStandardMaterial({ color: 0x6b5139, roughness: 0.8 });
      add(new THREE.BoxGeometry(0.02, YA - 0.06, 0.08), wood, 0.03, (YA - 0.06) / 2, 0); add(new THREE.BoxGeometry(0.02, YA - 0.06, 0.08), wood, 0.13, (YA - 0.06) / 2, 0); add(new THREE.BoxGeometry(0.016, YA - 0.012, 0.03), wood, -0.31, (YA - 0.012) / 2, 0);
      const coil = add(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 48), M.copper, 0.08, YA, 0); coil.rotation.z = Math.PI / 2;
      add(new THREE.BoxGeometry(0.51, 0.024, 0.024), new THREE.MeshStandardMaterial({ color: 0x4a5258, metalness: 0.7, roughness: 0.4 }), -0.075, YA, 0);
      // Galgen
      add(new THREE.BoxGeometry(0.01, 0.48, 0.01), M.steel, 0.065, 0.24, -0.1); add(new THREE.BoxGeometry(0.01, 0.01, 0.12), M.steel, 0.065, 0.48, -0.04); add(new THREE.BoxGeometry(0.2, 0.008, 0.008), M.steel, -0.03, 0.48, 0.0);
      const ringG = new THREE.Group(); scene.add(ringG);
      const alM = () => new THREE.MeshStandardMaterial({ color: new THREE.Color(ring().col), metalness: 0.9, roughness: 0.28 });
      let rk = '';
      function buildR() { ringG.clear(); const rg = ring(), m = alM(), th0 = rg.slit ? 0.1 : 0, tl = rg.slit ? Math.PI * 2 - 0.2 : Math.PI * 2;
        for (const r of [0.0275, 0.0225]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.01, 48, 1, true, th0, tl), m); c.material.side = THREE.DoubleSide; ringG.add(c); }
        for (const y of [-0.005, 0.005]) { const t = new THREE.Mesh(new THREE.RingGeometry(0.0225, 0.0275, 48, 1, th0, tl), m); t.rotation.x = -Math.PI / 2; t.position.y = y; t.material.side = THREE.DoubleSide; ringG.add(t); }
        ringG.rotation.z = Math.PI / 2; }
      const thr = [new THREE.Vector3(), new THREE.Vector3()].map(() => { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xdddddd })); scene.add(l); return l; });
      // Maßstab
      const scv = document.createElement('canvas'); scv.width = 512; scv.height = 48; const sg = scv.getContext('2d'); sg.fillStyle = '#efece4'; sg.fillRect(0, 0, 512, 48); sg.fillStyle = '#222'; sg.font = '18px "IBM Plex Sans"';
      for (let c = 0; c <= 17; c++) { const x = 500 - c * 28; sg.fillRect(x, 0, 2, c % 5 ? 12 : 22); if (c % 5 === 0) sg.fillText(String(c), x - 6, 42); }
      const stx = new THREE.CanvasTexture(scv); stx.colorSpace = THREE.SRGBColorSpace;
      const ruler = add(new THREE.PlaneGeometry(0.183, 0.017), new THREE.MeshStandardMaterial({ map: stx }), -0.09, YA - 0.045, 0.035); ruler.rotation.x = -0.4;
      const ak = powerSupply(THREE, { label: 'Akku · Taster', displays: 2, knobs: 1, w: 0.22, h: 0.12, d: 0.16 }); ak.position.set(0.32, 0, 0.05); ak.rotation.y = -0.5; scene.add(ak);
      scene.add(cable(THREE, ak.socketWorld(0), new THREE.Vector3(0.16, YA - 0.04, 0.03), 0xc4231b, 0.03), cable(THREE, ak.socketWorld(1), new THREE.Vector3(0.16, YA - 0.04, -0.03), 0x151515, 0.03));
      const modelG = new THREE.Group(); scene.add(modelG);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x86dcff, transparent: true, opacity: 0.5, toneMapped: false });
      for (let k = 1; k <= 3; k++) for (let j = 0; j < 6; j++) { const a = j / 6 * Math.PI * 2, r = 0.04 * k;
        const c = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.33, YA, 0), new THREE.Vector3(-0.34, YA + r * Math.cos(a), r * Math.sin(a)), new THREE.Vector3(-0.08, YA + 1.6 * r * Math.cos(a), 1.6 * r * Math.sin(a)), new THREE.Vector3(0.2, YA + r * Math.cos(a), r * Math.sin(a)), new THREE.Vector3(0.17, YA, 0)]);
        modelG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(40)), lineMat)); }
      const aF = arrow(THREE, 0xff7a8a, { radius: 0.0025, head: 0.016 }); modelG.add(aF);
      const ePool = glowPool(THREE, modelG, 16, 0x86dcff, 0.008); let eph = 0;
      const off = lab.onFrame(dt => {
        if (rk !== S.ring) { rk = S.ring; buildR(); }
        const x = S.z, rx = XE - D0 - 0.005 - x, lift = x * x / (2 * LP);
        ringG.position.set(rx, YA + lift, 0);
        thr.forEach((l, i) => l.geometry.setFromPoints([new THREE.Vector3(XE - D0 - 0.005, 0.48, (i ? 1 : -1) * 0.02), new THREE.Vector3(rx, YA + lift + 0.0275, (i ? 1 : -1) * 0.006)]));
        ak.displays[0].draw(fmt(S.Ub, 1), 'V'); ak.displays[1].draw(fmt(S.I, 2), 'A');
        modelG.visible = MM.model; if (!MM.model) return;
        lineMat.opacity = Math.min(0.6, Math.abs(S.I) / 2.4 * 0.7);
        aF.visible = Math.abs(S.F) > 0.003; if (aF.visible) aF.set(new THREE.Vector3(rx, YA + lift + 0.05, 0), new THREE.Vector3(-Math.max(-0.15, Math.min(0.15, S.F * 0.3)), 0, 0));
        eph += dt * Math.sign(S.Ir) * Math.min(3, Math.abs(S.Ir) / 300);
        ePool.items.forEach((sp, i) => { const a = i / 16 * Math.PI * 2 + eph; sp.visible = Math.abs(S.Ir) > 3; sp.position.set(rx, YA + lift + 0.025 * Math.cos(a), 0.025 * Math.sin(a)); });
      });
      return { destroy() { off(); lab.dispose(); } };
    }

    const host = viewHost(stage, { id: 'thomson-ring', views: { '2d': (b, m) => H() ? view2dH(b, m) : view2d(b, m), '3d': (b, m) => H() ? view3dH(b, m) : view3d(b, m) }, initial: '3d', modelInfo: 'Feldlinien, Ströme, Kräfte' });
    hostRef = host;
    gQ.hidden = true; gD.hidden = true; cH.hidden = true; S.mode = 'dc';

    // Physik
    const DT = 2e-5, W = 2 * Math.PI * 50;
    let raf = 0, last = performance.now(), slow = 0, histAcc = 0, ieAcc = 0, ieN = 0;
    function stepH() {
      const rg = ring();
      if (S.on && !S.onStep) { S.tOn = S.t; S.irec = []; } S.onStep = S.on;
      S.I += ((S.on ? S.Ub : 0) - RC_H * S.I) / LC_H * DT;
      const d = D0 + S.z, Mz = M0H * Math.exp(-d / LAMH), Psi = Mz * S.I, dPsi = (Psi - S.Psi) / DT; S.Psi = Psi;
      const R = Rr();
      if (R === Infinity) S.Ir = 0; else S.Ir += (-dPsi - R * S.Ir) / L_R * DT;
      S.F = S.I * S.Ir * (-Mz / LAMH);
      if (R !== Infinity) S.T += S.Ir * S.Ir * R * DT / (rg.m * rg.c);
      S.T += (20 - S.T) / 900 * DT;
      S.v += (S.F / rg.m - G / LP * S.z - 0.3 * S.v) * DT; S.z += S.v * DT;
      if (S.z < -0.009) { S.z = -0.009; S.v = -0.3 * S.v; }
      S.t += DT;
      if (S.on && S.irec.length < 400 && S.t - S.tOn >= S.irec.length * 0.001) S.irec.push([S.t - S.tOn, S.I, S.Ub]);
    }
    function phases() {
      if (S.on && !S.onPrev) { S.phase = 1; S.xmax = 0; S.tTurn = null; }
      if (!S.on && S.onPrev) { S.offAt = S.t; S.phase = 4; }
      S.onPrev = S.on;
      if (S.on) {
        if (S.phase === 1) { if (S.z > S.xmax) S.xmax = S.z; if (S.v <= 0 && S.t - S.tOn > 0.02) { S.tTurn = S.t - S.tOn; S.phase = S.xmax > 0.001 ? 2 : 3; } }
        else if (S.phase === 2 && S.z < 0.002 && Math.abs(S.v) < 0.005) S.phase = 3;
      } else if (S.phase === 4 && S.t - S.offAt > 0.05 && S.v >= 0) S.phase = 5;
      if (S.irec.length && (S.irec.length >= 400 || !S.on) && S.irec !== S.irecDone) { S.irecDone = S.irec; S.irecShow = S.irec.slice(); drawIH(); }
    }
    function step() {
      if (H()) return stepH();
      const rg = ring();
      const u = !S.on ? 0 : S.mode === 'ac' ? Math.SQRT2 * S.Uac * Math.sin(W * S.t) : S.Udc;
      S.I += (u - RC_ * S.I) / LC * DT;
      const z = S.state === 'core' ? S.z : S.state === 'fly' ? S.z : 1;
      const Mz = M0 * gOf(z), Psi = Mz * S.I, dPsi = (Psi - S.Psi) / DT; S.Psi = Psi;
      const R = Rr();
      if (R === Infinity) S.Ir = 0; else S.Ir += (-dPsi - R * S.Ir) / L_R * DT;
      S.F = S.I * S.Ir * M0 * dgOf(z);
      if (R !== Infinity) S.T += S.Ir * S.Ir * R * DT / (rg.m * rg.c);
      S.T += (20 - S.T) / 900 * DT;
      if (S.state === 'core') {
        if (S.hold) { S.z = 0; S.v = 0; }
        else {
          S.v += (S.F / rg.m - G - 0.6 * S.v) * DT; S.z += S.v * DT;
          if (S.z < 0) { S.z = 0; if (S.v < 0) S.v = 0; }
          if (S.z > CORE + 0.01) { S.state = 'fly'; }
        }
      } else if (S.state === 'fly') {
        S.v -= G * DT; S.z += S.v * DT; S.flyX += 0.25 * DT;
        if (S.v < 0 && S.z < CORE) S.state = 'off';
      }
      if (S.on && S.state !== 'off' && S.z > S.jump) S.jump = S.z;
      S.t += DT;
      ieAcc += S.I * S.I; ieN++;
    }
    function loop(now) {
      raf = requestAnimationFrame(loop);
      let dt = Math.max(0, Math.min(0.04, (now - last) / 1000)); last = now;
      const sim = S.slow ? dt / 5 : dt, n = Math.round(sim / DT);
      for (let i = 0; i < n; i++) {
        step(); histAcc += DT;
        if (histAcc >= (H() ? 0.03 : 0.0006)) { histAcc = 0; S.hist.push([S.t, S.I, S.Ir, S.F, S.z]); if (S.hist.length > 100) S.hist.shift(); }
      }
      if (H()) phases();
      const k = Math.min(1, dt / 0.3); S.zAvg += (S.z - S.zAvg) * k; S.vAvg += (S.v - S.vAvg) * k;
      slow += dt;
      if (slow > 0.2) {
        slow = 0; S.Ieff = ieN ? Math.sqrt(ieAcc / ieN) : 0; ieAcc = 0; ieN = 0;
        dPh.set(PHASE[S.phase] || '–'); dX.set(`${fmt(Math.max(0, S.z) * 100, 1)} cm`); dXm.set(S.tTurn != null ? `${fmt(S.xmax * 100, 1)} cm · ${fmt(S.tTurn * 1000, 0)} ms` : '–');
        dZ.set(S.state === 'core' ? `${fmt(S.zAvg * 100, 1)} cm` : 'vom Kern geflogen'); dJ.set(`${fmt(S.jump * 100, 1)} cm`); dT.set(`${fmt(S.T, 0)} °C`);
        if (S.T > 600 && S.hold) { S.hold = false; cH.set(false); toast('Der Ring ist fast geschmolzen. Er wurde losgelassen.'); }
      }
    }
    raf = requestAnimationFrame(loop);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); chA.destroy(); chD.destroy(); chIH.destroy(); } };
  }
};
