import { io, type Socket } from 'socket.io-client'
import { useUserStore } from '../stores/userStore'

let socket: Socket | null = null

function createSocket(token: string | null) {
  const baseUrl = import.meta.env.VITE_BACKEND_URL as string

  const s = io(baseUrl, {
    auth: { token: token ?? '' },
    withCredentials: true,
    path: '/socket.io',
  })

  s.on('connect', () => console.log('[socket] conectado:', s.id))
  s.on('connection:ready', (payload) => console.log('[socket] ready:', payload))
  s.on('notification:new', (data) => console.log('[socket] notification:new', data))
  s.on('connect_error', (err) => console.warn('[socket] connect_error:', err?.message ?? err))
  s.on('disconnect', (reason) => console.log('[socket] disconnect:', reason))

  return s
}

function updateAuthAndReconnect(newToken: string | null) {
  if (!socket) {
    socket = createSocket(newToken)
    return
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(socket as any).auth = { token: newToken ?? '' }
  if (socket.connected) socket.disconnect()
  socket.connect()
}

const initialToken = useUserStore.getState().accessToken
if (initialToken) {
  socket = createSocket(initialToken)
}

interface UserStoreState {
  accessToken: string | null
}

useUserStore.subscribe((s: UserStoreState, previousState: UserStoreState | undefined) => {
  if (s.accessToken !== previousState?.accessToken) {
    updateAuthAndReconnect(s.accessToken)
  }
})

export function getSocket() {
  return socket
}
