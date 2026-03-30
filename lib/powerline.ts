// Color, weight, and buffer-distance mapping for power line features.
// Data pre-fetched by scripts/fetch-powerlines.js → public/data/powerlines-cz.json
//
// Voltage classes (lines):
//   EHV   > 400 kV  → 30 m buffer  (purple)
//   HV400   220–400 kV  → 20 m      (dark purple)
//   HV220   110–220 kV  → 15 m      (magenta)
//   HV110    35–110 kV  → 12 m      (orange)
//
// Substations:
//   SUBSTATION → 20 m buffer (yellow-orange polygon)

/** Stroke color per voltage class (used for LineString features) */
export function powerlineColor(voltageClass: string): string {
  switch (voltageClass) {
    case 'EHV':        return '#7c3aed'; // violet-700 — extra-high voltage
    case 'HV400':      return '#a855f7'; // purple-500
    case 'HV220':      return '#ec4899'; // pink-500
    case 'HV110':      return '#f97316'; // orange-500
    case 'SUBSTATION': return '#eab308'; // yellow-500
    default:           return '#d97706'; // amber-600 fallback
  }
}

/** Fill color for substation polygon overlays */
export function substationFillColor(): string {
  return '#eab308'; // yellow-500
}

/** Stroke weight (px) per voltage class — hints at relative buffer zone width */
export function powerlineWeight(voltageClass: string): number {
  switch (voltageClass) {
    case 'EHV':   return 4;
    case 'HV400': return 3;
    case 'HV220': return 2.5;
    case 'HV110': return 2;
    default:      return 1.5;
  }
}

/** Buffer distance in metres per voltage class */
export function powerlineBufferM(voltageClass: string): number {
  switch (voltageClass) {
    case 'EHV':        return 30;
    case 'HV400':      return 20;
    case 'HV220':      return 15;
    case 'HV110':      return 12;
    case 'SUBSTATION': return 20;
    default:           return 12;
  }
}
