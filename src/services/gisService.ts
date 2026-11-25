import type { FireSummary, PointInspection, SoilInfo, SpeciesId } from '../types/map';
import { WESTERN_FORAGING_STATES } from '../data/mapSources';
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
  statusLabel: string;
  ruleHint: string;
}

export function classifyForagingLegality(
  props: Record<string, unknown>,
): ForagingLegality {
  const pubAccess = String(props.Pub_Access || '').toUpperCase();
  const mngName = String(props.MngNm_Desc || '');
  const mngType = String(props.MngTp_Desc || '');
  const desType = String(props.DesTp_Desc || '');
  const unitName = String(props.Unit_Nm || '');

  const combined = `${mngName} ${mngType} ${desType} ${unitName}`.toLowerCase();

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
    return {
      status: 'prohibited',
      statusLabel: '禁止采摘 / 保护禁区',
      ruleHint: '饮用水源保护区、科研样地、自然保护区、保护地役权、部落领地或关闭区禁止采摘野生菌',
    };
  }

  // 1b. Specific PNW National Parks (including their interior NPS Wilderness Areas)
  // with explicit 36 CFR 2.1(c) personal mushroom foraging allowances
  const isNps = mngName.toLowerCase().includes('national park service');
  if (isNps && (combined.includes('mount rainier') || combined.includes('mt. rainier'))) {
    return {
      status: 'legal',
      statusLabel: '允许限量自用采摘 (Mount Rainier 国家公园)',
      ruleHint: '36 CFR 2.1(c) 特批：每人每日限 1 加仑个人自用，禁止商用，Paradise/Sunrise 等敏感区严禁离道',
    };
  }
  if (
    isNps &&
    (combined.includes('olympic national park') || combined.includes('daniel j. evans wilderness'))
  ) {
    return {
      status: 'legal',
      statusLabel: '允许限量自用采摘 (Olympic 国家公园)',
      ruleHint: '36 CFR 2.1(c) 特批：每人每日限 1 夸脱（与浆果共享总量），自然步道 200 ft 内禁采',
    };
  }
  if (
    isNps &&
    (combined.includes('north cascades') ||
      combined.includes('stephen mather wilderness') ||
      combined.includes('ross lake') ||
      combined.includes('lake chelan'))
  ) {
    return {
      status: 'legal',
      statusLabel: '允许限量自用采摘 (North Cascades 国家公园)',
      ruleHint: '36 CFR 2.1(c) 特批：每人每日限 1 夸脱个人自用，须用刀切勿连根拔起',
    };
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
      return {
        status: 'legal',
        statusLabel: '允许个人自用采摘 (USFS 荒野区)',
        ruleHint: '美国国家森林荒野区通常允许少量个人自用采摘（禁机动车辆，部分森林需免费/付费许可）',
      };
    }
    if (pubAccess === 'OA') {
      return {
        status: 'legal',
        statusLabel: '允许个人自用采摘 (USFS 国家森林)',
        ruleHint: 'USFS 国家森林普遍允许个人自用采菇（通常每日 1–2 加仑，出发前建议确认当地是否需免费许可）',
      };
    }
  }

  if (isBlm && pubAccess === 'OA') {
    return {
      status: 'legal',
      statusLabel: '允许个人自用采摘 (BLM 公共土地)',
      ruleHint: 'BLM 公共林地通常允许少量个人自用采摘（商用须申请许可）',
    };
  }

  if (
    isStateForestry &&
    pubAccess === 'OA' &&
    !desType.toLowerCase().includes('conservation') &&
    !desType.toLowerCase().includes('park')
  ) {
    return {
      status: 'legal',
      statusLabel: '允许个人自用采摘 (州立森林 / DNR)',
      ruleHint: 'OR 州立森林（如 Tillamook）与 WA DNR 州立林地普遍允许个人自用采菇（WA 通常需 Discover Pass 停车证）',
    };
  }

  // 3. Restricted / check local park rules (National Parks, State Parks, County Parks, RA)
  if (mngName.toLowerCase().includes('national park service') || desType.toLowerCase().includes('national park')) {
    return {
      status: 'restricted',
      statusLabel: '严格限量 / 国家公园规定',
      ruleHint: '部分国家公园（如 Olympic / Mt. Rainier）限个人每日 1 夸脱，部分公园完全禁止，务必核查公园条例',
    };
  }

  if (desType.toLowerCase().includes('state park') || mngName.toLowerCase().includes('state park')) {
    return {
      status: 'restricted',
      statusLabel: '受限 / 州立公园规则',
      ruleHint: '部分 OR/WA 州立公园允许少量自用，但部分公园或保护单元禁止采摘，请查看园方告示',
    };
  }

  return {
    status: 'restricted',
    statusLabel: '受限公共区域 / 需核查规定',
    ruleHint: '市县公园、保护绿地或受限访问区请先确认当地是否允许采摘野生菌',
  };
}

export interface PadusViewportResult {
  geojson: GeoJSON.FeatureCollection;
  legalPolygons: IndexedFirePolygon[];
  prohibitedPolygons: IndexedFirePolygon[];
}

export async function fetchPadusInBounds(
  bounds: [number, number, number, number],
  zoom: number,
  signal?: AbortSignal,
): Promise<PadusViewportResult> {
  // Pad viewport bounds by 25% so edge tiles have complete legal polygon masks while panning
  const [w, s, e, n] = bounds;
  const padLng = Math.min(0.6, (e - w) * 0.25);
  const padLat = Math.min(0.4, (n - s) * 0.25);
  const geometry = JSON.stringify({
    xmin: w - padLng,
    ymin: s - padLat,
    xmax: e + padLng,
    ymax: n + padLat,
    spatialReference: { wkid: 4326 },
  });

  const tolerance = zoom >= 12 ? '0.0002' : zoom >= 10 ? '0.0006' : '0.0018';

  const params = new URLSearchParams({
    where: "Pub_Access IN ('OA','RA','XA')",
    geometry,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'OBJECTID,Pub_Access,Unit_Nm,MngTp_Desc,MngNm_Desc,DesTp_Desc',
    outSR: '4326',
    maxAllowableOffset: tolerance,
    geometryPrecision: '4',
    resultRecordCount: '400',
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
        foraging_label: legal.statusLabel,
        foraging_rule: legal.ruleHint,
      },
    });
  }

  return {
    geojson: { type: 'FeatureCollection', features },
    legalPolygons,
    prohibitedPolygons,
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
): Promise<PointInspection> {
  const [localTerrain, usgsElevM, weather, soil] = await Promise.all([
    sampleLocalTerrainAtLngLat(lng, lat, speciesId),
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
        ? degreesToCompass(localTerrain.aspectDeg)
        : null,
    canopyPct: localTerrain?.canopyPct ?? null,
    concavityM: localTerrain?.concavityM ?? null,
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
