import React, { useState, useRef } from 'react'
import type { Message } from '@/types'
import { formatMessageTime, formatFileSize } from '@/utils/format'
import { ALLOWED_IMAGE_TYPES } from '@/utils/constants'
import { deleteMessage, editMessage } from '@/api/message.api'
import { useChatStore } from '@/store/chatStore'
import toast from 'react-hot-toast'

interface MessageBubbleProps {
  message: Message
  isMine: boolean
  showSenderName: boolean
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMine, showSenderName }) => {
  const { updateMessage, removeMessage } = useChatStore()
  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const editRef = useRef<HTMLInputElement>(null)

  if (message.deletedAt) {
    return (
      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-2`}>
        <span className="text-xs text-gray-500 italic">Message deleted</span>
      </div>
    )
  }

  const handleDelete = async () => {
    setShowMenu(false)
    try {
      await deleteMessage(message._id)
      removeMessage(message._id, message.chatId)
    } catch {
      toast.error('Failed to delete message')
    }
  }

  const handleEditSubmit = async () => {
    if (!editContent.trim()) return
    try {
      const updated = await editMessage(message._id, editContent)
      updateMessage(updated)
      setEditing(false)
    } catch {
      toast.error('Failed to edit message')
    }
  }

  return (
    <div
      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} px-2 my-0.5`}
      onMouseLeave={() => setShowMenu(false)}
    >
      {showSenderName && (
        <span className="text-xs text-accent ml-12 mb-0.5">{message.sender.username}</span>
      )}

      <div className={`relative group flex items-end gap-1 max-w-[70%]`}>
        <div
          className={`px-3 py-2 rounded-2xl text-sm text-white ${
            isMine
              ? 'bg-chat-message-out rounded-br-sm'
              : 'bg-chat-message-in rounded-bl-sm'
          }`}
          onContextMenu={(e) => {
            if (!isMine) return
            e.preventDefault()
            setShowMenu(true)
          }}
        >
          {message.attachments?.length > 0 && (
            <div className="flex flex-col gap-2 mb-1">
              {message.attachments.map((att) =>
                ALLOWED_IMAGE_TYPES.includes(att.mimetype) ? (
                  <img
                    key={att._id}
                    src={att.url}
                    alt={att.filename}
                    className="max-w-xs rounded-lg object-cover cursor-pointer"
                    onClick={() => window.open(att.url, '_blank')}
                  />
                ) : (
                  <a
                    key={att._id}
                    href={att.url}
                    download={att.filename}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2 hover:bg-black/30 transition-colors"
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium truncate">{att.filename}</span>
                      <span className="text-xs text-gray-400">{formatFileSize(att.size)}</span>
                    </div>
                  </a>
                ),
              )}
            </div>
          )}

          {editing ? (
            <div className="flex items-center gap-2">
              <input
                ref={editRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditSubmit()
                  if (e.key === 'Escape') setEditing(false)
                }}
                className="bg-transparent border-b border-accent outline-none text-white text-sm min-w-[100px]"
                autoFocus
              />
              <button onClick={handleEditSubmit} className="text-accent hover:text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          ) : (
            <span className="whitespace-pre-wrap break-words">{message.content}</span>
          )}

          <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[10px] text-white/50">{formatMessageTime(message.createdAt)}</span>
            {message.isEdited && <span className="text-[10px] text-white/40">edited</span>}
            {isMine && (
              <svg className="w-3 h-3 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            )}
          </div>
        </div>

        {isMine && (
          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute bottom-8 right-0 bg-[#1e2c3a] rounded-lg shadow-xl border border-[#2b3a4a] py-1 z-20 min-w-[120px]">
                <button
                  onClick={() => { setEditing(true); setShowMenu(false) }}
                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageBubble
