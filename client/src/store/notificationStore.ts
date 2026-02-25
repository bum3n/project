import { create } from 'zustand'
import type { Notification } from '@/types'

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markRead: (id: string) => void
  markAllRead: () => void
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.isRead).length
    set({ notifications, unreadCount })
  },

  addNotification: (notification) => {
    const notifications = [notification, ...get().notifications]
    const unreadCount = notifications.filter((n) => !n.isRead).length
    set({ notifications, unreadCount })
  },

  markRead: (id) => {
    const notifications = get().notifications.map((n) =>
      n._id === id ? { ...n, isRead: true } : n,
    )
    const unreadCount = notifications.filter((n) => !n.isRead).length
    set({ notifications, unreadCount })
  },

  markAllRead: () => {
    const notifications = get().notifications.map((n) => ({ ...n, isRead: true }))
    set({ notifications, unreadCount: 0 })
  },
}))
