'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useChatStore } from '@/store/chat-store';
import { useUIStore } from '@/store/ui-store';
import { useSession } from '@clerk/nextjs';
import toast from 'react-hot-toast';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_APP_URL || '';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { session, isLoaded } = useSession();
  const {
    addMessage,
    updateMessage,
    addTypingUser,
    removeTypingUser,
    addOnlineUser,
    removeOnlineUser,
  } = useChatStore();
  const { setCallInProgress } = useUIStore();

  useEffect(() => {
    if (!isLoaded || !session) return;

    let destroyed = false;

    const initSocket = async () => {
      const token = await session.getToken();
      if (destroyed) return;

      const socket = io(`${SOCKET_URL}/ws`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        withCredentials: true,
        autoConnect: true,
      });

      socket.on('connect', () => {
        console.log('Socket connected');
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      socket.on('message:new', (message: any) => {
        addMessage(message.chatId, message);
      });

      socket.on('message:status', (data: any) => {
        updateMessage(data.chatId, data.messageId, { status: data.status });
      });

      socket.on('message:deleted', (data: any) => {
        if (data.forEveryone) {
          updateMessage(data.chatId, data.messageId, { isDeleted: true, encryptedContent: undefined });
        }
      });

      socket.on('message:read', (data: any) => {
        updateMessage(data.chatId, data.messageId, { status: 'READ' });
      });

      socket.on('typing:start', (data: any) => {
        addTypingUser({ userId: data.userId, chatId: data.chatId });
      });

      socket.on('typing:stop', (data: any) => {
        removeTypingUser(data.userId, data.chatId);
      });

      socket.on('user:online', (data: any) => {
        addOnlineUser(data.userId);
      });

      socket.on('user:offline', (data: any) => {
        removeOnlineUser(data.userId);
      });

      socket.on('message:reaction', (data: any) => {
        updateMessage(data.chatId, data.messageId, data);
      });

      socket.on('call:incoming', (data: any) => {
        setCallInProgress(true, {
          isIncoming: true,
          callerId: data.fromUserId,
          callType: data.callType || 'VOICE',
          callId: data.callId,
          callerName: data.callerName,
          callerAvatar: data.callerAvatar,
        });
      });

      socket.on('call:accepted', (data: any) => {
        setCallInProgress(true, {
          isIncoming: false,
          isOutgoing: false,
          isActive: true,
          callId: data.callId,
          startTime: Date.now(),
        });
      });

      socket.on('call:ended', (data: any) => {
        setCallInProgress(false, null);
      });

      socket.on('call:missed', (data: any) => {
        setCallInProgress(false, null);
        toast('Missed call', { icon: '📞' });
      });

      socketRef.current = socket;
    };

    initSocket();

    return () => {
      destroyed = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [session, isLoaded]);

  const joinChat = useCallback((chatId: string) => {
    socketRef.current?.emit('chat:join', chatId);
  }, []);

  const leaveChat = useCallback((chatId: string) => {
    socketRef.current?.emit('chat:leave', chatId);
  }, []);

  const sendMessage = useCallback((data: any) => {
    socketRef.current?.emit('message:send', data);
  }, []);

  const startTyping = useCallback((chatId: string) => {
    socketRef.current?.emit('typing:start', { chatId });
  }, []);

  const stopTyping = useCallback((chatId: string) => {
    socketRef.current?.emit('typing:stop', { chatId });
  }, []);

  const markAsRead = useCallback((chatId: string, messageId: string) => {
    socketRef.current?.emit('message:read', { chatId, messageId });
  }, []);

  const sendCallSignal = useCallback((data: any) => {
    socketRef.current?.emit('call:signal', data);
  }, []);

  const acceptCall = useCallback((data: any) => {
    socketRef.current?.emit('call:accept', data);
  }, []);

  const endCall = useCallback((data: any) => {
    socketRef.current?.emit('call:end', data);
  }, []);

  const emitMessageDeleted = useCallback((data: any) => {
    socketRef.current?.emit('message:deleted', data);
  }, []);

  const emitMessageStatus = useCallback((data: any) => {
    socketRef.current?.emit('message:status', data);
  }, []);

  return {
    getSocket: () => socketRef.current,
    joinChat,
    leaveChat,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    sendCallSignal,
    acceptCall,
    endCall,
    emitMessageDeleted,
    emitMessageStatus,
  };
}
