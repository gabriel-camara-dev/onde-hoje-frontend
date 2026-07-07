import { CalendarDays, Trophy } from 'lucide-react'
import { StatusBanner } from '../../components/ui/StatusBanner'
import { RankingFilters, RankingPanel } from './components'
import { useRanking } from './hooks/useRanking'

export default function Ranking() {
  const {
    draftFilters,
    changeDraft,
    submit,
    globalPlaces,
    dayPlaces,
    totalGlobalVotes,
    totalDayVotes,
    error,
    isLoading,
  } = useRanking()

  return (
    <>
      <StatusBanner error={error} loading={isLoading} />
      <section className="grid gap-4">
        <RankingFilters draftFilters={draftFilters} onChange={changeDraft} onSubmit={submit} />

        <section className="grid gap-4 xl:grid-cols-2">
          <RankingPanel
            countLabel="votos globais"
            icon={Trophy}
            places={globalPlaces}
            title="Ranking global"
            totalVotes={totalGlobalVotes}
          />
          <RankingPanel
            countLabel="votos no dia"
            icon={CalendarDays}
            places={dayPlaces}
            title="Ranking do dia"
            totalVotes={totalDayVotes}
          />
        </section>
      </section>
    </>
  )
}
