type EmptyStateProps = {
  title: string
  description: string
}

export function EmptyState({ description, title }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-teal-soft p-4">
      <strong className="block text-sm text-ink">{title}</strong>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  )
}
