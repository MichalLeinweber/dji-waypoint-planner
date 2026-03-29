'use client';

// Airspace zones overlay — uses OpenAIP raster tile layer instead of REST API.
// Tile requests go directly from the browser to OpenAIP tile servers — no CORS issues,
// no server-side proxy needed. Tiles load progressively in the background.
// Must be rendered as a child of MapContainer so useMap() can access the map instance.
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface AirspaceLayerProps {
  /** Whether to show airspace zones on the map */
  active: boolean;
}

export default function AirspaceLayer({ active }: AirspaceLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_OPENAIP_API_KEY;

    if (!active) {
      // Remove tile layer when toggled off
      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }
      return;
    }

    if (!apiKey) {
      console.warn('[AirspaceLayer] NEXT_PUBLIC_OPENAIP_API_KEY is not set');
      return;
    }

    // Add tile layer when toggled on (only if not already added)
    if (!layerRef.current) {
      const layer = L.tileLayer(
        `https://{s}.api.tiles.openaip.net/api/data/airspaces/{z}/{x}/{y}.png?apiKey=${apiKey}`,
        {
          subdomains: ['a', 'b', 'c'],
          attribution: '© <a href="https://www.openaip.net" target="_blank">OpenAIP</a>',
          maxZoom: 18,
          opacity: 0.7,
          // tms: false is the default — do NOT set tms: true (returns blank tiles)
        },
      );
      layer.addTo(map);
      layerRef.current = layer;
    }

    return () => {
      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }
    };
  }, [active, map]);

  return null;
}
