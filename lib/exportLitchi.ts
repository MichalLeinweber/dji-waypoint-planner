// Litchi CSV export — generates a mission file compatible with the Litchi app
// (used on older DJI drones: Phantom, Mavic 2, etc.)
//
// Litchi CSV format reference:
// https://flylitchi.com/help#missions-import
// Each waypoint is one row. All 10 action slots must be present.

import { Waypoint } from './types';

// CSV column header — must match exactly what Litchi expects
const LITCHI_HEADER =
  'latitude,longitude,altitude(m),heading(deg),curvesize(m),rotationdir,' +
  'gimbalmode,gimbalpitchangle,' +
  'actiontype1,actionparam1,actiontype2,actionparam2,actiontype3,actionparam3,' +
  'actiontype4,actionparam4,actiontype5,actionparam5,actiontype6,actionparam6,' +
  'actiontype7,actionparam7,actiontype8,actionparam8,actiontype9,actionparam9,' +
  'actiontype10,actionparam10,' +
  'altitudemode,speed(m/s),poi_latitude,poi_longitude,poi_altitude(m),' +
  'poi_altitudemode,photo_timeinterval,photo_distinterval';

/**
 * Maps a DJI cameraAction value to the Litchi actiontype integer.
 * -1 = no action, 1 = take photo, 5 = start recording, 6 = stop recording
 */
function cameraActionType(action: string): number {
  switch (action) {
    case 'photo':      return 1;
    case 'startVideo': return 5;
    case 'stopVideo':  return 6;
    default:           return -1;
  }
}

/** Converts a single waypoint to a Litchi CSV row */
function waypointToRow(wp: Waypoint): string {
  const heading        = wp.headingAngle !== undefined ? wp.headingAngle.toFixed(1) : '-1';
  const gimbalMode     = wp.gimbalPitch !== undefined ? '1' : '0'; // 1=interpolated pitch, 0=disabled
  const gimbalPitch    = wp.gimbalPitch !== undefined ? wp.gimbalPitch : 0;
  const action1Type    = cameraActionType(wp.cameraAction);

  // 10 action slots — only slot 1 is used; remaining are no-action (-1)
  const actions = [action1Type, 0, -1, 0, -1, 0, -1, 0, -1, 0, -1, 0, -1, 0, -1, 0, -1, 0, -1, 0].join(',');

  return [
    wp.lat.toFixed(8),
    wp.lng.toFixed(8),
    wp.height.toFixed(1),
    heading,
    '0',          // curvesize — no curve smoothing
    '0',          // rotationdir — CW (doesn't affect most shots)
    gimbalMode,
    gimbalPitch,
    actions,
    '1',          // altitudemode — 1 = relative to ground (AGL), same as DJI WPML
    wp.speed.toFixed(1),
    '0',          // poi_latitude — not used
    '0',          // poi_longitude — not used
    '0',          // poi_altitude(m) — not used
    '0',          // poi_altitudemode
    '-1',         // photo_timeinterval — disabled
    '-1',         // photo_distinterval — disabled
  ].join(',');
}

/**
 * Generates Litchi CSV content for a list of waypoints.
 * Returns the full CSV string (header + one row per waypoint).
 */
export function exportLitchiCSV(waypoints: Waypoint[]): void {
  if (waypoints.length === 0) return;

  const rows = waypoints.map(waypointToRow);
  const csv  = [LITCHI_HEADER, ...rows].join('\r\n');

  // Create a Blob and trigger browser download
  const blob   = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url    = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href  = url;
  anchor.download = 'mise_litchi.csv';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
