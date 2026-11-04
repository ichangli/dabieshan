import { ref, onMounted, onUnmounted } from 'vue'
import Map from '@arcgis/core/Map'
import MapView from '@arcgis/core/views/MapView'
import Popup from '@arcgis/core/widgets/Popup'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'

import './config'
import { useBasemap } from './useBasemap'
import { useRegionLayers } from './useRegionLayers'
import type { EcoData } from './useRegionLayers'
import { useThematicMap } from './useThematicMap'
import { useTiffLayer } from './useTiffLayer'
import { exportReport as doExport } from './useReportExport'

export function useMap() {
  let map: Map, mapView: MapView
  let graphicsLayer: GraphicsLayer
  const popup_ = ref()
  const a = ref('')

  const { currentBasemap, vecBasemap, selectBasemap: _selectBasemap } = useBasemap()
  const { regionLayers, ecoDataList, loadRegionLayers, buildEcoDataList, zoomToRegion: _zoomToRegion } = useRegionLayers()
  const {
    thematicOn, applyThematicMap, resetThematicMap,
    labelToggleMode, resourceLabelsVisible, regionLabelsVisible,
    toggleLabelText, toggleLabelsByMode
  } = useThematicMap(regionLayers, ecoDataList)
  const { tiffLayerVisible, tiffLayerLoading, toggleTiffLayer: _toggleTiff } = useTiffLayer()

  // 封装子模块函数，注入 map / mapView
  function selectBasemap(value: string) {
    _selectBasemap(value, map)
  }

  function zoomToRegion(name: string) {
    _zoomToRegion(name, mapView)
  }

  function toggleTiffLayer() {
    _toggleTiff(map, mapView)
  }

  function resetView() {
    if (!mapView) return
    mapView.goTo({ center: [115.339588, 31.785228], zoom: 7 }, { duration: 800 })
  }

  function exportReport(sortedItems: EcoData[], sortKeyVal: string, sortLabel: string, legendColors?: [string, string], legendLabel?: string) {
    return doExport(sortedItems, sortKeyVal, sortLabel, mapView, legendColors, legendLabel)
  }

  onMounted(async () => {

    graphicsLayer = new GraphicsLayer({ title: '自由绘制' })
    map = new Map({ basemap: vecBasemap, layers: [graphicsLayer] })

    const popup = new Popup({
      dockOptions: { position: 'top-center' },
      visibleElements: { actionBar: false }
    })

    mapView = new MapView({
      container: 'container',
      map: map,
      center: [115.339588, 31.785228],
      zoom: 7,
      popup: popup
    })

    mapView.when(() => {
      // Keep provider attribution visible.
    })

    mapView.on('pointer-move', (event) => {
      const point = mapView.toMap({ x: event.x, y: event.y })
      a.value = `经度：${point.longitude?.toFixed(6) ?? ''},  纬度：${point.latitude?.toFixed(6) ?? ''}`
    })

    // 加载区域图层
    loadRegionLayers(map)

    // 构建生态数据列表
    try {
      await buildEcoDataList()
    } catch (e) {
      console.warn('ecoDataList 构建失败', e)
    }

  })

  onUnmounted(() => {
    mapView?.destroy()
  })

  return {
    popup_, a, currentBasemap, selectBasemap,
    ecoDataList, zoomToRegion, thematicOn,
    applyThematicMap, resetThematicMap, resetView,
    tiffLayerVisible, tiffLayerLoading, toggleTiffLayer,
    exportReport,
    labelToggleMode, resourceLabelsVisible, regionLabelsVisible,
    toggleLabelText, toggleLabelsByMode
  }
}
