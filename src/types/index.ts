export interface CyberUser {
  id: string
  clerkId: string
  username: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  onlineStatus: boolean
  lastSeen: string
  createdAt: string
}

export interface ProfileData {
  id: string
  userId: string
  about: string | null
  phone: string | null
  status: string
  avatarUrl: string | null
  coverUrl: string | null
}

export interface FriendRequest {
  id: string
  senderId: string
  receiverId: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  sender: CyberUser
  receiver: CyberUser
  createdAt: string
}

export interface Friendship {
  id: string
  userId: string
  friendId: string
  friend: CyberUser
  createdAt: string
}

export interface Conversation {
  id: string
  user1Id: string
  user2Id: string
  user1: CyberUser
  user2: CyberUser
  lastMsgAt: string
  messages: Message[]
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string | null
  contentType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'VOICE_NOTE'
  mediaUrl: string | null
  mediaType: string | null
  isRead: boolean
  isDelivered: boolean
  sender: CyberUser
  createdAt: string
}

export interface Group {
  id: string
  name: string
  description: string | null
  avatarUrl: string | null
  creatorId: string
  creator: CyberUser
  members: GroupMember[]
  createdAt: string
}

export interface GroupMember {
  id: string
  groupId: string
  userId: string
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER'
  user: CyberUser
  joinedAt: string
}

export interface CallLog {
  id: string
  callerId: string
  calleeId: string
  type: 'VOICE' | 'VIDEO'
  status: 'MISSED' | 'INCOMING' | 'OUTGOING' | 'ENDED'
  duration: number
  caller: CyberUser
  callee: CyberUser
  startedAt: string
  endedAt: string | null
}

export interface BlockedUser {
  id: string
  blockerId: string
  blockedId: string
  blocked: CyberUser
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: 'FRIEND_REQUEST' | 'MESSAGE' | 'CALL' | 'GROUP_INVITE' | 'SYSTEM'
  title: string
  body: string | null
  data: Record<string, unknown> | null
  isRead: boolean
  createdAt: string
}

export interface Story {
  id: string
  userId: string
  user: CyberUser
  mediaUrl: string
  createdAt: string
  expiresAt: string
}

export type NavTab = 'chats' | 'friends' | 'calls' | 'notifications' | 'settings'
