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

/** Shot types available in film mode */
export type FilmType = 'dronie' | 'reveal' | 'topdown' | 'craneup' | 'hyperlapse' | 'arcshot' | 'boomerang' | 'rocket' | 'poisequence';

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

  // ── App mode: photo workflow vs. cinematic film shots ─────────
  const [appMode, setAppMode] = useState<'photo' | 'film'>('photo');
  const [filmType, setFilmType] = useState<FilmType>('dronie');

  // ── Map state ────────────────────────────────────────────────
  const [mapCenter, setMapCenter] = useState({ lat: 50.08, lng: 14.42 });

  // ── Fly-to target (driven by address search in SearchBar) ─────
  // Setting a new object triggers the useEffect in Map.tsx which calls map.flyTo().
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number; zoom: number } | null>(null);

  const handleFlyTo = useCallback((lat: number, lng: number) => {
    setFlyToTarget({ lat, lng, zoom: 17 });
  }, []);

  // ── Grid state ───────────────────────────────────────────────
  const [gridCorners, setGridCorners] = useState<{ sw: [number, number]; ne: [number, number] } | null>(null);
  const [gridDrawStep, setGridDrawStep] = useState<'idle' | 'sw' | 'ne'>('idle');
  // Temporary SW corner while waiting for NE click
  const [pendingSw, setPendingSw] = useState<[number, number] | null>(null);

  // ── Orbit state ──────────────────────────────────────────────
  const [poi, setPoi] = useState<{ lat: number; lng: number } | null>(null);
  const [isSelectingPoi, setIsSelectingPoi] = useState(false);

  // ── Facade state (single side) ───────────────────────────────
  type FacadePoints = { a: { lat: number; lng: number }; b: { lat: number; lng: number } };
  const [facadePoints, setFacadePoints] = useState<FacadePoints | null>(null);
  const [facadeDrawStep, setFacadeDrawStep] = useState<'idle' | 'a' | 'b'>('idle');
  // Temporary point A while waiting for point B click
  const [pendingFacadeA, setPendingFacadeA] = useState<{ lat: number; lng: number } | null>(null);
  // 'single' = one facade side; '360' = full building (corners added via map clicks like waypoints)
  const [facadeMode, setFacadeMode] = useState<'single' | '360'>('single');

  // ── Film state — one point-selector per shot type ─────────────
  // Dronie
  const [dronieStart, setDronieStart] = useState<{ lat: number; lng: number } | null>(null);
  const [isSelectingDronieStart, setIsSelectingDronieStart] = useState(false);
  // Reveal
  const [revealPoi, setRevealPoi] = useState<{ lat: number; lng: number } | null>(null);
  const [revealStart, setRevealStart] = useState<{ lat: number; lng: number } | null>(null);
  const [isSelectingRevealPoi, setIsSelectingRevealPoi] = useState(false);
  const [isSelectingRevealStart, setIsSelectingRevealStart] = useState(false);
  // Top-down
  const [topDownStart, setTopDownStart] = useState<{ lat: number; lng: number } | null>(null);
  const [topDownEnd, setTopDownEnd] = useState<{ lat: number; lng: number } | null>(null);
  const [isSelectingTopDownStart, setIsSelectingTopDownStart] = useState(false);
  const [isSelectingTopDownEnd, setIsSelectingTopDownEnd] = useState(false);
  // Crane Up
  const [craneUpPos, setCraneUpPos] = useState<{ lat: number; lng: number } | null>(null);
  const [isSelectingCraneUpPos, setIsSelectingCraneUpPos] = useState(false);
  // Hyperlapse
  const [hyperlapseStart, setHyperlapseStart] = useState<{ lat: number; lng: number } | null>(null);
  const [hyperlapseEnd, setHyperlapseEnd] = useState<{ lat: number; lng: number } | null>(null);
  const [hyperlapseSelectStep, setHyperlapseSelectStep] = useState<'idle' | 'start' | 'end'>('idle');
  // Arc Shot
  const [arcShotPoi, setArcShotPoi] = useState<{ lat: number; lng: number } | null>(null);
  const [isSelectingArcShotPoi, setIsSelectingArcShotPoi] = useState(false);
  // Boomerang
  const [boomerangStart, setBoomerangStart] = useState<{ lat: number; lng: number } | null>(null);
  const [boomerangEnd, setBoomerangEnd] = useState<{ lat: number; lng: number } | null>(null);
  const [boomerangSelectStep, setBoomerangSelectStep] = useState<'idle' | 'start' | 'end'>('idle');
  // Rocket
  const [rocketPos, setRocketPos] = useState<{ lat: number; lng: number } | null>(null);
  const [isSelectingRocket, setIsSelectingRocket] = useState(false);
  // POI Sequence
  const [poiSeqPoi, setPoiSeqPoi] = useState<{ lat: number; lng: number } | null>(null);
  const [isSelectingPoiSeq, setIsSelectingPoiSeq] = useState(false);

  // ── Map interaction ──────────────────────────────────────────

  /** Returns true when any film point selector is active */
  const isAnyFilmSelecting =
    isSelectingDronieStart ||
    isSelectingRevealPoi ||
    isSelectingRevealStart ||
    isSelectingTopDownStart ||
    isSelectingTopDownEnd ||
    isSelectingCraneUpPos ||
    hyperlapseSelectStep !== 'idle' ||
    isSelectingArcShotPoi ||
    boomerangSelectStep !== 'idle' ||
    isSelectingRocket ||
    isSelectingPoiSeq;

  /** Single handler for all map clicks — behavior depends on current mode */
  const handleMapClick = useCallback((lat: number, lng: number) => {
    // ── Film mode point selectors ────────────────────────────
    if (isSelectingDronieStart) {
      setDronieStart({ lat, lng });
      setIsSelectingDronieStart(false);
      return;
    }
    if (isSelectingRevealPoi) {
      setRevealPoi({ lat, lng });
      setIsSelectingRevealPoi(false);
      return;
    }
    if (isSelectingRevealStart) {
      setRevealStart({ lat, lng });
      setIsSelectingRevealStart(false);
      return;
    }
    if (isSelectingTopDownStart) {
      setTopDownStart({ lat, lng });
      setIsSelectingTopDownStart(false);
      return;
    }
    if (isSelectingTopDownEnd) {
      setTopDownEnd({ lat, lng });
      setIsSelectingTopDownEnd(false);
      return;
    }
    if (isSelectingCraneUpPos) {
      setCraneUpPos({ lat, lng });
      setIsSelectingCraneUpPos(false);
      return;
    }
    if (hyperlapseSelectStep === 'start') {
      setHyperlapseStart({ lat, lng });
      setHyperlapseSelectStep('idle');
      return;
    }
    if (hyperlapseSelectStep === 'end') {
      setHyperlapseEnd({ lat, lng });
      setHyperlapseSelectStep('idle');
      return;
    }
    if (isSelectingArcShotPoi) {
      setArcShotPoi({ lat, lng });
      setIsSelectingArcShotPoi(false);
      return;
    }
    if (boomerangSelectStep === 'start') {
      setBoomerangStart({ lat, lng });
      setBoomerangSelectStep('idle');
      return;
    }
    if (boomerangSelectStep === 'end') {
      setBoomerangEnd({ lat, lng });
      setBoomerangSelectStep('idle');
      return;
    }
    if (isSelectingRocket) {
      setRocketPos({ lat, lng });
      setIsSelectingRocket(false);
      return;
    }
    if (isSelectingPoiSeq) {
      setPoiSeqPoi({ lat, lng });
      setIsSelectingPoiSeq(false);
      return;
    }

    // ── Photo mode ───────────────────────────────────────────

    // POI select mode (orbit)
    if (isSelectingPoi) {
      setPoi({ lat, lng });
      setIsSelectingPoi(false);
      return;
    }

    // Facade point selection (single side)
    if (facadeDrawStep === 'a') {
      setPendingFacadeA({ lat, lng });
      setFacadeDrawStep('b');
      return;
    }
    if (facadeDrawStep === 'b' && pendingFacadeA) {
      setFacadePoints({ a: pendingFacadeA, b: { lat, lng } });
      setPendingFacadeA(null);
      setFacadeDrawStep('idle');
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

    // Default: add waypoint in waypoints mode, or in facade 360° mode (building corners)
    if (missionType === 'waypoints' || (missionType === 'facade' && facadeMode === '360')) {
      setWaypoints((prev) => [
        ...prev,
        { id: generateId(), lat, lng, height: 50, speed: 5, waitTime: 0, cameraAction: 'none' },
      ]);
    }
  }, [
    isSelectingDronieStart, isSelectingRevealPoi, isSelectingRevealStart,
    isSelectingTopDownStart, isSelectingTopDownEnd, isSelectingCraneUpPos,
    hyperlapseSelectStep, isSelectingArcShotPoi,
    boomerangSelectStep, isSelectingRocket, isSelectingPoiSeq,
    isSelectingPoi, facadeDrawStep, pendingFacadeA, gridDrawStep, pendingSw,
    missionType, facadeMode,
  ]);

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

  /** Replace all waypoints with a newly generated set (spiral/grid/orbit/film) */
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
    setFacadeDrawStep('idle');
    setPendingFacadeA(null);
  }, []);

  /** Switch between photo and film app modes — clears waypoints and film selections */
  const handleAppModeChange = useCallback((mode: 'photo' | 'film') => {
    setAppMode(mode);
    setWaypoints([]);
    // Reset all film selectors
    setIsSelectingDronieStart(false);
    setIsSelectingRevealPoi(false);
    setIsSelectingRevealStart(false);
    setIsSelectingTopDownStart(false);
    setIsSelectingTopDownEnd(false);
    setIsSelectingCraneUpPos(false);
    setHyperlapseSelectStep('idle');
    setIsSelectingArcShotPoi(false);
    setBoomerangSelectStep('idle');
    setIsSelectingRocket(false);
    setIsSelectingPoiSeq(false);
  }, []);

  /** Switch between single-side and 360° facade modes — clears waypoints */
  const handleFacadeModeChange = useCallback((mode: 'single' | '360') => {
    setFacadeMode(mode);
    setWaypoints([]);
  }, []);

  // ── Save / Export ────────────────────────────────────────────

  const handleSaveMission = useCallback(() => {
    setSaveDialogOpen(true);
  }, []);

  const handleSaveConfirm = useCallback((name: string) => {
    // Film missions are saved with type 'film'
    const effectiveMissionType: MissionType = appMode === 'film' ? 'film' : missionType;
    const mission: Mission = {
      id: `mission-${Date.now()}`,
      name,
      type: effectiveMissionType,
      createdAt: new Date().toISOString(),
      waypoints: [...waypoints],
      // Include POI for orbit missions so KMZ export uses towardPOI heading
      ...(missionType === 'orbit' && poi ? { poi } : {}),
    };
    saveMission(mission);
    setSaveDialogOpen(false);
    router.push('/missions');
  }, [waypoints, missionType, appMode, poi, router]);

  const handleExportKMZ = useCallback(async () => {
    if (waypoints.length === 0) return;
    setIsExporting(true);
    try {
      const effectiveMissionType: MissionType = appMode === 'film' ? 'film' : missionType;
      const mission: Mission = {
        id: 'export',
        name: 'mise',
        type: effectiveMissionType,
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
  }, [waypoints, missionType, appMode, poi]);

  // ── Derived map props ────────────────────────────────────────

  // Show crosshair cursor when the user is placing a point on the map
  const crosshairCursor =
    isSelectingPoi ||
    gridDrawStep !== 'idle' ||
    facadeDrawStep !== 'idle' ||
    isAnyFilmSelecting;

  // Markers are draggable in waypoints mode and in facade 360° mode (to fine-tune corners)
  const draggableMarkers = missionType === 'waypoints' || (missionType === 'facade' && facadeMode === '360');

  // Show grid rectangle when both corners are selected
  const gridRect: [[number, number], [number, number]] | null = gridCorners
    ? [gridCorners.sw, gridCorners.ne]
    : null;

  // Show facade line when both points are selected
  const facadeLine: [[number, number], [number, number]] | null = facadePoints
    ? [[facadePoints.a.lat, facadePoints.a.lng], [facadePoints.b.lat, facadePoints.b.lng]]
    : null;

  // Show building polygon in facade 360° mode once at least 4 corners have been placed
  const buildingPolygon: [[number, number], [number, number], [number, number], [number, number]] | null =
    missionType === 'facade' && facadeMode === '360' && waypoints.length >= 4
      ? [
          [waypoints[0].lat, waypoints[0].lng],
          [waypoints[1].lat, waypoints[1].lng],
          [waypoints[2].lat, waypoints[2].lng],
          [waypoints[3].lat, waypoints[3].lng],
        ]
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
        onFlyTo={handleFlyTo}
        appMode={appMode}
        onAppModeChange={handleAppModeChange}
        filmType={filmType}
        onFilmTypeChange={setFilmType}
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
        facadePoints={facadePoints}
        facadeDrawStep={facadeDrawStep}
        onStartDrawFacade={() => setFacadeDrawStep('a')}
        facadeMode={facadeMode}
        onFacadeModeChange={handleFacadeModeChange}
        // Film props
        dronieStart={dronieStart}
        isSelectingDronieStart={isSelectingDronieStart}
        onSelectDronieStart={() => setIsSelectingDronieStart(true)}
        revealPoi={revealPoi}
        revealStart={revealStart}
        isSelectingRevealPoi={isSelectingRevealPoi}
        isSelectingRevealStart={isSelectingRevealStart}
        onSelectRevealPoi={() => setIsSelectingRevealPoi(true)}
        onSelectRevealStart={() => setIsSelectingRevealStart(true)}
        topDownStart={topDownStart}
        topDownEnd={topDownEnd}
        isSelectingTopDownStart={isSelectingTopDownStart}
        isSelectingTopDownEnd={isSelectingTopDownEnd}
        onSelectTopDownStart={() => setIsSelectingTopDownStart(true)}
        onSelectTopDownEnd={() => setIsSelectingTopDownEnd(true)}
        craneUpPos={craneUpPos}
        isSelectingCraneUpPos={isSelectingCraneUpPos}
        onSelectCraneUpPos={() => setIsSelectingCraneUpPos(true)}
        // Hyperlapse props
        hyperlapseStart={hyperlapseStart}
        hyperlapseEnd={hyperlapseEnd}
        hyperlapseSelectStep={hyperlapseSelectStep}
        onSelectHyperlapseStart={() => setHyperlapseSelectStep('start')}
        onSelectHyperlapseEnd={() => setHyperlapseSelectStep('end')}
        // Arc Shot props
        arcShotPoi={arcShotPoi}
        isSelectingArcShotPoi={isSelectingArcShotPoi}
        onSelectArcShotPoi={() => setIsSelectingArcShotPoi(true)}
        // Boomerang props
        boomerangStart={boomerangStart}
        boomerangEnd={boomerangEnd}
        boomerangSelectStep={boomerangSelectStep}
        onSelectBoomerangStart={() => setBoomerangSelectStep('start')}
        onSelectBoomerangEnd={() => setBoomerangSelectStep('end')}
        // Rocket props
        rocketPos={rocketPos}
        isSelectingRocket={isSelectingRocket}
        onSelectRocket={() => setIsSelectingRocket(true)}
        // POI Sequence props
        poiSeqPoi={poiSeqPoi}
        isSelectingPoiSeq={isSelectingPoiSeq}
        onSelectPoiSeq={() => setIsSelectingPoiSeq(true)}
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
          facadeLine={facadeLine}
          buildingPolygon={buildingPolygon}
          flyToTarget={flyToTarget}
        />
      </main>
    </div>
  );
}
