'use client';

// Main application page — full-screen map with sidebar
import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import SaveMissionDialog from '@/components/SaveMissionDialog';
import { Waypoint, Mission, MissionType } from '@/lib/types';
import { exportKMZ } from '@/lib/exportKMZ';
import { saveMission } from '@/lib/missionStore';

// Leaflet map must be loaded client-side only (it uses browser APIs)
const MapView = dynamic(() => import('@/components/Map'), { ssr: false });

function generateId(): string {
  return `wp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function HomePage() {
  const router = useRouter();

  // ── Core state ──────────────────────────────────────────────
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [missionType, setMissionType] = useState<MissionType>('waypoints');
  const [isExporting, setIsExporting] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // ── Map state ────────────────────────────────────────────────
  const [mapCenter, setMapCenter] = useState({ lat: 50.08, lng: 14.42 });

  // ── Grid state ───────────────────────────────────────────────
  const [gridCorners, setGridCorners] = useState<{ sw: [number, number]; ne: [number, number] } | null>(null);
  const [gridDrawStep, setGridDrawStep] = useState<'idle' | 'sw' | 'ne'>('idle');
  // Temporary SW corner while waiting for NE click
  const [pendingSw, setPendingSw] = useState<[number, number] | null>(null);

  // ── Orbit state ──────────────────────────────────────────────
  const [poi, setPoi] = useState<{ lat: number; lng: number } | null>(null);
  const [isSelectingPoi, setIsSelectingPoi] = useState(false);

  // ── Map interaction ──────────────────────────────────────────

  /** Single handler for all map clicks — behavior depends on current mode */
  const handleMapClick = useCallback((lat: number, lng: number) => {
    // POI select mode (orbit)
    if (isSelectingPoi) {
      setPoi({ lat, lng });
      setIsSelectingPoi(false);
      return;
    }

    // Grid corner selection
    if (gridDrawStep === 'sw') {
      setPendingSw([lat, lng]);
      setGridDrawStep('ne');
      return;
    }
    if (gridDrawStep === 'ne' && pendingSw) {
      setGridCorners({ sw: pendingSw, ne: [lat, lng] });
      setPendingSw(null);
      setGridDrawStep('idle');
      return;
    }

    // Default: add waypoint (only in waypoints mode)
    if (missionType === 'waypoints') {
      setWaypoints((prev) => [
        ...prev,
        { id: generateId(), lat, lng, height: 50, speed: 5, waitTime: 0, cameraAction: 'none' },
      ]);
    }
  }, [isSelectingPoi, gridDrawStep, pendingSw, missionType]);

  /** Update waypoint position after drag */
  const handleUpdateWaypointPosition = useCallback((id: string, lat: number, lng: number) => {
    setWaypoints((prev) => prev.map((wp) => (wp.id === id ? { ...wp, lat, lng } : wp)));
  }, []);

  /** Update waypoint parameters from the sidebar panel */
  const handleUpdateWaypoint = useCallback((id: string, updates: Partial<Waypoint>) => {
    setWaypoints((prev) => prev.map((wp) => (wp.id === id ? { ...wp, ...updates } : wp)));
  }, []);

  const handleDeleteWaypoint = useCallback((id: string) => {
    setWaypoints((prev) => prev.filter((wp) => wp.id !== id));
  }, []);

  const handleClearAll = useCallback(() => {
    setWaypoints([]);
  }, []);

  /** Replace all waypoints with a newly generated set (spiral/grid/orbit) */
  const handleSetWaypoints = useCallback((wps: Waypoint[]) => {
    setWaypoints(wps);
  }, []);

  /** Change mission type — clear waypoints and any mode-specific state */
  const handleMissionTypeChange = useCallback((type: MissionType) => {
    setMissionType(type);
    setWaypoints([]);
    setGridDrawStep('idle');
    setPendingSw(null);
    setIsSelectingPoi(false);
  }, []);

  // ── Save / Export ────────────────────────────────────────────

  const handleSaveMission = useCallback(() => {
    setSaveDialogOpen(true);
  }, []);

  const handleSaveConfirm = useCallback((name: string) => {
    const mission: Mission = {
      id: `mission-${Date.now()}`,
      name,
      type: missionType,
      createdAt: new Date().toISOString(),
      waypoints: [...waypoints],
      // Include POI for orbit missions so KMZ export uses towardPOI heading
      ...(missionType === 'orbit' && poi ? { poi } : {}),
    };
    saveMission(mission);
    setSaveDialogOpen(false);
    router.push('/missions');
  }, [waypoints, missionType, poi, router]);

  const handleExportKMZ = useCallback(async () => {
    if (waypoints.length === 0) return;
    setIsExporting(true);
    try {
      const mission: Mission = {
        id: 'export',
        name: 'mise',
        type: missionType,
        createdAt: new Date().toISOString(),
        waypoints,
        ...(missionType === 'orbit' && poi ? { poi } : {}),
      };
      await exportKMZ(mission);
    } catch (error) {
      console.error('KMZ export failed:', error);
      alert('Export se nezdaril. Zkontroluj konzoli.');
    } finally {
      setIsExporting(false);
    }
  }, [waypoints, missionType, poi]);

  // ── Derived map props ────────────────────────────────────────

  // Show crosshair cursor when the user is placing a point on the map
  const crosshairCursor = isSelectingPoi || gridDrawStep !== 'idle';

  // Markers are draggable only in manual waypoints mode
  const draggableMarkers = missionType === 'waypoints';

  // Show grid rectangle when both corners are selected
  const gridRect: [[number, number], [number, number]] | null = gridCorners
    ? [gridCorners.sw, gridCorners.ne]
    : null;

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <SaveMissionDialog
        open={saveDialogOpen}
        onSave={handleSaveConfirm}
        onClose={() => setSaveDialogOpen(false)}
      />

      <Sidebar
        waypoints={waypoints}
        missionType={missionType}
        onMissionTypeChange={handleMissionTypeChange}
        onUpdateWaypoint={handleUpdateWaypoint}
        onDeleteWaypoint={handleDeleteWaypoint}
        onClearAll={handleClearAll}
        onSetWaypoints={handleSetWaypoints}
        mapCenter={mapCenter}
        gridCorners={gridCorners}
        gridDrawStep={gridDrawStep}
        onStartDrawGrid={() => setGridDrawStep('sw')}
        poi={poi}
        isSelectingPoi={isSelectingPoi}
        onSelectPoi={() => setIsSelectingPoi(true)}
        onSetPoi={setPoi}
        onSaveMission={handleSaveMission}
        onExportKMZ={handleExportKMZ}
        isExporting={isExporting}
      />

      <main className="flex-1 relative">
        <MapView
          waypoints={waypoints}
          draggableMarkers={draggableMarkers}
          crosshairCursor={crosshairCursor}
          onMapClick={handleMapClick}
          onUpdateWaypoint={handleUpdateWaypointPosition}
          onCenterChange={(lat, lng) => setMapCenter({ lat, lng })}
          gridRect={gridRect}
        />
      </main>
    </div>
  );
}
