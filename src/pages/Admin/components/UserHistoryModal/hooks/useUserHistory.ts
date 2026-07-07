import { useQuery } from '@tanstack/react-query'
import { getUserVoteHistory } from '../../../../../api/ondeHoje'

export function useUserHistory(publicId: string) {
  const query = useQuery({
    queryKey: ['admin-user-history', publicId],
    queryFn: () => getUserVoteHistory(publicId),
    enabled: Boolean(publicId),
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error?.message,
  }
}
