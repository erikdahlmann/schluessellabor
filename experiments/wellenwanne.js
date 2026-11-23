// ============================================================================
//  Schlüsselexperiment: Wellenwanne – Kreis- und ebene Wellen, Interferenz
//  mehrerer Erreger, Beugung an Spalt, Mehrfachspalt, Hindernis und Kante,
//  Reflexion und Brechung.
//  Wellenlänge aus der Dispersion für Kapillar-Schwerewellen:
//    ω² = (g·k + σ·k³/ρ) · tanh(k·h)
//  Das Feld wird als komplexe Amplitude Z(x,y) berechnet (Huygens, Babinet,
//  Spiegelquelle, Snellius); die Momentaufnahme ist h(t) = Re(Z·e^(−iωt)).
//  Messung je Versuch: λ (immer), Gangunterschied, Beugungswinkel,
//  Reflexions- und Brechungswinkel.
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
  { id: 'kreis', name: 'Kreiswelle (ein Erreger)' }, { id: 'erreger', name: 'Mehrere Erreger (2 … 8)' },
  { id: 'spalt', name: 'Ebene Welle am Spalt' }, { id: 'mehrfach', name: 'Ebene Welle am Mehrfachspalt (2 … 8)' },
  { id: 'hindernis', name: 'Ebene Welle an einer Platte (Hindernis)' }, { id: 'kante', name: 'Ebene Welle an einer Kante' },
  { id: 'reflexion', name: 'Reflexion an einer Wand' }, { id: 'brechung', name: 'Brechung (flache Zone)' }
];
const XB = -8, XS = -12, H_SHALLOW = 0.0015, WALL_X = 8;
const deg = r => r * 180 / Math.PI;

const svgMarkup = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Projektion der Wellenwanne auf einem Schirm mit Maßstab und zwei Messpunkten">
<defs><marker id="wA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="context-stroke"/></marker></defs>
<rect width="1000" height="620" fill="#121518"/>
<rect x="46" y="6" width="908" height="608" rx="6" fill="#2a2c2e"/>
<foreignObject x="50" y="10" width="900" height="600"><canvas xmlns="http://www.w3.org/1999/xhtml" id="wCv" width="300" height="200" style="width:100%;height:100%;display:block"></canvas></foreignObject>
<g id="wRuler" font-family="IBM Plex Mono, monospace" font-size="10" fill="#c9c3ba" stroke="#c9c3ba"></g>
<g id="wObj"></g>
<g id="wModel" opacity="0" font-family="IBM Plex Mono, monospace"></g>
<g id="wTool" font-family="IBM Plex Mono, monospace"></g>
<g id="wM1" style="cursor:move"><circle r="9" fill="none" stroke="#7fd6a0" stroke-width="2"/><circle r="2" fill="#7fd6a0"/><text x="12" y="-10" fill="#7fd6a0" font-size="13" font-weight="600">1</text><circle r="18" fill="transparent"/></g>
<g id="wM2" style="cursor:move"><circle r="9" fill="none" stroke="#ab93ff" stroke-width="2"/><circle r="2" fill="#ab93ff"/><text x="12" y="-10" fill="#ab93ff" font-size="13" font-weight="600">2</text><circle r="18" fill="transparent"/></g>
<line id="wML" stroke="#ece6dc" stroke-width="1" stroke-dasharray="4 4"/>
<rect x="560" y="568" width="386" height="36" rx="6" fill="rgba(10,12,14,.82)"/>
<text id="wDx" x="936" y="592" fill="#ece6dc" font-size="13" text-anchor="end" font-family="IBM Plex Mono, monospace"></text>
<text id="wStro" x="60" y="598" fill="#ece6dc" font-size="12"></text>
</svg>`;

export default {
  intro: 'In einer flachen Wanne mit Wasser erzeugen schwingende Stifte oder eine Leiste Wellen. Eine Lampe projiziert die Wellenberge als helle Linien auf einen Schirm. Hier seht ihr Interferenz von bis zu acht Erregern, Beugung an Spalten, Hindernissen und Kanten sowie Reflexion und Brechung. Je nach Versuch messt ihr Wellenlänge, Gangunterschied oder Winkel.',
  docs: {
    durchfuehrung: `
<h3>Aufbau</h3>
<p>Die Wanne hat einen Glasboden und ist etwa 6 mm hoch mit Wasser gefüllt. Am Rand liegt ein Dämpfungsstreifen, damit die Wellen nicht zurückgeworfen werden. Ein Motor mit Exzenter bewegt einen Balken auf und ab. An ihm sitzen bis zu acht Stifte (Kreiswellen) oder eine Leiste (ebene Wellen). In die Wanne lassen sich Spaltbacken, Mehrfachspalte, eine Platte, eine Kante, eine Reflexionswand oder eine Glasplatte (flache Zone) legen. Eine Lampe über der Wanne bildet die Oberfläche auf einem Schirm ab.</p>
<h3>Durchführung</h3>
<ol>
<li><b>Wellenlänge:</b> Stroboskop auf Standbild. Messpunkt 1 und 2 auf zwei Wellenberge setzen, die Zahl k der Wellenlängen dazwischen einstellen, <b>λ übernehmen</b>. Für mehrere Frequenzen wiederholen.</li>
<li><b>Mehrere Erreger:</b> Stroboskop aus, dann sind die ruhigen Knotenlinien gut zu sehen. Messpunkt 1 auf eine Knotenlinie (bzw. eine Linie größter Bewegung) setzen und übernehmen. Das Programm misst die Wege zu den Erregern wie ein Lineal.</li>
<li><b>Spalt, Mehrfachspalt:</b> Messpunkt 1 weit hinter den Spalt auf die erste ruhige Richtung (Spalt) bzw. die erste Nebenrichtung mit starker Bewegung (Mehrfachspalt) setzen. Der Winkel wird von der Mitte der Öffnung aus gemessen.</li>
<li><b>Reflexion:</b> Messpunkt 1 auf die Richtung der reflektierten Wellenfront (senkrecht zu den reflektierten Wellenbergen) setzen.</li>
<li><b>Brechung:</b> λ in beiden Zonen messen (beide Messpunkte in derselben Zone). Messpunkt 1 auf die Richtung der gebrochenen Welle setzen und den Brechungswinkel übernehmen.</li>
<li>Platte und Kante: Wo dringen die Wellen in den Schattenraum ein?</li>
</ol>`,
    theorie: `
<h3>Grundgleichung</h3>
<span class="formula">c = λ · f</span>
<p>Bei Wasserwellen hängt c von der Wellenlänge und der Wassertiefe ab. In der Wellenwanne wirken Schwerkraft und Oberflächenspannung zusammen:</p>
<span class="formula">ω² = (g·k + σ·k³/ρ) · tanh(k·h)    mit    k = 2π/λ</span>
<h3>Interferenz zweier Erreger</h3>
<span class="formula">Δs = |s₁ − s₂| = k·λ: Verstärkung    Δs = (2k+1)·λ/2: Auslöschung</span>
<p>Die Punkte mit gleichem Δs liegen auf Hyperbeln. Auf den Knotenlinien bleibt das Wasser in Ruhe.</p>
<h3>Viele Erreger</h3>
<p>Bei N Erregern im Abstand d überlagern sich N Kreiswellen. Weit weg verstärken sich alle, wenn benachbarte Erreger den Gangunterschied d·sin α = k·λ haben. Mit mehr Erregern werden diese Richtungen schmaler, dazwischen ist es fast ruhig (wie beim optischen Gitter). Eilt jeder Erreger seinem unteren Nachbarn um Δφ voraus, kippt die Hauptrichtung zu den nachhinkenden Erregern hin: d·sin α = (k − Δφ/360°)·λ (α nach oben positiv). So lenkt man auch Radar- und Ultraschallstrahlen. Liegen die Erreger enger als λ, entsteht eine fast ebene Welle (Huygens).</p>
<h3>Beugung an Spalt und Mehrfachspalt</h3>
<span class="formula">Spalt (Breite b): erste Auslöschung bei b·sin α = λ</span>
<span class="formula">Mehrfachspalt (Abstand g): Hauptmaxima bei g·sin α = k·λ</span>
<h3>Hindernis und Kante</h3>
<p>Hinter einer Platte entsteht kein scharfer Schatten. Von beiden Rändern gehen Elementarwellen in den Schattenraum. Sie überlagern sich hinter der Mitte der Platte (Babinet: das Feld hinter der Platte ist die ungestörte Welle minus das Feld hinter einem gleich breiten Spalt). An einer Kante dringt die Welle in den Schatten ein, die Wellenberge laufen dort als Kreisbögen um die Kante.</p>
<h3>Reflexion und Brechung</h3>
<span class="formula">Reflexion: Einfallswinkel = Reflexionswinkel    Brechung: sin α / sin β = c₁ / c₂ = λ₁ / λ₂</span>
<h3>Modellgrenzen</h3>
<ul><li>Die Wanne ist am Rand vollständig gedämpft. Reflexionen an Spaltbacken, Platte und Kante fehlen.</li><li>Die Winkel werden für weit entfernte Punkte gemessen. Nah am Spalt weichen sie etwas ab.</li><li>Die Höhe der Wellen ist im 3D-Aufbau stark vergrößert.</li></ul>
<h3>Was die Modellansicht zeigt</h3><ul><li>Die Oberfläche als Höhenbild: Wellenberge rot, Wellentäler blau, ruhiges Wasser schwarz.</li><li>Bei zwei Erregern die Wege zu Messpunkt 1 und der Gangunterschied; bei mehr Erregern und beim Mehrfachspalt die Richtungen der Hauptmaxima; beim Spalt die Richtungen der ersten Auslöschung.</li><li>An Öffnungen und Hindernissen die Ausgangspunkte der Elementarwellen, bei Reflexion und Brechung Lot, Wellennormalen und Winkel.</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Wellenwanne</td><td>60 cm × 40 cm, Glasboden, Dämpfungsrand</td></tr>
<tr><td>Wassertiefe</td><td>4 · 6 · 8 mm, flache Zone 1,5 mm (Glasplatte)</td></tr>
<tr><td>Erreger</td><td>Exzentermotor 5 … 30 Hz, 1 bis 8 Stifte (Abstand 1 … 10 cm, Phasenschieber) oder Leiste</td></tr>
<tr><td>Hindernisse</td><td>Spaltbacken, Mehrfachspalt, Platte, Kante, Reflexionswand</td></tr>
<tr><td>Beleuchtung</td><td>Lampe über der Wanne, Stroboskop</td></tr>
</tbody></table>`,
    abi: `
<details class="q"><summary>Zwischen Messpunkt 1 und 2 liegen 6 Wellenlängen auf 12,6 cm bei f = 12 Hz. Berechne c. <span class="op">AFB I</span></summary><p>λ = 12,6 cm / 6 = 2,1 cm. c = λ·f = 0,021 m · 12 Hz ≈ 0,25 m/s.</p></details>
<details class="q"><summary>Zwei Erreger im Abstand 6 cm, λ = 2 cm. Wie viele Knotenlinien gibt es? <span class="op">AFB II</span></summary><p>Auslöschung bei Δs = (2k+1)·λ/2 mit Δs ≤ d = 6 cm: Δs = 1, 3, 5 cm. Je Wert zwei Hyperbeläste: 6 Knotenlinien.</p></details>
<details class="q"><summary>Sechs Erreger im Abstand 3 cm, λ = 2 cm. Unter welchen Winkeln liegen die Hauptmaxima? <span class="op">AFB II</span></summary><p>d·sin α = k·λ: sin α = k·2/3. k = 0: 0°; k = 1: 41,8°. Für k = 2 wäre sin α > 1, also gibt es nur drei Hauptrichtungen (0°, ±41,8°).</p></details>
<details class="q"><summary>Erkläre mit dem Huygensschen Prinzip, warum hinter einer Platte kein scharfer Schatten entsteht. <span class="op">AFB II</span></summary><p>Die Punkte der Wellenfront neben den Rändern der Platte senden Elementarwellen aus. Diese breiten sich auch in den Raum hinter der Platte aus. Ist die Platte nicht viel breiter als λ, füllen sie den Schatten nach kurzer Strecke fast vollständig.</p></details>
<details class="q"><summary>Eine Welle läuft unter α = 40° auf die flache Zone, dort ist c₂ = 0,7·c₁. Berechne den Brechungswinkel. <span class="op">AFB II</span></summary><p>sin β = sin α · c₂/c₁ = 0,643 · 0,7 = 0,450, β ≈ 26,7°.</p></details>
<details class="q"><summary>Warum sieht man ohne Stroboskop die Knotenlinien besonders gut? <span class="op">AFB II</span></summary><p>Ohne Stroboskop verschwimmen die schnell laufenden Wellen zu einer flimmernden Fläche. Nur auf den Knotenlinien bewegt sich das Wasser nicht.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, selectBox, segmented, button, fmt, dataTable, toast, display } = ui;
    const S = { mode: 'erreger', f: 12, h: 0.006, N: 2, d: 6, dphi: 0, b: 3, g: 5, w: 1.2, alpha: 35, strobe: 'zeit', phase: 0, ver: 0, k: 5, m1: [10, 8], m2: [16, 8] };
    const Zr = new Float32Array(NX * NY), Zi = new Float32Array(NX * NY), Hh = new Float32Array(NX * NY), mask = new Uint8Array(NX * NY);
    const lamCm = (h = S.h) => 2 * Math.PI / kOf(S.f, h) * 100;
    let geo = {};

    // Öffnungen bzw. Hindernisflächen in der Ebene x = XB
    const openings = () => {
      if (S.mode === 'spalt') return [[-S.b / 2, S.b / 2]];
      if (S.mode === 'mehrfach') return Array.from({ length: S.N }, (_, j) => { const c = (j - (S.N - 1) / 2) * S.g; return [c - S.w / 2, c + S.w / 2]; });
      if (S.mode === 'kante') return [[0, 21]];
      return [];
    };
    function compute() {
      const k1 = 2 * Math.PI / lamCm(), alp = 0.012; Zr.fill(0); Zi.fill(0); mask.fill(0); geo = { src: [], huy: [], open: [] };
      const add = (n, a, ph) => { Zr[n] += a * Math.cos(ph); Zi[n] += a * Math.sin(ph); };
      const taper = (x, y) => Math.min(1, (W_CM / 2 - Math.abs(x)) / 2.5, (H_CM / 2 - Math.abs(y)) / 2.5);
      const huygensPts = segs => { const pts = []; for (const [a, b] of segs) { const lo = Math.max(a, -20), hi = Math.min(b, 20), ns = Math.max(4, Math.ceil((hi - lo) / lamCm() * 7)); for (let q = 0; q < ns; q++) pts.push([lo + (q + 0.5) * (hi - lo) / ns, (hi - lo) / ns]); } return pts; };
      if (S.mode === 'kreis' || S.mode === 'erreger') {
        const N = S.mode === 'kreis' ? 1 : S.N, srcs = Array.from({ length: N }, (_, j) => [XS, (j - (N - 1) / 2) * S.d, j * S.dphi * Math.PI / 180]); geo.src = srcs;
        const amp = 1.6 / Math.sqrt(Math.max(1, N / 2));
        for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const x = xOf(i), y = yOf(j), n = j * NX + i, tp = taper(x, y); for (const [sx, sy, ph] of srcs) { const r = Math.hypot(x - sx, y - sy); add(n, tp * amp / Math.sqrt(r + 0.6) * Math.exp(-alp * r), k1 * r - ph); } }
      } else if (S.mode === 'spalt' || S.mode === 'mehrfach' || S.mode === 'kante' || S.mode === 'hindernis') {
        const plate = S.mode === 'hindernis' ? [[-S.b / 2, S.b / 2]] : null, open = plate ? [] : openings();
        const pts = huygensPts(plate || open); geo.huy = pts.map(p => p[0]); geo.open = open; geo.plate = plate;
        const ph0 = k1 * (XB + 28), sign = plate ? -1 : 1;
        for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
          const x = xOf(i), y = yOf(j), n = j * NX + i, tp = taper(x, y);
          if (x < -28) continue;
          if (Math.abs(x - XB) < 0.5) { const blocked = plate ? (y > plate[0][0] && y < plate[0][1]) : !open.some(([a, b]) => y > a && y < b); if (blocked) { mask[n] = 1; continue; } }
          if (x < XB) { add(n, tp, k1 * (x + 28)); continue; }
          if (plate) add(n, tp, k1 * (x + 28));                       // Babinet: ungestörte Welle minus Spaltfeld
          for (const [py, w] of pts) { const r = Math.hypot(x - XB, y - py) + 1e-3; add(n, sign * tp * w * Math.sqrt(k1 / (2 * Math.PI * r)) * Math.exp(-alp * r), ph0 + k1 * r - Math.PI / 4); }
        }
      } else if (S.mode === 'reflexion') {
        const a = S.alpha * Math.PI / 180, nx = -Math.cos(a), ny = Math.sin(a), Wx = WALL_X, dpx = -Math.cos(2 * a), dpy = Math.sin(2 * a), dd = (1 - dpx) * Wx;
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
    let cVer = -1; const ensure = () => { if (cVer !== S.ver) { cVer = S.ver; compute(); } };
    ensure();
    function updateH() { const c = Math.cos(S.phase), s = Math.sin(S.phase); for (let n = 0; n < Hh.length; n++) Hh[n] = Zr[n] * c + Zi[n] * s; }
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

    // ---- Messgrößen am Messpunkt 1 (wie mit Lineal und Winkelmesser) ----
    const origin = () => S.mode === 'erreger' ? [XS, 0] : S.mode === 'reflexion' ? [WALL_X, 0] : S.mode === 'brechung' ? [0, 0] : S.mode === 'kante' ? [XB, 0] : [XB, 0];
    function angleAtM1() {   // vorzeichenbehafteter Winkel zur Bezugsrichtung in Grad
      const [ox, oy] = origin(), dx = S.m1[0] - ox, dy = S.m1[1] - oy;
      if (S.mode === 'reflexion') { const { nx, ny } = geo.wall; const c = (dx * nx + dy * ny) / Math.hypot(dx, dy); return deg(Math.acos(Math.max(-1, Math.min(1, c)))); }
      if (S.mode === 'brechung') { const { nx, ny } = geo.bound; const c = (dx * nx + dy * ny) / Math.hypot(dx, dy); return deg(Math.acos(Math.max(-1, Math.min(1, c)))); }
      return deg(Math.atan2(dy, dx));
    }
    const zoneOf = p => S.mode === 'brechung' && geo.bound && (p[0] * geo.bound.nx + p[1] * geo.bound.ny > 0) ? 2 : 1;

    // ---- Bedienfeld ----
    const gE = group('Erreger und Hindernisse', { led: true }); gE.led(true);
    const sMode = selectBox({ label: 'Versuch', value: S.mode, options: MODES.map(m => ({ value: m.id, label: m.name })), onChange: v => { S.mode = v; presetMarkers(); vis(); S.ver++; } });
    const sF = slider({ label: 'Frequenz f', min: 5, max: 30, step: 0.5, value: S.f, unit: 'Hz', digits: 1, onInput: v => { S.f = v; S.ver++; } });
    const sN = slider({ label: 'Anzahl N', min: 2, max: 8, step: 1, value: S.N, onInput: v => { S.N = v; S.ver++; } });
    const sD = slider({ label: 'Abstand der Erreger d', min: 1, max: 10, step: 0.5, value: S.d, unit: 'cm', digits: 1, onInput: v => { S.d = v; S.ver++; } });
    const sPh = slider({ label: 'Phasenverschiebung Δφ (Nachbarn)', min: 0, max: 360, step: 15, value: S.dphi, unit: '°', digits: 0, onInput: v => { S.dphi = v; S.ver++; } });
    const sB = slider({ label: 'Breite b', min: 0.6, max: 14, step: 0.2, value: S.b, unit: 'cm', digits: 1, onInput: v => { S.b = v; S.ver++; } });
    const sG = slider({ label: 'Abstand der Öffnungen g', min: 2, max: 8, step: 0.5, value: S.g, unit: 'cm', digits: 1, onInput: v => { S.g = v; S.ver++; } });
    const sW = slider({ label: 'Breite jeder Öffnung', min: 0.6, max: 3, step: 0.2, value: S.w, unit: 'cm', digits: 1, onInput: v => { S.w = v; S.ver++; } });
    const sA = slider({ label: 'Einfallswinkel α', min: 0, max: 60, step: 1, value: S.alpha, unit: '°', digits: 0, onInput: v => { S.alpha = v; S.ver++; } });
    const segH = segmented({ value: 0.006, options: [{ value: 0.004, label: '4 mm' }, { value: 0.006, label: '6 mm' }, { value: 0.008, label: '8 mm' }], onChange: v => { S.h = v; S.ver++; } });
    gE.append(sMode, sF, sN, sD, sPh, sB, sG, sW, sA, el('div', { class: 'ctl' }, el('label', { style: 'grid-column:1/-1' }, 'Wassertiefe h'), el('div', { style: 'grid-column:1/-1' }, segH)));
    const gS = group('Stroboskop');
    const segS = segmented({ value: 'zeit', options: [{ value: 'aus', label: 'aus' }, { value: 'stand', label: 'Standbild' }, { value: 'zeit', label: 'Zeitlupe' }], onChange: v => { S.strobe = v; } });
    gS.append(el('div', { class: 'ctl' }, el('div', { style: 'grid-column:1/-1' }, segS)), el('p', { class: 'muted', style: 'font-size:12.5px;margin:8px 0 0' }, 'Ohne Stroboskop flimmert das Bild. Nur die Knotenlinien bleiben ruhig.'));
    // Wellenlänge (immer)
    const gL = group('Wellenlänge messen');
    const sK = slider({ label: 'Wellenlängen k zwischen den Punkten', min: 1, max: 15, step: 1, value: S.k, onInput: v => { S.k = v; } });
    const dDs = display('Abstand der Punkte'), dL = display('λ = Abstand / k');
    gL.append(sK, dDs, dL, el('div', { class: 'bar' }, button('λ übernehmen', () => takeLam(), 'btn small primary')));
    // versuchsabhängige Messung an Punkt 1
    const gX = group('Messung an Messpunkt 1');
    const xInfo = el('p', { class: 'muted', style: 'font-size:12.5px;margin:0 0 8px' });
    const dX1 = display(''), dX2 = display('');
    const xBar = el('div', { class: 'bar' });
    gX.append(xInfo, dX1, dX2, xBar);
    controls.append(gE, gS, gL, gX);
    function vis() {
      const m = S.mode;
      sN.style.display = m === 'erreger' || m === 'mehrfach' ? '' : 'none'; sD.style.display = sPh.style.display = m === 'erreger' ? '' : 'none';
      sB.style.display = m === 'spalt' || m === 'hindernis' ? '' : 'none'; sG.style.display = sW.style.display = m === 'mehrfach' ? '' : 'none';
      sA.style.display = m === 'reflexion' || m === 'brechung' ? '' : 'none';
      sB.querySelector('label').textContent = m === 'hindernis' ? 'Breite der Platte b' : 'Spaltbreite b';
      xBar.innerHTML = '';
      const btn = (t, f, p) => xBar.append(button(t, f, p ? 'btn small primary' : 'btn small'));
      if (m === 'erreger') { xInfo.textContent = S.N === 2 ? 'Punkt 1 auf eine Knotenlinie (ruhig) oder eine Linie größter Bewegung setzen. Gemessen werden die Wege s₁ und s₂ zu den Erregern.' : 'Punkt 1 weit rechts auf eine Hauptrichtung (starke Bewegung) setzen. Gemessen wird der Winkel zur Mittelsenkrechten der Erregerreihe.'; dX1.querySelector('span').textContent = S.N === 2 ? 'Wege s₁ / s₂' : 'Winkel α'; dX2.querySelector('span').textContent = S.N === 2 ? 'Δs = |s₁ − s₂|' : 'd·sin α'; if (S.N === 2) { btn('Punkt auf Knotenlinie', () => takeX('Knotenlinie'), true); btn('Punkt auf Verstärkung', () => takeX('Verstärkung')); } else btn('Hauptrichtung übernehmen', () => takeX('Hauptmaximum'), true); }
      else if (m === 'spalt') { xInfo.textContent = 'Punkt 1 weit hinter den Spalt auf die erste ruhige Richtung neben der Mitte setzen. Der Winkel wird von der Spaltmitte aus gemessen.'; dX1.querySelector('span').textContent = 'Winkel α'; dX2.querySelector('span').textContent = 'b·sin α'; btn('Erste Auslöschung übernehmen', () => takeX('1. Minimum'), true); }
      else if (m === 'mehrfach') { xInfo.textContent = 'Punkt 1 weit hinter den Spalt auf eine Nebenrichtung mit starker Bewegung setzen (Hauptmaximum 1. Ordnung).'; dX1.querySelector('span').textContent = 'Winkel α'; dX2.querySelector('span').textContent = 'g·sin α'; btn('Hauptmaximum übernehmen', () => takeX('Hauptmaximum'), true); }
      else if (m === 'reflexion') { xInfo.textContent = 'Punkt 1 auf die Laufrichtung der reflektierten Welle setzen (senkrecht zu ihren Wellenbergen). Gemessen wird der Winkel zum Lot.'; dX1.querySelector('span').textContent = 'Reflexionswinkel'; dX2.querySelector('span').textContent = 'Einfallswinkel'; btn('Reflexionswinkel übernehmen', () => takeX('Reflexion'), true); }
      else if (m === 'brechung') { xInfo.textContent = 'Punkt 1 in der flachen Zone auf die Laufrichtung der gebrochenen Welle setzen. λ in beiden Zonen über „λ übernehmen“ messen.'; dX1.querySelector('span').textContent = 'Brechungswinkel β'; dX2.querySelector('span').textContent = 'sin α / sin β'; btn('Brechungswinkel übernehmen', () => takeX('Brechung'), true); }
      else { xInfo.textContent = m === 'kreis' ? 'Bei der Kreiswelle wird nur λ gemessen.' : 'Hier gibt es keine Winkelmessung. Beobachtet, wie weit die Wellen in den Schattenraum eindringen, und messt λ.'; dX1.querySelector('span').textContent = '–'; dX2.querySelector('span').textContent = '–'; }
    }
    function presetMarkers() {
      const m = S.mode;
      if (m === 'erreger') { S.m1 = [12, 6]; S.m2 = [18, 6]; } else if (m === 'spalt' || m === 'mehrfach') { S.m1 = [20, 8]; S.m2 = [-22, 2]; }
      else if (m === 'reflexion') { S.m1 = [0, 10]; S.m2 = [-20, 0]; } else if (m === 'brechung') { S.m1 = [14, -6]; S.m2 = [18, -6]; } else { S.m1 = [0, 6]; S.m2 = [8, 6]; }
    }
    vis();

    // ---- Messwerte ----
    const rows = [], prot = [];
    const tbl = dataTable([
      { key: 'h', label: 'Tiefe in mm', fmt: v => fmt(v * 1000, 1) }, { key: 'f', label: 'f in Hz', digits: 1 }, { key: 'k', label: 'k', digits: 0 },
      { key: 's', label: 'Abstand in cm', digits: 2 }, { key: 'lam', label: 'λ in cm', digits: 2 }, { key: 'c', label: 'c in m/s', digits: 3 }
    ], { onDelete: i => { rows.splice(i, 1); redraw(); } });
    const tblP = dataTable([
      { key: 'vers', label: 'Versuch', fmt: v => v }, { key: 'was', label: 'Messung', fmt: v => v }, { key: 'mess', label: 'gemessen', fmt: v => v },
      { key: 'erg', label: 'Ergebnis', fmt: v => v }, { key: 'soll', label: 'Erwartung', fmt: v => v }
    ], { onDelete: i => { prot.splice(i, 1); tblP.render(prot); } });
    const figC = el('div', { class: 'fig' }), figL = el('div', { class: 'fig' });
    const chC = new Chart(figC, { xlabel: 'f in Hz', ylabel: 'c in m/s', ymin: 0 }), chL = new Chart(figL, { xlabel: '1/f in s', ylabel: 'λ in cm' });
    const resC = el('div', { class: 'result' });
    messwerte.append(
      el('div', { class: 'data' },
        el('div', { class: 'chartbox' }, el('h4', {}, 'Ausbreitungsgeschwindigkeit c über f'), figC, resC,
          csvTools(() => ({ meta: ['Wellenwanne – Wellenlängen'], columns: [{ key: 'h', label: 'Tiefe in m' }, { key: 'f', label: 'f in Hz' }, { key: 'k', label: 'k' }, { key: 's', label: 'Abstand in cm' }, { key: 'lam', label: 'lambda in cm' }, { key: 'c', label: 'c in m/s' }], rows }), 'wellenwanne_wellenlaengen')),
        el('div', { class: 'chartbox' }, el('h4', {}, 'λ über 1/f'), figL,
          el('p', { class: 'muted', style: 'font-size:13px;margin:8px 0 0' }, 'Wäre c konstant, lägen die Punkte auf einer Ursprungsgeraden. Grau: Theorie für 6 mm Tiefe.'))),
      el('div', { style: 'height:14px' }), el('h3', { style: 'margin-bottom:10px' }, 'Wellenlängen'), tbl,
      el('div', { style: 'height:18px' }), el('h3', { style: 'margin-bottom:10px' }, 'Protokoll: Gangunterschiede und Winkel'), tblP,
      el('div', { style: 'margin-top:8px' }, csvTools(() => ({ meta: ['Wellenwanne – Protokoll'], columns: [{ key: 'vers', label: 'Versuch' }, { key: 'was', label: 'Messung' }, { key: 'mess', label: 'gemessen' }, { key: 'erg', label: 'Ergebnis' }, { key: 'soll', label: 'Erwartung' }], rows: prot }), 'wellenwanne_protokoll')));
    const cols = { 4: '#86dcff', 6: '#f2ac74', 8: '#7fd6a0', 1.5: '#c7b6ff' };
    function redraw() {
      tbl.render(rows);
      const sC = [], sL = [];
      for (const hm of [4, 6, 8, 1.5]) { const r = rows.filter(q => Math.abs(q.h * 1000 - hm) < 0.01); if (!r.length) continue; const nm = hm === 1.5 ? 'flache Zone' : `${hm} mm`; sC.push({ name: nm, color: cols[hm], mode: 'dot', points: r.map(q => [q.f, q.c]) }); sL.push({ name: nm, color: cols[hm], mode: 'dot', points: r.map(q => [1 / q.f, q.lam]) }); }
      const th = [], thL = []; for (let f = 5; f <= 30; f += 0.5) { th.push([f, 2 * Math.PI * f / kOf(f, 0.006)]); thL.push([1 / f, 2 * Math.PI / kOf(f, 0.006) * 100]); }
      chC.set([{ points: th, color: '#4a545c', width: 1.2 }, ...sC]); chL.set([{ points: thL, color: '#4a545c', width: 1.2 }, ...sL]);
      resC.innerHTML = rows.length ? `<div><span>Mittelwert</span><br><b>c = ${fmt(rows.reduce((a, q) => a + q.c, 0) / rows.length, 3)} m/s</b> <span>(${rows.length} Messungen)</span></div>` : '<span>Grau: Theorie für 6 mm Tiefe. c ändert sich mit f etwas.</span>';
    }
    redraw(); tblP.render(prot);
    const dist = () => Math.hypot(S.m2[0] - S.m1[0], S.m2[1] - S.m1[1]);
    let lamZone = {};
    function takeLam() {
      const s = dist(); if (s < 0.3) { toast('Die Messpunkte liegen aufeinander.'); return; }
      const z1 = zoneOf(S.m1), z2 = zoneOf(S.m2); if (z1 !== z2) { toast('Beide Messpunkte müssen in derselben Zone liegen.'); return; }
      const lam = s / S.k, h = z1 === 2 ? H_SHALLOW : S.h; lamZone[z1] = lam;
      rows.push({ h, f: S.f, k: S.k, s, lam, c: lam / 100 * S.f }); redraw(); toast(`Übernommen${S.mode === 'brechung' ? (z1 === 2 ? ' (flache Zone)' : ' (tiefe Zone)') : ''}: λ = ${fmt(lam, 2)} cm, c = ${fmt(lam / 100 * S.f, 3)} m/s`);
    }
    const name = () => MODES.find(m => m.id === S.mode).name.replace(/ \(.*\)$/, '');
    function liveX() {
      ensure(); const lam = lamCm();
      if (S.mode === 'erreger' && S.N === 2) { const [a, b] = geo.src, s1 = Math.hypot(S.m1[0] - a[0], S.m1[1] - a[1]), s2 = Math.hypot(S.m1[0] - b[0], S.m1[1] - b[1]); return { v1: `${fmt(s1, 1)} / ${fmt(s2, 1)} cm`, v2: `${fmt(Math.abs(s1 - s2), 2)} cm`, s1, s2, ds: Math.abs(s1 - s2) }; }
      if (S.mode === 'erreger') { const a = angleAtM1(); return { v1: `${fmt(a, 1)}°`, v2: `${fmt(S.d * Math.sin(a * Math.PI / 180), 2)} cm`, a }; }
      if (S.mode === 'spalt') { const a = angleAtM1(); return { v1: `${fmt(a, 1)}°`, v2: `${fmt(S.b * Math.sin(a * Math.PI / 180), 2)} cm`, a }; }
      if (S.mode === 'mehrfach') { const a = angleAtM1(); return { v1: `${fmt(a, 1)}°`, v2: `${fmt(S.g * Math.sin(a * Math.PI / 180), 2)} cm`, a }; }
      if (S.mode === 'reflexion') { const a = angleAtM1(); return { v1: `${fmt(a, 1)}°`, v2: `${S.alpha}°`, a }; }
      if (S.mode === 'brechung') { const a = angleAtM1(); return { v1: `${fmt(a, 1)}°`, v2: a > 0.5 ? fmt(Math.sin(S.alpha * Math.PI / 180) / Math.sin(a * Math.PI / 180), 3) : '–', a }; }
      void lam; return { v1: '–', v2: '–' };
    }
    function takeX(kind) {
      const L = liveX(), lam = lamCm(), m = S.mode;
      if (m === 'erreger' && S.N === 2) { const q = L.ds / lam; prot.push({ vers: '2 Erreger', was: `Punkt auf ${kind}`, mess: `s₁ = ${fmt(L.s1, 1)} cm, s₂ = ${fmt(L.s2, 1)} cm`, erg: `Δs = ${fmt(L.ds, 2)} cm = ${fmt(q, 2)}·λ`, soll: kind === 'Knotenlinie' ? 'Δs = (2k+1)·λ/2' : 'Δs = k·λ' }); }
      else if (m === 'erreger') { const s = S.d * Math.sin(L.a * Math.PI / 180); prot.push({ vers: `${S.N} Erreger, d = ${fmt(S.d, 1)} cm, Δφ = ${S.dphi}°`, was: 'Hauptrichtung', mess: `α = ${fmt(L.a, 1)}°`, erg: `d·sin α = ${fmt(s, 2)} cm = ${fmt(s / lam, 2)}·λ`, soll: S.dphi ? `d·sin α = (k − ${fmt(S.dphi / 360, 2)})·λ` : 'd·sin α = k·λ' }); }
      else if (m === 'spalt') { const s = S.b * Math.sin(Math.abs(L.a) * Math.PI / 180); prot.push({ vers: `Spalt b = ${fmt(S.b, 1)} cm`, was: 'erste Auslöschung', mess: `α = ${fmt(Math.abs(L.a), 1)}°`, erg: `b·sin α = ${fmt(s / lam, 2)}·λ`, soll: 'b·sin α = λ' }); }
      else if (m === 'mehrfach') { const s = S.g * Math.sin(Math.abs(L.a) * Math.PI / 180); prot.push({ vers: `${S.N} Öffnungen, g = ${fmt(S.g, 1)} cm`, was: 'Hauptmaximum', mess: `α = ${fmt(Math.abs(L.a), 1)}°`, erg: `g·sin α = ${fmt(s / lam, 2)}·λ`, soll: 'g·sin α = k·λ' }); }
      else if (m === 'reflexion') prot.push({ vers: 'Reflexion', was: 'Reflexionswinkel', mess: `α' = ${fmt(L.a, 1)}°`, erg: `Einfallswinkel α = ${S.alpha}°`, soll: "α' = α" });
      else if (m === 'brechung') { const r = Math.sin(S.alpha * Math.PI / 180) / Math.sin(L.a * Math.PI / 180), lr = lamZone[1] && lamZone[2] ? lamZone[1] / lamZone[2] : null; prot.push({ vers: `Brechung, α = ${S.alpha}°`, was: 'Brechungswinkel', mess: `β = ${fmt(L.a, 1)}°`, erg: `sin α / sin β = ${fmt(r, 3)}`, soll: lr ? `λ₁/λ₂ = ${fmt(lr, 3)} (gemessen)` : 'λ₁/λ₂ (λ in beiden Zonen messen)' }); }
      tblP.render(prot); toast('Ins Protokoll übernommen.');
    }

    // ======================= Ansicht 2D =======================
    async function view2d(box, MM) {
      box.insertAdjacentHTML('beforeend', svgMarkup());
      const svg = box.querySelector('svg'), q = id => svg.querySelector('#' + id);
      const cv = q('wCv'), cx = cv.getContext('2d'), img = cx.createImageData(NX, NY);
      const PX = 15, X = x => 500 + x * PX, Y = y => 310 - y * PX, iX = sx => (sx - 500) / PX, iY = sy => (310 - sy) / PX;
      { let h = ''; for (let x = -30; x <= 30; x++) { const L = x % 5 === 0 ? 10 : 5; h += `<line x1="${X(x)}" y1="10" x2="${X(x)}" y2="${10 + L}"/>`; if (x % 10 === 0 && Math.abs(x) < 30) h += `<text x="${X(x) + 2}" y="30" stroke="none">${x}</text>`; } for (let y = -20; y <= 20; y++) { const L = y % 5 === 0 ? 10 : 5; h += `<line x1="50" y1="${Y(y)}" x2="${50 + L}" y2="${Y(y)}"/>`; } h += `<text x="900" y="30" stroke="none">cm</text>`; q('wRuler').innerHTML = h; }
      const ray = (ox, oy, ang, len, col, dash = '6 5') => `<line x1="${X(ox)}" y1="${Y(oy)}" x2="${X(ox + len * Math.cos(ang))}" y2="${Y(oy + len * Math.sin(ang))}" stroke="${col}" stroke-dasharray="${dash}" stroke-width="1.4"/>`;
      function drawObj() {
        let h = '';
        for (const [sx, sy] of geo.src || []) h += `<circle cx="${X(sx)}" cy="${Y(sy)}" r="${S.N > 5 ? 3.5 : 5}" fill="#1a1a1a" stroke="#ece6dc" stroke-width="1.5"/>`;
        if (['spalt', 'mehrfach', 'hindernis', 'kante', 'reflexion', 'brechung'].includes(S.mode)) h += `<rect x="${X(-29.5)}" y="${Y(19.5)}" width="${0.9 * PX}" height="${39 * PX}" fill="#555b60" stroke="#222"/>`;
        q('wObj').innerHTML = h;
        let m = ''; const lam = lamCm();
        if (S.mode === 'erreger' && S.N === 2) { const [s1, s2] = geo.src, r1 = Math.hypot(S.m1[0] - s1[0], S.m1[1] - s1[1]), r2 = Math.hypot(S.m1[0] - s2[0], S.m1[1] - s2[1]), ds = Math.abs(r1 - r2) / lam, fr = ds % 1;
          m += `<line x1="${X(s1[0])}" y1="${Y(s1[1])}" x2="${X(S.m1[0])}" y2="${Y(S.m1[1])}" stroke="#fff" stroke-dasharray="5 4"/><line x1="${X(s2[0])}" y1="${Y(s2[1])}" x2="${X(S.m1[0])}" y2="${Y(S.m1[1])}" stroke="#fff" stroke-dasharray="5 4"/>`;
          m += `<rect x="60" y="40" width="330" height="48" rx="6" fill="rgba(10,12,14,.85)"/><text x="72" y="60" fill="#ece6dc" font-size="13">s₁ = ${fmt(r1, 2)} cm   s₂ = ${fmt(r2, 2)} cm</text><text x="72" y="79" fill="#f2ac74" font-size="13">Δs = ${fmt(ds, 2)}·λ  ${Math.min(fr, 1 - fr) < 0.12 ? '→ Verstärkung' : Math.abs(fr - 0.5) < 0.12 ? '→ Auslöschung' : ''}</text>`; }
        if (S.mode === 'erreger' && S.N > 2) { for (let k = -3; k <= 3; k++) { const s = (k - S.dphi / 360) * lam / S.d; if (Math.abs(s) < 1) m += ray(XS, 0, Math.asin(s), 46, '#f2ac74'); }
          m += `<rect x="60" y="40" width="420" height="30" rx="6" fill="rgba(10,12,14,.85)"/><text x="72" y="60" fill="#f2ac74" font-size="13">Hauptrichtungen: d·sin α = (k − Δφ/360°)·λ</text>`; }
        if (geo.huy?.length) m += geo.huy.map(y => `<circle cx="${X(XB)}" cy="${Y(y)}" r="2.2" fill="#c7b6ff"/>`).join('');
        if (S.mode === 'spalt') { const s = lam / S.b; if (s < 1) { m += ray(XB, 0, Math.asin(s), 40, '#86dcff') + ray(XB, 0, -Math.asin(s), 40, '#86dcff'); } m += `<rect x="60" y="40" width="420" height="30" rx="6" fill="rgba(10,12,14,.85)"/><text x="72" y="60" fill="#86dcff" font-size="13">${s < 1 ? `erste Auslöschung bei sin α = λ/b → α = ${fmt(deg(Math.asin(s)), 1)}°` : 'b < λ: keine Auslöschung, fast eine Kreiswelle'}</text>`; }
        if (S.mode === 'mehrfach') { for (let k = -3; k <= 3; k++) { const s = k * lam / S.g; if (Math.abs(s) < 1) m += ray(XB, 0, Math.asin(s), 40, '#f2ac74'); } m += `<rect x="60" y="40" width="380" height="30" rx="6" fill="rgba(10,12,14,.85)"/><text x="72" y="60" fill="#f2ac74" font-size="13">Hauptmaxima: g·sin α = k·λ</text>`; }
        if (S.mode === 'hindernis') m += `<rect x="60" y="40" width="460" height="30" rx="6" fill="rgba(10,12,14,.85)"/><text x="72" y="60" fill="#c7b6ff" font-size="13">Elementarwellen von beiden Rändern füllen den Schatten</text>`;
        if (S.mode === 'kante') m += `<line x1="${X(XB)}" y1="${Y(0)}" x2="${X(29)}" y2="${Y(0)}" stroke="#ece6dc" stroke-dasharray="4 5"/><text x="${X(12)}" y="${Y(0) + 16}" fill="#ece6dc" font-size="12">Grenze des geometrischen Schattens</text>`;
        if (geo.wall) { const { Wx, nx, ny, dpx, dpy } = geo.wall, tx = ny, ty = -nx;
          m += `<line x1="${X(Wx - tx * 22)}" y1="${Y(-ty * 22)}" x2="${X(Wx + tx * 22)}" y2="${Y(ty * 22)}" stroke="#ece6dc"/><line x1="${X(Wx)}" y1="${Y(0)}" x2="${X(Wx + nx * 12)}" y2="${Y(ny * 12)}" stroke="#ece6dc" stroke-dasharray="4 4"/>`;
          m += `<line x1="${X(Wx - 14)}" y1="${Y(0)}" x2="${X(Wx - 1)}" y2="${Y(0)}" stroke="#86dcff" stroke-width="2.5" marker-end="url(#wA)"/><line x1="${X(Wx)}" y1="${Y(0)}" x2="${X(Wx + dpx * 13)}" y2="${Y(dpy * 13)}" stroke="#f2ac74" stroke-width="2.5" marker-end="url(#wA)"/>`; }
        if (geo.bound) { const { nx, ny, beta, kx, ky, k2 } = geo.bound, tx = -ny, ty = nx;
          m += `<line x1="${X(-tx * 22)}" y1="${Y(-ty * 22)}" x2="${X(tx * 22)}" y2="${Y(ty * 22)}" stroke="#ece6dc"/><line x1="${X(-nx * 12)}" y1="${Y(-ny * 12)}" x2="${X(nx * 12)}" y2="${Y(ny * 12)}" stroke="#ece6dc" stroke-dasharray="4 4"/>`;
          m += `<line x1="${X(-12)}" y1="${Y(0)}" x2="${X(-0.6)}" y2="${Y(0)}" stroke="#86dcff" stroke-width="2.5" marker-end="url(#wA)"/><line x1="${X(0)}" y1="${Y(0)}" x2="${X(kx / k2 * 12)}" y2="${Y(ky / k2 * 12)}" stroke="#f2ac74" stroke-width="2.5" marker-end="url(#wA)"/>`;
          m += `<rect x="60" y="40" width="300" height="30" rx="6" fill="rgba(10,12,14,.85)"/><text x="72" y="60" fill="#ece6dc" font-size="13">α = ${S.alpha}°   β = ${fmt(deg(beta), 1)}°</text>`; }
        m += `<text x="940" y="56" fill="#ece6dc" font-size="13" text-anchor="end">λ = ${fmt(lam, 2)} cm${S.mode === 'brechung' ? ` · flache Zone ${fmt(lamCm(H_SHALLOW), 2)} cm` : ''}</text>`;
        q('wModel').innerHTML = m;
      }
      // Winkelmesser: Bezugslinie und Strahl zu Punkt 1 (auch in der Realansicht)
      function drawTool() {
        const m = S.mode; let h = '';
        if (['erreger', 'spalt', 'mehrfach', 'reflexion', 'brechung'].includes(m) && !(m === 'erreger' && S.N === 2)) {
          const [ox, oy] = origin(); let ref;
          if (m === 'reflexion') ref = Math.atan2(geo.wall.ny, geo.wall.nx); else if (m === 'brechung') ref = Math.atan2(geo.bound.ny, geo.bound.nx); else ref = 0;
          const ang = Math.atan2(S.m1[1] - oy, S.m1[0] - ox), L = Math.hypot(S.m1[0] - ox, S.m1[1] - oy), r = 5;
          h += `<line x1="${X(ox)}" y1="${Y(oy)}" x2="${X(ox + 14 * Math.cos(ref))}" y2="${Y(oy + 14 * Math.sin(ref))}" stroke="#ffd27a" stroke-width="1.2" stroke-dasharray="2 3"/>`;
          h += `<line x1="${X(ox)}" y1="${Y(oy)}" x2="${X(S.m1[0])}" y2="${Y(S.m1[1])}" stroke="#7fd6a0" stroke-width="1.4"/>`;
          let a0 = ref, a1 = ang; let dlt = a1 - a0; while (dlt > Math.PI) dlt -= 2 * Math.PI; while (dlt < -Math.PI) dlt += 2 * Math.PI;
          h += `<path d="M${X(ox + r * Math.cos(a0))} ${Y(oy + r * Math.sin(a0))} A${r * PX} ${r * PX} 0 0 ${dlt > 0 ? 0 : 1} ${X(ox + r * Math.cos(a0 + dlt))} ${Y(oy + r * Math.sin(a0 + dlt))}" fill="none" stroke="#ffd27a" stroke-width="1.4"/>`;
          h += `<text x="${X(ox + (r + 1.5) * Math.cos(a0 + dlt / 2))}" y="${Y(oy + (r + 1.5) * Math.sin(a0 + dlt / 2))}" fill="#ffd27a" font-size="12">${fmt(Math.abs(angleAtM1()), 1)}°</text>`;
          void L;
        }
        q('wTool').innerHTML = h;
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
        if (ver !== S.ver) { ver = S.ver; ensure(); mver = ''; }
        updateH(); paint(img, model); cx.putImageData(img, 0, 0);
        const key = `${ver}|${S.m1}|${S.m2}|${model}`; if (key !== mver) { mver = key; drawObj(); drawTool(); }
        q('wModel').setAttribute('opacity', model ? 1 : 0);
        q('wM1').setAttribute('transform', `translate(${X(S.m1[0])} ${Y(S.m1[1])})`); q('wM2').setAttribute('transform', `translate(${X(S.m2[0])} ${Y(S.m2[1])})`);
        q('wML').setAttribute('x1', X(S.m1[0])); q('wML').setAttribute('y1', Y(S.m1[1])); q('wML').setAttribute('x2', X(S.m2[0])); q('wML').setAttribute('y2', Y(S.m2[1]));
        const L = liveX(); q('wDx').textContent = `1→2: ${fmt(dist(), 2)} cm${L.v1 !== '–' ? `  ·  Punkt 1: ${L.v1}` : ''}`;
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
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad · Wellenhöhe stark vergrößert · Gemessen wird im 2D-Aufbau</div>');
      const YT = 0.3, SX = NX / 2, SY = NY / 2;
      const al = new THREE.MeshStandardMaterial({ color: 0xb9bec2, metalness: 0.9, roughness: 0.35 });
      for (const [x, z] of [[-0.31, -0.21], [0.31, -0.21], [-0.31, 0.21], [0.31, 0.21]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, YT, 12), al); l.position.set(x, YT / 2, z); scene.add(l); }
      for (const [w, d, x, z] of [[0.64, 0.02, 0, -0.21], [0.64, 0.02, 0, 0.21], [0.02, 0.44, -0.31, 0], [0.02, 0.44, 0.31, 0]]) { const r = new THREE.Mesh(new THREE.BoxGeometry(w, 0.025, d), al); r.position.set(x, YT, z); r.castShadow = true; scene.add(r); }
      const glassB = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.004, 0.4), new THREE.MeshPhysicalMaterial({ color: 0xcfe6ee, transparent: true, opacity: 0.25, roughness: 0.05 })); glassB.position.y = YT - 0.008; scene.add(glassB);
      const wg = new THREE.PlaneGeometry(0.6, 0.4, SX - 1, SY - 1); wg.rotateX(-Math.PI / 2);
      const colors = new Float32Array(SX * SY * 3); wg.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const waterMat = new THREE.MeshPhysicalMaterial({ color: 0x5f9ab8, roughness: 0.06, metalness: 0.0, transparent: true, opacity: 0.78, clearcoat: 1, clearcoatRoughness: 0.05 });
      const heatMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
      const water = new THREE.Mesh(wg, waterMat); water.position.y = YT; scene.add(water);
      const pos = wg.attributes.position;
      const pc = document.createElement('canvas'); pc.width = NX; pc.height = NY; const pcx = pc.getContext('2d'); const pimg = pcx.createImageData(NX, NY);
      const pTex = new THREE.CanvasTexture(pc); pTex.colorSpace = THREE.SRGBColorSpace;
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), new THREE.MeshBasicMaterial({ map: pTex })); sheet.rotation.x = -Math.PI / 2; sheet.position.y = 0.002; scene.add(sheet);
      const lampH = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.06, 24), M.housing); lampH.position.set(0, 0.85, 0); scene.add(lampH);
      const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.85, 12), al); lampPole.position.set(-0.36, 0.425, -0.22); scene.add(lampPole);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.45, 12), al); arm.rotation.z = Math.PI / 2; arm.rotation.y = -0.55; arm.position.set(-0.18, 0.88, -0.11); scene.add(arm);
      const spot = new THREE.SpotLight(0xfff4e0, 6, 2, 0.6, 0.5, 1.5); spot.position.set(0, 0.82, 0); spot.target.position.set(0, 0, 0); scene.add(spot, spot.target);
      const objG = new THREE.Group(); scene.add(objG);
      const dark = new THREE.MeshStandardMaterial({ color: 0x3a3f44, roughness: 0.6 });
      const P = (x, y) => new THREE.Vector3(x / 100, YT, -y / 100);
      const wallSeg = (x, a, b) => { if (b - a < 0.05) return; const m = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.015, (b - a) / 100), dark); m.position.copy(P(x, (a + b) / 2)); objG.add(m); };
      function buildObj() {
        objG.clear();
        if (geo.src?.length) { const beam = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.012, Math.max(0.1, (geo.src.length - 1) * S.d / 100 + 0.06)), dark); beam.position.set(XS / 100, YT + 0.06, 0); objG.add(beam); for (const [sx, sy] of geo.src) { const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.06, 10), M.steel); pin.position.copy(P(sx, sy)).add(new THREE.Vector3(0, 0.03, 0)); objG.add(pin); } }
        else { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.01, 0.38), M.steel); bar.position.copy(P(-29, 0)); objG.add(bar); }
        if (geo.plate) wallSeg(XB, geo.plate[0][0], geo.plate[0][1]);
        else if (geo.open?.length) { const e = [-20, ...geo.open.flat().map(v => Math.max(-20, Math.min(20, v))), 20]; for (let i = 0; i < e.length; i += 2) wallSeg(XB, e[i], e[i + 1]); }
        if (geo.wall) { const { Wx, nx, ny } = geo.wall; const m = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.015, 0.44), dark); m.position.copy(P(Wx, 0)); m.rotation.y = Math.atan2(ny, nx); objG.add(m); }
        if (geo.bound) { const { nx, ny } = geo.bound; const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.004, 0.6), new THREE.MeshPhysicalMaterial({ color: 0xd8f0ff, transparent: true, opacity: 0.35 })); m.position.set(nx * 0.2, YT - 0.004, -ny * 0.2); m.rotation.y = Math.atan2(ny, nx); objG.add(m); }
      }
      let ver = -1, wasModel = null;
      const off = lab.onFrame(() => {
        const model = MM.model;
        if (ver !== S.ver) { ver = S.ver; ensure(); buildObj(); }
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

    const host = viewHost(stage, { id: 'wellenwanne', views: { '2d': view2d, '3d': view3d }, initial: '2d', modelInfo: 'Höhenbild, Gangunterschied, Richtungen der Maxima' });

    let raf = 0, last = performance.now(), slow = 0;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      if (S.strobe !== 'stand') S.phase += 2 * Math.PI * 0.6 * dt;
      slow += dt; if (slow > 0.15) { slow = 0; const s = dist(); dDs.set(`${fmt(s, 2)} cm`); dL.set(`${fmt(s / S.k, 2)} cm`); const L = liveX(); dX1.set(L.v1); dX2.set(L.v2); }
    }
    raf = requestAnimationFrame(loop);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); chC.destroy(); chL.destroy(); } };
  }
};
