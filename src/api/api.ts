import type { InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'
import { useUserStore } from '../stores/userStore'

export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3333'

export const axiosPublic = axios.create({
  baseURL: API_BASE_URL,
})

export const axiosPrivate = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

const onRequest = (config: InternalAxiosRequestConfig) => {
  const token = useUserStore.getState().accessToken

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
}

const onResponseError = (error: unknown) => {
  if (axios.isAxiosError(error) && error.message === 'Network Error') {
    return Promise.reject(
      new Error(
        `Nao consegui conectar na API em ${API_BASE_URL}. Verifique se o backend esta rodando.`
      )
    )
  }

  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message ?? error.response?.data?.error

    if (message) {
      return Promise.reject(new Error(Array.isArray(message) ? message.join(', ') : message))
    }
  }

  return Promise.reject(error)
}

axiosPrivate.interceptors.request.use(onRequest, Promise.reject)
axiosPublic.interceptors.response.use(undefined, onResponseError)
axiosPrivate.interceptors.response.use(undefined, onResponseError)
