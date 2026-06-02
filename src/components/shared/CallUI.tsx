'use client'

import { useVoiceCall } from './VoiceCallProvider'

export function CallUI({
  channelId,
  otherUserId,
  currentUserId,
  callTrigger,
  onCallTriggered,
}: {
  channelId: string
  otherUserId: string
  currentUserId: string
  callTrigger?: 'voice' | null
  onCallTriggered?: () => void
}) {
  const { initiateCall } = useVoiceCall()

  if (callTrigger === 'voice') {
    initiateCall(otherUserId || otherUserId, channelId)
    onCallTriggered?.()
  }

  return null
}
