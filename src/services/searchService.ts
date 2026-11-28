import { getSpeciesProfile, getSpeciesShortName } from '../data/speciesCatalog';
import { UI_TEXT } from '../i18n/translations';
import type { FireSummary, ForageWaypoint, Lang, PnwHotspot } from '../types/map';
import { parseSharedMapState, type SharedMapState } from '../utils/shareUrl';

export interface SearchResultItem {
  id: string;
  kind: 'coord' | 'share-link' | 'waypoint' | 'hotspot' | 'fire' | 'place';
  title: string;
  subtitle: string;
  lng: number;
  lat: number;
  zoom: number;
  sharedState?: SharedMapState;
}

function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function parseDmsCoords(raw: string): { lat: number; lng: number } | null {
  // Matches e.g. 47°25'28.5"N 121°24'49"W or 47° 25.4' N, 121° 24.8' W
  const dmsRegex =
    /([+-]?\d{1,3})\s*[°ºd]\s*(\d{1,2}(?:\.\d+)?)\s*(?:['′m]\s*(\d{1,2}(?:\.\d+)?)\s*["″s]?)?\s*([NSEW])/gi;
  const matches = Array.from(raw.matchAll(dmsRegex));
  if (matches.length !== 2) return null;

  let lat: number | null = null;
  let lng: number | null = null;

  for (const m of matches) {
    const deg = Math.abs(Number(m[1]));
    const min = Number(m[2] || 0);
    const sec = Number(m[3] || 0);
    const hemi = m[4].toUpperCase();
    const val = deg + min / 60 + sec / 3600;
    const signed = hemi === 'S' || hemi === 'W' ? -val : val;
    if (hemi === 'N' || hemi === 'S') lat = signed;
    if (hemi === 'E' || hemi === 'W') lng = signed;
  }

  if (lat !== null && lng !== null && isValidLatLng(lat, lng)) {
    return { lat, lng };
  }
  return null;
}

function parseDecimalCoords(raw: string): { lat: number; lng: number } | null {
  const tokenRegex =
    /^([NSEW])?\s*([+-]?\d{1,3}(?:\.\d+)?)\s*°?\s*([NSEW])?\s*[,;\s/|]+\s*([NSEW])?\s*([+-]?\d{1,3}(?:\.\d+)?)\s*°?\s*([NSEW])?$/i;
  const m = raw.trim().match(tokenRegex);
  if (!m) return null;

  const h1 = (m[1] || m[3] || '').toUpperCase();
  const n1 = Number(m[2]);
  const h2 = (m[4] || m[6] || '').toUpperCase();
  const n2 = Number(m[5]);
  if (!Number.isFinite(n1) || !Number.isFinite(n2)) return null;

  const applyHemi = (num: number, h: string) => {
    if (!h) return num;
    return h === 'S' || h === 'W' ? -Math.abs(num) : Math.abs(num);
  };

  let lat = applyHemi(n1, h1);
  let lng = applyHemi(n2, h2);

  // Swap if first token was explicitly E/W and second was explicitly N/S
  if ((h1 === 'E' || h1 === 'W') && (h2 === 'N' || h2 === 'S')) {
    lat = applyHemi(n2, h2);
    lng = applyHemi(n1, h1);
  }

  // Require at least one decimal point or hemisphere indicator so plain road numbers don't trigger false coord jumps
  const hasExplicitPrecision = /[.,°NSEW]/i.test(raw);
  if (!hasExplicitPrecision) return null;

  if (isValidLatLng(lat, lng)) {
    return { lat, lng };
  }
  return null;
}

export function parseCoordinateOrLink(
  raw: string,
  lang: Lang = 'zh',
): SearchResultItem | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const t = UI_TEXT[lang];

  // 1. MushroomMap shared view link / hash
  const shared = parseSharedMapState(trimmed);
  if (shared?.center) {
    const spShort = shared.speciesId
      ? getSpeciesShortName(getSpeciesProfile(shared.speciesId), lang)
      : '';
    return {
      id: 'parsed-share-link',
      kind: 'share-link',
      title: t.searchShareLinkTitle,
      subtitle: `${spShort ? `${spShort} · ` : ''}${shared.center[1].toFixed(4)}, ${shared.center[0].toFixed(4)}`,
      lng: shared.center[0],
      lat: shared.center[1],
      zoom: shared.zoom ?? 12,
      sharedState: shared,
    };
  }

  // 2. Google Maps / Apple Maps URLs
  const atMatch = trimmed.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,(\d+(?:\.\d+)?)z)?/);
  if (atMatch) {
    const lat = Number(atMatch[1]);
    const lng = Number(atMatch[2]);
    const zoom = atMatch[3] ? Math.max(8, Math.min(16, Number(atMatch[3]))) : 13.2;
    if (isValidLatLng(lat, lng)) {
      return {
        id: 'parsed-gmap-at',
        kind: 'coord',
        title: t.searchDirectCoordTitle,
        subtitle: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        lng,
        lat,
        zoom,
      };
    }
  }

  const bangMatch = trimmed.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (bangMatch) {
    const lat = Number(bangMatch[1]);
    const lng = Number(bangMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return {
        id: 'parsed-gmap-bang',
        kind: 'coord',
        title: t.searchDirectCoordTitle,
        subtitle: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        lng,
        lat,
        zoom: 13.2,
      };
    }
  }

  const qpMatch = trimmed.match(
    /[?&](?:q|ll|daddr|destination|sll)=(-?\d+(?:\.\d+)?)(?:,|%2C|\+|\s)+(-?\d+(?:\.\d+)?)/i,
  );
  if (qpMatch) {
    const lat = Number(qpMatch[1]);
    const lng = Number(qpMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return {
        id: 'parsed-url-qp',
        kind: 'coord',
        title: t.searchDirectCoordTitle,
        subtitle: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        lng,
        lat,
        zoom: 13.2,
      };
    }
  }

  // 3. DMS coordinates
  const dms = parseDmsCoords(trimmed);
  if (dms) {
    return {
      id: 'parsed-dms',
      kind: 'coord',
      title: t.searchDirectCoordTitle,
      subtitle: `${dms.lat.toFixed(5)}, ${dms.lng.toFixed(5)}`,
      lng: dms.lng,
      lat: dms.lat,
      zoom: 13.2,
    };
  }

  // 4. Plain decimal coordinates
  const dec = parseDecimalCoords(trimmed);
  if (dec) {
    return {
      id: 'parsed-dec',
      kind: 'coord',
      title: t.searchDirectCoordTitle,
      subtitle: `${dec.lat.toFixed(5)}, ${dec.lng.toFixed(5)}`,
      lng: dec.lng,
      lat: dec.lat,
      zoom: 13.2,
    };
  }

  return null;
}

export function searchLocalItems(
  query: string,
  waypoints: ForageWaypoint[],
  hotspots: PnwHotspot[],
  fires: FireSummary[],
  lang: Lang,
): SearchResultItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: SearchResultItem[] = [];

  for (const wp of waypoints) {
    if (
      wp.name.toLowerCase().includes(q) ||
      wp.notes.toLowerCase().includes(q)
    ) {
      results.push({
        id: `wp-${wp.id}`,
        kind: 'waypoint',
        title: wp.name,
        subtitle: `${wp.lat.toFixed(4)}, ${wp.lng.toFixed(4)}`,
        lng: wp.lng,
        lat: wp.lat,
        zoom: 13.5,
      });
    }
    if (results.length >= 4) break;
  }

  for (const spot of hotspots) {
    const title = lang === 'en' && spot.nameEn ? spot.nameEn : spot.name;
    const region = lang === 'en' ? spot.regionEn : spot.region;
    if (
      spot.name.toLowerCase().includes(q) ||
      (spot.nameEn && spot.nameEn.toLowerCase().includes(q)) ||
      spot.region.toLowerCase().includes(q) ||
      spot.regionEn.toLowerCase().includes(q)
    ) {
      results.push({
        id: `hotspot-${spot.id}`,
        kind: 'hotspot',
        title,
        subtitle: `${region} · ${spot.elevBand}`,
        lng: spot.center[0],
        lat: spot.center[1],
        zoom: spot.zoom,
      });
    }
    if (results.length >= 6) break;
  }

  for (const f of fires) {
    if (f.name.toLowerCase().includes(q) || f.state.toLowerCase().includes(q)) {
      results.push({
        id: `fire-${f.id}`,
        kind: 'fire',
        title: `${f.name} (${f.year})`,
        subtitle: `${f.state} · ${f.rank} · ${Math.round(f.acres).toLocaleString()} ac`,
        lng: f.center[0],
        lat: f.center[1],
        zoom: f.acres > 25000 ? 10.5 : 11.8,
      });
    }
    if (results.length >= 8) break;
  }

  return results;
}

function zoomForPlaceType(osmKey?: string, osmValue?: string, typeName?: string): number {
  const joined = `${osmKey || ''} ${osmValue || ''} ${typeName || ''}`.toLowerCase();
  if (
    joined.includes('pass') ||
    joined.includes('peak') ||
    joined.includes('parking') ||
    joined.includes('trail') ||
    joined.includes('camp') ||
    joined.includes('track')
  ) {
    return 13.0;
  }
  if (joined.includes('city') || joined.includes('county') || joined.includes('state')) {
    return 10.2;
  }
  return 11.8;
}

export async function searchPlacesOnline(
  query: string,
  center: [number, number],
  signal?: AbortSignal,
): Promise<SearchResultItem[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  // 1. Primary: Photon by Komoot (CORS *, fast OSM trailheads, passes, forest roads)
  try {
    const url =
      `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}` +
      `&lat=${center[1].toFixed(4)}&lon=${center[0].toFixed(4)}&limit=6`;
    const resp = await fetch(url, { signal });
    if (resp.ok) {
      const data = (await resp.json()) as {
        features?: Array<{
          geometry?: { coordinates?: [number, number] };
          properties?: Record<string, string | number | undefined>;
        }>;
      };
      const items: SearchResultItem[] = [];
      for (const f of data.features || []) {
        const coords = f.geometry?.coordinates;
        if (!coords || coords.length < 2) continue;
        const lng = Number(coords[0]);
        const lat = Number(coords[1]);
        if (!isValidLatLng(lat, lng)) continue;
        const p = f.properties || {};
        const title = String(p.name || p.street || p.city || p.county || q);
        const subParts = [p.osm_value, p.county, p.state, p.country]
          .filter((v) => v && String(v).toLowerCase() !== 'yes')
          .map((v) => String(v));
        const key = `${title.toLowerCase()}:${lat.toFixed(3)}:${lng.toFixed(3)}`;
        if (items.some((x) => `${x.title.toLowerCase()}:${x.lat.toFixed(3)}:${x.lng.toFixed(3)}` === key)) {
          continue;
        }
        items.push({
          id: `photon-${p.osm_id || items.length}-${lng.toFixed(4)}`,
          kind: 'place',
          title,
          subtitle: subParts.join(' · ') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          lng,
          lat,
          zoom: zoomForPlaceType(String(p.osm_key || ''), String(p.osm_value || '')),
        });
      }
      if (items.length > 0) return items;
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    // Fall through to ArcGIS geocoder
  }

  // 2. Fallback: ArcGIS World GeocodeServer (CORS enabled, reliable road/POI matching)
  try {
    const arcUrl =
      `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates` +
      `?SingleLine=${encodeURIComponent(q)}&location=${center[0].toFixed(4)},${center[1].toFixed(4)}` +
      `&maxLocations=6&outFields=PlaceName,Place_addr,Type&f=json`;
    const resp = await fetch(arcUrl, { signal });
    if (!resp.ok) return [];
    const data = (await resp.json()) as {
      candidates?: Array<{
        address?: string;
        score?: number;
        location?: { x?: number; y?: number };
        attributes?: { PlaceName?: string; Place_addr?: string; Type?: string };
      }>;
    };
    const items: SearchResultItem[] = [];
    for (const c of data.candidates || []) {
      if ((c.score ?? 0) < 60) continue;
      const lng = Number(c.location?.x);
      const lat = Number(c.location?.y);
      if (!isValidLatLng(lat, lng)) continue;
      const attr = c.attributes || {};
      const title = attr.PlaceName || c.address || q;
      const sub = [attr.Type, attr.Place_addr].filter(Boolean).join(' · ');
      const key = `${title.toLowerCase()}:${lat.toFixed(3)}:${lng.toFixed(3)}`;
      if (items.some((x) => `${x.title.toLowerCase()}:${x.lat.toFixed(3)}:${x.lng.toFixed(3)}` === key)) {
        continue;
      }
      items.push({
        id: `arcgis-${items.length}-${lng.toFixed(4)}`,
        kind: 'place',
        title,
        subtitle: sub || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        lng,
        lat,
        zoom: zoomForPlaceType('', '', attr.Type),
      });
    }
    return items;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    return [];
  }
}
