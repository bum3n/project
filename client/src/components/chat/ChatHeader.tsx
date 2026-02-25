import React from 'react'
import type { Chat } from '@/types'
import { useAuthStore } from '@/store/authStore'
import Avatar from '@/components/ui/Avatar'
import { formatLastSeen } from '@/utils/format'

interface ChatHeaderProps {
  chat: Chat
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ chat }) => {
  const { user } = useAuthStore()

  const otherMember = chat.type === 'direct'
    ? chat.members.find((m) => m._id !== user?._id)
    : null

  const displayName = chat.type === 'group'
    ? (chat.name || 'Group')
    : (otherMember?.username || 'Unknown')

  const avatar = chat.type === 'group' ? chat.avatar : otherMember?.avatar

  let statusText: string
  if (chat.type === 'group') {
    statusText = `${chat.members.length} members`
  } else if (otherMember?.isOnline) {
    statusText = 'online'
  } else if (otherMember?.lastSeen) {
    statusText = formatLastSeen(otherMember.lastSeen)
  } else {
    statusText = 'offline'
  }

  const isOnline = chat.type === 'direct' ? otherMember?.isOnline : undefined

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#17212b] border-b border-[#2b3a4a] flex-shrink-0">
      <Avatar src={avatar} name={displayName} size="md" isOnline={isOnline} />
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-white truncate">{displayName}</h2>
        <p className={`text-xs ${isOnline ? 'text-green-400' : 'text-gray-400'}`}>
          {statusText}
        </p>
      </div>
    </div>
  )
}

export default ChatHeader
