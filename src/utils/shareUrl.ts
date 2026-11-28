import { BASEMAPS } from '../data/mapSources';
import { SPECIES_CATALOG } from '../data/speciesCatalog';
import type { BasemapId, EcoRegionFilter, SpeciesId } from '../types/map';

const FALLBACK_APP_URL = 'https://dongfang-a.github.io/mushroom-map/';
const VALID_SPECIES = new Set<string>(SPECIES_CATALOG.map((s) => s.id));
const VALID_BASEMAPS = new Set<string>(BASEMAPS.map((b) => b.id));

export interface SharedMapState {
  speciesId?: SpeciesId;
  center?: [number, number];
  zoom?: number;
  filterStrength?: number;
  ecoRegionFilter?: EcoRegionFilter;
  legalOnly?: boolean;
  basemapId?: BasemapId;
}

export function getCleanAppUrl(): string {
  if (typeof window !== 'undefined' && /^https?:$/i.test(window.location.protocol)) {
    return `${window.location.origin}${window.location.pathname}`;
  }
  return FALLBACK_APP_URL;
}

export function buildSharedViewUrl(state: Required<SharedMapState>): string {
  const params = new URLSearchParams({
    sp: state.speciesId,
    lat: state.center[1].toFixed(5),
    lng: state.center[0].toFixed(5),
    z: Math.max(3, Math.min(18, state.zoom)).toFixed(2),
    str: String(Math.max(0, Math.min(100, Math.round(state.filterStrength)))),
    eco: state.ecoRegionFilter,
    legal: state.legalOnly ? '1' : '0',
    bm: state.basemapId,
  });
  return `${getCleanAppUrl()}#${params.toString()}`;
}

export function parseSharedMapState(input: string): SharedMapState | null {
  const raw = input.trim();
  if (!raw) return null;

  let paramStr = '';
  const hashIdx = raw.indexOf('#');
  if (hashIdx >= 0) {
    paramStr = raw.slice(hashIdx + 1);
  } else {
    const qIdx = raw.indexOf('?');
    if (qIdx >= 0) {
      paramStr = raw.slice(qIdx + 1);
    } else if (raw.includes('=') && (raw.includes('sp=') || raw.includes('lat='))) {
      paramStr = raw;
    }
  }

  if (!paramStr) return null;
  const params = new URLSearchParams(paramStr.replace(/^\?/, ''));
  const out: SharedMapState = {};
  let matched = 0;

  const sp = params.get('sp');
  if (sp && VALID_SPECIES.has(sp)) {
    out.speciesId = sp as SpeciesId;
    matched++;
  }

  const latStr = params.get('lat');
  const lngStr = params.get('lng');
  if (latStr !== null && lngStr !== null) {
    const lat = Number(latStr);
    const lng = Number(lngStr);
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      out.center = [lng, lat];
      matched++;
    }
  }

  const zStr = params.get('z');
  if (zStr !== null) {
    const z = Number(zStr);
    if (Number.isFinite(z) && z >= 3 && z <= 18) {
      out.zoom = z;
      matched++;
    }
  }

  const strStr = params.get('str');
  if (strStr !== null) {
    const str = Number(strStr);
    if (Number.isFinite(str) && str >= 0 && str <= 100) {
      out.filterStrength = Math.round(str);
      matched++;
    }
  }

  const eco = params.get('eco');
  if (eco === 'all' || eco === 'west' || eco === 'east') {
    out.ecoRegionFilter = eco;
    matched++;
  }

  const legal = params.get('legal');
  if (legal === '1' || legal === '0') {
    out.legalOnly = legal === '1';
    matched++;
  }

  const bm = params.get('bm');
  if (bm && VALID_BASEMAPS.has(bm)) {
    out.basemapId = bm as BasemapId;
    matched++;
  }

  return matched > 0 ? out : null;
}

export async function copyTextReliable(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back to execCommand copy below
  }

  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function canUseNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export async function shareOrCopyUrl(opts: {
  title: string;
  text: string;
  url: string;
  preferNative?: boolean;
}): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  if (opts.preferNative && canUseNativeShare()) {
    try {
      await navigator.share({
        title: opts.title,
        text: opts.text,
        url: opts.url,
      });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'cancelled';
      }
      // Fall back to clipboard if Web Share failed
    }
  }
  const ok = await copyTextReliable(opts.url);
  return ok ? 'copied' : 'failed';
}
