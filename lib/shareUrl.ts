// shareUrl.ts — encode and decode a mission as a URL-safe base64 string.
// No external libraries: uses browser-native btoa/atob + encodeURIComponent.

import { Waypoint, MissionType } from '@/lib/types';

interface SharePayload {
  waypoints: Waypoint[];
  missionType: MissionType;
}

/**
 * Encodes a mission into a compact URL-safe string.
 * JSON → percent-encode → base64
 */
export function encodeMission(data: SharePayload): string {
  const json = JSON.stringify(data);
  return btoa(encodeURIComponent(json));
}

/**
 * Decodes a mission from a URL parameter produced by encodeMission().
 * Returns null if the string is invalid, malformed, or contains unexpected field types.
 */
export function decodeMission(encoded: string): SharePayload | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    const parsed = JSON.parse(json);

    // Validate top-level structure
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.waypoints)) return null;
    if (typeof parsed.missionType !== 'string' || !parsed.missionType) return null;

    // Validate each waypoint has the minimum required numeric fields
    for (const wp of parsed.waypoints) {
      if (!wp || typeof wp !== 'object') return null;
      if (typeof wp.lat !== 'number' || typeof wp.lng !== 'number') return null;
      if (typeof wp.height !== 'number') return null;
    }

    return parsed as SharePayload;
  } catch {
    return null;
  }
}
