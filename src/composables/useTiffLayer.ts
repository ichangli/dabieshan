import { ref } from 'vue'
import type Map from '@arcgis/core/Map'
import type MapView from '@arcgis/core/views/MapView'
import WMTSLayer from '@arcgis/core/layers/WMTSLayer'
import WebTileLayer from '@arcgis/core/layers/WebTileLayer'
import LayerView from '@arcgis/core/views/layers/LayerView'
import { whenOnce } from '@arcgis/core/core/reactiveUtils'
import { GEO_SERVER_BASE } from './config'
import { IS_DEMO } from './mode'
import { withTimeout } from '@/utils/withTimeout'

function createTiffLayer(): WMTSLayer | WebTileLayer {
  if (IS_DEMO) {
    return new WebTileLayer({
      urlTemplate: `${window.location.origin}${import.meta.env.BASE_URL}tiles/cutting/{level}/{col}/{row}.png`,
      title: '土地利用图'
    })
  }

  return new WMTSLayer({
    url: `${GEO_SERVER_BASE}/geoserver/gwc/service/wmts`,
    activeLayer: {
      id: 'tif:cutting'
    },
    title: '土地利用图'
  })
}

export function useTiffLayer() {
  let tiffLayer: WMTSLayer | WebTileLayer | undefined
  const tiffLayerVisible = ref(false)
  const tiffLayerLoading = ref(false)

  function toggleTiffLayer(map: Map, mapView: MapView) {
    if (!tiffLayer) {
      tiffLayerLoading.value = true
      tiffLayer = createTiffLayer()
      map.add(tiffLayer)
      tiffLayerVisible.value = true
      mapView.whenLayerView(tiffLayer).then((layerView: LayerView) => {
        return withTimeout(whenOnce(() => !layerView.updating), 10000)
      }).catch((e) => {
        console.warn('土地利用图加载或等待空闲失败', e)
      }).finally(() => {
        tiffLayerLoading.value = false
      })
    } else {
      tiffLayer.visible = !tiffLayer.visible
      tiffLayerVisible.value = tiffLayer.visible
    }
  }

  return { tiffLayerVisible, tiffLayerLoading, toggleTiffLayer }
}