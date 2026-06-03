'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, X, Users, Loader, MessageCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, getInitials, generateAvatarColor } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import toast from 'react-hot-toast';
import type { Chat } from '@/types';

interface NewChatModalProps {
  onClose: () => void;
  onSelect?: (chat: Chat) => void;
}

export function NewChatModal({ onClose, onSelect }: NewChatModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api.searchUsers(debouncedQuery)
      .then((users) => {
        if (!cancelled) setResults(users);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const handleSelect = async (userId: string) => {
    setCreating(userId);
    try {
      const chat = await api.createPrivateChat(userId);
      if (onSelect) {
        onSelect(chat);
      } else {
        router.push(`/chats/${chat.id}`);
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create chat');
    } finally {
      setCreating(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white">New Chat</h2>
          <button onClick={onClose} className="btn-ghost p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search by username (e.g. @jai0089)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-field pl-10"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto scrollbar-thin">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-5 h-5 animate-spin text-cyber-500" />
            </div>
          )}

          {!loading && results.length === 0 && debouncedQuery.length >= 2 && (
            <div className="flex flex-col items-center py-8 text-surface-400">
              <Users className="w-8 h-8 mb-2" />
              <p className="text-sm font-medium">No user found</p>
              <p className="text-xs mt-1">Try a different username</p>
            </div>
          )}

          {results.map((user: any) => (
            <button
              key={user.id}
              onClick={() => handleSelect(user.id)}
              disabled={creating === user.id}
              className="sidebar-item w-full"
            >
              <div className="relative shrink-0">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: generateAvatarColor(user.displayName) }}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getInitials(user.displayName)
                  )}
                </div>
                {user.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-surface-800 rounded-full" />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-surface-900 dark:text-white">{user.displayName}</p>
                <p className="text-xs text-surface-500">{user.username}</p>
                {user.bio && (
                  <p className="text-xs text-surface-400 truncate mt-0.5">{user.bio}</p>
                )}
              </div>
              {creating === user.id ? (
                <Loader className="w-4 h-4 animate-spin text-cyber-500 shrink-0" />
              ) : (
                <MessageCircle className="w-4 h-4 text-surface-400 shrink-0" />
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
