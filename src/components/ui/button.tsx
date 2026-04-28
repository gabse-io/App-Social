import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline' | 'success' | 'warning' | 'danger'
  size?: 'default' | 'sm'
  icon?: string
  children: React.ReactNode
}

export function Button({ 
  variant = 'default', 
  size = 'default', 
  icon, 
  className = '', 
  children, 
  ...props 
}: ButtonProps) {
  const baseStyles = 'font-medium transition-all cursor-pointer inline-flex items-center gap-2'
  
  const variants: Record<string, string> = {
    default: 'bg-[#1a73e8] text-white hover:bg-[#0e5fc9] hover:-translate-y-px',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
    outline: 'bg-transparent border-2 border-[#c2dcf5] text-[#1a73e8] hover:border-[#1a73e8]',
    success: 'bg-[#2e7d32] text-white hover:bg-[#1b5e20]',
    warning: 'bg-[#ed6c02] text-white hover:bg-[#e65100]',
    danger: 'bg-[#d46b5e] text-white hover:bg-[#c62828]',
  }
  
  const sizes: Record<string, string> = {
    default: 'px-5 py-2.5 rounded-32 text-sm',
    sm: 'px-4 py-2 rounded-32 text-xs',
  }
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && <i className={`fas ${icon}`}></i>}
      {children}
    </button>
  )
}
