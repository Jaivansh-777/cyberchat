export interface CyberUser {
  id: string
  clerkId: string
  cyberId: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  email: string
  bio: string | null
  lastSeen: string
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

export interface Group {
  id: string
  name: string
  description: string | null
  avatarUrl: string | null
  creatorId: string
  inviteCode: string
  streamChannelId: string
  members: GroupMember[]
  createdAt: string
}

export interface GroupMember {
  id: string
  groupId: string
  clerkId: string
  role: 'admin' | 'member'
  joinedAt: string
  user: CyberUser
}

export interface CallLog {
  id: string
  callerId: string
  receiverId: string
  callType: 'audio' | 'video'
  status: 'missed' | 'completed' | 'cancelled'
  duration: number | null
  startedAt: string
  endedAt: string | null
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

export type NavTab = 'chats' | 'friends' | 'calls' | 'status' | 'groups' | 'profile' | 'settings'
