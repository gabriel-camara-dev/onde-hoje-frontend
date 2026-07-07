import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getAdminDashboard, listUsers } from '../../../api/ondeHoje'
import { useUserStore } from '../../../stores/userStore'

type UserFilters = {
  name: string
  email: string
}

export function useAdmin() {
  const user = useUserStore((state) => state.user)
  const [userFilters, setUserFilters] = useState<UserFilters>({ name: '', email: '' })

  const dashboardQuery = useQuery({
    enabled: Boolean(user),
    queryKey: ['admin-dashboard'],
    queryFn: getAdminDashboard,
  })
  const usersQuery = useQuery({
    enabled: Boolean(user),
    queryKey: ['admin-users', userFilters],
    queryFn: () => listUsers({ ...userFilters, page: 1 }),
  })

  return {
    user,
    dashboard: dashboardQuery.data,
    users: usersQuery.data?.data ?? [],
    usersTotal: usersQuery.data?.totalCount ?? 0,
    error: dashboardQuery.error?.message ?? usersQuery.error?.message,
    isLoading: dashboardQuery.isLoading || usersQuery.isLoading,
    onFilter: setUserFilters,
  }
}
