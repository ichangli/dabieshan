import type MapView from '@arcgis/core/views/MapView'
import type { EcoData } from './useRegionLayers'

export async function exportReport(
  sortedItems: EcoData[],
  sortKeyVal: string,
  sortLabel: string,
  mapView: MapView,
  legendColors?: [string, string],
  legendLabel?: string
) {
  if (!mapView) return
  try {

    const scale = 2
    const screenshot = await mapView.takeScreenshot({
      format: 'png',
      width: mapView.width * scale,
      height: mapView.height * scale
    })
    const imgSrc = screenshot.dataUrl

    const headers = ['区域', '森林覆盖率(%)', '林地面积(km²)', '水资源总量(亿m³)', '人均水资源(m³)', '均温(°C)', '降水量(mm)', '湿地面积(km²)']
    const rows = sortedItems.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.forest?.coverage ?? '-'}</td>
        <td>${item.forest?.forestArea ?? '-'}</td>
        <td>${item.water?.totalWater ?? '-'}</td>
        <td>${item.water?.perCapitaWater ?? '-'}</td>
        <td>${item.climate?.avgTemp ?? '-'}</td>
        <td>${item.climate?.avgPrecipitation ?? '-'}</td>
        <td>${item.wetland?.wetlandArea ?? '-'}</td>
      </tr>`).join('')

    const now = new Date().toLocaleString('zh-CN')
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>大别山生态资源报告</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Microsoft YaHei',sans-serif; padding:24px 32px; color:#333; max-width:1100px; margin:0 auto; }
    h1 { font-size:24px; color:#1a5c2e; border-bottom:3px solid #2d8a4e; padding-bottom:12px; margin-bottom:8px; text-align:center; }
    .subtitle { text-align:center; color:#888; font-size:13px; margin-bottom:24px; }
    .map-img { display:block; max-width:100%; width:auto; border-radius:8px; box-shadow:0 2px 12px rgba(0,0,0,.12); margin:0 auto 28px; }
    h2 { font-size:18px; color:#1a5c2e; margin-bottom:12px; border-left:4px solid #2d8a4e; padding-left:10px; }
    table { width:100%; border-collapse:collapse; font-size:13px; margin-bottom:24px; }
    th { background:#2d8a4e; color:#fff; padding:10px 8px; text-align:center; font-weight:600; }
    td { padding:8px; border:1px solid #d4e8d8; text-align:center; }
    tr:nth-child(even) td { background:#f5faf6; }
    tr:nth-child(odd) td { background:#fff; }
    .footer { text-align:center; color:#aaa; font-size:12px; margin-top:32px; padding-top:16px; border-top:1px solid #e0e0e0; }
    .legend-wrap { display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:28px; font-size:13px; color:#555; }
    .legend-bar { width:200px; height:14px; border-radius:7px; border:1px solid #ccc; }
    .legend-title { font-weight:600; color:#1a5c2e; margin-left:4px; }
    @media print {
      body { padding:16px; }
      .map-img { max-height:400px; object-fit:cover; }
    }
  </style>
</head>
<body>
  <h1>大别山革命老区生态资源数据库</h1>
  <p class="subtitle">导出时间：${now} ｜ 排序方式：${sortLabel}（从高到低） ｜ 共 ${sortedItems.length} 个区域</p>

  <h2>地图快照</h2>
  <img class="map-img" src="${imgSrc}" alt="地图截图" />
${legendColors ? `
  <div class="legend-wrap">
    <span>低</span>
    <div class="legend-bar" style="background:linear-gradient(90deg, ${legendColors[0]}, ${legendColors[1]})"></div>
    <span>高</span>
    <span class="legend-title">${legendLabel ?? ''}</span>
  </div>` : ''}

  <h2>生态资源数据一览</h2>
  <table>
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <p class="footer">大别山革命老区生态资源数据库平台</p>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `大别山生态资源报告_${new Date().toISOString().slice(0, 10)}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('导出报告失败', e)
    throw e
  }
}
