import type { InatObservation, InatTimeRange, SpeciesId } from '../types/map';
import { getSpeciesProfile } from '../data/speciesCatalog';

// Broad PNW bounding box (OR, WA, ID panhandle, SW BC)
export const PNW_DEFAULT_BBOX: [number, number, number, number] = [-125.0, 42.0, -116.5, 49.5];

const obsCache = new Map<string, { ts: number; total: number; items: InatObservation[] }>();

function dateDaysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function getInatHeatmapUrl(speciesId: SpeciesId): string {
  const profile = getSpeciesProfile(speciesId);
  return `https://api.inaturalist.org/v1/colored_heatmap/{z}/{x}/{y}.png?taxon_id=${encodeURIComponent(profile.inatTaxonIds)}&color=${encodeURIComponent(profile.inatColor)}`;
}

export async function fetchInatObservations(opts: {
  speciesId: SpeciesId;
  timeRange: InatTimeRange;
  bounds?: [number, number, number, number] | null;
  signal?: AbortSignal;
}): Promise<{ total: number; items: InatObservation[] }> {
  const profile = getSpeciesProfile(opts.speciesId);
  const bbox = opts.bounds || PNW_DEFAULT_BBOX;
  const [swlng, swlat, nelng, nelat] = bbox;

  const cacheKey = `${profile.inatTaxonIds}|${opts.timeRange}|${swlng.toFixed(1)},${swlat.toFixed(1)},${nelng.toFixed(1)},${nelat.toFixed(1)}`;
  const cached = obsCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < 5 * 60 * 1000) {
    return { total: cached.total, items: cached.items };
  }

  const params = new URLSearchParams({
    taxon_id: profile.inatTaxonIds,
    swlat: swlat.toFixed(4),
    swlng: swlng.toFixed(4),
    nelat: nelat.toFixed(4),
    nelng: nelng.toFixed(4),
    quality_grade: 'research',
    geo: 'true',
    per_page: '120',
    order_by: 'observed_on',
    order: 'desc',
  });

  if (opts.timeRange === '30d') {
    params.set('d1', dateDaysAgoIso(30));
  } else if (opts.timeRange === '365d') {
    params.set('d1', dateDaysAgoIso(365));
  }

  const resp = await fetch(`https://api.inaturalist.org/v1/observations?${params.toString()}`, {
    signal: opts.signal,
  });
  if (!resp.ok) {
    throw new Error(`iNaturalist HTTP ${resp.status}`);
  }

  const data = await resp.json();
  const items: InatObservation[] = [];

  for (const r of data.results || []) {
    const coords = r?.geojson?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) continue;
    const rawPhoto: string | undefined = r?.photos?.[0]?.url;
    const photoUrl = rawPhoto ? rawPhoto.replace('square.', 'small.') : null;
    items.push({
      id: Number(r.id),
      taxonId: Number(r?.taxon?.id || 0),
      speciesName: String(r?.taxon?.name || profile.scientificName),
      commonName: String(r?.taxon?.preferred_common_name || profile.englishName),
      observedOn: String(r.observed_on || r.time_observed_at?.slice(0, 10) || ''),
      placeGuess: String(r.place_guess || 'PNW Forest'),
      lng: Number(coords[0]),
      lat: Number(coords[1]),
      photoUrl,
      userLogin: String(r?.user?.login || 'forager'),
      qualityGrade: String(r.quality_grade || 'research'),
      obscured: Boolean(r.obscured || r.geoprivacy === 'obscured'),
      uri: String(r.uri || `https://www.inaturalist.org/observations/${r.id}`),
    });
  }

  const total = Number(data.total_results || items.length);
  obsCache.set(cacheKey, { ts: Date.now(), total, items });
  return { total, items };
}

export function inatObservationsToGeoJSON(items: InatObservation[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: items.map((o) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [o.lng, o.lat] },
      properties: {
        id: o.id,
        observedOn: o.observedOn,
        placeGuess: o.placeGuess,
        obscured: o.obscured ? 1 : 0,
        speciesName: o.speciesName,
        commonName: o.commonName,
        photoUrl: o.photoUrl || '',
        userLogin: o.userLogin,
        uri: o.uri,
      },
    })),
  };
}
