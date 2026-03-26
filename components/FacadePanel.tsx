'use client';

// Facade scan mission generator panel.
// The drone flies horizontal passes (left-right, up, right-left = lawn-mower)
// along a facade defined by two points A and B on the map.
import { useState } from 'react';
import { Waypoint } from '@/lib/types';

const METERS_PER_DEG_LAT = 111320;

function generateId(i: number): string {
  return `facade-${Date.now()}-${i}`;
}

interface FacadeParams {
  distance: number;   // distance from facade in meters
  startHeight: number;
  endHeight: number;
  overlap: number;    // % vertical and horizontal overlap
  speed: number;
  gimbalPitch: number; // degrees, 0 = horizontal, negative = slightly down
}

interface FacadePoints {
  a: { lat: number; lng: number };
  b: { lat: number; lng: number };
}

interface FacadePanelProps {
  facadePoints: FacadePoints | null;
  drawStep: 'idle' | 'a' | 'b';
  onStartDraw: () => void;
  onGenerate: (waypoints: Waypoint[]) => void;
}

/** Calculate straight-line distance between two lat/lng points in meters */
function calcDistanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const mPerDegLng = METERS_PER_DEG_LAT * Math.cos((a.lat * Math.PI) / 180);
  const dn = (b.lat - a.lat) * METERS_PER_DEG_LAT;
  const de = (b.lng - a.lng) * mPerDegLng;
  return Math.sqrt(dn * dn + de * de);
}

export default function FacadePanel({ facadePoints, drawStep, onStartDraw, onGenerate }: FacadePanelProps) {
  const [params, setParams] = useState<FacadeParams>({
    distance: 8,
    startHeight: 5,
    endHeight: 30,
    overlap: 70,
    speed: 2,
    gimbalPitch: 0,
  });

  function set(key: keyof FacadeParams, value: number) {
    setParams((prev) => ({ ...prev, [key]: value }));
  }

  /** Compute mission stats for the info box */
  function getStats() {
    if (!facadePoints) return null;
    const { a, b } = facadePoints;
    const facadeWidthM = calcDistanceM(a, b);
    const swath = params.distance * 0.87; // Mini 4 Pro ~82° FOV
    const step = swath * (1 - params.overlap / 100);
    const numRows = Math.ceil((params.endHeight - params.startHeight) / step) + 1;
    const photosPerRow = Math.ceil(facadeWidthM / step) + 1;
    const totalPhotos = numRows * photosPerRow;
    // Each photo point = one waypoint (inner loop in handleGenerate)
    const waypointCount = numRows * photosPerRow;
    // Lawn-mower: each row is facadeWidth, rows joined by short vertical climb
    const rowLengthM = facadeWidthM;
    const totalDistanceM = Math.round(numRows * rowLengthM + (numRows - 1) * step);
    return { facadeWidthM: Math.round(facadeWidthM), numRows, totalPhotos, totalDistanceM, waypointCount };
  }

  function handleGenerate() {
    if (!facadePoints) return;
    const currentStats = getStats();
    if (currentStats && currentStats.waypointCount > 200) return;
    const { a, b } = facadePoints;
    const { distance, startHeight, endHeight, overlap, speed, gimbalPitch } = params;

    const mPerDegLng = METERS_PER_DEG_LAT * Math.cos((a.lat * Math.PI) / 180);

    // Facade direction vector in meters
    const dx = (b.lng - a.lng) * mPerDegLng; // East component
    const dy = (b.lat - a.lat) * METERS_PER_DEG_LAT; // North component
    const facadeLen = Math.sqrt(dx * dx + dy * dy);
    if (facadeLen < 1) return; // degenerate

    // Unit vector along the facade
    const ux = dx / facadeLen;
    const uy = dy / facadeLen;

    // Perpendicular unit vector rotated 90° to the left (right-hand rule → in front of facade)
    // For A→B facing north: perp points west (-ux rotated)
    // Rotating (ux, uy) by +90°: (-uy, ux)
    const px = -uy;
    const py = ux;

    // Drone offset from facade in degrees
    const offsetLat = py * distance / METERS_PER_DEG_LAT;
    const offsetLng = px * distance / mPerDegLng;

    // Swath and row spacing based on distance and overlap
    const swath = distance * 0.87;
    const rowStep = swath * (1 - overlap / 100);
    const photoStep = swath * (1 - overlap / 100);

    const numRows = Math.ceil((endHeight - startHeight) / rowStep) + 1;
    const numPhotosPerRow = Math.ceil(facadeLen / photoStep) + 1;

    const waypoints: Waypoint[] = [];
    let wpIdx = 0;

    for (let row = 0; row < numRows; row++) {
      const height = startHeight + row * rowStep;
      const goForward = row % 2 === 0; // even rows: A→B, odd rows: B→A

      for (let col = 0; col < numPhotosPerRow; col++) {
        // Position along the facade: 0..1 fraction
        const colIdx = goForward ? col : numPhotosPerRow - 1 - col;
        const t = numPhotosPerRow > 1 ? (colIdx / (numPhotosPerRow - 1)) : 0;
        const alongM = t * facadeLen;

        // Position along facade in degrees, then apply perpendicular offset
        const lat = a.lat + (uy * alongM) / METERS_PER_DEG_LAT + offsetLat;
        const lng = a.lng + (ux * alongM) / mPerDegLng + offsetLng;

        waypoints.push({
          id: generateId(wpIdx++),
          lat,
          lng,
          height,
          speed,
          waitTime: 0,
          cameraAction: 'photo',
          gimbalPitch,
        });
      }
    }

    onGenerate(waypoints);
  }

  const stats = getStats();

  return (
    <div className="flex flex-col gap-3">
      {/* Facade point selector */}
      <div className="bg-[#0f1117] rounded-lg p-3 border border-gray-700">
        <p className="text-gray-500 text-xs mb-2">Fasada (bod A a bod B)</p>

        <div className="flex flex-col gap-1 text-xs font-mono">
          <span className="text-gray-500">
            A:{' '}
            {facadePoints
              ? <span className="text-gray-300">{facadePoints.a.lat.toFixed(5)}, {facadePoints.a.lng.toFixed(5)}</span>
              : <span className="text-gray-600">nevybran</span>
            }
          </span>
          <span className="text-gray-500">
            B:{' '}
            {facadePoints
              ? <span className="text-gray-300">{facadePoints.b.lat.toFixed(5)}, {facadePoints.b.lng.toFixed(5)}</span>
              : <span className="text-gray-600">nevybran</span>
            }
          </span>
        </div>

        <button
          onClick={onStartDraw}
          className={`mt-2 w-full py-1.5 text-xs rounded border transition-colors ${
            drawStep !== 'idle'
              ? 'bg-amber-700 border-amber-600 text-white'
              : 'bg-[#1a1d27] border-gray-600 text-gray-300 hover:border-blue-500'
          }`}
        >
          {drawStep === 'idle'
            ? (facadePoints ? 'Zmenit fasadu' : 'Vybrat fasadu')
            : drawStep === 'a'
            ? 'Klikni na levy kraj (A)...'
            : 'Klikni na pravy kraj (B)...'}
        </button>

        {facadePoints && (
          <p className="mt-1 text-gray-600 text-xs">
            Pokud je nahled za budovou, zkus prohodit poradi kliknuti A↔B.
          </p>
        )}
      </div>

      {/* Parameters */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-gray-500 text-xs">Vzdalenost (m)</label>
          <input type="number" value={params.distance} min={2} max={100}
            onChange={(e) => set('distance', Number(e.target.value))}
            className="bg-[#0f1117] text-white text-xs rounded px-2 py-1.5 border border-gray-700 focus:border-blue-500 focus:outline-none" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-gray-500 text-xs">Prekryv (%)</label>
          <input type="number" value={params.overlap} min={30} max={90}
            onChange={(e) => set('overlap', Number(e.target.value))}
            className="bg-[#0f1117] text-white text-xs rounded px-2 py-1.5 border border-gray-700 focus:border-blue-500 focus:outline-none" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-gray-500 text-xs">Vyska startu (m)</label>
          <input type="number" value={params.startHeight} min={1} max={500}
            onChange={(e) => set('startHeight', Number(e.target.value))}
            className="bg-[#0f1117] text-white text-xs rounded px-2 py-1.5 border border-gray-700 focus:border-blue-500 focus:outline-none" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-gray-500 text-xs">Vyska konce (m)</label>
          <input type="number" value={params.endHeight} min={1} max={500}
            onChange={(e) => set('endHeight', Number(e.target.value))}
            className="bg-[#0f1117] text-white text-xs rounded px-2 py-1.5 border border-gray-700 focus:border-blue-500 focus:outline-none" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-gray-500 text-xs">Rychlost (m/s)</label>
          <input type="number" value={params.speed} min={1} max={10} step={0.5}
            onChange={(e) => set('speed', Number(e.target.value))}
            className="bg-[#0f1117] text-white text-xs rounded px-2 py-1.5 border border-gray-700 focus:border-blue-500 focus:outline-none" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-gray-500 text-xs">Gimbal (°)</label>
          <input type="number" value={params.gimbalPitch} min={-30} max={10}
            onChange={(e) => set('gimbalPitch', Number(e.target.value))}
            className="bg-[#0f1117] text-white text-xs rounded px-2 py-1.5 border border-gray-700 focus:border-blue-500 focus:outline-none" />
        </div>
      </div>

      {/* Stats */}
      {stats && facadePoints && (() => {
        const wpColor = stats.waypointCount > 200
          ? 'text-red-400'
          : stats.waypointCount > 150
          ? 'text-yellow-400'
          : 'text-green-400';
        return (
          <>
            <div className="bg-[#0f1117] rounded-lg p-3 border border-gray-700 text-xs text-gray-400 grid grid-cols-2 gap-1">
              <span>Sirka fasady: <span className="text-white">{stats.facadeWidthM} m</span></span>
              <span>Rady: <span className="text-white">{stats.numRows}</span></span>
              <span>Fotky: <span className="text-white">~{stats.totalPhotos}</span></span>
              <span>Trasa: <span className="text-white">{(stats.totalDistanceM / 1000).toFixed(2)} km</span></span>
              <span className="col-span-2">Waypointy: <span className={wpColor}>{stats.waypointCount} / 200</span></span>
            </div>
            {stats.waypointCount > 200 && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-2 text-xs text-red-400">
                Prekrocen limit 200 waypointu. Sniz prekryv nebo zmen rozsah vysek.
              </div>
            )}
            {stats.waypointCount > 150 && stats.waypointCount <= 200 && (
              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-2 text-xs text-yellow-400">
                Blizis se limitu DJI Fly (200 waypointu).
              </div>
            )}
          </>
        );
      })()}

      <button
        onClick={handleGenerate}
        disabled={!facadePoints || drawStep !== 'idle'}
        className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Generovat fasadu
      </button>
    </div>
  );
}
