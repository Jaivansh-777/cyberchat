'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, PhoneOff, Mic, MicOff,
  Volume2, VolumeX, Maximize2, Minimize2, Clock
} from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { useUser } from '@clerk/nextjs';
import { cn, getInitials, generateAvatarColor, formatDuration } from '@/lib/utils';
import { useSocket } from '@/hooks/useSocket';
import { useStreamCall } from './StreamCallProvider';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const CALL_TIMEOUT = 30000;

export function CallOverlay() {
  const { user } = useUser();
  const { callInProgress, callData, setCallInProgress } = useUIStore();
  const { sendCallSignal, acceptCall: acceptCallSocket, endCall: endCallSocket } = useSocket();
  const { startLocalStream, stopLocalStream, mute } = useStreamCall();

  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [timeoutProgress, setTimeoutProgress] = useState(100);
  const durationInterval = useRef<NodeJS.Timeout>(undefined);
  const timeoutInterval = useRef<NodeJS.Timeout>(undefined);
  const ringingAudioRef = useRef<{ stop: () => void } | null>(null);
  const handleTimeoutRef = useRef<() => void>(() => {});

  const isIncoming = callData?.isIncoming;
  const isOutgoing = callData?.isOutgoing;
  const isActive = callData?.isActive;
  const callerName = callData?.callerName || callData?.callerDisplayName || 'Unknown';
  const callerAvatar = callData?.callerAvatar;
  const targetUserId = callData?.targetUserId;
  const callId = callData?.callId || callData?.streamCallId;

  const handleTimeout = useCallback(() => {
    ringingAudioRef.current?.stop?.();
    if (callId) {
      api.updateCallStatus(callId, { status: 'MISSED' }).catch(() => {});
      endCallSocket({ targetUserId, callId });
    }
    setCallInProgress(false, null);
    toast.error('Call timed out');
  }, [callId, targetUserId, endCallSocket, setCallInProgress]);

  useEffect(() => {
    handleTimeoutRef.current = handleTimeout;
  }, [handleTimeout]);

  useEffect(() => {
    if (isOutgoing && callInProgress) {
      timeoutInterval.current = setInterval(() => {
        setTimeoutProgress((prev) => {
          const next = prev - (100 / (CALL_TIMEOUT / 100));
          if (next <= 0) {
            handleTimeoutRef.current();
            return 0;
          }
          return next;
        });
      }, 100);

      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = 440;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.08;
        oscillator.start();

        const stopRinging = setTimeout(() => {
          oscillator.stop();
          audioCtx.close();
        }, CALL_TIMEOUT);

        ringingAudioRef.current = { stop: () => { clearTimeout(stopRinging); oscillator.stop(); audioCtx.close(); } } as any;
      } catch {}
    }

    return () => {
      if (timeoutInterval.current) clearInterval(timeoutInterval.current);
      ringingAudioRef.current?.stop?.();
    };
  }, [isOutgoing, callInProgress]);

  useEffect(() => {
    if (isActive && callInProgress) {
      startLocalStream();
      durationInterval.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      stopLocalStream();
      if (durationInterval.current) clearInterval(durationInterval.current);
    };
  }, [isActive, callInProgress]);

  useEffect(() => {
    const handleStartCall = (e: CustomEvent) => {
      const { userId: targetId, type, displayName, avatar } = e.detail;
      setCallInProgress(true, {
        isIncoming: false,
        isOutgoing: true,
        isActive: false,
        targetUserId: targetId,
        callType: type,
        callerName: displayName,
        callerAvatar: avatar,
        startTime: Date.now(),
      });

      api.initiateCall({ receiverId: targetId, type }).then((callLog) => {
        const data = {
          isOutgoing: true,
          isIncoming: false,
          isActive: false,
          targetUserId: targetId,
          callType: type,
          callerName: displayName,
          callerAvatar: avatar,
          callId: callLog.id,
          streamCallId: callLog.streamCallId || callLog.id,
          startTime: Date.now(),
        };
        setCallInProgress(true, data);

        sendCallSignal({
          targetUserId: targetId,
          callType: type,
          callId: callLog.id,
          streamCallId: callLog.streamCallId || callLog.id,
          callerName: user?.fullName || user?.username,
          callerAvatar: user?.imageUrl,
        });
      }).catch(() => {
        setCallInProgress(false, null);
        toast.error('Failed to start call');
      });
    };

    window.addEventListener('startCall', handleStartCall as EventListener);
    return () => window.removeEventListener('startCall', handleStartCall as EventListener);
  }, [sendCallSignal, setCallInProgress, user]);

  const handleAcceptCall = useCallback(async () => {
    if (callId) {
      await api.updateCallStatus(callId, { status: 'CONNECTED' }).catch(() => {});
    }
    ringingAudioRef.current?.stop?.();
    await startLocalStream();

    setCallInProgress(true, {
      ...callData,
      isIncoming: false,
      isOutgoing: false,
      isActive: true,
      startTime: Date.now(),
    });

    acceptCallSocket({
      targetUserId: callData?.callerId,
      callId,
    });
  }, [callData, callId, setCallInProgress, acceptCallSocket, startLocalStream]);

  const handleEndCall = useCallback(async () => {
    ringingAudioRef.current?.stop?.();
    stopLocalStream();

    if (callId) {
      const duration = Math.floor((Date.now() - (callData?.startTime || Date.now())) / 1000);
      api.updateCallStatus(callId, { status: 'COMPLETED', duration }).catch(() => {});
    }

    if (callData?.callerId || targetUserId) {
      endCallSocket({
        targetUserId: callData?.callerId || targetUserId,
        callId,
      });
    }

    setCallInProgress(false, null);
    setCallDuration(0);
    setIsMuted(false);
    setIsSpeaker(false);
  }, [callData, callId, targetUserId, endCallSocket, setCallInProgress, stopLocalStream]);

  const handleRejectCall = useCallback(async () => {
    ringingAudioRef.current?.stop?.();
    if (callId) {
      await api.updateCallStatus(callId, { status: 'REJECTED' }).catch(() => {});
    }
    endCallSocket({ targetUserId: callData?.callerId, callId });
    setCallInProgress(false, null);
  }, [callData, callId, endCallSocket, setCallInProgress]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    mute(next);
  };

  if (!callInProgress) return null;

  const avatarBg = generateAvatarColor(callerName || 'Unknown');

  return (
    <AnimatePresence>
      {!isMinimized ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
        >
          <motion.div
            className="bg-white dark:bg-surface-800 rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
          >
            {isOutgoing && (
              <div className="h-1 bg-surface-200 dark:bg-surface-700">
                <div
                  className="h-full bg-cyber-500 transition-all duration-100 ease-linear"
                  style={{ width: `${timeoutProgress}%` }}
                />
              </div>
            )}

            <div className="p-8 text-center">
              <div className="relative inline-block mb-6">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-medium mx-auto overflow-hidden ring-4"
                  style={{
                    backgroundColor: avatarBg,
                    boxShadow: isOutgoing ? `0 0 0 4px rgba(92, 124, 250, ${timeoutProgress / 100})` : undefined,
                  }}
                >
                  {callerAvatar ? (
                    <img src={callerAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getInitials(callerName || 'U')
                  )}
                </div>
                {isOutgoing && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full animate-ping" />
                )}
              </div>

              <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-1">
                {callerName}
              </h2>
              <p className="text-sm text-surface-500 mb-8">
                {isIncoming ? 'Incoming call...' : isOutgoing ? 'Ringing...' : isActive ? formatDuration(callDuration) : 'Connecting...'}
              </p>

              {isIncoming && (
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={handleRejectCall}
                    className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all active:scale-95 shadow-lg"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleAcceptCall}
                    className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-all active:scale-95 shadow-lg animate-pulse-soft"
                  >
                    <Phone className="w-6 h-6" />
                  </button>
                </div>
              )}

              {isOutgoing && (
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-2 text-surface-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">Calling...</span>
                  </div>
                  <button
                    onClick={handleEndCall}
                    className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center mx-auto transition-all active:scale-95 shadow-lg"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                </div>
              )}

              {isActive && (
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-6">
                    <button
                      onClick={toggleMute}
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95',
                        isMuted
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-500'
                          : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
                      )}
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setIsSpeaker(!isSpeaker)}
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95',
                        isSpeaker
                          ? 'bg-cyber-100 dark:bg-cyber-900/30 text-cyber-500'
                          : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
                      )}
                    >
                      {isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setIsMinimized(true)}
                      className="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 flex items-center justify-center transition-all active:scale-95"
                    >
                      <Minimize2 className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    onClick={handleEndCall}
                    className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center mx-auto transition-all active:scale-95 shadow-lg"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-[100]"
        >
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-700 p-3 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
              style={{ backgroundColor: avatarBg }}
            >
              {callerAvatar ? (
                <img src={callerAvatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                getInitials(callerName || 'U')
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-surface-900 dark:text-white truncate">{callerName}</p>
              <p className="text-[10px] text-surface-500">
                {isActive ? formatDuration(callDuration) : 'On call'}
              </p>
            </div>
            <button
              onClick={() => setIsMinimized(false)}
              className="btn-ghost p-1.5 rounded-lg"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleEndCall}
              className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
            >
              <PhoneOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
