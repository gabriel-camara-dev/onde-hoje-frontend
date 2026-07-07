import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { listUsers } from '../../../../../api/ondeHoje'

type UserFilters = {
  name: string
  email: string
  username: string
}

export function useAdminUsers() {
  const [filters, setFilters] = useState<UserFilters>({ name: '', email: '', username: '' })

  const query = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => listUsers({ ...filters, page: 1 }),
  })

  return {
    users: query.data?.data ?? [],
    total: query.data?.totalCount ?? 0,
    error: query.error?.message,
    isLoading: query.isLoading,
    onFilter: setFilters,
  }
}
