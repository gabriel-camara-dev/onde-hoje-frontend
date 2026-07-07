import { useState } from 'react'
import type { ListUsersResponse } from '../../../../@types/OndeHoje'
import { StatusBanner } from '../../../../components/ui/StatusBanner'
import { UserHistoryModal } from '../UserHistoryModal'
import { UsersPanel } from '../UsersPanel'
import { useAdminUsers } from './hooks/useAdminUsers'

type ListedUser = ListUsersResponse['data'][number]

export function UsersTab() {
  const { users, total, error, isLoading, onFilter } = useAdminUsers()
  const [selectedUser, setSelectedUser] = useState<ListedUser | null>(null)

  return (
    <div className="grid gap-4">
      <StatusBanner error={error} loading={isLoading} />
      <UsersPanel
        users={users}
        total={total}
        onFilter={onFilter}
        onSelectUser={setSelectedUser}
      />
      {selectedUser && (
        <UserHistoryModal
          publicId={selectedUser.id}
          fallbackName={selectedUser.name}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}
