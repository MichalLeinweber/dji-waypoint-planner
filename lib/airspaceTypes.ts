// airspaceTypes.ts — single source of truth for OpenAIP airspace type mappings.
// Used by both airspace.ts (rendering) and collisionDetection.ts (severity logic).
// Reference: https://docs.core.openaip.net (airspace type enum)

/** Maps OpenAIP numeric airspace type IDs to human-readable string keys. */
export const AIRSPACE_TYPE_NAMES: Record<number, string> = {
  1:  'RESTRICTED',
  2:  'DANGER',
  3:  'PROHIBITED',
  4:  'CTR',
  6:  'RMZ',
  7:  'TMA',
  8:  'TRA',
  9:  'TSA',
  13: 'ATZ',
  28: 'FIS',
  29: 'GLIDING',
};
