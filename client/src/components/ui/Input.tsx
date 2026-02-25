import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-gray-300">{label}</label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            {...props}
            className={`w-full bg-[#182533] border ${
              error ? 'border-red-500' : 'border-[#2b3a4a]'
            } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors ${
              leftIcon ? 'pl-10' : 'pl-4'
            } ${rightIcon ? 'pr-10' : 'pr-4'} py-2.5 text-sm ${className}`}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'

export default Input
