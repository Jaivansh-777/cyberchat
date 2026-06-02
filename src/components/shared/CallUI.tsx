'use client'

import { useVoiceCall } from './VoiceCallProvider'
import { useEffect, useRef } from 'react'

export function CallUI({
  channelId,
  otherUserId,
  otherUserName,
  currentUserId,
  callTrigger,
  onCallTriggered,
}: {
  channelId: string
  otherUserId: string
  otherUserName?: string
  currentUserId: string
  callTrigger?: 'voice' | null
  onCallTriggered?: () => void
}) {
  const { initiateCall } = useVoiceCall()
  const triggeredRef = useRef(false)

  useEffect(() => {
    if (callTrigger === 'voice' && !triggeredRef.current) {
      triggeredRef.current = true
      initiateCall(otherUserId, channelId, otherUserName)
      onCallTriggered?.()
    }
    if (!callTrigger) {
      triggeredRef.current = false
    }
  }, [callTrigger, otherUserId, channelId, otherUserName, initiateCall, onCallTriggered])

  return null
}
