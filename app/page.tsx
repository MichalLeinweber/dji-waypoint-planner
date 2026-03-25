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
const Map = dynamic(() => import('@/components/Map'), { ssr: false });

/** Generate a unique ID for a new waypoint */
function generateId(): string {
  return `wp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function HomePage() {
  const router = useRouter();
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [missionType, setMissionType] = useState<MissionType>('waypoints');
  const [isExporting, setIsExporting] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  /** Add a new waypoint at the clicked map location */
  const handleAddWaypoint = useCallback((lat: number, lng: number) => {
    setWaypoints((prev) => [
      ...prev,
      {
        id: generateId(),
        lat,
        lng,
        height: 50,
        speed: 5,
        waitTime: 0,
        cameraAction: 'none',
      },
    ]);
  }, []);

  /** Update waypoint position after drag */
  const handleUpdateWaypointPosition = useCallback((id: string, lat: number, lng: number) => {
    setWaypoints((prev) =>
      prev.map((wp) => (wp.id === id ? { ...wp, lat, lng } : wp))
    );
  }, []);

  /** Update waypoint parameters from the sidebar panel */
  const handleUpdateWaypoint = useCallback((id: string, updates: Partial<Waypoint>) => {
    setWaypoints((prev) =>
      prev.map((wp) => (wp.id === id ? { ...wp, ...updates } : wp))
    );
  }, []);

  /** Delete a single waypoint */
  const handleDeleteWaypoint = useCallback((id: string) => {
    setWaypoints((prev) => prev.filter((wp) => wp.id !== id));
  }, []);

  /** Clear all waypoints */
  const handleClearAll = useCallback(() => {
    setWaypoints([]);
  }, []);

  /** Open the save dialog */
  const handleSaveMission = useCallback(() => {
    setSaveDialogOpen(true);
  }, []);

  /** Called when the user confirms the save dialog with a name */
  const handleSaveConfirm = useCallback((name: string) => {
    const mission: Mission = {
      id: `mission-${Date.now()}`,
      name,
      type: missionType,
      createdAt: new Date().toISOString(),
      waypoints: [...waypoints],
    };
    saveMission(mission);
    setSaveDialogOpen(false);
    router.push('/missions');
  }, [waypoints, missionType, router]);

  /** Export the current mission as a KMZ file */
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
      };
      await exportKMZ(mission);
    } catch (error) {
      console.error('KMZ export failed:', error);
      alert('Export se nezdaril. Zkontroluj konzoli.');
    } finally {
      setIsExporting(false);
    }
  }, [waypoints, missionType]);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Save mission modal */}
      <SaveMissionDialog
        open={saveDialogOpen}
        onSave={handleSaveConfirm}
        onClose={() => setSaveDialogOpen(false)}
      />

      {/* Sidebar (desktop left / mobile bottom) */}
      <Sidebar
        waypoints={waypoints}
        missionType={missionType}
        onMissionTypeChange={setMissionType}
        onUpdateWaypoint={handleUpdateWaypoint}
        onDeleteWaypoint={handleDeleteWaypoint}
        onClearAll={handleClearAll}
        onSaveMission={handleSaveMission}
        onExportKMZ={handleExportKMZ}
        isExporting={isExporting}
      />

      {/* Map fills remaining space */}
      <main className="flex-1 relative">
        <Map
          waypoints={waypoints}
          onAddWaypoint={handleAddWaypoint}
          onUpdateWaypoint={handleUpdateWaypointPosition}
        />
      </main>
    </div>
  );
}
