export type UserRole = 'DEFAULT' | 'ADMIN'

export interface User {
  id: string
  name: string
  username: string
  email: string
  role: UserRole
  avatarUrl?: string | null
  createdAt: string
  updatedAt: string
}
