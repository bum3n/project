import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { useNotificationStore } from '@/store/notificationStore'
import { getSocket } from '@/socket/socket'
import type { Message, Notification, User } from '@/types'

export function useSocket() {
  const { user } = useAuthStore()
  const { addMessage, updateMessage, removeMessage, setTyping, clearTyping, updateUserOnlineStatus, incrementUnread, activeChat } = useChatStore()
  const { addNotification } = useNotificationStore()

  useEffect(() => {
    if (!user) return

    const socket = getSocket()
    if (!socket) return

    const handleNewMessage = (message: Message) => {
      addMessage(message)
      if (activeChat?._id !== message.chatId) {
        incrementUnread(message.chatId)
      }
    }

    const handleMessageEdited = (message: Message) => {
      updateMessage(message)
    }

    const handleMessageDeleted = ({ messageId, chatId }: { messageId: string; chatId: string }) => {
      removeMessage(messageId, chatId)
    }

    const handleTyping = ({ chatId, user: typingUser }: { chatId: string; user: User }) => {
      if (typingUser._id !== user._id) {
        setTyping(chatId, typingUser)
      }
    }

    const handleStopTyping = ({ chatId, userId }: { chatId: string; userId: string }) => {
      clearTyping(chatId, userId)
    }

    const handleUserOnline = ({ userId, lastSeen }: { userId: string; lastSeen?: string }) => {
      updateUserOnlineStatus(userId, true, lastSeen)
    }

    const handleUserOffline = ({ userId, lastSeen }: { userId: string; lastSeen?: string }) => {
      updateUserOnlineStatus(userId, false, lastSeen)
    }

    const handleNotification = (notification: Notification) => {
      addNotification(notification)
    }

    socket.on('new_message', handleNewMessage)
    socket.on('message_edited', handleMessageEdited)
    socket.on('message_deleted', handleMessageDeleted)
    socket.on('typing', handleTyping)
    socket.on('stop_typing', handleStopTyping)
    socket.on('user_online', handleUserOnline)
    socket.on('user_offline', handleUserOffline)
    socket.on('notification', handleNotification)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('message_edited', handleMessageEdited)
      socket.off('message_deleted', handleMessageDeleted)
      socket.off('typing', handleTyping)
      socket.off('stop_typing', handleStopTyping)
      socket.off('user_online', handleUserOnline)
      socket.off('user_offline', handleUserOffline)
      socket.off('notification', handleNotification)
    }
  }, [user, activeChat, addMessage, updateMessage, removeMessage, setTyping, clearTyping, updateUserOnlineStatus, incrementUnread, addNotification])
}
