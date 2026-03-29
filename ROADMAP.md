# Roadmap – DJI Waypoint Planner

## 🔥 Vysoká priorita
- [ ] Geocoding swap na Mapy.cz API pro komerční provoz
      (abstrakční vrstva lib/geocoding.ts je připravena,
       stačí vyměnit funkci searchAddress())
- [ ] Import KMZ zpět do aplikace (editace existující mise)

## 📋 Střední priorita
- [ ] Sdílení misí jako URL odkaz (URL encode JSON mise)
- [ ] Anglická jazyková mutace (i18n)
- [x] Google Photorealistic 3D Tiles integrace do 3D náhledu
      (hotovo – toggle tlačítko 🌍 Google 3D, fallback na OSM Buildings)

## 💡 Nápady a budoucí rozvoj
- [ ] BEZPEČNOST: Omezit Google Maps API klíč na konkrétní doménu
      před komerčním nasazením.
      Postup: Google Cloud Console → APIs & Services → Credentials →
      vybrat klíč → Application restrictions → HTTP referrers →
      přidat produkční doménu.
      Aktuálně: klíč bez omezení (OK pro vývoj a testování).
- [ ] Komercionalizace – multi-user, přihlášení, Supabase
- [ ] Help sekce – rozšíření o více tipů a diagramů
- [ ] Odhad spotřeby baterie a doby letu
- [ ] Mobilní notifikace při přiblížení se k CTR/TRA zónám
- [ ] Export do formátu Litchi CSV (pro starší drony)

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

*Poznámka: Design se dělá až po dokončení všech funkcionalit.*

## ✅ Dokončeno (přesunuto z plánů)
- [x] Fasáda 360° – celá budova v jedné misi
- [x] Filmařský modul Fáze 1 (Dronie, Reveal, Top-down,
      Crane Up)
- [x] Filmařský modul Fáze 2 (Hyperlapse, Arc Shot)
- [x] Help sekce – fotogrammetrie + filmařský modul
- [x] Vyhledávání adresy (Nominatim, abstrakční vrstva)
- [x] Filmařský modul Fáze 3 (Boomerang, Rocket, POI Sequence)
- [x] Terrain Following (Open-Meteo API, batching, safety floor 2 m)
- [x] 3D náhled mise (CesiumJS, World Terrain, OSM Buildings, trasa ve vzduchu)

---
*Aktualizuj tento soubor při každé session kdy se
implementuje nová funkce nebo vznikne nový nápad.*
