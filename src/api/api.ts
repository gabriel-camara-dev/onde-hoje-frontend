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

let redirectingToLogin = false

// Session expired mid-action: send the user to login keeping the current URL as
// returnTo, so after signing in they land back on the invite/vote/group link and
// it completes. A hard redirect is fine here (we're leaving the session anyway).
function redirectToLoginPreservingIntent() {
  if (redirectingToLogin || typeof window === 'undefined') {
    return
  }

  const { pathname, search } = window.location

  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return
  }

  redirectingToLogin = true
  const returnTo = encodeURIComponent(`${pathname}${search}`)
  window.location.assign(`/login?returnTo=${returnTo}`)
}

// Reloads the page at most once per 20s, so a transient failure that "just needs
// a refresh" recovers on its own instead of showing a scary error. The guard
// prevents an infinite reload loop when the failure is persistent.
function maybeReloadOnUnknownError() {
  if (typeof window === 'undefined') {
    return false
  }

  const KEY = 'onde-hoje:last-error-reload'
  const now = Date.now()
  const last = Number(sessionStorage.getItem(KEY) || 0)

  if (now - last < 20000) {
    return false
  }

  sessionStorage.setItem(KEY, String(now))
  window.location.reload()
  return true
}

const onResponseError = (options: { logoutOnUnauthorized?: boolean } = {}) => (error: unknown) => {
  const isNetworkError = axios.isAxiosError(error) && error.message === 'Network Error'
  const status = axios.isAxiosError(error) ? error.response?.status : undefined
  const method = axios.isAxiosError(error) ? error.config?.method?.toLowerCase() : undefined

  // Unknown/transient failure while loading data (GET): refresh instead of
  // dumping an error the user can't act on. Mutations are left alone so form
  // data isn't lost.
  if (method === 'get' && (isNetworkError || (status !== undefined && status >= 500))) {
    if (maybeReloadOnUnknownError()) {
      return new Promise<never>(() => {})
    }
  }

  if (isNetworkError) {
    return Promise.reject(
      new Error(
        `Não consegui conectar na API em ${API_BASE_URL}. Verifique se o backend esta rodando.`
      )
    )
  }

  if (axios.isAxiosError(error)) {
    if (status === 401 && options.logoutOnUnauthorized) {
      useUserStore.getState().logout()
      redirectToLoginPreservingIntent()
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

// DEV-ONLY: artificial 2s delay on GET requests so the "Carregando dados..."
// banner (which only surfaces after 1s of loading) is visible while testing the
// loading states. Guarded by import.meta.env.DEV, so it's a no-op in the
// production build — remove this interceptor if you want instant dev loads back.
const devDelayGet = async (config: InternalAxiosRequestConfig) => {
  if (import.meta.env.DEV && config.method?.toLowerCase() === 'get') {
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  return config
}

axiosPrivate.interceptors.request.use(onRequest, Promise.reject)
axiosPublic.interceptors.request.use(devDelayGet)
axiosPrivate.interceptors.request.use(devDelayGet)
axiosPublic.interceptors.response.use(undefined, onResponseError())
axiosPrivate.interceptors.response.use(undefined, onResponseError({ logoutOnUnauthorized: true }))