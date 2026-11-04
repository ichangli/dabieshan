/** Display-only WGS84 -> GCJ-02 approximation; source GIS data stays WGS84. */
export function wgsToGcj(lon: number, lat: number): [number, number] {
  if (lon < 72.004 || lon > 137.8347 || lat < 0.8293 || lat > 55.8271) return [lon, lat]
  const x = lon - 105, y = lat - 35, pi = Math.PI
  let dy = -100 + 2*x + 3*y + 0.2*y*y + 0.1*x*y + 0.2*Math.sqrt(Math.abs(x))
  let dx = 300 + x + 2*y + 0.1*x*x + 0.1*x*y + 0.1*Math.sqrt(Math.abs(x))
  const common = (20*Math.sin(6*x*pi) + 20*Math.sin(2*x*pi))*2/3
  dy += common + (20*Math.sin(y*pi)+40*Math.sin(y*pi/3))*2/3
    + (160*Math.sin(y*pi/12)+320*Math.sin(y*pi/30))*2/3
  dx += common + (20*Math.sin(x*pi)+40*Math.sin(x*pi/3))*2/3
    + (150*Math.sin(x*pi/12)+300*Math.sin(x*pi/30))*2/3
  const rad = lat*pi/180, a = 6378245, ee = 0.006693421622965943
  const magic = 1 - ee*Math.sin(rad)**2, root = Math.sqrt(magic)
  return [lon + dx*180/(a/root*Math.cos(rad)*pi),
    lat + dy*180/(a*(1-ee)/(magic*root)*pi)]
}
export function lonLatToPixel(lon: number, lat: number, zoom: number): [number, number] {
  const n = 256*2**zoom, rad = lat*Math.PI/180
  return [(lon+180)/360*n, (1-Math.asinh(Math.tan(rad))/Math.PI)/2*n]
}
export function pixelToLonLat(x: number, y: number, zoom: number): [number, number] {
  const n=256*2**zoom
  return [x/n*360-180, Math.atan(Math.sinh(Math.PI*(1-2*y/n)))*180/Math.PI]
}
