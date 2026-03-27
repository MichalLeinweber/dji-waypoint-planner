'use client';

// 3D Mission Preview — renders the waypoint route in true 3D using CesiumJS.
// Loaded in a new browser tab; reads mission data from localStorage.
//
// CesiumJS requires:
//   1. window.CESIUM_BASE_URL set to the Cesium CDN URL BEFORE import('cesium')
//      so Workers, Assets and ThirdParty load from CDN, not from /cesium/.
//   2. Dynamic import inside useEffect — never top-level — to avoid SSR errors
//      (Cesium accesses window/document on import).

import { useEffect, useRef, useState } from 'react';
import { Waypoint } from '@/lib/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const CESIUM_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2NWEzNjhlMC02NGExLTQwZTItYjViMS04Njg2MTU0Y2MxYmUiLCJpZCI6NDEwMTE1LCJpYXQiOjE3NzQ2MjU2Mzh9.9HUaqrFxt1P7tEG4BS49E_jycr6b4_TpuhAa0tkEjDY';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the geographic centroid of a waypoint array */
function centroid(waypoints: Waypoint[]): { lng: number; lat: number } {
  const lng = waypoints.reduce((s, wp) => s + wp.lng, 0) / waypoints.length;
  const lat = waypoints.reduce((s, wp) => s + wp.lat, 0) / waypoints.length;
  return { lng, lat };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Preview3DPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tilesetRef = useRef<any>(null);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [buildingsVisible, setBuildingsVisible] = useState(true);
  const [missionMeta, setMissionMeta] = useState<{
    count: number;
    timestamp: number;
    center: { lng: number; lat: number };
  } | null>(null);

  // ── Single effect: read data + init Cesium ────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let viewer: any = null;

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

      // 2. Fetch ground elevation from Open-Meteo for each waypoint.
      // Cesium World Terrain uses real elevation data, but we still need
      // ground elevation to compute absolute altitude (MSL = ground + AGL).
      let groundElevs: number[] = wps.map(() => 0);
      try {
        const lats = wps.map((wp: Waypoint) => wp.lat).join(',');
        const lngs = wps.map((wp: Waypoint) => wp.lng).join(',');
        const elevRes = await fetch(
          `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`,
        );
        if (elevRes.ok) {
          const elevData = await elevRes.json() as { elevation: number[] };
          groundElevs = elevData.elevation ?? groundElevs;
        }
      } catch {
        // Elevation fetch failed — waypoints will use AGL heights from MSL=0
      }

      // 3. Dynamic import — runs only in the browser, never on the server.
      // CESIUM_BASE_URL must be set BEFORE the import so Workers load correctly.
      // Using Cesium CDN avoids copying static files to public/ on every build.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).CESIUM_BASE_URL =
        'https://cesium.com/downloads/cesiumjs/releases/1.115/Build/Cesium/';
      const Cesium = (await import('cesium')).default;
      await import('cesium/Build/Cesium/Widgets/widgets.css');

      Cesium.Ion.defaultAccessToken = CESIUM_TOKEN;

      // 4. Create Cesium Viewer with World Terrain + Bing satellite imagery.
      // All built-in UI widgets are disabled — we provide our own overlay.
      viewer = new Cesium.Viewer(containerRef.current!, {
        terrainProvider: await Cesium.createWorldTerrainAsync({
          requestWaterMask: true,
          requestVertexNormals: true,
        }),
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
      });

      viewerRef.current = viewer;

      // 5. OSM Buildings — free 3D buildings from Cesium ion
      try {
        const tileset = await Cesium.createOsmBuildingsAsync();
        viewer.scene.primitives.add(tileset);
        tilesetRef.current = tileset;
      } catch {
        // OSM Buildings failed silently — scene still shows terrain + route
      }

      // 6. Build absolute positions: ground elevation + AGL waypoint height
      const avgElev = groundElevs.reduce((s, e) => s + e, 0) / groundElevs.length;
      const positions = wps.map((wp: Waypoint, i: number) =>
        Cesium.Cartesian3.fromDegrees(
          wp.lng,
          wp.lat,
          (groundElevs[i] ?? 0) + (wp.height ?? 50),
        ),
      );

      // 7. Waypoint route as a glowing polyline in the air
      viewer.entities.add({
        polyline: {
          positions,
          width: 4,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.2,
            color: Cesium.Color.ORANGE,
          }),
          clampToGround: false, // fly in the air, not on terrain
        },
      });

      // 8. Waypoint markers: orange point + numbered label at flight altitude
      wps.forEach((wp: Waypoint, i: number) => {
        viewer.entities.add({
          position: positions[i],
          point: {
            pixelSize: 12,
            color: Cesium.Color.ORANGE,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.NONE,
          },
          label: {
            text: String(i + 1),
            font: '13px sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -16),
            heightReference: Cesium.HeightReference.NONE,
          },
        });
      });

      // 9. Initial camera — 45° oblique view over the mission centroid
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          center.lng,
          center.lat - 0.005,
          avgElev + 500,
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-45),
          roll: 0,
        },
      });

      setMapReady(true);
    })();

    return () => {
      viewer?.destroy();
      viewerRef.current = null;
      tilesetRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Toggle OSM Buildings ──────────────────────────────────────────────────
  function handleToggleBuildings() {
    if (!tilesetRef.current) return;
    const next = !buildingsVisible;
    tilesetRef.current.show = next;
    setBuildingsVisible(next);
  }

  // ── Camera presets ────────────────────────────────────────────────────────
  async function getCesium() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (await import('cesium')).default as any;
  }

  async function handleResetView() {
    if (!viewerRef.current || !missionMeta) return;
    const Cesium = await getCesium();
    viewerRef.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        missionMeta.center.lng,
        missionMeta.center.lat - 0.005,
        500,
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0,
      },
      duration: 1.5,
    });
  }

  async function handleSideView() {
    // pitch -30° = low angle, shows facades and horizon
    if (!viewerRef.current || !missionMeta) return;
    const Cesium = await getCesium();
    viewerRef.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        missionMeta.center.lng,
        missionMeta.center.lat - 0.008,
        300,
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-30),
        roll: 0,
      },
      duration: 1.0,
    });
  }

  async function handleBirdView() {
    // pitch -90° = exactly overhead — true bird's eye view
    if (!viewerRef.current || !missionMeta) return;
    const Cesium = await getCesium();
    viewerRef.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        missionMeta.center.lng,
        missionMeta.center.lat,
        800,
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
      duration: 1.0,
    });
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
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#0f1117' }}>

      {/* Cesium container — must fill full viewport */}
      <div
        ref={containerRef}
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
            <span className="text-gray-600">Orbit: levé tlač. · Pan: střední tlač. · Zoom: pravé tlač. / scroll</span>
          </div>
        </div>
      )}
    </div>
  );
}
