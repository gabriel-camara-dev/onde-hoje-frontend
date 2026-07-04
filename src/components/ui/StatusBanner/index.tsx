type StatusBannerProps = {
  error?: string | null
  message?: string | null
  loading?: boolean
}

export function StatusBanner({ error, loading, message }: StatusBannerProps) {
  if (!error && !message && !loading) {
    return null
  }

  const tone = error
    ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/70 dark:bg-red-950/35 dark:text-red-200'
    : message
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/35 dark:text-emerald-200'
      : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/35 dark:text-amber-200'

  return (
    <div className={`mb-3 rounded-md border px-4 py-3 text-sm font-semibold ${tone}`}>
      {error ?? message ?? 'Carregando dados...'}
    </div>
  )
}

