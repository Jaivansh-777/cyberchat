'use client'

import { motion } from 'framer-motion'
import { Loader2, type LucideIcon } from 'lucide-react'

interface ActionButtonProps {
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  icon?: LucideIcon
  label?: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  type?: 'button' | 'submit'
  title?: string
}

const variantStyles = {
  primary: 'bg-[#4f7cff] text-white hover:bg-[#3b5fd9] shadow-sm',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
  ghost: 'bg-transparent text-gray-400 hover:bg-gray-100 hover:text-gray-600',
}

const sizeStyles = {
  sm: 'p-1.5 rounded-lg',
  md: 'p-2.5 rounded-xl',
  lg: 'px-5 py-2.5 rounded-xl text-sm font-medium',
}

export function ActionButton({
  onClick,
  disabled,
  loading,
  icon: Icon,
  label,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  title,
}: ActionButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
      title={title}
      className={`inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {loading ? (
        <Loader2 className={`animate-spin ${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
      ) : Icon ? (
        <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      ) : null}
      {label && <span>{label}</span>}
    </motion.button>
  )
}
