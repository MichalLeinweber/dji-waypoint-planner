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
 * Returns null if the string is invalid or malformed.
 */
export function decodeMission(encoded: string): SharePayload | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    const parsed = JSON.parse(json) as SharePayload;
    // Basic sanity check
    if (!Array.isArray(parsed.waypoints) || !parsed.missionType) return null;
    return parsed;
  } catch {
    return null;
  }
}
