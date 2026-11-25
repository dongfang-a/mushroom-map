import React, { useCallback, useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { StatusBar, Style } from '@capacitor/status-bar';
import {
  Bookmark,
  Camera,
  Check,
  ChevronDown,
  Crosshair,
  Info,
  Layers,
  Palette,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  BASEMAPS,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  OVERLAYS,
} from './data/mapSources';
import {
  getCurrentSeasonStatus,
  getSpeciesProfile,
  SPECIES_CATALOG,
} from './data/speciesCatalog';
import {
  fetchPadusInBounds,
  fetchWildfiresByYear,
  inspectPointDetails,
  type WildfireYearData,
} from './services/gisService';
import {
  fetchInatObservations,
  getInatHeatmapUrl,
  inatObservationsToGeoJSON,
} from './services/inatService';
import {
  loadBasemap,
  loadElevBandParams,
  loadFilterStrength,
  loadHighContrast,
  loadMushroomOpacity,
  loadOverlayStates,
  loadSpeciesId,
  loadSpeciesOverrides,
  loadViewport,
  loadWaypoints,
  saveBasemap,
  saveElevBandParams,
  saveFilterStrength,
  saveHighContrast,
  saveMushroomOpacity,
  saveOverlayStates,
  saveSpeciesId,
  saveSpeciesOverrides,
  saveViewport,
  saveWaypoints,
} from './services/storageService';
import {
  HIGH_CONTRAST_LEGENDS,
  type IndexedFirePolygon,
  registerCustomTileProtocols,
  setActiveFirePolygons,
  setActiveLegalPolygons,
  setElevBandParams,
  setFilterStrength,
  setHighContrastPalette,
  setLegalMaskEnabled,
  setSpeciesOverrides,
} from './services/tileEngines';
import type {
  BasemapId,
  ElevBandParams,
  FireSummary,
  ForageWaypoint,
  InatObservation,
  InatTimeRange,
  OverlayRuntimeState,
  PnwHotspot,
  PointInspection,
  SpeciesId,
  SpeciesModelOverride,
} from './types/map';
import { LayerDrawer } from './components/LayerDrawer';
import { PointInspector } from './components/PointInspector';
import { SpeciesGuideModal } from './components/SpeciesGuideModal';
import { WaypointsSheet } from './components/WaypointsSheet';

registerCustomTileProtocols();
setFilterStrength(loadFilterStrength());
setHighContrastPalette(loadHighContrast());

function buildInitialStyle(basemapId: BasemapId): maplibregl.StyleSpecification {
  const bm = BASEMAPS.find((b) => b.id === basemapId) || BASEMAPS[0];
  return {
    version: 8,
    sources: {
      basemap: {
        type: 'raster',
        tiles: bm.tiles,
        tileSize: bm.tileSize,
        maxzoom: bm.maxzoom,
        attribution: bm.attribution,
      },
    },
    layers: [
      {
        id: 'basemap-layer',
        type: 'raster',
        source: 'basemap',
      },
    ],
  };
}

export const App: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapReadyRef = useRef(false);
  const tapMarkerRef = useRef<maplibregl.Marker | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const padusAbortRef = useRef<AbortController | null>(null);
  const padusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const padusSigRef = useRef<string>('');
  const inatAbortRef = useRef<AbortController | null>(null);
  const inatItemsRef = useRef<InatObservation[]>([]);
  const wildfireDataMapRef = useRef<Map<number, WildfireYearData>>(new Map());
  const appliedSpeciesKeyRef = useRef<string>('');
  const appliedInatHeatSpeciesRef = useRef<SpeciesId | null>(null);
  const appliedElevRevRef = useRef<number>(-1);
  const activeSpeciesIdRef = useRef<SpeciesId>(loadSpeciesId());
  const filterDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterStrengthRef = useRef<number>(loadFilterStrength());
  const mushroomOpacityRef = useRef<number>(loadMushroomOpacity());

  const [speciesId, setSpeciesId] = useState<SpeciesId>(loadSpeciesId);
  const [speciesOverrides, setSpeciesOverridesState] = useState<
    Partial<Record<SpeciesId, SpeciesModelOverride>>
  >(loadSpeciesOverrides);
  const [speciesMenuOpen, setSpeciesMenuOpen] = useState(false);
  const [guideSpeciesId, setGuideSpeciesId] = useState<SpeciesId | null>(null);

  const [basemapId, setBasemapId] = useState<BasemapId>(loadBasemap);
  const [mushroomOpacity, setMushroomOpacityState] = useState<number>(loadMushroomOpacity);
  const [filterStrength, setFilterStrengthState] = useState<number>(loadFilterStrength);
  const [highContrast, setHighContrastState] = useState<boolean>(loadHighContrast);
  const [blinkEnabled, setBlinkEnabled] = useState<boolean>(false);
  const [overlayStates, setOverlayStates] = useState<Record<string, OverlayRuntimeState>>(() => {
    const base = loadOverlayStates();
    const op = loadMushroomOpacity();
    if (base['species-probability']) {
      base['species-probability'] = { ...base['species-probability'], opacity: op };
    }
    return base;
  });
  const [elevBandParams, setElevBandParamsState] =
    useState<ElevBandParams>(loadElevBandParams);

  const [speciesRev, setSpeciesRev] = useState(1);
  const [elevRev, setElevRev] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'layers' | 'spots' | 'fires' | 'basemaps'>('layers');
  const [waypointsOpen, setWaypointsOpen] = useState(false);
  const [waypoints, setWaypoints] = useState<ForageWaypoint[]>(loadWaypoints);
  const [fires, setFires] = useState<FireSummary[]>([]);
  const [firesLoading, setFiresLoading] = useState(false);
  const [inatItems, setInatItems] = useState<InatObservation[]>([]);
  const [inatTotal, setInatTotal] = useState(0);
  const [inatLoading, setInatLoading] = useState(false);
  const [inatTimeRange, setInatTimeRange] = useState<InatTimeRange>('30d');
  const [inatViewportOnly, setInatViewportOnly] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [inspection, setInspection] = useState<PointInspection | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    () => loadViewport()?.center || DEFAULT_CENTER,
  );

  const activeProfile = getSpeciesProfile(speciesId);
  const activeSpeciesParams: SpeciesModelOverride = {
    minElevFt: speciesOverrides[speciesId]?.minElevFt ?? activeProfile.defaults.minElevFt,
    maxElevFt: speciesOverrides[speciesId]?.maxElevFt ?? activeProfile.defaults.maxElevFt,
    minCanopyPct:
      speciesOverrides[speciesId]?.minCanopyPct ?? activeProfile.defaults.minCanopyPct,
    useCanopy: speciesOverrides[speciesId]?.useCanopy ?? activeProfile.defaults.useCanopy,
    burnScarOnly:
      speciesOverrides[speciesId]?.burnScarOnly ?? activeProfile.defaults.burnScarOnly,
  };

  useEffect(() => {
    activeSpeciesIdRef.current = speciesId;
  }, [speciesId]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#111513' }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    setSpeciesOverrides(speciesOverrides);
    saveSpeciesOverrides(speciesOverrides);
    setSpeciesRev((r) => r + 1);
  }, [speciesOverrides]);

  useEffect(() => {
    setElevBandParams(elevBandParams);
    saveElevBandParams(elevBandParams);
    setElevRev((r) => r + 1);
  }, [elevBandParams]);

  useEffect(() => {
    saveOverlayStates(overlayStates);
    setLegalMaskEnabled(!!overlayStates['padus-access']?.visible);
  }, [overlayStates]);

  const handleGlobalMushroomOpacity = useCallback((val: number) => {
    mushroomOpacityRef.current = val;
    setMushroomOpacityState(val);
    saveMushroomOpacity(val);
    setOverlayStates((prev) => ({
      ...prev,
      'species-probability': { ...prev['species-probability'], opacity: val },
    }));
  }, []);

  const handleFilterStrengthChange = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    filterStrengthRef.current = clamped;
    setFilterStrengthState(clamped);
    setFilterStrength(clamped);
    saveFilterStrength(clamped);
    if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
    filterDebounceRef.current = setTimeout(() => {
      setSpeciesRev((r) => r + 1);
    }, 140);
  }, []);

  const handleToggleHighContrast = useCallback(() => {
    setHighContrastState((prev) => {
      const next = !prev;
      setHighContrastPalette(next);
      saveHighContrast(next);
      setSpeciesRev((r) => r + 1);
      showToast(
        next
          ? '已开启高反差热成像色阶（全底图高对比）'
          : '已切换回菌种经典配色（保留 1px 深色描边）',
      );
      return next;
    });
  }, [showToast]);

  const handleToggleBlink = useCallback(() => {
    setBlinkEnabled((prev) => {
      const next = !prev;
      showToast(
        next ? '⚡ 已开启 1Hz 闪烁对比（透视底图等高线/林道）' : '已关闭 1Hz 闪烁对比',
      );
      return next;
    });
  }, [showToast]);

  // 1Hz on/off opacity blink for instant basemap contrast without re-rendering tiles
  const isSpeciesLayerVisible = !!overlayStates['species-probability']?.visible;
  useEffect(() => {
    mushroomOpacityRef.current = mushroomOpacity;
    const map = mapRef.current;
    if (!map || !mapReadyRef.current || !map.getLayer('species-probability')) return;

    if (!blinkEnabled || !isSpeciesLayerVisible) {
      map.setPaintProperty('species-probability', 'raster-opacity', mushroomOpacity);
      return;
    }

    let on = true;
    const timer = window.setInterval(() => {
      const m = mapRef.current;
      if (!m || !m.getLayer('species-probability')) return;
      on = !on;
      m.setPaintProperty(
        'species-probability',
        'raster-opacity',
        on ? mushroomOpacityRef.current : 0,
      );
    }, 500);

    return () => {
      window.clearInterval(timer);
      const m = mapRef.current;
      if (m && m.getLayer('species-probability')) {
        m.setPaintProperty('species-probability', 'raster-opacity', mushroomOpacityRef.current);
      }
    };
  }, [blinkEnabled, isSpeciesLayerVisible, mushroomOpacity, speciesRev]);

  // Select a species from the dropdown: NEVER jump viewport; apply preset companion overlays & show guide popup!
  const handleSelectSpecies = useCallback((nextId: SpeciesId) => {
    const profile = getSpeciesProfile(nextId);
    setSpeciesId(nextId);
    saveSpeciesId(nextId);
    setSpeciesMenuOpen(false);
    setGuideSpeciesId(nextId);
    setSpeciesRev((r) => r + 1);

    // Toggle preset companion overlays cleanly (turn off other species-specific heavy layers)
    const managedPresetIds = [
      'wildfires-2025',
      'wildfires-2024',
      'usda-ssurgo-soil',
      'usfs-second-growth',
      'usfs-wilderness',
      'usfs-mvum',
      'noaa-snow',
      'noaa-precip-7d',
    ];
    const wanted = new Set(profile.presetOverlays);

    setOverlayStates((prev) => {
      const next: Record<string, OverlayRuntimeState> = {
        ...prev,
        'species-probability': { ...prev['species-probability'], visible: true },
      };
      for (const id of managedPresetIds) {
        if (next[id]) {
          next[id] = { ...next[id], visible: wanted.has(id) };
        }
      }
      return next;
    });
  }, []);

  const refreshActiveWildfiresIndex = useCallback(
    (states: Record<string, OverlayRuntimeState>) => {
      const allSummaries: FireSummary[] = [];
      const allPolys: IndexedFirePolygon[] = [];

      for (const ov of OVERLAYS) {
        if (ov.kind === 'wildfire-geojson' && ov.fireYear && states[ov.id]?.visible) {
          const data = wildfireDataMapRef.current.get(ov.fireYear);
          if (data) {
            allSummaries.push(...data.summaries);
            allPolys.push(...data.indexedPolygons);
          }
        }
      }
      allSummaries.sort((a, b) => b.acres - a.acres);
      setFires(allSummaries);
      setActiveFirePolygons(allPolys);
      setSpeciesRev((r) => r + 1);
    },
    [],
  );

  const syncWaypointsOnMap = useCallback((list: ForageWaypoint[]) => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) return;

    const fc: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: list.map((w) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [w.lng, w.lat] },
        properties: { id: w.id, name: w.name, species: w.species },
      })),
    };

    const existing = map.getSource('waypoints-src') as maplibregl.GeoJSONSource | undefined;
    if (existing) {
      existing.setData(fc);
      return;
    }

    map.addSource('waypoints-src', { type: 'geojson', data: fc });
    map.addLayer({
      id: 'waypoints-circle',
      type: 'circle',
      source: 'waypoints-src',
      paint: {
        'circle-radius': 8,
        'circle-color': '#facc15',
        'circle-stroke-width': 2.5,
        'circle-stroke-color': '#111513',
      },
    });
  }, []);

  const loadInatSightings = useCallback(async () => {
    if (inatViewportOnly && (!mapRef.current || !mapReadyRef.current)) return;

    inatAbortRef.current?.abort();
    const ctrl = new AbortController();
    inatAbortRef.current = ctrl;

    let bounds: [number, number, number, number] | null = null;
    if (inatViewportOnly && mapRef.current && mapReadyRef.current) {
      const b = mapRef.current.getBounds();
      bounds = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
    }

    setInatLoading(true);
    try {
      const res = await fetchInatObservations({
        speciesId,
        timeRange: inatTimeRange,
        bounds,
        signal: ctrl.signal,
      });
      inatItemsRef.current = res.items;
      setInatItems(res.items);
      setInatTotal(res.total);

      const map = mapRef.current;
      if (map && mapReadyRef.current) {
        const src = map.getSource('inat-sightings') as maplibregl.GeoJSONSource | undefined;
        if (src) src.setData(inatObservationsToGeoJSON(res.items));
      }
    } catch {
      // ignore aborted/transient network errors
    } finally {
      if (!ctrl.signal.aborted) setInatLoading(false);
    }
  }, [speciesId, inatTimeRange, inatViewportOnly]);

  useEffect(() => {
    loadInatSightings();
  }, [loadInatSightings, mapLoaded]);

  const refreshPadusForViewport = useCallback(
    (immediate = false) => {
      const map = mapRef.current;
      if (!map || !mapReadyRef.current) return;
      if (!overlayStates['padus-access']?.visible) return;
      if (map.getZoom() < 7) return;

      if (padusTimerRef.current) clearTimeout(padusTimerRef.current);

      const run = async () => {
        padusAbortRef.current?.abort();
        const ctrl = new AbortController();
        padusAbortRef.current = ctrl;

        try {
          const b = map.getBounds();
          const res = await fetchPadusInBounds(
            [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
            map.getZoom(),
            ctrl.signal,
          );
          const src = map.getSource('padus-access') as maplibregl.GeoJSONSource | undefined;
          if (src) src.setData(res.geojson);

          setActiveLegalPolygons(res.legalPolygons, res.prohibitedPolygons);
          const sig = `${res.legalPolygons.length}:${res.prohibitedPolygons.length}:${Math.round(b.getCenter().lng * 20)},${Math.round(b.getCenter().lat * 20)}`;
          if (sig !== padusSigRef.current) {
            padusSigRef.current = sig;
            setSpeciesRev((r) => r + 1);
          }
        } catch {
          // ignore aborted bbox queries
        }
      };

      if (immediate) {
        run();
      } else {
        padusTimerRef.current = setTimeout(run, 320);
      }
    },
    [overlayStates],
  );

  // Initialize MapLibre instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const savedVp = loadViewport();
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: buildInitialStyle(basemapId),
      center: savedVp?.center || DEFAULT_CENTER,
      zoom: savedVp?.zoom || DEFAULT_ZOOM,
      minZoom: 3,
      maxZoom: 18,
      attributionControl: false,
      pitchWithRotate: false,
      dragRotate: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      mapReadyRef.current = true;
      setMapLoaded(true);
      const c = map.getCenter();
      setMapCenter([c.lng, c.lat]);
      syncWaypointsOnMap(loadWaypoints());
    });

    map.on('moveend', () => {
      const c = map.getCenter();
      const z = map.getZoom();
      setMapCenter([c.lng, c.lat]);
      saveViewport([c.lng, c.lat], z);
    });

    map.on('click', async (e) => {
      setSpeciesMenuOpen(false);
      const { lng, lat } = e.lngLat;
      const curSp = activeSpeciesIdRef.current;

      if (!tapMarkerRef.current) {
        tapMarkerRef.current = new maplibregl.Marker({ color: '#facc15' })
          .setLngLat([lng, lat])
          .addTo(map);
      } else {
        tapMarkerRef.current.setLngLat([lng, lat]);
      }

      const wildfireLayerIds = OVERLAYS.filter((o) => o.kind === 'wildfire-geojson')
        .map((o) => `${o.id}-fill`)
        .filter((id) => Boolean(map.getLayer(id)));

      const renderedFires: PointInspection['fires'] = [];
      if (wildfireLayerIds.length) {
        const feats = map.queryRenderedFeatures(e.point, { layers: wildfireLayerIds });
        const seen = new Set<string>();
        for (const f of feats) {
          const p = f.properties || {};
          const key = `${p.name}-${p.year}`;
          if (seen.has(key)) continue;
          seen.add(key);
          renderedFires.push({
            name: String(p.name || 'Wildfire'),
            year: Number(p.year || 2024),
            acres: Number(p.acres || 0),
            state: String(p.state || ''),
            rank: String(p.rank || 'C'),
            discoveryDate: p.discoveryDate ? String(p.discoveryDate) : undefined,
          });
        }
      }

      let publicAccess: PointInspection['publicAccess'] = null;
      if (map.getLayer('padus-access-fill')) {
        const padFeats = map.queryRenderedFeatures(e.point, {
          layers: ['padus-access-fill'],
        });
        if (padFeats.length) {
          const priority: Record<string, number> = { prohibited: 3, restricted: 2, legal: 1 };
          const sorted = [...padFeats].sort(
            (a, b) =>
              (priority[String(b.properties?.foraging_status || 'legal')] || 0) -
              (priority[String(a.properties?.foraging_status || 'legal')] || 0),
          );
          const p = sorted[0].properties || {};
          const code = String(p.Pub_Access || '');
          const accessLabel =
            code === 'OA'
              ? '开放访问 (Open)'
              : code === 'RA'
                ? '受限访问 (Restricted)'
                : code === 'XA'
                  ? '禁止进入 (Closed)'
                  : code;
          const status =
            p.foraging_status === 'prohibited' || p.foraging_status === 'restricted'
              ? p.foraging_status
              : 'legal';
          publicAccess = {
            status,
            statusLabel: String(p.foraging_label || '公共土地'),
            ruleHint: String(p.foraging_rule || ''),
            access: accessLabel,
            unitName: String(p.Unit_Nm || ''),
            manager: String(p.MngNm_Desc || p.MngTp_Desc || ''),
            designation: String(p.DesTp_Desc || ''),
          };
        }
      }

      let tappedInat: InatObservation | null = null;
      if (map.getLayer('inat-sightings-circle')) {
        const inatFeats = map.queryRenderedFeatures(e.point, {
          layers: ['inat-sightings-circle'],
        });
        if (inatFeats.length) {
          const hitId = Number(inatFeats[0].properties?.id);
          tappedInat = inatItemsRef.current.find((it) => it.id === hitId) || null;
        }
      }

      setInspection({
        lng,
        lat,
        loading: true,
        elevationFt: null,
        elevationM: null,
        slopeDeg: null,
        slopePct: null,
        aspectDeg: null,
        aspectDir: null,
        canopyPct: null,
        concavityM: null,
        landformLabel: null,
        activeSpeciesId: curSp,
        activeScore: null,
        activeTier: null,
        inatSighting: tappedInat,
        soil: null,
        fires: renderedFires,
        publicAccess,
        weather: null,
      });

      const full = await inspectPointDetails(
        lng,
        lat,
        curSp,
        renderedFires,
        publicAccess,
        filterStrengthRef.current,
      );
      setInspection({ ...full, inatSighting: tappedInat });
    });

    mapRef.current = map;

    return () => {
      mapReadyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectBasemap = useCallback(
    (nextId: BasemapId) => {
      setBasemapId(nextId);
      saveBasemap(nextId);
      const map = mapRef.current;
      if (!map || !mapReadyRef.current) return;

      const bm = BASEMAPS.find((b) => b.id === nextId);
      if (!bm) return;

      const nextBottomLayerId = map
        .getStyle()
        .layers?.find((l) => l.id !== 'basemap-layer')?.id;
      if (map.getLayer('basemap-layer')) map.removeLayer('basemap-layer');
      if (map.getSource('basemap')) map.removeSource('basemap');

      map.addSource('basemap', {
        type: 'raster',
        tiles: bm.tiles,
        tileSize: bm.tileSize,
        maxzoom: bm.maxzoom,
        attribution: bm.attribution,
      });
      map.addLayer(
        { id: 'basemap-layer', type: 'raster', source: 'basemap' },
        nextBottomLayerId,
      );
      map.triggerRepaint();
      showToast(`已切换底图：${bm.name}`);
    },
    [showToast],
  );

  // Sync all map layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyOverlays = async () => {
      if (!mapReadyRef.current) {
        await new Promise<void>((res) => map.once('load', () => res()));
      }

      // 1. Standard raster overlays (WMS, ArcGIS Export, ArcGIS ImageServer)
      for (const ov of OVERLAYS) {
        const st = overlayStates[ov.id];
        if (!st) continue;

        if (ov.kind === 'wms' || ov.kind === 'arcgis-export' || ov.kind === 'arcgis-image') {
          const exists = Boolean(map.getLayer(ov.id));
          if (st.visible) {
            if (!exists && ov.url) {
              map.addSource(ov.id, {
                type: 'raster',
                tiles: [ov.url],
                tileSize: ov.tileSize || 256,
                minzoom: ov.minzoom ?? 0,
                maxzoom: ov.maxzoom ?? 18,
              });
              map.addLayer({
                id: ov.id,
                type: 'raster',
                source: ov.id,
                paint: { 'raster-opacity': st.opacity },
              });
            } else if (exists) {
              map.setLayoutProperty(ov.id, 'visibility', 'visible');
              map.setPaintProperty(ov.id, 'raster-opacity', st.opacity);
            }
          } else if (exists) {
            map.setLayoutProperty(ov.id, 'visibility', 'none');
          }
        }
      }

      // 2. Elevation Band protocol layer
      const elevSt = overlayStates['elevation-band'];
      if (elevSt) {
        const srcId = 'elevation-band';
        const exists = Boolean(map.getLayer(srcId));
        if (elevSt.visible) {
          if (!exists || appliedElevRevRef.current !== elevRev) {
            if (map.getLayer(srcId)) map.removeLayer(srcId);
            if (map.getSource(srcId)) map.removeSource(srcId);
            map.addSource(srcId, {
              type: 'raster',
              tiles: [`elevband://{z}/{x}/{y}?v=${elevRev}`],
              tileSize: 256,
              minzoom: 5,
              maxzoom: 14,
            });
            map.addLayer({
              id: srcId,
              type: 'raster',
              source: srcId,
              paint: { 'raster-opacity': elevSt.opacity },
            });
            appliedElevRevRef.current = elevRev;
          } else {
            map.setLayoutProperty(srcId, 'visibility', 'visible');
            map.setPaintProperty(srcId, 'raster-opacity', elevSt.opacity);
          }
        } else if (exists) {
          map.setLayoutProperty(srcId, 'visibility', 'none');
        }
      }

      // 3. Legal Foraging Zones (borderless subtle fill for legal zones only)
      const padSt = overlayStates['padus-access'];
      if (padSt) {
        if (padSt.visible) {
          if (!map.getSource('padus-access')) {
            map.addSource('padus-access', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] },
            });
            map.addLayer({
              id: 'padus-access-fill',
              type: 'fill',
              source: 'padus-access',
              paint: {
                'fill-color': '#10b981',
                'fill-opacity': [
                  'case',
                  ['==', ['get', 'foraging_status'], 'legal'],
                  padSt.opacity,
                  0,
                ],
              },
            });
          } else {
            map.setLayoutProperty('padus-access-fill', 'visibility', 'visible');
            map.setPaintProperty('padus-access-fill', 'fill-opacity', [
              'case',
              ['==', ['get', 'foraging_status'], 'legal'],
              padSt.opacity,
              0,
            ]);
          }
          refreshPadusForViewport(true);
        } else if (map.getLayer('padus-access-fill')) {
          map.setLayoutProperty('padus-access-fill', 'visibility', 'none');
        }
      }

      // 4. Wildfire GeoJSON layers (NIFC)
      let anyFireNeedsFetch = false;
      for (const ov of OVERLAYS) {
        if (ov.kind !== 'wildfire-geojson' || !ov.fireYear) continue;
        const st = overlayStates[ov.id];
        if (!st) continue;
        const fillId = `${ov.id}-fill`;
        const lineId = `${ov.id}-line`;

        if (st.visible) {
          if (!wildfireDataMapRef.current.has(ov.fireYear)) {
            anyFireNeedsFetch = true;
            setFiresLoading(true);
            fetchWildfiresByYear(ov.fireYear)
              .then((data) => {
                wildfireDataMapRef.current.set(ov.fireYear!, data);
                const m = mapRef.current;
                if (m && mapReadyRef.current) {
                  if (!m.getSource(ov.id)) {
                    m.addSource(ov.id, { type: 'geojson', data: data.geojson });
                    m.addLayer({
                      id: fillId,
                      type: 'fill',
                      source: ov.id,
                      paint: {
                        'fill-color': ov.color,
                        'fill-opacity': Math.min(0.26, st.opacity * 0.28),
                      },
                    });
                    m.addLayer({
                      id: lineId,
                      type: 'line',
                      source: ov.id,
                      paint: {
                        'line-color': ov.color,
                        'line-width': ['interpolate', ['linear'], ['zoom'], 5, 1.2, 11, 2.5],
                        'line-opacity': st.opacity,
                      },
                    });
                  } else {
                    (m.getSource(ov.id) as maplibregl.GeoJSONSource).setData(data.geojson);
                  }
                }
                refreshActiveWildfiresIndex(overlayStates);
              })
              .catch(() => {
                showToast(`${ov.shortName} 加载失败，请检查网络`);
              })
              .finally(() => setFiresLoading(false));
          } else {
            const data = wildfireDataMapRef.current.get(ov.fireYear)!;
            if (!map.getSource(ov.id)) {
              map.addSource(ov.id, { type: 'geojson', data: data.geojson });
              map.addLayer({
                id: fillId,
                type: 'fill',
                source: ov.id,
                paint: {
                  'fill-color': ov.color,
                  'fill-opacity': Math.min(0.26, st.opacity * 0.28),
                },
              });
              map.addLayer({
                id: lineId,
                type: 'line',
                source: ov.id,
                paint: {
                  'line-color': ov.color,
                  'line-width': ['interpolate', ['linear'], ['zoom'], 5, 1.2, 11, 2.5],
                  'line-opacity': st.opacity,
                },
              });
            } else {
              map.setLayoutProperty(fillId, 'visibility', 'visible');
              map.setLayoutProperty(lineId, 'visibility', 'visible');
              map.setPaintProperty(fillId, 'fill-opacity', Math.min(0.26, st.opacity * 0.28));
              map.setPaintProperty(lineId, 'line-opacity', st.opacity);
            }
          }
        } else if (map.getLayer(fillId)) {
          map.setLayoutProperty(fillId, 'visibility', 'none');
          map.setLayoutProperty(lineId, 'visibility', 'none');
        }
      }

      if (!anyFireNeedsFetch) {
        const allSummaries: FireSummary[] = [];
        const allPolys: IndexedFirePolygon[] = [];
        for (const ov of OVERLAYS) {
          if (ov.kind === 'wildfire-geojson' && ov.fireYear && overlayStates[ov.id]?.visible) {
            const d = wildfireDataMapRef.current.get(ov.fireYear);
            if (d) {
              allSummaries.push(...d.summaries);
              allPolys.push(...d.indexedPolygons);
            }
          }
        }
        allSummaries.sort((a, b) => b.acres - a.acres);
        setFires(allSummaries);
        setActiveFirePolygons(allPolys);
      }

      // 5. Unified Real-Time Active Species Suitability Heatmap Layer
      const spSt = overlayStates['species-probability'];
      if (spSt) {
        const srcId = 'species-probability';
        const exists = Boolean(map.getLayer(srcId));
        const key = `${speciesId}:${speciesRev}`;
        if (spSt.visible) {
          if (!exists || appliedSpeciesKeyRef.current !== key) {
            if (map.getLayer(srcId)) map.removeLayer(srcId);
            if (map.getSource(srcId)) map.removeSource(srcId);
            map.addSource(srcId, {
              type: 'raster',
              tiles: [`species://${speciesId}/{z}/{x}/{y}?v=${speciesRev}`],
              tileSize: 256,
              minzoom: 7,
              maxzoom: 14,
            });
            const beforeLine = OVERLAYS.filter((o) => o.kind === 'wildfire-geojson')
              .map((o) => `${o.id}-line`)
              .find((id) => Boolean(map.getLayer(id)));
            map.addLayer(
              {
                id: srcId,
                type: 'raster',
                source: srcId,
                paint: { 'raster-opacity': spSt.opacity },
              },
              beforeLine,
            );
            appliedSpeciesKeyRef.current = key;
          } else {
            map.setLayoutProperty(srcId, 'visibility', 'visible');
            map.setPaintProperty(srcId, 'raster-opacity', spSt.opacity);
          }
        } else if (exists) {
          map.setLayoutProperty(srcId, 'visibility', 'none');
        }
      }

      // 6. iNaturalist Official Historical Density Heatmap Tiles
      const inatHeatSt = overlayStates['inat-heatmap'];
      if (inatHeatSt) {
        const srcId = 'inat-heatmap';
        const exists = Boolean(map.getLayer(srcId));
        if (inatHeatSt.visible) {
          if (!exists || appliedInatHeatSpeciesRef.current !== speciesId) {
            if (map.getLayer(srcId)) map.removeLayer(srcId);
            if (map.getSource(srcId)) map.removeSource(srcId);
            map.addSource(srcId, {
              type: 'raster',
              tiles: [getInatHeatmapUrl(speciesId)],
              tileSize: 256,
              minzoom: 3,
              maxzoom: 16,
            });
            map.addLayer({
              id: srcId,
              type: 'raster',
              source: srcId,
              paint: { 'raster-opacity': inatHeatSt.opacity },
            });
            appliedInatHeatSpeciesRef.current = speciesId;
          } else {
            map.setLayoutProperty(srcId, 'visibility', 'visible');
            map.setPaintProperty(srcId, 'raster-opacity', inatHeatSt.opacity);
          }
        } else if (exists) {
          map.setLayoutProperty(srcId, 'visibility', 'none');
        }
      }

      // 7. iNaturalist Live Sightings GeoJSON Circles
      const inatPtsSt = overlayStates['inat-sightings'];
      if (inatPtsSt) {
        const srcId = 'inat-sightings';
        const layerId = 'inat-sightings-circle';
        if (inatPtsSt.visible) {
          if (!map.getSource(srcId)) {
            map.addSource(srcId, {
              type: 'geojson',
              data: inatObservationsToGeoJSON(inatItemsRef.current),
            });
            map.addLayer({
              id: layerId,
              type: 'circle',
              source: srcId,
              paint: {
                'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 4.5, 11, 6.5, 14, 8.5],
                'circle-color': ['case', ['==', ['get', 'obscured'], 1], '#a855f7', '#ec4899'],
                'circle-opacity': inatPtsSt.opacity,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff',
              },
            });
          } else {
            map.setLayoutProperty(layerId, 'visibility', 'visible');
            map.setPaintProperty(layerId, 'circle-opacity', inatPtsSt.opacity);
          }
        } else if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', 'none');
        }
      }

      // Keep crisp overlays above heatmap
      if (map.getLayer('usgs-nhd-streams')) map.moveLayer('usgs-nhd-streams');
      if (map.getLayer('usfs-trails')) map.moveLayer('usfs-trails');
      if (map.getLayer('inat-sightings-circle')) map.moveLayer('inat-sightings-circle');
      if (map.getLayer('waypoints-circle')) map.moveLayer('waypoints-circle');
    };

    applyOverlays();
  }, [
    overlayStates,
    speciesId,
    speciesRev,
    elevRev,
    refreshActiveWildfiresIndex,
    refreshPadusForViewport,
    showToast,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handler = () => {
      refreshPadusForViewport();
      if (inatViewportOnly) {
        loadInatSightings();
      }
    };
    map.on('moveend', handler);
    return () => {
      map.off('moveend', handler);
    };
  }, [refreshPadusForViewport, inatViewportOnly, loadInatSightings]);

  const handleToggleOverlay = useCallback(
    (id: string) => {
      setOverlayStates((prev) => {
        const nextVisible = !prev[id].visible;
        if (id === 'padus-access') {
          setLegalMaskEnabled(nextVisible);
          setSpeciesRev((r) => r + 1);
          showToast(
            nextVisible
              ? '合法林地 AND 过滤已开启：仅显示合法林地内蘑菇地图'
              : '合法林地过滤已关闭：显示全区域蘑菇地图',
          );
        }
        return {
          ...prev,
          [id]: { ...prev[id], visible: nextVisible },
        };
      });
      if (id.startsWith('wildfires-')) {
        setSpeciesRev((r) => r + 1);
      }
    },
    [showToast],
  );

  const handleOpacityChange = useCallback((id: string, opacity: number) => {
    if (id === 'species-probability') {
      setMushroomOpacityState(opacity);
      saveMushroomOpacity(opacity);
    }
    setOverlayStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], opacity },
    }));
  }, []);

  const handleFlyToFire = useCallback(
    (fire: FireSummary) => {
      const map = mapRef.current;
      if (!map) return;
      map.flyTo({
        center: fire.center,
        zoom: fire.acres > 25000 ? 10.5 : 11.8,
        duration: 1100,
      });
      showToast(`已定位至 ${fire.name} (${fire.year} · ${fire.acres.toLocaleString()} ac)`);
    },
    [showToast],
  );

  const handleFlyToHotspot = useCallback(
    (spot: PnwHotspot) => {
      const map = mapRef.current;
      if (!map) return;
      map.flyTo({ center: spot.center, zoom: spot.zoom, duration: 1100 });
      showToast(`已定位至：${spot.name}`);
    },
    [showToast],
  );

  const handleFlyToInat = useCallback(
    async (obs: InatObservation) => {
      const map = mapRef.current;
      if (!map) return;
      const curSp = activeSpeciesIdRef.current;
      map.flyTo({ center: [obs.lng, obs.lat], zoom: 12.6, duration: 1000 });
      if (!tapMarkerRef.current) {
        tapMarkerRef.current = new maplibregl.Marker({ color: '#ec4899' })
          .setLngLat([obs.lng, obs.lat])
          .addTo(map);
      } else {
        tapMarkerRef.current.setLngLat([obs.lng, obs.lat]);
      }
      setInspection({
        lng: obs.lng,
        lat: obs.lat,
        loading: true,
        elevationFt: null,
        elevationM: null,
        slopeDeg: null,
        slopePct: null,
        aspectDeg: null,
        aspectDir: null,
        canopyPct: null,
        concavityM: null,
        landformLabel: null,
        activeSpeciesId: curSp,
        activeScore: null,
        activeTier: null,
        inatSighting: obs,
        soil: null,
        fires: [],
        publicAccess: null,
        weather: null,
      });
      const full = await inspectPointDetails(
        obs.lng,
        obs.lat,
        curSp,
        [],
        null,
        filterStrengthRef.current,
      );
      setInspection({ ...full, inatSighting: obs });
      showToast(`iNat 实拍点：${obs.placeGuess} (${obs.observedOn})`);
    },
    [showToast],
  );

  const handleLocateMe = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    try {
      let lat: number;
      let lng: number;
      if (Capacitor.isNativePlatform()) {
        const perm = await Geolocation.requestPermissions();
        if (perm.location !== 'granted') {
          showToast('请在系统设置中授予定位权限');
          return;
        }
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } else {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 8000,
          }),
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }

      if (!userMarkerRef.current) {
        const el = document.createElement('div');
        el.style.width = '16px';
        el.style.height = '16px';
        el.style.borderRadius = '50%';
        el.style.background = '#38bdf8';
        el.style.border = '3px solid #ffffff';
        el.style.boxShadow = '0 0 12px rgba(56,189,248,0.85)';
        userMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map);
      } else {
        userMarkerRef.current.setLngLat([lng, lat]);
      }

      map.flyTo({ center: [lng, lat], zoom: 12.5, duration: 900 });
      showToast('已定位至当前位置');
    } catch {
      showToast('无法获取当前 GPS 位置');
    }
  }, [showToast]);

  const handleSaveWaypoint = useCallback(
    (wp: Omit<ForageWaypoint, 'id' | 'createdAt'>) => {
      const created: ForageWaypoint = {
        ...wp,
        id: `${Date.now()}`,
        createdAt: Date.now(),
      };
      const next = [created, ...waypoints];
      setWaypoints(next);
      saveWaypoints(next);
      syncWaypointsOnMap(next);
      showToast(`已保存采菇点位：${created.name}`);
    },
    [waypoints, syncWaypointsOnMap, showToast],
  );

  const handleDeleteWaypoint = useCallback(
    (id: string) => {
      const next = waypoints.filter((w) => w.id !== id);
      setWaypoints(next);
      saveWaypoints(next);
      syncWaypointsOnMap(next);
    },
    [waypoints, syncWaypointsOnMap],
  );

  const speciesMapVisible = !!overlayStates['species-probability']?.visible;
  const legalZonesVisible = !!overlayStates['padus-access']?.visible;
  const activeLegendItems = highContrast ? HIGH_CONTRAST_LEGENDS : activeProfile.legends;
  const activeSeason = getCurrentSeasonStatus(activeProfile.peakMonths);
  const groupedSpecies = (
    [
      {
        tone: 'peak' as const,
        title: `✅ 当前当季（${new Date().getMonth() + 1} 月盛产）`,
        items: SPECIES_CATALOG.filter((sp) => getCurrentSeasonStatus(sp.peakMonths).tone === 'peak'),
      },
      {
        tone: 'shoulder' as const,
        title: '⏳ 季初 · 尾声（临近窗口）',
        items: SPECIES_CATALOG.filter(
          (sp) => getCurrentSeasonStatus(sp.peakMonths).tone === 'shoulder',
        ),
      },
      {
        tone: 'off' as const,
        title: '⛔ 非当季（仅适合提前踩点）',
        items: SPECIES_CATALOG.filter((sp) => getCurrentSeasonStatus(sp.peakMonths).tone === 'off'),
      },
    ]
  ).filter((g) => g.items.length > 0);

  return (
    <div className="app-shell">
      <div ref={mapContainerRef} className="map-container" />

      {/* Fixed Screen Center Green Crosshair (non-interactive) */}
      <div className="center-crosshair" aria-hidden="true">
        <svg viewBox="0 0 28 28" width="28" height="28">
          {/* Dark outer stroke for contrast on white Topo & dark Satellite */}
          <path
            d="M14 2 V10 M14 18 V26 M2 14 H10 M18 14 H26"
            stroke="#060a08"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
          <circle cx="14" cy="14" r="1.9" fill="#060a08" />
          {/* Crisp bright green crosshair */}
          <path
            d="M14 2 V10 M14 18 V26 M2 14 H10 M18 14 H26"
            stroke="#22c55e"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="14" cy="14" r="1.1" fill="#4ade80" />
        </svg>
      </div>

      {/* Top HUD with Dropdown Species Selector & Legal Zones Toggle */}
      <header className="top-bar">
        <div className="quick-chips">
          {/* Dropdown Species Selector */}
          <div className="species-dropdown-wrap">
            <button
              className={`chip-btn gold-active ${activeSeason.tone === 'off' ? 'off-season-chip' : ''}`}
              style={{
                borderColor:
                  activeSeason.tone === 'off' ? '#ef4444' : `${activeProfile.accentColor}cc`,
                background:
                  activeSeason.tone === 'off'
                    ? 'rgba(69, 10, 10, 0.92)'
                    : 'rgba(20, 26, 23, 0.94)',
                color: '#ffffff',
              }}
              onClick={() => setSpeciesMenuOpen((v) => !v)}
              aria-label="Select mushroom species"
            >
              <span>{activeProfile.emoji}</span>
              <span>{activeProfile.shortName}</span>
              {activeSeason.tone === 'off' && <span className="hud-off-badge">非当季</span>}
              <ChevronDown
                size={14}
                color={activeSeason.tone === 'off' ? '#fca5a5' : activeProfile.accentColor}
              />
            </button>

            {speciesMenuOpen && (
              <div className="species-dropdown-menu">
                {groupedSpecies.map((group) => (
                  <div key={group.tone} className={`species-group group-${group.tone}`}>
                    <div className={`species-group-header tone-${group.tone}`}>
                      <span>{group.title}</span>
                      <span className="species-group-count">{group.items.length} 种</span>
                    </div>
                    {group.items.map((sp) => {
                      const st = getCurrentSeasonStatus(sp.peakMonths);
                      const isSel = sp.id === speciesId;
                      return (
                        <button
                          key={sp.id}
                          className={`species-option tone-${st.tone} ${isSel ? 'active' : ''}`}
                          onClick={() => handleSelectSpecies(sp.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                            <span style={{ fontSize: 18 }}>{sp.emoji}</span>
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                              >
                                <span>{sp.shortName}</span>
                                <span className={`season-pill-strong tone-${st.tone}`}>
                                  {st.tone === 'peak' ? '当季盛产' : st.tone === 'off' ? '⛔ 非当季' : '⏳ 尾声'}
                                </span>
                              </div>
                              <div style={{ fontSize: 10.5, color: '#9aa9a0', marginTop: 2 }}>
                                {sp.seasonSummary} · {sp.englishName}
                              </div>
                            </div>
                          </div>
                          {isSel && <Check size={15} color={sp.accentColor} />}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className={`chip-btn ${legalZonesVisible ? 'active' : ''}`}
            onClick={() => handleToggleOverlay('padus-access')}
          >
            <ShieldCheck size={13} /> 合法林地
          </button>
        </div>
      </header>

      {/* Right floating action buttons */}
      <div className="fab-column">
        <button
          className="fab-btn primary"
          onClick={() => {
            setDrawerTab('layers');
            setDrawerOpen(true);
          }}
          aria-label="Layers"
        >
          <Layers size={20} />
        </button>

        <button
          className="fab-btn"
          onClick={() => {
            setDrawerTab('spots');
            setDrawerOpen(true);
          }}
          aria-label="iNaturalist live sightings"
        >
          <Camera size={20} color="#f472b6" />
          {inatItems.length > 0 && (
            <span className="fab-badge" style={{ background: '#ec4899', color: '#ffffff' }}>
              {inatItems.length > 99 ? '99+' : inatItems.length}
            </span>
          )}
        </button>

        <button className="fab-btn" onClick={handleLocateMe} aria-label="Locate me">
          <Crosshair size={20} />
        </button>

        <button
          className="fab-btn"
          onClick={() => setWaypointsOpen(true)}
          aria-label="Waypoints"
        >
          <Bookmark size={20} color="#54e36c" />
          {waypoints.length > 0 && <span className="fab-badge">{waypoints.length}</span>}
        </button>
      </div>

      {/* Compact Active Species Legend + Global Mushroom Opacity Slider + Guide Button */}
      {!inspection && speciesMapVisible && (
        <div className="floating-legend">
          <div className="legend-title">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              {activeProfile.emoji} {activeProfile.shortName}
              {activeSeason.tone === 'off' && <span className="hud-off-badge">非当季</span>}
              {legalZonesVisible ? ' · 仅合法区' : ''}
            </span>
            <button
              onClick={() => setGuideSpeciesId(speciesId)}
              style={{
                background: 'none',
                border: 'none',
                color: activeProfile.accentColor,
                cursor: 'pointer',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 10.5,
                fontWeight: 700,
              }}
              aria-label="Show species guide"
            >
              <Info size={12} /> 特色
            </button>
          </div>
          <div className="legend-bar">
            {activeLegendItems.map((l) => (
              <div key={l.label} style={{ background: l.color }} />
            ))}
          </div>
          <div className="legend-labels">
            <span>{activeLegendItems[0].label}</span>
            <span>{activeLegendItems[2].label}</span>
            <span>{activeLegendItems[4].label}</span>
          </div>

          <div className="global-opacity-row">
            <span>蘑菇透明度</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={mushroomOpacity}
              onChange={(e) => handleGlobalMushroomOpacity(Number(e.target.value))}
              aria-label="Global mushroom map opacity"
            />
            <span style={{ minWidth: 30, textAlign: 'right', fontWeight: 700 }}>
              {Math.round(mushroomOpacity * 100)}%
            </span>
          </div>

          <div className="global-opacity-row" style={{ marginTop: 5, paddingTop: 5 }}>
            <span>筛选强度</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={filterStrength}
              onChange={(e) => handleFilterStrengthChange(Number(e.target.value))}
              aria-label="Global selectivity filter strength"
            />
            <span style={{ minWidth: 30, textAlign: 'right', fontWeight: 700 }}>
              {filterStrength}%
            </span>
          </div>

          <div className="legend-actions-row">
            <button
              className={`legend-mini-btn ${blinkEnabled ? 'blink-on' : ''}`}
              onClick={handleToggleBlink}
              aria-label="Toggle 1Hz heatmap blink"
            >
              <Zap size={11} />
              {blinkEnabled ? '1Hz 闪烁中' : '1Hz 闪烁'}
            </button>
            <button
              className={`legend-mini-btn ${highContrast ? 'contrast-on' : ''}`}
              onClick={handleToggleHighContrast}
              aria-label="Toggle high contrast palette"
            >
              <Palette size={11} />
              {highContrast ? '高反差色' : '经典菌色'}
            </button>
          </div>

          {legalZonesVisible && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 5,
                paddingTop: 5,
                borderTop: '1px solid rgba(255,255,255,0.08)',
                fontSize: 10,
                color: '#a7f3d0',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: 'rgba(16, 185, 129, 0.55)',
                }}
              />
              仅显示合法采摘区 (AND 过滤)
            </div>
          )}
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}

      {/* Species Characteristics & Season Popup Modal */}
      <SpeciesGuideModal
        profile={guideSpeciesId ? getSpeciesProfile(guideSpeciesId) : null}
        onClose={() => setGuideSpeciesId(null)}
      />

      <LayerDrawer
        open={drawerOpen}
        initialTab={drawerTab}
        speciesId={speciesId}
        onClose={() => setDrawerOpen(false)}
        basemapId={basemapId}
        onSelectBasemap={handleSelectBasemap}
        overlayStates={overlayStates}
        onToggleOverlay={handleToggleOverlay}
        onOpacityChange={handleOpacityChange}
        speciesParams={activeSpeciesParams}
        onChangeSpeciesParams={(next) =>
          setSpeciesOverridesState((prev) => ({ ...prev, [speciesId]: next }))
        }
        filterStrength={filterStrength}
        onChangeFilterStrength={handleFilterStrengthChange}
        highContrast={highContrast}
        onToggleHighContrast={handleToggleHighContrast}
        blinkEnabled={blinkEnabled}
        onToggleBlink={handleToggleBlink}
        mapCenter={mapCenter}
        elevBandParams={elevBandParams}
        onChangeElevBandParams={setElevBandParamsState}
        fires={fires}
        firesLoading={firesLoading}
        onFlyToFire={handleFlyToFire}
        onFlyToHotspot={handleFlyToHotspot}
        inatItems={inatItems}
        inatTotal={inatTotal}
        inatLoading={inatLoading}
        inatTimeRange={inatTimeRange}
        onChangeInatTimeRange={setInatTimeRange}
        inatViewportOnly={inatViewportOnly}
        onToggleInatViewportOnly={() => setInatViewportOnly((v) => !v)}
        onRefreshInat={loadInatSightings}
        onFlyToInat={handleFlyToInat}
      />

      <WaypointsSheet
        open={waypointsOpen}
        waypoints={waypoints}
        mapCenter={mapCenter}
        onClose={() => setWaypointsOpen(false)}
        onFlyTo={(wp) => {
          mapRef.current?.flyTo({ center: [wp.lng, wp.lat], zoom: 13.5, duration: 900 });
          showToast(`已定位至：${wp.name}`);
        }}
        onDelete={handleDeleteWaypoint}
      />

      <PointInspector
        data={inspection}
        speciesId={speciesId}
        onClose={() => {
          setInspection(null);
          tapMarkerRef.current?.remove();
          tapMarkerRef.current = null;
        }}
        onCopyCoords={(text) => {
          navigator.clipboard?.writeText(text).catch(() => {});
          showToast(`已复制坐标：${text}`);
        }}
        onSaveWaypoint={handleSaveWaypoint}
      />
    </div>
  );
};

export default App;
