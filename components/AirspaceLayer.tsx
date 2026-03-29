'use client';

// Airspace zones overlay — renders CTR/TRA/RESTRICTED/DANGER/PROHIBITED polygons on the Leaflet map.
// Must be rendered as a child of MapContainer so useMap() can access the map instance.
// Zone data is fetched once from OpenAIP and cached in a ref — toggling on/off does not re-fetch.
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchAirspaces, airspaceColor, AirspaceZone } from '@/lib/airspace';

interface AirspaceLayerProps {
  /** Whether to show airspace zones on the map */
  active: boolean;
  /** Called when the API fetch starts or finishes — used to drive the loading state in the sidebar button */
  onLoadingChange: (loading: boolean) => void;
  /** Called when an error occurs (null = clear the error) */
  onError: (error: string | null) => void;
}

export default function AirspaceLayer({ active, onLoadingChange, onError }: AirspaceLayerProps) {
  const map = useMap();

  // Fetched zones are cached here so the API is called only once per session
  const zonesCache = useRef<AirspaceZone[] | null>(null);
  // Reference to the current Leaflet GeoJSON layer for cleanup
  const layerRef = useRef<L.GeoJSON | null>(null);

  // Keep stable refs to callbacks so useEffect deps don't change on every render
  const onLoadingChangeRef = useRef(onLoadingChange);
  const onErrorRef = useRef(onError);
  useEffect(() => { onLoadingChangeRef.current = onLoadingChange; }, [onLoadingChange]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    if (!active) {
      // Remove layer when the toggle is turned off
      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }
      return;
    }

    // Track whether this effect is still the current one (guards against stale async callbacks)
    let cancelled = false;

    function renderLayer(zones: AirspaceZone[]) {
      if (cancelled) return;

      // Remove any previous layer before adding a new one
      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }

      // Convert our zones to a GeoJSON FeatureCollection
      const features = zones.map((zone) => ({
        type: 'Feature' as const,
        properties: {
          name: zone.name,
          typeName: zone.typeName,
          icaoClass: zone.icaoClass,
          color: airspaceColor(zone.type),
        },
        geometry: zone.geometry,
      }));

      const geoJsonData = {
        type: 'FeatureCollection' as const,
        features,
      };

      const layer = L.geoJSON(
        // Leaflet accepts GeoJsonObject — cast needed because our geometry union type
        // is wider than what TypeScript can narrow here
        geoJsonData as Parameters<typeof L.geoJSON>[0],
        {
          // Style each polygon based on the stored color property
          style: (feature) => {
            const color = feature?.properties?.color ?? '#94a3b8';
            return {
              color,
              weight: 1.5,
              opacity: 0.9,
              fillColor: color,
              fillOpacity: 0.12,
            };
          },
          onEachFeature: (feature, featureLayer) => {
            const { name, typeName, icaoClass } = feature.properties ?? {};
            const classLabel = icaoClass ? ` · třída ${icaoClass}` : '';
            // Tooltip shown on hover — sticky follows the cursor
            featureLayer.bindTooltip(
              `<strong>${name}</strong><br/><span>${typeName}${classLabel}</span>`,
              { sticky: true, className: 'airspace-tooltip' },
            );
            // Briefly highlight the zone when the cursor enters it
            featureLayer.on('mouseover', () => {
              (featureLayer as L.Path).setStyle({ fillOpacity: 0.3, weight: 2.5 });
            });
            featureLayer.on('mouseout', () => {
              layer.resetStyle(featureLayer as L.Path);
            });
          },
        },
      );

      layer.addTo(map);
      layerRef.current = layer;
    }

    async function loadAndRender() {
      // If we already have cached data, render immediately without re-fetching
      if (zonesCache.current) {
        renderLayer(zonesCache.current);
        return;
      }

      onLoadingChangeRef.current(true);
      onErrorRef.current(null);

      try {
        const zones = await fetchAirspaces('CZ');
        if (cancelled) return; // component unmounted or toggled off while fetching

        zonesCache.current = zones;
        renderLayer(zones);
      } catch (err) {
        if (!cancelled) {
          onErrorRef.current(
            err instanceof Error ? err.message : 'Nepodařilo se načíst letové zóny.',
          );
        }
      } finally {
        if (!cancelled) {
          onLoadingChangeRef.current(false);
        }
      }
    }

    loadAndRender();

    return () => {
      // Cancel in-flight fetch and remove layer on cleanup
      cancelled = true;
      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, map]);

  return null;
}
