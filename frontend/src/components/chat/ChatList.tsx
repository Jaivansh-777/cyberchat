'use client';

import type { Chat } from '@/types';
import { cn, formatMessageTime, getInitials, generateAvatarColor, truncate } from '@/lib/utils';
import { useChatStore } from '@/store/chat-store';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatListProps {
  chats: Chat[];
  activeChat: Chat | null;
  onSelect: (chat: Chat) => void;
}

export function ChatList({ chats, activeChat, onSelect }: ChatListProps) {
  const { user } = useUser();
  const onlineUsers = useChatStore((s) => s.onlineUsers);
  const typingUsers = useChatStore((s) => s.typingUsers);

  return (
    <div className="py-2">
      {chats.map((chat, i) => {
        const otherMember = chat.members.find((m) => m.userId !== user?.id);
        const otherUser = otherMember?.user;
        const isOnline = otherUser?.id ? onlineUsers.has(otherUser.id) : false;
        const lastMessage = chat.messages?.[0];
        const isActive = activeChat?.id === chat.id;

        const isTyping = typingUsers.some(
          (t) => t.chatId === chat.id && t.userId !== user?.id
        );

        return (
          <motion.button
            key={chat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => onSelect(chat)}
            className={cn(
              'sidebar-item w-full text-left relative',
              isActive && 'active'
            )}
          >
            <div className="relative shrink-0">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-medium overflow-hidden"
                style={{ backgroundColor: generateAvatarColor(otherUser?.displayName || 'Unknown') }}
              >
                {otherUser?.avatar ? (
                  <img src={otherUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  getInitials(otherUser?.displayName || 'U')
                )}
              </div>
              {isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-surface-800 rounded-full" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                  {otherUser?.displayName || 'Unknown'}
                </p>
                {lastMessage && (
                  <span className="text-xs text-surface-400 shrink-0 ml-2">
                    {formatMessageTime(lastMessage.createdAt)}
                  </span>
                )}
              </div>
              <AnimatePresence mode="wait">
                {isTyping ? (
                  <motion.p
                    key="typing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-cyber-500 truncate mt-0.5"
                  >
                    typing...
                  </motion.p>
                ) : (
                  <motion.p
                    key="lastMsg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-surface-500 truncate mt-0.5"
                  >
                    {lastMessage
                      ? lastMessage.isDeleted
                        ? 'Message deleted'
                        : truncate(lastMessage.encryptedContent || 'Media message', 40)
                      : 'Start chatting...'}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
