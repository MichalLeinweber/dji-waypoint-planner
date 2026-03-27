'use client';

// Boomerang: drone flies from start to end and returns along the exact same path
import { useState, useMemo } from 'react';
import { Waypoint } from '@/lib/types';

function generateId(i: number): string {
  return `boom-${Date.now()}-${i}`;
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

interface BoomerangPanelProps {
  start: { lat: number; lng: number } | null;
  end: { lat: number; lng: number } | null;
  selectStep: 'idle' | 'start' | 'end';
  onSelectStart: () => void;
  onSelectEnd: () => void;
  onGenerate: (waypoints: Waypoint[]) => void;
}

export default function BoomerangPanel({
  start,
  end,
  selectStep,
  onSelectStart,
  onSelectEnd,
  onGenerate,
}: BoomerangPanelProps) {
  const [height, setHeight] = useState(30);       // constant altitude (m)
  const [speed, setSpeed] = useState(3);           // m/s
  const [gimbalPitch, setGimbalPitch] = useState(-20); // degrees, constant
  const [pauseAtEnd, setPauseAtEnd] = useState(0); // wait seconds at destination

  // Live info calculations
  const info = useMemo(() => {
    if (!start || !end) return null;
    const oneWayDist = distanceM(start, end);
    const totalDist = oneWayDist * 2;
    const flightTimeSec = totalDist / speed + pauseAtEnd;
    return { oneWayDist, totalDist, flightTimeSec };
  }, [start, end, speed, pauseAtEnd]);

  function handleGenerate() {
    if (!start || !end) return;

    // Midpoint between start and end
    const mid = {
      lat: (start.lat + end.lat) / 2,
      lng: (start.lng + end.lng) / 2,
    };

    // 6 waypoints: start → mid → end(wait) → end → mid → start
    const positions = [start, mid, end, end, mid, start];
    const waypoints: Waypoint[] = positions.map((pos, i) => ({
      id: generateId(i),
      lat: pos.lat,
      lng: pos.lng,
      height,
      speed,
      // Pause at the destination before returning (index 2 = end of forward leg)
      waitTime: i === 2 ? pauseAtEnd : 0,
      cameraAction: i === 0 ? 'startVideo' : i === 5 ? 'stopVideo' : 'none',
      gimbalPitch,
    }));

    onGenerate(waypoints);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-gray-400 text-xs leading-relaxed">
        Dron letí přímou trasou do cíle a vrátí se stejnou cestou zpět. Výsledek je plynulý záběr tam a zpět.
      </p>

      {/* Start point selector */}
      <div className="flex flex-col gap-1">
        <span className="text-gray-400 text-xs">Startovní bod</span>
        <button
          onClick={onSelectStart}
          className={`w-full py-2 text-xs rounded border transition-colors ${
            selectStep === 'start'
              ? 'bg-yellow-600/20 border-yellow-500 text-yellow-400'
              : start
              ? 'bg-green-600/20 border-green-700 text-green-400'
              : 'bg-[#0f1117] border-gray-600 text-gray-400 hover:border-blue-500'
          }`}
        >
          {selectStep === 'start'
            ? 'Klikni na mapu...'
            : start
            ? `Start: ${start.lat.toFixed(5)}, ${start.lng.toFixed(5)}`
            : 'Vyber startovní bod'}
        </button>
      </div>

      {/* End point selector */}
      <div className="flex flex-col gap-1">
        <span className="text-gray-400 text-xs">Koncový bod</span>
        <button
          onClick={onSelectEnd}
          className={`w-full py-2 text-xs rounded border transition-colors ${
            selectStep === 'end'
              ? 'bg-yellow-600/20 border-yellow-500 text-yellow-400'
              : end
              ? 'bg-green-600/20 border-green-700 text-green-400'
              : 'bg-[#0f1117] border-gray-600 text-gray-400 hover:border-blue-500'
          }`}
        >
          {selectStep === 'end'
            ? 'Klikni na mapu...'
            : end
            ? `Cíl: ${end.lat.toFixed(5)}, ${end.lng.toFixed(5)}`
            : 'Vyber koncový bod'}
        </button>
      </div>

      {/* Parameters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-xs">Výška (m) – konstantní</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            min={5}
            max={120}
            className="w-full bg-[#0f1117] text-white text-sm rounded px-3 py-1.5 border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-xs">Rychlost (m/s)</label>
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
          <label className="text-gray-400 text-xs">Gimbal (°)</label>
          <input
            type="number"
            value={gimbalPitch}
            onChange={(e) => setGimbalPitch(Number(e.target.value))}
            min={-90}
            max={0}
            className="w-full bg-[#0f1117] text-white text-sm rounded px-3 py-1.5 border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-gray-400 text-xs">Pauza v cíli (s)</label>
          <input
            type="number"
            value={pauseAtEnd}
            onChange={(e) => setPauseAtEnd(Number(e.target.value))}
            min={0}
            max={30}
            className="w-full bg-[#0f1117] text-white text-sm rounded px-3 py-1.5 border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Info box */}
      {info && (
        <div className="bg-[#0f1117] rounded-lg px-3 py-2 text-xs text-gray-400 border border-gray-700">
          <div className="flex justify-between">
            <span>Délka jedné cesty</span>
            <span className="text-white">{info.oneWayDist.toFixed(0)} m</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Celková délka (×2)</span>
            <span className="text-white">{info.totalDist.toFixed(0)} m</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Odh. doba letu</span>
            <span className="text-white">{info.flightTimeSec.toFixed(0)} s</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Waypointy</span>
            <span className="text-white">6</span>
          </div>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={!start || !end}
        className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Generovat Boomerang
      </button>
    </div>
  );
}
