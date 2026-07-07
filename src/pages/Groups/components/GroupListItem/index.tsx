import { UserPlus } from 'lucide-react'
import type { Group, MyGroup } from '../../../../@types/OndeHoje'
import Button from '../../../../components/ui/Button'
import { Metric } from '../Metric'

export function GroupListItem({
  canJoin,
  group,
  onJoin,
  onSelect,
  selected,
}: {
  canJoin?: boolean
  group: Group | MyGroup
  onJoin?: () => void
  onSelect: () => void
  selected: boolean
}) {
  const canOpen = 'members' in group

  return (
    <div
      className={`grid cursor-pointer gap-3 rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30 ${
        selected ? 'border-teal bg-teal-soft' : 'border-line bg-surface hover:bg-teal-soft'
      }`}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-semibold uppercase text-teal">
            {group.privacy === 'PRIVATE' ? 'Privado' : 'Publico'}
            {canOpen && ' - meu grupo'}
          </p>
          <h2 className="text-lg font-semibold">{group.name}</h2>
          <p className="mt-1 text-sm text-muted">{group.description || 'Grupo sem descricao.'}</p>
        </div>
        {canJoin && onJoin && (
          <Button
            className="shrink-0"
            type="button"
            variant="secondary"
            onClick={(event) => {
              event.stopPropagation()
              onJoin()
            }}
          >
            <UserPlus size={16} />
            Entrar
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Metric label="membros" value={group.membersCount ?? 0} />
        <Metric label="votos hoje" value={group.todayVotesCount ?? 0} />
      </div>
    </div>
  )
}
