import { SPECIES_CATALOG } from '../data/speciesCatalog';
import type { ForageWaypoint, SpeciesId } from '../types/map';

const VALID_SPECIES = new Set<string>(SPECIES_CATALOG.map((s) => s.id));

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeSpecies(val: unknown): ForageWaypoint['species'] {
  const s = String(val || '').trim();
  return VALID_SPECIES.has(s) ? (s as SpeciesId) : 'Other';
}

export function getGoogleMapsNavUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

export function getAppleMapsNavUrl(lat: number, lng: number): string {
  return `https://maps.apple.com/?daddr=${lat.toFixed(6)},${lng.toFixed(6)}&dirflg=d`;
}

export function exportWaypointsToGpx(waypoints: ForageWaypoint[]): string {
  const nowIso = new Date().toISOString();
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="MushroomMap" xmlns="http://www.topografix.com/GPX/1/1">',
    '  <metadata>',
    '    <name>MushroomMap Foraging Waypoints</name>',
    `    <time>${nowIso}</time>`,
    '  </metadata>',
  ];

  for (const wp of waypoints) {
    lines.push(`  <wpt lat="${wp.lat.toFixed(6)}" lon="${wp.lng.toFixed(6)}">`);
    if (wp.elevationFt !== null && Number.isFinite(wp.elevationFt)) {
      lines.push(`    <ele>${(wp.elevationFt / 3.28084).toFixed(1)}</ele>`);
    }
    const iso = Number.isFinite(wp.createdAt) ? new Date(wp.createdAt).toISOString() : nowIso;
    lines.push(`    <time>${iso}</time>`);
    lines.push(`    <name>${escapeXml(wp.name || 'Mushroom Spot')}</name>`);
    if (wp.notes?.trim()) {
      lines.push(`    <desc>${escapeXml(wp.notes.trim())}</desc>`);
    }
    lines.push(`    <type>${escapeXml(wp.species)}</type>`);
    lines.push('    <sym>Flag, Green</sym>');
    lines.push('  </wpt>');
  }

  lines.push('</gpx>');
  return lines.join('\n');
}

export function exportWaypointsToJson(waypoints: ForageWaypoint[]): string {
  return JSON.stringify(
    {
      app: 'MushroomMap',
      version: 1,
      exportedAt: new Date().toISOString(),
      waypoints,
    },
    null,
    2,
  );
}

function getChildText(parent: Element, tagName: string): string {
  const byTag = parent.getElementsByTagName(tagName);
  if (byTag.length > 0 && byTag[0].textContent) {
    return byTag[0].textContent.trim();
  }
  const byNs = parent.getElementsByTagNameNS('*', tagName);
  if (byNs.length > 0 && byNs[0].textContent) {
    return byNs[0].textContent.trim();
  }
  return '';
}

export function parseImportedWaypoints(text: string, filename: string): ForageWaypoint[] {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Empty waypoint file');

  const isJson =
    filename.toLowerCase().endsWith('.json') ||
    trimmed.startsWith('{') ||
    trimmed.startsWith('[');

  const now = Date.now();

  if (isJson) {
    const parsed = JSON.parse(trimmed) as unknown;
    const rawList: unknown[] = Array.isArray(parsed)
      ? parsed
      : parsed &&
          typeof parsed === 'object' &&
          Array.isArray((parsed as { waypoints?: unknown[] }).waypoints)
        ? (parsed as { waypoints: unknown[] }).waypoints
        : [];

    const valid: ForageWaypoint[] = [];
    rawList.forEach((item, idx) => {
      if (!item || typeof item !== 'object') return;
      const obj = item as Record<string, unknown>;
      const lat = Number(obj.lat);
      const lng = Number(obj.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return;
      }
      const elevRaw = obj.elevationFt;
      const elevationFt =
        elevRaw !== null && elevRaw !== undefined && Number.isFinite(Number(elevRaw))
          ? Math.round(Number(elevRaw))
          : null;
      const createdRaw = Number(obj.createdAt);
      valid.push({
        id:
          typeof obj.id === 'string' && obj.id.trim()
            ? obj.id.trim()
            : `imp-${now}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        name:
          typeof obj.name === 'string' && obj.name.trim()
            ? obj.name.trim()
            : `Waypoint ${idx + 1}`,
        species: normalizeSpecies(obj.species),
        notes: typeof obj.notes === 'string' ? obj.notes.trim() : '',
        lng,
        lat,
        elevationFt,
        createdAt: Number.isFinite(createdRaw) && createdRaw > 0 ? createdRaw : now + idx,
      });
    });

    if (valid.length === 0) throw new Error('No valid waypoints found in JSON');
    return valid;
  }

  // Parse GPX / XML
  const doc = new DOMParser().parseFromString(trimmed, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Invalid GPX/XML file');
  }

  let wptNodes = Array.from(doc.getElementsByTagName('wpt'));
  if (wptNodes.length === 0) {
    wptNodes = Array.from(doc.getElementsByTagNameNS('*', 'wpt'));
  }
  if (wptNodes.length === 0) {
    wptNodes = Array.from(doc.getElementsByTagName('rtept'));
  }

  const valid: ForageWaypoint[] = [];
  wptNodes.forEach((node, idx) => {
    const lat = Number(node.getAttribute('lat'));
    const lon = Number(node.getAttribute('lon'));
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return;
    }
    const name = getChildText(node, 'name') || `GPX Spot ${idx + 1}`;
    const desc = getChildText(node, 'desc') || getChildText(node, 'cmt');
    const eleStr = getChildText(node, 'ele');
    const eleM = eleStr ? Number(eleStr) : NaN;
    const elevationFt = Number.isFinite(eleM) ? Math.round(eleM * 3.28084) : null;
    const timeStr = getChildText(node, 'time');
    const parsedTime = timeStr ? Date.parse(timeStr) : NaN;
    const spText = getChildText(node, 'type');

    valid.push({
      id: `gpx-${now}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      species: normalizeSpecies(spText),
      notes: desc,
      lng: lon,
      lat,
      elevationFt,
      createdAt: Number.isFinite(parsedTime) ? parsedTime : now + idx,
    });
  });

  if (valid.length === 0) throw new Error('No valid <wpt> waypoints found in GPX');
  return valid;
}

export function mergeWaypoints(
  existing: ForageWaypoint[],
  incoming: ForageWaypoint[],
): { merged: ForageWaypoint[]; addedCount: number; skippedCount: number } {
  const makeKey = (w: ForageWaypoint) =>
    `${w.lat.toFixed(5)}:${w.lng.toFixed(5)}:${w.name.trim().toLowerCase()}`;

  const seen = new Set(existing.map(makeKey));
  const added: ForageWaypoint[] = [];
  let skippedCount = 0;

  for (const item of incoming) {
    const k = makeKey(item);
    if (seen.has(k)) {
      skippedCount++;
      continue;
    }
    seen.add(k);
    added.push(item);
  }

  return {
    merged: [...added, ...existing],
    addedCount: added.length,
    skippedCount,
  };
}

export function triggerTextDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
