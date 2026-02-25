import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { login as loginApi, register as registerApi, logout as logoutApi } from '@/api/auth.api'
import { connect, disconnect } from '@/socket/socket'
import toast from 'react-hot-toast'

export function useAuth() {
  const { user, token, isAuthenticated, login: storeLogin, logout: storeLogout } = useAuthStore()
  const navigate = useNavigate()

  const login = useCallback(
    async (email: string, password: string) => {
      const { user, token } = await loginApi(email, password)
      storeLogin(user, token)
      connect(token)
      navigate('/')
    },
    [storeLogin, navigate],
  )

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const { user, token } = await registerApi(username, email, password)
      storeLogin(user, token)
      connect(token)
      navigate('/')
    },
    [storeLogin, navigate],
  )

  const logout = useCallback(async () => {
    try {
      await logoutApi()
    } catch {
      // ignore server errors on logout
    }
    disconnect()
    storeLogout()
    toast.success('Logged out')
    navigate('/login')
  }, [storeLogout, navigate])

  return { user, token, isAuthenticated, login, register, logout }
}
