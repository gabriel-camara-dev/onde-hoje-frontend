import { StatusBanner } from '../../components/ui/StatusBanner'
import { HistoryFilters, HistoryTimeline } from './components'
import { useHistory } from './hooks/useHistory'

export default function HistoryPage() {
  const { isLoggedIn, range, onRangeChange, totalVotes, history, error, isLoading } = useHistory()

  return (
    <>
      <StatusBanner error={error} loading={isLoading} />
      <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <HistoryFilters range={range} totalVotes={totalVotes} onSubmit={onRangeChange} />
        <HistoryTimeline isLoggedIn={isLoggedIn} history={history} />
      </section>
    </>
  )
}
