import { EmptyState } from '../../../../components/ui/EmptyState'

export type MetricListRow = {
  key: string
  primary: string
  secondary?: string
  value: string | number
  valueLabel?: string
  highlight?: boolean
}

type MetricListProps = {
  title: string
  description?: string
  rows: MetricListRow[]
  emptyLabel?: string
}

export function MetricList({ title, description, rows, emptyLabel }: MetricListProps) {
  return (
    <section className="rounded-lg border border-line p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="text-xs text-muted">{description}</p>}
      </div>
      {rows.length === 0 ? (
        <EmptyState title={emptyLabel ?? 'Sem dados'} description="Nada por aqui ainda." />
      ) : (
        <ul className="grid gap-1.5">
          {rows.map((row, index) => (
            <li
              key={row.key}
              className={`grid grid-cols-[24px_1fr_auto] items-center gap-3 rounded-md px-2 py-1.5 ${
                row.highlight ? 'bg-amber-50 dark:bg-amber-950/25' : 'odd:bg-surface-muted'
              }`}
            >
              <span className="text-xs font-semibold text-muted">{index + 1}</span>
              <span className="min-w-0">
                <strong className="block truncate text-sm">{row.primary}</strong>
                {row.secondary && <small className="block truncate text-muted">{row.secondary}</small>}
              </span>
              <span className="whitespace-nowrap text-sm font-semibold text-teal">
                {row.value}
                {row.valueLabel ? ` ${row.valueLabel}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
