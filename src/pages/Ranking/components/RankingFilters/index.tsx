import type { FormEvent } from 'react'
import Button from '../../../../components/ui/Button'
import Input from '../../../../components/ui/Input'
import { Panel } from '../../../../components/ui/Panel'
import type { RankingFilters as RankingFiltersValues } from '../../hooks/useRanking'

type RankingFiltersProps = {
  draftFilters: RankingFiltersValues
  onChange: (patch: Partial<RankingFiltersValues>) => void
  onSubmit: () => void
}

export function RankingFilters({ draftFilters, onChange, onSubmit }: RankingFiltersProps) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <Panel>
      <form className="grid gap-2 md:grid-cols-[1fr_120px_170px_auto]" onSubmit={submit}>
        <Input
          label="Cidade"
          name="city"
          value={draftFilters.city}
          onChange={(event) => onChange({ city: event.currentTarget.value })}
        />
        <Input
          label="Estado"
          maxLength={2}
          name="state"
          placeholder="SP"
          value={draftFilters.state}
          onChange={(event) => onChange({ state: event.currentTarget.value })}
        />
        <Input
          label="Dia"
          name="day"
          type="date"
          value={draftFilters.day}
          onChange={(event) => onChange({ day: event.currentTarget.value })}
        />
        <Button className="self-end" type="submit">
          Buscar
        </Button>
      </form>
    </Panel>
  )
}
