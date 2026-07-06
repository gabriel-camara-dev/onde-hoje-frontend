import type { InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'
import { useUserStore } from '../stores/userStore'
import { translateApiMessage, translateErrorMessage } from './apiErrorMessages'

export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3333'

export function resolveApiUrl(url?: string | null) {
  if (!url) {
    return null
  }

  if (/^https?:\/\//i.test(url)) {
    return url
  }

  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`
}

export const axiosPublic = axios.create({
  baseURL: API_BASE_URL,
})

export const axiosPrivate = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

export type ApiErrorField = 'email' | 'username'

export class ApiError extends Error {
  readonly field?: ApiErrorField
  readonly status?: number

  constructor(message: string, field?: ApiErrorField, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.field = field
    this.status = status
  }
}

const onRequest = (config: InternalAxiosRequestConfig) => {
  const token = useUserStore.getState().accessToken

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
}

const onResponseError = (options: { logoutOnUnauthorized?: boolean } = {}) => (error: unknown) => {
  if (axios.isAxiosError(error) && error.message === 'Network Error') {
    return Promise.reject(
      new Error(
        `Nao consegui conectar na API em ${API_BASE_URL}. Verifique se o backend esta rodando.`
      )
    )
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status

    if (status === 401 && options.logoutOnUnauthorized) {
      useUserStore.getState().logout()
    }

    const data = error.response?.data
    const message = data?.message ?? data?.error
    const field = data?.field

    if (message) {
      return Promise.reject(
        new ApiError(
          translateApiMessage(message, status),
          field === 'email' || field === 'username' ? field : undefined,
          status
        )
      )
    }

    if (status) {
      return Promise.reject(new ApiError(translateErrorMessage('', status), undefined, status))
    }
  }

  return Promise.reject(error)
}

axiosPrivate.interceptors.request.use(onRequest, Promise.reject)
axiosPublic.interceptors.response.use(undefined, onResponseError())
axiosPrivate.interceptors.response.use(undefined, onResponseError({ logoutOnUnauthorized: true }))