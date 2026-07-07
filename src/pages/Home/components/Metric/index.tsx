import type { ComponentType } from 'react'

export function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string; size?: number }>
  label: string
  value: number
}) {
  return (
    <div className="rounded-lg border border-line bg-surface-muted p-2.5">
      <Icon className="mb-2 text-teal" size={17} />
      <strong className="block text-xl">{value}</strong>
      <span className="text-xs text-muted">{label}</span>
    </div>
  )
}
