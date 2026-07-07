import { useQuery } from '@tanstack/react-query'
import { getAdminAbuseReport } from '../../../../../api/ondeHoje'

export function useAdminAbuse() {
  const query = useQuery({
    queryKey: ['admin-abuse'],
    queryFn: getAdminAbuseReport,
  })

  return {
    report: query.data,
    isLoading: query.isLoading,
    error: query.error?.message,
  }
}
