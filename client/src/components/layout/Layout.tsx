import React from 'react'
import Sidebar from './Sidebar'
import { useSocket } from '@/hooks/useSocket'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  useSocket()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-chat-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}

export default Layout
