import type { AppPreferences, Lang, UnitSettings } from '../types/map';

export const IMPERIAL_UNITS: UnitSettings = {
  elevation: 'ft',
  temperature: 'F',
  rain: 'in',
  distance: 'mi',
  area: 'ac',
};

export const METRIC_UNITS: UnitSettings = {
  elevation: 'm',
  temperature: 'C',
  rain: 'mm',
  distance: 'km',
  area: 'ha',
};

const IMPERIAL_REGIONS = new Set(['US', 'LR', 'MM']);

export function detectSystemUnitSystem(): 'imperial' | 'metric' {
  if (typeof navigator === 'undefined') return 'imperial';
  const primary = (navigator.languages?.[0] || navigator.language || 'en-US').trim();
  const parts = primary.replace('_', '-').split('-');
  const region = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
  if (region && IMPERIAL_REGIONS.has(region)) return 'imperial';
  if (primary.toLowerCase() === 'en') return 'imperial';
  return 'metric';
}

export function resolveUnits(prefs: AppPreferences): UnitSettings {
  if (prefs.unitPreset === 'imperial') return IMPERIAL_UNITS;
  if (prefs.unitPreset === 'metric') return METRIC_UNITS;
  if (prefs.unitPreset === 'auto') {
    return detectSystemUnitSystem() === 'imperial' ? IMPERIAL_UNITS : METRIC_UNITS;
  }
  return prefs.units;
}

export function ftToMeters(ft: number): number {
  return Math.round(ft / 3.28084);
}

export function metersToFt(m: number): number {
  return Math.round(m * 3.28084);
}

export function formatElevation(elevFt: number | null, units: UnitSettings): string {
  if (elevFt === null || !Number.isFinite(elevFt)) return '—';
  if (units.elevation === 'm') {
    return `${ftToMeters(elevFt).toLocaleString()} m`;
  }
  return `${Math.round(elevFt).toLocaleString()} ft`;
}

export function formatElevationSecondary(
  elevFt: number | null,
  elevM: number | null,
  units: UnitSettings,
): string {
  if (elevFt === null && elevM === null) return '';
  if (units.elevation === 'm') {
    const ft = elevFt !== null ? Math.round(elevFt) : metersToFt(elevM!);
    return `${ft.toLocaleString()} ft`;
  }
  const m = elevM !== null ? Math.round(elevM) : ftToMeters(elevFt!);
  return `${m.toLocaleString()} m`;
}

export function formatElevationRange(minFt: number, maxFt: number, units: UnitSettings): string {
  if (units.elevation === 'm') {
    return `${ftToMeters(minFt).toLocaleString()}–${ftToMeters(maxFt).toLocaleString()} m`;
  }
  return `${Math.round(minFt).toLocaleString()}–${Math.round(maxFt).toLocaleString()} ft`;
}

export function formatSmallMeters(m: number, units: UnitSettings, signed = false): string {
  if (units.elevation === 'ft') {
    const ft = m * 3.28084;
    const prefix = signed && ft > 0 ? '+' : '';
    return `${prefix}${ft.toFixed(1)} ft`;
  }
  const prefix = signed && m > 0 ? '+' : '';
  return `${prefix}${m.toFixed(1)} m`;
}

export function formatTemperatureFromF(tempF: number | null, units: UnitSettings): string {
  if (tempF === null || !Number.isFinite(tempF)) return '—';
  if (units.temperature === 'C') {
    const c = ((tempF - 32) * 5) / 9;
    return `${c.toFixed(1).replace(/\.0$/, '')}°C`;
  }
  return `${Math.round(tempF)}°F`;
}

export function formatRainFromIn(rainIn: number | null, units: UnitSettings): string {
  if (rainIn === null || !Number.isFinite(rainIn)) return '—';
  if (units.rain === 'mm') {
    const mm = rainIn * 25.4;
    return mm >= 10 ? `${Math.round(mm)} mm` : `${mm.toFixed(1)} mm`;
  }
  return `${rainIn.toFixed(2)} in`;
}

export function formatDistanceFromMiles(miles: number, units: UnitSettings): string {
  if (!Number.isFinite(miles)) return '—';
  if (units.distance === 'km') {
    const km = miles * 1.609344;
    if (km < 1) return `${Math.round(km * 1000)} m`;
    if (km < 100) return `${km.toFixed(1)} km`;
    return `${Math.round(km).toLocaleString()} km`;
  }
  if (miles < 0.25) {
    return `${Math.round(miles * 5280).toLocaleString()} ft`;
  }
  if (miles < 100) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles).toLocaleString()} mi`;
}

export function formatAreaFromAcres(acres: number, units: UnitSettings, lang: Lang = 'en'): string {
  if (!Number.isFinite(acres)) return '—';
  if (units.area === 'ha') {
    const ha = Math.round(acres * 0.404686);
    return lang === 'zh' ? `${ha.toLocaleString()} 公顷` : `${ha.toLocaleString()} ha`;
  }
  return lang === 'zh' ? `${Math.round(acres).toLocaleString()} ac` : `${Math.round(acres).toLocaleString()} ac`;
}
