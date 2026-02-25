import axiosInstance from './axios'
import type { Chat } from '@/types'

export async function getChats(): Promise<Chat[]> {
  const { data } = await axiosInstance.get<{ data: Chat[] }>('/chats')
  return data.data
}

export async function getChatById(id: string): Promise<Chat> {
  const { data } = await axiosInstance.get<{ data: Chat }>(`/chats/${id}`)
  return data.data
}

export async function createDirectChat(userId: string): Promise<Chat> {
  const { data } = await axiosInstance.post<{ data: Chat }>('/chats/direct', { userId })
  return data.data
}

export async function createGroupChat(name: string, memberIds: string[]): Promise<Chat> {
  const { data } = await axiosInstance.post<{ data: Chat }>('/chats/group', { name, memberIds })
  return data.data
}

export async function updateGroup(chatId: string, payload: { name?: string; avatar?: File }): Promise<Chat> {
  const formData = new FormData()
  if (payload.name) formData.append('name', payload.name)
  if (payload.avatar) formData.append('avatar', payload.avatar)
  const { data } = await axiosInstance.patch<{ data: Chat }>(`/chats/${chatId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function addMembers(chatId: string, memberIds: string[]): Promise<Chat> {
  const { data } = await axiosInstance.post<{ data: Chat }>(`/chats/${chatId}/members`, { memberIds })
  return data.data
}

export async function leaveChat(chatId: string): Promise<void> {
  await axiosInstance.delete(`/chats/${chatId}/members/me`)
}
