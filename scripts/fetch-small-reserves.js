// One-time script to fetch Czech small nature reserves from OSM Overpass API
// and save as static GeoJSON.
//
// Usage:  node scripts/fetch-small-reserves.js
// Output: public/data/small-reserves-cz.json
//
// Categories fetched:
//   NPR — Národní přírodní rezervace (National Nature Reserve)
//   NPP — Národní přírodní památka   (National Nature Monument)
//   PR  — Přírodní rezervace          (Nature Reserve)
//   PP  — Přírodní památka            (Nature Monument)
//
// All have boundary=protected_area in OSM and a protection_title tag.
// NPR/NPP are strict (DANGER for drone flights), PR/PP are moderate (WARNING/CAUTION).

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
        'User-Agent': 'DJI-Waypoint-Planner/1.0 (fetch-small-reserves script)',
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

// Try primary server, fall back to mirror on error or rate-limit
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
    if (!connected) {
      console.warn(`  [stitchWays] ${remaining.length} segment(s) could not be connected — dropped`);
      break;
    }
  }

  // Ensure closed ring
  if (!pointsEqual(result[0], result[result.length - 1])) {
    result.push(result[0]);
  }
  return result.length >= 4 ? result : null;
}

// ── Coordinate simplification ─────────────────────────────────────────────────
// Skips points closer than ~100m (0.001°) — enough for a visual overlay.
function simplifyRing(ring, tolerance = 0.001) {
  if (ring.length < 4) return ring;
  const out = [ring[0]];
  for (let i = 1; i < ring.length - 1; i++) {
    const prev = out[out.length - 1];
    const dx = ring[i][0] - prev[0];
    const dy = ring[i][1] - prev[1];
    if (Math.sqrt(dx * dx + dy * dy) >= tolerance) out.push(ring[i]);
  }
  out.push(ring[ring.length - 1]);
  return out;
}

// ── restriction text per category ────────────────────────────────────────────
function restrictionText(type) {
  switch (type) {
    case 'NPR': return 'Národní přírodní rezervace – přísný zákaz létání. Kontaktujte AOPK ČR: ochranaprirody.cz';
    case 'NPP': return 'Národní přírodní památka – zákaz létání. Kontaktujte AOPK ČR: ochranaprirody.cz';
    case 'PR':  return 'Přírodní rezervace – omezené létání. Ověřte podmínky na ochranaprirody.cz';
    case 'PP':  return 'Přírodní památka – ověřte podmínky na ochranaprirody.cz';
    default:    return 'Chráněné území – ověřte podmínky před letem.';
  }
}

// ── Convert an OSM relation to GeoJSON Feature ────────────────────────────────
function osmRelationToFeature(rel, areaType) {
  const outerMembers = (rel.members || []).filter(
    (m) => m.type === 'way' && (m.role === 'outer' || m.role === ''),
  );
  const rawRing = stitchWays(outerMembers);
  if (!rawRing) return null;
  const ring = simplifyRing(rawRing);

  return {
    type: 'Feature',
    properties: {
      name: rel.tags?.name || rel.tags?.['name:cs'] || 'Neznámé území',
      type: areaType,
      restriction: restrictionText(areaType),
    },
    geometry: { type: 'Polygon', coordinates: [ring] },
  };
}

// ── Fetch one category via Overpass ──────────────────────────────────────────
async function fetchCategory(protectionTitle, areaType, seen, features) {
  console.log(`\nFetching ${areaType} (${protectionTitle})...`);
  // Query relations with boundary=protected_area and matching protection_title
  const query = `[out:json][timeout:120][bbox:${CZ_BBOX}];
relation["boundary"="protected_area"]["protection_title"="${protectionTitle}"];
out body geom;`;

  try {
    const r = await overpassPostWithFallback(query);
    if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
    const data = JSON.parse(r.body);
    const relations = (data.elements || []).filter((e) => e.type === 'relation');
    console.log(`  Found ${relations.length} relations for ${areaType}`);

    for (const rel of relations) {
      if (seen.has(rel.id)) continue;
      seen.add(rel.id);
      const feat = osmRelationToFeature(rel, areaType);
      if (feat) {
        features.push(feat);
        console.log(`  ✓ ${areaType}: ${feat.properties.name}`);
      } else {
        console.log(`  ✗ Could not build polygon for: ${rel.tags?.name ?? rel.id}`);
      }
    }
  } catch (e) {
    console.error(`  ${areaType} query failed: ${e.message}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  const features = [];
  const seen = new Set();

  // Fetch all 4 categories — pause 15 s between each to respect Overpass rate limits
  const categories = [
    { title: 'Národní přírodní rezervace', type: 'NPR' },
    { title: 'Národní přírodní památka',   type: 'NPP' },
    { title: 'Přírodní rezervace',          type: 'PR'  },
    { title: 'Přírodní památka',            type: 'PP'  },
  ];

  for (let i = 0; i < categories.length; i++) {
    if (i > 0) {
      console.log('\nWaiting 15 s before next query (Overpass rate limit)...');
      await new Promise((r) => setTimeout(r, 15000));
    }
    await fetchCategory(categories[i].title, categories[i].type, seen, features);
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  const counts = {};
  for (const f of features) {
    counts[f.properties.type] = (counts[f.properties.type] ?? 0) + 1;
  }
  console.log('\nSummary:', counts, `— total ${features.length} features`);

  if (features.length === 0) {
    console.error('No features collected. Check Overpass API or bounding box.');
    process.exit(1);
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  const collection = { type: 'FeatureCollection', features };
  const outDir     = path.join(__dirname, '..', 'public', 'data');
  const outFile    = path.join(outDir, 'small-reserves-cz.json');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(collection), 'utf-8');

  const sizeKb = Math.round(fs.statSync(outFile).size / 1024);
  console.log(`\nSaved to: ${outFile} (${sizeKb} KB)`);
  console.log('Done.');
})();
