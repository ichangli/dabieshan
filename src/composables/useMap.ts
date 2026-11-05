import { ref, onMounted, onUnmounted } from 'vue'
import Map from '@arcgis/core/Map'
import MapView from '@arcgis/core/views/MapView'
import Popup from '@arcgis/core/widgets/Popup'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import type Extent from '@arcgis/core/geometry/Extent'

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
  let disposed = false
  const popup_ = ref()
  const a = ref('')

  const { currentBasemap, defaultBasemap, selectBasemap: _selectBasemap } = useBasemap()
  const { regionLayers, ecoDataList, ecoDataLoading, loadRegionLayers, buildEcoDataList, zoomToRegion: _zoomToRegion } = useRegionLayers()
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

  function getRegionExtent(): Extent | undefined {
    let extent: Extent | undefined
    for (const layer of Object.values(regionLayers)) {
      const regionExtent = layer.fullExtent
      if (!regionExtent) continue
      if (!extent) extent = regionExtent.clone()
      else if (extent.spatialReference.equals(regionExtent.spatialReference)) extent.union(regionExtent)
    }
    return extent?.expand(1.12)
  }

  function handleNavigationError(error: unknown) {
    if (!(error && typeof error === 'object' && 'name' in error && error.name === 'AbortError')) {
      console.warn('地图视图切换失败', error)
    }
  }

  async function resetView() {
    if (!mapView?.ready) return
    try {
      await mapView.goTo(getRegionExtent() ?? { center: [115.339588, 31.785228], zoom: 7 }, { duration: 800 })
    } catch (error) {
      handleNavigationError(error)
    }
  }

  function zoomIn() {
    if (mapView?.ready) mapView.goTo({ zoom: mapView.zoom + 1 }, { duration: 300 }).catch(handleNavigationError)
  }

  function zoomOut() {
    if (mapView?.ready) mapView.goTo({ zoom: mapView.zoom - 1 }, { duration: 300 }).catch(handleNavigationError)
  }

  function exportReport(sortedItems: EcoData[], sortKeyVal: string, sortLabel: string, legendColors?: [string, string], legendLabel?: string) {
    return doExport(sortedItems, sortKeyVal, sortLabel, mapView, legendColors, legendLabel)
  }

  onMounted(async () => {

    graphicsLayer = new GraphicsLayer({ title: '自由绘制' })
    map = new Map({ basemap: defaultBasemap, layers: [graphicsLayer] })

    const popup = new Popup({
      dockOptions: { position: 'top-center' },
      visibleElements: { actionBar: false }
    })

    mapView = new MapView({
      container: 'container',
      map: map,
      center: [115.339588, 31.785228],
      zoom: 7,
      background: { color: '#e9edef' },
      ui: { components: [] },
      attributionVisible: true,
      popup: popup
    })

    mapView.on('pointer-move', (event) => {
      const point = mapView.toMap({ x: event.x, y: event.y })
      if (!point) return
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

    if (disposed) return
    try {
      await mapView.when()
      const extent = getRegionExtent()
      if (!disposed && extent) await mapView.goTo(extent, { animate: false })
    } catch (error) {
      if (!disposed) handleNavigationError(error)
    }

  })

  onUnmounted(() => {
    disposed = true
    mapView?.destroy()
  })

  return {
    popup_, a, currentBasemap, selectBasemap,
    ecoDataList, ecoDataLoading, zoomToRegion, thematicOn,
    applyThematicMap, resetThematicMap, resetView, zoomIn, zoomOut,
    tiffLayerVisible, tiffLayerLoading, toggleTiffLayer,
    exportReport,
    labelToggleMode, resourceLabelsVisible, regionLabelsVisible,
    toggleLabelText, toggleLabelsByMode
  }
}
