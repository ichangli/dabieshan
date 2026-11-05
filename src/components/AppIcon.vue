<script setup lang="ts">
withDefaults(defineProps<{ name: string; size?: number }>(), { size: 20 })

const paths: Record<string, string> = {
  mountain: 'm2 19 7-12 4 7 3-5 6 10H2Zm4-7 3 2 2-3',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  layers: 'm12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  leaf: 'M20 4C9 1 2 8 5 16c8 5 17-2 15-12ZM4 21l12-13M10 15v-5m0 5h5',
  tree: 'm12 2-6 8h3l-5 7h6v5h4v-5h6l-5-7h3L12 2Z',
  water: 'M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13ZM8 15a4 4 0 0 0 4 4',
  sun: 'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  wetland: 'M2 15c3-3 4 3 7 0s4 3 7 0 4 3 6 0M2 20c3-3 4 3 7 0s4 3 7 0 4 3 6 0M12 12V3m0 5c0-4 5-5 5-5 0 4-2 5-5 5Zm0 3c0-4-5-5-5-5 0 4 2 5 5 5Z',
  search: 'M21 21l-5-5m2-6a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  chevron: 'm9 5 7 7-7 7',
  close: 'm6 6 12 12M6 18 18 6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  expand: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  pin: 'M19 10c0 5-7 12-7 12S5 15 5 10a7 7 0 1 1 14 0Zm-4 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  chart: 'M4 3v18h17M9 16v-5m5 5V6m5 10V9',
  qr: 'M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6v-3m6-6v3',
  logout: 'M9 4H4v16h5m5-12 4 4-4 4m-5-4h13',
  info: 'M12 11v6m0-10v.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  globe: 'M2 12h20M12 2a19 19 0 0 1 0 20 19 19 0 0 1 0-20ZM22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
}
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path :d="paths[name] || paths.grid" />
  </svg>
</template>
