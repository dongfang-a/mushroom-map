import maplibregl from 'maplibre-gl';
import { getSpeciesProfile, type SpeciesProfile } from '../data/speciesCatalog';
import type {
  ElevBandParams,
  Lang,
  LegendItem,
  ScoreFactorBreakdown,
  SpeciesId,
  SpeciesModelOverride,
  UnitSettings,
} from '../types/map';
import {
  formatElevation,
  formatElevationRange,
  formatSmallMeters,
  IMPERIAL_UNITS,
} from '../utils/units';

export const HIGH_CONTRAST_PALETTE: Array<[number, number, number, number]> = [
  [6, 182, 212, 165],   // Electric Cyan
  [139, 92, 246, 195],  // Vivid Violet
  [217, 70, 239, 218],  // Bright Fuchsia/Magenta
  [255, 59, 48, 236],   // Neon Vermilion
  [255, 230, 0, 250],   // Blazing Neon Yellow
];

export const HIGH_CONTRAST_LEGENDS: LegendItem[] = [
  { label: '低', labelEn: 'Low', color: '#06b6d4' },
  { label: '中低', labelEn: 'Mod-Low', color: '#8b5cf6' },
  { label: '中等', labelEn: 'Moderate', color: '#d946ef' },
  { label: '中高', labelEn: 'Mod-High', color: '#ff3b30' },
  { label: '极高 · 黄金点', labelEn: 'Prime · Hotspot', color: '#ffe600' },
];

const ORIGIN_SHIFT = 20037508.342789244;
const FEET_PER_METER = 3.28084;

const TRANSPARENT_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIAAAUAAeImBZsAAAAASUVORK5CYII=';

function base64ToUint8Array(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const EMPTY_TILE_BYTES = base64ToUint8Array(TRANSPARENT_PNG_B64);

export interface IndexedFirePolygon {
  bbox: [number, number, number, number];
  rings: number[][][];
}

interface TileCacheEntry<T> {
  value: T;
  ts: number;
}

class SimpleLruCache<T> {
  private map = new Map<string, TileCacheEntry<T>>();
  constructor(private maxEntries: number) {}
  get(key: string): T | undefined {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    hit.ts = Date.now();
    return hit.value;
  }
  set(key: string, value: T) {
    if (this.map.size >= this.maxEntries) {
      let oldestKey = '';
      let oldestTs = Infinity;
      for (const [k, v] of this.map.entries()) {
        if (v.ts < oldestTs) {
          oldestTs = v.ts;
          oldestKey = k;
        }
      }
      if (oldestKey) this.map.delete(oldestKey);
    }
    this.map.set(key, { value, ts: Date.now() });
  }
}

const demCache = new SimpleLruCache<Float32Array>(220);
const canopyCache = new SimpleLruCache<Uint8Array | null>(180);
const landCoverCache = new SimpleLruCache<Uint8Array | null>(180);

// NLCD 2021 Land Cover simplified classes:
// 0 = Urban / Developed (21-24), Water (11), Ice (12), Barren (31), Grassland (71), Pasture/Crops (81-82), Marsh (95)
// 1 = Evergreen (42) / Mixed Forest (43)
// 2 = Deciduous Forest (41) / Woody Wetlands (90)
// 3 = Shrub / Scrub (52) — allowed only for burn-scar morels
const LC_NON_FOREST = 0;
const LC_CONIFER_MIXED = 1;
const LC_DECIDUOUS_RIPARIAN = 2;
const LC_SHRUB = 3;

let currentSpeciesOverrides: Partial<Record<SpeciesId, SpeciesModelOverride>> = {};
let currentElevBandParams: ElevBandParams = { minFt: 150, maxFt: 3000 };
let activeFirePolygons: IndexedFirePolygon[] = [];
let activeLegalPolygons: IndexedFirePolygon[] = [];
let activeProhibitedPolygons: IndexedFirePolygon[] = [];
let legalMaskEnabled = true;
let legalPolygonsLoaded = false;
let filterStrengthPct = 50;
let highContrastPaletteEnabled = true;
let legalPolygonsReadyResolver: (() => void) | null = null;
const legalPolygonsReadyPromise: Promise<void> = new Promise<void>((res) => {
  legalPolygonsReadyResolver = res;
});
let protocolsRegistered = false;

export function setFilterStrength(pct: number) {
  filterStrengthPct = Math.max(0, Math.min(100, Math.round(pct)));
}

export function setHighContrastPalette(enabled: boolean) {
  highContrastPaletteEnabled = enabled;
}

export function setSpeciesOverrides(
  overrides: Partial<Record<SpeciesId, SpeciesModelOverride>>,
) {
  currentSpeciesOverrides = { ...overrides };
}

export function setElevBandParams(params: ElevBandParams) {
  currentElevBandParams = { ...params };
}

export function setActiveFirePolygons(polygons: IndexedFirePolygon[]) {
  activeFirePolygons = polygons;
}

export function setLegalMaskEnabled(enabled: boolean) {
  legalMaskEnabled = enabled;
}

export function setActiveLegalPolygons(
  legal: IndexedFirePolygon[],
  prohibited: IndexedFirePolygon[],
) {
  activeLegalPolygons = legal;
  activeProhibitedPolygons = prohibited;
  legalPolygonsLoaded = true;
  if (legalPolygonsReadyResolver) {
    legalPolygonsReadyResolver();
    legalPolygonsReadyResolver = null;
  }
}

async function waitForInitialLegalPolygons(signal?: AbortSignal) {
  if (legalPolygonsLoaded) return;
  await Promise.race([
    legalPolygonsReadyPromise,
    new Promise<void>((res) => setTimeout(res, 4500)),
    new Promise<void>((res) => {
      if (signal?.aborted) return res();
      signal?.addEventListener('abort', () => res(), { once: true });
    }),
  ]);
}

function resolveEffectiveParams(speciesId: SpeciesId): SpeciesModelOverride & {
  minScoreThreshold: number;
  strengthNorm: number;
} {
  const profile = getSpeciesProfile(speciesId);
  const ov = currentSpeciesOverrides[speciesId];
  const s = Math.max(0, Math.min(1, filterStrengthPct / 100));
  const baseCanopy = ov?.minCanopyPct ?? profile.defaults.minCanopyPct;
  const effectiveCanopy = Math.max(20, Math.min(82, Math.round(baseCanopy + (s - 0.5) * 18)));
  const baseThr = speciesId === 'morel' ? 34 : 42;
  const minScoreThreshold = Math.round(baseThr + s * 28); // 0% => 42, 50% => 56, 75% => 63, 100% => 70

  return {
    // Elevation band strictly preserves species default (e.g. Matsutake 2,600-5,600 ft) unless user edits slider
    minElevFt: ov?.minElevFt ?? profile.defaults.minElevFt,
    maxElevFt: ov?.maxElevFt ?? profile.defaults.maxElevFt,
    minCanopyPct: effectiveCanopy,
    useCanopy: ov?.useCanopy ?? profile.defaults.useCanopy,
    burnScarOnly: ov?.burnScarOnly ?? profile.defaults.burnScarOnly,
    minScoreThreshold,
    strengthNorm: s,
  };
}

export function tileToMercatorBbox(z: number, x: number, y: number): [number, number, number, number] {
  const n = Math.pow(2, z);
  const span = (2 * ORIGIN_SHIFT) / n;
  const minX = -ORIGIN_SHIFT + x * span;
  const maxX = minX + span;
  const maxY = ORIGIN_SHIFT - y * span;
  const minY = maxY - span;
  return [minX, minY, maxX, maxY];
}

export function tileToLonLatBbox(z: number, x: number, y: number): [number, number, number, number] {
  const n = Math.pow(2, z);
  const minLng = (x / n) * 360 - 180;
  const maxLng = ((x + 1) / n) * 360 - 180;
  const latRadTop = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const latRadBot = Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n)));
  const maxLat = (latRadTop * 180) / Math.PI;
  const minLat = (latRadBot * 180) / Math.PI;
  return [minLng, minLat, maxLng, maxLat];
}

function lngLatToTilePixel(
  lng: number,
  lat: number,
  z: number,
  tileX: number,
  tileY: number,
): [number, number] {
  const n = Math.pow(2, z);
  const xFloat = ((lng + 180) / 360) * n;
  const latRad = (Math.max(-85.05, Math.min(85.05, lat)) * Math.PI) / 180;
  const yFloat = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return [(xFloat - tileX) * 256, (yFloat - tileY) * 256];
}

function bboxesOverlap(
  a: [number, number, number, number],
  b: [number, number, number, number],
): boolean {
  return !(a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]);
}

async function fetchImageDataFromUrl(
  url: string,
  signal?: AbortSignal,
  timeoutMs = 9000,
  retries = 1,
): Promise<ImageData | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (signal?.aborted) return null;
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    signal?.addEventListener('abort', onAbort, { once: true });
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const resp = await fetch(url, { mode: 'cors', signal: controller.signal });
      if (!resp.ok) {
        if (attempt < retries && !signal?.aborted) continue;
        return null;
      }
      const blob = await resp.blob();
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        bitmap.close();
        return null;
      }
      ctx.drawImage(bitmap, 0, 0, 256, 256);
      bitmap.close();
      return ctx.getImageData(0, 0, 256, 256);
    } catch {
      if (attempt < retries && !signal?.aborted) {
        await new Promise((r) => setTimeout(r, 250));
        continue;
      }
      return null;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
  }
  return null;
}

async function getDemTileMeters(
  z: number,
  x: number,
  y: number,
  signal?: AbortSignal,
): Promise<Float32Array | null> {
  const clampedZ = Math.min(14, Math.max(0, z));
  const scale = Math.pow(2, z - clampedZ);
  const tx = Math.floor(x / scale);
  const ty = Math.floor(y / scale);
  const key = `${clampedZ}/${tx}/${ty}`;

  const cached = demCache.get(key);
  if (cached) return cached;

  const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${clampedZ}/${tx}/${ty}.png`;
  const img = await fetchImageDataFromUrl(url, signal, 8000);
  if (!img) return null;

  const meters = new Float32Array(256 * 256);
  const d = img.data;
  for (let i = 0, p = 0; i < meters.length; i++, p += 4) {
    meters[i] = d[p] * 256 + d[p + 1] + d[p + 2] / 256 - 32768;
  }
  demCache.set(key, meters);
  return meters;
}

async function getCanopyTileScores(
  z: number,
  x: number,
  y: number,
  signal?: AbortSignal,
): Promise<Uint8Array | null> {
  const lonLat = tileToLonLatBbox(z, x, y);
  if (!bboxesOverlap(lonLat, [-126, 24, -66, 50])) {
    return null;
  }

  const key = `${z}/${x}/${y}`;
  const cached = canopyCache.get(key);
  if (cached !== undefined) return cached;

  const [minX, minY, maxX, maxY] = tileToMercatorBbox(z, x, y);
  const url =
    `https://www.mrlc.gov/geoserver/mrlc_display/nlcd_tcc_conus_2021_v2021-4/wms` +
    `?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=nlcd_tcc_conus_2021_v2021-4` +
    `&STYLES=&FORMAT=image/png&TRANSPARENT=true&SRS=EPSG:3857` +
    `&BBOX=${minX.toFixed(2)},${minY.toFixed(2)},${maxX.toFixed(2)},${maxY.toFixed(2)}` +
    `&WIDTH=256&HEIGHT=256`;

  const img = await fetchImageDataFromUrl(url, signal, 9000, 1);
  if (!img) {
    // Never cache transient network failures so subsequent zooms/pans recover cleanly
    return null;
  }

  const scores = new Uint8Array(256 * 256);
  const d = img.data;
  for (let i = 0, p = 0; i < scores.length; i++, p += 4) {
    const a = d[p + 3];
    if (a < 15) {
      scores[i] = 0;
      continue;
    }
    const r = d[p];
    const g = d[p + 1];
    const b = d[p + 2];
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const greenBias = g >= r ? 1.0 : 0.6;
    const pct = Math.max(12, Math.min(100, Math.round((1.12 - lum * 1.08) * 100 * greenBias)));
    scores[i] = pct;
  }
  canopyCache.set(key, scores);
  return scores;
}

function rgbNear(r: number, g: number, b: number, tr: number, tg: number, tb: number, tol = 18): boolean {
  return Math.abs(r - tr) + Math.abs(g - tg) + Math.abs(b - tb) <= tol;
}

function classifyNlcdLandCoverRgb(r: number, g: number, b: number, a: number): number {
  if (a < 20) return LC_NON_FOREST;
  // Explicitly reject Developed / Urban / Residential / Commercial (NLCD 21-24)
  if (
    rgbNear(r, g, b, 221, 201, 201, 20) || // 21 Developed, Open Space
    rgbNear(r, g, b, 216, 147, 130, 22) || // 22 Developed, Low Intensity (suburbs)
    rgbNear(r, g, b, 237, 0, 0, 28) ||     // 23 Developed, Medium Intensity
    rgbNear(r, g, b, 170, 0, 0, 28)        // 24 Developed, High Intensity
  ) {
    return LC_NON_FOREST;
  }
  // Natural Forest & Woody Wetlands (NLCD 41, 42, 43, 90)
  if (
    rgbNear(r, g, b, 28, 99, 48, 24) ||    // 42 Evergreen Forest
    rgbNear(r, g, b, 181, 201, 142, 24)    // 43 Mixed Forest
  ) {
    return LC_CONIFER_MIXED;
  }
  if (
    rgbNear(r, g, b, 104, 170, 99, 24) ||  // 41 Deciduous Forest
    rgbNear(r, g, b, 186, 216, 234, 24)    // 90 Woody Wetlands (riparian forest)
  ) {
    return LC_DECIDUOUS_RIPARIAN;
  }
  if (rgbNear(r, g, b, 204, 186, 124, 24)) {
    return LC_SHRUB;                       // 52 Shrub / Scrub (burn-morel eligible)
  }
  // Everything else (Water 11, Ice 12, Barren 31, Grassland 71, Pasture 81, Crops 82, Marsh 95)
  return LC_NON_FOREST;
}

async function getLandCoverTileClasses(
  z: number,
  x: number,
  y: number,
  signal?: AbortSignal,
): Promise<Uint8Array | null> {
  const lonLat = tileToLonLatBbox(z, x, y);
  if (!bboxesOverlap(lonLat, [-126, 24, -66, 50])) {
    return null;
  }

  const key = `${z}/${x}/${y}`;
  const cached = landCoverCache.get(key);
  if (cached !== undefined) return cached;

  const [minX, minY, maxX, maxY] = tileToMercatorBbox(z, x, y);
  const url =
    `https://www.mrlc.gov/geoserver/mrlc_display/NLCD_2021_Land_Cover_L48/wms` +
    `?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=NLCD_2021_Land_Cover_L48` +
    `&STYLES=&FORMAT=image/png&TRANSPARENT=true&SRS=EPSG:3857` +
    `&BBOX=${minX.toFixed(2)},${minY.toFixed(2)},${maxX.toFixed(2)},${maxY.toFixed(2)}` +
    `&WIDTH=256&HEIGHT=256`;

  const img = await fetchImageDataFromUrl(url, signal, 9000, 1);
  if (!img) {
    // Never cache transient network failures (prevents poisoning a zoom level with unmasked lake/urban tiles)
    return null;
  }

  const classes = new Uint8Array(256 * 256);
  const d = img.data;
  for (let i = 0, p = 0; i < classes.length; i++, p += 4) {
    classes[i] = classifyNlcdLandCoverRgb(d[p], d[p + 1], d[p + 2], d[p + 3]);
  }
  landCoverCache.set(key, classes);
  return classes;
}

function isLandCoverAllowedForSpecies(speciesId: SpeciesId, lcClass: number | null): boolean {
  if (lcClass === null) return true; // outside CONUS or transient WMS failure
  if (lcClass === LC_CONIFER_MIXED || lcClass === LC_DECIDUOUS_RIPARIAN) return true;
  if (lcClass === LC_SHRUB && speciesId === 'morel') return true;
  return false;
}

function rasterizePolygonsMask(
  z: number,
  x: number,
  y: number,
  includePolys: IndexedFirePolygon[],
  excludePolys: IndexedFirePolygon[] = [],
): Uint8Array | null {
  if (!includePolys.length) return null;
  const tileBbox = tileToLonLatBbox(z, x, y);
  const matching = includePolys.filter((poly) => bboxesOverlap(poly.bbox, tileBbox));
  if (!matching.length) return null;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.fillStyle = '#ffffff';
  for (const poly of matching) {
    ctx.beginPath();
    for (const ring of poly.rings) {
      for (let i = 0; i < ring.length; i++) {
        const [px, py] = lngLatToTilePixel(ring[i][0], ring[i][1], z, x, y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    }
    ctx.fill('evenodd');
  }

  if (excludePolys.length) {
    const exclMatching = excludePolys.filter((poly) => bboxesOverlap(poly.bbox, tileBbox));
    if (exclMatching.length) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
      for (const poly of exclMatching) {
        ctx.beginPath();
        for (const ring of poly.rings) {
          for (let i = 0; i < ring.length; i++) {
            const [px, py] = lngLatToTilePixel(ring[i][0], ring[i][1], z, x, y);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
        }
        ctx.fill('evenodd');
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  const rgba = ctx.getImageData(0, 0, 256, 256).data;
  const mask = new Uint8Array(256 * 256);
  let hasAny = false;
  for (let i = 0, p = 3; i < mask.length; i++, p += 4) {
    if (rgba[p] > 10) {
      mask[i] = 1;
      hasAny = true;
    }
  }
  return hasAny ? mask : null;
}

function computeLocalConcavityM(dem: Float32Array, px: number, py: number): number {
  const xm2 = px >= 2 ? px - 2 : 0;
  const xp2 = px <= 253 ? px + 2 : 255;
  const ym2 = py >= 2 ? py - 2 : 0;
  const yp2 = py <= 253 ? py + 2 : 255;
  const center = dem[py * 256 + px];

  const ringAvg =
    (dem[ym2 * 256 + xm2] +
      dem[ym2 * 256 + px] +
      dem[ym2 * 256 + xp2] +
      dem[py * 256 + xm2] +
      dem[py * 256 + xp2] +
      dem[yp2 * 256 + xm2] +
      dem[yp2 * 256 + px] +
      dem[yp2 * 256 + xp2]) /
    8;

  return ringAvg - center;
}

export function concavityToLandform(concavityM: number, lang: Lang = 'zh'): string {
  if (lang === 'en') {
    if (concavityM >= 1.8) return 'Moist Draw / Hollow (High Retention)';
    if (concavityM >= 0.4) return 'Slight Bench / Swale (Good Moisture)';
    if (concavityM >= -0.8) return 'Gentle Slope (Balanced Drainage)';
    return 'Convex Ridge / Spur (Fast-Draining)';
  }
  if (concavityM >= 1.8) return '湿润沟谷/凹坡 (极佳保水)';
  if (concavityM >= 0.4) return '微凹林台 (保水良好)';
  if (concavityM >= -0.8) return '平缓坡面 (排水适中)';
  return '凸坡/山脊 (强排水偏干)';
}

export function computeSpeciesScore(
  speciesId: SpeciesId,
  elevFt: number,
  slopePct: number,
  aspectDeg: number,
  concavityM: number,
  canopyPct: number | null,
  metersPerPx = 26,
  landCoverClass: number | null = null,
  includeBreakdown = false,
  lang: Lang = 'zh',
  units: UnitSettings = IMPERIAL_UNITS,
): { score: number; tier: string; breakdown?: ScoreFactorBreakdown[] } {
  const profile: SpeciesProfile = getSpeciesProfile(speciesId);
  const params = resolveEffectiveParams(speciesId);
  const w = profile.weights;
  const hardCanopyMin = Math.max(15, params.minCanopyPct - 12);

  // Fast path for 65,536-pixel tile rendering (skip full breakdown when hard-gated)
  if (!includeBreakdown) {
    if (elevFt <= 10) return { score: 0, tier: '水域/滩涂' };
    if (!isLandCoverAllowedForSpecies(speciesId, landCoverClass)) {
      return { score: 0, tier: '城镇/非林地' };
    }
    if (elevFt < params.minElevFt - 350 || elevFt > params.maxElevFt + 500) {
      return { score: 8, tier: '超出海拔带' };
    }
    if (canopyPct !== null && canopyPct < hardCanopyMin) {
      return { score: Math.round(canopyPct * 0.35), tier: '非目标林区' };
    }
    if (slopePct > w.idealSlopeMax + 20) {
      return { score: 12, tier: '过陡峭壁' };
    }
  }

  // 1. Canopy suitability
  let canopyScore = 0.65;
  if (canopyPct !== null) {
    if (canopyPct < hardCanopyMin) {
      canopyScore = 0.04;
    } else if (canopyPct < params.minCanopyPct) {
      canopyScore = Math.max(
        0.05,
        ((canopyPct - hardCanopyMin) / Math.max(1, params.minCanopyPct - hardCanopyMin)) * 0.38,
      );
    } else if (speciesId === 'matsutake' || speciesId === 'porcini' || speciesId === 'leccinum') {
      const ideal = speciesId === 'matsutake' ? 62 : 58;
      const spread = 24;
      canopyScore = Math.max(0.32, Math.exp(-Math.pow((canopyPct - ideal) / spread, 2)));
    } else {
      const t = Math.min(
        1,
        (canopyPct - params.minCanopyPct) / Math.max(1, 90 - params.minCanopyPct),
      );
      canopyScore = 0.38 + Math.pow(t, 0.85) * 0.62;
    }
  }

  // 2. Scale-invariant micro-topographic curvature (%) for moisture/drainage
  const s = params.strengthNorm;
  const curvPct = (concavityM / Math.max(14, 2 * metersPerPx)) * 100;
  let moistureScore: number;
  if (w.moistureMode === 'concave') {
    const base = 0.42 - s * 0.24;
    moistureScore = Math.max(0.06, Math.min(1.0, base + curvPct * 0.2));
  } else if (w.moistureMode === 'well-drained') {
    const base = 0.52 - s * 0.24;
    moistureScore =
      curvPct < -7.5 ? 0.68 : Math.max(0.06, Math.min(1.0, base - curvPct * 0.22));
  } else {
    const idealCurv = speciesId === 'chanterelle' || speciesId === 'hedgehog' ? 0.5 : 0.0;
    const dropRate = 0.11 + s * 0.12;
    moistureScore = Math.max(0.12, Math.min(1.0, 0.96 - Math.abs(curvPct - idealCurv) * dropRate));
  }

  // 3. Aspect suitability
  const aspectRad = (aspectDeg * Math.PI) / 180;
  let aspectScore: number;
  if (w.aspectPref === 'north') {
    aspectScore = slopePct < 3.5 ? 0.55 : Math.pow(0.5 + 0.5 * Math.cos(aspectRad), 1.35);
  } else if (w.aspectPref === 'warm') {
    aspectScore =
      slopePct < 3.5
        ? 0.72
        : 0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.cos(aspectRad - Math.PI * 0.85), 1.15);
  } else {
    aspectScore = slopePct < 3.5 ? 0.75 : 0.48 + 0.42 * (0.5 + 0.5 * Math.cos(aspectRad));
  }

  // 4. Elevation band suitability
  let elevScore: number;
  if (elevFt >= params.minElevFt && elevFt <= params.maxElevFt) {
    const span = Math.max(400, params.maxElevFt - params.minElevFt);
    const mid = (params.minElevFt + params.maxElevFt) / 2;
    const distNorm = Math.abs(elevFt - mid) / (span / 2);
    elevScore = distNorm <= 0.55 ? 1.0 : 1.0 - ((distNorm - 0.55) / 0.45) * 0.36;
  } else if (elevFt < params.minElevFt) {
    const under = params.minElevFt - elevFt;
    elevScore = Math.max(0.05, 0.64 * (1 - under / 350));
  } else {
    const over = elevFt - params.maxElevFt;
    elevScore = Math.max(0.05, 0.64 * (1 - over / 500));
  }

  // 5. Slope suitability
  const idealMax = w.idealSlopeMax;
  const idealMid = idealMax * 0.42;
  let slopeScore: number;
  if (slopePct <= idealMax) {
    slopeScore =
      0.66 + 0.34 * Math.exp(-Math.pow((slopePct - idealMid) / Math.max(4, idealMax * 0.55), 2));
  } else {
    const over = slopePct - idealMax;
    slopeScore = Math.max(0.04, 0.66 * (1 - over / 16));
  }

  // Compute score & tier (respecting hard gates consistently)
  const lcAllowed = isLandCoverAllowedForSpecies(speciesId, landCoverClass);
  const elevOutHard = elevFt < params.minElevFt - 350 || elevFt > params.maxElevFt + 500;
  const canopyOutHard = canopyPct !== null && canopyPct < hardCanopyMin;
  const slopeOutHard = slopePct > w.idealSlopeMax + 20;

  let score: number;
  let tier: string;
  if (elevFt <= 10) {
    score = 0;
    tier = lang === 'en' ? 'Water / Tidal Flat' : '水域/滩涂';
  } else if (!lcAllowed) {
    score = 0;
    tier = lang === 'en' ? 'Urban / Non-Forest' : '城镇/非林地';
  } else if (elevOutHard) {
    score = 8;
    tier = lang === 'en' ? 'Outside Elevation Band' : '超出海拔带';
  } else if (canopyOutHard) {
    score = Math.round((canopyPct ?? 0) * 0.35);
    tier = lang === 'en' ? 'Non-Target Canopy' : '非目标林区';
  } else if (slopeOutHard) {
    score = 12;
    tier = lang === 'en' ? 'Too Steep / Cliff' : '过陡峭壁';
  } else {
    let linear: number;
    if (canopyPct !== null) {
      linear =
        w.canopy * canopyScore +
        w.moisture * moistureScore +
        w.aspect * aspectScore +
        w.elevation * elevScore +
        w.slope * slopeScore;
    } else {
      const noCanopySum = Math.max(0.01, w.moisture + w.aspect + w.elevation + w.slope);
      linear =
        (w.moisture * moistureScore +
          w.aspect * aspectScore +
          w.elevation * elevScore +
          w.slope * slopeScore) /
        noCanopySum;
    }

    const limitingFactor = Math.min(
      canopyPct !== null ? canopyScore : 0.85,
      elevScore,
      slopeScore,
      Math.max(0.28, moistureScore),
    );
    const gateExp = 0.08 + s * 0.28;
    let gated = linear * Math.pow(Math.max(0.05, limitingFactor), gateExp);
    // Deciduous / riparian hardwood affinity bonus for Leccinum (Birch / Aspen / Madrone)
    if (speciesId === 'leccinum' && landCoverClass === LC_DECIDUOUS_RIPARIAN) {
      gated = Math.min(1.0, gated * 1.12);
    }

    score = Math.max(0, Math.min(100, Math.round(gated * 100)));
    const thr = params.minScoreThreshold;
    tier =
      lang === 'en'
        ? score >= thr + 22
          ? 'Prime · Hotspot'
          : score >= thr + 16
            ? 'Mod-High'
            : score >= thr + 10
              ? 'Moderate'
              : score >= thr + 5
                ? 'Mod-Low'
                : score >= thr
                  ? 'Low'
                  : 'Unsuitable'
        : score >= thr + 22
          ? '极高 · 黄金生境 (Prime)'
          : score >= thr + 16
            ? '中高 (Mod-High)'
            : score >= thr + 10
              ? '中等 (Moderate)'
              : score >= thr + 5
                ? '中低 (Mod-Low)'
                : score >= thr
                  ? '低 (Low)'
                  : '不适宜';
  }

  if (!includeBreakdown) return { score, tier };

  const en = lang === 'en';
  const lcName =
    landCoverClass === LC_CONIFER_MIXED
      ? en ? 'Conifer / Mixed Forest' : '针叶/混交林'
      : landCoverClass === LC_DECIDUOUS_RIPARIAN
        ? en ? 'Deciduous / Riparian' : '阔叶/溪岸林'
        : landCoverClass === LC_SHRUB
          ? en ? 'Shrub / Scrub' : '灌丛/迹地'
          : landCoverClass === LC_NON_FOREST
            ? en ? 'Urban / Non-Forest' : '城镇/非林地'
            : en ? 'Unclassified' : '林地未覆';

  const idealAspectLabel =
    w.aspectPref === 'north'
      ? en ? 'Cool North (N/NE/NW)' : '偏北阴坡 (N/NE/NW)'
      : w.aspectPref === 'warm'
        ? en ? 'Warm Edge (E/SE/S/SW)' : '暖阳林缘 (E/SE/S/SW)'
        : en ? 'Any Aspect (Slight N)' : '各坡向皆宜 (微偏北)';

  const idealCanopyLabel =
    speciesId === 'matsutake' || speciesId === 'porcini' || speciesId === 'leccinum'
      ? speciesId === 'leccinum'
        ? en ? '40–75% Hardwood Edge' : '40%–75% 透光阔叶/林缘'
        : en ? '45–78% Semi-Open Conifer' : '45%–78% 半开阔针叶'
      : en
        ? `≥ ${params.minCanopyPct}% Canopy`
        : `≥ ${params.minCanopyPct}% 郁闭`;

  const idealMoistureLabel =
    w.moistureMode === 'concave'
      ? en
        ? `Moist Hollow (≥ ${formatSmallMeters(0.5, units, true)})`
        : `湿润凹坡/沟谷 (≥${formatSmallMeters(0.5, units, true)})`
      : w.moistureMode === 'well-drained'
        ? en
          ? `Drained Ridge (≤ ${formatSmallMeters(-0.4, units, true)})`
          : `凸坡/强排水台地 (≤${formatSmallMeters(-0.4, units, true)})`
        : en
          ? `Gentle Bench (${formatSmallMeters(-0.8, units, true)}..${formatSmallMeters(1.5, units, true)})`
          : `平缓微凹台地 (${formatSmallMeters(-0.8, units, true)}~${formatSmallMeters(1.5, units, true)})`;

  const breakdown: ScoreFactorBreakdown[] = [
    {
      key: 'landcover',
      label: en ? 'Land' : '地类',
      actual: lcName,
      ideal:
        speciesId === 'morel'
          ? en ? 'Forest / Burn Scrub' : '自然林地 / 过火灌丛'
          : speciesId === 'leccinum'
            ? en ? 'Hardwood / Mixed (Birch/Aspen)' : '阔叶/混交林（白桦/颤杨/熊果）'
            : en ? 'Natural Forest' : '自然林地（非城镇）',
      status: !lcAllowed ? 'penalty' : 'bonus',
      summary: !lcAllowed
        ? en ? 'Urban / water / non-forest (excluded)' : '城镇/水域/非林地（硬排除）'
        : speciesId === 'leccinum' && landCoverClass === LC_DECIDUOUS_RIPARIAN
          ? en ? 'Hardwood / riparian host bonus' : '阔叶/溪岸宿主林强加分'
          : en ? 'Natural forest class OK' : '自然森林地类达标',
      hardGate: !lcAllowed,
    },
    {
      key: 'elevation',
      label: en ? 'Elev' : '海拔',
      actual: formatElevation(elevFt, units),
      ideal: formatElevationRange(params.minElevFt, params.maxElevFt, units),
      status: elevOutHard || elevScore < 0.55 ? 'penalty' : elevScore >= 0.85 ? 'bonus' : 'neutral',
      summary: elevOutHard
        ? elevFt < params.minElevFt
          ? en ? 'Too low (outside target band)' : '海拔过低（超出适宜带）'
          : en ? 'Too high (outside target band)' : '海拔过高（超出适宜带）'
        : elevScore >= 0.85
          ? en ? 'Inside core prime elevation band' : '位于核心黄金海拔带'
          : elevScore >= 0.55
            ? en ? 'Near edge of elevation band' : '位于海拔带边缘'
            : elevFt < params.minElevFt
              ? en ? 'Below preferred elevation' : '偏低于理想海拔'
              : en ? 'Above preferred elevation' : '偏高于理想海拔',
      hardGate: elevOutHard,
    },
    {
      key: 'slope',
      label: en ? 'Slope' : '坡度',
      actual: `${slopePct.toFixed(1)}%`,
      ideal: `≤ ${idealMax}%`,
      status: slopeOutHard || slopeScore < 0.45 ? 'penalty' : slopeScore >= 0.78 ? 'bonus' : 'neutral',
      summary: slopeOutHard
        ? en ? `Too steep >${idealMax + 20}% (excluded)` : `坡度过陡 >${idealMax + 20}%（峭壁硬排除）`
        : slopeScore >= 0.78
          ? en ? 'Gentle–moderate slope ideal' : '缓至中坡理想易出菇'
          : slopeScore >= 0.45
            ? en ? 'Slightly steep slope' : '坡度略偏陡'
            : en ? 'Steep & fast-drying slope' : '坡度过陡不利保水与采摘',
      hardGate: slopeOutHard,
    },
    {
      key: 'aspect',
      label: en ? 'Aspect' : '坡向',
      actual: `${degreesToCompass(aspectDeg, lang).split(' ')[0]} ${Math.round(aspectDeg)}°`,
      ideal: idealAspectLabel,
      status: aspectScore >= 0.72 ? 'bonus' : aspectScore >= 0.42 ? 'neutral' : 'penalty',
      summary:
        aspectScore >= 0.72
          ? w.aspectPref === 'warm'
            ? en ? 'Warm sunlit edge bonus' : '光照温暖林缘加分'
            : en ? 'Cool moisture-holding aspect bonus' : '阴凉保水坡向加分'
          : aspectScore >= 0.42
            ? en ? 'Neutral slope aspect' : '坡向表现一般'
            : w.aspectPref === 'warm'
              ? en ? 'Shadier & cooler than preferred' : '偏阴凉光照不足'
              : en ? 'Sun-exposed dry aspect penalty' : '阳坡直晒偏干减分',
    },
    {
      key: 'canopy',
      label: en ? 'Canopy' : '树冠',
      actual: canopyPct !== null ? `${canopyPct}%` : en ? 'N/A' : '未知',
      ideal: idealCanopyLabel,
      status:
        canopyPct === null
          ? 'neutral'
          : canopyOutHard || canopyScore < 0.42
            ? 'penalty'
            : canopyScore >= 0.72
              ? 'bonus'
              : 'neutral',
      summary:
        canopyPct === null
          ? en ? 'No NLCD canopy data' : '暂无 NLCD 树冠数据'
          : canopyOutHard
            ? en ? 'Too open / sparse canopy (excluded)' : '树冠过疏/开阔空地（硬排除）'
            : canopyScore >= 0.72
              ? en ? 'Ideal tree canopy cover' : '树冠郁闭度理想'
              : canopyPct < params.minCanopyPct
                ? en
                  ? `Slightly sparse (< ${params.minCanopyPct}%)`
                  : `树冠偏疏（低于偏好 ${params.minCanopyPct}%）`
                : en ? 'Dense canopy / lower light' : '林冠偏密/透光略差',
      hardGate: canopyOutHard,
    },
    {
      key: 'moisture',
      label: en ? 'Terrain' : '微地形',
      actual: formatSmallMeters(concavityM, units, true),
      ideal: idealMoistureLabel,
      status: moistureScore >= 0.72 ? 'bonus' : moistureScore >= 0.42 ? 'neutral' : 'penalty',
      summary:
        moistureScore >= 0.72
          ? w.moistureMode === 'well-drained'
            ? en ? 'Fast-draining ridge/bench bonus' : '强排水凸坡台地加分'
            : en ? 'Moisture-collecting hollow bonus' : '凹坡汇水保水加分'
          : moistureScore >= 0.42
            ? en ? 'Moderate micro-topography' : '平缓微地形一般'
            : w.moistureMode === 'well-drained'
              ? en ? 'Too wet/depressed for Matsutake' : '低洼偏湿不利松茸'
              : en ? 'Dry convex ridge penalty' : '凸坡偏干缺乏汇水',
    },
  ];

  return { score, tier, breakdown };
}

function speciesScoreToRgba(
  profile: SpeciesProfile,
  score: number,
  threshold: number,
): [number, number, number, number] {
  if (score < threshold) return [0, 0, 0, 0];
  const p = highContrastPaletteEnabled ? HIGH_CONTRAST_PALETTE : profile.palette;
  if (score >= threshold + 22) return p[4];
  if (score >= threshold + 16) return p[3];
  if (score >= threshold + 10) return p[2];
  if (score >= threshold + 5) return p[1];
  return p[0];
}

async function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(EMPTY_TILE_BYTES);
      blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)));
    }, 'image/png');
  });
}

async function renderSpeciesTile(
  speciesId: SpeciesId,
  z: number,
  x: number,
  y: number,
  signal?: AbortSignal,
): Promise<Uint8Array> {
  const profile = getSpeciesProfile(speciesId);
  const params = resolveEffectiveParams(speciesId);

  // 1. Optional burn-scar mask (for Burn Morels)
  let fireMask: Uint8Array | null = null;
  if (speciesId === 'morel' && params.burnScarOnly && activeFirePolygons.length > 0) {
    fireMask = rasterizePolygonsMask(z, x, y, activeFirePolygons);
    if (!fireMask) return EMPTY_TILE_BYTES;
  }

  // 2. Legal public-foraging AND mask (strict: empty legal set in viewport => transparent!)
  let legalMask: Uint8Array | null = null;
  if (legalMaskEnabled) {
    await waitForInitialLegalPolygons(signal);
    if (!legalPolygonsLoaded || activeLegalPolygons.length === 0) {
      return EMPTY_TILE_BYTES;
    }
    legalMask = rasterizePolygonsMask(z, x, y, activeLegalPolygons, activeProhibitedPolygons);
    if (!legalMask) return EMPTY_TILE_BYTES;
  }

  const lonLat = tileToLonLatBbox(z, x, y);
  const inConus = bboxesOverlap(lonLat, [-126, 24, -66, 50]);

  const [dem, canopy, landCover] = await Promise.all([
    getDemTileMeters(z, x, y, signal),
    params.useCanopy ? getCanopyTileScores(z, x, y, signal) : Promise.resolve(null),
    getLandCoverTileClasses(z, x, y, signal),
  ]);
  if (!dem) return EMPTY_TILE_BYTES;
  // Fail-safe inside CONUS: if NLCD Land Cover failed transiently, do NOT render unmasked terrain over lakes/cities
  if (inConus && !landCover) return EMPTY_TILE_BYTES;

  const centerLatRad = (((lonLat[1] + lonLat[3]) / 2) * Math.PI) / 180;
  const metersPerPx = (156543.03392 * Math.cos(centerLatRad)) / Math.pow(2, z);
  const denom = 8 * metersPerPx;
  const hardCanopyMin = Math.max(15, params.minCanopyPct - 12);
  const minElevGateFt = params.minElevFt - 350;
  const maxElevGateFt = params.maxElevFt + 500;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return EMPTY_TILE_BYTES;

  const out = ctx.createImageData(256, 256);
  const outData = out.data;
  const filled = new Uint8Array(256 * 256);
  let filledCount = 0;

  for (let py = 0; py < 256; py++) {
    const ym1 = py > 0 ? py - 1 : 0;
    const yp1 = py < 255 ? py + 1 : 255;
    for (let px = 0; px < 256; px++) {
      const idx = py * 256 + px;
      if (fireMask && !fireMask[idx]) continue;
      if (legalMask && !legalMask[idx]) continue;

      const lcClass = landCover ? landCover[idx] : null;
      if (!isLandCoverAllowedForSpecies(speciesId, lcClass)) continue;

      const h = dem[idx];
      if (h <= 3) continue;
      const elevFt = h * FEET_PER_METER;
      if (elevFt < minElevGateFt || elevFt > maxElevGateFt) continue;

      const canopyPct = canopy ? canopy[idx] : null;
      if (canopyPct !== null && canopyPct < hardCanopyMin) continue;

      const xm1 = px > 0 ? px - 1 : 0;
      const xp1 = px < 255 ? px + 1 : 255;

      // Hydro-flattened lake/reservoir surface guard: skip perfectly flat water sheets (< 0.05m 3x3 variance)
      if (
        Math.abs(dem[ym1 * 256 + xm1] - h) < 0.05 &&
        Math.abs(dem[ym1 * 256 + px] - h) < 0.05 &&
        Math.abs(dem[ym1 * 256 + xp1] - h) < 0.05 &&
        Math.abs(dem[py * 256 + xm1] - h) < 0.05 &&
        Math.abs(dem[py * 256 + xp1] - h) < 0.05 &&
        Math.abs(dem[yp1 * 256 + xm1] - h) < 0.05 &&
        Math.abs(dem[yp1 * 256 + px] - h) < 0.05 &&
        Math.abs(dem[yp1 * 256 + xp1] - h) < 0.05
      ) {
        continue;
      }

      const dzdx =
        (dem[ym1 * 256 + xp1] +
          2 * dem[py * 256 + xp1] +
          dem[yp1 * 256 + xp1] -
          (dem[ym1 * 256 + xm1] + 2 * dem[py * 256 + xm1] + dem[yp1 * 256 + xm1])) /
        denom;
      const dzdy =
        (dem[yp1 * 256 + xm1] +
          2 * dem[yp1 * 256 + px] +
          dem[yp1 * 256 + xp1] -
          (dem[ym1 * 256 + xm1] + 2 * dem[ym1 * 256 + px] + dem[ym1 * 256 + xp1])) /
        denom;

      const slopePct = Math.hypot(dzdx, dzdy) * 100;
      const aspectDeg = ((Math.atan2(-dzdx, dzdy) * 180) / Math.PI + 360) % 360;
      const concavityM = profile.weights.moisture > 0 ? computeLocalConcavityM(dem, px, py) : 0;

      const { score } = computeSpeciesScore(
        speciesId,
        elevFt,
        slopePct,
        aspectDeg,
        concavityM,
        canopyPct,
        metersPerPx,
        lcClass,
      );
      const [r, g, b, a] = speciesScoreToRgba(profile, score, params.minScoreThreshold);
      if (a > 0) {
        const o = idx * 4;
        outData[o] = r;
        outData[o + 1] = g;
        outData[o + 2] = b;
        outData[o + 3] = a;
        filled[idx] = 1;
        filledCount++;
      }
    }
  }

  // 1px dark charcoal outer edge halo so bright/yellow hotspots pop crisply on white Topo & dark Satellite alike
  if (filledCount > 0) {
    for (let py = 0; py < 256; py++) {
      const row = py * 256;
      for (let px = 0; px < 256; px++) {
        const idx = row + px;
        if (filled[idx]) continue;
        const hasNeighbor =
          (px > 0 && filled[idx - 1]) ||
          (px < 255 && filled[idx + 1]) ||
          (py > 0 && filled[idx - 256]) ||
          (py < 255 && filled[idx + 256]);
        if (hasNeighbor) {
          const o = idx * 4;
          outData[o] = 12;
          outData[o + 1] = 16;
          outData[o + 2] = 18;
          outData[o + 3] = 192;
        }
      }
    }
  }

  ctx.putImageData(out, 0, 0);
  return canvasToPngBytes(canvas);
}

async function renderElevBandTile(
  z: number,
  x: number,
  y: number,
  signal?: AbortSignal,
): Promise<Uint8Array> {
  const dem = await getDemTileMeters(z, x, y, signal);
  if (!dem) return EMPTY_TILE_BYTES;

  const { minFt, maxFt } = currentElevBandParams;
  const minM = minFt / FEET_PER_METER;
  const maxM = maxFt / FEET_PER_METER;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return EMPTY_TILE_BYTES;

  const out = ctx.createImageData(256, 256);
  const outData = out.data;

  for (let i = 0; i < 256 * 256; i++) {
    const h = dem[i];
    if (h >= minM && h <= maxM) {
      const o = i * 4;
      const t = maxM > minM ? (h - minM) / (maxM - minM) : 0.5;
      outData[o] = Math.round(30 + t * 180);
      outData[o + 1] = Math.round(180 + t * 40);
      outData[o + 2] = Math.round(245 - t * 140);
      outData[o + 3] = 175;
    }
  }

  ctx.putImageData(out, 0, 0);
  return canvasToPngBytes(canvas);
}

export function registerCustomTileProtocols() {
  if (protocolsRegistered) return;
  protocolsRegistered = true;

  maplibregl.addProtocol('species', async (params, abortController) => {
    const match = params.url.match(/species:\/\/([a-z0-9-]+)\/(\d+)\/(\d+)\/(\d+)/);
    if (!match) return { data: EMPTY_TILE_BYTES };
    const data = await renderSpeciesTile(
      match[1] as SpeciesId,
      Number(match[2]),
      Number(match[3]),
      Number(match[4]),
      abortController.signal,
    );
    return { data };
  });

  maplibregl.addProtocol('elevband', async (params, abortController) => {
    const match = params.url.match(/elevband:\/\/(\d+)\/(\d+)\/(\d+)/);
    if (!match) return { data: EMPTY_TILE_BYTES };
    const data = await renderElevBandTile(
      Number(match[1]),
      Number(match[2]),
      Number(match[3]),
      abortController.signal,
    );
    return { data };
  });
}

export function degreesToCompass(deg: number, lang: Lang = 'zh'): string {
  const dirsZh = ['N (北)', 'NE (东北)', 'E (东)', 'SE (东南)', 'S (南)', 'SW (西南)', 'W (西)', 'NW (西北)'];
  const dirsEn = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const idx = Math.round((deg % 360) / 45) % 8;
  return lang === 'en' ? dirsEn[idx] : dirsZh[idx];
}

export async function sampleLocalTerrainAtLngLat(
  lng: number,
  lat: number,
  speciesId: SpeciesId,
  lang: Lang = 'zh',
  units: UnitSettings = IMPERIAL_UNITS,
) {
  const z = 12;
  const n = Math.pow(2, z);
  const xFloat = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const yFloat = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  const tileX = Math.floor(xFloat);
  const tileY = Math.floor(yFloat);
  const px = Math.max(2, Math.min(253, Math.floor((xFloat - tileX) * 256)));
  const py = Math.max(2, Math.min(253, Math.floor((yFloat - tileY) * 256)));

  const [dem, canopy, landCover] = await Promise.all([
    getDemTileMeters(z, tileX, tileY),
    getCanopyTileScores(z, tileX, tileY),
    getLandCoverTileClasses(z, tileX, tileY),
  ]);

  if (!dem) return null;

  const idx = py * 256 + px;
  const lcClass = landCover ? landCover[idx] : null;
  const elevM = dem[idx];
  const elevFt = elevM * FEET_PER_METER;
  const metersPerPx = (156543.03392 * Math.cos(latRad)) / n;
  const denom = 8 * metersPerPx;

  const dzdx =
    (dem[(py - 1) * 256 + (px + 1)] +
      2 * dem[py * 256 + (px + 1)] +
      dem[(py + 1) * 256 + (px + 1)] -
      (dem[(py - 1) * 256 + (px - 1)] +
        2 * dem[py * 256 + (px - 1)] +
        dem[(py + 1) * 256 + (px - 1)])) /
    denom;
  const dzdy =
    (dem[(py + 1) * 256 + (px - 1)] +
      2 * dem[(py + 1) * 256 + px] +
      dem[(py + 1) * 256 + (px + 1)] -
      (dem[(py - 1) * 256 + (px - 1)] +
        2 * dem[(py - 1) * 256 + px] +
        dem[(py - 1) * 256 + (px + 1)])) /
    denom;

  const grad = Math.hypot(dzdx, dzdy);
  const slopePct = grad * 100;
  const slopeDeg = (Math.atan(grad) * 180) / Math.PI;
  const aspectDeg = ((Math.atan2(-dzdx, dzdy) * 180) / Math.PI + 360) % 360;
  const concavityM = Number(computeLocalConcavityM(dem, px, py).toFixed(1));
  const canopyPct = canopy ? canopy[idx] : null;

  const scored = computeSpeciesScore(
    speciesId,
    elevFt,
    slopePct,
    aspectDeg,
    concavityM,
    canopyPct,
    metersPerPx,
    lcClass,
    true,
    lang,
    units,
  );

  return {
    elevationM: Math.round(elevM),
    elevationFt: Math.round(elevFt),
    slopeDeg: Number(slopeDeg.toFixed(1)),
    slopePct: Number(slopePct.toFixed(1)),
    aspectDeg: Math.round(aspectDeg),
    aspectDir: degreesToCompass(aspectDeg, lang),
    canopyPct,
    concavityM,
    landCoverClass: lcClass,
    metersPerPx,
    landformLabel: concavityToLandform(concavityM, lang),
    activeScore: scored.score,
    activeTier: scored.tier,
    scoreBreakdown: scored.breakdown || [],
  };
}
