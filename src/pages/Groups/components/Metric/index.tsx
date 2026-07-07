export function Metric({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-lg border border-line p-3 text-sm">
      <strong className="block text-lg">{value}</strong>
      {label}
    </span>
  )
}
