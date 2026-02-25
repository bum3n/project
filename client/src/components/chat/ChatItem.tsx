import React from 'react'
import type { Chat } from '@/types'
import { useAuthStore } from '@/store/authStore'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { formatChatTime } from '@/utils/format'

interface ChatItemProps {
  chat: Chat
  isActive: boolean
  onClick: () => void
}

const ChatItem: React.FC<ChatItemProps> = ({ chat, isActive, onClick }) => {
  const { user } = useAuthStore()

  const otherMember = chat.type === 'direct'
    ? chat.members.find((m) => m._id !== user?._id)
    : null

  const displayName = chat.type === 'group'
    ? (chat.name || 'Group')
    : (otherMember?.username || 'Unknown')

  const avatar = chat.type === 'group' ? chat.avatar : otherMember?.avatar
  const isOnline = chat.type === 'direct' ? otherMember?.isOnline : undefined

  const lastMsg = chat.lastMessage
  let preview = 'No messages yet'
  if (lastMsg) {
    if (lastMsg.deletedAt) {
      preview = '🚫 Message deleted'
    } else if (lastMsg.attachments?.length > 0) {
      preview = '📎 Attachment'
    } else {
      preview = lastMsg.content
    }
  }

  const isMine = lastMsg?.sender?._id === user?._id

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 w-full text-left transition-colors ${
        isActive
          ? 'bg-sidebar-active'
          : 'hover:bg-sidebar-hover/50'
      }`}
    >
      <Avatar
        src={avatar}
        name={displayName}
        size="md"
        isOnline={isOnline}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-white text-sm truncate">{displayName}</span>
          {lastMsg && (
            <span className="text-xs text-sidebar-text flex-shrink-0">
              {formatChatTime(lastMsg.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-sidebar-text truncate">
            {isMine && <span className="text-accent">You: </span>}
            {preview}
          </p>
          {chat.unreadCount > 0 && (
            <Badge count={chat.unreadCount} />
          )}
        </div>
      </div>
    </button>
  )
}

export default ChatItem
