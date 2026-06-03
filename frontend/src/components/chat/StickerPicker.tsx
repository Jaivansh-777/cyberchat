'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';

interface StickerPickerProps {
  onSelect: (stickerUrl: string) => void;
  onClose: () => void;
}

const STICKER_PACKS = [
  {
    name: 'Happy',
    emoji: '😊',
    stickers: [
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f600.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f601.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f602.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f603.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f604.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f605.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f606.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f607.png',
    ],
  },
  {
    name: 'Love',
    emoji: '❤️',
    stickers: [
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/2764.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f498.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f49d.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f496.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f497.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f493.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f49e.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f495.png',
    ],
  },
  {
    name: 'Sad',
    emoji: '😢',
    stickers: [
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f622.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f62d.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f630.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f631.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f635.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f62b.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f629.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f621.png',
    ],
  },
  {
    name: 'Cool',
    emoji: '😎',
    stickers: [
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f60e.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f60a.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f60d.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f618.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f61a.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f61c.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f61e.png',
      'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f620.png',
    ],
  },
];

const RECENT_STICKERS_KEY = 'cyberchat_recent_stickers';

export function StickerPicker({ onSelect, onClose }: StickerPickerProps) {
  const [activePack, setActivePack] = useState(STICKER_PACKS[0].name);
  const [recentStickers, setRecentStickers] = useState<string[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_STICKERS_KEY);
    if (stored) {
      try {
        setRecentStickers(JSON.parse(stored));
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

  const handleStickerClick = (url: string) => {
    const updated = [url, ...recentStickers.filter((s) => s !== url)].slice(0, 16);
    setRecentStickers(updated);
    localStorage.setItem(RECENT_STICKERS_KEY, JSON.stringify(updated));
    onSelect(url);
  };

  const currentPack = STICKER_PACKS.find((p) => p.name === activePack) || STICKER_PACKS[0];

  return (
    <motion.div
      ref={pickerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-700 w-80 overflow-hidden"
    >
      <div className="flex items-center gap-1 px-3 py-2 border-b border-surface-100 dark:border-surface-700 overflow-x-auto">
        {recentStickers.length > 0 && (
          <button
            onClick={() => setActivePack('Recent')}
            className={`p-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activePack === 'Recent' ? 'bg-surface-100 dark:bg-surface-700 text-cyber-500' : 'text-surface-500'
            }`}
          >
            Recent
          </button>
        )}
        {STICKER_PACKS.map((pack) => (
          <button
            key={pack.name}
            onClick={() => setActivePack(pack.name)}
            className={`p-1.5 rounded-lg text-sm transition-colors ${
              activePack === pack.name ? 'bg-surface-100 dark:bg-surface-700' : ''
            }`}
          >
            {pack.emoji}
          </button>
        ))}
      </div>

      <div className="h-56 overflow-y-auto scrollbar-thin p-3">
        {activePack === 'Recent' && recentStickers.length > 0 ? (
          <div>
            <p className="text-xs font-medium text-surface-400 mb-2">Recent Stickers</p>
            <div className="grid grid-cols-4 gap-2">
              {recentStickers.map((url, i) => (
                <button
                  key={`recent-${i}`}
                  onClick={() => handleStickerClick(url)}
                  className="aspect-square flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors p-1"
                >
                  <img src={url} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs font-medium text-surface-400 mb-2">{currentPack.name} Stickers</p>
            <div className="grid grid-cols-4 gap-2">
              {currentPack.stickers.map((url, i) => (
                <button
                  key={i}
                  onClick={() => handleStickerClick(url)}
                  className="aspect-square flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors p-1"
                >
                  <img src={url} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
