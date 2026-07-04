import { useQuery } from '@tanstack/react-query'
import { Clock3, MapPin } from 'lucide-react'
import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { listMyVotes } from '../../api/ondeHoje'
import type { VoteHistoryItem } from '../../@types/OndeHoje'
import Button from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import Input from '../../components/ui/Input'
import { Panel } from '../../components/ui/Panel'
import { StatusBanner } from '../../components/ui/StatusBanner'
import { formatDisplayDate, formatInputDate } from '../../lib/date'
import { useUserStore } from '../../stores/userStore'

const today = new Date()
const toDate = formatInputDate(today)
const fromDate = formatInputDate(new Date(today.getTime() - 30 * 86_400_000))

export default function HistoryPage() {
  const accessToken = useUserStore((state) => state.accessToken)
  const [range, setRange] = useState({ from: fromDate, to: toDate })
  const myVotesQuery = useQuery({
    enabled: Boolean(accessToken),
    queryKey: ['my-votes'],
    queryFn: listMyVotes,
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setRange({
      from: String(form.get('from') || fromDate),
      to: String(form.get('to') || toDate),
    })
  }

  const votes = useMemo(
    () =>
      (myVotesQuery.data ?? []).filter((vote) => {
        const day = dateOnly(vote.day)
        return day >= range.from && day <= range.to
      }),
    [myVotesQuery.data, range.from, range.to]
  )
  const history = groupVotesByDay(votes)

  return (
    <>
      <StatusBanner error={myVotesQuery.error?.message} loading={myVotesQuery.isLoading} />
      <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Panel>
          <Clock3 className="mb-4 text-teal" size={28} />
          <h1 className="text-2xl font-semibold">Meu historico</h1>
          <p className="mt-2 text-sm text-muted">
            Consulte seus votos recentes e veja onde voce marcou presenca.
          </p>
          <form className="mt-5 grid gap-3" onSubmit={submit}>
            <Input label="De" name="from" type="date" defaultValue={range.from} />
            <Input label="Ate" name="to" type="date" defaultValue={range.to} />
            <Button type="submit">Atualizar periodo</Button>
          </form>
          <div className="mt-5 rounded-lg border border-line p-4">
            <strong className="block text-3xl">{votes.length}</strong>
            <span className="text-sm text-muted">meus votos no periodo</span>
          </div>
        </Panel>

        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Linha do tempo</h2>
            <strong className="text-muted">{history.length} dias</strong>
          </div>
          {!accessToken ? (
            <EmptyState
              title="Entre para ver seu historico"
              description="Seu historico individual aparece aqui depois que voce estiver logado."
            />
          ) : history.length === 0 ? (
            <EmptyState
              title="Sem votos neste periodo"
              description="Quando voce votar em algum lugar, ele aparece nesta linha do tempo."
            />
          ) : (
            <div className="grid gap-4">
              {history.map((day) => (
                <article key={day.day} className="rounded-lg border border-line p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <strong>{formatDisplayDate(day.day)}</strong>
                    <span className="text-sm font-medium text-teal">
                      {day.votes.length} {day.votes.length === 1 ? 'voto' : 'votos'}
                    </span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {day.votes.map((vote) => (
                      <div key={vote.id} className="rounded-lg bg-teal-soft p-3">
                        <strong className="block">{vote.place.name}</strong>
                        <span className="mt-1 block text-sm text-muted">
                          {vote.place.formattedAddress}
                        </span>
                        <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-teal">
                          <MapPin size={15} />
                          {vote.group?.name ?? 'Publico'}
                        </span>
                        {vote.note && <p className="mt-2 text-sm text-muted">{vote.note}</p>}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>
      </section>
    </>
  )
}

function groupVotesByDay(votes: VoteHistoryItem[]) {
  const groups = new Map<string, VoteHistoryItem[]>()

  for (const vote of votes) {
    const day = dateOnly(vote.day)
    groups.set(day, [...(groups.get(day) ?? []), vote])
  }

  return Array.from(groups.entries())
    .map(([day, dayVotes]) => ({ day, votes: dayVotes }))
    .sort((a, b) => b.day.localeCompare(a.day))
}

function dateOnly(value: string) {
  return value.slice(0, 10)
}
