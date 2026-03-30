'use client';

// ActiveProfileBadge — shows active pilot + drone in the sidebar header.
// Reads from localStorage on mount and re-syncs when the window gains focus
// (so changes made on /settings are reflected without a full reload).

import { useState, useEffect } from 'react';
import { loadActivePilot, loadActiveDrone } from '@/lib/profileStore';
import { Pilot, Drone } from '@/lib/types';

export default function ActiveProfileBadge() {
  const [pilot, setPilot] = useState<Pilot | null>(null);
  const [drone, setDrone] = useState<Drone | null>(null);

  function refresh() {
    setPilot(loadActivePilot());
    setDrone(loadActiveDrone());
  }

  useEffect(() => {
    refresh();
    // Re-sync when user returns from /settings tab
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  // No output if nothing is configured yet
  if (!pilot && !drone) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {pilot && (
        <span className="text-xs text-blue-300 bg-blue-900/20 border border-blue-800 rounded px-1.5 py-0.5 leading-tight">
          👤 {pilot.firstName} {pilot.lastName}
        </span>
      )}
      {drone && (
        <span className="text-xs text-green-300 bg-green-900/20 border border-green-800 rounded px-1.5 py-0.5 leading-tight">
          🚁 {drone.name}
        </span>
      )}
    </div>
  );
}
