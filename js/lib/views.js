// ============================================================================
//  views.js – Umschalter für die Bühne: 2D-Aufbau ↔ 3D-Aufbau, Realansicht ↔ Modell
//  Jede Ansicht ist eine Funktion (container, M) → { destroy(), setModel?(on) }.
//  M ist ein gemeinsames Objekt { model: bool, kind: '2d'|'3d' }; Ansichten lesen
//  M.model in jedem Bild. Die Physik läuft im Versuch selbst weiter, egal welche
//  Ansicht gerade zu sehen ist.
// ============================================================================
import { el, segmented } from './ui.js';

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* egal */ } }
};

export function viewHost(stage, { id, views, initial = '3d', model = false, modelInfo = '' }) {
  const kinds = Object.keys(views);
  const M = { model: store.get(`sl-${id}-model`) === '1' || (store.get(`sl-${id}-model`) == null && model), kind: null };
  let kind = store.get(`sl-${id}-view`); if (!kinds.includes(kind)) kind = kinds.includes(initial) ? initial : kinds[0];
  const box = el('div', { class: 'view' });
  stage.prepend(box);
  const listeners = new Set();
  const bar = el('div', { class: 'vbar' });
  if (kinds.length > 1) bar.append(segmented({ value: kind, options: kinds.map(k => ({ value: k, label: k === '3d' ? '3D-Aufbau' : '2D-Aufbau' })), onChange: v => show(v) }));
  const segM = segmented({ value: M.model ? 'm' : 'r', options: [{ value: 'r', label: 'Realansicht' }, { value: 'm', label: 'Modell' }], onChange: v => setModel(v === 'm') });
  bar.append(segM);
  const tag = el('div', { class: 'modeltag', hidden: true }, 'Modellvorstellung', modelInfo ? el('span', {}, ' · ' + modelInfo) : null);
  stage.append(bar, tag);
  let cur = null, token = 0;

  async function show(k) {
    const my = ++token;
    try { cur?.destroy?.(); } catch (e) { console.error(e); }
    cur = null; box.innerHTML = '<div class="loading">Ansicht wird aufgebaut …</div>';
    kind = k; M.kind = k; store.set(`sl-${id}-view`, k);
    stage.dataset.view = k;
    try {
      const v = await views[k](box, M);
      if (my !== token) { v?.destroy?.(); return; }
      cur = v; box.querySelector(':scope > .loading')?.remove();
      cur?.setModel?.(M.model);
    } catch (e) {
      console.error(e);
      box.innerHTML = `<div class="loading">Diese Ansicht konnte nicht geladen werden.<br><span class="muted mono" style="font-size:12px">${String(e.message || e)}</span></div>`;
    }
  }
  function setModel(on) {
    M.model = on; segM.set(on ? 'm' : 'r'); store.set(`sl-${id}-model`, on ? '1' : '0');
    tag.hidden = !on; stage.classList.toggle('is-model', on);
    cur?.setModel?.(on); for (const f of listeners) f(on);
  }
  setModel(M.model);
  const ready = show(kind);
  return {
    M, ready,
    get kind() { return kind; },
    onModel(f) { listeners.add(f); f(M.model); return () => listeners.delete(f); },
    refresh() { return show(kind); },
    destroy() { token++; try { cur?.destroy?.(); } catch (e) { console.error(e); } cur = null; }
  };
}
