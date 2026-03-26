'use client';

// Left sidebar (desktop) / bottom drawer (mobile) with mission controls
import { useState } from 'react';
import Link from 'next/link';
import WaypointPanel from './WaypointPanel';
import SpiralPanel from './SpiralPanel';
import GridPanel from './GridPanel';
import OrbitPanel from './OrbitPanel';
import FacadePanel from './FacadePanel';
import DroniePanel from './film/DroniePanel';
import RevealPanel from './film/RevealPanel';
import TopDownPanel from './film/TopDownPanel';
import CraneUpPanel from './film/CraneUpPanel';
import HyperlapsePanel from './film/HyperlapsePanel';
import ArcShotPanel from './film/ArcShotPanel';
import { Waypoint, MissionType } from '@/lib/types';
import { FilmType } from '@/app/page';

const PHOTO_TABS: { type: MissionType; label: string }[] = [
  { type: 'waypoints', label: 'Body' },
  { type: 'spiral', label: 'Spirala' },
  { type: 'grid', label: 'Grid' },
  { type: 'orbit', label: 'Orbit' },
  { type: 'facade', label: 'Fasada' },
];

const FILM_TABS: { type: FilmType; label: string }[] = [
  { type: 'dronie',     label: 'Dronie'     },
  { type: 'reveal',     label: 'Reveal'     },
  { type: 'topdown',    label: 'Top-down'   },
  { type: 'craneup',    label: 'Crane Up'   },
  { type: 'hyperlapse', label: 'Hyperlapse' },
  { type: 'arcshot',    label: 'Arc Shot'   },
];

interface SidebarProps {
  waypoints: Waypoint[];
  missionType: MissionType;
  onMissionTypeChange: (type: MissionType) => void;
  // App mode (photo vs. film)
  appMode: 'photo' | 'film';
  onAppModeChange: (mode: 'photo' | 'film') => void;
  filmType: FilmType;
  onFilmTypeChange: (type: FilmType) => void;
  // Waypoints panel
  onUpdateWaypoint: (id: string, updates: Partial<Waypoint>) => void;
  onDeleteWaypoint: (id: string) => void;
  onClearAll: () => void;
  // Generated mission panels
  onSetWaypoints: (waypoints: Waypoint[]) => void;
  // Spiral
  mapCenter: { lat: number; lng: number };
  // Grid
  gridCorners: { sw: [number, number]; ne: [number, number] } | null;
  gridDrawStep: 'idle' | 'sw' | 'ne';
  onStartDrawGrid: () => void;
  // Orbit
  poi: { lat: number; lng: number } | null;
  isSelectingPoi: boolean;
  onSelectPoi: () => void;
  onSetPoi: (poi: { lat: number; lng: number }) => void;
  // Facade
  facadePoints: { a: { lat: number; lng: number }; b: { lat: number; lng: number } } | null;
  facadeDrawStep: 'idle' | 'a' | 'b';
  onStartDrawFacade: () => void;
  facadeMode: 'single' | '360';
  onFacadeModeChange: (mode: 'single' | '360') => void;
  // Film — Dronie
  dronieStart: { lat: number; lng: number } | null;
  isSelectingDronieStart: boolean;
  onSelectDronieStart: () => void;
  // Film — Reveal
  revealPoi: { lat: number; lng: number } | null;
  revealStart: { lat: number; lng: number } | null;
  isSelectingRevealPoi: boolean;
  isSelectingRevealStart: boolean;
  onSelectRevealPoi: () => void;
  onSelectRevealStart: () => void;
  // Film — Top-down
  topDownStart: { lat: number; lng: number } | null;
  topDownEnd: { lat: number; lng: number } | null;
  isSelectingTopDownStart: boolean;
  isSelectingTopDownEnd: boolean;
  onSelectTopDownStart: () => void;
  onSelectTopDownEnd: () => void;
  // Film — Crane Up
  craneUpPos: { lat: number; lng: number } | null;
  isSelectingCraneUpPos: boolean;
  onSelectCraneUpPos: () => void;
  // Film — Hyperlapse
  hyperlapseStart: { lat: number; lng: number } | null;
  hyperlapseEnd: { lat: number; lng: number } | null;
  hyperlapseSelectStep: 'idle' | 'start' | 'end';
  onSelectHyperlapseStart: () => void;
  onSelectHyperlapseEnd: () => void;
  // Film — Arc Shot
  arcShotPoi: { lat: number; lng: number } | null;
  isSelectingArcShotPoi: boolean;
  onSelectArcShotPoi: () => void;
  // Save / Export
  onSaveMission: () => void;
  onExportKMZ: () => void;
  isExporting: boolean;
}

export default function Sidebar({
  waypoints,
  missionType,
  onMissionTypeChange,
  appMode,
  onAppModeChange,
  filmType,
  onFilmTypeChange,
  onUpdateWaypoint,
  onDeleteWaypoint,
  onClearAll,
  onSetWaypoints,
  mapCenter,
  gridCorners,
  gridDrawStep,
  onStartDrawGrid,
  poi,
  isSelectingPoi,
  onSelectPoi,
  onSetPoi,
  facadePoints,
  facadeDrawStep,
  onStartDrawFacade,
  facadeMode,
  onFacadeModeChange,
  dronieStart,
  isSelectingDronieStart,
  onSelectDronieStart,
  revealPoi,
  revealStart,
  isSelectingRevealPoi,
  isSelectingRevealStart,
  onSelectRevealPoi,
  onSelectRevealStart,
  topDownStart,
  topDownEnd,
  isSelectingTopDownStart,
  isSelectingTopDownEnd,
  onSelectTopDownStart,
  onSelectTopDownEnd,
  craneUpPos,
  isSelectingCraneUpPos,
  onSelectCraneUpPos,
  hyperlapseStart,
  hyperlapseEnd,
  hyperlapseSelectStep,
  onSelectHyperlapseStart,
  onSelectHyperlapseEnd,
  arcShotPoi,
  isSelectingArcShotPoi,
  onSelectArcShotPoi,
  onSaveMission,
  onExportKMZ,
  isExporting,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const content = (
    <div className="flex flex-col h-full">
      {/* App logo/title */}
      <div className="px-4 py-3 border-b border-gray-700 flex-shrink-0">
        <h1 className="text-white font-bold text-sm tracking-wide">DJI Waypoint Planner</h1>
        <p className="text-gray-500 text-xs">Mini 4 Pro</p>
      </div>

      {/* Mode switcher: Fotogrammetrie / Film */}
      <div className="px-3 pt-3 flex-shrink-0">
        <div className="flex rounded overflow-hidden border border-gray-700">
          <button
            onClick={() => onAppModeChange('photo')}
            className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
              appMode === 'photo'
                ? 'bg-blue-600 text-white'
                : 'bg-[#0f1117] text-gray-400 hover:text-white'
            }`}
          >
            Foto
          </button>
          <button
            onClick={() => onAppModeChange('film')}
            className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
              appMode === 'film'
                ? 'bg-purple-600 text-white'
                : 'bg-[#0f1117] text-gray-400 hover:text-white'
            }`}
          >
            Film
          </button>
        </div>
      </div>

      {/* Mission type tabs — switches based on app mode */}
      <div className="px-2 pt-2 flex-shrink-0">
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {appMode === 'photo'
            ? PHOTO_TABS.map((tab) => (
                <button
                  key={tab.type}
                  onClick={() => onMissionTypeChange(tab.type)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    missionType === tab.type
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#0f1117] text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))
            : FILM_TABS.map((tab) => (
                <button
                  key={tab.type}
                  onClick={() => onFilmTypeChange(tab.type)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    filmType === tab.type
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#0f1117] text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
        </div>
      </div>

      {/* Panel content — scrollable */}
      <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
        {/* ── Photo mode panels ── */}
        {appMode === 'photo' && missionType === 'waypoints' && (
          <WaypointPanel
            waypoints={waypoints}
            onUpdateWaypoint={onUpdateWaypoint}
            onDeleteWaypoint={onDeleteWaypoint}
            onClearAll={onClearAll}
          />
        )}

        {appMode === 'photo' && missionType === 'spiral' && (
          <SpiralPanel
            mapCenter={mapCenter}
            onGenerate={onSetWaypoints}
          />
        )}

        {appMode === 'photo' && missionType === 'grid' && (
          <GridPanel
            gridCorners={gridCorners}
            drawStep={gridDrawStep}
            onStartDraw={onStartDrawGrid}
            onGenerate={onSetWaypoints}
          />
        )}

        {appMode === 'photo' && missionType === 'orbit' && (
          <OrbitPanel
            poi={poi}
            isSelectingPoi={isSelectingPoi}
            onSelectPoi={onSelectPoi}
            onGenerate={(wps, p) => {
              onSetWaypoints(wps);
              onSetPoi(p);
            }}
          />
        )}

        {appMode === 'photo' && missionType === 'facade' && (
          <FacadePanel
            facadePoints={facadePoints}
            drawStep={facadeDrawStep}
            onStartDraw={onStartDrawFacade}
            mode={facadeMode}
            onModeChange={onFacadeModeChange}
            waypoints={waypoints}
            onGenerate={onSetWaypoints}
          />
        )}

        {/* ── Film mode panels ── */}
        {appMode === 'film' && filmType === 'dronie' && (
          <DroniePanel
            startPos={dronieStart}
            isSelectingStart={isSelectingDronieStart}
            onSelectStart={onSelectDronieStart}
            onGenerate={onSetWaypoints}
          />
        )}

        {appMode === 'film' && filmType === 'reveal' && (
          <RevealPanel
            poi={revealPoi}
            startPos={revealStart}
            isSelectingPoi={isSelectingRevealPoi}
            isSelectingStart={isSelectingRevealStart}
            onSelectPoi={onSelectRevealPoi}
            onSelectStart={onSelectRevealStart}
            onGenerate={onSetWaypoints}
          />
        )}

        {appMode === 'film' && filmType === 'topdown' && (
          <TopDownPanel
            startPos={topDownStart}
            endPos={topDownEnd}
            isSelectingStart={isSelectingTopDownStart}
            isSelectingEnd={isSelectingTopDownEnd}
            onSelectStart={onSelectTopDownStart}
            onSelectEnd={onSelectTopDownEnd}
            onGenerate={onSetWaypoints}
          />
        )}

        {appMode === 'film' && filmType === 'craneup' && (
          <CraneUpPanel
            pos={craneUpPos}
            isSelectingPos={isSelectingCraneUpPos}
            onSelectPos={onSelectCraneUpPos}
            onGenerate={onSetWaypoints}
          />
        )}

        {appMode === 'film' && filmType === 'hyperlapse' && (
          <HyperlapsePanel
            startPos={hyperlapseStart}
            endPos={hyperlapseEnd}
            selectStep={hyperlapseSelectStep}
            onSelectStart={onSelectHyperlapseStart}
            onSelectEnd={onSelectHyperlapseEnd}
            onGenerate={onSetWaypoints}
          />
        )}

        {appMode === 'film' && filmType === 'arcshot' && (
          <ArcShotPanel
            poi={arcShotPoi}
            isSelectingPoi={isSelectingArcShotPoi}
            onSelectPoi={onSelectArcShotPoi}
            onGenerate={onSetWaypoints}
          />
        )}
      </div>

      {/* Action buttons */}
      <div className="px-3 py-3 border-t border-gray-700 flex flex-col gap-2 flex-shrink-0">
        <button
          onClick={onSaveMission}
          className="w-full py-2 bg-[#1a1d27] text-white text-sm rounded-lg border border-gray-600 hover:border-blue-500 transition-colors"
        >
          Ulozit misi
        </button>
        <button
          onClick={onExportKMZ}
          disabled={isExporting || waypoints.length === 0}
          className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isExporting ? 'Exportuji...' : 'Exportovat KMZ'}
        </button>
      </div>

      {/* Navigation links */}
      <div className="px-3 pb-3 flex gap-3 flex-shrink-0">
        <Link href="/missions" className="text-xs text-gray-500 hover:text-blue-400 transition-colors">
          Ulozene mise
        </Link>
        <Link href="/guide" className="text-xs text-gray-500 hover:text-blue-400 transition-colors">
          Navod RC 2
        </Link>
        <Link href="/help" className="text-xs text-gray-500 hover:text-blue-400 transition-colors">
          Napoveda
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-80 bg-[#1a1d27] border-r border-gray-700 h-full flex-shrink-0">
        {content}
      </aside>

      {/* Mobile bottom drawer */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[1000]">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="w-full bg-[#1a1d27] border-t border-gray-700 py-2 flex items-center justify-center gap-2"
        >
          <span className="text-gray-400 text-xs">
            {mobileOpen ? 'Skryt panel' : `Panel mise (${waypoints.length} bodu)`}
          </span>
          <span className="text-gray-400">{mobileOpen ? '▼' : '▲'}</span>
        </button>
        {mobileOpen && (
          <div className="bg-[#1a1d27] border-t border-gray-700 max-h-[60vh] overflow-y-auto">
            {content}
          </div>
        )}
      </div>
    </>
  );
}
