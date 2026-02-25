import { useCallback, useRef } from 'react'
import { useChatStore } from '@/store/chatStore'
import { getMessages, sendMessage as sendMessageApi } from '@/api/message.api'
import { getSocket } from '@/socket/socket'
import { TYPING_DEBOUNCE_MS } from '@/utils/constants'
import toast from 'react-hot-toast'

export function useChat(chatId: string | undefined) {
  const {
    messages,
    hasMore,
    loadingMessages,
    setMessages,
    prependMessages,
    setLoadingMessages,
    resetUnread,
  } = useChatStore()

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)

  const chatMessages = chatId ? (messages[chatId] || []) : []
  const chatHasMore = chatId ? (hasMore[chatId] ?? true) : false

  const loadMessages = useCallback(
    async (page = 1) => {
      if (!chatId) return
      setLoadingMessages(true)
      try {
        const result = await getMessages(chatId, page)
        if (page === 1) {
          setMessages(chatId, result.messages, result.hasMore)
        } else {
          prependMessages(chatId, result.messages, result.hasMore)
        }
        resetUnread(chatId)
      } catch (err) {
        toast.error('Failed to load messages')
      } finally {
        setLoadingMessages(false)
      }
    },
    [chatId, setLoadingMessages, setMessages, prependMessages, resetUnread],
  )

  const sendMessage = useCallback(
    async (content: string, attachments?: File[]) => {
      if (!chatId) return
      if (!content.trim() && (!attachments || attachments.length === 0)) return
      try {
        await sendMessageApi(chatId, content, attachments)
      } catch {
        toast.error('Failed to send message')
      }
    },
    [chatId],
  )

  const emitTyping = useCallback(() => {
    if (!chatId) return
    const socket = getSocket()
    if (!socket) return

    if (!isTypingRef.current) {
      isTypingRef.current = true
      socket.emit('typing', { chatId })
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
      socket.emit('stop_typing', { chatId })
    }, TYPING_DEBOUNCE_MS)
  }, [chatId])

  const joinChat = useCallback(() => {
    if (!chatId) return
    const socket = getSocket()
    socket?.emit('join_chat', { chatId })
  }, [chatId])

  const leaveChat = useCallback(() => {
    if (!chatId) return
    const socket = getSocket()
    socket?.emit('leave_chat', { chatId })
  }, [chatId])

  return {
    chatMessages,
    chatHasMore,
    loadingMessages,
    loadMessages,
    sendMessage,
    emitTyping,
    joinChat,
    leaveChat,
  }
}
