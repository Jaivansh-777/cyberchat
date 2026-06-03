'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { api } from '@/lib/api';

interface StreamCallContextType {
  apiKey: string | null;
  streamToken: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startLocalStream: () => Promise<void>;
  stopLocalStream: () => void;
  createPeerConnection: () => RTCPeerConnection | null;
  mute: (muted: boolean) => void;
}

const StreamCallContext = createContext<StreamCallContextType>({
  apiKey: null,
  streamToken: null,
  localStream: null,
  remoteStream: null,
  startLocalStream: async () => {},
  stopLocalStream: () => {},
  createPeerConnection: () => null,
  mute: () => {},
});

export function useStreamCall() {
  return useContext(StreamCallContext);
}

export function StreamCallProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [streamToken, setStreamToken] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    api.getCallToken().then((res) => {
      setApiKey(res.apiKey);
      setStreamToken(res.token);
    }).catch(() => {});
  }, [isLoaded, isSignedIn]);

  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setLocalStream(stream);
    } catch (err) {
      console.error('Failed to get audio stream:', err);
    }
  }, []);

  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
  }, []);

  const createPeerConnection = useCallback(() => {
    const servers = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    try {
      return new RTCPeerConnection(servers);
    } catch (err) {
      console.error('Failed to create RTCPeerConnection:', err);
      return null;
    }
  }, []);

  const mute = useCallback((muted: boolean) => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !muted;
      });
    }
  }, []);

  return (
    <StreamCallContext.Provider
      value={{
        apiKey,
        streamToken,
        localStream,
        remoteStream,
        startLocalStream,
        stopLocalStream,
        createPeerConnection,
        mute,
      }}
    >
      {children}
    </StreamCallContext.Provider>
  );
}
