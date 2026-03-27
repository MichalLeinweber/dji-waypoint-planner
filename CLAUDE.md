# Claude Code – DJI Waypoint Planner

## Na začátku každé session přečti
- PRD.md – aktuální stav projektu a architektura
- ROADMAP.md – plánované funkce a nápady do budoucna

## Klíčové informace o projektu
- PWA aplikace pro plánování misí DJI Mini 4 Pro
- Next.js 16.2.1 + TypeScript + Tailwind + Leaflet.js
- Vercel: dji-waypoint-planner-phi.vercel.app
- Aplikace je prozatím interní, plánuje se komercionalizace

## Před každým pushem vždy spusť
npx tsc --noEmit && npm run build

## Architektonická rozhodnutí která musíš znát
- Leaflet crosshair: používej classList (leaflet-crosshair),
  ne inline CSS cursor styly
- Map click eventy: vždy používej useRef pattern
  (ne přímé callbacky) – předchází stale closure bugům
- Geocoding: lib/geocoding.ts je abstrakční vrstva –
  aktuálně Nominatim, pro komerční provoz swap na Mapy.cz
- KMZ export: droneEnumValue 67 = DJI Mini 4 Pro

## Na konci každé session
- Aktualizuj PRD.md sekci "Stav vývoje"
- Přesuň dokončené položky v ROADMAP.md do sekce ✅
