import React, { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import { searchUsers } from '@/api/user.api'
import { createGroupChat } from '@/api/chat.api'
import { useChatStore } from '@/store/chatStore'
import type { User } from '@/types'
import toast from 'react-hot-toast'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const { addOrUpdateChat, setActiveChat } = useChatStore()

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    setLoading(true)
    try {
      const results = await searchUsers(query)
      setSearchResults(results.filter((u) => !selectedUsers.find((s) => s._id === u._id)))
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const toggleUser = (user: User) => {
    const isSelected = selectedUsers.find((u) => u._id === user._id)
    if (isSelected) {
      setSelectedUsers((prev) => prev.filter((u) => u._id !== user._id))
      setSearchResults((prev) => [...prev, user])
    } else {
      setSelectedUsers((prev) => [...prev, user])
      setSearchResults((prev) => prev.filter((u) => u._id !== user._id))
    }
  }

  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name')
      return
    }
    if (selectedUsers.length < 1) {
      toast.error('Please select at least 1 member')
      return
    }
    setCreating(true)
    try {
      const chat = await createGroupChat(groupName.trim(), selectedUsers.map((u) => u._id))
      addOrUpdateChat(chat)
      setActiveChat(chat)
      toast.success('Group created!')
      onClose()
      setGroupName('')
      setSelectedUsers([])
      setSearchQuery('')
      setSearchResults([])
    } catch {
      toast.error('Failed to create group')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Group">
      <div className="flex flex-col gap-4">
        <Input
          label="Group Name"
          placeholder="Enter group name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />

        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((u) => (
              <div key={u._id} className="flex items-center gap-1 bg-accent/20 border border-accent/40 rounded-full pl-1 pr-2 py-1">
                <Avatar src={u.avatar} name={u.username} size="sm" />
                <span className="text-xs text-white">{u.username}</span>
                <button onClick={() => toggleUser(u)} className="text-gray-400 hover:text-red-400 ml-1">×</button>
              </div>
            ))}
          </div>
        )}

        <Input
          label="Add Members"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />

        {loading && <p className="text-sm text-gray-400 text-center">Searching...</p>}

        {searchResults.length > 0 && (
          <div className="max-h-40 overflow-y-auto flex flex-col gap-1 rounded-lg border border-[#2b3a4a]">
            {searchResults.map((u) => (
              <button
                key={u._id}
                onClick={() => toggleUser(u)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 text-left"
              >
                <Avatar src={u.avatar} name={u.username} size="sm" />
                <div>
                  <p className="text-sm text-white">{u.username}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleCreate} loading={creating} className="flex-1">
            Create Group
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default CreateGroupModal
