import axiosInstance from './axios'
import type { User, UpdateProfilePayload } from '@/types'

export async function getMe(): Promise<User> {
  const { data } = await axiosInstance.get<{ data: User }>('/users/me')
  return data.data
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const { data } = await axiosInstance.patch<{ data: User }>('/users/me', payload)
  return data.data
}

export async function uploadAvatar(file: File): Promise<User> {
  const formData = new FormData()
  formData.append('avatar', file)
  const { data } = await axiosInstance.post<{ data: User }>('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function searchUsers(query: string): Promise<User[]> {
  const { data } = await axiosInstance.get<{ data: User[] }>('/users/search', { params: { q: query } })
  return data.data
}

export async function getUserById(id: string): Promise<User> {
  const { data } = await axiosInstance.get<{ data: User }>(`/users/${id}`)
  return data.data
}
