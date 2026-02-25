import axiosInstance from './axios'
import type { LoginPayload, RegisterPayload, User } from '@/types'

export interface AuthResponse {
  token: string
  user: User
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await axiosInstance.post<{ data: AuthResponse }>('/auth/login', { email, password })
  return data.data
}

export async function register(username: string, email: string, password: string): Promise<AuthResponse> {
  const { data } = await axiosInstance.post<{ data: AuthResponse }>('/auth/register', { username, email, password } as RegisterPayload)
  return data.data
}

export async function refreshToken(): Promise<{ token: string }> {
  const { data } = await axiosInstance.post<{ data: { token: string } }>('/auth/refresh')
  return data.data
}

export async function logout(): Promise<void> {
  await axiosInstance.post('/auth/logout')
}

export type { LoginPayload, RegisterPayload }
