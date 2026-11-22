# Schlüssellabor Physik

Die Schlüsselexperimente des Grundkurses Physik (Kernlehrplan NRW, gymnasiale Oberstufe) als virtuelle Versuchsaufbauten.
Live: https://dm-pkg.de/schluessellabor/

Durchführbar: Federpendel (3D), Fadenstrahlrohr (3D), Doppelspalt, Photoeffekt, Franck-Hertz-Versuch und Auf- und Entladen eines Kondensators (2D). Die übrigen Versuche sind angelegt.

## Aufbau

- `index.html`, `css/style.css` – Rahmen
- `js/registry.js` – Liste aller Versuche (Status `bereit` schaltet einen Versuch frei)
- `js/app.js` – Startseite, Routing (`#<id>`), Reiter
- `js/lib/` – Bausteine: 3D-Labor, Diagramm, Ausgleichsrechnung, CSV, Bedienelemente
- `experiments/<id>.js` – je ein Versuch; Vorlage `experiments/_vorlage.js`
- `lib/three/` – Three.js r169 (MIT-Lizenz) lokal, `fonts/` – Archivo und IBM Plex (SIL OFL) lokal

Keine externen Dienste, kein Browserspeicher. Start nur über einen Webserver (ES-Module).
