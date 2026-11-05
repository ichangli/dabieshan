/** 从 shapefile 属性构建生态资源弹窗 HTML */
export function buildEcoHTML(attrs: Record<string, any>) {
  const na = '<span style="color:#5d6e7c">暂无数据</span>'
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
      <div style="font-size:13px;color:#5d6e7c;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #75956a">
        生态资源指标概览
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;line-height:1.6">
        <tr style="background:#edf2f4">
          <td style="padding:8px 10px;border:1px solid #d2dde3;font-weight:600;color:#476c83;width:80px">🌲 森林</td>
          <td style="padding:8px 10px;border:1px solid #d2dde3;color:#2d3e4a">
            ${fc != null ? `覆盖率 <b>${fc}%</b>，林地面积 <b>${fa} km²</b><br><span style="font-size:12px;color:#5d6e7c">主要类型：${ft ?? '-'}</span>` : na}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 10px;border:1px solid #d2dde3;font-weight:600;color:#476c83">💧 水资源</td>
          <td style="padding:8px 10px;border:1px solid #d2dde3;color:#2d3e4a">
            ${wt != null ? `总量 <b>${wt} 亿 m³</b>，人均 <b>${wp} m³</b>` : na}
          </td>
        </tr>
        <tr style="background:#edf2f4">
          <td style="padding:8px 10px;border:1px solid #d2dde3;font-weight:600;color:#476c83">🌤️ 气候</td>
          <td style="padding:8px 10px;border:1px solid #d2dde3;color:#2d3e4a">
            ${ca != null ? `${ct ?? ''}<br>均温 <b>${ca}°C</b>，降水 <b>${cp}mm</b><br><span style="font-size:12px;color:#5d6e7c">日照 ${cs}h，无霜期 ${cf}天</span>` : na}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 10px;border:1px solid #d2dde3;font-weight:600;color:#476c83">🌊 湿地</td>
          <td style="padding:8px 10px;border:1px solid #d2dde3;color:#2d3e4a">
            ${wa != null ? `湿地面积 <b>${wa} km²</b>` : na}
          </td>
        </tr>
        <tr style="background:#edf2f4">
          <td style="padding:8px 10px;border:1px solid #d2dde3;font-weight:600;color:#476c83">⛏️ 矿产</td>
          <td style="padding:8px 10px;border:1px solid #d2dde3;color:#2d3e4a">
            ${mt != null ? `<b>${mt}</b><br><span style="font-size:12px;color:#5d6e7c">${mr ?? ''}</span>` : na}
          </td>
        </tr>
      </table>
    </div>
  `
}
