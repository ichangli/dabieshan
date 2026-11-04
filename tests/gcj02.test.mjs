import test from 'node:test'
import assert from 'node:assert/strict'
import {wgsToGcj,lonLatToPixel,pixelToLonLat} from '../src/utils/gcj02.ts'
test('coordinates outside China are unchanged',()=>{
 assert.deepEqual(wgsToGcj(-73.98,40.75),[-73.98,40.75])
})
test('forward conversion reference in Beijing',()=>{
 const [x,y]=wgsToGcj(116.404,39.915)
 assert.ok(Math.abs(x-116.41024449916938)<1e-8)
 assert.ok(Math.abs(y-39.91640428150164)<1e-8)
})
test('Web Mercator pixel conversion round trips at supported display zooms',()=>{
 for(const z of [3,7,10,15,18]) for(const [x,y] of [[115.34,31.78],[113,30],[117,34]]) {
  const p=lonLatToPixel(x,y,z),result=pixelToLonLat(p[0],p[1],z)
  assert.ok(Math.abs(result[0]-x)<1e-10)
  assert.ok(Math.abs(result[1]-y)<1e-10)
 }
})
test('regional display correction is not accidentally identity',()=>{
 const point=wgsToGcj(115.34,31.78)
 assert.ok(point[0]>115.34 && point[0]-115.34<0.02)
 assert.ok(Math.abs(point[1]-31.78)<0.02)
})
