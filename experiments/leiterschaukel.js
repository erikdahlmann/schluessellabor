// ============================================================================
//  Schlüsselexperiment: Leiterschaukel – Kraft auf einen stromdurchflossenen Leiter
//  Ein Kupferstab hängt an zwei Drähten zwischen den Polen eines Hufeisenmagneten.
//  F = I·l·B (Leiter senkrecht zu B). Gleichgewicht: tan φ = F / (m·g).
//  Bewegung: φ'' = (F·cos φ − m·g·sin φ)/(m·L) − γ·φ'
//  Modell: Feld des Magneten, Feld des Leiters, Gesamtfeld, Kräfte, Elektronen.
// ============================================================================
import { viewHost } from '../js/lib/views.js';

const G = 9.81, MASS = 0.015, LW = 0.20, L_PER = 0.030, IMAX = 6;    // kg, m (Drahtlänge), m je Magnet, A
const B0 = 0.100 * (1 + (Math.random() * 0.08 - 0.04));               // T, je Aufbau etwas anders
const GAMMA = 3.0;                                                    // Dämpfung in 1/s
// 2D-Maße (Seitenansicht in Richtung des Stabs)
const PX = 1500, PIV = [320, 70], RODR = 10;
const LEG = { x0: 200, x1: 470, top: [282, 316], bot: [424, 458] };
const PHI_MAX = Math.acos((LEG.top[1] + RODR + 2 - PIV[1]) / (LW * PX));   // Stab stößt oben an den Magneten

const svgMarkup = () => `
<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Sans, system-ui, sans-serif" role="img" aria-label="Seitenansicht der Leiterschaukel zwischen den Polen eines Hufeisenmagneten, daneben Netzgerät bzw. Kräfteplan">
<defs>
  <linearGradient id="sBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2024"/><stop offset="1" stop-color="#121518"/></linearGradient>
  <linearGradient id="sCu" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0b07a"/><stop offset=".5" stop-color="#b8692f"/><stop offset="1" stop-color="#6b3612"/></linearGradient>
  <linearGradient id="sSteel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfd4d8"/><stop offset="1" stop-color="#6c7378"/></linearGradient>
  <filter id="sSh" x="-10%" y="-10%" width="130%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity=".55"/></filter>
  <filter id="sGlow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <marker id="sArrB" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#86dcff"/></marker>
  <marker id="sArrF" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="context-stroke"/></marker>
</defs>
<rect width="1000" height="620" fill="url(#sBg)"/>
<text x="40" y="34" fill="#8e979d" font-size="13">Seitenansicht: Blick entlang des Kupferstabs</text>
<!-- Stativ -->
<rect x="120" y="56" width="400" height="12" rx="4" fill="url(#sSteel)" filter="url(#sSh)"/>
<rect x="124" y="56" width="14" height="490" fill="url(#sSteel)"/>
<rect x="84" y="540" width="200" height="16" rx="3" fill="#2b3034"/>
<circle cx="${PIV[0]}" cy="${PIV[1]}" r="5" fill="#ece6dc"/>
<!-- Skala hinter dem Stab -->
<g id="sScale" font-family="IBM Plex Mono, monospace" font-size="10" fill="#c9c3ba"></g>
<!-- Magnet: Schenkel oben und unten, Joch rechts -->
<g filter="url(#sSh)">
  <rect id="sLegT" x="${LEG.x0}" y="${LEG.top[0]}" width="${LEG.x1 - LEG.x0 + 40}" height="${LEG.top[1] - LEG.top[0]}" rx="4"/>
  <rect id="sLegB" x="${LEG.x0}" y="${LEG.bot[0]}" width="${LEG.x1 - LEG.x0 + 40}" height="${LEG.bot[1] - LEG.bot[0]}" rx="4"/>
  <rect x="${LEG.x1}" y="${LEG.top[0]}" width="40" height="${LEG.bot[1] - LEG.top[0]}" rx="6" fill="#3a3f44"/>
</g>
<text id="sPT" x="${LEG.x0 + 14}" y="${LEG.top[0] + 25}" fill="#fff" font-size="18" font-weight="700"></text>
<text id="sPB" x="${LEG.x0 + 14}" y="${LEG.bot[0] + 25}" fill="#fff" font-size="18" font-weight="700"></text>
<rect x="${LEG.x0 - 10}" y="${LEG.bot[1]}" width="${LEG.x1 - LEG.x0 + 60}" height="96" fill="#5a4630" stroke="#3b2e20"/>
<text x="${LEG.x0 + 4}" y="${LEG.bot[1] + 112}" fill="#8e979d" font-size="11" id="sMagT"></text>
<!-- Modell: Feldlinien und Kräfte -->
<g id="sFieldG" opacity="0"><g id="sField" fill="none" stroke="#86dcff" stroke-width="1.2" opacity=".8"></g></g>
<!-- Schaukel -->
<line id="sWire" stroke="#cfd4d8" stroke-width="2"/>
<g id="sRod">
  <circle r="${RODR}" fill="url(#sCu)" stroke="#4a2a10"/>
  <g id="sCur" stroke="#1a1a1a" stroke-width="2" fill="#1a1a1a"></g>
</g>
<g id="sForceG" opacity="0" stroke-width="3" fill="none">
  <line id="sFL" stroke="#f2ac74" marker-end="url(#sArrF)"/>
  <line id="sFG" stroke="#7fd6a0" marker-end="url(#sArrF)"/>
  <line id="sFS" stroke="#c7b6ff" marker-end="url(#sArrF)"/>
  <text id="sFLt" fill="#f2ac74" stroke="none" font-size="13" font-weight="600">F_L</text>
  <text id="sFGt" fill="#7fd6a0" stroke="none" font-size="13" font-weight="600">F_G</text>
  <text id="sFSt" fill="#c7b6ff" stroke="none" font-size="13" font-weight="600">F_Draht</text>
</g>
<text id="sPhi" fill="#ece6dc" font-size="12" font-family="IBM Plex Mono, monospace"></text>

<!-- rechts: Netzgerät (Realansicht) -->
<g id="sPsuG">
  <rect x="590" y="80" width="360" height="200" rx="10" fill="#2b3034" stroke="#454c52" filter="url(#sSh)"/>
  <text x="608" y="106" fill="#c9c3ba" font-size="13">Hochstrom-Netzgerät 0 … 6 A</text>
  <rect x="608" y="120" width="200" height="66" rx="6" fill="#160807" stroke="#3a1a14"/>
  <text id="sDI" x="796" y="168" fill="#ff5a3c" font-size="40" text-anchor="end" font-family="IBM Plex Mono, monospace" filter="url(#sGlow)">0,00</text>
  <text x="820" y="168" fill="#ff5a3c" font-size="16">A</text>
  <circle id="sLed" cx="900" cy="140" r="8" fill="#3a1010"/><text x="900" y="166" fill="#8e979d" font-size="10" text-anchor="middle">Strom</text>
  <text id="sPol" x="608" y="214" fill="#c9c3ba" font-size="12"></text>
  <circle cx="860" cy="240" r="11" fill="#c4231b"/><circle cx="900" cy="240" r="11" fill="#151515" stroke="#444"/>
  <text x="860" y="268" fill="#8e979d" font-size="10" text-anchor="middle">+</text><text x="900" y="268" fill="#8e979d" font-size="10" text-anchor="middle">−</text>
  <text x="608" y="250" fill="#8e979d" font-size="11">m = 15 g · L = 20 cm · l = 3 cm je Magnet</text>
</g>
<!-- rechts: Kräfteplan und Regel (Modell) -->
<g id="sModelR" opacity="0">
  <rect x="590" y="60" width="360" height="300" rx="10" fill="rgba(10,12,14,.92)" stroke="#5a4b8a"/>
  <text x="606" y="84" fill="#ece6dc" font-size="13" font-weight="600">Kräfte am Stab (Gleichgewicht)</text>
  <g id="sTri" stroke-width="3" fill="none"></g>
  <text id="sTriT" x="606" y="236" fill="#c7c1b7" font-size="12" font-family="IBM Plex Mono, monospace"></text>
  <text id="sTriT2" x="606" y="254" fill="#f2ac74" font-size="12" font-family="IBM Plex Mono, monospace"></text>
  <text x="606" y="282" fill="#c7b6ff" font-size="12">Rechte Hand (technische Stromrichtung):</text>
  <text x="606" y="300" fill="#c7c1b7" font-size="12">Daumen I · Zeigefinger B · Mittelfinger F</text>
  <text x="606" y="322" fill="#c7b6ff" font-size="12">Gesamtfeld: dicht auf der einen, dünn auf der</text>
  <text x="606" y="340" fill="#c7c1b7" font-size="12">anderen Seite. Der Stab weicht zur dünnen Seite aus.</text>
</g>
<text id="sCurT" x="590" y="392" fill="#c9c3ba" font-size="12"></text>
<text id="sSread" x="590" y="420" fill="#ece6dc" font-size="15" font-family="IBM Plex Mono, monospace"></text>
<text x="590" y="446" fill="#8e979d" font-size="11">⊙ Strom aus der Zeichenebene heraus · ⊗ hinein</text>
</svg>`;

export default {
  intro: 'Ein Kupferstab hängt an zwei dünnen Drähten zwischen den Polen eines Hufeisenmagneten. Fließt Strom durch den Stab, schwingt die Schaukel zur Seite. Aus der Auslenkung bestimmt ihr die Kraft und zeigt: F wächst proportional mit der Stromstärke I und der Leiterlänge l im Feld.',
  docs: {
    durchfuehrung: `
<h3>Aufbau</h3>
<p>An einer Stativstange hängt eine Schaukel aus zwei dünnen Drähten und einem Kupferstab. Die Drähte führen den Strom vom Netzgerät zum Stab. Der Hufeisenmagnet liegt auf der Seite: Ein Schenkel ist oben, einer unten, der Stab hängt in der Mitte dazwischen. Mehrere gleiche Magnete nebeneinander verlängern das Stück des Stabs, das im Feld liegt.</p>
<h3>Durchführung</h3>
<ol>
<li>Netzgerät auf 0 A stellen und einschalten. Die Schaukel hängt senkrecht.</li>
<li>Stromstärke langsam erhöhen. Die Schaukel schwingt aus und kommt bei einem neuen Winkel zur Ruhe.</li>
<li>Warten, bis sie ruht. Auslenkung <i>s</i> an der Skala ablesen und <b>Messwert übernehmen</b>.</li>
<li>Messreihe für I = 1 … 6 A mit einem Magneten, dann mit zwei und drei Magneten.</li>
<li>Polung umkehren und Magnet umdrehen: Wie ändert sich die Richtung der Auslenkung?</li>
</ol>
<div class="callout">Sicherheit: Bei hohen Strömen wird der dünne Draht warm. Strom nur für die Messung einschalten. Netzgerät mit Strombegrenzung verwenden.</div>`,
    theorie: `
<h3>Lorentzkraft auf einen Leiter</h3>
<p>Im Leiter bewegen sich Elektronen. Auf jedes wirkt im Magnetfeld die Lorentzkraft. Alle Kräfte zusammen ergeben die Kraft auf den Leiter. Steht der Leiter senkrecht zum Feld, gilt:</p>
<span class="formula">F = I · l · B</span>
<p>l ist die Länge des Leiterstücks im Feld. Daraus folgt die Definition der magnetischen Flussdichte: B = F / (I·l), Einheit 1 T = 1 N/(A·m).</p>
<h3>Richtung</h3>
<p>Rechte-Hand-Regel für die technische Stromrichtung: Daumen in Stromrichtung, Zeigefinger in Feldrichtung (von N nach S), dann zeigt der Mittelfinger in Kraftrichtung. Für die Elektronen gilt dieselbe Regel mit der linken Hand. Polt man den Strom um oder dreht den Magneten, kehrt sich die Kraft um. Macht man beides, bleibt sie gleich.</p>
<h3>Kraft aus der Auslenkung</h3>
<p>Im Gleichgewicht heben sich Gewichtskraft, Lorentzkraft und die Kraft der Drähte auf. Die Drähte zeigen in Richtung der Summe aus F<sub>G</sub> und F<sub>L</sub>:</p>
<span class="formula">tan φ = F<sub>L</sub> / (m·g)    sin φ = s / L    ⇒    F<sub>L</sub> = m·g·tan φ</span>
<h3>Feldlinienbild</h3>
<p>Das kreisförmige Feld um den Leiter und das Feld des Magneten überlagern sich. Auf einer Seite zeigen beide in dieselbe Richtung, das Feld wird stärker. Auf der anderen Seite schwächen sie sich. Der Leiter wird zur Seite mit dem schwächeren Feld gedrückt.</p>
<h3>Modellgrenzen</h3>
<ul><li>Das Feld ist zwischen den Polen als homogen angenommen. B schwankt von Aufbau zu Aufbau um ±4 % um 0,10 T.</li><li>Die Masse der Drähte und ihre Erwärmung sind vernachlässigt. Die Schaukel ist leicht gedämpft.</li></ul>
<h3>Was die Modellansicht zeigt</h3><ul><li><b>Gesamtfeld:</b> Feldlinien aus Magnetfeld und Leiterfeld. Die Linien drängen sich auf einer Seite des Stabs und weichen auf der anderen aus. Das Leiterfeld ist zur Verdeutlichung stark vergrößert.</li><li><b>Kräfte:</b> F<sub>L</sub> (orange), F<sub>G</sub> (grün) und die Kraft der Drähte (violett). Rechts das geschlossene Krafteck im Gleichgewicht.</li><li><b>3D-Aufbau:</b> Elektronen laufen entgegen der technischen Stromrichtung durch Drähte und Stab. Pfeile zeigen B, I und F.</li></ul>`,
    geraet: `
<table class="spec"><tbody>
<tr><td>Leiterschaukel</td><td>Kupferstab 14 cm, Ø 4 mm, m = 15 g, Drähte L = 20 cm</td></tr>
<tr><td>Hufeisenmagnet</td><td>1 bis 3 Stück, Polbreite je 3 cm, B ≈ 0,1 T</td></tr>
<tr><td>Netzgerät</td><td>0 … 6 A Gleichstrom, Strombegrenzung</td></tr>
<tr><td>Skala</td><td>mm-Teilung hinter dem Stab</td></tr>
</tbody></table>`,
    abi: `
<details class="q"><summary>Bei I = 4,0 A und l = 6 cm wird s = 3,2 cm abgelesen (L = 20 cm, m = 15 g). Berechne F und B. <span class="op">AFB II</span></summary><p>sin φ = 0,16, φ = 9,21°, tan φ = 0,162. F = m·g·tan φ = 0,015 kg · 9,81 N/kg · 0,162 ≈ 0,0239 N. B = F/(I·l) = 0,0239 N / (4,0 A · 0,06 m) ≈ 0,10 T.</p></details>
<details class="q"><summary>Beschreibe, wie man aus der Messreihe nachweist, dass F ~ I gilt. <span class="op">AFB I</span></summary><p>F über I auftragen. Liegen die Punkte auf einer Ursprungsgeraden, ist F proportional zu I. Die Steigung ist l·B.</p></details>
<details class="q"><summary>Strom wird umgepolt und gleichzeitig der Magnet umgedreht. Was passiert? Begründe. <span class="op">AFB II</span></summary><p>Die Auslenkung bleibt gleich. Beide Änderungen kehren die Kraftrichtung je einmal um, zweimal umkehren ergibt die alte Richtung.</p></details>
<details class="q"><summary>Erkläre die Kraft mit dem Feldlinienbild. <span class="op">AFB II</span></summary><p>Um den Leiter entstehen kreisförmige Feldlinien. Auf einer Seite zeigen sie in dieselbe Richtung wie das Magnetfeld, dort wird das Gesamtfeld dichter. Auf der anderen Seite heben sich die Felder teilweise auf. Der Leiter wird von der dichteren zur dünneren Seite gedrückt.</p></details>
<details class="q"><summary>Zeige, dass man aus der Leiterschaukel die Kraft auf ein einzelnes Elektron herleiten kann. <span class="op">AFB III</span></summary><p>I = n·e·A·v (n Elektronen pro Volumen, A Querschnitt). Im Stück l sind N = n·A·l Elektronen. F = I·l·B = n·e·A·v·l·B = N·e·v·B. Auf ein Elektron wirkt also F = e·v·B.</p></details>`
  },

  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, segmented, check, button, fmt, dataTable, toast, display, gauss } = ui;
    const S = { I: 3, on: false, pol: 1, nMag: 1, nTop: true, phi: 0, w: 0, ver: 0 };
    const len = () => S.nMag * L_PER;
    const bd = () => S.nTop ? 1 : -1;                                   // +1: N oben, Feld zeigt nach unten
    const Ieff = () => S.on ? S.I * S.pol : 0;                          // + : Strom aus der Zeichenebene heraus
    const Fx = () => Ieff() * bd() * len() * B0;                        // Kraft in +x (nach rechts, ins Joch hinein)

    const gP = group('Netzgerät', { led: true });
    const cOn = check({ label: 'Strom einschalten', checked: false, onChange: v => { S.on = v; gP.led(v); } });
    const sI = slider({ label: 'Stromstärke I', min: 0, max: IMAX, step: 0.1, value: S.I, unit: 'A', digits: 1, onInput: v => { S.I = v; } });
    const segPol = segmented({ value: 1, options: [{ value: 1, label: 'Polung normal' }, { value: -1, label: 'umgepolt' }], onChange: v => { S.pol = v; } });
    gP.append(cOn, sI, el('div', { class: 'ctl' }, el('div', { style: 'grid-column:1/-1' }, segPol)));
    const gM = group('Magnet');
    const segN = segmented({ value: 1, options: [{ value: 1, label: '1 Magnet' }, { value: 2, label: '2' }, { value: 3, label: '3' }], onChange: v => { S.nMag = v; S.ver++; } });
    const segO = segmented({ value: 'n', options: [{ value: 'n', label: 'Nordpol oben' }, { value: 's', label: 'Nordpol unten' }], onChange: v => { S.nTop = v === 'n'; S.ver++; } });
    gM.append(el('div', { class: 'ctl' }, el('label', { style: 'grid-column:1/-1' }, 'Anzahl Magnete (Leiterlänge im Feld)'), el('div', { style: 'grid-column:1/-1' }, segN)),
      el('div', { class: 'ctl' }, el('label', { style: 'grid-column:1/-1' }, 'Lage des Magneten'), el('div', { style: 'grid-column:1/-1' }, segO)));
    const gMs = group('Messung');
    const dS = display('Auslenkung s (Skala)'), dPhi = display('φ = arcsin(s / L)'), dF = display('F = m·g·tan φ');
    gMs.append(dS, dPhi, dF, el('div', { class: 'bar' }, button('Messwert übernehmen', () => take(), 'btn small primary')),
      el('p', { class: 'muted', style: 'font-size:12.5px;margin:8px 0 0' }, 'Erst messen, wenn die Schaukel ruht. m = 15 g, L = 20 cm, l = 3 cm je Magnet.'));
    controls.append(gP, gM, gMs);

    // ---- Messwerte ----
    const rows = [];
    const tbl = dataTable([
      { key: 'I', label: 'I in A', digits: 2 }, { key: 'l', label: 'l in cm', fmt: v => fmt(v * 100, 0) }, { key: 's', label: 's in mm', digits: 1 },
      { key: 'phi', label: 'φ in °', digits: 2 }, { key: 'F', label: 'F in mN', fmt: v => fmt(v * 1000, 1) }, { key: 'B', label: 'B = F/(I·l) in T', digits: 3 }
    ], { onDelete: i => { rows.splice(i, 1); redraw(); } });
    const figI = el('div', { class: 'fig' }), figL = el('div', { class: 'fig' });
    const chI = new Chart(figI, { xlabel: 'I in A', ylabel: 'F in mN' }), chL = new Chart(figL, { xlabel: 'l in cm', ylabel: 'F/I in mN/A' });
    const resI = el('div', { class: 'result' }), resL = el('div', { class: 'result' });
    messwerte.append(
      el('div', { class: 'data' },
        el('div', { class: 'chartbox' }, el('h4', {}, 'F über I (je Leiterlänge)'), figI, resI,
          csvTools(() => ({ meta: ['Leiterschaukel', `m = ${MASS} kg, L = ${LW} m`], columns: [{ key: 'I', label: 'I in A' }, { key: 'l', label: 'l in m' }, { key: 's', label: 's in mm' }, { key: 'phi', label: 'phi in Grad' }, { key: 'F', label: 'F in N' }, { key: 'B', label: 'B in T' }], rows }), 'leiterschaukel_messreihe')),
        el('div', { class: 'chartbox' }, el('h4', {}, 'F/I über l: Steigung = B'), figL, resL)),
      el('div', { style: 'height:14px' }), tbl);
    const cols = ['#86dcff', '#f2ac74', '#7fd6a0'];
    function redraw() {
      tbl.render(rows);
      const series = [], fits = []; let txt = '';
      [1, 2, 3].forEach((n, i) => {
        const pts = rows.filter(r => Math.abs(r.l - n * L_PER) < 1e-9).map(r => [r.I, r.F * 1000]); if (!pts.length) return;
        series.push({ name: `l = ${n * 3} cm`, color: cols[i], mode: 'dot', points: pts });
        if (pts.length >= 2) { const f = fit.propFit(pts.map(p => p[0]), pts.map(p => p[1])); if (f) { fits.push({ f: f.f, color: cols[i] }); txt += `<div><span>l = ${n * 3} cm: Steigung ${fmt(f.a, 2)} mN/A</span><br><b>B = ${fmt(f.a / 1000 / (n * L_PER), 3)} T</b> <span>· R² = ${fmt(f.r2, 4)}</span></div>`; } }
      });
      chI.set(series, fits); resI.innerHTML = txt || '<span>Mindestens zwei Messungen mit gleicher Magnetzahl für die Ursprungsgerade.</span>';
      const pl = rows.filter(r => r.I > 0.2).map(r => [r.l * 100, r.F * 1000 / r.I]);
      const fl = []; let t2 = '<span>Messungen mit verschiedenen Magnetzahlen ergänzen.</span>';
      if (new Set(rows.map(r => r.l)).size >= 2) { const f = fit.propFit(pl.map(p => p[0]), pl.map(p => p[1])); if (f) { fl.push({ f: f.f, color: '#ab93ff' }); t2 = `<div><span>Steigung = B</span><br><b>B = ${fmt(f.a / 10, 3)} T</b> <span>(Steigung ${fmt(f.a, 3)} mN/(A·cm))</span></div>`; } }
      chL.set([{ color: '#ab93ff', mode: 'dot', points: pl }], fl); resL.innerHTML = t2;
    }
    redraw();
    const reading = () => { const s = LW * Math.sin(S.phi) * 1000; return Math.round(s * 2) / 2; };   // mm, auf 0,5 mm abgelesen
    function take() {
      if (!S.on || S.I < 0.05) { toast('Es fließt kein Strom. Erst den Strom einschalten.'); return; }
      if (Math.abs(S.w) > 0.02) { toast('Die Schaukel schwingt noch. Warten, bis sie ruht.'); return; }
      const s = Math.abs(reading()), phi = Math.asin(s / 1000 / LW), F = MASS * G * Math.tan(phi);
      rows.push({ I: S.I, l: len(), s, phi: phi * 180 / Math.PI, F, B: F / (S.I * len()) }); redraw();
      toast(`Übernommen: s = ${fmt(s, 1)} mm → F = ${fmt(F * 1000, 1)} mN`);
    }

    // Gesamtfeld (Seitenansicht, Bildschirmkoordinaten): homogenes Feld + stark vergrößertes Leiterfeld
    function fieldPaths(cx, cy) {
      const cur = Ieff() / IMAX, r0 = 21 * Math.sqrt(Math.abs(cur)) * Math.sign(cur), down = bd();
      const B = (x, y) => { const dx = x - cx, dy = -(y - cy), r2 = dx * dx + dy * dy + 30; const bx = r0 * r0 * (-dy) / r2 * Math.sign(r0) * 1, by = -down + r0 * r0 * dx / r2 * Math.sign(r0); return [bx, -by]; };
      const yA = down > 0 ? LEG.top[1] + 1 : LEG.bot[0] - 1, yB = down > 0 ? LEG.bot[0] : LEG.top[1];
      let d = '', arrows = '';
      for (let x0 = LEG.x0 + 8; x0 <= LEG.x1 - 4; x0 += 13) {
        let x = x0, y = yA, path = `M${x.toFixed(1)} ${y.toFixed(1)}`, n = 0, mid = null;
        while (n++ < 500) {
          let [bx, by] = B(x, y); const m = Math.hypot(bx, by) || 1; bx /= m; by /= m;
          const [bx2, by2] = B(x + bx * 1.5, y + by * 1.5); const m2 = Math.hypot(bx2, by2) || 1;
          x += (bx + bx2 / m2) * 1.5; y += (by + by2 / m2) * 1.5;
          if (Math.hypot(x - cx, y - cy) < RODR + 2) break;
          if ((down > 0 && y >= yB) || (down < 0 && y <= yB) || x < LEG.x0 - 30 || x > LEG.x1 + 10) break;
          if (n % 2 === 0) path += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
          if (n === 26) mid = [x, y, bx, by];
        }
        d += path + ' ';
        if (mid) { const [mx, my, ux, uy] = mid; arrows += `M${(mx - ux * 5 - uy * 4).toFixed(1)} ${(my - uy * 5 + ux * 4).toFixed(1)} L${mx.toFixed(1)} ${my.toFixed(1)} L${(mx - ux * 5 + uy * 4).toFixed(1)} ${(my - uy * 5 - ux * 4).toFixed(1)} `; }
      }
      return `<path d="${d}"/><path d="${arrows}" stroke-width="1.6"/>`;
    }

    // ======================= Ansicht 2D =======================
    async function view2d(box, MM) {
      box.insertAdjacentHTML('beforeend', svgMarkup());
      const svg = box.querySelector('svg'), q = id => svg.querySelector('#' + id);
      { let h = `<rect x="${LEG.x0 + 6}" y="396" width="${LEG.x1 - LEG.x0 - 12}" height="22" fill="#efe9dc" opacity=".9"/>`; for (let mm = -60; mm <= 60; mm += 5) { const x = PIV[0] + mm / 1000 * PX; if (x < LEG.x0 + 8 || x > LEG.x1 - 8) continue; const maj = mm % 10 === 0; h += `<rect x="${(x - 0.5).toFixed(1)}" y="396" width="1" height="${maj ? 10 : 6}" fill="#111"/>`; if (maj && mm % 20 === 0) h += `<text x="${x.toFixed(1)}" y="415" text-anchor="middle" fill="#111">${mm / 10}</text>`; } q('sScale').innerHTML = h; }
      let raf = 0, acc = 0, ver = -1;
      function frame() {
        raf = requestAnimationFrame(frame);
        const model = MM.model, phi = S.phi, rx = PIV[0] + LW * PX * Math.sin(phi), ry = PIV[1] + LW * PX * Math.cos(phi);
        q('sWire').setAttribute('x1', PIV[0]); q('sWire').setAttribute('y1', PIV[1]); q('sWire').setAttribute('x2', rx.toFixed(1)); q('sWire').setAttribute('y2', ry.toFixed(1));
        q('sRod').setAttribute('transform', `translate(${rx.toFixed(1)} ${ry.toFixed(1)})`);
        const ie = Ieff();
        q('sCur').innerHTML = ie > 0 ? '<circle r="3"/>' : ie < 0 ? '<path d="M-5 -5 L5 5 M5 -5 L-5 5" fill="none"/>' : '';
        if (ver !== S.ver) {
          ver = S.ver; const nt = S.nTop;
          q('sLegT').setAttribute('fill', nt ? '#c4231b' : '#2f8a3c'); q('sLegB').setAttribute('fill', nt ? '#2f8a3c' : '#c4231b');
          q('sPT').textContent = nt ? 'N' : 'S'; q('sPB').textContent = nt ? 'S' : 'N';
          q('sMagT').textContent = `${S.nMag} Magnet${S.nMag > 1 ? 'e' : ''} nebeneinander: l = ${S.nMag * 3} cm`;
        }
        q('sPhi').setAttribute('x', PIV[0] + 12); q('sPhi').setAttribute('y', PIV[1] + 40); q('sPhi').textContent = Math.abs(phi) > 0.003 ? `φ = ${fmt(phi * 180 / Math.PI, 1)}°` : '';
        q('sCurT').textContent = S.on ? `Strom: ${fmt(S.I, 1)} A, ${ie > 0 ? 'aus der Zeichenebene heraus (⊙)' : 'in die Zeichenebene hinein (⊗)'}` : 'Strom aus';
        q('sSread').textContent = `Skala: s = ${fmt(reading(), 1)} mm`;
        // Realteil rechts
        q('sDI').textContent = fmt(S.on ? S.I : 0, 2); q('sLed').setAttribute('fill', S.on ? '#ff4b3e' : '#3a1010');
        q('sPol').textContent = S.pol > 0 ? 'Polung: normal' : 'Polung: umgekehrt';
        q('sPsuG').setAttribute('opacity', model ? 0 : 1); q('sModelR').setAttribute('opacity', model ? 1 : 0);
        q('sFieldG').setAttribute('opacity', model ? 1 : 0); q('sForceG').setAttribute('opacity', model ? 1 : 0);
        if (model) {
          if (++acc % 3 === 0) q('sField').innerHTML = fieldPaths(rx, ry);
          const k = 950, FL = Fx(), FG = MASS * G, Ft = Math.hypot(FL, FG);
          const set = (id, x2, y2) => { q(id).setAttribute('x1', rx); q(id).setAttribute('y1', ry); q(id).setAttribute('x2', (rx + x2).toFixed(1)); q(id).setAttribute('y2', (ry + y2).toFixed(1)); };
          set('sFL', FL * k, 0); set('sFG', 0, FG * k);
          const ux = Math.sin(phi), uy = Math.cos(phi), T = FG * Math.cos(phi) + FL * Math.sin(phi);   // Kraft der Drähte (Richtung Aufhängung)
          set('sFS', -ux * T * k, -uy * T * k);
          q('sFL').style.display = Math.abs(FL) * k > 4 ? '' : 'none';
          q('sFLt').setAttribute('x', rx + FL * k + (FL >= 0 ? 6 : -30)); q('sFLt').setAttribute('y', ry - 8);
          q('sFGt').setAttribute('x', rx + 8); q('sFGt').setAttribute('y', ry + FG * k);
          q('sFSt').setAttribute('x', rx - ux * T * k * 0.6 + 10); q('sFSt').setAttribute('y', ry - uy * T * k * 0.6);
          // Krafteck rechts (F_G + F_L + F_Draht = 0)
          const kk = 820, ox = 740, oy = 100;
          const p1 = [ox, oy], p2 = [ox, oy + FG * kk], p3 = [ox + FL * kk, oy + FG * kk];
          q('sTri').innerHTML = `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke="#7fd6a0" marker-end="url(#sArrF)"/>` +
            (Math.abs(FL) * kk > 4 ? `<line x1="${p2[0]}" y1="${p2[1]}" x2="${p3[0].toFixed(1)}" y2="${p3[1]}" stroke="#f2ac74" marker-end="url(#sArrF)"/>` : '') +
            `<line x1="${p3[0].toFixed(1)}" y1="${p3[1]}" x2="${p1[0]}" y2="${p1[1]}" stroke="#c7b6ff" marker-end="url(#sArrF)"/>`;
          q('sTriT').textContent = `F_G = ${fmt(FG * 1000, 0)} mN   F_L = ${fmt(Math.abs(FL) * 1000, 1)} mN`;
          q('sTriT2').textContent = `F_L = I·l·B = ${fmt(Math.abs(Ieff()), 1)} A · ${fmt(len() * 100, 0)} cm · ${fmt(B0, 3)} T`;
        }
      }
      raf = requestAnimationFrame(frame);
      return { destroy() { cancelAnimationFrame(raf); } };
    }

    // ======================= Ansicht 3D =======================
    async function view3d(box, MM) {
      const { createLab, mats, cable, powerSupply, arrow, label, glowPool } = await import('../js/lib/lab3d.js');
      const lab = await createLab(box, { cam: [0.42, 0.36, 0.55], target: [0.05, 0.13, 0], table: [2, 1.4], bloom: [0.5, 0.4, 0.88], room: 0.55, minDist: 0.15, maxDist: 2.5, fov: 36 });
      const { THREE, scene } = lab; const M = mats(THREE);
      box.insertAdjacentHTML('beforeend', '<div class="hint">Drehen: ziehen · Zoom: Mausrad</div>');
      const YP = 0.30, YR = YP - LW;                                      // Aufhängung, Stab in Ruhe
      // Stativ
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.012, 0.16), M.housing); base.position.set(-0.16, 0.006, -0.12); base.castShadow = base.receiveShadow = true; scene.add(base);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.34, 16), M.steel); post.position.set(-0.16, 0.17, -0.12); scene.add(post);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.18, 16), M.steel); arm.rotation.z = Math.PI / 2; arm.position.set(-0.075, YP + 0.01, -0.12); scene.add(arm);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.3, 16), M.steel); bar.rotation.x = Math.PI / 2; bar.position.set(0, YP + 0.01, 0.0); scene.add(bar);
      const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.02), M.black); clamp.position.set(0, YP + 0.01, -0.12); scene.add(clamp);
      const posts = [-1, 1].map(s => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.02, 16), s < 0 ? M.red : M.sblack); p.position.set(0, YP + 0.022, s * 0.13); scene.add(p); return p; });
      // Schaukel (dreht sich um die z-Achse durch die Aufhängung)
      const swing = new THREE.Group(); swing.position.set(0, YP, 0); scene.add(swing);
      const wireMat = new THREE.MeshStandardMaterial({ color: 0xd0d4d8, metalness: 1, roughness: 0.3 });
      for (const z of [-0.055, 0.055]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.0007, 0.0007, LW, 6), wireMat); w.position.set(0, -LW / 2, z); swing.add(w); }
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.14, 24), M.copper); rod.rotation.x = Math.PI / 2; rod.position.y = -LW; rod.castShadow = true; swing.add(rod);
      // Magnete (auf der Seite liegend: Schenkel oben/unten, Joch hinten in +x)
      const magG = new THREE.Group(); scene.add(magG);
      const matR = new THREE.MeshStandardMaterial({ color: 0xc4231b, roughness: 0.45 }), matG = new THREE.MeshStandardMaterial({ color: 0x2f8a3c, roughness: 0.45 }), matY = new THREE.MeshStandardMaterial({ color: 0x3a3f44, roughness: 0.4, metalness: 0.5 });
      const block = new THREE.Mesh(new THREE.BoxGeometry(0.2, YR - 0.051, 0.12), new THREE.MeshStandardMaterial({ color: 0x6b5236, roughness: 0.85 })); block.position.set(0.04, (YR - 0.051) / 2, 0); block.castShadow = block.receiveShadow = true; scene.add(block);
      const legsTop = [], legsBot = [];
      function buildMagnets() {
        magG.clear(); legsTop.length = legsBot.length = 0;
        for (let i = 0; i < S.nMag; i++) {
          const z = (i - (S.nMag - 1) / 2) * 0.032, g = new THREE.Group(); g.position.z = z; magG.add(g);
          const t = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.016, 0.03), matR); t.position.set(0.035, YR + 0.043, 0);
          const b = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.016, 0.03), matG); b.position.set(0.035, YR - 0.043, 0);
          const y = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.102, 0.03), matY); y.position.set(0.122, YR, 0);
          for (const m of [t, b, y]) { m.castShadow = m.receiveShadow = true; g.add(m); }
          legsTop.push(t); legsBot.push(b);
        }
        for (const m of legsTop) m.material = S.nTop ? matR : matG; for (const m of legsBot) m.material = S.nTop ? matG : matR;
      }
      buildMagnets();
      const lN = label(THREE, 'N', { color: '#ffffff', size: 0.016 }), lS = label(THREE, 'S', { color: '#ffffff', size: 0.016 }); scene.add(lN, lS);
      // Netzgerät und Kabel
      const psu = powerSupply(THREE, { w: 0.26, h: 0.13, d: 0.2, label: 'Hochstrom-Netzgerät', displays: 1, knobs: 2, sockets: ['red', 'black'] });
      psu.position.set(-0.32, 0, 0.12); psu.rotation.y = 0.5; scene.add(psu); scene.updateMatrixWorld(true);
      const wp = o => o.getWorldPosition(new THREE.Vector3());
      const tA = wp(posts[0]).add(new THREE.Vector3(0, 0.01, 0)), tB = wp(posts[1]).add(new THREE.Vector3(0, 0.01, 0));
      const cR = cable(THREE, psu.socketWorld(0), tA, 0xc4231b, 0.2), cB = cable(THREE, psu.socketWorld(1), tB, 0x151515, 0.25); scene.add(cR, cB);
      // Modell
      const modelG = new THREE.Group(); scene.add(modelG);
      const bArrows = []; for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { const a = arrow(THREE, 0x86dcff, { radius: 0.0011, head: 0.008 }); bArrows.push({ a, x: -0.02 + i * 0.025, z: (j - 1) * 0.03 }); modelG.add(a); }
      const aF = arrow(THREE, 0xf2ac74, { radius: 0.0025, head: 0.014 }), aI = arrow(THREE, 0xffe08a, { radius: 0.0016, head: 0.01 }), aG = arrow(THREE, 0x7fd6a0, { radius: 0.002, head: 0.012 });
      modelG.add(aF, aI, aG);
      const lF = label(THREE, 'F_L', { color: '#f2ac74', size: 0.014 }), lB = label(THREE, 'B', { color: '#86dcff', size: 0.014 }), lI = label(THREE, 'I (technisch)', { color: '#ffe08a', size: 0.011 }), lG = label(THREE, 'F_G', { color: '#7fd6a0', size: 0.012 });
      modelG.add(lF, lB, lI, lG);
      const ePool = glowPool(THREE, modelG, 60, 0x86dcff, 0.006);
      // Elektronenweg: Buchse − → Pfosten → Draht → Stab → Draht → Pfosten → Buchse +
      let ePhase = 0;
      const tmpV = new THREE.Vector3();
      function pathPoint(u, phi) {   // u 0…1 entlang Draht(+z) → Stab → Draht(−z)
        const s = Math.sin(phi), c = Math.cos(phi);
        const P = (x, y, z) => tmpV.set(x * c - y * s, x * s + y * c + YP, z).clone();
        if (u < 0.35) { const k = u / 0.35; return P(0, -LW * k, 0.055); }
        if (u < 0.65) { const k = (u - 0.35) / 0.3; return P(0, -LW, 0.055 - 0.11 * k); }
        const k = (u - 0.65) / 0.35; return P(0, -LW * (1 - k), -0.055);
      }
      const off = lab.onFrame((dt, t) => {
        const model = MM.model;
        swing.rotation.z = S.phi;
        if (magG.children.length !== S.nMag || magG.userData.top !== S.nTop) { buildMagnets(); magG.userData.top = S.nTop; }
        psu.displays[0].draw((S.on ? S.I : 0).toFixed(2), 'A'); psu.setKnob(0, S.I / IMAX);
        const zl = (S.nMag * 0.032) / 2 + 0.01;
        lN.position.set(-0.03, YR + (S.nTop ? 0.062 : -0.062), zl); lS.position.set(-0.03, YR + (S.nTop ? -0.062 : 0.062), zl);
        modelG.visible = model; if (!model) return;
        const rodPos = new THREE.Vector3(LW * Math.sin(S.phi), YP - LW * Math.cos(S.phi), 0);
        const down = bd(), ie = Ieff();
        for (const b of bArrows) { b.a.visible = Math.abs(b.z) <= (S.nMag - 1) * 0.016 + 0.001; b.a.set(new THREE.Vector3(b.x, YR + down * 0.03, b.z), new THREE.Vector3(0, -down * 0.06, 0)); }
        lB.position.set(0.1, YR + 0.005, (S.nMag * 0.032) / 2 + 0.012);
        const FL = Fx(), kF = 1.6;
        aF.set(rodPos, new THREE.Vector3(FL * kF, 0, 0)); lF.position.copy(rodPos).add(new THREE.Vector3(FL * kF + Math.sign(FL || 1) * 0.015, 0.012, 0)); lF.visible = Math.abs(FL) > 0.002;
        aG.set(rodPos, new THREE.Vector3(0, -MASS * G * kF * 0.25, 0)); lG.position.copy(rodPos).add(new THREE.Vector3(0.012, -MASS * G * kF * 0.25, 0));
        // technische Stromrichtung entlang des Stabs: + bedeutet aus der Zeichenebene heraus = +z
        aI.set(rodPos.clone().add(new THREE.Vector3(0, 0.012, -Math.sign(ie || 1) * 0.04)), new THREE.Vector3(0, 0, Math.sign(ie) * 0.08)); aI.visible = !!ie; lI.visible = !!ie;
        lI.position.copy(rodPos).add(new THREE.Vector3(0, 0.026, 0));
        // Elektronen laufen entgegen der technischen Stromrichtung (Geschwindigkeit stark vergrößert)
        ePhase += dt * 0.08 * (ie / IMAX);
        ePool.items.forEach((sp, i) => {
          sp.visible = !!ie; if (!ie) return;
          const u = (((i / ePool.items.length) + ePhase) % 1 + 1) % 1;
          sp.position.copy(pathPoint(u, S.phi));
        });
      });
      return { destroy() { off(); lab.dispose(); } };
    }

    const host = viewHost(stage, { id: 'leiterschaukel', views: { '3d': view3d, '2d': view2d }, initial: '3d', modelInfo: 'Gesamtfeld, Kräfte, Elektronen' });

    // ---- Hauptschleife: Pendelbewegung ----
    let raf = 0, last = performance.now(), acc = 0;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const n = 8, h = dt / n, F = Fx();
      for (let i = 0; i < n; i++) {
        const a = (F * Math.cos(S.phi) - MASS * G * Math.sin(S.phi)) / (MASS * LW) - GAMMA * S.w;
        S.w += a * h; S.phi += S.w * h;
        if (Math.abs(S.phi) > PHI_MAX) { S.phi = Math.sign(S.phi) * PHI_MAX; S.w = -0.3 * S.w; }
      }
      S.phi += gauss(0.00002);
      acc += dt;
      if (acc > 0.1) { acc = 0; const s = reading(), phi = Math.asin(Math.min(1, Math.abs(s) / 1000 / LW)); dS.set(`${fmt(s, 1)} mm`); dPhi.set(`${fmt(phi * 180 / Math.PI, 2)} °`); dF.set(`${fmt(MASS * G * Math.tan(phi) * 1000, 1)} mN`); }
    }
    raf = requestAnimationFrame(loop);
    return { destroy() { cancelAnimationFrame(raf); host.destroy(); chI.destroy(); chL.destroy(); } };
  }
};
