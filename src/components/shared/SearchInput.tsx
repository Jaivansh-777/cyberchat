'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onSearch: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
  autoFocus?: boolean
  uppercase?: boolean
}

export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  debounceMs = 400,
  className = '',
  autoFocus = false,
  uppercase = false,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value
      const transformed = uppercase ? next.toUpperCase() : next
      setLocalValue(transformed)
      onChange(transformed)

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        if (transformed.trim()) onSearch(transformed.trim())
      }, debounceMs)
    },
    [onChange, onSearch, debounceMs, uppercase],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && localValue.trim()) {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        onSearch(localValue.trim())
      }
    },
    [onSearch, localValue],
  )

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus()
  }, [autoFocus])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      <input
        ref={inputRef}
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full bg-gray-100 border-none rounded-lg py-2 pl-9 pr-8 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4f7cff]/30 focus:bg-white transition-all ${uppercase ? 'uppercase' : ''} ${className}`}
      />
      {localValue && (
        <button
          onClick={() => {
            setLocalValue('')
            onChange('')
            if (debounceRef.current) clearTimeout(debounceRef.current)
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-200 text-gray-400"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
