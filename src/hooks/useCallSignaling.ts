import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { CallType } from './useWebRTC';

export interface CallOffer {
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  callType: CallType;
  offer: RTCSessionDescriptionInit;
  roomId: string;
}

export interface CallAnswer {
  answer: RTCSessionDescriptionInit;
  roomId: string;
}

export interface IceCandidate {
  candidate: RTCIceCandidateInit;
  senderId: string;
  roomId: string;
}

export interface CallStateEvent {
  type: 'rejected' | 'ended' | 'busy' | 'timeout';
  roomId: string;
  senderId: string;
}

interface SignalingCallbacks {
  onIncomingCall?: (offer: CallOffer) => void;
  onCallAnswer?: (answer: CallAnswer) => void;
  onIceCandidate?: (candidate: IceCandidate) => void;
  onCallStateChange?: (event: CallStateEvent) => void;
}

export const useCallSignaling = (userId: string | null) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbacksRef = useRef<SignalingCallbacks>({});

  // Generate unique room ID for a call between two users
  const generateRoomId = useCallback((user1: string, user2: string): string => {
    const sorted = [user1, user2].sort();
    return `call_${sorted[0]}_${sorted[1]}_${Date.now()}`;
  }, []);

  // Subscribe to signaling channel
  const subscribeToSignaling = useCallback((callbacks: SignalingCallbacks) => {
    if (!userId) return;

    callbacksRef.current = callbacks;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`calls:${userId}`, {
      config: { broadcast: { self: false } }
    });

    channel
      .on('broadcast', { event: 'call_offer' }, ({ payload }) => {
        console.log('[Signaling] Received call offer:', payload);
        callbacksRef.current.onIncomingCall?.(payload as CallOffer);
      })
      .on('broadcast', { event: 'call_answer' }, ({ payload }) => {
        console.log('[Signaling] Received call answer:', payload);
        callbacksRef.current.onCallAnswer?.(payload as CallAnswer);
      })
      .on('broadcast', { event: 'ice_candidate' }, ({ payload }) => {
        console.log('[Signaling] Received ICE candidate');
        callbacksRef.current.onIceCandidate?.(payload as IceCandidate);
      })
      .on('broadcast', { event: 'call_state' }, ({ payload }) => {
        console.log('[Signaling] Received call state:', payload);
        callbacksRef.current.onCallStateChange?.(payload as CallStateEvent);
      })
      .subscribe((status) => {
        console.log('[Signaling] Channel status:', status);
      });

    channelRef.current = channel;
  }, [userId]);

  // Send call offer to receiver
  const sendOffer = useCallback(async (
    receiverId: string,
    offer: RTCSessionDescriptionInit,
    callType: CallType,
    callerName: string,
    callerAvatar?: string,
    roomId?: string
  ): Promise<string> => {
    if (!userId) throw new Error('User not authenticated');

    const finalRoomId = roomId || generateRoomId(userId, receiverId);

    // Send to receiver's channel
    const receiverChannel = supabase.channel(`calls:${receiverId}`, {
      config: { broadcast: { self: false } }
    });

    await receiverChannel.subscribe();

    await receiverChannel.send({
      type: 'broadcast',
      event: 'call_offer',
      payload: {
        callerId: userId,
        callerName,
        callerAvatar,
        callType,
        offer,
        roomId: finalRoomId,
      } as CallOffer,
    });

    // Cleanup temporary channel after sending
    setTimeout(() => {
      supabase.removeChannel(receiverChannel);
    }, 1000);

    return finalRoomId;
  }, [userId, generateRoomId]);

  // Send call answer to caller
  const sendAnswer = useCallback(async (
    callerId: string,
    answer: RTCSessionDescriptionInit,
    roomId: string
  ) => {
    if (!userId) throw new Error('User not authenticated');

    const callerChannel = supabase.channel(`calls:${callerId}`, {
      config: { broadcast: { self: false } }
    });

    await callerChannel.subscribe();

    await callerChannel.send({
      type: 'broadcast',
      event: 'call_answer',
      payload: {
        answer,
        roomId,
      } as CallAnswer,
    });

    setTimeout(() => {
      supabase.removeChannel(callerChannel);
    }, 1000);
  }, [userId]);

  // Send ICE candidate
  const sendIceCandidate = useCallback(async (
    targetId: string,
    candidate: RTCIceCandidateInit,
    roomId: string
  ) => {
    if (!userId) throw new Error('User not authenticated');

    const targetChannel = supabase.channel(`calls:${targetId}`, {
      config: { broadcast: { self: false } }
    });

    await targetChannel.subscribe();

    await targetChannel.send({
      type: 'broadcast',
      event: 'ice_candidate',
      payload: {
        candidate,
        senderId: userId,
        roomId,
      } as IceCandidate,
    });

    setTimeout(() => {
      supabase.removeChannel(targetChannel);
    }, 500);
  }, [userId]);

  // Send call state event (rejected, ended, etc.)
  const sendCallState = useCallback(async (
    targetId: string,
    type: CallStateEvent['type'],
    roomId: string
  ) => {
    if (!userId) throw new Error('User not authenticated');

    const targetChannel = supabase.channel(`calls:${targetId}`, {
      config: { broadcast: { self: false } }
    });

    await targetChannel.subscribe();

    await targetChannel.send({
      type: 'broadcast',
      event: 'call_state',
      payload: {
        type,
        roomId,
        senderId: userId,
      } as CallStateEvent,
    });

    setTimeout(() => {
      supabase.removeChannel(targetChannel);
    }, 1000);
  }, [userId]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    callbacksRef.current = {};
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    subscribeToSignaling,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    sendCallState,
    cleanup,
  };
};
