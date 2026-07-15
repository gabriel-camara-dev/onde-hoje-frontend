import { Ban, Check, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import Button from '../../../../components/ui/Button'
import Input from '../../../../components/ui/Input'
import Select from '../../../../components/ui/Select'
import { formatDisplayDate } from '../../../../lib/date'
import { getLastVoteGroup } from '../../../../lib/lastVoteGroup'
import { voteTypeOptions } from '../../homeVoteTypeOptions'

// Sentinel value for the "Criar grupo" option in the group select.
const CREATE_GROUP_VALUE = '__create_group__'

type VotePanelProps = {
  canChooseVoteType?: boolean
  canDecline?: boolean
  groups: Array<{ id: string; name: string }>
  hasUserVote?: boolean
  isFreeMapPoint?: boolean
  isNewPlace?: boolean
  isPending?: boolean
  maxDay: string
  minDay: string
  onDayChange: (day: string) => void
  onCancelVote: (form: FormData) => void
  onCreateGroup?: () => void
  onSubmit: (form: FormData) => void
  googlePlaceName?: string | null
  placeName?: string
  selectedDay: string
  selectedGroupPublicId?: string
  voteCount?: number
}

export function VotePanel({
  canChooseVoteType = true,
  canDecline: canDeclineProp,
  groups,
  hasUserVote,
  isFreeMapPoint,
  isNewPlace,
  isPending,
  maxDay,
  minDay,
  onDayChange,
  onCancelVote,
  onCreateGroup,
  onSubmit,
  googlePlaceName,
  placeName,
  selectedDay,
  selectedGroupPublicId,
  voteCount,
}: VotePanelProps) {
  const [going, setGoing] = useState(true)
  // Default the group to the last one the user voted with ('' = Público) when it
  // is still an active group; otherwise fall back to the current map filter.
  const [groupValue, setGroupValue] = useState(() => {
    const last = getLastVoteGroup()
    if (last !== null && (last === '' || groups.some((group) => group.id === last))) {
      return last
    }
    return selectedGroupPublicId ?? ''
  })
  // "Não vou" only makes sense when the place already has a going vote for the
  // selected day. useHome passes a day-accurate `canDecline`; fall back to the
  // displayed (possibly week-aggregated) count when it isn't provided.
  const canDecline = !isNewPlace && (canDeclineProp ?? (voteCount ?? 0) > 0)
  const effectiveGoing = canDecline ? going : true
  const submitLabel = !effectiveGoing
    ? 'Marcar que não vou'
    : isFreeMapPoint
      ? 'Salvar ponto e votar'
      : isNewPlace
        ? 'Salvar e votar'
        : 'Votar aqui'
  const pendingLabel = isFreeMapPoint
    ? 'Salvando ponto e votando...'
    : isNewPlace
      ? 'Salvando lugar e votando...'
      : 'Registrando voto...'
  const pendingMessage = isFreeMapPoint
    ? 'Estamos salvando o ponto no mapa e confirmando seu voto. Isso pode levar alguns segundos.'
    : isNewPlace
      ? 'Estamos salvando o lugar e confirmando seu voto. Isso pode levar alguns segundos.'
      : 'Estamos confirmando seu voto. Isso pode levar alguns segundos.'

  if (hasUserVote && !isNewPlace) {
    return (
      <section className="pointer-events-auto rounded-lg border border-line bg-surface/95 p-3 text-ink shadow-panel backdrop-blur">
        <p className="mb-2 text-xs font-semibold uppercase text-teal">Seu voto</p>
        <p className="text-sm text-ink">
          Você já votou aqui para <strong>{formatDisplayDate(selectedDay)}</strong>.
        </p>
        {voteCount !== undefined && (
          <span className="mt-3 inline-flex rounded-full bg-teal-soft px-3 py-1 text-sm font-semibold text-teal">
            {voteCount} votos em {formatDisplayDate(selectedDay)}
          </span>
        )}
        <form
          className="mt-4"
          onSubmit={(event) => {
            event.preventDefault()
            onCancelVote(new FormData(event.currentTarget))
          }}
        >
          <input name="day" type="hidden" value={selectedDay} />
          <Button disabled={!placeName || isPending} type="submit" variant="danger">
            {isPending && <LoaderCircle className="animate-spin" size={17} />}
            {isPending ? 'Removendo voto...' : 'Tirar meu voto'}
          </Button>
        </form>
      </section>
    )
  }

  return (
    <section className="pointer-events-auto min-w-0 text-ink">
      {voteCount !== undefined && (
        <span className="inline-flex rounded-full bg-teal-soft px-3 py-1 text-sm font-semibold text-teal">
          {voteCount} votos em {formatDisplayDate(selectedDay)}
        </span>
      )}
      <form
        aria-busy={isPending}
        className="grid gap-2.5"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(new FormData(event.currentTarget))
        }}
      >
        {isPending && (
          <div
            aria-live="polite"
            className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/35 dark:text-amber-200"
          >
            <LoaderCircle className="mt-0.5 shrink-0 animate-spin" size={18} />
            <span>{pendingMessage}</span>
          </div>
        )}
        <fieldset className="grid gap-2.5" disabled={isPending}>
          {isNewPlace && (
            <Input
              autoFocus
              defaultValue=""
              label="Apelido do lugar"
              maxLength={80}
              minLength={2}
              name="placeNickname"
              placeholder={
                googlePlaceName
                  ? 'Ex: Role depois do trampo'
                  : 'Ex: Quadra da praia, Escadaria, Mirante...'
              }
            />
          )}
          <div className="grid min-w-0 gap-2.5 sm:grid-cols-2 [&_input]:min-w-0">
            <Input
              label="Dia"
              max={maxDay}
              min={minDay}
              name="day"
              required
              type="date"
              value={selectedDay}
              onChange={(event) => onDayChange(event.currentTarget.value)}
            />
            <Input label="Horário (opcional)" name="voteTime" type="time" />
          </div>
          <Select
            value={groupValue}
            label="Grupo"
            name="groupPublicId"
            options={[
              { label: 'Público', value: '' },
              ...groups.map((group) => ({ label: group.name, value: group.id })),
              { label: '＋ Criar grupo', value: CREATE_GROUP_VALUE },
            ]}
            onChange={(nextValue) => {
              if (nextValue === CREATE_GROUP_VALUE) {
                onCreateGroup?.()
                return
              }
              setGroupValue(nextValue)
            }}
          />
          {canChooseVoteType && (
            <fieldset disabled={isPending}>
              <legend className="mb-3 block text-xs font-medium text-muted">Tipo do voto</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {voteTypeOptions.map(({ icon: Icon, label, optionClassName, value }) => (
                  <label
                    key={value}
                    className={`grid min-h-12 cursor-pointer place-items-center gap-0.5 rounded-md border border-line bg-surface-muted px-1.5 py-1.5 text-xs font-semibold text-muted transition ${optionClassName}`}
                  >
                    <input
                      className="sr-only"
                      defaultChecked={value === 'GENERAL'}
                      name="voteType"
                      type="radio"
                      value={value}
                    />
                    <Icon size={18} />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <label className="grid gap-1.5 text-xs font-medium text-muted">
            Nota (opcional)
            <textarea
              className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
              maxLength={240}
              name="note"
              rows={2}
            />
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface-muted px-3 py-2.5 text-sm font-medium text-ink">
            <input
              className="mt-0.5 size-4 accent-teal"
              defaultChecked
              name="showIdentity"
              type="checkbox"
            />
            <span>
              Permitir que vejam que fui eu que votei
              <span className="mt-0.5 block text-xs font-normal text-muted">
                Se desmarcar, seu voto continua contando, mas seu nome não aparece na lista.
              </span>
            </span>
          </label>
          <input name="going" type="hidden" value={effectiveGoing ? 'true' : 'false'} />
          {canDecline && (
            <>
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-surface-muted p-1">
                <button
                  className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md text-sm font-semibold transition ${
                    going ? 'bg-teal text-on-teal' : 'text-muted hover:text-ink'
                  }`}
                  type="button"
                  onClick={() => setGoing(true)}
                >
                  <Check size={16} />
                  Vou
                </button>
                <button
                  className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md text-sm font-semibold transition ${
                    going ? 'text-muted hover:text-ink' : 'bg-red-700 text-white'
                  }`}
                  type="button"
                  onClick={() => setGoing(false)}
                >
                  <Ban size={16} />
                  Não vou
                </button>
              </div>
              {!going && (
                <p className="text-xs font-medium text-muted">
                  Seu &quot;não vou&quot; não conta no limite semanal nem coloca o lugar no mapa, só
                  avisa o grupo que você não vai.
                </p>
              )}
            </>
          )}
          <Button
            disabled={!placeName || isPending}
            type="submit"
            variant={effectiveGoing ? 'primary' : 'danger'}
          >
            {isPending && <LoaderCircle className="animate-spin" size={17} />}
            {isPending ? pendingLabel : submitLabel}
          </Button>
        </fieldset>
      </form>
    </section>
  )
}
