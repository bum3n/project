import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import Avatar from '@/components/ui/Avatar'

const Header: React.FC = () => {
  const { activeChat } = useChatStore()
  const { user } = useAuthStore()
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#17212b] border-b border-[#2b3a4a]">
      <div className="flex items-center gap-3">
        {activeChat && (
          <h2 className="font-semibold text-white">
            {activeChat.name || activeChat.members.find((m) => m._id !== user?._id)?.username || 'Chat'}
          </h2>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 hover:bg-white/10 rounded-lg px-3 py-1.5 transition-colors"
        >
          <Avatar src={user?.avatar} name={user?.username || 'U'} size="sm" isOnline />
          <span className="text-sm text-white hidden md:block">{user?.username}</span>
        </button>
        <button
          onClick={logout}
          className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-white/10"
          title="Logout"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Header
