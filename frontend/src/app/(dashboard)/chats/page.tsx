'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, MessageCircle } from 'lucide-react';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { NewChatModal } from '@/components/chat/NewChatModal';
import { useChatStore } from '@/store/chat-store';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function ChatsPage() {
  const { user } = useUser();
  const { chats, setChats, activeChat, setActiveChat } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const data = await api.getChats();
      setChats(data);
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true;
    const otherMember = chat.members.find((m) => m.userId !== user?.id);
    if (!otherMember) return false;
    return (
      otherMember.user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      otherMember.user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="flex h-full">
      <div className={cn('w-full md:w-80 lg:w-96 border-r border-surface-200 dark:border-surface-700 flex flex-col', activeChat && 'hidden md:flex')}>
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-surface-900 dark:text-white">Chats</h1>
            <button
              onClick={() => setShowNewChat(true)}
              className="btn-ghost p-2 rounded-lg"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="p-4 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 skeleton" />
                    <div className="h-3 w-48 skeleton" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-surface-400 p-8">
              <MessageCircle className="w-12 h-12 mb-4" />
              <p className="text-sm">No chats yet</p>
              <p className="text-xs mt-1">Start a new conversation</p>
            </div>
          ) : (
            <ChatList chats={filteredChats} activeChat={activeChat} onSelect={setActiveChat} />
          )}
        </div>
      </div>

      <div className={cn('flex-1 flex flex-col', !activeChat && 'hidden md:flex')}>
        {activeChat ? (
          <ChatWindow chat={activeChat} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-surface-400">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-10 h-10" />
              </div>
              <p className="text-lg font-medium">Select a chat</p>
              <p className="text-sm mt-1">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showNewChat && (
          <NewChatModal onClose={() => setShowNewChat(false)} onSelect={(chat) => { setActiveChat(chat); setShowNewChat(false); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
