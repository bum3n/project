import React, { useEffect, useRef, useState } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { useChat } from '@/hooks/useChat'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import ChatHeader from './ChatHeader'
import Spinner from '@/components/ui/Spinner'

const ChatView: React.FC = () => {
  const { activeChat, typingUsers } = useChatStore()
  const { user } = useAuthStore()
  const { chatMessages, chatHasMore, loadingMessages, loadMessages, sendMessage, emitTyping, joinChat, leaveChat } = useChat(activeChat?._id)
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(1)
  const [initialLoad, setInitialLoad] = useState(false)

  useEffect(() => {
    if (!activeChat) return
    setPage(1)
    setInitialLoad(false)
    loadMessages(1).then(() => setInitialLoad(true))
    joinChat()
    return () => leaveChat()
  }, [activeChat?._id])

  useEffect(() => {
    if (initialLoad) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
    }
  }, [initialLoad])

  useEffect(() => {
    if (chatMessages.length > 0) {
      const container = containerRef.current
      if (!container) return
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
      if (isAtBottom) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [chatMessages.length])

  const handleLoadMore = async () => {
    if (!chatHasMore || loadingMessages) return
    const nextPage = page + 1
    setPage(nextPage)
    await loadMessages(nextPage)
  }

  const chatTypingUsers = activeChat
    ? typingUsers.filter((t) => t.chatId === activeChat._id && t.user._id !== user?._id)
    : []

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-chat-bg">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-lg font-medium">Select a chat to start messaging</p>
          <p className="text-sm mt-1 opacity-60">Choose from your conversations or start a new one</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-chat-bg overflow-hidden">
      <ChatHeader chat={activeChat} />

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1"
      >
        {chatHasMore && (
          <div className="flex justify-center pb-4">
            <button
              onClick={handleLoadMore}
              disabled={loadingMessages}
              className="text-accent text-sm hover:underline disabled:opacity-50"
            >
              {loadingMessages ? <Spinner size="sm" /> : 'Load older messages'}
            </button>
          </div>
        )}

        {loadingMessages && chatMessages.length === 0 && (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        )}

        {chatMessages.map((msg, idx) => {
          const prevMsg = idx > 0 ? chatMessages[idx - 1] : null
          return (
            <MessageBubble
              key={msg._id}
              message={msg}
              isMine={msg.sender._id === user?._id}
              showSenderName={activeChat.type === 'group' && msg.sender._id !== user?._id && (!prevMsg || prevMsg.sender._id !== msg.sender._id)}
            />
          )
        })}

        {chatTypingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-xs text-gray-400">
              {chatTypingUsers.map((t) => t.user.username).join(', ')}{' '}
              {chatTypingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <MessageInput onSend={sendMessage} onTyping={emitTyping} />
    </div>
  )
}

export default ChatView
