type StatCardProps = {
  label: string
  value: number | string
  hint?: string
  accent?: boolean
}

export function StatCard({ label, value, hint, accent }: StatCardProps) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        accent ? 'border-amber-300 bg-amber-50 dark:border-amber-900/70 dark:bg-amber-950/25' : 'border-line'
      }`}
    >
      <strong className="block text-3xl">{value}</strong>
      <span className="text-sm text-muted">{label}</span>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}
