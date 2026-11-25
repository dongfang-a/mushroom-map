import type { EcoRegionFilter, Lang, SpeciesId } from '../types/map';

// Hydrologic Cascade Crest Divide (PCT / Cascade Ridge), sorted north -> south: [lat, lng]
const CASCADE_CREST_LAT_LNG: Array<[number, number]> = [
  [50.0, -120.85],   // BC Cascade Extension
  [49.0, -120.79],   // Monument 78 (WA/BC Border)
  [48.72, -120.74],  // Hart's Pass / Slate Peak
  [48.52, -120.74],  // Rainy Pass (SR-20)
  [48.46, -121.06],  // Cascade Pass
  [48.11, -121.11],  // Glacier Peak / Suiattle Pass
  [47.745, -121.089], // Stevens Pass (US-2)
  [47.424, -121.413], // Snoqualmie Pass (I-90)
  [47.27, -121.35],  // Stampede Pass
  [46.872, -121.515], // Chinook Pass (SR-410)
  [46.638, -121.389], // White Pass (US-12)
  [46.20, -121.49],  // Mt. Adams Crest
  [45.70, -121.68],  // Columbia River Gorge transition (Cascade Locks -> Hood River)
  [45.373, -121.696], // Mt. Hood Crest
  [44.82, -121.79],  // Mt. Jefferson Crest
  [44.422, -121.845], // Santiam Pass (US-20)
  [44.26, -121.81],  // McKenzie Pass / Three Sisters
  [43.60, -122.04],  // Willamette Pass (OR-58)
  [42.94, -122.11],  // Crater Lake Rim
  [42.44, -122.31],  // Mt. McLoughlin
  [42.0, -122.56],   // OR/CA Siskiyou Crest
  [41.4, -122.19],   // Mt. Shasta
  [40.5, -121.5],    // Lassen
];

// Pacific Coastline reference from northern WA to northern CA: [lat, lng]
const PACIFIC_COAST_LAT_LNG: Array<[number, number]> = [
  [49.0, -125.6],
  [48.38, -124.73], // Cape Flattery
  [47.9, -124.64],  // La Push
  [47.34, -124.3],  // Taholah
  [46.97, -124.18], // Ocean Shores
  [46.26, -124.06], // Astoria / Cape Disappointment
  [45.56, -123.95], // Tillamook Coast
  [44.63, -124.06], // Newport
  [43.98, -124.14], // Florence
  [43.36, -124.35], // Coos Bay
  [42.74, -124.5],  // Port Orford
  [42.05, -124.28], // Brookings
  [41.0, -124.15],  // Trinidad, CA
  [40.5, -124.35],
];

export const CASCADE_CREST_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Cascade Crest Divide' },
      geometry: {
        type: 'LineString',
        coordinates: CASCADE_CREST_LAT_LNG.map(([lat, lng]) => [lng, lat]),
      },
    },
  ],
};

function interpolateLngAtLat(table: Array<[number, number]>, lat: number): number {
  if (lat >= table[0][0]) return table[0][1];
  const last = table.length - 1;
  if (lat <= table[last][0]) return table[last][1];
  for (let i = 0; i < last; i++) {
    const [lat0, lng0] = table[i];
    const [lat1, lng1] = table[i + 1];
    if (lat <= lat0 && lat >= lat1) {
      const t = (lat0 - lat) / Math.max(1e-6, lat0 - lat1);
      return lng0 + (lng1 - lng0) * t;
    }
  }
  return table[last][1];
}

export function getCascadeCrestLng(lat: number): number {
  return interpolateLngAtLat(CASCADE_CREST_LAT_LNG, lat);
}

export function getPacificCoastLng(lat: number): number {
  return interpolateLngAtLat(PACIFIC_COAST_LAT_LNG, lat);
}

export type PnwEcoZone = 'coast' | 'west' | 'crest' | 'east' | 'outside';

export interface PnwZoneSample {
  zone: PnwEcoZone;
  eastOfCrestKm: number; // negative = West of Cascade Crest, positive = East of Crest
  distFromCoastKm: number;
}

export function evaluatePnwEcoZone(lng: number, lat: number): PnwZoneSample {
  // Only apply PNW Cascade/Coast eco-zoning within WA / OR / N-CA / SW-BC corridor
  if (lat < 40.5 || lat > 50.0 || lng < -125.6 || lng > -116.0) {
    return { zone: 'outside', eastOfCrestKm: 0, distFromCoastKm: 999 };
  }
  const kmPerDegLng = Math.cos((lat * Math.PI) / 180) * 111.32;
  const crestLng = getCascadeCrestLng(lat);
  const coastLng = getPacificCoastLng(lat);
  const eastOfCrestKm = (lng - crestLng) * kmPerDegLng;
  const distFromCoastKm = Math.max(0, (lng - coastLng) * kmPerDegLng);

  let zone: PnwEcoZone;
  if (distFromCoastKm <= 24) {
    zone = 'coast';
  } else if (eastOfCrestKm < -12) {
    zone = 'west';
  } else if (eastOfCrestKm <= 12) {
    zone = 'crest';
  } else {
    zone = 'east';
  }
  return { zone, eastOfCrestKm, distFromCoastKm };
}

export function passesEcoRegionFilter(
  lng: number,
  lat: number,
  filter: EcoRegionFilter,
): boolean {
  if (filter === 'all') return true;
  if (lat < 40.5 || lat > 50.0 || lng < -125.6 || lng > -116.0) return true;
  const crestLng = getCascadeCrestLng(lat);
  if (filter === 'east') return lng >= crestLng;
  return lng <= crestLng;
}

export function getEcoZoneLabel(zone: PnwEcoZone, lang: Lang): string {
  if (lang === 'en') {
    switch (zone) {
      case 'coast':
        return 'Coastal Fog Belt';
      case 'west':
        return 'West Cascades / Rainforest';
      case 'crest':
        return 'Cascade Crest Zone';
      case 'east':
        return 'East Cascades Rain Shadow';
      default:
        return 'Outside PNW Corridor';
    }
  }
  switch (zone) {
    case 'coast':
      return '海岸云杉雾带';
    case 'west':
      return 'Cascade 西坡雨林带';
    case 'crest':
      return 'Cascade 分水岭过渡带';
    case 'east':
      return 'Cascade 东坡雨影区';
    default:
      return 'PNW 分区外';
  }
}

function clamp01(v: number): number {
  return v <= 0 ? 0 : v >= 1 ? 1 : v;
}

function smoothRamp(x: number, edge0: number, edge1: number, val0: number, val1: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  const s = t * t * (3 - 2 * t);
  return val0 + (val1 - val0) * s;
}

// NLCD simplified class constant matching tileEngines.ts
const LC_DECIDUOUS_RIPARIAN = 2;

export interface RegionalFitResult {
  score: number; // 0..1 (1 = core home zone, <0.45 = strong regional penalty)
  zone: PnwEcoZone;
  eastOfCrestKm: number;
  distFromCoastKm: number;
  status: 'bonus' | 'neutral' | 'penalty';
  idealZh: string;
  idealEn: string;
  summaryZh: string;
  summaryEn: string;
}

export function computeSpeciesRegionalFit(
  speciesId: SpeciesId,
  lng: number,
  lat: number,
  elevFt: number,
  landCoverClass: number | null,
  concavityM: number,
): RegionalFitResult {
  const sample = evaluatePnwEcoZone(lng, lat);
  const { zone, eastOfCrestKm, distFromCoastKm } = sample;

  if (zone === 'outside') {
    return {
      score: 1.0,
      zone,
      eastOfCrestKm,
      distFromCoastKm,
      status: 'neutral',
      idealZh: 'PNW 以外未启用区域扣分',
      idealEn: 'No PNW regional penalty outside corridor',
      summaryZh: '位于 PNW 生态分区之外（不扣分）',
      summaryEn: 'Outside PNW eco-zone corridor (neutral)',
    };
  }

  let score = 1.0;
  let idealZh = '全 PNW 森林区';
  let idealEn = 'PNW Conifer / Mixed Forests';

  switch (speciesId) {
    case 'spring-king': {
      // Boletus rex-veris: heavily East Cascades dry pine/fir snowmelt zone!
      idealZh = 'Cascade 东坡雨影带';
      idealEn = 'East Cascades (Rain Shadow)';
      score = smoothRamp(eastOfCrestKm, -18, 10, 0.22, 1.0);
      break;
    }
    case 'porcini': {
      // Boletus edulis (Fall King): Coastal Sitka Spruce fog belt + West Cascades & Crest
      idealZh = '海岸雾带 + 西坡/分水岭';
      idealEn = 'Coast Fog Belt + West Cascades';
      if (distFromCoastKm <= 28 && elevFt <= 1600) {
        score = 1.0;
      } else {
        score = smoothRamp(eastOfCrestKm, 12, 55, 0.96, 0.48);
      }
      break;
    }
    case 'yellowfoot':
    case 'black-trumpet': {
      // Strongly maritime Westside & Coast moist hemlock/moss
      idealZh = '海岸 + Cascade 西坡湿润林';
      idealEn = 'Coast & West Cascades';
      score = smoothRamp(eastOfCrestKm, -6, 22, 1.0, 0.24);
      break;
    }
    case 'admirable': {
      // Strongly bound to Western Hemlock nurse logs (Westside + Crest hemlock)
      idealZh = '海岸 + 西坡/分水岭铁杉林';
      idealEn = 'Coast & West Cascades Hemlock';
      score = smoothRamp(eastOfCrestKm, 0, 28, 1.0, 0.26);
      break;
    }
    case 'fib-king':
    case 'hedgehog': {
      // Westside & Coast Douglas-fir / hemlock dominant
      idealZh = '海岸 + Cascade 西坡针叶林';
      idealEn = 'Coast & West Cascades Conifers';
      score = smoothRamp(eastOfCrestKm, -2, 30, 1.0, 0.30);
      break;
    }
    case 'chanterelle': {
      // Westside & Coast + moist Crest-adjacent East valleys (upper Cle Elum / Wenatchee)
      idealZh = '海岸 + 西坡 + 分水岭湿谷';
      idealEn = 'Coast, West Side & Moist Crest';
      score = smoothRamp(eastOfCrestKm, 8, 42, 1.0, 0.36);
      break;
    }
    case 'lions-mane': {
      // Moist old-growth fir/hemlock (Westside + Crest, tapering east)
      idealZh = '西坡 + 分水岭湿润老林';
      idealEn = 'West Cascades & Crest Old-Growth';
      score = smoothRamp(eastOfCrestKm, 10, 45, 1.0, 0.46);
      break;
    }
    case 'matsutake': {
      // Bimodal: Coastal shore-pine sand dunes (low elev) OR Cascade Crest/East volcanic pumice (high elev)
      idealZh = '分水岭/东坡火山带 或 海岸沙丘';
      idealEn = 'Crest/East Pumice or Coastal Dunes';
      const coastalDuneFit =
        distFromCoastKm <= 26 && elevFt <= 1100
          ? smoothRamp(distFromCoastKm, 14, 28, 1.0, 0.42)
          : 0.38;
      const eastVolcanicFit =
        elevFt >= 2000
          ? smoothRamp(eastOfCrestKm, -24, 4, 0.40, 1.0)
          : smoothRamp(eastOfCrestKm, -20, 10, 0.38, 0.65);
      score = Math.max(coastalDuneFit, eastVolcanicFit);
      break;
    }
    case 'hawks-wing': {
      // Sarcodon imbricatus: Montane Crest & Eastside spruce/fir/pine; scarce on warm coastal lowlands
      idealZh = '分水岭高带 + Cascade 东坡针叶林';
      idealEn = 'Cascade Crest & East Montane Conifers';
      if (distFromCoastKm <= 26 && elevFt < 2000) {
        score = 0.36;
      } else {
        score = smoothRamp(eastOfCrestKm, -38, -6, 0.68, 1.0);
      }
      break;
    }
    case 'leccinum': {
      // Eastside Aspen groves (L. insigne) OR riparian/deciduous birch hardwood anywhere; penalized in wet pure westside conifer
      idealZh = '东坡颤杨林 / 阔叶白桦溪岸林';
      idealEn = 'Eastside Aspen / Hardwood Birch Groves';
      if (landCoverClass === LC_DECIDUOUS_RIPARIAN) {
        score = 0.96;
      } else {
        score = smoothRamp(eastOfCrestKm, -14, 8, 0.36, 1.0);
      }
      break;
    }
    case 'oyster': {
      // Both sides along riparian hardwoods (Westside red alder lush; dry non-riparian Eastside slopes penalized)
      idealZh = '西坡红桤木 / 东坡湿润河谷';
      idealEn = 'Westside Alder / Eastside Riparian Valleys';
      if (eastOfCrestKm <= 12) {
        score = 1.0;
      } else {
        score = concavityM >= 0.2 ? 0.88 : smoothRamp(eastOfCrestKm, 12, 40, 0.85, 0.52);
      }
      break;
    }
    case 'morel': {
      // Both sides in burns, strongest in Crest/East conifer burns, milder on wet fog coast
      idealZh = '东坡 / 分水岭 / 针叶火场';
      idealEn = 'East / Crest / Conifer Burn Scars';
      score = distFromCoastKm <= 24 ? 0.65 : eastOfCrestKm >= -12 ? 1.0 : 0.9;
      break;
    }
  }

  const status: RegionalFitResult['status'] =
    score >= 0.8 ? 'bonus' : score >= 0.55 ? 'neutral' : 'penalty';

  const summaryZh =
    status === 'bonus'
      ? `命中${getEcoZoneLabel(zone, 'zh')}核心产区`
      : status === 'neutral'
        ? `${getEcoZoneLabel(zone, 'zh')}（过渡带轻微扣分）`
        : `${getEcoZoneLabel(zone, 'zh')}（非该菌常产区，已扣分）`;

  const summaryEn =
    status === 'bonus'
      ? `Prime zone: ${getEcoZoneLabel(zone, 'en')}`
      : status === 'neutral'
        ? `${getEcoZoneLabel(zone, 'en')} (transition — mild penalty)`
        : `${getEcoZoneLabel(zone, 'en')} (outside typical range — penalized)`;

  return {
    score,
    zone,
    eastOfCrestKm,
    distFromCoastKm,
    status,
    idealZh,
    idealEn,
    summaryZh,
    summaryEn,
  };
}
