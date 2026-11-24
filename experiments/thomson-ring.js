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
  intro: 'Ein Aluminiumring liegt auf dem langen Eisenkern einer Spule. Schaltet man den Strom ein, springt der Ring hoch. Mit Wechselspannung schwebt er. Ihr untersucht, wovon Sprunghöhe und Schwebehöhe abhängen, und erklärt das mit dem Induktionsgesetz und der Lenzschen Regel.',
  docs: {
    durchfuehrung: `
<h3>Aufbau</h3>
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
<ul><li>Die Gegeninduktivität fällt längs des Kerns exponentiell ab (Abklinglänge λ = 8 cm), über dem Kernende viel schneller.</li><li>Die Rückwirkung des Ringstroms auf den Spulenstrom ist vernachlässigt.</li><li>Ring: 5 mm × 10 mm Querschnitt, mittlerer Radius 2,5 cm, L_R = 60 nH.</li></ul>
<h3>Was die Modellansicht zeigt</h3>
<ul><li>Die Feldlinien des Spulenfelds. Ihre Helligkeit folgt der Stromstärke.</li><li>Die Stromrichtung in Spule und Ring. Sie ist meist entgegengesetzt.</li><li>Kraft auf den Ring und Gewichtskraft als Pfeile, dazu den Verlauf von Spulenstrom, Ringstrom und Kraft in Zeitlupe.</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Spule</td><td>500 Windungen, R = 2 Ω, L = 0,15 H (mit Kern), Höhe 16 cm</td></tr>
<tr><td>Eisenkern</td><td>geblättert, ragt 30 cm aus der Spule</td></tr>
<tr><td>Spannung</td><td>Stelltransformator 0 … 230 V~ (50 Hz) oder Netzgerät 0 … 40 V=</td></tr>
<tr><td>Ringe</td><td>Aluminium 21 g, Aluminium geschlitzt, Kupfer 70 g, Aluminium gekühlt (−196 °C)</td></tr>
<tr><td>Maßstab</td><td>0 … 30 cm über der Spule</td></tr>
</tbody></table>`,
    abi: `
<details class="q"><summary>Erkläre, warum der Ring beim Einschalten nach oben springt. <span class="op">AFB II</span></summary><p>Der Fluss durch den Ring nimmt zu. Im Ring wird ein Strom induziert, der nach Lenz der Zunahme entgegenwirkt, also dem Spulenstrom entgegengesetzt fließt. Entgegengesetzte Ströme stoßen sich ab. Weil das Feld am Ring auseinanderläuft, hat die Lorentzkraft eine Komponente nach oben.</p></details>
<details class="q"><summary>Warum bleibt der geschlitzte Ring liegen? <span class="op">AFB I</span></summary><p>Es wird zwar eine Spannung induziert, aber der Stromkreis ist offen. Ohne Strom wirkt keine Kraft.</p></details>
<details class="q"><summary>Begründe, warum ein gekühlter Ring höher schwebt. <span class="op">AFB II</span></summary><p>Der Widerstand des Metalls sinkt stark mit der Temperatur. Bei gleicher induzierter Spannung fließt ein größerer Strom, und der Strom ist besser gegenphasig zum Spulenstrom. Die mittlere Kraft wird größer, das Gleichgewicht mit der Gewichtskraft liegt weiter oben, wo das Feld schwächer ist.</p></details>
<details class="q"><summary>Erkläre mit der Energieerhaltung, warum ein festgehaltener Ring heiß wird. <span class="op">AFB III</span></summary><p>Der Ring nimmt über die Induktion Energie aus dem Feld der Spule auf. Da er sich nicht bewegen kann, wird keine mechanische Arbeit verrichtet. Die ganze Leistung I_R²·R wird im Ring in Wärme umgesetzt, und sie ist am Ort des stärksten Feldes am größten.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, segmented, check, button, fmt, dataTable, toast, display } = ui;
    const S = { mode: 'ac', Uac: 150, Udc: 40, on: false, ring: 'al', hold: false, slow: false, t: 0, I: 0, Ir: 0, Psi: 0, z: 0, v: 0, T: 20, state: 'core',
      jump: 0, zAvg: 0, vAvg: 0, Ieff: 0, hist: [], F: 0, flyX: 0 };
    const ring = () => RINGS[S.ring];
    const Rr = () => ring().slit ? Infinity : ring().R * Math.max(0.12, 1 + ring().a * (S.T - 20));
    function resetRing() { S.z = 0; S.v = 0; S.Ir = 0; S.Psi = M0 * gOf(0) * S.I; S.T = ring().T0; S.state = 'core'; S.jump = 0; S.zAvg = 0; S.vAvg = 0; S.flyX = 0; }

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
    controls.append(gQ, gR, gD);

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

    const host = viewHost(stage, { id: 'thomson-ring', views: { '2d': view2d, '3d': view3d }, initial: '3d', modelInfo: 'Feldlinien, Ströme, Kräfte' });

    // Physik
    const DT = 2e-5, W = 2 * Math.PI * 50;
    let raf = 0, last = performance.now(), slow = 0, histAcc = 0, ieAcc = 0, ieN = 0;
    function step() {
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
        if (histAcc >= 0.0006) { histAcc = 0; S.hist.push([S.t, S.I, S.Ir, S.F]); if (S.hist.length > 100) S.hist.shift(); }
      }
      const k = Math.min(1, dt / 0.3); S.zAvg += (S.z - S.zAvg) * k; S.vAvg += (S.v - S.vAvg) * k;
      slow += dt;
      if (slow > 0.2) {
        slow = 0; S.Ieff = ieN ? Math.sqrt(ieAcc / ieN) : 0; ieAcc = 0; ieN = 0;
        dZ.set(S.state === 'core' ? `${fmt(S.zAvg * 100, 1)} cm` : 'vom Kern geflogen'); dJ.set(`${fmt(S.jump * 100, 1)} cm`); dT.set(`${fmt(S.T, 0)} °C`);
        if (S.T > 600 && S.hold) { S.hold = false; cH.set(false); toast('Der Ring ist fast geschmolzen. Er wurde losgelassen.'); }
      }
    }
    raf = requestAnimationFrame(loop);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); chA.destroy(); chD.destroy(); } };
  }
};
