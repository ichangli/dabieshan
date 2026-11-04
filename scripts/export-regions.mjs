import { mkdir, writeFile } from 'node:fs/promises'

const REGIONS = [
    '信阳市', '六安市', '安庆市', '黄冈市', '随州市',
    '驻马店市', '桐柏县', '唐河县', '孝南区', '安陆市',
    '应城市', '大悟县', '孝昌县', '云梦县', '枣阳市',
    '黄陂区', '新洲区',
]

const GEOSERVER = 'http://localhost:8080'
const OUT_DIR = 'public/data/regions'

await mkdir(OUT_DIR, { recursive: true })

for (const name of REGIONS) {
    const url = `${GEOSERVER}/geoserver/tif/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tif:${encodeURIComponent(name)}&outputFormat=application/json`
    const res = await fetch(url)
    if (!res.ok) {
        console.error('失败：', name, res.status)
        continue
    }
    const text = await res.text()
    await writeFile(`${OUT_DIR}/${name}.json`, text, 'utf8')
    console.log('已导出：', name, Math.round(text.length / 1024), 'KB')
}