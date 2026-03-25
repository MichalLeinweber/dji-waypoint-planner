// Guide page — step-by-step instructions for transferring a mission to DJI RC 2
import Link from 'next/link';

/** A single step in the transfer guide */
interface Step {
  number: number;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    number: 1,
    title: 'Exportuj KMZ soubor',
    description:
      'V hlavni aplikaci nastav waypoints a klikni na "Exportovat KMZ". Soubor se stahne do slozky Stazene (Downloads) na tvojem pocitaci.',
  },
  {
    number: 2,
    title: 'Vytvor dummy misi v DJI Fly',
    description:
      'Na RC 2 otevri aplikaci DJI Fly. Vytvor novou prazdnou misi (napr. jednim waypoint) a uloz ji. Tato mise bude nahrazena tou exportovanou.',
  },
  {
    number: 3,
    title: 'Pripoj RC 2 k pocitaci',
    description:
      'Pripoj DJI RC 2 k pocitaci pomoci USB-C datoveho kabelu (ne nabijeci). Na RC 2 potvrdte povoleni pristupu k souborum, pokud se zobrazi dialog.',
  },
  {
    number: 4,
    title: 'Najdi slozku waypoint',
    description:
      'V pruzkumiku Windows naviguj do: Internal storage → Android → data → dji.go.v5 → files → waypoint',
  },
  {
    number: 5,
    title: 'Nahrad KMZ soubor',
    description:
      'Najdi slozku dummy mise (nejnovejsi datum). Uvnitr naleznes .kmz soubor s nahodnym nazvem. Zkopiruj exportovany .kmz soubor do teto slozky a ZACHOVEJ puvodni nazev souboru (jen nahrad obsah, neprejmenuj).',
  },
  {
    number: 6,
    title: 'Otevri misi v DJI Fly',
    description:
      'Odpoj USB kabel a otevri DJI Fly na RC 2. Prejdi do sekce misii a otevri dummy misi. Trasa by mela odpovidat tvym waypointum. Pred letem vzdy zkontroluj vysky a trasu!',
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      {/* Page header */}
      <header className="bg-[#1a1d27] border-b border-gray-700 px-6 py-4 flex items-center gap-4">
        <Link
          href="/"
          className="text-gray-400 hover:text-white transition-colors text-sm"
        >
          ← Zpet na mapu
        </Link>
        <h1 className="text-white font-bold">Navod: Prenos mise do DJI RC 2</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Info box */}
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-8">
          <p className="text-blue-300 text-sm">
            DJI Mini 4 Pro nepodporuje prime nahravani misii pres aplikaci. Tento postup
            umozni nahrat misi pres nahrazeni souboru v ulozisti RC 2.
          </p>
        </div>

        {/* Steps */}
        <ol className="flex flex-col gap-6">
          {STEPS.map((step) => (
            <li key={step.number} className="flex gap-4">
              {/* Step number circle */}
              <div className="flex-shrink-0 w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white text-sm">
                {step.number}
              </div>

              {/* Step content */}
              <div className="flex-1 bg-[#1a1d27] rounded-lg p-4 border border-gray-700">
                <h2 className="text-white font-semibold mb-1">{step.title}</h2>
                <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>

                {/* Highlight the path for step 4 */}
                {step.number === 4 && (
                  <code className="mt-2 block bg-[#0f1117] text-green-400 text-xs rounded px-3 py-2 font-mono">
                    Internal storage/Android/data/dji.go.v5/files/waypoint/
                  </code>
                )}
              </div>
            </li>
          ))}
        </ol>

        {/* Warning */}
        <div className="mt-8 bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
          <p className="text-yellow-300 text-sm font-semibold mb-1">Dulezite upozorneni</p>
          <p className="text-yellow-200/80 text-sm">
            Vzdy zkontroluj trasu a vysky pred vzletem. Ujisti se, ze letova oblast je
            v souladu s platnou legislativou a neni v zakazu letani (CTR, TRA apod.).
          </p>
        </div>
      </main>
    </div>
  );
}
