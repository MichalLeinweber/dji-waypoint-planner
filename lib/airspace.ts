// Airspace zone types and color mapping — used by AirspaceLayer component.
// Data is pre-fetched by scripts/fetch-airspaces.js and stored in public/data/airspaces-cz.json.

import { AIRSPACE_TYPE_NAMES } from './airspaceTypes';
export { AIRSPACE_TYPE_NAMES } from './airspaceTypes';

/** ICAO airspace class IDs → letters */
export const ICAO_CLASS_NAMES: Record<number, string> = {
  0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F', 6: 'G',
};

/**
 * Returns fill/stroke color based on risk level for drone operators.
 * Red   — prohibited (no entry)
 * Orange — restricted, danger, CTR, TSA (caution required)
 * Yellow — TRA, ATZ, TMA (check before flying)
 * Gray  — other informational zones
 */
export function airspaceColor(type: number): string {
  if (type === 3)                  return '#ef4444'; // PROHIBITED — red
  if ([1, 2, 4, 9].includes(type)) return '#f97316'; // RESTRICTED / DANGER / CTR / TSA — orange
  if ([7, 8, 13].includes(type))   return '#eab308'; // TMA / TRA / ATZ — yellow
  return '#94a3b8';                                   // other — gray
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

/** Parse raw OpenAIP API response items into typed AirspaceZone objects */
export function parseAirspaceItems(items: unknown[]): AirspaceZone[] {
  return items
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => {
      const typeId      = typeof item.type === 'number' ? item.type : -1;
      const icaoClassId = typeof item.icaoClass === 'number' ? item.icaoClass : undefined;
      return {
        id:       typeof item._id === 'string' ? item._id : String(Math.random()),
        name:     typeof item.name === 'string' ? item.name : 'Neznámá zóna',
        type:     typeId,
        typeName: AIRSPACE_TYPE_NAMES[typeId] ?? `TYP ${typeId}`,
        icaoClass: icaoClassId !== undefined ? ICAO_CLASS_NAMES[icaoClassId] : undefined,
        geometry: item.geometry as AirspaceZone['geometry'],
      };
    })
    .filter((z) => z.geometry?.type === 'Polygon' || z.geometry?.type === 'MultiPolygon');
}
