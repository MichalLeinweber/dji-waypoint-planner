// One-time script to fetch Czech National Parks (NP) and Protected Landscape Areas (CHKO)
// via OpenStreetMap Overpass API and save as static GeoJSON.
//
// Usage:  node scripts/fetch-protected-areas.js
// Output: public/data/protected-areas-cz.json
//
// Filter logic:
//   NP   — boundary=national_park,  name contains "Národní park"
//   CHKO — boundary=protected_area, protect_class=5, name starts with "CHKO"
// Using Czech Republic bounding box to avoid fetching the whole world.

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// CZ bounding box: [south, west, north, east]
const CZ_BBOX = '48.55,12.09,51.06,18.86';

// ── HTTP POST helper ──────────────────────────────────────────────────────────
function overpassPost(query, hostname = 'overpass-api.de') {
  return new Promise((resolve, reject) => {
    const body = 'data=' + encodeURIComponent(query);
    const opts = {
      hostname,
      path: '/api/interpreter',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'DJI-Waypoint-Planner/1.0 (fetch-protected-areas script)',
      },
    };
    const req = https.request(opts, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('Overpass timeout')); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Try primary server, fall back to mirror on 429 or non-JSON response
async function overpassPostWithFallback(query) {
  for (const host of ['overpass-api.de', 'overpass.kumi.systems']) {
    try {
      const r = await overpassPost(query, host);
      if (r.status === 200 && r.body.trimStart().startsWith('{')) {
        return r;
      }
      console.log(`  [${host}] status ${r.status} — trying next mirror...`);
    } catch (e) {
      console.log(`  [${host}] error: ${e.message} — trying next mirror...`);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error('All Overpass mirrors failed');
}

// ── Polygon stitching from OSM member ways ────────────────────────────────────
// Each way is a sequence of {lat, lon} nodes. We connect them end-to-end into
// a single closed ring. Handles reversed segments automatically.
function pointsEqual(a, b, eps = 1e-5) {
  return Math.abs(a[0] - b[0]) < eps && Math.abs(a[1] - b[1]) < eps;
}

function stitchWays(ways) {
  const segments = ways.map((w) => (w.geometry || []).map((n) => [n.lon, n.lat]));
  const valid = segments.filter((s) => s.length >= 2);
  if (valid.length === 0) return null;

  const result = [...valid[0]];
  const remaining = valid.slice(1);

  while (remaining.length > 0) {
    const tail = result[result.length - 1];
    let connected = false;
    for (let i = 0; i < remaining.length; i++) {
      const seg = remaining[i];
      if (pointsEqual(tail, seg[0])) {
        result.push(...seg.slice(1));
        remaining.splice(i, 1);
        connected = true;
        break;
      }
      if (pointsEqual(tail, seg[seg.length - 1])) {
        result.push(...[...seg].reverse().slice(1));
        remaining.splice(i, 1);
        connected = true;
        break;
      }
    }
    if (!connected) break;
  }

  // Ensure closed ring
  if (!pointsEqual(result[0], result[result.length - 1])) {
    result.push(result[0]);
  }
  return result.length >= 4 ? result : null;
}

// ── Coordinate simplification ─────────────────────────────────────────────────
// Reduces point count by skipping points closer than `tolerance` degrees.
// Tolerance ~0.001° ≈ 100m — sufficient for a visual overlay.
function simplifyRing(ring, tolerance = 0.001) {
  if (ring.length < 4) return ring;
  const out = [ring[0]];
  for (let i = 1; i < ring.length - 1; i++) {
    const prev = out[out.length - 1];
    const dx = ring[i][0] - prev[0];
    const dy = ring[i][1] - prev[1];
    if (Math.sqrt(dx * dx + dy * dy) >= tolerance) out.push(ring[i]);
  }
  out.push(ring[ring.length - 1]); // keep closing point
  return out;
}

function osmRelationToFeature(rel, areaType) {
  const outerMembers = (rel.members || []).filter(
    (m) => m.type === 'way' && (m.role === 'outer' || m.role === ''),
  );
  const rawRing = stitchWays(outerMembers);
  if (!rawRing) return null;
  const ring = simplifyRing(rawRing);

  const restriction = areaType === 'NP'
    ? 'Zákaz létání drony mimo zastavěná území bez výjimky (§ 29 zákona č. 114/1992 Sb.)'
    : 'Omezené létání – ověřte podmínky pro konkrétní zónu CHKO. Viz letejtezodpovedne.cz';

  return {
    type: 'Feature',
    properties: {
      name: rel.tags?.name || rel.tags?.['name:cs'] || 'Neznámé území',
      type: areaType,
      restriction,
    },
    geometry: { type: 'Polygon', coordinates: [ring] },
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  const features = [];
  const seen = new Set();

  // ── Query 1: National Parks ─────────────────────────────────────────────────
  console.log('Fetching National Parks...');
  // Filter by name server-side (case-insensitive "národní park")
  const npQuery = `[out:json][timeout:120][bbox:${CZ_BBOX}];
relation["boundary"="national_park"]["name"~"národní park",i];
out body geom;`;

  try {
    const r = await overpassPostWithFallback(npQuery);
    if (r.status !== 200) throw new Error(`HTTP ${r.status}: ${r.body.substring(0, 200)}`);
    const data = JSON.parse(r.body);
    const relations = (data.elements || []).filter((e) => e.type === 'relation');
    console.log(`  Found ${relations.length} relations, filtering for Czech NPs...`);

    for (const rel of relations) {
      if (seen.has(rel.id)) continue;
      const name = rel.tags?.name || '';
      // Keep only Czech national parks
      if (!name.toLowerCase().includes('národní park')) continue;
      seen.add(rel.id);
      const feat = osmRelationToFeature(rel, 'NP');
      if (feat) {
        features.push(feat);
        console.log(`  ✓ NP: ${feat.properties.name}`);
      } else {
        console.log(`  ✗ Could not build polygon for: ${name}`);
      }
    }
  } catch (e) {
    console.error('NP query failed:', e.message);
  }

  // ── Query 2: CHKO ───────────────────────────────────────────────────────────
  console.log('\nWaiting 15 s before next query (Overpass rate limit)...');
  await new Promise((r) => setTimeout(r, 15000));
  console.log('Fetching CHKO (Protected Landscape Areas)...');
  // Filter by name server-side (only relations named "CHKO *") to avoid timeout
  const chkoQuery = `[out:json][timeout:120][bbox:${CZ_BBOX}];
relation["boundary"="protected_area"]["protect_class"="5"]["name"~"^CHKO"];
out body geom;`;

  try {
    const r = await overpassPostWithFallback(chkoQuery);
    if (r.status !== 200) throw new Error(`HTTP ${r.status}: ${r.body.substring(0, 200)}`);
    const data = JSON.parse(r.body);
    const relations = (data.elements || []).filter((e) => e.type === 'relation');
    console.log(`  Found ${relations.length} relations, filtering for CHKO...`);

    for (const rel of relations) {
      if (seen.has(rel.id)) continue;
      const name = rel.tags?.name || '';
      // Keep only CZ entries named "CHKO ..." (filter out Slovak "CHKO Biele Karpaty")
      if (!name.toUpperCase().startsWith('CHKO')) continue;
      if (name === 'CHKO Biele Karpaty') continue; // Slovak, not CZ
      seen.add(rel.id);
      const feat = osmRelationToFeature(rel, 'CHKO');
      if (feat) {
        features.push(feat);
        console.log(`  ✓ CHKO: ${feat.properties.name}`);
      } else {
        console.log(`  ✗ Could not build polygon for: ${name}`);
      }
    }
  } catch (e) {
    console.error('CHKO query failed:', e.message);
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  const npCount   = features.filter((f) => f.properties.type === 'NP').length;
  const chkoCount = features.filter((f) => f.properties.type === 'CHKO').length;

  if (features.length === 0) {
    console.error('\nNo features collected.');
    process.exit(1);
  }

  console.log(`\nTotal: ${npCount} NP, ${chkoCount} CHKO (${features.length} features)`);

  const collection = { type: 'FeatureCollection', features };
  const outDir  = path.join(__dirname, '..', 'public', 'data');
  const outFile = path.join(outDir, 'protected-areas-cz.json');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(collection), 'utf-8');

  const sizeKb = Math.round(fs.statSync(outFile).size / 1024);
  console.log(`Saved to: ${outFile} (${sizeKb} KB)`);
  console.log('Done.');
})();
