'use client';

// 3D Mission Preview — renders the waypoint route over a 3D MapLibre map.
// Loaded in a new browser tab; reads mission data from localStorage.
// MapLibre is imported dynamically inside useEffect to avoid SSR issues
// (it uses WebGL APIs that are not available in Node.js).

import { useEffect, useRef, useState } from 'react';
import { Waypoint } from '@/lib/types';

// ── Types ────────────────────────────────────────────────────────────────────

interface StoredMission {
  waypoints: Waypoint[];
  missionType: string;
  timestamp: number;
}

// Minimal interface for map methods called outside the async IIFE
// (toggle / reset handlers access the map via mapRef)
interface MapHandle {
  flyTo(opts: object): void;
  getLayer(id: string): object | undefined;
  setLayoutProperty(layer: string, prop: string, val: unknown): void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the geographic centroid of a set of waypoints */
function centroid(waypoints: Waypoint[]): { lng: number; lat: number } {
  const lng = waypoints.reduce((s, wp) => s + wp.lng, 0) / waypoints.length;
  const lat = waypoints.reduce((s, wp) => s + wp.lat, 0) / waypoints.length;
  return { lng, lat };
}

/** Creates the orange HTML element used as a waypoint marker */
function makeMarkerEl(index: number, height: number): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = `
    width: 24px; height: 24px; border-radius: 50%;
    background: #f97316; border: 2px solid #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: bold; color: #fff;
    cursor: default; user-select: none;
    box-shadow: 0 2px 6px rgba(0,0,0,.6);
  `;
  el.textContent = String(index + 1);
  el.title = `WP${index + 1} — ${height} m`;
  return el;
}

// ── Page component ────────────────────────────────────────────────────────────

export default function Preview3DPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  // Stored as MapHandle so toggle/reset can call map methods without full MapLibre type
  const mapRef = useRef<MapHandle | null>(null);

  const [mission, setMission] = useState<StoredMission | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [buildingsVisible, setBuildingsVisible] = useState(true);

  // ── Step 1: read mission from localStorage ────────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem('preview3d-mission');
    if (!raw) {
      setLoadError('Žádná mise k zobrazení. Otevři 3D náhled z plánovacího panelu.');
      return;
    }
    try {
      const parsed = JSON.parse(raw) as StoredMission;
      if (!parsed.waypoints?.length) {
        setLoadError('Mise neobsahuje žádné waypointy.');
        return;
      }
      setMission(parsed);
    } catch {
      setLoadError('Nepodařilo se načíst data mise.');
    }
  }, []);

  // ── Step 2: initialise MapLibre once mission data is available ────────────
  useEffect(() => {
    if (!mission || !mapContainer.current) return;

    const wps = mission.waypoints;
    const center = centroid(wps);

    // Minimal cleanup handle — set once the Map is created
    let removeMap: (() => void) | null = null;

    (async () => {
      // Dynamic import — runs only in the browser, never on the server
      const ml = await import('maplibre-gl');
      await import('maplibre-gl/dist/maplibre-gl.css');
      const maplibregl = ml.default;

      // Create the MapLibre map — typed by the library itself inside this scope
      const map = new maplibregl.Map({
        container: mapContainer.current!,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [center.lng, center.lat],
        zoom: 14,
        pitch: 60,
        bearing: 0,
      });

      // Expose minimal interface to the toggle / reset handlers
      mapRef.current = map as unknown as MapHandle;
      removeMap = () => map.remove();

      map.on('load', () => {
        // ── Waypoint route as a GeoJSON LineString ────────────────────
        // Coordinates use [lng, lat, height] for 3D context
        map.addSource('wp-route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: wps.map((wp) => [wp.lng, wp.lat, wp.height ?? 50]),
            },
            properties: {},
          },
        });

        map.addLayer({
          id: 'wp-route-line',
          type: 'line',
          source: 'wp-route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 3,
            'line-opacity': 0.9,
          },
        });

        // ── Waypoint markers ──────────────────────────────────────────
        wps.forEach((wp, i) => {
          const el = makeMarkerEl(i, wp.height ?? 50);
          new maplibregl.Marker({ element: el })
            .setLngLat([wp.lng, wp.lat])
            .addTo(map);
        });

        // ── 3D buildings ──────────────────────────────────────────────
        // The Carto dark-matter style is based on the OpenMapTiles schema.
        // We discover the vector tile source at runtime instead of hard-coding
        // a name that might differ between style versions.
        const styleSources = map.getStyle().sources as Record<string, { type?: string }>;
        const vectorSourceId = Object.keys(styleSources).find(
          (id) => styleSources[id].type === 'vector',
        );

        if (vectorSourceId) {
          try {
            map.addLayer({
              id: '3d-buildings',
              source: vectorSourceId,
              'source-layer': 'building',
              type: 'fill-extrusion',
              minzoom: 14,
              paint: {
                'fill-extrusion-color': '#334155',
                // Prefer render_height (pre-calculated by tile provider),
                // fall back to raw height, then default to 10 m
                'fill-extrusion-height': [
                  'coalesce',
                  ['get', 'render_height'],
                  ['get', 'height'],
                  10,
                ],
                'fill-extrusion-base': [
                  'coalesce',
                  ['get', 'render_min_height'],
                  ['get', 'min_height'],
                  0,
                ],
                'fill-extrusion-opacity': 0.75,
              },
            });
          } catch {
            // Building extrusion failed silently — rest of the view still works
          }
        }

        // ── Fly to centroid with cinematic pitch ──────────────────────
        map.flyTo({
          center: [center.lng, center.lat],
          zoom: 15,
          pitch: 60,
          bearing: 0,
          duration: 1500,
          essential: true,
        });

        setMapReady(true);
      });
    })();

    // Cleanup: destroy the MapLibre instance when the component unmounts
    return () => {
      removeMap?.();
      mapRef.current = null;
    };
  }, [mission]);

  // ── Toggle 3D buildings visibility ───────────────────────────────────────
  function handleToggleBuildings() {
    const map = mapRef.current;
    if (!map?.getLayer('3d-buildings')) return;
    const next = !buildingsVisible;
    map.setLayoutProperty('3d-buildings', 'visibility', next ? 'visible' : 'none');
    setBuildingsVisible(next);
  }

  // ── Reset camera to centroid ──────────────────────────────────────────────
  function handleResetView() {
    if (!mission) return;
    const center = centroid(mission.waypoints);
    mapRef.current?.flyTo({
      center: [center.lng, center.lat],
      zoom: 15,
      pitch: 60,
      bearing: 0,
      duration: 1200,
      essential: true,
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  // Error / empty state
  if (loadError) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <p className="text-4xl mb-4">🔭</p>
          <p className="text-white font-semibold mb-2">3D náhled</p>
          <p className="text-gray-400 text-sm leading-relaxed">{loadError}</p>
          <button
            onClick={() => window.close()}
            className="mt-6 px-4 py-2 bg-[#1a1d27] border border-gray-600 text-gray-300 text-sm rounded hover:border-blue-500 transition-colors"
          >
            ← Zavřít
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#0f1117' }}>
      {/* MapLibre container — inline style required: MapLibre reads offsetHeight at init
          time, before Tailwind CSS is applied, so explicit px/vh values are needed */}
      <div ref={mapContainer} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* Loading overlay — hidden once map fires 'load' */}
      {!mapReady && (
        <div className="absolute inset-0 bg-[#0f1117] flex items-center justify-center z-10">
          <p className="text-white text-sm animate-pulse">Načítám 3D náhled...</p>
        </div>
      )}

      {/* ── Top-left controls ── */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <button
          onClick={() => window.close()}
          className="px-3 py-1.5 bg-[#1a1d27]/90 backdrop-blur border border-gray-600 text-gray-300 text-xs rounded hover:border-blue-500 hover:text-white transition-colors"
        >
          ← Zpět na mapu
        </button>

        {/* Mission info badge */}
        {mission && (
          <div className="px-3 py-2 bg-[#1a1d27]/90 backdrop-blur border border-gray-700 rounded text-xs text-gray-400 leading-relaxed">
            <div className="text-white font-medium mb-0.5">3D náhled mise</div>
            <div>{mission.waypoints.length} waypointů</div>
            <div className="text-gray-600 text-[10px] mt-1">
              {new Date(mission.timestamp).toLocaleTimeString('cs-CZ', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Top-right controls ── */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
        <button
          onClick={handleResetView}
          className="px-3 py-1.5 bg-[#1a1d27]/90 backdrop-blur border border-gray-600 text-gray-300 text-xs rounded hover:border-blue-500 hover:text-white transition-colors"
        >
          Resetovat pohled
        </button>
        <button
          onClick={handleToggleBuildings}
          className={`px-3 py-1.5 backdrop-blur border text-xs rounded transition-colors ${
            buildingsVisible
              ? 'bg-blue-600/80 border-blue-500 text-white'
              : 'bg-[#1a1d27]/90 border-gray-600 text-gray-400 hover:border-gray-400'
          }`}
        >
          🏢 Budovy
        </button>
      </div>

      {/* ── Bottom legend ── */}
      {mapReady && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
          <div className="px-4 py-2 bg-[#1a1d27]/90 backdrop-blur border border-gray-700 rounded-full flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-blue-500 inline-block rounded" />
              Trasa
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
              Waypoint
            </span>
            <span className="text-gray-600">Pravé tlač. = rotace · Scroll = zoom</span>
          </div>
        </div>
      )}
    </div>
  );
}
