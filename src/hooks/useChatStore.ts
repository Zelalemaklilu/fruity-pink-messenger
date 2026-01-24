/**
 * React hooks for the ChatStore
 * Provides reactive bindings to the in-memory chat store
 * Optimized for instant navigation (Telegram-grade speed)
 */

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import { chatStore, Chat, Message, PublicProfile } from '@/lib/chatStore';
import { supabase } from '@/integrations/supabase/client';

// =============================================
// GLOBAL INITIALIZATION STATE
// =============================================

let globalInitPromise: Promise<void> | null = null;
let globalUserId: string | null = null;
let globalIsReady = false;
const readyListeners = new Set<() => void>();

const notifyReadyListeners = () => {
  readyListeners.forEach(listener => listener());
};

const initializeStore = async (): Promise<void> => {
  if (globalIsReady) return;
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id !== globalUserId) {
      globalUserId = user.id;
      await chatStore.initialize(user.id);
      globalIsReady = true;
      notifyReadyListeners();
    } else if (user && user.id === globalUserId) {
      globalIsReady = true;
      notifyReadyListeners();
    }
  } catch (error: any) {
    // Silently ignore AbortError - happens during rapid navigation
    if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
      return;
    }
    console.error('[useChatStore] Init error:', error);
  }
};

// Subscribe to auth changes globally
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    globalUserId = null;
    globalIsReady = false;
    chatStore.cleanup();
    notifyReadyListeners();
  } else if (session?.user && session.user.id !== globalUserId) {
    globalUserId = session.user.id;
    globalIsReady = false;
    globalInitPromise = initializeStore();
  }
});

// =============================================
// STORE INITIALIZATION HOOK
// =============================================

export function useChatStoreInit(): { isReady: boolean; userId: string | null } {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    const listener = () => forceUpdate({});
    readyListeners.add(listener);
    
    // Start initialization if not already started
    if (!globalInitPromise && !globalIsReady) {
      globalInitPromise = initializeStore();
    }
    
    return () => {
      readyListeners.delete(listener);
    };
  }, []);

  return { isReady: globalIsReady, userId: globalUserId };
}

// =============================================
// CHAT LIST HOOK - INSTANT FROM CACHE
// =============================================

export function useChatList(): {
  chats: Chat[];
  loading: boolean;
  totalUnread: number;
} {
  const [chats, setChats] = useState<Chat[]>(() => chatStore.getChatList());
  const [loading, setLoading] = useState(!globalIsReady);
  const { isReady } = useChatStoreInit();

  useEffect(() => {
    if (isReady) {
      setLoading(false);
      // Get initial data from cache immediately
      setChats(chatStore.getChatList());
    }
    
    const unsubscribe = chatStore.subscribeChatList((newChats) => {
      setChats(newChats);
      setLoading(false);
    });

    return unsubscribe;
  }, [isReady]);

  const totalUnread = chats.reduce((sum, chat) => sum + chatStore.getUnreadCount(chat), 0);

  return { chats, loading, totalUnread };
}

// =============================================
// MESSAGES HOOK - SHOW CACHED INSTANTLY
// =============================================

export function useMessages(chatId: string | undefined): {
  messages: Message[];
  loading: boolean;
  sendMessage: (content: string, type?: 'text' | 'image' | 'file' | 'voice', mediaUrl?: string, fileName?: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
} {
  // Get cached messages immediately (no async)
  const [messages, setMessages] = useState<Message[]>(() => {
    if (chatId) {
      return chatStore.getMessages(chatId);
    }
    return [];
  });
  
  // Only show loading if no cached messages exist
  const [loading, setLoading] = useState(() => {
    if (!chatId) return false;
    const cached = chatStore.getMessages(chatId);
    return cached.length === 0 && !globalIsReady;
  });
  
  const { isReady } = useChatStoreInit();

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // Show cached immediately
    const cached = chatStore.getMessages(chatId);
    if (cached.length > 0) {
      setMessages(cached);
      setLoading(false);
    }

    // Subscribe to updates (will get cache immediately too)
    const unsubscribe = chatStore.subscribeToMessages(chatId, (newMessages) => {
      setMessages(newMessages);
      setLoading(false);
    });

    // Load from server in background (only if ready)
    if (isReady) {
      chatStore.loadMessages(chatId).then(() => {
        setLoading(false);
      });
    }

    // Mark as read when viewing
    if (isReady) {
      chatStore.markAsRead(chatId);
    }

    return unsubscribe;
  }, [chatId, isReady]);

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
// PROFILE HOOK - INSTANT FROM CACHE
// =============================================

export function useProfile(userId: string | undefined): {
  profile: PublicProfile | null;
  loading: boolean;
} {
  const [profile, setProfile] = useState<PublicProfile | null>(() => {
    if (userId) {
      return chatStore.getCachedProfile(userId) || null;
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (!userId) return false;
    return !chatStore.getCachedProfile(userId);
  });
  const { isReady } = useChatStoreInit();

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // Check cache first (instant)
    const cached = chatStore.getCachedProfile(userId);
    if (cached) {
      setProfile(cached);
      setLoading(false);
      return;
    }

    // Fetch from server only if ready
    if (isReady) {
      chatStore.getProfile(userId).then((p) => {
        setProfile(p);
        setLoading(false);
      });
    }
  }, [isReady, userId]);

  return { profile, loading };
}

// =============================================
// CHAT INFO HOOK - INSTANT FROM CACHE
// =============================================

export function useChatInfo(chatId: string | undefined): {
  chat: Chat | null;
  otherUserId: string | null;
  loading: boolean;
} {
  const [chat, setChat] = useState<Chat | null>(() => {
    if (chatId) {
      return chatStore.getChat(chatId) || null;
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (!chatId) return false;
    return !chatStore.getChat(chatId);
  });
  const { isReady } = useChatStoreInit();

  useEffect(() => {
    if (!chatId) {
      setChat(null);
      setLoading(false);
      return;
    }

    // Get from cache immediately (instant)
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
      } else if (isReady && !cachedChat) {
        // Chat not found after ready
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [chatId, isReady]);

  const otherUserId = chat ? chatStore.getOtherUserId(chat) : null;

  return { chat, otherUserId, loading };
}
