/**
 * Dev-only backend health banner
 * Shows auth status + last sync times for chats/messages/profiles
 * Includes diagnostic actions: Force refresh, Clear cache, Re-init
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, Activity, User, MessageSquare, Users, Database, RefreshCw, Trash2, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';
import { chatStore } from '@/lib/chatStore';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Only show in development
const IS_DEV = import.meta.env.DEV;

interface SyncStatus {
  chats: Date | null;
  messages: Date | null;
  profiles: Date | null;
}

interface LastError {
  message: string;
  timestamp: Date;
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
  const { authState, user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ chats: null, messages: null, profiles: null });
  const [lastError, setLastError] = useState<LastError | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, forceUpdate] = useState({});

  const authStatus = useMemo(() => {
    if (authState === 'loading') return 'checking' as const;
    return user ? ('authenticated' as const) : ('unauthenticated' as const);
  }, [authState, user]);

  const userId = user?.id ?? null;

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
  }, []);

  // Force refresh handler
  const handleForceRefresh = useCallback(async () => {
    if (!userId) {
      toast.error('Not authenticated');
      return;
    }
    
    setIsRefreshing(true);
    setLastError(null);
    
    try {
      const success = await chatStore.forceRefresh();
      if (success) {
        toast.success('Data refreshed successfully');
      } else {
        const error = { message: 'Refresh returned false', timestamp: new Date() };
        setLastError(error);
        toast.error('Refresh failed - check console');
      }
    } catch (err: any) {
      const error = { message: err?.message || 'Unknown error', timestamp: new Date() };
      setLastError(error);
      toast.error(`Refresh error: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  }, [userId]);

  // Clear local cache handler
  const handleClearCache = useCallback(() => {
    chatStore.cleanup();
    toast.success('Local cache cleared');
    setLastError(null);
  }, []);

  // Re-init handler
  const handleReInit = useCallback(async () => {
    if (!userId) {
      toast.error('Not authenticated');
      return;
    }
    
    setIsRefreshing(true);
    setLastError(null);
    
    try {
      chatStore.cleanup();
      const success = await chatStore.initialize(userId);
      if (success) {
        toast.success('Store re-initialized');
      } else {
        const error = { message: 'Re-init returned false', timestamp: new Date() };
        setLastError(error);
        toast.error('Re-init failed');
      }
    } catch (err: any) {
      const error = { message: err?.message || 'Unknown error', timestamp: new Date() };
      setLastError(error);
      toast.error(`Re-init error: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  }, [userId]);

  // Don't render in production
  if (!IS_DEV) return null;

  const authColor = authStatus === 'authenticated' ? 'text-green-400' : 
                    authStatus === 'unauthenticated' ? 'text-red-400' : 'text-yellow-400';
  
  const storeReady = !!userId && chatStore.getCurrentUserId() === userId;
  const storeColor = storeReady ? 'text-green-400' : 'text-yellow-400';
  const hasError = !!lastError;

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
            <span className="text-cyan-400">Lovable Cloud</span>
            <span className={authColor}>
              {authStatus === 'authenticated' ? '● Auth OK' : authStatus === 'unauthenticated' ? '○ No Auth' : '◌ Checking'}
            </span>
            <span className={storeColor}>
              {storeReady ? '● Store Ready' : '◌ Store Init...'}
            </span>
            {hasError && (
              <span className="text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Error
              </span>
            )}
          </div>
          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </button>

        {/* Expanded panel */}
        {isExpanded && (
          <div className="bg-slate-900/98 border-t border-slate-700 px-4 py-3 text-xs font-mono space-y-3">
            {/* Backend Provider */}
            <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
              <CheckCircle className="h-3.5 w-3.5 text-green-400" />
              <span className="text-slate-400">Backend:</span>
              <span className="text-cyan-400 font-semibold">Lovable Cloud</span>
              <span className="text-slate-500">(Managed Supabase)</span>
            </div>

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
            <div className="border-t border-slate-700 pt-2">
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
            <div className="border-t border-slate-700 pt-2 flex gap-6">
              <span className="text-slate-500">
                Cached Chats: <span className="text-slate-300">{chatStore.getChatList().length}</span>
              </span>
              <span className="text-slate-500">
                Cached Profiles: <span className="text-slate-300">{chatStore.getCachedProfileCount()}</span>
              </span>
            </div>

            {/* Last Error */}
            {lastError && (
              <div className="border-t border-slate-700 pt-2">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Last Error ({formatTime(lastError.timestamp)}):</span>
                </div>
                <p className="text-red-300 mt-1 bg-red-900/20 p-2 rounded">
                  {lastError.message}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-t border-slate-700 pt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleForceRefresh}
                disabled={isRefreshing || !userId}
                className="h-7 text-xs bg-slate-800 border-slate-600 hover:bg-slate-700"
              >
                <RefreshCw className={cn("h-3 w-3 mr-1", isRefreshing && "animate-spin")} />
                Force Refresh
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearCache}
                className="h-7 text-xs bg-slate-800 border-slate-600 hover:bg-slate-700"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear Cache
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReInit}
                disabled={isRefreshing || !userId}
                className="h-7 text-xs bg-slate-800 border-slate-600 hover:bg-slate-700"
              >
                <RotateCcw className={cn("h-3 w-3 mr-1", isRefreshing && "animate-spin")} />
                Re-Init Store
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
