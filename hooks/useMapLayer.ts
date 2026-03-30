// useMapLayer.ts — reusable hook for togglable Leaflet GeoJSON overlay layers.
// Handles: toggle-off, fetch with cache, render, tooltip, and hover interaction.
// Must be called from a component that is a descendant of react-leaflet MapContainer.

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export interface MapLayerOptions {
  /** Whether the layer is currently active (visible) */
  active: boolean;
  /** URL to fetch GeoJSON data from */
  fetchUrl: string;
  /** Convert raw JSON response to a GeoJSON FeatureCollection */
  parseData: (rawData: unknown) => GeoJSON.FeatureCollection;
  /** Return Leaflet path style for a given feature */
  styleFeature: (feature: GeoJSON.Feature) => L.PathOptions;
  /** Return tooltip HTML string for a given feature's properties */
  tooltipHtml: (props: Record<string, unknown>) => string;
  /** Fill opacity applied on mouse hover (default: 0.35) */
  hoverFillOpacity?: number;
}

export function useMapLayer({
  active,
  fetchUrl,
  parseData,
  styleFeature,
  tooltipHtml,
  hoverFillOpacity = 0.35,
}: MapLayerOptions): void {
  const map = useMap();
  // Cache parsed FeatureCollection to avoid re-fetching on every toggle
  const cacheRef = useRef<GeoJSON.FeatureCollection | null>(null);
  // Reference to the active Leaflet GeoJSON layer for cleanup
  const layerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    // Toggle off: remove existing layer and bail out
    if (!active) {
      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }
      return;
    }

    // Cancellation flag prevents async results from applying after unmount/toggle-off
    let cancelled = false;

    function renderLayer(geojson: GeoJSON.FeatureCollection) {
      if (cancelled) return;
      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }

      const layer = L.geoJSON(geojson as Parameters<typeof L.geoJSON>[0], {
        style: (feature) => (feature ? styleFeature(feature as GeoJSON.Feature) : {}),
        onEachFeature: (feature, featureLayer) => {
          const props = (feature.properties ?? {}) as Record<string, unknown>;
          featureLayer.bindTooltip(tooltipHtml(props), {
            sticky: true,
            className: 'airspace-tooltip',
          });
          featureLayer.on('mouseover', () => {
            (featureLayer as L.Path).setStyle({ fillOpacity: hoverFillOpacity, weight: 2.5 });
          });
          featureLayer.on('mouseout', () => {
            layer.resetStyle(featureLayer as L.Path);
          });
        },
      });

      layer.addTo(map);
      layerRef.current = layer;
    }

    async function loadAndRender() {
      // Use cached data if available — avoids re-fetching on every toggle
      if (cacheRef.current) {
        renderLayer(cacheRef.current);
        return;
      }

      try {
        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rawData: unknown = await res.json();
        if (cancelled) return;

        const geojson = parseData(rawData);
        cacheRef.current = geojson;
        renderLayer(geojson);
      } catch (err) {
        console.warn(`[useMapLayer] Failed to load ${fetchUrl}:`, err);
      }
    }

    loadAndRender();

    return () => {
      cancelled = true;
      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }
    };
  // styleFeature / tooltipHtml / parseData are inline functions — intentionally not in deps
  // to avoid re-fetching on every render. Layer only re-initialises on active or map change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, map]);
}
