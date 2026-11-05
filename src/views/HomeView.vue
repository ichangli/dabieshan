<script setup lang="ts">
import '@arcgis/core/assets/esri/themes/light/main.css'
import AppIcon from '@/components/AppIcon.vue'
import { useMap } from '@/composables/useMap'
import { useQRCode } from '@/composables/useQRCode'
import { useAuth } from '@/composables/useAuth'
import { IS_DEMO } from '@/composables/mode'
import { REGIONS } from '@/composables/config'
import { getThematicPalette } from '@/composables/thematicPalette'
import { useRouter } from 'vue-router'
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { EcoData } from '@/composables/useRegionLayers'

const { a, currentBasemap, selectBasemap, ecoDataList, ecoDataLoading, zoomToRegion, applyThematicMap,
  resetThematicMap, resetView, zoomIn, zoomOut, tiffLayerVisible, tiffLayerLoading, toggleTiffLayer, exportReport,
  labelToggleMode, toggleLabelText, toggleLabelsByMode } = useMap()
const { showQR, qrDataUrl, qrLoading, toggleQR } = useQRCode()
const { logout, username } = useAuth()
const router = useRouter()
const mobileViewport = window.matchMedia('(max-width: 900px)')
const showPanel = ref(!mobileViewport.matches)
const thematicEnabled = ref(true)
const panelToggle = ref<HTMLButtonElement | null>(null)
const labelSettings = ref<HTMLDetailsElement | null>(null)
const searchText = ref('')
const selectedRegion = ref('')
const loggingOut = ref(false)
const exporting = ref(false)
const exportError = ref('')

const resourceTypes = [
  { key: 'forest.coverage', label: '森林覆盖率', unit: '%', icon: 'tree' },
  { key: 'forest.forestArea', label: '林地面积', unit: 'km²', icon: 'tree' },
  { key: 'water.totalWater', label: '水资源总量', unit: '亿m³', icon: 'water' },
  { key: 'water.perCapitaWater', label: '人均水资源', unit: 'm³', icon: 'water' },
  { key: 'climate.avgTemp', label: '年均气温', unit: '°C', icon: 'sun' },
  { key: 'climate.avgPrecipitation', label: '年降水量', unit: 'mm', icon: 'sun' },
  { key: 'wetland.wetlandArea', label: '湿地面积', unit: 'km²', icon: 'wetland' },
]
const sortKey = ref('forest.coverage')
const currentResource = computed(() => resourceTypes.find(r => r.key === sortKey.value)!)
const sortedList = computed(() => ecoDataList.value
  .filter(item => item.name.includes(searchText.value.trim()))
  .sort((a, b) => (getValue(b, sortKey.value) ?? -Infinity) - (getValue(a, sortKey.value) ?? -Infinity)))
const validValues = computed(() => ecoDataList.value.map(item => getValue(item, sortKey.value))
  .filter((value): value is number => value !== null))
const maxValue = computed(() => Math.max(0, ...validValues.value))
const minValue = computed(() => validValues.value.length ? Math.min(...validValues.value) : null)
const legendMax = computed(() => validValues.value.length ? Math.max(...validValues.value) : null)
const summaryAverage = computed(() => validValues.value.length
  ? validValues.value.reduce((sum, value) => sum + value, 0) / validValues.value.length
  : null)
const summaryAverageLabel = computed(() => sortKey.value === 'climate.avgTemp'
  ? '区域平均气温' : `平均${currentResource.value.label}`)
const summaryPeakLabel = computed(() =>
  `${['forest.forestArea', 'water.totalWater', 'wetland.wetlandArea'].includes(sortKey.value) ? '最大' : '最高'}${currentResource.value.label}`)
const summaryLeaders = computed(() => legendMax.value === null ? [] : ecoDataList.value
  .filter(item => getValue(item, sortKey.value) === legendMax.value)
  .map(item => item.name))
const legendColors = computed(() => getThematicPalette(sortKey.value))

watch([sortKey, thematicEnabled, () => ecoDataList.value.length], () => {
  if (thematicEnabled.value) applyThematicMap(sortKey.value)
  else resetThematicMap()
}, { immediate: true })

function onViewportChange(event: MediaQueryListEvent) {
  if (event.matches) showPanel.value = false
}
onMounted(() => mobileViewport.addEventListener('change', onViewportChange))
onUnmounted(() => mobileViewport.removeEventListener('change', onViewportChange))

function getValue(item: EcoData, key: string): number | null {
  const [table, field] = key.split('.') as [keyof EcoData, string]
  const metric = item[table]
  const value = typeof metric === 'object' && metric ? (metric as Record<string, unknown>)[field] : null
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}
function formatNumber(value: number | null) {
  return value === null ? '—' : value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}
function getBarPercent(item: EcoData) {
  const value = getValue(item, sortKey.value)
  return value !== null && maxValue.value > 0 ? Math.max(0, value / maxValue.value * 100) : 0
}
function selectRegion(name: string) {
  selectedRegion.value = name
  zoomToRegion(name)
  if (mobileViewport.matches) closePanel()
}
async function closePanel() {
  if (!showPanel.value) return
  showPanel.value = false
  await nextTick()
  panelToggle.value?.focus()
}
function closeOverlays() {
  if (showQR.value) showQR.value = false
  else if (labelSettings.value?.open) labelSettings.value.open = false
  else closePanel()
}
async function handleLogout() {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    const completed = await logout()
    await router.replace(completed ? '/login' : { path: '/login', query: { reason: 'logout-unconfirmed' } })
  } finally { loggingOut.value = false }
}
async function doExport() {
  if (exporting.value || !ecoDataList.value.length) return
  exporting.value = true
  exportError.value = ''
  try {
    const items = [...ecoDataList.value].sort((a, b) => (getValue(b, sortKey.value) ?? 0) - (getValue(a, sortKey.value) ?? 0))
    await exportReport(items, sortKey.value, currentResource.value.label,
      thematicEnabled.value ? legendColors.value : undefined, currentResource.value.label)
  } catch {
    exportError.value = '报告生成失败，请稍后重试。'
  } finally { exporting.value = false }
}
</script>

<template>
  <div class="app-layout" @keydown.esc="closeOverlays">
    <header class="app-header">
      <a class="brand" href="#" @click.prevent="resetView" aria-label="大别山生态资源平台：返回全图">
        <span class="brand-symbol"><AppIcon name="mountain" :size="27" /></span>
        <span class="brand-text"><strong>大别山</strong><small>生态资源数据库平台</small></span>
      </a>

      <nav class="header-tools" aria-label="地图工具">
        <button ref="panelToggle" class="tool-button" :class="{ active: showPanel }"
          @click="showPanel = !showPanel" :aria-expanded="showPanel" aria-controls="resource-panel"
          aria-label="展开或收起区域对比" title="展开 / 收起区域对比">
          <AppIcon name="chart" :size="18" /><span>区域对比</span>
        </button>
        <button class="tool-button" :class="{ active: tiffLayerVisible }" @click="toggleTiffLayer"
          :disabled="tiffLayerLoading" :aria-pressed="tiffLayerVisible" aria-label="切换土地利用图层" title="切换土地利用图层">
          <AppIcon name="layers" :size="18" /><span>{{ tiffLayerLoading ? '加载中…' : '土地利用' }}</span>
        </button>
        <button class="tool-button" :class="{ active: thematicEnabled }" @click="thematicEnabled = !thematicEnabled"
          :aria-pressed="thematicEnabled" aria-label="切换专题设色" title="切换专题设色">
          <AppIcon name="leaf" :size="18" /><span>专题设色</span>
        </button>
      </nav>

      <div class="header-actions">
        <span class="environment-badge"><i></i>{{ IS_DEMO ? '静态演示' : '研究工作台' }}</span>
        <button class="primary-button" @click="doExport" :disabled="exporting || !ecoDataList.length"
          :aria-label="exporting ? '正在生成分析报告' : '导出分析报告'" title="导出分析报告">
          <AppIcon name="download" :size="17" /><span>{{ exporting ? '生成中…' : '导出报告' }}</span>
        </button>
        <button class="text-button" @click="toggleQR" :aria-expanded="showQR" aria-label="分享平台二维码" title="分享平台">
          <AppIcon name="qr" :size="18" /><span>分享</span>
        </button>
        <button v-if="!IS_DEMO" class="user-button" @click="handleLogout" :disabled="loggingOut"
          :title="'退出登录：' + username" :aria-label="'退出登录：' + username">
          <span class="user-avatar">{{ username.slice(0, 1).toUpperCase() || 'U' }}</span>
          <span>{{ loggingOut ? '退出中…' : username }}</span><AppIcon name="logout" :size="16" />
        </button>
        <span v-else class="demo-avatar" title="访客演示模式">访</span>
      </div>
    </header>

    <main class="map-workspace" :class="{ 'panel-collapsed': !showPanel }" aria-label="生态资源地图工作台">
      <aside v-if="showPanel" id="resource-panel" class="resource-panel" aria-label="区域资源对比">
        <div class="panel-heading">
          <h1>区域资源对比</h1>
          <button class="icon-button panel-close" @click="closePanel" title="收起侧栏，扩大地图" aria-label="收起侧栏，扩大地图">
            <AppIcon name="close" :size="18" />
          </button>
        </div>
        <div class="panel-scope"><span><AppIcon name="pin" :size="13" />{{ ecoDataList.length }} 个区域</span><span><AppIcon name="grid" :size="13" />{{ resourceTypes.length }} 项指标</span><span>豫 · 鄂 · 皖</span></div>
        <details class="panel-summary">
          <summary><AppIcon :name="currentResource.icon" :size="15" /><span>专题数据摘要</span><AppIcon name="chevron" :size="13" /></summary>
          <div class="summary-metrics" aria-live="polite" aria-atomic="true">
            <div>
              <span>{{ summaryAverageLabel }}</span>
              <strong>{{ formatNumber(summaryAverage) }}<em>{{ currentResource.unit }}</em></strong>
              <small :title="validValues.length ? `基于 ${validValues.length} 个有效区域的算术平均` : '暂无有效数据'">{{ validValues.length ? `${validValues.length} 区域 · 算术均值` : '暂无有效数据' }}</small>
            </div>
            <div>
              <span>{{ summaryPeakLabel }}</span>
              <strong>{{ formatNumber(legendMax) }}<em>{{ currentResource.unit }}</em></strong>
              <small class="summary-leaders" :title="summaryLeaders.join('、')">
                {{ summaryLeaders.length > 1 ? '并列最高 · ' : '' }}{{ summaryLeaders.join('、') || '暂无有效数据' }}
              </small>
            </div>
          </div>
        </details>
        <div class="panel-filters">
          <div class="search-field"><AppIcon name="search" :size="17" /><input v-model="searchText" type="search" placeholder="搜索区域名称…" aria-label="搜索区域名称" /></div>
        </div>
        <div class="ranking-heading"><span>区域 / REGION</span><span :title="currentResource.label + '，由高到低排序'">{{ currentResource.label }} ↓</span></div>
        <div class="region-list">
          <button v-for="(item, index) in sortedList" :key="item.name" class="region-row"
            :class="{ selected: selectedRegion === item.name }" @click="selectRegion(item.name)" :aria-pressed="selectedRegion === item.name">
            <span class="region-rank" :class="{ 'top-rank': index < 3 }">{{ (index + 1).toString().padStart(2, '0') }}</span>
            <span class="region-info">
              <span class="region-row-top"><span class="region-name">{{ item.name }}</span><span class="region-value">{{ formatNumber(getValue(item, sortKey)) }}<small>{{ currentResource.unit }}</small></span></span>
              <span class="region-bar"><span class="bar-fill" :style="{ width: getBarPercent(item) + '%', background: legendColors[1] }"></span></span>
            </span>
          </button>
          <div v-if="!sortedList.length" class="empty-state" role="status">
            <AppIcon :name="ecoDataList.length ? 'search' : 'layers'" :size="28" />
            <strong>{{ ecoDataLoading ? '正在读取区域数据' : ecoDataList.length ? '未找到匹配区域' : '区域数据暂不可用' }}</strong>
            <span>{{ ecoDataLoading ? '数据就绪后将在此展示' : ecoDataList.length ? '试试其他区域名称' : '请稍后刷新页面重试' }}</span>
            <button v-if="searchText" class="text-button" @click="searchText = ''">清空搜索</button>
          </div>
        </div>
        <div class="panel-footer"><AppIcon name="pin" :size="13" /><span>点击区域，定位查看详情</span><span>{{ sortedList.length }} / {{ REGIONS.length }}</span></div>
      </aside>

      <section class="map-stage" aria-label="资源空间分布">
        <div class="map-area">
          <div id="container" aria-label="大别山生态资源交互地图"></div>
          <div class="map-topbar">
            <label class="map-topic-control" for="map-topic-select">
              <AppIcon :name="thematicEnabled ? currentResource.icon : 'globe'" :size="21" />
              <span><span class="section-kicker">{{ thematicEnabled ? '当前专题' : '选择分析指标' }}</span>
                <select id="map-topic-select" v-model="sortKey" class="topic-select" aria-label="选择生态资源分析指标">
                  <option v-for="res in resourceTypes" :key="res.key" :value="res.key">{{ res.label }}（{{ res.unit }}）</option>
                </select>
              </span>
            </label>
            <div class="map-utility-actions">
              <label class="basemap-selector"><AppIcon name="globe" :size="16" />
                <select v-model="currentBasemap" @change="selectBasemap(currentBasemap)" aria-label="切换地图底图">
                  <option value="topographic">地形底图</option><option value="vector">高德标准</option>
                </select>
              </label>
              <details ref="labelSettings" class="label-settings">
                <summary title="地图标注"><AppIcon name="layers" :size="16" /><span>地图标注</span></summary>
                <div class="label-settings-body">
                  <label for="label-mode">标注内容</label>
                  <select id="label-mode" v-model="labelToggleMode" aria-label="选择标签类型">
                    <option value="resource">数值标签</option><option value="region">地名标签</option><option value="all">全部标签</option>
                  </select>
                  <button @click="toggleLabelsByMode">{{ toggleLabelText }}</button>
                </div>
              </details>
            </div>
          </div>

          <div class="map-compass" aria-hidden="true"><span>N</span><svg viewBox="0 0 24 30"><path d="m12 3 7 23-7-5-7 5Z" fill="#425c6d" /><path d="m12 3 7 23-7-5Z" fill="#b5c5cf" /></svg></div>
          <div v-if="thematicEnabled" class="thematic-legend" title="按当前区域实际最小值至最大值连续设色，灰色表示暂无数据">
            <div class="legend-heading"><span class="legend-dot" :style="{ background: legendColors[1] }"></span><strong>{{ currentResource.label }}</strong><span>{{ currentResource.unit }}</span></div>
            <div class="legend-bar" :style="{ background: `linear-gradient(90deg, ${legendColors[0]}, ${legendColors[1]})` }"></div>
            <div class="legend-values"><span>{{ formatNumber(minValue) }}</span><span>{{ formatNumber(legendMax) }}</span></div>
          </div>
          <div class="map-controls">
            <button @click="zoomIn" title="放大地图" aria-label="放大地图"><AppIcon name="plus" :size="20" /></button>
            <button @click="zoomOut" title="缩小地图" aria-label="缩小地图"><AppIcon name="minus" :size="20" /></button><span></span>
            <button @click="resetView(); selectedRegion = ''" title="返回全图" aria-label="返回全图"><AppIcon name="expand" :size="19" /></button>
          </div>
          <p v-if="exportError" class="error-toast" role="alert">{{ exportError }}<button class="icon-button" @click="exportError = ''" aria-label="关闭提示"><AppIcon name="close" :size="15" /></button></p>
          <Transition name="qr-fade">
            <section v-if="showQR" class="qr-panel" aria-label="分享平台二维码">
              <div class="qr-panel-header"><strong>分享这片山川</strong><button class="icon-button" @click="showQR = false" aria-label="关闭二维码"><AppIcon name="close" :size="16" /></button></div>
              <div class="qr-panel-body"><span v-if="qrLoading" class="qr-spinner"></span><img v-else :src="qrDataUrl" alt="当前平台访问地址二维码" width="170" height="170" /></div>
              <p>手机扫码，探索生态资源</p>
            </section>
          </Transition>
        </div>
        <div class="map-statusbar">
          <span role="status"><i :class="{ ready: ecoDataList.length === REGIONS.length }"></i>{{ ecoDataLoading ? '正在载入区域数据…' : ecoDataList.length === REGIONS.length ? '区域数据已载入' : ecoDataList.length ? `已载入 ${ecoDataList.length} / ${REGIONS.length} 个区域` : '区域数据暂不可用' }}</span>
          <span class="map-coordinates">{{ a || '移动鼠标查看经纬度' }}</span>
          <span class="map-status-system">大别山革命老区 · ArcGIS Maps SDK</span>
        </div>
      </section>
    </main>
  </div>
</template>
