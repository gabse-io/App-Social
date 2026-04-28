import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full input-group">
      {label && (
        <label className="block text-xs font-semibold uppercase text-[#4a7c9c] mb-1">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 rounded-20 border-2 border-[#e0edf9] bg-white text-sm focus:outline-none focus:border-[#1a73e8] disabled:bg-gray-100 disabled:cursor-not-allowed ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
