// ============================================================================
//  Schlüsselexperiment: Flammenfärbung
//  Metallsalz in der nicht leuchtenden Brennerflamme. Atome werden thermisch angeregt
//  und senden Licht bestimmter Wellenlängen aus (bei Sr, Ca, Ba, Cu: Molekülbanden).
//  Handspektroskop mit Wellenlängenskala, Cobaltglas als Filter gegen das Na-Gelb.
// ============================================================================
import { viewHost } from '../js/lib/views.js';
import { lamRGB, rgbStr } from '../js/lib/optik.js';

const HC = 1239.84;                                      // eV·nm
// Linien [nm, Gewicht, Breite in nm]; Breite > 1 nm: Molekülbande
const SALTS = {
  na: { name: 'Natriumchlorid', el: 'Natrium', sym: 'Na', lines: [[589.3, 1, 0.7]], lv: [['3s', 0], ['3p', 2.10], ['4p', 3.75]], tr: [[1, 0, 589.3]] },
  li: { name: 'Lithiumchlorid', el: 'Lithium', sym: 'Li', lines: [[670.8, 1, 0.7], [610.4, 0.08, 0.7], [460.3, 0.04, 0.7]], lv: [['2s', 0], ['2p', 1.85], ['3d', 3.88]], tr: [[1, 0, 670.8], [2, 1, 610.4]] },
  k: { name: 'Kaliumchlorid', el: 'Kalium', sym: 'K', lines: [[766.5, 0.8, 0.7], [769.9, 0.6, 0.7], [404.5, 0.16, 0.7]], lv: [['4s', 0], ['4p', 1.62], ['5p', 3.06]], tr: [[1, 0, 766.5], [2, 0, 404.5]] },
  sr: { name: 'Strontiumchlorid', el: 'Strontium', sym: 'Sr', lines: [[606, 0.45, 6], [646, 0.85, 9], [682, 0.55, 7], [460.7, 0.12, 0.7]], band: true },
  ca: { name: 'Calciumchlorid', el: 'Calcium', sym: 'Ca', lines: [[554, 0.5, 9], [622, 0.85, 10], [422.7, 0.15, 0.7]], band: true },
  ba: { name: 'Bariumchlorid', el: 'Barium', sym: 'Ba', lines: [[513, 0.55, 7], [524, 0.45, 7], [553.5, 0.7, 0.8], [487, 0.25, 6]], band: true },
  cu: { name: 'Kupferchlorid', el: 'Kupfer', sym: 'Cu', lines: [[510, 0.6, 9], [525, 0.7, 9], [538, 0.5, 7], [465, 0.45, 9]], band: true }
};
const KEYS = Object.keys(SALTS);
const X_KEY = ['li', 'k', 'sr', 'ca', 'ba', 'cu'][Math.floor(Math.random() * 6)];
const FLAME = [[431, 0.05, 4], [516, 0.04, 5]];          // eigene Banden der Gasflamme (CH, C₂), schwach
const cobalt = nm => nm < 500 ? 0.75 : nm < 540 ? 0.3 : nm < 640 ? 0.01 : nm < 660 ? 0.25 : 0.7;

function emission(sample, filter) {
  let L = [...FLAME.map(l => [...l, 'g'])];
  const add = (k, f) => SALTS[k].lines.forEach(l => L.push([l[0], l[1] * f, l[2], k]));
  if (sample === 'mix') { add('na', 1); add('k', 0.06); }
  else if (sample === 'x') add(X_KEY, 1);
  else if (sample !== 'none') add(sample, 1);
  if (filter) L = L.map(l => [l[0], l[1] * cobalt(l[0]), l[2], l[3]]);
  return L;
}
const spec = (L, nm) => L.reduce((s, [c, w, b]) => s + w * Math.exp(-0.5 * ((nm - c) / Math.max(0.35, b / 2.355)) ** 2), 0);
function flameColor(L) {
  let r = 0, g = 0, b = 0, s = 0;
  for (const [c, w, bw] of L) { const [R, G, B] = lamRGB(c), eye = Math.exp(-0.5 * ((c - 560) / 95) ** 2) * Math.max(1, bw / 3); r += R * w * eye; g += G * w * eye; b += B * w * eye; s += w * eye; }
  const m = Math.max(r, g, b, 1); return [r / m, g / m, b / m, Math.min(1, s * 1.6)];
}

const svgMarkup = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Bunsenbrenner mit gefärbter Flamme, daneben das Bild im Handspektroskop mit Wellenlängenskala">
<defs>
  <linearGradient id="fBg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15181b"/><stop offset="1" stop-color="#0d0f11"/></linearGradient>
  <linearGradient id="fSteel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6c7378"/><stop offset=".5" stop-color="#cfd4d8"/><stop offset="1" stop-color="#6c7378"/></linearGradient>
  <radialGradient id="fFl" cx=".5" cy=".75" r=".7"><stop id="fF0" offset="0" stop-color="#fff"/><stop id="fF1" offset=".5" stop-color="#fa0"/><stop id="fF2" offset="1" stop-color="#fa0" stop-opacity="0"/></radialGradient>
  <filter id="fBlur"><feGaussianBlur stdDeviation="5"/></filter>
  <filter id="fSh3" x="-10%" y="-10%" width="130%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity=".55"/></filter>
</defs>
<rect width="1000" height="620" fill="url(#fBg2)"/>
<!-- Brenner -->
<ellipse cx="220" cy="560" rx="80" ry="14" fill="#2b3034"/>
<rect x="206" y="380" width="28" height="180" fill="url(#fSteel)"/>
<rect x="196" y="520" width="48" height="26" rx="4" fill="#5d646a"/>
<path id="fCone" d="M206 380 Q220 300 234 380 Z" fill="#4a7cff" opacity=".55" filter="url(#fBlur)"/>
<path id="fFlame" d="M196 380 C180 300 205 200 220 120 C235 200 260 300 244 380 Z" fill="url(#fFl)" filter="url(#fBlur)"/>
<!-- Magnesiastäbchen -->
<line x1="420" y1="250" x2="232" y2="330" stroke="#ddd" stroke-width="3"/><circle cx="232" cy="330" r="5" fill="#f4f1ea"/>
<text x="300" y="300" fill="#8e979d" font-size="11">Magnesiastäbchen mit Salz</text>
<g id="fCob" opacity="0"><rect x="300" y="160" width="14" height="170" rx="3" fill="#2a3fd0" opacity=".75"/><text x="318" y="152" fill="#8fa2ff" font-size="11">Cobaltglas</text></g>
<text id="fSaltT" x="220" y="600" fill="#ece6dc" font-size="14" text-anchor="middle"></text>
<!-- Modell: Energieniveaus und Atome -->
<g id="fMod" opacity="0">
  <rect x="560" y="30" width="410" height="240" rx="8" fill="rgba(10,12,14,.92)" stroke="#5a4b8a"/>
  <text id="fModT" x="574" y="52" fill="#c7b6ff" font-size="12"></text>
  <g id="fLv"></g>
  <g id="fAt"></g>
</g>
<!-- Spektroskop -->
<rect x="470" y="300" width="500" height="220" rx="12" fill="#1f2326" stroke="#3a4046" filter="url(#fSh3)"/>
<text x="486" y="324" fill="#c9c3ba" font-size="12">Blick ins Handspektroskop</text>
<foreignObject x="486" y="334" width="468" height="110"><canvas xmlns="http://www.w3.org/1999/xhtml" id="fSpec" width="936" height="220" style="width:100%;height:100%;display:block;border-radius:4px"></canvas></foreignObject>
<g id="fScale" font-family="IBM Plex Mono, monospace" font-size="10" fill="#c9c3ba"></g>
<g id="fMk" style="cursor:ew-resize"><line y1="334" y2="460" stroke="#ffd27a" stroke-width="1.4" stroke-dasharray="4 3"/><rect x="-12" y="460" width="24" height="40" fill="transparent"/><path d="M0 464 l8 12 h-16z" fill="#ffd27a"/></g>
<text id="fMkT" x="954" y="510" fill="#ffd27a" font-size="13" text-anchor="end" font-family="IBM Plex Mono, monospace"></text>
<text x="470" y="560" fill="#8e979d" font-size="12">Marker auf eine Linie ziehen, dann „Linie übernehmen“.</text>
</svg>`;

export default {
  intro: 'Ein Metallsalz färbt die Flamme des Bunsenbrenners: Natrium gelb, Lithium karminrot, Kalium violett. Im Handspektroskop zerfällt das Licht in einzelne Linien. Ihr messt die Wellenlängen, ordnet sie Elementen zu und bestimmt das Metall einer unbekannten Probe.',
  docs: {
    durchfuehrung: `
<h3>Aufbau</h3>
<p>Ein Bunsenbrenner brennt mit nicht leuchtender, blauer Flamme. Ein Magnesiastäbchen wird angefeuchtet, in ein Salz getaucht und in den Rand der Flamme gehalten. Die Flamme wird durch ein Handspektroskop mit Wellenlängenskala betrachtet. Ein Cobaltglas kann vor das Auge gehalten werden.</p>
<h3>Durchführung</h3>
<ol>
<li>Die Salze nacheinander in die Flamme bringen. Farbe der Flamme notieren.</li>
<li>Im Spektroskop den Marker auf die hellsten Linien ziehen und <b>Linie übernehmen</b>. Die Wellenlängen mit der Tabelle vergleichen.</li>
<li>Die unbekannte Probe X untersuchen und das Metall bestimmen.</li>
<li>Das Gemisch aus Natrium- und Kaliumsalz untersuchen: Welche Farbe sieht man? Was zeigt das Cobaltglas?</li>
<li>Strontium, Calcium und Kupfer im Spektroskop mit Natrium vergleichen: Was ist anders?</li>
</ol>
<p><b>Sicherheit:</b> Schutzbrille. Barium- und Kupfersalze sind giftig, nicht in den Mund nehmen und Hände waschen.</p>`,
    theorie: `
<h3>Thermische Anregung</h3>
<p>In der heißen Flamme (etwa 1500 °C) zerfällt das Salz teilweise in Atome. Bei Stößen werden Elektronen der Atome auf höhere Energieniveaus gehoben. Beim Zurückfallen senden sie ein Photon aus. Seine Energie ist genau der Abstand der beiden Niveaus:</p>
<span class="formula tex">E_\\text{Photon} = h\\, f = \\frac{h\\, c}{\\lambda} = E_2 - E_1 \\qquad \\lambda = \\frac{h\\, c}{\\Delta E} \\approx \\frac{1240\\ \\text{eV·nm}}{\\Delta E}</span>
<p>Jedes Element hat eigene Energieniveaus und damit eigene Linien. Die Flammenfärbung ist ein Nachweis für das Element.</p>
<h3>Beispiele</h3>
<ul><li>Natrium: Übergang 3p → 3s, ΔE = 2,10 eV, λ = 589 nm (gelb). Die Linie ist doppelt (589,0 und 589,6 nm), das Handspektroskop trennt sie nicht.</li>
<li>Lithium: 2p → 2s, ΔE = 1,85 eV, λ = 671 nm (rot).</li>
<li>Kalium: 4p → 4s bei 766/770 nm (tiefrot) und 5p → 4s bei 404 nm (violett). Das Auge sieht ein blasses Lila.</li></ul>
<h3>Bandenspektren</h3>
<p>Strontium, Calcium, Barium und Kupfer bilden in der Flamme Moleküle (zum Beispiel SrOH, CaOH, CuCl). Moleküle haben viele dicht liegende Niveaus. Man sieht breite Banden statt scharfer Linien.</p>
<h3>Cobaltglas</h3>
<p>Schon Spuren von Natrium überstrahlen die Kaliumflamme mit Gelb. Cobaltglas schluckt Gelb fast vollständig und lässt Blau, Violett und tiefes Rot durch. So wird die Kaliumfärbung sichtbar.</p>
<h3>Modellgrenzen</h3>
<ul><li>Linienstärken und Bandenformen sind vereinfacht. Die Flammenfarbe ist aus dem Spektrum berechnet und am Bildschirm nur angenähert.</li><li>Das Spektroskop zeigt Wellenlängen von 400 nm bis 780 nm mit etwa 1 nm Auflösung.</li></ul>
<h3>Was die Modellansicht zeigt</h3>
<ul><li>Das Energieniveauschema des Elements mit den Übergängen der hellsten Linien (bei Linienspektren).</li><li>Atome in der Flamme: Ein Stoß hebt ein Elektron an, beim Zurückfallen fliegt ein Photon in der Farbe der Linie davon.</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Brenner</td><td>Bunsenbrenner, nicht leuchtende Flamme</td></tr>
<tr><td>Salze</td><td>NaCl, LiCl, KCl, SrCl₂, CaCl₂, BaCl₂, CuCl₂, Probe X, Gemisch NaCl + KCl</td></tr>
<tr><td>Spektroskop</td><td>Handspektroskop mit Gitter und Wellenlängenskala 400 … 780 nm</td></tr>
<tr><td>Filter</td><td>Cobaltglas</td></tr>
</tbody></table>
<h3>Wellenlängen der hellsten Linien</h3>
<table class="spec"><tbody>
${KEYS.map(k => `<tr><td>${SALTS[k].el}</td><td>${SALTS[k].lines.filter(l => l[1] > 0.1).map(l => `${String(l[0]).replace('.', ',')}${l[2] > 1 ? ' (Bande)' : ''}`).join(' · ')} nm</td></tr>`).join('')}
</tbody></table>`,
    abi: `
<details class="q"><summary>Berechne die Energie eines Photons der Natrium-D-Linie (589 nm). <span class="op">AFB I</span></summary><p>E = h·c/λ = 1240 eV·nm / 589 nm ≈ 2,10 eV.</p></details>
<details class="q"><summary>Erkläre, warum ein Element nur Licht bestimmter Wellenlängen aussendet. <span class="op">AFB II</span></summary><p>Die Elektronen im Atom können nur bestimmte Energien haben. Beim Übergang zwischen zwei Niveaus wird genau die Differenz als Photon abgegeben. Zu jeder Energiedifferenz gehört eine Wellenlänge λ = h·c/ΔE.</p></details>
<details class="q"><summary>Ein Gemisch aus Natrium- und Kaliumsalz färbt die Flamme gelb. Wie weist man das Kalium nach? <span class="op">AFB II</span></summary><p>Mit Cobaltglas, das das Gelb des Natriums schluckt: Die Flamme erscheint dann violett-rot. Oder im Spektroskop: Neben der Na-Linie bei 589 nm erscheinen die K-Linien bei 404 nm und 766/770 nm.</p></details>
<details class="q"><summary>Warum zeigen Strontium und Calcium breite Banden statt einzelner Linien? <span class="op">AFB III</span></summary><p>In der Flamme bilden sich Moleküle (SrOH, CaOH). Neben den Elektronenniveaus haben Moleküle Schwingungs- und Rotationsniveaus. Viele eng beieinander liegende Übergänge verschmelzen zu Banden.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, segmented, check, button, fmt, dataTable, toast, display } = ui;
    const S = { sample: 'na', filter: false, mark: 589, ver: 0 };
    const L = () => emission(S.sample, S.filter);
    const nameOf = s => s === 'none' ? 'ohne Salz' : s === 'mix' ? 'Gemisch NaCl + KCl' : s === 'x' ? 'Probe X' : SALTS[s].name;

    const gS = group('Salz am Magnesiastäbchen', { led: true }); gS.led(true);
    const segS = segmented({ value: 'na', options: [...KEYS.map(k => ({ value: k, label: SALTS[k].sym })), { value: 'x', label: 'Probe X' }, { value: 'mix', label: 'Na + K' }, { value: 'none', label: 'ohne' }], onChange: v => { S.sample = v; S.ver++; } });
    const cF = check({ label: 'Cobaltglas vor dem Auge', checked: false, onChange: v => { S.filter = v; S.ver++; } });
    gS.append(el('div', { class: 'ctl' }, el('div', { style: 'grid-column:1/-1' }, segS)), cF);
    const gM = group('Spektroskop');
    const dL = display('Marker λ'), dE = display('E = h·c/λ');
    gM.append(dL, dE, el('div', { class: 'bar' }, button('Linie übernehmen', () => take(), 'btn small primary')));
    controls.append(gS, gM);

    const rows = [];
    const tbl = dataTable([{ key: 'smp', label: 'Probe', fmt: v => v }, { key: 'lam', label: 'λ in nm', digits: 1 }, { key: 'E', label: 'E in eV', digits: 2 }, { key: 'id', label: 'passt zu', fmt: v => v }], { onDelete: i => { rows.splice(i, 1); redraw(); } });
    const figS = el('div', { class: 'fig' }), chS = new Chart(figS, { xlabel: 'λ in nm', ylabel: 'Intensität (relativ)', xmin: 400, xmax: 780, includeZero: false, ymin: 0 });
    const resX = el('div', { class: 'result' });
    messwerte.append(el('div', { class: 'chartbox' }, el('h4', {}, 'Spektrum der aktuellen Flamme'), figS, resX,
      csvTools(() => ({ meta: ['Flammenfaerbung'], columns: [{ key: 'smp', label: 'Probe' }, { key: 'lam', label: 'lambda in nm' }, { key: 'E', label: 'E in eV' }, { key: 'id', label: 'Zuordnung' }], rows }), 'flammenfaerbung')),
      el('div', { style: 'height:14px' }), tbl);
    const identify = lam => { let best = null; for (const k of KEYS) for (const l of SALTS[k].lines) { const d = Math.abs(l[0] - lam) - (l[2] > 1 ? l[2] / 2 : 0); if (!best || d < best.d) best = { d, k, l }; } return best && best.d < 4 ? `${SALTS[best.k].el} (${String(best.l[0]).replace('.', ',')} nm${best.l[2] > 1 ? ', Bande' : ''})` : 'keine bekannte Linie'; };
    function redraw() {
      tbl.render(rows);
      const pts = []; for (let nm = 400; nm <= 780; nm += 1) pts.push([nm, spec(L(), nm)]);
      chS.set([{ color: '#ffd27a', points: pts }, ...(rows.filter(r => r.smpKey === S.sample).length ? [{ color: '#86dcff', mode: 'dot', points: rows.filter(r => r.smpKey === S.sample).map(r => [r.lam, spec(L(), r.lam)]) }] : [])]);
      const xr = rows.filter(r => r.smpKey === 'x');
      if (xr.length) { const cnt = {}; for (const r of xr) { const e = r.id.split(' ')[0]; cnt[e] = (cnt[e] || 0) + 1; } const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0][0]; resX.innerHTML = `<div><span>Probe X: ${xr.length} Linie(n) vermessen</span><br><b>Vermutung: ${top}</b></div>`; }
      else resX.innerHTML = '<span>Linien der Probe X vermessen, um das Metall zu bestimmen.</span>';
    }
    redraw();
    let lastVer = -1;
    function take() {
      if (S.sample === 'none') { toast('Erst ein Salz in die Flamme bringen.'); return; }
      const I = spec(L(), S.mark); if (I < 0.03) { toast('An dieser Stelle ist keine helle Linie. Marker genauer setzen.'); return; }
      const lam = Math.round(S.mark * 2) / 2;
      rows.push({ smpKey: S.sample, smp: nameOf(S.sample), lam, E: HC / lam, id: S.sample === 'x' || S.sample === 'mix' || true ? identify(lam) : '' }); redraw();
      toast(`Übernommen: λ = ${fmt(lam, 1)} nm → ${identify(lam)}`);
    }

    function drawSpec(cv) {
      const g = cv.getContext('2d'), W = cv.width, H = cv.height, Ls = L().map(l => [l[0], l[1], Math.max(l[2], 2.2)]);
      g.fillStyle = '#050607'; g.fillRect(0, 0, W, H);
      const ys = [];
      for (let x = 0; x < W; x++) { const nm = 400 + 380 * x / W; ys.push(spec(Ls, nm)); }
      const mx = Math.max(0.6, ...ys);
      for (let x = 0; x < W; x++) { const nm = 400 + 380 * x / W, v = Math.min(1, ys[x] / mx * 1.6); if (v < 0.01) continue; const [r, gg, b] = lamRGB(nm); g.fillStyle = `rgba(${r},${gg},${b},${v})`; g.fillRect(x, 10, 1, H - 20); }
    }

    // ======================= Ansicht 2D =======================
    async function view2d(box, MM) {
      box.insertAdjacentHTML('beforeend', svgMarkup());
      const svg = box.querySelector('svg'), q = id => svg.querySelector('#' + id), cv = svg.querySelector('#fSpec');
      const X = nm => 486 + (nm - 400) / 380 * 468;
      { let h = ''; for (let nm = 400; nm <= 780; nm += 10) { const x = X(nm), maj = nm % 50 === 0; h += `<rect x="${(x - 0.5).toFixed(1)}" y="446" width="1" height="${maj ? 10 : 5}" fill="#c9c3ba"/>`; if (maj) h += `<text x="${x.toFixed(1)}" y="468" text-anchor="middle">${nm}</text>`; } h += `<text x="954" y="482" text-anchor="end">nm</text>`; q('fScale').innerHTML = h; }
      let drag = false;
      q('fMk').addEventListener('pointerdown', e => { drag = true; svg.setPointerCapture(e.pointerId); e.preventDefault(); });
      svg.addEventListener('pointermove', e => { if (!drag) return; const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const c = p.matrixTransform(svg.getScreenCTM().inverse()); S.mark = Math.round(Math.max(400, Math.min(780, 400 + (c.x - 486) / 468 * 380)) * 2) / 2; });
      svg.addEventListener('pointerup', () => { drag = false; });
      let raf = 0, ver = -1, atoms = Array.from({ length: 9 }, (_, i) => ({ x: 20 + (i % 3) * 55, y: 150 + Math.floor(i / 3) * 40, t: Math.random() * 3 }));
      function frame() {
        raf = requestAnimationFrame(frame);
        const model = MM.model, now = performance.now() / 1000;
        if (ver !== S.ver || lastVer !== S.ver) { ver = S.ver; lastVer = S.ver; drawSpec(cv); redraw();
          const [r, g, b, a] = flameColor(L()), col = `rgb(${Math.round(255 * r)},${Math.round(255 * g)},${Math.round(255 * b)})`, hasSalt = S.sample !== 'none';
          q('fF0').setAttribute('stop-color', hasSalt ? `rgb(${Math.round(200 + 55 * r)},${Math.round(200 + 55 * g)},${Math.round(200 + 55 * b)})` : '#9fb8ff');
          q('fF1').setAttribute('stop-color', hasSalt ? col : '#4a7cff'); q('fF2').setAttribute('stop-color', hasSalt ? col : '#4a7cff');
          q('fFlame').setAttribute('opacity', hasSalt ? (0.55 + 0.45 * a).toFixed(2) : 0.35);
          q('fCob').setAttribute('opacity', S.filter ? 1 : 0); q('fSaltT').textContent = nameOf(S.sample) + (S.filter ? ' · durch Cobaltglas' : '');
        }
        q('fMk').setAttribute('transform', `translate(${X(S.mark).toFixed(1)} 0)`); q('fMkT').textContent = `λ = ${fmt(S.mark, 1)} nm`;
        q('fMod').setAttribute('opacity', model ? 1 : 0);
        if (model) {
          const k = S.sample === 'x' ? X_KEY : S.sample === 'mix' ? 'na' : S.sample, sl = SALTS[k];
          let lv = '', at = '';
          if (!sl) { q('fModT').textContent = 'Ohne Salz: nur die schwachen Banden der Gasflamme'; }
          else if (sl.band) { q('fModT').textContent = `${sl.el}: Moleküle in der Flamme → breite Banden`; lv = `<text x="580" y="110" fill="#c7c1b7" font-size="12">Viele eng liegende Niveaus von Molekülen</text><text x="580" y="128" fill="#c7c1b7" font-size="12">(z. B. ${sl.sym}OH) ergeben breite Banden.</text>`; }
          else {
            q('fModT').textContent = `${sl.el}: Energieniveaus und Übergänge`; const Y = e => 250 - e / 4 * 170;
            sl.lv.forEach(([n, e]) => { lv += `<line x1="580" y1="${Y(e)}" x2="720" y2="${Y(e)}" stroke="#c9c3ba"/><text x="726" y="${Y(e) + 4}" fill="#c9c3ba" font-size="11">${n} · ${fmt(e, 2)} eV</text>`; });
            sl.tr.forEach(([u, lo, nm], i) => { const x = 610 + i * 50; lv += `<line x1="${x}" y1="${Y(sl.lv[u][1])}" x2="${x}" y2="${Y(sl.lv[lo][1]) - 6}" stroke="${rgbStr(nm, 40)}" stroke-width="3" marker-end=""/><path d="M${x - 5} ${Y(sl.lv[lo][1]) - 8} L${x} ${Y(sl.lv[lo][1])} L${x + 5} ${Y(sl.lv[lo][1]) - 8}" fill="${rgbStr(nm, 40)}"/><text x="${x + 6}" y="${(Y(sl.lv[u][1]) + Y(sl.lv[lo][1])) / 2}" fill="${rgbStr(nm, 60)}" font-size="11">${fmt(nm, 0)} nm</text>`; });
          }
          const main = sl ? sl.lines.reduce((a, b) => b[1] > a[1] ? b : a)[0] : 431;
          for (const a of atoms) { const ph = (now + a.t) % 3; const ex = ph > 1 && ph < 1.4; at += `<circle cx="${a.x + 800}" cy="${a.y - 40}" r="${ex ? 7 : 5}" fill="${ex ? '#ffe9a0' : '#8fa2b0'}"/>`; if (ph > 1.4 && ph < 2.4) { const d = (ph - 1.4) * 60; at += `<circle cx="${a.x + 800 + d * 0.5}" cy="${a.y - 40 - d * 0.4}" r="3" fill="${rgbStr(main, 60)}"/>`; } }
          q('fLv').innerHTML = lv; q('fAt').innerHTML = `<text x="820" y="76" fill="#8e979d" font-size="10">Atome</text>` + at;
        }
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); } };
    }

    // ======================= Ansicht 3D =======================
    async function view3d(box, MM) {
      const { createLab, mats, glowPool } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [0.18, 0.3, 0.5], target: [0.02, 0.19, 0], table: [1.6, 1.2], bloom: [0.9, 0.5, 0.75], room: 0.2, minDist: 0.15, maxDist: 2, fov: 38 });
      const { THREE, scene } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad · Raum abgedunkelt</div>');
      const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = !mat.transparent; scene.add(m); return m; };
      add(new THREE.CylinderGeometry(0.05, 0.055, 0.012, 32), M.housing, 0, 0.006, 0);
      add(new THREE.CylinderGeometry(0.008, 0.008, 0.13, 20), M.steel, 0, 0.077, 0);
      add(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 20), M.brass, 0, 0.03, 0);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0x4a7cff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      const flame = add(new THREE.SphereGeometry(1, 24, 16), flameMat, 0, 0.2, 0); flame.scale.set(0.018, 0.065, 0.018);
      const inner = add(new THREE.ConeGeometry(0.007, 0.03, 20), new THREE.MeshBasicMaterial({ color: 0x4a7cff, transparent: true, opacity: 0.6, toneMapped: false }), 0, 0.157, 0);
      const fl = new THREE.PointLight(0xffaa44, 0.2, 0.8, 2); fl.position.set(0, 0.2, 0); scene.add(fl);
      const rod = add(new THREE.CylinderGeometry(0.0015, 0.0015, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.6 }), 0.09, 0.2, 0.0); rod.rotation.z = Math.PI / 2 - 0.35;
      const cob = add(new THREE.BoxGeometry(0.004, 0.08, 0.06), new THREE.MeshStandardMaterial({ color: 0x2a3fd0, transparent: true, opacity: 0.6 }), 0.0, 0.19, 0.1); cob.rotation.y = Math.PI / 2;
      const sp = add(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 16), M.black, -0.08, 0.2, 0.2); sp.lookAt(0, 0.2, 0); sp.rotateX(Math.PI / 2);
      const modelG = new THREE.Group(); scene.add(modelG); const pool = glowPool(THREE, modelG, 30, 0xffffff, 0.008); const ph = pool.items.map(() => ({ t: Math.random() * 2, d: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize() }));
      let ver = -1;
      const off = lab.onFrame((dt, t) => {
        if (ver !== S.ver) { ver = S.ver; const [r, g, b, a] = flameColor(L()); const salt = S.sample !== 'none';
          flameMat.color.setRGB(salt ? r : 0.29, salt ? g : 0.49, salt ? b : 1); flameMat.opacity = salt ? 0.45 + 0.4 * a : 0.3; fl.color.setRGB(salt ? r : 0.3, salt ? g : 0.5, salt ? b : 1); fl.intensity = salt ? 0.4 : 0.08; cob.visible = S.filter; rod.visible = salt; }
        flame.scale.y = 0.065 * (1 + 0.05 * Math.sin(t * 17)); flame.scale.x = flame.scale.z = 0.018 * (1 + 0.06 * Math.sin(t * 23));
        modelG.visible = MM.model && S.sample !== 'none'; if (!modelG.visible) return;
        const ls = L().filter(l => l[3] !== 'g'); const pick = () => { let s = ls.reduce((a, l) => a + l[1], 0) * Math.random(); for (const l of ls) { s -= l[1]; if (s <= 0) return l[0]; } return ls[0][0]; };
        pool.items.forEach((s, i) => { const p = ph[i]; p.t += dt; if (p.t > 1.2) { p.t = 0; p.d.set(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize(); const [r, g, b] = lamRGB(pick()); s.material.color.setRGB(r / 255, g / 255, b / 255); } s.visible = true; s.position.set(0, 0.2, 0).addScaledVector(p.d, p.t * 0.12); s.material.opacity = 1 - p.t / 1.2; });
      });
      return { destroy() { off(); lab.dispose(); } };
    }

    const host = viewHost(stage, { id: 'flammenfaerbung', views: { '2d': view2d, '3d': view3d }, initial: '2d', modelInfo: 'Energieniveaus, Photonen' });
    let raf = 0, slow = 0, last = performance.now();
    function loop(now) { raf = requestAnimationFrame(loop); slow += (now - last) / 1000; last = now; if (slow > 0.2) { slow = 0; dL.set(`${fmt(S.mark, 1)} nm`); dE.set(`${fmt(HC / S.mark, 2)} eV`); } }
    raf = requestAnimationFrame(loop);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); chS.destroy(); } };
  }
};
