import { Beer, Dumbbell, MapPin, Music, UtensilsCrossed } from 'lucide-react'
import type { VoteType } from '../../@types/OndeHoje'

export const voteTypeOptions = [
  {
    value: 'GENERAL',
    label: 'Geral',
    icon: MapPin,
    badgeClassName:
      'border-teal/20 bg-teal-soft text-teal dark:border-teal/30 dark:bg-teal/15 dark:text-teal',
    optionClassName:
      'has-[:checked]:border-teal has-[:checked]:bg-teal-soft has-[:checked]:text-teal',
  },
  {
    value: 'MUSIC',
    label: 'Musica',
    icon: Music,
    badgeClassName:
      'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/70 dark:bg-violet-950/40 dark:text-violet-200',
    optionClassName:
      'has-[:checked]:border-violet-400 has-[:checked]:bg-violet-50 has-[:checked]:text-violet-700 dark:has-[:checked]:border-violet-800 dark:has-[:checked]:bg-violet-950/40 dark:has-[:checked]:text-violet-200',
  },
  {
    value: 'FOOD',
    label: 'Comida',
    icon: UtensilsCrossed,
    badgeClassName:
      'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200',
    optionClassName:
      'has-[:checked]:border-rose-400 has-[:checked]:bg-rose-50 has-[:checked]:text-rose-700 dark:has-[:checked]:border-rose-800 dark:has-[:checked]:bg-rose-950/40 dark:has-[:checked]:text-rose-200',
  },
  {
    value: 'SPORTS',
    label: 'Esporte',
    icon: Dumbbell,
    badgeClassName:
      'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-200',
    optionClassName:
      'has-[:checked]:border-sky-400 has-[:checked]:bg-sky-50 has-[:checked]:text-sky-700 dark:has-[:checked]:border-sky-800 dark:has-[:checked]:bg-sky-950/40 dark:has-[:checked]:text-sky-200',
  },
  {
    value: 'DRINK',
    label: 'Bebida',
    icon: Beer,
    badgeClassName:
      'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200',
    optionClassName:
      'has-[:checked]:border-amber has-[:checked]:bg-amber-50 has-[:checked]:text-amber-800 dark:has-[:checked]:border-amber-800 dark:has-[:checked]:bg-amber-950/40 dark:has-[:checked]:text-amber-200',
  },
] satisfies Array<{
  value: VoteType
  label: string
  icon: typeof MapPin
  badgeClassName: string
  optionClassName: string
}>
