import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useCallManager, CallState, ActiveCall } from '@/hooks/useCallManager';
import { CallType } from '@/hooks/useWebRTC';
import { supabase } from '@/integrations/supabase/client';
import { getSessionUserSafe } from '@/lib/authSession';

interface CallContextType {
  // State
  callState: CallState;
  activeCall: ActiveCall | null;
  callDuration: number;
  isMuted: boolean;
  isCameraOff: boolean;
  errorMessage: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionState: RTCPeerConnectionState | null;
  isReady: boolean;

  // Actions
  startCall: (peerId: string, peerName: string, callType: CallType, peerAvatar?: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  resetCall: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

export const useCall = (): CallContextType => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

interface CallProviderProps {
  children: ReactNode;
}

export const CallProvider: React.FC<CallProviderProps> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('User');
  const [userAvatar, setUserAvatar] = useState<string | undefined>();
  const [isReady, setIsReady] = useState(false);

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      const { user } = await getSessionUserSafe({ maxAgeMs: 0 });
      if (user) {
        setUserId(user.id);
        
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          setUserName(profile.name || 'User');
          setUserAvatar(profile.avatar_url || undefined);
        }
        
        setIsReady(true);
      }
    };

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUserName(profile.name || 'User');
          setUserAvatar(profile.avatar_url || undefined);
        }
        
        setIsReady(true);
      } else {
        setUserId(null);
        setIsReady(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const callManager = useCallManager({
    userId,
    userName,
    userAvatar,
  });

  const value: CallContextType = {
    ...callManager,
    isReady,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
};
