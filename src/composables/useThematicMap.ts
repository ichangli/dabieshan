import { ref, computed, type Ref } from 'vue'
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import { FIELD_ATTR_MAP } from './config'
import { getThematicPalette } from './thematicPalette'
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

    const entries: { name: string; layer: GeoJSONLayer; value: number | null }[] = []
    Object.entries(regionLayers).forEach(([name, layer]) => {
      const row = ecoDataList.value.find(d => d.name === name)
      const metric = row?.[table as keyof EcoData]
      const raw = metric && typeof metric === 'object'
        ? (metric as Record<string, unknown>)[field] : undefined
      const val = typeof raw === 'number' && Number.isFinite(raw) ? raw : null
      entries.push({ name, layer, value: val })
    })

    if (entries.length === 0) return
    // Use the observed range: forcing zero compresses temperature/rainfall into similar dark shades.
    const values = entries.map(e => e.value).filter((value): value is number => value !== null)
    const max = values.length ? Math.max(...values) : 0
    const min = values.length ? Math.min(...values) : 0

    const colors = getThematicPalette(key).map(color => [
      parseInt(color.slice(1, 3), 16),
      parseInt(color.slice(3, 5), 16),
      parseInt(color.slice(5, 7), 16),
    ] as [number, number, number])

    const c0 = colors[0]!
    const c1 = colors[1]!

    entries.forEach(({ name, layer, value }) => {
      const ratio = value !== null && max > min ? (value - min) / (max - min) : 0.5
      const r = value === null ? 185 : Math.round(c0[0] + (c1[0] - c0[0]) * ratio)
      const g = value === null ? 193 : Math.round(c0[1] + (c1[1] - c0[1]) * ratio)
      const b = value === null ? 184 : Math.round(c0[2] + (c1[2] - c0[2]) * ratio)
      const darkFill = r * 0.2126 + g * 0.7152 + b * 0.0722 < 145
      const labelColor = darkFill ? '#ffffff' : '#29433a'
      const haloColor = darkFill ? 'rgba(28,55,43,0.8)' : 'rgba(255,255,255,0.95)'

      layer.renderer = {
        type: 'simple',
        symbol: {
          type: 'simple-fill',
          color: [r, g, b, 0.82],
          outline: {
            color: [Math.round(c1[0] * 0.72), Math.round(c1[1] * 0.72), Math.round(c1[2] * 0.72), 0.82],
            width: 0.65,
          }
        }
      } as any

      const labels: any[] = []
      if (regionLabelsVisible.value) {
        labels.push({
          labelExpressionInfo: { expression: `'${name}'` },
          labelPlacement: 'always-horizontal',
          deconflictionStrategy: 'static',
          symbol: {
            type: 'text',
            color: labelColor,
            font: { family: 'sans-serif', size: 9, weight: 'bold' },
            haloColor,
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
          deconflictionStrategy: 'static',
          symbol: {
            type: 'text',
            color: labelColor,
            font: { family: 'sans-serif', size: 8 },
            haloColor,
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
        color: [137, 166, 121, 0.23],
        outline: { color: [102, 131, 91, 0.75], width: 0.9 }
      }
    } as any
    Object.entries(regionLayers).forEach(([name, layer]) => {
      layer.renderer = defaultRenderer
      if (regionLabelsVisible.value) {
        layer.labelingInfo = [{
          labelExpressionInfo: { expression: `'${name}'` },
          labelPlacement: 'always-horizontal',
          deconflictionStrategy: 'static',
          symbol: {
            type: 'text',
            color: '#29433a',
            font: { family: 'sans-serif', size: 9, weight: 'bold' },
            haloColor: 'rgba(255,255,255,0.95)',
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
        color: [137, 166, 121, 0.23],
        outline: { color: [102, 131, 91, 0.75], width: 0.9 }
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
            deconflictionStrategy: 'static',
            symbol: {
              type: 'text',
              color: '#29433a',
              font: { family: 'sans-serif', size: 9, weight: 'bold' },
              haloColor: 'rgba(255,255,255,0.95)',
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
