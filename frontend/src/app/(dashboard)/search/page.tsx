'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, MessageCircle, Hash, Loader, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, getInitials, generateAvatarColor, truncate } from '@/lib/utils';
import type { SearchResults } from '@/types';

type SearchTab = 'all' | 'users' | 'messages' | 'groups';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (query.length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await api.globalSearch(query);
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const totalResults = results
    ? (results.users?.length || 0) + (results.messages?.length || 0) + (results.groups?.length || 0)
    : 0;

  const tabs: { id: SearchTab; label: string; icon: any; count?: number }[] = [
    { id: 'all', label: 'All', icon: Search, count: totalResults },
    { id: 'users', label: 'Users', icon: Users, count: results?.users?.length },
    { id: 'messages', label: 'Messages', icon: MessageCircle, count: results?.messages?.length },
    { id: 'groups', label: 'Groups', icon: Hash, count: results?.groups?.length },
  ];

  return (
    <div className="flex h-full">
      <div className="flex-1 max-w-2xl mx-auto w-full p-6">
        <h1 className="text-xl font-semibold text-surface-900 dark:text-white mb-4">Search</h1>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            placeholder="Search people, messages, groups..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="input-field pl-10 pr-12 py-3 text-base"
          />
          {query.length >= 2 && (
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-1.5 px-3 text-sm"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {searched && (
          <div className="flex gap-1 mb-4 bg-surface-100 dark:bg-surface-800 rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm'
                    : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className="text-xs text-surface-400">({tab.count})</span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-1">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 animate-spin text-cyber-500" />
            </div>
          )}

          {!loading && searched && totalResults === 0 && (
            <div className="flex flex-col items-center py-12 text-surface-400">
              <Search className="w-12 h-12 mb-4" />
              <p className="text-sm">No results found</p>
              <p className="text-xs mt-1">Try different search terms</p>
            </div>
          )}

          {!loading && results && (activeTab === 'all' || activeTab === 'users') && results.users?.length > 0 && (
            <div className={cn(activeTab !== 'all' && 'hidden')}>
              {activeTab === 'all' && (
                <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-2 px-2">People</p>
              )}
              {results.users.map((user) => (
                <button key={user.id} className="sidebar-item w-full">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
                    style={{ backgroundColor: generateAvatarColor(user.displayName || '') }}
                  >
                    {getInitials(user.displayName || 'U')}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-surface-900 dark:text-white">{user.displayName}</p>
                    <p className="text-xs text-surface-500">{user.username}</p>
                  </div>
                  {user.isOnline && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                </button>
              ))}
            </div>
          )}

          {!loading && results && (activeTab === 'all' || activeTab === 'messages') && results.messages?.length > 0 && (
            <div className={cn(activeTab !== 'all' && 'hidden')}>
              {activeTab === 'all' && (
                <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-2 mt-4 px-2">Messages</p>
              )}
              {results.messages.map((msg) => (
                <button key={msg.id} className="sidebar-item w-full">
                  <div className="w-10 h-10 rounded-xl bg-cyber-50 dark:bg-cyber-900/30 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5 text-cyber-500" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-surface-900 dark:text-white">{msg.sender?.displayName}</p>
                    <p className="text-xs text-surface-500 truncate">{msg.encryptedContent}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && results && (activeTab === 'all' || activeTab === 'groups') && results.groups?.length > 0 && (
            <div className={cn(activeTab !== 'all' && 'hidden')}>
              {activeTab === 'all' && (
                <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-2 mt-4 px-2">Groups</p>
              )}
              {results.groups.map((group) => (
                <button key={group.id} className="sidebar-item w-full">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-medium shrink-0"
                    style={{ backgroundColor: generateAvatarColor(group.name) }}
                  >
                    {getInitials(group.name)}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-surface-900 dark:text-white">{group.name}</p>
                    <p className="text-xs text-surface-500">{group.members?.length || 0} members</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
