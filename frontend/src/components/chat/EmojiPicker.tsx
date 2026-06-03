'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, History, X } from 'lucide-react';

interface EmojiPickerProps {
  onSelect: (emoji: any) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = [
  { name: 'Smileys', icon: '😀' },
  { name: 'People', icon: '👋' },
  { name: 'Animals', icon: '🐱' },
  { name: 'Food', icon: '🍕' },
  { name: 'Activities', icon: '⚽' },
  { name: 'Travel', icon: '🚗' },
  { name: 'Objects', icon: '💡' },
  { name: 'Symbols', icon: '❤️' },
  { name: 'Flags', icon: '🏳️' },
];

const RECENT_EMOJIS_KEY = 'cyberchat_recent_emojis';

const COMMON_EMOJIS = [
  '😀', '😂', '🤣', '😊', '😍', '🥰', '😘', '😜', '🤔', '🤗',
  '😎', '🤩', '😢', '😭', '😤', '😡', '🥺', '😱', '🤯', '😳',
  '❤️', '💔', '💕', '💖', '💙', '💚', '💛', '💜', '🖤', '🤍',
  '👍', '👎', '👏', '🙌', '🤝', '💪', '✌️', '🤞', '👀', '👋',
  '🔥', '⚡', '💯', '✅', '❌', '⭐', '🌟', '✨', '💡', '🎉',
  '🎂', '🎈', '🎁', '🎊', '🏆', '📱', '💻', '⌚', '📷', '🎵',
];

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Smileys');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
    if (stored) {
      try {
        setRecentEmojis(JSON.parse(stored));
      } catch {}
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleEmojiClick = (emoji: string) => {
    const updated = [emoji, ...recentEmojis.filter((e) => e !== emoji)].slice(0, 20);
    setRecentEmojis(updated);
    localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(updated));
    onSelect({ native: emoji });
  };

  const filteredEmojis = searchQuery
    ? COMMON_EMOJIS.filter((e) => e.includes(searchQuery))
    : COMMON_EMOJIS;

  return (
    <motion.div
      ref={pickerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-700 w-80 overflow-hidden"
    >
      <div className="p-3 border-b border-surface-100 dark:border-surface-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search emojis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9 py-2 text-sm"
            autoFocus
          />
        </div>
      </div>

      <div className="flex items-center gap-1 px-3 py-2 border-b border-surface-100 dark:border-surface-700 overflow-x-auto">
        {recentEmojis.length > 0 && (
          <button
            onClick={() => setActiveCategory('Recent')}
            className={`p-1.5 rounded-lg transition-colors ${activeCategory === 'Recent' ? 'bg-surface-100 dark:bg-surface-700' : ''}`}
          >
            <History className="w-4 h-4 text-surface-500" />
          </button>
        )}
        {EMOJI_CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(cat.name)}
            className={`p-1.5 rounded-lg text-sm transition-colors ${activeCategory === cat.name ? 'bg-surface-100 dark:bg-surface-700' : ''}`}
          >
            {cat.icon}
          </button>
        ))}
      </div>

      <div className="h-56 overflow-y-auto scrollbar-thin p-3">
        {activeCategory === 'Recent' && recentEmojis.length > 0 && (
          <div>
            <p className="text-xs font-medium text-surface-400 mb-2">Recent</p>
            <div className="grid grid-cols-8 gap-1">
              {recentEmojis.map((emoji, i) => (
                <button
                  key={`recent-${i}`}
                  onClick={() => handleEmojiClick(emoji)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg text-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-8 gap-1">
          {filteredEmojis.map((emoji, i) => (
            <button
              key={i}
              onClick={() => handleEmojiClick(emoji)}
              className="w-8 h-8 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg text-lg transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
