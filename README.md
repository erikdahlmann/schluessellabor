# Schlüssellabor Physik

Die Schlüsselexperimente des Grundkurses Physik (Kernlehrplan NRW, gymnasiale Oberstufe) als virtuelle Versuchsaufbauten.
Live: https://dm-pkg.de/schluessellabor/

Durchführbar: Federpendel, Fadenstrahlrohr, Doppelspalt, Gitter, Photoeffekt, Kondensator, Leiterschaukel, Linienspektren (H, He, Na, Hg, unbekannte Lampe X) und Franck-Hertz-Versuch (Hg und Ne). Jeder Versuch hat einen 2D- und einen 3D-Aufbau sowie eine Modellansicht (Feldlinien, Elektronen, Photonen, Kräfte, Energie). Die übrigen Versuche sind angelegt.

## Aufbau

- `index.html`, `css/style.css` – Rahmen
- `js/registry.js` – Liste aller Versuche (Status `bereit` schaltet einen Versuch frei)
- `js/app.js` – Startseite, Routing (`#<id>`), Reiter
- `js/lib/` – Bausteine: 3D-Labor mit Modell-Bausteinen (Pfeile, Beschriftungen, Leuchtpunkte), Umschalter 2D/3D und Real/Modell (`views.js`), Diagramm, Ausgleichsrechnung, CSV, Bedienelemente
- `bilder/` – Kopfbilder je Versuch (KI-generiert)
- `experiments/<id>.js` – je ein Versuch; Vorlage `experiments/_vorlage.js`
- `lib/three/` – Three.js r169 (MIT-Lizenz) lokal, `fonts/` – Archivo und IBM Plex (SIL OFL) lokal

Keine externen Dienste. Im Browserspeicher steht nur, welche Ansicht zuletzt gewählt war. Start nur über einen Webserver (ES-Module).
