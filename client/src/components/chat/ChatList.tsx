import React from 'react'
import { useChatStore } from '@/store/chatStore'
import ChatItem from './ChatItem'
import type { Chat } from '@/types'

interface ChatListProps {
  searchQuery: string
}

const ChatList: React.FC<ChatListProps> = ({ searchQuery }) => {
  const { chats, activeChat, setActiveChat } = useChatStore()

  const filtered = chats.filter((chat) => {
    if (!searchQuery) return true
    const name = getChatDisplayName(chat)
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  function getChatDisplayName(chat: Chat): string {
    if (chat.type === 'group') return chat.name || 'Group'
    return chat.members.find((m) => m._id !== activeChat?._id)?.username || 'Unknown'
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-sidebar-text text-sm">
        <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p>{searchQuery ? 'No chats found' : 'No conversations yet'}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      {filtered.map((chat) => (
        <ChatItem
          key={chat._id}
          chat={chat}
          isActive={activeChat?._id === chat._id}
          onClick={() => setActiveChat(chat)}
        />
      ))}
    </div>
  )
}

export default ChatList
