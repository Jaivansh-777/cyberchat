'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import {
  Phone, PhoneOff, PhoneIncoming, PhoneOutgoing, PhoneMissed,
  Video, Clock, Trash2
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatCallDuration, formatMessageTime, getInitials, generateAvatarColor } from '@/lib/utils';
import type { CallLog } from '@/types';

export default function CallsPage() {
  const { user } = useUser();
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'missed'>('all');

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    try {
      const data = await api.getCallHistory();
      setCalls(data);
    } catch {
      setCalls([]);
    } finally {
      setLoading(false);
    }
  };

  const isOwn = (call: CallLog) => call.callerId === user?.id;

  const getCallIcon = (call: CallLog, own: boolean) => {
    if (call.status === 'MISSED' && !own) return <PhoneMissed className="w-4 h-4 text-red-500" />;
    if (call.status === 'REJECTED') return <PhoneOff className="w-4 h-4 text-red-500" />;
    if (call.status === 'CANCELLED') return <PhoneOff className="w-4 h-4 text-surface-400" />;
    if (own) return <PhoneOutgoing className="w-4 h-4 text-surface-500" />;
    return <PhoneIncoming className="w-4 h-4 text-green-500" />;
  };

  const getCallStatusText = (call: CallLog, own: boolean) => {
    switch (call.status) {
      case 'MISSED': return own ? 'Missed call' : 'Missed';
      case 'REJECTED': return 'Declined';
      case 'CANCELLED': return 'Cancelled';
      case 'CONNECTED': return 'Connected';
      case 'COMPLETED': return call.duration ? formatCallDuration(call.duration) : 'Completed';
      default: return 'No answer';
    }
  };

  const initiateCallAgain = (call: CallLog) => {
    const targetId = isOwn(call) ? call.receiverId : call.callerId;
    const targetName = isOwn(call) ? call.receiver?.displayName : call.caller?.displayName;
    window.dispatchEvent(new CustomEvent('startCall', {
      detail: { userId: targetId, type: call.type, displayName: targetName }
    }));
  };

  const filteredCalls = filter === 'missed'
    ? calls.filter((c) => c.status === 'MISSED' && !isOwn(c))
    : calls;

  const missedCount = calls.filter((c) => c.status === 'MISSED' && !isOwn(c)).length;

  return (
    <div className="flex h-full">
      <div className="w-full md:w-80 lg:w-96 border-r border-surface-200 dark:border-surface-700 flex flex-col">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <h1 className="text-xl font-semibold text-surface-900 dark:text-white">Calls</h1>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filter === 'all'
                  ? 'bg-cyber-500 text-white'
                  : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700'
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter('missed')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
                filter === 'missed'
                  ? 'bg-red-500 text-white'
                  : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700'
              )}
            >
              Missed
              {missedCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {missedCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
          {loading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 skeleton" />
                    <div className="h-3 w-24 skeleton" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-surface-400 p-8">
              <Phone className="w-12 h-12 mb-4" />
              <p className="text-sm">No call history</p>
              <p className="text-xs mt-1">Your calls will appear here</p>
            </div>
          ) : (
            filteredCalls.map((call) => {
              const own = isOwn(call);
              const person = own ? call.receiver : call.caller;
              const isMissed = call.status === 'MISSED' && !own;

              return (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'sidebar-item w-full',
                    isMissed && 'bg-red-50/50 dark:bg-red-900/10'
                  )}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0 overflow-hidden"
                    style={{ backgroundColor: generateAvatarColor(person?.displayName || 'Unknown') }}
                  >
                    {person?.avatar ? (
                      <img src={person.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getInitials(person?.displayName || 'U')
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        'text-sm font-medium truncate',
                        isMissed
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-surface-900 dark:text-white'
                      )}>
                        {person?.displayName}
                      </p>
                      {call.type === 'VIDEO' && <Video className="w-3.5 h-3.5 text-cyber-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-surface-500">
                      {getCallIcon(call, own)}
                      <span className={isMissed ? 'text-red-500' : ''}>
                        {getCallStatusText(call, own)}
                      </span>
                      <span>·</span>
                      <span>{formatMessageTime(call.createdAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => initiateCallAgain(call)}
                    className="btn-ghost p-2 rounded-lg text-cyber-500 hover:text-cyber-600"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex-1 hidden md:flex items-center justify-center text-surface-400">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
            <Phone className="w-10 h-10" />
          </div>
          <p className="text-lg font-medium">Voice & Video Calls</p>
          <p className="text-sm mt-1">Start a call from any chat</p>
        </div>
      </div>
    </div>
  );
}
