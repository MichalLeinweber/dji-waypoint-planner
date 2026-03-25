'use client';

// Left sidebar (desktop) / bottom drawer (mobile) with mission controls
import { useState } from 'react';
import Link from 'next/link';
import WaypointPanel from './WaypointPanel';
import { Waypoint, MissionType } from '@/lib/types';

/** Tab labels for mission types */
const MISSION_TABS: { type: MissionType; label: string }[] = [
  { type: 'waypoints', label: 'Waypointy' },
  { type: 'spiral', label: 'Spirala' },
  { type: 'grid', label: 'Grid' },
  { type: 'orbit', label: 'Orbit' },
];

interface SidebarProps {
  waypoints: Waypoint[];
  missionType: MissionType;
  onMissionTypeChange: (type: MissionType) => void;
  onUpdateWaypoint: (id: string, updates: Partial<Waypoint>) => void;
  onDeleteWaypoint: (id: string) => void;
  onClearAll: () => void;
  onSaveMission: () => void;
  onExportKMZ: () => void;
  isExporting: boolean;
}

export default function Sidebar({
  waypoints,
  missionType,
  onMissionTypeChange,
  onUpdateWaypoint,
  onDeleteWaypoint,
  onClearAll,
  onSaveMission,
  onExportKMZ,
  isExporting,
}: SidebarProps) {
  // Mobile: whether the drawer is expanded
  const [mobileOpen, setMobileOpen] = useState(false);

  const content = (
    <div className="flex flex-col h-full">
      {/* App logo/title */}
      <div className="px-4 py-3 border-b border-gray-700 flex-shrink-0">
        <h1 className="text-white font-bold text-sm tracking-wide">DJI Waypoint Planner</h1>
        <p className="text-gray-500 text-xs">Mini 4 Pro</p>
      </div>

      {/* Mission type tabs */}
      <div className="px-2 pt-3 flex-shrink-0">
        <div className="grid grid-cols-4 gap-1">
          {MISSION_TABS.map((tab) => (
            <button
              key={tab.type}
              onClick={() => onMissionTypeChange(tab.type)}
              className={`py-1.5 rounded text-xs font-medium transition-colors ${
                missionType === tab.type
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#0f1117] text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Coming soon notice for non-waypoint types */}
      {missionType !== 'waypoints' && (
        <div className="mx-4 mt-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
          <p className="text-yellow-400 text-xs">
            Tento typ mise bude dostupny v budoucich verzich.
          </p>
        </div>
      )}

      {/* Waypoint list — scrollable */}
      {missionType === 'waypoints' && (
        <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
          <WaypointPanel
            waypoints={waypoints}
            onUpdateWaypoint={onUpdateWaypoint}
            onDeleteWaypoint={onDeleteWaypoint}
            onClearAll={onClearAll}
          />
        </div>
      )}

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
        <Link
          href="/missions"
          className="text-xs text-gray-500 hover:text-blue-400 transition-colors"
        >
          Ulozene mise
        </Link>
        <Link
          href="/guide"
          className="text-xs text-gray-500 hover:text-blue-400 transition-colors"
        >
          Navod RC 2
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
        {/* Toggle handle */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="w-full bg-[#1a1d27] border-t border-gray-700 py-2 flex items-center justify-center gap-2"
        >
          <span className="text-gray-400 text-xs">
            {mobileOpen ? 'Skryt panel' : `Panel mise (${waypoints.length} bodu)`}
          </span>
          <span className="text-gray-400">{mobileOpen ? '▼' : '▲'}</span>
        </button>

        {/* Drawer content */}
        {mobileOpen && (
          <div className="bg-[#1a1d27] border-t border-gray-700 max-h-[60vh] overflow-y-auto">
            {content}
          </div>
        )}
      </div>
    </>
  );
}
