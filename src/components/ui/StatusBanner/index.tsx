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
    ? 'bg-red-50 text-red-800'
    : message
      ? 'bg-emerald-50 text-emerald-800'
      : 'bg-amber-50 text-amber-900'

  return (
    <div className={`mb-3 rounded-lg px-4 py-3 text-sm font-bold ${tone}`}>
      {error ?? message ?? 'Carregando dados...'}
    </div>
  )
}
