export interface User {
  id: string;
  clerkId: string;
  username: string;
  email: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  publicKey?: string;
  lastSeen?: string;
  isOnline: boolean;
  createdAt: string;
}

export interface Chat {
  id: string;
  type: 'PRIVATE' | 'GROUP';
  members: ChatMember[];
  messages?: Message[];
  pinnedMessages?: PinnedMessage[];
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMember {
  id: string;
  chatId: string;
  userId: string;
  user: User;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  sender: Partial<User>;
  encryptedContent?: string;
  mediaUrl?: string;
  mediaType?: string;
  messageType: MessageType;
  status: MessageStatus;
  replyTo?: Message;
  replyToId?: string;
  editedAt?: string;
  isDeleted: boolean;
  reactions: MessageReaction[];
  pinnedBy?: PinnedMessage[];
  createdAt: string;
}

export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'VOICE_NOTE' | 'DOCUMENT' | 'PDF' | 'ZIP' | 'SYSTEM';

export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  user: Partial<User>;
  emoji: string;
  createdAt: string;
}

export interface PinnedMessage {
  id: string;
  chatId: string;
  messageId: string;
  pinnedBy: string;
  user: Partial<User>;
  message: Message;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  ownerId: string;
  owner: Partial<User>;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  user: Partial<User>;
  role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
  joinedAt: string;
}

export interface CallLog {
  id: string;
  callerId: string;
  caller: Partial<User>;
  receiverId: string;
  receiver: Partial<User>;
  type: 'VOICE' | 'VIDEO';
  duration?: number;
  status: 'INITIATED' | 'RINGING' | 'CONNECTED' | 'COMPLETED' | 'MISSED' | 'REJECTED' | 'CANCELLED';
  streamCallId?: string;
  createdAt: string;
}

export interface TypingUser {
  userId: string;
  chatId: string;
  username?: string;
}

export interface DeviceSession {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: string;
  isActive: boolean;
  lastActiveAt: string;
  createdAt: string;
}

export interface SearchResults {
  users: Partial<User>[];
  messages: Message[];
  groups: Group[];
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  sender: Partial<User>;
  receiver: Partial<User>;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  friend: Partial<User>;
  createdAt: string;
}

export interface CallState {
  isIncoming: boolean;
  isOutgoing: boolean;
  isActive: boolean;
  callId: string | null;
  callerId: string | null;
  callerName: string | null;
  callerAvatar: string | null;
  receiverId: string | null;
  callType: 'VOICE' | 'VIDEO';
  startTime: number | null;
  duration: number;
}

export interface Sticker {
  id: string;
  url: string;
  pack: string;
  category: string;
}
