// CSV-Export. Standard: deutsches Excel-Format (Semikolon, Dezimalkomma, UTF-8 mit BOM).
// Speichern über die Download-Funktion der Artefakt-Seite, sonst klassischer Browser-Download,
// zusätzlich immer "Kopieren" als Ausweg.
import { el, toast } from './ui.js';

export function toCSV(columns, rows, { de = true, meta = [] } = {}) {
  const sep = de ? ';' : ',';
  const f = v => typeof v === 'number' ? (de ? String(+v.toPrecision(10)).replace('.', ',') : String(+v.toPrecision(10))) : `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [];
  for (const m of meta) lines.push(`# ${m}`);
  lines.push(columns.map(c => `"${c.label}"`).join(sep));
  for (const r of rows) lines.push(columns.map(c => f(r[c.key])).join(sep));
  return lines.join('\r\n');
}

let dl = null;
const dlReady = (async () => { try { if (window.claude?.use) dl = await window.claude.use('downloads'); } catch { dl = null; } })();

export async function saveCSV(filename, text) {
  const data = '﻿' + text;
  await Promise.race([dlReady, new Promise(r => setTimeout(r, 300))]);
  if (dl) {
    try { await dl.save({ filename, data }); toast('CSV gespeichert: ' + filename); return; }
    catch (e) { if (e?.code === 'declined') { toast('Speichern abgebrochen.'); return; } }
  }
  try {
    const a = el('a', { href: URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8' })), download: filename });
    document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast('CSV-Download gestartet. Falls nichts passiert: „CSV anzeigen“ nutzen.');
  } catch { showCSV(filename, text); }
}

export function showCSV(filename, text) {
  const ta = el('textarea', { readonly: true, 'aria-label': 'CSV-Daten' }); ta.value = text;
  const m = el('div', { class: 'modal', role: 'dialog', 'aria-label': filename },
    el('div', {}, el('h3', { style: 'margin-bottom:10px' }, filename), ta,
      el('div', { class: 'bar', style: 'margin-top:12px' },
        el('button', { class: 'btn small primary', type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(text); toast('In die Zwischenablage kopiert.'); } catch { ta.select(); toast('Text markiert – mit Strg/Cmd+C kopieren.'); } } }, 'Kopieren'),
        el('button', { class: 'btn small', type: 'button', onclick: () => m.remove() }, 'Schließen'))));
  m.addEventListener('click', e => { if (e.target === m) m.remove(); });
  document.body.append(m);
}

// Werkzeugleiste: [CSV speichern] [CSV anzeigen] [Format]
export function csvTools(getData, baseName) {
  let de = true;
  const fmtSel = el('select', { 'aria-label': 'CSV-Format', style: 'width:auto;min-height:36px' },
    el('option', { value: 'de' }, 'Excel (DE): ; und ,'), el('option', { value: 'int' }, 'International: , und .'));
  fmtSel.addEventListener('change', () => { de = fmtSel.value === 'de'; });
  const build = () => { const d = getData(); if (!d.rows.length) { toast('Noch keine Daten vorhanden.'); return null; } return toCSV(d.columns, d.rows, { de, meta: d.meta || [] }); };
  const stamp = () => new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
  return el('div', { class: 'toolbar' },
    el('button', { class: 'btn small primary', type: 'button', onclick: () => { const t = build(); if (t) saveCSV(`${baseName}_${stamp()}.csv`, t); } }, 'CSV exportieren'),
    el('button', { class: 'btn small', type: 'button', onclick: () => { const t = build(); if (t) showCSV(`${baseName}.csv`, t); } }, 'CSV anzeigen / kopieren'),
    fmtSel);
}
