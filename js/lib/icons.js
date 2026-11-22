// Linien-Piktogramme der Versuchsaufbauten (48×48, stroke = currentColor)
const P = {
  federpendel: '<path d="M10 6h28M24 6v6"/><path d="M24 12l6 2-12 3 12 3-12 3 12 3-12 3 6 2"/><rect x="17" y="33" width="14" height="10" rx="1.5"/>',
  wellenwanne: '<circle cx="24" cy="24" r="3"/><circle cx="24" cy="24" r="9" opacity=".75"/><circle cx="24" cy="24" r="15" opacity=".5"/><circle cx="24" cy="24" r="21" opacity=".28"/>',
  fadenstrahlrohr: '<circle cx="24" cy="24" r="17"/><circle cx="26" cy="22" r="9" stroke-dasharray="2 2.4"/><path d="M17 22v14M14 41h20"/><path d="M6 10v28M42 10v28" opacity=".6"/>',
  doppelspalt: '<path d="M14 6v14M14 23v2M14 28v14"/><path d="M4 24h10" /><path d="M14 22c8 0 14 -10 28 -12M14 26c8 0 14 10 28 12" opacity=".55"/><path d="M40 8v32"/>',
  gitter: '<path d="M16 8v32M19 8v32M22 8v32M25 8v32M28 8v32" opacity=".7"/><path d="M4 24h12M28 24l14-10M28 24h14M28 24l14 10"/>',
  millikan: '<path d="M8 12h32M8 36h32"/><circle cx="20" cy="22" r="1.8"/><circle cx="29" cy="27" r="1.4"/><circle cx="24" cy="18" r="1.1"/><path d="M24 4v8M24 36v8" opacity=".6"/>',
  zyklotron: '<path d="M22 8a16 16 0 0 0 0 32z"/><path d="M26 8a16 16 0 0 1 0 32z"/><path d="M24 24c3 0 3 4 0 4s-6-3-6-6 4-8 9-8 10 5 10 11" opacity=".7"/>',
  photoeffekt: '<path d="M10 30a14 14 0 0 1 28 0"/><path d="M24 30v-6"/><path d="M6 8l6 6M12 8l-2 6 6-1M16 4l6 6M22 4l-2 6 6-1" opacity=".75"/><path d="M14 40h20"/>',
  'elektronen-doppelspalt': '<path d="M12 6v15M12 24v0M12 27v15"/><g opacity=".85"><circle cx="38" cy="12" r="1"/><circle cx="36" cy="18" r="1"/><circle cx="39" cy="24" r="1"/><circle cx="37" cy="24" r="1"/><circle cx="38" cy="30" r="1"/><circle cx="36" cy="36" r="1"/><circle cx="40" cy="20" r="1"/></g><path d="M44 6v36"/>',
  leiterschaukel: '<path d="M8 6h32M16 6v22M32 6v22M16 28h16"/><path d="M10 22h8v14h-8zM30 22h8v14h-8z" opacity=".6"/>',
  leiterschleife: '<rect x="10" y="12" width="20" height="24" rx="1"/><path d="M30 24h12M38 20l4 4-4 4"/><path d="M4 8v32" opacity=".5" stroke-dasharray="3 3"/>',
  transformator: '<path d="M10 10h28v28H10z"/><path d="M16 10v28M32 10v28" /><path d="M6 16h10M6 20h10M6 24h10M6 28h10M32 18h10M32 22h10M32 26h10" opacity=".7"/>',
  freileitung: '<path d="M8 40V14l4-6 4 6v26M32 40V14l4-6 4 6v26"/><path d="M12 14c8 6 16 6 24 0" opacity=".7"/><path d="M8 20h8M32 20h8"/>',
  kondensator: '<path d="M4 24h16M28 24h16"/><path d="M20 12v24M28 12v24" stroke-width="3"/><path d="M10 34c6 0 8-10 14-14s10 0 14 0" opacity=".5"/>',
  oszilloskop: '<rect x="5" y="9" width="38" height="28" rx="3"/><path d="M9 23c3-8 5-8 8 0s5 8 8 0 5-8 8 0 5 8 7 0" /><path d="M14 41h20"/>',
  generator: '<circle cx="24" cy="24" r="16"/><path d="M14 24h20M24 24l7-9" /><path d="M4 18v12M44 18v12" opacity=".6"/>',
  'thomson-ring': '<rect x="16" y="26" width="16" height="16" rx="1"/><path d="M22 26V6h4v20"/><ellipse cx="24" cy="12" rx="9" ry="3"/><path d="M36 6l2-3M12 6l-2-3" opacity=".6"/>',
  roentgen: '<path d="M6 40C14 40 16 14 22 14s4 18 8 22 8 4 12 4"/><path d="M26 10v28M29 4v34" opacity=".8"/>',
  'geiger-mueller': '<rect x="8" y="18" width="26" height="12" rx="6"/><path d="M34 24h8M8 24H4"/><path d="M14 24h14" opacity=".6"/>',
  flammenfaerbung: '<path d="M24 6c6 8 10 12 10 20a10 10 0 0 1-20 0c0-5 3-7 5-11 1 4 3 5 5 5 1-5-2-9 0-14z"/><path d="M18 42h12"/>',
  linienspektren: '<rect x="4" y="16" width="40" height="16" rx="2"/><path d="M12 16v16M19 16v16M30 16v16M34 16v16" />',
  'franck-hertz': '<path d="M5 40c4 0 6-20 10-20s3 14 6 14 5-22 9-22 4 18 7 18 4-24 7-24"/>',
  sonnenspektrum: '<circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/><rect x="18" y="26" width="26" height="12" rx="2"/><path d="M24 26v12M31 26v12M38 26v12" opacity=".8"/>',
  absorption: '<path d="M4 24h12" /><rect x="16" y="12" width="6" height="24"/><rect x="24" y="12" width="6" height="24" opacity=".7"/><path d="M30 24h12" opacity=".5"/>'
};
export function icon(id) {
  return `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[id] || '<circle cx="24" cy="24" r="16"/>'}</svg>`;
}
