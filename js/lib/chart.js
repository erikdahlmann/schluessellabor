// Leichtgewichtiges Messdiagramm (Canvas). Linien, Messpunkte, Ausgleichskurven.
function niceStep(range, target) {
  const raw = range / target, p = 10 ** Math.floor(Math.log10(raw)), f = raw / p;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
}
const num = v => {
  const a = Math.abs(v);
  if (a !== 0 && (a < 1e-3 || a >= 1e5)) return v.toExponential(1).replace('.', ',');
  return (+v.toPrecision(6)).toLocaleString('de-DE', { maximumFractionDigits: 4 });
};

export class Chart {
  constructor(host, opts = {}) {
    this.host = host; this.o = Object.assign({ xlabel: 'x', ylabel: 'y', includeZero: true }, opts);
    this.cv = document.createElement('canvas'); host.append(this.cv);
    this.series = []; this.fits = [];
    this.ro = new ResizeObserver(() => this.draw()); this.ro.observe(host);
  }
  set(series, fits = []) { this.series = series; this.fits = fits; this.draw(); }
  range() {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const s of this.series) for (const [x, y] of s.points) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const o = this.o;
    if (!isFinite(x0)) { x0 = 0; x1 = 1; y0 = 0; y1 = 1; }
    if (o.includeZero) { x0 = Math.min(0, x0); y0 = Math.min(0, y0); y1 = Math.max(0, y1); }
    if (o.xmin != null) x0 = o.xmin; if (o.xmax != null) x1 = Math.max(o.xmax, o.xgrow ? x1 : o.xmax);
    if (o.ymin != null) y0 = o.ymin; if (o.ymax != null) y1 = o.ymax;
    if (x1 - x0 < 1e-12) x1 = x0 + 1; if (y1 - y0 < 1e-12) { y1 += Math.abs(y1) * .1 + 1e-9; y0 -= Math.abs(y0) * .1 + 1e-9; }
    const py = (y1 - y0) * 0.08; if (o.ymax == null) y1 += py; if (o.ymin == null && y0 < 0) y0 -= py;
    if (o.ymin == null && y0 > 0 && !o.includeZero) y0 -= py;
    return { x0, x1, y0, y1 };
  }
  draw() {
    const { cv, host } = this; const W = host.clientWidth, H = host.clientHeight; if (!W || !H) return;
    const dpr = Math.min(2, devicePixelRatio || 1); cv.width = W * dpr; cv.height = H * dpr;
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    const small = W < 420;
    const L = small ? 46 : 62, R = 14, T = 14, B = small ? 40 : 46;
    const { x0, x1, y0, y1 } = this.range();
    const X = x => L + (x - x0) / (x1 - x0) * (W - L - R), Y = y => H - B - (y - y0) / (y1 - y0) * (H - T - B);
    c.font = '12px "IBM Plex Mono", monospace'; c.fillStyle = '#8e979d'; c.strokeStyle = '#232a30'; c.lineWidth = 1;
    const sx = niceStep(x1 - x0, small ? 4 : 7), sy = niceStep(y1 - y0, 5);
    c.textAlign = 'center'; c.textBaseline = 'top';
    for (let x = Math.ceil(x0 / sx) * sx; x <= x1 + 1e-9; x += sx) { const px = X(x); c.beginPath(); c.moveTo(px, T); c.lineTo(px, H - B); c.stroke(); c.fillText(num(x), px, H - B + 6); }
    c.textAlign = 'right'; c.textBaseline = 'middle';
    for (let y = Math.ceil(y0 / sy) * sy; y <= y1 + 1e-9; y += sy) { const py = Y(y); c.beginPath(); c.moveTo(L, py); c.lineTo(W - R, py); c.stroke(); c.fillText(num(y), L - 6, py); }
    c.strokeStyle = '#4a545c'; c.beginPath(); c.moveTo(L, Y(Math.max(y0, Math.min(0, y1)))); c.lineTo(W - R, Y(Math.max(y0, Math.min(0, y1)))); c.moveTo(X(Math.max(x0, 0)), T); c.lineTo(X(Math.max(x0, 0)), H - B); c.stroke();
    c.fillStyle = '#c7c1b7'; c.font = '13px "IBM Plex Sans", sans-serif';
    c.textAlign = 'right'; c.textBaseline = 'bottom'; c.fillText(this.o.xlabel, W - R, H - 4);
    c.save(); c.translate(13, T); c.rotate(-Math.PI / 2); c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillText(this.o.ylabel, 0, 0); c.restore();
    c.save(); c.beginPath(); c.rect(L, T, W - L - R, H - T - B); c.clip();
    for (const f of this.fits) {
      c.strokeStyle = f.color || '#ab93ff'; c.setLineDash([6, 5]); c.lineWidth = 1.6; c.beginPath();
      for (let i = 0; i <= 160; i++) { const x = x0 + (x1 - x0) * i / 160, y = f.f(x); i ? c.lineTo(X(x), Y(y)) : c.moveTo(X(x), Y(y)); }
      c.stroke(); c.setLineDash([]);
    }
    for (const s of this.series) {
      c.strokeStyle = c.fillStyle = s.color || '#86dcff';
      if (s.mode === 'dot') {
        for (const [x, y] of s.points) { c.beginPath(); c.arc(X(x), Y(y), 4, 0, 7); c.fill(); c.strokeStyle = '#0a0c0e'; c.lineWidth = 1; c.stroke(); }
      } else {
        c.lineWidth = s.width || 1.8; c.beginPath(); let first = true;
        for (const [x, y] of s.points) { first ? c.moveTo(X(x), Y(y)) : c.lineTo(X(x), Y(y)); first = false; }
        c.stroke();
      }
    }
    c.restore();
    // Legende
    const items = [...this.series.filter(s => s.name), ...this.fits.filter(f => f.name)];
    let lx = L + 10; c.font = '12px "IBM Plex Sans", sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle';
    for (const s of items) { c.fillStyle = s.color || '#86dcff'; c.fillRect(lx, T + 10, 14, 3); c.fillStyle = '#c7c1b7'; c.fillText(s.name, lx + 19, T + 11); lx += c.measureText(s.name).width + 40; }
  }
  destroy() { this.ro.disconnect(); this.cv.remove(); }
}
