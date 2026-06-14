import {
  Droplet,
  Disc,
  CircleDot,
  BatteryCharging,
  Filter,
  Waves,
  Cog,
  Settings2,
  Zap,
  ClipboardCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { ServiceCategory } from '../types'

type ChipColor =
  | 'teal'
  | 'coral'
  | 'gray'
  | 'amber'
  | 'green'
  | 'purple'
  | 'blue'
  | 'pink'
  | 'red'

interface CategoryMeta {
  color: ChipColor
  icon: LucideIcon
}

export const CATEGORY_META: Record<ServiceCategory, CategoryMeta> = {
  oil_fluid: { color: 'teal', icon: Droplet },
  brakes: { color: 'coral', icon: Disc },
  tires: { color: 'gray', icon: CircleDot },
  battery: { color: 'amber', icon: BatteryCharging },
  filters: { color: 'green', icon: Filter },
  suspension: { color: 'purple', icon: Waves },
  engine: { color: 'blue', icon: Cog },
  transmission: { color: 'pink', icon: Settings2 },
  electrical: { color: 'red', icon: Zap },
  inspection: { color: 'blue', icon: ClipboardCheck },
  other: { color: 'gray', icon: Wrench },
}

export function categoryChipClass(category: ServiceCategory): string {
  return `chip-${CATEGORY_META[category].color}`
}

export function categoryIcon(category: ServiceCategory): LucideIcon {
  return CATEGORY_META[category].icon
}
