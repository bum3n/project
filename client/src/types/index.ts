export interface User {
  _id: string
  username: string
  email: string
  avatar?: string
  bio?: string
  isOnline: boolean
  lastSeen?: string
  createdAt: string
  updatedAt: string
}

export interface Attachment {
  _id: string
  url: string
  filename: string
  mimetype: string
  size: number
}

export interface Message {
  _id: string
  chatId: string
  sender: User
  content: string
  attachments: Attachment[]
  isEdited: boolean
  deletedAt?: string
  readBy: string[]
  createdAt: string
  updatedAt: string
}

export type ChatType = 'direct' | 'group'

export interface Chat {
  _id: string
  type: ChatType
  name?: string
  avatar?: string
  members: User[]
  admins?: string[]
  lastMessage?: Message
  unreadCount: number
  createdAt: string
  updatedAt: string
}

export interface Notification {
  _id: string
  type: 'message' | 'group_invite' | 'mention'
  title: string
  body: string
  isRead: boolean
  chatId?: string
  senderId?: string
  createdAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
}

export interface UpdateProfilePayload {
  username?: string
  bio?: string
  email?: string
}

export interface PaginatedMessages {
  messages: Message[]
  totalPages: number
  currentPage: number
  hasMore: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}
