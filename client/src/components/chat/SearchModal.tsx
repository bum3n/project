import React, { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import Spinner from '@/components/ui/Spinner'
import { searchUsers } from '@/api/user.api'
import { getChats, createDirectChat } from '@/api/chat.api'
import { useChatStore } from '@/store/chatStore'
import type { User, Chat } from '@/types'
import toast from 'react-hot-toast'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [chatResults, setChatResults] = useState<Chat[]>([])
  const [loading, setLoading] = useState(false)
  const { chats, addOrUpdateChat, setActiveChat } = useChatStore()

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setUsers([])
      setChatResults([])
    }
  }, [isOpen])

  useEffect(() => {
    if (!query.trim()) {
      setUsers([])
      setChatResults([])
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const [userResults] = await Promise.all([searchUsers(query)])
        setUsers(userResults)
        const matchingChats = chats.filter((c) => {
          const name = c.type === 'group' ? (c.name || '') : (c.members.find((m) => m._id !== 'me')?.username || '')
          return name.toLowerCase().includes(query.toLowerCase())
        })
        setChatResults(matchingChats)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, chats])

  const handleUserClick = async (user: User) => {
    const existing = chats.find(
      (c) => c.type === 'direct' && c.members.find((m) => m._id === user._id),
    )
    if (existing) {
      setActiveChat(existing)
      onClose()
      return
    }
    try {
      const chat = await createDirectChat(user._id)
      addOrUpdateChat(chat)
      setActiveChat(chat)
      onClose()
    } catch {
      toast.error('Failed to open chat')
    }
  }

  const handleChatClick = (chat: Chat) => {
    setActiveChat(chat)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search">
      <div className="flex flex-col gap-4">
        <Input
          placeholder="Search users or chats..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />

        {loading && <div className="flex justify-center"><Spinner size="sm" /></div>}

        {!loading && query && users.length === 0 && chatResults.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No results found</p>
        )}

        {users.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Users</p>
            <div className="flex flex-col gap-1">
              {users.map((u) => (
                <button
                  key={u._id}
                  onClick={() => handleUserClick(u)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-left"
                >
                  <Avatar src={u.avatar} name={u.username} size="sm" isOnline={u.isOnline} />
                  <div>
                    <p className="text-sm text-white">{u.username}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {chatResults.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Chats</p>
            <div className="flex flex-col gap-1">
              {chatResults.map((c) => (
                <button
                  key={c._id}
                  onClick={() => handleChatClick(c)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-left"
                >
                  <Avatar src={c.avatar} name={c.name || 'Chat'} size="sm" />
                  <p className="text-sm text-white">{c.name || 'Direct Chat'}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default SearchModal
