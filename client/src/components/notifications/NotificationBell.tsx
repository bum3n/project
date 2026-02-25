import React, { useState, useRef, useEffect } from 'react'
import { useNotificationStore } from '@/store/notificationStore'
import { getNotifications, markAllAsRead } from '@/api/notification.api'
import NotificationList from './NotificationList'
import Badge from '@/components/ui/Badge'

const NotificationBell: React.FC = () => {
  const { unreadCount, setNotifications, markAllRead } = useNotificationStore()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .catch(() => {})
  }, [setNotifications])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead()
      markAllRead()
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-[#1e2c3a] rounded-xl shadow-2xl border border-[#2b3a4a] z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2b3a4a]">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-accent hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <NotificationList onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}

export default NotificationBell
