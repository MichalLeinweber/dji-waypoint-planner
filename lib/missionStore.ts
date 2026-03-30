// localStorage management for saved missions
import { Mission } from './types';

const STORAGE_KEY = 'dji-missions';

/** Load all saved missions from localStorage */
export function loadMissions(): Mission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter out any entries that are missing required fields
    // (guards against data corruption or schema changes between versions)
    return parsed.filter(
      (m) => m && typeof m.id === 'string' && typeof m.name === 'string' && Array.isArray(m.waypoints),
    );
  } catch {
    console.error('Failed to load missions from localStorage');
    return [];
  }
}

/** Save a new mission to localStorage */
export function saveMission(mission: Mission): void {
  try {
    const missions = loadMissions();
    // Replace existing mission if same ID, otherwise append
    const index = missions.findIndex((m) => m.id === mission.id);
    if (index >= 0) {
      missions[index] = mission;
    } else {
      missions.push(mission);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
  } catch {
    console.error('Failed to save mission to localStorage');
  }
}

/** Delete a mission by ID from localStorage */
export function deleteMission(id: string): void {
  try {
    const missions = loadMissions().filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
  } catch {
    console.error('Failed to delete mission from localStorage');
  }
}
