// Airspace data fetching — OpenAIP API
// Fetches CTR, TRA, PROHIBITED, RESTRICTED and DANGER zones for the given country.
// API key is read from NEXT_PUBLIC_OPENAIP_API_KEY environment variable.

/** Airspace type IDs relevant for drone operators (OpenAIP v1 type enum) */
const RELEVANT_TYPES: Record<number, string> = {
  1: 'RESTRICTED',
  2: 'DANGER',
  3: 'PROHIBITED',
  4: 'CTR',
  8: 'TRA',
};

/** ICAO airspace class numbers → letters */
const ICAO_CLASS_NAMES: Record<number, string> = {
  0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F', 6: 'G',
};

/**
 * Returns a fill/stroke color for an airspace zone based on its risk level.
 * - Red   (#ef4444) — prohibited airspace (no entry)
 * - Orange (#f97316) — restricted, danger, CTR (caution required)
 * - Yellow (#eab308) — TRA (temporarily reserved)
 */
export function airspaceColor(type: number): string {
  if (type === 3) return '#ef4444';            // PROHIBITED — red
  if (type === 1 || type === 2) return '#f97316'; // RESTRICTED / DANGER — orange
  if (type === 4) return '#f97316';            // CTR — orange
  if (type === 8) return '#eab308';            // TRA — yellow
  return '#94a3b8';                            // fallback — gray
}

export interface AirspaceZone {
  id: string;
  name: string;
  type: number;
  typeName: string;
  icaoClass?: string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

/**
 * Fetches all relevant airspace zones for the given country from OpenAIP API.
 * Returns only types relevant for drone operators: CTR, TRA, PROHIBITED, RESTRICTED, DANGER.
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g. "CZ")
 * @returns Array of airspace zones with geometry and metadata
 * @throws Error with a human-readable Czech message on failure
 */
export async function fetchAirspaces(_countryCode: string): Promise<AirspaceZone[]> {
  // Call our own Next.js API proxy — avoids CORS issues and keeps the API key server-side.
  // The countryCode is currently hardcoded to CZ in the proxy route.
  let response: Response;
  try {
    response = await fetch('/api/airspaces');
  } catch {
    throw new Error('Nepodařilo se připojit k serveru. Zkontroluj internetové připojení.');
  }

  if (!response.ok) {
    throw new Error(`OpenAIP API vrátila chybu ${response.status}. Zkus to znovu.`);
  }

  let data: { items?: unknown[] };
  try {
    data = await response.json();
  } catch {
    throw new Error('OpenAIP API vrátila neplatná data.');
  }

  if (!Array.isArray(data.items)) {
    throw new Error('OpenAIP API vrátila neočekávanou strukturu odpovědi.');
  }

  return data.items
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => {
      const typeId = typeof item.type === 'number' ? item.type : -1;
      const icaoClassId = typeof item.icaoClass === 'number' ? item.icaoClass : undefined;
      return {
        id: typeof item._id === 'string' ? item._id : String(Math.random()),
        name: typeof item.name === 'string' ? item.name : 'Neznámá zóna',
        type: typeId,
        typeName: RELEVANT_TYPES[typeId] ?? 'OTHER',
        icaoClass: icaoClassId !== undefined ? ICAO_CLASS_NAMES[icaoClassId] : undefined,
        geometry: item.geometry as AirspaceZone['geometry'],
      };
    })
    // Keep only zones with valid polygon geometry
    .filter((zone) => zone.geometry?.type === 'Polygon' || zone.geometry?.type === 'MultiPolygon');
}
