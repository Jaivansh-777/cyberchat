'use client'

import { create } from 'zustand'
import type { Conversation, Message, CyberUser, FriendRequest, CallLog, Notification, Group } from '@/types'

interface ChatState {
  conversations: Conversation[]
  activeConversation: Conversation | null
  messages: Record<string, Message[]>
  onlineUsers: string[]
  typingUsers: Record<string, string[]>
  unreadCounts: Record<string, number>
  friends: CyberUser[]
  friendRequests: FriendRequest[]
  callLogs: CallLog[]
  notifications: Notification[]
  groups: Group[]
  currentUser: CyberUser | null
  isStreamReady: boolean

  setConversations: (conversations: Conversation[]) => void
  setActiveConversation: (conversation: Conversation | null) => void
  setMessages: (conversationId: string, messages: Message[]) => void
  addMessage: (conversationId: string, message: Message) => void
  setOnlineUsers: (userIds: string[]) => void
  setTypingUsers: (conversationId: string, userIds: string[]) => void
  setUnreadCount: (conversationId: string, count: number) => void
  setFriends: (friends: CyberUser[]) => void
  setFriendRequests: (requests: FriendRequest[]) => void
  setCallLogs: (logs: CallLog[]) => void
  setNotifications: (notifications: Notification[]) => void
  setGroups: (groups: Group[]) => void
  setCurrentUser: (user: CyberUser | null) => void
  setStreamReady: (ready: boolean) => void
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversation: null,
  messages: {},
  onlineUsers: [],
  typingUsers: {},
  unreadCounts: {},
  friends: [],
  friendRequests: [],
  callLogs: [],
  notifications: [],
  groups: [],
  currentUser: null,
  isStreamReady: false,

  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (conversation) => set({ activeConversation: conversation }),
  setMessages: (conversationId, messages) =>
    set((state) => ({ messages: { ...state.messages, [conversationId]: messages } })),
  addMessage: (conversationId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), message],
      },
    })),
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  setTypingUsers: (conversationId, userIds) =>
    set((state) => ({ typingUsers: { ...state.typingUsers, [conversationId]: userIds } })),
  setUnreadCount: (conversationId, count) =>
    set((state) => ({ unreadCounts: { ...state.unreadCounts, [conversationId]: count } })),
  setFriends: (friends) => set({ friends }),
  setFriendRequests: (friendRequests) => set({ friendRequests }),
  setCallLogs: (callLogs) => set({ callLogs }),
  setNotifications: (notifications) => set({ notifications }),
  setGroups: (groups) => set({ groups }),
  setCurrentUser: (currentUser) => set({ currentUser }),
  setStreamReady: (isStreamReady) => set({ isStreamReady }),
}))
