// Help page — visual guide to the DJI Waypoint Planner
// Static server component (no client-side state needed)
import Link from 'next/link';

// ── Photogrammetry mission card data ─────────────────────────

const MISSION_TYPES: {
  type: string;
  tab: string;
  color: string;
  when: string;
  example: string;
}[] = [
  {
    type: 'Body',
    tab: 'záložka Body',
    color: '#3b82f6',
    when: 'Chceš ručně naplánovat vlastní trasu bod po bodu',
    example: 'Kreativní let, průlet kolem objektu, vlastní trajektorie',
  },
  {
    type: 'Spirála',
    tab: 'záložka Spirála',
    color: '#8b5cf6',
    when: 'Chceš kroužit kolem objektu se stoupáním nebo klesáním',
    example: 'Věž, strom, komín, rozhledna',
  },
  {
    type: 'Grid',
    tab: 'záložka Grid',
    color: '#22c55e',
    when: 'Chceš automaticky zmapovat plochu shora (fotogrammetrie)',
    example: 'Pole, střecha, staveniště, pozemek',
  },
  {
    type: 'Orbit',
    tab: 'záložka Orbit',
    color: '#06b6d4',
    when: 'Chceš kroužit kolem jednoho bodu ve stejné výšce',
    example: 'Záběr fasády z výšky, objezd POI, architektura',
  },
  {
    type: 'Fasáda',
    tab: 'záložka Fasáda → Jedna strana',
    color: '#f97316',
    when: 'Chceš zdokumentovat jednu stěnu budovy (lawn-mower)',
    example: 'Fasáda pro opravu, stavební projekt, pojistná událost',
  },
  {
    type: 'Fasáda 360°',
    tab: 'záložka Fasáda → Celá budova 360°',
    color: '#f59e0b',
    when: 'Chceš nafotit celou budovu dokola v jedné misi',
    example: 'Celková dokumentace budovy, 3D rekonstrukce',
  },
];

// ── Film shot card data ───────────────────────────────────────

const FILM_SHOT_TYPES: {
  type: string;
  tab: string;
  when: string;
  example: string;
}[] = [
  {
    type: 'Dronie',
    tab: 'Film → Dronie',
    when: 'Chceš odletový záběr od subjektu',
    example: 'Odlet od budovy, osoby, auta',
  },
  {
    type: 'Reveal',
    tab: 'Film → Reveal',
    when: 'Chceš postupně odhalit scénu',
    example: 'Let k POI zpoza překážky',
  },
  {
    type: 'Top-down',
    tab: 'Film → Top-down',
    when: 'Chceš pohled přímo shora',
    example: 'Přelet nad krajinou, střechou',
  },
  {
    type: 'Crane Up',
    tab: 'Film → Crane Up',
    when: 'Chceš imitovat filmový jeřáb',
    example: 'Vertikální stoupání na místě',
  },
  {
    type: 'Hyperlapse',
    tab: 'Film → Hyperlapse',
    when: 'Chceš časosběrné video z pohybu',
    example: 'Let při západu slunce',
  },
  {
    type: 'Arc Shot',
    tab: 'Film → Arc Shot',
    when: 'Chceš dramatický obletový záběr',
    example: 'Oblet budovy s měnící se výškou',
  },
  {
    type: 'Boomerang',
    tab: 'Film → Boomerang',
    when: 'Chceš záběr tam a zpět po stejné trase',
    example: 'Let nad řekou, přes pole, kolem budovy',
  },
  {
    type: 'Rocket',
    tab: 'Film → Rocket',
    when: 'Chceš dramatický vzlet kolmo nahoru',
    example: 'Rocket shot při úvodu videa',
  },
  {
    type: 'POI Sequence',
    tab: 'Film → POI Seq',
    when: 'Chceš objekt z více perspektiv za sebou',
    example: 'Budova ze 4 světových stran',
  },
];

// ── Film speed recommendations ────────────────────────────────

const FILM_SPEEDS: { shot: string; speed: string; why: string }[] = [
  { shot: 'Dronie',     speed: '2–4 m/s',   why: 'Plynulý odlet, ne trhavý' },
  { shot: 'Reveal',     speed: '1–3 m/s',   why: 'Pomalé odhalení budí napětí' },
  { shot: 'Top-down',   speed: '1–3 m/s',   why: 'Stabilní obraz při pohledu dolů' },
  { shot: 'Crane Up',   speed: '0.5–1.5 m/s', why: 'Velmi pomalé = dramatické' },
  { shot: 'Hyperlapse', speed: '0.5–2 m/s', why: 'Závisí na intervalu focení' },
  { shot: 'Arc Shot',      speed: '1–3 m/s',   why: 'Plynulý oblet bez rozmazání' },
  { shot: 'Boomerang',     speed: '2–4 m/s',   why: 'Plynulý pohyb tam i zpět' },
  { shot: 'Rocket',        speed: '3–6 m/s',   why: 'Rychlejší = dramatičtější efekt' },
  { shot: 'POI Sequence',  speed: '1–3 m/s',   why: 'Pomalý přechod mezi perspektivami' },
];

// ── Shared style helpers ─────────────────────────────────────

const sectionClass = 'mb-12';
const h2Class = 'text-lg font-semibold mb-4 text-blue-400 border-b border-gray-800 pb-2';
const h2FilmClass = 'text-lg font-semibold mb-4 text-purple-400 border-b border-gray-800 pb-2';
const tableClass = 'w-full text-sm border-collapse mt-4';
const thClass = 'text-left text-xs text-gray-500 font-medium py-2 px-3 border-b border-gray-700';
const tdClass = 'py-2 px-3 text-gray-300 border-b border-gray-800';

// ── Page component ───────────────────────────────────────────

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* ── Header ── */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-blue-400 text-sm hover:text-blue-300 transition-colors"
          >
            ← Zpět na mapu
          </Link>
          <h1 className="text-2xl font-bold mt-4 mb-1">Nápověda</h1>
          <p className="text-gray-500 text-sm">DJI Waypoint Planner · Mini 4 Pro</p>
        </div>

        {/* ── Navigation anchors ── */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-10 scrollbar-none">
          <a
            href="#foto"
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium bg-[#1a1d27] border border-blue-700 text-blue-400 hover:bg-blue-900/30 transition-colors"
          >
            📷 Fotogrammetrie
          </a>
          <a
            href="#film"
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium bg-[#1a1d27] border border-purple-700 text-purple-400 hover:bg-purple-900/30 transition-colors"
          >
            🎬 Filmařský modul
          </a>
          <a
            href="#prenos"
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium bg-[#1a1d27] border border-gray-600 text-gray-400 hover:bg-gray-800 transition-colors"
          >
            📡 Přenos do RC 2
          </a>
        </div>

        {/* ── A: Jak začít ── */}
        <section className={sectionClass}>
          <h2 className={h2Class}>Jak začít</h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            Aplikace slouží k plánování autonomních letových misí pro DJI Mini 4 Pro.
            Naplánuješ trasu v mapě, nastavíš parametry a exportuješ KMZ soubor kompatibilní s DJI Fly.
          </p>
          <ol className="space-y-2 text-sm text-gray-300 list-none">
            {[
              'Najdi lokaci pomocí vyhledávacího pole adresy nahoře v panelu, nebo přibliž mapu ručně',
              'Vyber režim (📷 Foto nebo 🎬 Film) a typ mise v záložkách',
              'Nastav parametry a klikni na mapu nebo stiskni Generovat',
              'Zkontroluj trasu zobrazenou na mapě',
              'Klikni Exportovat KMZ a ulož soubor do počítače',
              'Přenes soubor do RC 2 přes USB-C a otevři v DJI Fly',
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-gray-500">
            Podrobný postup přenosu souboru do RC 2:{' '}
            <Link href="/guide" className="text-blue-400 hover:underline">
              Zobrazit detailní návod →
            </Link>
          </p>
        </section>

        {/* ── B: Výběr typu mise ── */}
        <section id="foto" className={sectionClass}>
          <h2 className={h2Class}>Výběr typu mise</h2>

          {/* Photogrammetry subheading */}
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">
            📷 Fotogrammetrie
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MISSION_TYPES.map((m) => (
              <div
                key={m.type}
                className="bg-[#1a1d27] rounded-lg p-4 border border-gray-700 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: m.color }}
                  />
                  <span className="font-semibold text-sm text-white">{m.type}</span>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">{m.when}</p>
                <p className="text-gray-600 text-xs italic">{m.example}</p>
                <p className="text-xs mt-auto pt-1" style={{ color: m.color }}>
                  → {m.tab}
                </p>
              </div>
            ))}
          </div>

          {/* Film module teaser */}
          <div className="mt-5 flex items-center justify-between bg-purple-900/10 border border-purple-800/40 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
              🎬 Filmařský modul
            </p>
            <a
              href="#film"
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium"
            >
              Zobrazit filmařské záběry →
            </a>
          </div>
        </section>

        {/* ── FILM: Filmařský modul ── */}
        <section id="film" className={sectionClass}>
          <h2 className={h2FilmClass}>Filmařský modul</h2>

          {/* 2a — Úvod */}
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Film mód slouží pro cinematic záběry, ne fotogrammetrii. Každý záběr generuje waypointy
            s akcemi <span className="text-purple-300 font-mono text-xs">startVideo</span> /{' '}
            <span className="text-purple-300 font-mono text-xs">stopVideo</span> pro automatické
            ovládání kamery. Přepni na{' '}
            <span className="text-white font-medium">Film</span> v horní části sidebaru a vyber typ záběru.
          </p>

          {/* 2b — 6 karet záběrů */}
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">
            Přehled záběrů
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            {FILM_SHOT_TYPES.map((s) => (
              <div
                key={s.type}
                className="bg-[#1a1d27] rounded-lg p-4 border border-gray-700 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0 bg-purple-500" />
                  <span className="font-semibold text-sm text-white">{s.type}</span>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">{s.when}</p>
                <p className="text-gray-600 text-xs italic">{s.example}</p>
                <p className="text-xs mt-auto pt-1 text-purple-400">→ {s.tab}</p>
              </div>
            ))}
          </div>

          {/* 2c — Doporučené rychlosti */}
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
            Doporučené rychlosti pro cinematic záběry
          </p>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Záběr</th>
                <th className={thClass}>Rychlost</th>
                <th className={thClass}>Proč</th>
              </tr>
            </thead>
            <tbody>
              {FILM_SPEEDS.map((row) => (
                <tr key={row.shot}>
                  <td className={tdClass}>
                    <span className="text-white font-medium">{row.shot}</span>
                  </td>
                  <td className={tdClass}>
                    <span className="text-purple-300 font-medium">{row.speed}</span>
                  </td>
                  <td className={tdClass + ' text-gray-500'}>{row.why}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 2d — Gimbal diagram */}
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mt-8 mb-3">
            Jak funguje gimbal v film módu
          </p>
          <div className="bg-[#1a1d27] rounded-lg p-4 border border-gray-700 flex justify-center">
            <svg
              viewBox="0 0 260 215"
              className="w-full"
              style={{ maxWidth: '420px' }}
              aria-label="Diagram úhlů gimbalu kamery dronu"
            >
              {/* ── Row 1: 0° ── */}
              {/* Drone body */}
              <rect x="12" y="23" width="30" height="10" rx="2" fill="#1d4ed8" />
              {/* Arms */}
              <line x1="20" y1="23" x2="20" y2="11" stroke="#374151" strokeWidth="2" />
              <line x1="34" y1="23" x2="34" y2="11" stroke="#374151" strokeWidth="2" />
              {/* Props */}
              <ellipse cx="20" cy="11" rx="9" ry="3" fill="none" stroke="#4b5563" strokeWidth="1.5" />
              <ellipse cx="34" cy="11" rx="9" ry="3" fill="none" stroke="#4b5563" strokeWidth="1.5" />
              {/* Camera */}
              <rect x="42" y="24" width="7" height="8" rx="1" fill="#1e40af" stroke="#60a5fa" strokeWidth="0.8" />
              {/* Direction line — 0° horizontal */}
              <line x1="49" y1="28" x2="90" y2="28" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
              <circle cx="90" cy="28" r="2.5" fill="#d1d5db" />
              {/* Labels */}
              <text x="100" y="25" fill="#9ca3af" fontSize="10" fontFamily="sans-serif" fontWeight="bold">0°</text>
              <text x="118" y="25" fill="#6b7280" fontSize="9" fontFamily="sans-serif"> — horizontální pohled (rovina)</text>

              {/* ── Row 2: -30° ── */}
              <rect x="12" y="71" width="30" height="10" rx="2" fill="#1d4ed8" />
              <line x1="20" y1="71" x2="20" y2="59" stroke="#374151" strokeWidth="2" />
              <line x1="34" y1="71" x2="34" y2="59" stroke="#374151" strokeWidth="2" />
              <ellipse cx="20" cy="59" rx="9" ry="3" fill="none" stroke="#4b5563" strokeWidth="1.5" />
              <ellipse cx="34" cy="59" rx="9" ry="3" fill="none" stroke="#4b5563" strokeWidth="1.5" />
              <rect x="42" y="72" width="7" height="8" rx="1" fill="#1e40af" stroke="#60a5fa" strokeWidth="0.8" />
              {/* Direction line — -30° (in SVG: dx=35, dy=20) */}
              <line x1="49" y1="76" x2="84" y2="96" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
              <circle cx="84" cy="96" r="2.5" fill="#a78bfa" />
              <text x="100" y="73" fill="#a78bfa" fontSize="10" fontFamily="sans-serif" fontWeight="bold">-30°</text>
              <text x="124" y="73" fill="#6b7280" fontSize="9" fontFamily="sans-serif"> — mírně dolů (typický let)</text>

              {/* ── Row 3: -60° ── */}
              <rect x="12" y="119" width="30" height="10" rx="2" fill="#1d4ed8" />
              <line x1="20" y1="119" x2="20" y2="107" stroke="#374151" strokeWidth="2" />
              <line x1="34" y1="119" x2="34" y2="107" stroke="#374151" strokeWidth="2" />
              <ellipse cx="20" cy="107" rx="9" ry="3" fill="none" stroke="#4b5563" strokeWidth="1.5" />
              <ellipse cx="34" cy="107" rx="9" ry="3" fill="none" stroke="#4b5563" strokeWidth="1.5" />
              <rect x="42" y="120" width="7" height="8" rx="1" fill="#1e40af" stroke="#60a5fa" strokeWidth="0.8" />
              {/* Direction line — -60° (in SVG: dx=19, dy=33) */}
              <line x1="49" y1="124" x2="68" y2="157" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" />
              <circle cx="68" cy="157" r="2.5" fill="#8b5cf6" />
              <text x="100" y="121" fill="#8b5cf6" fontSize="10" fontFamily="sans-serif" fontWeight="bold">-60°</text>
              <text x="124" y="121" fill="#6b7280" fontSize="9" fontFamily="sans-serif"> — strmě dolů (dramatický)</text>

              {/* ── Row 4: -90° ── */}
              <rect x="12" y="167" width="30" height="10" rx="2" fill="#1d4ed8" />
              <line x1="20" y1="167" x2="20" y2="155" stroke="#374151" strokeWidth="2" />
              <line x1="34" y1="167" x2="34" y2="155" stroke="#374151" strokeWidth="2" />
              <ellipse cx="20" cy="155" rx="9" ry="3" fill="none" stroke="#4b5563" strokeWidth="1.5" />
              <ellipse cx="34" cy="155" rx="9" ry="3" fill="none" stroke="#4b5563" strokeWidth="1.5" />
              <rect x="42" y="168" width="7" height="8" rx="1" fill="#1e40af" stroke="#60a5fa" strokeWidth="0.8" />
              {/* Direction line — -90° straight down */}
              <line x1="49" y1="172" x2="49" y2="208" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" />
              <circle cx="49" cy="208" r="2.5" fill="#7c3aed" />
              <text x="100" y="169" fill="#7c3aed" fontSize="10" fontFamily="sans-serif" fontWeight="bold">-90°</text>
              <text x="124" y="169" fill="#6b7280" fontSize="9" fontFamily="sans-serif"> — přímo dolů (Top-down)</text>

              {/* Legend note */}
              <text x="10" y="213" fill="#4b5563" fontSize="8" fontFamily="sans-serif">
                ● = směr pohledu kamery
              </text>
            </svg>
          </div>

          {/* 2e — Hyperlapse výpočet */}
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mt-8 mb-3">
            Hyperlapse — výpočet délky videa
          </p>
          <div className="bg-purple-900/15 border border-purple-800/50 rounded-lg px-4 py-4 text-sm">
            <div className="font-mono text-xs text-purple-300 space-y-1 mb-4">
              <p>počet fotek  =  délka trasy ÷ (rychlost × interval)</p>
              <p>délka videa  =  počet fotek ÷ 25 fps</p>
            </div>
            <div className="border-t border-purple-800/40 pt-3">
              <p className="text-xs text-gray-400 leading-relaxed">
                <span className="text-white font-medium">Příklad:</span>{' '}
                Trasa 300 m, rychlost 1 m/s, interval 3 s
                <br />
                = 300 ÷ (1 × 3) = <span className="text-purple-300 font-medium">100 fotek</span>{' '}
                = ~<span className="text-purple-300 font-medium">4 sekundy videa</span> při 25 fps
              </p>
            </div>
            <p className="mt-3 text-xs text-gray-600">
              Aplikace zobrazuje live výpočet v info boxu a zablokuje generování při překročení 200 fotek.
            </p>
          </div>
        </section>

        {/* ── C: Překryv ── */}
        <section className={sectionClass}>
          <h2 className={h2Class}>Jak funguje překryv (%)</h2>
          <p className="text-gray-400 text-sm mb-5 leading-relaxed">
            Překryv určuje, jak moc se sousední fotografie překrývají. Vyšší překryv = více fotek,
            lepší podklady pro 3D rekonstrukci, ale delší mise.
          </p>

          {/* SVG overlap diagram */}
          <div className="bg-[#1a1d27] rounded-lg p-4 border border-gray-700 flex justify-center">
            <svg
              viewBox="0 0 290 115"
              className="w-full"
              style={{ maxWidth: '460px' }}
              aria-label="Diagram překryvu fotografií"
            >
              {/* Overlap fill regions (behind frame borders) */}
              <rect x="44" y="30" width="56" height="52" fill="#3b82f6" fillOpacity="0.18" />
              <rect x="68" y="30" width="56" height="52" fill="#3b82f6" fillOpacity="0.18" />
              <rect x="92" y="30" width="56" height="52" fill="#3b82f6" fillOpacity="0.18" />

              {/* Camera frame outlines */}
              <rect x="20" y="30" width="80" height="52" fill="none" stroke="#6b7280" strokeWidth="1.5" rx="1" />
              <rect x="44" y="30" width="80" height="52" fill="none" stroke="#6b7280" strokeWidth="1.5" rx="1" />
              <rect x="68" y="30" width="80" height="52" fill="none" stroke="#6b7280" strokeWidth="1.5" rx="1" />
              <rect x="92" y="30" width="80" height="52" fill="none" stroke="#6b7280" strokeWidth="1.5" rx="1" />

              {/* "záběr kamery" label with pointer to first frame */}
              <line x1="60" y1="22" x2="60" y2="30" stroke="#4b5563" strokeWidth="0.8" strokeDasharray="2 1.5" />
              <text x="60" y="18" textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily="sans-serif">
                záběr kamery
              </text>

              {/* "70%" label in the second overlap zone */}
              <text x="96" y="61" textAnchor="middle" fill="#60a5fa" fontSize="14" fontWeight="bold" fontFamily="sans-serif">
                70%
              </text>
              <text x="96" y="73" textAnchor="middle" fill="#3b82f6" fontSize="8" fontFamily="sans-serif">
                překryv
              </text>

              {/* "posun" measurement at bottom — tick + line + tick */}
              <line x1="20" y1="94" x2="44" y2="94" stroke="#4b5563" strokeWidth="1" />
              <line x1="20" y1="90" x2="20" y2="98" stroke="#4b5563" strokeWidth="1" />
              <line x1="44" y1="90" x2="44" y2="98" stroke="#4b5563" strokeWidth="1" />
              <text x="32" y="108" textAnchor="middle" fill="#6b7280" fontSize="8.5" fontFamily="sans-serif">
                posun (30%)
              </text>

              {/* Right-side note */}
              <text x="200" y="52" fill="#6b7280" fontSize="8.5" fontFamily="sans-serif">4 záběry,</text>
              <text x="200" y="63" fill="#6b7280" fontSize="8.5" fontFamily="sans-serif">70% překryv</text>
            </svg>
          </div>

          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Překryv</th>
                <th className={thClass}>Kdy použít</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={tdClass}><span className="text-yellow-400 font-medium">60 %</span></td>
                <td className={tdClass}>Rychlý průzkum, orientační záběry</td>
              </tr>
              <tr>
                <td className={tdClass}><span className="text-green-400 font-medium">70–80 %</span></td>
                <td className={tdClass}>Standard pro fotogrammetrii a dokumentaci</td>
              </tr>
              <tr>
                <td className={tdClass}><span className="text-blue-400 font-medium">85 %+</span></td>
                <td className={tdClass}>Detailní 3D rekonstrukce, přesné modely</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ── D: Vzdálenost od fasády ── */}
        <section className={sectionClass}>
          <h2 className={h2Class}>Vzdálenost od fasády</h2>
          <p className="text-gray-400 text-sm mb-5 leading-relaxed">
            Vzdálenost určuje jak daleko od stěny dron letí. Ovlivňuje velikost záběru na fotkách
            a tím i počet potřebných fotografií.
          </p>

          {/* SVG side-view diagram */}
          <div className="bg-[#1a1d27] rounded-lg p-4 border border-gray-700 flex justify-center">
            <svg
              viewBox="0 0 360 160"
              className="w-full"
              style={{ maxWidth: '500px' }}
              aria-label="Pohled zboku — vzdálenost dronu od fasády"
            >
              <defs>
                <marker id="arr" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
                  <polygon points="0 0, 7 2.5, 0 5" fill="#6b7280" />
                </marker>
                <marker id="arr-l" markerWidth="7" markerHeight="5" refX="1" refY="2.5" orient="auto-start-reverse">
                  <polygon points="0 0, 7 2.5, 0 5" fill="#6b7280" />
                </marker>
              </defs>

              {/* Building wall (right side) */}
              <rect x="290" y="18" width="22" height="118" fill="#374151" stroke="#6b7280" strokeWidth="1" rx="1" />
              <text x="316" y="80" fill="#9ca3af" fontSize="9" fontFamily="sans-serif" dominantBaseline="middle">
                zeď
              </text>

              {/* Camera FOV cone (light blue triangle) */}
              <polygon
                points="124,77 290,32 290,122"
                fill="#3b82f6"
                fillOpacity="0.06"
                stroke="#3b82f6"
                strokeOpacity="0.3"
                strokeWidth="0.8"
                strokeDasharray="5 3"
              />

              {/* Drone body (side view) */}
              <rect x="82" y="70" width="38" height="14" rx="3" fill="#1d4ed8" />
              <line x1="92" y1="70" x2="92" y2="55" stroke="#374151" strokeWidth="2" />
              <line x1="112" y1="70" x2="112" y2="55" stroke="#374151" strokeWidth="2" />
              <ellipse cx="92" cy="54" rx="14" ry="3.5" fill="none" stroke="#6b7280" strokeWidth="1.5" />
              <ellipse cx="112" cy="54" rx="14" ry="3.5" fill="none" stroke="#6b7280" strokeWidth="1.5" />
              <rect x="118" y="72" width="9" height="9" rx="1.5" fill="#1e40af" stroke="#60a5fa" strokeWidth="0.8" />

              {/* "dron" label */}
              <text x="101" y="100" textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily="sans-serif">
                dron
              </text>

              {/* Distance arrow (horizontal, with double arrowheads) */}
              <line
                x1="128" y1="130" x2="289" y2="130"
                stroke="#6b7280" strokeWidth="1"
                markerEnd="url(#arr)"
                markerStart="url(#arr-l)"
              />
              <line x1="127" y1="84" x2="127" y2="128" stroke="#4b5563" strokeWidth="0.6" strokeDasharray="3 2" />
              <line x1="290" y1="136" x2="290" y2="128" stroke="#4b5563" strokeWidth="0.6" strokeDasharray="3 2" />

              {/* Distance label */}
              <rect x="188" y="120" width="34" height="16" rx="3" fill="#1a1d27" />
              <text x="205" y="131" textAnchor="middle" fill="#f9fafb" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                8 m
              </text>
            </svg>
          </div>

          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Vzdálenost</th>
                <th className={thClass}>Vhodné pro</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={tdClass}><span className="text-green-400 font-medium">5–8 m</span></td>
                <td className={tdClass}>Detailní záběry, bytový dům, menší fasáda</td>
              </tr>
              <tr>
                <td className={tdClass}><span className="text-yellow-400 font-medium">10–15 m</span></td>
                <td className={tdClass}>Větší budova, bezpečnostní rezerva</td>
              </tr>
              <tr>
                <td className={tdClass}><span className="text-gray-400 font-medium">20+ m</span></td>
                <td className={tdClass}>Přehledový záběr, minimální detail, velký objekt</td>
              </tr>
            </tbody>
          </table>

          <p className="mt-3 text-xs text-gray-500 leading-relaxed">
            Čím menší vzdálenost → menší záběr kamery na stěnu → více fotek → více waypointů.
            Při překročení limitu 200 waypointů zvětši vzdálenost nebo sniž překryv.
          </p>
        </section>

        {/* ── E: Limit 200 waypointů ── */}
        <section className={sectionClass}>
          <h2 className={h2Class}>Limit 200 waypointů</h2>
          <p className="text-gray-400 text-sm mb-4 leading-relaxed">
            DJI Fly podporuje maximálně 200 waypointů v jedné misi. Aplikace zobrazuje barevné
            varování v info boxu a zablokuje generování při překročení.
          </p>

          <div className="flex flex-col gap-2 mb-5">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-gray-400">≤ 150 waypointů — v pořádku</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-yellow-500 flex-shrink-0" />
              <span className="text-gray-400">151–200 waypointů — blíží se limitu</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
              <span className="text-gray-400">&gt; 200 waypointů — generování zablokováno</span>
            </div>
          </div>

          <div className="bg-red-900/20 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-400 mb-4">
            ⚠ Červené varování = mise má více než 200 waypointů a nelze ji exportovat.
          </div>

          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Problém</th>
                <th className={thClass}>Řešení</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Příliš mnoho waypointů', 'Sniž překryv z 80 % na 60 %'],
                ['Příliš mnoho waypointů', 'Zvětši vzdálenost od fasády (více m)'],
                ['Příliš mnoho waypointů', 'Zmenši výškový rozsah (start/konec)'],
                ['Příliš mnoho waypointů', 'Rozděl misi na 2 části (např. spodní / horní polovina)'],
              ].map(([prob, sol], i) => (
                <tr key={i}>
                  <td className={tdClass + ' text-red-400'}>{prob}</td>
                  <td className={tdClass}>{sol}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ── F: Přenos do RC 2 ── */}
        <section id="prenos" className={sectionClass}>
          <h2 className={h2Class}>Přenos mise do RC 2</h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            Po exportu KMZ souboru ho přenese přes USB-C do ovladače RC 2. V DJI Fly otevři
            existující dummy misi a přepiš její KMZ soubor tím exportovaným — zachovej původní
            název souboru.
          </p>
          <Link
            href="/guide"
            className="inline-flex items-center gap-1 text-blue-400 text-sm hover:text-blue-300 transition-colors font-medium"
          >
            Zobrazit detailní návod krok za krokem →
          </Link>
        </section>

      </div>
    </div>
  );
}
