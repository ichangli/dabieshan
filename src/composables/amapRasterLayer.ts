import BaseTileLayer from '@arcgis/core/layers/BaseTileLayer'
import SpatialReference from '@arcgis/core/geometry/SpatialReference'
import TileInfo from '@arcgis/core/layers/support/TileInfo'
import { wgsToGcj, lonLatToPixel, pixelToLonLat } from '@/utils/gcj02'

// Official AMap custom-tile example endpoint. Never append JS API credentials.
const endpoint = 'https://wprd01.is.autonavi.com/appmaptile'
const cache = new Map<string, Promise<Uint8ClampedArray>>()
function sourceTile(z: number, x: number, y: number) {
  const key = `${z}/${x}/${y}`
  let result = cache.get(key)
  if (!result) {
    result = (async () => {
      const response = await fetch(`${endpoint}?x=${x}&y=${y}&z=${z}&size=1&scl=1&style=8&ltype=11`,
        { signal: AbortSignal.timeout(15000) })
      if (!response.ok) throw new Error('高德底图请求失败')
      const bitmap = await createImageBitmap(await response.blob())
      const canvas = document.createElement('canvas'); canvas.width=canvas.height=256
      const ctx=canvas.getContext('2d')!
      ctx.drawImage(bitmap,0,0,256,256); bitmap.close()
      return ctx.getImageData(0,0,256,256).data
    })()
    cache.set(key,result)
    result.catch(() => cache.delete(key))
    if (cache.size>64) cache.delete(cache.keys().next().value!)
  }
  return result
}
async function warpTile(z: number, row: number, col: number, signal?: AbortSignal) {
  const canvas=document.createElement('canvas'); canvas.width=canvas.height=256
  const ctx=canvas.getContext('2d')!, output=ctx.createImageData(256,256)
  const pixels=new Int32Array(256*256*2)
  const required=new Map<string,[number,number]>()
  for(let y=0;y<256;y++) for(let x=0;x<256;x++) {
    const [lon,lat]=pixelToLonLat(col*256+x+0.5,row*256+y+0.5,z)
    const gcj=wgsToGcj(lon,lat), p=lonLatToPixel(gcj[0],gcj[1],z)
    const sx=Math.floor(p[0]), sy=Math.floor(p[1]), i=(y*256+x)*2
    pixels[i]=sx; pixels[i+1]=sy
    const tx=Math.floor(sx/256),ty=Math.floor(sy/256)
    required.set(`${tx}/${ty}`,[tx,ty])
  }
  const sources=new Map<string,Uint8ClampedArray>()
  await Promise.all([...required].map(async ([key,[x,y]])=>sources.set(key,await sourceTile(z,x,y))))
  signal?.throwIfAborted()
  for(let i=0;i<256*256;i++) {
    const sx=pixels[i*2]!,sy=pixels[i*2+1]!
    const data=sources.get(`${Math.floor(sx/256)}/${Math.floor(sy/256)}`)!
    const offset=((sy%256)*256+sx%256)*4
    output.data.set(data.subarray(offset,offset+4),i*4)
  }
  ctx.putImageData(output,0,0)
  return canvas
}
const AmapRasterLayer=BaseTileLayer.createSubclass({
  fetchTile(level: number,row: number,col: number,options?: {signal?: AbortSignal}) {
    return warpTile(level,row,col,options?.signal)
  }
})
export function createAmapLayer() {
  return new AmapRasterLayer({
    title:'高德标准底图（显示纠偏）',
    spatialReference:{wkid:3857},
    tileInfo:TileInfo.create({spatialReference:new SpatialReference({wkid:3857})}),
    fullExtent:{xmin:8000000,ymin:0,xmax:15400000,ymax:7600000,spatialReference:{wkid:3857}},
    minScale:75000000,maxScale:2000,
    copyright:'© 高德地图 AutoNavi'
  }) as BaseTileLayer
}
