import type { UnitSettings } from '../types/map';
import { formatDistanceFromMiles, IMPERIAL_UNITS } from './units';

const EARTH_RADIUS_MILES = 3958.7613;

export function haversineMiles(
  lng1: number,
  lat1: number,
  lng2: number,
  lat2: number,
): number {
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLng = (lng2 - lng1) * toRad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) *
      Math.cos(lat2 * toRad) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c;
}

export function formatDistanceFromCenter(
  miles: number,
  units: UnitSettings = IMPERIAL_UNITS,
): string {
  return formatDistanceFromMiles(miles, units);
}
