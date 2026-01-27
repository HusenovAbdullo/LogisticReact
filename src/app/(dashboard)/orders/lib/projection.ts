/**
 * Equirectangular projection (lon/lat -> x/y) for an SVG viewport.
 * Bu demo xarita uchun yetarli (dunyo xaritasi).
 */
export function project(lat: number, lng: number, width: number, height: number) {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}
