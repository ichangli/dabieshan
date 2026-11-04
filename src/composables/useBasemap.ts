import { ref } from 'vue'
import type Map from '@arcgis/core/Map'
import Basemap from '@arcgis/core/Basemap'
import esriConfig from '@arcgis/core/config'

const apiKey = import.meta.env.VITE_ARCGIS_API_KEY?.trim()
export const HAS_ONLINE_BASEMAP = Boolean(apiKey)
if (apiKey) esriConfig.apiKeys.basemapStyles = apiKey

export function useBasemap() {
  const currentBasemap = ref<string>('vector')
  const vecBasemap = apiKey
    ? new Basemap({ style: { id: 'arcgis/light-gray', language: 'zh-CN' } })
    : new Basemap({ baseLayers: [], title: '本地专题底板' })
  const imgBasemap = apiKey
    ? new Basemap({ style: { id: 'arcgis/imagery', language: 'zh-CN' } })
    : vecBasemap

  function selectBasemap(value: string, map: Map) {
    currentBasemap.value = value
    map.basemap = value === 'vector' ? vecBasemap : imgBasemap
  }
  return { currentBasemap, vecBasemap, imgBasemap, selectBasemap }
}
