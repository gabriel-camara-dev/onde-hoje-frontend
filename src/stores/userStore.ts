import { create } from 'zustand'
import type { User } from '../@types/User'
import { persist } from 'zustand/middleware'
import { queryClient } from '../lib/queryClient'

interface UserStore {
  accessToken: string | null
  user: User | null
  setUser: (data: Partial<UserStore>) => void
  updateUser: (partialUser: Partial<User>) => void
  logout: () => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      setUser: (data: Partial<UserStore>) => {
        const previousUserId = get().user?.id
        const nextUserId = data.user?.id

        if (previousUserId && nextUserId && previousUserId !== nextUserId) {
          queryClient.clear()
        }

        set((state) => ({
          ...state,
          ...data,
        }))
      },
      updateUser: (partialUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partialUser } : null,
        })),
      logout: () => {
        queryClient.clear()
        set({ accessToken: null, user: null })
      },
    }),
    {
      name: 'user',
    }
  )
)
