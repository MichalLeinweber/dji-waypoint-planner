// importKmz.ts — parse a DJI WPML .kmz file back into editable waypoints.
//
// KMZ is a ZIP archive. DJI stores waypoints in:
//   wpmz/waylines.wpml   (primary — WPML format with wpml: namespace)
//   wpmz/template.kml    (fallback — standard KML Placemarks)
//
// The wpml: namespace means querySelectorAll('wpml:executeHeight') does NOT work
// in DOMParser output. We use getElementsByTagNameNS / querySelectorAll('*')
// with localName checks instead.

import JSZip from 'jszip';
import { Waypoint } from '@/lib/types';

export interface ImportedMission {
  waypoints: Waypoint[];
  missionType: 'waypoints';
}

/** Generate a unique waypoint id matching the pattern used in page.tsx */
function makeId(index: number): string {
  return `wp-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 5)}`;
}

/**
 * Find the first element with a given local name anywhere in the document,
 * regardless of XML namespace prefix (handles `wpml:executeHeight` etc.).
 */
function getByLocalName(parent: Element, localName: string): Element | null {
  const all = parent.getElementsByTagName('*');
  for (let i = 0; i < all.length; i++) {
    if (all[i].localName === localName) return all[i];
  }
  return null;
}

/**
 * Parse waypoints out of a WPML or KML XML string.
 * Returns an empty array if no valid Placemarks are found.
 */
function parseWaypoints(xmlContent: string): Waypoint[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'application/xml');

  // Abort on parse error
  if (doc.querySelector('parsererror')) return [];

  const placemarks = doc.querySelectorAll('Placemark');
  const waypoints: Waypoint[] = [];

  placemarks.forEach((placemark, index) => {
    // Coordinates: "lng,lat,alt" inside <Point><coordinates>
    const coordEl = placemark.querySelector('Point coordinates');
    if (!coordEl?.textContent) return;

    const parts = coordEl.textContent.trim().split(',').map(Number);
    const lng = parts[0];
    const lat = parts[1];
    const altFromCoord = parts[2]; // may be 0 or NaN — use as last resort

    if (isNaN(lat) || isNaN(lng)) return;

    // Height — prefer wpml:executeHeight (WPML), fall back to coordinate altitude
    const heightEl = getByLocalName(placemark, 'executeHeight');
    let height = 50; // sensible default
    if (heightEl?.textContent) {
      const parsed = parseFloat(heightEl.textContent);
      if (!isNaN(parsed) && parsed > 0) height = Math.round(parsed);
    } else if (!isNaN(altFromCoord) && altFromCoord > 0) {
      height = Math.round(altFromCoord);
    }

    // Speed — wpml:waypointSpeed
    const speedEl = getByLocalName(placemark, 'waypointSpeed');
    let speed = 5; // default m/s
    if (speedEl?.textContent) {
      const parsed = parseFloat(speedEl.textContent);
      if (!isNaN(parsed) && parsed > 0) speed = Math.round(parsed);
    }

    waypoints.push({
      id: makeId(index),
      lat,
      lng,
      height,
      speed,
      waitTime: 0,
      cameraAction: 'none',
    });
  });

  return waypoints;
}

/**
 * Loads a .kmz file (ZIP archive), finds the WPML/KML waypoint data,
 * and returns the parsed waypoints.
 *
 * Throws a user-readable Error on any failure.
 */
export async function importKmz(file: File): Promise<ImportedMission> {
  // Step 1 — unzip
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new Error('Soubor není platný KMZ (nelze rozbalit ZIP archiv).');
  }

  const filenames = Object.keys(zip.files);

  // Step 2 — find waypoint data: prefer waylines.wpml, then any .wpml, then any .kml
  let xmlContent: string | null = null;

  // Priority 1: wpmz/waylines.wpml (standard DJI export path)
  for (const name of filenames) {
    if (name.includes('waylines') && name.endsWith('.wpml')) {
      xmlContent = await zip.files[name].async('string');
      break;
    }
  }

  // Priority 2: any other .wpml file
  if (!xmlContent) {
    for (const name of filenames) {
      if (name.endsWith('.wpml')) {
        xmlContent = await zip.files[name].async('string');
        break;
      }
    }
  }

  // Priority 3: any .kml file (template.kml or similar)
  if (!xmlContent) {
    for (const name of filenames) {
      if (name.endsWith('.kml')) {
        xmlContent = await zip.files[name].async('string');
        break;
      }
    }
  }

  if (!xmlContent) {
    throw new Error('KMZ soubor neobsahuje platná waypoint data (chybí .wpml nebo .kml).');
  }

  // Step 3 — parse XML
  const waypoints = parseWaypoints(xmlContent);

  if (waypoints.length === 0) {
    throw new Error('Nepodařilo se načíst žádné waypointy z KMZ souboru.');
  }

  return { waypoints, missionType: 'waypoints' };
}
