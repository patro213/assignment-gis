# General course assignment

Build a map-based application, which lets the user see geo-based data on a map and filter/search through it in a meaningfull way. Specify the details and build it in your language of choice. The application should have 3 components:

1. Custom-styled background map, ideally built with [mapbox](http://mapbox.com). Hard-core mode: you can also serve the map tiles yourself using [mapnik](http://mapnik.org/) or similar tool.
2. Local server with [PostGIS](http://postgis.net/) and an API layer that exposes data in a [geojson format](http://geojson.org/).
3. The user-facing application (web, android, ios, your choice..) which calls the API and lets the user see and navigate in the map and shows the geodata. You can (and should) use existing components, such as the Mapbox SDK, or [Leaflet](http://leafletjs.com/).

## Example projects

- Showing nearby landmarks as colored circles, each type of landmark has different circle color and the more interesting the landmark is, the bigger the circle. Landmarks are sorted in a sidebar by distance to the user. It is possible to filter only certain landmark types (e.g., castles).

- Showing bicykle roads on a map. The roads are color-coded based on the road difficulty. The user can see various lists which help her choose an appropriate road, e.g. roads that cross a river, roads that are nearby lakes, roads that pass through multiple countries, etc.

## Data sources

- [Open Street Maps](https://www.openstreetmap.org/)

## My project

Kompletná dokumentácia k projektu sa nachádza [tu](documentation.md).

### Popis aplikácie



**Možné scenáre:** 

- Používateľ chce vyhľadať zaujímavé miesta v Paríži. Klikne na mapu, čím sa mu zobrazí okruh, v ktorom sú zobrazené zaujímavé miesta pomocou ikon. Používateľovi sa pri nabehnutí na ikonu miesta zobrazí popup, v ktorom je názov tohto zaujímavého miesta, o aký typ zaujímavého miesta ide a tiež súradnice tohto miesta v štandardnom formáte.

- Používateľ môže podľa potreby tento okruh zväčšiť alebo zmenšiť. Rovnako si môže zvoliť, aké zaujímavé miesta chce vyhľadať (divadlá, kiná, múzeá, galérie, bary, hotely).

- V ľavej časti obrazovky sa používateľovi zobrazí zoznam nájdených miest, pričom si v tomto zozname môže vybrať, ktoré z nich chce navštíviť. Po výbere takýchto miest môže používateľ vybrať možnosť vyhľadať hotely, čím sa nájdu hotely v rámci územia týchto miest alebo v čo najbližšom možnom okolí

- Používateľ môže klikať na ikony zaujímavých miest, čím sa zobrazí cesta trasa medzi týmito miestami a rovnako vzdialenosť medzi týmito miestami.

- Používateľ si môže nechať zobraziť heatmapu, ktorá predstavuje najväčšiu hustotu týchto zaujímavých miest v Paríži.

- Používateľ si môže vybrať možnosť bývania pri rieke Seina, po zvolení tejto možnosti sa nájdu takto vyhovujúce hotely.


**Zdroje dát**:
[Open Street Maps](https://www.openstreetmap.org/), 
[Metro Extracts Mapzen](https://mapzen.com/data/metro-extracts/)

**Použité technológie**: 

Aplikácia pozostáva z frontendovej a backendovej časti a je riešená ako rozšírenie do prehliadača Mozilla Firefox.

Frontend-ová časť je napísaná v _HTML5_, štýlovaná použitím _CSS_, za pomoci _node.js_ a _jQuery_ knižnice. Pre samotnú mapu som použil _Mapbox API_.

Backend je napísaný v _Jave_ s použitím _Spring Frameworku_. Dáta sú uložené v _PostgreSQL_ databáze s rozšírením _PostGIS_.