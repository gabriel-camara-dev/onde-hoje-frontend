import { useQuery } from '@tanstack/react-query'
import { Clock3 } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { getMapHistory, type MapFilters } from '../../api/ondeHoje'
import Button from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import Input from '../../components/ui/Input'
import { Panel } from '../../components/ui/Panel'
import { StatusBanner } from '../../components/ui/StatusBanner'

type HistoryPageProps = {
  filters?: MapFilters
}

const today = new Date()
const toDate = today.toISOString().slice(0, 10)
const fromDate = new Date(today.getTime() - 6 * 86_400_000).toISOString().slice(0, 10)

export default function HistoryPage({ filters: initialFilters }: HistoryPageProps) {
  const [range, setRange] = useState({ from: fromDate, to: toDate })
  const filters = initialFilters ?? { city: '', day: toDate, q: '' }
  const historyQuery = useQuery({
    queryKey: ['map-history', filters, range],
    queryFn: () => getMapHistory({ ...filters, ...range }),
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setRange({
      from: String(form.get('from') || fromDate),
      to: String(form.get('to') || toDate),
    })
  }

  const history = historyQuery.data ?? []
  const totalVotes = history.reduce(
    (sum, day) => sum + day.places.reduce((daySum, place) => daySum + place.voteCount, 0),
    0
  )

  return (
    <>
      <StatusBanner error={historyQuery.error?.message} loading={historyQuery.isLoading} />
      <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Panel>
          <Clock3 className="mb-4 text-teal" size={28} />
          <h1 className="text-2xl font-black">Historico do mapa</h1>
          <p className="mt-2 text-sm text-muted">
            Consulte ate 31 dias de votos ativos, com filtros por cidade e grupo.
          </p>
          <form className="mt-5 grid gap-3" onSubmit={submit}>
            <Input label="De" name="from" type="date" defaultValue={range.from} />
            <Input label="Ate" name="to" type="date" defaultValue={range.to} />
            <Button type="submit">Atualizar periodo</Button>
          </form>
          <div className="mt-5 rounded-lg border border-line p-4">
            <strong className="block text-3xl">{totalVotes}</strong>
            <span className="text-sm text-muted">votos no periodo</span>
          </div>
        </Panel>

        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black">Linha do tempo</h2>
            <strong className="text-muted">{history.length} dias</strong>
          </div>
          <div className="grid gap-4">
            {history.length === 0 ? (
              <EmptyState
                title="Sem historico neste periodo"
                description="Tente ampliar o periodo ou remover filtros."
              />
            ) : (
              history.map((day) => (
                <article key={day.day} className="rounded-lg border border-line p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <strong>{day.day}</strong>
                    <span className="text-sm font-bold text-teal">{day.places.length} lugares</span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {day.places.map((place) => (
                      <div key={`${day.day}-${place.id}`} className="rounded-lg bg-teal-soft p-3">
                        <strong className="block">{place.name}</strong>
                        <span className="text-sm text-muted">{place.formattedAddress}</span>
                        <b className="mt-2 block text-teal">{place.voteCount} votos</b>
                      </div>
                    ))}
                  </div>
                </article>
              ))
            )}
          </div>
        </Panel>
      </section>
    </>
  )
}
