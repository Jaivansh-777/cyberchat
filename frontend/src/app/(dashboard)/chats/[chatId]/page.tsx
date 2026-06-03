'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChatStore } from '@/store/chat-store';
import { api } from '@/lib/api';

export default function ChatDetailRedirect() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  const { setActiveChat } = useChatStore();

  useEffect(() => {
    if (!chatId) {
      router.replace('/chats');
      return;
    }
    api.getChat(chatId)
      .then((chat) => {
        setActiveChat(chat);
        router.replace('/chats');
      })
      .catch(() => router.replace('/chats'));
  }, [chatId]);

  return null;
}
