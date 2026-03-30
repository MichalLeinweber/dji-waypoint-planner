// batteryEstimate.ts — flight time and battery consumption estimate.
//
// Default specs (DJI Mini 4 Pro):
//   Battery capacity : 33.48 Wh
//   Avg flight power : 7 W  (between hover ~4.5 W and fast flight ~9 W)
//   Safety reserve   : 20 % of capacity (~6.7 Wh) — never drain below this
//
// Pass droneWh / dronePowerW to override defaults for a different drone.

import { haversineM } from './panelUtils';

const DEFAULT_BATTERY_WH = 33.48;  // DJI Mini 4 Pro battery
const DEFAULT_AVG_POWER_W = 7;     // DJI Mini 4 Pro average power draw
const RESERVE_PERCENT = 20;        // safety reserve (%)

export interface BatteryEstimate {
  totalDistanceM: number;   // 3-D route length in metres
  flightTimeMin: number;    // estimated flight time in minutes
  batteryPercent: number;   // estimated consumption as % of total capacity
  isWarning: boolean;       // true when consumption exceeds usable capacity
}

/**
 * Estimates battery consumption for a waypoint route.
 *
 * @param waypoints    Array of waypoints with lat, lng, height (m AGL) and optional speed (m/s)
 * @param defaultSpeed Fallback speed in m/s when waypoint has no speed set (default 5)
 * @param droneWh      Battery capacity in Wh — defaults to DJI Mini 4 Pro (33.48 Wh)
 * @param dronePowerW  Average power draw in W — defaults to DJI Mini 4 Pro (7 W)
 */
export function estimateBattery(
  waypoints: { lat: number; lng: number; height: number; speed?: number }[],
  defaultSpeed = 5,
  droneWh = DEFAULT_BATTERY_WH,
  dronePowerW = DEFAULT_AVG_POWER_W,
): BatteryEstimate {
  if (waypoints.length < 2) {
    return { totalDistanceM: 0, flightTimeMin: 0, batteryPercent: 0, isWarning: false };
  }

  const usableWh = droneWh * (1 - RESERVE_PERCENT / 100);

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
  const consumedWh = totalTimeH * dronePowerW;
  const batteryPercent = Math.round((consumedWh / droneWh) * 100);

  // Warning when consumption exceeds the usable capacity (i.e. dips into reserve)
  const isWarning = consumedWh > usableWh;

  return {
    totalDistanceM: Math.round(totalDistanceM),
    flightTimeMin: Math.round(totalTimeS / 60),
    batteryPercent,
    isWarning,
  };
}
