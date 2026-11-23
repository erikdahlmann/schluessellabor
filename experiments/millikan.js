// ============================================================================
//  Schlüsselexperiment: Millikan-Versuch (Schwebe- und Sinkmethode)
//  Öltröpfchen im Plattenkondensator (d = 6 mm). Schweben: q·U/d = m·g.
//  Sinken ohne Feld mit konstanter Geschwindigkeit (Stokes): m·g = 6π·η·r·v.
//  ⇒ r = √(9ηv / (2(ρ_Öl − ρ_Luft)g)),  q = m·g·d / U
//  Modell: Kräfte am Tröpfchen, Ladung als Zahl überschüssiger Elektronen.
// ============================================================================
import { viewHost } from '../js/lib/views.js';

const E0 = 1.602e-19, ETA = 1.81e-5, RHO = 875 - 1.2, G = 9.81, D = 6.0e-3, KT = 4.1e-21;
const VIEW = 1.0;                                      // halbe Bildbreite im Mikroskop in mm
const SKT = 0.04;                                      // 1 Skalenteil = 0,04 mm
const mass = r => 4 / 3 * Math.PI * r ** 3 * RHO;

function newDrop(y) {
  for (let k = 0; k < 50; k++) {
    const r = (0.35 + Math.random() * 0.55) * 1e-6, mg = mass(r) * G * D / E0;
    const nMin = Math.ceil(mg / 580), nMax = Math.floor(mg / 70); if (nMin > nMax) continue;
    const n = nMin + Math.floor(Math.random() * Math.min(5, nMax - nMin + 1));
    return { r, n, sign: Math.random() < 0.75 ? -1 : 1, x: (Math.random() * 1.6 - 0.8), y: y ?? (Math.random() * 1.6 - 0.8), v: 0, id: Math.random() };
  }
  return newDrop(y);
}

const svgMarkup = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Blick durch das Messmikroskop auf leuchtende Öltröpfchen mit Okularskala; rechts der Aufbau bzw. die Kräfte am gewählten Tröpfchen">
<defs>
  <radialGradient id="mVig" cx=".5" cy=".5" r=".5"><stop offset=".72" stop-color="#05070a"/><stop offset="1" stop-color="#000"/></radialGradient>
  <radialGradient id="mDrop"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#ffe9b8" stop-opacity=".9"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
  <clipPath id="mClip"><circle cx="310" cy="310" r="278"/></clipPath>
  <linearGradient id="mBrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6c77a"/><stop offset="1" stop-color="#8a6a26"/></linearGradient>
  <marker id="mArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="context-stroke"/></marker>
</defs>
<rect width="1000" height="620" fill="#121518"/>
<circle cx="310" cy="310" r="290" fill="#1b1f23"/>
<circle cx="310" cy="310" r="278" fill="url(#mVig)"/>
<g clip-path="url(#mClip)">
  <g id="mField" stroke="#86dcff" stroke-width="1" opacity="0" fill="none"></g>
  <g id="mScale" stroke="#9aa3a9" fill="#9aa3a9" font-size="11" font-family="IBM Plex Mono, monospace"></g>
  <g id="mLines" stroke="#f2ac74" stroke-width="1.2" stroke-dasharray="6 5"></g>
  <g id="mDrops"></g>
  <g id="mLbl" font-size="12" font-family="IBM Plex Mono, monospace" fill="#c7b6ff"></g>
  <circle id="mSel" r="14" fill="none" stroke="#7fd6a0" stroke-width="1.6" opacity="0"/>
</g>
<text x="310" y="612" fill="#8e979d" font-size="12" text-anchor="middle">Messmikroskop · 1 Skt = 0,04 mm · Tröpfchen anklicken zum Auswählen</text>

<g id="mSetup">
  <text x="620" y="50" fill="#8e979d" font-size="13">Aufbau (Seitenansicht, nicht maßstäblich)</text>
  <rect x="640" y="96" width="260" height="14" rx="3" fill="url(#mBrass)"/><rect x="640" y="190" width="260" height="14" rx="3" fill="url(#mBrass)"/>
  <text id="mPlT" x="910" y="108" fill="#ece6dc" font-size="16" font-weight="700">+</text><text id="mPlB" x="910" y="202" fill="#ece6dc" font-size="16" font-weight="700">−</text>
  <path d="M770 96 v-24 h-50" stroke="#c9c3ba" fill="none"/><ellipse cx="700" cy="72" rx="20" ry="14" fill="#6a2a20"/><text x="700" y="58" fill="#8e979d" font-size="11" text-anchor="middle">Zerstäuber</text>
  <rect x="610" y="140" width="26" height="24" rx="4" fill="#3a3f44"/><path d="M636 146 L760 138 L760 166 L636 158z" fill="#ffd58a" opacity=".18"/><text x="602" y="182" fill="#8e979d" font-size="11">Lampe</text>
  <g fill="#ffd58a"><circle cx="745" cy="150" r="2"/><circle cx="768" cy="144" r="1.6"/><circle cx="790" cy="158" r="1.8"/><circle cx="812" cy="150" r="1.4"/></g>
  <rect x="842" y="140" width="70" height="20" rx="4" fill="#202428" stroke="#454c52"/><text x="877" y="176" fill="#8e979d" font-size="11" text-anchor="middle">Mikroskop</text>
  <text x="652" y="152" fill="#ece6dc" font-size="12" font-family="IBM Plex Mono, monospace">d = 6,0 mm</text>
  <line x1="660" y1="110" x2="660" y2="190" stroke="#8e979d" marker-end="url(#mArr)" marker-start="url(#mArr)"/>
</g>
<g id="mForce" opacity="0">
  <rect x="620" y="36" width="340" height="300" rx="10" fill="rgba(10,12,14,.92)" stroke="#5a4b8a"/>
  <text x="636" y="60" fill="#ece6dc" font-size="13" font-weight="600">Kräfte am gewählten Tröpfchen</text>
  <circle id="mBig" cx="740" cy="190" r="46" fill="#ffd58a" fill-opacity=".14" stroke="#ffd58a" stroke-opacity=".6"/>
  <g id="mCharges" font-size="13" font-weight="700" text-anchor="middle"></g>
  <line id="mFe" stroke="#86dcff" stroke-width="3" marker-end="url(#mArr)"/>
  <line id="mFg" stroke="#7fd6a0" stroke-width="3" marker-end="url(#mArr)"/>
  <line id="mFr" stroke="#f2ac74" stroke-width="3" marker-end="url(#mArr)"/>
  <text x="820" y="120" fill="#86dcff" font-size="12">F_el = q·U/d</text>
  <text x="820" y="140" fill="#7fd6a0" font-size="12">F_G = m·g</text>
  <text x="820" y="160" fill="#f2ac74" font-size="12">F_R = 6π·η·r·v</text>
  <text id="mFt1" x="636" y="280" fill="#c7c1b7" font-size="12" font-family="IBM Plex Mono, monospace"></text>
  <text id="mFt2" x="636" y="298" fill="#c7c1b7" font-size="12" font-family="IBM Plex Mono, monospace"></text>
  <text id="mFt3" x="636" y="316" fill="#c7b6ff" font-size="12"></text>
</g>
<g font-family="IBM Plex Mono, monospace">
  <rect x="620" y="356" width="160" height="70" rx="6" fill="#160807" stroke="#3a1a14"/><text x="632" y="374" fill="#8e979d" font-size="10" font-family="IBM Plex Sans, sans-serif">Spannung U</text>
  <text id="mDU" x="768" y="412" fill="#ff5a3c" font-size="28" text-anchor="end">0 V</text>
  <rect x="800" y="356" width="160" height="70" rx="6" fill="#071410" stroke="#163328"/><text x="812" y="374" fill="#8e979d" font-size="10" font-family="IBM Plex Sans, sans-serif">Stoppuhr</text>
  <text id="mDT" x="948" y="412" fill="#7dffb8" font-size="28" text-anchor="end">0,00 s</text>
  <text id="mInfo" x="620" y="456" fill="#c9c3ba" font-size="12" font-family="IBM Plex Sans, sans-serif"></text>
  <text id="mInfo2" x="620" y="476" fill="#8e979d" font-size="12" font-family="IBM Plex Sans, sans-serif"></text>
</g>
</svg>`;

export default {
  intro: 'Winzige Öltröpfchen schweben im elektrischen Feld eines Plattenkondensators. Ihr stellt die Spannung so ein, dass ein Tröpfchen stillsteht, und messt danach seine Sinkgeschwindigkeit ohne Feld. Daraus folgt seine Ladung. Alle Ladungen sind ganzzahlige Vielfache derselben kleinsten Ladung: der Elementarladung e.',
  docs: {
    durchfuehrung: `
<h3>Aufbau</h3>
<p>Zwei waagerechte Metallplatten bilden einen Kondensator mit d = 6,0 mm Abstand. Mit einem Zerstäuber werden Öltröpfchen durch ein kleines Loch in der oberen Platte gesprüht. Beim Zerstäuben laden sich viele Tröpfchen durch Reibung auf. Eine Lampe beleuchtet den Raum zwischen den Platten von der Seite. Im Messmikroskop erscheinen die Tröpfchen als helle Punkte vor dunklem Grund.</p>
<h3>Durchführung (Schwebe- und Sinkmethode)</h3>
<ol>
<li>Spannung einschalten und Tröpfchen einsprühen. Ein Tröpfchen anklicken, das sich langsam bewegt.</li>
<li>Spannung so einstellen, dass das Tröpfchen schwebt. Bei falscher Polung bewegt es sich trotz hoher Spannung weiter: Polung umschalten. <b>Schwebespannung merken.</b></li>
<li>Spannung ausschalten. Das Tröpfchen sinkt mit konstanter Geschwindigkeit. Stoppuhr starten, wenn es die obere orange Linie kreuzt, und stoppen an der unteren.</li>
<li><b>Messwert übernehmen.</b> Danach Spannung wieder einschalten, damit das Tröpfchen nicht aus dem Bild fällt.</li>
<li>Mindestens 10 Tröpfchen ausmessen. Mit „Ladung ändern“ lässt sich dasselbe Tröpfchen umladen und erneut messen.</li>
</ol>
<div class="callout">Sicherheit: Am Kondensator liegen bis zu 600 V. Nur bei ausgeschaltetem Netzgerät an den Platten arbeiten.</div>`,
    theorie: `
<h3>Schweben</h3>
<p>Im Feld des Kondensators wirkt auf ein Tröpfchen mit der Ladung q die elektrische Kraft <span class="tex">F_{\\text{el}} = q\\, E = \\frac{q\\, U}{d}</span>. Zeigt sie nach oben und ist so groß wie die Gewichtskraft, schwebt es:</p>
<span class="formula tex">\\frac{q\\, U_s}{d} = m\\, g \\quad\\Rightarrow\\quad q = \\frac{m\\, g\\, d}{U_s}</span>
<h3>Masse aus der Sinkgeschwindigkeit</h3>
<p>Die Masse ist zu klein zum Wiegen. Ohne Feld sinkt das Tröpfchen. Nach Bruchteilen einer Millisekunde ist die Reibungskraft der Luft (Stokes) so groß wie die Gewichtskraft. Ab dann sinkt es gleichförmig:</p>
<span class="formula tex">m\\, g = 6\\pi\\, \\eta\\, r\\, v \\quad\\text{mit}\\quad m = \\tfrac{4}{3}\\pi r^3 \\left(\\rho_{\\text{Öl}} - \\rho_{\\text{Luft}}\\right)</span>
<span class="formula tex">\\Rightarrow\\quad r = \\sqrt{\\frac{9\\, \\eta\\, v}{2\\left(\\rho_{\\text{Öl}} - \\rho_{\\text{Luft}}\\right) g}}</span>
<p>Werte: η<sub>Luft</sub> = 1,81·10⁻⁵ Pa·s, ρ<sub>Öl</sub> = 875 kg/m³, ρ<sub>Luft</sub> = 1,2 kg/m³.</p>
<h3>Quantelung der Ladung</h3>
<p>Trägt man die gemessenen Ladungen auf, häufen sie sich bei 1,6·10⁻¹⁹ C, 3,2·10⁻¹⁹ C, 4,8·10⁻¹⁹ C und so weiter. Zwischenwerte kommen nicht vor. Jedes Tröpfchen hat eine ganze Zahl von Elektronen zu viel oder zu wenig. Die kleinste Ladung ist die Elementarladung e = 1,602·10⁻¹⁹ C.</p>
<h3>Modellgrenzen</h3>
<ul><li>Die Stokes-Reibung gilt hier ohne die Cunningham-Korrektur. Im echten Versuch wären die Ladungen kleiner Tröpfchen ohne Korrektur um bis zu 20 % zu groß.</li><li>Ein echtes Mikroskop zeigt das Bild umgekehrt. Hier steht oben auch im Bild oben.</li><li>Die brownsche Bewegung ist nachgebildet. Sie lässt die Tröpfchen leicht zittern.</li></ul>
<h3>Was die Modellansicht zeigt</h3><ul><li>Im Mikroskopbild stehen die Feldlinien des Kondensators und an jedem Tröpfchen seine Ladung als Vielfaches von e.</li><li>Rechts sind die Kräfte am gewählten Tröpfchen gezeichnet: F<sub>el</sub> (blau), F<sub>G</sub> (grün) und die Reibungskraft F<sub>R</sub> (orange). Beim Schweben ist F<sub>R</sub> null, beim gleichförmigen Sinken gleicht F<sub>R</sub> die Gewichtskraft aus.</li><li>Im großen Tropfen sind die überschüssigen Elektronen (bzw. fehlenden Elektronen) einzeln gezeichnet.</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Plattenkondensator</td><td>d = 6,0 mm, Ø 80 mm, Loch in der oberen Platte</td></tr>
<tr><td>Spannung</td><td>0 … 600 V, umpolbar, mit Abschalttaster</td></tr>
<tr><td>Öl</td><td>Silikonöl, ρ = 875 kg/m³</td></tr>
<tr><td>Messmikroskop</td><td>Okularskala 50 Skt, 1 Skt = 0,04 mm</td></tr>
<tr><td>Stoppuhr</td><td>0,01 s Auflösung</td></tr>
</tbody></table>`,
    abi: `
<details class="q"><summary>Ein Tröpfchen schwebt bei U = 112 V. Ohne Feld sinkt es 0,50 mm in 12,0 s. Berechne r, m und q. <span class="op">AFB II</span></summary><p>v = 4,17·10⁻⁵ m/s. r = √(9·1,81·10⁻⁵·4,17·10⁻⁵ / (2·873,8·9,81)) ≈ 6,3·10⁻⁷ m. m = 4/3·π·r³·873,8 ≈ 9,1·10⁻¹⁶ kg. q = m·g·d/U = 9,1·10⁻¹⁶·9,81·0,006/112 ≈ 4,8·10⁻¹⁹ C. Das sind 3 Elementarladungen.</p></details>
<details class="q"><summary>Begründe, warum das Tröpfchen ohne Feld mit konstanter Geschwindigkeit sinkt. <span class="op">AFB I</span></summary><p>Die Reibungskraft wächst mit der Geschwindigkeit. Sobald sie so groß wie die Gewichtskraft ist, ist die Summe der Kräfte null. Dann bleibt v konstant (1. Newtonsches Gesetz).</p></details>
<details class="q"><summary>Warum braucht man neben der Schwebespannung die Sinkgeschwindigkeit? <span class="op">AFB II</span></summary><p>Aus dem Schweben folgt nur q/m = g·d/U. Die Masse ist unbekannt. Aus der Sinkgeschwindigkeit folgt über die Stokes-Reibung der Radius und damit die Masse.</p></details>
<details class="q"><summary>Erkläre, wie man aus vielen Messwerten auf die Elementarladung schließt. <span class="op">AFB III</span></summary><p>Die Ladungen häufen sich bei bestimmten Werten mit gleichem Abstand. Man sucht die größte Zahl e, von der alle Werte ganzzahlige Vielfache sind (im Rahmen der Messgenauigkeit). Für die Häufungswerte ergibt sich e ≈ 1,6·10⁻¹⁹ C.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, segmented, check, button, fmt, dataTable, toast, display, gauss } = ui;
    const S = { U: 300, on: true, top: 1, drops: Array.from({ length: 12 }, () => newDrop()), sel: null, Us: null, s: 0.5, sw: { run: false, t: 0 }, ver: 0 };
    const Fup = d => -d.sign * d.n * E0 * (S.on ? S.U : 0) / D * S.top;      // nach oben positiv; oben + ⇒ negative Ladung nach oben
    const vUp = d => (Fup(d) - mass(d.r) * G) / (6 * Math.PI * ETA * d.r);    // m/s

    const gU = group('Netzgerät', { led: true }); gU.led(true);
    const sU = slider({ label: 'Spannung U', min: 0, max: 600, step: 1, value: S.U, unit: 'V', digits: 0, onInput: v => { S.U = v; } });
    const sUf = slider({ label: 'Feinregler', min: -10, max: 10, step: 0.1, value: 0, unit: 'V', digits: 1, onInput: v => { S.U = Math.max(0, Math.min(610, sU.get() + v)); } });
    sU.input.addEventListener('input', () => { sUf.set(0); });
    const cOn = check({ label: 'Spannung eingeschaltet', checked: true, onChange: v => { S.on = v; gU.led(v); } });
    const segP = segmented({ value: 1, options: [{ value: 1, label: 'oben +' }, { value: -1, label: 'oben −' }], onChange: v => { S.top = v; S.ver++; } });
    gU.append(sU, sUf, cOn, el('div', { class: 'ctl' }, el('label', { style: 'grid-column:1/-1' }, 'Polung der oberen Platte'), el('div', { style: 'grid-column:1/-1' }, segP)));
    const gD = group('Tröpfchen');
    gD.append(el('div', { class: 'bar' }, button('Neu einsprühen', () => { S.drops = Array.from({ length: 12 }, () => newDrop()); S.sel = null; S.Us = null; }),
      button('Ladung ändern', () => { const d = S.sel; if (!d) { toast('Erst ein Tröpfchen anklicken.'); return; } const mg = mass(d.r) * G * D / E0; let n; do { n = Math.max(1, d.n + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 2))); } while (mg / n > 600 || n === d.n); d.n = n; S.Us = null; toast('Das Tröpfchen hat Ladung aufgenommen oder abgegeben.'); })));
    const gM = group('Messung');
    const segS = segmented({ value: 0.5, options: [{ value: 0.2, label: '5 Skt' }, { value: 0.5, label: '12,5 Skt' }, { value: 0.8, label: '20 Skt' }], onChange: v => { S.s = v; } });
    const dUs = display('Schwebespannung U_s'), dT = display('Stoppuhr t');
    const bSW = button('Stoppuhr starten', () => { if (S.sw.run) { S.sw.run = false; bSW.textContent = 'Stoppuhr starten'; } else { S.sw.run = true; S.sw.t = 0; bSW.textContent = 'Stoppuhr stoppen'; } }, 'btn small');
    gM.append(el('div', { class: 'bar' }, button('Schwebespannung merken', () => { if (!S.sel) { toast('Erst ein Tröpfchen anklicken.'); return; } if (!S.on) { toast('Die Spannung ist aus.'); return; } S.Us = S.U; S.UsDrop = S.sel; toast(`U_s = ${fmt(S.U, 1)} V gemerkt.`); }, 'btn small')),
      dUs, el('div', { class: 'ctl' }, el('label', { style: 'grid-column:1/-1' }, 'Messstrecke s zwischen den orangen Linien'), el('div', { style: 'grid-column:1/-1' }, segS)),
      dT, el('div', { class: 'bar' }, bSW, button('Messwert übernehmen', () => take(), 'btn small primary')),
      el('p', { class: 'muted', style: 'font-size:12.5px;margin:8px 0 0' }, 'Ablauf: Tröpfchen wählen, schweben lassen, U_s merken. Spannung aus, Sinkzeit stoppen, übernehmen.'));
    controls.append(gU, gD, gM);

    // ---- Messwerte ----
    const rows = [];
    const tbl = dataTable([
      { key: 'Us', label: 'U_s in V', digits: 1 }, { key: 's', label: 's in mm', digits: 2 }, { key: 't', label: 't in s', digits: 2 },
      { key: 'v', label: 'v in µm/s', fmt: v => fmt(v * 1e6, 1) }, { key: 'r', label: 'r in µm', fmt: v => fmt(v * 1e6, 3) }, { key: 'q', label: 'q in 10⁻¹⁹ C', fmt: v => fmt(v / 1e-19, 2) }
    ], { onDelete: i => { rows.splice(i, 1); redraw(); } });
    const figQ = el('div', { class: 'fig' }), figH = el('div', { class: 'fig' });
    const chQ = new Chart(figQ, { xlabel: 'Messung Nr.', ylabel: 'q in 10⁻¹⁹ C', ymin: 0 });
    const chH = new Chart(figH, { xlabel: 'q in 10⁻¹⁹ C', ylabel: 'Anzahl', ymin: 0, xmin: 0 });
    const resQ = el('div', { class: 'result' });
    messwerte.append(
      el('div', { class: 'data' },
        el('div', { class: 'chartbox' }, el('h4', {}, 'Ladungen der Tröpfchen'), figQ, resQ,
          csvTools(() => ({ meta: ['Millikan-Versuch', `d = ${D} m, eta = ${ETA} Pa s, rho = 875 kg/m^3`], columns: [{ key: 'Us', label: 'U_s in V' }, { key: 's', label: 's in mm' }, { key: 't', label: 't in s' }, { key: 'v', label: 'v in m/s' }, { key: 'r', label: 'r in m' }, { key: 'q', label: 'q in C' }], rows }), 'millikan_messreihe')),
        el('div', { class: 'chartbox' }, el('h4', {}, 'Häufigkeit der Ladungen'), figH,
          el('p', { class: 'muted', style: 'font-size:13px;margin:8px 0 0' }, 'Die Werte häufen sich in gleichen Abständen. Zwischen den Häufungen bleibt es leer.'))),
      el('div', { style: 'height:14px' }), tbl);
    function bestE(qs) {   // größtes e im Bereich 1,2…2,2, von dem alle q nahezu Vielfache sind
      let best = null;
      for (let e = 1.2; e <= 2.2; e += 0.002) { let s = 0; for (const q of qs) { const n = Math.max(1, Math.round(q / e)); s += ((q - n * e) / (n * e)) ** 2; } if (!best || s < best.s - 1e-9) best = { e, s }; }
      return best.e;
    }
    function redraw() {
      tbl.render(rows);
      const qs = rows.map(r => r.q / 1e-19);
      const fits = [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ f: () => n * 1.602, color: '#4a545c' }));
      chQ.set([{ color: '#ffd58a', mode: 'dot', points: qs.map((q, i) => [i + 1, q]) }], fits);
      const bins = new Map(); for (const q of qs) { const b = Math.floor(q / 0.2); bins.set(b, (bins.get(b) || 0) + 1); }
      const hp = []; const maxB = Math.max(10, ...[...bins.keys()].map(b => b + 2)); for (let b = 0; b < maxB; b++) { const c = bins.get(b) || 0; hp.push([b * 0.2, 0], [b * 0.2, c], [(b + 1) * 0.2, c], [(b + 1) * 0.2, 0]); }
      chH.set([{ color: '#ffd58a', points: hp }]);
      resQ.innerHTML = qs.length >= 5 ? `<div><span>Grau: Vielfache von 1,602·10⁻¹⁹ C</span><br><b>beste gemeinsame Einheit ≈ ${fmt(bestE(qs), 2)}·10⁻¹⁹ C</b> <span>(aus ${qs.length} Messungen)</span></div>` : '<span>Mindestens 5 Tröpfchen ausmessen. Die grauen Linien zeigen n · 1,602·10⁻¹⁹ C.</span>';
    }
    redraw();
    function take() {
      if (S.Us == null || S.UsDrop !== S.sel) { toast('Für dieses Tröpfchen ist noch keine Schwebespannung gemerkt.'); return; }
      if (S.sw.run) { toast('Erst die Stoppuhr stoppen.'); return; }
      if (S.sw.t < 0.5) { toast('Erst die Sinkzeit mit der Stoppuhr messen.'); return; }
      const v = S.s * 1e-3 / S.sw.t, r = Math.sqrt(9 * ETA * v / (2 * RHO * G)), q = mass(r) * G * D / S.Us;
      rows.push({ Us: S.Us, s: S.s, t: S.sw.t, v, r, q }); redraw();
      toast(`Übernommen: r = ${fmt(r * 1e6, 2)} µm, q = ${fmt(q / 1e-19, 2)}·10⁻¹⁹ C`);
    }

    // ======================= Ansicht 2D =======================
    async function view2d(box, MM) {
      box.insertAdjacentHTML('beforeend', svgMarkup());
      const svg = box.querySelector('svg'), q = id => svg.querySelector('#' + id);
      const PXM = 278 / VIEW, X = x => 310 + x * PXM, Y = y => 310 - y * PXM;
      { let h = '<line x1="310" y1="32" x2="310" y2="588" stroke-width="1"/>'; for (let k = -25; k <= 25; k++) { const y = Y(k * SKT), L = k % 5 === 0 ? 16 : 8; h += `<line x1="${310 - L}" y1="${y.toFixed(1)}" x2="${310 + L}" y2="${y.toFixed(1)}"/>`; if (k % 10 === 0) h += `<text x="${310 + 22}" y="${(y + 4).toFixed(1)}" stroke="none">${k + 25}</text>`; } q('mScale').innerHTML = h; }
      { let h = ''; for (let x = -0.9; x <= 0.91; x += 0.15) h += `<path d="M${X(x).toFixed(1)} 40 V580"/>`; q('mField').innerHTML = h; }
      svg.addEventListener('pointerdown', e => {
        const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const c = p.matrixTransform(svg.getScreenCTM().inverse());
        let best = null; for (const d of S.drops) { const dd = Math.hypot(X(d.x) - c.x, Y(d.y) - c.y); if (dd < 26 && (!best || dd < best.dd)) best = { d, dd }; }
        if (best) { S.sel = best.d; }
      });
      let raf = 0;
      function frame() {
        raf = requestAnimationFrame(frame);
        const model = MM.model;
        q('mLines').innerHTML = `<line x1="40" x2="580" y1="${Y(S.s / 2).toFixed(1)}" y2="${Y(S.s / 2).toFixed(1)}"/><line x1="40" x2="580" y1="${Y(-S.s / 2).toFixed(1)}" y2="${Y(-S.s / 2).toFixed(1)}"/>`;
        let h = '', lb = '';
        for (const d of S.drops) { const rr = 2.2 + d.r * 1e6 * 7; h += `<circle cx="${X(d.x).toFixed(1)}" cy="${Y(d.y).toFixed(1)}" r="${rr.toFixed(1)}" fill="url(#mDrop)"/>`; if (model) lb += `<text x="${(X(d.x) + 10).toFixed(1)}" y="${(Y(d.y) - 8).toFixed(1)}">${d.sign < 0 ? '−' : '+'}${d.n}e</text>`; }
        q('mDrops').innerHTML = h; q('mLbl').innerHTML = lb;
        const sel = S.sel && S.drops.includes(S.sel) ? S.sel : null;
        q('mSel').setAttribute('opacity', sel ? 1 : 0); if (sel) { q('mSel').setAttribute('cx', X(sel.x)); q('mSel').setAttribute('cy', Y(sel.y)); }
        q('mField').setAttribute('opacity', model && S.on && S.U > 0 ? 0.25 : 0);
        q('mPlT').textContent = S.top > 0 ? '+' : '−'; q('mPlB').textContent = S.top > 0 ? '−' : '+';
        q('mDU').textContent = `${fmt(S.on ? S.U : 0, 1)} V`; q('mDT').textContent = `${fmt(S.sw.t, 2)} s`;
        q('mInfo').textContent = sel ? `Gewähltes Tröpfchen: ${vUp(sel) > 2e-7 ? 'steigt' : vUp(sel) < -2e-7 ? 'sinkt' : 'schwebt'}` : 'Kein Tröpfchen gewählt';
        q('mInfo2').textContent = S.Us != null && S.UsDrop === sel ? `Schwebespannung gemerkt: ${fmt(S.Us, 1)} V` : '';
        q('mSetup').setAttribute('opacity', model ? 0 : 1); q('mForce').setAttribute('opacity', model ? 1 : 0);
        if (model) {
          const d = sel;
          if (!d) { q('mFt1').textContent = 'Tröpfchen anklicken, um die Kräfte zu sehen.'; q('mFt2').textContent = ''; q('mFt3').textContent = ''; ['mFe', 'mFg', 'mFr'].forEach(id => q(id).setAttribute('opacity', 0)); q('mCharges').innerHTML = ''; return; }
          const Fg = mass(d.r) * G, Fe = Fup(d), v = vUp(d), Fr = -6 * Math.PI * ETA * d.r * v, k = 90 / Fg, cx = 740, cy = 190;
          const set = (id, f, dx) => { q(id).setAttribute('opacity', Math.abs(f * k) > 3 ? 1 : 0); q(id).setAttribute('x1', cx + dx); q(id).setAttribute('x2', cx + dx); q(id).setAttribute('y1', cy); q(id).setAttribute('y2', cy - Math.max(-130, Math.min(130, f * k))); };
          set('mFe', Fe, -16); set('mFg', -Fg, 0); set('mFr', Fr, 16);
          let c = ''; const n = d.n, sgn = d.sign < 0 ? '−' : '+', col = d.sign < 0 ? '#86dcff' : '#ff8a7a';
          for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.4, rr = n === 1 ? 0 : 24; c += `<text x="${(cx + rr * Math.cos(a)).toFixed(1)}" y="${(cy + 5 + rr * Math.sin(a)).toFixed(1)}" fill="${col}">${sgn}</text>`; }
          q('mCharges').innerHTML = c;
          q('mFt1').textContent = `r = ${fmt(d.r * 1e6, 2)} µm   m = ${fmt(mass(d.r) * 1e15, 2)}·10⁻¹⁵ kg`;
          q('mFt2').textContent = `q = ${sgn}${n}·e = ${sgn}${fmt(n * 1.602, 2)}·10⁻¹⁹ C   v = ${fmt(v * 1e6, 1)} µm/s`;
          q('mFt3').textContent = d.sign < 0 ? `${n} Elektron${n > 1 ? 'en' : ''} zu viel` : `${n} Elektron${n > 1 ? 'en' : ''} zu wenig`;
        }
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); } };
    }

    // ======================= Ansicht 3D =======================
    async function view3d(box, MM) {
      const { createLab, mats, cable, powerSupply, arrow, label, glassMaterial, glowPool } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [0.13, 0.18, 0.27], target: [0.0, 0.11, 0], table: [1.6, 1.2], bloom: [0.9, 0.45, 0.8], room: 0.25, minDist: 0.06, maxDist: 1.8, fov: 34 });
      const { THREE, scene } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad · Gemessen wird im 2D-Aufbau (Mikroskopbild)</div>');
      const YC = 0.11, GAP = 0.012;                                         // Mitte des Spalts, Plattenabstand (vergrößert)
      const brass = new THREE.MeshStandardMaterial({ color: 0xc8a24a, metalness: 1, roughness: 0.25 });
      const pTop = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.006, 48), brass); pTop.position.y = YC + GAP / 2 + 0.003;
      const pBot = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.006, 48), brass); pBot.position.y = YC - GAP / 2 - 0.003;
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, GAP, 48, 1, true), glassMaterial(THREE)); ring.position.y = YC;
      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, YC - GAP / 2 - 0.006, 24), M.housing); column.position.y = (YC - GAP / 2 - 0.006) / 2;
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.012, 0.16), M.housing); foot.position.y = 0.006;
      for (const m of [pTop, pBot, column, foot]) { m.castShadow = m.receiveShadow = true; scene.add(m); } scene.add(ring);
      // Zerstäuber
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.018, 24, 16), new THREE.MeshStandardMaterial({ color: 0x6a2a20, roughness: 0.6 })); bulb.position.set(-0.06, YC + 0.045, -0.03); bulb.scale.set(1, 0.8, 1); scene.add(bulb);
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.07, 8), M.steel); nozzle.position.set(-0.03, YC + 0.035, -0.015); nozzle.rotation.z = Math.PI / 2.6; scene.add(nozzle);
      // Lampe mit Lichtkegel
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.04), M.housing); lamp.position.set(-0.11, YC, 0); scene.add(lamp);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.08, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd58a, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
      cone.rotation.z = Math.PI / 2; cone.position.set(-0.045, YC, 0); scene.add(cone);
      const lampLight = new THREE.PointLight(0xffd58a, 0.05, 0.3, 2); lampLight.position.set(-0.08, YC, 0); scene.add(lampLight);
      // Mikroskop (schaut von vorn schräg in den Spalt)
      const mic = new THREE.Group(); mic.position.set(0.0, YC + 0.01, 0.075); mic.rotation.x = -0.15; scene.add(mic);
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.09, 24), M.black); tube.rotation.x = Math.PI / 2; mic.add(tube);
      const ocu = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.02, 24), M.black); ocu.rotation.x = Math.PI / 2; ocu.position.z = 0.05; mic.add(ocu);
      const micStand = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, YC + 0.01, 12), M.steel); micStand.position.set(0, (YC + 0.01) / 2, 0.075); scene.add(micStand);
      // Netzgerät
      const psu = powerSupply(THREE, { w: 0.2, h: 0.11, d: 0.16, label: 'Netzgerät 0 … 600 V', displays: 1, knobs: 2, sockets: ['red', 'black'] });
      psu.position.set(0.2, 0, -0.1); psu.rotation.y = -0.5; scene.add(psu); scene.updateMatrixWorld(true);
      const tTop = pTop.position.clone().add(new THREE.Vector3(0.045, 0, 0)), tBot = pBot.position.clone().add(new THREE.Vector3(0.045, 0, 0));
      scene.add(cable(THREE, psu.socketWorld(0), tTop, 0xc4231b, 0.05), cable(THREE, psu.socketWorld(1), tBot, 0x151515, 0.06));
      // Tröpfchen
      const P3 = d => new THREE.Vector3(d.x * 0.02, YC + d.y / VIEW * (GAP / 2 - 0.0015), (d.id - 0.5) * 0.01);
      const dPool = glowPool(THREE, scene, 14, 0xffe2a8, 0.0018);
      const modelG = new THREE.Group(); scene.add(modelG);
      const fArrows = []; for (let i = 0; i < 9; i++) { const a = arrow(THREE, 0x86dcff, { radius: 0.0004, head: 0.002 }); fArrows.push(a); modelG.add(a); }
      const aFe = arrow(THREE, 0x86dcff, { radius: 0.0006, head: 0.0025 }), aFg = arrow(THREE, 0x7fd6a0, { radius: 0.0006, head: 0.0025 }), aFr = arrow(THREE, 0xf2ac74, { radius: 0.0006, head: 0.0025 });
      modelG.add(aFe, aFg, aFr);
      const selRing = new THREE.Mesh(new THREE.TorusGeometry(0.0022, 0.0002, 6, 24), new THREE.MeshBasicMaterial({ color: 0x7fd6a0, toneMapped: false })); scene.add(selRing);
      let lblTxt = '', lbl = null;
      const off = lab.onFrame((dt, t) => {
        const model = MM.model;
        psu.displays[0].draw((S.on ? S.U : 0).toFixed(0), 'V'); psu.setKnob(0, S.U / 600);
        dPool.items.forEach((s, i) => { const d = S.drops[i]; s.visible = !!d; if (!d) return; s.position.copy(P3(d)); const sz = (model ? 0.003 : 0.0022) * (0.6 + d.r * 1e6); s.scale.set(sz, sz, 1); });
        const sel = S.sel && S.drops.includes(S.sel) ? S.sel : null;
        selRing.visible = !!sel; if (sel) { selRing.position.copy(P3(sel)); selRing.lookAt(lab.camera.position); }
        modelG.visible = model; if (lbl) lbl.visible = model && !!sel;
        if (!model) return;
        const on = S.on && S.U > 0, dir = S.top;   // oben + ⇒ Feld zeigt nach unten
        fArrows.forEach((a, i) => { a.visible = on; const x = -0.03 + (i % 5) * 0.015, z = (Math.floor(i / 5) - 0.5) * 0.02; a.set(new THREE.Vector3(x, YC + dir * GAP * 0.4, z), new THREE.Vector3(0, -dir * GAP * 0.8, 0)); });
        if (sel) {
          const p = P3(sel), Fg = mass(sel.r) * G, k = 0.012 / Fg, v = vUp(sel), Fr = -6 * Math.PI * ETA * sel.r * v;
          aFe.set(p.clone().add(new THREE.Vector3(-0.0015, 0, 0)), new THREE.Vector3(0, Fup(sel) * k, 0)); aFg.set(p, new THREE.Vector3(0, -Fg * k, 0)); aFr.set(p.clone().add(new THREE.Vector3(0.0015, 0, 0)), new THREE.Vector3(0, Fr * k, 0));
          const txt = `${sel.sign < 0 ? '−' : '+'}${sel.n} e`;
          if (txt !== lblTxt) { if (lbl) scene.remove(lbl); lbl = label(THREE, txt, { color: '#c7b6ff', size: 0.0035 }); scene.add(lbl); lblTxt = txt; }
          lbl.position.copy(p).add(new THREE.Vector3(0.006, 0.003, 0));
        } else { aFe.visible = aFg.visible = aFr.visible = false; }
      });
      return { destroy() { off(); lab.dispose(); } };
    }

    const host = viewHost(stage, { id: 'millikan', views: { '2d': view2d, '3d': view3d }, initial: '2d', modelInfo: 'Kräfte, Ladung in Elementarladungen' });

    let raf = 0, last = performance.now(), acc = 0;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      for (const d of S.drops) {
        d.v = vUp(d); const Dif = KT / (6 * Math.PI * ETA * d.r);
        d.y += d.v * 1000 * dt + gauss(Math.sqrt(2 * Dif * dt) * 1000); d.x += gauss(Math.sqrt(2 * Dif * dt) * 1000);
        d.x = Math.max(-0.95, Math.min(0.95, d.x));
      }
      // Tröpfchen, die das Bild verlassen, durch neue ersetzen (außer dem gewählten, das wird zurückgeholt)
      S.drops = S.drops.map(d => { if (Math.abs(d.y) < VIEW * 1.02) return d; if (d === S.sel) { d.y = Math.sign(d.y) * VIEW * 0.98; return d; } return newDrop(-Math.sign(d.y) * 0.95); });
      if (S.sw.run) S.sw.t += dt;
      acc += dt; if (acc > 0.1) { acc = 0; dUs.set(S.Us != null && S.UsDrop === S.sel ? `${fmt(S.Us, 1)} V` : '–'); dT.set(`${fmt(S.sw.t, 2)} s`); }
    }
    raf = requestAnimationFrame(loop);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); chQ.destroy(); chH.destroy(); } };
  }
};
