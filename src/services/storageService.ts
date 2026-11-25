import type {
  BasemapId,
  ElevBandParams,
  ForageWaypoint,
  OverlayRuntimeState,
  SpeciesId,
  SpeciesModelOverride,
} from '../types/map';
import { OVERLAYS } from '../data/mapSources';
import { SPECIES_CATALOG } from '../data/speciesCatalog';

const KEYS = {
  speciesId: 'mm_species_id_v3',
  speciesOverrides: 'mm_species_overrides_v4',
  basemap: 'mm_basemap_v3',
  overlays: 'mm_overlays_v8',
  elevBand: 'mm_elev_band_v2',
  mushroomOpacity: 'mm_mushroom_opacity_v1',
  filterStrength: 'mm_filter_strength_v1',
  highContrast: 'mm_high_contrast_v1',
  waypoints: 'mm_waypoints_v1',
  viewport: 'mm_viewport_v3',
};

const VALID_SPECIES = new Set<string>(SPECIES_CATALOG.map((s) => s.id));

export function loadSpeciesId(): SpeciesId {
  const saved = localStorage.getItem(KEYS.speciesId);
  return saved && VALID_SPECIES.has(saved) ? (saved as SpeciesId) : 'yellowfoot';
}

export function saveSpeciesId(id: SpeciesId) {
  localStorage.setItem(KEYS.speciesId, id);
}

export function loadSpeciesOverrides(): Partial<Record<SpeciesId, SpeciesModelOverride>> {
  try {
    const raw = localStorage.getItem(KEYS.speciesOverrides);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveSpeciesOverrides(
  overrides: Partial<Record<SpeciesId, SpeciesModelOverride>>,
) {
  localStorage.setItem(KEYS.speciesOverrides, JSON.stringify(overrides));
}

export function loadMushroomOpacity(): number {
  const raw = localStorage.getItem(KEYS.mushroomOpacity);
  const val = raw !== null ? Number(raw) : 0.76;
  return Number.isFinite(val) && val >= 0 && val <= 1 ? val : 0.76;
}

export function saveMushroomOpacity(val: number) {
  localStorage.setItem(KEYS.mushroomOpacity, String(val));
}

export function loadFilterStrength(): number {
  const raw = localStorage.getItem(KEYS.filterStrength);
  const val = raw !== null ? Number(raw) : 50;
  return Number.isFinite(val) && val >= 0 && val <= 100 ? Math.round(val) : 50;
}

export function saveFilterStrength(val: number) {
  localStorage.setItem(KEYS.filterStrength, String(Math.max(0, Math.min(100, Math.round(val)))));
}

export function loadHighContrast(): boolean {
  const raw = localStorage.getItem(KEYS.highContrast);
  if (raw === null) return true;
  return raw === '1' || raw === 'true';
}

export function saveHighContrast(val: boolean) {
  localStorage.setItem(KEYS.highContrast, val ? '1' : '0');
}

export function loadBasemap(): BasemapId {
  const saved = localStorage.getItem(KEYS.basemap) as BasemapId | null;
  return saved || 'usgs-topo';
}

export function saveBasemap(id: BasemapId) {
  localStorage.setItem(KEYS.basemap, id);
}

export function loadOverlayStates(): Record<string, OverlayRuntimeState> {
  const defaults: Record<string, OverlayRuntimeState> = {};
  for (const ov of OVERLAYS) {
    defaults[ov.id] = { visible: ov.defaultVisible, opacity: ov.defaultOpacity };
  }
  try {
    const raw = localStorage.getItem(KEYS.overlays);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Record<string, Partial<OverlayRuntimeState>>;
    for (const ov of OVERLAYS) {
      if (parsed[ov.id]) {
        defaults[ov.id] = {
          visible:
            typeof parsed[ov.id].visible === 'boolean'
              ? parsed[ov.id].visible!
              : ov.defaultVisible,
          opacity:
            typeof parsed[ov.id].opacity === 'number'
              ? parsed[ov.id].opacity!
              : ov.defaultOpacity,
        };
      }
    }
  } catch {
    // ignore corrupted storage
  }
  return defaults;
}

export function saveOverlayStates(states: Record<string, OverlayRuntimeState>) {
  const slim: Record<string, { visible: boolean; opacity: number }> = {};
  for (const [k, v] of Object.entries(states)) {
    slim[k] = { visible: v.visible, opacity: v.opacity };
  }
  localStorage.setItem(KEYS.overlays, JSON.stringify(slim));
}

export function loadElevBandParams(): ElevBandParams {
  const def: ElevBandParams = { minFt: 150, maxFt: 3000 };
  try {
    const raw = localStorage.getItem(KEYS.elevBand);
    return raw ? { ...def, ...JSON.parse(raw) } : def;
  } catch {
    return def;
  }
}

export function saveElevBandParams(p: ElevBandParams) {
  localStorage.setItem(KEYS.elevBand, JSON.stringify(p));
}

export function loadWaypoints(): ForageWaypoint[] {
  try {
    const raw = localStorage.getItem(KEYS.waypoints);
    return raw ? (JSON.parse(raw) as ForageWaypoint[]) : [];
  } catch {
    return [];
  }
}

export function saveWaypoints(list: ForageWaypoint[]) {
  localStorage.setItem(KEYS.waypoints, JSON.stringify(list));
}

export function loadViewport(): { center: [number, number]; zoom: number } | null {
  try {
    const raw = localStorage.getItem(KEYS.viewport);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed.center) &&
      parsed.center.length === 2 &&
      typeof parsed.zoom === 'number'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveViewport(center: [number, number], zoom: number) {
  localStorage.setItem(KEYS.viewport, JSON.stringify({ center, zoom }));
}
