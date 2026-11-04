import { ref, computed, type Ref } from 'vue'
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import { FIELD_ATTR_MAP } from './config'
import type { EcoData } from './useRegionLayers'

export function useThematicMap(
  regionLayers: Record<string, GeoJSONLayer>,
  ecoDataList: Ref<EcoData[]>
) {
  const thematicOn = ref(false)
  const labelToggleMode = ref<'resource' | 'region' | 'all'>('all')
  const resourceLabelsVisible = ref(true)
  const regionLabelsVisible = ref(true)
  let currentThematicKey = ''

  const toggleLabelText = computed(() => {
    const mode = labelToggleMode.value
    if (mode === 'resource') {
      return resourceLabelsVisible.value ? '隐藏数值' : '显示数值'
    } else if (mode === 'region') {
      return regionLabelsVisible.value ? '隐藏地名' : '显示地名'
    } else {
      const allVisible = resourceLabelsVisible.value && regionLabelsVisible.value
      return allVisible ? '隐藏全部' : '显示全部'
    }
  })

  function applyThematicMap(key: string) {
    if (!key) return
    const [table, field] = key.split('.')
    if (!table || !field) return
    if (ecoDataList.value.length === 0) return

    const fieldInfo = FIELD_ATTR_MAP[key]

    const entries: { name: string; layer: GeoJSONLayer; value: number }[] = []
    Object.entries(regionLayers).forEach(([name, layer]) => {
      const row = ecoDataList.value.find(d => d.name === name)
      const metric = row?.[table as keyof EcoData]
      const raw = metric && typeof metric === 'object'
        ? (metric as Record<string, unknown>)[field] : undefined
      const val = typeof raw === 'number' && Number.isFinite(raw) ? raw : 0
      entries.push({ name, layer, value: val })
    })

    if (entries.length === 0) return
    const max = Math.max(...entries.map(e => e.value), 1)
    const min = Math.min(...entries.map(e => e.value), 0)

    const colors: [number, number, number][] =
      table === 'forest' ? [[232, 245, 233], [27, 94, 32]] :
      table === 'water' || (table === 'climate' && field === 'avgPrecipitation') ? [[227, 242, 253], [13, 71, 161]] :
      table === 'climate' && field === 'avgTemp' ? [[255, 224, 178], [191, 54, 12]] :
      table === 'wetland' ? [[224, 242, 241], [0, 77, 64]] :
      [[232, 245, 233], [27, 94, 32]]

    const c0 = colors[0]!
    const c1 = colors[1]!

    entries.forEach(({ name, layer, value }) => {
      const ratio = max > min ? (value - min) / (max - min) : 0.5
      const r = Math.round(c0[0] + (c1[0] - c0[0]) * ratio)
      const g = Math.round(c0[1] + (c1[1] - c0[1]) * ratio)
      const b = Math.round(c0[2] + (c1[2] - c0[2]) * ratio)

      layer.renderer = {
        type: 'simple',
        symbol: {
          type: 'simple-fill',
          color: [r, g, b, 0.55],
          outline: { color: [r * 0.6, g * 0.6, b * 0.6], width: 1 }
        }
      } as any

      const labels: any[] = []
      if (regionLabelsVisible.value) {
        labels.push({
          labelExpressionInfo: { expression: `'${name}'` },
          labelPlacement: 'always-horizontal',
          deconflictionStrategy: 'none',
          symbol: {
            type: 'text',
            color: [255, 255, 255, 0.9] as any,
            font: { family: 'sans-serif', size: 9, weight: 'bold' },
            haloColor: 'rgba(0,0,0,0.6)',
            haloSize: 1,
            verticalAlignment: 'baseline',
            horizontalAlignment: 'center',
            yoffset: 7,
          }
        })
      }
      if (resourceLabelsVisible.value && fieldInfo) {
        labels.push({
          labelExpressionInfo: { expression: `IIF($feature.${fieldInfo.attr} == null, '', Text($feature.${fieldInfo.attr}) + '${fieldInfo.unit}')` },
          labelPlacement: 'always-horizontal',
          deconflictionStrategy: 'none',
          symbol: {
            type: 'text',
            color: [255, 255, 255, 0.82] as any,
            font: { family: 'sans-serif', size: 9 },
            haloColor: 'rgba(0,0,0,0.6)',
            haloSize: 1,
            verticalAlignment: 'baseline',
            horizontalAlignment: 'center',
            yoffset: -7,
          }
        })
      }
      layer.labelingInfo = labels as any
    })
    thematicOn.value = true
    currentThematicKey = key
  }

  function resetThematicMap() {
    thematicOn.value = false
    currentThematicKey = ''
    const defaultRenderer = {
      type: 'simple',
      symbol: {
        type: 'simple-fill',
        color: [46, 139, 87, 0.3],
        outline: { color: [34, 85, 51], width: 1 }
      }
    } as any
    Object.entries(regionLayers).forEach(([name, layer]) => {
      layer.renderer = defaultRenderer
      if (regionLabelsVisible.value) {
        layer.labelingInfo = [{
          labelExpressionInfo: { expression: `'${name}'` },
          labelPlacement: 'always-horizontal',
          deconflictionStrategy: 'none',
          symbol: {
            type: 'text',
            color: '#1a4d2e',
            font: { family: 'sans-serif', size: 9, weight: 'bold' },
            haloColor: 'white',
            haloSize: 1,
            verticalAlignment: 'baseline',
            horizontalAlignment: 'center',
          }
        }] as any
      } else {
        layer.labelingInfo = [] as any
      }
    })
  }

  function refreshAllLabels() {
    const defaultRenderer = {
      type: 'simple',
      symbol: {
        type: 'simple-fill',
        color: [46, 139, 87, 0.3],
        outline: { color: [34, 85, 51], width: 1 }
      }
    } as any
    if (thematicOn.value && currentThematicKey) {
      applyThematicMap(currentThematicKey)
    } else {
      Object.entries(regionLayers).forEach(([name, layer]) => {
        layer.renderer = defaultRenderer
        if (regionLabelsVisible.value) {
          layer.labelingInfo = [{
            labelExpressionInfo: { expression: `'${name}'` },
            labelPlacement: 'always-horizontal',
            deconflictionStrategy: 'none',
            symbol: {
              type: 'text',
              color: '#1a4d2e',
              font: { family: 'sans-serif', size: 9, weight: 'bold' },
              haloColor: 'white',
              haloSize: 1,
              verticalAlignment: 'baseline',
              horizontalAlignment: 'center',
            }
          }] as any
        } else {
          layer.labelingInfo = [] as any
        }
      })
    }
  }

  function toggleLabelsByMode() {
    const mode = labelToggleMode.value
    if (mode === 'resource') {
      resourceLabelsVisible.value = !resourceLabelsVisible.value
    } else if (mode === 'region') {
      regionLabelsVisible.value = !regionLabelsVisible.value
    } else {
      const allVisible = resourceLabelsVisible.value && regionLabelsVisible.value
      resourceLabelsVisible.value = !allVisible
      regionLabelsVisible.value = !allVisible
    }
    refreshAllLabels()
  }

  return {
    thematicOn, applyThematicMap, resetThematicMap,
    labelToggleMode, resourceLabelsVisible, regionLabelsVisible,
    toggleLabelText, toggleLabelsByMode
  }
}
