'use client';

// Interactive Leaflet map component (must be imported with next/dynamic + ssr:false)
// Leaflet uses browser-only APIs (window, document) so it cannot run on the server.
import { useEffect, useRef } from 'react';
import type { LatLngExpression } from 'leaflet';
import { MapContainer, TileLayer, Polyline, Rectangle, Polygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Waypoint } from '@/lib/types';

// Fix Leaflet's default icon URLs broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/** Create a numbered colored marker icon for a waypoint */
function createNumberedIcon(index: number): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 12px;
      border: 2px solid #fff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.5);
      cursor: grab;
    ">${index + 1}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

interface EventHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
  onCenterChange: (lat: number, lng: number) => void;
}

/** Inner component that handles map clicks and center-change events.
 *  Callbacks are stored in refs so that useMapEvents always calls the latest
 *  version of the handler even if Leaflet bound the listener only once on mount.
 */
function MapEventHandler({ onMapClick, onCenterChange }: EventHandlerProps) {
  // Keep a ref to the latest callbacks to avoid stale closures in Leaflet listeners
  const onMapClickRef = useRef(onMapClick);
  const onCenterChangeRef = useRef(onCenterChange);

  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onCenterChangeRef.current = onCenterChange; }, [onCenterChange]);

  useMapEvents({
    click(e) {
      onMapClickRef.current(e.latlng.lat, e.latlng.lng);
    },
    moveend(e) {
      const center = e.target.getCenter();
      onCenterChangeRef.current(center.lat, center.lng);
    },
  });
  return null;
}

interface MapProps {
  waypoints: Waypoint[];
  /** Whether waypoint markers can be dragged (only in waypoints mode) */
  draggableMarkers: boolean;
  /** Cursor style hint — 'crosshair' when selecting a point on the map */
  crosshairCursor?: boolean;
  /** Called on every map click */
  onMapClick: (lat: number, lng: number) => void;
  /** Called after drag ends on a marker */
  onUpdateWaypoint: (id: string, lat: number, lng: number) => void;
  /** Called when the map viewport moves — provides the new center */
  onCenterChange: (lat: number, lng: number) => void;
  /** Optional rectangle to draw (grid area selection) — [[swLat,swLng],[neLat,neLng]] */
  gridRect: [[number, number], [number, number]] | null;
  /** Optional facade line — [[aLat,aLng],[bLat,bLng]] */
  facadeLine: [[number, number], [number, number]] | null;
  /** Optional building polygon for 360° facade mode — 4 corners [[lat,lng],...] */
  buildingPolygon: [[number, number], [number, number], [number, number], [number, number]] | null;
  /** When set, the map smoothly flies to these coordinates at the given zoom level */
  flyToTarget: { lat: number; lng: number; zoom: number } | null;
}

export default function MapView({
  waypoints,
  draggableMarkers,
  crosshairCursor,
  onMapClick,
  onUpdateWaypoint,
  onCenterChange,
  gridRect,
  facadeLine,
  buildingPolygon,
  flyToTarget,
}: MapProps) {
  const markersRef = useRef<Record<string, L.Marker>>({});
  const mapRef = useRef<L.Map | null>(null);

  // One-time setup: tile layers control + static compass — runs after MapContainer mounts.
  // <TileLayer> in JSX handles the default OSM rendering; this useEffect only adds
  // the layers control (for switching) and the compass. Both can coexist.
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // ── Layers control ─────────────────────────────────────────────────────────
    // These layer objects are managed by the control. The default OSM display
    // comes from the <TileLayer> JSX element above, so osmLayer here starts
    // unattached — the control adds/removes it when the user switches layers.
    const osmLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' },
    );
    const esriSatellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: '© Esri' },
    );
    const esriTopo = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      { attribution: '© Esri' },
    );

    L.control.layers(
      { '🗺 Mapa': osmLayer, '🛰 Satelit': esriSatellite, '🏔 Terén': esriTopo },
      {},
      { position: 'topright' },
    ).addTo(map);

    // ── Static compass (Leaflet does not rotate — north is always up) ──────────
    const compass = new L.Control({ position: 'bottomleft' });
    compass.onAdd = () => {
      const div = L.DomUtil.create('div');
      div.title = 'Sever je vždy nahoře';
      div.innerHTML = `
        <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
          <circle cx="22" cy="22" r="20" fill="#1a1a2e" stroke="#555" stroke-width="1.5"/>
          <polygon points="22,4 26,22 22,18 18,22" fill="#ef4444"/>
          <polygon points="22,40 26,22 22,26 18,22" fill="white" opacity="0.6"/>
          <text x="22" y="12" text-anchor="middle" fill="white" font-size="8" font-weight="bold">N</text>
          <text x="22" y="38" text-anchor="middle" fill="white" font-size="7" opacity="0.6">S</text>
          <text x="9"  y="26" text-anchor="middle" fill="white" font-size="7" opacity="0.6">W</text>
          <text x="35" y="26" text-anchor="middle" fill="white" font-size="7" opacity="0.6">E</text>
        </svg>`;
      L.DomEvent.disableClickPropagation(div);
      return div;
    };
    compass.addTo(map);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle crosshair cursor by swapping Leaflet CSS classes on the map container.
  // Leaflet adds 'leaflet-grab' by default which overrides any inline cursor style,
  // so we must remove it and add 'leaflet-crosshair' instead.
  useEffect(() => {
    if (!mapRef.current) return;
    const container = mapRef.current.getContainer();
    if (crosshairCursor) {
      container.classList.remove('leaflet-grab');
      container.classList.add('leaflet-crosshair');
    } else {
      container.classList.remove('leaflet-crosshair');
      container.classList.add('leaflet-grab');
    }
  }, [crosshairCursor]);

  // Fly to a location when flyToTarget changes (triggered by address search)
  useEffect(() => {
    if (!mapRef.current || !flyToTarget) return;
    const target: LatLngExpression = [flyToTarget.lat, flyToTarget.lng];
    mapRef.current.flyTo(target, flyToTarget.zoom, { animate: true, duration: 1 });
  }, [flyToTarget]);

  // Sync markers whenever waypoints or draggable flag changes
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const currentIds = new Set(waypoints.map((wp) => wp.id));

    // Remove stale markers
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      if (!currentIds.has(id)) {
        marker.remove();
        delete markersRef.current[id];
      }
    });

    // Add or update each waypoint marker
    waypoints.forEach((wp, index) => {
      const existing = markersRef.current[wp.id];
      const icon = createNumberedIcon(index);

      if (existing) {
        existing.setLatLng([wp.lat, wp.lng]);
        existing.setIcon(icon);
        // Update draggable — Leaflet requires remove/re-add to toggle draggable
        if (existing.dragging) {
          draggableMarkers ? existing.dragging.enable() : existing.dragging.disable();
        }
      } else {
        const marker = L.marker([wp.lat, wp.lng], { icon, draggable: draggableMarkers });
        marker.addTo(map);
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onUpdateWaypoint(wp.id, pos.lat, pos.lng);
        });
        markersRef.current[wp.id] = marker;
      }
    });
  }, [waypoints, draggableMarkers, onUpdateWaypoint]);

  const polylinePositions = waypoints.map((wp) => [wp.lat, wp.lng] as [number, number]);

  return (
    <MapContainer
      center={[50.08, 14.42]}
      zoom={13}
      style={{
        height: '100%',
        width: '100%',
      }}
      ref={mapRef}
    >
      {/* Default OSM tile layer — always visible. The layers control in useEffect
          adds Esri Satellite and Topo as switchable alternatives. */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEventHandler onMapClick={onMapClick} onCenterChange={onCenterChange} />

      {/* Waypoint connection line */}
      {polylinePositions.length > 1 && (
        <Polyline positions={polylinePositions} color="#3b82f6" weight={2} opacity={0.8} />
      )}

      {/* Grid area rectangle */}
      {gridRect && (
        <Rectangle
          bounds={gridRect}
          pathOptions={{ color: '#f59e0b', weight: 2, fillOpacity: 0.1, fillColor: '#f59e0b' }}
        />
      )}

      {/* Facade line between point A and B */}
      {facadeLine && (
        <Polyline
          positions={facadeLine}
          pathOptions={{ color: '#f59e0b', weight: 3, dashArray: '6 4' }}
        />
      )}

      {/* Building polygon for 360° facade mode */}
      {buildingPolygon && (
        <Polygon
          positions={buildingPolygon}
          pathOptions={{ color: '#f59e0b', weight: 2, dashArray: '6 4', fillOpacity: 0.08, fillColor: '#f59e0b' }}
        />
      )}
    </MapContainer>
  );
}
