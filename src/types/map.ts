export type SpeciesId =
  | 'yellowfoot'
  | 'hedgehog'
  | 'black-trumpet'
  | 'oyster'
  | 'lions-mane'
  | 'chanterelle'
  | 'matsutake'
  | 'porcini'
  | 'fib-king'
  | 'admirable'
  | 'leccinum'
  | 'morel';

export type Lang = 'zh' | 'en';
export type LangPref = 'auto' | 'zh' | 'en';
export type UnitPreset = 'auto' | 'imperial' | 'metric' | 'custom';

export interface UnitSettings {
  elevation: 'ft' | 'm';
  temperature: 'F' | 'C';
  rain: 'in' | 'mm';
  distance: 'mi' | 'km';
  area: 'ac' | 'ha';
}

export interface AppPreferences {
  langPref: LangPref;
  unitPreset: UnitPreset;
  units: UnitSettings;
}

export type BasemapId =
  | 'esri-imagery'
  | 'esri-topo'
  | 'usgs-topo'
  | 'opentopomap'
  | 'osm';

export interface BasemapDef {
  id: BasemapId;
  name: string;
  nameEn: string;
  subtitle: string;
  subtitleEn: string;
  tiles: string[];
  tileSize: number;
  maxzoom: number;
  attribution: string;
}

export type OverlayKind =
  | 'species-protocol'
  | 'elevband-protocol'
  | 'wildfire-geojson'
  | 'padus-geojson'
  | 'inat-geojson'
  | 'inat-heatmap'
  | 'arcgis-export'
  | 'arcgis-image'
  | 'wms';

export interface LegendItem {
  label: string;
  labelEn?: string;
  color: string;
}

export interface OverlayDef {
  id: string;
  name: string;
  nameEn: string;
  shortName: string;
  shortNameEn: string;
  categoryId: string;
  kind: OverlayKind;
  description: string;
  descriptionEn: string;
  defaultVisible: boolean;
  defaultOpacity: number;
  color: string;
  fireYear?: number;
  url?: string;
  tileSize?: number;
  minzoom?: number;
  maxzoom?: number;
  legends?: LegendItem[];
}

export interface OverlayCategory {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
}

export interface OverlayRuntimeState {
  visible: boolean;
  opacity: number;
  loading?: boolean;
  error?: string | null;
}

export interface SpeciesModelOverride {
  minElevFt: number;
  maxElevFt: number;
  minCanopyPct: number;
  useCanopy: boolean;
  burnScarOnly: boolean;
}

export interface ElevBandParams {
  minFt: number;
  maxFt: number;
}

export interface FireSummary {
  id: string;
  name: string;
  year: number;
  acres: number;
  state: string;
  rank: 'A' | 'B' | 'C' | 'D';
  center: [number, number];
  discoveryDate?: string;
}

export interface PnwHotspot {
  id: string;
  name: string;
  nameEn?: string;
  region: string;
  regionEn: string;
  state: 'OR' | 'WA';
  elevMinFt: number;
  elevMaxFt: number;
  elevBand: string;
  habitat: string;
  habitatEn: string;
  center: [number, number];
  zoom: number;
}

export interface InatObservation {
  id: number;
  taxonId: number;
  speciesName: string;
  commonName: string;
  observedOn: string;
  placeGuess: string;
  lng: number;
  lat: number;
  photoUrl: string | null;
  userLogin: string;
  qualityGrade: string;
  obscured: boolean;
  uri: string;
}

export type InatTimeRange = '30d' | '365d' | 'all';

export interface SoilInfo {
  mapUnitName: string;
  componentName: string;
  drainageClass: string;
  taxClass: string;
  matsutakeFriendly: boolean;
  matsutakeTier: 'prime' | 'moderate' | 'weak' | 'none';
  matsutakeBadge: string | null;
}

export type LegalityRuleKey =
  | 'prohibited'
  | 'nps-rainier'
  | 'nps-olympic'
  | 'nps-north-cascades'
  | 'usfs-wilderness'
  | 'usfs'
  | 'blm'
  | 'state-forestry'
  | 'nps-other'
  | 'state-park'
  | 'restricted-other';

export interface ScoreFactorBreakdown {
  key: 'landcover' | 'elevation' | 'slope' | 'aspect' | 'canopy' | 'moisture';
  label: string;
  actual: string;
  ideal: string;
  status: 'bonus' | 'neutral' | 'penalty';
  summary: string;
  hardGate?: boolean;
}

export interface PointInspection {
  lng: number;
  lat: number;
  loading: boolean;
  elevationFt: number | null;
  elevationM: number | null;
  slopeDeg: number | null;
  slopePct: number | null;
  aspectDeg: number | null;
  aspectDir: string | null;
  canopyPct: number | null;
  concavityM: number | null;
  landCoverClass?: number | null;
  metersPerPx?: number;
  landformLabel: string | null;
  activeSpeciesId: SpeciesId;
  activeScore: number | null;
  activeTier: string | null;
  scoreBreakdown?: ScoreFactorBreakdown[];
  inatSighting?: InatObservation | null;
  soil: SoilInfo | null;
  fires: Array<{
    name: string;
    year: number;
    acres: number;
    state: string;
    rank: string;
    discoveryDate?: string;
  }>;
  publicAccess: {
    status: 'legal' | 'restricted' | 'prohibited';
    ruleKey?: LegalityRuleKey;
    statusLabel: string;
    ruleHint: string;
    access: string;
    unitName: string;
    manager: string;
    designation: string;
  } | null;
  weather: {
    rain24hIn: number | null;
    rain7dIn: number | null;
    soilTempF: number | null;
    soilMoisturePct: number | null;
  } | null;
}

export interface ForageWaypoint {
  id: string;
  name: string;
  species: SpeciesId | 'Other';
  notes: string;
  lng: number;
  lat: number;
  elevationFt: number | null;
  createdAt: number;
}
