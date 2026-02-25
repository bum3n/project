import axiosInstance from './axios'
import type { Message, PaginatedMessages } from '@/types'

export async function getMessages(chatId: string, page = 1): Promise<PaginatedMessages> {
  const { data } = await axiosInstance.get<{ data: PaginatedMessages }>(`/chats/${chatId}/messages`, {
    params: { page, limit: 30 },
  })
  return data.data
}

export async function sendMessage(
  chatId: string,
  content: string,
  attachments?: File[],
): Promise<Message> {
  const formData = new FormData()
  formData.append('content', content)
  if (attachments) {
    attachments.forEach((file) => formData.append('attachments', file))
  }
  const { data } = await axiosInstance.post<{ data: Message }>(`/chats/${chatId}/messages`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function deleteMessage(messageId: string): Promise<void> {
  await axiosInstance.delete(`/messages/${messageId}`)
}

export async function editMessage(messageId: string, content: string): Promise<Message> {
  const { data } = await axiosInstance.patch<{ data: Message }>(`/messages/${messageId}`, { content })
  return data.data
}
