// Help page — visual guide to the DJI Waypoint Planner
// Static server component (no client-side state needed)
import Link from 'next/link';

// ── Mission type card data ───────────────────────────────────

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

// ── Shared style helpers ─────────────────────────────────────

const sectionClass = 'mb-12';
const h2Class = 'text-lg font-semibold mb-4 text-blue-400 border-b border-gray-800 pb-2';
const tableClass = 'w-full text-sm border-collapse mt-4';
const thClass = 'text-left text-xs text-gray-500 font-medium py-2 px-3 border-b border-gray-700';
const tdClass = 'py-2 px-3 text-gray-300 border-b border-gray-800';

// ── Page component ───────────────────────────────────────────

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* ── Header ── */}
        <div className="mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-blue-400 text-sm hover:text-blue-300 transition-colors"
          >
            ← Zpět na mapu
          </Link>
          <h1 className="text-2xl font-bold mt-4 mb-1">Nápověda</h1>
          <p className="text-gray-500 text-sm">DJI Waypoint Planner · Mini 4 Pro</p>
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
              'Vyber typ mise v záložkách vlevo (Body, Grid, Fasáda...)',
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
        <section className={sectionClass}>
          <h2 className={h2Class}>Výběr typu mise</h2>
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
              {/* Body */}
              <rect x="82" y="70" width="38" height="14" rx="3" fill="#1d4ed8" />
              {/* Front arm up */}
              <line x1="92" y1="70" x2="92" y2="55" stroke="#374151" strokeWidth="2" />
              {/* Back arm up */}
              <line x1="112" y1="70" x2="112" y2="55" stroke="#374151" strokeWidth="2" />
              {/* Propellers (front, back) */}
              <ellipse cx="92" cy="54" rx="14" ry="3.5" fill="none" stroke="#6b7280" strokeWidth="1.5" />
              <ellipse cx="112" cy="54" rx="14" ry="3.5" fill="none" stroke="#6b7280" strokeWidth="1.5" />
              {/* Camera lens on front */}
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
              {/* Vertical guide lines down to arrow */}
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
        <section className={sectionClass}>
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
