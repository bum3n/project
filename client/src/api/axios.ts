import axios from 'axios'
import { API_URL, TOKEN_KEY } from '@/utils/constants'

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true,
        })
        const newToken: string = data.data?.token || data.token
        if (newToken) {
          localStorage.setItem(TOKEN_KEY, newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return axiosInstance(originalRequest)
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem('iwa_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default axiosInstance
