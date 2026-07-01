import { useUserStore } from '../stores/userStore'
import { axiosPrivate } from '../api/api'
import { useMutation } from '@tanstack/react-query'

const useRefreshToken = () => {
  const setUser = useUserStore((state) => state.setUser)
  const currentUser = useUserStore((state) => state.user)

  const { mutateAsync: refresh } = useMutation({
    mutationFn: async () => {
      const response = await axiosPrivate.post(
        '/sessions/refresh-token',
        {},
        { withCredentials: true }
      )

      const newAccessToken = response.data.accessToken

      setUser({
        accessToken: newAccessToken,
        user: currentUser,
      })

      return newAccessToken
    },
  })

  return refresh
}

export default useRefreshToken
