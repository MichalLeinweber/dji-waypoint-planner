'use client';

// POI Sequence: drone visits a series of stops around a POI, each at a custom distance and height
// The drone nose always points at the POI (headingAngle = bearing from stop to POI)
import { useState, useMemo } from 'react';
import { Waypoint } from '@/lib/types';

function generateId(i: number): string {
  return `poiseq-${Date.now()}-${i}`;
}

/** Bearing from point A to point B in degrees (0 = North, 90 = East, clockwise) */
function bearingDeg(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Haversine distance between two GPS points in meters */
function distanceM(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const aVal =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLng *
      sinDLng;
  return 2 * R * Math.asin(Math.sqrt(aVal));
}

interface Stop {
  distance: number; // distance from POI in meters
  height: number;   // altitude in meters
}

interface PoiSequencePanelProps {
  poi: { lat: number; lng: number } | null;
  isSelectingPoi: boolean;
  onSelectPoi: () => void;
  onGenerate: (waypoints: Waypoint[]) => void;
}

const MIN_STOPS = 2;
const MAX_STOPS = 6;

/** Build a default stops array for a given count */
function buildDefaultStops(count: number): Stop[] {
  return Array.from({ length: count }, () => ({ distance: 20, height: 15 }));
}

export default function PoiSequencePanel({
  poi,
  isSelectingPoi,
  onSelectPoi,
  onGenerate,
}: PoiSequencePanelProps) {
  const [stopCount, setStopCount] = useState(4);
  const [stops, setStops] = useState<Stop[]>(buildDefaultStops(4));
  const [speed, setSpeed] = useState(3);   // m/s between stops
  const [pause, setPause] = useState(2);   // seconds to wait at each stop

  // Update stop count — rebuild stops array, preserving existing values
  function handleStopCountChange(newCount: number) {
    setStopCount(newCount);
    setStops((prev) => {
      if (newCount > prev.length) {
        // Append new stops with defaults
        const extra = Array.from({ length: newCount - prev.length }, () => ({
          distance: 20,
          height: 15,
        }));
        return [...prev, ...extra];
      }
      return prev.slice(0, newCount);
    });
  }

  // Update a single stop's distance or height
  function handleStopChange(index: number, field: keyof Stop, value: number) {
    setStops((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  }

  // Live info: angles, GPS positions, total route length
  const info = useMemo(() => {
    const activeStops = stops.slice(0, stopCount);
    let totalDist = 0;

    if (poi) {
      const METERS_PER_DEG_LAT = 111320;
      const mPerDegLng = METERS_PER_DEG_LAT * Math.cos((poi.lat * Math.PI) / 180);

      // Compute GPS positions for each stop
      const positions = activeStops.map((stop, i) => {
        const angleDeg = (i * 360) / stopCount;
        const angleRad = (angleDeg * Math.PI) / 180;
        return {
          lat: poi.lat + (stop.distance * Math.cos(angleRad)) / METERS_PER_DEG_LAT,
          lng: poi.lng + (stop.distance * Math.sin(angleRad)) / mPerDegLng,
        };
      });

      // Sum of straight-line distances between consecutive stops
      for (let i = 1; i < positions.length; i++) {
        totalDist += distanceM(positions[i - 1], positions[i]);
      }
    }

    const flightTimeSec = speed > 0 ? totalDist / speed + pause * stopCount : 0;
    return { totalDist, flightTimeSec };
  }, [poi, stops, stopCount, speed, pause]);

  function handleGenerate() {
    if (!poi) return;

    const METERS_PER_DEG_LAT = 111320;
    const mPerDegLng = METERS_PER_DEG_LAT * Math.cos((poi.lat * Math.PI) / 180);
    const activeStops = stops.slice(0, stopCount);

    const waypoints: Waypoint[] = activeStops.map((stop, i) => {
      // Spread angles evenly: 0°, 360/n°, 2×360/n°, ...
      const angleDeg = (i * 360) / stopCount;
      const angleRad = (angleDeg * Math.PI) / 180;

      const lat = poi.lat + (stop.distance * Math.cos(angleRad)) / METERS_PER_DEG_LAT;
      const lng = poi.lng + (stop.distance * Math.sin(angleRad)) / mPerDegLng;

      // Drone nose always points at the POI
      const heading = bearingDeg({ lat, lng }, poi);

      return {
        id: generateId(i),
        lat,
        lng,
        height: stop.height,
        speed,
        waitTime: pause,
        cameraAction:
          i === 0
            ? 'startVideo'
            : i === activeStops.length - 1
            ? 'stopVideo'
            : 'none',
        gimbalPitch: -20, // slight downward tilt for a natural perspective
        headingAngle: heading,
      };
    });

    onGenerate(waypoints);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-gray-400 text-xs leading-relaxed">
        Dron navštíví sérii zastávek kolem POI. Každá zastávka má vlastní vzdálenost a výšku. Nos dronu vždy míří na POI.
      </p>

      {/* POI selector */}
      <div className="flex flex-col gap-1">
        <span className="text-gray-400 text-xs">Střed (POI)</span>
        <button
          onClick={onSelectPoi}
          className={`w-full py-2 text-xs rounded border transition-colors ${
            isSelectingPoi
              ? 'bg-yellow-600/20 border-yellow-500 text-yellow-400'
              : poi
              ? 'bg-green-600/20 border-green-700 text-green-400'
              : 'bg-[#0f1117] border-gray-600 text-gray-400 hover:border-blue-500'
          }`}
        >
          {isSelectingPoi
            ? 'Klikni na mapu...'
            : poi
            ? `POI: ${poi.lat.toFixed(5)}, ${poi.lng.toFixed(5)}`
            : 'Vyber POI na mape'}
        </button>
      </div>

      {/* Stop count selector */}
      <div className="flex flex-col gap-1">
        <span className="text-gray-400 text-xs">Počet zastávek</span>
        <div className="flex gap-1">
          {Array.from({ length: MAX_STOPS - MIN_STOPS + 1 }, (_, i) => i + MIN_STOPS).map(
            (n) => (
              <button
                key={n}
                onClick={() => handleStopCountChange(n)}
                className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                  stopCount === n
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'bg-[#0f1117] border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                {n}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Per-stop table */}
      <div className="flex flex-col gap-1">
        <span className="text-gray-400 text-xs">Parametry zastávek</span>
        <div className="bg-[#0f1117] rounded border border-gray-700 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-3 px-2 py-1 border-b border-gray-700">
            <span className="text-gray-500 text-xs">Zastávka</span>
            <span className="text-gray-500 text-xs text-center">Vzdál. (m)</span>
            <span className="text-gray-500 text-xs text-center">Výška (m)</span>
          </div>
          {/* Table rows */}
          {stops.slice(0, stopCount).map((stop, i) => {
            const angleDeg = Math.round((i * 360) / stopCount);
            return (
              <div
                key={i}
                className="grid grid-cols-3 items-center px-2 py-1 border-b border-gray-800 last:border-0"
              >
                <span className="text-gray-400 text-xs">
                  #{i + 1} · {angleDeg}°
                </span>
                <input
                  type="number"
                  value={stop.distance}
                  onChange={(e) =>
                    handleStopChange(i, 'distance', Number(e.target.value))
                  }
                  min={5}
                  max={200}
                  className="mx-1 bg-[#1a1d27] text-white text-xs rounded px-2 py-1 border border-gray-700 focus:border-blue-500 focus:outline-none text-center"
                />
                <input
                  type="number"
                  value={stop.height}
                  onChange={(e) =>
                    handleStopChange(i, 'height', Number(e.target.value))
                  }
                  min={2}
                  max={120}
                  className="mx-1 bg-[#1a1d27] text-white text-xs rounded px-2 py-1 border border-gray-700 focus:border-blue-500 focus:outline-none text-center"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Global parameters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-xs">Rychlost mezi zastávkami (m/s)</label>
          <input
            type="number"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            min={0.5}
            max={15}
            step={0.5}
            className="w-full bg-[#0f1117] text-white text-sm rounded px-3 py-1.5 border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-xs">Pauza na každé zastávce (s)</label>
          <input
            type="number"
            value={pause}
            onChange={(e) => setPause(Number(e.target.value))}
            min={0}
            max={30}
            className="w-full bg-[#0f1117] text-white text-sm rounded px-3 py-1.5 border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Info box */}
      <div className="bg-[#0f1117] rounded-lg px-3 py-2 text-xs text-gray-400 border border-gray-700">
        <div className="flex justify-between">
          <span>Waypointy</span>
          <span className="text-white">{stopCount}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Celková délka trasy</span>
          <span className="text-white">{info.totalDist.toFixed(0)} m</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Odh. doba letu</span>
          <span className="text-white">{info.flightTimeSec.toFixed(0)} s</span>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={!poi}
        className="w-full py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Generovat POI Sequence
      </button>
    </div>
  );
}
