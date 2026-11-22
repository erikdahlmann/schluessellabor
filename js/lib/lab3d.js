// ============================================================================
//  lab3d.js – gemeinsame 3D-Laborumgebung für alle WebGL-Versuche
//  Tisch, Raumlicht, Umgebungsreflexe, Bloom-Glühen, Kamera-Steuerung und
//  wiederverwendbare Geräte: Netzgerät mit Digitalanzeige, 4-mm-Buchsen, Kabel.
//  1 Szeneneinheit = 1 Meter (realistische Größen!)
// ============================================================================
let T = null;
export async function loadThree() {
  if (T) return T;
  const [THREE, { OrbitControls }, { RoomEnvironment }, { EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
    import('three'),
    import('three/addons/controls/OrbitControls.js'),
    import('three/addons/environments/RoomEnvironment.js'),
    import('three/addons/postprocessing/EffectComposer.js'),
    import('three/addons/postprocessing/RenderPass.js'),
    import('three/addons/postprocessing/UnrealBloomPass.js'),
    import('three/addons/postprocessing/OutputPass.js')
  ]);
  T = { THREE, OrbitControls, RoomEnvironment, EffectComposer, RenderPass, UnrealBloomPass, OutputPass };
  return T;
}

function tableTexture(THREE) {
  const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d');
  g.fillStyle = '#2c2f31'; g.fillRect(0, 0, 1024, 1024);
  const img = g.getImageData(0, 0, 1024, 1024), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - .5) * 14; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
  g.globalAlpha = .05; g.strokeStyle = '#000';
  for (let i = 0; i < 90; i++) { g.beginPath(); const x = Math.random() * 1024; g.moveTo(x, 0); g.bezierCurveTo(x + 30, 300, x - 30, 700, x + 10, 1024); g.lineWidth = Math.random() * 3; g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export async function createLab(stage, opts = {}) {
  const { THREE, OrbitControls, RoomEnvironment, EffectComposer, RenderPass, UnrealBloomPass, OutputPass } = await loadThree();
  const o = Object.assign({ fov: 38, cam: [0.9, 0.7, 1.3], target: [0, 0.25, 0], table: [3.2, 1.6], bloom: [0.9, 0.55, 0.82], room: 1 }, opts);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07090a);
  scene.fog = new THREE.Fog(0x07090a, 3.5, 9);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(o.fov, 1, 0.01, 40);
  camera.position.set(...o.cam);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...o.target); controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minDistance = o.minDist || 0.25; controls.maxDistance = o.maxDist || 4.5; controls.maxPolarAngle = Math.PI * 0.495;
  controls.update();

  // Licht
  const hemi = new THREE.HemisphereLight(0xdfe8ff, 0x1a1410, 0.6); scene.add(hemi);
  const key = new THREE.SpotLight(0xfff1e0, 60, 9, Math.PI / 5, 0.6, 1.6);
  key.position.set(1.4, 2.8, 1.6); key.target.position.set(0, 0, 0); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0002; key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x9fc4ff, 0.5); rim.position.set(-2, 1.5, -2); scene.add(rim);

  // Tisch (Laborbank, 3 cm Platte, Höhe y = 0)
  const tbl = new THREE.Mesh(new THREE.BoxGeometry(o.table[0], 0.03, o.table[1]),
    new THREE.MeshStandardMaterial({ map: tableTexture(THREE), roughness: 0.82, metalness: 0.0 }));
  tbl.position.y = -0.015; tbl.receiveShadow = true; scene.add(tbl);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(o.table[0], 0.008, 0.012), new THREE.MeshStandardMaterial({ color: 0x8a8f93, metalness: 0.9, roughness: 0.35 }));
  edge.position.set(0, -0.012, o.table[1] / 2); scene.add(edge);
  // Rückwand mit dezenter Kachelstruktur
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(12, 5), new THREE.MeshStandardMaterial({ color: 0x15191c, roughness: 1 }));
  wall.position.set(0, 2, -o.table[1] / 2 - 0.9); scene.add(wall);

  // Postprocessing (Bloom für glühende Kathoden, Elektronenstrahl, LEDs)
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), o.bloom[0], o.bloom[1], o.bloom[2]);
  composer.addPass(bloom); composer.addPass(new OutputPass());

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  function setRoom(level) { // 0 = abgedunkelt … 1 = volles Raumlicht
    hemi.intensity = 0.08 + 0.55 * level; key.intensity = 2 + 17 * level; rim.intensity = 0.08 + 0.45 * level;
    scene.environmentIntensity = 0.06 + 0.4 * level; renderer.toneMappingExposure = 0.85 + 0.25 * level;
  }
  setRoom(o.room);

  const frameFns = new Set(); let raf = 0, last = performance.now(), visible = true, alive = true;
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; }); io.observe(stage);
  function loop(now) {
    if (!alive) return; raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    for (const f of frameFns) f(dt, now / 1000);
    if (!visible || document.hidden) return;
    controls.update(); composer.render();
  }
  raf = requestAnimationFrame(loop);

  return {
    THREE, scene, camera, renderer, controls, bloom, setRoom,
    onFrame: f => (frameFns.add(f), () => frameFns.delete(f)),
    dispose() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); controls.dispose(); composer.dispose?.(); renderer.dispose(); pmrem.dispose(); renderer.domElement.remove(); }
  };
}

// ---------------------------------------------------------------------------
//  Gerätebausteine
// ---------------------------------------------------------------------------
export const MAT = {}; // Materialcache je THREE-Instanz
export function mats(THREE) {
  if (MAT.ok) return MAT;
  Object.assign(MAT, {
    ok: true,
    housing: new THREE.MeshStandardMaterial({ color: 0x2b3034, roughness: 0.55, metalness: 0.2 }),
    housingLight: new THREE.MeshStandardMaterial({ color: 0xc9cbc8, roughness: 0.5, metalness: 0.1 }),
    front: new THREE.MeshStandardMaterial({ color: 0x1b1e21, roughness: 0.7 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xb9bec2, roughness: 0.28, metalness: 1 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xe6e8ea, roughness: 0.12, metalness: 1 }),
    black: new THREE.MeshStandardMaterial({ color: 0x101214, roughness: 0.5 }),
    knob: new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.35, metalness: 0.1 }),
    red: new THREE.MeshStandardMaterial({ color: 0xc4231b, roughness: 0.4 }),
    blue: new THREE.MeshStandardMaterial({ color: 0x1f4fb8, roughness: 0.4 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xd8b21c, roughness: 0.4 }),
    sblack: new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.4 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xb8692f, roughness: 0.32, metalness: 1 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc8a24a, roughness: 0.3, metalness: 1 })
  });
  return MAT;
}

// LCD/LED-Anzeige als CanvasTexture
export function makeDisplay(THREE, w = 256, h = 96, { color = '#ff5a3c', bg = '#160807' } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  let lastTxt = '';
  function draw(txt, unit = '') {
    const key = txt + unit; if (key === lastTxt) return; lastTxt = key;
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = color; g.shadowColor = color; g.shadowBlur = 10;
    g.font = `600 ${h * 0.62}px "IBM Plex Mono", monospace`; g.textAlign = 'right'; g.textBaseline = 'middle';
    g.fillText(txt, w - (unit ? h * 0.75 : 10), h / 2 + 2);
    if (unit) { g.font = `500 ${h * 0.3}px "IBM Plex Sans", sans-serif`; g.fillText(unit, w - 6, h * 0.68); }
    tex.needsUpdate = true;
  }
  return { tex, draw };
}

export function socket(THREE, color = 'red') {
  const M = mats(THREE);
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.0062, 0.0062, 0.008, 20), M[color === 'black' ? 'sblack' : color] || M.red);
  ring.rotation.x = Math.PI / 2; g.add(ring);
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.0085, 12), M.brass);
  hole.rotation.x = Math.PI / 2; g.add(hole);
  return g;
}

// Netzgerät: Gehäuse mit Frontplatte, Anzeigen, Drehknöpfen, Buchsen
export function powerSupply(THREE, { w = 0.26, h = 0.15, d = 0.24, label = '', displays = 1, knobs = 1, sockets = ['red', 'black'], color = 'dark', dispColor } = {}) {
  const M = mats(THREE);
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), color === 'light' ? M.housingLight : M.housing);
  body.position.y = h / 2; body.castShadow = body.receiveShadow = true; g.add(body);
  const front = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, h * 0.9, 0.004), M.front);
  front.position.set(0, h / 2, d / 2 + 0.002); g.add(front);
  for (const sx of [-1, 1]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.008, d * 0.8), M.black); f.position.set(sx * (w / 2 - 0.02), 0.004, 0); g.add(f); }
  const zf = d / 2 + 0.0045;
  g.displays = []; g.knobs = []; g.sockets = [];
  const dw = Math.min(0.085, (w * 0.9) / Math.max(displays, 1) - 0.012);
  for (let i = 0; i < displays; i++) {
    const disp = makeDisplay(THREE, 256, 96, dispColor ? { color: dispColor[0], bg: dispColor[1] } : undefined);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(dw, dw * 0.375), new THREE.MeshBasicMaterial({ map: disp.tex, toneMapped: false }));
    m.position.set(-w * 0.45 + dw / 2 + 0.008 + i * (dw + 0.012), h * 0.6, zf); g.add(m); g.displays.push(disp);
  }
  for (let i = 0; i < knobs; i++) {
    const k = new THREE.Group();
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.0135, 0.016, 28), M.knob); cap.rotation.x = Math.PI / 2; k.add(cap);
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.0018, 0.008, 0.0012), new THREE.MeshBasicMaterial({ color: 0xffffff })); mark.position.set(0, 0.006, 0.0085); k.add(mark);
    k.position.set(-w * 0.45 + 0.022 + i * 0.045, h * 0.27, zf + 0.008); g.add(k); g.knobs.push(k);
  }
  sockets.forEach((c, i) => {
    const s = socket(THREE, c); s.position.set(w * 0.45 - 0.014 - (sockets.length - 1 - i) * 0.022, h * 0.25, zf + 0.004); g.add(s); g.sockets.push(s);
  });
  if (label) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 64; const x = c.getContext('2d');
    x.fillStyle = '#c9c3ba'; x.font = '500 30px "IBM Plex Sans", sans-serif'; x.textBaseline = 'middle'; x.fillText(label, 6, 32);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, w * 0.9 / 8), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
    m.position.set(0, h * 0.94 - w * 0.9 / 16 - 0.004, zf + 0.0005); g.add(m);
  }
  g.setKnob = (i, frac) => { if (g.knobs[i]) g.knobs[i].rotation.z = 2.4 - frac * 4.8; };
  g.socketWorld = i => g.sockets[i].getWorldPosition(new THREE.Vector3());
  return g;
}

// Experimentierkabel mit Stecker (Bezier-Durchhang)
export function cable(THREE, a, b, color = 0xc4231b, sag = 0.12) {
  const mid = a.clone().lerp(b, 0.5); mid.y = Math.min(a.y, b.y) - sag; if (mid.y < 0.006) mid.y = 0.006;
  const p1 = a.clone().lerp(mid, 0.5); p1.z += 0.04 * Math.sign(a.z - b.z || 1);
  const curve = new THREE.CatmullRomCurve3([a.clone().add(new THREE.Vector3(0, 0, 0.03)), p1, mid, b.clone().add(new THREE.Vector3(0, 0, 0.03))]);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.45 });
  const g = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.0032, 8, false), mat); tube.castShadow = true; g.add(tube);
  for (const [p, q] of [[a, curve.points[0]], [b, curve.points[3]]]) {
    const plug = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.005, 0.03, 14), mat);
    plug.position.copy(p).lerp(q, 0.5); plug.lookAt(q); plug.rotateX(Math.PI / 2); g.add(plug);
  }
  return g;
}
