// ============================================================================
//  REGISTRY – zentrale Liste aller Schlüsselexperimente (KLP Physik GK NRW)
// ----------------------------------------------------------------------------
//  Neues Experiment hinzufügen:
//   1. Datei  experiments/<id>.js  nach Vorlage experiments/_vorlage.js anlegen
//   2. Hier beim passenden Eintrag  status: 'bereit'  setzen
//   Mehr braucht es nicht: Startseite, Navigation und Routing lesen nur hier.
// ============================================================================

export const FIELDS = [
  {
    id: 'wellen-felder',
    title: 'Klassische Wellen und geladene Teilchen in Feldern',
    short: 'Wellen & Felder',
    hue: 'copper',
    intro: 'Schwingungen, Wellen, Interferenz – und wie elektrische und magnetische Felder geladene Teilchen lenken.'
  },
  {
    id: 'quanten',
    title: 'Quantenobjekte',
    short: 'Quantenobjekte',
    hue: 'violet',
    intro: 'Licht und Elektronen zeigen Teilchen- und Wellencharakter: Photoeffekt und Elektronen am Doppelspalt.'
  },
  {
    id: 'elektrodynamik',
    title: 'Elektrodynamik und Energieübertragung',
    short: 'Elektrodynamik',
    hue: 'signal',
    intro: 'Induktion, Transformator, Fernleitung und Kondensator – die Physik hinter der Energieversorgung.'
  },
  {
    id: 'strahlung',
    title: 'Strahlung und Materie',
    short: 'Strahlung & Materie',
    hue: 'phosphor',
    intro: 'Spektren, Energieniveaus und ionisierende Strahlung: was Licht und Röntgenstrahlung über Atome verraten.'
  }
];

// tech: '3d' (WebGL/Three.js) | '2d' (SVG/Canvas)
export const EXPERIMENTS = [
  // --- Wellen & Felder ------------------------------------------------------
  { id: 'federpendel', field: 'wellen-felder', title: 'Federpendel', tech: '3d', status: 'bereit',
    teaser: 'Schwingungsdauer in Abhängigkeit von Masse und Federhärte – mit Ultraschall-Bewegungssensor.' },
  { id: 'wellenwanne', field: 'wellen-felder', title: 'Wellenwanne', tech: '3d', status: 'geplant',
    teaser: 'Kreis- und ebene Wellen, Reflexion, Beugung und Interferenz an der Wasseroberfläche.' },
  { id: 'fadenstrahlrohr', field: 'wellen-felder', title: 'Fadenstrahlrohr', tech: '3d', status: 'bereit',
    teaser: 'Elektronen auf der Kreisbahn im Helmholtz-Feld – Bestimmung der spezifischen Ladung e/m.' },
  { id: 'doppelspalt', field: 'wellen-felder', title: 'Doppelspalt', tech: '2d', status: 'geplant',
    teaser: 'Interferenz von Laserlicht – Wellenlängenbestimmung aus dem Streifenmuster.' },
  { id: 'gitter', field: 'wellen-felder', title: 'Gitter', tech: '2d', status: 'geplant',
    teaser: 'Scharfe Maxima am optischen Gitter, Spektren weißen Lichts.' },
  { id: 'millikan', field: 'wellen-felder', title: 'Millikan-Versuch', tech: '3d', status: 'geplant',
    teaser: 'Schwebende Öltröpfchen im Kondensatorfeld – die Quantelung der Ladung.' },
  { id: 'zyklotron', field: 'wellen-felder', title: 'Zyklotron', tech: '2d', status: 'geplant',
    teaser: 'Teilchenbeschleunigung durch Wechselfeld und Magnetfeld (Modellexperiment).' },

  // --- Quantenobjekte -------------------------------------------------------
  { id: 'photoeffekt', field: 'quanten', title: 'Photoeffekt', tech: '2d', status: 'geplant',
    teaser: 'Gegenfeldmethode mit Fotozelle – Bestimmung des Planck’schen Wirkungsquantums.' },
  { id: 'elektronen-doppelspalt', field: 'quanten', title: 'Doppelspaltversuch mit Elektronen', short: 'Elektronen-Doppelspalt', tech: '2d', status: 'geplant',
    teaser: 'Einzelne Elektronen bauen ein Interferenzmuster auf – Wahrscheinlichkeitsdeutung.' },

  // --- Elektrodynamik -------------------------------------------------------
  { id: 'leiterschaukel', field: 'elektrodynamik', title: 'Leiterschaukel', tech: '3d', status: 'geplant',
    teaser: 'Lorentzkraft auf einen stromdurchflossenen Leiter im Hufeisenmagneten.' },
  { id: 'leiterschleife', field: 'elektrodynamik', title: 'Leiterschleife', tech: '3d', status: 'geplant',
    teaser: 'Induktionsspannung bei Bewegung einer Leiterschleife im Magnetfeld.' },
  { id: 'transformator', field: 'elektrodynamik', title: 'Transformator', tech: '3d', status: 'geplant',
    teaser: 'Spannungs- und Stromübersetzung, belasteter und unbelasteter Trafo.' },
  { id: 'freileitung', field: 'elektrodynamik', title: 'Modellexperiment zu Freileitungen', short: 'Freileitung', tech: '2d', status: 'geplant',
    teaser: 'Energieübertragung mit und ohne Hochspannung – Leitungsverluste im Modell.' },
  { id: 'kondensator', field: 'elektrodynamik', title: 'Auf- und Entladevorgang bei Kondensatoren', short: 'Kondensator', tech: '2d', status: 'bereit',
    teaser: 'RC-Glied mit Messwerterfassung: Zeitkonstante, Ladung und Kapazität bestimmen.' },
  { id: 'oszilloskop', field: 'elektrodynamik', title: 'Oszilloskop bzw. Messwerterfassungssystem', short: 'Oszilloskop', tech: '2d', status: 'geplant',
    teaser: 'Zeitlich veränderliche Spannungen sichtbar machen und auswerten.' },
  { id: 'generator', field: 'elektrodynamik', title: 'Generator', tech: '3d', status: 'geplant',
    teaser: 'Rotierende Spule im Magnetfeld – sinusförmige Wechselspannung.' },
  { id: 'thomson-ring', field: 'elektrodynamik', title: 'Thomson’scher Ringversuch', tech: '3d', status: 'geplant',
    teaser: 'Ein Aluminiumring springt von der Spule – Lenz’sche Regel live.' },

  // --- Strahlung & Materie --------------------------------------------------
  { id: 'roentgen', field: 'strahlung', title: 'Röntgenspektren', tech: '2d', status: 'geplant',
    teaser: 'Bremsspektrum und charakteristische Linien, Bragg-Reflexion am Kristall.' },
  { id: 'geiger-mueller', field: 'strahlung', title: 'Geiger-Müller-Zählrohr', tech: '2d', status: 'geplant',
    teaser: 'Zählrate, Nullrate und statistische Schwankung beim radioaktiven Zerfall.' },
  { id: 'flammenfaerbung', field: 'strahlung', title: 'Flammenfärbung', tech: '2d', status: 'geplant',
    teaser: 'Metallsalze färben die Flamme charakteristisch – Spektroskopie im Alltag.' },
  { id: 'linienspektren', field: 'strahlung', title: 'Linienspektren bzw. Spektralanalyse', short: 'Linienspektren', tech: '2d', status: 'geplant',
    teaser: 'Spektrallampen am Gitter – Energieniveaus aus Spektrallinien.' },
  { id: 'franck-hertz', field: 'strahlung', title: 'Franck-Hertz-Versuch', tech: '2d', status: 'geplant',
    teaser: 'Diskrete Energieabgabe von Elektronen an Quecksilber- oder Neonatome.' },
  { id: 'sonnenspektrum', field: 'strahlung', title: 'Sonnenspektrum, Fraunhofer’sche Linien', short: 'Sonnenspektrum', tech: '2d', status: 'geplant',
    teaser: 'Dunkle Absorptionslinien verraten die Elemente der Sonnenatmosphäre.' },
  { id: 'absorption', field: 'strahlung', title: 'Absorptionsexperimente', tech: '2d', status: 'geplant',
    teaser: 'Resonanzabsorption (Natriumflamme) und Absorption ionisierender Strahlung.' }
];

export const byId = id => EXPERIMENTS.find(e => e.id === id);
export const fieldOf = e => FIELDS.find(f => f.id === e.field);
