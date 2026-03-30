// Shared utilities for mission generator panels
// (GridPanel, FacadePanel, OrbitPanel, SpiralPanel)

/** Approximate meters per degree of latitude — constant across the globe */
export const METERS_PER_DEG_LAT = 111320;

/**
 * Generate a unique waypoint ID for a given panel type.
 * @param prefix - Panel identifier (e.g. 'grid', 'facade', 'orbit', 'spiral')
 * @param i      - Waypoint index within the generation batch
 */
export function generateId(prefix: string, i: number): string {
  return `${prefix}-${Date.now()}-${i}`;
}
