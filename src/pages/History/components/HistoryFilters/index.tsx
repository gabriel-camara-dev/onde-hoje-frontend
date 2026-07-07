import { Clock3 } from 'lucide-react'
import type { FormEvent } from 'react'
import Button from '../../../../components/ui/Button'
import Input from '../../../../components/ui/Input'
import { Panel } from '../../../../components/ui/Panel'

type HistoryRange = {
  from: string
  to: string
}

type HistoryFiltersProps = {
  range: HistoryRange
  totalVotes: number
  onSubmit: (range: HistoryRange) => void
}

export function HistoryFilters({ range, totalVotes, onSubmit }: HistoryFiltersProps) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onSubmit({
      from: String(form.get('from') || range.from),
      to: String(form.get('to') || range.to),
    })
  }

  return (
    <Panel>
      <Clock3 className="mb-4 text-teal" size={28} />
      <h1 className="text-2xl font-semibold">Meu historico</h1>
      <p className="mt-2 text-sm text-muted">
        Consulte seus votos recentes e veja onde voce marcou presença.
      </p>
      <form className="mt-5 grid gap-3" onSubmit={submit}>
        <Input label="De" name="from" type="date" defaultValue={range.from} />
        <Input label="Ate" name="to" type="date" defaultValue={range.to} />
        <Button type="submit">Atualizar periodo</Button>
      </form>
      <div className="mt-5 rounded-lg border border-line p-4">
        <strong className="block text-3xl">{totalVotes}</strong>
        <span className="text-sm text-muted">meus votos no periodo</span>
      </div>
    </Panel>
  )
}
