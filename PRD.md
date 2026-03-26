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

*Poslední aktualizace: 2026-03-26 (Session 8)*

### ✅ Dokončeno – Session 8 (Stránka /help)
- Nová statická stránka `/help` — vizuální průvodce aplikací
- Sekce A: Jak začít — 5 číslovaných kroků od výběru mise po přenos do RC 2
- Sekce B: Výběr typu mise — 6 karet (Body/Spirála/Grid/Orbit/Fasáda/360°), každá s popisem a „→ záložka X"
- Sekce C: Jak funguje překryv — inline SVG diagram (4 záběry, 70% překryv zvýrazněn), tabulka doporučení
- Sekce D: Vzdálenost od fasády — inline SVG pohled zboku (dron + zeď + FOV kužel + šipka 8 m), tabulka hodnot
- Sekce E: Limit 200 waypointů — barevná legenda (zelená/žlutá/červená) + tabulka řešení
- Sekce F: Přenos do RC 2 — 3 věty + odkaz na /guide
- Sidebar.tsx: přidán odkaz „Napoveda" do spodní navigace

### ✅ Dokončeno – Session 7 (Fasáda 360° – refactor + bugfixy)
- Crosshair cursor: opraven bug kde Leaflet třída `leaflet-grab` přebíjela inline cursor styl
  → Map.tsx: useEffect toggleuje CSS třídy leaflet-grab/leaflet-crosshair přímo na container
- Stale closure: opraven bug v MapEventHandler kde Leaflet listener držel staré callbacky
  → Map.tsx: onMapClick a onCenterChange uloženy do refs, listener vždy volá ref.current()
- Fasáda 360° zjednodušena: odstraněn komplexní stavový automat (facade360DrawStep + 5 stavů)
  → 360° mode nyní přidává rohy jako normální waypointy (klikání = stejné jako Body záložka)
  → facadeMode ('single'|'360') zvednut do page.tsx; přepínání módu maže waypointy
  → buildingPolygon odvozen z prvních 4 waypointů (missionType=facade, facadeMode=360)
  → FacadePanel: tlačítko generování zobrazí "Pridej N rohy budovy" dokud není 4 bodů
  → Markery jsou přetahovatelné v 360° módu (fine-tune rohů)

### ✅ Dokončeno – Session 6 (Fasáda 360°)
- FacadePanel: přepínač "Jedna strana" / "Celá budova 360°"
- Generátor 360°: lawn-mower pasy pro všechny 4 strany v jedné misi
- Každý waypoint má `headingAngle` = nos dronu kolmo na fasádu (vypočítáno z vektoru strany)
- Přechodové body mezi stranami: diagonální clearance bod + entry bod, cameraAction 'none', speed 5
- Limit 200 waypointů: varování + blokování generování platí i pro 360° režim
- types.ts: `headingAngle?: number` přidáno do rozhraní Waypoint
- exportKMZ.ts: `fixed` heading mode pro waypointy s `headingAngle`
- Map.tsx: nový prop `buildingPolygon`, import Polygon z react-leaflet

### ✅ Dokončeno – Session 5 (Limit waypointů)
- FacadePanel a GridPanel: barevný řádek "Waypointy: X / 200" v info boxu (zelená/žlutá/červená)
- Žluté upozornění při 151–200 waypointech, červené při > 200
- Blokování tlačítka Generovat při překročení 200

### ✅ Dokončeno – Session 4 (Fasádní sken)
- FacadePanel: horizontální pasy podél fasády (lawn-mower), 2 body A+B na mapě, kolmý offset dronu
- Žlutá čárkovaná čára A→B na mapě jako vizuální reference fasády
- Parametry: vzdálenost od fasády, výška startu/konce, překryv, rychlost, úhel gimbalu
- Info box: šířka fasády, počet řad, počet fotek, délka trasy
- exportKMZ: nová akce `gimbalRotate` (actionId 2) pro waypointy s `gimbalPitch`
- types.ts: přidány `'facade'` do MissionType, `gimbalPitch?: number` do Waypoint
- Sidebar: záložky přepnuty na `overflow-x: auto` (škáluje na mobil i pro budoucí záložky)
- MissionList: přidán label 'Fasada'

### ✅ Dokončeno – Session 3 (Spirála, Grid, Orbit)
- SpiralPanel: generuje spirální trajektorii (střed = střed mapy, parametry: poloměry, výšky, otáčky, směr CW/CCW)
- GridPanel: fotogrammetrický grid s plnou podporou rotace směru letu, lawn-mower pattern, odhad počtu fotek/délky/doby
- OrbitPanel: kruhová mise kolem POI, kliknutím na mapu vybere střed, CW/CCW
- exportKMZ.ts: orbit mise → `towardPOI` heading mode v WPML (gimbal míří na POI)
- Map.tsx: přidán `onCenterChange` (sleduje střed pro spirálu), `gridRect` (žlutý obdélník oblasti), `crosshairCursor` při výběru bodu, `draggableMarkers` flag
- Sidebar.tsx: plně zapojen — odstraněno "coming soon", každý tab zobrazuje příslušný panel
- page.tsx: stavový automat pro gridDrawStep (idle→sw→ne→idle) a poiSelectMode

### ✅ Dokončeno – Session 2 (Dialog, GitHub, Vercel)
- `SaveMissionDialog` komponenta – vlastní modal místo window.prompt (Enter uloží, Escape zavře, autofocus)
- GitHub repozitář: `https://github.com/MichalLeinweber/dji-waypoint-planner` (public)
- Vercel deploy: `https://dji-waypoint-planner-phi.vercel.app` (production, auto-deploy z main)

### ✅ Dokončeno – Session 1 (MVP základ)
- Next.js 16.2.1 + TypeScript + Tailwind CSS projekt inicializován
- Instalovány závislosti: react-leaflet, leaflet, jszip, next-pwa
- PWA manifest (`public/manifest.json`) – tmavý theme #0f1117
- `next.config.js` s next-pwa (disable v dev, turbopack: {} workaround pro Next.js 16)
- TypeScript typy: `Waypoint`, `Mission`, `MissionType`, `CameraAction` (`lib/types.ts`)
- localStorage logika: `loadMissions`, `saveMission`, `deleteMission` (`lib/missionStore.ts`)
- KMZ export: `exportKMZ(mission)` generuje ZIP s `wpmz/template.kml` + `wpmz/waylines.wpml` (`lib/exportKMZ.ts`)
- Leaflet mapa s klikáním, drag & drop markerů, polyline trasa (`components/Map.tsx`)
- Sidebar: záložky typů misí, WaypointPanel, tlačítka Uložit/Export (`components/Sidebar.tsx`)
- WaypointPanel: výška, rychlost, čekání, akce kamery, smazání (`components/WaypointPanel.tsx`)
- Seznam misí s Načíst/Smazat (`components/MissionList.tsx`)
- Hlavní stránka s mapou a sidebarme (`app/page.tsx`)
- Seznam uložených misí (`app/missions/page.tsx`)
- Návod přenosu do RC 2 – 6 kroků (`app/guide/page.tsx`)
- Produkční build prošel bez chyb (`npm run build`)
- Git repozitář inicializován, první commit

### ⚠️ Chybí pro plnohodnotné PWA
- PWA ikony (`public/icons/icon-192.png`, `icon-512.png`) – zatím neexistují, manifest na ně odkazuje
- Načítání uložené mise zpět do mapy (sessionStorage bridge z /missions na /)

### 📋 Plánováno – další fáze
- Spirála, Grid, Orbit generátory
- Anglická jazyková mutace
- Import KMZ zpět do aplikace
- Výpočet výšky terénu (terrain following)
- Odhad doby letu a spotřeby baterie
- Sdílení misí jako odkaz (URL encode)

---

## 10. Omezení a known issues

- DJI Fly **nemá nativní import** – přenos přes USB/ruční přepsání souboru je nevyhnutelný krok
- GPS přesnost RC 2 není stoprocentní – mise se mohou mírně lišit od plánu
- Maximálně **200 waypointů** na jednu misi (limit DJI Fly)
- Výška waypointů je relativní od místa vzletu – uživatel musí startovat ze stejného místa pro přesné opakování mise

---

## 11. Kritéria úspěchu MVP

- [ ] Uživatel vytvoří manuální misi, exportuje KMZ a DJI Fly ji přijme bez chyby
- [ ] Spirála, grid a orbit generují validní WPML soubor
- [ ] Aplikace je instalovatelná jako PWA na Windows PC a Android telefon
- [ ] Mise se ukládají a znovu načítají správně
