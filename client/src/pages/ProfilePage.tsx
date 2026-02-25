import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { updateProfile, uploadAvatar } from '@/api/user.api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import toast from 'react-hot-toast'

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [username, setUsername] = useState(user?.username || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateProfile({ username, bio, email })
      updateUser(updated)
      toast.success('Profile updated!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const updated = await uploadAvatar(file)
      updateUser(updated)
      toast.success('Avatar updated!')
    } catch {
      toast.error('Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-chat-bg flex items-start justify-center p-6">
      <div className="w-full max-w-lg">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="bg-[#17212b] rounded-2xl border border-[#2b3a4a] overflow-hidden">
          {/* Cover */}
          <div className="h-24 bg-gradient-to-r from-accent/30 to-accent-hover/20" />

          {/* Avatar */}
          <div className="px-6 pb-6">
            <div className="relative -mt-12 mb-6 w-fit">
              <Avatar src={user.avatar} name={user.username} size="xl" isOnline />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 p-1.5 bg-accent rounded-full text-white hover:bg-accent-hover transition-colors disabled:opacity-50"
                title="Change avatar"
              >
                {uploadingAvatar ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <h2 className="text-xl font-bold text-white mb-1">{user.username}</h2>
            <p className="text-sm text-gray-400 mb-6">{user.email}</p>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <Input
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-300">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell something about yourself..."
                  rows={3}
                  className="bg-[#182533] border border-[#2b3a4a] rounded-lg text-white placeholder-gray-500 px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div className="flex gap-3 mt-2">
                <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" loading={saving} className="flex-1">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
