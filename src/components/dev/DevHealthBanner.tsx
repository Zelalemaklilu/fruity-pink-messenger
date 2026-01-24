/**
 * Dev-only backend health banner
 * Shows auth status + last sync times for chats/messages/profiles
 */

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Activity, User, MessageSquare, Users, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useChatStoreInit } from '@/hooks/useChatStore';
import { chatStore } from '@/lib/chatStore';
import { cn } from '@/lib/utils';

// Only show in development
const IS_DEV = import.meta.env.DEV;

interface SyncStatus {
  chats: Date | null;
  messages: Date | null;
  profiles: Date | null;
}

const formatTime = (date: Date | null): string => {
  if (!date) return 'Never';
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diff < 5) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return date.toLocaleTimeString();
};

export function DevHealthBanner() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const [userId, setUserId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ chats: null, messages: null, profiles: null });
  const [, forceUpdate] = useState({});
  
  const { isReady } = useChatStoreInit();

  // Check auth status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setAuthStatus('authenticated');
        setUserId(session.user.id);
      } else {
        setAuthStatus('unauthenticated');
        setUserId(null);
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setAuthStatus('authenticated');
        setUserId(session.user.id);
      } else {
        setAuthStatus('unauthenticated');
        setUserId(null);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Track sync status from chatStore
  useEffect(() => {
    const updateSyncStatus = () => {
      setSyncStatus({
        chats: chatStore.getLastSyncTime('chats'),
        messages: chatStore.getLastSyncTime('messages'),
        profiles: chatStore.getLastSyncTime('profiles'),
      });
    };
    
    // Initial check
    updateSyncStatus();
    
    // Poll every 2 seconds for updates
    const interval = setInterval(() => {
      updateSyncStatus();
      forceUpdate({});
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isReady]);

  // Don't render in production
  if (!IS_DEV) return null;

  const authColor = authStatus === 'authenticated' ? 'text-green-400' : 
                    authStatus === 'unauthenticated' ? 'text-red-400' : 'text-yellow-400';
  
  const storeReady = isReady;
  const storeColor = storeReady ? 'text-green-400' : 'text-yellow-400';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] pointer-events-none">
      <div className="pointer-events-auto">
        {/* Collapsed bar */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-1.5 text-xs font-mono",
            "bg-slate-900/95 border-t border-slate-700 text-slate-300",
            "hover:bg-slate-800/95 transition-colors"
          )}
        >
          <div className="flex items-center gap-3">
            <Activity className="h-3 w-3 text-primary" />
            <span className="text-slate-500">DEV</span>
            <span className={authColor}>
              {authStatus === 'authenticated' ? '● Auth OK' : authStatus === 'unauthenticated' ? '○ No Auth' : '◌ Checking'}
            </span>
            <span className={storeColor}>
              {storeReady ? '● Store Ready' : '◌ Store Init...'}
            </span>
          </div>
          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </button>

        {/* Expanded panel */}
        {isExpanded && (
          <div className="bg-slate-900/98 border-t border-slate-700 px-4 py-3 text-xs font-mono space-y-2">
            {/* Auth Section */}
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-slate-400 w-16">Auth:</span>
              <span className={authColor}>{authStatus}</span>
              {userId && (
                <span className="text-slate-500 ml-2">
                  [{userId.slice(0, 8)}...]
                </span>
              )}
            </div>

            {/* Store Section */}
            <div className="flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-slate-400 w-16">Store:</span>
              <span className={storeColor}>{storeReady ? 'Ready' : 'Initializing'}</span>
              <span className="text-slate-500 ml-2">
                [User: {chatStore.getCurrentUserId()?.slice(0, 8) || 'none'}]
              </span>
            </div>

            {/* Sync Times */}
            <div className="border-t border-slate-700 pt-2 mt-2">
              <div className="text-slate-500 mb-1">Last Sync:</div>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3 text-green-400" />
                  <span className="text-slate-400">Chats:</span>
                  <span className={syncStatus.chats ? 'text-green-400' : 'text-slate-500'}>
                    {formatTime(syncStatus.chats)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3 text-blue-400" />
                  <span className="text-slate-400">Msgs:</span>
                  <span className={syncStatus.messages ? 'text-blue-400' : 'text-slate-500'}>
                    {formatTime(syncStatus.messages)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3 w-3 text-yellow-400" />
                  <span className="text-slate-400">Profiles:</span>
                  <span className={syncStatus.profiles ? 'text-yellow-400' : 'text-slate-500'}>
                    {formatTime(syncStatus.profiles)}
                  </span>
                </div>
              </div>
            </div>

            {/* Cache Stats */}
            <div className="border-t border-slate-700 pt-2 mt-2 flex gap-6">
              <span className="text-slate-500">
                Cached Chats: <span className="text-slate-300">{chatStore.getChatList().length}</span>
              </span>
              <span className="text-slate-500">
                Cached Profiles: <span className="text-slate-300">{chatStore.getCachedProfileCount()}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
