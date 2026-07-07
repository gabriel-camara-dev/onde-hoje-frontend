import { useQuery } from '@tanstack/react-query'
import { getAdminAuthActivity } from '../../../../../api/ondeHoje'

export function useAdminAuth() {
  const query = useQuery({
    queryKey: ['admin-auth-activity'],
    queryFn: getAdminAuthActivity,
  })

  return {
    activity: query.data,
    isLoading: query.isLoading,
    error: query.error?.message,
  }
}
