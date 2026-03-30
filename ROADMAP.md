# Roadmap – DJI Waypoint Planner

## 🔥 Vysoká priorita
- [ ] Geocoding swap na Mapy.cz API pro komerční provoz
      (abstrakční vrstva lib/geocoding.ts je připravena,
       stačí vyměnit funkci searchAddress())

## 📋 Střední priorita
- [x] Sdílení misí jako URL odkaz (URL encode JSON mise)
- [x] Google Photorealistic 3D Tiles integrace do 3D náhledu
      (hotovo – toggle tlačítko 🌍 Google 3D, fallback na OSM Buildings)

## 💡 Nápady a budoucí rozvoj
- [ ] Správa pilotů – více uložených pilotů
      (jméno, email, číslo provozovatele ÚCL,
      číslo průkazu A1/A3/A2), výběr aktivního
      pilota před misí, možnost zadat ručně

- [ ] Správa dronů – více uložených dronů
      (název, výrobce, hmotnost, třída C0/C1/C2,
      výrobní číslo, výdrž baterie Wh, max rychlost,
      max výška), DJI Mini 4 Pro jako výchozí,
      výběr dronu při plánování mise, odhad
      baterie přepočítán dle vybraného dronu,
      možnost přidat ručně

- [ ] Kombinace pilot + dron – výběr aktivní
      kombinace před misí (Pilot A + Air 3,
      Pilot B + Mavic 3). Parametry mise a žádostí
      se přizpůsobí vybrané kombinaci automaticky.

- [ ] Smart formulář žádosti o povolení letu –
      předvyplnění z mise (GPS souřadnice, výška,
      typ zóny), profilu pilota a vybraného dronu.
      Odesílání přes mailto: na správný orgán dle
      typu zóny (ÚCL, správa NP/CHKO, provozovatel
      letiště, Správa železnic, AOPK).
      Šablony žádostí a kontakty pro každý typ zóny.

- [ ] Rozšíření na další drony DJI – podpora
      pro DJI Air 3 (C1, 720g), DJI Mavic 3 Pro
      (C2, 895g), DJI Avata 2, DJI Mini 3 Pro
      a další. Každý dron s vlastními parametry:
      výdrž baterie, max výška, max rychlost,
      kategorie C0/C1/C2, specifická omezení.

- [ ] Standalone režim identifikátoru letových zón –
      aplikace použitelná bez plánování mise pouze
      jako nástroj pro:
      a) Identifikaci letových omezení na mapě
         (zobrazení zón v okolí aktuální polohy)
      b) Odeslání žádosti o povolení letu
         přes smart formulář
      c) Přímý kontakt dotčeného úřadu nebo správce
      Vhodné pro piloty kteří plánují mimo aplikaci
      ale potřebují rychle zkontrolovat zóny
      a vyřídit povolení.

- [ ] BEZPEČNOST: Omezit Google Maps API klíč na konkrétní doménu
      před komerčním nasazením.
      Postup: Google Cloud Console → APIs & Services → Credentials →
      vybrat klíč → Application restrictions → HTTP referrers →
      přidat produkční doménu.
      Aktuálně: klíč bez omezení (OK pro vývoj a testování).
- [ ] Komercionalizace – multi-user, přihlášení, Supabase
- [ ] Help sekce – průběžně aktualizovat při každé
      nové funkci. Pravidlo: každá nová funkcionalita
      = nová nebo rozšířená sekce v /help.
- [x] Odhad spotřeby baterie a doby letu (Mini 4 Pro, Haversine 3D, progress bar)
- [ ] Mobilní notifikace při přiblížení se k CTR/TRA zónám
- [ ] Export do formátu Litchi CSV (pro starší drony)

## 🔮 Budoucí rozšíření leteckých omezení
- [ ] NPR/NPP/PR/PP – menší přírodní rezervace
      z AOPK ČR (statický GeoJSON)
- [ ] Vodní zdroje – ochranná pásma (LKR313)
- [ ] Železnice – buffer 60 m od osy koleje (LKR311)
- [ ] Elektrické vedení – 7–30 m dle napětí (LKR312)
- [ ] Silnice/dálnice – 50 m výška + šířka (LKR310)
- [ ] NOTAMy – dočasná omezení v reálném čase
- [ ] Check-in do DroneMap (vyžaduje partnerství
      s ŘLP ČR)

## 🎨 Design a vzhled (až po dokončení funkcionalit)

- [ ] Finální redesign UI – konzistentní barevná paleta,
      typografie, ikony
- [ ] Sidebar – vizuální hierarchie, lepší spacing,
      aktivní stavy tlačítek
- [ ] Mobilní responzivita – přizpůsobení pro tablet/mobil
- [ ] Branding – logo, název, favicon
- [ ] Animace a přechody – plynulejší UX
- [ ] Dark/light mode (volitelné)
- [ ] 3D náhled – tmavší overlay UI, modernější tlačítka
- [ ] Anglická lokalizace (i18n) – až po finálním
      designu, poslední krok před vydáním

*Poznámka: Design se dělá až po dokončení všech funkcionalit.*

## ✅ Dokončeno (přesunuto z plánů)
- [x] Kompletní code review celé codebase (Opus 4.6, všechny soubory lib/ + components/ + film/ + scripts/ + konfigurace)
- [x] Systém průběžného code review — šablona a postup uloženy v globálním ~/.claude/CLAUDE.md (sekce Code Review System)
- [x] CTR/TRA letové zóny na mapě
      (OpenAIP Core API → statický GeoJSON public/data/airspaces-cz.json,
       352 zón, barevné polygony, tooltip, toggle 🚧, caching)
- [x] NP a CHKO přírodní ochranná území na mapě
      (OSM Overpass API → statický GeoJSON public/data/protected-areas-cz.json,
       4 NP zelená + 26 CHKO modrá = 30 features, tooltip s omezením, toggle 🌿)
- [x] Fasáda 360° – celá budova v jedné misi
- [x] Filmařský modul Fáze 1 (Dronie, Reveal, Top-down,
      Crane Up)
- [x] Filmařský modul Fáze 2 (Hyperlapse, Arc Shot)
- [x] Help sekce – fotogrammetrie + filmařský modul
- [x] Vyhledávání adresy (Nominatim, abstrakční vrstva)
- [x] Filmařský modul Fáze 3 (Boomerang, Rocket, POI Sequence)
- [x] Terrain Following (Open-Meteo API, batching, safety floor 2 m)
- [x] 3D náhled mise (CesiumJS, World Terrain, OSM Buildings, trasa ve vzduchu)
- [x] Import KMZ zpět do aplikace (JSZip + DOMParser, WPML namespace, flyTo centroid)
- [x] CTR/TRA zóny – zobrazení na mapě (OpenAIP API, toggle tlačítko, barevné polygony, tooltip, caching)

---
*Aktualizuj tento soubor při každé session kdy se
implementuje nová funkce nebo vznikne nový nápad.*
