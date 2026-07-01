export type UserRole = 'NORMAL_USER' | 'ADMIN'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
}
