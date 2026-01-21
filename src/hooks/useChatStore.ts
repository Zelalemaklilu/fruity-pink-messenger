/**
 * React hooks for the ChatStore
 * Provides reactive bindings to the in-memory chat store
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { chatStore, Chat, Message, PublicProfile } from '@/lib/chatStore';
import { supabase } from '@/integrations/supabase/client';

// =============================================
// STORE INITIALIZATION
// =============================================

export function useChatStoreInit(): { isReady: boolean; userId: string | null } {
  const [isReady, setIsReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        chatStore.initialize(user.id).then(() => {
          setIsReady(true);
        });
      }
    });

    return () => {
      // Don't cleanup on unmount - store persists across navigation
    };
  }, []);

  return { isReady, userId };
}

// =============================================
// CHAT LIST HOOK
// =============================================

export function useChatList(): {
  chats: Chat[];
  loading: boolean;
  totalUnread: number;
} {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const { isReady } = useChatStoreInit();

  useEffect(() => {
    if (!isReady) return;

    setLoading(false);
    
    const unsubscribe = chatStore.subscribeChatList((newChats) => {
      setChats(newChats);
    });

    return unsubscribe;
  }, [isReady]);

  const totalUnread = chats.reduce((sum, chat) => sum + chatStore.getUnreadCount(chat), 0);

  return { chats, loading, totalUnread };
}

// =============================================
// MESSAGES HOOK
// =============================================

export function useMessages(chatId: string | undefined): {
  messages: Message[];
  loading: boolean;
  sendMessage: (content: string, type?: 'text' | 'image' | 'file' | 'voice', mediaUrl?: string, fileName?: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
} {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { isReady } = useChatStoreInit();

  useEffect(() => {
    if (!isReady || !chatId) {
      setLoading(false);
      return;
    }

    // Load messages (uses cache if available)
    chatStore.loadMessages(chatId).then(() => {
      setLoading(false);
    });

    // Subscribe to updates
    const unsubscribe = chatStore.subscribeToMessages(chatId, (newMessages) => {
      setMessages(newMessages);
    });

    // Mark as read when viewing
    chatStore.markAsRead(chatId);

    return unsubscribe;
  }, [isReady, chatId]);

  const sendMessage = useCallback(async (
    content: string,
    type: 'text' | 'image' | 'file' | 'voice' = 'text',
    mediaUrl?: string,
    fileName?: string
  ): Promise<boolean> => {
    if (!chatId) return false;
    const result = await chatStore.sendMessage(chatId, content, type, mediaUrl, fileName);
    return result !== null;
  }, [chatId]);

  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    if (!chatId) return false;
    return chatStore.deleteMessage(messageId, chatId);
  }, [chatId]);

  return { messages, loading, sendMessage, deleteMessage };
}

// =============================================
// TYPING INDICATOR HOOK
// =============================================

export function useTypingIndicator(chatId: string | undefined): {
  typingUsers: string[];
  setTyping: (isTyping: boolean) => void;
} {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const { isReady } = useChatStoreInit();

  useEffect(() => {
    if (!isReady || !chatId) return;

    const unsubscribe = chatStore.subscribeToTyping(chatId, setTypingUsers);
    return unsubscribe;
  }, [isReady, chatId]);

  const setTyping = useCallback((isTyping: boolean) => {
    if (chatId) {
      chatStore.setTyping(chatId, isTyping);
    }
  }, [chatId]);

  return { typingUsers, setTyping };
}

// =============================================
// PROFILE HOOK
// =============================================

export function useProfile(userId: string | undefined): {
  profile: PublicProfile | null;
  loading: boolean;
} {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { isReady } = useChatStoreInit();

  useEffect(() => {
    if (!isReady || !userId) {
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = chatStore.getCachedProfile(userId);
    if (cached) {
      setProfile(cached);
      setLoading(false);
      return;
    }

    // Fetch from server
    chatStore.getProfile(userId).then((p) => {
      setProfile(p);
      setLoading(false);
    });
  }, [isReady, userId]);

  return { profile, loading };
}

// =============================================
// CHAT INFO HOOK
// =============================================

export function useChatInfo(chatId: string | undefined): {
  chat: Chat | null;
  otherUserId: string | null;
  loading: boolean;
} {
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const { isReady } = useChatStoreInit();

  useEffect(() => {
    if (!isReady || !chatId) {
      setLoading(false);
      return;
    }

    const cachedChat = chatStore.getChat(chatId);
    if (cachedChat) {
      setChat(cachedChat);
      setLoading(false);
    }

    // Subscribe to updates
    const unsubscribe = chatStore.subscribeChatList((chats) => {
      const updated = chats.find(c => c.id === chatId);
      if (updated) {
        setChat(updated);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [isReady, chatId]);

  const otherUserId = chat ? chatStore.getOtherUserId(chat) : null;

  return { chat, otherUserId, loading };
}
