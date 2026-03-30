// Color, weight, and buffer-distance mapping for road features.
// Data pre-fetched by scripts/fetch-roads.js → public/data/roads-cz.json
//
// Road classes (from OSM network tags):
//   MOTORWAY   — dálnice D* (cz:motorway)    → 50 m buffer
//   EXPRESSWAY — rychlostní silnice R*/S*     → 50 m buffer
//   PRIMARY    — silnice I. třídy I/*         → 50 m buffer
//   SECONDARY  — silnice II. třídy II/*       → 15 m buffer
//
// Silnice III. a IV. třídy (cz:local) nejsou v datech — pro drony bez omezení.

/** Stroke color per road class */
export function roadColor(roadClass: string): string {
  switch (roadClass) {
    case 'MOTORWAY':
    case 'TRUNK':      return '#f59e0b'; // amber-500 — dálnice + rychlostní silnice
    case 'EXPRESSWAY': return '#f59e0b'; // amber-500
    case 'PRIMARY':    return '#fbbf24'; // amber-400 — silnice I. třídy
    case 'SECONDARY':  return '#fde68a'; // amber-200 — silnice II. třídy
    default:           return '#fcd34d'; // amber-300 fallback
  }
}

/** Stroke weight (px) per road class */
export function roadWeight(roadClass: string): number {
  switch (roadClass) {
    case 'MOTORWAY':
    case 'TRUNK':
    case 'EXPRESSWAY': return 4;
    case 'PRIMARY':    return 3;
    case 'SECONDARY':  return 2;
    default:           return 2;
  }
}

/** Buffer distance in metres per road class */
export function roadBufferM(roadClass: string): number {
  switch (roadClass) {
    case 'MOTORWAY':
    case 'TRUNK':
    case 'EXPRESSWAY':
    case 'PRIMARY':  return 50;
    case 'SECONDARY': return 15;
    default:          return 50;
  }
}
