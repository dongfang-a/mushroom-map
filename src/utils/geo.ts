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

export function formatDistanceFromCenter(miles: number): string {
  const km = miles * 1.609344;
  if (miles < 0.5) {
    const meters = Math.round(km * 1000);
    return `${miles.toFixed(2)} mi (${meters} m)`;
  }
  if (miles < 100) {
    return `${miles.toFixed(1)} mi (${km.toFixed(1)} km)`;
  }
  return `${Math.round(miles)} mi (${Math.round(km)} km)`;
}
