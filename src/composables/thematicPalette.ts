export function getThematicPalette(key: string): [string, string] {
  const [table, field] = key.split('.')
  if (table === 'water' || (table === 'climate' && field === 'avgPrecipitation')) {
    return ['#c2dbea', '#427da1']
  }
  if (table === 'climate' && field === 'avgTemp') return ['#e9d6b7', '#b97455']
  if (table === 'wetland') return ['#c0ddd5', '#448b85']
  return ['#cbdcca', '#4f8a6c']
}
