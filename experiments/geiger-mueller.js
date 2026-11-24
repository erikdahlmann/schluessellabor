// ============================================================================
//  Schlüsselexperiment: Geiger-Müller-Zählrohr
//  Zählrate aus Aktivität, Raumwinkel des Fensters, Ansprechwahrscheinlichkeit
//  und Zählrohrkennlinie, dazu Nullrate 0,4 /s und Totzeit 100 µs.
//  Zufällige Impulse (Poisson-Prozess). Messungen: Kennlinie, Nullrate,
//  Abstandsgesetz, Häufigkeitsverteilung der Impulszahlen.
// ============================================================================
import { viewHost } from '../js/lib/views.js';

const N0 = 0.4, TAU = 1e-4, WIN_R = 0.0045, OFFSET = 0.006;
// Strahlungsanteile je Zerfall: [Art, Teilchen je Zerfall]
const SRC = {
  none: { name: 'kein Präparat', A: 0, parts: [] },
  sr: { name: 'Sr-90 (β)', A: 74e3, parts: [['b', 2]] },
  am: { name: 'Am-241 (α, γ)', A: 370e3, parts: [['a', 1], ['g', 0.36]] },
  co: { name: 'Co-60 (γ)', A: 74e3, parts: [['g', 2], ['b', 1]] },
  ra: { name: 'Ra-226 (α, β, γ)', A: 3.3e3, parts: [['a', 4], ['b', 2], ['g', 2.2]] }
};
const PCOL = { a: '#ff8a7a', b: '#86dcff', g: '#c7b6ff', n: '#9aa0a6' };
const omega = r => { const d = r + OFFSET; return 0.5 * (1 - d / Math.sqrt(d * d + WIN_R * WIN_R)); };
function effParts(kind, r) {
  if (kind === 'a') { const rc = r * 100; return rc < 3.5 ? 0.9 * (1 - (rc / 3.5) ** 3) : 0; }
  if (kind === 'b') return 0.9 * Math.exp(-r / 0.4);
  return 0.01;
}
const kenn = U => (U < 300 ? 0 : 1 / (1 + Math.exp(-(U - 365) / 9))) * (1 + 0.0006 * (U - 450));
const discharge = U => U > 600 ? 40 * Math.exp((U - 600) / 11) : 0;

const svgMarkup = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Präparat und Geiger-Müller-Zählrohr auf einer Schiene, Zählgerät mit Anzeige">
<defs>
  <linearGradient id="gBg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2024"/><stop offset="1" stop-color="#121518"/></linearGradient>
  <linearGradient id="gTube" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a9095"/><stop offset=".45" stop-color="#d7dbde"/><stop offset="1" stop-color="#5d646a"/></linearGradient>
  <filter id="gSh2" x="-10%" y="-10%" width="130%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity=".55"/></filter>
  <filter id="gGl2"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="1000" height="620" fill="url(#gBg2)"/>
<!-- Schiene mit Maßstab -->
<rect x="60" y="300" width="560" height="18" rx="3" fill="#8a9095"/>
<g id="gSc" stroke="#222" font-size="10" fill="#222"></g>
<!-- Präparat -->
<rect x="104" y="226" width="10" height="74" fill="#9aa0a6"/>
<rect id="gSrcBody" x="96" y="214" width="26" height="30" rx="4" fill="#c9cbc8"/>
<circle cx="122" cy="229" r="6" fill="#d4a017"/>
<g transform="translate(109 229)"><circle r="7" fill="#ffd400"/><path d="M0 -1.5 L-4 -6 A7 7 0 0 1 4 -6Z M1.3 .8 L5.6 -2.6 A7 7 0 0 1 1.6 6.5Z M-1.3 .8 L-1.6 6.5 A7 7 0 0 1 -5.6 -2.6Z" fill="#111"/><circle r="1.4" fill="#111"/></g>
<text id="gSrcT" x="109" y="200" fill="#c9c3ba" font-size="12" text-anchor="middle"></text>
<!-- Zählrohr -->
<g id="gTubeG">
  <rect x="0" y="216" width="170" height="26" rx="5" fill="url(#gTube)" filter="url(#gSh2)"/>
  <rect x="-3" y="218" width="5" height="22" rx="1" fill="#6a5a3a"/>
  <rect x="80" y="242" width="10" height="58" fill="#9aa0a6"/>
  <path d="M170 229 C230 229 260 120 640 120" stroke="#151515" stroke-width="3" fill="none"/>
  <text x="85" y="268" fill="#c9c3ba" font-size="11" text-anchor="middle">Zählrohr</text>
</g>
<text id="gR" x="340" y="350" fill="#ece6dc" font-size="14" font-family="IBM Plex Mono, monospace" text-anchor="middle"></text>
<g id="gTracks"></g>
<!-- Zählgerät -->
<rect x="640" y="40" width="330" height="200" rx="10" fill="#2b3034" filter="url(#gSh2)"/>
<text x="656" y="62" fill="#c9c3ba" font-size="12">Zählgerät</text>
<rect x="656" y="70" width="210" height="50" rx="4" fill="#160807"/><text id="gN" x="856" y="108" fill="#ff5a3c" font-size="32" font-family="IBM Plex Mono, monospace" text-anchor="end"></text>
<text x="660" y="136" fill="#8e979d" font-size="11">Impulse</text>
<rect x="656" y="142" width="130" height="34" rx="4" fill="#160807"/><text id="gT" x="778" y="166" fill="#ff5a3c" font-size="18" font-family="IBM Plex Mono, monospace" text-anchor="end"></text>
<text x="660" y="190" fill="#8e979d" font-size="11">Zeit</text>
<rect x="796" y="142" width="160" height="34" rx="4" fill="#160807"/><text id="gU" x="948" y="166" fill="#ff5a3c" font-size="18" font-family="IBM Plex Mono, monospace" text-anchor="end"></text>
<text x="800" y="190" fill="#8e979d" font-size="11">Zählrohrspannung</text>
<circle id="gLed" cx="910" cy="96" r="10" fill="#3a1410"/><text x="910" y="128" fill="#8e979d" font-size="10" text-anchor="middle">Impuls</text>
<g transform="translate(930 210)"><circle r="14" fill="#151515" stroke="#444"/><circle r="5" fill="#333"/></g>
<text id="gState" x="656" y="226" fill="#c9c3ba" font-size="12"></text>
<text id="gWarn" x="805" y="262" fill="#ff9a5a" font-size="13" text-anchor="middle"></text>
<!-- Anzeigen -->
<text x="660" y="300" fill="#8e979d" font-size="12">Letzte Messung</text>
<text id="gL1" x="660" y="326" fill="#ece6dc" font-size="15" font-family="IBM Plex Mono, monospace"></text>
<text id="gL2" x="660" y="350" fill="#ece6dc" font-size="15" font-family="IBM Plex Mono, monospace"></text>
<!-- Modell: Querschnitt -->
<g id="gMod" opacity="0">
  <rect x="40" y="390" width="580" height="210" rx="10" fill="#0b0d0f" stroke="#2a3238"/>
  <text x="54" y="410" fill="#c7c1b7" font-size="12">Zählrohr im Längsschnitt (vergrößert)</text>
  <rect x="80" y="430" width="500" height="140" rx="10" fill="none" stroke="#b9bec2" stroke-width="5"/>
  <rect x="74" y="436" width="8" height="128" fill="#6a5a3a"/><text x="70" y="590" fill="#c7c1b7" font-size="11">Glimmerfenster</text>
  <line x1="120" y1="500" x2="560" y2="500" stroke="#ffd27a" stroke-width="2"/><text x="566" y="504" fill="#ffd27a" font-size="11">+</text>
  <text x="606" y="590" fill="#c7c1b7" font-size="11" text-anchor="end">Draht (+), Rohrwand (−), Gasfüllung</text>
  <g id="gField2" stroke="#86dcff" stroke-width="1" opacity=".45"></g>
  <g id="gAva"></g>
  <rect x="640" y="390" width="330" height="210" rx="10" fill="#0b0d0f" stroke="#2a3238"/>
  <text x="654" y="410" fill="#c7c1b7" font-size="12">Spannung am Arbeitswiderstand</text>
  <path id="gPulse" fill="none" stroke="#7dffb8" stroke-width="2"/>
  <text x="654" y="590" fill="#8e979d" font-size="11">jeder Impuls: kurzer Spannungsstoß, danach Totzeit</text>
</g>
</svg>`;

export default {
  intro: 'Ein Geiger-Müller-Zählrohr meldet jedes ionisierende Teilchen, das im Rohr eine Gasentladung auslöst, als kurzen Impuls. Ihr nehmt die Zählrohrkennlinie auf, messt die Nullrate, prüft das Abstandsgesetz und untersucht, wie stark die Impulszahlen zufällig schwanken.',
  docs: {
    durchfuehrung: `
<h3>Aufbau</h3>
<p>Ein Endfenster-Zählrohr (Glimmerfenster, Durchmesser 9 mm) steht auf einer Schiene mit Maßstab gegenüber einem Präparathalter. Das Zählgerät liefert die Zählrohrspannung, zählt die Impulse während einer einstellbaren Torzeit und macht sie über einen Lautsprecher hörbar.</p>
<h3>Durchführung</h3>
<ol>
<li><b>Nullrate:</b> Ohne Präparat 100 s zählen. Die Nullrate n₀ = N/t berechnen.</li>
<li><b>Kennlinie:</b> Sr-90 in 5 cm Abstand. Die Spannung in 20-V-Schritten von 300 V bis 600 V erhöhen und jeweils 10 s zählen. Den Arbeitspunkt in der Mitte des Plateaus wählen.</li>
<li><b>Abstandsgesetz:</b> Bei 500 V für Abstände von 2 cm bis 20 cm zählen. Die Nullrate abziehen und über 1/r² auftragen.</li>
<li><b>Statistik:</b> Die Messreihe mit 100 Zählungen zu je 1 s starten. Häufigkeitsverteilung, Mittelwert und Standardabweichung mit der Poisson-Verteilung vergleichen.</li>
<li>Mit Am-241 die Reichweite von α-Strahlung in Luft untersuchen.</li>
</ol>
<p><b>Strahlenschutz:</b> Präparate nur mit der Zange anfassen, Abstand halten, Aufenthaltsdauer kurz halten, nach dem Versuch zurück in den Tresor.</p>`,
    theorie: `
<h3>Aufbau und Funktion</h3>
<p>Das Zählrohr ist ein Metallrohr mit einem dünnen Draht in der Mitte. Zwischen Draht (+) und Rohrwand (−) liegen einige hundert Volt. Das Rohr ist mit einem Edelgas und etwas Löschgas gefüllt. Ein ionisierendes Teilchen erzeugt einige Ionenpaare. Die Elektronen werden zum Draht beschleunigt. In seiner Nähe ist das Feld so stark, dass sie weitere Atome ionisieren. Es entsteht eine Elektronenlawine, die sich längs des ganzen Drahts ausbreitet. Am Arbeitswiderstand entsteht ein Spannungsstoß, unabhängig von der Energie des Teilchens.</p>
<h3>Kennlinie und Totzeit</h3>
<p>Unterhalb der Einsatzspannung entsteht keine zählbare Entladung. Darüber folgt ein Plateau, auf dem die Zählrate kaum von der Spannung abhängt. Bei zu hoher Spannung brennt eine Dauerentladung, die das Rohr zerstört. Nach jedem Impuls ist das Rohr etwa τ = 100 µs lang unempfindlich (Totzeit):</p>
<span class="formula tex">n_\\text{gemessen} = \\frac{n}{1 + n\\, \\tau}</span>
<h3>Nullrate</h3>
<p>Auch ohne Präparat zählt das Rohr Impulse: Höhenstrahlung und natürliche Radioaktivität der Umgebung. Sie wird von jeder Messung abgezogen.</p>
<h3>Abstandsgesetz</h3>
<p>Ein punktförmiges Präparat strahlt gleichmäßig in alle Richtungen. Das Fenster fängt den Anteil A_F/(4πr²) auf:</p>
<span class="formula tex">n - n_0 \\sim \\frac{1}{r^2}</span>
<p>Bei kleinen Abständen weicht die Messung ab, weil Präparat und Fenster nicht punktförmig sind und r bis zum Präparat im Halter gemessen werden müsste.</p>
<h3>Zufall und Poisson-Verteilung</h3>
<p>Wann ein Kern zerfällt, ist zufällig. Die Zahl N der Impulse in einer festen Zeit folgt der Poisson-Verteilung mit dem Mittelwert μ:</p>
<span class="formula tex">P(N = k) = \\frac{\\mu^k}{k!}\\, e^{-\\mu} \\qquad \\sigma = \\sqrt{\\mu}</span>
<p>Eine Messung mit N Impulsen hat deshalb die Unsicherheit √N. Die relative Unsicherheit 1/√N wird mit längerer Messzeit kleiner.</p>
<h3>Modellgrenzen</h3>
<ul><li>Aktivitäten wie bei Schulpräparaten, Sr-90 mit Tochter Y-90 (zwei β je Zerfall). Ansprechwahrscheinlichkeit: α 90 % (Reichweite in Luft etwa 3,5 cm), β 90 %, γ 1 %.</li><li>Die Kennlinie ist modelliert: Einsatz bei etwa 360 V, Plateau mit 6 % Anstieg je 100 V, ab 600 V Dauerentladung.</li></ul>
<h3>Was die Modellansicht zeigt</h3>
<ul><li>Die Bahnen der Teilchen vom Präparat ins Zählrohr (α rot, β blau, γ violett). Gezeichnet sind nur Teilchen, die einen Impuls auslösen.</li><li>Das Zählrohr im Längsschnitt mit dem Feld zwischen Draht und Wand und der Lawine längs des Drahts.</li><li>Die Spannungsimpulse am Arbeitswiderstand.</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Zählrohr</td><td>Endfenster, Glimmerfenster 9 mm, Totzeit 100 µs, Einsatzspannung etwa 360 V, Plateau 400 … 600 V</td></tr>
<tr><td>Zählgerät</td><td>0 … 700 V, Torzeit 1 · 10 · 60 · 100 s oder Dauerzählung, Lautsprecher</td></tr>
<tr><td>Präparate</td><td>Sr-90 74 kBq, Am-241 370 kBq, Co-60 74 kBq, Ra-226 3,3 kBq</td></tr>
<tr><td>Schiene</td><td>Abstand Präparat–Fenster 1,5 … 30 cm</td></tr>
<tr><td>Nullrate</td><td>etwa 0,4 Impulse je Sekunde</td></tr>
</tbody></table>`,
    abi: `
<details class="q"><summary>In 100 s werden ohne Präparat 38 Impulse gezählt, mit Präparat in 10 s 312 Impulse. Berechne die Zählrate des Präparats. <span class="op">AFB I</span></summary><p>n₀ = 0,38 s⁻¹, n = 31,2 s⁻¹, Präparat: n − n₀ ≈ 30,8 s⁻¹.</p></details>
<details class="q"><summary>Begründe, warum man bei einer Zählung mit 100 Impulsen eine Unsicherheit von etwa 10 % angibt. <span class="op">AFB II</span></summary><p>Die Impulszahl ist Poisson-verteilt mit σ = √N = 10. Das sind 10 % von 100. Für 1 % Unsicherheit braucht man 10 000 Impulse.</p></details>
<details class="q"><summary>Der Abstand wird von 4 cm auf 8 cm verdoppelt. Wie ändert sich die Zählrate (ohne Nullrate)? <span class="op">AFB I</span></summary><p>Sie sinkt nach dem Abstandsgesetz auf ein Viertel.</p></details>
<details class="q"><summary>Mit Am-241 sinkt die Zählrate ab etwa 3,5 cm fast auf die Nullrate. Erkläre. <span class="op">AFB II</span></summary><p>α-Teilchen geben ihre Energie auf kurzer Strecke an die Luft ab. Ihre Reichweite liegt bei wenigen Zentimetern. Die schwache γ-Strahlung des Präparats wird nur selten registriert.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, segmented, selectBox, check, button, fmt, dataTable, toast, display } = ui;
    const S = { src: 'sr', r: 0.05, U: 500, gate: 10, run: false, N: 0, tc: 0, t: 0, fast: false, deadUntil: -1, ev: [], snd: true,
      series: null, hist: [], last: null };
    const trueRate = () => {
      const sc = SRC[S.src], om = omega(S.r); let n = N0;
      for (const [k, y] of sc.parts) n += sc.A * y * om * effParts(k, S.r);
      return n * kenn(S.U) + discharge(S.U);
    };
    const kindPick = () => {
      const sc = SRC[S.src], om = omega(S.r), w = [['n', N0]]; for (const [k, y] of sc.parts) w.push([k, sc.A * y * om * effParts(k, S.r)]);
      let s = w.reduce((a, b) => a + b[1], 0) * Math.random(); for (const [k, v] of w) { s -= v; if (s <= 0) return k; } return 'n';
    };
    // Ton
    let actx = null; const click = () => { if (!S.snd || !actx || actx.state !== 'running') return; try { const b = actx.createBuffer(1, 220, actx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < 220; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / 30); const s = actx.createBufferSource(); s.buffer = b; const g = actx.createGain(); g.gain.value = 0.25; s.connect(g).connect(actx.destination); s.start(); } catch { /* ohne Ton */ } };

    const gP = group('Präparat und Abstand');
    const selS = selectBox({ label: 'Präparat', value: 'sr', options: Object.entries(SRC).map(([k, v]) => ({ value: k, label: v.name })), onChange: v => { S.src = v; } });
    const sR = slider({ label: 'Abstand r (Präparat–Fenster)', min: 1.5, max: 30, step: 0.5, value: 5, unit: 'cm', digits: 1, onInput: v => { S.r = v / 100; } });
    gP.append(selS, sR);
    const gZ = group('Zählgerät', { led: true }); gZ.led(true);
    const sU = slider({ label: 'Zählrohrspannung U', min: 250, max: 650, step: 10, value: S.U, unit: 'V', digits: 0, onInput: v => { S.U = v; } });
    const selG = selectBox({ label: 'Torzeit', value: '10', options: [['1', '1 s'], ['10', '10 s'], ['60', '60 s'], ['100', '100 s'], ['0', 'Dauerzählung']].map(([v, l]) => ({ value: v, label: l })), onChange: v => { S.gate = +v; } });
    const cF = check({ label: 'Zeitraffer (× 10)', checked: false, onChange: v => { S.fast = v; } });
    const cT = check({ label: 'Lautsprecher', checked: true, onChange: v => { S.snd = v; } });
    const bStart = button('Start', () => start(), 'btn small primary');
    gZ.append(sU, selG, el('div', { class: 'bar' }, bStart, button('Stopp', () => stop()), button('Null', () => { stop(); S.N = 0; S.tc = 0; })), cF, cT);
    const gM = group('Messung');
    const dN = display('Impulse N'), dRate = display('Zählrate n = N/t'), dU2 = display('Unsicherheit ±√N');
    gM.append(dN, dRate, dU2, el('div', { class: 'bar' }, button('Messwert übernehmen', () => take(), 'btn small primary')),
      el('div', { class: 'bar' }, button('Messreihe: 100 × 1 s', () => startSeries())));
    controls.append(gP, gZ, gM);
    controls.addEventListener('pointerdown', () => { try { actx ??= new AudioContext(); actx.resume(); } catch { /* ohne Ton */ } });
    function start() { if (S.series) return; S.N = 0; S.tc = 0; S.run = true; gZ.led(true); try { actx ??= new AudioContext(); actx.resume(); } catch { /* */ } }
    function stop() { S.run = false; if (S.series) { S.series = null; toast('Messreihe abgebrochen.'); } }
    function startSeries() { if (S.U > 600) { toast('Spannung zuerst ins Plateau stellen.'); return; } S.series = { k: 0, counts: [], cfg: { src: S.src, r: S.r, U: S.U } }; S.N = 0; S.tc = 0; S.run = true; toast('Messreihe läuft im Zeitraffer (100 × 1 s).'); }

    const rows = [];
    const tbl = dataTable([
      { key: 'srcN', label: 'Präparat', fmt: v => v }, { key: 'U', label: 'U in V', digits: 0 }, { key: 'r', label: 'r in cm', fmt: v => fmt(v * 100, 1) },
      { key: 't', label: 't in s', digits: 0 }, { key: 'N', label: 'N', digits: 0 }, { key: 'n', label: 'n in 1/s', digits: 2 }, { key: 'dn', label: '± in 1/s', digits: 2 }
    ], { onDelete: i => { rows.splice(i, 1); redraw(); } });
    const figK = el('div', { class: 'fig' }), figA = el('div', { class: 'fig' }), figH = el('div', { class: 'fig' });
    const chK = new Chart(figK, { xlabel: 'U in V', ylabel: 'n in 1/s' }), chA = new Chart(figA, { xlabel: '1/r² in 1/cm²', ylabel: 'n − n₀ in 1/s' }), chH = new Chart(figH, { xlabel: 'Impulse je 1 s', ylabel: 'Häufigkeit' });
    const resK = el('div', { class: 'result' }), resA = el('div', { class: 'result' }), resH = el('div', { class: 'result' });
    messwerte.append(
      el('div', { class: 'data' },
        el('div', { class: 'chartbox' }, el('h4', {}, 'Zählrohrkennlinie'), figK, resK,
          csvTools(() => ({ meta: ['Geiger-Mueller-Zaehlrohr'], columns: [{ key: 'srcN', label: 'Praeparat' }, { key: 'U', label: 'U in V' }, { key: 'r', label: 'r in m' }, { key: 't', label: 't in s' }, { key: 'N', label: 'N' }, { key: 'n', label: 'n in 1/s' }], rows }), 'zaehlrohr_messreihe')),
        el('div', { class: 'chartbox' }, el('h4', {}, 'Abstandsgesetz'), figA, resA)),
      el('div', { style: 'height:14px' }),
      el('div', { class: 'chartbox' }, el('h4', {}, 'Häufigkeitsverteilung (100 Zählungen à 1 s)'), figH, resH,
        csvTools(() => ({ meta: ['Haeufigkeitsverteilung, Torzeit 1 s'], columns: [{ key: 'i', label: 'Nr' }, { key: 'N', label: 'N' }], rows: S.hist.map((N, i) => ({ i: i + 1, N })) }), 'zaehlrohr_statistik')),
      el('div', { style: 'height:14px' }), tbl);
    const n0 = () => { const z = rows.filter(r => r.src === 'none' && r.U >= 400 && r.U <= 600); if (!z.length) return null; return z.reduce((s, r) => s + r.N, 0) / z.reduce((s, r) => s + r.t, 0); };
    function redraw() {
      tbl.render(rows);
      const keys = [...new Set(rows.map(r => `${r.src}|${r.r}`))], sk = []; const cols = ['#86dcff', '#f2ac74', '#7fd6a0', '#c7b6ff', '#ffd27a'];
      keys.forEach((k, i) => { const rs = rows.filter(r => `${r.src}|${r.r}` === k).sort((a, b) => a.U - b.U); if (new Set(rs.map(r => r.U)).size < 2) return; sk.push({ name: `${SRC[rs[0].src].name.split(' ')[0]}, ${fmt(rs[0].r * 100, 1)} cm`, color: cols[i % 5], points: rs.map(r => [r.U, r.n]) }, { color: cols[i % 5], mode: 'dot', points: rs.map(r => [r.U, r.n]) }); });
      chK.set(sk); resK.innerHTML = sk.length ? '<span>Arbeitspunkt in der Mitte des flachen Teils (Plateau) wählen.</span>' : '<span>Bei festem Präparat und Abstand mehrere Spannungen messen.</span>';
      const z0 = n0() ?? N0, sa = [], fa = []; let ta = '';
      for (const [i, s] of Object.keys(SRC).filter(s => s !== 'none').entries()) {
        const rs = rows.filter(r => r.src === s && r.U >= 400 && r.U <= 600); if (new Set(rs.map(r => r.r)).size < 2) continue;
        const pts = rs.map(r => [1 / (r.r * 100) ** 2, r.n - z0]); sa.push({ name: SRC[s].name.split(' ')[0], color: cols[i % 5], mode: 'dot', points: pts });
        const far = pts.filter(p => p[0] < 1 / 9); const f = fit.propFit((far.length >= 2 ? far : pts).map(p => p[0]), (far.length >= 2 ? far : pts).map(p => p[1]));
        if (f) { fa.push({ f: f.f, color: cols[i % 5] }); ta += `<div><span>${SRC[s].name.split(' ')[0]}: Ursprungsgerade (r ≥ 3 cm)</span><br><b>Steigung ${fmt(f.a, 1)} cm²/s</b></div>`; }
      }
      chA.set(sa, fa); resA.innerHTML = (n0() == null ? '<span>Nullrate noch nicht gemessen, gerechnet mit 0,4 /s. </span>' : `<span>Nullrate n₀ = ${fmt(n0(), 2)} /s abgezogen. </span>`) + (ta || '<span>Bei mehreren Abständen messen.</span>');
      if (S.hist.length) {
        const h = S.hist, mu = h.reduce((a, b) => a + b, 0) / h.length, sd = Math.sqrt(h.reduce((a, b) => a + (b - mu) ** 2, 0) / (h.length - 1));
        const lo = Math.max(0, Math.floor(mu - 4 * Math.sqrt(mu) - 1)), hi = Math.ceil(mu + 4 * Math.sqrt(mu) + 1), step = Math.max(1, Math.round((hi - lo) / 30));
        const bars = [], pois = []; let lf = 0; for (let k = 0; k <= lo; k++) lf += k ? Math.log(k) : 0;
        for (let k = lo; k <= hi; k += step) {
          const c = h.filter(v => v >= k && v < k + step).length; bars.push([k, 0], [k, c], [k + step, c], [k + step, 0]);
          let p = 0; for (let j = k; j < k + step; j++) { let l = 0; for (let q = 2; q <= j; q++) l += Math.log(q); p += Math.exp(j * Math.log(mu) - mu - l); } pois.push([k + step / 2, p * h.length]);
        }
        chH.set([{ color: '#7fd6a0', points: bars, name: 'gemessen' }, { color: '#c7b6ff', mode: 'dot', points: pois, name: 'Poisson' }]);
        resH.innerHTML = `<div><span>Mittelwert</span><br><b>μ = ${fmt(mu, 1)}</b></div><div><span>Standardabweichung</span><br><b>σ = ${fmt(sd, 2)}</b> <span>· √μ = ${fmt(Math.sqrt(mu), 2)}</span></div>`;
      } else { chH.set([]); resH.innerHTML = '<span>Messreihe starten: 100 Zählungen zu je 1 s.</span>'; }
    }
    redraw();
    function take() {
      if (S.run) { toast('Die Zählung läuft noch.'); return; }
      if (S.tc < 0.5) { toast('Erst zählen.'); return; }
      const t = S.tc, N = S.N; rows.push({ src: S.src, srcN: SRC[S.src].name.split(' ')[0], U: S.U, r: S.r, t, N, n: N / t, dn: Math.sqrt(Math.max(1, N)) / t }); redraw();
      toast(`Übernommen: N = ${N} in ${fmt(t, 0)} s, n = ${fmt(N / t, 2)} /s`);
    }

    // ======================= Ansicht 2D =======================
    async function view2d(box, MM) {
      box.insertAdjacentHTML('beforeend', svgMarkup());
      const svg = box.querySelector('svg'), q = id => svg.querySelector('#' + id);
      const XS = 122, PX = 14, Xr = r => XS + r * 100 * PX;
      { let h = ''; for (let c = 0; c <= 34; c++) { const x = Xr(c / 100); if (x > 618) break; h += `<line x1="${x}" y1="300" x2="${x}" y2="${c % 5 ? 306 : 311}"/>`; if (c % 5 === 0) h += `<text x="${x}" y="316" text-anchor="middle" stroke="none" font-size="9">${c}</text>`; } q('gSc').innerHTML = h; }
      { let h = ''; for (let x = 140; x <= 540; x += 40) h += `<path d="M${x} 498 V438 M${x} 502 V562"/>`; q('gField2').innerHTML = h; }
      let raf = 0;
      function frame() {
        raf = requestAnimationFrame(frame);
        const model = MM.model, xw = Xr(S.r), now = performance.now() / 1000;
        q('gTubeG').setAttribute('transform', `translate(${xw} 0)`);
        q('gSrcT').textContent = SRC[S.src].name; q('gSrcBody').setAttribute('opacity', S.src === 'none' ? 0.3 : 1);
        q('gR').textContent = `r = ${fmt(S.r * 100, 1)} cm`; q('gR').setAttribute('x', (XS + xw) / 2);
        q('gN').textContent = String(S.N); q('gT').textContent = `${fmt(S.tc, 1)} s`; q('gU').textContent = `${S.U} V`;
        const lastEv = S.ev.length ? S.ev[S.ev.length - 1].w : -1;
        q('gLed').setAttribute('fill', now - lastEv < 0.05 ? '#ff4a2a' : '#3a1410');
        q('gState').textContent = S.series ? `Messreihe: Zählung ${S.series.k + 1} von 100` : S.run ? (S.gate ? `zählt … (Torzeit ${S.gate} s)` : 'Dauerzählung läuft') : 'bereit';
        q('gWarn').textContent = S.U > 600 ? '⚠ Dauerentladung: Spannung sofort senken' : S.U < 360 ? 'Spannung unter der Einsatzspannung' : '';
        q('gL1').textContent = `n = ${S.tc > 0 ? fmt(S.N / S.tc, 2) : '–'} /s`; q('gL2').textContent = `±√N = ±${fmt(Math.sqrt(S.N), 0)}`;
        q('gMod').setAttribute('opacity', model ? 1 : 0);
        let tr = '', av = '';
        if (model) {
          for (const e of S.ev) { const age = now - e.w; if (age > 0.35) continue; const op = (1 - age / 0.35).toFixed(2);
            if (e.k !== 'n') { const y0 = 229 + e.dy * 0.4, y1 = 229 + e.dy; tr += `<line x1="122" y1="${y0}" x2="${(xw + 30 + e.dx * 60).toFixed(0)}" y2="${y1.toFixed(0)}" stroke="${PCOL[e.k]}" stroke-width="2" opacity="${op}"${e.k === 'g' ? ' stroke-dasharray="4 3"' : ''}/>`; }
            const xa = 130 + e.dx * 380; av += `<line x1="120" y1="500" x2="560" y2="500" stroke="#fff6c8" stroke-width="${(6 * (1 - age / 0.35)).toFixed(1)}" opacity="${op}" filter="url(#gGl2)"/><circle cx="${xa.toFixed(0)}" cy="${(470 + e.dy).toFixed(0)}" r="5" fill="${PCOL[e.k]}" opacity="${op}"/>`; }
          let d = ''; const n = 120; for (let i = 0; i <= n; i++) { const tt = now - 0.6 + 0.6 * i / n; let v = 0; for (const e of S.ev) { const a = tt - e.w; if (a >= 0 && a < 0.06) v = Math.max(v, Math.exp(-a / 0.012)); } d += `${i ? 'L' : 'M'}${(654 + i / n * 300).toFixed(1)} ${(560 - v * 120).toFixed(1)}`; }
          q('gPulse').setAttribute('d', d);
        }
        q('gTracks').innerHTML = tr; q('gAva').innerHTML = av;
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); } };
    }

    // ======================= Ansicht 3D =======================
    async function view3d(box, MM) {
      const { createLab, mats, cable, makeDisplay, glassMaterial } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [0.08, 0.3, 0.55], target: [0.08, 0.08, 0], table: [1.6, 1.2], bloom: [0.7, 0.45, 0.86], room: 0.55, minDist: 0.15, maxDist: 2, fov: 38 });
      const { THREE, scene } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad</div>');
      const add = (geo, mat, x, y, z, parent = scene) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = !mat.transparent; parent.add(m); return m; };
      const YA = 0.08, XS0 = -0.12;
      add(new THREE.BoxGeometry(0.5, 0.012, 0.04), new THREE.MeshStandardMaterial({ color: 0x8a9095, metalness: 0.7, roughness: 0.4 }), 0.1, 0.006, 0);
      const sc = document.createElement('canvas'); sc.width = 1024; sc.height = 48; const sg = sc.getContext('2d'); sg.fillStyle = '#efece4'; sg.fillRect(0, 0, 1024, 48); sg.fillStyle = '#222'; sg.font = '18px "IBM Plex Sans"';
      for (let c = 0; c <= 34; c++) { const x = 30 + c * 28; sg.fillRect(x, 0, 2, c % 5 ? 12 : 22); if (c % 5 === 0) sg.fillText(String(c), x - 6, 42); }
      const stx = new THREE.CanvasTexture(sc); stx.colorSpace = THREE.SRGBColorSpace;
      const scale = add(new THREE.PlaneGeometry(0.366, 0.017), new THREE.MeshStandardMaterial({ map: stx }), XS0 - 0.0107 + 0.183, 0.0125, 0.021); scale.rotation.x = -Math.PI / 2 + 0.6;
      // Präparat
      add(new THREE.CylinderGeometry(0.004, 0.004, YA, 12), M.steel, XS0 - 0.012, YA / 2, 0);
      const srcM = new THREE.MeshStandardMaterial({ color: 0xc9cbc8, metalness: 0.6, roughness: 0.35 });
      const src = add(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 24), srcM, XS0 - 0.006, YA, 0); src.rotation.z = Math.PI / 2;
      const yc = document.createElement('canvas'); yc.width = yc.height = 64; const yg = yc.getContext('2d'); yg.fillStyle = '#ffd400'; yg.beginPath(); yg.arc(32, 32, 30, 0, 7); yg.fill(); yg.fillStyle = '#111';
      for (let i = 0; i < 3; i++) { yg.beginPath(); yg.moveTo(32, 32); yg.arc(32, 32, 26, -Math.PI / 2 - 0.5 + i * 2.094, -Math.PI / 2 + 0.5 + i * 2.094); yg.fill(); } yg.fillStyle = '#ffd400'; yg.beginPath(); yg.arc(32, 32, 7, 0, 7); yg.fill(); yg.fillStyle = '#111'; yg.beginPath(); yg.arc(32, 32, 4, 0, 7); yg.fill();
      const ytx = new THREE.CanvasTexture(yc); ytx.colorSpace = THREE.SRGBColorSpace;
      const sym = add(new THREE.CircleGeometry(0.0115, 24), new THREE.MeshBasicMaterial({ map: ytx }), XS0 - 0.012, YA, 0); sym.rotation.y = -Math.PI / 2;
      const dot = add(new THREE.CircleGeometry(0.004, 16), new THREE.MeshStandardMaterial({ color: 0xd4a017 }), XS0 - 0.0005, YA, 0); dot.rotation.y = Math.PI / 2;
      // Zählrohr
      const tube = new THREE.Group(); scene.add(tube);
      const tMat = new THREE.MeshStandardMaterial({ color: 0xb9bec2, metalness: 0.9, roughness: 0.3, transparent: true, opacity: 1 });
      const body = add(new THREE.CylinderGeometry(0.0095, 0.0095, 0.12, 24), tMat, 0.06, YA, 0, tube); body.rotation.z = Math.PI / 2;
      const win = add(new THREE.CircleGeometry(0.0085, 24), new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 0.3, metalness: 0.2 }), 0.0002, YA, 0, tube); win.rotation.y = -Math.PI / 2;
      add(new THREE.CylinderGeometry(0.004, 0.004, YA, 12), M.steel, 0.06, YA / 2, 0, tube);
      const wireM = new THREE.MeshBasicMaterial({ color: 0x665a30, toneMapped: false });
      const wire = add(new THREE.CylinderGeometry(0.0007, 0.0007, 0.11, 8), wireM, 0.062, YA, 0, tube); wire.rotation.z = Math.PI / 2;
      // Zählgerät
      const ctr = new THREE.Group(); ctr.position.set(0.3, 0, -0.18); ctr.rotation.y = -0.35; scene.add(ctr);
      add(new THREE.BoxGeometry(0.22, 0.11, 0.16), M.housing, 0, 0.055, 0, ctr);
      const dN3 = makeDisplay(THREE, 320, 96), dT3 = makeDisplay(THREE, 256, 96), dU3 = makeDisplay(THREE, 256, 96);
      add(new THREE.PlaneGeometry(0.11, 0.033), new THREE.MeshBasicMaterial({ map: dN3.tex, toneMapped: false }), -0.04, 0.08, 0.0805, ctr);
      add(new THREE.PlaneGeometry(0.06, 0.022), new THREE.MeshBasicMaterial({ map: dT3.tex, toneMapped: false }), -0.065, 0.045, 0.0805, ctr);
      add(new THREE.PlaneGeometry(0.06, 0.022), new THREE.MeshBasicMaterial({ map: dU3.tex, toneMapped: false }), 0.005, 0.045, 0.0805, ctr);
      const ledM = new THREE.MeshBasicMaterial({ color: 0x3a1410, toneMapped: false }); add(new THREE.SphereGeometry(0.005, 12, 8), ledM, 0.07, 0.08, 0.08, ctr);
      add(new THREE.CylinderGeometry(0.018, 0.018, 0.004, 24), M.black, 0.07, 0.04, 0.081, ctr).rotation.x = Math.PI / 2;
      let cab = null;
      // Modell: Bahnen
      const modelG = new THREE.Group(); scene.add(modelG);
      const lines = Array.from({ length: 30 }, () => { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); const m = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, toneMapped: false }); const l = new THREE.Line(g, m); l.visible = false; modelG.add(l); return l; });
      let rLast = -1;
      const off = lab.onFrame(() => {
        const xw = XS0 + S.r; tube.position.x = xw;
        if (Math.abs(rLast - S.r) > 1e-6) { rLast = S.r; if (cab) scene.remove(cab); cab = cable(THREE, new THREE.Vector3(xw + 0.12, YA, 0), new THREE.Vector3(0.25, 0.03, -0.1), 0x151515, 0.05); scene.add(cab); }
        srcM.opacity = 1; src.visible = S.src !== 'none'; sym.visible = dot.visible = S.src !== 'none';
        dN3.draw(String(S.N)); dT3.draw(fmt(S.tc, 1), 's'); dU3.draw(String(S.U), 'V');
        const now = performance.now() / 1000, lastEv = S.ev.length ? S.ev[S.ev.length - 1].w : -1, fl = now - lastEv < 0.05;
        ledM.color.set(fl ? 0xff4a2a : 0x3a1410);
        const model = MM.model; modelG.visible = model; tMat.opacity = model ? 0.35 : 1; tMat.depthWrite = !model;
        const ag = now - lastEv; wireM.color.setRGB(model && ag < 0.3 ? 0.4 + 1.6 * (1 - ag / 0.3) : 0.4, model && ag < 0.3 ? 0.35 + 1.4 * (1 - ag / 0.3) : 0.35, model && ag < 0.3 ? 0.19 + 0.8 * (1 - ag / 0.3) : 0.19);
        if (!model) return;
        let i = 0;
        for (const e of S.ev) { const age = now - e.w; if (age > 0.35 || e.k === 'n' || i >= lines.length) continue; const l = lines[i++]; l.visible = true; l.material.color.set(PCOL[e.k]); l.material.opacity = 1 - age / 0.35;
          l.geometry.setFromPoints([new THREE.Vector3(XS0, YA, 0), new THREE.Vector3(xw + 0.01 + e.dx * 0.06, YA + e.dy * 0.0002, e.dy * 0.0002)]); }
        for (; i < lines.length; i++) lines[i].visible = false;
      });
      return { destroy() { off(); lab.dispose(); } };
    }

    const host = viewHost(stage, { id: 'geiger-mueller', views: { '2d': view2d, '3d': view3d }, initial: '2d', modelInfo: 'Teilchenbahnen, Lawine, Impulse' });

    // Zählung: Poisson-Prozess mit Totzeit
    let raf = 0, last = performance.now(), slow = 0, audioN = 0;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      const dtR = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      const sp = S.series ? 20 : S.fast ? 10 : 1, dt = dtR * sp, rate = trueRate();
      let k = 0; { const lam = rate * dt; if (lam < 30) { let p = Math.exp(-lam), c = p, u = Math.random(); while (u > c) { k++; p *= lam / k; c += p; } } else k = Math.max(0, Math.round(lam + Math.sqrt(lam) * (Math.random() * 2 - 1) * 1.7)); }
      const times = Array.from({ length: k }, () => S.t + Math.random() * dt).sort((a, b) => a - b);
      const wall = performance.now() / 1000; audioN = 0;
      for (const t of times) {
        if (t < S.deadUntil) continue; S.deadUntil = t + TAU;
        const counting = S.run && (S.gate === 0 || S.tc + (t - S.t) < (S.series ? 1 : S.gate));
        if (counting || !S.run) { if (S.run) S.N++; if (S.ev.length < 400 && Math.random() < Math.min(1, 30 / Math.max(1, rate * sp) * sp)) S.ev.push({ w: wall + (t - S.t) / sp, k: kindPick(), dx: Math.random(), dy: (Math.random() * 2 - 1) * 9 }); if (audioN++ < 3 && dtR > 0) click(); }
      }
      S.t += dt;
      if (S.run) {
        S.tc += dt; const g = S.series ? 1 : S.gate;
        if (g && S.tc >= g) {
          S.tc = g;
          if (S.series) { S.series.counts.push(S.N); S.series.k++; S.N = 0; S.tc = 0; if (S.series.k >= 100) { S.hist = S.series.counts; S.series = null; S.run = false; redraw(); toast('Messreihe fertig. Verteilung unter „Messwerte“.'); } }
          else { S.run = false; }
        }
      }
      while (S.ev.length && wall - S.ev[0].w > 1) S.ev.shift();
      slow += dtR; if (slow > 0.2) { slow = 0; dN.set(String(S.N)); dRate.set(S.tc > 0 ? `${fmt(S.N / S.tc, 2)} /s` : '–'); dU2.set(`± ${fmt(Math.sqrt(S.N), 0)}`); }
    }
    raf = requestAnimationFrame(loop);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); chK.destroy(); chA.destroy(); chH.destroy(); } };
  }
};
