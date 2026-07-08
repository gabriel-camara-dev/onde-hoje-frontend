import { useEffect, useState } from 'react'

type StatusBannerProps = {
  error?: string | null
  message?: string | null
  loading?: boolean
}

export function StatusBanner({ error, loading, message }: StatusBannerProps) {
  // Only surface the loading state if it lingers past 1s, so quick fetches
  // (and refetches on focus/refresh) don't flash a "Carregando..." banner.
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    if (!loading) {
      setShowLoading(false)
      return
    }

    const timer = window.setTimeout(() => setShowLoading(true), 1000)
    return () => window.clearTimeout(timer)
  }, [loading])

  const visibleLoading = Boolean(loading) && showLoading

  if (!error && !message && !visibleLoading) {
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
