import { useQuery } from '@tanstack/react-query'
import { getAdminOverview } from '../../../../../api/ondeHoje'

export function useAdminOverview() {
  const query = useQuery({
    queryKey: ['admin-overview'],
    queryFn: getAdminOverview,
  })

  return {
    overview: query.data,
    isLoading: query.isLoading,
    error: query.error?.message,
  }
}
