// ============================================================================
//  app.js – Startseite, Routing (#<experiment-id>) und Versuchs-Rahmen
// ============================================================================
import { FIELDS, EXPERIMENTS, byId, fieldOf } from './registry.js';
import { icon } from './lib/icons.js';
import { startHero } from './lib/hero.js';
import * as ui from './lib/ui.js';
import { Chart } from './lib/chart.js';
import { csvTools } from './lib/csv.js';
import * as fit from './lib/fit.js';

const app = document.getElementById('app');
let cleanup = null;
const ready = EXPERIMENTS.filter(e => e.status === 'bereit');

function card(e) {
  const r = e.status === 'bereit';
  const inner = `<div class="ic">${icon(e.id)}</div><h3>${e.title}</h3><p>${e.teaser}</p>
    <div class="meta">${r ? '<span class="tag ready">Durchführbar</span>' : '<span class="tag">In Vorbereitung</span>'}<span class="tag">${e.tech === '3d' ? '3D-Aufbau' : '2D-Aufbau'}</span></div>`;
  return r ? `<a class="card ready" href="#${e.id}">${inner}</a>` : `<div class="card" aria-disabled="true">${inner}</div>`;
}

function renderHome(scrollTo) {
  document.title = 'Schlüssellabor Physik – Grundkurs NRW';
  app.innerHTML = `
  <section class="hero">
    <canvas aria-hidden="true"></canvas>
    <div class="wrap">
      <h1>Alle Schlüssel&shy;experimente. Digital aufgebaut.</h1>
      <p class="lead">Die verbindlichen Schlüsselexperimente des Grundkurses Physik in NRW als virtuelle Versuchsaufbauten: Geräte in realen Abmessungen, echte Verschaltung, Messwerte mit Streuung – zum Durchführen, Auswerten, als CSV exportieren und für die Abiturvorbereitung.</p>
      <div class="kpis">
        <div class="kpi"><b>${EXPERIMENTS.length}</b><span>Schlüsselexperimente</span></div>
        <div class="kpi"><b>${FIELDS.length}</b><span>Inhaltsfelder</span></div>
        <div class="kpi"><b>${ready.length}</b><span>bereits durchführbar</span></div>
      </div>
      <div class="btns">${ready.map((e, i) => `<a class="btn${i ? '' : ' primary'}" href="#${e.id}">${e.short || e.title}</a>`).join('')}</div>
    </div>
  </section>
  ${FIELDS.map(f => `
  <section class="field" id="feld-${f.id}" data-hue="${f.hue}">
    <div class="wrap">
      <div class="field-head">
        <div><div class="field-mark"><i></i>Inhaltsfeld · ${EXPERIMENTS.filter(e => e.field === f.id).length} Experimente</div><h2>${f.title}</h2></div>
        <p>${f.intro}</p>
      </div>
      <div class="cards">${EXPERIMENTS.filter(e => e.field === f.id).map(card).join('')}</div>
    </div>
  </section>`).join('')}
  <section class="how"><div class="wrap">
    <h2>So arbeitet ihr mit dem Labor</h2>
    <div class="steps">
      <div class="step"><b>Aufbau erkunden</b><p>Die Apparatur drehen, zoomen und die Verschaltung nachvollziehen – die Maße entsprechen den üblichen Schulgeräten.</p></div>
      <div class="step"><b>Messen</b><p>Netzgeräte, Massen, Bauteile einstellen und Messwerte aufnehmen. Messwerte streuen wie im echten Versuch.</p></div>
      <div class="step"><b>Auswerten & exportieren</b><p>Diagramme mit Ausgleichsgerade direkt im Labor oder als CSV in Excel, Numbers oder GeoGebra weiterverarbeiten.</p></div>
      <div class="step"><b>Abi-Check</b><p>Typische Prüfungsfragen zum Versuch mit aufklappbaren Lösungsskizzen.</p></div>
    </div>
  </div></section>`;
  const stop = startHero(app.querySelector('.hero canvas'));
  cleanup = () => stop();
  if (scrollTo) requestAnimationFrame(() => document.getElementById(scrollTo)?.scrollIntoView());
  else scrollTo0();
}

function scrollTo0() { window.scrollTo({ top: 0 }); }

async function renderExperiment(meta) {
  const f = fieldOf(meta);
  const idx = ready.indexOf(meta), prev = ready[(idx - 1 + ready.length) % ready.length], next = ready[(idx + 1) % ready.length];
  document.title = `${meta.title} – Schlüssellabor Physik`;
  app.innerHTML = `
  <div class="wrap">
    <header class="xhead">
      <div class="crumb"><a href="#start">Übersicht</a><span>›</span><a href="#feld-${f.id}">${f.short}</a><span>›</span><span>${meta.title}</span></div>
      <div class="row"><h1 style="font-size:clamp(30px,4vw,48px)">${meta.title}</h1>
        <div class="bar"><a class="btn small" href="#${prev.id}">‹ ${prev.short || prev.title}</a><a class="btn small" href="#${next.id}">${next.short || next.title} ›</a></div></div>
      <p class="x-intro">${meta.teaser}</p>
    </header>
    <div class="lab"><div class="stage"><div class="loading">Versuchsaufbau wird geladen …</div></div><aside class="controls" aria-label="Bedienfeld"></aside></div>
    <div class="tabs">
      <div class="tablist" role="tablist">
        ${[['messwerte', 'Messwerte & Auswertung'], ['durchfuehrung', 'Durchführung'], ['theorie', 'Physik dahinter'], ['geraet', 'Apparatur'], ['abi', 'Abi-Check']]
          .map(([k, l], i) => `<button role="tab" id="tab-${k}" aria-controls="pn-${k}" aria-selected="${!i}">${l}</button>`).join('')}
      </div>
      ${['messwerte', 'durchfuehrung', 'theorie', 'geraet', 'abi'].map((k, i) => `<div class="tabpanel" role="tabpanel" id="pn-${k}" aria-labelledby="tab-${k}" ${i ? 'hidden' : ''}></div>`).join('')}
    </div>
  </div>`;
  scrollTo0();
  const tl = app.querySelector('.tablist');
  tl.addEventListener('click', e => {
    const b = e.target.closest('[role=tab]'); if (!b) return;
    for (const t of tl.children) { const on = t === b; t.setAttribute('aria-selected', on); document.getElementById(t.getAttribute('aria-controls')).hidden = !on; }
    window.dispatchEvent(new Event('resize'));
  });
  const stage = app.querySelector('.stage'), controls = app.querySelector('.controls');
  const panel = k => app.querySelector('#pn-' + k);
  let mod, inst;
  try {
    mod = (await import(`../experiments/${meta.id}.js`)).default;
    const d = mod.docs || {};
    for (const k of ['durchfuehrung', 'theorie', 'geraet', 'abi']) panel(k).innerHTML = `<div class="prose">${d[k] || '<p class="muted">Folgt.</p>'}</div>`;
    if (mod.intro) app.querySelector('.x-intro').innerHTML = mod.intro;
    inst = await mod.mount({ stage, controls, messwerte: panel('messwerte'), meta, ui, Chart, csvTools, fit });
    stage.querySelector('.loading')?.remove();
  } catch (err) {
    console.error(err);
    stage.querySelector('.loading').innerHTML = `Der Versuch konnte nicht geladen werden.<br><span class="muted mono" style="font-size:12px">${String(err.message || err)}</span>`;
  }
  cleanup = () => inst?.destroy?.();
}

function route() {
  cleanup?.(); cleanup = null;
  const h = decodeURIComponent(location.hash.slice(1));
  const e = byId(h);
  if (e && e.status === 'bereit') renderExperiment(e);
  else renderHome(h.startsWith('feld-') ? h : null);
}
window.addEventListener('hashchange', route);
route();
