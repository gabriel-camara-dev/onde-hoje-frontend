export type UserRole = 'DEFAULT' | 'ADMIN'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string | null
  createdAt: string
  updatedAt: string
}
