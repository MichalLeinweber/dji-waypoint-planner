# PRD – DJI Waypoint Mission Planner
**Verze:** 1.0  
**Datum:** 2026-03-25  
**Dron:** DJI Mini 4 Pro | Ovladač: DJI RC 2  

---

## 1. Přehled produktu

Webová PWA aplikace pro plánování autonomních letových misí dronu DJI Mini 4 Pro. Uživatel v interaktivní mapě navrhne misi (waypointy, spirálu, grid nebo orbit), nastaví parametry a exportuje standardní KMZ/WPML soubor kompatibilní s DJI Fly. Soubor poté ručně přenese do ovladače DJI RC 2 přes USB-C.

**Cílový uživatel:** Pilot dronu, neprogramátor, chce jednoduchost a přehlednost nad komplexností.

---

## 2. Cíle produktu

- Nahradit nepřehledné třetí strany (Litchi, Dronelink, Maven) jednoduchou vlastní aplikací
- Umožnit tvorbu všech běžných typů misí s minimem kroků
- Exportovat 100% kompatibilní KMZ soubor pro DJI Fly (WPML formát)
- Fungovat jako PWA – instalovatelná na PC, tablet i telefon bez App Store
- Nasadit na Vercel, fungovat i offline (uložené mise v localStorage)

---

## 3. Typy misí (MVP)

### 3.1 Manuální waypointy
- Uživatel kliká na mapu → přidává body postupně
- Každý bod: výška (m), rychlost (m/s), čas čekání (s), akce kamery (foto/video start/stop)
- Vizualizace trasy jako čára s číslovanými body
- Přetahování bodů po mapě (drag & drop)
- Editace / mazání jednotlivých bodů

### 3.2 Spirála
- Uživatel klikne na střed spirály
- Parametry: počáteční poloměr (m), konečný poloměr (m), počet otáček, počáteční výška (m), konečná výška (m), rychlost (m/s), směr (CW/CCW)
- Automatický výpočet waypointů podél spirální trajektorie
- Náhled v mapě před exportem

### 3.3 Grid / Rastr (fotogrammetrie)
- Uživatel nakreslí obdélník na mapě (2 kliknutí – rohové body)
- Parametry: výška letu (m), překryv foto (%), směr řad (°), rychlost (m/s), interval focení (s)
- Automatický výpočet paralelních přechodových tras (lawn-mower pattern)
- Zobrazení odhadovaného pokrytí a počtu fotografií

### 3.4 Orbit (kroužení kolem POI)
- Uživatel klikne na střed orbitu (POI)
- Parametry: poloměr (m), výška (m), rychlost (m/s), počet otáček, směr (CW/CCW), gimbal míří vždy na POI
- Automatický výpočet kruhové trajektorie

---

## 4. Správa misí

- Uložení mise pod vlastním názvem (localStorage)
- Seznam uložených misí s náhledem, datem a typem
- Načtení / editace uložené mise
- Duplikování mise
- Mazání mise
- **Export KMZ** – stažení souboru připraveného pro DJI RC 2

---

## 5. Export KMZ (technický požadavek)

Výstupní KMZ soubor musí odpovídat DJI WPML specifikaci:

```
mission.kmz
├── wpmz/
│   ├── template.kml      ← globální nastavení mise
│   └── waylines.wpml     ← souřadnice, výšky, akce
```

**template.kml** obsahuje:
- `<missionConfig>` s globalTransitionalSpeed, droneInfo (Mini 4 Pro), payloadInfo
- Odkaz na waylines.wpml

**waylines.wpml** obsahuje pro každý waypoint:
- `<Point>` s lon/lat
- `<wpml:executeHeight>` – výška nad startem (relativní)
- `<wpml:waypointSpeed>`
- `<wpml:waypointHeadingParam>` – orientace dronu
- `<wpml:waypointTurnParam>` – plynulý průlet nebo zastavení
- `<wpml:actionGroup>` – akce kamery (foto, start/stop video)

Soubor musí být validní ZIP archiv s příponou `.kmz`.

---

## 6. Workflow přenosu do dronu (instrukce v aplikaci)

Aplikace zobrazí krok za krokem:
1. Exportuj KMZ soubor do PC
2. Otevři DJI Fly na RC 2 → vytvoř prázdnou "dummy" misi → ulož
3. Připoj RC 2 k PC přes USB-C (datový kabel)
4. Naviguj do `Internal storage/Android/data/dji.go.v5/files/waypoint/`
5. Najdi složku dummy mise (nejnovější datum) → přepiš `.kmz` soubor (zachovej původní název)
6. Odpoj RC 2 → otevři DJI Fly → otevři misi → ověř trasu

---

## 7. UI/UX principy

- **Primární rozhraní:** mapa přes celou obrazovku, ovládací panel jako postranní / spodní drawer
- **Mobilní first:** ovladatelné jednou rukou, velká dotyková tlačítka
- **Tmavý režim:** vhodný pro použití venku na slunci
- **Jazyk:** česky (primárně), přidání EN jako budoucí možnost
- **Mapa:** Leaflet.js s OpenStreetMap (bez API klíče, zdarma, funguje offline po cache)
- **Technologie:** Next.js (PWA) + Tailwind CSS + Leaflet

---

## 8. Technický stack

| Vrstva | Technologie |
|---|---|
| Framework | Next.js 16.2.1 (App Router) |
| Styling | Tailwind CSS |
| Mapa | Leaflet.js + React-Leaflet |
| Offline/PWA | next-pwa |
| Ukládání misí | localStorage (JSON) |
| Export KMZ | JSZip (generování ZIP v prohlížeči) |
| Deploy | Vercel |
| Repo | GitHub |

---

## 9. Stav vývoje

*Poslední aktualizace: 2026-03-29 (Session 20)*

### ✅ Dokončeno – kompletní přehled

**Infrastruktura:**
- Next.js 16.2.1 + TypeScript + Tailwind CSS
- Leaflet.js + React-Leaflet (mapa, crosshair cursor oprava)
- JSZip (KMZ/WPML export)
- next-pwa (PWA, manifest)
- GitHub + Vercel (auto-deploy z main)

**Fotogrammetrický modul (záložka Foto):**
- Manuální waypointy – klikání na mapu, drag & drop, parametry per bod
- Spirála – střed mapy, CW/CCW, interpolace poloměru a výšky
- Grid – lawn-mower pattern, rotace směru, odhad fotek/času
- Orbit – kroužení kolem POI, gimbal towardPOI v WPML
- Fasáda jedna strana – lawn-mower podél fasády, gimbal úhel
- Fasáda 360° – 4 body na mapě = celá budova, 4 strany v jedné misi

**KMZ/WPML export:**
- Formát kompatibilní s DJI Fly (Mini 4 Pro, droneEnumValue: 67)
- Akce: takePhoto, startRecord, stopRecord, hover, gimbalRotate
- gimbalPitch (absolutní úhel), headingAngle (fixed heading), towardPOI
- Limit 200 waypointů – varování zelená/žlutá/červená + blokování

**Filmařský modul (záložka Film):**
- Přepínač Foto/Film v horní části sidebaru
- Dronie – odletový záběr, kompasový směr, gimbal 0°→-30°
- Reveal – let k POI, headingAngle per waypoint (nos na POI)
- Top-down – přelet A→B, gimbal -90°, konstantní výška
- Crane Up – vertikální stoupání, interpolace gimbalu -60°→0°
- Hyperlapse – focení v intervalech, 3 gimbal módy, live výpočet délky videa
- Arc Shot – oblet s měnící se výškou, headingAngle k POI per bod
- Boomerang – přímá trasa tam a zpět, 6 WP, pauza v cíli, konstantní gimbal
- Rocket – vertikální vzlet, pevný gimbal -70°, 4 WP (rychlejší než Crane Up)
- POI Sequence – série zastávek kolem POI, editovatelná tabulka, headingAngle k POI

**Správa misí:**
- Uložení do localStorage s vlastním názvem (SaveMissionDialog)
- Seznam misí /missions – načíst / smazat
- MissionType: waypoints | spiral | grid | orbit | facade | film

**Stránky:**
- `/` – hlavní mapa s celou aplikací
- `/missions` – seznam uložených misí
- `/guide` – detailní návod přenosu KMZ do DJI RC 2 (6 kroků)
- `/help` – kompletní nápověda (fotogrammetrie + filmařský modul)
- `/preview-3d` – 3D náhled mise (CesiumJS, nový tab)

**Help sekce (/help):**
- Navigační kotvy: #funkce / #foto / #film / #parametry / #terrain / #sdileni-baterie / #prenos
- Přehled funkcí aplikace (9 karet s ikonami)
- Parametry waypointu: výška, rychlost, čekání, kamera (tabulka)
- Fotogrammetrie: výběr mise, překryv %, vzdálenost od fasády
- Detail Orbit / Fasáda / Grid (jak fungují)
- SVG diagramy: překryv záběrů, vzdálenost zboku, gimbal úhly
- Filmařský modul: 9 karet záběrů, doporučené rychlosti
- Hyperlapse výpočet: vzorec + příklad
- Limit 200 waypointů: barevná legenda + tabulka řešení
- Sdílení mise: popis funkce + typické použití
- Odhad baterie: parametry výpočtu, upozornění na vítr
- Přepínač vrstev mapy: OSM / Satelit / Terén
- Severka (2D mapa) a rotující kompas (3D náhled), dblclick chování
- 3D náhled: Google Photorealistic 3D Tiles, ovládání, kompas
- Import KMZ: popis, omezení (filmové mise → waypointy)

**3D náhled mise (CesiumJS):**
- `app/preview-3d/page.tsx` — CesiumJS načítán z CDN script tagem (bez npm bundle), nový tab
- Data přes `localStorage['preview3d-mission']` (JSON s waypoints + timestamp)
- World Terrain (Cesium ion) — reálný 3D terén s vertex normály a vodními maskami
- OSM Buildings (Cesium ion) — miliony 3D budov z OpenStreetMap, toggle tlačítkem
- Google Photorealistic 3D Tiles (Google Maps API) — toggle 🌍, fallback na OSM Buildings
- Trasa jako CesiumJS polyline s PolylineGlowMaterialProperty, `clampToGround: false`
- Absolutní výšky: Open-Meteo MSL elevace + AGL výška waypointu (min. 80 m pro náhled)
- Oranžové waypoint markery (pixelSize 16) s číslovanými labely ve výšce letu
- Ovládání: orbit/pan/zoom (Cesium nativní), Ptačí pohled (pitch -90°), Boční (pitch -30°)
- Rotující kompas (heading listener), dblclick → srovnání na sever
- Info box: počet WP, čas mise, výška v náhledu AGL
- Tlačítko `🔭 3D náhled` v Sidebar, zobrazí se pouze při `waypoints.length > 0`

**Mapa (Leaflet):**
- Přepínač vrstev: OSM / Satelit (Esri) / Terén (Esri) — `L.control.layers()` přes `useMap()` hook
- Statická severka (bottomright), dblclick → fitBounds na waypointy nebo střed ČR

**Sdílení mise:**
- `lib/shareUrl.ts` — `btoa(encodeURIComponent(JSON.stringify()))`, dekódování při načtení URL
- Tlačítko 🔗 v sidebaru, `navigator.clipboard.writeText()`, toast 3 s

**Import KMZ:**
- `lib/importKmz.ts` — JSZip rozbalení, DOMParser XML, `getByLocalName()` pro WPML namespace
- Načtení mise zpět do editoru, flyTo centroid, reset terrain following

**Odhad baterie:**
- `lib/batteryEstimate.ts` — Haversine 3D vzdálenost, Mini 4 Pro 33.48 Wh / 7 W avg / 20% rezerva
- Panel v sidebaru s progress barem (zelená/oranžová/červená), zobrazí se od 2 waypointů

**Letové a přírodní zóny na mapě:**
- CTR/TRA letové zóny – `components/AirspaceLayer.tsx`, statický GeoJSON `/data/airspaces-cz.json`
  (352 zón: CTR, TRA, PROHIBITED, RESTRICTED, DANGER, ATZ, TMA, TSA; barevné polygony, tooltip)
  Script: `scripts/fetch-airspaces.js` (OpenAIP Core API, node-only, cache soubor v public/data)
- NP/CHKO přírodní ochranná území – `components/ProtectedAreasLayer.tsx`, statický GeoJSON `/data/protected-areas-cz.json`
  (4 NP zelená + 26 CHKO modrá = 30 features; OSM Overpass; tooltip s omezením pro drony)
  Script: `scripts/fetch-protected-areas.js` (Overpass API, OSM way-stitching, coord simplification)
- Toggle tlačítka v sidebaru: 🚧 Letové zóny (oranžová), 🌿 NP a CHKO (zelená)
- Help sekce: kotva `#priroda` s pravidly pro drony v NP/CHKO

**OpenAIP integrace (příprava):**
- Účet vytvořen, API klíč vygenerován: `NEXT_PUBLIC_OPENAIP_API_KEY` v `.env.local` a Vercel
- Poznámka: API domain je `api.core.openaip.net` (ne `api.openaip.net`); fetch jen z Node.js (CORS)

**Terrain Following:**
- `lib/terrainFollowing.ts` — Open-Meteo Elevation API, batching po 100 bodech
- `components/TerrainFollowingButton.tsx` — 3 stavy (idle, loading, active), reset na originální výšky
- Vzorec: `newHeight = max(2, (elev[i] - elev[0]) + originalHeight[i])` — zachová AGL výšku nad terénem
- Badge `🏔 Terrain` v hlavičce sidebaru při aktivním terrain following
- Auto-reset při každém novém generování mise

**Vyhledávání adresy:**
- `lib/geocoding.ts` — abstrakční vrstva (Nominatim/OSM), připravena na swap na Mapy.cz / Mapbox
- `components/SearchBar.tsx` — input s lupou, debounce 500ms, dropdown max 5 výsledků, loading/prázdno/chyba
- Integrováno do sidebaru jako první element (před Foto/Film přepínačem)
- Kliknutí na výsledek → `map.flyTo([lat,lng], zoom 17)` přes `flyToTarget` prop
- Omezeno na ČR (`countrycodes=cz`), User-Agent: `DJI-Waypoint-Planner/1.0`
- Help stránka: přidán krok 1 „Najdi lokaci pomocí vyhledávacího pole..."

**Opravené bugy:**
- Leaflet crosshair cursor (leaflet-grab přebíjel CSS – oprava přes classList)
- Stale closure v useMapEvents (useRef pattern pro callbacky)

### 📋 Plánováno – budoucí rozvoj
- Geocoding swap na Mapy.cz API pro komerční provoz (abstrakční vrstva `lib/geocoding.ts` připravena)
- Google Maps API klíč omezit na produkční doménu (security)
- Anglická jazyková mutace

---

## 10. Omezení a known issues

- DJI Fly **nemá nativní import** – přenos přes USB/ruční přepsání souboru je nevyhnutelný krok
- GPS přesnost RC 2 není stoprocentní – mise se mohou mírně lišit od plánu
- Maximálně **200 waypointů** na jednu misi (limit DJI Fly)
- Výška waypointů je relativní od místa vzletu – uživatel musí startovat ze stejného místa pro přesné opakování mise
- Filmařský modul generuje základní waypointové trajektorie – DJI Fly nepodporuje Bezierovy křivky přes WPML
- Crosshair cursor vyžaduje přímou manipulaci CSS tříd Leafletu (`leaflet-crosshair`), ne inline styly

---

## 11. Kritéria úspěchu MVP

- [x] Uživatel vytvoří manuální misi, exportuje KMZ a DJI Fly ji přijme bez chyby
- [x] Spirála, grid, orbit a fasáda generují validní WPML soubor
- [x] Aplikace je instalovatelná jako PWA na Windows PC a Android telefon
- [x] Mise se ukládají a znovu načítají správně
- [x] Filmařský modul – 9 typů záběrů funkčních (Dronie, Reveal, Top-down, Crane Up, Hyperlapse, Arc Shot, Boomerang, Rocket, POI Sequence)
- [x] Help sekce pokrývá všechny funkcionality (foto i film)

### Budoucí kritéria
- [x] Terrain following – výška přizpůsobena terénu
- [x] Import KMZ zpět do editoru
- [ ] Anglická lokalizace
- [x] Google Photorealistic 3D Tiles v 3D náhledu
