'use client';

// 3D Mission Preview — renders the waypoint route over a 3D MapLibre map.
// Loaded in a new browser tab; reads mission data from localStorage.
//
// Key layout rule: the MapLibre container must use position:absolute with
// explicit top/left/right/bottom:0 — NOT height:'100%' or CSS-class-based
// height — because MapLibre reads offsetHeight synchronously at init time,
// before class-based styles may be computed.

import { useEffect, useRef, useState } from 'react';
import { Waypoint } from '@/lib/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const MAPTILER_KEY = 'NQ17i4ILvwLqvcc4FjbU';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the geographic centroid of a waypoint array */
function centroid(waypoints: Waypoint[]): { lng: number; lat: number } {
  const lng = waypoints.reduce((s, wp) => s + wp.lng, 0) / waypoints.length;
  const lat = waypoints.reduce((s, wp) => s + wp.lat, 0) / waypoints.length;
  return { lng, lat };
}

/** Creates the orange HTML element used as a numbered waypoint marker */
function makeMarkerEl(index: number, height: number): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = `
    width:24px;height:24px;border-radius:50%;
    background:#f97316;border:2px solid #fff;
    display:flex;align-items:center;justify-content:center;
    font-size:10px;font-weight:bold;color:#fff;
    cursor:default;user-select:none;
    box-shadow:0 2px 6px rgba(0,0,0,.6);
  `;
  el.textContent = String(index + 1);
  el.title = `WP${index + 1} — ${height} m`;
  return el;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Preview3DPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  // Display-only state — mission data is read inside the single useEffect
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [buildingsVisible, setBuildingsVisible] = useState(true);
  const [missionMeta, setMissionMeta] = useState<{
    count: number;
    timestamp: number;
    center: { lng: number; lat: number };
  } | null>(null);

  // ── Single effect: read data + init MapLibre ──────────────────────────────
  // Keeping everything in one effect guarantees the container div is already
  // in the DOM (with its styles applied) when new maplibregl.Map() is called.
  useEffect(() => {
    if (!mapContainer.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any = null;

    (async () => {
      // 1. Read mission from localStorage
      const raw = localStorage.getItem('preview3d-mission');
      if (!raw) {
        setLoadError('Žádná mise k zobrazení. Otevři 3D náhled z plánovacího panelu.');
        return;
      }

      let wps: Waypoint[];
      let timestamp: number;
      try {
        const parsed = JSON.parse(raw) as {
          waypoints: Waypoint[];
          missionType: string;
          timestamp: number;
        };
        if (!parsed.waypoints?.length) {
          setLoadError('Mise neobsahuje žádné waypointy.');
          return;
        }
        wps = parsed.waypoints;
        timestamp = parsed.timestamp;
      } catch {
        setLoadError('Nepodařilo se načíst data mise.');
        return;
      }

      const center = centroid(wps);
      setMissionMeta({ count: wps.length, timestamp, center });

      // 2. Fetch ground elevation for each waypoint from Open-Meteo.
      // MapLibre treats GeoJSON Z coordinates as metres above sea level (MSL),
      // not above ground. We add ground elevation so the route flies at the
      // correct AGL height above the 3D terrain surface.
      let absoluteCoords: [number, number, number][] = wps.map(
        (wp: Waypoint) => [wp.lng, wp.lat, wp.height ?? 50],
      );
      try {
        const lats = wps.map((wp: Waypoint) => wp.lat).join(',');
        const lngs = wps.map((wp: Waypoint) => wp.lng).join(',');
        const elevRes = await fetch(
          `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`,
        );
        if (elevRes.ok) {
          const elevData = await elevRes.json() as { elevation: number[] };
          absoluteCoords = wps.map((wp: Waypoint, i: number) => [
            wp.lng,
            wp.lat,
            (elevData.elevation[i] ?? 0) + (wp.height ?? 50),
          ]);
        }
      } catch {
        // Elevation fetch failed — fall back to AGL heights (route may sit on terrain)
      }

      // 3. Dynamic import — runs only in the browser, never on the server
      const maplibregl = (await import('maplibre-gl')).default;
      await import('maplibre-gl/dist/maplibre-gl.css');

      // 3. Create the map with MapTiler hybrid (satellite + labels) style.
      // Options cast to any: MapLibre TS types omit antialias/fadeDuration
      // in some versions even though the runtime supports them.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapOptions: any = {
        container: mapContainer.current!,
        style: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`,
        center: [center.lng, center.lat],
        zoom: 14,
        pitch: 60,
        bearing: 0,
        bearingSnap: 0,         // no snap — smooth continuous rotation
        maxPitch: 85,
        minZoom: 12,
        maxZoom: 18,
        antialias: false,       // faster GPU rendering — terrain + satellite is heavy
        fadeDuration: 0,        // no tile fade-in — removes visual jumps during movement
        pitchWithRotate: false, // decouple pitch from rotation — smoother controls
        dragRotate: false,      // disable right-mouse rotation — confusing on desktop
      };
      map = new maplibregl.Map(mapOptions);

      mapRef.current = map;

      // 4. Tune scroll zoom sensitivity — fixed to low (1/800 wheel, 1/300 trackpad)
      map.scrollZoom.setWheelZoomRate(1 / 800);
      map.scrollZoom.setZoomRate(1 / 300);

      map.on('load', () => {
        // ── Sky layer — realistic atmosphere effect ────────────────────
        map.addLayer({
          id: 'sky',
          type: 'sky',
          paint: {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 90.0],
            'sky-atmosphere-sun-intensity': 15,
          },
        });

        // ── 3D terrain (DEM) ──────────────────────────────────────────
        // MapTiler terrain-rgb-v2 provides elevation data for realistic 3D terrain.
        // exaggeration: 1.0 — real heights without amplification = stable rendering.
        map.addSource('terrain-source', {
          type: 'raster-dem',
          url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${MAPTILER_KEY}`,
          tileSize: 256,
        });
        map.setTerrain({ source: 'terrain-source', exaggeration: 1.0 });

        // ── Waypoint route as a GeoJSON LineString ────────────────────
        // Uses absoluteCoords (ground elevation + AGL height) so the route
        // appears at the correct altitude above the 3D terrain surface.
        // HTML Markers stay at ground level — only the LineString flies up.
        map.addSource('wp-route', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: absoluteCoords,
              },
              properties: {},
            }],
          },
        });

        map.addLayer({
          id: 'wp-route-line',
          type: 'line',
          source: 'wp-route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#f97316', 'line-width': 4, 'line-opacity': 1 },
        });

        // ── Waypoint markers ──────────────────────────────────────────
        wps.forEach((wp: Waypoint, i: number) => {
          const el = makeMarkerEl(i, wp.height ?? 50);
          new maplibregl.Marker({ element: el }).setLngLat([wp.lng, wp.lat]).addTo(map);
        });

        // ── 3D buildings ──────────────────────────────────────────────
        // MapTiler hybrid renders buildings as 2D raster (satellite imagery),
        // so fill-extrusion via the hybrid style's sources doesn't work.
        // Solution: add a dedicated OpenMapTiles vector source for buildings.
        // No before-layer reference — avoids silent failure if layer name differs.
        const style = map.getStyle();
        console.log('Available sources:', Object.keys(style.sources));
        try {
          map.addSource('openmaptiles', {
            type: 'vector',
            url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${MAPTILER_KEY}`,
          });
          map.addLayer({
            id: '3d-buildings',
            source: 'openmaptiles',
            'source-layer': 'building',
            type: 'fill-extrusion',
            minzoom: 14,
            paint: {
              'fill-extrusion-color': '#e8d5b0',
              'fill-extrusion-height': [
                'coalesce', ['get', 'render_height'], ['get', 'height'], 10,
              ],
              'fill-extrusion-base': [
                'coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0,
              ],
              'fill-extrusion-opacity': 0.85,
            },
          });
          console.log('3D buildings layer added');
        } catch (e) {
          console.warn('3D buildings failed:', e);
        }

        // ── Cinematic flyTo on load ───────────────────────────────────
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

    return () => {
      map?.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once — data and map init happen together inside the effect

  // ── Toggle 3D buildings ───────────────────────────────────────────────────
  // Only functional if the fill-extrusion layer was successfully added at load.
  // If hybrid style renders buildings natively (2D), this is silently a no-op.
  function handleToggleBuildings() {
    if (!mapRef.current?.getLayer('3d-buildings')) return;
    const next = !buildingsVisible;
    mapRef.current.setLayoutProperty('3d-buildings', 'visibility', next ? 'visible' : 'none');
    setBuildingsVisible(next);
  }

  // ── Reset camera to centroid ──────────────────────────────────────────────
  function handleResetView() {
    if (!missionMeta) return;
    mapRef.current?.flyTo({
      center: [missionMeta.center.lng, missionMeta.center.lat],
      zoom: 15,
      pitch: 60,
      bearing: 0,
      duration: 1200,
      essential: true,
    });
  }

  // ── Pitch presets ─────────────────────────────────────────────────────────
  function handleSideView() {
    // pitch 80° = nearly horizontal — shows building facades and horizon
    mapRef.current?.easeTo({ pitch: 80, duration: 800 });
  }

  function handleBirdView() {
    // pitch 30° = more top-down — overview of the whole route
    mapRef.current?.easeTo({ pitch: 30, duration: 800 });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loadError) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 360, padding: '0 24px' }}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>🔭</p>
          <p style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>3D náhled</p>
          <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.6 }}>{loadError}</p>
          <button
            onClick={() => window.close()}
            style={{ marginTop: 24, padding: '8px 16px', background: '#1a1d27', border: '1px solid #4b5563', color: '#d1d5db', fontSize: 14, borderRadius: 6, cursor: 'pointer' }}
          >
            ← Zavřít
          </button>
        </div>
      </div>
    );
  }

  return (
    // Outer wrapper: explicit 100vw × 100vh with position:relative as containing block
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#0f1117' }}>

      {/* MapLibre container — position:absolute + top/left/right/bottom:0 fills
          the containing block reliably. MapLibre reads offsetHeight synchronously
          at Map() init time; using explicit positioned edges guarantees it sees
          the full viewport height, not 300px (browser default for unsized divs). */}
      <div
        ref={mapContainer}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Loading overlay */}
      {!mapReady && (
        <div style={{ position: 'absolute', inset: 0, background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <p style={{ color: '#fff', fontSize: 14 }}>Načítám 3D náhled...</p>
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

        {missionMeta && (
          <div className="px-3 py-2 bg-[#1a1d27]/90 backdrop-blur border border-gray-700 rounded text-xs text-gray-400 leading-relaxed">
            <div className="text-white font-medium mb-0.5">3D náhled mise</div>
            <div>{missionMeta.count} waypointů</div>
            <div className="text-gray-600 text-[10px] mt-1">
              {new Date(missionMeta.timestamp).toLocaleTimeString('cs-CZ', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>

          </div>
        )}
      </div>

      {/* ── Top-right controls ── */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
        <div className="flex gap-1">
          <button
            onClick={handleResetView}
            className="px-3 py-1.5 bg-[#1a1d27]/90 backdrop-blur border border-gray-600 text-gray-300 text-xs rounded hover:border-blue-500 hover:text-white transition-colors"
          >
            Resetovat pohled
          </button>
          <button
            onClick={handleSideView}
            className="px-3 py-1.5 bg-[#1a1d27]/90 backdrop-blur border border-gray-600 text-gray-300 text-xs rounded hover:border-blue-500 hover:text-white transition-colors"
          >
            👁 Boční pohled
          </button>
          <button
            onClick={handleBirdView}
            className="px-3 py-1.5 bg-[#1a1d27]/90 backdrop-blur border border-gray-600 text-gray-300 text-xs rounded hover:border-blue-500 hover:text-white transition-colors"
          >
            🔭 Ptačí pohled
          </button>
        </div>
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
              <span className="w-4 h-0.5 bg-orange-500 inline-block rounded" />
              Trasa
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
              Waypoint
            </span>
            <span className="text-gray-600">Pohyb: levé tlač. · Zoom: scroll · Náklon: Ctrl + levé tlač.</span>
          </div>
        </div>
      )}
    </div>
  );
}
