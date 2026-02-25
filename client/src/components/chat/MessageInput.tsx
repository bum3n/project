import React, { useState, useRef, useEffect } from 'react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { MAX_FILE_SIZE } from '@/utils/constants'
import toast from 'react-hot-toast'

interface MessageInputProps {
  onSend: (content: string, attachments?: File[]) => Promise<void>
  onTyping: () => void
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, onTyping }) => {
  const [text, setText] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [showEmoji, setShowEmoji] = useState(false)
  const [sending, setSending] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleEmojiSelect = (emoji: { native: string }) => {
    setText((prev) => prev + emoji.native)
    inputRef.current?.focus()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    const valid = selected.filter((f) => {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name} exceeds 10MB limit`)
        return false
      }
      return true
    })
    setFiles((prev) => [...prev, ...valid])
    if (fileRef.current) fileRef.current.value = ''
  }

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = async () => {
    if ((!text.trim() && files.length === 0) || sending) return
    setSending(true)
    try {
      await onSend(text.trim(), files.length > 0 ? files : undefined)
      setText('')
      setFiles([])
    } finally {
      setSending(false)
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    onTyping()
    // Auto-resize
    const el = inputRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 150) + 'px'
    }
  }

  return (
    <div className="bg-[#17212b] border-t border-[#2b3a4a] px-4 py-3">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center gap-1 bg-[#182533] rounded-lg px-3 py-1.5 text-xs text-white">
              <span className="truncate max-w-[120px]">{file.name}</span>
              <button
                onClick={() => removeFile(idx)}
                className="text-gray-400 hover:text-red-400 ml-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="relative" ref={emojiRef}>
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
            title="Emoji"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          {showEmoji && (
            <div className="absolute bottom-12 left-0 z-50">
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="dark"
                previewPosition="none"
              />
            </div>
          )}
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
          title="Attach file"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        <textarea
          ref={inputRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Write a message..."
          rows={1}
          className="flex-1 bg-[#182533] border border-[#2b3a4a] rounded-xl text-white placeholder-gray-500 px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-accent transition-colors max-h-36 overflow-y-auto"
        />

        <button
          onClick={handleSend}
          disabled={(!text.trim() && files.length === 0) || sending}
          className="p-2.5 bg-accent hover:bg-accent-hover text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default MessageInput
