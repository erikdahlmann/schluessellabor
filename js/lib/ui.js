// Kleine UI-Bausteine für Bedienfelder (Netzgerät-Look). Keine Abhängigkeiten.
export const $ = (s, r = document) => r.querySelector(s);
export const fmt = (v, d = 2) => Number.isFinite(v) ? v.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d }) : '–';

export function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) n.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null) n.append(k.nodeType ? k : document.createTextNode(k));
  return n;
}

export function group(title, { led = false } = {}) {
  const ledEl = led ? el('span', { class: 'led' }) : null;
  const g = el('div', { class: 'grp' }, el('h4', {}, ledEl, title));
  g.led = on => ledEl && ledEl.classList.toggle('on', !!on);
  return g;
}

let uid = 0;
export function slider({ label, min, max, step = 1, value, unit = '', digits = 0, onInput }) {
  const id = 'sl' + (++uid);
  const out = el('output', { for: id });
  const inp = el('input', { type: 'range', id, min, max, step, value });
  const wrap = el('div', { class: 'ctl' }, el('label', { for: id }, label), out, inp);
  const paint = () => {
    const v = +inp.value;
    out.textContent = `${fmt(v, digits)}${unit ? ' ' + unit : ''}`;
    inp.style.setProperty('--p', `${((v - min) / (max - min)) * 100}%`);
  };
  inp.addEventListener('input', () => { paint(); onInput && onInput(+inp.value); });
  paint();
  wrap.get = () => +inp.value;
  wrap.set = (v, fire = false) => { inp.value = v; paint(); if (fire && onInput) onInput(+inp.value); };
  wrap.input = inp;
  return wrap;
}

export function selectBox({ label, options, value, onChange }) {
  const id = 'se' + (++uid);
  const s = el('select', { id }, options.map(o => el('option', { value: o.value, selected: String(o.value) === String(value) }, o.label)));
  s.addEventListener('change', () => onChange && onChange(s.value));
  const w = el('div', { class: 'ctl' }, el('label', { for: id, style: 'grid-column:1/-1' }, label), el('div', { style: 'grid-column:1/-1' }, s));
  w.get = () => s.value; w.set = v => { s.value = v; }; w.select = s;
  return w;
}

export function segmented({ options, value, onChange }) {
  const w = el('div', { class: 'seg', role: 'group' });
  const btns = options.map(o => {
    const b = el('button', { type: 'button', 'aria-pressed': String(o.value === value) }, o.label);
    b.addEventListener('click', () => { set(o.value); onChange && onChange(o.value); });
    w.append(b); return [o.value, b];
  });
  function set(v) { for (const [k, b] of btns) { b.classList.toggle('on', k === v); b.setAttribute('aria-pressed', String(k === v)); } }
  set(value); w.set = set;
  return w;
}

export function check({ label, checked = false, onChange }) {
  const inp = el('input', { type: 'checkbox', checked });
  inp.addEventListener('change', () => onChange && onChange(inp.checked));
  const w = el('label', { class: 'chk' }, inp, label);
  w.get = () => inp.checked; w.set = v => { inp.checked = v; };
  return w;
}

export function button(label, onClick, cls = 'btn small') {
  return el('button', { type: 'button', class: cls, onclick: onClick }, label);
}

// Digitale Anzeige wie am Netzgerät/Messgerät
export function display(label, { red = false } = {}) {
  const b = el('b', {}, '–');
  const w = el('div', { class: 'dig' + (red ? ' red' : '') }, el('span', {}, label), b);
  w.set = t => { b.textContent = t; };
  return w;
}

export function toast(msg, ms = 2600) {
  const t = el('div', { class: 'toast', role: 'status' }, msg);
  document.body.append(t);
  setTimeout(() => t.remove(), ms);
}

// Messwerttabelle mit Löschknopf je Zeile
export function dataTable(columns, { onDelete } = {}) {
  const wrap = el('div', { class: 'tblwrap' });
  function render(rows) {
    if (!rows.length) { wrap.innerHTML = '<div class="empty">Noch keine Messwerte. Führe den Versuch durch und übernimm Messwerte.</div>'; return; }
    const head = '<tr><th>Nr.</th>' + columns.map(c => `<th>${c.label}</th>`).join('') + (onDelete ? '<th></th>' : '') + '</tr>';
    const body = rows.map((r, i) => `<tr${r._bad ? ' class="bad"' : ''}><td>${i + 1}</td>` +
      columns.map(c => `<td>${c.fmt ? c.fmt(r[c.key]) : fmt(r[c.key], c.digits ?? 2)}</td>`).join('') +
      (onDelete ? `<td><button class="del" data-i="${i}" aria-label="Messwert ${i + 1} löschen">×</button></td>` : '') + '</tr>').join('');
    wrap.innerHTML = `<table class="tbl"><thead>${head}</thead><tbody>${body}</tbody></table>`;
  }
  wrap.addEventListener('click', e => { const b = e.target.closest('.del'); if (b) onDelete(+b.dataset.i); });
  wrap.render = render;
  render([]);
  return wrap;
}

// gaußverteiltes Rauschen (Box-Muller)
export function gauss(sigma = 1) {
  let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random();
  return sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
