'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export function useIncomingRequestCount() {
  const { user } = useUser()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!user?.id) return

    const fetchCount = async () => {
      try {
        const res = await fetch('/api/friends/incoming')
        if (res.ok) {
          const data = await res.json()
          setCount(data.requests?.length || 0)
        }
      } catch {}
    }

    fetchCount()
    const interval = setInterval(fetchCount, 10000)
    return () => clearInterval(interval)
  }, [user?.id])

  return count
}
