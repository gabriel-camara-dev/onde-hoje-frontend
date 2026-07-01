import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { axiosPrivate } from '../api/api'
import { useUserStore } from '../stores/userStore'
import useRefreshToken from './useRefreshToken'

let isRefreshing = false
let failedQueue: {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}[] = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else if (token) {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

const useAxiosPrivate = () => {
  const refresh = useRefreshToken()
  const accessToken = useUserStore((state) => state.accessToken)
  const navigate = useNavigate()

  useEffect(() => {
    const requestIntercept = axiosPrivate.interceptors.request.use(
      (config) => {
        if (!config.headers['Authorization']) {
          config.headers['Authorization'] = `Bearer ${accessToken}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    const responseIntercept = axiosPrivate.interceptors.response.use(
      (response) => response,
      async (error) => {
        const prevRequest = error?.config

        if (
          error?.response?.status !== 401 ||
          prevRequest?.sent ||
          prevRequest?.url?.includes('/refresh-token')
        ) {
          return Promise.reject(error)
        }

        prevRequest.sent = true

        if (isRefreshing) {
          // Já está atualizando o token → espera terminar
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => {
                prevRequest.headers['Authorization'] = `Bearer ${token}`
                resolve(axiosPrivate(prevRequest))
              },
              reject,
            })
          })
        }

        isRefreshing = true

        try {
          const newAccessToken = await refresh()
          processQueue(null, newAccessToken)

          prevRequest.headers['Authorization'] = `Bearer ${newAccessToken}`

          return axiosPrivate(prevRequest)
        } catch (refreshError: unknown) {
          processQueue(refreshError, null)

          useUserStore.getState().logout()

          navigate('/', { replace: true })

          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }
    )

    return () => {
      axiosPrivate.interceptors.request.eject(requestIntercept)
      axiosPrivate.interceptors.response.eject(responseIntercept)
    }
  }, [accessToken, refresh, navigate])

  return axiosPrivate
}

export default useAxiosPrivate
