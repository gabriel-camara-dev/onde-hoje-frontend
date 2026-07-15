type StatusBannerProps = {
  error?: string | null
  message?: string | null
  // Accepted for backwards-compat with existing call sites, but intentionally
  // NOT rendered: we don't show a "Carregando dados..." banner anymore — that
  // kind of server/loading feedback felt too aggressive.
  loading?: boolean
}

export function StatusBanner({ error, message }: StatusBannerProps) {
  if (!error && !message) {
    return null
  }

  const tone = error
    ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/70 dark:bg-red-950/35 dark:text-red-200'
    : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/35 dark:text-emerald-200'

  return (
    <div className={`mb-3 rounded-md border px-4 py-3 text-sm font-semibold ${tone}`}>
      {error ?? message}
    </div>
  )
}
