import React from 'react'
import { useNotificationStore } from '@/store/notificationStore'
import { useChatStore } from '@/store/chatStore'
import { markAsRead } from '@/api/notification.api'
import { formatDistanceToNow } from 'date-fns'
import type { Notification } from '@/types'

interface NotificationListProps {
  onClose: () => void
}

const NotificationList: React.FC<NotificationListProps> = ({ onClose }) => {
  const { notifications, markRead } = useNotificationStore()
  const { chats, setActiveChat } = useChatStore()

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification._id)
        markRead(notification._id)
      } catch {
        // ignore
      }
    }
    if (notification.chatId) {
      const chat = chats.find((c) => c._id === notification.chatId)
      if (chat) setActiveChat(chat)
    }
    onClose()
  }

  if (notifications.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        No notifications
      </div>
    )
  }

  return (
    <div className="max-h-80 overflow-y-auto">
      {notifications.slice(0, 20).map((n) => (
        <button
          key={n._id}
          onClick={() => handleNotificationClick(n)}
          className={`flex items-start gap-3 w-full px-4 py-3 hover:bg-white/10 text-left transition-colors ${
            !n.isRead ? 'bg-accent/5' : ''
          }`}
        >
          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.isRead ? 'bg-accent' : 'bg-transparent'}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">{n.title}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{n.body}</p>
            <p className="text-xs text-gray-500 mt-1">
              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}

export default NotificationList
