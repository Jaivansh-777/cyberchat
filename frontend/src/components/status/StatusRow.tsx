'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Circle } from 'lucide-react';
import type { StatusItem } from '@/types';
import { useUser } from '@clerk/nextjs';
import { cn, getInitials, generateAvatarColor } from '@/lib/utils';

interface StatusRowProps {
  myStatuses: StatusItem[];
  friendsStatuses: StatusItem[];
  onCreateClick: () => void;
  onStatusClick: (status: StatusItem) => void;
  loading: boolean;
}

export function StatusRow({ myStatuses, friendsStatuses, onCreateClick, onStatusClick, loading }: StatusRowProps) {
  const { user } = useUser();
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasMyStatus = myStatuses.length > 0;
  const latestMyStatus = myStatuses[0];
  const allStatuses = [...(latestMyStatus ? [latestMyStatus] : []), ...friendsStatuses];

  if (loading) {
    return (
      <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-thin">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="w-16 h-16 rounded-full skeleton" />
            <div className="w-14 h-3 skeleton rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (allStatuses.length === 0 && !hasMyStatus) return null;

  return (
    <div className="border-b border-surface-200 dark:border-surface-700">
      <div
        ref={scrollRef}
        className="flex gap-4 px-4 py-3 overflow-x-auto scrollbar-thin"
      >
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onCreateClick}
          className="flex flex-col items-center gap-1.5 shrink-0"
        >
          <div className="relative">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-medium overflow-hidden ring-2 ring-surface-300 dark:ring-surface-600"
              style={{ backgroundColor: generateAvatarColor(user?.fullName || 'U') }}
            >
              {hasMyStatus && latestMyStatus?.mediaUrl ? (
                <img src={latestMyStatus.mediaUrl} alt="" className="w-full h-full object-cover" />
              ) : user?.imageUrl ? (
                <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                getInitials(user?.fullName || 'U')
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-cyber-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-surface-800">
              <Plus className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <span className="text-[11px] text-surface-500 font-medium truncate max-w-[72px]">
            {hasMyStatus ? 'My Status' : 'Add Status'}
          </span>
        </motion.button>

        {friendsStatuses.map((status, i) => (
          <motion.button
            key={status.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onStatusClick(status)}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-medium overflow-hidden p-[3px]"
              style={{
                background: status.viewedByCurrentUser
                  ? 'conic-gradient(#ddd, #ddd)'
                  : 'conic-gradient(#5c7cfa, #9775fa, #5c7cfa)',
              }}
            >
              <div className="w-full h-full rounded-full bg-white dark:bg-surface-800 flex items-center justify-center overflow-hidden">
                {status.mediaUrl ? (
                  <img src={status.mediaUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: generateAvatarColor(status.user?.displayName || 'U') }}
                  >
                    {getInitials(status.user?.displayName || 'U')}
                  </div>
                )}
              </div>
            </div>
            <span className="text-[11px] text-surface-500 font-medium truncate max-w-[72px]">
              {status.user?.displayName?.split(' ')[0] || 'User'}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
