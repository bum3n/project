import React from 'react'

interface AvatarProps {
  src?: string
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isOnline?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
}

const dotSizeClasses = {
  sm: 'w-2 h-2 bottom-0 right-0',
  md: 'w-2.5 h-2.5 bottom-0 right-0',
  lg: 'w-3 h-3 bottom-0.5 right-0.5',
  xl: 'w-3.5 h-3.5 bottom-1 right-1',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i)
  return colors[hash % colors.length]
}

const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', isOnline, className = '' }) => {
  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} ${getColorFromName(name)} rounded-full flex items-center justify-center font-semibold text-white`}
        >
          {getInitials(name)}
        </div>
      )}
      {isOnline !== undefined && (
        <span
          className={`absolute ${dotSizeClasses[size]} rounded-full border-2 border-sidebar-bg ${
            isOnline ? 'bg-green-400' : 'bg-gray-500'
          }`}
        />
      )}
    </div>
  )
}

export default Avatar
