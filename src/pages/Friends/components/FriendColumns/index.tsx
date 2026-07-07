import type { FriendListItem } from '../../../../@types/OndeHoje'
import { Panel } from '../../../../components/ui/Panel'
import { FriendColumn } from '../FriendColumn'

type FriendColumnsProps = {
  received: FriendListItem[]
  accepted: FriendListItem[]
  sent: FriendListItem[]
  onAccept: (username: string) => void
  onReject: (username: string) => void
}

export function FriendColumns({
  received,
  accepted,
  sent,
  onAccept,
  onReject,
}: FriendColumnsProps) {
  return (
    <Panel>
      <div className="grid gap-5 xl:grid-cols-3">
        <FriendColumn
          acceptAction={onAccept}
          items={received}
          rejectAction={onReject}
          title="Recebidos"
        />
        <FriendColumn items={accepted} title="Amigos" />
        <FriendColumn items={sent} title="Enviados" />
      </div>
    </Panel>
  )
}
