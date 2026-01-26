/**
 * React hooks for the ChatStore
 * Provides reactive bindings to the in-memory chat store
 * Optimized for instant navigation (Telegram-grade speed)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { chatStore, Chat, Message, PublicProfile } from '@/lib/chatStore';
import { supabase } from '@/integrations/supabase/client';
import { getSessionUserSafe } from '@/lib/authSession';

// =============================================
// GLOBAL INITIALIZATION STATE
// =============================================

let globalInitPromise: Promise<void> | null = null;
let globalUserId: string | null = null;
let globalIsReady = false;
let initStarted = false;
const readyListeners = new Set<() => void>();

const INIT_MAX_WAIT_MS = 12_000;
const INIT_RETRY_INTERVAL_MS = 400;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const notifyReadyListeners = () => {
  readyListeners.forEach(listener => listener());
};

const isAbortError = (err: unknown): boolean => {
  const e = err as any;
  const msg = String(e?.message ?? '');
  return (
    e?.name === 'AbortError' ||
    msg.includes('aborted') ||
    msg.includes('signal is aborted')
  );
};

const initializeStore = async (): Promise<void> => {
  if (globalIsReady) return;

  const startedAt = Date.now();

  while (!globalIsReady && (Date.now() - startedAt) < INIT_MAX_WAIT_MS) {
    try {
      // Use deduplicated auth helper to avoid lock contention / AbortError
      const { user } = await getSessionUserSafe({ maxAgeMs: 0, maxAbortRetries: 3 });

      if (user) {
        if (user.id !== globalUserId) {
          globalUserId = user.id;
        }

        // initialize() returns boolean indicating success
        const success = await chatStore.initialize(user.id);
        
        if (success) {
          globalIsReady = true;
          notifyReadyListeners();
          return;
        } else {
          // loadChats failed - wait and retry
          console.warn('[useChatStore] initialize returned false, retrying...');
          await sleep(INIT_RETRY_INTERVAL_MS);
          continue;
        }
      }
    } catch (error: unknown) {
      // Retry on AbortError - happens during rapid navigation / token refresh
      if (isAbortError(error)) {
        await sleep(INIT_RETRY_INTERVAL_MS);
        continue;
      }
      console.error('[useChatStore] Init error:', error);
    }

    // No user yet (race immediately after login). Wait and retry.
    await sleep(INIT_RETRY_INTERVAL_MS);
  }

  // Timed out - still mark as ready so UI doesn't stay stuck on spinner forever
  // User can manually refresh or the Chats page will trigger a retry
  console.warn('[useChatStore] Init timed out after', INIT_MAX_WAIT_MS, 'ms');
  if (globalUserId) {
    globalIsReady = true;
  }
  notifyReadyListeners();
};

// Subscribe to auth changes globally
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    globalUserId = null;
    globalIsReady = false;
    initStarted = false;
    globalInitPromise = null;
    chatStore.cleanup();
    notifyReadyListeners();
  } else if (session?.user) {
    // Always kick init on sign-in/refresh; it is idempotent and handles retries.
    globalUserId = session.user.id;
    globalIsReady = false;
    initStarted = true;
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
    
    // Ensure initialization starts (and can be retried if a prior attempt timed out)
    if (!globalInitPromise && !globalIsReady) {
      initStarted = true;
      globalInitPromise = initializeStore().finally(() => {
        // Allow future retries if we still didn't become ready (e.g. session arrived late)
        if (!globalIsReady) {
          initStarted = false;
          globalInitPromise = null;
        }
      });
    } else if (globalInitPromise) {
      globalInitPromise.then(() => forceUpdate({})).catch(() => {});
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
  forceRefresh: () => Promise<void>;
} {
  const [chats, setChats] = useState<Chat[]>(() => chatStore.getChatList());
  const [loading, setLoading] = useState(true);
  const { isReady, userId } = useChatStoreInit();
  const refreshAttempted = useRef(false);

  useEffect(() => {
    // Subscribe to updates first
    const unsubscribe = chatStore.subscribeChatList((newChats) => {
      setChats(newChats);
      setLoading(false);
    });

    // When ready, immediately fetch data
    if (isReady) {
      const cached = chatStore.getChatList();
      setChats(cached);
      setLoading(false);
      
      // If no chats but we have a user, try force refresh once
      if (cached.length === 0 && userId && !refreshAttempted.current) {
        refreshAttempted.current = true;
        console.log('[useChatList] No cached chats, forcing refresh...');
        chatStore.forceRefresh().then(() => {
          const refreshed = chatStore.getChatList();
          setChats(refreshed);
        });
      }
    }

    // Also handle the case where init completes after mount
    if (globalInitPromise) {
      globalInitPromise.then(() => {
        const cached = chatStore.getChatList();
        setChats(cached);
        setLoading(false);
      }).catch(() => {});
    }

    return unsubscribe;
  }, [isReady, userId]);

  const totalUnread = chats.reduce((sum, chat) => sum + chatStore.getUnreadCount(chat), 0);

  const forceRefresh = useCallback(async () => {
    setLoading(true);
    await chatStore.forceRefresh();
    const refreshed = chatStore.getChatList();
    setChats(refreshed);
    setLoading(false);
  }, []);

  return { chats, loading, totalUnread, forceRefresh };
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
  const [loading, setLoading] = useState(true);
  
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
      chatStore.markAsRead(chatId);
    }

    // Handle initialization completing after mount
    if (globalInitPromise) {
      globalInitPromise.then(() => {
        chatStore.loadMessages(chatId).then(() => {
          setLoading(false);
        });
        chatStore.markAsRead(chatId);
      }).catch(() => {});
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
  const [loading, setLoading] = useState(true);
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

    // Handle initialization completing after mount
    if (globalInitPromise) {
      globalInitPromise.then(() => {
        chatStore.getProfile(userId).then((p) => {
          setProfile(p);
          setLoading(false);
        });
      }).catch(() => {});
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
