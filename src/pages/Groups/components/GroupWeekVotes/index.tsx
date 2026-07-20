import { CalendarDays, Sparkles } from 'lucide-react'
import { useState } from 'react'
import type { MapHistoryDay } from '../../../../@types/OndeHoje'
import { Avatar } from '../../../../components/Avatar'
import Button from '../../../../components/ui/Button'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { Modal } from '../../../../components/ui/Modal'
import { formatDisplayDate } from '../../../../lib/date'
import { useGroupWeekVotes } from './hooks/useGroupWeekVotes'

const MAX_AVATARS = 6

/** "Hoje" / "Amanhã" read better than a date for the days people actually plan around. */
function dayLabel(day: string, index: number) {
  if (index === 0) {
    return 'Hoje'
  }

  if (index === 1) {
    return 'Amanhã'
  }

  const [year, month, date] = day.slice(0, 10).split('-').map(Number)
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(
    new Date(year, month - 1, date)
  )

  return weekday.charAt(0).toUpperCase() + weekday.slice(1)
}

function DayVotes({ day, index }: { day: MapHistoryDay; index: number }) {
  return (
    <section className="grid gap-2">
      <div className="flex items-baseline justify-between gap-2 border-b border-line pb-1">
        <h3 className="text-sm font-semibold">
          {dayLabel(day.day, index)}{' '}
          <span className="font-normal text-muted">{formatDisplayDate(day.day)}</span>
        </h3>
        {day.places.length > 0 && (
          <span className="text-xs font-semibold text-muted">
            {day.places.length} {day.places.length === 1 ? 'lugar' : 'lugares'}
          </span>
        )}
      </div>

      {day.places.length === 0 ? (
        <p className="px-1 py-2 text-sm text-muted">Nenhum voto para este dia.</p>
      ) : (
        <div className="grid gap-2">
          {day.places.map((place, placeIndex) => {
            const highlighted = placeIndex === 0 && place.voteCount > 0
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
                  {highlighted ? <Sparkles size={16} /> : placeIndex + 1}
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
    </section>
  )
}

export function GroupWeekVotes({ groupId }: { groupId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const { week, totalVotes, isLoading, error } = useGroupWeekVotes(groupId, isOpen)

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setIsOpen(true)}>
        <CalendarDays size={17} />
        Ver votos
      </Button>

      {isOpen && (
        <Modal title="Onde o grupo vai nos próximos 7 dias" onClose={() => setIsOpen(false)}>
          {error ? (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{error}</div>
          ) : isLoading ? (
            <div className="rounded-lg border border-line bg-surface-muted p-4 text-sm font-semibold text-muted">
              Carregando votos da semana...
            </div>
          ) : totalVotes === 0 ? (
            <EmptyState
              title="Nenhum voto nos próximos 7 dias"
              description="Quando alguém do grupo votar em um lugar, ele aparece aqui."
            />
          ) : (
            <div className="grid gap-5">
              {week.map((day, index) => (
                <DayVotes key={day.day} day={day} index={index} />
              ))}
            </div>
          )}
        </Modal>
      )}
    </>
  )
}
