// ============================================================================
//  Schlüsselexperiment: Wellenwanne – Kreis- und ebene Wellen, Interferenz,
//  Beugung, Reflexion und Brechung an der Wasseroberfläche.
//  Wellenlänge aus der Dispersion für Kapillar-Schwerewellen:
//    ω² = (g·k + σ·k³/ρ) · tanh(k·h)
//  Das Feld wird als komplexe Amplitude Z(x,y) berechnet (Huygens, Spiegelquelle,
//  Snellius); die Momentaufnahme ist h(t) = Re(Z·e^(−iωt)).
// ============================================================================
import { viewHost } from '../js/lib/views.js';

const GRAV = 9.81, SIG = 0.072, RHO_W = 1000;
function kOf(f, h) {                                 // Wellenzahl in 1/m (Bisektion)
  const w2 = (2 * Math.PI * f) ** 2; let lo = 1, hi = 5000;
  for (let i = 0; i < 60; i++) { const k = (lo + hi) / 2, v = (GRAV * k + SIG * k ** 3 / RHO_W) * Math.tanh(k * h); if (v > w2) hi = k; else lo = k; }
  return (lo + hi) / 2;
}
const NX = 300, NY = 200, W_CM = 60, H_CM = 40, DX = W_CM / NX;   // Raster: 0,2 cm
const xOf = i => -W_CM / 2 + (i + 0.5) * DX, yOf = j => H_CM / 2 - (j + 0.5) * DX;
const MODES = [
  { id: 'kreis', name: 'Kreiswelle (ein Erreger)' }, { id: 'zwei', name: 'Zwei Erreger (Interferenz)' },
  { id: 'spalt', name: 'Ebene Welle am Spalt (Beugung)' }, { id: 'doppel', name: 'Ebene Welle am Doppelspalt' },
  { id: 'reflexion', name: 'Reflexion an einer Wand' }, { id: 'brechung', name: 'Brechung (flache Zone)' }
];
const XB = -8, H_SHALLOW = 0.0015;

const svgMarkup = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Projektion der Wellenwanne auf einem Schirm mit Maßstab und zwei Messpunkten">
<defs><marker id="wA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="context-stroke"/></marker></defs>
<rect width="1000" height="620" fill="#121518"/>
<rect x="46" y="6" width="908" height="608" rx="6" fill="#2a2c2e"/>
<foreignObject x="50" y="10" width="900" height="600"><canvas xmlns="http://www.w3.org/1999/xhtml" id="wCv" width="300" height="200" style="width:100%;height:100%;display:block"></canvas></foreignObject>
<g id="wRuler" font-family="IBM Plex Mono, monospace" font-size="10" fill="#c9c3ba" stroke="#c9c3ba"></g>
<g id="wObj"></g>
<g id="wModel" opacity="0" font-family="IBM Plex Mono, monospace"></g>
<g id="wM1" style="cursor:move"><circle r="9" fill="none" stroke="#7fd6a0" stroke-width="2"/><circle r="2" fill="#7fd6a0"/><text x="12" y="-10" fill="#7fd6a0" font-size="13" font-weight="600">1</text><circle r="18" fill="transparent"/></g>
<g id="wM2" style="cursor:move"><circle r="9" fill="none" stroke="#ab93ff" stroke-width="2"/><circle r="2" fill="#ab93ff"/><text x="12" y="-10" fill="#ab93ff" font-size="13" font-weight="600">2</text><circle r="18" fill="transparent"/></g>
<line id="wML" stroke="#ece6dc" stroke-width="1" stroke-dasharray="4 4"/>
<rect x="640" y="568" width="306" height="36" rx="6" fill="rgba(10,12,14,.8)"/>
<text id="wDx" x="936" y="592" fill="#ece6dc" font-size="14" text-anchor="end" font-family="IBM Plex Mono, monospace"></text>
<text id="wStro" x="60" y="598" fill="#ece6dc" font-size="12"></text>
</svg>`;

export default {
  intro: 'In einer flachen Wanne mit Wasser erzeugt ein schwingender Stift Wellen. Eine Lampe projiziert die Wellenberge als helle Linien auf einen Schirm. Hier seht ihr Interferenz, Beugung, Reflexion und Brechung direkt. Mit dem Stroboskop wird das Bild angehalten, und ihr messt die Wellenlänge.',
  docs: {
    durchfuehrung: `
<h3>Aufbau</h3>
<p>Die Wanne hat einen Glasboden und ist etwa 6 mm hoch mit Wasser gefüllt. Am Rand liegt ein Dämpfungsstreifen, damit die Wellen nicht zurückgeworfen werden. Ein Motor mit Exzenter bewegt einen Balken auf und ab. An ihm sitzen ein oder zwei Stifte (Kreiswellen) oder eine Leiste (ebene Wellen). Eine Lampe über der Wanne bildet die Oberfläche auf einem Schirm ab: Wellenberge wirken wie Sammellinsen und erscheinen hell.</p>
<h3>Durchführung</h3>
<ol>
<li>Kreiswelle mit f = 10 Hz erzeugen. Stroboskop auf Standbild stellen.</li>
<li>Messpunkt 1 auf einen hellen Wellenberg setzen, Messpunkt 2 einige Wellenberge weiter. Die Zahl k der Wellenlängen dazwischen einstellen. <b>Messwert übernehmen.</b></li>
<li>Für andere Frequenzen und Wassertiefen wiederholen und c = λ·f berechnen.</li>
<li>Zwei Erreger: Wo bleibt das Wasser ruhig? Stroboskop aus: Die ruhigen Linien sind dann gut zu sehen.</li>
<li>Spalt, Doppelspalt, Reflexion und Brechung untersuchen.</li>
</ol>`,
    theorie: `
<h3>Grundgleichung</h3>
<span class="formula">c = λ · f</span>
<p>Bei Wasserwellen hängt c von der Wellenlänge und der Wassertiefe ab. In der Wellenwanne wirken Schwerkraft und Oberflächenspannung zusammen:</p>
<span class="formula">ω² = (g·k + σ·k³/ρ) · tanh(k·h)    mit    k = 2π/λ</span>
<p>In flachem Wasser sind die Wellen langsamer. Bei sehr kurzen Wellen (hohe Frequenz) überwiegt die Oberflächenspannung, dann werden sie wieder schneller.</p>
<h3>Interferenz zweier Erreger</h3>
<p>Zwei gleichphasige Erreger im Abstand d. In einem Punkt mit dem Gangunterschied Δs = |s₁ − s₂| gilt:</p>
<span class="formula">Δs = k·λ: Verstärkung    Δs = (2k+1)·λ/2: Auslöschung</span>
<p>Die Punkte mit gleichem Δs liegen auf Hyperbeln. Auf den Knotenlinien bleibt das Wasser in Ruhe.</p>
<h3>Beugung am Spalt (Huygens)</h3>
<p>Jeder Punkt im Spalt ist Ausgangspunkt einer Elementarwelle. Ist der Spalt schmal gegen λ, entsteht dahinter eine Kreiswelle. Ist er breit, läuft die Welle fast gerade weiter. Erste Auslöschung bei b·sin α = λ.</p>
<h3>Reflexion und Brechung</h3>
<span class="formula">Reflexion: Einfallswinkel = Reflexionswinkel    Brechung: sin α / sin β = c₁ / c₂</span>
<p>Über der flachen Glasplatte ist das Wasser nur 1,5 mm tief. Die Wellen werden langsamer, λ wird kleiner, und die Wellenfronten knicken zum Lot hin ab.</p>
<h3>Modellgrenzen</h3>
<ul><li>Die Wanne ist am Rand vollständig gedämpft. An Spalt und Wand werden nur die wichtigsten Anteile berechnet; die Reflexion am Spaltrand fehlt.</li><li>Die Höhe der Wellen ist im 3D-Aufbau stark vergrößert.</li></ul>
<h3>Was die Modellansicht zeigt</h3><ul><li>Die Oberfläche als Höhenbild: Wellenberge rot, Wellentäler blau, ruhiges Wasser schwarz.</li><li>Bei zwei Erregern die Wege zu Messpunkt 1 und der Gangunterschied in Vielfachen von λ.</li><li>Am Spalt die Ausgangspunkte der Elementarwellen. Bei Reflexion und Brechung das Lot, die Wellennormalen und die Winkel.</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Wellenwanne</td><td>60 cm × 40 cm, Glasboden, Dämpfungsrand</td></tr>
<tr><td>Wassertiefe</td><td>4 · 6 · 8 mm, flache Zone 1,5 mm (Glasplatte)</td></tr>
<tr><td>Erreger</td><td>Exzentermotor 5 … 30 Hz, Stifte (Abstand 2 … 10 cm) oder Leiste</td></tr>
<tr><td>Hindernisse</td><td>Spaltbacken, Doppelspalt, Reflexionswand</td></tr>
<tr><td>Beleuchtung</td><td>Lampe über der Wanne, Stroboskop</td></tr>
</tbody></table>`,
    abi: `
<details class="q"><summary>Zwischen Messpunkt 1 und 2 liegen 6 Wellenlängen auf 12,6 cm bei f = 12 Hz. Berechne c. <span class="op">AFB I</span></summary><p>λ = 12,6 cm / 6 = 2,1 cm. c = λ·f = 0,021 m · 12 Hz ≈ 0,25 m/s.</p></details>
<details class="q"><summary>Zwei Erreger im Abstand 6 cm, λ = 2 cm. Wie viele Knotenlinien gibt es? <span class="op">AFB II</span></summary><p>Auslöschung bei Δs = (2k+1)·λ/2 mit Δs ≤ d = 6 cm: Δs = 1, 3, 5 cm. Je Wert zwei Hyperbeläste (links und rechts der Mittelsenkrechten): 6 Knotenlinien.</p></details>
<details class="q"><summary>Erkläre mit dem Huygensschen Prinzip, warum hinter einem schmalen Spalt eine Kreiswelle entsteht. <span class="op">AFB II</span></summary><p>Jeder Punkt der Wellenfront im Spalt sendet eine Elementarwelle aus. Ist der Spalt schmal gegen λ, gibt es praktisch nur einen solchen Punkt. Seine Elementarwelle breitet sich hinter dem Spalt nach allen Seiten als Kreiswelle aus.</p></details>
<details class="q"><summary>Eine Welle läuft unter α = 40° auf die flache Zone, dort ist c₂ = 0,7·c₁. Berechne den Brechungswinkel. <span class="op">AFB II</span></summary><p>sin β = sin α · c₂/c₁ = 0,643 · 0,7 = 0,450, β ≈ 26,7°. Die Welle wird zum Lot hin gebrochen.</p></details>
<details class="q"><summary>Warum sieht man ohne Stroboskop die Knotenlinien besonders gut? <span class="op">AFB II</span></summary><p>Ohne Stroboskop verschwimmen die schnell laufenden Wellen zu einer flimmernden Fläche. Nur auf den Knotenlinien bewegt sich das Wasser nicht. Diese ruhigen Linien heben sich deutlich ab.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, selectBox, segmented, button, fmt, dataTable, toast, display } = ui;
    const S = { mode: 'zwei', f: 12, h: 0.006, d: 6, b: 3, g: 6, alpha: 35, strobe: 'zeit', phase: 0, ver: 0, k: 5, m1: [0, 6], m2: [10, 6] };
    const Zr = new Float32Array(NX * NY), Zi = new Float32Array(NX * NY), Hh = new Float32Array(NX * NY), mask = new Uint8Array(NX * NY);
    const lamCm = (h = S.h) => 2 * Math.PI / kOf(S.f, h) * 100;
    let geo = {};                                        // Hindernisse, Quellen, Strahlen für die Zeichnung

    function compute() {
      const k1 = 2 * Math.PI / lamCm(), alp = 0.012; Zr.fill(0); Zi.fill(0); mask.fill(0); geo = { src: [], lines: [], huy: [] };
      const add = (n, a, ph) => { Zr[n] += a * Math.cos(ph); Zi[n] += a * Math.sin(ph); };
      const taper = (x, y) => Math.min(1, (W_CM / 2 - Math.abs(x)) / 2.5, (H_CM / 2 - Math.abs(y)) / 2.5);
      if (S.mode === 'kreis' || S.mode === 'zwei') {
        const srcs = S.mode === 'kreis' ? [[-10, 0]] : [[-12, S.d / 2], [-12, -S.d / 2]]; geo.src = srcs;
        for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const x = xOf(i), y = yOf(j), n = j * NX + i, tp = taper(x, y); for (const [sx, sy] of srcs) { const r = Math.hypot(x - sx, y - sy); add(n, tp * 1.6 / Math.sqrt(r + 0.6) * Math.exp(-alp * r), k1 * r); } }
      } else if (S.mode === 'spalt' || S.mode === 'doppel') {
        const open = S.mode === 'spalt' ? [[-S.b / 2, S.b / 2]] : [[S.g / 2 - 0.75, S.g / 2 + 0.75], [-S.g / 2 - 0.75, -S.g / 2 + 0.75]];
        const pts = []; for (const [a, b] of open) { const ns = Math.max(4, Math.ceil((b - a) / lamCm() * 7)); for (let q = 0; q < ns; q++) pts.push([a + (q + 0.5) * (b - a) / ns, (b - a) / ns]); }
        geo.huy = pts.map(p => p[0]); geo.open = open;
        const ph0 = k1 * (XB + 28);
        for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
          const x = xOf(i), y = yOf(j), n = j * NX + i, tp = taper(x, y);
          if (x < -28) continue;
          if (Math.abs(x - XB) < 0.5) { if (!open.some(([a, b]) => y > a && y < b)) { mask[n] = 1; continue; } }
          if (x < XB) { add(n, tp, k1 * (x + 28)); continue; }
          for (const [py, w] of pts) { const r = Math.hypot(x - XB, y - py) + 1e-3; add(n, tp * w * Math.sqrt(k1 / (2 * Math.PI * r)) * Math.exp(-alp * r), ph0 + k1 * r - Math.PI / 4); }
        }
      } else if (S.mode === 'reflexion') {
        const a = S.alpha * Math.PI / 180, nx = -Math.cos(a), ny = Math.sin(a), Wx = 8, dpx = -Math.cos(2 * a), dpy = Math.sin(2 * a), dd = (1 - dpx) * Wx;
        geo.wall = { Wx, nx, ny, a, dpx, dpy };
        for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
          const x = xOf(i), y = yOf(j), n = j * NX + i, tp = taper(x, y), s = (x - Wx) * nx + y * ny;
          if (x < -28) continue; if (s < -0.5) continue; if (s < 0) { mask[n] = 1; continue; }
          add(n, tp, k1 * (x + 28)); add(n, tp * 0.9, k1 * (dpx * x + dpy * y + dd + 28));
        }
      } else if (S.mode === 'brechung') {
        const a = S.alpha * Math.PI / 180, k2 = 2 * Math.PI / lamCm(H_SHALLOW), nx = Math.cos(a), ny = -Math.sin(a), tx = Math.sin(a), ty = Math.cos(a);
        const k1t = k1 * tx, k2n = Math.sqrt(Math.max(0, k2 * k2 - k1t * k1t)), kx = k1t * tx + k2n * nx, ky = k1t * ty + k2n * ny;
        geo.bound = { nx, ny, a, beta: Math.asin(k1t / k2), kx, ky, k2 };
        for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
          const x = xOf(i), y = yOf(j), n = j * NX + i, tp = taper(x, y);
          if (x < -28) continue;
          if (x * nx + y * ny < 0) add(n, tp, k1 * (x + 28)); else { add(n, tp * 0.95, kx * x + ky * y + k1 * 28); mask[n] = 2; }
        }
      }
    }
    compute();
    function updateH() { const c = Math.cos(S.phase), s = Math.sin(S.phase); for (let n = 0; n < Hh.length; n++) Hh[n] = Zr[n] * c + Zi[n] * s; }
    // Projektionsbild bzw. Höhenbild in ein ImageData schreiben
    function paint(img, model) {
      const d = img.data, blur = S.strobe === 'aus' && !model;
      for (let n = 0, o = 0; n < Hh.length; n++, o += 4) {
        if (mask[n] === 1) { d[o] = 40; d[o + 1] = 42; d[o + 2] = 46; d[o + 3] = 255; continue; }
        const h = Hh[n];
        if (model) { const v = Math.tanh(1.3 * h); if (v > 0) { d[o] = 20 + 235 * v; d[o + 1] = 20 + 90 * v; d[o + 2] = 20 + 40 * v; } else { d[o] = 20 - 10 * v; d[o + 1] = 20 - 120 * v; d[o + 2] = 20 - 235 * v; } d[o + 3] = 255; continue; }
        let b;
        if (blur) { const A = Math.hypot(Zr[n], Zi[n]); b = 0.6 + 0.2 * A * (Math.random() - 0.5); }
        else b = 0.58 + 0.42 * Math.tanh(1.5 * h) - (h < 0 ? 0.08 * Math.tanh(-h) : 0);
        if (mask[n] === 2) b *= 0.92;
        d[o] = Math.min(255, 250 * b); d[o + 1] = Math.min(255, 246 * b); d[o + 2] = Math.min(255, 232 * b); d[o + 3] = 255;
      }
    }

    // ---- Bedienfeld ----
    const gE = group('Erreger', { led: true }); gE.led(true);
    const sMode = selectBox({ label: 'Versuch', value: S.mode, options: MODES.map(m => ({ value: m.id, label: m.name })), onChange: v => { S.mode = v; vis(); S.ver++; } });
    const sF = slider({ label: 'Frequenz f', min: 5, max: 30, step: 0.5, value: S.f, unit: 'Hz', digits: 1, onInput: v => { S.f = v; S.ver++; } });
    const sD = slider({ label: 'Abstand der Erreger d', min: 2, max: 10, step: 0.5, value: S.d, unit: 'cm', digits: 1, onInput: v => { S.d = v; S.ver++; } });
    const sB = slider({ label: 'Spaltbreite b', min: 0.6, max: 12, step: 0.2, value: S.b, unit: 'cm', digits: 1, onInput: v => { S.b = v; S.ver++; } });
    const sG = slider({ label: 'Spaltabstand g', min: 3, max: 10, step: 0.5, value: S.g, unit: 'cm', digits: 1, onInput: v => { S.g = v; S.ver++; } });
    const sA = slider({ label: 'Einfallswinkel α', min: 0, max: 60, step: 1, value: S.alpha, unit: '°', digits: 0, onInput: v => { S.alpha = v; S.ver++; } });
    const segH = segmented({ value: 0.006, options: [{ value: 0.004, label: '4 mm' }, { value: 0.006, label: '6 mm' }, { value: 0.008, label: '8 mm' }], onChange: v => { S.h = v; S.ver++; } });
    gE.append(sMode, sF, sD, sB, sG, sA, el('div', { class: 'ctl' }, el('label', { style: 'grid-column:1/-1' }, 'Wassertiefe h'), el('div', { style: 'grid-column:1/-1' }, segH)));
    function vis() { sD.style.display = S.mode === 'zwei' ? '' : 'none'; sB.style.display = S.mode === 'spalt' ? '' : 'none'; sG.style.display = S.mode === 'doppel' ? '' : 'none'; sA.style.display = S.mode === 'reflexion' || S.mode === 'brechung' ? '' : 'none'; }
    vis();
    const gS = group('Stroboskop');
    const segS = segmented({ value: 'zeit', options: [{ value: 'aus', label: 'aus' }, { value: 'stand', label: 'Standbild' }, { value: 'zeit', label: 'Zeitlupe' }], onChange: v => { S.strobe = v; } });
    gS.append(el('div', { class: 'ctl' }, el('div', { style: 'grid-column:1/-1' }, segS)), el('p', { class: 'muted', style: 'font-size:12.5px;margin:8px 0 0' }, 'Ohne Stroboskop flimmert das Bild. Nur die Knotenlinien bleiben ruhig.'));
    const gM = group('Messung');
    const sK = slider({ label: 'Wellenlängen k zwischen den Punkten', min: 1, max: 15, step: 1, value: S.k, onInput: v => { S.k = v; } });
    const dDs = display('Abstand der Punkte'), dL = display('λ = Abstand / k'), dC = display('c = λ · f');
    gM.append(sK, dDs, dL, dC, el('div', { class: 'bar' }, button('Messwert übernehmen', () => take(), 'btn small primary')),
      el('p', { class: 'muted', style: 'font-size:12.5px;margin:8px 0 0' }, 'Die Messpunkte 1 und 2 im 2D-Aufbau auf Wellenberge ziehen (Standbild).'));
    controls.append(gE, gS, gM);

    // ---- Messwerte ----
    const rows = [];
    const tbl = dataTable([
      { key: 'h', label: 'Tiefe in mm', fmt: v => fmt(v * 1000, 0) }, { key: 'f', label: 'f in Hz', digits: 1 }, { key: 'k', label: 'k', digits: 0 },
      { key: 's', label: 'Abstand in cm', digits: 2 }, { key: 'lam', label: 'λ in cm', digits: 2 }, { key: 'c', label: 'c in m/s', digits: 3 }
    ], { onDelete: i => { rows.splice(i, 1); redraw(); } });
    const figC = el('div', { class: 'fig' }), figL = el('div', { class: 'fig' });
    const chC = new Chart(figC, { xlabel: 'f in Hz', ylabel: 'c in m/s', ymin: 0 }), chL = new Chart(figL, { xlabel: '1/f in s', ylabel: 'λ in cm' });
    const resC = el('div', { class: 'result' });
    messwerte.append(
      el('div', { class: 'data' },
        el('div', { class: 'chartbox' }, el('h4', {}, 'Ausbreitungsgeschwindigkeit c über f'), figC, resC,
          csvTools(() => ({ meta: ['Wellenwanne'], columns: [{ key: 'h', label: 'Tiefe in m' }, { key: 'f', label: 'f in Hz' }, { key: 'k', label: 'k' }, { key: 's', label: 'Abstand in cm' }, { key: 'lam', label: 'lambda in cm' }, { key: 'c', label: 'c in m/s' }], rows }), 'wellenwanne_messreihe')),
        el('div', { class: 'chartbox' }, el('h4', {}, 'λ über 1/f'), figL,
          el('p', { class: 'muted', style: 'font-size:13px;margin:8px 0 0' }, 'Wäre c konstant, lägen die Punkte auf einer Ursprungsgeraden. Gestrichelt: Theorie für die Tiefe 6 mm.'))),
      el('div', { style: 'height:14px' }), tbl);
    const cols = { 4: '#86dcff', 6: '#f2ac74', 8: '#7fd6a0' };
    function redraw() {
      tbl.render(rows);
      const sC = [], sL = [];
      for (const hm of [4, 6, 8]) { const r = rows.filter(q => Math.round(q.h * 1000) === hm); if (!r.length) continue; sC.push({ name: `${hm} mm`, color: cols[hm], mode: 'dot', points: r.map(q => [q.f, q.c]) }); sL.push({ name: `${hm} mm`, color: cols[hm], mode: 'dot', points: r.map(q => [1 / q.f, q.lam]) }); }
      const th = []; for (let f = 5; f <= 30; f += 0.5) th.push([f, 2 * Math.PI * f / kOf(f, 0.006)]);
      chC.set([{ points: th, color: '#4a545c', width: 1.2 }, ...sC]);
      const thL = []; for (let f = 5; f <= 30; f += 0.5) thL.push([1 / f, 2 * Math.PI / kOf(f, 0.006) * 100]);
      chL.set([{ points: thL, color: '#4a545c', width: 1.2 }, ...sL]);
      resC.innerHTML = rows.length ? `<div><span>Mittelwert</span><br><b>c = ${fmt(rows.reduce((a, q) => a + q.c, 0) / rows.length, 3)} m/s</b> <span>(${rows.length} Messungen)</span></div>` : '<span>Grau: Theorie für 6 mm Tiefe. c ändert sich mit f etwas.</span>';
    }
    redraw();
    const dist = () => Math.hypot(S.m2[0] - S.m1[0], S.m2[1] - S.m1[1]);
    function take() {
      const s = dist(); if (s < 0.3) { toast('Die Messpunkte liegen aufeinander.'); return; }
      const lam = s / S.k; rows.push({ h: S.h, f: S.f, k: S.k, s, lam, c: lam / 100 * S.f }); redraw(); toast(`Übernommen: λ = ${fmt(lam, 2)} cm, c = ${fmt(lam / 100 * S.f, 3)} m/s`);
    }

    // ======================= Ansicht 2D =======================
    async function view2d(box, MM) {
      box.insertAdjacentHTML('beforeend', svgMarkup());
      const svg = box.querySelector('svg'), q = id => svg.querySelector('#' + id);
      const cv = q('wCv'), cx = cv.getContext('2d'), img = cx.createImageData(NX, NY);
      const PX = 15, X = x => 500 + x * PX, Y = y => 310 - y * PX, iX = sx => (sx - 500) / PX, iY = sy => (310 - sy) / PX;
      { let h = ''; for (let x = -30; x <= 30; x++) { const L = x % 5 === 0 ? 10 : 5; h += `<line x1="${X(x)}" y1="10" x2="${X(x)}" y2="${10 + L}"/>`; if (x % 10 === 0 && Math.abs(x) < 30) h += `<text x="${X(x) + 2}" y="30" stroke="none">${x}</text>`; } for (let y = -20; y <= 20; y++) { const L = y % 5 === 0 ? 10 : 5; h += `<line x1="50" y1="${Y(y)}" x2="${50 + L}" y2="${Y(y)}"/>`; } h += `<text x="900" y="30" stroke="none">cm</text>`; q('wRuler').innerHTML = h; }
      function drawObj() {
        let h = '';
        if (geo.src?.length) for (const [sx, sy] of geo.src) h += `<circle cx="${X(sx)}" cy="${Y(sy)}" r="5" fill="#1a1a1a" stroke="#ece6dc" stroke-width="1.5"/>`;
        if (['spalt', 'doppel', 'reflexion', 'brechung'].includes(S.mode)) h += `<rect x="${X(-29.5)}" y="${Y(19.5)}" width="${0.9 * PX}" height="${39 * PX}" fill="#555b60" stroke="#222"/>`;
        q('wObj').innerHTML = h;
        // Modell-Überlagerung
        let m = ''; const lam = lamCm();
        if (S.mode === 'zwei') { const [s1, s2] = geo.src, r1 = Math.hypot(S.m1[0] - s1[0], S.m1[1] - s1[1]), r2 = Math.hypot(S.m1[0] - s2[0], S.m1[1] - s2[1]), ds = Math.abs(r1 - r2) / lam, fr = ds % 1;
          m += `<line x1="${X(s1[0])}" y1="${Y(s1[1])}" x2="${X(S.m1[0])}" y2="${Y(S.m1[1])}" stroke="#fff" stroke-dasharray="5 4"/><line x1="${X(s2[0])}" y1="${Y(s2[1])}" x2="${X(S.m1[0])}" y2="${Y(S.m1[1])}" stroke="#fff" stroke-dasharray="5 4"/>`;
          m += `<rect x="60" y="40" width="330" height="48" rx="6" fill="rgba(10,12,14,.85)"/><text x="72" y="60" fill="#ece6dc" font-size="13">s₁ = ${fmt(r1, 2)} cm   s₂ = ${fmt(r2, 2)} cm</text><text x="72" y="79" fill="#f2ac74" font-size="13">Δs = ${fmt(ds, 2)}·λ  ${Math.min(fr, 1 - fr) < 0.12 ? '→ Verstärkung' : Math.abs(fr - 0.5) < 0.12 ? '→ Auslöschung' : ''}</text>`; }
        if (geo.huy?.length) m += geo.huy.map(y => `<circle cx="${X(XB)}" cy="${Y(y)}" r="2.5" fill="#c7b6ff"/>`).join('') + `<text x="${X(XB) + 8}" y="${Y(-12)}" fill="#c7b6ff" font-size="12">Ausgangspunkte der Elementarwellen</text>`;
        if (geo.wall) { const { Wx, nx, ny, a, dpx, dpy } = geo.wall, tx = ny, ty = -nx;
          m += `<line x1="${X(Wx - tx * 22)}" y1="${Y(-ty * 22)}" x2="${X(Wx + tx * 22)}" y2="${Y(ty * 22)}" stroke="#ece6dc" stroke-width="1"/>`;
          m += `<line x1="${X(Wx)}" y1="${Y(0)}" x2="${X(Wx + nx * 12)}" y2="${Y(ny * 12)}" stroke="#ece6dc" stroke-dasharray="4 4"/>`;
          m += `<line x1="${X(Wx - 14)}" y1="${Y(0)}" x2="${X(Wx - 1)}" y2="${Y(0)}" stroke="#86dcff" stroke-width="2.5" marker-end="url(#wA)"/><line x1="${X(Wx)}" y1="${Y(0)}" x2="${X(Wx + dpx * 13)}" y2="${Y(dpy * 13)}" stroke="#f2ac74" stroke-width="2.5" marker-end="url(#wA)"/>`;
          m += `<rect x="60" y="40" width="330" height="30" rx="6" fill="rgba(10,12,14,.85)"/><text x="72" y="60" fill="#ece6dc" font-size="13">Einfallswinkel ${S.alpha}° = Reflexionswinkel ${S.alpha}°</text>`; }
        if (geo.bound) { const { nx, ny, beta, kx, ky, k2 } = geo.bound, tx = -ny, ty = nx;
          m += `<line x1="${X(-tx * 22)}" y1="${Y(-ty * 22)}" x2="${X(tx * 22)}" y2="${Y(ty * 22)}" stroke="#ece6dc"/><line x1="${X(-nx * 12)}" y1="${Y(-ny * 12)}" x2="${X(nx * 12)}" y2="${Y(ny * 12)}" stroke="#ece6dc" stroke-dasharray="4 4"/>`;
          m += `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(kx / k2 * 12)}" y2="${Y(ky / k2 * 12)}" stroke="#f2ac74" stroke-width="2.5" marker-end="url(#wA)"/>`;
          m += `<line x1="${X(-12)}" y1="${Y(0)}" x2="${X(-0.6)}" y2="${Y(0)}" stroke="#86dcff" stroke-width="2.5" marker-end="url(#wA)"/>`;
          const c1 = S.f * lamCm() / 100, c2 = S.f * lamCm(H_SHALLOW) / 100;
          m += `<rect x="60" y="40" width="420" height="48" rx="6" fill="rgba(10,12,14,.85)"/><text x="72" y="60" fill="#ece6dc" font-size="13">α = ${S.alpha}°   β = ${fmt(beta * 180 / Math.PI, 1)}°   (flache Zone rechts)</text><text x="72" y="79" fill="#f2ac74" font-size="13">c₁ = ${fmt(c1, 3)} m/s   c₂ = ${fmt(c2, 3)} m/s</text>`; }
        m += `<text x="940" y="56" fill="#ece6dc" font-size="13" text-anchor="end">λ = ${fmt(lam, 2)} cm${S.mode === 'brechung' ? ` · in der flachen Zone ${fmt(lamCm(H_SHALLOW), 2)} cm` : ''}</text>`;
        q('wModel').innerHTML = m;
      }
      let drag = null;
      const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
      for (const [id, key] of [['wM1', 'm1'], ['wM2', 'm2']]) q(id).addEventListener('pointerdown', e => { drag = key; svg.setPointerCapture(e.pointerId); e.preventDefault(); });
      svg.addEventListener('pointermove', e => { if (!drag) return; const c = toSvg(e); S[drag] = [Math.max(-29, Math.min(29, Math.round(iX(c.x) * 20) / 20)), Math.max(-19, Math.min(19, Math.round(iY(c.y) * 20) / 20))]; });
      svg.addEventListener('pointerup', () => { drag = null; });
      let raf = 0, ver = -1, mver = '';
      function frame() {
        raf = requestAnimationFrame(frame);
        const model = MM.model;
        if (ver !== S.ver) { ver = S.ver; compute(); mver = ''; }
        updateH(); paint(img, model); cx.putImageData(img, 0, 0);
        const key = `${ver}|${S.m1}|${model}`; if (key !== mver) { mver = key; drawObj(); }
        q('wModel').setAttribute('opacity', model ? 1 : 0);
        q('wM1').setAttribute('transform', `translate(${X(S.m1[0])} ${Y(S.m1[1])})`); q('wM2').setAttribute('transform', `translate(${X(S.m2[0])} ${Y(S.m2[1])})`);
        q('wML').setAttribute('x1', X(S.m1[0])); q('wML').setAttribute('y1', Y(S.m1[1])); q('wML').setAttribute('x2', X(S.m2[0])); q('wML').setAttribute('y2', Y(S.m2[1]));
        q('wDx').textContent = `Abstand ${fmt(dist(), 2)} cm · k = ${S.k}`;
        q('wStro').textContent = model ? 'Modell: Höhenbild (rot Berg, blau Tal)' : S.strobe === 'aus' ? 'Stroboskop aus' : S.strobe === 'stand' ? 'Stroboskop: Standbild' : 'Stroboskop: Zeitlupe';
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); } };
    }

    // ======================= Ansicht 3D =======================
    async function view3d(box, MM) {
      const { createLab, mats } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [0.0, 0.82, 0.78], target: [0, 0.2, 0], table: [1.6, 1.3], bloom: [0.35, 0.4, 0.92], room: 0.4, minDist: 0.25, maxDist: 2.6, fov: 38 });
      const { THREE, scene } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad · Wellenhöhe stark vergrößert</div>');
      const YT = 0.3, SX = NX / 2, SY = NY / 2;                  // Wannenhöhe, Gitter fürs 3D-Netz (jeder 2. Punkt)
      // Gestell und Rahmen
      const al = new THREE.MeshStandardMaterial({ color: 0xb9bec2, metalness: 0.9, roughness: 0.35 });
      for (const [x, z] of [[-0.31, -0.21], [0.31, -0.21], [-0.31, 0.21], [0.31, 0.21]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, YT, 12), al); l.position.set(x, YT / 2, z); scene.add(l); }
      for (const [w, d, x, z] of [[0.64, 0.02, 0, -0.21], [0.64, 0.02, 0, 0.21], [0.02, 0.44, -0.31, 0], [0.02, 0.44, 0.31, 0]]) { const r = new THREE.Mesh(new THREE.BoxGeometry(w, 0.025, d), al); r.position.set(x, YT, z); r.castShadow = true; scene.add(r); }
      const glassB = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.004, 0.4), new THREE.MeshPhysicalMaterial({ color: 0xcfe6ee, transparent: true, opacity: 0.25, roughness: 0.05 })); glassB.position.y = YT - 0.008; scene.add(glassB);
      // Wasseroberfläche
      const wg = new THREE.PlaneGeometry(0.6, 0.4, SX - 1, SY - 1); wg.rotateX(-Math.PI / 2);
      const colors = new Float32Array(SX * SY * 3); wg.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const waterMat = new THREE.MeshPhysicalMaterial({ color: 0x5f9ab8, roughness: 0.06, metalness: 0.0, transparent: true, opacity: 0.78, clearcoat: 1, clearcoatRoughness: 0.05 });
      const heatMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
      const water = new THREE.Mesh(wg, waterMat); water.position.y = YT; scene.add(water);
      const pos = wg.attributes.position;
      // Projektion auf dem Tisch
      const pc = document.createElement('canvas'); pc.width = NX; pc.height = NY; const pcx = pc.getContext('2d'); const pimg = pcx.createImageData(NX, NY);
      const pTex = new THREE.CanvasTexture(pc); pTex.colorSpace = THREE.SRGBColorSpace;
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), new THREE.MeshBasicMaterial({ map: pTex, toneMapped: true })); sheet.rotation.x = -Math.PI / 2; sheet.position.y = 0.002; scene.add(sheet);
      // Lampe darüber
      const lampH = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.06, 24), M.housing); lampH.position.set(0, 0.85, 0); scene.add(lampH);
      const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.85, 12), al); lampPole.position.set(-0.36, 0.425, -0.22); scene.add(lampPole);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.45, 12), al); arm.rotation.z = Math.PI / 2; arm.rotation.y = -0.55; arm.position.set(-0.18, 0.88, -0.11); scene.add(arm);
      const spot = new THREE.SpotLight(0xfff4e0, 6, 2, 0.6, 0.5, 1.5); spot.position.set(0, 0.82, 0); spot.target.position.set(0, 0, 0); scene.add(spot, spot.target);
      // Erreger und Hindernisse
      const objG = new THREE.Group(); scene.add(objG);
      const dark = new THREE.MeshStandardMaterial({ color: 0x3a3f44, roughness: 0.6 });
      function buildObj() {
        objG.clear();
        const P = (x, y) => new THREE.Vector3(x / 100, YT, -y / 100);
        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.012, 0.3), dark); beam.position.set(-0.12, YT + 0.06, 0); objG.add(beam);
        if (geo.src?.length) for (const [sx, sy] of geo.src) { const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.06, 10), M.steel); pin.position.copy(P(sx, sy)).add(new THREE.Vector3(0, 0.03, 0)); objG.add(pin); beam.position.x = sx / 100; }
        else { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.01, 0.38), M.steel); bar.position.copy(P(-29, 0)); objG.add(bar); beam.position.x = -0.29; }
        if (S.mode === 'spalt' || S.mode === 'doppel') { const edges = [-20, ...geo.open.flat().sort((a, b) => a - b), 20]; for (let i = 0; i < edges.length; i += 2) { const a = edges[i], b = edges[i + 1]; if (b - a < 0.1) continue; const m = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.015, (b - a) / 100), dark); m.position.copy(P(XB, (a + b) / 2)); objG.add(m); } }
        if (geo.wall) { const { Wx, nx, ny } = geo.wall; const m = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.015, 0.44), dark); m.position.copy(P(Wx, 0)); m.rotation.y = Math.atan2(ny, nx); objG.add(m); }
        if (geo.bound) { const { nx, ny } = geo.bound; const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.004, 0.6), new THREE.MeshPhysicalMaterial({ color: 0xd8f0ff, transparent: true, opacity: 0.35 })); const off = 0.2; m.position.set(nx * off, YT - 0.004, -ny * off); m.rotation.y = Math.atan2(ny, nx); objG.add(m); }
      }
      let ver = -1, wasModel = null;
      const off = lab.onFrame(() => {
        const model = MM.model;
        if (ver !== S.ver) { ver = S.ver; compute(); buildObj(); }
        if (wasModel !== model) { wasModel = model; water.material = model ? heatMat : waterMat; }
        updateH();
        for (let j = 0; j < SY; j++) for (let i = 0; i < SX; i++) {
          const n = (2 * j) * NX + 2 * i, v = j * SX + i, h = mask[n] === 1 ? 0 : Math.max(-2.5, Math.min(2.5, Hh[n]));
          pos.setY(v, h * 0.0016);
          if (model) { const t = Math.tanh(1.3 * h); if (t > 0) { colors[3 * v] = 0.08 + 0.92 * t; colors[3 * v + 1] = 0.08 + 0.35 * t; colors[3 * v + 2] = 0.08 + 0.15 * t; } else { colors[3 * v] = 0.08; colors[3 * v + 1] = 0.08 - 0.45 * t; colors[3 * v + 2] = 0.08 - 0.92 * t; } }
        }
        pos.needsUpdate = true; wg.computeVertexNormals(); if (model) wg.attributes.color.needsUpdate = true;
        paint(pimg, false); pcx.putImageData(pimg, 0, 0); pTex.needsUpdate = true;
      });
      return { destroy() { off(); lab.dispose(); } };
    }

    const host = viewHost(stage, { id: 'wellenwanne', views: { '2d': view2d, '3d': view3d }, initial: '2d', modelInfo: 'Höhenbild, Gangunterschied, Wellennormalen' });

    let raf = 0, last = performance.now(), slow = 0;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      if (S.strobe !== 'stand') S.phase += 2 * Math.PI * 0.6 * dt;
      slow += dt; if (slow > 0.15) { slow = 0; const s = dist(), lam = s / S.k; dDs.set(`${fmt(s, 2)} cm`); dL.set(`${fmt(lam, 2)} cm`); dC.set(`${fmt(lam / 100 * S.f, 3)} m/s`); }
    }
    raf = requestAnimationFrame(loop);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); chC.destroy(); chL.destroy(); } };
  }
};
