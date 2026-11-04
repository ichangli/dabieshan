/** 从 shapefile 属性构建生态资源弹窗 HTML */
export function buildEcoHTML(attrs: Record<string, any>) {
  const na = '<span style="color:#999">暂无数据</span>'
  const f = (v: any) => (v != null && v !== '') ? v : null

  const fc = f(attrs.forest_cov)
  const fa = f(attrs.forest_are)
  const ft = f(attrs.forest_typ)
  const wt = f(attrs.water_tota)
  const wp = f(attrs.water_per_)
  const ct = f(attrs.climate_ty)
  const ca = f(attrs.climate_av)
  const cp = f(attrs.climate_pr)
  const cs = f(attrs.climate_su)
  const cf = f(attrs.climate_fr)
  const wa = f(attrs.wetland_ar)
  const mt = f(attrs.mineral_ty)
  const mr = f(attrs.mineral_re)

  return `
    <div style="font-family:sans-serif;min-width:320px;max-width:420px;padding:0 2px">
      <div style="font-size:13px;color:#666;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #2d8a4e">
        生态资源指标概览
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;line-height:1.6">
        <tr style="background:#f0f8f2">
          <td style="padding:8px 10px;border:1px solid #d4e8d8;font-weight:600;color:#1a5c2e;width:80px">🌲 森林</td>
          <td style="padding:8px 10px;border:1px solid #d4e8d8;color:#333">
            ${fc != null ? `覆盖率 <b>${fc}%</b>，林地面积 <b>${fa} km²</b><br><span style="font-size:12px;color:#888">主要类型：${ft ?? '-'}</span>` : na}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 10px;border:1px solid #d4e8d8;font-weight:600;color:#1a5c2e">💧 水资源</td>
          <td style="padding:8px 10px;border:1px solid #d4e8d8;color:#333">
            ${wt != null ? `总量 <b>${wt} 亿 m³</b>，人均 <b>${wp} m³</b>` : na}
          </td>
        </tr>
        <tr style="background:#f0f8f2">
          <td style="padding:8px 10px;border:1px solid #d4e8d8;font-weight:600;color:#1a5c2e">🌤️ 气候</td>
          <td style="padding:8px 10px;border:1px solid #d4e8d8;color:#333">
            ${ca != null ? `${ct ?? ''}<br>均温 <b>${ca}°C</b>，降水 <b>${cp}mm</b><br><span style="font-size:12px;color:#888">日照 ${cs}h，无霜期 ${cf}天</span>` : na}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 10px;border:1px solid #d4e8d8;font-weight:600;color:#1a5c2e">🌊 湿地</td>
          <td style="padding:8px 10px;border:1px solid #d4e8d8;color:#333">
            ${wa != null ? `湿地面积 <b>${wa} km²</b>` : na}
          </td>
        </tr>
        <tr style="background:#f0f8f2">
          <td style="padding:8px 10px;border:1px solid #d4e8d8;font-weight:600;color:#1a5c2e">⛏️ 矿产</td>
          <td style="padding:8px 10px;border:1px solid #d4e8d8;color:#333">
            ${mt != null ? `<b>${mt}</b><br><span style="font-size:12px;color:#888">${mr ?? ''}</span>` : na}
          </td>
        </tr>
      </table>
    </div>
  `
}
