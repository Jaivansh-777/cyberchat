'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, Video, Info, Send, Smile, Paperclip,
  ChevronLeft, Trash2, Trash
} from 'lucide-react';
import type { Chat, Message } from '@/types';
import { useChatStore } from '@/store/chat-store';
import { cn, getInitials, generateAvatarColor } from '@/lib/utils';
import { useSocket } from '@/hooks/useSocket';
import { MessageBubble } from './MessageBubble';
import { EmojiPicker } from './EmojiPicker';
import { StickerPicker } from './StickerPicker';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface ChatWindowProps {
  chat: Chat;
}

export function ChatWindow({ chat }: ChatWindowProps) {
  const { user } = useUser();
  const [message, setMessage] = useState('');
  const typingTimeout = useRef<NodeJS.Timeout>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messages = useChatStore((s) => s.messages[chat.id] || []);
  const onlineUsers = useChatStore((s) => s.onlineUsers);
  const typingUsers = useChatStore((s) => s.typingUsers);
  const { joinChat, leaveChat, sendMessage, startTyping, stopTyping, markAsRead } = useSocket();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [contextMessage, setContextMessage] = useState<Message | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  const otherMember = chat.members.find((m) => m.userId !== user?.id);
  const otherUser = otherMember?.user;
  const isOnline = otherUser?.id ? onlineUsers.has(otherUser.id) : false;

  const chatTypingUsers = typingUsers.filter(
    (t) => t.chatId === chat.id && t.userId !== user?.id
  );

  useEffect(() => {
    if (chat.id) {
      joinChat(chat.id);
      return () => leaveChat(chat.id);
    }
  }, [chat.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.senderId !== user?.id) {
        markAsRead(chat.id, lastMsg.id);
      }
    }
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage({
      chatId: chat.id,
      encryptedContent: message,
      messageType: 'TEXT',
    });
    setMessage('');
    stopTyping(chat.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    startTyping(chat.id);

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      stopTyping(chat.id);
    }, 1500);
  };

  const handleEmojiSelect = (emoji: any) => {
    setMessage((prev) => prev + (emoji.native || emoji));
    setShowEmojiPicker(false);
  };

  const handleStickerSelect = (stickerUrl: string) => {
    sendMessage({
      chatId: chat.id,
      mediaUrl: stickerUrl,
      messageType: 'IMAGE',
    });
    setShowStickerPicker(false);
  };

  const handleMessageContextMenu = useCallback((msg: Message, e: React.MouseEvent) => {
    e.preventDefault();
    setContextMessage(msg);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleDeleteMessage = async (forEveryone: boolean) => {
    if (!contextMessage) return;
    try {
      if (forEveryone) {
        await api.deleteMessage(contextMessage.id, true);
      }
      setContextMessage(null);
    } catch {
      toast.error('Failed to delete message');
    }
  };

  const startVoiceCall = () => {
    window.dispatchEvent(new CustomEvent('startCall', {
      detail: { userId: otherUser?.id, type: 'VOICE', displayName: otherUser?.displayName, avatar: otherUser?.avatar }
    }));
  };

  const startVideoCall = () => {
    window.dispatchEvent(new CustomEvent('startCall', {
      detail: { userId: otherUser?.id, type: 'VIDEO', displayName: otherUser?.displayName, avatar: otherUser?.avatar }
    }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-white/80 dark:bg-surface-800/80 backdrop-blur-sm">
        <button className="md:hidden btn-ghost p-1" onClick={() => useChatStore.getState().setActiveChat(null)}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="relative">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium overflow-hidden"
            style={{ backgroundColor: generateAvatarColor(otherUser?.displayName || 'Unknown') }}
          >
            {otherUser?.avatar ? (
              <img src={otherUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials(otherUser?.displayName || 'U')
            )}
          </div>
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-surface-800 rounded-full" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
            {otherUser?.displayName || 'Unknown'}
          </p>
          <p className="text-xs text-surface-500">
            {isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={startVoiceCall} className="btn-ghost p-2 rounded-lg">
            <Phone className="w-4 h-4" />
          </button>
          <button onClick={startVideoCall} className="btn-ghost p-2 rounded-lg">
            <Video className="w-4 h-4" />
          </button>
          <button className="btn-ghost p-2 rounded-lg">
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-2 bg-[#f0f2f5] dark:bg-surface-900/50"
        onClick={() => { setShowEmojiPicker(false); setShowStickerPicker(false); setContextMessage(null); }}
      >
        <AnimatePresence>
          {messages.slice().reverse().map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === user?.id}
              onContextMenu={handleMessageContextMenu}
            />
          ))}
        </AnimatePresence>

        {chatTypingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-xs text-surface-500 px-2"
          >
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span>
              {chatTypingUsers.map((t) => t.username || 'Someone').join(', ')}
              {chatTypingUsers.length === 1 ? ' is typing...' : ' are typing...'}
            </span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-3 border-t border-surface-200 dark:border-surface-700 bg-white/80 dark:bg-surface-800/80 backdrop-blur-sm">
        <div className="flex items-end gap-2">
          <button
            onClick={() => { setShowStickerPicker(!showStickerPicker); setShowEmojiPicker(false); }}
            className="btn-ghost p-2 rounded-lg shrink-0"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="input-field resize-none max-h-32 py-2.5 pr-10"
              style={{ minHeight: '40px' }}
            />
            <button
              onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowStickerPicker(false); }}
              className="absolute right-2 bottom-2 btn-ghost p-1 rounded-lg"
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="btn-primary p-2.5 rounded-xl shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-20 right-4 z-50"
            >
              <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showStickerPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-20 right-4 z-50"
            >
              <StickerPicker onSelect={handleStickerSelect} onClose={() => setShowStickerPicker(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {contextMessage && contextMessage.senderId === user?.id && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setContextMessage(null)}
        >
          <div
            className="absolute bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 py-1 w-48"
            style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleDeleteMessage(false)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
            >
              <Trash2 className="w-4 h-4" />
              Delete for me
            </button>
            <button
              onClick={() => handleDeleteMessage(true)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash className="w-4 h-4" />
              Delete for everyone
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
