'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Eye, Trash2, Pause, Play } from 'lucide-react';
import type { StatusItem } from '@/types';
import { useUser } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { cn, getInitials, generateAvatarColor } from '@/lib/utils';
import toast from 'react-hot-toast';

interface StatusViewerProps {
  statuses: StatusItem[];
  initialIndex: number;
  onClose: () => void;
  onDelete?: (statusId: string) => void;
}

export function StatusViewer({ statuses, initialIndex, onClose, onDelete }: StatusViewerProps) {
  const { user } = useUser();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [statusWithViews, setStatusWithViews] = useState<StatusItem | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef(0);

  const current = statuses[currentIndex];
  const isOwn = current?.userId === user?.id;

  const goNext = useCallback(() => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onClose();
    }
  }, [currentIndex, statuses.length, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    progressRef.current = 0;
    setProgress(0);

    if (current?.type === 'VIDEO') {
      return;
    }

    timerRef.current = setInterval(() => {
      progressRef.current += 1;
      setProgress(progressRef.current);
      if (progressRef.current >= 100) {
        clearInterval(timerRef.current!);
        goNext();
      }
    }, 50);
  }, [current, goNext]);

  const recordView = useCallback(async (status: StatusItem) => {
    try {
      await api.viewStatus(status.id);
    } catch {}
  }, []);

  useEffect(() => {
    if (current) {
      startTimer();
      recordView(current);
      if (isOwn) {
        api.getMyStatuses().then((res) => {
          const found = res.find((s: StatusItem) => s.id === current.id);
          if (found) setStatusWithViews(found);
        }).catch(() => {});
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [current?.id]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, onClose]);

  const handleDelete = async () => {
    if (!current) return;
    try {
      await api.deleteStatus(current.id);
      toast.success('Status deleted');
      onDelete?.(current.id);
      goNext();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (!current) return null;

  const isVideo = current.type === 'VIDEO';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-[420px] h-full max-h-[90vh] flex flex-col">
        {/* Progress bars */}
        <div className="absolute top-2 left-2 right-2 z-10 flex gap-1">
          {statuses.slice(0, 5).map((status, i) => (
            <div
              key={status.id}
              className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className={cn(
                  "h-full bg-white rounded-full transition-all duration-100",
                  i < currentIndex && "w-full",
                  i === currentIndex && "w-0"
                )}
                style={i === currentIndex ? { width: `${progress}%` } : undefined}
              />
            </div>
          ))}
        </div>

        {/* Top bar */}
        <div className="absolute top-5 left-0 right-0 z-10 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-medium overflow-hidden ring-2 ring-white/50"
              style={{ backgroundColor: generateAvatarColor(current.user?.displayName || 'U') }}
            >
              {current.user?.avatar ? (
                <img src={current.user?.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                getInitials(current.user?.displayName || 'U')
              )}
            </div>
            <div>
              <p className="text-white text-sm font-medium leading-tight">
                {current.user?.displayName || 'Unknown'}
              </p>
              <p className="text-white/60 text-[10px]">
                {new Date(current.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isOwn && (
              <button
                onClick={() => setShowViewers(!showViewers)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <Eye className="w-5 h-5 text-white" />
              </button>
            )}
            {isOwn && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <Trash2 className="w-5 h-5 text-white" />
              </button>
            )}
            <button
              onClick={() => setPaused(!paused)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              {paused ? <Play className="w-5 h-5 text-white" /> : <Pause className="w-5 h-5 text-white" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center relative">
          {current.text && !current.mediaUrl && (
            <div className="bg-gradient-to-br from-cyber-500 to-purple-600 p-8 mx-4 rounded-2xl">
              <p className="text-white text-xl font-medium text-center break-words">
                {current.text}
              </p>
            </div>
          )}
          {current.mediaUrl && (
            isVideo ? (
              <video
                src={current.mediaUrl}
                className="w-full h-full object-contain"
                autoPlay
                muted
                loop={paused}
                controls
              />
            ) : (
              <img
                src={current.mediaUrl}
                alt=""
                className="w-full h-full object-contain"
              />
            )
          )}

          {/* Nav buttons */}
          {currentIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}
          {currentIndex < statuses.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}
        </div>

        {/* Viewers panel */}
        <AnimatePresence>
          {showViewers && isOwn && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-0 left-0 right-0 bg-white dark:bg-surface-800 rounded-t-2xl max-h-[40vh] overflow-y-auto"
            >
              <div className="p-4">
                <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-3">
                  Viewed by {statusWithViews?.views?.length || 0}
                </h3>
                {statusWithViews?.views?.length ? (
                  <div className="space-y-2">
                    {statusWithViews.views.map((view) => (
                      <div key={view.id} className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium overflow-hidden"
                          style={{ backgroundColor: generateAvatarColor(view.viewer?.displayName || 'U') }}
                        >
                          {view.viewer?.avatar ? (
                            <img src={view.viewer?.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(view.viewer?.displayName || 'U')
                          )}
                        </div>
                        <span className="text-sm text-surface-700 dark:text-surface-300">
                          {view.viewer?.displayName || 'Unknown'}
                        </span>
                        <span className="text-[10px] text-surface-400 ml-auto">
                          {new Date(view.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-surface-400 text-center py-4">No one has viewed yet</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
