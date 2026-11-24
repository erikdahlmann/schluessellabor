// ============================================================================
//  Schlüsselexperiment: Sonnenspektrum, Fraunhofer'sche Linien
//  Sonnenlicht → Spalt → Linse → Gitter (600 Linien/mm) → Schirm (a = 1,00 m).
//  Kontinuum (Planck, 5800 K) mit dunklen Absorptionslinien; Vergleichsspektren
//  von Spektrallampen; Lupe für die Natrium-Doppellinie.
//  Lage auf dem Schirm (1. Ordnung): x = a·tan(arcsin(λ/g))
// ============================================================================
import { viewHost } from '../js/lib/views.js';
import { lamRGB } from '../js/lib/optik.js';

const G = 1e-3 / 600, A = 1.0;                                         // m
const xOf = nm => A * Math.tan(Math.asin(nm * 1e-9 / G));             // m
const lamOfX = x => G * Math.sin(Math.atan(x / A)) * 1e9;             // nm
const NM0 = 395, NM1 = 775, X0 = xOf(NM0), X1 = xOf(NM1);
// Fraunhoferlinien [Name, nm, Tiefe, Breite nm, Ursache]
const FRAUN = [
  ['A', 759.4, 0.8, 1.4, 'O₂ der Erdatmosphäre'], ['B', 686.7, 0.7, 1.0, 'O₂ der Erdatmosphäre'], ['a', 627.7, 0.35, 0.6, 'O₂ der Erdatmosphäre'],
  ['C', 656.3, 0.75, 0.6, 'Wasserstoff (Hα)'], ['D₁', 589.6, 0.75, 0.32, 'Natrium'], ['D₂', 589.0, 0.8, 0.32, 'Natrium'],
  ['E', 527.0, 0.55, 0.3, 'Eisen'], ['b₁', 518.4, 0.6, 0.35, 'Magnesium'], ['b₂', 517.3, 0.55, 0.3, 'Magnesium'],
  ['F', 486.1, 0.7, 0.5, 'Wasserstoff (Hβ)'], ['f', 434.0, 0.5, 0.4, 'Wasserstoff (Hγ)'], ['G', 430.8, 0.6, 0.7, 'Eisen und Calcium'], ['h', 410.2, 0.5, 0.4, 'Wasserstoff (Hδ)']
];
const WEAK = (() => { let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; return Array.from({ length: 140 }, () => ['', 400 + r() * 370, 0.05 + r() * 0.2, 0.15 + r() * 0.2, '']); })();
const LAMPS = { none: { name: 'kein Vergleich', lines: [] }, na: { name: 'Natriumdampflampe', lines: [589.0, 589.6] }, h: { name: 'Wasserstofflampe', lines: [656.3, 486.1, 434.0, 410.2] }, hg: { name: 'Quecksilberlampe', lines: [404.7, 435.8, 546.1, 577.0, 579.1] } };
const planck = (nm, T) => { const l = nm * 1e-9; return 1 / (l ** 5 * (Math.exp(1.4388e-2 / (l * T)) - 1)); };

function intensity(nm, src) {
  const T = src === 'sun' ? 5800 : 2800, I = planck(nm, T) / planck(src === 'sun' ? 500 : 780, T);
  let tr = 1;
  if (src === 'sun') for (const L of [...FRAUN, ...WEAK]) tr *= 1 - L[2] * Math.exp(-0.5 * ((nm - L[1]) / (L[3] / 2.355)) ** 2);
  if (src === 'na') for (const c of [589.0, 589.6]) tr *= 1 - 0.85 * Math.exp(-0.5 * ((nm - c) / 0.14) ** 2);
  return I * tr;
}

const svgMarkup = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Optische Bank mit Spalt, Linse und Gitter; darunter der Schirm mit dem Sonnenspektrum, Vergleichsspektrum und Lupe">
<defs>
  <linearGradient id="sBg3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15181b"/><stop offset="1" stop-color="#0d0f11"/></linearGradient>
  <filter id="sGl3"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="1000" height="620" fill="url(#sBg3)"/>
<!-- Optische Bank (Draufsicht, nicht maßstäblich) -->
<rect x="40" y="186" width="920" height="10" rx="3" fill="#8a9095"/>
<g id="sSrc"></g>
<rect x="250" y="140" width="6" height="40" fill="#6a7178"/><rect x="250" y="156" width="6" height="8" fill="#ffffe0"/><text x="253" y="130" fill="#8e979d" font-size="11" text-anchor="middle">Spalt</text>
<ellipse cx="380" cy="160" rx="7" ry="30" fill="#9fd0e0" fill-opacity=".35" stroke="#9fd0e0"/><text x="380" y="122" fill="#8e979d" font-size="11" text-anchor="middle">Linse</text>
<rect x="500" y="128" width="6" height="64" fill="#c7b6ff" fill-opacity=".5"/><text x="503" y="122" fill="#8e979d" font-size="11" text-anchor="middle">Gitter 600 /mm</text>
<line x1="256" y1="160" x2="503" y2="160" stroke="#fff6d8" stroke-width="3" opacity=".8" filter="url(#sGl3)" id="sBeam"/>
<g id="sFan" opacity=".7"></g>
<rect x="900" y="60" width="8" height="120" fill="#efece4"/><text x="904" y="52" fill="#8e979d" font-size="11" text-anchor="middle">Schirm (a = 1 m)</text>
<text id="sSrcT" x="40" y="214" fill="#ece6dc" font-size="13"></text>
<!-- Schirm von vorn -->
<text x="960" y="216" fill="#8e979d" font-size="12" text-anchor="end">Schirm von vorn: Spektrum 1. Ordnung</text>
<foreignObject x="40" y="244" width="920" height="90"><canvas xmlns="http://www.w3.org/1999/xhtml" id="sCv" width="1840" height="180" style="width:100%;height:100%;display:block"></canvas></foreignObject>
<foreignObject x="40" y="338" width="920" height="26"><canvas xmlns="http://www.w3.org/1999/xhtml" id="sCmp" width="1840" height="52" style="width:100%;height:100%;display:block"></canvas></foreignObject>
<text id="sCmpT" x="40" y="380" fill="#8e979d" font-size="11"></text>
<g id="sLbl" font-size="11" fill="#c7b6ff" opacity="0"></g>
<rect x="40" y="388" width="920" height="34" fill="#efe9dc" stroke="#9c968a"/>
<g id="sRuler" font-family="IBM Plex Mono, monospace" font-size="10" fill="#111"></g>
<g id="sMk" style="cursor:ew-resize"><line y1="244" y2="422" stroke="#ffd27a" stroke-width="1.3" stroke-dasharray="4 3"/><rect x="-12" y="422" width="24" height="36" fill="transparent"/><path d="M0 426 l8 12 h-16z" fill="#ffd27a"/></g>
<!-- Lupe -->
<rect x="40" y="470" width="560" height="130" rx="8" fill="#1f2326" stroke="#3a4046"/>
<text x="54" y="490" fill="#c9c3ba" font-size="12">Lupe: 10-fach um den Marker</text>
<foreignObject x="54" y="498" width="532" height="70"><canvas xmlns="http://www.w3.org/1999/xhtml" id="sZoom" width="1064" height="140" style="width:100%;height:100%;display:block"></canvas></foreignObject>
<line x1="320" y1="498" x2="320" y2="568" stroke="#ffd27a" stroke-dasharray="3 3"/>
<text id="sZT" x="54" y="590" fill="#8e979d" font-size="11" font-family="IBM Plex Mono, monospace"></text>
<text id="sMkT" x="960" y="490" fill="#ffd27a" font-size="15" text-anchor="end" font-family="IBM Plex Mono, monospace"></text>
<text id="sMkT2" x="960" y="514" fill="#c9c3ba" font-size="13" text-anchor="end" font-family="IBM Plex Mono, monospace"></text>
<!-- Modell: Sonne -->
<g id="sMod" opacity="0">
  <rect x="620" y="530" width="340" height="80" rx="8" fill="#0a0c0e" stroke="#5a4b8a" opacity="0"/>
</g>
<g id="sSun" opacity="0">
  <rect x="560" y="40" width="400" height="140" rx="8" fill="rgba(10,12,14,.95)" stroke="#5a4b8a"/>
  <circle cx="630" cy="110" r="50" fill="#ffcf5a" filter="url(#sGl3)"/><circle cx="630" cy="110" r="62" fill="none" stroke="#ff9a5a" stroke-width="10" opacity=".35"/>
  <text x="630" y="114" fill="#3a2a10" font-size="10" text-anchor="middle">Photosphäre</text>
  <text x="630" y="186" fill="#ff9a5a" font-size="10" text-anchor="middle">kühlere Gashülle</text>
  <g id="sPh"></g>
  <text x="720" y="64" fill="#c7c1b7" font-size="11">Heiße Oberfläche: alle Farben (Kontinuum).</text>
  <text x="720" y="82" fill="#c7c1b7" font-size="11">Atome der Gashülle absorbieren ihre Linien</text>
  <text x="720" y="100" fill="#c7c1b7" font-size="11">und senden sie in alle Richtungen neu aus.</text>
  <text x="720" y="118" fill="#c7c1b7" font-size="11">In Richtung Erde fehlt dieses Licht.</text>
  <text x="720" y="140" fill="#86dcff" font-size="11">A, B, a: Sauerstoff der Erdatmosphäre</text>
</g>
</svg>`;

export default {
  intro: 'Zerlegt man Sonnenlicht mit einem Gitter, erscheint ein Regenbogen, durchzogen von vielen dunklen Linien. Ihr messt ihre Wellenlängen, vergleicht sie mit den hellen Linien von Spektrallampen und findet heraus, welche Elemente es in der Sonnenatmosphäre gibt.',
  docs: {
    durchfuehrung: `
<h3>Aufbau</h3>
<p>Ein Spiegel lenkt Sonnenlicht durch einen schmalen Spalt. Eine Linse bildet den Spalt auf einen Schirm in 1 m Abstand ab, ein Gitter (600 Linien/mm) zerlegt das Licht. Unter das Sonnenspektrum kann das Spektrum einer Spektrallampe als Vergleich gelegt werden. Statt der Sonne kann auch eine Glühlampe verwendet werden, mit und ohne Natriumflamme davor.</p>
<h3>Durchführung</h3>
<ol>
<li>Das Sonnenspektrum beschreiben. Die auffälligsten dunklen Linien suchen.</li>
<li>Den Marker auf eine dunkle Linie ziehen. Die Lupe hilft beim genauen Setzen. Aus x und a die Wellenlänge berechnen, <b>Linie übernehmen</b>.</li>
<li>Vergleichsspektren von Natrium und Wasserstoff einblenden. Welche dunklen Linien liegen genau unter hellen Linien der Lampen?</li>
<li>Mit der Lupe die Natrium-Doppellinie D₁/D₂ auflösen.</li>
<li>Glühlampe statt Sonne: Gibt es dunkle Linien? Dann die Natriumflamme in den Strahl bringen.</li>
</ol>
<p><b>Sicherheit:</b> Nie direkt in die Sonne oder in den gebündelten Strahl blicken.</p>`,
    theorie: `
<h3>Kontinuum und Absorptionslinien</h3>
<p>Die heiße, dichte Oberfläche der Sonne (Photosphäre, etwa 5800 K) sendet ein kontinuierliches Spektrum aus. Darüber liegt eine kühlere, dünne Gashülle. Ihre Atome absorbieren genau die Wellenlängen, die sie auch aussenden könnten (Resonanzabsorption). Das absorbierte Licht wird in alle Richtungen wieder abgegeben. In Richtung Erde fehlt es: Es entstehen dunkle Linien.</p>
<h3>Gitter</h3>
<span class="formula tex">g\\, \\sin\\alpha = \\lambda \\qquad \\tan\\alpha = \\frac{x}{a} \\quad\\Rightarrow\\quad \\lambda = g\\, \\sin\\!\\left(\\arctan\\frac{x}{a}\\right)</span>
<p>x ist der Abstand vom Maximum 0. Ordnung auf dem Schirm, a der Abstand Gitter–Schirm, g = 1/600 mm.</p>
<h3>Zuordnung</h3>
<p>Fraunhofer bezeichnete die Linien 1814 mit Buchstaben. Kirchhoff und Bunsen zeigten 1859, dass die D-Linien genau bei den Natriumlinien liegen. So lässt sich die Zusammensetzung der Sonnenatmosphäre bestimmen: Wasserstoff (C, F, Hγ, h), Natrium (D), Magnesium (b), Eisen (E, G), Calcium. Die Linien A, B und a entstehen erst in der Erdatmosphäre durch Sauerstoff.</p>
<h3>Glühlampe mit Natriumflamme</h3>
<p>Das Licht einer Glühlampe ist kontinuierlich. Bringt man eine Natriumflamme in den Strahl, erscheint genau bei 589 nm eine dunkle Linie. Das ist ein Laborversuch zu den Fraunhoferlinien.</p>
<h3>Modellgrenzen</h3>
<ul><li>Gezeigt sind die 13 wichtigsten Fraunhoferlinien und viele schwache Linien an zufälligen Stellen. Das echte Sonnenspektrum hat Tausende Linien.</li><li>Das Kontinuum ist als Planck-Strahler mit 5800 K gerechnet, die Glühlampe mit 2800 K.</li></ul>
<h3>Was die Modellansicht zeigt</h3>
<ul><li>Die Sonne mit heißer Oberfläche und kühlerer Gashülle. Photonen passender Farbe werden in der Hülle absorbiert und in andere Richtungen ausgesandt.</li><li>Die Namen und Ursachen der Fraunhoferlinien über dem Spektrum.</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Lichtquelle</td><td>Sonne über Planspiegel, Glühlampe 2800 K, Natriumflamme</td></tr>
<tr><td>Optik</td><td>Spalt, Linse, Gitter 600 Linien/mm, Schirm in a = 1,00 m</td></tr>
<tr><td>Vergleich</td><td>Natrium-, Wasserstoff- und Quecksilberlampe</td></tr>
</tbody></table>
<h3>Wichtige Fraunhoferlinien</h3>
<table class="spec"><tbody>
${FRAUN.slice().sort((a, b) => b[1] - a[1]).map(l => `<tr><td>${l[0]}</td><td>${String(l[1]).replace('.', ',')} nm · ${l[4]}</td></tr>`).join('')}
</tbody></table>`,
    abi: `
<details class="q"><summary>Erkläre die Entstehung der dunklen Linien im Sonnenspektrum. <span class="op">AFB II</span></summary><p>Die Photosphäre sendet ein Kontinuum aus. Atome in der kühleren Gashülle absorbieren Photonen, deren Energie genau einem Übergang zwischen ihren Energieniveaus entspricht. Sie geben die Energie in beliebige Richtungen wieder ab. In der ursprünglichen Richtung fehlt deshalb Licht dieser Wellenlängen.</p></details>
<details class="q"><summary>Eine dunkle Linie liegt bei x = 0,428 m (g = 1/600 mm, a = 1,00 m). Berechne λ und ordne die Linie zu. <span class="op">AFB II</span></summary><p>α = arctan(0,428) = 23,2°, λ = g·sin α = 1667 nm · 0,394 ≈ 656 nm. Das ist die C-Linie, die Hα-Linie des Wasserstoffs.</p></details>
<details class="q"><summary>Warum zeigen die Linien A und B nicht die Zusammensetzung der Sonne? <span class="op">AFB I</span></summary><p>Sie entstehen durch Sauerstoff in der Erdatmosphäre. Ihre Stärke hängt vom Sonnenstand ab, weil das Licht dann verschieden lange Wege durch die Luft zurücklegt.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, segmented, button, fmt, dataTable, toast, display } = ui;
    const S = { src: 'sun', cmp: 'none', x: xOf(589.3), ver: 0 };
    const gQ = group('Lichtquelle', { led: true }); gQ.led(true);
    const segQ = segmented({ value: 'sun', options: [{ value: 'sun', label: 'Sonne' }, { value: 'lamp', label: 'Glühlampe' }, { value: 'na', label: 'Glühlampe + Na-Flamme' }], onChange: v => { S.src = v; S.ver++; } });
    gQ.append(el('div', { class: 'ctl' }, el('div', { style: 'grid-column:1/-1' }, segQ)));
    const gC = group('Vergleichsspektrum');
    const segC = segmented({ value: 'none', options: [{ value: 'none', label: 'aus' }, { value: 'na', label: 'Natrium' }, { value: 'h', label: 'Wasserstoff' }, { value: 'hg', label: 'Quecksilber' }], onChange: v => { S.cmp = v; S.ver++; } });
    gC.append(el('div', { class: 'ctl' }, el('div', { style: 'grid-column:1/-1' }, segC)));
    const gM = group('Messung mit dem Marker');
    const dX = display('x auf dem Schirm'), dLm = display('λ = g·sin(arctan(x/a))');
    gM.append(dX, dLm, el('div', { class: 'bar' }, button('Linie übernehmen', () => take(), 'btn small primary')));
    controls.append(gQ, gC, gM);

    const rows = [];
    const tbl = dataTable([{ key: 'x', label: 'x in mm', fmt: v => fmt(v * 1000, 1) }, { key: 'lam', label: 'λ in nm', digits: 1 }, { key: 'id', label: 'Fraunhoferlinie', fmt: v => v }, { key: 'lit', label: 'λ Literatur in nm', digits: 1 }, { key: 'el', label: 'Ursache', fmt: v => v }], { onDelete: i => { rows.splice(i, 1); redraw(); } });
    const figL = el('div', { class: 'fig' }), resL = el('div', { class: 'result' }); const chL = new Chart(figL, { xlabel: 'λ Literatur in nm', ylabel: 'λ gemessen in nm', includeZero: false });
    messwerte.append(el('div', { class: 'chartbox' }, el('h4', {}, 'Gemessene über bekannte Wellenlängen'), figL, resL,
      csvTools(() => ({ meta: ['Sonnenspektrum, Gitter 600/mm, a = 1,00 m'], columns: [{ key: 'x', label: 'x in m' }, { key: 'lam', label: 'lambda in nm' }, { key: 'id', label: 'Linie' }, { key: 'lit', label: 'Literatur in nm' }, { key: 'el', label: 'Ursache' }], rows }), 'sonnenspektrum')),
      el('div', { style: 'height:14px' }), tbl);
    function redraw() {
      tbl.render(rows); const pts = rows.filter(r => r.lit).map(r => [r.lit, r.lam]);
      const f = pts.length >= 2 ? fit.linFit(pts.map(p => p[0]), pts.map(p => p[1])) : null;
      chL.set([{ color: '#ffd27a', mode: 'dot', points: pts }], f ? [{ f: f.f, color: '#ab93ff' }] : []);
      const els = [...new Set(rows.map(r => r.el).filter(e => e && !e.includes('Erd')))];
      resL.innerHTML = rows.length ? `<div><span>Nachgewiesen in der Sonnenatmosphäre</span><br><b>${els.join(', ') || '–'}</b></div>${f ? `<div><span>Ausgleichsgerade</span><br><b>Steigung ${fmt(f.a, 3)}</b> <span>(ideal 1)</span></div>` : ''}` : '<span>Dunkle Linien vermessen und übernehmen.</span>';
    }
    redraw();
    function take() {
      const lam = lamOfX(S.x);
      if (S.src !== 'sun') { toast(S.src === 'na' ? 'Hier gibt es nur die Natriumlinie. Für die Fraunhoferlinien die Sonne wählen.' : 'Die Glühlampe hat keine dunklen Linien.'); if (S.src !== 'na') return; }
      let best = null; for (const L of FRAUN) { const d = Math.abs(L[1] - lam); if (!best || d < best.d) best = { d, L }; }
      const ok = best && best.d < 1.6;
      rows.push({ x: S.x, lam, id: ok ? best.L[0] : '?', lit: ok ? best.L[1] : null, el: ok ? best.L[4] : '' }); redraw();
      toast(ok ? `Übernommen: λ = ${fmt(lam, 1)} nm → ${best.L[0]}-Linie (${best.L[4]})` : `Übernommen: λ = ${fmt(lam, 1)} nm, keine der großen Fraunhoferlinien`);
    }

    function paint(cv, n0, n1, src, gain = 1) {
      const g = cv.getContext('2d'), W = cv.width, H = cv.height;
      const vals = []; for (let i = 0; i < W; i++) { const xm = xOf(n0) + (xOf(n1) - xOf(n0)) * i / W; vals.push(intensity(lamOfX(xm), src)); }
      const mx = Math.max(...vals);
      for (let i = 0; i < W; i++) { const xm = xOf(n0) + (xOf(n1) - xOf(n0)) * i / W, nm = lamOfX(xm), [r, gg, b] = lamRGB(nm), v = Math.min(1, vals[i] / mx * 1.25 * gain); g.fillStyle = `rgb(${Math.round(r * v)},${Math.round(gg * v)},${Math.round(b * v)})`; g.fillRect(i, 0, 1, H); }
    }
    function paintCmp(cv) {
      const g = cv.getContext('2d'), W = cv.width, H = cv.height; g.fillStyle = '#050607'; g.fillRect(0, 0, W, H);
      for (const nm of LAMPS[S.cmp].lines) { const i = (xOf(nm) - X0) / (X1 - X0) * W, [r, gg, b] = lamRGB(nm); g.fillStyle = `rgb(${r},${gg},${b})`; g.fillRect(i - 1.5, 0, 3, H); }
    }

    // ======================= Ansicht 2D =======================
    async function view2d(box, MM) {
      box.insertAdjacentHTML('beforeend', svgMarkup());
      const svg = box.querySelector('svg'), q = id => svg.querySelector('#' + id), cv = q('sCv'), cmp = q('sCmp'), zoom = q('sZoom');
      const PX = xm => 40 + (xm - X0) / (X1 - X0) * 920;
      { let h = ''; for (let mm = Math.ceil(X0 * 100) * 10; mm <= X1 * 1000; mm += 10) { const x = PX(mm / 1000), maj = mm % 50 === 0; h += `<rect x="${(x - 0.5).toFixed(1)}" y="388" width="1" height="${maj ? 12 : 6}" fill="#111"/>`; if (maj) h += `<text x="${x.toFixed(1)}" y="416" text-anchor="middle">${mm}</text>`; } h += '<text x="955" y="416" text-anchor="end">mm</text>'; q('sRuler').innerHTML = h; }
      { let h = ''; for (const L of FRAUN) { if (L[0] === 'D₁' || L[0] === 'b₁') continue; const x = PX(xOf(L[1])); h += `<text x="${x.toFixed(1)}" y="${L[0] === 'G' ? 236 : 240}" text-anchor="middle">${L[0] === 'D₂' ? 'D' : L[0] === 'b₂' ? 'b' : L[0]}</text>`; } q('sLbl').innerHTML = h; }
      let drag = false;
      q('sMk').addEventListener('pointerdown', e => { drag = true; svg.setPointerCapture(e.pointerId); e.preventDefault(); });
      svg.addEventListener('pointermove', e => { if (!drag) return; const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const c = p.matrixTransform(svg.getScreenCTM().inverse()); S.x = Math.max(X0, Math.min(X1, X0 + (c.x - 40) / 920 * (X1 - X0))); });
      svg.addEventListener('pointerup', () => { drag = false; });
      let raf = 0, ver = -1, zx = -1, phot = [];
      function frame() {
        raf = requestAnimationFrame(frame);
        const model = MM.model, now = performance.now() / 1000;
        if (ver !== S.ver) { ver = S.ver; paint(cv, NM0, NM1, S.src); paintCmp(cmp); zx = -1;
          q('sCmpT').textContent = S.cmp === 'none' ? '' : `Vergleich: ${LAMPS[S.cmp].name}`; q('sSrcT').textContent = { sun: 'Sonnenlicht über einen Spiegel', lamp: 'Glühlampe (2800 K)', na: 'Glühlampe, Natriumflamme im Strahl' }[S.src];
          q('sSrc').innerHTML = S.src === 'sun' ? '<circle cx="60" cy="128" r="16" fill="#ffd25a" filter="url(#sGl3)"/><line x1="72" y1="136" x2="170" y2="160" stroke="#fff6d8" stroke-width="3" opacity=".8"/><rect x="160" y="140" width="8" height="40" fill="#cfd4d8" transform="rotate(-30 164 160)"/><line x1="170" y1="160" x2="250" y2="160" stroke="#fff6d8" stroke-width="3" opacity=".8"/>'
            : `<circle cx="150" cy="160" r="16" fill="#ffd08a" filter="url(#sGl3)"/><line x1="166" y1="160" x2="250" y2="160" stroke="#fff0c8" stroke-width="3" opacity=".8"/>${S.src === 'na' ? '<path d="M210 176 C200 150 212 125 218 110 C224 125 236 150 226 176Z" fill="#ffd400" opacity=".75" filter="url(#sGl3)"/>' : ''}`;
          let fan = ''; for (const nm of [420, 470, 520, 570, 620, 680, 740]) fan += `<line x1="506" y1="160" x2="900" y2="${70 + (nm - 420) / 320 * 100}" stroke="rgb(${lamRGB(nm).join(',')})" stroke-width="1.5"/>`; q('sFan').innerHTML = fan; }
        if (Math.abs(zx - S.x) > 1e-6) { zx = S.x; const lam = lamOfX(S.x); paint(zoom, Math.max(390, lam - 9.5), Math.min(780, lam + 9.5), S.src, 1.1); q('sZT').textContent = `${fmt(Math.max(390, lam - 9.5), 1)} nm … ${fmt(Math.min(780, lam + 9.5), 1)} nm`; }
        q('sMk').setAttribute('transform', `translate(${PX(S.x).toFixed(1)} 0)`);
        q('sMkT').textContent = `x = ${fmt(S.x * 1000, 1)} mm`; q('sMkT2').textContent = `λ = ${fmt(lamOfX(S.x), 1)} nm`;
        q('sLbl').setAttribute('opacity', model && S.src === 'sun' ? 1 : 0); q('sSun').setAttribute('opacity', model ? 1 : 0);
        if (model) {
          let h = ''; for (let i = 0; i < 10; i++) { const ph = (now * 0.6 + i / 10) % 1, absb = i % 3 === 0, nm = absb ? [656, 589, 486][i % 3 === 0 ? (i / 3) % 3 : 0] : 420 + i * 33, col = `rgb(${lamRGB(nm).join(',')})`;
            if (absb && ph > 0.25) { const a = i * 1.7; h += `<circle cx="${(630 + 62 * Math.cos(0.3) + Math.cos(a) * (ph - 0.25) * 60).toFixed(1)}" cy="${(110 + Math.sin(a) * (ph - 0.25) * 60).toFixed(1)}" r="3" fill="${col}" opacity=".7"/>`; }
            else h += `<circle cx="${(680 + ph * 260).toFixed(1)}" cy="${(110 + (i - 5) * 4).toFixed(1)}" r="3" fill="${col}"/>`; }
          q('sPh').innerHTML = h;
        }
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); } };
    }

    // ======================= Ansicht 3D =======================
    async function view3d(box, MM) {
      const { createLab, mats, label } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [-0.05, 0.5, 1.05], target: [0.0, 0.08, -0.15], table: [2.4, 1.6], bloom: [0.6, 0.45, 0.85], room: 0.12, minDist: 0.2, maxDist: 3, fov: 40 });
      const { THREE, scene } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad · Raum abgedunkelt</div>');
      const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = !mat.transparent; scene.add(m); return m; };
      const Y = 0.12;
      add(new THREE.BoxGeometry(1.0, 0.02, 0.06), new THREE.MeshStandardMaterial({ color: 0x8a9095, metalness: 0.7, roughness: 0.4 }), -0.15, 0.01, 0);
      const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff3d0, transparent: true, opacity: 0.35, toneMapped: false, depthWrite: false });
      const inBeam = add(new THREE.CylinderGeometry(0.006, 0.006, 0.7, 12), beamMat, -0.6, Y + 0.25, 0); inBeam.rotation.z = Math.PI / 3.2;
      const mirror = add(new THREE.BoxGeometry(0.06, 0.08, 0.004), new THREE.MeshStandardMaterial({ color: 0xe6e8ea, metalness: 1, roughness: 0.05 }), -0.62, Y, 0); mirror.rotation.y = Math.PI / 2; mirror.rotation.x = -0.4;
      const lampBulb = add(new THREE.SphereGeometry(0.02, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffd08a, toneMapped: false }), -0.62, Y, 0);
      const naFlame = add(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffd400, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, toneMapped: false }), -0.5, Y, 0); naFlame.scale.set(0.012, 0.04, 0.012);
      const b2 = add(new THREE.CylinderGeometry(0.004, 0.004, 0.53, 10), beamMat, -0.32, Y, 0); b2.rotation.z = Math.PI / 2;
      add(new THREE.BoxGeometry(0.004, 0.08, 0.08), M.black, -0.45, Y, 0);
      const lens = add(new THREE.SphereGeometry(0.03, 24, 16), new THREE.MeshStandardMaterial({ color: 0x9fd0e0, transparent: true, opacity: 0.35, roughness: 0.05 }), -0.3, Y, 0); lens.scale.set(0.25, 1, 1);
      add(new THREE.BoxGeometry(0.004, 0.06, 0.06), new THREE.MeshStandardMaterial({ color: 0xc7b6ff, transparent: true, opacity: 0.45 }), -0.06, Y, 0);
      // Schirm schräg in Richtung 1. Ordnung
      const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 64; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      const scr = add(new THREE.PlaneGeometry(X1 - X0, 0.06), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), 0, Y, 0);
      const D = 0.6, mid = (X0 + X1) / 2;             // verkürzter Abstand (Bild), Lage in Blickrichtung
      scr.position.set(-0.06 + D, Y, -mid * D / A); scr.rotation.y = 0;
      const back = add(new THREE.PlaneGeometry(X1 - X0 + 0.04, 0.1), new THREE.MeshStandardMaterial({ color: 0xefece4 }), -0.06 + D + 0.002, Y, -mid * D / A); back.rotation.y = -Math.PI / 2; scr.rotation.y = -Math.PI / 2; scr.position.x -= 0.001;
      const fanG = new THREE.Group(); scene.add(fanG);
      for (const nm of [420, 480, 540, 600, 660, 720]) { const z = -xOf(nm) * D / A; const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.06, Y, 0), new THREE.Vector3(-0.06 + D, Y, z)]); const [r, gg, b] = lamRGB(nm); fanG.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: new THREE.Color(r / 255, gg / 255, b / 255), transparent: true, opacity: 0.6, toneMapped: false }))); }
      const lbls = FRAUN.filter(l => !['D₁', 'b₁'].includes(l[0])).map(l => { const s = label(THREE, l[0] === 'D₂' ? 'D' : l[0] === 'b₂' ? 'b' : l[0], { color: '#c7b6ff', size: 0.014 }); s.position.set(-0.06 + D - 0.01, Y + 0.045, -xOf(l[1]) * D / A); scene.add(s); return s; });
      let ver = -1;
      const off = lab.onFrame(() => {
        if (ver !== S.ver) { ver = S.ver; const g = cv.getContext('2d'); const tmp = document.createElement('canvas'); tmp.width = 1024; tmp.height = 64; paint(tmp, NM0, NM1, S.src); g.save(); g.translate(1024, 0); g.scale(-1, 1); g.drawImage(tmp, 0, 0); g.restore(); tex.needsUpdate = true;
          mirror.visible = inBeam.visible = S.src === 'sun'; lampBulb.visible = S.src !== 'sun'; naFlame.visible = S.src === 'na'; }
        fanG.visible = MM.model; for (const l of lbls) l.visible = MM.model && S.src === 'sun';
      });
      return { destroy() { off(); lab.dispose(); } };
    }

    const host = viewHost(stage, { id: 'sonnenspektrum', views: { '2d': view2d, '3d': view3d }, initial: '2d', modelInfo: 'Sonnenatmosphäre, Linien' });
    let raf = 0, slow = 0, last = performance.now();
    function loop(now) { raf = requestAnimationFrame(loop); slow += (now - last) / 1000; last = now; if (slow > 0.2) { slow = 0; dX.set(`${fmt(S.x * 1000, 1)} mm`); dLm.set(`${fmt(lamOfX(S.x), 1)} nm`); } }
    raf = requestAnimationFrame(loop);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); chL.destroy(); } };
  }
};
