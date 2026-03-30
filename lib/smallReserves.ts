// Color and opacity mapping for small nature reserves (NPR/NPP/PR/PP).
// Data pre-fetched by scripts/fetch-small-reserves.js → public/data/small-reserves-cz.json

/** Border/fill color per reserve type */
export function smallReserveColor(type: string): string {
  if (type === 'NPR' || type === 'NPP') return '#15803d'; // dark green — stricter protection
  return '#86efac';                                        // light green — moderate protection (PR/PP)
}

/** Fill opacity per reserve type */
export function smallReserveFillOpacity(type: string): number {
  if (type === 'NPR' || type === 'NPP') return 0.3;
  return 0.2; // PR / PP
}
