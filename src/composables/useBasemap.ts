import { ref } from 'vue'
import type Map from '@arcgis/core/Map'
import Basemap from '@arcgis/core/Basemap'
import TileLayer from '@arcgis/core/layers/TileLayer'
import { createAmapLayer } from './amapRasterLayer'

export function useBasemap() {
  const currentBasemap = ref<'topographic' | 'vector'>('topographic')
  // Web Mercator tiles align directly with the region layers; only AMap needs GCJ-02 correction.
  const topographicBasemap = new Basemap({
    baseLayers: [new TileLayer({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer',
      title: 'Esri 地形底图',
      // Tone down the bright terrain tiles without filtering thematic layers or map controls.
      effect: 'saturate(75%) brightness(86%) contrast(108%)',
    })],
    title: 'Esri 地形底图',
  })
  const vecBasemap = new Basemap({baseLayers:[createAmapLayer()],title:'高德标准底图'})
  function selectBasemap(value: string,map: Map) {
    const nextBasemap = value === 'vector' ? 'vector' : 'topographic'
    currentBasemap.value=nextBasemap
    map.basemap=nextBasemap==='vector'?vecBasemap:topographicBasemap
  }
  return {currentBasemap,defaultBasemap:topographicBasemap,selectBasemap}
}
