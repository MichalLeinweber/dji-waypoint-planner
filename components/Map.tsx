'use client';

// Interactive Leaflet map component (must be imported with next/dynamic + ssr:false)
// Leaflet uses browser-only APIs (window, document) so it cannot run on the server.
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, useMapEvents } from 'react-leaflet';
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

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

/** Inner component that listens to map click events */
function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface MapProps {
  waypoints: Waypoint[];
  onAddWaypoint: (lat: number, lng: number) => void;
  onUpdateWaypoint: (id: string, lat: number, lng: number) => void;
}

export default function Map({ waypoints, onAddWaypoint, onUpdateWaypoint }: MapProps) {
  // Store marker references keyed by waypoint ID
  const markersRef = useRef<Record<string, L.Marker>>({});
  const mapRef = useRef<L.Map | null>(null);

  // Add/update markers whenever waypoints change
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Remove markers that no longer exist in waypoints
    const currentIds = new Set(waypoints.map((wp) => wp.id));
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      if (!currentIds.has(id)) {
        marker.remove();
        delete markersRef.current[id];
      }
    });

    // Add or update markers for each waypoint
    waypoints.forEach((wp, index) => {
      const existing = markersRef.current[wp.id];
      const icon = createNumberedIcon(index);

      if (existing) {
        // Update position and icon in case order changed
        existing.setLatLng([wp.lat, wp.lng]);
        existing.setIcon(icon);
      } else {
        // Create a new draggable marker
        const marker = L.marker([wp.lat, wp.lng], { icon, draggable: true });
        marker.addTo(map);

        // Update waypoint position after drag ends
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onUpdateWaypoint(wp.id, pos.lat, pos.lng);
        });

        markersRef.current[wp.id] = marker;
      }
    });
  }, [waypoints, onUpdateWaypoint]);

  // Polyline coordinates connecting all waypoints in order
  const polylinePositions = waypoints.map((wp) => [wp.lat, wp.lng] as [number, number]);

  return (
    <MapContainer
      center={[50.08, 14.42]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onMapClick={onAddWaypoint} />
      {polylinePositions.length > 1 && (
        <Polyline positions={polylinePositions} color="#3b82f6" weight={2} opacity={0.8} />
      )}
    </MapContainer>
  );
}
