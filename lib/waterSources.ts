// Color and opacity mapping for water source protection zones.
// Data pre-fetched by scripts/fetch-water-sources.js → public/data/water-sources-cz.json
//
// tier=drinking — confirmed drinking water source (darker blue, higher opacity)
// tier=general  — unspecified reservoir (lighter blue, lower opacity)

/** Border/fill color per water source tier */
export function waterSourceColor(tier: string): string {
  if (tier === 'drinking') return '#0369a1'; // dark blue — confirmed drinking water
  return '#7dd3fc';                           // light blue — general reservoir
}

/** Fill opacity per water source tier */
export function waterSourceFillOpacity(tier: string): number {
  if (tier === 'drinking') return 0.30;
  return 0.15; // general
}
