import React from 'react'

interface BadgeProps {
  count: number
  max?: number
  className?: string
}

const Badge: React.FC<BadgeProps> = ({ count, max = 99, className = '' }) => {
  if (count === 0) return null
  const display = count > max ? `${max}+` : count
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-bold rounded-full bg-accent text-white ${className}`}
    >
      {display}
    </span>
  )
}

export default Badge
