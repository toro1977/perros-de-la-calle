export function formatDistance(km: number): string {
  const meters = km * 1000;
  if (meters < 100) return 'Acá nomás';
  if (km < 1) return `a ${Math.round(meters)} m`;
  if (km <= 10) return `a ${km.toFixed(1).replace('.', ',')} km`;
  return `a ${Math.round(km)} km`;
}
