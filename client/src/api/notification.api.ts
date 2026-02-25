import axiosInstance from './axios'
import type { Notification } from '@/types'

export async function getNotifications(): Promise<Notification[]> {
  const { data } = await axiosInstance.get<{ data: Notification[] }>('/notifications')
  return data.data
}

export async function markAsRead(notificationId: string): Promise<void> {
  await axiosInstance.patch(`/notifications/${notificationId}/read`)
}

export async function markAllAsRead(): Promise<void> {
  await axiosInstance.patch('/notifications/read-all')
}
