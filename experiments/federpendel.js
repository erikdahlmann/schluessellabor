// ============================================================================
//  Schlüsselexperiment: Federpendel
//  3D-Aufbau (Three.js): Stativ mit Doppelmuffe, Schraubenfeder, Hakenkörper
//  mit Schlitzgewichten, Maßstab, Ultraschall-Bewegungssensor + Interface.
//  Physik: m_eff·ÿ = −D·y − b·ẏ  mit  m_eff = m + m_F/3  (reale Feder hat Masse)
// ============================================================================
import { viewHost } from '../js/lib/views.js';

const G = 9.81;
const SPRINGS = [
  { id: 'A', name: 'Feder A – weich', D: 5, L0: 0.10, R: 0.012, r: 0.00055, mF: 0.006, Fmax: 2.0, turns: 46, color: 0xbfc4c8 },
  { id: 'B', name: 'Feder B – mittel', D: 10, L0: 0.08, R: 0.010, r: 0.0008, mF: 0.012, Fmax: 3.0, turns: 40, color: 0xc9b37a },
  { id: 'C', name: 'Feder C – hart', D: 25, L0: 0.07, R: 0.009, r: 0.0010, mF: 0.018, Fmax: 5.0, turns: 34, color: 0xb9bec2 },
  { id: 'D', name: 'Feder D – sehr hart', D: 50, L0: 0.06, R: 0.008, r: 0.0012, mF: 0.025, Fmax: 7.0, turns: 30, color: 0x9aa0a6 }
];
const TOL = Object.fromEntries(SPRINGS.map(s => [s.id, 1 + (Math.random() * 0.08 - 0.04)])); // ±4 % Fertigungstoleranz
const DAMP = { luft: 0.004, pappe: 0.05, wasser: 0.45 };
const Y_HOOK = 0.935, SENSOR_TOP = 0.048, HANGER = 0.105;

function rulerTexture(THREE) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 4096; const g = c.getContext('2d');
  g.fillStyle = '#f2efe6'; g.fillRect(0, 0, 128, 4096);
  const pxPerCm = 4096 / 90;
  g.fillStyle = '#111'; g.font = '600 30px "IBM Plex Sans", sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle';
  for (let mm = 0; mm <= 900; mm++) {
    const y = mm / 10 * pxPerCm; const len = mm % 10 === 0 ? 56 : mm % 5 === 0 ? 38 : 22;
    g.fillRect(0, y - 1.5, len, 3);
    if (mm % 10 === 0 && mm) g.fillText(String(mm / 10), 64, y);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function makeSpring(THREE, s) {
  const seg = 18, radial = 7, N = s.turns * seg + 1;
  const pos = new Float32Array(N * radial * 3), nor = new Float32Array(N * radial * 3), idx = [];
  for (let i = 0; i < N - 1; i++) for (let j = 0; j < radial; j++) {
    const a = i * radial + j, b = i * radial + (j + 1) % radial, c = a + radial, d = b + radial; idx.push(a, c, b, b, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: s.color, metalness: 1, roughness: 0.3 }));
  mesh.castShadow = true; mesh.frustumCulled = false;
  const grp = new THREE.Group(); grp.add(mesh);
  const wireM = mesh.material;
  const topBar = new THREE.Mesh(new THREE.CylinderGeometry(s.r, s.r, s.R, 8), wireM); topBar.rotation.z = Math.PI / 2;
  const botBar = topBar.clone();
  const loopG = new THREE.TorusGeometry(s.R * 0.55, s.r, 8, 24);
  const topLoop = new THREE.Mesh(loopG, wireM), botLoop = new THREE.Mesh(loopG, wireM);
  grp.add(topBar, botBar, topLoop, botLoop);
  const turnsTotal = s.turns, R = s.R, r = s.r;
  grp.update = (L) => { // L = Länge des gewendelten Teils, Feder hängt nach unten ab y=0
    const tw = 2 * Math.PI * turnsTotal;
    let k = 0;
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1), th = tw * u;
      const cx = R * Math.cos(th), cy = -L * u - 0.01, cz = R * Math.sin(th);
      let tx = -R * Math.sin(th) * tw, ty = -L, tz = R * Math.cos(th) * tw; const tl = Math.hypot(tx, ty, tz); tx /= tl; ty /= tl; tz /= tl;
      const nx = -Math.cos(th), ny = 0, nz = -Math.sin(th);
      const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
      for (let j = 0; j < radial; j++) {
        const ph = j / radial * Math.PI * 2, cp = Math.cos(ph), sp = Math.sin(ph);
        const ox = cp * nx + sp * bx, oy = cp * ny + sp * by, oz = cp * nz + sp * bz;
        pos[k] = cx + r * ox; nor[k++] = ox; pos[k] = cy + r * oy; nor[k++] = oy; pos[k] = cz + r * oz; nor[k++] = oz;
      }
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.normal.needsUpdate = true;
    geo.computeBoundingSphere();
    topBar.position.set(R / 2, -0.01, 0); topLoop.position.set(0, -0.01 + R * 0.55, 0);
    const endTh = tw; botBar.position.set(R / 2 * Math.cos(endTh), -L - 0.01, R / 2 * Math.sin(endTh)); botBar.rotation.y = -endTh;
    botLoop.position.set(0, -L - 0.01 - R * 0.55, 0);
  };
  grp.dispose = () => { geo.dispose(); loopG.dispose(); };
  return grp;
}

export default {
  intro: 'Ein Körper hängt an einer Schraubenfeder und schwingt harmonisch. Mit einem Ultraschall-Bewegungssensor wird das Zeit-Ort-Diagramm aufgezeichnet; aus Messreihen mit verschiedenen Massen und Federn ergibt sich <i>T = 2π·√(m/D)</i>.',
  docs: {
    durchfuehrung: `
<h3>Aufbau</h3>
<p>An der Querstange eines Stativs (Stativstange 1 m, Doppelmuffe) hängt eine Schraubenfeder. Daran wird der Hakenkörper (50 g) mit Schlitzgewichten (je 50 g) gehängt. Senkrecht darunter liegt ein Ultraschall-Bewegungssensor, der den Abstand zur Unterseite des Pendelkörpers misst (Mindestabstand ca. 15 cm). Ein Maßstab hinter dem Pendel dient zum Ablesen der Ruhelage.</p>
<h3>Durchführung</h3>
<ol>
<li>Feder und Masse wählen. Warten, bis der Pendelkörper in Ruhe ist, dann <b>Nullpunkt setzen</b> (die Ruhelage wird zu y = 0).</li>
<li>Pendelkörper um wenige Zentimeter nach unten auslenken – per Schieberegler oder direkt mit der Maus im 3D-Aufbau ziehen – und loslassen.</li>
<li>Messung starten (z. B. 10 s bei Δt = 20 ms). Aus den Nulldurchgängen wird die Periodendauer bestimmt.</li>
<li><b>T übernehmen</b>: Der Wert erscheint in der Messreihe. Masse schrittweise erhöhen (50 g … 500 g) und wiederholen.</li>
<li>Teilversuch 2: Masse konstant, verschiedene Federn. Teilversuch 3: Anfangsauslenkung variieren.</li>
<li>Zum Vergleich mit der Handmessung die <b>Stoppuhr</b> nutzen (10 Perioden) – Reaktionszeiten streuen wie im echten Versuch.</li>
</ol>
<div class="callout">Auswertung: <i>T²</i> über <i>m</i> auftragen. Die Steigung der Ausgleichsgeraden ist <i>4π²/D</i>. Der Achsenabschnitt verrät die Masse der Feder: Die Gerade schneidet die m-Achse etwa bei <i>−m<sub>F</sub>/3</i>.</div>`,
    theorie: `
<h3>Lineares Kraftgesetz</h3>
<p>In der Ruhelage gleichen sich Gewichtskraft und Federkraft aus: <i>m·g = D·s₀</i>. Wird der Körper um <i>y</i> ausgelenkt, wirkt die rücktreibende Kraft <i>F = −D·y</i> – das ist die Bedingung für eine harmonische Schwingung. Die Gewichtskraft verschiebt nur die Ruhelage.</p>
<span class="formula tex">m\\,\\ddot{y} = -D\\, y \\quad\\Rightarrow\\quad y(t) = \\hat{y}\\cos(\\omega t), \\quad \\omega = \\sqrt{\\frac{D}{m}}</span>
<span class="formula tex">T = 2\\pi\\sqrt{\\frac{m}{D}}</span>
<p>Die Periodendauer hängt <b>nicht</b> von der Amplitude und nicht vom Ortsfaktor <i>g</i> ab.</p>
<h3>Federmasse</h3>
<p>Eine reale Feder schwingt mit. Näherungsweise wirkt ein Drittel ihrer Masse wie zusätzliche Pendelmasse:</p>
<span class="formula tex">T = 2\\pi\\sqrt{\\frac{m + \\frac{m_F}{3}}{D}} \\quad\\Rightarrow\\quad T^2 = \\frac{4\\pi^2}{D}\\, m + \\frac{4\\pi^2}{D} \\cdot \\frac{m_F}{3}</span>
<h3>Dämpfung</h3>
<p>Luftreibung (und im Wasser die Flüssigkeitsreibung) lässt die Amplitude exponentiell abklingen: <i>ŷ(t) = ŷ₀·e<sup>−δt</sup></i> mit <span class="tex">\\delta = \\frac{b}{2m}</span>. Bei schwacher Dämpfung ändert sich <i>T</i> praktisch nicht.</p>
<h3>Energie</h3>
<p>Kinetische Energie und Spannenergie (bezogen auf die Ruhelage) wandeln sich periodisch ineinander um: <i>E = ½·D·ŷ²</i>.</p>
<h3>Modellgrenzen dieser Simulation</h3>
<ul><li>Federkonstanten weichen wie bei echten Federn um bis zu ±4 % vom Nennwert ab.</li>
<li>Ultraschallsensor: Auflösung ca. 0,3 mm (Rauschen), Abtastung wählbar. Die Federmasse ist realistisch berücksichtigt; per Häkchen lässt sich eine ideale, masselose Feder einstellen.</li></ul><h3>Was die Modellansicht zeigt</h3><ul><li><b>Kraftpfeile:</b> Federkraft (nach oben) und Gewichtskraft (nach unten). Ihre Summe ist die rücktreibende Kraft <i>F = −D·y</i>; sie zeigt immer zur Ruhelage und ist umso größer, je weiter der Körper ausgelenkt ist.</li><li><b>Energiebalken:</b> Bewegungsenergie und Spannenergie (bezogen auf die Ruhelage) wandeln sich ineinander um, die Summe bleibt ohne Dämpfung gleich.</li><li><b>Zeigerdiagramm:</b> Ein Zeiger der Länge ŷ läuft gleichförmig mit ω um. Seine Projektion ist genau die Auslenkung y(t) – so entsteht die Sinuskurve.</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Stativ</td><td>Stange 1 m, Ø 12 mm; Querstange 25 cm</td></tr>
<tr><td>Schraubenfedern (Nennwerte)</td><td>5 · 10 · 25 · 50 N/m</td></tr>
<tr><td>Federmassen</td><td>6 · 12 · 18 · 25 g</td></tr>
<tr><td>Hakenkörper + Schlitzgewichte</td><td>50 g + n · 50 g (Ø 40 mm)</td></tr>
<tr><td>Ultraschall-Bewegungssensor</td><td>0,15 … 2 m, bis 100 Hz</td></tr>
<tr><td>Maßstab</td><td>90 cm, mm-Teilung</td></tr>
</tbody></table>
<p class="muted" style="margin-top:12px">Bei LEIFIphysik wird der Zusammenhang über drei Teilversuche (Anfangsauslenkung, Masse, Federkonstante) erarbeitet und durch Auftragen von T über √(m/D) bestätigt. Das Federpendel ist im Kernlehrplan als Schlüsselexperiment zu Schwingungen im Inhaltsfeld „Klassische Wellen und geladene Teilchen in Feldern“ genannt.</p>`,
    abi: `
<details class="q"><summary>Begründe, dass das Federpendel harmonisch schwingt. <span class="op">AFB II</span></summary><p>Für die Auslenkung y aus der Ruhelage gilt das lineare Kraftgesetz F = −D·y (die Gewichtskraft wird in der Ruhelage von der Vordehnung der Feder kompensiert). Ein lineares Kraftgesetz führt auf die Differentialgleichung ÿ = −(D/m)·y mit sinusförmiger Lösung.</p></details>
<details class="q"><summary>An einer Feder schwingt ein 200-g-Körper mit T = 0,89 s. Berechne D. <span class="op">AFB I</span></summary><p>D = 4π²·m/T² = 4π²·0,200 kg/(0,89 s)² ≈ 10 N/m.</p></details>
<details class="q"><summary>Wie ändert sich T, wenn die Masse vervierfacht wird? Wie auf dem Mond? <span class="op">AFB II</span></summary><p>T ~ √m, also verdoppelt sich T. Auf dem Mond bleibt T gleich, da g in T = 2π·√(m/D) nicht vorkommt – nur die Ruhelage liegt höher.</p></details>
<details class="q"><summary>Die T²-m-Gerade geht nicht durch den Ursprung. Erkläre und werte aus. <span class="op">AFB III</span></summary><p>Die Feder besitzt selbst Masse; etwa ein Drittel davon schwingt effektiv mit. Aus T² = a·m + b folgt D = 4π²/a und m<sub>F</sub> ≈ 3·b/a. Der Schnittpunkt mit der m-Achse liegt bei −m<sub>F</sub>/3.</p></details>
<details class="q"><summary>Vergleiche Stoppuhr- und Sensormessung hinsichtlich der Messunsicherheit. <span class="op">AFB III</span></summary><p>Die Reaktionszeit beim Starten und Stoppen (je ca. 0,1–0,2 s) ist der dominierende Fehler der Handmessung; man misst daher mehrere Perioden und teilt. Der Sensor bestimmt T aus vielen Nulldurchgängen mit einer Unsicherheit im Millisekundenbereich.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, selectBox, check, button, fmt, gauss, dataTable, toast, display } = ui;

    // ---------------- Zustand ----------------
    const S = { spring: SPRINGS[1], m: 0.2, ideal: false, damp: 'luft', y: 0, v: 0, held: false, rec: false, t: 0, dtS: 0.02, dur: 10, d0: null, data: [], ver: 0 };
    const Dreal = () => S.spring.D * TOL[S.spring.id];
    const meff = () => S.m + (S.ideal ? 0 : S.spring.mF / 3);
    const s0 = () => S.m * G / Dreal();
    const omega = () => Math.sqrt(Dreal() / meff());
    const yBottom = () => Y_HOOK - 0.01 - (S.spring.L0 + s0() + S.y) - 0.012 - HANGER;
    const clampY = y => Math.max(-s0() * 0.9, Math.min(Math.min(0.1, s0() * 0.9), y));

    // ---------------- Bedienfeld ----------------
    const gF = group('Feder und Pendelkörper');
    const sSpring = selectBox({ label: 'Schraubenfeder', value: 'B', options: SPRINGS.map(s => ({ value: s.id, label: `${s.name} (D ≈ ${s.D} N/m)` })), onChange: v => { S.spring = SPRINGS.find(s => s.id === v); clampMass(); S.ver++; rest(); } });
    const sMass = slider({ label: 'Masse m (Haken + Schlitzgewichte)', min: 50, max: 500, step: 50, value: 200, unit: 'g', onInput: v => { S.m = v / 1000; clampMass(); S.ver++; rest(); } });
    const cIdeal = check({ label: 'Ideale Feder (masselos)', onChange: v => { S.ideal = v; } });
    const sDamp = selectBox({ label: 'Dämpfung', value: 'luft', options: [{ value: 'luft', label: 'gering (Luftreibung)' }, { value: 'pappe', label: 'mittel (Pappscheibe)' }, { value: 'wasser', label: 'stark (Pendelkörper im Wasser)' }], onChange: v => { S.damp = v; S.ver++; } });
    gF.append(sSpring, sMass, cIdeal, sDamp);
    function clampMass() {
      const max = Math.floor(S.spring.Fmax / G / 0.05) * 0.05;
      if (S.m > max + 1e-9) { S.m = max; sMass.set(Math.round(max * 1000)); toast(`${S.spring.name}: höchstens ${Math.round(max * 1000)} g, sonst wird die Feder überdehnt.`); }
    }
    const gA = group('Auslenkung');
    const sAmp = slider({ label: 'Auslenkung nach unten', min: 0.5, max: 8, step: 0.5, value: 4, unit: 'cm', digits: 1 });
    gA.append(sAmp, el('div', { class: 'bar' },
      button('Auslenken & loslassen', () => { S.y = Math.min(sAmp.get() / 100, s0() * 0.9); S.v = 0; if (S.y < sAmp.get() / 100 - 1e-6) toast('Auslenkung begrenzt: Die Feder darf nicht entspannt werden.'); }, 'btn small primary'),
      button('Anhalten', () => rest())));
    const gM = group('Ultraschall-Messung', { led: true });
    const sDt = selectBox({ label: 'Abtastintervall Δt', value: 0.02, options: [0.01, 0.02, 0.05].map(v => ({ value: v, label: `${v * 1000} ms` })), onChange: v => { S.dtS = +v; } });
    const sDur = selectBox({ label: 'Messdauer', value: 10, options: [5, 10, 20, 30].map(v => ({ value: v, label: `${v} s` })), onChange: v => { S.dur = +v; } });
    const bRec = button('Messung starten', () => S.rec ? stopRec() : startRec(), 'btn small primary');
    gM.append(sDt, sDur, el('div', { class: 'bar' }, bRec, button('Nullpunkt setzen', () => { S.d0 = measureD(); toast('Ruhelage als Nullpunkt gespeichert.'); })));
    const gH = group('Handmessung');
    gH.append(el('p', { class: 'muted', style: 'font-size:13px;margin:0 0 8px' }, 'Stoppuhr über 10 Perioden – mit menschlicher Reaktionszeit.'), button('Stoppuhr: 10 Perioden', () => stopwatch()));
    const dD = display('Abstand Sensor'), dY = display('Auslenkung y'), dR = display('Unterkante am Maßstab'), dTth = display('T (Theorie, Nennwert)');
    const gL = group('Live-Werte'); gL.append(dD, dY, dR, dTth);
    controls.append(gF, gA, gM, gH, gL);

    // ---------------- Messwerte-Panel ----------------
    const rows = [];
    const figY = el('div', { class: 'fig' }), figT = el('div', { class: 'fig' });
    const chY = new Chart(figY, { xlabel: 't in s', ylabel: 'y in cm' });
    const chT = new Chart(figT, { xlabel: 'm in kg', ylabel: 'T² in s²' });
    const resY = el('div', { class: 'result' }), resT = el('div', { class: 'result' });
    let lastT = null, tView = 'T2';
    const tbl = dataTable([
      { key: 'meth', label: 'Methode', fmt: v => v }, { key: 'feder', label: 'Feder', fmt: v => v },
      { key: 'm', label: 'm in g', fmt: v => fmt(v * 1000, 0) }, { key: 'T', label: 'T in s', digits: 3 },
      { key: 'sT', label: 'ΔT in s', digits: 3 }, { key: 'A', label: 'ŷ in cm', fmt: v => fmt(v * 100, 1) }
    ], { onDelete: i => { rows.splice(i, 1); tbl.render(rows); drawT(); } });
    const segT = ui.segmented({ value: 'T2', options: [{ value: 'T', label: 'T(m)' }, { value: 'T2', label: 'T²(m)' }, { value: 'sq', label: '√(m/D)' }], onChange: v => { tView = v; drawT(); } });
    const bTake = button('T in Messreihe übernehmen', () => {
      if (!lastT) { toast('Erst eine Messung mit mindestens zwei Perioden aufnehmen.'); return; }
      rows.push({ meth: 'Sensor', feder: S.spring.id, D: S.spring.D, ...lastT }); tbl.render(rows); drawT(); toast('Periodendauer übernommen.');
    }, 'btn small primary');
    messwerte.append(el('div', { class: 'data' },
      el('div', { class: 'chartbox' }, el('h4', {}, 'Zeit-Ort-Diagramm (Ultraschallsensor)'), figY, resY,
        el('div', { class: 'toolbar' }, bTake),
        csvTools(() => ({ meta: [`Federpendel – Feder ${S.spring.id} (Nennwert ${S.spring.D} N/m), m = ${S.m * 1000} g`, 'y: Auslenkung aus der Ruhelage, positiv nach unten'], columns: [{ key: 't', label: 't in s' }, { key: 'd', label: 'Abstand d in m' }, { key: 'y', label: 'y in m' }], rows: S.data.map(p => ({ t: p[0], d: p[1], y: p[2] })) }), 'federpendel_zeit-ort')),
      el('div', { class: 'chartbox' }, el('h4', {}, el('span', {}, 'Messreihe'), segT), figT, resT,
        csvTools(() => ({ meta: ['Federpendel – Messreihe Periodendauer'], columns: [{ key: 'meth', label: 'Methode' }, { key: 'feder', label: 'Feder' }, { key: 'D', label: 'D Nennwert in N/m' }, { key: 'm', label: 'm in kg' }, { key: 'T', label: 'T in s' }, { key: 'sT', label: 'Delta T in s' }, { key: 'A', label: 'Amplitude in m' }], rows }), 'federpendel_messreihe'))),
      el('div', { style: 'height:14px' }), tbl);
    function drawY() { chY.set([{ points: S.data.map(p => [p[0], p[2] * 100]), color: '#86dcff' }]); }
    function drawT() {
      const sel = rows.filter(r => !r._bad); const feds = [...new Set(sel.map(r => r.feder))];
      const cols = { A: '#86dcff', B: '#f2ac74', C: '#ab93ff', D: '#7fd6a0' };
      let series, fits = [], txt = '';
      if (tView === 'T2') {
        chT.o.xlabel = 'm in kg'; chT.o.ylabel = 'T² in s²';
        series = feds.map(f => ({ name: 'Feder ' + f, color: cols[f], mode: 'dot', points: sel.filter(r => r.feder === f).map(r => [r.m, r.T ** 2]) }));
        for (const f of feds) {
          const pts = sel.filter(r => r.feder === f); if (pts.length < 2) continue;
          const l = fit.linFit(pts.map(r => r.m), pts.map(r => r.T ** 2)); if (!l) continue;
          fits.push({ f: l.f, color: cols[f] });
          txt += `<div><span>Feder ${f}: T² = ${fmt(l.a, 3)} s²/kg · m + ${fmt(l.b, 4)} s²</span><br><b>D = ${fmt(4 * Math.PI ** 2 / l.a, 2)} N/m</b> <span>· m<sub>F</sub> ≈ ${fmt(3 * l.b / l.a * 1000, 0)} g · R² = ${fmt(l.r2, 4)}</span></div>`;
        }
      } else if (tView === 'T') {
        chT.o.xlabel = 'm in kg'; chT.o.ylabel = 'T in s';
        series = feds.map(f => ({ name: 'Feder ' + f, color: cols[f], mode: 'dot', points: sel.filter(r => r.feder === f).map(r => [r.m, r.T]) }));
        txt = '<span>T wächst langsamer als m: Linearisierung über T² oder √m prüfen.</span>';
      } else {
        chT.o.xlabel = '√(m/D) in s'; chT.o.ylabel = 'T in s';
        const pts = sel.map(r => [Math.sqrt(r.m / r.D), r.T]);
        series = [{ name: 'alle Federn (Nennwerte D)', color: '#f2ac74', mode: 'dot', points: pts }];
        if (pts.length >= 2) { const l = fit.propFit(pts.map(p => p[0]), pts.map(p => p[1])); fits.push({ f: l.f, color: '#ab93ff', name: 'Ursprungsgerade' }); txt = `<div><span>Steigung (Erwartung 2π ≈ 6,283)</span><br><b>k = ${fmt(l.a, 3)}</b> <span>· R² = ${fmt(l.r2, 4)}</span></div>`; }
      }
      chT.set(series, fits); resT.innerHTML = txt || '<span>Mindestens zwei Messwerte je Feder für eine Ausgleichsgerade.</span>';
    }
    drawY(); drawT(); resY.innerHTML = '<span>Noch keine Messung.</span>';

    // ---------------- Messung ----------------
    function measureD() { return yBottom() - SENSOR_TOP + gauss(0.0003); }
    function startRec() {
      if (S.d0 == null) S.d0 = yBottom() - SENSOR_TOP + S.y;
      S.rec = true; S.t = 0; S.data = []; lastT = null; bRec.textContent = 'Messung stoppen'; gM.led(true);
    }
    function stopRec() {
      S.rec = false; bRec.textContent = 'Messung starten'; gM.led(false);
      const Ts = fit.periodsFromSignal(S.data.map(p => p[0]), S.data.map(p => p[2]));
      const amp = S.data.length ? Math.max(...S.data.map(p => Math.abs(p[2]))) : 0;
      if (Ts.length >= 2 && amp > 0.002) {
        const T = fit.mean(Ts), sT = fit.stdev(Ts);
        lastT = { m: S.m, T, sT, A: amp, n: Ts.length };
        resY.innerHTML = `<div><span>Periodendauer aus ${Ts.length} Perioden</span><br><b>T = ${fmt(T, 3)} s</b></div><div><span>Standardabweichung</span><br><b>${fmt(sT * 1000, 1)} ms</b></div><div><span>max. Auslenkung</span><br><b>${fmt(amp * 100, 1)} cm</b></div>`;
      } else resY.innerHTML = '<span>Keine auswertbare Schwingung erkannt – erst auslenken, dann messen.</span>';
      drawY();
    }
    function stopwatch() {
      const w = omega();
      if (Math.abs(S.y) < 0.004 && Math.abs(S.v) < 0.02) { toast('Das Pendel ruht – erst auslenken.'); return; }
      const T10 = 10 * 2 * Math.PI / w + gauss(0.12) + 0.06, T = T10 / 10;
      rows.push({ meth: 'Stoppuhr', feder: S.spring.id, D: S.spring.D, m: S.m, T, sT: 0.15 / 10, A: Math.hypot(S.y, S.v / w) });
      tbl.render(rows); drawT(); toast(`Stoppuhr: 10 T = ${fmt(T10, 2)} s → T = ${fmt(T, 3)} s`);
    }
    function rest() { S.y = 0; S.v = 0; if (!S.rec) S.d0 = null; }

    // ---------------- Modell-Overlay (beide Ansichten): Energie und Zeigerdiagramm ----------------
    const ov = el('div', { class: 'ov', style: 'right:12px;top:56px;width:230px', hidden: true });
    ov.innerHTML = `<h5>Energie (bezogen auf die Ruhelage)</h5>
      <svg viewBox="0 0 210 92" width="100%" style="display:block"><g id="fpE"></g></svg>
      <h5 style="margin-top:8px">Zeigerdiagramm: y = ŷ·cos(ω·t)</h5>
      <svg viewBox="0 0 210 110" width="100%" style="display:block">
        <circle id="fpCirc" cx="52" cy="55" r="40" fill="none" stroke="#4a545c"/>
        <line x1="52" y1="10" x2="52" y2="100" stroke="#323a42"/><line x1="8" y1="55" x2="96" y2="55" stroke="#323a42"/>
        <line id="fpPtr" x1="52" y1="55" stroke="#f2ac74" stroke-width="2.4"/>
        <line id="fpProj" stroke="#86dcff" stroke-dasharray="3 3"/>
        <circle id="fpDot" r="3.5" fill="#86dcff"/>
        <polyline id="fpTrace" fill="none" stroke="#86dcff" stroke-width="1.6"/>
        <text x="104" y="106" fill="#8e979d" font-size="9">t →</text><text x="40" y="9" fill="#8e979d" font-size="9">y↓</text>
      </svg>`;
    stage.append(ov);
    const qo = id => ov.querySelector('#' + id); const trace = [];
    function drawOverlay(dt) {
      const D = Dreal(), m = meff(), w = omega();
      const Ek = 0.5 * m * S.v * S.v, Ep = 0.5 * D * S.y * S.y, Es = Ek + Ep;
      const Emax = Math.max(0.5 * D * 0.08 * 0.08, Es, 1e-6) * 1.05;
      const bar = (i, val, col, name) => { const h = val / Emax * 64; return `<rect x="${10 + i * 68}" y="${72 - h}" width="40" height="${h.toFixed(1)}" rx="3" fill="${col}"/><text x="${30 + i * 68}" y="86" fill="#c7c1b7" font-size="10" text-anchor="middle">${name}</text>`; };
      qo('fpE').innerHTML = bar(0, Ek, '#86dcff', 'E_kin') + bar(1, Ep, '#f2ac74', 'E_pot') + bar(2, Es, '#ab93ff', 'Summe') + `<line x1="4" y1="72" x2="206" y2="72" stroke="#4a545c"/>`;
      const A = Math.hypot(S.y, S.v / w), R = 40, phi = Math.atan2(-S.v / w, S.y); // y = A cos(φ)
      const sc = A > 1e-4 ? R / Math.max(A, 0.02) : 0;
      const px = 52 + Math.sin(phi) * A * sc, py = 55 + Math.cos(phi) * A * sc; // y nach unten
      qo('fpCirc').setAttribute('r', (A * sc).toFixed(1));
      const p = qo('fpPtr'); p.setAttribute('x2', px.toFixed(1)); p.setAttribute('y2', py.toFixed(1));
      const pr = qo('fpProj'); pr.setAttribute('x1', px.toFixed(1)); pr.setAttribute('y1', py.toFixed(1)); pr.setAttribute('x2', 104); pr.setAttribute('y2', py.toFixed(1));
      qo('fpDot').setAttribute('cx', 104); qo('fpDot').setAttribute('cy', py.toFixed(1));
      trace.unshift(py); if (trace.length > 100) trace.pop();
      qo('fpTrace').setAttribute('points', trace.map((y, i) => `${104 + i},${y.toFixed(1)}`).join(' '));
    }

    // ---------------- Ansicht 3D ----------------
    async function view3d(box, MM) {
      const { createLab, mats, cable, powerSupply, arrow, label } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [0.62, 0.66, 0.92], target: [0.2, 0.52, 0], table: [6, 3], bloom: [0.3, 0.4, 0.97], room: 1, maxDist: 3 });
      const { THREE, scene } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad · Pendelkörper anfassen und nach unten ziehen</div>');
      const HX = 0.2;
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.022, 0.17), new THREE.MeshStandardMaterial({ color: 0x2f4a6b, roughness: 0.5, metalness: 0.3 }));
      base.position.set(0.02, 0.011, 0); base.castShadow = base.receiveShadow = true; scene.add(base);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.004, 12), M.black); f.position.set(0.02 + sx * 0.11, 0.002, sz * 0.07); scene.add(f); }
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.0, 24), M.steel); rod.position.set(0, 0.52, 0); rod.castShadow = true; scene.add(rod);
      const muff = new THREE.Group();
      muff.add(new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.05, 0.035), new THREE.MeshStandardMaterial({ color: 0x6b7075, metalness: 0.8, roughness: 0.35 })));
      for (const [x, z, ry] of [[0, 0.028, 0], [0.028, 0, Math.PI / 2]]) {
        const kb = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.006, 16), M.knob); kb.rotation.x = Math.PI / 2; kb.position.set(x * 1.5, 0, z * 1.5); kb.rotation.y = ry; muff.add(kb);
      }
      muff.position.set(0, Y_HOOK + 0.02, 0); scene.add(muff);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.27, 20), M.steel); arm.rotation.z = Math.PI / 2; arm.position.set(0.12, Y_HOOK + 0.02, 0); arm.castShadow = true; scene.add(arm);
      const hook = new THREE.Mesh(new THREE.TorusGeometry(0.007, 0.0016, 8, 20, Math.PI * 1.5), M.steel); hook.position.set(HX, Y_HOOK + 0.007, 0); hook.rotation.z = Math.PI * 0.75; scene.add(hook);
      const rSide = new THREE.MeshStandardMaterial({ color: 0x9a968c, roughness: 0.9 });
      const ruler = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.9, 0.004), [rSide, rSide, rSide, rSide, new THREE.MeshStandardMaterial({ map: rulerTexture(THREE), roughness: 0.85, color: 0xcfcac0 }), rSide]);
      ruler.position.set(HX + 0.05, Y_HOOK - 0.45, -0.035); ruler.castShadow = true; scene.add(ruler);
      const sensor = new THREE.Group();
      const sb = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.04, 0.06), new THREE.MeshStandardMaterial({ color: 0x1f4fb8, roughness: 0.45 })); sb.position.y = 0.02; sb.castShadow = true; sensor.add(sb);
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.008, 32), new THREE.MeshStandardMaterial({ color: 0xb59a52, metalness: 0.9, roughness: 0.55 })); tr.position.y = 0.044; sensor.add(tr);
      const sLed = new THREE.Mesh(new THREE.SphereGeometry(0.0025, 10, 10), new THREE.MeshBasicMaterial({ color: 0x113311 })); sLed.position.set(0.028, 0.03, 0.031); sensor.add(sLed);
      sensor.position.set(HX, 0, 0); scene.add(sensor);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.06, 1, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0x86dcff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
      cone.rotation.x = Math.PI; scene.add(cone);
      const iface = powerSupply(THREE, { w: 0.2, h: 0.09, d: 0.15, label: 'Messinterface · Ultraschall', displays: 1, knobs: 0, sockets: ['yellow', 'black'], color: 'light', dispColor: ['#b7ffd6', '#0b1410'] });
      iface.position.set(0.5, 0, 0.02); iface.rotation.y = -0.45; scene.add(iface); iface.updateMatrixWorld(true);
      scene.add(cable(THREE, new THREE.Vector3(HX + 0.04, 0.02, 0), iface.socketWorld(0), 0x161616, 0.0));
      const body = new THREE.Group(); scene.add(body);
      const hangerRod = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, HANGER - 0.008, 12), M.steel); hangerRod.position.y = -(HANGER - 0.008) / 2 - 0.008; body.add(hangerRod);
      const hHook = new THREE.Mesh(new THREE.TorusGeometry(0.006, 0.0014, 8, 18), M.steel); hHook.position.y = -0.005; body.add(hHook);
      const hBase = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.006, 40), M.brass); hBase.position.y = -HANGER + 0.003; hBase.castShadow = true; body.add(hBase);
      const discGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.0052, 40), discMat = new THREE.MeshStandardMaterial({ color: 0x8d9398, metalness: 0.9, roughness: 0.35 });
      const discs = []; for (let i = 0; i < 9; i++) { const d = new THREE.Mesh(discGeo, discMat); d.position.y = -HANGER + 0.0088 + i * 0.0054; d.castShadow = true; d.visible = false; body.add(d); discs.push(d); }
      const pickables = [hangerRod, hBase, ...discs];
      // Modell: Kräfte, Geschwindigkeit, Ruhelage
      const aFF = arrow(THREE, 0xf2ac74, { radius: 0.003, head: 0.018 }), aFG = arrow(THREE, 0x6fa8ff, { radius: 0.003, head: 0.018 }), aFR = arrow(THREE, 0xff4b3e, { radius: 0.004, head: 0.022 }), aV = arrow(THREE, 0x5fe0ff, { radius: 0.0025, head: 0.016 });
      const lFF = label(THREE, 'F_Feder', { color: '#f2ac74', size: 0.022 }), lFG = label(THREE, 'F_G', { color: '#8cb8ff', size: 0.022 }), lFR = label(THREE, 'F_res', { color: '#ff7a6a', size: 0.022 }), lV = label(THREE, 'v', { color: '#5fe0ff', size: 0.022 });
      const restM = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.0015), new THREE.MeshBasicMaterial({ color: 0xab93ff, transparent: true, opacity: 0.8, toneMapped: false }));
      const lRest = label(THREE, 'Ruhelage', { color: '#c7b6ff', size: 0.018 });
      const modelG = new THREE.Group(); modelG.add(aFF, aFG, aFR, aV, lFF, lFG, lFR, lV, restM, lRest); scene.add(modelG);
      let springMesh = null, sv = -1, lastSpring = null;
      // Ziehen mit der Maus
      const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), plane = new THREE.Plane(), hit = new THREE.Vector3(); let dragOff = 0;
      const cvs = lab.renderer.domElement;
      const setPtr = e => { const r = cvs.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, lab.camera); };
      const onDown = e => { setPtr(e); const h = ray.intersectObjects(pickables, false)[0]; if (!h) return; S.held = true; lab.controls.enabled = false; cvs.setPointerCapture(e.pointerId); const n = new THREE.Vector3().subVectors(lab.camera.position, h.point).setY(0).normalize(); plane.setFromNormalAndCoplanarPoint(n, h.point); dragOff = h.point.y + S.y; cvs.style.cursor = 'grabbing'; };
      const onMove = e => { setPtr(e); if (!S.held) { cvs.style.cursor = ray.intersectObjects(pickables, false).length ? 'grab' : ''; return; } if (ray.ray.intersectPlane(plane, hit)) { S.y = clampY(dragOff - hit.y); S.v = 0; } };
      const onUp = () => { if (!S.held) return; S.held = false; lab.controls.enabled = true; cvs.style.cursor = ''; };
      cvs.addEventListener('pointerdown', onDown); cvs.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
      const disp = iface.displays[0];
      const off = lab.onFrame(() => {
        if (sv !== S.ver || lastSpring !== S.spring) {
          sv = S.ver;
          if (lastSpring !== S.spring) { if (springMesh) { scene.remove(springMesh); springMesh.dispose(); } springMesh = makeSpring(THREE, S.spring); springMesh.position.set(HX, Y_HOOK, 0); scene.add(springMesh); lastSpring = S.spring; }
          const n = Math.round(S.m / 0.05) - 1; discs.forEach((d, i) => { d.visible = i < n; });
        }
        const L = S.spring.L0 + s0() + S.y; springMesh.update(L);
        const by = Y_HOOK - 0.01 - L - 0.012; body.position.set(HX, by, 0);
        const d = yBottom() - SENSOR_TOP;
        cone.scale.set(1, d, 1); cone.position.set(HX, SENSOR_TOP + d / 2, 0); cone.material.opacity = S.rec ? 0.05 : 0; sLed.material.color.set(S.rec ? 0x3dff6a : 0x113311);
        disp.draw(fmt(d, 3), 'm');
        modelG.visible = MM.model;
        if (MM.model) {
          const D = Dreal(), m = S.m, k = 0.06; // 1 N ≙ 6 cm
          const cy = by - HANGER * 0.55, x0 = HX - 0.045;
          const FF = D * (s0() + S.y), FG = m * G, FR = FG - FF - DAMP[S.damp] * S.v; // nach unten positiv
          aFF.set(new THREE.Vector3(x0, cy, 0.03), new THREE.Vector3(0, FF * k, 0)); lFF.position.set(x0 - 0.05, cy + FF * k + 0.012, 0.03);
          aFG.set(new THREE.Vector3(x0 + 0.012, cy, 0.03), new THREE.Vector3(0, -FG * k, 0)); lFG.position.set(x0 - 0.035, cy - FG * k - 0.012, 0.03);
          aFR.set(new THREE.Vector3(HX + 0.045, cy, 0.03), new THREE.Vector3(0, -FR * k * 2, 0)); lFR.position.set(HX + 0.085, cy - FR * k * 2, 0.03); aFR.visible = lFR.visible = Math.abs(FR) > 0.01;
          aV.set(new THREE.Vector3(HX + 0.075, cy, 0.03), new THREE.Vector3(0, -S.v * 0.25, 0)); lV.position.set(HX + 0.105, cy - S.v * 0.25, 0.03); aV.visible = lV.visible = Math.abs(S.v) > 0.01;
          restM.position.set(HX, Y_HOOK - 0.01 - (S.spring.L0 + s0()) - 0.012 - HANGER * 0.55, 0.031); lRest.position.set(HX - 0.12, restM.position.y, 0.031);
        }
      });
      return { destroy() { off(); cvs.removeEventListener('pointerdown', onDown); cvs.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); springMesh?.dispose(); lab.dispose(); } };
    }

    // ---------------- Ansicht 2D (Seitenansicht, maßstäblich) ----------------
    async function view2d(box, MM) {
      const SC = 560, Yp = y => 600 - y * SC, HXp = 360;
      box.insertAdjacentHTML('beforeend', `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Federpendel in Seitenansicht mit Stativ, Feder, Pendelkörper, Maßstab und Ultraschallsensor">
<defs>
  <linearGradient id="fpBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14181b"/><stop offset="1" stop-color="#0b0d0f"/></linearGradient>
  <linearGradient id="fpSteel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6c7378"/><stop offset=".45" stop-color="#e6e8ea"/><stop offset="1" stop-color="#6c7378"/></linearGradient>
  <linearGradient id="fpDisc" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5d6367"/><stop offset=".4" stop-color="#c9ced2"/><stop offset="1" stop-color="#5d6367"/></linearGradient>
  <marker id="fpA1" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#f2ac74"/></marker>
  <marker id="fpA2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#6fa8ff"/></marker>
  <marker id="fpA3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#ff4b3e"/></marker>
  <marker id="fpA4" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#5fe0ff"/></marker>
</defs>
<rect width="1000" height="620" fill="url(#fpBg)"/>
<rect x="0" y="600" width="1000" height="20" fill="#24282b"/>
<rect x="${HXp - 0.2 * SC - 60}" y="588" width="150" height="12" rx="2" fill="#2f4a6b"/>
<rect x="${HXp - 0.2 * SC - 3.5}" y="${Yp(1.02)}" width="7" height="${1.02 * SC - 12}" fill="url(#fpSteel)"/>
<rect x="${HXp - 0.2 * SC - 3.5}" y="${Yp(Y_HOOK + 0.02) - 3}" width="${0.2 * SC + 12}" height="6" fill="url(#fpSteel)"/>
<rect x="${HXp - 0.2 * SC - 12}" y="${Yp(Y_HOOK + 0.02) - 14}" width="24" height="28" rx="3" fill="#6b7075"/>
<!-- Maßstab -->
<g transform="translate(${HXp + 0.05 * SC} ${Yp(Y_HOOK)})">
  <rect x="-1" y="0" width="22" height="${0.9 * SC}" fill="#e8e3d6" stroke="#9c968a"/>
  ${Array.from({ length: 91 }, (_, i) => `<rect x="0" y="${(i / 100 * SC).toFixed(1)}" width="${i % 10 === 0 ? 12 : i % 5 === 0 ? 8 : 4}" height="1" fill="#222"/>${i % 10 === 0 && i ? `<text x="20" y="${(i / 100 * SC + 3).toFixed(1)}" font-size="9" fill="#222" text-anchor="end">${i}</text>` : ''}`).join('')}
</g>
<path id="fpSpring" fill="none" stroke="#d6dadd" stroke-width="2.2" stroke-linejoin="round"/>
<g id="fpBody"></g>
<!-- Sensor -->
<rect x="${HXp - 21}" y="${Yp(0.04)}" width="42" height="${0.04 * SC}" rx="3" fill="#1f4fb8"/><rect x="${HXp - 11}" y="${Yp(0.048)}" width="22" height="5" fill="#b59a52"/>
<circle id="fpLed" cx="${HXp + 14}" cy="${Yp(0.025)}" r="2.4" fill="#113311"/>
<g id="fpWaves" fill="none" stroke="#86dcff" stroke-width="1.4"></g>
<text x="${HXp + 30}" y="${Yp(0.02)}" fill="#8e979d" font-size="11">Ultraschallsensor</text>
<!-- Modell -->
<g id="fpModel" opacity="0">
  <line id="fpRest" stroke="#ab93ff" stroke-dasharray="6 5" stroke-width="1.4"/><text id="fpRestT" fill="#c7b6ff" font-size="12">Ruhelage</text>
  <line id="fpFF" stroke="#f2ac74" stroke-width="4" marker-end="url(#fpA1)"/><text id="fpFFt" fill="#f2ac74" font-size="13" font-weight="600">F_Feder</text>
  <line id="fpFG" stroke="#6fa8ff" stroke-width="4" marker-end="url(#fpA2)"/><text id="fpFGt" fill="#8cb8ff" font-size="13" font-weight="600">F_G</text>
  <line id="fpFR" stroke="#ff4b3e" stroke-width="5" marker-end="url(#fpA3)"/><text id="fpFRt" fill="#ff7a6a" font-size="13" font-weight="600">F_res = −D·y</text>
  <line id="fpV" stroke="#5fe0ff" stroke-width="3" marker-end="url(#fpA4)"/><text id="fpVt" fill="#5fe0ff" font-size="13" font-weight="600">v</text>
  <line id="fpY" stroke="#ece6dc" stroke-width="1.2"/><text id="fpYt" fill="#ece6dc" font-size="12">y</text>
</g>
<text x="24" y="34" fill="#8e979d" font-size="13">Seitenansicht (maßstäblich) · Pendelkörper mit der Maus ziehen</text>
</svg>`);
      const svg = box.querySelector('svg'); const q = id => svg.querySelector('#' + id);
      const toY = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()).y; };
      let drag = null;
      q('fpBody').style.cursor = 'grab';
      q('fpBody').addEventListener('pointerdown', e => { drag = toY(e) / SC - S.y; svg.setPointerCapture(e.pointerId); S.held = true; });
      svg.addEventListener('pointermove', e => { if (drag == null) return; S.y = clampY(toY(e) / SC - drag); S.v = 0; });
      svg.addEventListener('pointerup', () => { drag = null; S.held = false; });
      let raf = 0, wavePh = 0, last = performance.now();
      function frame(now) {
        raf = requestAnimationFrame(frame); const dt = Math.min(0.05, (now - last) / 1000); last = now;
        const L = S.spring.L0 + s0() + S.y, top = Y_HOOK - 0.01, bot = top - L;
        // Feder als Zickzack mit Windungszahl der echten Feder (gedrittelt für Lesbarkeit)
        const n = Math.round(S.spring.turns / 2), w = S.spring.R * SC * 1.1; let d = `M${HXp} ${Yp(Y_HOOK)} L${HXp} ${Yp(top)}`;
        for (let i = 0; i <= n * 2; i++) d += ` L${(HXp + (i === 0 || i === n * 2 ? 0 : (i % 2 ? w : -w))).toFixed(1)} ${Yp(top - L * i / (n * 2)).toFixed(1)}`;
        d += ` L${HXp} ${Yp(bot - 0.012)}`; q('fpSpring').setAttribute('d', d);
        const by = bot - 0.012, nd = Math.round(S.m / 0.05) - 1;
        let b = `<rect x="${HXp - 1.5}" y="${Yp(by)}" width="3" height="${(HANGER - 0.006) * SC}" fill="#c9ced2"/><rect x="${HXp - 0.02 * SC}" y="${Yp(by - HANGER + 0.006)}" width="${0.04 * SC}" height="${0.006 * SC}" fill="#c8a24a"/>`;
        for (let i = 0; i < nd; i++) b += `<rect x="${HXp - 0.02 * SC}" y="${Yp(by - HANGER + 0.006 + (i + 1) * 0.0054)}" width="${0.04 * SC}" height="${0.0052 * SC}" rx="1" fill="url(#fpDisc)" stroke="#2a2e31" stroke-width=".5"/>`;
        b += `<rect x="${HXp - 0.03 * SC}" y="${Yp(by + 0.01)}" width="${0.06 * SC}" height="${(HANGER + 0.02) * SC}" fill="transparent"/>`;
        q('fpBody').innerHTML = b;
        q('fpLed').setAttribute('fill', S.rec ? '#3dff6a' : '#113311');
        const yb = yBottom();
        if (S.rec) { wavePh = (wavePh + dt * 1.6) % 1; let h = ''; for (let k = 0; k < 3; k++) { const f = (wavePh + k / 3) % 1, yy = SENSOR_TOP + f * (yb - SENSOR_TOP); h += `<path d="M${HXp - 16} ${Yp(yy)} Q${HXp} ${Yp(yy) - 7} ${HXp + 16} ${Yp(yy)}" opacity="${(1 - f).toFixed(2)}"/>`; } q('fpWaves').innerHTML = h; } else q('fpWaves').innerHTML = '';
        // Modell
        q('fpModel').setAttribute('opacity', MM.model ? 1 : 0);
        if (MM.model) {
          const D = Dreal(), k = 0.06 * SC, cy = by - HANGER * 0.55;
          const FF = D * (s0() + S.y), FG = S.m * G, FR = FG - FF - DAMP[S.damp] * S.v;
          const line = (id, x, y1, y2) => { const l = q(id); l.setAttribute('x1', x); l.setAttribute('x2', x); l.setAttribute('y1', y1); l.setAttribute('y2', y2); };
          const xL = HXp - 46, xR = HXp + 46;
          line('fpFF', xL, Yp(cy), Yp(cy) - FF * k); q('fpFFt').setAttribute('x', xL - 70); q('fpFFt').setAttribute('y', Yp(cy) - FF * k + 4);
          line('fpFG', xL - 14, Yp(cy), Yp(cy) + FG * k); q('fpFGt').setAttribute('x', xL - 46); q('fpFGt').setAttribute('y', Yp(cy) + FG * k + 14);
          const showR = Math.abs(FR) > 0.01; q('fpFR').style.display = q('fpFRt').style.display = showR ? '' : 'none';
          line('fpFR', xR, Yp(cy), Yp(cy) + FR * k * 2); q('fpFRt').setAttribute('x', xR + 10); q('fpFRt').setAttribute('y', Yp(cy) + FR * k * 2 + 4);
          const showV = Math.abs(S.v) > 0.01; q('fpV').style.display = q('fpVt').style.display = showV ? '' : 'none';
          line('fpV', xR + 30, Yp(cy), Yp(cy) + S.v * 0.25 * SC); q('fpVt').setAttribute('x', xR + 38); q('fpVt').setAttribute('y', Yp(cy) + S.v * 0.25 * SC);
          const restY = Yp(cy - S.y);
          const r = q('fpRest'); r.setAttribute('x1', HXp - 150); r.setAttribute('x2', HXp + 150); r.setAttribute('y1', restY); r.setAttribute('y2', restY);
          q('fpRestT').setAttribute('x', HXp - 220); q('fpRestT').setAttribute('y', restY + 4);
          line('fpY', HXp + 128, restY, Yp(cy)); q('fpYt').setAttribute('x', HXp + 134); q('fpYt').setAttribute('y', (restY + Yp(cy)) / 2 + 4);
          q('fpY').style.display = q('fpYt').style.display = Math.abs(S.y) > 0.003 ? '' : 'none';
        }
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); } };
    }

    const host = viewHost(stage, { id: 'federpendel', views: { '3d': view3d, '2d': view2d }, initial: '3d', modelInfo: 'Kräfte, Energie und Zeiger' });
    host.onModel(on => { ov.hidden = !on; });

    // ---------------- Hauptschleife: Physik (RK4) und Messung ----------------
    let raf = 0, last = performance.now(), redrawAcc = 0;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const h = 0.0005, n = Math.round(dt / h);
      const D = Dreal(), m = meff(), b = DAMP[S.damp];
      const acc = (y, v) => (-D * y - b * v) / m;
      for (let i = 0; i < n; i++) {
        if (!S.held) {
          const k1y = S.v, k1v = acc(S.y, S.v);
          const k2y = S.v + h / 2 * k1v, k2v = acc(S.y + h / 2 * k1y, S.v + h / 2 * k1v);
          const k3y = S.v + h / 2 * k2v, k3v = acc(S.y + h / 2 * k2y, S.v + h / 2 * k2v);
          const k4y = S.v + h * k3v, k4v = acc(S.y + h * k3y, S.v + h * k3v);
          S.y += h / 6 * (k1y + 2 * k2y + 2 * k3y + k4y); S.v += h / 6 * (k1v + 2 * k2v + 2 * k3v + k4v);
        }
        if (S.rec) {
          const tn = S.t + h; const kPrev = Math.floor(S.t / S.dtS + 1e-9), kNow = Math.floor(tn / S.dtS + 1e-9); S.t = tn;
          if (kNow > kPrev || S.data.length === 0) { const d = measureD(); S.data.push([+(kNow * S.dtS).toFixed(4), d, S.d0 - d]); }
          if (S.t >= S.dur) { stopRec(); break; }
        }
      }
      const d = yBottom() - SENSOR_TOP;
      dD.set(`${fmt(d * 100, 1)} cm`); dY.set(S.d0 == null ? '– (Nullpunkt?)' : `${fmt((S.d0 - d) * 100, 1)} cm`);
      dR.set(`${fmt((Y_HOOK - yBottom()) * 100, 1)} cm`); dTth.set(`${fmt(2 * Math.PI * Math.sqrt(S.m / S.spring.D), 3)} s`);
      if (!ov.hidden) drawOverlay(dt);
      redrawAcc += dt; if (S.rec && redrawAcc > 0.2) { redrawAcc = 0; drawY(); }
    }
    raf = requestAnimationFrame(loop);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); chY.destroy(); chT.destroy(); } };
  }
};
