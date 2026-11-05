import { ref } from 'vue'
import type Map from '@arcgis/core/Map'
import type MapView from '@arcgis/core/views/MapView'
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import { REGIONS, GEO_SERVER_BASE } from './config'
import { IS_DEMO } from './mode'
import { buildEcoHTML } from './ecoPopupHtml'

export interface EcoData {
  name: string

  forest: {
    coverage: number | null
    forestArea: number | null
    mainTypes: string | null
  }

  water: {
    totalWater: number | null
    perCapitaWater: number | null
  }

  climate: {
    climateType: string | null
    avgTemp: number | null
    avgPrecipitation: number | null
    avgSunshine: number | null
    frostFreeDays: number | null
  }

  wetland: {
    wetlandArea: number | null
  }

  mineral: {
    types: string | null
    reserves: string | number | null
  }
}

export function useRegionLayers() {
  const ecoDataList = ref<EcoData[]>([])
  const ecoDataLoading = ref(true)
  const regionLayers: Record<string, GeoJSONLayer> = {}

  function loadRegionLayers(map: Map) {
    const defaultRenderer = {
      type: 'simple',
      symbol: {
        type: 'simple-fill',
        color: [137, 166, 121, 0.23],
        outline: { color: [102, 131, 91, 0.75], width: 0.9 }
      }
    } as any

    REGIONS.forEach(name => {
      const encoded = encodeURIComponent(name)
      const dataUrl = IS_DEMO
        ? `${import.meta.env.BASE_URL}data/regions/${encoded}.json`
        : `${GEO_SERVER_BASE}/geoserver/tif/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tif:${encoded}&outputFormat=application/json`

      const layer = new GeoJSONLayer({
        url: dataUrl,
        title: name,
        outFields: ['*'],
        renderer: defaultRenderer,
        labelingInfo: [{
          labelExpressionInfo: { expression: `'${name}'` },
          labelPlacement: 'always-horizontal',
          deconflictionStrategy: 'static',
          symbol: {
            type: 'text',
            color: '#29433a',
            font: { family: 'sans-serif', size: 9, weight: 'bold' },
            haloColor: 'rgba(255,255,255,0.95)',
            haloSize: 1,
            verticalAlignment: 'middle',
            horizontalAlignment: 'center',
          }
        }],
        popupTemplate: {
          title: name,
          content: (feature: any) => buildEcoHTML(feature.graphic?.attributes ?? {})
        }
      })

      regionLayers[name] = layer
      map.add(layer)
    })
  }

  async function buildEcoDataList() {
    ecoDataLoading.value = true
    const data: EcoData[] = []
    try {
      for (const name of REGIONS) {
        const layer = regionLayers[name]
        if (!layer) continue
        try {
          const query = layer.createQuery()
          query.where = '1=1'
          query.outFields = ['*']
          query.num = 1
          const result = await layer.queryFeatures(query)
          if (result.features.length > 0 && result.features[0]) {
            const a = result.features[0].attributes ?? {}
            data.push({
              name,
              forest: { coverage: a.forest_cov, forestArea: a.forest_are, mainTypes: a.forest_typ },
              water: { totalWater: a.water_tota, perCapitaWater: a.water_per_ },
              climate: { climateType: a.climate_ty, avgTemp: a.climate_av, avgPrecipitation: a.climate_pr, avgSunshine: a.climate_su, frostFreeDays: a.climate_fr },
              wetland: { wetlandArea: a.wetland_ar },
              mineral: { types: a.mineral_ty, reserves: a.mineral_re },
            })
          }
        } catch (e) { console.warn('读取区域数据失败', name, e) }
      }
      ecoDataList.value = data.sort((a, b) => (b.forest?.coverage ?? 0) - (a.forest?.coverage ?? 0))
      console.log('GeoServer 数据加载完成:', ecoDataList.value.length, '个区域，页面打开后', Math.round(performance.now()), 'ms')
    } finally {
      ecoDataLoading.value = false
    }
  }

  async function zoomToRegion(name: string, mapView: MapView) {
    const layer = regionLayers[name]
    if (!layer || !mapView) return
    try {
      const query = layer.createQuery()
      query.where = '1=1'
      query.outFields = ['*']
      query.returnGeometry = true
      query.num = 1
      const result = await layer.queryFeatures(query)
      if (result.features.length > 0 && result.features[0]) {
        const g = result.features[0]
        if (!g.geometry) return
        mapView.zoom = 10
        await mapView.goTo(g.geometry as any)
        mapView.openPopup({
          title: name,
          content: buildEcoHTML(g.attributes ?? {}),
          location: g.geometry as any
        })
      }
    } catch (e) {
      console.warn('定位失败', name, e)
    }
  }

  return { regionLayers, ecoDataList, ecoDataLoading, loadRegionLayers, buildEcoDataList, zoomToRegion }
}
