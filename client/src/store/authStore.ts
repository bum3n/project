import { create } from 'zustand'
import type { User } from '@/types'
import { TOKEN_KEY, USER_KEY } from '@/utils/constants'

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

const storedToken = localStorage.getItem(TOKEN_KEY)
const storedUser = localStorage.getItem(USER_KEY)

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken,
  isAuthenticated: !!storedToken,

  login: (user, token) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    set({ user: null, token: null, isAuthenticated: false })
  },

  updateUser: (partial) => {
    const current = get().user
    if (!current) return
    const updated = { ...current, ...partial }
    localStorage.setItem(USER_KEY, JSON.stringify(updated))
    set({ user: updated })
  },
}))
