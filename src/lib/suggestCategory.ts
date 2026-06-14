import type { ServiceCategory } from '../types'

const KEYWORDS: Array<{ category: ServiceCategory; words: string[] }> = [
  { category: 'oil_fluid', words: ['oil change', 'oil', 'coolant', 'fluid', 'flush', 'transmission fluid'] },
  { category: 'transmission', words: ['transmission', 'trans flush', 'transmission flush'] },
  { category: 'brakes', words: ['brake', 'pad', 'rotor', 'caliper'] },
  { category: 'tires', words: ['tire', 'tyre', 'alignment', 'balance', 'rotation'] },
  { category: 'battery', words: ['battery', 'alternator', 'starter'] },
  { category: 'filters', words: ['filter', 'cabin', 'air filter', 'fuel filter'] },
  { category: 'suspension', words: ['suspension', 'strut', 'shock', 'ball joint', 'tie rod'] },
  { category: 'engine', words: ['engine', 'spark plug', 'timing belt', 'head gasket'] },
  { category: 'electrical', words: ['electrical', 'wiring', 'sensor', 'bulb'] },
  { category: 'inspection', words: ['inspection', 'diagnostic', 'multi-point', 'multipoint'] },
]

export function guessCategoryFromText(text: string): ServiceCategory | null {
  const lower = text.toLowerCase()
  for (const { category, words } of KEYWORDS) {
    if (words.some((w) => lower.includes(w))) return category
  }
  return null
}
