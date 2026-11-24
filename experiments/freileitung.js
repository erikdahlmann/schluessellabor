// ============================================================================
//  Schlüsselexperiment: Modellexperiment zu Freileitungen
//  Netzgerät (Wechselspannung) → [Trafo 1:k] → Leitung R_L → [Trafo k:1] → Lampe 6 V / 3 W
//  Ersatzschaltung, alles auf die Leitungsseite bezogen:
//   I_L = k·U0 / ( k²(R_i + 2R_w) + R_L + 2R_w·k² + k²·R_Lampe )
//  Lampe: Glühfaden, R = R_n·(U/U_n)^0,45 (kalt kleiner). Eisenverluste je Trafo 0,25 W.
// ============================================================================
import { viewHost } from '../js/lib/views.js';

const R_I = 0.1, R_W = 0.15, P_FE = 0.25, U_N = 6, R_N = 12, U_BURN = 8.2;
const TRAFO = { 0: 'ohne Trafo', 5: '1 : 5', 10: '1 : 10' };

function solve(U0, k, RL, burnt) {
  let Rl = R_N, r = null;
  for (let it = 0; it < 80; it++) {
    const Rlamp = burnt ? 1e9 : Rl;
    let IL, Ulamp, Ilamp, Isrc, UA, UE;
    if (!k) { IL = U0 / (R_I + RL + Rlamp); Ilamp = Isrc = IL; Ulamp = IL * Rlamp; UA = U0 - IL * R_I; UE = Ulamp; }
    else {
      IL = k * U0 / (k * k * (R_I + 2 * R_W) + RL + 2 * R_W * k * k + k * k * Rlamp);
      Ilamp = Isrc = IL * k; Ulamp = Ilamp * Rlamp; UA = k * U0 - IL * k * k * (R_I + 2 * R_W); UE = UA - IL * RL;
    }
    r = { IL, Ulamp, Ilamp: burnt ? 0 : Ilamp, Isrc, UA, UE, U1: U0 - Isrc * R_I };
    const Rn = R_N * Math.pow(Math.max(0.12, Ulamp / U_N), 0.45); Rl = 0.5 * Rl + 0.5 * Rn;
  }
  const Pfe = k ? 2 * P_FE : 0;
  r.Pin = r.U1 * r.Isrc + Pfe; r.Plamp = burnt ? 0 : r.Ulamp * r.Ilamp; r.Pline = r.IL * r.IL * RL;
  r.Pt1 = k ? r.Isrc * r.Isrc * R_W + r.IL * r.IL * R_W * k * k + P_FE : 0;
  r.Pt2 = k ? r.IL * r.IL * R_W * k * k + r.Ilamp * r.Ilamp * R_W + P_FE : 0;
  r.eta = r.Pin > 1e-6 ? r.Plamp / r.Pin : 0;
  return r;
}

const svgMarkup = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Modell einer Freileitung von oben: Netzgerät, Transformator, lange Leitung, Transformator, Lampe und vier Messgeräte">
<defs>
  <linearGradient id="fBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2024"/><stop offset="1" stop-color="#121518"/></linearGradient>
  <linearGradient id="fWood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6b5139"/><stop offset="1" stop-color="#4a3826"/></linearGradient>
  <linearGradient id="fCu" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0b07a"/><stop offset=".5" stop-color="#b8692f"/><stop offset="1" stop-color="#6b3612"/></linearGradient>
  <radialGradient id="fLamp"><stop offset="0" stop-color="#fff6d8"/><stop offset=".4" stop-color="#ffd27a"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
  <filter id="fSh" x="-10%" y="-10%" width="130%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity=".55"/></filter>
  <filter id="fGl"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="1000" height="620" fill="url(#fBg)"/>
<rect x="160" y="220" width="690" height="180" rx="8" fill="url(#fWood)" filter="url(#fSh)"/>
<text x="170" y="214" fill="#8e979d" font-size="12">Blick von oben</text>
<!-- Netzgerät -->
<rect x="20" y="236" width="120" height="150" rx="8" fill="#2b3034" filter="url(#fSh)"/>
<text x="32" y="256" fill="#c9c3ba" font-size="11">Netzgerät ~</text>
<rect x="32" y="264" width="96" height="34" rx="4" fill="#160807"/><text id="fU0" x="122" y="289" fill="#ff5a3c" font-size="20" font-family="IBM Plex Mono, monospace" text-anchor="end"></text>
<circle cx="56" cy="352" r="7" fill="#c4231b"/><circle cx="104" cy="352" r="7" fill="#151515" stroke="#555"/>
<!-- Leitungen -->
<g id="fWires" stroke-linecap="round" fill="none"></g>
<g id="fT1"><rect x="190" y="250" width="100" height="120" rx="4" fill="#5d646a"/><rect x="198" y="258" width="84" height="104" fill="#3b4146"/>
  <rect x="186" y="272" width="44" height="76" rx="6" fill="url(#fCu)"/><rect x="250" y="268" width="44" height="84" rx="6" fill="url(#fCu)"/>
  <text id="fT1a" x="208" y="386" fill="#e6c9a8" font-size="11" text-anchor="middle"></text><text id="fT1b" x="272" y="386" fill="#e6c9a8" font-size="11" text-anchor="middle"></text></g>
<g id="fT2"><rect x="720" y="250" width="100" height="120" rx="4" fill="#5d646a"/><rect x="728" y="258" width="84" height="104" fill="#3b4146"/>
  <rect x="716" y="268" width="44" height="84" rx="6" fill="url(#fCu)"/><rect x="780" y="272" width="44" height="76" rx="6" fill="url(#fCu)"/>
  <text id="fT2a" x="738" y="386" fill="#e6c9a8" font-size="11" text-anchor="middle"></text><text id="fT2b" x="802" y="386" fill="#e6c9a8" font-size="11" text-anchor="middle"></text></g>
<g id="fPosts"></g>
<text x="500" y="244" fill="#d8c8b4" font-size="12" text-anchor="middle" id="fLineT"></text>
<text id="fWarn" x="500" y="392" fill="#ffcf3a" font-size="12" text-anchor="middle"></text>
<!-- Lampe -->
<circle id="fGlow" cx="905" cy="310" r="80" fill="url(#fLamp)" opacity="0"/>
<circle cx="905" cy="310" r="22" fill="#e9e3d6" fill-opacity=".25" stroke="#c9c3ba"/>
<path id="fFil" d="M896 318 q9 -22 18 0" stroke="#8e5a2a" fill="none" stroke-width="1.8"/>
<text id="fLampT" x="905" y="352" fill="#8e979d" font-size="11" text-anchor="middle">Lampe 6 V / 3 W</text>
<!-- Messgeräte -->
<g id="fMeters"></g>
<!-- Modell -->
<g id="fDots" opacity="0"></g>
<g id="fSankey" opacity="0"></g>
</svg>`;

export default {
  intro: 'Strom soll über eine lange Leitung zu einer Lampe gebracht werden. Ohne Transformatoren leuchtet die Lampe kaum, weil ein großer Teil der Energie in der Leitung verloren geht. Mit Hochspannung auf der Leitung ist der Strom kleiner, und die Verluste sinken stark. Ihr messt Leistungen und Wirkungsgrad und vergleicht.',
  docs: {
    durchfuehrung: `
<h3>Aufbau</h3>
<p>Auf einem Brett ist eine lange Leitung aus dünnem Widerstandsdraht auf Isolatoren gespannt (Hin- und Rückleitung zusammen R_L = 0 … 40 Ω). Am Anfang liefert ein Netzgerät Wechselspannung, am Ende hängt eine Lampe 6 V / 3 W. Zwei Transformatoren können eingesetzt werden: einer am Anfang setzt die Spannung hoch, einer am Ende wieder herunter. Vier Messgeräte zeigen Effektivwerte von Spannung und Stromstärke am Netzgerät, am Anfang und am Ende der Leitung und an der Lampe.</p>
<h3>Durchführung</h3>
<ol>
<li>Ohne Transformatoren, U₀ = 6 V, R_L = 20 Ω. Helligkeit der Lampe beobachten und alle Messwerte übernehmen.</li>
<li>Transformatoren 1 : 5 einsetzen und wiederholen. Danach 1 : 10.</li>
<li>Für jede Schaltung den Leitungswiderstand verändern (0, 10, 20, 30, 40 Ω) und messen.</li>
<li>Den Wirkungsgrad η = P_Lampe / P_ein für die drei Schaltungen vergleichen.</li>
<li>Prüfen, ob die Verlustleistung in der Leitung proportional zum Quadrat der Stromstärke ist.</li>
</ol>
<p><b>Sicherheit:</b> Mit Trafo 1 : 10 liegen auf der Leitung bis zu 60 V Wechselspannung. Über 25 V ist eine Berührung gefährlich. Im echten Versuch wird die Leitung nur bei ausgeschaltetem Netzgerät angefasst.</p>`,
    theorie: `
<h3>Verluste in der Leitung</h3>
<p>Durch die Leitung fließt der Strom I_L. In ihrem Widerstand wird Leistung in Wärme umgesetzt:</p>
<span class="formula tex">P_\\text{V} = I_L^2\\, R_L</span>
<h3>Warum Hochspannung hilft</h3>
<p>Eine bestimmte Leistung P soll übertragen werden. Bei höherer Spannung auf der Leitung braucht man dafür weniger Strom:</p>
<span class="formula tex">I_L = \\frac{P}{U_L} \\quad\\Rightarrow\\quad P_\\text{V} = \\frac{P^2\\, R_L}{U_L^2}</span>
<p>Zehnfache Spannung bedeutet ein Zehntel der Stromstärke und nur ein Hundertstel der Verluste.</p>
<h3>Transformator</h3>
<p>Für einen idealen Transformator gelten</p>
<span class="formula tex">\\frac{U_2}{U_1} = \\frac{N_2}{N_1} \\qquad \\frac{I_2}{I_1} = \\frac{N_1}{N_2}</span>
<p>Der erste Transformator setzt die Spannung hoch und den Strom herunter, der zweite macht es umgekehrt. Echte Transformatoren haben selbst Verluste: Wärme in den Wicklungen und im Eisenkern.</p>
<h3>Wirkungsgrad</h3>
<span class="formula tex">\\eta = \\frac{P_\\text{Lampe}}{P_\\text{ein}} = \\frac{U_\\text{Lampe}\\, I_\\text{Lampe}}{U_1\\, I_1}</span>
<h3>Glühlampe</h3>
<p>Der Widerstand des Glühfadens hängt von der Temperatur ab. Eine dunkel glimmende Lampe hat einen kleineren Widerstand als eine hell leuchtende.</p>
<h3>Modellgrenzen</h3>
<ul><li>Die Transformatoren sind durch Wicklungswiderstände (je Wicklung R = 0,15 Ω auf der Seite mit wenigen Windungen bezogen) und feste Eisenverluste von 0,25 W beschrieben. Streufluss und Magnetisierungsstrom fehlen.</li>
<li>Alle Spannungen und Ströme sind Effektivwerte. Spannung und Strom sind als phasengleich angenommen.</li>
<li>Das Netzgerät hat einen Innenwiderstand von 0,1 Ω. Bei mehr als etwa 8 V an der Lampe brennt sie durch.</li>
<li>Echte Freileitungen arbeiten mit 110 kV bis 380 kV und mit Drehstrom.</li></ul>
<h3>Was die Modellansicht zeigt</h3>
<ul><li>Punkte auf den Leitungen stehen für die Ladungsträger. Ihre Geschwindigkeit zeigt die Stromstärke. Auf der Hochspannungsseite laufen sie viel langsamer.</li>
<li>Ein Energieflussbild (Sankey-Diagramm): Die Breite der Bänder ist proportional zur Leistung. Nach unten zweigen die Verluste ab.</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Netzgerät</td><td>Wechselspannung 1 … 12 V, Innenwiderstand 0,1 Ω</td></tr>
<tr><td>Transformatoren</td><td>250 → 1250 Windungen (1 : 5) oder 250 → 2500 Windungen (1 : 10), Eisenkern geschlossen</td></tr>
<tr><td>Leitung</td><td>Konstantandraht auf Isolatoren, Hin- und Rückleitung zusammen 0 … 40 Ω</td></tr>
<tr><td>Lampe</td><td>6 V / 3 W (R ≈ 12 Ω im Betrieb)</td></tr>
<tr><td>Messgeräte</td><td>4 Vielfachmessgeräte, Effektivwerte, Messunsicherheit etwa 1 %</td></tr>
</tbody></table>`,
    abi: `
<details class="q"><summary>Erkläre, warum elektrische Energie über weite Strecken mit Hochspannung übertragen wird. <span class="op">AFB II</span></summary><p>Bei gleicher Leistung P = U·I ist die Stromstärke umso kleiner, je größer die Spannung ist. Die Verluste in der Leitung sind P_V = I²·R_L. Sie sinken mit dem Quadrat der Spannung.</p></details>
<details class="q"><summary>Eine Leitung mit R_L = 20 Ω soll 3 W übertragen. Berechne die Verluste bei 6 V und bei 60 V. <span class="op">AFB II</span></summary><p>6 V: I = 0,5 A, P_V = 0,25 A² · 20 Ω = 5 W, also mehr als die übertragene Leistung (deshalb leuchtet die Lampe ohne Trafo kaum). 60 V: I = 0,05 A, P_V = 0,0025 A² · 20 Ω = 0,05 W.</p></details>
<details class="q"><summary>Begründe, warum der Wirkungsgrad mit Transformatoren nie 100 % erreicht, auch bei R_L = 0. <span class="op">AFB I</span></summary><p>Die Transformatoren haben eigene Verluste: Stromwärme in den Wicklungen und Ummagnetisierungs- und Wirbelstromverluste im Eisenkern.</p></details>
<details class="q"><summary>Warum lässt sich das Verfahren nicht mit Gleichspannung durchführen? <span class="op">AFB I</span></summary><p>Ein Transformator braucht einen sich ändernden magnetischen Fluss. Gleichstrom erzeugt im Eisenkern einen konstanten Fluss, und in der zweiten Spule wird keine Spannung induziert.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, segmented, button, fmt, dataTable, toast, display, gauss } = ui;
    const S = { U0: 6, k: 0, RL: 20, on: true, burnt: false, r: null, ver: 0 };
    const recalc = () => { S.r = solve(S.on ? S.U0 : 0, S.k, S.RL, S.burnt); if (!S.burnt && S.r.Ulamp > U_BURN) { S.burnt = true; S.r = solve(S.on ? S.U0 : 0, S.k, S.RL, true); toast('Die Lampe ist durchgebrannt. Spannung verkleinern und neue Lampe einsetzen.'); } S.ver++; };
    // Messgeräte-Anzeige mit kleiner Schwankung (fest je Einstellung)
    let noise = {}; const nz = k => (noise[k] ??= 1 + gauss(0.004));

    const gQ = group('Netzgerät', { led: true }); gQ.led(true);
    const sU = slider({ label: 'Wechselspannung U₀', min: 1, max: 12, step: 0.1, value: S.U0, unit: 'V', digits: 1, onInput: v => { S.U0 = v; noise = {}; recalc(); } });
    const segOn = segmented({ value: 'an', options: [{ value: 'an', label: 'Ein' }, { value: 'aus', label: 'Aus' }], onChange: v => { S.on = v === 'an'; gQ.led(S.on); noise = {}; recalc(); } });
    gQ.append(el('div', { class: 'ctl' }, el('div', { style: 'grid-column:1/-1' }, segOn)), sU);
    const gT = group('Übertragung');
    const segK = segmented({ value: 0, options: [{ value: 0, label: 'ohne Trafo' }, { value: 5, label: 'Trafo 1 : 5' }, { value: 10, label: 'Trafo 1 : 10' }], onChange: v => { S.k = v; noise = {}; recalc(); } });
    const sR = slider({ label: 'Leitungswiderstand R_L', min: 0, max: 40, step: 1, value: S.RL, unit: 'Ω', digits: 0, onInput: v => { S.RL = v; noise = {}; recalc(); } });
    gT.append(el('div', { class: 'ctl' }, el('div', { style: 'grid-column:1/-1' }, segK)), sR, el('div', { class: 'bar' }, button('Neue Lampe einsetzen', () => { S.burnt = false; recalc(); })));
    const gM = group('Messgeräte (Effektivwerte)');
    const dPin = display('Leistung am Netzgerät P_ein'), dPv = display('Verlust in der Leitung P_V'), dPl = display('Leistung der Lampe'), dEta = display('Wirkungsgrad η');
    gM.append(dPin, dPv, dPl, dEta, el('div', { class: 'bar' }, button('Messwerte übernehmen', () => take(), 'btn small primary')));
    controls.append(gQ, gT, gM);

    const meas = () => { const r = S.r; return { U1: S.on ? S.U0 * nz('u1') - r.Isrc * R_I : 0, I1: r.Isrc * nz('i1'), UA: r.UA * nz('ua'), IL: r.IL * nz('il'), UE: r.UE * nz('ue'), U2: r.Ulamp * nz('u2'), I2: r.Ilamp * nz('i2') }; };
    const powers = m => { const Pin = m.U1 * m.I1 + (S.k && S.on ? 2 * P_FE : 0), Pv = m.IL * Math.max(0, m.UA - m.UE), Pl = m.U2 * m.I2; return { Pin, Pv, Pl, eta: Pin > 1e-6 ? Pl / Pin : 0 }; };

    const rows = [];
    const tbl = dataTable([
      { key: 'cfg', label: 'Schaltung', fmt: v => TRAFO[v] }, { key: 'RL', label: 'R_L in Ω', digits: 0 }, { key: 'UA', label: 'U_Leitung in V', digits: 2 }, { key: 'IL', label: 'I_Leitung in mA', fmt: v => fmt(v * 1000, 1) },
      { key: 'Pin', label: 'P_ein in W', digits: 2 }, { key: 'Pv', label: 'P_V in W', digits: 3 }, { key: 'Pl', label: 'P_Lampe in W', digits: 2 }, { key: 'eta', label: 'η in %', fmt: v => fmt(v * 100, 1) }
    ], { onDelete: i => { rows.splice(i, 1); redraw(); } });
    const figE = el('div', { class: 'fig' }), figV = el('div', { class: 'fig' });
    const chE = new Chart(figE, { xlabel: 'R_L in Ω', ylabel: 'η in %' }), chV = new Chart(figV, { xlabel: 'I_L² in A²', ylabel: 'P_V in W' });
    const resE = el('div', { class: 'result' }), resV = el('div', { class: 'result' });
    messwerte.append(
      el('div', { class: 'data' },
        el('div', { class: 'chartbox' }, el('h4', {}, 'Wirkungsgrad über Leitungswiderstand'), figE, resE,
          csvTools(() => ({ meta: ['Freileitung (Modell)', 'Lampe 6 V / 3 W'], columns: [{ key: 'cfgT', label: 'Schaltung' }, { key: 'U0', label: 'U0 in V' }, { key: 'RL', label: 'R_L in Ohm' }, { key: 'UA', label: 'U_Leitung in V' }, { key: 'IL', label: 'I_Leitung in A' }, { key: 'Pin', label: 'P_ein in W' }, { key: 'Pv', label: 'P_V in W' }, { key: 'Pl', label: 'P_Lampe in W' }, { key: 'eta', label: 'eta' }], rows: rows.map(r => ({ ...r, cfgT: TRAFO[r.cfg] })) }), 'freileitung_messreihe')),
        el('div', { class: 'chartbox' }, el('h4', {}, 'Leitungsverlust über I_L²'), figV, resV)),
      el('div', { style: 'height:14px' }), tbl);
    const CC = { 0: '#ff8a7a', 5: '#f2ac74', 10: '#7fd6a0' };
    function redraw() {
      tbl.render(rows);
      const se = []; let te = '';
      for (const k of [0, 5, 10]) {
        const rs = rows.filter(r => r.cfg === k).sort((a, b) => a.RL - b.RL); if (!rs.length) continue;
        se.push({ name: TRAFO[k], color: CC[k], points: rs.map(r => [r.RL, r.eta * 100]) }, { color: CC[k], mode: 'dot', points: rs.map(r => [r.RL, r.eta * 100]) });
        const r20 = rs.find(r => r.RL === 20); if (r20) te += `<div><span>${TRAFO[k]}, R_L = 20 Ω</span><br><b>η = ${fmt(r20.eta * 100, 1)} %</b></div>`;
      }
      chE.set(se); resE.innerHTML = te || '<span>Je Schaltung mehrere Leitungswiderstände messen.</span>';
      const sv = [], fv = []; let tv = '';
      const byR = [...new Set(rows.map(r => r.RL))];
      byR.forEach((R, i) => {
        const rs = rows.filter(r => r.RL === R && r.RL > 0); if (!rs.length) return; const col = ['#86dcff', '#c7b6ff', '#ffd27a', '#7fd6a0', '#f2ac74'][i % 5];
        sv.push({ name: `R_L = ${R} Ω`, color: col, mode: 'dot', points: rs.map(r => [r.IL ** 2, r.Pv]) });
        if (rs.length >= 2) { const f = fit.propFit(rs.map(r => r.IL ** 2), rs.map(r => r.Pv)); if (f) { fv.push({ f: f.f, color: col }); tv += `<div><span>R_L = ${R} Ω (eingestellt)</span><br><b>Steigung ${fmt(f.a, 1)} Ω</b></div>`; } }
      });
      chV.set(sv, fv); resV.innerHTML = tv || '<span>Bei gleichem R_L mehrere Schaltungen messen. Die Steigung ist dann R_L.</span>';
    }
    redraw();
    function take() {
      if (!S.on) { toast('Das Netzgerät ist aus.'); return; }
      const m = meas(), p = powers(m);
      rows.push({ cfg: S.k, U0: S.U0, RL: S.RL, UA: m.UA, IL: m.IL, ...p }); redraw();
      toast(`Übernommen: ${TRAFO[S.k]}, R_L = ${S.RL} Ω, η = ${fmt(p.eta * 100, 1)} %`);
    }
    recalc();

    // ======================= Ansicht 2D =======================
    async function view2d(box, MM) {
      box.insertAdjacentHTML('beforeend', svgMarkup());
      const svg = box.querySelector('svg'), q = id => svg.querySelector('#' + id);
      const YA = 285, YB = 335;               // Hin- und Rückleitung
      const meterSvg = (id, x, y, title) => `<g transform="translate(${x} ${y})"><rect width="150" height="${id === 'mE' ? 56 : 86}" rx="8" fill="#d7d2c4" filter="url(#fSh)"/><text x="10" y="17" fill="#333" font-size="11">${title}</text>
        <rect x="10" y="24" width="130" height="26" rx="3" fill="#1d2a1d"/><text id="${id}u" x="134" y="43" fill="#b7ffd6" font-size="15" font-family="IBM Plex Mono, monospace" text-anchor="end"></text>
        ${id === 'mE' ? '' : `<rect x="10" y="54" width="130" height="26" rx="3" fill="#1d2a1d"/><text id="${id}i" x="134" y="73" fill="#b7ffd6" font-size="15" font-family="IBM Plex Mono, monospace" text-anchor="end"></text>`}</g>`;
      q('fMeters').innerHTML = meterSvg('m1', 10, 430, 'Netzgerät') + meterSvg('mA', 300, 430, 'Anfang der Leitung') + meterSvg('mE', 560, 430, 'Ende der Leitung') + meterSvg('m2', 830, 430, 'Lampe');
      { let h = ''; for (let i = 0; i < 6; i++) { const x = 330 + i * 72; for (const y of [YA, YB]) h += `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" rx="2" fill="#efece4"/>`; } q('fPosts').innerHTML = h; }
      let raf = 0, t = 0, lastT = performance.now(), dots = [];
      // Leiterwege: links (Netzgerät ↔ Trafo 1), Leitung, rechts (Trafo 2 ↔ Lampe)
      const segL = () => S.k ? [[56, 345, 56, 300], [56, 300, 186, 300]] : [[56, 345, 56, YA], [56, YA, 330, YA]];
      { let h = ''; for (let i = 0; i < 60; i++) h += '<circle r="3" fill="#86dcff"/>'; q('fDots').innerHTML = h; dots = [...q('fDots').children]; }
      function frame(now) {
        raf = requestAnimationFrame(frame);
        const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; t += dt;
        const model = MM.model, r = S.r, m = meas(), p = powers(m), k = S.k;
        q('fT1').setAttribute('opacity', k ? 1 : 0); q('fT2').setAttribute('opacity', k ? 1 : 0);
        q('fT1a').textContent = k ? '250 Wdg.' : ''; q('fT1b').textContent = k ? `${250 * k} Wdg.` : ''; q('fT2a').textContent = k ? `${250 * k} Wdg.` : ''; q('fT2b').textContent = k ? '250 Wdg.' : '';
        // Drähte
        const heat = Math.min(1, r.Pline / 4), wc = `rgb(${Math.round(190 + 65 * heat)},${Math.round(160 - 90 * heat)},${Math.round(120 - 90 * heat)})`;
        const x1 = k ? 294 : 140, x2 = k ? 716 : 880;
        let w = '';
        if (k) w += `<path d="M56 345 V300 H186" stroke="#c4231b" stroke-width="3"/><path d="M104 345 V320 H186" stroke="#222" stroke-width="3"/><path d="M294 300 C310 300 312 ${YA} 330 ${YA}" stroke="#c4231b" stroke-width="3"/><path d="M294 320 C310 320 312 ${YB} 330 ${YB}" stroke="#222" stroke-width="3"/>
               <path d="M690 ${YA} C705 ${YA} 702 300 716 300" stroke="#c4231b" stroke-width="3"/><path d="M690 ${YB} C705 ${YB} 702 320 716 320" stroke="#222" stroke-width="3"/><path d="M824 300 H884" stroke="#c4231b" stroke-width="3"/><path d="M824 320 H926" stroke="#222" stroke-width="3"/>`;
        else w += `<path d="M56 345 V${YA} H330" stroke="#c4231b" stroke-width="3"/><path d="M104 345 V${YB} H330" stroke="#222" stroke-width="3"/><path d="M690 ${YA} H884" stroke="#c4231b" stroke-width="3"/><path d="M690 ${YB} H926 V318" stroke="#222" stroke-width="3"/>`;
        w += `<path d="M330 ${YA} H690" stroke="${wc}" stroke-width="1.6"${heat > 0.3 ? ' filter="url(#fGl)"' : ''}/><path d="M330 ${YB} H690" stroke="${wc}" stroke-width="1.6"${heat > 0.3 ? ' filter="url(#fGl)"' : ''}/>`;
        q('fWires').innerHTML = w;
        q('fLineT').textContent = `Leitung: Konstantandraht, R_L = ${S.RL} Ω (hin und zurück)`;
        q('fWarn').textContent = m.UA > 25 ? `⚠ ${fmt(m.UA, 0)} V auf der Leitung: berührungsgefährlich` : '';
        q('fU0').textContent = S.on ? `${fmt(S.U0, 1)} V` : 'aus';
        // Lampe
        const rel = S.burnt ? 0 : Math.min(1.4, p.Pl / 3);
        q('fGlow').setAttribute('opacity', Math.min(1, Math.pow(rel, 0.7)).toFixed(2));
        q('fFil').setAttribute('stroke', S.burnt ? '#555' : rel > 0.05 ? `rgb(255,${Math.round(120 + 120 * Math.min(1, rel))},${Math.round(40 + 160 * Math.min(1, rel))})` : '#8e5a2a');
        q('fLampT').textContent = S.burnt ? 'Lampe durchgebrannt' : 'Lampe 6 V / 3 W';
        // Messgeräte
        const set = (id, v) => { const e = q(id); if (e) e.textContent = v; };
        set('m1u', `${fmt(m.U1, 2)} V`); set('m1i', `${fmt(m.I1 * 1000, 0)} mA`);
        set('mAu', `${fmt(m.UA, 2)} V`); set('mAi', `${fmt(m.IL * 1000, 1)} mA`);
        set('mEu', `${fmt(m.UE, 2)} V`);
        set('m2u', `${fmt(m.U2, 2)} V`); set('m2i', `${fmt(m.I2 * 1000, 0)} mA`);
        // Modell: Ladungsträger und Energiefluss
        q('fDots').setAttribute('opacity', model ? 1 : 0); q('fSankey').setAttribute('opacity', model ? 1 : 0);
        if (model) {
          const paths = k ? [{ pts: [[56, 300], [186, 300]], I: r.Isrc }, { pts: [[330, YA], [690, YA]], I: r.IL }, { pts: [[824, 300], [884, 300]], I: r.Ilamp }] : [{ pts: [[56, YA], [330, YA]], I: r.IL }, { pts: [[330, YA], [690, YA]], I: r.IL }, { pts: [[690, YA], [884, YA]], I: r.IL }];
          const per = [12, 36, 12]; let di = 0;
          paths.forEach((pa, j) => { const [[ax, ay], [bx, by]] = pa.pts, L = Math.hypot(bx - ax, by - ay), sp = Math.min(260, pa.I * 220), gap = L / per[j];
            for (let i = 0; i < per[j]; i++) { const s = ((i * gap + t * sp) % L + L) % L; const d = dots[di++]; d.setAttribute('cx', (ax + (bx - ax) * s / L).toFixed(1)); d.setAttribute('cy', (ay + (by - ay) * s / L - 9).toFixed(1)); } });
          for (; di < dots.length; di++) dots[di].setAttribute('cx', -20);
          // Sankey: oben 400 px für P_ein
          const P = Math.max(1e-6, p.Pin), sc = 30 / Math.max(P, 0.5), y0 = 538, xs = [170, 300, 500, 720, 860];
          const losses = [k ? r.Pt1 : 0, r.Pline, k ? r.Pt2 : 0];
          let h = `<text x="14" y="${y0 + 16}" fill="#c7c1b7" font-size="12">Energiefluss</text><text x="14" y="${y0 + 32}" fill="#8e979d" font-size="11">Breite ∝ Leistung</text>`, wcur = P * sc, top = y0;
          h += `<rect x="${xs[0]}" y="${top}" width="${xs[1] - xs[0]}" height="${wcur}" fill="#ffd27a" opacity=".55"/><text x="${xs[0] + 4}" y="${top - 4}" fill="#ffd27a" font-size="11">P_ein ${fmt(p.Pin, 2)} W</text>`;
          ['Trafo 1', 'Leitung', 'Trafo 2'].forEach((nm, i) => {
            const wl = losses[i] * sc, xa = xs[i + 1], xb = xs[i + 2];
            if (wl > 0.4) h += `<path d="M${xa} ${top + wcur - wl} H${xa + 26} V${y0 + 62} H${xa + 26 - Math.max(8, wl)} V${top + wcur}" fill="#ff7a5a" opacity=".55"/><text x="${xa + 30}" y="${y0 + 60}" fill="#ffb19a" font-size="11">${nm} ${fmt(losses[i], 2)} W</text>`;
            wcur -= wl;
            h += `<rect x="${xa}" y="${top}" width="${xb - xa}" height="${Math.max(0, wcur)}" fill="#ffd27a" opacity=".55"/>`;
          });
          h += `<text x="${xs[4] + 6}" y="${top + 12}" fill="#ffd27a" font-size="11">Lampe ${fmt(p.Pl, 2)} W</text>`;
          q('fSankey').innerHTML = h;
        }
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); } };
    }

    // ======================= Ansicht 3D =======================
    async function view3d(box, MM) {
      const { createLab, mats, cable, label, glowPool, powerSupply, makeDisplay } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [0.0, 0.78, 1.18], target: [0.0, 0.03, 0.06], table: [2.2, 1.4], bloom: [0.8, 0.5, 0.85], room: 0.65, minDist: 0.2, maxDist: 2.6, fov: 40 });
      const { THREE, scene, camera } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad</div>');
      const add = (geo, mat, x, y, z, parent = scene) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = !mat.transparent; parent.add(m); return m; };
      add(new THREE.BoxGeometry(1.0, 0.02, 0.3), new THREE.MeshStandardMaterial({ color: 0x6b5139, roughness: 0.8 }), 0.05, 0.01, 0);
      const ps = powerSupply(THREE, { label: 'Netzgerät ~', displays: 1, knobs: 1, w: 0.22, h: 0.13, d: 0.2 }); ps.position.set(-0.62, 0, 0.0); ps.rotation.y = 0.5; scene.add(ps);
      // Trafos
      const iron = new THREE.MeshStandardMaterial({ color: 0x5d646a, metalness: 0.6, roughness: 0.45 });
      function trafo(x) {
        const g = new THREE.Group(); g.position.set(x, 0.02, 0); scene.add(g);
        add(new THREE.BoxGeometry(0.12, 0.02, 0.05), iron, 0, 0.01, 0, g); add(new THREE.BoxGeometry(0.12, 0.02, 0.05), iron, 0, 0.13, 0, g);
        for (const s of [-1, 1]) { add(new THREE.BoxGeometry(0.025, 0.12, 0.05), iron, s * 0.0475, 0.07, 0, g); const c = add(new THREE.CylinderGeometry(0.032, 0.032, 0.08, 24), M.copper, s * 0.0475, 0.07, 0, g); }
        return g;
      }
      const t1 = trafo(-0.33), t2 = trafo(0.43);
      // Isolatoren und Draht
      const ins = new THREE.MeshStandardMaterial({ color: 0xefece4, roughness: 0.3 }), woodP = new THREE.MeshStandardMaterial({ color: 0x8a6a48, roughness: 0.8 });
      const XL0 = -0.22, XL1 = 0.32, ZA = -0.05, ZB = 0.05, YW = 0.12;
      for (let i = 0; i < 6; i++) { const x = XL0 + i * (XL1 - XL0) / 5; for (const z of [ZA, ZB]) { add(new THREE.CylinderGeometry(0.005, 0.006, YW - 0.03, 10), woodP, x, 0.02 + (YW - 0.03) / 2, z); add(new THREE.CylinderGeometry(0.008, 0.008, 0.016, 12), ins, x, YW - 0.004, z); } }
      const wireMat = new THREE.MeshStandardMaterial({ color: 0xc8b48a, metalness: 0.8, roughness: 0.35, emissive: 0x000000 });
      for (const z of [ZA, ZB]) { const w = add(new THREE.CylinderGeometry(0.0012, 0.0012, XL1 - XL0, 8), wireMat, (XL0 + XL1) / 2, YW + 0.005, z); w.rotation.z = Math.PI / 2; }
      // Lampe
      const LX = 0.54;
      add(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 16), M.steel, LX, 0.035, 0);
      const bulb = add(new THREE.SphereGeometry(0.022, 24, 16), new THREE.MeshBasicMaterial({ color: 0x555048, toneMapped: false, transparent: true, opacity: 0.92 }), LX, 0.07, 0);
      const bl = new THREE.PointLight(0xffc870, 0, 0.8, 2); bl.position.set(LX, 0.08, 0); scene.add(bl);
      // Kabel (fest je Schaltung)
      const cables = new THREE.Group(); scene.add(cables);
      function wiring() {
        cables.clear(); const a = ps.socketWorld(0), b = ps.socketWorld(1), k = S.k;
        const V = (x, y, z) => new THREE.Vector3(x, y, z);
        if (k) {
          cables.add(cable(THREE, a, V(-0.39, 0.06, 0.03), 0xc4231b, 0.05), cable(THREE, b, V(-0.39, 0.06, -0.03), 0x151515, 0.06));
          cables.add(cable(THREE, V(-0.27, 0.06, ZA), V(XL0, YW, ZA), 0xc4231b, 0.02), cable(THREE, V(-0.27, 0.06, ZB), V(XL0, YW, ZB), 0x151515, 0.02));
          cables.add(cable(THREE, V(XL1, YW, ZA), V(0.37, 0.06, ZA), 0xc4231b, 0.02), cable(THREE, V(XL1, YW, ZB), V(0.37, 0.06, ZB), 0x151515, 0.02));
          cables.add(cable(THREE, V(0.49, 0.06, -0.02), V(LX, 0.03, -0.012), 0xc4231b, 0.02), cable(THREE, V(0.49, 0.06, 0.02), V(LX, 0.03, 0.012), 0x151515, 0.02));
        } else {
          cables.add(cable(THREE, a, V(XL0, YW, ZA), 0xc4231b, 0.05), cable(THREE, b, V(XL0, YW, ZB), 0x151515, 0.06));
          cables.add(cable(THREE, V(XL1, YW, ZA), V(LX, 0.03, -0.012), 0xc4231b, 0.04), cable(THREE, V(XL1, YW, ZB), V(LX, 0.03, 0.012), 0x151515, 0.04));
        }
        t1.visible = t2.visible = !!k;
      }
      // Messgeräte
      function meter(x, z, two, title) {
        const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.x = 0; scene.add(g);
        add(new THREE.BoxGeometry(0.1, 0.03, 0.14), new THREE.MeshStandardMaterial({ color: 0xd7d2c4, roughness: 0.5 }), 0, 0.015, 0, g);
        const ds = [makeDisplay(THREE, 256, 80, { color: '#b7ffd6', bg: '#1d2a1d' })]; if (two) ds.push(makeDisplay(THREE, 256, 80, { color: '#b7ffd6', bg: '#1d2a1d' }));
        ds.forEach((d, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.084, 0.026), new THREE.MeshBasicMaterial({ map: d.tex, toneMapped: false })); m.rotation.x = -Math.PI / 2; m.position.set(0, 0.031, -0.035 + i * 0.034); g.add(m); });
        const lb = label(THREE, title, { color: '#c9c3ba', size: 0.012 }); lb.position.set(0, 0.05, -0.065); g.add(lb);
        return ds;
      }
      const mt1 = meter(-0.6, 0.27, true, 'Netzgerät'), mtA = meter(-0.17, 0.25, true, 'Anfang'), mtE = meter(0.27, 0.25, false, 'Ende'), mt2 = meter(0.56, 0.24, true, 'Lampe');
      // Modell
      const modelG = new THREE.Group(); scene.add(modelG);
      const pool = glowPool(THREE, modelG, 72, 0x86dcff, 0.012);
      const tag = (txt, color) => { const d = makeDisplay(THREE, 560, 72, { color, bg: '#0b0d0f' }); const m = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.026), new THREE.MeshBasicMaterial({ map: d.tex, toneMapped: false, transparent: true, opacity: 0.92 })); modelG.add(m); return { d, m }; };
      const tIn = tag('', '#ffd27a'), tLoss = tag('', '#ff9a7a'), tOut = tag('', '#ffd27a');
      tIn.m.position.set(-0.5, 0.24, 0); tLoss.m.position.set(0.05, 0.22, 0); tOut.m.position.set(0.52, 0.2, 0);
      let k0 = null, t = 0;
      const off = lab.onFrame(dt => {
        t += dt; if (k0 !== S.k) { k0 = S.k; wiring(); }
        const r = S.r, m = meas(), p = powers(m), k = S.k;
        ps.displays[0].draw(S.on ? fmt(S.U0, 1) : '--', 'V');
        mt1[0].draw(fmt(m.U1, 2), 'V'); mt1[1].draw(fmt(m.I1 * 1000, 0), 'mA');
        mtA[0].draw(fmt(m.UA, 2), 'V'); mtA[1].draw(fmt(m.IL * 1000, 1), 'mA'); mtE[0].draw(fmt(m.UE, 2), 'V');
        mt2[0].draw(fmt(m.U2, 2), 'V'); mt2[1].draw(fmt(m.I2 * 1000, 0), 'mA');
        const rel = S.burnt ? 0 : Math.min(1.4, p.Pl / 3);
        bulb.material.color.setRGB(0.33 + rel * 1.6, 0.31 + rel * 1.2, 0.28 + rel * 0.55); bl.intensity = rel * 0.5;
        const heat = Math.min(1, r.Pline / 4); wireMat.emissive.setRGB(heat * 0.8, heat * 0.15, 0);
        modelG.visible = MM.model; if (!MM.model) return;
        const segs = k ? [{ a: [-0.39, 0.13, 0.03], b: [-0.39, 0.13, -0.03], I: r.Isrc, n: 6 }, { a: [XL0, YW + 0.012, ZA], b: [XL1, YW + 0.012, ZA], I: r.IL, n: 30 }, { a: [XL1, YW + 0.012, ZB], b: [XL0, YW + 0.012, ZB], I: r.IL, n: 30 }, { a: [0.49, 0.13, -0.02], b: [0.49, 0.13, 0.02], I: r.Ilamp, n: 6 }]
          : [{ a: [XL0, YW + 0.012, ZA], b: [XL1, YW + 0.012, ZA], I: r.IL, n: 36 }, { a: [XL1, YW + 0.012, ZB], b: [XL0, YW + 0.012, ZB], I: r.IL, n: 36 }];
        let i = 0;
        for (const s of segs) { const A = new THREE.Vector3(...s.a), B = new THREE.Vector3(...s.b), L = A.distanceTo(B), sp = Math.min(0.25, s.I * 0.2);
          for (let j = 0; j < s.n; j++) { const u = ((j / s.n * L + t * sp) % L) / L; const sp3 = pool.items[i++]; sp3.visible = true; sp3.position.copy(A).lerp(B, u); } }
        for (; i < pool.items.length; i++) pool.items[i].visible = false;
        tIn.d.draw(`P_ein ${fmt(p.Pin, 2)} W`); tLoss.d.draw(`Leitung −${fmt(p.Pv, 2)} W`); tOut.d.draw(`Lampe ${fmt(p.Pl, 2)} W`);
        for (const x of [tIn, tLoss, tOut]) x.m.quaternion.copy(camera.quaternion);
      });
      return { destroy() { off(); lab.dispose(); } };
    }

    const host = viewHost(stage, { id: 'freileitung', views: { '2d': view2d, '3d': view3d }, initial: '2d', modelInfo: 'Ladungsträger, Energiefluss' });
    let raf = 0, slow = 0, last = performance.now();
    function loop(now) {
      raf = requestAnimationFrame(loop); slow += (now - last) / 1000; last = now;
      if (slow > 0.25) { slow = 0; const p = powers(meas()); dPin.set(`${fmt(p.Pin, 2)} W`); dPv.set(`${fmt(p.Pv, 3)} W`); dPl.set(`${fmt(p.Pl, 2)} W`); dEta.set(`${fmt(p.eta * 100, 1)} %`); }
    }
    raf = requestAnimationFrame(loop);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); chE.destroy(); chV.destroy(); } };
  }
};
