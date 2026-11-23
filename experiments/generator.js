// ============================================================================
//  Schlüsselexperiment: Generator – rotierende Spule im Magnetfeld
//  Φ(t) = B·A·cos(ωt),  U(t) = −N·dΦ/dt = N·B·A·ω·sin(ωt),  Û = N·B·A·ω
//  Schleifringe: Wechselspannung. Kommutator: pulsierende Gleichspannung.
//  Mit Lampe fließt Strom; die Spule wird gebremst (Lenz), der Antrieb braucht mehr Leistung.
//  Modell: Feldlinien, Flächennormale, Fluss, Geschwindigkeit der Leiterseiten, Elektronen.
// ============================================================================
import { viewHost } from '../js/lib/views.js';

const B = 0.080 * (1 + (Math.random() * 0.06 - 0.03)), AREA = 0.05 * 0.04;   // T, m² (5 cm × 4 cm)
const R_PER_TURN = 0.025, R_LAMP = 40;                                          // Ω je Windung, Ω Lampe
const COILS = [200, 400, 800];

const svgMarkup = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Blick entlang der Drehachse: Spule zwischen Nord- und Südpol; rechts das Oszilloskop mit der induzierten Spannung">
<defs>
  <linearGradient id="gBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2024"/><stop offset="1" stop-color="#121518"/></linearGradient>
  <linearGradient id="gCu" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0b07a"/><stop offset=".5" stop-color="#b8692f"/><stop offset="1" stop-color="#6b3612"/></linearGradient>
  <filter id="gSh" x="-10%" y="-10%" width="130%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity=".55"/></filter>
  <filter id="gGl"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <radialGradient id="gLamp"><stop offset="0" stop-color="#fff6d8"/><stop offset=".4" stop-color="#ffd27a"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
  <marker id="gArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="context-stroke"/></marker>
</defs>
<rect width="1000" height="620" fill="url(#gBg)"/>
<text x="40" y="34" fill="#8e979d" font-size="13">Blick entlang der Drehachse</text>
<g filter="url(#gSh)">
  <rect x="50" y="110" width="100" height="240" rx="8" fill="#c4231b"/><rect x="410" y="110" width="100" height="240" rx="8" fill="#2f8a3c"/>
  <path d="M150 140 q20 90 0 180 h18 q14 -90 0 -180z" fill="#3a3f44"/><path d="M410 140 q-20 90 0 180 h-18 q-14 -90 0 -180z" fill="#3a3f44"/>
</g>
<text x="100" y="238" fill="#fff" font-size="30" font-weight="700" text-anchor="middle">N</text><text x="460" y="238" fill="#fff" font-size="30" font-weight="700" text-anchor="middle">S</text>
<g id="gField" opacity="0" stroke="#86dcff" stroke-width="1.2" fill="none"></g>
<circle cx="280" cy="230" r="6" fill="#cfd4d8"/>
<path id="gArc" fill="none" stroke="#ece6dc" stroke-width="1.2" opacity="0"/><text id="gArcT" fill="#ece6dc" font-size="12" font-family="IBM Plex Mono, monospace" opacity="0"></text>
<line id="gCoil" stroke="url(#gCu)" stroke-width="7" stroke-linecap="round"/>
<g id="gSide1"><circle r="13" fill="url(#gCu)" stroke="#4a2a10"/><g class="sym" stroke="#111" stroke-width="2.2" fill="#111"></g></g>
<g id="gSide2"><circle r="13" fill="url(#gCu)" stroke="#4a2a10"/><g class="sym" stroke="#111" stroke-width="2.2" fill="#111"></g></g>
<g id="gModel2" opacity="0">
  <line id="gN" stroke="#c7b6ff" stroke-width="3" marker-end="url(#gArr)"/><text id="gNt" fill="#c7b6ff" font-size="13" font-weight="600">n</text>
  <line id="gV1" stroke="#f2ac74" stroke-width="2.4" marker-end="url(#gArr)"/><line id="gV2" stroke="#f2ac74" stroke-width="2.4" marker-end="url(#gArr)"/>
  <text id="gVt" fill="#f2ac74" font-size="12">v</text>
  <text x="60" y="392" fill="#c7c1b7" font-size="12">⊙ / ⊗: Richtung des Induktionsstroms (technisch) in den beiden Leiterseiten</text>
  <text x="60" y="410" fill="#c7c1b7" font-size="12">Die Lorentzkraft auf die Elektronen wirkt entlang der Leiterseiten.</text>
</g>
<text id="gPhiT" x="60" y="436" fill="#ece6dc" font-size="13" font-family="IBM Plex Mono, monospace"></text>

<!-- Oszilloskop -->
<rect x="540" y="44" width="420" height="300" rx="10" fill="#c9cbc8" filter="url(#gSh)"/>
<rect x="556" y="60" width="300" height="240" rx="6" fill="#081210"/>
<g id="gGrid" stroke="#173328" stroke-width="1"></g>
<path id="gPhiTr" fill="none" stroke="#c7b6ff" stroke-width="2" opacity="0"/>
<path id="gTr" fill="none" stroke="#7dffb8" stroke-width="2.4" filter="url(#gGl)"/>
<circle id="gDot" r="4" fill="#c8ffe0"/>
<g id="gCur">
  <line id="gCu1" x1="556" x2="856" stroke="#ffd27a" stroke-width="1.4" stroke-dasharray="6 4"/><line id="gCu2" x1="556" x2="856" stroke="#ffd27a" stroke-width="1.4" stroke-dasharray="6 4"/>
  <line id="gCt1" y1="60" y2="300" stroke="#86dcff" stroke-width="1.4" stroke-dasharray="6 4"/><line id="gCt2" y1="60" y2="300" stroke="#86dcff" stroke-width="1.4" stroke-dasharray="6 4"/>
  <line id="gCu1h" data-c="u1" x1="556" x2="856" stroke="transparent" stroke-width="14" style="cursor:ns-resize"/><line id="gCu2h" data-c="u2" x1="556" x2="856" stroke="transparent" stroke-width="14" style="cursor:ns-resize"/>
  <line id="gCt1h" data-c="t1" y1="60" y2="300" stroke="transparent" stroke-width="14" style="cursor:ew-resize"/><line id="gCt2h" data-c="t2" y1="60" y2="300" stroke="transparent" stroke-width="14" style="cursor:ew-resize"/>
</g>
<text id="gFrz" x="850" y="76" fill="#ff8a7a" font-size="11" text-anchor="end"></text>
<text id="gScopeT" x="562" y="316" fill="#333" font-size="11" font-family="IBM Plex Mono, monospace"></text>
<text x="872" y="80" fill="#333" font-size="11">Cursor</text>
<text id="gUhat" x="872" y="108" fill="#222" font-size="12" font-family="IBM Plex Mono, monospace"></text>
<text id="gTT" x="872" y="126" fill="#222" font-size="12" font-family="IBM Plex Mono, monospace"></text>
<text id="gLeg1" x="872" y="160" fill="#1a7a4c" font-size="11" opacity="1">— U(t)</text>
<text id="gLeg2" x="872" y="176" fill="#6a4bd0" font-size="11" opacity="0">— Φ(t)</text>
<!-- Lampe und Antrieb -->
<circle id="gLampGl" cx="640" cy="470" r="60" fill="url(#gLamp)" opacity="0"/>
<circle cx="640" cy="470" r="20" fill="#e9e3d6" fill-opacity=".25" stroke="#c9c3ba"/><path d="M632 478 q8 -22 16 0" stroke="#8e5a2a" fill="none" stroke-width="1.6"/>
<rect x="628" y="490" width="24" height="16" fill="#8a9095"/><text id="gLampT" x="640" y="532" fill="#8e979d" font-size="11" text-anchor="middle">Lampe (nicht angeschlossen)</text>
<text x="720" y="440" fill="#8e979d" font-size="11">Antrieb (Motor)</text>
<text id="gF" x="720" y="466" fill="#ece6dc" font-size="15" font-family="IBM Plex Mono, monospace"></text>
<text id="gP" x="720" y="490" fill="#ece6dc" font-size="13" font-family="IBM Plex Mono, monospace"></text>
<text id="gP2" x="720" y="512" fill="#8e979d" font-size="12"></text>
<text id="gMode" x="720" y="540" fill="#c9c3ba" font-size="12"></text>
</svg>`;

export default {
  intro: 'Eine Spule dreht sich gleichmäßig zwischen den Polen eines Magneten. Dabei ändert sich der magnetische Fluss durch die Spule ständig, und es wird eine sinusförmige Wechselspannung induziert. Ihr untersucht, wie der Scheitelwert von Drehfrequenz und Windungszahl abhängt.',
  docs: {
    durchfuehrung: `
<h3>Aufbau</h3>
<p>Eine rechteckige Spule (5 cm × 4 cm) sitzt auf einer Achse zwischen zwei Magnetpolen. Ein Motor dreht die Achse über einen Riemen. Über Schleifringe und Kohlebürsten wird die Spannung abgegriffen und am Oszilloskop angezeigt. Statt der Schleifringe kann ein Kommutator (Stromwender) eingesetzt werden. Eine kleine Lampe lässt sich als Verbraucher zuschalten.</p>
<h3>Durchführung</h3>
<ol>
<li>Motor mit kleiner Drehfrequenz starten und die Spannung am Oszilloskop beobachten. Passende Zeit- und Spannungsablenkung wählen.</li>
<li>Bei der Stellung der Spule, in der die Spannung null ist, kurz anhalten: Wie steht die Spule zu den Feldlinien?</li>
<li>Bild anhalten. Die gelben Cursor auf Maximum und Minimum ziehen (ΔU = 2·Û), die blauen auf zwei gleiche Stellen im Abstand einer Periode (Δt = T). <b>Messwert übernehmen.</b> Für f = 1 … 10 Hz und mit anderen Spulen wiederholen.</li>
<li>Lampe zuschalten. Die Antriebsleistung beobachten.</li>
<li>Auf Kommutator umschalten und den Verlauf der Spannung vergleichen.</li>
</ol>`,
    theorie: `
<h3>Magnetischer Fluss</h3>
<p>Der Fluss durch die Spule hängt von der Stellung ab. Steht die Flächennormale n parallel zu B, ist er am größten:</p>
<span class="formula">Φ(t) = B · A · cos(ω t)    mit    ω = 2π f</span>
<h3>Induktionsgesetz</h3>
<span class="formula">U(t) = −N · dΦ/dt = N · B · A · ω · sin(ω t)    ⇒    Û = N · B · A · ω</span>
<p>Die Spannung ist am größten, wenn der Fluss gerade null ist und sich am schnellsten ändert: Die Spulenfläche liegt dann parallel zu den Feldlinien. Ist der Fluss maximal, ist die Spannung null. Û wächst proportional mit f und mit N.</p>
<h3>Erklärung mit der Lorentzkraft</h3>
<p>Die beiden Leiterseiten bewegen sich auf einer Kreisbahn durch das Feld. Auf die Elektronen in ihnen wirkt die Lorentzkraft F = e·v·B entlang des Drahtes. Wirksam ist nur der Anteil von v senkrecht zu B, und der ändert sich mit sin(ω t).</p>
<h3>Lenz und Energie</h3>
<p>Ist eine Lampe angeschlossen, fließt Strom. Die Kraft auf die stromdurchflossenen Leiterseiten bremst die Drehung. Der Antrieb muss die elektrische Leistung zusätzlich aufbringen (Energieerhaltung).</p>
<h3>Kommutator</h3>
<p>Der Kommutator vertauscht nach jeder halben Umdrehung die Anschlüsse. Dann klappt jede zweite Halbwelle nach oben: Es entsteht eine pulsierende Gleichspannung.</p>
<h3>Modellgrenzen</h3>
<ul><li>Das Feld zwischen den Polen ist als homogen angenommen (B ≈ 0,08 T, je Aufbau ±3 %).</li><li>Der Motor hält die Drehfrequenz exakt konstant. Reibung und Selbstinduktion sind vernachlässigt.</li></ul>
<h3>Was die Modellansicht zeigt</h3><ul><li><b>Feldlinien</b> von N nach S und die <b>Flächennormale n</b> mit dem Winkel zu B.</li><li>Die Geschwindigkeit der beiden Leiterseiten (orange) und die Richtung des induzierten Stroms (⊙ heraus, ⊗ hinein).</li><li>Im Oszilloskop zusätzlich der Fluss Φ(t). Die Spannung ist um eine Viertelperiode verschoben: Sie ist groß, wo Φ steil ist.</li><li>Im 3D-Aufbau laufen die Elektronen durch die Spule, schneller bei großer Spannung.</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Spulen</td><td>200 · 400 · 800 Windungen, 5 cm × 4 cm, R ≈ 0,025 Ω je Windung</td></tr>
<tr><td>Magnet</td><td>zwei Pole mit Polschuhen, B ≈ 0,08 T</td></tr>
<tr><td>Antrieb</td><td>Motor mit Riemen, 0 … 10 Hz</td></tr>
<tr><td>Abgriff</td><td>Schleifringe oder Kommutator, Kohlebürsten</td></tr>
<tr><td>Lampe</td><td>6 V / 0,15 A (R ≈ 40 Ω)</td></tr>
</tbody></table>`,
    abi: `
<details class="q"><summary>Begründe, in welcher Stellung der Spule die Spannung maximal ist. <span class="op">AFB II</span></summary><p>Wenn die Spulenfläche parallel zu den Feldlinien liegt. Dann ist Φ = 0, ändert sich aber am schnellsten. Gleichbedeutend: Die Leiterseiten bewegen sich senkrecht zu B, die Lorentzkraft auf die Elektronen ist am größten.</p></details>
<details class="q"><summary>N = 400, A = 20 cm², f = 5 Hz, Û = 2,0 V. Berechne B. <span class="op">AFB II</span></summary><p>B = Û / (N·A·2πf) = 2,0 V / (400 · 0,0020 m² · 31,4 s⁻¹) ≈ 0,080 T.</p></details>
<details class="q"><summary>Wie ändert sich U(t), wenn die Drehfrequenz verdoppelt wird? <span class="op">AFB I</span></summary><p>Der Scheitelwert verdoppelt sich, die Periodendauer halbiert sich.</p></details>
<details class="q"><summary>Erkläre, warum sich der Generator mit angeschlossener Lampe schwerer drehen lässt. <span class="op">AFB III</span></summary><p>Der Induktionsstrom fließt durch die Leiterseiten im Magnetfeld. Auf sie wirkt eine Kraft, die nach der Lenzschen Regel die Drehung hemmt. Die mechanische Arbeit gegen diese Kraft wird in der Lampe zu Licht und Wärme.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, segmented, check, button, fmt, dataTable, toast, display, gauss } = ui;
    const S = { frozen: false, snap: null, cu: { u1: 1, u2: -1, t1: 0.15, t2: 0.65 }, f: 2, N: 400, run: true, comm: false, lamp: false, phi: 0.3, vdiv: 1, tdiv: 0.1, buf: [], t: 0 };
    const omega = () => 2 * Math.PI * S.f;
    const Uhat = () => S.N * B * AREA * omega();
    const Uof = phi => { const u = Uhat() * Math.sin(phi); return S.comm ? Math.abs(u) : u; };
    const Rtot = () => S.N * R_PER_TURN + R_LAMP;
    const Iof = phi => S.lamp ? Uof(phi) / Rtot() : 0;

    const gA = group('Antrieb', { led: true }); gA.led(true);
    const cRun = check({ label: 'Motor läuft', checked: true, onChange: v => { S.run = v; gA.led(v); } });
    const sF = slider({ label: 'Drehfrequenz f', min: 0.2, max: 10, step: 0.1, value: S.f, unit: 'Hz', digits: 1, onInput: v => { S.f = v; } });
    gA.append(cRun, sF);
    const gS = group('Spule und Abgriff');
    const segN = segmented({ value: 400, options: COILS.map(n => ({ value: n, label: `${n} Wdg.` })), onChange: v => { S.N = v; } });
    const segC = segmented({ value: 'ring', options: [{ value: 'ring', label: 'Schleifringe' }, { value: 'comm', label: 'Kommutator' }], onChange: v => { S.comm = v === 'comm'; } });
    const cL = check({ label: 'Lampe anschließen', checked: false, onChange: v => { S.lamp = v; } });
    gS.append(el('div', { class: 'ctl' }, el('label', { style: 'grid-column:1/-1' }, 'Windungszahl N'), el('div', { style: 'grid-column:1/-1' }, segN)), el('div', { class: 'ctl' }, el('div', { style: 'grid-column:1/-1' }, segC)), cL);
    const gO = group('Oszilloskop');
    const segV = segmented({ value: 1, options: [{ value: 0.5, label: '0,5 V/Div' }, { value: 1, label: '1 V' }, { value: 2, label: '2 V' }, { value: 5, label: '5 V' }], onChange: v => { S.vdiv = v; } });
    const segT = segmented({ value: 0.1, options: [{ value: 0.02, label: '20 ms/Div' }, { value: 0.05, label: '50 ms' }, { value: 0.1, label: '100 ms' }, { value: 0.2, label: '200 ms' }], onChange: v => { S.tdiv = v; } });
    const dU = display('ΔU zwischen den Cursorn'), dT = display('Δt zwischen den Cursorn');
    const bFrz = button('Bild anhalten', () => { S.frozen = !S.frozen; if (S.frozen) S.snap = { buf: S.buf.slice(), t: S.t }; bFrz.textContent = S.frozen ? 'Bild weiterlaufen lassen' : 'Bild anhalten'; });
    gO.append(el('div', { class: 'ctl' }, el('div', { style: 'grid-column:1/-1' }, segV)), el('div', { class: 'ctl' }, el('div', { style: 'grid-column:1/-1' }, segT)), el('div', { class: 'bar' }, bFrz), dU, dT,
      el('div', { class: 'bar' }, button('Messwert übernehmen', () => take(), 'btn small primary')),
      el('p', { class: 'muted', style: 'font-size:12.5px;margin:8px 0 0' }, 'Im 2D-Aufbau: Bild anhalten, die gelben Cursor auf Maximum und Minimum ziehen (ΔU = 2·Û), die blauen auf zwei gleiche Stellen einer Periode (Δt = T).'));
    controls.append(gA, gS, gO);

    const rows = [];
    const tbl = dataTable([
      { key: 'N', label: 'N', digits: 0 }, { key: 'f', label: 'f in Hz', digits: 1 }, { key: 'T', label: 'T in ms', fmt: v => fmt(v * 1000, 0) },
      { key: 'U', label: 'Û in V', digits: 2 }, { key: 'k', label: 'Û/(N·ω) in mV·s', fmt: v => fmt(v * 1000, 3) }
    ], { onDelete: i => { rows.splice(i, 1); redraw(); } });
    const figF = el('div', { class: 'fig' }), figN = el('div', { class: 'fig' });
    const chF = new Chart(figF, { xlabel: 'f in Hz', ylabel: 'Û in V' }), chN = new Chart(figN, { xlabel: 'N', ylabel: 'Û/f in V·s' });
    const resF = el('div', { class: 'result' }), resN = el('div', { class: 'result' });
    messwerte.append(
      el('div', { class: 'data' },
        el('div', { class: 'chartbox' }, el('h4', {}, 'Û über f (je Spule)'), figF, resF,
          csvTools(() => ({ meta: ['Generator', `A = ${AREA} m^2`], columns: [{ key: 'N', label: 'N' }, { key: 'f', label: 'f in Hz' }, { key: 'T', label: 'T in s' }, { key: 'U', label: 'U_hat in V' }], rows }), 'generator_messreihe')),
        el('div', { class: 'chartbox' }, el('h4', {}, 'Û/f über N'), figN, resN)),
      el('div', { style: 'height:14px' }), tbl);
    const cols = { 200: '#86dcff', 400: '#f2ac74', 800: '#7fd6a0' };
    function redraw() {
      tbl.render(rows);
      const series = [], fits = []; let txt = '';
      for (const n of COILS) {
        const pts = rows.filter(r => r.N === n).map(r => [r.f, r.U]); if (!pts.length) continue;
        series.push({ name: `N = ${n}`, color: cols[n], mode: 'dot', points: pts });
        if (pts.length >= 2) { const f = fit.propFit(pts.map(p => p[0]), pts.map(p => p[1])); if (f) { fits.push({ f: f.f, color: cols[n] }); txt += `<div><span>N = ${n}: Steigung ${fmt(f.a, 3)} V/Hz</span><br><b>B = ${fmt(f.a / (n * AREA * 2 * Math.PI), 3)} T</b> <span>· R² = ${fmt(f.r2, 4)}</span></div>`; } }
      }
      chF.set(series, fits); resF.innerHTML = txt || '<span>Mindestens zwei Drehfrequenzen je Spule messen.</span>';
      const pn = rows.filter(r => r.f > 0.1).map(r => [r.N, r.U / r.f]); let t2 = '<span>Messungen mit mehreren Spulen ergänzen.</span>'; const fn = [];
      if (new Set(rows.map(r => r.N)).size >= 2) { const f = fit.propFit(pn.map(p => p[0]), pn.map(p => p[1])); if (f) { fn.push({ f: f.f, color: '#ab93ff' }); t2 = `<div><span>Steigung = 2π·A·B</span><br><b>B = ${fmt(f.a / (2 * Math.PI * AREA), 3)} T</b></div>`; } }
      chN.set([{ color: '#ab93ff', mode: 'dot', points: pn }], fn); resN.innerHTML = t2;
    }
    redraw();
    const cursorDU = () => Math.abs(S.cu.u1 - S.cu.u2), cursorDT = () => Math.abs(S.cu.t1 - S.cu.t2) * S.tdiv * 10;
    function take() {
      if (!S.run || S.f < 0.2) { toast('Der Motor steht.'); return; }
      if (S.comm) { toast('Für die Messreihe auf Schleifringe umschalten.'); return; }
      const dUc = cursorDU(), T = cursorDT();
      if (dUc < 0.02 || T < 0.005) { toast('Erst die Cursor setzen: gelb auf Maximum und Minimum, blau auf eine Periode.'); return; }
      const U = dUc / 2;
      rows.push({ N: S.N, f: S.f, T, U, k: U / (S.N * omega()) }); redraw(); toast(`Übernommen: Û = ΔU/2 = ${fmt(U, 2)} V, T = ${fmt(T * 1000, 0)} ms bei f = ${fmt(S.f, 1)} Hz`);
    }

    // ======================= Ansicht 2D =======================
    async function view2d(box, MM) {
      box.insertAdjacentHTML('beforeend', svgMarkup());
      const svg = box.querySelector('svg'), q = id => svg.querySelector('#' + id);
      { let h = ''; for (let i = 1; i < 10; i++) h += `<line x1="${556 + i * 30}" y1="60" x2="${556 + i * 30}" y2="300"/>`; for (let i = 1; i < 8; i++) h += `<line x1="556" y1="${60 + i * 30}" x2="856" y2="${60 + i * 30}"/>`; h += '<line x1="556" y1="180" x2="856" y2="180" stroke="#2a5a46"/>'; q('gGrid').innerHTML = h; }
      { let h = ''; for (let y = 140; y <= 320; y += 22) h += `<path d="M170 ${y} H392" marker-end="url(#gArr)"/>`; q('gField').innerHTML = h; }
      const CX = 280, CY = 230, RC = 92;
      let drag = null;
      svg.querySelectorAll('#gCur [data-c]').forEach(h => h.addEventListener('pointerdown', e => { drag = h.dataset.c; svg.setPointerCapture(e.pointerId); e.preventDefault(); }));
      svg.addEventListener('pointermove', e => { if (!drag) return; const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const c = p.matrixTransform(svg.getScreenCTM().inverse());
        if (drag[0] === 'u') S.cu[drag] = Math.round(Math.max(-4, Math.min(4, (180 - c.y) / 30)) * S.vdiv * 100) / 100; else S.cu[drag] = Math.max(0, Math.min(1, (c.x - 556) / 300)); });
      svg.addEventListener('pointerup', () => { drag = null; });
      let raf = 0;
      function frame() {
        raf = requestAnimationFrame(frame);
        const model = MM.model, phi = S.phi, s = Math.sin(phi), c = Math.cos(phi);
        // Leiterseiten: (−RC·sinφ, RC·cosφ) und Gegenseite; Bildschirm-y nach unten
        const p1 = [CX - RC * s, CY - RC * c], p2 = [CX + RC * s, CY + RC * c];
        q('gCoil').setAttribute('x1', p1[0]); q('gCoil').setAttribute('y1', p1[1]); q('gCoil').setAttribute('x2', p2[0]); q('gCoil').setAttribute('y2', p2[1]);
        q('gSide1').setAttribute('transform', `translate(${p1[0].toFixed(1)} ${p1[1].toFixed(1)})`); q('gSide2').setAttribute('transform', `translate(${p2[0].toFixed(1)} ${p2[1].toFixed(1)})`);
        const u = Uhat() * s * (S.run ? 1 : 0), dot = '<circle r="3.5"/>', cross = '<path d="M-6 -6 L6 6 M6 -6 L-6 6" fill="none"/>';
        const showSym = model && Math.abs(u) > Uhat() * 0.08 && S.run;
        q('gSide1').querySelector('.sym').innerHTML = showSym ? (u > 0 ? dot : cross) : ''; q('gSide2').querySelector('.sym').innerHTML = showSym ? (u > 0 ? cross : dot) : '';
        q('gField').setAttribute('opacity', model ? 0.55 : 0); q('gModel2').setAttribute('opacity', model ? 1 : 0); q('gArc').setAttribute('opacity', model ? 1 : 0); q('gArcT').setAttribute('opacity', model ? 1 : 0);
        if (model) {
          const nx = c, ny = s, L = 70; q('gN').setAttribute('x1', CX); q('gN').setAttribute('y1', CY); q('gN').setAttribute('x2', CX + nx * L); q('gN').setAttribute('y2', CY - ny * L);
          q('gNt').setAttribute('x', CX + nx * (L + 10) - 4); q('gNt').setAttribute('y', CY - ny * (L + 10) + 4);
          const ph = ((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), r = 34;
          q('gArc').setAttribute('d', `M${CX + r} ${CY} A${r} ${r} 0 ${ph > Math.PI ? 1 : 0} 0 ${(CX + r * c).toFixed(1)} ${(CY - r * s).toFixed(1)}`);
          q('gArcT').setAttribute('x', CX + 40); q('gArcT').setAttribute('y', CY + 18); q('gArcT').textContent = `φ = ${Math.round(ph * 180 / Math.PI)}°`;
          const vL = S.run ? 46 : 0; // Geschwindigkeit tangential (Drehsinn gegen den Uhrzeiger)
          q('gV1').setAttribute('x1', p1[0]); q('gV1').setAttribute('y1', p1[1]); q('gV1').setAttribute('x2', p1[0] - vL * c); q('gV1').setAttribute('y2', p1[1] + vL * s);
          q('gV2').setAttribute('x1', p2[0]); q('gV2').setAttribute('y1', p2[1]); q('gV2').setAttribute('x2', p2[0] + vL * c); q('gV2').setAttribute('y2', p2[1] - vL * s);
          q('gVt').setAttribute('x', p1[0] - vL * c - 14); q('gVt').setAttribute('y', p1[1] + vL * s);
        }
        q('gPhiT').textContent = model ? `Φ = B·A·cos φ = ${fmt(B * AREA * c * 1e3, 3)} mWb   U = ${fmt(Uof(phi) * (S.run ? 1 : 0), 2)} V` : '';
        // Oszilloskop: Fenster von 10 Div, rechts = jetzt
        const src = S.frozen && S.snap ? S.snap : { buf: S.buf, t: S.t };
        const win = S.tdiv * 10, tNow = src.t, X = t => 856 - (tNow - t) / win * 300, Yv = v => 180 - Math.max(-125, Math.min(125, v / S.vdiv * 30));
        let d = '', dp = ''; for (const [t, v, ph2] of src.buf) { if (tNow - t > win) continue; const x = X(t).toFixed(1); d += `${d ? 'L' : 'M'}${x} ${Yv(v).toFixed(1)}`; if (model) dp += `${dp ? 'L' : 'M'}${x} ${(180 - Math.cos(ph2) * 90).toFixed(1)}`; }
        q('gTr').setAttribute('d', d); q('gPhiTr').setAttribute('d', dp); q('gPhiTr').setAttribute('opacity', model ? 0.9 : 0); q('gLeg2').setAttribute('opacity', model ? 1 : 0);
        const last = S.buf[S.buf.length - 1]; if (last) { q('gDot').setAttribute('cx', 856); q('gDot').setAttribute('cy', Yv(last[1])); } q('gDot').setAttribute('opacity', S.frozen ? 0 : 1);
        const yu = u => (180 - u / S.vdiv * 30).toFixed(1), xt = f => (556 + f * 300).toFixed(1);
        for (const id of ['gCu1', 'gCu1h']) { q(id).setAttribute('y1', yu(S.cu.u1)); q(id).setAttribute('y2', yu(S.cu.u1)); } for (const id of ['gCu2', 'gCu2h']) { q(id).setAttribute('y1', yu(S.cu.u2)); q(id).setAttribute('y2', yu(S.cu.u2)); }
        for (const id of ['gCt1', 'gCt1h']) { q(id).setAttribute('x1', xt(S.cu.t1)); q(id).setAttribute('x2', xt(S.cu.t1)); } for (const id of ['gCt2', 'gCt2h']) { q(id).setAttribute('x1', xt(S.cu.t2)); q(id).setAttribute('x2', xt(S.cu.t2)); }
        q('gFrz').textContent = S.frozen ? 'angehalten' : '';
        q('gScopeT').textContent = `${fmt(S.vdiv, 1)} V/Div   ${fmt(S.tdiv * 1000, 0)} ms/Div`;
        q('gUhat').textContent = `ΔU = ${fmt(cursorDU(), 2)} V`; q('gTT').textContent = `Δt = ${fmt(cursorDT() * 1000, 0)} ms`;
        // Lampe
        const P = S.lamp && S.run ? (Uhat() / Rtot()) ** 2 * R_LAMP / 2 : 0;
        q('gLampGl').setAttribute('opacity', Math.min(1, P / 0.9 * (0.6 + 0.4 * Math.abs(Math.sin(phi)))).toFixed(2));
        q('gLampT').textContent = S.lamp ? `Lampe angeschlossen · P = ${fmt(P * 1000, 0)} mW` : 'Lampe (nicht angeschlossen)';
        q('gF').textContent = S.run ? `f = ${fmt(S.f, 1)} Hz` : 'Motor aus';
        q('gP').textContent = `Antriebsleistung: ${fmt((0.15 + P) * (S.run ? 1 : 0), 2)} W`;
        q('gP2').textContent = S.lamp ? 'davon für die Lampe: ' + fmt(P, 2) + ' W (Lenz: Spule wird gebremst)' : 'nur Reibung (0,15 W)';
        q('gMode').textContent = S.comm ? 'Abgriff: Kommutator (pulsierende Gleichspannung)' : 'Abgriff: Schleifringe (Wechselspannung)';
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); } };
    }

    // ======================= Ansicht 3D =======================
    async function view3d(box, MM) {
      const { createLab, mats, cable, label, arrow, glowPool } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [0.1, 0.22, 0.33], target: [0.0, 0.115, 0.0], table: [1.8, 1.2], bloom: [0.7, 0.45, 0.85], room: 0.5, minDist: 0.12, maxDist: 2.2, fov: 36 });
      const { THREE, scene } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad</div>');
      const Y = 0.12, W = 0.05, Hh = 0.04;                              // Achshöhe, Spulenbreite (quer), Länge entlang der Achse
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.014, 0.3), new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.7, roughness: 0.4 })); base.position.y = 0.007; base.receiveShadow = true; scene.add(base);
      const matR = new THREE.MeshStandardMaterial({ color: 0xc4231b, roughness: 0.45 }), matG = new THREE.MeshStandardMaterial({ color: 0x2f8a3c, roughness: 0.45 });
      for (const [x, m] of [[-0.075, matR], [0.075, matG]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.08), m); b.position.set(x, 0.094, 0); b.castShadow = true; scene.add(b); }
      const lN = label(THREE, 'N', { color: '#ffffff', size: 0.02 }); lN.position.set(-0.075, 0.2, 0.045); const lS = label(THREE, 'S', { color: '#ffffff', size: 0.02 }); lS.position.set(0.075, 0.2, 0.045); scene.add(lN, lS);
      // Achse entlang z, Lager, Schleifringe vorn, Riemenscheibe hinten
      const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.26, 16), M.steel); axle.rotation.x = Math.PI / 2; axle.position.set(0, Y, 0.02); scene.add(axle);
      for (const z of [-0.09, 0.12]) { const br = new THREE.Mesh(new THREE.BoxGeometry(0.008, Y, 0.008), M.steel); br.position.set(0, Y / 2, z); scene.add(br); }
      const rot = new THREE.Group(); rot.position.set(0, Y, 0); scene.add(rot);
      const cu = M.copper; const bar = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cu); m.position.set(x, y, z); m.castShadow = true; rot.add(m); return m; };
      bar(0.007, 0.007, Hh + 0.007, 0, W / 2, 0); bar(0.007, 0.007, Hh + 0.007, 0, -W / 2, 0); bar(0.007, W, 0.007, 0, 0, Hh / 2); bar(0.007, W, 0.007, 0, 0, -Hh / 2);
      for (const z of [0.07, 0.085]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.007, 24), M.brass); r.rotation.x = Math.PI / 2; r.position.z = z; rot.add(r); }
      const commG = new THREE.Group(); rot.add(commG); for (const a of [0, Math.PI]) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.014, 24, 1, false, a + 0.15, Math.PI - 0.3), M.brass); seg.rotation.x = Math.PI / 2; seg.position.z = 0.078; commG.add(seg); }
      const pulley = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.008, 32), M.black); pulley.rotation.x = Math.PI / 2; pulley.position.z = -0.1; rot.add(pulley);
      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.06, 32), new THREE.MeshStandardMaterial({ color: 0x8a9095, metalness: 0.9, roughness: 0.35 })); motor.rotation.x = Math.PI / 2; motor.position.set(0, 0.04, -0.13); scene.add(motor);
      const belt = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.002, 6, 40), M.black); belt.scale.set(0.45, 1, 1); belt.position.set(0, 0.08, -0.1); scene.add(belt);
      for (const x of [-0.012, 0.012]) { const brush = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.012, 0.006), M.black); brush.position.set(x, Y - 0.014, 0.078); scene.add(brush); }
      // Lampe
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.014, 24, 16), new THREE.MeshBasicMaterial({ color: 0x555048, toneMapped: false, transparent: true, opacity: 0.9 })); bulb.position.set(0.16, 0.04, 0.1); scene.add(bulb);
      const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.014, 16), M.steel); sock.position.set(0.16, 0.02, 0.1); scene.add(sock);
      const bulbLight = new THREE.PointLight(0xffc870, 0, 0.6, 2); bulbLight.position.copy(bulb.position); scene.add(bulbLight);
      scene.add(cable(THREE, new THREE.Vector3(-0.012, Y - 0.02, 0.078), new THREE.Vector3(0.15, 0.02, 0.1), 0xc4231b, 0.04), cable(THREE, new THREE.Vector3(0.012, Y - 0.02, 0.078), new THREE.Vector3(0.17, 0.02, 0.1), 0x151515, 0.05));
      // Oszilloskop
      const osc = new THREE.Group(); osc.position.set(-0.22, 0, -0.12); osc.rotation.y = 0.5; scene.add(osc);
      const ob = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.15, 0.18), M.housingLight); ob.position.y = 0.075; ob.castShadow = true; osc.add(ob);
      const sc = document.createElement('canvas'); sc.width = 320; sc.height = 220; const sg = sc.getContext('2d'); const scTex = new THREE.CanvasTexture(sc); scTex.colorSpace = THREE.SRGBColorSpace;
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.096), new THREE.MeshBasicMaterial({ map: scTex, toneMapped: false })); scr.position.set(-0.035, 0.08, 0.0905); osc.add(scr);
      // Modell
      const modelG = new THREE.Group(); scene.add(modelG);
      const bArr = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const a = arrow(THREE, 0x86dcff, { radius: 0.0009, head: 0.006 }); a.set(new THREE.Vector3(-0.05, Y - 0.03 + i * 0.03, -0.03 + j * 0.03), new THREE.Vector3(0.1, 0, 0)); bArr.push(a); modelG.add(a); }
      const aN = arrow(THREE, 0xc7b6ff, { radius: 0.0016, head: 0.01 }); modelG.add(aN);
      const lNn = label(THREE, 'n', { color: '#c7b6ff', size: 0.012 }); modelG.add(lNn);
      const aV1 = arrow(THREE, 0xf2ac74, { radius: 0.0012, head: 0.007 }), aV2 = arrow(THREE, 0xf2ac74, { radius: 0.0012, head: 0.007 }); modelG.add(aV1, aV2);
      const ePool = glowPool(THREE, modelG, 36, 0x86dcff, 0.005); let ePhase = 0;
      const loopPt = (u, phi) => {   // u 0…1 einmal um die Spule (lokal: y = ±W/2, z = ±Hh/2)
        const per = 2 * (W + Hh), s = u * per; let ly, lz;
        if (s < Hh) { ly = W / 2; lz = -Hh / 2 + s; } else if (s < Hh + W) { ly = W / 2 - (s - Hh); lz = Hh / 2; } else if (s < 2 * Hh + W) { ly = -W / 2; lz = Hh / 2 - (s - Hh - W); } else { ly = -W / 2 + (s - 2 * Hh - W); lz = -Hh / 2; }
        return new THREE.Vector3(-ly * Math.sin(phi), Y + ly * Math.cos(phi), lz);
      };
      let acc = 0;
      const off = lab.onFrame((dt, t) => {
        const model = MM.model, phi = S.phi;
        rot.rotation.z = phi; commG.visible = S.comm;
        const P = S.lamp && S.run ? (Uof(phi) / Rtot()) ** 2 * R_LAMP : 0;
        bulb.material.color.setRGB(0.33 + Math.min(1.6, P * 2.2), 0.31 + Math.min(1.2, P * 1.6), 0.28 + Math.min(0.6, P * 0.7)); bulbLight.intensity = Math.min(0.4, P * 0.5);
        acc += dt;
        if (acc > 0.05) {
          acc = 0; sg.fillStyle = '#081210'; sg.fillRect(0, 0, 320, 220); sg.strokeStyle = '#173328'; sg.lineWidth = 1;
          for (let i = 1; i < 10; i++) { sg.beginPath(); sg.moveTo(i * 32, 0); sg.lineTo(i * 32, 220); sg.stroke(); } for (let i = 1; i < 8; i++) { sg.beginPath(); sg.moveTo(0, i * 27.5); sg.lineTo(320, i * 27.5); sg.stroke(); }
          const win = S.tdiv * 10; sg.strokeStyle = '#7dffb8'; sg.lineWidth = 2.5; sg.shadowColor = '#7dffb8'; sg.shadowBlur = 8; sg.beginPath(); let first = true;
          for (const [tt, v] of S.buf) { if (S.t - tt > win) continue; const x = 320 - (S.t - tt) / win * 320, y = 110 - Math.max(-105, Math.min(105, v / S.vdiv * 27.5)); first ? sg.moveTo(x, y) : sg.lineTo(x, y); first = false; }
          sg.stroke(); sg.shadowBlur = 0; scTex.needsUpdate = true;
        }
        modelG.visible = model; if (!model) return;
        const c = Math.cos(phi), s = Math.sin(phi);
        aN.set(new THREE.Vector3(0, Y, Hh / 2 + 0.01), new THREE.Vector3(c * 0.05, s * 0.05, 0)); lNn.position.set(c * 0.06, Y + s * 0.06, Hh / 2 + 0.01);
        const vL = S.run ? 0.025 : 0;
        aV1.set(new THREE.Vector3(-W / 2 * s, Y + W / 2 * c, 0), new THREE.Vector3(-c * vL, -s * vL, 0)); aV2.set(new THREE.Vector3(W / 2 * s, Y - W / 2 * c, 0), new THREE.Vector3(c * vL, s * vL, 0));
        // Elektronen: laufen entgegen der technischen Stromrichtung, Tempo ~ U
        const u = S.run ? Uof(phi) * (S.comm ? Math.sign(Math.sin(phi)) || 1 : 1) : 0;
        ePhase += dt * 0.25 * u / Math.max(1, Uhat()) * (S.lamp ? 1 : 0.35);
        ePool.items.forEach((sp, i) => { sp.position.copy(loopPt((((i / ePool.items.length) - ePhase) % 1 + 1) % 1, phi)); });
      });
      return { destroy() { off(); lab.dispose(); } };
    }

    const host = viewHost(stage, { id: 'generator', views: { '3d': view3d, '2d': view2d }, initial: '3d', modelInfo: 'Feldlinien, Flächennormale, Fluss, Elektronen' });

    let raf = 0, last = performance.now(), slow = 0;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      const n = 6;
      for (let i = 0; i < n; i++) { if (S.run) S.phi += omega() * dt / n; S.t += dt / n; S.buf.push([S.t, S.run ? Uof(S.phi) : 0, S.phi]); }
      while (S.buf.length && S.t - S.buf[0][0] > 2.2) S.buf.shift();
      slow += dt; if (slow > 0.2) { slow = 0; dU.set(`${fmt(cursorDU(), 2)} V`); dT.set(`${fmt(cursorDT() * 1000, 0)} ms`); }
    }
    raf = requestAnimationFrame(loop);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); chF.destroy(); chN.destroy(); } };
  }
};
