// Color and weight mapping for railway lines.
// Data pre-fetched by scripts/fetch-railways.js → public/data/railways-cz.json
//
// Output is LineString GeoJSON (not buffer polygons).
// Visual weight represents approximate buffer zone width.
//
// tier=main — rail / light_rail / narrow_gauge (60 m buffer, dark red)
// tier=tram — tramway (30 m buffer, orange)

/** Stroke color per railway tier */
export function railwayColor(tier: string): string {
  if (tier === 'main') return '#dc2626'; // red-600 — main railway lines
  return '#f97316';                       // orange-500 — tramway lines
}

/** Stroke weight (px) per railway tier — visually hints at the protection zone width */
export function railwayWeight(tier: string): number {
  if (tier === 'main') return 4;
  return 2; // tram — thinner, smaller buffer
}
