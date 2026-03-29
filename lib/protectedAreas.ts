// Protected area types and color mapping — used by ProtectedAreasLayer component.
// Data pre-fetched by scripts/fetch-protected-areas.js → public/data/protected-areas-cz.json

/** Color for each protected area type */
export function protectedAreaColor(type: string): string {
  if (type === 'NP')   return '#22c55e'; // green — National Park (strict restrictions)
  if (type === 'CHKO') return '#3b82f6'; // blue  — Protected Landscape Area (moderate)
  return '#94a3b8';                      // gray  — other
}

/** Fill opacity per type */
export function protectedAreaFillOpacity(type: string): number {
  if (type === 'NP')   return 0.25;
  if (type === 'CHKO') return 0.15;
  return 0.1;
}

export interface ProtectedArea {
  name: string;
  type: 'NP' | 'CHKO' | string;
  restriction: string;
}
