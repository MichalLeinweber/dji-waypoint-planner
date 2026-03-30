// Collision detection — checks waypoints against airspace zones and NP/CHKO areas.
// Uses ray-casting point-in-polygon (no external deps).
// GeoJSON data is fetched once and cached in module-level variables.

import { Waypoint } from '@/lib/types';
import { AIRSPACE_TYPE_NAMES } from './airspaceTypes';

// ── Types ──────────────────────────────────────────────────────────────────

export type Severity = 'DANGER' | 'WARNING' | 'CAUTION';

export interface Collision {
  waypointId: string;
  waypointIndex: number;
  zoneName: string;
  zoneType: string;
  severity: Severity;
  instructions: string;
}

// Internal zone record used during checking
interface Zone {
  name: string;
  type: string;
  severity: Severity;
  instructions: string;
  /** Outer ring coordinates [lng, lat][] */
  ring: [number, number][];
}

// ── Module-level cache ─────────────────────────────────────────────────────

let zonesCache: Zone[] | null = null;

// ── Severity + instructions mapping ───────────────────────────────────────

function airspaceSeverity(typeNum: number): Severity {
  const t = AIRSPACE_TYPE_NAMES[typeNum] ?? 'OTHER';
  if (['PROHIBITED', 'RESTRICTED'].includes(t)) return 'DANGER';
  if (['CTR', 'TRA', 'TSA', 'DANGER'].includes(t)) return 'WARNING';
  return 'CAUTION'; // TMA, ATZ, RMZ, TMZ, FIR, ADIZ, OTHER
}

function airspaceInstructions(typeNum: number): string {
  const t = AIRSPACE_TYPE_NAMES[typeNum] ?? 'OTHER';
  switch (t) {
    case 'PROHIBITED':
      return 'Zákaz vstupu. Kontaktujte ÚCL: caa.gov.cz nebo tel. +420 225 422 444';
    case 'RESTRICTED':
      return 'Omezený prostor. Kontaktujte ÚCL: caa.gov.cz nebo tel. +420 225 422 444';
    case 'DANGER':
      return 'Nebezpečný vzdušný prostor. Ověřte podmínky na dronemap.gov.cz';
    case 'CTR':
      return 'Řízený prostor letiště. Kontaktujte provozovatele letiště nebo ŘLP: rlp.cz';
    case 'TRA':
    case 'TSA':
      return 'Vojenský vyhrazený prostor. Kontaktujte ÚCL: caa.gov.cz';
    case 'ATZ':
      return 'Nekontrolované letiště. Sledujte ATZ frekvenci (najdete v DroneMap)';
    case 'TMA':
      return 'Přibližovací prostor letiště. Ověřte podmínky s ATC nebo na dronemap.gov.cz';
    case 'RMZ':
      return 'Zóna povinného rádiového volání. Nastavte transpondér nebo kontaktujte ATC';
    default:
      return 'Zvýšená opatrnost. Ověřte podmínky na dronemap.gov.cz';
  }
}

function protectedAreaSeverity(type: string): Severity {
  if (type === 'NP') return 'DANGER';
  return 'CAUTION'; // CHKO and other protected area types
}

function protectedAreaInstructions(type: string): string {
  if (type === 'NP') {
    return 'Národní park – zákaz létání mimo zastavěné oblasti. Kontaktujte správu NP.';
  }
  return 'CHKO – ověřte zónu I–IV a podmínky na letejtezodpovedne.cz';
}

function smallReserveSeverity(type: string): Severity {
  if (type === 'NPR' || type === 'NPP') return 'DANGER';
  if (type === 'PR') return 'WARNING';
  return 'CAUTION'; // PP
}

function smallReserveInstructions(type: string): string {
  switch (type) {
    case 'NPR': return 'Národní přírodní rezervace – přísný zákaz létání. Kontaktujte AOPK ČR: ochranaprirody.cz';
    case 'NPP': return 'Národní přírodní památka – zákaz létání. Kontaktujte AOPK ČR: ochranaprirody.cz';
    case 'PR':  return 'Přírodní rezervace – omezené létání. Ověřte podmínky na ochranaprirody.cz';
    default:    return 'Přírodní památka – ověřte podmínky na ochranaprirody.cz';
  }
}

// ── Ray-casting point-in-polygon ──────────────────────────────────────────

/**
 * Returns true if point [lng, lat] is inside the polygon ring.
 * Ring is array of [lng, lat] pairs (GeoJSON order).
 * Uses ray-casting algorithm — O(n) per check, no external deps.
 */
function pointInPolygon(
  lng: number,
  lat: number,
  ring: [number, number][],
): boolean {
  let inside = false;
  const n = ring.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    // Check if the horizontal ray from (lng, lat) crosses the edge (xi,yi)→(xj,yj)
    const intersects =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

// ── GeoJSON loading ────────────────────────────────────────────────────────

async function loadZones(): Promise<Zone[]> {
  if (zonesCache !== null) return zonesCache;

  const zones: Zone[] = [];

  // Load airspaces
  try {
    const res = await fetch('/data/airspaces-cz.json');
    if (res.ok) {
      const data = await res.json() as { items: { name: string; type: number; geometry: { type: string; coordinates: [number, number][][] } }[] };
      for (const item of data.items) {
        if (item.geometry.type !== 'Polygon') continue;
        const ring = item.geometry.coordinates[0];
        if (!ring || ring.length < 3) continue;
        zones.push({
          name: item.name,
          type: AIRSPACE_TYPE_NAMES[item.type] ?? 'OTHER',
          severity: airspaceSeverity(item.type),
          instructions: airspaceInstructions(item.type),
          ring,
        });
      }
    }
  } catch {
    console.warn('[collisionDetection] Failed to load airspaces');
  }

  // Load protected areas (NP/CHKO)
  try {
    const res = await fetch('/data/protected-areas-cz.json');
    if (res.ok) {
      const data = await res.json() as GeoJSON.FeatureCollection;
      for (const feature of data.features) {
        if (feature.geometry.type !== 'Polygon') continue;
        const geom = feature.geometry as GeoJSON.Polygon;
        const ring = geom.coordinates[0] as [number, number][];
        if (!ring || ring.length < 3) continue;
        const props = feature.properties ?? {};
        const areaType: string = props.type ?? '';
        zones.push({
          name: props.name ?? 'Chráněné území',
          type: areaType,
          severity: protectedAreaSeverity(areaType),
          instructions: protectedAreaInstructions(areaType),
          ring,
        });
      }
    }
  } catch {
    console.warn('[collisionDetection] Failed to load protected areas');
  }

  // Load small nature reserves (NPR/NPP/PR/PP)
  try {
    const res = await fetch('/data/small-reserves-cz.json');
    if (res.ok) {
      const data = await res.json() as GeoJSON.FeatureCollection;
      for (const feature of data.features) {
        if (feature.geometry.type !== 'Polygon') continue;
        const geom = feature.geometry as GeoJSON.Polygon;
        const ring = geom.coordinates[0] as [number, number][];
        if (!ring || ring.length < 3) continue;
        const props = feature.properties ?? {};
        const areaType: string = props.type ?? '';
        zones.push({
          name: props.name ?? 'Přírodní rezervace',
          type: areaType,
          severity: smallReserveSeverity(areaType),
          instructions: smallReserveInstructions(areaType),
          ring,
        });
      }
    }
  } catch {
    console.warn('[collisionDetection] Failed to load small reserves');
  }

  zonesCache = zones;
  return zones;
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Checks all waypoints against airspace zones and NP/CHKO areas.
 * Returns one Collision per (waypoint × zone) combination.
 * GeoJSON data is fetched once and cached for the session.
 */
export async function checkWaypointCollisions(
  waypoints: Waypoint[],
): Promise<Collision[]> {
  const zones = await loadZones();
  const collisions: Collision[] = [];

  for (let i = 0; i < waypoints.length; i++) {
    const wp = waypoints[i];
    for (const zone of zones) {
      // GeoJSON uses [lng, lat] order; Waypoint uses { lat, lng }
      if (pointInPolygon(wp.lng, wp.lat, zone.ring)) {
        collisions.push({
          waypointId: wp.id,
          waypointIndex: i,
          zoneName: zone.name,
          zoneType: zone.type,
          severity: zone.severity,
          instructions: zone.instructions,
        });
      }
    }
  }

  return collisions;
}

/** Returns the highest severity from a list of collisions, or null if empty. */
export function highestSeverity(collisions: Collision[]): Severity | null {
  if (collisions.length === 0) return null;
  if (collisions.some((c) => c.severity === 'DANGER')) return 'DANGER';
  if (collisions.some((c) => c.severity === 'WARNING')) return 'WARNING';
  return 'CAUTION';
}
