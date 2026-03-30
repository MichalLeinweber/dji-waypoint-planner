// Shared utilities for mission generator panels
// (GridPanel, FacadePanel, OrbitPanel, SpiralPanel, film panels)

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

/**
 * Compass bearing from point A to point B in degrees (0 = North, 90 = East, clockwise).
 * Uses the forward azimuth formula.
 */
export function bearingDeg(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const lat1R = lat1 * Math.PI / 180;
  const lat2R = lat2 * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2R);
  const x = Math.cos(lat1R) * Math.sin(lat2R) -
    Math.sin(lat1R) * Math.cos(lat2R) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

/**
 * Haversine distance between two GPS points in meters.
 * Accurate to ~0.5% for distances up to ~1000 km — sufficient for drone missions.
 */
export function haversineM(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
