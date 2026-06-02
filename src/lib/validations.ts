import { z } from 'zod'

export const searchUserSchema = z.object({
  q: z.string().min(1).max(100),
})

export const sendFriendRequestSchema = z.object({
  receiverId: z.string().min(1),
})

export const acceptRejectRequestSchema = z.object({
  requestId: z.string().min(1),
})

export const createConversationSchema = z.object({
  userId: z.string().min(1),
})

export const sendMessageSchema = z.object({
  content: z.string().max(5000).optional(),
  contentType: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'VOICE_NOTE']).optional(),
  mediaUrl: z.string().url().optional(),
})

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  memberIds: z.array(z.string()).min(1),
})

export const createCallLogSchema = z.object({
  calleeId: z.string().min(1),
  type: z.enum(['VOICE', 'VIDEO']),
})

export const blockUserSchema = z.object({
  userId: z.string().min(1),
})

export const updateStatusSchema = z.object({
  status: z.string().max(200),
})
