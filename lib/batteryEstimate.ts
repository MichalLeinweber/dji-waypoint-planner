// batteryEstimate.ts — flight time and battery consumption estimate for DJI Mini 4 Pro.
//
// DJI Mini 4 Pro specs used:
//   Battery capacity : 33.48 Wh
//   Avg flight power : 7 W  (between hover ~4.5 W and fast flight ~9 W)
//   Safety reserve   : 20 % of capacity (~6.7 Wh) — never drain below this

const BATTERY_WH = 33.48;      // total battery energy in watt-hours
const AVG_POWER_W = 7;         // average power draw during normal flight (W)
const RESERVE_PERCENT = 20;    // safety reserve (%)
const USABLE_WH = BATTERY_WH * (1 - RESERVE_PERCENT / 100); // 26.78 Wh usable

export interface BatteryEstimate {
  totalDistanceM: number;   // 3-D route length in metres
  flightTimeMin: number;    // estimated flight time in minutes
  batteryPercent: number;   // estimated consumption as % of total capacity
  isWarning: boolean;       // true when consumption exceeds usable capacity
}

/** Haversine distance between two lat/lng points in metres (ignores altitude). */
function haversineM(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6_371_000; // Earth radius in metres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Estimates battery consumption for a waypoint route.
 *
 * @param waypoints  Array of waypoints with lat, lng, height (m AGL) and optional speed (m/s)
 * @param defaultSpeed  Fallback speed in m/s when waypoint has no speed set (default 5)
 */
export function estimateBattery(
  waypoints: { lat: number; lng: number; height: number; speed?: number }[],
  defaultSpeed = 5,
): BatteryEstimate {
  if (waypoints.length < 2) {
    return { totalDistanceM: 0, flightTimeMin: 0, batteryPercent: 0, isWarning: false };
  }

  let totalDistanceM = 0;
  let totalTimeS = 0;

  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];

    // Horizontal distance (Haversine)
    const horizM = haversineM(prev.lat, prev.lng, curr.lat, curr.lng);
    // Vertical distance (height difference)
    const vertM = Math.abs(curr.height - prev.height);
    // 3-D segment length
    const segM = Math.sqrt(horizM ** 2 + vertM ** 2);

    totalDistanceM += segM;

    // Use the speed from the current waypoint, or fall back to default
    const segSpeed = curr.speed && curr.speed > 0 ? curr.speed : defaultSpeed;
    totalTimeS += segM / segSpeed;
  }

  const totalTimeH = totalTimeS / 3600;
  const consumedWh = totalTimeH * AVG_POWER_W;
  const batteryPercent = Math.round((consumedWh / BATTERY_WH) * 100);

  // Warning when consumption exceeds the usable capacity (i.e. dips into reserve)
  const isWarning = consumedWh > USABLE_WH;

  return {
    totalDistanceM: Math.round(totalDistanceM),
    flightTimeMin: Math.round(totalTimeS / 60),
    batteryPercent,
    isWarning,
  };
}
