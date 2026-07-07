export function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line p-4">
      <strong className="block text-3xl">{value}</strong>
      <span className="text-sm text-muted">{label}</span>
    </div>
  )
}
