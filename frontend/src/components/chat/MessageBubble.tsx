'use client';

import { motion } from 'framer-motion';
import { Check, CheckCheck, Trash2 } from 'lucide-react';
import type { Message } from '@/types';
import { cn, formatMessageTime } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onContextMenu?: (message: Message, e: React.MouseEvent) => void;
}

export function MessageBubble({ message, isOwn, onContextMenu }: MessageBubbleProps) {
  if (message.isDeleted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
      >
        <div className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-xl max-w-[75%]',
          isOwn
            ? 'bg-cyber-500/40 text-white/60'
            : 'bg-surface-100 dark:bg-surface-800 text-surface-400'
        )}>
          <Trash2 className="w-3.5 h-3.5" />
          <span className="text-sm italic">This message was deleted</span>
        </div>
      </motion.div>
    );
  }

  const hasContent = message.encryptedContent && message.encryptedContent.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn('message-bubble group', isOwn ? 'sent' : 'received')}
        onContextMenu={(e) => onContextMenu?.(message, e)}
      >
        {message.replyTo && (
          <div className={cn(
            'text-xs px-2 py-1 rounded-lg mb-1 border-l-2',
            isOwn ? 'bg-cyber-600 border-cyber-300' : 'bg-surface-200 dark:bg-surface-700 border-surface-400'
          )}>
            <p className="font-medium">{message.replyTo.sender?.displayName}</p>
            <p className="truncate max-w-[200px]">{message.replyTo.encryptedContent}</p>
          </div>
        )}

        {hasContent && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.encryptedContent}</p>
        )}

        {message.mediaUrl && (
          <div className={cn('rounded-lg overflow-hidden', hasContent && 'mt-2')}>
            {message.messageType === 'IMAGE' && (
              <img src={message.mediaUrl} alt="" className="max-w-full rounded-lg" loading="lazy" />
            )}
            {message.messageType === 'VIDEO' && (
              <video src={message.mediaUrl} controls className="max-w-full rounded-lg" />
            )}
            {message.messageType === 'AUDIO' && (
              <audio src={message.mediaUrl} controls className="w-full" />
            )}
          </div>
        )}

        {message.editedAt && (
          <span className="text-[10px] opacity-60 ml-1">edited</span>
        )}

        <div className={cn(
          'flex items-center gap-1 mt-1',
          hasContent || message.editedAt ? 'justify-end' : 'justify-end'
        )}>
          <span className={cn('text-[10px]', isOwn ? 'text-white/70' : 'text-surface-400')}>
            {formatMessageTime(message.createdAt)}
          </span>
          {isOwn && (
            message.status === 'READ' ? (
              <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
            ) : message.status === 'DELIVERED' ? (
              <CheckCheck className="w-3.5 h-3.5 text-white/70" />
            ) : message.status === 'SENT' ? (
              <Check className="w-3.5 h-3.5 text-white/70" />
            ) : (
              <span className="text-[10px] text-red-400">Failed</span>
            )
          )}
        </div>

        {message.reactions.length > 0 && (
          <div className={cn(
            'flex items-center gap-0.5 -mb-2 mt-1',
            isOwn ? 'justify-start' : 'justify-end'
          )}>
            {message.reactions.map((r) => (
              <span key={r.id} className="text-sm">{r.emoji}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
