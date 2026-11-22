// ============================================================================
//  Schlüsselexperiment: Federpendel
//  3D-Aufbau (Three.js): Stativ mit Doppelmuffe, Schraubenfeder, Hakenkörper
//  mit Schlitzgewichten, Maßstab, Ultraschall-Bewegungssensor + Interface.
//  Physik: m_eff·ÿ = −D·y − b·ẏ  mit  m_eff = m + m_F/3  (reale Feder hat Masse)
// ============================================================================
import { createLab, mats, makeDisplay, cable, powerSupply } from '../js/lib/lab3d.js';

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
<span class="formula">m·ÿ = −D·y   ⇒   y(t) = ŷ·cos(ω·t),   ω = √(D/m)</span>
<span class="formula">T = 2π·√(m/D)</span>
<p>Die Periodendauer hängt <b>nicht</b> von der Amplitude und nicht vom Ortsfaktor <i>g</i> ab.</p>
<h3>Federmasse</h3>
<p>Eine reale Feder schwingt mit. Näherungsweise wirkt ein Drittel ihrer Masse wie zusätzliche Pendelmasse:</p>
<span class="formula">T = 2π·√((m + m<sub>F</sub>/3)/D)   ⇒   T² = (4π²/D)·m + (4π²/D)·m<sub>F</sub>/3</span>
<h3>Dämpfung</h3>
<p>Luftreibung (und im Wasser die Flüssigkeitsreibung) lässt die Amplitude exponentiell abklingen: <i>ŷ(t) = ŷ₀·e<sup>−δt</sup></i> mit <i>δ = b/(2m)</i>. Bei schwacher Dämpfung ändert sich <i>T</i> praktisch nicht.</p>
<h3>Energie</h3>
<p>Kinetische Energie und Spannenergie (bezogen auf die Ruhelage) wandeln sich periodisch ineinander um: <i>E = ½·D·ŷ²</i>.</p>
<h3>Modellgrenzen dieser Simulation</h3>
<ul><li>Federkonstanten weichen wie bei echten Federn um bis zu ±4 % vom Nennwert ab.</li>
<li>Ultraschallsensor: Auflösung ca. 0,3 mm (Rauschen), Abtastung wählbar. Die Federmasse ist realistisch berücksichtigt; per Häkchen lässt sich eine ideale, masselose Feder einstellen.</li></ul>`,
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
    const lab = await createLab(stage, { cam: [1.12, 0.78, 1.42], target: [0.22, 0.5, 0], table: [6, 3], bloom: [0.3, 0.4, 0.97], room: 1, maxDist: 3 });
    const { THREE, scene } = lab; const M = mats(THREE);
    stage.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad · Pendelkörper anfassen und nach unten ziehen</div>');

    // ---------------- Aufbau ----------------
    const HX = 0.2; // x-Position der Aufhängung
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.022, 0.17), new THREE.MeshStandardMaterial({ color: 0x2f4a6b, roughness: 0.5, metalness: 0.3 }));
    base.position.set(0.02, 0.011, 0); base.castShadow = base.receiveShadow = true; scene.add(base);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.004, 12), M.black); f.position.set(0.02 + sx * 0.11, 0.002, sz * 0.07); scene.add(f); }
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.0, 24), M.steel); rod.position.set(0, 0.52, 0); rod.castShadow = true; scene.add(rod);
    const muff = new THREE.Group();
    const mb = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.05, 0.035), new THREE.MeshStandardMaterial({ color: 0x6b7075, metalness: 0.8, roughness: 0.35 })); muff.add(mb);
    for (const [x, z, ry] of [[0, 0.028, 0], [0.028, 0, Math.PI / 2]]) {
      const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.02, 8), M.steel); sc.rotation.x = Math.PI / 2; sc.position.set(x, 0, z); sc.rotation.y = ry; muff.add(sc);
      const kb = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.006, 16), M.knob); kb.rotation.x = Math.PI / 2; kb.position.set(x * 1.5, 0, z * 1.5); kb.rotation.y = ry; muff.add(kb);
    }
    muff.position.set(0, Y_HOOK + 0.02, 0); muff.castShadow = true; scene.add(muff);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.27, 20), M.steel); arm.rotation.z = Math.PI / 2; arm.position.set(0.12, Y_HOOK + 0.02, 0); arm.castShadow = true; scene.add(arm);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.007, 0.0016, 8, 20, Math.PI * 1.5), M.steel); hook.position.set(HX, Y_HOOK + 0.007, 0); hook.rotation.z = Math.PI * 0.75; scene.add(hook);
    // Maßstab (0 cm in Höhe des Hakens)
    const rSide = new THREE.MeshStandardMaterial({ color: 0x9a968c, roughness: 0.9 });
    const ruler = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.9, 0.004), [rSide, rSide, rSide, rSide, new THREE.MeshStandardMaterial({ map: rulerTexture(THREE), roughness: 0.85, color: 0xcfcac0 }), rSide]);
    ruler.position.set(HX + 0.05, Y_HOOK - 0.45, -0.035); ruler.castShadow = true; scene.add(ruler);
    const rHold = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.035), M.steel); rHold.position.set(HX + 0.05, Y_HOOK + 0.012, -0.018); scene.add(rHold);
    // Ultraschallsensor
    const sensor = new THREE.Group();
    const sb = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.04, 0.06), new THREE.MeshStandardMaterial({ color: 0x1f4fb8, roughness: 0.45 })); sb.position.y = 0.02; sb.castShadow = true; sensor.add(sb);
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.008, 32), new THREE.MeshStandardMaterial({ color: 0xb59a52, metalness: 0.9, roughness: 0.55 })); tr.position.y = 0.044; sensor.add(tr);
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(0.016, 32), new THREE.MeshStandardMaterial({ color: 0x222, roughness: 0.9 })); mesh.rotation.x = -Math.PI / 2; mesh.position.y = 0.0485; sensor.add(mesh);
    const sLed = new THREE.Mesh(new THREE.SphereGeometry(0.0025, 10, 10), new THREE.MeshBasicMaterial({ color: 0x113311 })); sLed.position.set(0.028, 0.03, 0.031); sensor.add(sLed);
    sensor.position.set(HX, 0, 0); scene.add(sensor);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.06, 1, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0x86dcff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    cone.rotation.x = Math.PI; scene.add(cone);
    // Interface
    const iface = powerSupply(THREE, { w: 0.2, h: 0.09, d: 0.15, label: 'Messinterface · Ultraschall', displays: 1, knobs: 0, sockets: ['yellow', 'black'], color: 'light', dispColor: ['#b7ffd6', '#0b1410'] });
    iface.position.set(0.5, 0, 0.02); iface.rotation.y = -0.45; scene.add(iface);
    iface.updateMatrixWorld(true);
    scene.add(cable(THREE, new THREE.Vector3(HX + 0.04, 0.02, 0), iface.socketWorld(0), 0x161616, 0.0));

    // ---------------- Pendelkörper ----------------
    const body = new THREE.Group(); scene.add(body);
    const hangerRod = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, HANGER - 0.008, 12), M.steel); hangerRod.position.y = -(HANGER - 0.008) / 2 - 0.008; body.add(hangerRod);
    const hHook = new THREE.Mesh(new THREE.TorusGeometry(0.006, 0.0014, 8, 18), M.steel); hHook.position.y = -0.005; body.add(hHook);
    const hBase = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.006, 40), M.brass); hBase.position.y = -HANGER + 0.003; hBase.castShadow = true; body.add(hBase);
    const discGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.0052, 40);
    const discMat = new THREE.MeshStandardMaterial({ color: 0x8d9398, metalness: 0.9, roughness: 0.35 });
    const discs = []; for (let i = 0; i < 9; i++) { const d = new THREE.Mesh(discGeo, discMat); d.position.y = -HANGER + 0.006 + 0.0028 + i * 0.0054; d.castShadow = true; d.visible = false; body.add(d); discs.push(d); }
    const pickables = [hangerRod, hBase, ...discs];

    // ---------------- Zustand ----------------
    const S = { spring: SPRINGS[1], m: 0.2, ideal: false, damp: 'luft', y: 0, v: 0, held: false, rec: false, t: 0, dtS: 0.02, dur: 10, d0: null, data: [] };
    let springMesh = null;
    const Dreal = () => S.spring.D * TOL[S.spring.id];
    const meff = () => S.m + (S.ideal ? 0 : S.spring.mF / 3);
    const s0 = () => S.m * G / Dreal();
    function buildSpring() { if (springMesh) { scene.remove(springMesh); springMesh.dispose(); } springMesh = makeSpring(THREE, S.spring); springMesh.position.set(HX, Y_HOOK, 0); scene.add(springMesh); }
    function setDiscs() { const n = Math.round(S.m / 0.05) - 1; discs.forEach((d, i) => { d.visible = i < n; }); }
    const yBottom = () => Y_HOOK - 0.01 - (S.spring.L0 + s0() + S.y) - 0.012 - HANGER;

    // ---------------- Bedienfeld ----------------
    const gF = group('Feder und Pendelkörper');
    const sSpring = selectBox({ label: 'Schraubenfeder', value: 'B', options: SPRINGS.map(s => ({ value: s.id, label: `${s.name} (D ≈ ${s.D} N/m)` })), onChange: v => { S.spring = SPRINGS.find(s => s.id === v); clampMass(); buildSpring(); rest(); } });
    const sMass = slider({ label: 'Masse m (Haken + Schlitzgewichte)', min: 50, max: 500, step: 50, value: 200, unit: 'g', onInput: v => { S.m = v / 1000; clampMass(); setDiscs(); rest(); } });
    const cIdeal = check({ label: 'Ideale Feder (masselos)', onChange: v => { S.ideal = v; } });
    const sDamp = selectBox({ label: 'Dämpfung', value: 'luft', options: [{ value: 'luft', label: 'gering (Luftreibung)' }, { value: 'pappe', label: 'mittel (Pappscheibe)' }, { value: 'wasser', label: 'stark (Pendelkörper im Wasser)' }], onChange: v => { S.damp = v; } });
    gF.append(sSpring, sMass, cIdeal, sDamp);
    function clampMass() {
      const max = Math.floor(S.spring.Fmax / G / 0.05) * 0.05;
      if (S.m > max + 1e-9) { S.m = max; sMass.set(Math.round(max * 1000)); toast(`${S.spring.name}: höchstens ${Math.round(max * 1000)} g, sonst wird die Feder überdehnt.`); }
      setDiscs();
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
    const dD = display('Abstand Sensor'), dY = display('Auslenkung y'), dR = display('Unterkante am Maßstab');
    const gL = group('Live-Werte'); gL.append(dD, dY, dR);
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

    function drawY() {
      chY.set([{ points: S.data.map(p => [p[0], p[2] * 100]), color: '#86dcff' }]);
    }
    function drawT() {
      const sel = rows.filter(r => !r._bad);
      const feds = [...new Set(sel.map(r => r.feder))];
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
      sLed.material.color.set(0x3dff6a); cone.material.opacity = 0.05;
    }
    function stopRec() {
      S.rec = false; bRec.textContent = 'Messung starten'; gM.led(false); sLed.material.color.set(0x113311); cone.material.opacity = 0;
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
      const w = Math.sqrt(Dreal() / meff());
      if (Math.abs(S.y) < 0.004 && Math.abs(S.v) < 0.02) { toast('Das Pendel ruht – erst auslenken.'); return; }
      const T10 = 10 * 2 * Math.PI / w + gauss(0.12) + 0.06;
      const T = T10 / 10;
      rows.push({ meth: 'Stoppuhr', feder: S.spring.id, D: S.spring.D, m: S.m, T, sT: 0.15 / 10, A: Math.hypot(S.y, S.v / w) });
      tbl.render(rows); drawT(); toast(`Stoppuhr: 10 T = ${fmt(T10, 2)} s → T = ${fmt(T, 3)} s`);
    }
    function rest() { S.y = 0; S.v = 0; if (!S.rec) S.d0 = null; }

    // ---------------- Ziehen mit der Maus ----------------
    const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), plane = new THREE.Plane(), hit = new THREE.Vector3();
    let dragOff = 0;
    const cvs = lab.renderer.domElement;
    function setPtr(e) { const r = cvs.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, lab.camera); }
    function onDown(e) {
      setPtr(e); const h = ray.intersectObjects(pickables, false)[0]; if (!h) return;
      S.held = true; lab.controls.enabled = false; cvs.setPointerCapture(e.pointerId);
      const n = new THREE.Vector3().subVectors(lab.camera.position, h.point).setY(0).normalize();
      plane.setFromNormalAndCoplanarPoint(n, h.point); dragOff = h.point.y + S.y; cvs.style.cursor = 'grabbing';
    }
    function onMove(e) {
      if (!S.held) { setPtr(e); cvs.style.cursor = ray.intersectObjects(pickables, false).length ? 'grab' : ''; return; }
      setPtr(e); if (ray.ray.intersectPlane(plane, hit)) { S.y = Math.max(-s0() * 0.9, Math.min(Math.min(0.1, s0() * 0.9), dragOff - hit.y)); S.v = 0; }
    }
    function onUp() { if (!S.held) return; S.held = false; lab.controls.enabled = true; cvs.style.cursor = ''; }
    cvs.addEventListener('pointerdown', onDown); cvs.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);

    // ---------------- Simulation ----------------
    buildSpring(); setDiscs();
    const disp = iface.displays[0];
    let redrawAcc = 0;
    const off = lab.onFrame(dt => {
      const h = 0.0005; let n = Math.round(dt / h);
      const D = Dreal(), m = meff(), b = DAMP[S.damp];
      const acc = (y, v) => (-D * y - b * v) / m;
      for (let i = 0; i < n; i++) {
        if (!S.held) { // RK4
          const k1y = S.v, k1v = acc(S.y, S.v);
          const k2y = S.v + h / 2 * k1v, k2v = acc(S.y + h / 2 * k1y, S.v + h / 2 * k1v);
          const k3y = S.v + h / 2 * k2v, k3v = acc(S.y + h / 2 * k2y, S.v + h / 2 * k2v);
          const k4y = S.v + h * k3v, k4v = acc(S.y + h * k3y, S.v + h * k3v);
          S.y += h / 6 * (k1y + 2 * k2y + 2 * k3y + k4y); S.v += h / 6 * (k1v + 2 * k2v + 2 * k3v + k4v);
        }
        if (S.rec) {
          const tn = S.t + h; const kPrev = Math.floor(S.t / S.dtS + 1e-9), kNow = Math.floor(tn / S.dtS + 1e-9);
          S.t = tn;
          if (kNow > kPrev || S.data.length === 0) { const d = measureD(); S.data.push([+(kNow * S.dtS).toFixed(4), d, S.d0 - d]); }
          if (S.t >= S.dur) { stopRec(); break; }
        }
      }
      // Visualisierung
      const L = S.spring.L0 + s0() + S.y;
      springMesh.update(L);
      body.position.set(HX, Y_HOOK - 0.01 - L - 0.012, 0);
      const d = yBottom() - SENSOR_TOP;
      cone.scale.set(1, d, 1); cone.position.set(HX, SENSOR_TOP + d / 2, 0);
      disp.draw(fmt(d, 3), 'm');
      dD.set(`${fmt(d * 100, 1)} cm`); dY.set(S.d0 == null ? '– (Nullpunkt?)' : `${fmt((S.d0 - d) * 100, 1)} cm`);
      dR.set(`${fmt((Y_HOOK - yBottom()) * 100, 1)} cm`);
      redrawAcc += dt; if (S.rec && redrawAcc > 0.2) { redrawAcc = 0; drawY(); }
    });

    return {
      destroy() {
        off(); cvs.removeEventListener('pointerdown', onDown); cvs.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp);
        chY.destroy(); chT.destroy(); springMesh?.dispose(); lab.dispose();
      }
    };
  }
};
