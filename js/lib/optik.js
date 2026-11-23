// ============================================================================
//  optik.js – gemeinsame Rechnung für Gitter und Spektrallampen
//  Maxima am Gitter: g·sin α_k = k·λ (exakt, ohne Kleinwinkelnäherung)
//  Lage auf einem ebenen Schirm im Abstand a: x_k = a·tan α_k
// ============================================================================

// Wellenlänge (nm) → sRGB 0…255 (Näherung nach Bruton)
export function lamRGB(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = -(nm - 440) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; } else r = 1;
  const f = nm < 420 ? 0.35 + 0.65 * (nm - 380) / 40 : nm > 700 ? 0.35 + 0.65 * (780 - nm) / 80 : 1;
  return [r, g, b].map(c => Math.round(255 * Math.pow(Math.max(0, c) * Math.max(0, f), 0.8)));
}
export const rgbStr = (nm, add = 0) => { const [r, g, b] = lamRGB(nm); return `rgb(${Math.min(255, r + add)},${Math.min(255, g + add)},${Math.min(255, b + add)})`; };
export const sinc = u => Math.abs(u) < 1e-9 ? 1 : Math.sin(u) / u;

// Lage aller Maxima: [{ k, nm, w, s = sin α, alpha, x (mm) }]
export function maxima(lines, gM, aM, kmax = 6) {
  const out = [];
  for (const L of lines) for (let k = -kmax; k <= kmax; k++) {
    const s = k * L.nm * 1e-9 / gM; if (Math.abs(s) >= 0.995) continue;
    const alpha = Math.asin(s); out.push({ k, nm: L.nm, w: L.w, s, alpha, x: aM * Math.tan(alpha) * 1000 });
  }
  return out;
}

// Farbiges Schirmbild: Summe aller Maxima als Gauß-Flecken in nb Bins über −span/2 … +span/2 (mm)
// bFrac: Spaltbreite/Gitterkonstante (Hüllkurve), sigma: Breite des Flecks in mm
export function screenBins(lines, gM, aM, span, nb, { kmax = 6, bFrac = 0.32, sigma = 1.6, gain = 1 } = {}) {
  const acc = new Float32Array(nb * 3), bin = span / nb;
  for (const m of maxima(lines, gM, aM, kmax)) {
    if (Math.abs(m.x) > span / 2 + 4 * sigma) continue;
    const env = m.k === 0 ? 1 : sinc(Math.PI * bFrac * m.k) ** 2;
    const c = Math.cos(m.alpha), I = m.w * env * c * c * c * gain;   // cos³: Schrägeinfall auf ebenem Schirm
    const [r, g, b] = lamRGB(m.nm), sig = Math.max(0.7, sigma / bin / (c * c));
    const i0 = (m.x + span / 2) / bin - 0.5, lo = Math.max(0, Math.floor(i0 - 3.2 * sig)), hi = Math.min(nb - 1, Math.ceil(i0 + 3.2 * sig));
    for (let i = lo; i <= hi; i++) { const e = I * Math.exp(-0.5 * ((i - i0) / sig) ** 2); acc[3 * i] += r / 255 * e; acc[3 * i + 1] += g / 255 * e; acc[3 * i + 2] += b / 255 * e; }
  }
  return acc;
}
// Bin-Werte → Farbe (weiche Sättigung, sehr helle Stellen werden weißlich)
export function binColor(acc, i, bg = [24, 25, 27]) {
  const r = acc[3 * i], g = acc[3 * i + 1], b = acc[3 * i + 2], s = r + g + b;
  const w = 255 * 0.3 * Math.max(0, s - 1.6);
  const t = v => 1 - Math.exp(-1.7 * v);
  return [bg[0] + (255 - bg[0]) * t(r) + w, bg[1] + (255 - bg[1]) * t(g) + w, bg[2] + (255 - bg[2]) * t(b) + w].map(v => Math.min(255, Math.round(v)));
}

// Weißes Licht (Glühlampe) als viele schmale Linien
export const WHITE = Array.from({ length: 64 }, (_, i) => { const nm = 400 + i * 300 / 63; return { nm, w: (0.55 + 0.45 * (nm - 400) / 300) * 0.11 }; });
