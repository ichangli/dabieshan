<script setup lang="ts">
import '@arcgis/core/assets/esri/themes/light/main.css'
import { useMap } from '@/composables/useMap'
import { useQRCode } from '@/composables/useQRCode'
import { useAuth } from '@/composables/useAuth'
import { IS_DEMO } from '@/composables/mode'
import { HAS_ONLINE_BASEMAP } from '@/composables/useBasemap'
import { useRouter } from 'vue-router'
import { ref, computed, watch } from 'vue'
import type { EcoData } from '@/composables/useRegionLayers'

const { popup_, a, currentBasemap, selectBasemap, ecoDataList, zoomToRegion, applyThematicMap,
  resetThematicMap, resetView, tiffLayerVisible, tiffLayerLoading, toggleTiffLayer, exportReport,
  labelToggleMode, toggleLabelText, toggleLabelsByMode, thematicOn } = useMap()
const { showQR, qrDataUrl, qrLoading, toggleQR } = useQRCode()
const { logout, username } = useAuth()
const router = useRouter()
const showPanel = ref(false)
const searchText = ref('')
const loggingOut = ref(false)

const resourceTypes = [
  { key: 'forest.coverage', label: '🌲 森林覆盖率', unit: '%' },
  { key: 'forest.forestArea', label: '🌲 林地面积', unit: 'km²' },
  { key: 'water.totalWater', label: '💧 水资源总量', unit: '亿m³' },
  { key: 'water.perCapitaWater', label: '💧 人均水资源', unit: 'm³' },
  { key: 'climate.avgTemp', label: '🌤️ 年均气温', unit: '°C' },
  { key: 'climate.avgPrecipitation', label: '🌤️ 年降水量', unit: 'mm' },
  { key: 'wetland.wetlandArea', label: '🌊 湿地面积', unit: 'km²' },
]

const sortKey = ref('forest.coverage')

const sortedList = computed(() => {
  const list = ecoDataList.value.filter(item => item.name.includes(searchText.value))
  const [table, field] = sortKey.value.split('.') as [string, string]
  list.sort((a, b) => {
    const valA = (a as Record<string, any>)[table]?.[field] ?? 0
    const valB = (b as Record<string, any>)[table]?.[field] ?? 0
    return valB - valA
  })
  return list
})

const currentUnit = computed(() =>
  resourceTypes.find(r => r.key === sortKey.value)?.unit ?? ''
)

watch(sortKey, (newKey) => {
  applyThematicMap(newKey)
}, { immediate: true })

watch(showPanel, (visible) => {
  if (visible) {
    applyThematicMap(sortKey.value)
  } else {
    resetThematicMap()
  }
})

watch(() => ecoDataList.value.length, () => {
  if (showPanel.value) {
    applyThematicMap(sortKey.value)
  }
})

const legendColors = computed(() => {
  const [table, field] = sortKey.value.split('.') as [string, string]
  if (table === 'forest') return ['#e8f5e9', '#1b5e20']
  if (table === 'water' || (table === 'climate' && field === 'avgPrecipitation')) return ['#e3f2fd', '#0d47a1']
  if (table === 'climate' && field === 'avgTemp') return ['#ffe0b2', '#bf360c']
  if (table === 'wetland') return ['#e0f2f1', '#004d40']
  return ['#e8f5e9', '#1b5e20']
})

function getValue(item: EcoData, key: string): number {
  const [table, field] = key.split('.') as [string, string]
  return (item as Record<string, any>)[table]?.[field] ?? 0
}

function getBarPercent(item: EcoData, key: string): number {
  const val = getValue(item, key)
  const maxVal = Math.max(0, ...ecoDataList.value.map(region => getValue(region, key)))
  return maxVal > 0 ? (val / maxVal) * 100 : 0
}

async function handleLogout() {
  if (loggingOut.value) {
    return
  }
  loggingOut.value = true
  try {
    const completed = await logout()
    await router.replace(
      completed
        ? '/login'
        : {
          path: '/login',
          query: { reason: 'logout-unconfirmed' }
        }
    )
  } finally {
    loggingOut.value = false
  }
}

const exporting = ref(false)
async function doExport() {
  exporting.value = true
  try {
    const exportList = [...ecoDataList.value].sort((a, b) => {
      return getValue(b, sortKey.value) - getValue(a, sortKey.value)
    })
    const label = resourceTypes.find(r => r.key === sortKey.value)?.label ?? ''
    const colors = showPanel.value ? legendColors.value as [string, string] : undefined
    await exportReport(exportList, sortKey.value, label, colors, label)
  } finally { exporting.value = false }
}
</script>

<template>
  <div class="app-layout">
    <header class="app-header">
      <h1 class="app-title">大别山革命老区生态资源数据库平台 <small v-if="IS_DEMO">· 静态演示</small></h1>
      <div class="header-actions">
        <button class="qr-toggle-btn" @click="toggleQR" :title="showQR ? '隐藏二维码' : '显示二维码'">
          <svg class="qr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M18 14h3v3" />
            <path d="M14 18v3h3" />
            <line x1="14" y1="14" x2="16" y2="14" />
          </svg>
          <span>{{ showQR ? '隐藏二维码' : '扫码访问' }}</span>
        </button>
        <button v-if="!IS_DEMO" class="logout-btn" @click="handleLogout" title="退出登录">
          <span> {{ loggingOut ? '退出中...' : '退出 ' + username }}</span>
        </button>
      </div>
    </header>
    <div class="main-area">
      <div class="left-toolbar">
        <button class="toolbar-btn" :class="{ active: showPanel }" @click="showPanel = !showPanel" title="资源总览">
          <span class="toolbar-icon">📊</span>
          <span class="toolbar-label">资源总览</span>
        </button>
        <button class="toolbar-btn" :class="{ active: tiffLayerVisible, loading: tiffLayerLoading }"
          @click="toggleTiffLayer" :disabled="tiffLayerLoading" title="TIF 影像">
          <span class="toolbar-icon">{{ tiffLayerLoading ? '⏳' : '🏞️' }}</span>
          <span class="toolbar-label">{{ tiffLayerLoading ? '加载中...' : '土地利用分布图' }}</span>
        </button>
        <button class="toolbar-btn" @click="doExport" :disabled="exporting" title="导出地图">
          <span class="toolbar-icon">{{ exporting ? '⏳' : '📄' }}</span>
          <span class="toolbar-label">{{ exporting ? '生成中...' : '导出地图报告' }}</span>
        </button>

      </div>

      <transition name="panel-slide">
        <div v-if="showPanel" class="left-panel">
          <div class="panel-header">
            <span class="panel-title">📊 区域资源总览</span>
            <button class="panel-close" @click="showPanel = false">✕</button>
          </div>
          <div class="panel-body">
            <!-- 资源类型切换按钮 -->
            <div class="type-switcher">
              <button v-for="res in resourceTypes" :key="res.key" class="type-btn"
                :class="{ active: sortKey === res.key }" @click="sortKey = res.key">
                {{ res.label }}
              </button>
            </div>

            <div class="panel-hint">共 {{ sortedList.length }} 个区域，从高到低排列，点击可定位到地图</div>
            <input v-model="searchText" class="region-search" placeholder="搜索区域名，如：信阳" />

            <!-- 标签显隐控制 -->
            <div class="label-toggle-bar">
              <select v-model="labelToggleMode" class="label-toggle-select">
                <option value="resource">资源</option>
                <option value="region">地区</option>
                <option value="all">全部</option>
              </select>
              <button class="label-toggle-btn" @click="toggleLabelsByMode">
                {{ toggleLabelText }}
              </button>
            </div>

            <div v-for="item in sortedList" :key="item.name" class="region-row" @click="zoomToRegion(item.name)">
              <div class="region-row-top">
                <span class="region-name">{{ item.name }}</span>
                <span class="region-value">
                  {{ getValue(item, sortKey) }}{{ currentUnit }}
                </span>
              </div>
              <div class="region-bar">
                <div class="bar-fill" :style="{ width: getBarPercent(item, sortKey) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <div class="map-area">
        <div id="container"></div>
        <div id="a">{{ a }}</div>
        <div ref="popup_" id="pop" style="height: 30px; width: 100%;"></div>

        <!-- 专题图图例 -->
        <div v-if="showPanel" class="thematic-legend">
          <span class="legend-label">低</span>
          <span class="legend-bar"
            :style="{ background: `linear-gradient(90deg, ${legendColors[0]}, ${legendColors[1]})` }"></span>
          <span class="legend-label">高</span>
          <span class="legend-title">{{resourceTypes.find(r => r.key === sortKey)?.label}}</span>
        </div>

        <div class="basemap-selector">
          <span v-if="!HAS_ONLINE_BASEMAP">本地专题底板</span>
          <select v-else v-model="currentBasemap" @change="selectBasemap(currentBasemap)">
            <option value="vector">🗺️ ArcGIS 浅色底图</option>
            <option value="image">🛰️ ArcGIS 卫星影像</option>
          </select>
        </div>

        <button class="reset-view-btn" @click="resetView" title="全图">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>

        <transition name="qr-fade">
          <div v-if="showQR" class="qr-panel">
            <div class="qr-panel-header">
              <span class="qr-panel-title">📱 扫码访问</span>
              <button class="qr-close-btn" @click="showQR = false">✕</button>
            </div>
            <div class="qr-panel-body">
              <div v-if="qrLoading" class="qr-loading">
                <div class="qr-spinner"></div>
                <span>生成中...</span>
              </div>
              <img v-else :src="qrDataUrl" alt="扫码访问" class="qr-image" />
            </div>
            <div class="qr-panel-footer">
              <span>打开手机扫码<br />浏览生态资源平台</span>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>
