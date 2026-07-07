import { CalendarDays, Sparkles } from 'lucide-react'
import { Avatar } from '../../../../components/Avatar'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { Panel } from '../../../../components/ui/Panel'
import { formatDisplayDate } from '../../../../lib/date'
import { useGroupDayVotes } from './hooks/useGroupDayVotes'

const MAX_AVATARS = 6

export function GroupDayVotes({ groupId }: { groupId: string }) {
  const { day, places, isLoading, error } = useGroupDayVotes(groupId)

  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="inline-flex items-center gap-2 text-lg font-semibold">
            <CalendarDays className="text-teal" size={20} />
            Onde o grupo vai hoje
          </h3>
          <p className="mt-1 text-sm text-muted">Lugares votados pelo grupo em {formatDisplayDate(day)}.</p>
        </div>
        <span className="rounded-full bg-teal-soft px-3 py-1 text-sm font-semibold text-teal">
          {places.length}
        </span>
      </div>

      {error ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</div>
      ) : isLoading ? (
        <div className="rounded-lg border border-line bg-surface-muted p-4 text-sm font-semibold text-muted">
          Carregando votos do dia...
        </div>
      ) : places.length === 0 ? (
        <EmptyState
          title="Nenhum voto hoje"
          description="Quando o grupo votar em algum lugar hoje, ele aparece aqui."
        />
      ) : (
        <div className="grid gap-2">
          {places.map((place, index) => {
            const highlighted = index === 0 && place.voteCount > 0
            const extraVoters = place.voters.length - MAX_AVATARS

            return (
              <article
                key={place.id}
                className={`grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-lg border p-3 transition ${
                  highlighted
                    ? 'border-amber-300 bg-amber-50 shadow-[0_0_20px_-4px_rgba(245,158,11,.55)] dark:border-amber-900/70 dark:bg-amber-950/25'
                    : 'border-line'
                }`}
              >
                <b
                  className={`grid size-9 place-items-center rounded-xl text-sm font-bold ${
                    highlighted ? 'bg-amber text-ink' : 'bg-surface-muted text-muted'
                  }`}
                >
                  {highlighted ? <Sparkles size={16} /> : index + 1}
                </b>
                <div className="min-w-0">
                  <strong className="block truncate">{place.name}</strong>
                  <small className="block truncate text-muted">{place.formattedAddress}</small>
                  {place.voters.length > 0 && (
                    <div className="mt-2 flex items-center">
                      <div className="flex -space-x-2">
                        {place.voters.slice(0, MAX_AVATARS).map((voter) => (
                          <Avatar
                            key={voter.publicId}
                            name={voter.name}
                            src={voter.avatarUrl}
                            className="size-7 rounded-full ring-2 ring-surface"
                          />
                        ))}
                      </div>
                      {extraVoters > 0 && (
                        <span className="ml-2 text-xs font-semibold text-muted">+{extraVoters}</span>
                      )}
                    </div>
                  )}
                </div>
                <em className="text-sm font-semibold not-italic text-teal">
                  {place.voteCount} {place.voteCount === 1 ? 'voto' : 'votos'}
                </em>
              </article>
            )
          })}
        </div>
      )}
    </Panel>
  )
}
