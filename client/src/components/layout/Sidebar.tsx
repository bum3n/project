import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatStore } from '@/store/chatStore'
import { getChats } from '@/api/chat.api'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import ChatList from '@/components/chat/ChatList'
import CreateGroupModal from '@/components/chat/CreateGroupModal'
import SearchModal from '@/components/chat/SearchModal'
import NotificationBell from '@/components/notifications/NotificationBell'
import Avatar from '@/components/ui/Avatar'
import toast from 'react-hot-toast'

const Sidebar: React.FC = () => {
  const { user } = useAuthStore()
  const { logout } = useAuth()
  const { setChats } = useChatStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    getChats()
      .then(setChats)
      .catch(() => toast.error('Failed to load chats'))
  }, [setChats])

  return (
    <div className="w-80 flex-shrink-0 flex flex-col bg-sidebar-bg border-r border-[#2b3a4a] h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2b3a4a]">
        <h1 className="text-xl font-bold text-white">iWa</h1>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button
            onClick={() => setShowSearchModal(true)}
            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            title="Search"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button
            onClick={() => setShowGroupModal(true)}
            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            title="New Group"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 py-3">
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0e1621] border-none rounded-full text-white placeholder-gray-500 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* Chat list */}
      <ChatList searchQuery={searchQuery} />

      {/* Bottom user info */}
      <div className="relative border-t border-[#2b3a4a] px-4 py-3">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-3 w-full hover:bg-white/5 rounded-lg p-1 -m-1 transition-colors"
        >
          <Avatar
            src={user?.avatar}
            name={user?.username || 'User'}
            size="sm"
            isOnline={true}
          />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-white truncate">{user?.username}</p>
            <p className="text-xs text-green-400">online</p>
          </div>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {showUserMenu && (
          <div className="absolute bottom-16 left-4 right-4 bg-[#1e2c3a] rounded-xl shadow-2xl border border-[#2b3a4a] py-2 z-30">
            <button
              onClick={() => { navigate('/profile'); setShowUserMenu(false) }}
              className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-white/10 text-sm text-white"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Profile
            </button>
            <button
              onClick={() => { logout(); setShowUserMenu(false) }}
              className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-white/10 text-sm text-red-400"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        )}
      </div>

      <CreateGroupModal isOpen={showGroupModal} onClose={() => setShowGroupModal(false)} />
      <SearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
    </div>
  )
}

export default Sidebar
