// Ausgleichsrechnungen für die Auswertung
// Lineare Regression y = a·x + b
export function linFit(xs, ys) {
  const n = xs.length; if (n < 2) return null;
  let sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; sxx += xs[i] ** 2; sxy += xs[i] * ys[i]; syy += ys[i] ** 2; }
  const d = n * sxx - sx * sx; if (!d) return null;
  const a = (n * sxy - sx * sy) / d, b = (sy - a * sx) / n;
  const r2 = (n * sxy - sx * sy) ** 2 / (d * (n * syy - sy * sy) || 1);
  return { a, b, r2, f: x => a * x + b };
}
// Ursprungsgerade y = a·x
export function propFit(xs, ys) {
  let sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < xs.length; i++) { sxx += xs[i] ** 2; sxy += xs[i] * ys[i]; syy += ys[i] ** 2; }
  if (!sxx) return null;
  const a = sxy / sxx;
  let ssr = 0, my = ys.reduce((s, v) => s + v, 0) / ys.length, sst = 0;
  for (let i = 0; i < xs.length; i++) { ssr += (ys[i] - a * xs[i]) ** 2; sst += (ys[i] - my) ** 2; }
  return { a, b: 0, r2: sst ? 1 - ssr / sst : 1, f: x => a * x };
}
// Exponentialfit y = A·e^(−t/τ) über ln-Linearisierung
export function expDecayFit(ts, ys) {
  const X = [], Y = [];
  for (let i = 0; i < ts.length; i++) if (ys[i] > 0) { X.push(ts[i]); Y.push(Math.log(ys[i])); }
  const l = linFit(X, Y); if (!l || l.a >= 0) return null;
  return { tau: -1 / l.a, A: Math.exp(l.b), r2: l.r2, f: t => Math.exp(l.b) * Math.exp(l.a * t) };
}
// Nulldurchgänge (aufsteigend) → Periodendauern
export function periodsFromSignal(ts, ys) {
  const n = ys.length; if (n < 10) return [];
  const mean = ys.reduce((s, v) => s + v, 0) / n;
  const cross = [];
  for (let i = 1; i < n; i++) {
    const a = ys[i - 1] - mean, b = ys[i] - mean;
    if (a < 0 && b >= 0) cross.push(ts[i - 1] + (ts[i] - ts[i - 1]) * (-a / (b - a)));
  }
  const T = []; for (let i = 1; i < cross.length; i++) T.push(cross[i] - cross[i - 1]);
  return T;
}
export const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
export const stdev = a => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(1, a.length - 1)); };
