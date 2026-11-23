// ============================================================================
//  Schlüsselexperiment: Fadenstrahlrohr – Bestimmung der spezifischen Ladung e/m
//  3D-Aufbau (Three.js) nach üblichem Schulgerät:
//   Glaskolben Ø 160 mm (Gasfüllung Neon oder Wasserstoff), Elektronenkanone mit
//   Wehneltzylinder, Messmarken im Abstand 20 mm (Durchmesser 20 … 120 mm),
//   Helmholtz-Spulenpaar R = 150 mm, N = 124, Röhren- und Spulennetzgerät.
//  Bahn: numerische Integration der Lorentzkraft (inkl. Schraubenbahn bei Drehung).
// ============================================================================
import { viewHost } from '../js/lib/views.js';

const E = 1.602176634e-19, ME = 9.1093837e-31, MU0 = 4e-7 * Math.PI;
const N_COIL = 124, R_COIL = 0.150;
const K_HH = Math.pow(0.8, 1.5) * MU0 * N_COIL / R_COIL;  // ≈ 0,743 mT/A (Herstellerangabe 0,75 mT/A)
const K_REAL = K_HH * (1 + (Math.random() * 0.02 - 0.01)); // Exemplarstreuung ±1 %
const B_EARTH_Z = 1.6e-5 * (Math.random() < 0.5 ? 1 : -1) * (0.6 + 0.4 * Math.random()); // horizontale Erdfeldkomponente längs Spulenachse
const YC = 0.205;          // Höhe Kolbenmitte
const R_GLASS = 0.080;
const GUN = { x: 0.0, y: -0.062 };  // Austrittspunkt (lokal), Strahl startet in +x
const MARKS = [0.02, 0.04, 0.06, 0.08, 0.10, 0.12];
const GAS = { neon: { name: 'Neon', color: 0xff7f45 }, h2: { name: 'Wasserstoff', color: 0x7fb4ff } };

// Feldlinien des Helmholtz-Paares in der Ebene x = 0 (Biot-Savart, Richtung für positiven Strom: +z innen)
const FIELD_LINES = (() => {
  const loops = [-0.075, 0.075], R = R_COIL, NSEG = 72;
  const B = (y, z) => {
    let By = 0, Bz = 0;
    for (const z0 of loops) for (let k = 0; k < NSEG; k++) {
      const f = (k + 0.5) / NSEG * 2 * Math.PI, px = R * Math.cos(f), py = R * Math.sin(f);
      const dlx = -Math.sin(f), dly = Math.cos(f);              // dl·(1/R dφ) weggelassen, nur Richtung
      const rx = -px, ry = y - py, rz = z - z0, r3 = Math.pow(rx * rx + ry * ry + rz * rz, 1.5);
      // dl × r = (dly·rz − 0·ry, 0·rx − dlx·rz, dlx·ry − dly·rx)
      By += (-dlx * rz) / r3; Bz += (dlx * ry - dly * rx) / r3;
    }
    return [By, Bz];
  };
  const traceDir = (y, z, sgn) => {
    const pts = []; const h = 0.003;
    for (let i = 0; i < 320; i++) {
      pts.push([y, z]);
      let [by, bz] = B(y, z); let l = Math.hypot(by, bz) || 1; const my = y + sgn * h / 2 * by / l, mz = z + sgn * h / 2 * bz / l;
      [by, bz] = B(my, mz); l = Math.hypot(by, bz) || 1; y += sgn * h * by / l; z += sgn * h * bz / l;
      if (Math.hypot(y, z) > 0.4) break;
      if (i > 40 && Math.hypot(y - pts[0][0], z - pts[0][1]) < h) break;
    }
    return pts;
  };
  const lines = [];
  for (const y0 of [0.015, 0.045, 0.075, 0.105, 0.13, -0.015, -0.045, -0.075, -0.105, -0.13]) {
    const fw = traceDir(y0, 0, 1), bw = traceDir(y0, 0, -1);
    lines.push([...bw.reverse(), ...fw.slice(1)]);
  }
  return lines;
})();

function windingTexture(THREE) {
  const c = document.createElement('canvas'); c.width = 8; c.height = 256; const g = c.getContext('2d');
  for (let y = 0; y < 256; y++) { const v = 0.55 + 0.45 * Math.abs(Math.sin(y / 256 * Math.PI * 16)); g.fillStyle = `rgb(${190 * v | 0},${100 * v | 0},${48 * v | 0})`; g.fillRect(0, y, 8, 1); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

export default {
  intro: 'Elektronen werden in einer Elektronenkanone beschleunigt und im homogenen Magnetfeld eines Helmholtz-Spulenpaares auf eine Kreisbahn gezwungen. Das Restgas macht die Bahn als leuchtenden Faden sichtbar. Aus Beschleunigungsspannung, Spulenstrom und Bahndurchmesser folgt die spezifische Ladung <i>e/m</i>.',
  docs: {
    durchfuehrung: `
<h3>Aufbau</h3>
<p>Der kugelförmige Glaskolben (Ø 160 mm) enthält ein Gas unter sehr geringem Druck. Die Elektronenkanone besteht aus indirekt geheizter Glühkathode, Wehneltzylinder (bündelt den Strahl) und Anode mit Loch. Der Kolben sitzt mittig zwischen zwei Helmholtz-Spulen (mittlerer Radius R = 150 mm, Abstand 150 mm, je N = 124 Windungen), die in Reihe an ein Gleichstromnetzgerät angeschlossen sind. Oberhalb der Kanone sind Messmarken angebracht, deren Enden aufleuchten, wenn der Strahl sie trifft – sie zeigen Bahndurchmesser von 20 mm bis 120 mm an.</p>
<h3>Durchführung</h3>
<ol>
<li>Raum abdunkeln. Heizung (6,3 V) einschalten und ca. eine Minute warten, bis die Kathode glüht (hier verkürzt).</li>
<li>Anodenspannung auf 200 … 300 V hochregeln. Wehneltspannung so einstellen, dass ein scharfer, schmaler Strahl entsteht.</li>
<li>Spulenstrom langsam erhöhen: Der Strahl wird zur Kreisbahn gebogen. Bei falscher Polung wird er nach unten abgelenkt – dann umpolen.</li>
<li>Spulenstrom so einstellen, dass der Strahl genau eine Messmarke trifft (ihr Ende leuchtet). <b>Messwert übernehmen</b>.</li>
<li>Für mehrere Durchmesser und Anodenspannungen wiederholen (z. B. 5 Spannungen × 3 Durchmesser).</li>
<li>Zusatz: Röhre um die senkrechte Achse drehen – es entsteht eine Schraubenbahn.</li>
</ol>
<div class="callout">Sicherheit: Anodenspannung bis 300 V – Berührungsschutz beachten (Sicherheitsleitungen). Glaskolben (Implosionsgefahr) und Spulen im Betrieb nicht berühren, Spulenstrom max. 5 A kurzzeitig, Dauerbetrieb ≤ 3 A.</div>`,
    theorie: `
<h3>Beschleunigung</h3>
<p>Im elektrischen Feld zwischen Kathode und Anode gewinnt jedes Elektron die Energie <i>e·U<sub>A</sub></i>:</p>
<span class="formula tex">e\\, U_A = \\tfrac{1}{2}\\, m\\, v^2 \\quad\\Rightarrow\\quad v = \\sqrt{\\frac{2\\, e\\, U_A}{m}}</span>
<h3>Kreisbahn im Magnetfeld</h3>
<p>Die Lorentzkraft steht senkrecht auf Geschwindigkeit und Feld; sie verrichtet keine Arbeit und wirkt als Zentripetalkraft:</p>
<span class="formula tex">e\\, v\\, B = \\frac{m\\, v^2}{r} \\quad\\Rightarrow\\quad \\frac{e}{m} = \\frac{v}{B\\, r} \\quad\\Rightarrow\\quad \\frac{e}{m} = \\frac{2\\, U_A}{B^2 r^2}</span>
<h3>Magnetfeld des Helmholtz-Spulenpaares</h3>
<span class="formula tex">B = \\left(\\frac{4}{5}\\right)^{3/2} \\frac{\\mu_0\\, N\\, I}{R} \\approx 0{,}743\\,\\frac{\\text{mT}}{\\text{A}} \\cdot I \\qquad (N = 124,\\ R = 0{,}150\\,\\text{m})</span>
<h3>Auswertung als Gerade</h3>
<p>Trägt man <i>2·U<sub>A</sub></i> über <i>(B·r)²</i> auf, liegen die Messpunkte auf einer Ursprungsgeraden mit der Steigung <span class="tex">\\frac{e}{m}</span>. Literaturwert: <span class="tex">\\frac{e}{m} = 1{,}759 \\cdot 10^{11}\\,\\frac{\\text{C}}{\\text{kg}}</span>. Mit <i>e</i> aus dem Millikan-Versuch folgt die Elektronenmasse.</p>
<h3>Schraubenbahn</h3>
<p>Hat die Geschwindigkeit eine Komponente parallel zum Feld, bleibt diese unverändert, während die senkrechte Komponente eine Kreisbewegung ausführt – zusammen ergibt sich eine Schraubenlinie mit der Ganghöhe <i>h = 2π·m·v<sub>∥</sub>/(e·B)</i>.</p>
<h3>Modellgrenzen und Fehlerquellen</h3>
<ul><li>Die Spulenkonstante des Exemplars weicht um bis zu ±1 % vom Rechenwert ab, außerdem überlagert sich die horizontale Komponente des Erdmagnetfelds (einige µT).</li>
<li>Die Elektronen verlassen die Anode mit leicht geringerer Energie (Kontaktspannung, Raumladung) – reale Messungen liefern oft etwas zu große oder zu kleine Werte.</li>
<li>Ablesefehler (Parallaxe) entfallen hier, da die Messmarken direkt aufleuchten. Das Feld wird als homogen angenommen.</li></ul><h3>Was die Modellansicht zeigt</h3><ul><li><b>Feldlinien:</b> Das Feld des Helmholtz-Paares ist nach Biot-Savart berechnet. Im Bereich des Kolbens verlaufen die Linien fast parallel – das Feld ist nahezu homogen.</li><li><b>Einzelne Elektronen</b> laufen (stark verlangsamt) auf der Bahn. Der Geschwindigkeitspfeil v liegt tangential, die Lorentzkraft F<sub>L</sub> steht immer senkrecht dazu und zeigt zur Kreismitte.</li><li><b>Richtung:</b> Für Elektronen gilt die Drei-Finger-Regel der linken Hand: Daumen in Bewegungsrichtung, Zeigefinger in Feldrichtung, Mittelfinger zeigt die Kraft.</li><li>Die Leuchtspur selbst ist real: Sie entsteht, weil Elektronen Gasatome anregen.</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Kolbendurchmesser</td><td>160 mm</td></tr>
<tr><td>Gasfüllung</td><td>Neon bzw. Wasserstoff, ~10⁻⁵ hPa</td></tr>
<tr><td>Heizspannung</td><td>6,3 V ~</td></tr>
<tr><td>Anodenspannung</td><td>200 … 300 V (hier 0 … 300 V)</td></tr>
<tr><td>Wehneltspannung</td><td>0 … −50 V</td></tr>
<tr><td>Anodenstrom</td><td>&lt; 0,3 mA</td></tr>
<tr><td>Messmarken</td><td>Ø 20 … 120 mm, Abstand 20 mm</td></tr>
<tr><td>Helmholtz-Spulen</td><td>R = 150 mm, N = 124, 1,2 Ω</td></tr>
<tr><td>Spulenkonstante</td><td>≈ 0,74 mT/A</td></tr>
<tr><td>Spulenstrom</td><td>Dauer ≤ 3 A (max. 5 A)</td></tr>
</tbody></table>
<p class="muted" style="margin-top:12px">Gerätedaten nach Herstellerangaben gängiger Schulgeräte (Fadenstrahlröhre mit Helmholtz-Spulenpaar 300 mm). LEIFIphysik rechnet mit N = 130 und R = 15,0 cm; Prinzip und Auswertung sind identisch.</p>`,
    abi: `
<details class="q"><summary>Leite die Gleichung e/m = 2U/(B²r²) her. <span class="op">AFB II</span></summary><p>Energieerhaltung: e·U = ½·m·v². Lorentzkraft als Zentripetalkraft: e·v·B = m·v²/r ⇒ v = (e/m)·B·r. Einsetzen in v² = 2(e/m)·U ergibt (e/m)²·B²·r² = 2(e/m)·U ⇒ e/m = 2U/(B²r²).</p></details>
<details class="q"><summary>Bei U = 200 V und I = 1,53 A beträgt der Bahnradius 4,0 cm (N = 130, R = 15 cm). Berechne v, B und e/m. <span class="op">AFB II</span></summary><p>v = √(2·1,76·10¹¹ C/kg·200 V) ≈ 8,4·10⁶ m/s (2,8 % von c, also nichtrelativistisch). B = (4/5)^{3/2}·μ₀·N·I/R ≈ 1,2 mT. e/m = 2U/(B²r²) ≈ 1,76·10¹¹ C/kg.</p></details>
<details class="q"><summary>Begründe, warum die Gewichtskraft auf die Elektronen vernachlässigt werden kann. <span class="op">AFB I</span></summary><p>F<sub>G</sub> = m·g ≈ 9·10⁻³⁰ N, die Lorentzkraft ist mit ≈ 1,6·10⁻¹⁵ N rund 10¹⁴-mal größer.</p></details>
<details class="q"><summary>Wie ändert sich der Bahnradius, wenn U verdoppelt bzw. I verdoppelt wird? <span class="op">AFB II</span></summary><p>r = √(2U·m/e)/B: Bei doppelter Spannung wird r um den Faktor √2 größer, bei doppeltem Spulenstrom (doppeltes B) halbiert sich r.</p></details>
<details class="q"><summary>Erkläre die Entstehung der Leuchtspur und die Funktion des Wehneltzylinders. <span class="op">AFB I–II</span></summary><p>Elektronen stoßen mit Gasatomen und regen sie an; bei der Rückkehr in den Grundzustand senden diese Licht aus. Der negativ geladene Wehneltzylinder drängt die Elektronen zur Achse und bündelt den Strahl; zu negative Spannung sperrt ihn.</p></details>
<details class="q"><summary>Die Röhre wird gedreht und es entsteht eine Schraubenbahn. Erkläre. <span class="op">AFB III</span></summary><p>Die Geschwindigkeit hat nun eine Komponente parallel zu B, auf die keine Lorentzkraft wirkt; sie bleibt konstant. Die senkrechte Komponente erzeugt eine Kreisbewegung. Überlagert entsteht eine Schraubenlinie.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, selectBox, check, button, fmt, dataTable, toast, display, segmented } = ui;

    // ---------------- Zustand und Physik (unabhängig von der Ansicht) ----------------
    const S = { heat: false, warm: 0, UA: 0, UW: 0, IS: 0, pol: 1, rot: 0, gas: 'neon', room: 0.3, dirty: true,
      hitMark: null, hitD: null, IA: 0, pts: [], inten: 0, width: 0.001, end: 'glas', ver: 0 };
    const Bfield = () => S.pol * K_REAL * S.IS + B_EARTH_Z;
    const Bvec = () => { const B = Bfield(), a = S.rot * Math.PI / 180; return [-B * Math.sin(a), 0, B * Math.cos(a)]; }; // im Röhren-System

    function trace() {
      const [Bx, , Bz] = Bvec();
      const qm = -E / ME, v0 = Math.sqrt(2 * E * Math.max(S.UA, 0.01) / ME);
      let p = [GUN.x + 0.001, GUN.y, 0], v = [v0, 0, 0];
      const pts = [p.slice()]; const ds = 0.0007, dt = ds / v0; let len = 0, hit = null, end = 'glas';
      const accel = vv => [qm * (vv[1] * Bz), qm * (vv[2] * Bx - vv[0] * Bz), qm * (-vv[1] * Bx)];
      for (let i = 0; i < 1600; i++) {
        const k1v = accel(v), k1p = v;
        const v2 = v.map((c, j) => c + dt / 2 * k1v[j]); const k2v = accel(v2), k2p = v2;
        const v3 = v.map((c, j) => c + dt / 2 * k2v[j]); const k3v = accel(v3), k3p = v3;
        const v4 = v.map((c, j) => c + dt * k3v[j]); const k4v = accel(v4), k4p = v4;
        const np = p.map((c, j) => c + dt / 6 * (k1p[j] + 2 * k2p[j] + 2 * k3p[j] + k4p[j]));
        v = v.map((c, j) => c + dt / 6 * (k1v[j] + 2 * k2v[j] + 2 * k3v[j] + k4v[j]));
        if (p[0] > 0 && np[0] <= 0 && np[1] > GUN.y + 0.008 && Math.abs(np[2]) < 0.004 && hit == null) {
          const f = p[0] / (p[0] - np[0]); const yy = p[1] + f * (np[1] - p[1]); hit = yy - GUN.y;
          pts.push([0, yy, p[2] + f * (np[2] - p[2])]);
        }
        p = np; len += ds; pts.push(p.slice());
        if (Math.hypot(p[0], p[1], p[2]) > R_GLASS - 0.0015) { end = 'glas'; break; }
        if (len > 0.03 && p[0] < GUN.x - 0.001 && p[0] > GUN.x - 0.036 && Math.abs(p[1] - GUN.y) < 0.0065 && Math.abs(p[2]) < 0.0065) { end = 'kanone'; break; }
        if (len > 1.2) break;
      }
      return { pts, hit, end };
    }
    function rebuild() {
      S.dirty = false;
      const uaF = Math.max(0, Math.min(1, (S.UA - 12) / 260));
      const k = Math.abs(S.UW) / (0.16 * S.UA + 1);
      const wF = Math.max(0, 1 - k ** 4);
      S.inten = S.warm * Math.pow(uaF, 1.3) * wF;
      S.IA = 0.28e-3 * S.inten;
      S.width = 0.0006 + 0.0028 * Math.min(1, Math.abs(k - 0.4) / 0.4);
      const r = trace(); S.pts = r.pts; S.end = r.end; S.hitD = r.hit; S.hitMark = null;
      if (r.hit && S.inten > 0.05) MARKS.forEach((d, i) => { if (Math.abs(r.hit - d) < 0.0012) S.hitMark = i; });
      S.ver++;
    }

    // ---------------- Bedienfeld ----------------
    const gT = group('Röhren-Netzgerät', { led: true });
    const cHeat = check({ label: 'Heizung 6,3 V ~ einschalten', onChange: v => { S.heat = v; gT.led(v); S.dirty = true; } });
    const sUA = slider({ label: 'Anodenspannung U_A', min: 0, max: 300, step: 1, value: 0, unit: 'V', onInput: v => { S.UA = v; S.dirty = true; } });
    const sUW = slider({ label: 'Wehneltspannung U_W', min: -50, max: 0, step: 0.5, value: 0, unit: 'V', digits: 1, onInput: v => { S.UW = v; S.dirty = true; } });
    gT.append(cHeat, sUA, sUW);
    const gC = group('Spulen-Netzgerät (Helmholtz-Spulen in Reihe)', { led: true });
    const sIS = slider({ label: 'Spulenstrom I', min: 0, max: 3, step: 0.005, value: 0, unit: 'A', digits: 3, onInput: v => { S.IS = v; S.dirty = true; gC.led(v > 0); } });
    const fine = el('div', { class: 'bar' }, ...[-0.05, -0.005, 0.005, 0.05].map(d => button((d > 0 ? '+' : '−') + fmt(Math.abs(d), 3), () => { sIS.set(Math.max(0, Math.min(3, +(S.IS + d).toFixed(3))), true); })),
      button('Umpolen', () => { S.pol *= -1; S.dirty = true; toast(S.pol > 0 ? 'Polung: normal' : 'Polung: umgekehrt – das Feld zeigt jetzt in die andere Richtung.'); }));
    gC.append(sIS, fine);
    const gR = group('Röhre und Raum');
    const sRot = slider({ label: 'Drehung der Röhre', min: 0, max: 60, step: 1, value: 0, unit: '°', onInput: v => { S.rot = v; S.dirty = true; } });
    const sGas = selectBox({ label: 'Gasfüllung', value: 'neon', options: [{ value: 'neon', label: 'Neon (orange Leuchtspur)' }, { value: 'h2', label: 'Wasserstoff (blaue Leuchtspur)' }], onChange: v => { S.gas = v; S.ver++; } });
    const sRoom = slider({ label: 'Raumlicht', min: 0, max: 100, step: 5, value: 30, unit: '%', onInput: v => { S.room = v / 100; } });
    gR.append(sRot, sGas, sRoom);
    const gM = group('Messung');
    const dUA = display('U_A', { red: true }), dIS = display('I (Spulen)', { red: true }), dB = display('B (Spulenmitte)'), dMark = display('Leuchtende Marke');
    const bTake = button('Messwert übernehmen', () => take(), 'btn small primary');
    gM.append(dUA, dIS, dB, dMark, el('div', { class: 'bar' }, bTake));
    controls.append(gT, gC, gR, gM);

    // ---------------- Messwerte ----------------
    const rows = [];
    const tbl = dataTable([
      { key: 'UA', label: 'U_A in V', digits: 0 }, { key: 'I', label: 'I in A', digits: 3 }, { key: 'd', label: 'd in cm', fmt: v => fmt(v * 100, 0) },
      { key: 'r', label: 'r in cm', fmt: v => fmt(v * 100, 1) }, { key: 'B', label: 'B in mT', fmt: v => fmt(v * 1e3, 3) },
      { key: 'em', label: 'e/m in 10¹¹ C/kg', fmt: v => fmt(v / 1e11, 3) }
    ], { onDelete: i => { rows.splice(i, 1); redraw(); } });
    const fig = el('div', { class: 'fig' }); const res = el('div', { class: 'result' });
    let view = 'lin';
    const ch = new Chart(fig, { xlabel: '(B·r)² in 10⁻⁹ T²m²', ylabel: '2·U_A in V' });
    const segV = segmented({ value: 'lin', options: [{ value: 'lin', label: '2U über (Br)²' }, { value: 'rI', label: 'r über 1/I' }], onChange: v => { view = v; redraw(); } });
    messwerte.append(el('div', { class: 'data' },
      el('div', { class: 'chartbox' }, el('h4', {}, el('span', {}, 'Auswertung'), segV), fig, res,
        csvTools(() => ({ meta: ['Fadenstrahlrohr – Bestimmung von e/m', `Helmholtz-Spulen: N = ${N_COIL}, R = ${R_COIL} m, B = ${(K_HH * 1e3).toFixed(4)} mT/A * I`], columns: [{ key: 'UA', label: 'U_A in V' }, { key: 'I', label: 'I in A' }, { key: 'd', label: 'd in m' }, { key: 'r', label: 'r in m' }, { key: 'B', label: 'B in T' }, { key: 'em', label: 'e/m in C/kg' }], rows }), 'fadenstrahlrohr_messreihe')),
      el('div', {}, el('h3', { style: 'margin-bottom:10px' }, 'Messtabelle'), tbl,
        el('p', { class: 'muted', style: 'font-size:14px;margin-top:12px' }, `B wird aus dem Spulenstrom berechnet: B = (4/5)^{3/2}·μ₀·N·I/R = ${fmt(K_HH * 1e3, 4)} mT/A · I. Literaturwert e/m = 1,759·10¹¹ C/kg.`))));
    function redraw() {
      tbl.render(rows);
      if (view === 'lin') {
        ch.o.xlabel = '(B·r)² in 10⁻⁹ T²m²'; ch.o.ylabel = '2·U_A in V';
        const pts = rows.map(r => [(r.B * r.r) ** 2 * 1e9, 2 * r.UA]);
        const f = pts.length >= 2 ? fit.propFit(pts.map(p => p[0]), pts.map(p => p[1])) : null;
        ch.set([{ points: pts, color: '#f2ac74', mode: 'dot', name: 'Messwerte' }], f ? [{ f: f.f, color: '#ab93ff', name: 'Ursprungsgerade' }] : []);
        if (f) {
          const em = f.a * 1e9, me = E / em, mean = fit.mean(rows.map(r => r.em));
          res.innerHTML = `<div><span>Steigung = e/m</span><br><b>${fmt(em / 1e11, 3)}·10¹¹ C/kg</b></div><div><span>Abweichung vom Literaturwert</span><br><b>${fmt((em / 1.75882e11 - 1) * 100, 1)} %</b></div><div><span>Elektronenmasse (mit e)</span><br><b>${fmt(me / 1e-31, 2)}·10⁻³¹ kg</b></div><div><span>Mittelwert der Einzelwerte</span><br><b>${fmt(mean / 1e11, 3)}·10¹¹ C/kg</b></div>`;
        } else res.innerHTML = '<span>Mindestens zwei Messwerte für die Ausgleichsgerade.</span>';
      } else {
        ch.o.xlabel = '1/I in 1/A'; ch.o.ylabel = 'r in cm';
        const us = [...new Set(rows.map(r => r.UA))];
        const palette = ['#86dcff', '#f2ac74', '#ab93ff', '#7fd6a0', '#ff8a7a', '#e5d36b'];
        ch.set(us.map((u, i) => ({ name: `U = ${u} V`, color: palette[i % 6], mode: 'dot', points: rows.filter(r => r.UA === u).map(r => [1 / r.I, r.r * 100]) })));
        res.innerHTML = '<span>Bei fester Spannung gilt r ~ 1/I: Messpunkte einer Spannung liegen auf einer Ursprungsgeraden.</span>';
      }
    }
    redraw();
    function take() {
      if (S.warm < 0.6 || S.IA < 1e-6) { toast('Kein sichtbarer Strahl – Heizung, Anoden- und Wehneltspannung prüfen.'); return; }
      if (S.rot > 2) { toast('Für die e/m-Bestimmung die Röhre zurückdrehen (0°), sonst entsteht eine Schraubenbahn.'); return; }
      if (S.hitMark == null) { toast('Der Strahl trifft keine Messmarke genau. Spulenstrom fein nachregeln, bis ein Markenende aufleuchtet.'); return; }
      const UA = Math.round(S.UA), I = +S.IS.toFixed(3), d = MARKS[S.hitMark], r = d / 2, B = K_HH * I;
      rows.push({ UA, I, d, r, B, em: 2 * UA / (B * B * r * r) }); redraw(); toast(`Übernommen: U = ${UA} V, I = ${fmt(I, 3)} A, d = ${d * 100} cm`);
    }

    // ---------------- Modell: Elektronen auf der Bahn ----------------
    // Gemeinsame Hilfe für beide Ansichten: Position, Geschwindigkeits- und Kraftrichtung
    function electronAt(s) { // s = Bahnlänge in m
      const n = S.pts.length; if (n < 3) return null;
      const i = Math.min(n - 2, Math.floor(s / 0.0007)); const a = S.pts[i], b = S.pts[i + 1];
      const v = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const L = Math.hypot(...v) || 1; v[0] /= L; v[1] /= L; v[2] /= L;
      const [Bx, , Bz] = Bvec(); // F = q·(v × B), q < 0
      let F = [-(v[1] * Bz), -(v[2] * Bx - v[0] * Bz), -(-v[1] * Bx)]; const FL = Math.hypot(...F) || 1; F = F.map(c => c / FL);
      return { p: a, v, F, Fmag: FL };
    }
    const pathLen = () => Math.max(0, (S.pts.length - 1) * 0.0007);

    // ---------------- Ansicht 3D ----------------
    async function view3d(box, MM) {
      const { createLab, mats, cable, powerSupply, socket, arrow, label, glassMaterial, glowPool } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [0.5, 0.36, 0.7], target: [0, 0.19, 0], table: [5, 2.6], bloom: [1.05, 0.5, 0.75], room: 0.3, minDist: 0.2, maxDist: 2.6, fov: 36 });
      const { THREE, scene } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', `<div class="hint">Drehen: ziehen · Zoom: Mausrad · Raum abdunkeln für eine gut sichtbare Leuchtspur</div>
        <div class="hud hud3d"><button class="btn small" data-v="total">Gesamt</button><button class="btn small" data-v="front">Frontal</button><button class="btn small" data-v="top">Von oben</button></div>`);
      // Grundplatte & Spulen
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.3), new THREE.MeshStandardMaterial({ color: 0x1d2024, roughness: 0.6 }));
      board.position.y = 0.015; board.castShadow = board.receiveShadow = true; scene.add(board);
      const wTex = windingTexture(THREE); wTex.repeat.set(1, 12);
      const copper = new THREE.MeshStandardMaterial({ color: 0xffffff, map: wTex, bumpMap: wTex, bumpScale: 0.6, metalness: 0.85, roughness: 0.38 });
      const frameM = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.55 });
      const prof = [[0.1435, -0.011], [0.1555, -0.011], [0.1555, 0.011], [0.1435, 0.011], [0.1435, -0.011]].map(p => new THREE.Vector2(p[0], p[1]));
      const coilGeo = new THREE.LatheGeometry(prof, 160);
      const coilSockets = [];
      for (const z of [-0.075, 0.075]) {
        const g = new THREE.Group();
        const ring = new THREE.Mesh(coilGeo, copper); ring.rotation.x = Math.PI / 2; ring.castShadow = true; g.add(ring);
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.1605, 0.1605, 0.028, 160, 1, true), frameM); band.rotation.x = Math.PI / 2; g.add(band);
        for (const s of [-1, 1]) { const rim = new THREE.Mesh(new THREE.TorusGeometry(0.152, 0.0025, 8, 160), frameM); rim.position.z = s * 0.0135; g.add(rim); }
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.05, 0.04), frameM); foot.position.set(0, -0.165, 0); foot.castShadow = true; g.add(foot);
        const sA = socket(THREE, 'red'), sB = socket(THREE, 'blue');
        sA.rotation.y = Math.PI / 2; sB.rotation.y = Math.PI / 2; sA.position.set(0.0565, -0.165, -0.009); sB.position.set(0.0565, -0.165, 0.009); g.add(sA, sB);
        g.position.set(0, YC, z); scene.add(g); coilSockets.push(sA, sB);
      }
      // Röhre
      const sockBox = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.035, 0.115), new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.5 }));
      sockBox.position.set(0, 0.0475, 0); sockBox.castShadow = true; scene.add(sockBox);
      const tubeSockets = [];
      ['yellow', 'yellow', 'black', 'blue', 'red'].forEach((c, i) => { const s = socket(THREE, c); s.position.set(-0.04 + i * 0.02, 0.0475, 0.0585); scene.add(s); tubeSockets.push(s); });
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.04, 0.02, 40), M.black); collar.position.y = 0.075; scene.add(collar);
      const tube = new THREE.Group(); tube.position.set(0, YC, 0); scene.add(tube);
      const glassM = glassMaterial(THREE);
      const glass = new THREE.Mesh(new THREE.SphereGeometry(R_GLASS, 96, 64), glassM); glass.renderOrder = 5; tube.add(glass);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.06, 48, 1, true), glassM); neck.position.y = -R_GLASS - 0.012; neck.renderOrder = 5; tube.add(neck);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.012, 0.05, 20), new THREE.MeshStandardMaterial({ color: 0x9fb0b8, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.55 })); stem.position.set(-0.012, -0.072, 0); tube.add(stem);
      const gun = new THREE.Group(); gun.position.set(GUN.x, GUN.y, 0); tube.add(gun);
      const gunM = new THREE.MeshStandardMaterial({ color: 0xb7bcc0, metalness: 1, roughness: 0.35 });
      const cyl = (r1, r2, l, x, m = gunM) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, l, 28), m); c.rotation.z = Math.PI / 2; c.position.x = x; gun.add(c); return c; };
      cyl(0.0042, 0.0042, 0.014, -0.028, new THREE.MeshStandardMaterial({ color: 0x3b3f44, metalness: 0.6, roughness: 0.5 }));
      cyl(0.0055, 0.0055, 0.012, -0.016); cyl(0.0035, 0.0068, 0.009, -0.0048);
      const cath = new THREE.Mesh(new THREE.SphereGeometry(0.0022, 16, 12), new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false })); cath.position.x = -0.021; gun.add(cath);
      const ladM = new THREE.MeshStandardMaterial({ color: 0xc9d0d4, metalness: 0.8, roughness: 0.3 });
      const lad = new THREE.Mesh(new THREE.CylinderGeometry(0.0009, 0.0009, 0.118, 8), ladM); lad.position.set(-0.0035, GUN.y + 0.071, 0); tube.add(lad);
      const tipMats = MARKS.map(() => new THREE.MeshBasicMaterial({ color: 0x333a3f, toneMapped: false }));
      MARKS.forEach((d, i) => {
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.0006, 0.0006, 0.006, 6), ladM); pin.rotation.z = Math.PI / 2; pin.position.set(0, GUN.y + d, 0); tube.add(pin);
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.0013, 10, 8), tipMats[i]); tip.position.set(0.003, GUN.y + d, 0); tube.add(tip);
      });
      // Netzgeräte & Kabel
      const psT = powerSupply(THREE, { w: 0.3, h: 0.16, d: 0.25, label: 'Röhren-Netzgerät 0 … 500 V', displays: 3, knobs: 3, sockets: ['yellow', 'yellow', 'black', 'blue', 'red'], color: 'light' });
      psT.position.set(-0.52, 0, -0.04); psT.rotation.y = 0.6; scene.add(psT);
      const psC = powerSupply(THREE, { w: 0.24, h: 0.14, d: 0.24, label: 'DC-Netzgerät 0 … 20 V / 5 A', displays: 2, knobs: 2, sockets: ['red', 'black'] });
      psC.position.set(0.5, 0, -0.04); psC.rotation.y = -0.6; scene.add(psC);
      scene.updateMatrixWorld(true);
      const wp = o => o.getWorldPosition(new THREE.Vector3());
      const cols = [0xd8b21c, 0xd8b21c, 0x151515, 0x1f4fb8, 0xc4231b];
      tubeSockets.forEach((s, i) => scene.add(cable(THREE, psT.socketWorld(i), wp(s), cols[i], 0.04 + i * 0.012)));
      scene.add(cable(THREE, psC.socketWorld(0), wp(coilSockets[2]), 0xc4231b, 0.02));
      scene.add(cable(THREE, wp(coilSockets[3]), wp(coilSockets[0]), 0x151515, 0.01));
      scene.add(cable(THREE, wp(coilSockets[1]), psC.socketWorld(1), 0x1f4fb8, 0.02));
      // Strahl
      const beamGroup = new THREE.Group(); tube.add(beamGroup);
      const beamMat = k => new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
        uniforms: { col: { value: new THREE.Color() }, inten: { value: 0 }, k: { value: k } },
        vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-w.xyz); gl_Position=projectionMatrix*viewMatrix*w; }',
        fragmentShader: 'uniform vec3 col; uniform float inten; uniform float k; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ float edge=pow(abs(dot(normalize(vN),vV)),k); float fade=mix(1.,.35,vUv.x)*smoothstep(0.,.015,vUv.x); gl_FragColor=vec4(col*inten*edge*fade,1.); }'
      });
      const core = new THREE.Mesh(new THREE.BufferGeometry(), beamMat(1.5)), halo = new THREE.Mesh(new THREE.BufferGeometry(), beamMat(2.5));
      core.renderOrder = halo.renderOrder = 10; beamGroup.add(core, halo);
      const spot = new THREE.Mesh(new THREE.SphereGeometry(0.003, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      beamGroup.add(spot);
      const gunGlow = new THREE.Mesh(new THREE.SphereGeometry(0.0025, 12, 10), spot.material.clone()); gunGlow.position.set(GUN.x + 0.002, GUN.y, 0); beamGroup.add(gunGlow);

      // ---- Modellobjekte ----
      const model = new THREE.Group(); scene.add(model);
      // Feldlinien des Helmholtz-Paares (Biot-Savart, in zwei Ebenen)
      const field = new THREE.Group(); field.position.set(0, YC, 0); model.add(field);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x7aa8ff, transparent: true, opacity: 0.5, toneMapped: false });
      const coneGeo = new THREE.ConeGeometry(0.0045, 0.012, 10), coneMat = new THREE.MeshBasicMaterial({ color: 0x9cc0ff, toneMapped: false });
      for (const ln of FIELD_LINES) {
        for (const rotZ of [0, Math.PI / 2]) {
          const g = new THREE.Group(); g.rotation.z = rotZ; field.add(g);
          g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ln.map(p => new THREE.Vector3(0, p[0], p[1]))), lineMat));
          for (let k = 35; k < ln.length - 1; k += 95) {
            const a = ln[k], b = ln[k + 1]; const c = new THREE.Mesh(coneGeo, coneMat);
            c.position.set(0, a[0], a[1]); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, b[0] - a[0], b[1] - a[1]).normalize()); g.add(c);
          }
        }
      }
      const tubeModel = new THREE.Group(); tube.add(tubeModel);
      const pool = glowPool(THREE, tubeModel, 16, 0x9fe6ff, 0.009);
      const aV = arrow(THREE, 0x5fe0ff), aF = arrow(THREE, 0xff6a4d), aB = arrow(THREE, 0xab93ff, { radius: 0.003, head: 0.016 });
      tubeModel.add(aV, aF); model.add(aB);
      const lV = label(THREE, 'v', { color: '#5fe0ff', size: 0.016 }), lF = label(THREE, 'F_L', { color: '#ff8a6a', size: 0.016 }), lB = label(THREE, 'B', { color: '#c7b6ff', size: 0.018 });
      tubeModel.add(lV, lF); model.add(lB);
      const hiE = glowPool(THREE, tubeModel, 1, 0xffffff, 0.014).items[0];

      // Kamera-Ansichten
      const views = { total: [[0.5, 0.36, 0.7], [0, 0.19, 0]], front: [[0.0, YC + 0.01, 0.62], [0, YC, 0]], top: [[0.0, 0.85, 0.12], [0, YC, 0]] };
      let camAnim = null;
      box.querySelector('.hud').addEventListener('click', e => {
        const b = e.target.closest('[data-v]'); if (!b) return; const [p, t] = views[b.dataset.v];
        camAnim = { p0: lab.camera.position.clone(), t0: lab.controls.target.clone(), p1: new THREE.Vector3(...p), t1: new THREE.Vector3(...t), k: 0 };
      });

      let ver = -1, room = -1, eT = 0;
      const off = lab.onFrame(dt => {
        if (room !== S.room) { room = S.room; lab.setRoom(room); glassM.uniforms.room.value = room; }
        tube.rotation.y = S.rot * Math.PI / 180;
        const showModel = MM.model;
        if (ver !== S.ver) {
          ver = S.ver;
          core.geometry.dispose(); halo.geometry.dispose();
          const pts = S.pts.map(p => new THREE.Vector3(p[0], p[1], p[2]));
          if (pts.length > 2 && S.inten > 0.002) {
            const curve = new THREE.CatmullRomCurve3(pts); const seg = Math.min(900, pts.length * 2);
            core.geometry = new THREE.TubeGeometry(curve, seg, S.width, 8, false); halo.geometry = new THREE.TubeGeometry(curve, seg, S.width * 4.5, 10, false);
          } else { core.geometry = new THREE.BufferGeometry(); halo.geometry = new THREE.BufferGeometry(); }
          const c = new THREE.Color(GAS[S.gas].color);
          core.material.uniforms.col.value.copy(c).multiplyScalar(2.2); halo.material.uniforms.col.value.copy(c);
          const last = pts[pts.length - 1]; if (last) spot.position.copy(last); spot.material.color.copy(c); gunGlow.material.color.copy(c);
          tipMats.forEach((m, i) => m.color.set(i === S.hitMark ? c.clone().multiplyScalar(3) : 0x333a3f));
        }
        const dim = showModel ? 0.22 : 1;
        core.material.uniforms.inten.value = S.inten * (0.004 / (S.width + 0.0012)) * dim; halo.material.uniforms.inten.value = S.inten * 0.22 * dim;
        spot.material.opacity = S.end === 'glas' ? Math.min(1, S.inten * 1.5) : 0; gunGlow.material.opacity = Math.min(1, S.inten * 1.2);
        cath.material.color.setRGB(1.6 * S.warm, 0.55 * S.warm ** 2, 0.12 * S.warm ** 3);
        psT.displays[0].draw(S.UA.toFixed(0), 'V'); psT.displays[1].draw(S.UW.toFixed(1), 'V'); psT.displays[2].draw(S.heat ? '6.3' : '0.0', 'V~');
        psC.displays[0].draw((S.IS * 2.4 + (S.IS > 0 ? 0.1 : 0)).toFixed(1), 'V'); psC.displays[1].draw(S.IS.toFixed(2), 'A');
        psT.setKnob(0, S.UA / 500); psT.setKnob(1, -S.UW / 50); psT.setKnob(2, S.heat ? 1 : 0); psC.setKnob(0, 0.6); psC.setKnob(1, S.IS / 5);
        // Modell
        model.visible = tubeModel.visible = showModel;
        const Bm = Bfield();
        field.visible = showModel && Math.abs(Bm) > 2e-5;
        field.rotation.y = Bm < 0 ? Math.PI : 0;
        lineMat.opacity = Math.min(0.6, 0.15 + Math.abs(Bm) / 1.5e-3 * 0.45);
        if (showModel) {
          const [bx, , bz] = Bvec(); const bl = Math.hypot(bx, bz) || 1;
          // B-Pfeil im Laborsystem: Feld der Spulen liegt entlang z (Erdfeld vernachlässigt in der Darstellung)
          aB.set(new THREE.Vector3(0.11, YC + 0.1, -0.05 * Math.sign(Bm || 1)), new THREE.Vector3(0, 0, 0.1 * Math.sign(Bm || 1)));
          aB.visible = Math.abs(Bm) > 2e-5; lB.visible = aB.visible; lB.position.set(0.11, YC + 0.115, 0.06 * Math.sign(Bm || 1));
          const L = pathLen(), on = S.inten > 0.01 && L > 0.01;
          eT += dt * 0.05; // Darstellung stark verlangsamt
          pool.items.forEach((sp, i) => {
            if (!on) { sp.visible = false; return; }
            const s = ((eT + i / pool.items.length * L) % L); const e = electronAt(s);
            sp.visible = !!e; if (e) sp.position.set(e.p[0], e.p[1], e.p[2]);
          });
          const e = on ? electronAt((eT * 0.6) % L) : null;
          hiE.visible = aV.visible = aF.visible = lV.visible = lF.visible = !!e;
          if (e) {
            const p = new THREE.Vector3(...e.p); hiE.position.copy(p);
            const v = new THREE.Vector3(...e.v).multiplyScalar(0.032); aV.set(p, v); lV.position.copy(p).add(v.clone().multiplyScalar(1.25));
            const showF = e.Fmag > 1e-6 && Math.abs(Bm) > 2e-5; aF.visible = lF.visible = showF;
            if (showF) { const f = new THREE.Vector3(...e.F).multiplyScalar(0.026); aF.set(p, f); lF.position.copy(p).add(f.clone().multiplyScalar(1.35)); }
          }
        }
        if (camAnim) {
          camAnim.k = Math.min(1, camAnim.k + dt * 1.6); const k = 1 - (1 - camAnim.k) ** 3;
          lab.camera.position.lerpVectors(camAnim.p0, camAnim.p1, k); lab.controls.target.lerpVectors(camAnim.t0, camAnim.t1, k);
          if (camAnim.k >= 1) camAnim = null;
        }
      });
      return { destroy() { off(); lab.dispose(); } };
    }

    // ---------------- Ansicht 2D (Blick entlang der Spulenachse) ----------------
    async function view2d(box, MM) {
      const NS = 'http://www.w3.org/2000/svg', SC = 2000, CX = 470, CY = 318; // 2000 px pro m
      const X = x => CX + x * SC, Y = y => CY - y * SC;
      box.insertAdjacentHTML('beforeend', `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Fadenstrahlrohr von vorn: Glaskolben zwischen den Helmholtz-Spulen, Elektronenkanone unten, Kreisbahn des Strahls">
<defs>
  <radialGradient id="fsBg" cx=".47" cy=".5" r=".7"><stop offset="0" stop-color="#151a1e"/><stop offset="1" stop-color="#07090a"/></radialGradient>
  <radialGradient id="fsGlass" cx=".42" cy=".38" r=".62"><stop offset="0" stop-color="#9fb4c2" stop-opacity=".07"/><stop offset=".86" stop-color="#9fb4c2" stop-opacity=".04"/><stop offset="1" stop-color="#cfe2ee" stop-opacity=".32"/></radialGradient>
  <linearGradient id="fsCu" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2ac74"/><stop offset=".5" stop-color="#b8692f"/><stop offset="1" stop-color="#6e3a17"/></linearGradient>
  <filter id="fsGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <marker id="fsAv" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#5fe0ff"/></marker>
  <marker id="fsAf" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#ff6a4d"/></marker>
  <marker id="fsAb" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10z" fill="#9cc0ff"/></marker>
</defs>
<rect width="1000" height="620" fill="url(#fsBg)"/>
<circle cx="${CX}" cy="${CY}" r="${0.15 * SC}" fill="none" stroke="url(#fsCu)" stroke-width="24" opacity=".9"/>
<circle cx="${CX}" cy="${CY}" r="${0.15 * SC}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="1" stroke-dasharray="1 3"/>
<g id="fsBsym" opacity="0"></g>
<circle cx="${CX}" cy="${CY}" r="${R_GLASS * SC}" fill="url(#fsGlass)" stroke="#9fb4c2" stroke-opacity=".5" stroke-width="1.4"/>
<path d="M${CX - 50} ${Y(-R_GLASS) - 6} h100 v40 h-100z" fill="#9fb4c2" opacity=".12"/>
<!-- Kanone -->
<g transform="translate(${X(GUN.x)} ${Y(GUN.y)})"><rect x="-74" y="-11" width="28" height="22" rx="3" fill="#3b3f44"/><rect x="-46" y="-12" width="26" height="24" rx="2" fill="#9aa0a4"/><path d="M-20 -14 L0 -7 L0 7 L-20 14z" fill="#b7bcc0"/><circle id="fsCath" cx="-44" cy="0" r="5" fill="#000"/></g>
<!-- Messmarken -->
<line x1="${X(-0.0035)}" y1="${Y(GUN.y + 0.012)}" x2="${X(-0.0035)}" y2="${Y(GUN.y + 0.13)}" stroke="#c9d0d4" stroke-width="2"/>
<g id="fsMarks">${MARKS.map((d, i) => `<line x1="${X(-0.0035)}" y1="${Y(GUN.y + d)}" x2="${X(0.003)}" y2="${Y(GUN.y + d)}" stroke="#c9d0d4" stroke-width="2"/><circle data-i="${i}" cx="${X(0.004)}" cy="${Y(GUN.y + d)}" r="4" fill="#333a3f"/><text x="${X(-0.0035) - 10}" y="${Y(GUN.y + d) + 4}" fill="#8e979d" font-size="11" text-anchor="end">${d * 100} cm</text>`).join('')}</g>
<path id="fsHalo" fill="none" stroke-width="14" stroke-linecap="round" opacity="0" filter="url(#fsGlow)"/>
<path id="fsBeam" fill="none" stroke-width="3" stroke-linecap="round" opacity="0"/>
<g id="fsElec" fill="#bdf0ff"></g>
<g id="fsVec" opacity="0">
  <line id="fsV" stroke="#5fe0ff" stroke-width="3.2" marker-end="url(#fsAv)"/><text id="fsVt" fill="#5fe0ff" font-size="15" font-weight="600">v</text>
  <line id="fsF" stroke="#ff6a4d" stroke-width="3.2" marker-end="url(#fsAf)"/><text id="fsFt" fill="#ff8a6a" font-size="15" font-weight="600">F<tspan font-size="10" dy="3">L</tspan></text>
  <circle id="fsHi" r="6" fill="#fff" filter="url(#fsGlow)"/>
  <line id="fsR" stroke="#ece6dc" stroke-width="1.2" stroke-dasharray="4 4"/><text id="fsRt" fill="#ece6dc" font-size="13">r</text>
</g>
<text x="${CX}" y="34" fill="#8e979d" font-size="13" text-anchor="middle">Blick entlang der Spulenachse (vordere Spule, Kolben Ø 16 cm)</text>
<!-- Seitenansicht des Feldes -->
<g id="fsSide" opacity="0" transform="translate(800 70)">
  <rect width="180" height="240" rx="10" fill="rgba(10,12,14,.85)" stroke="#323a42"/>
  <text x="12" y="20" fill="#c7c1b7" font-size="11.5">Feld der Spulen (seitlich)</text>
  <g id="fsSideLines" fill="none" stroke="#7aa8ff" stroke-width="1" opacity=".75"></g>
  <g fill="#b8692f"><rect x="${90 - 0.075 * 380 - 5}" y="${130 - 0.15 * 380 - 6}" width="10" height="12" rx="2"/><rect x="${90 + 0.075 * 380 - 5}" y="${130 - 0.15 * 380 - 6}" width="10" height="12" rx="2"/><rect x="${90 - 0.075 * 380 - 5}" y="${130 + 0.15 * 380 - 6}" width="10" height="12" rx="2"/><rect x="${90 + 0.075 * 380 - 5}" y="${130 + 0.15 * 380 - 6}" width="10" height="12" rx="2"/></g>
  <circle cx="90" cy="130" r="${R_GLASS * 380}" fill="none" stroke="#9fb4c2" stroke-opacity=".5"/>
  <text x="12" y="228" fill="#8e979d" font-size="10.5">innen nahezu homogen</text>
</g>
<g id="fsLegend" opacity="0" font-size="12.5">
  <rect x="24" y="470" width="300" height="128" rx="10" fill="rgba(10,12,14,.85)" stroke="#323a42"/>
  <text x="38" y="494" fill="#ece6dc" font-weight="600">Was hier unsichtbar ist</text>
  <text x="38" y="516" fill="#9cc0ff" id="fsBtxt">⊙ B zeigt aus der Bildebene heraus</text>
  <text x="38" y="537" fill="#5fe0ff">→ v: Geschwindigkeit (konstanter Betrag)</text>
  <text x="38" y="558" fill="#ff8a6a">→ F_L ⟂ v: Lorentzkraft = Zentripetalkraft</text>
  <text x="38" y="582" fill="#8e979d" font-size="11">Elektronen stark verlangsamt dargestellt</text>
</g>
</svg>`);
      const svg = box.querySelector('svg'); const q = id => svg.querySelector('#' + id);
      // B-Symbole
      { let h = ''; for (let x = -0.13; x <= 0.131; x += 0.026) for (let y = -0.13; y <= 0.131; y += 0.026) if (Math.hypot(x, y) < 0.14) h += `<g transform="translate(${X(x).toFixed(1)} ${Y(y).toFixed(1)})"><circle r="7" fill="none" stroke="#7aa8ff" stroke-width="1.3"/><circle class="dot" r="2" fill="#9cc0ff"/><path class="crs" d="M-4.5 -4.5L4.5 4.5M-4.5 4.5L4.5 -4.5" stroke="#9cc0ff" stroke-width="1.3"/></g>`; q('fsBsym').innerHTML = h; }
      // Seitenansicht: Feldlinien (y,z) → (90 + z·380, 130 − y·380)
      q('fsSideLines').innerHTML = FIELD_LINES.map(ln => `<path d="M${ln.filter((_, i) => i % 3 === 0).map(p => `${(90 + p[1] * 380).toFixed(1)} ${(130 - p[0] * 380).toFixed(1)}`).join(' L')}"/>`).join('');
      const eg = q('fsElec'); const dots = Array.from({ length: 16 }, () => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', 3.2); eg.append(c); return c; });
      let raf = 0, last = performance.now(), ver = -1, eT = 0;
      function frame(now) {
        raf = requestAnimationFrame(frame);
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        const col = '#' + GAS[S.gas].color.toString(16).padStart(6, '0');
        if (ver !== S.ver) {
          ver = S.ver;
          const d = S.pts.length > 1 ? 'M' + S.pts.filter((_, i) => i % 2 === 0).map(p => `${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join(' L') : '';
          q('fsBeam').setAttribute('d', d); q('fsHalo').setAttribute('d', d);
          q('fsBeam').setAttribute('stroke', col); q('fsHalo').setAttribute('stroke', col);
          svg.querySelectorAll('#fsMarks circle').forEach((c, i) => c.setAttribute('fill', i === S.hitMark ? col : '#333a3f'));
        }
        const dim = MM.model ? 0.3 : 1;
        q('fsBeam').setAttribute('opacity', Math.min(1, S.inten * 1.4 * dim).toFixed(2));
        q('fsHalo').setAttribute('opacity', Math.min(0.8, S.inten * 0.9 * dim).toFixed(2));
        q('fsCath').setAttribute('fill', `rgb(${Math.round(255 * Math.min(1, S.warm * 1.3))},${Math.round(140 * S.warm ** 2)},${Math.round(40 * S.warm ** 3)})`);
        // Modell
        const Bm = Bfield(), hasB = Math.abs(Bm) > 2e-5;
        q('fsBsym').setAttribute('opacity', MM.model && hasB ? Math.min(0.85, 0.25 + Math.abs(Bm) / 1.5e-3 * 0.6).toFixed(2) : 0);
        svg.querySelectorAll('#fsBsym .dot').forEach(e => e.style.display = Bm > 0 ? '' : 'none');
        svg.querySelectorAll('#fsBsym .crs').forEach(e => e.style.display = Bm > 0 ? 'none' : '');
        q('fsBtxt').textContent = !hasB ? 'kein Magnetfeld (Spulenstrom 0)' : Bm > 0 ? '⊙ B zeigt aus der Bildebene heraus' : '⊗ B zeigt in die Bildebene hinein';
        q('fsSide').setAttribute('opacity', MM.model ? 1 : 0); q('fsLegend').setAttribute('opacity', MM.model ? 1 : 0);
        const L = pathLen(), on = MM.model && S.inten > 0.01 && L > 0.01;
        eT += dt * 0.05;
        dots.forEach((c, i) => {
          const e = on ? electronAt((eT + i / dots.length * L) % L) : null;
          c.style.display = e ? '' : 'none'; if (e) { c.setAttribute('cx', X(e.p[0]).toFixed(1)); c.setAttribute('cy', Y(e.p[1]).toFixed(1)); }
        });
        const e = on ? electronAt((eT * 0.6) % L) : null;
        q('fsVec').setAttribute('opacity', e ? 1 : 0);
        if (e) {
          const px = X(e.p[0]), py = Y(e.p[1]);
          const vx = e.v[0], vy = e.v[1], vl = Math.hypot(vx, vy) || 1;
          q('fsHi').setAttribute('cx', px); q('fsHi').setAttribute('cy', py);
          const set = (id, x2, y2) => { const l = q(id); l.setAttribute('x1', px); l.setAttribute('y1', py); l.setAttribute('x2', x2); l.setAttribute('y2', y2); };
          set('fsV', px + vx / vl * 62, py - vy / vl * 62); q('fsVt').setAttribute('x', px + vx / vl * 76 - 4); q('fsVt').setAttribute('y', py - vy / vl * 76 + 5);
          const fl = Math.hypot(e.F[0], e.F[1]); const showF = hasB && fl > 0.05;
          q('fsF').style.display = q('fsFt').style.display = showF ? '' : 'none';
          if (showF) { set('fsF', px + e.F[0] / fl * 50, py - e.F[1] / fl * 50); q('fsFt').setAttribute('x', px + e.F[0] / fl * 66 - 8); q('fsFt').setAttribute('y', py - e.F[1] / fl * 66 + 5); }
          // Radius zur Kreismitte (nur bei geschlossener Kreisbahn sinnvoll)
          const showR = showF && S.rot < 1 && S.hitD != null;
          q('fsR').style.display = q('fsRt').style.display = showR ? '' : 'none';
          if (showR) { const cx = X(0), cy = Y(GUN.y + S.hitD / 2); q('fsR').setAttribute('x1', cx); q('fsR').setAttribute('y1', cy); q('fsR').setAttribute('x2', px); q('fsR').setAttribute('y2', py); q('fsRt').setAttribute('x', (cx + px) / 2 + 6); q('fsRt').setAttribute('y', (cy + py) / 2 - 4); }
        }
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); } };
    }

    const host = viewHost(stage, { id: 'fadenstrahlrohr', views: { '3d': view3d, '2d': view2d }, initial: '3d', modelInfo: 'Feld, Elektronen und Kräfte eingeblendet' });

    // ---------------- Hauptschleife (Physik, Anzeigen) ----------------
    let raf = 0, last = performance.now(), acc = 0;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const prev = S.warm; S.warm += ((S.heat ? 1 : 0) - S.warm) * Math.min(1, dt / (S.heat ? 2.2 : 1.2));
      if (Math.abs(S.warm - prev) > 0.002) S.dirty = true;
      acc += dt; if (S.dirty && acc > 0.05) { acc = 0; rebuild(); }
      dUA.set(`${fmt(S.UA, 0)} V`); dIS.set(`${fmt(S.IS, 3)} A`); dB.set(`${fmt(Math.abs(K_HH * S.IS) * 1e3, 3)} mT`);
      dMark.set(S.hitMark != null ? `d = ${MARKS[S.hitMark] * 100} cm` : '–');
    }
    raf = requestAnimationFrame(loop);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); ch.destroy(); } };
  }
};
