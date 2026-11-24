// ============================================================================
//  Schlüsselexperiment: Zyklotron (Modellexperiment)
//  Zwei Duanten im homogenen Magnetfeld, Wechselspannung am Spalt.
//  Im Duanten: Halbkreis mit r = m·v/(q·B), Halbumlaufzeit T/2 = π·m/(q·B) (unabhängig von v).
//  Am Spalt: ΔE = ±q·U0·cos(2π f t). Resonanz bei f = q·B/(2π m).
//  Endenergie am Rand: E = q²B²R²/(2m), unabhängig von U0.
// ============================================================================
import { viewHost } from '../js/lib/views.js';

const E0 = 1.602177e-19, U_AMU = 1.660539e-27, MEV = 1.602177e-13;
const R = 0.30;                                   // Duantenradius in m
const PARTS = {
  p: { name: 'Proton', sym: 'p', q: 1, m: 1.672622e-27 },
  d: { name: 'Deuteron', sym: 'd', q: 1, m: 3.343584e-27 },
  a: { name: 'α-Teilchen', sym: 'α', q: 2, m: 6.644657e-27 },
  x: { name: 'Ion X (unbekannt)', sym: 'X', q: 2, m: 5.006412e-27 }
};
const PCOL = { p: '#f2ac74', d: '#86dcff', a: '#7fd6a0', x: '#c7b6ff' };

const svgMarkup = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Zyklotron von oben: zwei Duanten mit Spalt, Teilchenbahn als Spirale, rechts Hochfrequenzgenerator und Spannung am Spalt">
<defs>
  <linearGradient id="zBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2024"/><stop offset="1" stop-color="#121518"/></linearGradient>
  <radialGradient id="zPole"><stop offset="0" stop-color="#3b4146"/><stop offset="1" stop-color="#22272b"/></radialGradient>
  <linearGradient id="zCu" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d89a62" stop-opacity=".55"/><stop offset="1" stop-color="#7a4318" stop-opacity=".55"/></linearGradient>
  <filter id="zGl"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="zSh" x="-10%" y="-10%" width="130%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity=".55"/></filter>
  <marker id="zArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="context-stroke"/></marker>
</defs>
<rect width="1000" height="620" fill="url(#zBg)"/>
<text x="30" y="584" fill="#8e979d" font-size="12">Blick von oben · oberer Magnetpol nicht gezeichnet</text>
<circle cx="310" cy="320" r="290" fill="url(#zPole)" stroke="#4a5258" stroke-width="2"/>
<g id="zB" opacity="0" fill="#86dcff" stroke="#86dcff"></g>
<path d="M316 60 A260 260 0 0 1 316 580 Z" fill="url(#zCu)" stroke="#d89a62" stroke-width="3"/>
<path d="M304 60 A260 260 0 0 0 304 580 Z" fill="url(#zCu)" stroke="#d89a62" stroke-width="3"/>
<text x="420" y="110" fill="#e6c9a8" font-size="14">Duant 2</text><text x="150" y="110" fill="#e6c9a8" font-size="14">Duant 1</text>
<g id="zE" opacity="0"></g>
<path id="zPath" fill="none" stroke="#b79bff" stroke-width="1.3" opacity=".85"/>
<path id="zCur" fill="none" stroke="#d7c6ff" stroke-width="1.8" filter="url(#zGl)"/>
<path id="zOut" fill="none" stroke="#d7c6ff" stroke-width="1.8" filter="url(#zGl)"/>
<circle cx="310" cy="320" r="5" fill="#ffcf8a"/><text x="318" y="338" fill="#c7c1b7" font-size="11">Ionenquelle</text>
<g id="zDet" opacity="0"><rect x="-14" y="-9" width="28" height="18" rx="3" fill="#2d3236" stroke="#c9c3ba"/><text y="28" fill="#c9c3ba" font-size="11" text-anchor="middle">Detektor</text></g>
<g id="zMod" opacity="0">
  <line id="zV" stroke="#f2ac74" stroke-width="2.6" marker-end="url(#zArr)"/><line id="zF" stroke="#ff7a8a" stroke-width="2.6" marker-end="url(#zArr)"/>
  <text id="zVt" fill="#f2ac74" font-size="13" font-weight="600">v</text><text id="zFt" fill="#ff7a8a" font-size="13" font-weight="600">F<tspan font-size="10" dy="4">L</tspan></text>
</g>
<circle id="zP" r="6" fill="#fff" filter="url(#zGl)"/>
<text id="zModT" x="30" y="604" fill="#c7c1b7" font-size="12" opacity="0">⊙ B aus der Zeichenebene heraus · orange: Geschwindigkeit · rot: Lorentzkraft (zur Bahnmitte) · Pfeile im Spalt: elektrisches Feld</text>
<!-- Generator -->
<rect x="640" y="30" width="330" height="84" rx="10" fill="#2b3034" filter="url(#zSh)"/>
<text x="656" y="52" fill="#c9c3ba" font-size="12">Hochfrequenzgenerator</text>
<rect x="656" y="62" width="150" height="38" rx="4" fill="#160807"/><text id="zFd" x="798" y="90" fill="#ff5a3c" font-size="22" font-family="IBM Plex Mono, monospace" text-anchor="end"></text>
<rect x="814" y="62" width="140" height="38" rx="4" fill="#160807"/><text id="zUd" x="946" y="90" fill="#ff5a3c" font-size="22" font-family="IBM Plex Mono, monospace" text-anchor="end"></text>
<!-- Spannung am Spalt -->
<rect x="640" y="130" width="330" height="200" rx="10" fill="#c9cbc8" filter="url(#zSh)"/>
<rect x="652" y="142" width="306" height="160" rx="5" fill="#081210"/>
<g stroke="#173328"><line x1="652" y1="222" x2="958" y2="222" stroke="#2a5a46"/><line x1="652" y1="182" x2="958" y2="182"/><line x1="652" y1="262" x2="958" y2="262"/></g>
<path id="zSc" fill="none" stroke="#7dffb8" stroke-width="2"/>
<g id="zScM"></g>
<line id="zNow" y1="142" y2="302" stroke="#ffd27a" stroke-width="1" stroke-dasharray="4 3"/>
<text x="656" y="320" fill="#333" font-size="11">Spannung am Spalt · grün: beschleunigt, rot: gebremst</text>
<!-- Anzeigen -->
<text x="644" y="364" fill="#8e979d" font-size="12">Teilchen</text><text id="zR1" x="644" y="386" fill="#ece6dc" font-size="15" font-family="IBM Plex Mono, monospace"></text>
<text id="zR2" x="644" y="412" fill="#ece6dc" font-size="15" font-family="IBM Plex Mono, monospace"></text>
<text id="zR3" x="644" y="438" fill="#ece6dc" font-size="15" font-family="IBM Plex Mono, monospace"></text>
<text id="zR4" x="644" y="464" fill="#ece6dc" font-size="15" font-family="IBM Plex Mono, monospace"></text>
<text x="644" y="502" fill="#8e979d" font-size="12">Detektor am Rand</text><text id="zR5" x="644" y="528" fill="#ffd27a" font-size="17" font-family="IBM Plex Mono, monospace"></text>
<text id="zR6" x="644" y="552" fill="#c9c3ba" font-size="12"></text>
</svg>`;

export default {
  intro: 'Im Zyklotron laufen geladene Teilchen in einem Magnetfeld auf Halbkreisen. Bei jedem Durchgang durch den Spalt zwischen den beiden Duanten bekommen sie von einer Wechselspannung zusätzliche Energie. Ihr sucht die Frequenz, bei der das klappt, und bestimmt daraus die spezifische Ladung der Teilchen.',
  docs: {
    durchfuehrung: `
<h3>Aufbau</h3>
<p>Zwei flache, halbkreisförmige Hohlelektroden aus Kupfer (Duanten, Radius 30 cm) liegen in einer Vakuumkammer zwischen den Polen eines Elektromagneten. Ein Hochfrequenzgenerator legt eine Wechselspannung zwischen die Duanten. In der Mitte sitzt die Ionenquelle, am Rand ein Detektor, der die Energie der ankommenden Teilchen misst. Ein echtes Zyklotron gibt es an Schulen nicht. Dieser Versuch ist ein Modellexperiment.</p>
<h3>Durchführung</h3>
<ol>
<li>Proton und B = 1,00 T wählen. Ein Teilchen starten und beobachten, was am Spalt passiert.</li>
<li>Die Frequenz des Generators so lange verändern, bis das Teilchen den Rand erreicht. Mit der Feinabstimmung die Frequenz suchen, bei der es die meisten Durchgänge mit voller Beschleunigung bekommt.</li>
<li>Endenergie ablesen und <b>Messwert übernehmen</b>.</li>
<li>Für mindestens vier Werte von B wiederholen. Jedes Mal die Frequenz neu einstellen.</li>
<li>Die Spannung U₀ verändern. Was ändert sich an der Endenergie, was an der Zahl der Umläufe?</li>
<li>Mit Deuteron, α-Teilchen und dem unbekannten Ion X wiederholen. Aus den beiden Diagrammen Ladung und Masse von X bestimmen.</li>
</ol>`,
    theorie: `
<h3>Bahn im Duanten</h3>
<p>In den Duanten gibt es kein elektrisches Feld. Die Lorentzkraft steht senkrecht zur Geschwindigkeit und ist die Zentripetalkraft:</p>
<span class="formula tex">q\\, v\\, B = \\frac{m\\, v^2}{r} \\quad\\Rightarrow\\quad r = \\frac{m\\, v}{q\\, B}</span>
<p>Für einen Halbkreis braucht das Teilchen die Zeit</p>
<span class="formula tex">\\frac{T}{2} = \\frac{\\pi\\, r}{v} = \\frac{\\pi\\, m}{q\\, B}</span>
<p>Diese Zeit hängt nicht von der Geschwindigkeit ab. Schnelle Teilchen laufen auf größeren Kreisen, brauchen aber genauso lange.</p>
<h3>Resonanzbedingung</h3>
<p>Die Spannung am Spalt muss ihre Richtung immer dann umkehren, wenn das Teilchen einen Halbkreis durchlaufen hat. Die Frequenz des Generators muss also zur Umlauffrequenz passen:</p>
<span class="formula tex">f = \\frac{q\\, B}{2\\pi\\, m} \\quad\\Rightarrow\\quad \\frac{q}{m} = \\frac{2\\pi\\, f}{B}</span>
<p>Weicht f etwas ab, kommt das Teilchen bei jedem Umlauf etwas früher oder später am Spalt an. Nach einigen Umläufen trifft es auf die falsche Polung und wird gebremst.</p>
<h3>Energie</h3>
<p>Bei jedem Durchgang gewinnt das Teilchen höchstens die Energie q·U₀. Am Rand ist r = R. Daraus folgt die Endenergie:</p>
<span class="formula tex">E_\\text{kin} = \\frac{q^2 B^2 R^2}{2\\, m}</span>
<p>Sie hängt nicht von U₀ ab. Eine größere Spannung verkürzt nur den Weg: Die Zahl der Umläufe ist etwa</p>
<span class="formula tex">n \\approx \\frac{E_\\text{kin}}{2\\, q\\, U_0}</span>
<h3>Auswertung</h3>
<p>Trägt man die Resonanzfrequenz über B auf, ergibt sich eine Ursprungsgerade mit der Steigung q/(2πm). Trägt man die Endenergie über B² auf, ist die Steigung q²R²/(2m). Aus beiden Steigungen lassen sich q und m einzeln bestimmen.</p>
<h3>Modellgrenzen</h3>
<ul><li>Der Spalt ist sehr schmal gezeichnet. Die Zeit im Spalt ist vernachlässigt.</li>
<li>Die Rechnung ist nicht relativistisch. Bei Protonen über etwa 10 MeV wächst die Masse merklich, und f müsste nachgeregelt werden (Synchrozyklotron).</li>
<li>Die Teilchen laufen als einzelnes Paket. In einem echten Zyklotron entsteht ein Strahl, und nur Teilchen mit passender Phase kommen am Rand an.</li>
<li>Die Bahn ist im Vakuum unsichtbar. Hier ist sie als Leuchtspur gezeichnet.</li></ul>
<h3>Was die Modellansicht zeigt</h3>
<ul><li>Das Magnetfeld als ⊙-Zeichen (aus der Zeichenebene heraus).</li><li>Die Geschwindigkeit (orange) und die Lorentzkraft (rot) am Teilchen. Die Kraft zeigt immer zur Mitte des Halbkreises.</li><li>Das elektrische Feld im Spalt. Es wechselt mit der Generatorfrequenz die Richtung.</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Duanten</td><td>Kupfer, Radius R = 30 cm, in Vakuumkammer</td></tr>
<tr><td>Magnet</td><td>Elektromagnet, B = 0,20 … 1,60 T, homogen zwischen den Polen</td></tr>
<tr><td>Generator</td><td>f = 1 … 30 MHz, Feinabstimmung ±0,5 MHz, U₀ = 10 … 100 kV</td></tr>
<tr><td>Teilchen</td><td>Proton, Deuteron, α-Teilchen, unbekanntes Ion X</td></tr>
<tr><td>Detektor</td><td>Energie der am Rand ankommenden Teilchen, Messunsicherheit etwa 0,5 %</td></tr>
</tbody></table>`,
    abi: `
<details class="q"><summary>Begründe, warum die Generatorfrequenz während der Beschleunigung nicht verändert werden muss. <span class="op">AFB II</span></summary><p>Die Halbumlaufzeit T/2 = πm/(qB) hängt nicht von v ab. Mit wachsender Geschwindigkeit wächst der Radius im gleichen Maß, die Zeit für einen Halbkreis bleibt gleich (nicht relativistisch).</p></details>
<details class="q"><summary>Protonen, B = 1,2 T. Berechne die Resonanzfrequenz. <span class="op">AFB I</span></summary><p>f = qB/(2πm) = 1,602·10⁻¹⁹ C · 1,2 T / (2π · 1,673·10⁻²⁷ kg) ≈ 18,3 MHz.</p></details>
<details class="q"><summary>Berechne die Endenergie dieser Protonen bei R = 0,30 m und die Zahl der Umläufe bei U₀ = 50 kV. <span class="op">AFB II</span></summary><p>E = q²B²R²/(2m) = (1,602·10⁻¹⁹)² · 1,44 · 0,09 / (2 · 1,673·10⁻²⁷) J ≈ 9,9·10⁻¹³ J ≈ 6,2 MeV. Je Umlauf zwei Durchgänge mit je 50 keV: n ≈ 6,2 MeV / 0,1 MeV ≈ 62.</p></details>
<details class="q"><summary>Deuteronen und α-Teilchen haben bei gleichem B dieselbe Resonanzfrequenz. Erkläre und vergleiche die Endenergien. <span class="op">AFB III</span></summary><p>Beide haben fast das gleiche q/m (α: 2e bei etwa 4 u, d: e bei etwa 2 u). Die Endenergie ist proportional zu q²/m: Für α ist sie (2e)²/(4 u) = e²/u, für d nur e²/(2 u). α-Teilchen erreichen also die doppelte Energie.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, segmented, button, fmt, dataTable, toast, display, gauss } = ui;
    const S = { part: 'p', B: 1.0, U: 50, f: 12, df: 0, speed: 8, p: 0, play: false, run: null, ver: 0 };
    const P = () => PARTS[S.part];
    const fRes = () => P().q * E0 * S.B / (2 * Math.PI * P().m);
    const fGen = () => (S.f + S.df) * 1e6;

    function simulate() {
      const q = P().q * E0, m = P().m, U0 = S.U * 1e3, f = fGen();
      const Th = Math.PI * m / (q * S.B);
      const segs = []; let E = 0, y = 0, t = 0, s = 1, status = 'tritt';
      for (let k = 0; k < 3000; k++) {
        const dE = s * q * U0 * Math.cos(2 * Math.PI * f * t);
        E += dE;
        if (E <= 0) { status = 'stop'; break; }
        const r = Math.sqrt(2 * m * E) / (q * S.B), c = y - s * r;
        segs.push({ c, r, s, E, dE, t });
        if (r >= R) { status = 'out'; break; }
        y = c - s * r; t += Th; s = -s;
      }
      const pEnd = status === 'out' ? segs.length - 1 + 1.1 : segs.length;
      S.run = { segs, status, Th, stopY: y, pEnd, f, part: S.part, B: S.B, U: S.U, q, m, U0 };
      S.p = 0; S.play = true; S.ver++;
    }
    // Position, Geschwindigkeitsrichtung und Zeit beim Fortschritt p (in Halbumläufen)
    function stateAt(p) {
      const run = S.run; if (!run || !run.segs.length) return null;
      const n = run.segs.length;
      if (p >= n && run.status !== 'out') { const sg = run.segs[n - 1]; return { x: 0, y: run.stopY, vx: 0, vy: 0, seg: sg, i: n - 1, t: sg.t + run.Th, done: true }; }
      const i = Math.min(Math.floor(p), n - 1), fr = p - i, sg = run.segs[i];
      if (run.status === 'out' && i === n - 1 && fr > 0.5) {
        const k = Math.min(1, (fr - 0.5) / 0.6), dx = 0.3 * sg.s, dy = -sg.s, L = Math.hypot(dx, dy);
        return { x: sg.s * sg.r + dx / L * 0.12 * k, y: sg.c + dy / L * 0.12 * k, vx: dx / L, vy: dy / L, seg: sg, i, t: sg.t + fr * run.Th, out: true, done: k >= 1 };
      }
      const th = fr * Math.PI;
      return { x: sg.s * sg.r * Math.sin(th), y: sg.c + sg.s * sg.r * Math.cos(th), vx: sg.s * Math.cos(th), vy: -sg.s * Math.sin(th), seg: sg, i, th, t: sg.t + fr * run.Th };
    }

    const gT = group('Teilchen und Magnet');
    const segP = segmented({ value: 'p', options: Object.entries(PARTS).map(([k, v]) => ({ value: k, label: k === 'x' ? 'Ion X' : v.name })), onChange: v => { S.part = v; } });
    const sB = slider({ label: 'Magnetfeld B', min: 0.2, max: 1.6, step: 0.01, value: S.B, unit: 'T', digits: 2, onInput: v => { S.B = v; } });
    gT.append(el('div', { class: 'ctl' }, el('div', { style: 'grid-column:1/-1' }, segP)), sB);
    const gG = group('Hochfrequenzgenerator', { led: true }); gG.led(true);
    const sF = slider({ label: 'Frequenz f', min: 1, max: 30, step: 0.05, value: S.f, unit: 'MHz', digits: 2, onInput: v => { S.f = v; } });
    const sDF = slider({ label: 'Feinabstimmung Δf', min: -0.5, max: 0.5, step: 0.005, value: 0, unit: 'MHz', digits: 3, onInput: v => { S.df = v; } });
    const sU = slider({ label: 'Spannung U₀', min: 10, max: 100, step: 5, value: S.U, unit: 'kV', digits: 0, onInput: v => { S.U = v; } });
    gG.append(sF, sDF, sU);
    const gR = group('Ablauf');
    const sS = slider({ label: 'Zeitlupe (Halbkreise je s)', min: 1, max: 60, step: 1, value: S.speed, digits: 0, onInput: v => { S.speed = v; } });
    const dE = display('Endenergie am Detektor');
    gR.append(el('div', { class: 'bar' }, button('Teilchen starten', () => simulate(), 'btn small primary'), button('Zum Ende', () => { if (S.run) S.p = S.run.pEnd; })), sS, dE,
      el('div', { class: 'bar' }, button('Messwert übernehmen', () => take(), 'btn small primary')));
    controls.append(gT, gG, gR);

    const rows = [];
    const tbl = dataTable([
      { key: 'sym', label: 'Teilchen', fmt: v => v }, { key: 'B', label: 'B in T', digits: 2 }, { key: 'f', label: 'f in MHz', digits: 3 },
      { key: 'U', label: 'U₀ in kV', digits: 0 }, { key: 'n', label: 'Umläufe', digits: 0 }, { key: 'E', label: 'E in MeV', digits: 2 }
    ], { onDelete: i => { rows.splice(i, 1); redraw(); } });
    const figF = el('div', { class: 'fig' }), figE = el('div', { class: 'fig' });
    const chF = new Chart(figF, { xlabel: 'B in T', ylabel: 'f in MHz' }), chE = new Chart(figE, { xlabel: 'B² in T²', ylabel: 'E in MeV' });
    const resF = el('div', { class: 'result' }), resE = el('div', { class: 'result' });
    messwerte.append(
      el('div', { class: 'data' },
        el('div', { class: 'chartbox' }, el('h4', {}, 'Resonanzfrequenz über B'), figF, resF,
          csvTools(() => ({ meta: ['Zyklotron', `R = ${R} m`], columns: [{ key: 'sym', label: 'Teilchen' }, { key: 'B', label: 'B in T' }, { key: 'f', label: 'f in MHz' }, { key: 'U', label: 'U0 in kV' }, { key: 'n', label: 'Umlaeufe' }, { key: 'E', label: 'E in MeV' }], rows }), 'zyklotron_messreihe')),
        el('div', { class: 'chartbox' }, el('h4', {}, 'Endenergie über B²'), figE, resE)),
      el('div', { style: 'height:14px' }), tbl);
    function redraw() {
      tbl.render(rows);
      const sf = [], ff = [], se = [], fe = []; let tf = '', te = '';
      for (const k of Object.keys(PARTS)) {
        const rs = rows.filter(r => r.part === k); if (!rs.length) continue;
        const col = PCOL[k], nm = PARTS[k].sym;
        sf.push({ name: nm, color: col, mode: 'dot', points: rs.map(r => [r.B, r.f]) });
        se.push({ name: nm, color: col, mode: 'dot', points: rs.map(r => [r.B * r.B, r.E]) });
        if (new Set(rs.map(r => r.B)).size < 2) continue;
        const a = fit.propFit(rs.map(r => r.B), rs.map(r => r.f)), b = fit.propFit(rs.map(r => r.B * r.B), rs.map(r => r.E));
        if (!a || !b) continue;
        ff.push({ f: a.f, color: col }); fe.push({ f: b.f, color: col });
        const qm = 2 * Math.PI * a.a * 1e6, q = 2 * b.a * MEV / (R * R * qm), m = q / qm;
        tf += `<div><span>${nm}: Steigung ${fmt(a.a, 3)} MHz/T</span><br><b>q/m = ${fmt(qm / 1e7, 3)}·10⁷ C/kg</b></div>`;
        te += `<div><span>${nm}: Steigung ${fmt(b.a, 3)} MeV/T²</span><br><b>q = ${fmt(q / E0, 2)} e · m = ${fmt(m / U_AMU, 2)} u</b></div>`;
      }
      chF.set(sf, ff); chE.set(se, fe);
      resF.innerHTML = tf || '<span>Je Teilchen mindestens zwei Werte von B messen.</span>';
      resE.innerHTML = te || '<span>q aus beiden Steigungen: q = 2·Steigung_E / (R²·q/m), danach m = q/(q/m).</span>';
    }
    redraw();
    function take() {
      const run = S.run;
      if (!run) { toast('Erst ein Teilchen starten.'); return; }
      if (S.p < run.pEnd - 1e-6) { toast('Das Teilchen ist noch unterwegs. Warten oder „Zum Ende“.'); return; }
      if (run.status !== 'out') { toast('Das Teilchen hat den Detektor nicht erreicht. Frequenz nachstellen.'); return; }
      const sg = run.segs[run.segs.length - 1], E = sg.E / MEV * (1 + gauss(0.004));
      rows.push({ part: run.part, sym: PARTS[run.part].sym, B: run.B, f: run.f / 1e6, U: run.U, n: run.segs.length / 2, E });
      redraw(); toast(`Übernommen: ${PARTS[run.part].name}, B = ${fmt(run.B, 2)} T, f = ${fmt(run.f / 1e6, 3)} MHz, E = ${fmt(E, 2)} MeV`);
    }
    const detText = () => {
      const run = S.run; if (!run) return '–';
      if (S.p < run.pEnd - 1e-6) return 'läuft …';
      if (run.status === 'out') return `${fmt(run.segs[run.segs.length - 1].E / MEV, 2)} MeV`;
      return run.status === 'stop' ? 'nichts angekommen (gebremst)' : 'nichts angekommen (außer Tritt)';
    };

    // ======================= Ansicht 2D =======================
    async function view2d(box, MM) {
      box.insertAdjacentHTML('beforeend', svgMarkup());
      const svg = box.querySelector('svg'), q = id => svg.querySelector('#' + id);
      const CX = 310, CY = 320, SC = 260 / R;
      const X = x => CX + x * SC, Y = y => CY - y * SC;
      { let h = ''; for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) { const x = CX + i * 44, y = CY + j * 44; if (Math.hypot(x - CX, y - CY) < 280) h += `<circle cx="${x}" cy="${y}" r="5" fill="none" stroke-width="1.2"/><circle cx="${x}" cy="${y}" r="1.6" stroke="none"/>`; } q('zB').innerHTML = h; }
      { let h = ''; for (const y of [-160, -80, 0, 80, 160]) h += `<line x1="${CX}" y1="${CY + y}" x2="${CX}" y2="${CY + y}" stroke-width="2.4" marker-end="url(#zArr)"/>`; q('zE').innerHTML = h; }
      const eLines = [...q('zE').querySelectorAll('line')];
      let cache = { ver: -1, n: -1, d: '' }, raf = 0;
      const arcTo = sg => `A${(sg.r * SC).toFixed(2)} ${(sg.r * SC).toFixed(2)} 0 0 1 ${X(0).toFixed(2)} ${Y(sg.c - sg.s * sg.r).toFixed(2)}`;
      function frame() {
        raf = requestAnimationFrame(frame);
        const model = MM.model, run = S.run, st = stateAt(S.p);
        q('zB').setAttribute('opacity', model ? 0.45 : 0); q('zE').setAttribute('opacity', model ? 1 : 0); q('zMod').setAttribute('opacity', model && st && !st.done ? 1 : 0); q('zModT').setAttribute('opacity', model ? 1 : 0);
        // Bahn
        if (run) {
          const nDone = st ? Math.min(st.i, run.segs.length) : 0;
          if (cache.ver !== S.ver || cache.n !== nDone) {
            let d = `M${X(0)} ${Y(0)}`; for (let i = 0; i < nDone; i++) d += arcTo(run.segs[i]);
            cache = { ver: S.ver, n: nDone, d };
          }
          q('zPath').setAttribute('d', cache.d);
          let dc = '', dout = '';
          if (st && !st.done || (st && st.out)) {
            const sg = st.seg, y0 = sg.c + sg.s * sg.r;
            if (st.out) { dc = `M${X(0)} ${Y(y0)}A${(sg.r * SC).toFixed(2)} ${(sg.r * SC).toFixed(2)} 0 0 1 ${X(sg.s * sg.r).toFixed(2)} ${Y(sg.c).toFixed(2)}`; dout = `M${X(sg.s * sg.r).toFixed(2)} ${Y(sg.c).toFixed(2)}L${X(st.x).toFixed(2)} ${Y(st.y).toFixed(2)}`; }
            else dc = `M${X(0)} ${Y(y0)}A${(sg.r * SC).toFixed(2)} ${(sg.r * SC).toFixed(2)} 0 0 1 ${X(st.x).toFixed(2)} ${Y(st.y).toFixed(2)}`;
          }
          q('zCur').setAttribute('d', dc); q('zOut').setAttribute('d', dout);
          if (run.status === 'out' && S.p > run.pEnd - 0.7) { const sg = run.segs[run.segs.length - 1], dx = 0.3 * sg.s, dy = -sg.s, L = Math.hypot(dx, dy); q('zDet').setAttribute('transform', `translate(${X(sg.s * sg.r + dx / L * 0.135).toFixed(1)} ${Y(sg.c + dy / L * 0.135).toFixed(1)})`); q('zDet').setAttribute('opacity', 1); }
          else q('zDet').setAttribute('opacity', 0);
        } else { q('zPath').setAttribute('d', ''); q('zCur').setAttribute('d', ''); q('zOut').setAttribute('d', ''); q('zDet').setAttribute('opacity', 0); }
        const px = st ? X(st.x) : CX, py = st ? Y(st.y) : CY;
        q('zP').setAttribute('cx', px.toFixed(1)); q('zP').setAttribute('cy', py.toFixed(1)); q('zP').setAttribute('fill', PCOL[run ? run.part : S.part]);
        // Modell: v, F, E-Feld im Spalt
        const t = st ? st.t : 0, ph = Math.cos(2 * Math.PI * (run ? run.f : fGen()) * t);
        if (model) {
          eLines.forEach(l => { const L = 26 * ph; l.setAttribute('x1', (CX - L / 2).toFixed(1)); l.setAttribute('x2', (CX + L / 2).toFixed(1)); l.setAttribute('stroke', '#ffd27a'); l.setAttribute('opacity', Math.abs(ph) > 0.08 ? 0.9 : 0); });
          if (st && !st.done) {
            const vl = 48; q('zV').setAttribute('x1', px); q('zV').setAttribute('y1', py); q('zV').setAttribute('x2', px + st.vx * vl); q('zV').setAttribute('y2', py - st.vy * vl);
            q('zVt').setAttribute('x', px + st.vx * (vl + 10)); q('zVt').setAttribute('y', py - st.vy * (vl + 10));
            const fx = st.vy, fy = st.vx; // F = q·v×B mit B aus der Ebene: (vy, −vx); Bildschirm-y nach unten
            q('zF').setAttribute('x1', px); q('zF').setAttribute('y1', py); q('zF').setAttribute('x2', px + fx * 40); q('zF').setAttribute('y2', py + fy * 40);
            q('zF').setAttribute('opacity', st.out ? 0 : 1); q('zFt').setAttribute('opacity', st.out ? 0 : 1);
            q('zFt').setAttribute('x', px + fx * 54 - 8); q('zFt').setAttribute('y', py + fy * 54 + 4);
          }
        }
        // Generator und Spannung am Spalt
        q('zFd').textContent = fmt(fGen() / 1e6, 3) + ' MHz'; q('zUd').textContent = fmt(S.U, 0) + ' kV';
        if (run) {
          const win = 4 * run.Th, t0 = t - 3 * run.Th, XS = tt => 652 + (tt - t0) / win * 306, YS = v => 222 - v * 70;
          let d = ''; for (let i = 0; i <= 160; i++) { const tt = t0 + win * i / 160; d += `${i ? 'L' : 'M'}${XS(tt).toFixed(1)} ${YS(Math.cos(2 * Math.PI * run.f * tt)).toFixed(1)}`; }
          q('zSc').setAttribute('d', d);
          let m = ''; for (let i = Math.max(0, st.i - 4); i <= st.i; i++) { const sg = run.segs[i]; if (sg.t < t0) continue; m += `<circle cx="${XS(sg.t).toFixed(1)}" cy="${YS(Math.cos(2 * Math.PI * run.f * sg.t)).toFixed(1)}" r="5" fill="${sg.dE > 0 ? '#5ef08f' : '#ff6a5a'}"/>`; }
          q('zScM').innerHTML = m; q('zNow').setAttribute('x1', XS(t)); q('zNow').setAttribute('x2', XS(t));
        } else { q('zSc').setAttribute('d', ''); q('zScM').innerHTML = ''; q('zNow').setAttribute('x1', -10); q('zNow').setAttribute('x2', -10); }
        const pr = PARTS[run ? run.part : S.part];
        q('zR1').textContent = `${pr.name}`;
        q('zR2').textContent = st ? `E = ${fmt(st.seg.E / MEV, 3)} MeV   r = ${fmt(st.seg.r * 100, 1)} cm` : 'E = 0';
        q('zR3').textContent = st ? `Umlauf ${Math.floor(st.i / 2) + 1}   t = ${fmt(t * 1e6, 2)} µs` : 'bereit';
        q('zR4').textContent = st ? `v = ${fmt(Math.sqrt(2 * st.seg.E / run.m) / 1e6, 2)}·10⁶ m/s` : '';
        q('zR5').textContent = detText();
        q('zR6').textContent = model ? `Resonanz bei f = q·B/(2π·m) · Halbkreis dauert ${run ? fmt(run.Th * 1e9, 1) + ' ns' : '…'}` : '';
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); } };
    }

    // ======================= Ansicht 3D =======================
    async function view3d(box, MM) {
      const { createLab, mats, cable, label, arrow, glowSprite, powerSupply } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [0.12, 0.78, 1.08], target: [0.1, 0.08, 0.0], table: [2.4, 1.6], bloom: [0.9, 0.5, 0.8], room: 0.45, minDist: 0.3, maxDist: 2.6, fov: 38 });
      const { THREE, scene } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad · oberer Pol durchsichtig gezeichnet</div>');
      const iron = new THREE.MeshStandardMaterial({ color: 0x3a4045, metalness: 0.6, roughness: 0.45 });
      const ghost = new THREE.MeshStandardMaterial({ color: 0x6a737a, metalness: 0.3, roughness: 0.5, transparent: true, opacity: 0.16, depthWrite: false });
      const ghostCu = new THREE.MeshStandardMaterial({ color: 0xb8692f, metalness: 0.6, roughness: 0.4, transparent: true, opacity: 0.16, depthWrite: false });
      const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = mat.transparent !== true; scene.add(m); return m; };
      // Joch (C-Form), unterer Pol mit Spule, oberer Pol durchsichtig
      add(new THREE.BoxGeometry(0.5, 0.04, 0.9), iron, 0, 0.02, -0.08);
      add(new THREE.BoxGeometry(0.5, 0.36, 0.1), iron, 0, 0.18, -0.48);
      add(new THREE.BoxGeometry(0.5, 0.05, 0.62), ghost, 0, 0.335, -0.2);
      add(new THREE.CylinderGeometry(0.33, 0.33, 0.05, 64), iron, 0, 0.065, 0);
      const coilL = add(new THREE.TorusGeometry(0.36, 0.025, 12, 64), M.copper, 0, 0.065, 0); coilL.rotation.x = Math.PI / 2;
      add(new THREE.CylinderGeometry(0.33, 0.33, 0.07, 64), ghost, 0, 0.275, 0);
      const coilU = add(new THREE.TorusGeometry(0.36, 0.025, 12, 64), ghostCu, 0, 0.275, 0); coilU.rotation.x = Math.PI / 2;
      // Duanten (y 0.10 … 0.14)
      const YD = 0.12, HD = 0.04;
      const cuW = new THREE.MeshStandardMaterial({ color: 0xb8692f, metalness: 1, roughness: 0.32, side: THREE.DoubleSide });
      const lid = new THREE.MeshStandardMaterial({ color: 0xd89a62, metalness: 0.4, roughness: 0.3, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide });
      for (const [s, th0] of [[1, 0], [-1, Math.PI]]) {
        const g = new THREE.Group(); g.position.x = s * 0.006; scene.add(g);
        const bot = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.003, 64, 1, false, th0, Math.PI), cuW); bot.position.y = YD - HD / 2; bot.receiveShadow = true; g.add(bot);
        const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, HD, 64, 1, true, th0, Math.PI), cuW); wall.position.y = YD; g.add(wall);
        const top = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.002, 64, 1, false, th0, Math.PI), lid); top.position.y = YD + HD / 2; g.add(top);
        const edge = new THREE.Mesh(new THREE.BoxGeometry(0.003, HD, 2 * R), cuW); edge.position.y = YD; g.add(edge);
      }
      const lD1 = label(THREE, 'Duant 1', { color: '#e6c9a8', size: 0.022 }); lD1.position.set(-0.2, YD + 0.05, -0.2); const lD2 = label(THREE, 'Duant 2', { color: '#e6c9a8', size: 0.022 }); lD2.position.set(0.2, YD + 0.05, -0.2); scene.add(lD1, lD2);
      const src = glowSprite(THREE, 0xffcf8a, 0.02); src.position.set(0, YD, 0); scene.add(src);
      // Generator
      const gen = powerSupply(THREE, { label: 'HF-Generator', displays: 2, knobs: 2, dispColor: ['#ff5a3c', '#160807'] }); gen.position.set(0.56, 0, 0.12); gen.rotation.y = -0.6; scene.add(gen);
      scene.add(cable(THREE, gen.socketWorld(0), new THREE.Vector3(0.3, YD, 0.02), 0xc4231b, 0.05), cable(THREE, gen.socketWorld(1), new THREE.Vector3(-0.28, YD, 0.12), 0x151515, 0.08));
      // Detektor
      const det = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.04), M.housing); det.visible = false; scene.add(det);
      // Bahn
      const MAXP = 3000 * 24 + 64, pos = new Float32Array(MAXP * 3), geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const trail = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xb79bff, transparent: true, opacity: 0.8, toneMapped: false })); trail.frustumCulled = false; scene.add(trail);
      const dot = glowSprite(THREE, 0xffffff, 0.03); scene.add(dot);
      const V3 = (x, y) => new THREE.Vector3(x, YD, -y);
      // Modell
      const modelG = new THREE.Group(); scene.add(modelG);
      for (const x of [-0.2, 0, 0.2]) for (const z of [-0.2, 0, 0.2]) { const a = arrow(THREE, 0x86dcff, { radius: 0.0016, head: 0.014 }); a.set(new THREE.Vector3(x, YD - 0.03, z), new THREE.Vector3(0, 0.07, 0)); modelG.add(a); }
      const eArr = [-0.2, -0.1, 0, 0.1, 0.2].map(z => { const a = arrow(THREE, 0xffd27a, { radius: 0.0014, head: 0.01 }); a.z0 = z; modelG.add(a); return a; });
      const aV = arrow(THREE, 0xf2ac74, { radius: 0.002, head: 0.014 }), aF = arrow(THREE, 0xff7a8a, { radius: 0.002, head: 0.014 }); modelG.add(aV, aF);
      const lB = label(THREE, 'B', { color: '#86dcff', size: 0.025 }); lB.position.set(0.22, YD + 0.06, 0.2); modelG.add(lB);
      let ver = -1, nDone = -1, cnt = 0;
      const pushPt = (x, y) => { if (cnt >= MAXP) return; pos[cnt * 3] = x; pos[cnt * 3 + 1] = YD; pos[cnt * 3 + 2] = -y; cnt++; };
      const off = lab.onFrame(() => {
        const model = MM.model, run = S.run, st = stateAt(S.p);
        gen.displays[0].draw(fmt(fGen() / 1e6, 2), 'MHz'); gen.displays[1].draw(fmt(S.U, 0), 'kV');
        if (run && st) {
          const target = Math.min(st.i, run.segs.length);
          if (ver !== S.ver || target < nDone) { ver = S.ver; nDone = 0; cnt = 0; pushPt(0, 0); }
          while (nDone < target) { const sg = run.segs[nDone]; for (let k = 1; k <= 24; k++) { const th = k / 24 * Math.PI; pushPt(sg.s * sg.r * Math.sin(th), sg.c + sg.s * sg.r * Math.cos(th)); } nDone++; }
          let extra = 0; const base = cnt;
          if (!st.done || st.out) { const sg = st.seg, thEnd = st.out ? Math.PI / 2 : st.th; for (let k = 1; k <= 16; k++) { const th = k / 16 * thEnd; pushPt(sg.s * sg.r * Math.sin(th), sg.c + sg.s * sg.r * Math.cos(th)); extra++; } if (st.out) { pushPt(st.x, st.y); extra++; } }
          geo.setDrawRange(0, cnt); geo.attributes.position.needsUpdate = true; cnt = base;
          dot.position.copy(V3(st.x, st.y)); dot.material.color.set(PCOL[run.part]); dot.visible = !st.done || st.out;
          if (run.status === 'out' && S.p > run.pEnd - 0.7) { const sg = run.segs[run.segs.length - 1], dx = 0.3 * sg.s, dy = -sg.s, L = Math.hypot(dx, dy); det.position.copy(V3(sg.s * sg.r + dx / L * 0.14, sg.c + dy / L * 0.14)); det.lookAt(V3(sg.s * sg.r, sg.c)); det.visible = true; } else det.visible = false;
        } else { geo.setDrawRange(0, 0); dot.visible = false; det.visible = false; ver = -1; }
        modelG.visible = model; if (!model) return;
        const t = st ? st.t : 0, ph = Math.cos(2 * Math.PI * (run ? run.f : fGen()) * t);
        eArr.forEach(a => a.set(new THREE.Vector3(-0.025 * Math.sign(ph), YD, a.z0), new THREE.Vector3(0.05 * ph, 0, 0)));
        if (st && !st.done) { const p0 = V3(st.x, st.y); aV.set(p0, new THREE.Vector3(st.vx * 0.06, 0, -st.vy * 0.06)); aF.visible = !st.out; if (!st.out) aF.set(p0, new THREE.Vector3(st.vy * 0.05, 0, st.vx * 0.05)); }
        else { aV.visible = false; aF.visible = false; }
      });
      return { destroy() { off(); lab.dispose(); } };
    }

    const host = viewHost(stage, { id: 'zyklotron', views: { '2d': view2d, '3d': view3d }, initial: '2d', modelInfo: 'Magnetfeld, Lorentzkraft, Feld im Spalt' });
    let raf = 0, last = performance.now(), slow = 0;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      if (S.run && S.play) { S.p = Math.min(S.run.pEnd, S.p + dt * S.speed * (S.p > S.run.segs.length - 1 && S.run.status === 'out' ? 0.5 : 1)); if (S.p >= S.run.pEnd) S.play = false; }
      slow += dt; if (slow > 0.2) { slow = 0; dE.set(detText()); }
    }
    raf = requestAnimationFrame(loop);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); chF.destroy(); chE.destroy(); } };
  }
};
