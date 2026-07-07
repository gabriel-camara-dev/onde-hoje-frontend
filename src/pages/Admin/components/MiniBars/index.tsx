type MiniBarsProps = {
  title: string
  data: Array<{ day: string; count: number }>
}

export function MiniBars({ title, data }: MiniBarsProps) {
  const max = Math.max(1, ...data.map((point) => point.count))
  const total = data.reduce((sum, point) => sum + point.count, 0)

  return (
    <div className="rounded-lg border border-line p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted">{total} no período</span>
      </div>
      <div className="flex h-24 items-end gap-1">
        {data.map((point) => (
          <div
            key={point.day}
            className="group relative flex-1"
            title={`${point.day}: ${point.count}`}
          >
            <div
              className="w-full rounded-t bg-teal transition-all"
              style={{ height: `${Math.max(2, (point.count / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted">
        <span>{data[0]?.day.slice(5)}</span>
        <span>{data[data.length - 1]?.day.slice(5)}</span>
      </div>
    </div>
  )
}
