import { useQuery } from '@tanstack/react-query'
import { Trophy } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { getTopPlaces, type MapFilters } from '../../api/ondeHoje'
import { EmptyState } from '../../components/ui/EmptyState'
import Input from '../../components/ui/Input'
import { Panel } from '../../components/ui/Panel'
import { StatusBanner } from '../../components/ui/StatusBanner'
import Button from '../../components/ui/Button'

const today = new Date().toISOString().slice(0, 10)

export default function Ranking() {
  const [filters, setFilters] = useState<MapFilters>({ city: '', day: today, q: '' })
  const rankingQuery = useQuery({
    queryKey: ['top-places', filters],
    queryFn: () => getTopPlaces(filters),
  })
  const places = rankingQuery.data ?? []
  const totalVotes = places.reduce((sum, place) => sum + place.voteCount, 0)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setFilters({
      city: String(form.get('city') || ''),
      day: String(form.get('day') || today),
      q: '',
    })
  }

  return (
    <>
      <StatusBanner error={rankingQuery.error?.message} loading={rankingQuery.isLoading} />
      <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Panel>
          <form className="mb-4 grid gap-2 md:grid-cols-[1fr_170px_auto]" onSubmit={submit}>
            <Input label="Cidade" name="city" defaultValue={filters.city} />
            <Input label="Dia" name="day" type="date" defaultValue={filters.day} />
            <Button className="self-end" type="submit">
              Buscar
            </Button>
          </form>
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-black">Ranking do dia</h1>
            <span className="rounded-full bg-amber px-3 py-1 text-sm font-black">
              {places.length}
            </span>
          </div>
          <div className="grid gap-2">
            {places.length === 0 ? (
              <EmptyState
                title="Ranking vazio"
                description="Ainda nao ha votos ativos para os filtros escolhidos."
              />
            ) : (
              places.map((place, index) => (
                <article
                  key={place.id}
                  className="grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-2xl border border-line p-3"
                >
                  <b className="grid size-9 place-items-center rounded-xl bg-amber">{index + 1}</b>
                  <span className="grid">
                    <strong>{place.name}</strong>
                    <small className="text-muted">{place.formattedAddress}</small>
                  </span>
                  <em className="text-sm font-black not-italic text-teal">
                    {place.voteCount} votos
                  </em>
                </article>
              ))
            )}
          </div>
        </Panel>
        <Panel className="rounded-3xl bg-contrast text-on-contrast">
          <Trophy className="mb-4 text-amber" size={28} />
          <h2 className="text-lg font-black">Leitura rapida</h2>
          <p className="mt-2 text-sm text-white/70">
            O ranking usa votos ativos do dia selecionado. Em grupos privados, apenas membros
            ativos conseguem ver o recorte.
          </p>
          <div className="mt-4 grid gap-2">
            <Metric label="votos no recorte" value={totalVotes} />
            <Metric label="lugares ranqueados" value={places.length} />
          </div>
        </Panel>
      </section>
    </>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
      <strong className="block text-2xl">{value}</strong>
      <span className="text-sm text-white/60">{label}</span>
    </div>
  )
}
