import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

// ===== 可调整的参数 =====
const GEOSERVER = 'http://localhost:8080'
const LAYER = 'tif:cutting'
const GRIDSET = 'EPSG:900913'
const FORMAT = 'image/png'
const MIN_ZOOM = 0
const MAX_ZOOM = 10
const PAD = 0.05
const CONCURRENCY = 6
const OUT_DIR = 'public/tiles/cutting'
const REGION_DIR = 'public/data/regions'
// =======================

const REGIONS = [
  '信阳市', '六安市', '安庆市', '黄冈市', '随州市',
  '驻马店市', '桐柏县', '唐河县', '孝南区', '安陆市',
  '应城市', '大悟县', '孝昌县', '云梦县', '枣阳市',
  '黄陂区', '新洲区',
]

// 1. 用已导出的区域数据算出范围（经纬度）
let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90

function walk(coords) {
  if (typeof coords[0] === 'number') {
    const [lon, lat] = coords
    minLon = Math.min(minLon, lon)
    maxLon = Math.max(maxLon, lon)
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
    return
  }
  for (const item of coords) walk(item)
}

for (const name of REGIONS) {
  const text = await readFile(`${REGION_DIR}/${name}.json`, 'utf8')
  const data = JSON.parse(text)
  for (const feature of data.features) {
    if (feature.geometry) walk(feature.geometry.coordinates)
  }
}

if (minLon < -180 || maxLon > 180 || minLat < -90 || maxLat > 90) {
  console.error('区域坐标不是经纬度，脚本无法继续：', { minLon, maxLon, minLat, maxLat })
  process.exit(1)
}
console.log('数据范围：', { minLon, maxLon, minLat, maxLat })

// 2. 经纬度 -> 瓦片行列号（网页墨卡托，原点在左上角）
function lonToCol(lon, z) {
  return Math.floor(((lon + 180) / 360) * 2 ** z)
}

function latToRow(lat, z) {
  const rad = (lat * Math.PI) / 180
  return Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z)
}

const tiles = []
for (let z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
  const n = 2 ** z
  const colMin = Math.max(0, lonToCol(minLon - PAD, z))
  const colMax = Math.min(n - 1, lonToCol(maxLon + PAD, z))
  const rowMin = Math.max(0, latToRow(maxLat + PAD, z))
  const rowMax = Math.min(n - 1, latToRow(minLat - PAD, z))
  const before = tiles.length
  for (let col = colMin; col <= colMax; col++) {
    for (let row = rowMin; row <= rowMax; row++) {
      tiles.push({ z, col, row })
    }
  }
  console.log(`层级 ${z}：${tiles.length - before} 张`)
}
console.log('合计', tiles.length, '张，开始下载')

// 3. 下载
let failed = 0
let totalBytes = 0

async function download({ z, col, row }) {
  const url = `${GEOSERVER}/geoserver/gwc/service/wmts?service=WMTS&version=1.0.0&request=GetTile&layer=${LAYER}&style=&tilematrixset=${GRIDSET}&tilematrix=${GRIDSET}:${z}&tilerow=${row}&tilecol=${col}&format=${FORMAT}`
  const res = await fetch(url)
  const type = res.headers.get('content-type') || ''
  if (!res.ok || !type.startsWith('image/')) {
    failed++
    if (failed <= 3) console.error('失败：', res.status, type, url)
    return
  }
  const buf = Buffer.from(await res.arrayBuffer())
  const file = `${OUT_DIR}/${z}/${col}/${row}.png`
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, buf)
  totalBytes += buf.length
}

for (let i = 0; i < tiles.length; i += CONCURRENCY) {
  await Promise.all(tiles.slice(i, i + CONCURRENCY).map(download))
  if (failed >= 10) {
    console.error('失败太多，已停止')
    break
  }
}

console.log('完成：成功', tiles.length - failed, '张，失败', failed, '张，共', (totalBytes / 1024 / 1024).toFixed(1), 'MB')