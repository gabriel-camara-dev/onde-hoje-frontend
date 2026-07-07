export function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-surface-muted p-3">
      <strong className="block text-2xl">{value}</strong>
      <span className="text-sm text-muted">{label}</span>
    </div>
  )
}
