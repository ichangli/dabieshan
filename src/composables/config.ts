import esriConfig from '@arcgis/core/config'
esriConfig.assetsPath = import.meta.env.BASE_URL + 'assets'

export const GEO_SERVER_BASE: string =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEOSERVER_BASE) || ''

esriConfig.request.interceptors.push({
  urls: /\/geoserver/,

  before(params: any) {
    if (!GEO_SERVER_BASE) {
      params.url = params.url.replace(/^https?:\/\/[^/]+/, '')
    }

    const token = localStorage.getItem('auth_token')

    if (token) {
      params.requestOptions.headers = {
        ...params.requestOptions.headers,
        Authorization: 'Bearer ' + token
      }
    }
  }
})

export const REGIONS = [
  '信阳市', '六安市', '安庆市', '黄冈市', '随州市',
  '驻马店市', '桐柏县', '唐河县', '孝南区', '安陆市',
  '应城市', '大悟县', '孝昌县', '云梦县', '枣阳市',
  '黄陂区', '新洲区',
]

export const FIELD_ATTR_MAP: Record<string, { attr: string; unit: string }> = {
  'forest.coverage':          { attr: 'forest_cov',   unit: '%' },
  'forest.forestArea':        { attr: 'forest_are',   unit: ' km²' },
  'water.totalWater':         { attr: 'water_tota',   unit: ' 亿m³' },
  'water.perCapitaWater':     { attr: 'water_per_',   unit: ' m³' },
  'climate.avgTemp':          { attr: 'climate_av',   unit: '°C' },
  'climate.avgPrecipitation': { attr: 'climate_pr',   unit: 'mm' },
  'wetland.wetlandArea':      { attr: 'wetland_ar',   unit: ' km²' },
}
