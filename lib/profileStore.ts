// profileStore.ts — localStorage persistence for pilots and drones.
//
// localStorage keys:
//   dji-planner-pilots        — Pilot[]
//   dji-planner-drones        — Drone[]
//   dji-planner-active-pilot  — string (pilot id)
//   dji-planner-active-drone  — string (drone id)

import { Pilot, Drone } from './types';

const KEYS = {
  pilots:        'dji-planner-pilots',
  drones:        'dji-planner-drones',
  activePilot:   'dji-planner-active-pilot',
  activeDrone:   'dji-planner-active-drone',
} as const;

// ── Default drones ───────────────────────────────────────────────────────────
// droneEnumValue pro KMZ export (wpml:droneEnumValue):
//   Mini 4 Pro  = 67 (ověřeno)
//   Mavic 3 Pro = 68 (ověřeno)
//   Air 3       = TBD (neověřeno — neměňte exportKMZ.ts dokud není potvrzeno)
//   Mini 3 Pro  = TBD (neověřeno — neměňte exportKMZ.ts dokud není potvrzeno)

export const DEFAULT_DRONE: Drone = {
  id:           'default-mini4pro',
  name:         'DJI Mini 4 Pro',
  manufacturer: 'DJI',
  model:        'Mini 4 Pro',
  weightG:      249,
  droneClass:   'C0',
  serialNumber: '',
  batteryWh:    33.48,
  avgPowerW:    7,
  maxAltitudeM: 120,
  maxSpeedMs:   16,
  isDefault:    true,
};

/** All pre-seeded drones. Loaded into localStorage on first run (empty list). */
export const DEFAULT_DRONES: Drone[] = [
  DEFAULT_DRONE,
  {
    id:           'default-air3',
    name:         'DJI Air 3',
    manufacturer: 'DJI',
    model:        'Air 3',
    weightG:      720,
    droneClass:   'C1',
    serialNumber: '',
    batteryWh:    46.2,
    avgPowerW:    38,
    maxAltitudeM: 120,
    maxSpeedMs:   21,
    isDefault:    false,
  },
  {
    id:           'default-mavic3pro',
    name:         'DJI Mavic 3 Pro',
    manufacturer: 'DJI',
    model:        'Mavic 3 Pro',
    weightG:      895,
    droneClass:   'C2',
    serialNumber: '',
    batteryWh:    77.6,
    avgPowerW:    48,
    maxAltitudeM: 120,
    maxSpeedMs:   21,
    isDefault:    false,
  },
  {
    id:           'default-mini3pro',
    name:         'DJI Mini 3 Pro',
    manufacturer: 'DJI',
    model:        'Mini 3 Pro',
    weightG:      249,
    droneClass:   'C0',
    serialNumber: '',
    batteryWh:    33.9,
    avgPowerW:    23,
    maxAltitudeM: 120,
    maxSpeedMs:   16,
    isDefault:    false,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn('[profileStore] localStorage write failed for key:', key);
  }
}

// ── Pilots ───────────────────────────────────────────────────────────────────

export function loadPilots(): Pilot[] {
  return safeRead<Pilot[]>(KEYS.pilots, []);
}

export function savePilot(pilot: Omit<Pilot, 'id'>): Pilot {
  const pilots = loadPilots();
  const newPilot: Pilot = { ...pilot, id: generateId() };
  safeWrite(KEYS.pilots, [...pilots, newPilot]);
  return newPilot;
}

export function updatePilot(updated: Pilot): void {
  const pilots = loadPilots().map((p) => (p.id === updated.id ? updated : p));
  safeWrite(KEYS.pilots, pilots);
}

export function deletePilot(id: string): void {
  const pilots = loadPilots().filter((p) => p.id !== id);
  safeWrite(KEYS.pilots, pilots);
  // Clear active if deleted
  if (loadActivePilotId() === id) {
    safeWrite(KEYS.activePilot, null);
  }
}

export function loadActivePilotId(): string | null {
  return safeRead<string | null>(KEYS.activePilot, null);
}

export function setActivePilotId(id: string | null): void {
  safeWrite(KEYS.activePilot, id);
}

export function loadActivePilot(): Pilot | null {
  const id = loadActivePilotId();
  if (!id) return null;
  return loadPilots().find((p) => p.id === id) ?? null;
}

// ── Drones ───────────────────────────────────────────────────────────────────

/** Returns saved drones; seeds with all DEFAULT_DRONES on first run. */
export function loadDrones(): Drone[] {
  const drones = safeRead<Drone[]>(KEYS.drones, []);
  if (drones.length === 0) {
    safeWrite(KEYS.drones, DEFAULT_DRONES);
    return DEFAULT_DRONES;
  }
  return drones;
}

export function saveDrone(drone: Omit<Drone, 'id'>): Drone {
  const drones = loadDrones();
  const newDrone: Drone = { ...drone, id: generateId() };
  safeWrite(KEYS.drones, [...drones, newDrone]);
  return newDrone;
}

export function updateDrone(updated: Drone): void {
  const drones = loadDrones().map((d) => (d.id === updated.id ? updated : d));
  safeWrite(KEYS.drones, drones);
}

export function deleteDrone(id: string): void {
  // Prevent deleting last drone
  const drones = loadDrones();
  if (drones.length <= 1) return;
  safeWrite(KEYS.drones, drones.filter((d) => d.id !== id));
  if (loadActiveDroneId() === id) {
    safeWrite(KEYS.activeDrone, null);
  }
}

export function loadActiveDroneId(): string | null {
  return safeRead<string | null>(KEYS.activeDrone, null);
}

export function setActiveDroneId(id: string | null): void {
  safeWrite(KEYS.activeDrone, id);
}

/** Returns the active drone, falling back to the first drone in the list. */
export function loadActiveDrone(): Drone {
  const id = loadActiveDroneId();
  const drones = loadDrones();
  return drones.find((d) => d.id === id) ?? drones[0] ?? DEFAULT_DRONE;
}
