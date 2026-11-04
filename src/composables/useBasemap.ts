import { ref } from 'vue'
import type Map from '@arcgis/core/Map'
import Basemap from '@arcgis/core/Basemap'
import { createAmapLayer } from './amapRasterLayer'

export const HAS_ONLINE_BASEMAP = true
export function useBasemap() {
  const currentBasemap = ref<string>('vector')
  const vecBasemap = new Basemap({baseLayers:[createAmapLayer()],title:'高德标准底图'})
  const imgBasemap = new Basemap({baseLayers:[],title:'本地专题底板'})
  function selectBasemap(value: string,map: Map) {
    currentBasemap.value=value
    map.basemap=value==='vector'?vecBasemap:imgBasemap
  }
  return {currentBasemap,vecBasemap,imgBasemap,selectBasemap}
}
