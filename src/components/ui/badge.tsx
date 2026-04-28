import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'paid' | 'unpaid' | 'delivered' | 'pending'
  className?: string
}

export function Badge({ children, variant = 'pending', className = '' }: BadgeProps) {
  const variants: Record<string, string> = {
    paid: 'status-paid',
    unpaid: 'status-unpaid',
    delivered: 'status-delivered',
    pending: 'status-pending',
  }

  return (
    <span className={`status-badge ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
