// ============================================================================
//  VORLAGE für ein neues Schlüsselexperiment
//  1. Datei kopieren nach  experiments/<id>.js  (id wie in js/registry.js)
//  2. In js/registry.js beim Eintrag  status: 'bereit'  setzen
//  Fertig – Startseite, Navigation und Tabs erscheinen automatisch.
//
//  Der Rahmen (js/app.js) übergibt an mount():
//   stage      – Bühne für Canvas/SVG (2D: stage.classList.add('ratio') für 1000×620)
//   controls   – rechte Bedienleiste (Netzgerät-Look)
//   messwerte  – Inhalt des Tabs „Messwerte & Auswertung“
//   ui         – Bausteine: group, slider, selectBox, segmented, check, button,
//                display (Digitalanzeige), dataTable, toast, fmt, gauss, el
//   Chart      – new Chart(hostDiv, { xlabel, ylabel }) → .set(series, fits)
//   csvTools   – csvTools(() => ({ columns, rows, meta }), 'dateiname') → Werkzeugleiste
//   fit        – linFit, propFit, expDecayFit, periodsFromSignal, mean, stdev
//  3D-Versuche importieren zusätzlich:
//   import { createLab, mats, makeDisplay, powerSupply, socket, cable } from '../js/lib/lab3d.js';
//   const lab = await createLab(stage, { cam:[x,y,z], target:[x,y,z], room:0..1 });
//   (1 Einheit = 1 m, Tischoberfläche bei y = 0)
// ============================================================================
export default {
  intro: 'Ein Satz, worum es geht (HTML erlaubt).',
  docs: {
    durchfuehrung: '<h3>Aufbau</h3><p>…</p><h3>Durchführung</h3><ol><li>…</li></ol>',
    theorie: '<h3>…</h3><span class="formula">…</span>',
    geraet: '<table class="spec"><tbody><tr><td>Gerät</td><td>Wert</td></tr></tbody></table>',
    abi: '<details class="q"><summary>Frage <span class="op">AFB II</span></summary><p>Lösungsskizze</p></details>'
  },
  async mount({ stage, controls, messwerte, ui, Chart, csvTools, fit }) {
    const { el, group, slider, button } = ui;
    const rows = [];
    const g = group('Bedienung');
    g.append(slider({ label: 'Parameter', min: 0, max: 10, step: 0.1, value: 5, unit: 'V', digits: 1, onInput: v => {} }));
    controls.append(g);
    const fig = el('div', { class: 'fig' }); const chart = new Chart(fig, { xlabel: 'x', ylabel: 'y' });
    messwerte.append(el('div', { class: 'chartbox' }, fig, csvTools(() => ({ columns: [{ key: 'x', label: 'x' }, { key: 'y', label: 'y' }], rows }), 'versuch')));
    let raf = requestAnimationFrame(function loop() { raf = requestAnimationFrame(loop); /* Simulation */ });
    return { destroy() { cancelAnimationFrame(raf); chart.destroy(); } };
  }
};
