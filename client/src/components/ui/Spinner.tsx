import React from 'react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-4',
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  return (
    <div
      className={`${sizeClasses[size]} rounded-full border-t-accent border-r-accent/30 border-b-accent/10 border-l-accent/30 animate-spin ${className}`}
    />
  )
}

export default Spinner
