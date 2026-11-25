import type {
  FireSummary,
  Lang,
  LegalityRuleKey,
  PointInspection,
  SoilInfo,
  SpeciesId,
  UnitSettings,
} from '../types/map';
import { WESTERN_FORAGING_STATES } from '../data/mapSources';
import { localizeLegality } from '../i18n/translations';
import { IMPERIAL_UNITS } from '../utils/units';
import {
  degreesToCompass,
  type IndexedFirePolygon,
  sampleLocalTerrainAtLngLat,
} from './tileEngines';

const NIFC_WFIGS_URL =
  'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters/FeatureServer/0/query';
const NIFC_HISTORIC_URL =
  'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/InterAgencyFirePerimeterHistory_All_Years_View/FeatureServer/0/query';
const PADUS_ACCESS_URL =
  'https://services.arcgis.com/v01gqwM5QqNysAAi/arcgis/rest/services/PADUS_Public_Access/FeatureServer/0/query';
const USGS_3DEP_IDENTIFY =
  'https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/identify';
const USDA_SSURGO_SQL = 'https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest';

export interface WildfireYearData {
  geojson: GeoJSON.FeatureCollection;
  summaries: FireSummary[];
  indexedPolygons: IndexedFirePolygon[];
}

const wildfireCache = new Map<number, WildfireYearData>();

function computeFireRank(acres: number, state: string): 'A' | 'B' | 'C' | 'D' {
  const isWestern = WESTERN_FORAGING_STATES.has(state);
  if (acres >= 10000 && isWestern) return 'A';
  if (acres >= 3000 && isWestern) return 'B';
  if (acres >= 5000) return 'B';
  if (acres >= 800) return 'C';
  return 'D';
}

function extractBboxAndCenter(
  geom: GeoJSON.Geometry | null,
): { bbox: [number, number, number, number]; center: [number, number]; polygons: IndexedFirePolygon[] } {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  const polygons: IndexedFirePolygon[] = [];

  if (!geom) {
    return { bbox: [0, 0, 0, 0], center: [0, 0], polygons };
  }

  const processPolygonRings = (rings: number[][][]) => {
    let pMinLng = Infinity;
    let pMinLat = Infinity;
    let pMaxLng = -Infinity;
    let pMaxLat = -Infinity;
    for (const ring of rings) {
      for (const pt of ring) {
        const lng = pt[0];
        const lat = pt[1];
        if (lng < pMinLng) pMinLng = lng;
        if (lng > pMaxLng) pMaxLng = lng;
        if (lat < pMinLat) pMinLat = lat;
        if (lat > pMaxLat) pMaxLat = lat;
      }
    }
    if (pMinLng < minLng) minLng = pMinLng;
    if (pMaxLng > maxLng) maxLng = pMaxLng;
    if (pMinLat < minLat) minLat = pMinLat;
    if (pMaxLat > maxLat) maxLat = pMaxLat;
    polygons.push({ bbox: [pMinLng, pMinLat, pMaxLng, pMaxLat], rings });
  };

  if (geom.type === 'Polygon') {
    processPolygonRings(geom.coordinates as number[][][]);
  } else if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates as number[][][][]) {
      processPolygonRings(poly);
    }
  }

  if (!Number.isFinite(minLng)) {
    return { bbox: [0, 0, 0, 0], center: [0, 0], polygons };
  }

  return {
    bbox: [minLng, minLat, maxLng, maxLat],
    center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
    polygons,
  };
}

function normalizeWildfireCollection(
  fc: GeoJSON.FeatureCollection,
  fallbackYear: number,
  sourceMode: 'wfigs' | 'historic',
): WildfireYearData {
  const summaries: FireSummary[] = [];
  const indexedPolygons: IndexedFirePolygon[] = [];
  const features: GeoJSON.Feature[] = [];

  for (let i = 0; i < (fc.features || []).length; i++) {
    const f = fc.features[i];
    if (!f.geometry) continue;
    const p = (f.properties || {}) as Record<string, unknown>;

    const name = String(
      (sourceMode === 'wfigs' ? p.poly_IncidentName : p.INCIDENT) || 'Unnamed Wildfire',
    ).trim();
    const acres = Math.round(
      Number((sourceMode === 'wfigs' ? p.poly_GISAcres : p.GIS_ACRES) || 0),
    );
    const rawState = String(
      (sourceMode === 'wfigs' ? p.attr_POOState : p.UNIT_ID || '') || '',
    ).replace(/^US-/, '');
    const state = rawState.slice(0, 2).toUpperCase() || 'US';

    let year = fallbackYear;
    let discoveryDate: string | undefined;
    if (sourceMode === 'wfigs' && typeof p.attr_FireDiscoveryDateTime === 'number') {
      const dt = new Date(p.attr_FireDiscoveryDateTime);
      if (!Number.isNaN(dt.getTime())) {
        year = dt.getUTCFullYear();
        discoveryDate = dt.toISOString().slice(0, 10);
      }
    } else if (p.FIRE_YEAR_INT && Number(p.FIRE_YEAR_INT) < 3000) {
      year = Number(p.FIRE_YEAR_INT);
    }

    const rank = computeFireRank(acres, state);
    const id = String(
      p.poly_IRWINID || p.IRWINID || p.OBJECTID || `${fallbackYear}-${i}-${name}`,
    );

    const { center, polygons } = extractBboxAndCenter(f.geometry);
    if (!polygons.length) continue;

    indexedPolygons.push(...polygons);
    summaries.push({ id, name, year, acres, state, rank, center, discoveryDate });

    features.push({
      type: 'Feature',
      geometry: f.geometry,
      properties: {
        id,
        name,
        year,
        acres,
        state,
        rank,
        discoveryDate: discoveryDate || `${year}`,
      },
    });
  }

  summaries.sort((a, b) => b.acres - a.acres);

  return {
    geojson: { type: 'FeatureCollection', features },
    summaries,
    indexedPolygons,
  };
}

export async function fetchWildfiresByYear(year: number): Promise<WildfireYearData> {
  const cached = wildfireCache.get(year);
  if (cached) return cached;

  // Use WFIGS for 2025+ (includes 2025 & 2026 live fires) and WFIGS/Historic for 2024/2023/2022
  if (year >= 2024) {
    const startDate = year === 2025 ? '2025-01-01' : `${year}-01-01`;
    const endDate = year === 2025 ? '2027-01-01' : `${year + 1}-01-01`;
    const where =
      `poly_GISAcres >= 250 AND attr_FireDiscoveryDateTime >= DATE '${startDate}' ` +
      `AND attr_FireDiscoveryDateTime < DATE '${endDate}'`;

    const params = new URLSearchParams({
      where,
      outFields: 'poly_IncidentName,poly_GISAcres,attr_POOState,attr_FireDiscoveryDateTime,poly_IRWINID',
      outSR: '4326',
      maxAllowableOffset: '0.0012',
      geometryPrecision: '4',
      orderByFields: 'poly_GISAcres DESC',
      resultRecordCount: '450',
      f: 'geojson',
    });

    try {
      const resp = await fetch(`${NIFC_WFIGS_URL}?${params.toString()}`);
      if (resp.ok) {
        const fc = (await resp.json()) as GeoJSON.FeatureCollection;
        if (fc.features && fc.features.length > 0) {
          const normalized = normalizeWildfireCollection(fc, year, 'wfigs');
          wildfireCache.set(year, normalized);
          return normalized;
        }
      }
    } catch {
      // Fall through to Historic endpoint
    }
  }

  // Historic NIFC perimeter service fallback (2022, 2023, 2024)
  const histParams = new URLSearchParams({
    where: `FIRE_YEAR_INT = ${year} AND GIS_ACRES >= 200`,
    outFields: 'OBJECTID,INCIDENT,GIS_ACRES,FIRE_YEAR_INT,UNIT_ID,IRWINID',
    outSR: '4326',
    maxAllowableOffset: '0.0012',
    geometryPrecision: '4',
    orderByFields: 'GIS_ACRES DESC',
    resultRecordCount: '400',
    f: 'geojson',
  });

  const resp = await fetch(`${NIFC_HISTORIC_URL}?${histParams.toString()}`);
  if (!resp.ok) {
    throw new Error(`NIFC API HTTP ${resp.status}`);
  }
  const fc = (await resp.json()) as GeoJSON.FeatureCollection;
  const normalized = normalizeWildfireCollection(fc, year, 'historic');
  wildfireCache.set(year, normalized);
  return normalized;
}

export interface ForagingLegality {
  status: 'legal' | 'restricted' | 'prohibited';
  ruleKey: LegalityRuleKey;
  statusLabel: string;
  ruleHint: string;
}

export function classifyForagingLegality(
  props: Record<string, unknown>,
  lang: Lang = 'zh',
): ForagingLegality {
  const pubAccess = String(props.Pub_Access || '').toUpperCase();
  const mngName = String(props.MngNm_Desc || '');
  const mngType = String(props.MngTp_Desc || '');
  const desType = String(props.DesTp_Desc || '');
  const unitName = String(props.Unit_Nm || '');

  const combined = `${mngName} ${mngType} ${desType} ${unitName}`.toLowerCase();

  const build = (
    status: ForagingLegality['status'],
    ruleKey: LegalityRuleKey,
  ): ForagingLegality => {
    const loc = localizeLegality(ruleKey, lang);
    return { status, ruleKey, ...loc };
  };

  // 1. Explicitly prohibited / closed / municipal watersheds / sensitive preserves / tribal / private NGO
  if (
    pubAccess === 'XA' ||
    combined.includes('not in ownership') ||
    combined.includes('watershed') ||
    combined.includes('fish and wildlife') ||
    combined.includes('wildlife refuge') ||
    combined.includes('research') ||
    combined.includes('experimental') ||
    combined.includes('botanical area') ||
    combined.includes('natural area preserve') ||
    combined.includes('natural resources conservation area') ||
    combined.includes('conservation easement') ||
    combined.includes('agricultural easement') ||
    combined.includes('private conservation') ||
    combined.includes('non-governmental') ||
    combined.includes('american indian') ||
    combined.includes('native american')
  ) {
    return build('prohibited', 'prohibited');
  }

  // 1b. Specific PNW National Parks (including their interior NPS Wilderness Areas)
  // with explicit 36 CFR 2.1(c) personal mushroom foraging allowances
  const isNps = mngName.toLowerCase().includes('national park service');
  if (isNps && (combined.includes('mount rainier') || combined.includes('mt. rainier'))) {
    return build('legal', 'nps-rainier');
  }
  if (
    isNps &&
    (combined.includes('olympic national park') || combined.includes('daniel j. evans wilderness'))
  ) {
    return build('legal', 'nps-olympic');
  }
  if (
    isNps &&
    (combined.includes('north cascades') ||
      combined.includes('stephen mather wilderness') ||
      combined.includes('ross lake') ||
      combined.includes('lake chelan'))
  ) {
    return build('legal', 'nps-north-cascades');
  }

  // 2. Prime legal public foraging lands in PNW: USFS National Forests, BLM, State Forests / DNR
  const isUsfs = mngName.toLowerCase().includes('forest service');
  const isBlm = mngName.toLowerCase().includes('bureau of land management');
  const isStateForestry =
    mngName.toLowerCase().includes('department of natural resources') ||
    mngName.toLowerCase().includes('state land board') ||
    mngName.toLowerCase().includes('department of forestry') ||
    desType.toLowerCase().includes('state forest');

  if (isUsfs) {
    if (desType.toLowerCase().includes('wilderness')) {
      return build('legal', 'usfs-wilderness');
    }
    if (pubAccess === 'OA') {
      return build('legal', 'usfs');
    }
  }

  if (isBlm && pubAccess === 'OA') {
    return build('legal', 'blm');
  }

  if (
    isStateForestry &&
    pubAccess === 'OA' &&
    !desType.toLowerCase().includes('conservation') &&
    !desType.toLowerCase().includes('park')
  ) {
    return build('legal', 'state-forestry');
  }

  // 3. Restricted / check local park rules (National Parks, State Parks, County Parks, RA)
  if (mngName.toLowerCase().includes('national park service') || desType.toLowerCase().includes('national park')) {
    return build('restricted', 'nps-other');
  }

  if (desType.toLowerCase().includes('state park') || mngName.toLowerCase().includes('state park')) {
    return build('restricted', 'state-park');
  }

  return build('restricted', 'restricted-other');
}

export interface PadusViewportResult {
  geojson: GeoJSON.FeatureCollection;
  legalPolygons: IndexedFirePolygon[];
  prohibitedPolygons: IndexedFirePolygon[];
  paddedBounds: [number, number, number, number];
  tolerance: string;
}

export function getPadusToleranceForZoom(zoom: number): string {
  return zoom >= 12 ? '0.0002' : zoom >= 10 ? '0.0006' : '0.0018';
}

export async function fetchPadusInBounds(
  bounds: [number, number, number, number],
  zoom: number,
  signal?: AbortSignal,
): Promise<PadusViewportResult> {
  // Pad viewport bounds by 45% so brisk pans already have complete legal polygon masks preloaded
  const [w, s, e, n] = bounds;
  const padLng = Math.min(0.9, (e - w) * 0.45);
  const padLat = Math.min(0.6, (n - s) * 0.45);
  const paddedBounds: [number, number, number, number] = [
    w - padLng,
    s - padLat,
    e + padLng,
    n + padLat,
  ];
  const geometry = JSON.stringify({
    xmin: paddedBounds[0],
    ymin: paddedBounds[1],
    xmax: paddedBounds[2],
    ymax: paddedBounds[3],
    spatialReference: { wkid: 4326 },
  });

  const tolerance = getPadusToleranceForZoom(zoom);

  // Filter server-side to Federal/State/Joint lands + large closed areas & municipal watersheds,
  // ordered largest-first (GIS_Acres DESC) so tiny suburban city parks can NEVER truncate National/State Forests!
  const params = new URLSearchParams({
    where:
      "(Pub_Access IN ('OA','RA','XA') AND MngTp_Desc IN ('Federal','State','Joint')) " +
      "OR (Pub_Access = 'XA' AND GIS_Acres >= 20) " +
      "OR (Unit_Nm LIKE '%Watershed%' AND GIS_Acres >= 50)",
    geometry,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'OBJECTID,Pub_Access,Unit_Nm,MngTp_Desc,MngNm_Desc,DesTp_Desc,GIS_Acres',
    orderByFields: 'GIS_Acres DESC',
    outSR: '4326',
    maxAllowableOffset: tolerance,
    geometryPrecision: '4',
    resultRecordCount: '1500',
    f: 'geojson',
  });

  const resp = await fetch(`${PADUS_ACCESS_URL}?${params.toString()}`, { signal });
  if (!resp.ok) throw new Error(`PAD-US HTTP ${resp.status}`);
  const raw = (await resp.json()) as GeoJSON.FeatureCollection;

  const features: GeoJSON.Feature[] = [];
  const legalPolygons: IndexedFirePolygon[] = [];
  const prohibitedPolygons: IndexedFirePolygon[] = [];

  for (const f of raw.features || []) {
    if (!f.geometry) continue;
    const props = (f.properties || {}) as Record<string, unknown>;
    if (String(props.Unit_Nm || '').toLowerCase() === 'not in ownership') continue;
    const legal = classifyForagingLegality(props);
    const { polygons } = extractBboxAndCenter(f.geometry);

    if (legal.status === 'legal') {
      legalPolygons.push(...polygons);
    } else if (legal.status === 'prohibited') {
      prohibitedPolygons.push(...polygons);
    }

    features.push({
      ...f,
      properties: {
        ...props,
        foraging_status: legal.status,
        foraging_rule_key: legal.ruleKey,
        foraging_label: legal.statusLabel,
        foraging_rule: legal.ruleHint,
      },
    });
  }

  return {
    geojson: { type: 'FeatureCollection', features },
    legalPolygons,
    prohibitedPolygons,
    paddedBounds,
    tolerance,
  };
}

async function fetchUsgs3DepIdentify(lng: number, lat: number): Promise<number | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const params = new URLSearchParams({
      geometry: JSON.stringify({ x: lng, y: lat, spatialReference: { wkid: 4326 } }),
      geometryType: 'esriGeometryPoint',
      returnGeometry: 'false',
      returnCatalogItems: 'false',
      f: 'json',
    });
    const resp = await fetch(`${USGS_3DEP_IDENTIFY}?${params.toString()}`, {
      signal: controller.signal,
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const val = Number(data?.value);
    return Number.isFinite(val) ? val : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchOpenMeteoPoint(
  lng: number,
  lat: number,
): Promise<PointInspection['weather']> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
      `&daily=precipitation_sum&hourly=soil_temperature_6cm,soil_moisture_3_to_9cm` +
      `&past_days=7&forecast_days=1&temperature_unit=fahrenheit&precipitation_unit=inch&timezone=auto`;
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) return null;
    const j = await resp.json();
    const dailyPrecip: number[] = j?.daily?.precipitation_sum || [];
    const rain24hIn =
      dailyPrecip.length >= 2
        ? Number((dailyPrecip[dailyPrecip.length - 2] ?? 0).toFixed(2))
        : null;
    const rain7dIn = dailyPrecip.length
      ? Number(dailyPrecip.reduce((s, v) => s + (Number(v) || 0), 0).toFixed(2))
      : null;

    const soilTemps: number[] = (j?.hourly?.soil_temperature_6cm || []).filter(
      (v: unknown) => typeof v === 'number',
    );
    const soilMoist: number[] = (j?.hourly?.soil_moisture_3_to_9cm || []).filter(
      (v: unknown) => typeof v === 'number',
    );
    const soilTempF = soilTemps.length ? Math.round(soilTemps[soilTemps.length - 1]) : null;
    const soilMoisturePct = soilMoist.length
      ? Math.round(soilMoist[soilMoist.length - 1] * 100)
      : null;

    return { rain24hIn, rain7dIn, soilTempF, soilMoisturePct };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchUsdaSoilAtPoint(
  lng: number,
  lat: number,
  filterStrengthPct = 50,
): Promise<SoilInfo | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const sql =
      `SELECT TOP 1 mu.muname, c.compname, c.drainagecl, c.taxclname ` +
      `FROM mapunit mu ` +
      `INNER JOIN component c ON c.mukey = mu.mukey AND c.majcompflag = 'Yes' ` +
      `WHERE mu.mukey IN (SELECT * FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('point(${lng.toFixed(5)} ${lat.toFixed(5)})')) ` +
      `ORDER BY c.comppct_r DESC`;
    const resp = await fetch(USDA_SSURGO_SQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql, format: 'JSON' }),
      signal: controller.signal,
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const row: string[] | undefined = data?.Table?.[0];
    if (!row || row.length < 3) return null;
    const mapUnitName = String(row[0] || '');
    const componentName = String(row[1] || '');
    const drainageClass = String(row[2] || '');
    const taxClass = String(row[3] || '');

    const mapUnitLower = mapUnitName.toLowerCase();
    const compLower = componentName.toLowerCase();
    const drainLower = drainageClass.toLowerCase().trim();
    const taxLower = taxClass.toLowerCase();
    const fullText = `${mapUnitLower} ${compLower} ${taxLower}`;

    // Strict drainage check: exclude "moderately well drained" and poorly drained soils
    const hasStrongDrainage =
      drainLower.includes('excessively drained') || drainLower === 'well drained';

    // Exclude Puget Lowland dense glacial-till hardpan / clay / silty / wet organic soils
    const isHardpanOrHeavy =
      compLower.includes('alderwood') ||
      compLower.includes('kitsap') ||
      compLower.includes('bellingham') ||
      mapUnitLower.includes('clay') ||
      mapUnitLower.includes('silt loam') ||
      mapUnitLower.includes('muck') ||
      mapUnitLower.includes('peat') ||
      taxLower.includes('durix') ||
      taxLower.includes('fragi');

    // Tier 1 (Strict >= 60%): True volcanic pumice/ash/cinders (Andisol Vitrands) or pure coastal/outwash sand
    const hasPrimeMatsutakeSubstrate =
      /\b(pumice|pumiceous|ashy|cindery|lapilli|dune)\b/.test(fullText) ||
      /psamment/.test(taxLower) ||
      /\b\w*vitr(?:and|icryand|ixerand|udand|ustand)s?\b/.test(taxLower) ||
      /\b(loamy sand|loamy coarse sand|loamy fine sand|coarse sand|fine sand|gravelly sand|very gravelly sand|cobbly sand|sand)\b/.test(
        mapUnitLower,
      );

    // Tier 2 (Balanced 30%–59%): Well-drained gravelly sandy loams (e.g. Everett/Beausite outwash, still excluding hardpan)
    const hasModerateSandySubstrate =
      /\b(sandy loam|gravelly sandy|coarse-loamy|sandy-skeletal)\b/.test(fullText);

    // Tier 3 (Loose < 30%): Moderately well drained sandy / vitrandic glacial till
    const hasWeakTillSubstrate =
      (drainLower.includes('moderately well drained') || hasStrongDrainage) &&
      (fullText.includes('sand') || fullText.includes('vitrand')) &&
      !mapUnitLower.includes('clay') &&
      !mapUnitLower.includes('muck') &&
      !mapUnitLower.includes('peat');

    let matsutakeTier: SoilInfo['matsutakeTier'] = 'none';
    let matsutakeBadge: string | null = null;

    if (hasStrongDrainage && !isHardpanOrHeavy && hasPrimeMatsutakeSubstrate) {
      matsutakeTier = 'prime';
      matsutakeBadge = '松茸砂/火山灰土';
    } else if (
      filterStrengthPct < 60 &&
      hasStrongDrainage &&
      !isHardpanOrHeavy &&
      hasModerateSandySubstrate
    ) {
      matsutakeTier = 'moderate';
      matsutakeBadge = '较适宜砂砾土';
    } else if (filterStrengthPct < 30 && hasWeakTillSubstrate) {
      matsutakeTier = 'weak';
      matsutakeBadge = '弱适宜 · 冰碛土';
    }

    return {
      mapUnitName,
      componentName,
      drainageClass,
      taxClass,
      matsutakeFriendly: matsutakeTier !== 'none',
      matsutakeTier,
      matsutakeBadge,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function inspectPointDetails(
  lng: number,
  lat: number,
  speciesId: SpeciesId,
  fires: PointInspection['fires'],
  publicAccess: PointInspection['publicAccess'],
  filterStrengthPct = 50,
  lang: Lang = 'zh',
  units: UnitSettings = IMPERIAL_UNITS,
): Promise<PointInspection> {
  const [localTerrain, usgsElevM, weather, soil] = await Promise.all([
    sampleLocalTerrainAtLngLat(lng, lat, speciesId, lang, units),
    fetchUsgs3DepIdentify(lng, lat),
    fetchOpenMeteoPoint(lng, lat),
    fetchUsdaSoilAtPoint(lng, lat, filterStrengthPct),
  ]);

  const elevationM = usgsElevM !== null ? Math.round(usgsElevM) : localTerrain?.elevationM ?? null;
  const elevationFt =
    elevationM !== null ? Math.round(elevationM * 3.28084) : localTerrain?.elevationFt ?? null;

  return {
    lng,
    lat,
    loading: false,
    elevationM,
    elevationFt,
    slopeDeg: localTerrain?.slopeDeg ?? null,
    slopePct: localTerrain?.slopePct ?? null,
    aspectDeg: localTerrain?.aspectDeg ?? null,
    aspectDir:
      localTerrain?.aspectDeg !== undefined
        ? degreesToCompass(localTerrain.aspectDeg, lang)
        : null,
    canopyPct: localTerrain?.canopyPct ?? null,
    concavityM: localTerrain?.concavityM ?? null,
    landCoverClass: localTerrain?.landCoverClass ?? null,
    metersPerPx: localTerrain?.metersPerPx ?? 26,
    landformLabel: localTerrain?.landformLabel ?? null,
    activeSpeciesId: speciesId,
    activeScore: localTerrain?.activeScore ?? null,
    activeTier: localTerrain?.activeTier ?? null,
    scoreBreakdown: localTerrain?.scoreBreakdown ?? [],
    soil,
    fires,
    publicAccess,
    weather,
  };
}
