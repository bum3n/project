import { create } from 'zustand'
import type { Chat, Message, User } from '@/types'

interface TypingUser {
  chatId: string
  user: User
}

interface ChatStore {
  chats: Chat[]
  activeChat: Chat | null
  messages: Record<string, Message[]>
  typingUsers: TypingUser[]
  hasMore: Record<string, boolean>
  loadingMessages: boolean

  setChats: (chats: Chat[]) => void
  setActiveChat: (chat: Chat | null) => void
  addOrUpdateChat: (chat: Chat) => void
  removeChat: (chatId: string) => void

  setMessages: (chatId: string, messages: Message[], hasMore?: boolean) => void
  prependMessages: (chatId: string, messages: Message[], hasMore: boolean) => void
  addMessage: (message: Message) => void
  updateMessage: (message: Message) => void
  removeMessage: (messageId: string, chatId: string) => void

  updateUnreadCount: (chatId: string, count: number) => void
  incrementUnread: (chatId: string) => void
  resetUnread: (chatId: string) => void

  setTyping: (chatId: string, user: User) => void
  clearTyping: (chatId: string, userId: string) => void

  setLoadingMessages: (loading: boolean) => void

  updateUserOnlineStatus: (userId: string, isOnline: boolean, lastSeen?: string) => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  activeChat: null,
  messages: {},
  typingUsers: [],
  hasMore: {},
  loadingMessages: false,

  setChats: (chats) => set({ chats }),

  setActiveChat: (chat) => set({ activeChat: chat }),

  addOrUpdateChat: (chat) => {
    const chats = get().chats
    const idx = chats.findIndex((c) => c._id === chat._id)
    if (idx === -1) {
      set({ chats: [chat, ...chats] })
    } else {
      const updated = [...chats]
      updated[idx] = { ...updated[idx], ...chat }
      // Re-sort by last message time
      updated.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt || a.createdAt
        const bTime = b.lastMessage?.createdAt || b.createdAt
        return new Date(bTime).getTime() - new Date(aTime).getTime()
      })
      set({ chats: updated })
    }
  },

  removeChat: (chatId) => {
    set({ chats: get().chats.filter((c) => c._id !== chatId) })
  },

  setMessages: (chatId, messages, hasMore = false) => {
    set({
      messages: { ...get().messages, [chatId]: messages },
      hasMore: { ...get().hasMore, [chatId]: hasMore },
    })
  },

  prependMessages: (chatId, messages, hasMore) => {
    const existing = get().messages[chatId] || []
    set({
      messages: { ...get().messages, [chatId]: [...messages, ...existing] },
      hasMore: { ...get().hasMore, [chatId]: hasMore },
    })
  },

  addMessage: (message) => {
    const chatId = message.chatId
    const existing = get().messages[chatId] || []
    // Avoid duplicates
    if (existing.find((m) => m._id === message._id)) return
    set({ messages: { ...get().messages, [chatId]: [...existing, message] } })

    // Update last message in chat list
    const chats = get().chats
    const chatIdx = chats.findIndex((c) => c._id === chatId)
    if (chatIdx !== -1) {
      const updated = [...chats]
      updated[chatIdx] = { ...updated[chatIdx], lastMessage: message }
      updated.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt || a.createdAt
        const bTime = b.lastMessage?.createdAt || b.createdAt
        return new Date(bTime).getTime() - new Date(aTime).getTime()
      })
      set({ chats: updated })
    }
  },

  updateMessage: (message) => {
    const chatId = message.chatId
    const existing = get().messages[chatId] || []
    set({
      messages: {
        ...get().messages,
        [chatId]: existing.map((m) => (m._id === message._id ? message : m)),
      },
    })
  },

  removeMessage: (messageId, chatId) => {
    const existing = get().messages[chatId] || []
    set({
      messages: {
        ...get().messages,
        [chatId]: existing.filter((m) => m._id !== messageId),
      },
    })
  },

  updateUnreadCount: (chatId, count) => {
    const chats = get().chats.map((c) =>
      c._id === chatId ? { ...c, unreadCount: count } : c,
    )
    set({ chats })
  },

  incrementUnread: (chatId) => {
    const chats = get().chats.map((c) =>
      c._id === chatId ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } : c,
    )
    set({ chats })
  },

  resetUnread: (chatId) => {
    const chats = get().chats.map((c) =>
      c._id === chatId ? { ...c, unreadCount: 0 } : c,
    )
    set({ chats })
    // Update activeChat too
    const activeChat = get().activeChat
    if (activeChat?._id === chatId) {
      set({ activeChat: { ...activeChat, unreadCount: 0 } })
    }
  },

  setTyping: (chatId, user) => {
    const existing = get().typingUsers
    if (existing.find((t) => t.chatId === chatId && t.user._id === user._id)) return
    set({ typingUsers: [...existing, { chatId, user }] })
  },

  clearTyping: (chatId, userId) => {
    set({
      typingUsers: get().typingUsers.filter(
        (t) => !(t.chatId === chatId && t.user._id === userId),
      ),
    })
  },

  setLoadingMessages: (loading) => set({ loadingMessages: loading }),

  updateUserOnlineStatus: (userId, isOnline, lastSeen) => {
    const updateMembers = (members: Chat['members']) =>
      members.map((m) =>
        m._id === userId ? { ...m, isOnline, lastSeen: lastSeen || m.lastSeen } : m,
      )

    const chats = get().chats.map((c) => ({
      ...c,
      members: updateMembers(c.members),
    }))
    set({ chats })

    const activeChat = get().activeChat
    if (activeChat) {
      set({
        activeChat: { ...activeChat, members: updateMembers(activeChat.members) },
      })
    }
  },
}))
