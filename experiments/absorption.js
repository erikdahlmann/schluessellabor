// ============================================================================
//  Schlüsselexperiment: Absorptionsexperimente
//  Teil 1: Resonanzabsorption – Natriumflamme im Licht einer Natriumdampflampe
//          wirft einen Schatten; im Licht anderer Lampen nicht.
//  Teil 2: Absorption ionisierender Strahlung – α, β, γ hinter Papier, Aluminium, Blei.
//          T = e^(−μ·d) (β zusätzlich mit Reichweite), Zählrohr mit Torzeit, Nullrate 0,4 /s.
// ============================================================================
import { viewHost } from '../js/lib/views.js';

const N0 = 0.4;
// Teil 2: Grundzählraten bei 2 cm Abstand ohne Absorber (1/s)
const SRC = {
  am: { name: 'Am-241', parts: { a: 300, g: 4 }, gk: 'am' },
  sr: { name: 'Sr-90', parts: { b: 400 } , bk: 'sr' },
  co: { name: 'Co-60', parts: { g: 25, b: 30 }, gk: 'co', bk: 'co' },
  ra: { name: 'Ra-226', parts: { a: 60, b: 50, g: 8 }, gk: 'ra', bk: 'ra' }
};
const MAT = { papier: { name: 'Papier', rho: 0.8, col: '#efe9dc' }, al: { name: 'Aluminium', rho: 2.7, col: '#b9c2c8' }, pb: { name: 'Blei', rho: 11.35, col: '#5d646a' } };
// γ: Schwächungskoeffizient je mm
const MU_G = { am: { papier: 0.016, al: 0.075, pb: 6.0 }, co: { papier: 0.0045, al: 0.015, pb: 0.066 }, ra: { papier: 0.006, al: 0.02, pb: 0.09 } };
// β: [Anteil, μ/ρ in cm²/g, Reichweite in g/cm²]
const BETA = { sr: [[0.5, 33, 0.18], [0.5, 6.9, 1.1]], co: [[1, 63, 0.09]], ra: [[0.4, 20, 0.35], [0.6, 5.5, 1.5]] };
function trans(kind, src, mat, dmm) {
  if (dmm <= 0) return 1;
  if (kind === 'a') return 0;                                          // schon ein Blatt Papier hält α auf
  if (kind === 'g') return Math.exp(-MU_G[SRC[src].gk][mat] * dmm);
  const m = dmm / 10 * MAT[mat].rho;                                     // Massenbelegung g/cm²
  return BETA[SRC[src].bk].reduce((s, [w, mu, R]) => s + w * Math.exp(-mu * m) * Math.max(0, 1 - (m / R) ** 4), 0);
}

const svgA = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Resonanzabsorption: Lampe, Brennerflamme und Schirm mit dem Schatten der Flamme">
<defs>
  <linearGradient id="aBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15181b"/><stop offset="1" stop-color="#0d0f11"/></linearGradient>
  <radialGradient id="aLamp"><stop offset="0" stop-color="#fff"/><stop id="aLc" offset=".35" stop-color="#ffd400"/><stop id="aLc2" offset="1" stop-color="#ffd400" stop-opacity="0"/></radialGradient>
  <linearGradient id="aBeam" x1="0" y1="0" x2="1" y2="0"><stop id="aB1" offset="0" stop-color="#ffd400" stop-opacity=".35"/><stop id="aB2" offset="1" stop-color="#ffd400" stop-opacity=".12"/></linearGradient>
  <filter id="aBl"><feGaussianBlur stdDeviation="5"/></filter>
</defs>
<rect width="1000" height="620" fill="url(#aBg)"/>
<text x="40" y="120" fill="#8e979d" font-size="13">Seitenansicht</text>
<circle cx="120" cy="300" r="90" fill="url(#aLamp)"/>
<rect x="90" y="270" width="60" height="60" rx="8" fill="#2b3034" opacity=".6"/>
<text id="aLampT" x="120" y="420" fill="#ece6dc" font-size="13" text-anchor="middle"></text>
<path d="M150 260 L760 150 L760 450 L150 340 Z" fill="url(#aBeam)" id="aBeamP"/>
<rect x="760" y="140" width="14" height="320" fill="#efece4"/>
<rect id="aShadow" x="760" width="14" fill="#15181b"/>
<text x="767" y="132" fill="#8e979d" font-size="11" text-anchor="middle">Schirm</text>
<rect x="420" y="400" width="24" height="140" fill="#9aa0a6"/><ellipse cx="432" cy="545" rx="50" ry="10" fill="#2b3034"/>
<path id="aFlame" d="M418 400 C405 340 425 270 432 220 C440 270 459 340 446 400 Z" filter="url(#aBl)"/>
<text id="aFlT" x="470" y="470" fill="#ece6dc" font-size="13"></text>
<g id="aPhot"></g>
<rect x="800" y="270" width="150" height="80" rx="8" fill="#d7d2c4"/><text x="812" y="290" fill="#333" font-size="11">Lichtsensor im Schatten</text>
<rect x="812" y="298" width="126" height="32" rx="3" fill="#1d2a1d"/><text id="aI" x="930" y="321" fill="#b7ffd6" font-size="17" font-family="IBM Plex Mono, monospace" text-anchor="end"></text>
<g id="aModT" opacity="0"><text x="40" y="590" fill="#c7c1b7" font-size="12">Natriumatome in der Flamme absorbieren Photonen mit genau 2,10 eV (589 nm) und senden sie in alle Richtungen neu aus.</text><text x="40" y="606" fill="#c7c1b7" font-size="12">In Richtung Schirm fehlt dieses Licht. Photonen anderer Energie gehen ungehindert durch.</text></g>
</svg>`;

const svgB = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Absorption ionisierender Strahlung: Präparat, Absorberplatten und Zählrohr auf einer Schiene, Zählgerät">
<defs>
  <linearGradient id="bBg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15181b"/><stop offset="1" stop-color="#0d0f11"/></linearGradient>
  <linearGradient id="bTube" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a9095"/><stop offset=".45" stop-color="#d7dbde"/><stop offset="1" stop-color="#5d646a"/></linearGradient>
  <filter id="bGl2"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="1000" height="620" fill="url(#bBg2)"/>
<rect x="60" y="320" width="560" height="16" rx="3" fill="#8a9095"/>
<rect x="104" y="246" width="10" height="74" fill="#9aa0a6"/><rect x="96" y="232" width="26" height="30" rx="4" fill="#c9cbc8"/>
<g transform="translate(109 247)"><circle r="7" fill="#ffd400"/><path d="M0 -1.5 L-4 -6 A7 7 0 0 1 4 -6Z M1.3 .8 L5.6 -2.6 A7 7 0 0 1 1.6 6.5Z M-1.3 .8 L-1.6 6.5 A7 7 0 0 1 -5.6 -2.6Z" fill="#111"/></g>
<text id="bSrcT" x="109" y="220" fill="#ece6dc" font-size="13" text-anchor="middle"></text>
<g id="bAbs"></g>
<text id="bAbsT" x="270" y="372" fill="#ece6dc" font-size="13" text-anchor="middle"></text>
<rect x="420" y="234" width="170" height="26" rx="5" fill="url(#bTube)"/><rect x="417" y="236" width="5" height="22" fill="#6a5a3a"/><rect x="500" y="260" width="10" height="60" fill="#9aa0a6"/>
<text x="505" y="292" fill="#c9c3ba" font-size="11" text-anchor="middle">Zählrohr</text>
<path d="M590 247 C640 247 650 140 680 140" stroke="#151515" stroke-width="3" fill="none"/>
<g id="bTr"></g>
<rect x="680" y="60" width="290" height="190" rx="10" fill="#2b3034"/>
<text x="696" y="82" fill="#c9c3ba" font-size="12">Zählgerät</text>
<rect x="696" y="90" width="200" height="50" rx="4" fill="#160807"/><text id="bN" x="886" y="128" fill="#ff5a3c" font-size="32" font-family="IBM Plex Mono, monospace" text-anchor="end"></text>
<rect x="696" y="160" width="130" height="34" rx="4" fill="#160807"/><text id="bT" x="818" y="184" fill="#ff5a3c" font-size="18" font-family="IBM Plex Mono, monospace" text-anchor="end"></text>
<circle id="bLed" cx="930" cy="114" r="10" fill="#3a1410"/>
<text id="bSt" x="696" y="228" fill="#c9c3ba" font-size="12"></text>
<text id="bR" x="680" y="300" fill="#ece6dc" font-size="15" font-family="IBM Plex Mono, monospace"></text>
<g id="bLeg" opacity="0"><text x="60" y="440" fill="#ff8a7a" font-size="12">α: von einem Blatt Papier gestoppt</text><text x="60" y="460" fill="#86dcff" font-size="12">β: einige mm Aluminium</text><text x="60" y="480" fill="#c7b6ff" font-size="12">γ: wird in Blei nur geschwächt, nie ganz gestoppt</text></g>
</svg>`;

export default {
  intro: 'Zwei Absorptionsversuche. Eine Natriumflamme wirft im Licht einer Natriumdampflampe einen dunklen Schatten, im Licht anderer Lampen nicht: Resonanzabsorption. Im zweiten Teil schwächt ihr α-, β- und γ-Strahlung mit Papier, Aluminium und Blei und unterscheidet so die Strahlungsarten.',
  docs: {
    durchfuehrung: `
<h3>Teil 1: Natriumflamme</h3>
<p>Eine Natriumdampflampe beleuchtet einen weißen Schirm. Dazwischen steht ein Bunsenbrenner. Ein Lichtsensor misst die Helligkeit an der Stelle des Schattens.</p>
<ol>
<li>Brenner ohne Salz: Gibt es einen Schatten? Dann Natriumsalz in die Flamme bringen.</li>
<li>Natriummenge erhöhen und jeweils Helligkeit und Absorption <b>übernehmen</b>.</li>
<li>Die Lampe gegen eine Glühlampe oder Quecksilberlampe tauschen. Ebenso eine Lithiumflamme verwenden. Wann entsteht ein Schatten?</li>
</ol>
<h3>Teil 2: ionisierende Strahlung</h3>
<p>Das Präparat steht 2 cm vor dem Fenster eines Zählrohrs. Dazwischen werden Absorber aus Papier, Aluminium oder Blei gestellt.</p>
<ol>
<li>Nullrate messen (ohne Präparat, 100 s).</li>
<li>Für jedes Präparat mit einem Blatt Papier, mit 5 mm Aluminium und mit 10 mm Blei zählen. Daraus die Strahlungsarten bestimmen.</li>
<li>γ-Strahlung von Co-60: Die Zählrate für Bleidicken von 0 bis 30 mm messen und die Halbwertsdicke bestimmen.</li>
<li>β-Strahlung von Sr-90: Die Zählrate hinter Aluminium von 0 bis 5 mm messen. Wo liegt die Reichweite?</li>
</ol>
<p><b>Strahlenschutz:</b> Präparate nur mit der Zange, Abstand halten, Aufenthalt kurz. Bleiplatten nach dem Versuch Hände waschen.</p>`,
    theorie: `
<h3>Resonanzabsorption</h3>
<p>Ein Atom kann ein Photon nur absorbieren, wenn dessen Energie genau einem Übergang zwischen zwei Energieniveaus entspricht. Das Licht der Natriumlampe besteht fast nur aus Photonen mit 2,10 eV (589 nm), genau der Energie, die Natriumatome selbst aussenden. Die Atome in der Flamme absorbieren diese Photonen und geben sie in alle Richtungen wieder ab. Deshalb wirft die Flamme einen Schatten, obwohl sie selbst leuchtet. Photonen anderer Energie gehen durch: Im Licht einer Glühlampe gibt es keinen sichtbaren Schatten.</p>
<span class="formula tex">E_\\text{Photon} = \\frac{h\\, c}{\\lambda} = E_{3p} - E_{3s} = 2{,}10\\ \\text{eV}</span>
<h3>Absorption ionisierender Strahlung</h3>
<ul><li><b>α-Strahlung</b> (Heliumkerne) gibt ihre Energie auf kurzer Strecke ab: einige Zentimeter Luft oder ein Blatt Papier halten sie auf.</li>
<li><b>β-Strahlung</b> (Elektronen) hat in Materie eine Reichweite, bei Sr-90/Y-90 etwa 4 mm Aluminium. Bis dahin nimmt die Zählrate etwa exponentiell ab.</li>
<li><b>γ-Strahlung</b> (Photonen) wird nur geschwächt, nie ganz aufgehalten. Blei schwächt besonders stark.</li></ul>
<span class="formula tex">n(d) = n_0\\, e^{-\\mu d} \\qquad d_{1/2} = \\frac{\\ln 2}{\\mu}</span>
<p>Nach jeder Halbwertsdicke d½ ist die Zählrate (ohne Nullrate) auf die Hälfte gesunken. Für die γ-Strahlung von Co-60 in Blei ist d½ ≈ 1 cm.</p>
<h3>Modellgrenzen</h3>
<ul><li>Teil 1: Absorption A = 1 − e^(−k·c) mit der Natriummenge c, das Leuchten der Flamme selbst trägt etwas zur Helligkeit bei.</li><li>Teil 2: Feste Geometrie, Totzeit vernachlässigt. β-Schwächung mit zwei Anteilen und Reichweite, Bremsstrahlung vernachlässigt.</li></ul>
<h3>Was die Modellansicht zeigt</h3>
<ul><li>Teil 1: Photonen der Lampe. Gelbe Photonen werden in der Natriumflamme absorbiert und in andere Richtungen ausgesandt.</li><li>Teil 2: Bahnen der Teilchen. α (rot) endet am ersten Absorber, β (blau) kommt durch dünne Schichten, γ (violett) meist durch.</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Teil 1</td><td>Natriumdampflampe, Glühlampe, Quecksilberlampe; Bunsenbrenner mit NaCl oder LiCl; Schirm; Lichtsensor</td></tr>
<tr><td>Präparate</td><td>Am-241 (α, schwaches γ), Sr-90 (β), Co-60 (γ, schwaches β), Ra-226 (α, β, γ)</td></tr>
<tr><td>Absorber</td><td>Papier 0 … 2 mm, Aluminium 0 … 10 mm, Blei 0 … 30 mm</td></tr>
<tr><td>Zählrohr</td><td>Endfenster, Abstand zum Präparat 2 cm, Nullrate etwa 0,4 /s</td></tr>
</tbody></table>`,
    abi: `
<details class="q"><summary>Erkläre, warum die Natriumflamme im Licht der Natriumlampe einen Schatten wirft, obwohl sie selbst gelb leuchtet. <span class="op">AFB II</span></summary><p>Die Na-Atome absorbieren die Photonen der Lampe, weil deren Energie genau ihrem Übergang 3s → 3p entspricht. Die absorbierte Energie wird in alle Richtungen abgegeben. In Richtung Schirm kommt deshalb viel weniger Licht an als ohne Flamme. Das Eigenleuchten der Flamme verteilt sich ebenfalls in alle Richtungen und gleicht den Verlust nicht aus.</p></details>
<details class="q"><summary>Ein Präparat: ohne Absorber 210 /s, mit Papier 205 /s, mit 5 mm Al 6 /s, mit 10 mm Pb 0,4 /s (Nullrate 0,4 /s). Welche Strahlung sendet es aus? <span class="op">AFB II</span></summary><p>Papier schwächt kaum: kein nennenswertes α. Aluminium hält fast alles auf: β-Strahlung. Hinter Blei bleibt nur die Nullrate: kein γ. Es ist ein reiner β-Strahler (zum Beispiel Sr-90).</p></details>
<details class="q"><summary>Die Zählrate von Co-60 sinkt hinter 30 mm Blei von 25 /s auf 3,4 /s (ohne Nullrate). Berechne μ und d½. <span class="op">AFB II</span></summary><p>μ = ln(25/3,4)/30 mm ≈ 0,066 /mm, d½ = ln 2/μ ≈ 10,5 mm.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, segmented, selectBox, check, button, fmt, dataTable, toast, display } = ui;
    const S = { part: 'a', lamp: 'na', flame: 'na', c: 0.6, src: 'co', mat: 'pb', d: 0, gate: 10, fast: false, run: false, N: 0, tc: 0, ev: [] };
    let hostRef = null;
    const absA = () => { const res = S.lamp === 'na' && S.flame === 'na' ? 1 - Math.exp(-3.2 * S.c) : S.flame === 'none' ? 0 : 0.015; return res; };
    const emit = () => S.flame === 'na' ? 0.06 * S.c : S.flame === 'li' ? 0.03 * S.c : 0.005;
    const reading = () => (S.lamp === 'none' ? 0 : 100 * (1 - absA())) + 100 * emit();
    const rateB = () => { if (S.src === 'none') return N0; let n = N0; for (const [k, r] of Object.entries(SRC[S.src].parts)) n += r * trans(k, S.src, S.mat, S.d); return n; };

    const gV = group('Versuch');
    const segP = segmented({ value: 'a', options: [{ value: 'a', label: 'Natriumflamme' }, { value: 'b', label: 'Ionisierende Strahlung' }], onChange: v => { S.part = v; gA.hidden = v !== 'a'; gB.hidden = v !== 'b'; gZ.hidden = v !== 'b'; S.run = false; hostRef?.refresh(); } });
    gV.append(el('div', { class: 'ctl' }, el('div', { style: 'grid-column:1/-1' }, segP)));
    const gA = group('Lampe und Flamme', { led: true }); gA.led(true);
    const segL = segmented({ value: 'na', options: [{ value: 'na', label: 'Na-Dampflampe' }, { value: 'w', label: 'Glühlampe' }, { value: 'hg', label: 'Hg-Lampe' }], onChange: v => { S.lamp = v; } });
    const segF = segmented({ value: 'na', options: [{ value: 'none', label: 'ohne Salz' }, { value: 'na', label: 'NaCl' }, { value: 'li', label: 'LiCl' }], onChange: v => { S.flame = v; } });
    const sC = slider({ label: 'Salzmenge in der Flamme', min: 0, max: 1, step: 0.05, value: S.c, digits: 2, onInput: v => { S.c = v; } });
    const dI = display('Helligkeit im Schatten (ohne Flamme 100 %)');
    gA.append(el('div', { class: 'ctl' }, el('label', { style: 'grid-column:1/-1' }, 'Lampe'), el('div', { style: 'grid-column:1/-1' }, segL)), el('div', { class: 'ctl' }, el('label', { style: 'grid-column:1/-1' }, 'Flamme'), el('div', { style: 'grid-column:1/-1' }, segF)), sC, dI,
      el('div', { class: 'bar' }, button('Messwert übernehmen', () => takeA(), 'btn small primary')));
    const gB = group('Präparat und Absorber');
    const selS = selectBox({ label: 'Präparat', value: 'co', options: [{ value: 'none', label: 'kein Präparat (Nullrate)' }, ...Object.entries(SRC).map(([k, v]) => ({ value: k, label: v.name }))], onChange: v => { S.src = v; } });
    const segM = segmented({ value: 'pb', options: Object.entries(MAT).map(([k, v]) => ({ value: k, label: v.name })), onChange: v => { S.mat = v; } });
    const sD = slider({ label: 'Dicke d', min: 0, max: 30, step: 0.1, value: 0, unit: 'mm', digits: 1, onInput: v => { S.d = v; } });
    gB.append(selS, el('div', { class: 'ctl' }, el('label', { style: 'grid-column:1/-1' }, 'Absorber'), el('div', { style: 'grid-column:1/-1' }, segM)), sD);
    const gZ = group('Zählgerät', { led: true });
    const selG = selectBox({ label: 'Torzeit', value: '10', options: [['10', '10 s'], ['60', '60 s'], ['100', '100 s']].map(([v, l]) => ({ value: v, label: l })), onChange: v => { S.gate = +v; } });
    const cF = check({ label: 'Zeitraffer (× 10)', checked: false, onChange: v => { S.fast = v; } });
    const dN = display('Impulse N'), dR = display('Zählrate n = N/t');
    gZ.append(selG, cF, el('div', { class: 'bar' }, button('Start', () => { S.N = 0; S.tc = 0; S.run = true; gZ.led(true); }, 'btn small primary'), button('Stopp', () => { S.run = false; gZ.led(false); })), dN, dR,
      el('div', { class: 'bar' }, button('Messwert übernehmen', () => takeB(), 'btn small primary')));
    controls.append(gV, gA, gB, gZ); gB.hidden = gZ.hidden = true;

    // Messwerte
    const rowsA = [], rowsB = [];
    const tblA = dataTable([{ key: 'lamp', label: 'Lampe', fmt: v => v }, { key: 'fl', label: 'Flamme', fmt: v => v }, { key: 'c', label: 'Salzmenge', digits: 2 }, { key: 'I', label: 'Helligkeit in %', digits: 1 }, { key: 'A', label: 'Absorption in %', digits: 1 }], { onDelete: i => { rowsA.splice(i, 1); redraw(); } });
    const tblB = dataTable([{ key: 'src', label: 'Präparat', fmt: v => v }, { key: 'mat', label: 'Absorber', fmt: v => v }, { key: 'd', label: 'd in mm', digits: 1 }, { key: 't', label: 't in s', digits: 0 }, { key: 'N', label: 'N', digits: 0 }, { key: 'n', label: 'n in 1/s', digits: 2 }, { key: 'nn', label: 'n − n₀ in 1/s', digits: 2 }], { onDelete: i => { rowsB.splice(i, 1); redraw(); } });
    const figA = el('div', { class: 'fig' }), figB = el('div', { class: 'fig' }); const chA = new Chart(figA, { xlabel: 'Salzmenge (relativ)', ylabel: 'Absorption in %', ymin: 0 }), chB = new Chart(figB, { xlabel: 'd in mm', ylabel: 'n − n₀ in 1/s', ymin: 0 });
    const resA = el('div', { class: 'result' }), resB = el('div', { class: 'result' });
    messwerte.append(
      el('div', { class: 'data' },
        el('div', { class: 'chartbox' }, el('h4', {}, 'Teil 1: Absorption über Salzmenge'), figA, resA, csvTools(() => ({ meta: ['Resonanzabsorption'], columns: [{ key: 'lamp', label: 'Lampe' }, { key: 'fl', label: 'Flamme' }, { key: 'c', label: 'Salzmenge' }, { key: 'I', label: 'Helligkeit %' }, { key: 'A', label: 'Absorption %' }], rows: rowsA }), 'absorption_natrium')),
        el('div', { class: 'chartbox' }, el('h4', {}, 'Teil 2: Zählrate über Absorberdicke'), figB, resB, csvTools(() => ({ meta: ['Absorption ionisierender Strahlung, Abstand 2 cm'], columns: [{ key: 'src', label: 'Praeparat' }, { key: 'mat', label: 'Absorber' }, { key: 'd', label: 'd in mm' }, { key: 't', label: 't in s' }, { key: 'N', label: 'N' }, { key: 'n', label: 'n in 1/s' }], rows: rowsB }), 'absorption_strahlung'))),
      el('div', { style: 'height:14px' }), tblA, el('div', { style: 'height:14px' }), tblB);
    const n0 = () => { const z = rowsB.filter(r => r.src === 'kein Präparat'); return z.length ? z.reduce((s, r) => s + r.N, 0) / z.reduce((s, r) => s + r.t, 0) : N0; };
    const COL = ['#86dcff', '#f2ac74', '#7fd6a0', '#c7b6ff', '#ffd27a', '#ff8a7a'];
    function redraw() {
      tblA.render(rowsA); tblB.render(rowsB);
      const ka = [...new Set(rowsA.map(r => `${r.lamp} · ${r.fl}`))];
      chA.set(ka.map((k, i) => { const rs = rowsA.filter(r => `${r.lamp} · ${r.fl}` === k).sort((a, b) => a.c - b.c); return { name: k, color: COL[i % 6], points: rs.map(r => [r.c, r.A]) }; }));
      resA.innerHTML = rowsA.length ? '<span>Nur die Kombination Natriumlampe + Natriumflamme zeigt starke Absorption.</span>' : '<span>Messwerte für verschiedene Lampen, Flammen und Salzmengen übernehmen.</span>';
      const z = n0(), kb = [...new Set(rowsB.filter(r => r.src !== 'kein Präparat').map(r => `${r.src} · ${r.mat}`))], ser = [], fits = []; let tb = '';
      kb.forEach((k, i) => { const rs = rowsB.filter(r => `${r.src} · ${r.mat}` === k).sort((a, b) => a.d - b.d); const pts = rs.map(r => [r.d, Math.max(0, r.n - z)]); ser.push({ name: k, color: COL[i % 6], mode: 'dot', points: pts });
        const pos = pts.filter(p => p[1] > 0.3); if (new Set(pos.map(p => p[0])).size >= 3) { const e = fit.expDecayFit(pos.map(p => p[0]), pos.map(p => p[1])); if (e) { fits.push({ f: e.f, color: COL[i % 6] }); tb += `<div><span>${k}: μ = ${fmt(1 / e.tau, 3)} /mm</span><br><b>d½ = ${fmt(e.tau * Math.LN2, 2)} mm</b></div>`; } } });
      chB.set(ser, fits); resB.innerHTML = (rowsB.some(r => r.src === 'kein Präparat') ? `<span>Nullrate n₀ = ${fmt(z, 2)} /s abgezogen. </span>` : '<span>Nullrate noch nicht gemessen, gerechnet mit 0,4 /s. </span>') + (tb || '<span>Mindestens drei Dicken je Präparat und Absorber messen.</span>');
    }
    redraw();
    const lampName = { na: 'Na-Dampflampe', w: 'Glühlampe', hg: 'Hg-Lampe' }, flName = { none: 'ohne Salz', na: 'NaCl', li: 'LiCl' };
    function takeA() { const I = reading(); rowsA.push({ lamp: lampName[S.lamp], fl: flName[S.flame], c: S.flame === 'none' ? 0 : S.c, I, A: Math.max(0, 100 - I) }); redraw(); toast(`Übernommen: Helligkeit ${fmt(I, 1)} %`); }
    function takeB() {
      if (S.run) { toast('Die Zählung läuft noch.'); return; } if (S.tc < 1) { toast('Erst zählen.'); return; }
      rowsB.push({ src: S.src === 'none' ? 'kein Präparat' : SRC[S.src].name, mat: S.d > 0 ? MAT[S.mat].name : 'ohne', d: S.d, t: S.tc, N: S.N, n: S.N / S.tc, nn: S.N / S.tc - n0() }); redraw();
      toast(`Übernommen: N = ${S.N} in ${fmt(S.tc, 0)} s`);
    }

    // ======================= Ansichten Teil 1 =======================
    async function view2dA(box, MM) {
      box.insertAdjacentHTML('beforeend', svgA());
      const svg = box.querySelector('svg'), q = id => svg.querySelector('#' + id);
      let raf = 0;
      function frame() {
        raf = requestAnimationFrame(frame);
        const model = MM.model, now = performance.now() / 1000, lc = { na: '#ffd400', w: '#fff1c8', hg: '#cfe0ff' }[S.lamp];
        for (const id of ['aLc', 'aLc2', 'aB1', 'aB2']) q(id).setAttribute('stop-color', lc);
        q('aLampT').textContent = lampName[S.lamp];
        const fc = S.flame === 'na' ? '#ffd400' : S.flame === 'li' ? '#ff3b4a' : '#4a7cff', fo = S.flame === 'none' ? 0.35 : 0.35 + 0.55 * S.c;
        q('aFlame').setAttribute('fill', fc); q('aFlame').setAttribute('opacity', fo.toFixed(2)); q('aFlT').textContent = 'Brenner: ' + flName[S.flame];
        const I = reading() / 100; q('aShadow').setAttribute('y', 218); q('aShadow').setAttribute('height', 242);
        q('aShadow').setAttribute('fill', `rgba(21,24,27,${Math.max(0, Math.min(1, 1 - I)).toFixed(2)})`);
        q('aI').textContent = `${fmt(reading(), 1)} %`;
        q('aModT').setAttribute('opacity', model ? 1 : 0);
        let ph = '';
        if (model) for (let i = 0; i < 14; i++) { const u = (now * 0.5 + i / 14) % 1, x = 160 + u * 600, y = 300 + (i % 5 - 2) * 18 * (0.4 + u), yel = S.lamp === 'na' || (S.lamp !== 'hg' && i % 5 === 0), col = yel ? '#ffd400' : S.lamp === 'hg' ? ['#a08cff', '#7dffb8', '#ffe066'][i % 3] : ['#ff6a5a', '#7dffb8', '#86dcff'][i % 3];
          const absorbed = yel && S.flame === 'na' && (i * 37 % 100) / 100 < absA() && x > 432;
          if (absorbed) { const a = i * 2.3, r = (x - 432) * 0.6; ph += `<circle cx="${(432 + Math.cos(a) * r).toFixed(1)}" cy="${(300 + Math.sin(a) * r).toFixed(1)}" r="4" fill="${col}" opacity=".6"/>`; }
          else ph += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${col}"/>`; }
        q('aPhot').innerHTML = ph;
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); } };
    }
    async function view3dA(box, MM) {
      const { createLab, mats } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [0.05, 0.4, 1.0], target: [0.1, 0.16, 0], table: [1.8, 1.2], bloom: [0.8, 0.45, 0.8], room: 0.1, minDist: 0.2, maxDist: 2.5, fov: 38 });
      const { THREE, scene } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad · Raum abgedunkelt</div>');
      const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = !mat.transparent; scene.add(m); return m; };
      const lampM = new THREE.MeshBasicMaterial({ color: 0xffd400, toneMapped: false }); add(new THREE.SphereGeometry(0.03, 24, 16), lampM, -0.3, 0.2, 0); add(new THREE.CylinderGeometry(0.01, 0.01, 0.17, 12), M.steel, -0.3, 0.085, 0);
      const light = new THREE.SpotLight(0xffd400, 1.1, 2, 0.32, 0.4, 1); light.position.set(-0.3, 0.2, 0); light.target.position.set(0.5, 0.2, 0); light.castShadow = true; light.shadow.camera.near = 0.05; light.shadow.camera.far = 2; light.shadow.mapSize.set(1024, 1024); scene.add(light, light.target);
      add(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 16), M.steel, 0.1, 0.07, 0); add(new THREE.CylinderGeometry(0.04, 0.045, 0.01, 24), M.housing, 0.1, 0.005, 0);
      const fM = new THREE.MeshStandardMaterial({ color: 0xffd400, emissive: 0xffd400, emissiveIntensity: 1.2, transparent: true, opacity: 0.8 });
      const flame = add(new THREE.SphereGeometry(1, 20, 14), fM, 0.1, 0.19, 0); flame.scale.set(0.02, 0.06, 0.02); flame.castShadow = true;
      const scr = add(new THREE.BoxGeometry(0.01, 0.3, 0.4), new THREE.MeshStandardMaterial({ color: 0x9a978f, roughness: 0.95 }), 0.5, 0.17, 0); scr.receiveShadow = true;
      const off = lab.onFrame((dt, t) => {
        const lc = { na: 0xffd400, w: 0xfff1c8, hg: 0xcfe0ff }[S.lamp]; lampM.color.set(lc); light.color.set(lc);
        const fc = S.flame === 'na' ? 0xffd400 : S.flame === 'li' ? 0xff3b4a : 0x4a7cff; fM.color.set(fc); fM.emissive.set(fc); fM.opacity = S.flame === 'none' ? 0.3 : 0.4 + 0.5 * S.c;
        flame.castShadow = absA() > 0.2; flame.scale.y = 0.06 * (1 + 0.04 * Math.sin(t * 17));
      });
      return { destroy() { off(); lab.dispose(); } };
    }

    // ======================= Ansichten Teil 2 =======================
    async function view2dB(box, MM) {
      box.insertAdjacentHTML('beforeend', svgB());
      const svg = box.querySelector('svg'), q = id => svg.querySelector('#' + id);
      let raf = 0;
      function frame() {
        raf = requestAnimationFrame(frame);
        const model = MM.model, now = performance.now() / 1000, w = Math.min(160, S.d * (S.mat === 'pb' ? 5 : S.mat === 'al' ? 14 : 40));
        q('bAbs').innerHTML = S.d > 0 ? `<rect x="${270 - w / 2}" y="208" width="${Math.max(3, w)}" height="80" fill="${MAT[S.mat].col}" stroke="#333"/>` : '';
        q('bAbsT').textContent = S.d > 0 ? `${MAT[S.mat].name}, d = ${fmt(S.d, 1)} mm` : 'kein Absorber';
        q('bSrcT').textContent = S.src === 'none' ? 'kein Präparat' : SRC[S.src].name;
        q('bN').textContent = String(S.N); q('bT').textContent = `${fmt(S.tc, 1)} s`;
        const lastEv = S.ev.length ? S.ev[S.ev.length - 1].w : -1; q('bLed').setAttribute('fill', now - lastEv < 0.05 ? '#ff4a2a' : '#3a1410');
        q('bSt').textContent = S.run ? `zählt … (Torzeit ${S.gate} s)` : 'bereit'; q('bR').textContent = S.tc > 0 ? `n = ${fmt(S.N / S.tc, 2)} /s` : '';
        q('bLeg').setAttribute('opacity', model ? 1 : 0);
        let tr = '';
        if (model && S.src !== 'none') {
          for (const e of S.trk) { const age = now - e.w; if (age > 0.3) continue; const op = (1 - age / 0.3).toFixed(2), col = { a: '#ff8a7a', b: '#86dcff', g: '#c7b6ff' }[e.k];
            const xEnd = e.stop ? 270 - w / 2 + e.depth * w : 420; tr += `<line x1="122" y1="247" x2="${xEnd.toFixed(1)}" y2="${(247 + e.dy * (xEnd - 122) / 300).toFixed(1)}" stroke="${col}" stroke-width="2" opacity="${op}"${e.k === 'g' ? ' stroke-dasharray="5 3"' : ''}/>`; if (e.stop) tr += `<circle cx="${xEnd.toFixed(1)}" cy="${(247 + e.dy * (xEnd - 122) / 300).toFixed(1)}" r="3" fill="${col}" opacity="${op}"/>`; }
        }
        q('bTr').innerHTML = tr;
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); } };
    }
    async function view3dB(box, MM) {
      const { createLab, mats, cable, makeDisplay } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [0.06, 0.24, 0.42], target: [0.06, 0.07, 0], table: [1.6, 1.2], bloom: [0.6, 0.4, 0.88], room: 0.55, minDist: 0.12, maxDist: 2, fov: 38 });
      const { THREE, scene } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad</div>');
      const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = !mat.transparent; scene.add(m); return m; };
      const Y = 0.06;
      add(new THREE.BoxGeometry(0.32, 0.01, 0.04), new THREE.MeshStandardMaterial({ color: 0x8a9095, metalness: 0.7, roughness: 0.4 }), 0.06, 0.005, 0);
      add(new THREE.CylinderGeometry(0.003, 0.003, Y, 10), M.steel, -0.06, Y / 2, 0); const src = add(new THREE.CylinderGeometry(0.01, 0.01, 0.008, 20), new THREE.MeshStandardMaterial({ color: 0xc9cbc8, metalness: 0.6, roughness: 0.3 }), -0.056, Y, 0); src.rotation.z = Math.PI / 2;
      const tube = add(new THREE.CylinderGeometry(0.009, 0.009, 0.11, 24), M.steel, 0.02 + 0.055, Y, 0); tube.rotation.z = Math.PI / 2;
      add(new THREE.CylinderGeometry(0.003, 0.003, Y, 10), M.steel, 0.08, Y / 2, 0);
      const plate = add(new THREE.BoxGeometry(1, 0.05, 0.05), new THREE.MeshStandardMaterial({ color: 0x5d646a, roughness: 0.5, metalness: 0.4 }), -0.02, Y, 0);
      const ctr = new THREE.Group(); ctr.position.set(0.25, 0, -0.12); ctr.rotation.y = -0.4; scene.add(ctr);
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.12), M.housing); body.position.y = 0.045; ctr.add(body);
      const dN3 = makeDisplay(THREE, 320, 96); const dm = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.033), new THREE.MeshBasicMaterial({ map: dN3.tex, toneMapped: false })); dm.position.set(-0.02, 0.06, 0.0605); ctr.add(dm);
      scene.add(cable(THREE, new THREE.Vector3(0.13, Y, 0), new THREE.Vector3(0.2, 0.03, -0.06), 0x151515, 0.03));
      const off = lab.onFrame(() => {
        const dm2 = S.d / 1000 * 1.5; plate.visible = S.d > 0; plate.scale.x = Math.max(0.0008, dm2); plate.material.color.set(S.mat === 'pb' ? 0x5d646a : S.mat === 'al' ? 0xb9c2c8 : 0xefe9dc); plate.position.x = -0.03 + dm2 / 2;
        src.visible = S.src !== 'none'; dN3.draw(String(S.N));
      });
      return { destroy() { off(); lab.dispose(); } };
    }

    const host = viewHost(stage, { id: 'absorption', views: { '2d': (b, m) => S.part === 'a' ? view2dA(b, m) : view2dB(b, m), '3d': (b, m) => S.part === 'a' ? view3dA(b, m) : view3dB(b, m) }, initial: '2d', modelInfo: 'Photonen, Teilchenbahnen' });
    hostRef = host;
    S.trk = [];
    let raf = 0, last = performance.now(), slow = 0;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      const dtR = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      if (S.part === 'b') {
        const sp = S.fast ? 10 : 1, dt = dtR * sp, lam = rateB() * dt; let k = 0;
        if (lam < 30) { let p = Math.exp(-lam), c = p, u = Math.random(); while (u > c) { k++; p *= lam / k; c += p; } } else k = Math.max(0, Math.round(lam + Math.sqrt(lam) * (Math.random() * 2 - 1) * 1.7));
        if (S.run) { const left = S.gate - S.tc; const kk = left < dt ? Math.round(k * left / dt) : k; S.N += kk; S.tc = Math.min(S.gate, S.tc + dt); if (S.tc >= S.gate) { S.run = false; gZ.led(false); } }
        const wall = performance.now() / 1000; if (k) S.ev.push({ w: wall }); while (S.ev.length && wall - S.ev[0].w > 1) S.ev.shift();
        // Bahnen fürs Modell (auch gestoppte Teilchen)
        if (S.src !== 'none' && Math.random() < dtR * 25) { const parts = Object.entries(SRC[S.src].parts); let s = parts.reduce((a, p) => a + p[1], 0) * Math.random(); let kind = parts[0][0]; for (const [kk, r] of parts) { s -= r; if (s <= 0) { kind = kk; break; } }
          const T = trans(kind, S.src, S.mat, S.d), stop = Math.random() > T; S.trk.push({ w: wall, k: kind, stop: stop && S.d > 0, depth: Math.random() * (kind === 'a' ? 0.05 : 1), dy: (Math.random() * 2 - 1) * 8 }); if (stop && S.d <= 0) S.trk.pop(); }
        while (S.trk.length && wall - S.trk[0].w > 0.5) S.trk.shift();
      }
      slow += dtR; if (slow > 0.2) { slow = 0; dI.set(`${fmt(reading(), 1)} %`); dN.set(String(S.N)); dR.set(S.tc > 0 ? `${fmt(S.N / S.tc, 2)} /s` : '–'); }
    }
    raf = requestAnimationFrame(loop);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); chA.destroy(); chB.destroy(); } };
  }
};
