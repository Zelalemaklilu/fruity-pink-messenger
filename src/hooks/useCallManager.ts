import { useState, useCallback, useRef, useEffect } from 'react';
import { useWebRTC, CallType } from './useWebRTC';
import { useCallSignaling, CallOffer, CallAnswer, IceCandidate, CallStateEvent } from './useCallSignaling';
import { callLogService } from '@/lib/callLogService';
import { pushNotificationService } from '@/lib/pushNotificationService';

export type CallState = 
  | 'idle'
  | 'outgoing_calling'
  | 'incoming_ringing'
  | 'connecting'
  | 'in_call'
  | 'call_ended'
  | 'call_failed'
  | 'rejected'
  | 'missed';

export interface ActiveCall {
  roomId: string;
  peerId: string;
  peerName: string;
  peerAvatar?: string;
  callType: CallType;
  isOutgoing: boolean;
  startTime?: Date;
  callLogId?: string; // Database call log ID
}

interface UseCallManagerProps {
  userId: string | null;
  userName: string;
  userAvatar?: string;
}

const CALL_TIMEOUT_MS = 60000; // 60 seconds

export const useCallManager = ({ userId, userName, userAvatar }: UseCallManagerProps) => {
  const [callState, setCallState] = useState<CallState>('idle');
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const pendingOfferRef = useRef<CallOffer | null>(null);

  const webRTC = useWebRTC();
  const signaling = useCallSignaling(userId);

  // Clear call timeout
  const clearCallTimeout = useCallback(() => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
  }, []);

  // Start call duration timer
  const startDurationTimer = useCallback(() => {
    setCallDuration(0);
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  }, []);

  // Stop duration timer
  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  // Reset call state
  const resetCall = useCallback(() => {
    clearCallTimeout();
    stopDurationTimer();
    webRTC.cleanup();
    setCallState('idle');
    setActiveCall(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsCameraOff(false);
    setErrorMessage(null);
    iceCandidatesQueue.current = [];
    pendingOfferRef.current = null;
  }, [clearCallTimeout, stopDurationTimer, webRTC]);

  // Handle connection state changes
  const handleConnectionStateChange = useCallback((state: RTCPeerConnectionState) => {
    console.log('[CallManager] Connection state:', state);
    
    switch (state) {
      case 'connected':
        setCallState('in_call');
        setActiveCall(prev => prev ? { ...prev, startTime: new Date() } : null);
        startDurationTimer();
        clearCallTimeout();
        break;
      case 'disconnected':
      case 'failed':
        setCallState('call_failed');
        setErrorMessage('Connection lost');
        break;
      case 'closed':
        if (callState === 'in_call') {
          setCallState('call_ended');
        }
        break;
    }
  }, [callState, startDurationTimer, clearCallTimeout]);

  // Handle ICE candidate
  const handleIceCandidate = useCallback((candidate: RTCIceCandidate) => {
    if (!activeCall) return;
    
    signaling.sendIceCandidate(activeCall.peerId, candidate.toJSON(), activeCall.roomId);
  }, [activeCall, signaling]);

  // Start outgoing call
  const startCall = useCallback(async (
    peerId: string,
    peerName: string,
    callType: CallType,
    peerAvatar?: string
  ) => {
    if (!userId) {
      setErrorMessage('Not authenticated');
      return;
    }

    if (callState !== 'idle') {
      setErrorMessage('Already in a call');
      return;
    }

    try {
      setCallState('outgoing_calling');
      setErrorMessage(null);

      // Get user media
      const localStream = await webRTC.getUserMedia(callType);

      // Create peer connection
      webRTC.createPeerConnection(handleIceCandidate, handleConnectionStateChange);

      // Add local tracks
      webRTC.addLocalTracks(localStream);

      // Create offer
      const offer = await webRTC.createOffer();

      // Send offer via signaling
      const roomId = await signaling.sendOffer(
        peerId,
        offer,
        callType,
        userName,
        userAvatar
      );

      // Create call log in database
      const callLogId = await callLogService.createCallLog({
        callerId: userId,
        receiverId: peerId,
        callType,
        roomId,
      });

      setActiveCall({
        roomId,
        peerId,
        peerName,
        peerAvatar,
        callType,
        isOutgoing: true,
        callLogId: callLogId || undefined,
      });

      // Set call timeout
      callTimeoutRef.current = setTimeout(() => {
        setCallState(currentState => {
          if (currentState === 'outgoing_calling') {
            signaling.sendCallState(peerId, 'timeout', roomId);
            setErrorMessage('Call timed out - no answer');
            setTimeout(resetCall, 3000);
            return 'call_failed';
          }
          return currentState;
        });
      }, CALL_TIMEOUT_MS);

    } catch (err) {
      console.error('[CallManager] Start call error:', err);
      setCallState('call_failed');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to start call');
      webRTC.cleanup();
    }
  }, [userId, userName, userAvatar, callState, webRTC, signaling, handleIceCandidate, handleConnectionStateChange, resetCall]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    const incomingCall = pendingOfferRef.current;
    if (!incomingCall || !userId) return;

    try {
      setCallState('connecting');
      setErrorMessage(null);

      // Get user media based on call type
      const localStream = await webRTC.getUserMedia(incomingCall.callType);

      // Create peer connection
      webRTC.createPeerConnection(handleIceCandidate, handleConnectionStateChange);

      // Add local tracks
      webRTC.addLocalTracks(localStream);

      // Handle the offer and create answer
      const answer = await webRTC.handleOffer(incomingCall.offer);

      // Send answer
      await signaling.sendAnswer(incomingCall.callerId, answer, incomingCall.roomId);

      setActiveCall({
        roomId: incomingCall.roomId,
        peerId: incomingCall.callerId,
        peerName: incomingCall.callerName,
        peerAvatar: incomingCall.callerAvatar,
        callType: incomingCall.callType,
        isOutgoing: false,
      });

      // Process queued ICE candidates
      for (const candidate of iceCandidatesQueue.current) {
        await webRTC.addIceCandidate(candidate);
      }
      iceCandidatesQueue.current = [];

      pendingOfferRef.current = null;

    } catch (err) {
      console.error('[CallManager] Accept call error:', err);
      setCallState('call_failed');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to accept call');
      webRTC.cleanup();
    }
  }, [userId, webRTC, signaling, handleIceCandidate, handleConnectionStateChange]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    const incomingCall = pendingOfferRef.current;
    if (!incomingCall) return;

    signaling.sendCallState(incomingCall.callerId, 'rejected', incomingCall.roomId);
    pendingOfferRef.current = null;
    resetCall();
  }, [signaling, resetCall]);

  // End current call
  const endCall = useCallback(async () => {
    if (activeCall) {
      signaling.sendCallState(activeCall.peerId, 'ended', activeCall.roomId);
      
      // Update call log with completion status
      if (activeCall.callLogId) {
        await callLogService.updateCallLog(
          activeCall.callLogId,
          'completed',
          callDuration
        );
      }
      
      // Close any call notification
      pushNotificationService.closeCallNotification();
    }
    
    setCallState('call_ended');
    setTimeout(resetCall, 2000);
  }, [activeCall, signaling, resetCall, callDuration]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    webRTC.toggleMute(newMuted);
  }, [isMuted, webRTC]);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    const newCameraOff = !isCameraOff;
    setIsCameraOff(newCameraOff);
    webRTC.toggleCamera(newCameraOff);
  }, [isCameraOff, webRTC]);

  // Handle incoming call offer
  const handleIncomingCall = useCallback((offer: CallOffer) => {
    console.log('[CallManager] Incoming call:', offer);

    // If already in a call, send busy signal
    if (callState !== 'idle') {
      signaling.sendCallState(offer.callerId, 'busy', offer.roomId);
      return;
    }

    pendingOfferRef.current = offer;
    setActiveCall({
      roomId: offer.roomId,
      peerId: offer.callerId,
      peerName: offer.callerName,
      peerAvatar: offer.callerAvatar,
      callType: offer.callType,
      isOutgoing: false,
    });
    setCallState('incoming_ringing');

    // Show push notification for incoming call
    pushNotificationService.showIncomingCallNotification(offer.callerName, offer.callType);

    // Set missed call timeout
    callTimeoutRef.current = setTimeout(() => {
      setCallState(currentState => {
        if (currentState === 'incoming_ringing') {
          signaling.sendCallState(offer.callerId, 'timeout', offer.roomId);
          pushNotificationService.closeCallNotification();
          setTimeout(resetCall, 3000);
          return 'missed';
        }
        return currentState;
      });
    }, CALL_TIMEOUT_MS);
  }, [callState, signaling, resetCall]);

  // Handle call answer
  const handleCallAnswer = useCallback(async (answer: CallAnswer) => {
    console.log('[CallManager] Received answer');

    if (callState !== 'outgoing_calling') return;

    try {
      setCallState('connecting');
      await webRTC.handleAnswer(answer.answer);

      // Process queued ICE candidates
      for (const candidate of iceCandidatesQueue.current) {
        await webRTC.addIceCandidate(candidate);
      }
      iceCandidatesQueue.current = [];

    } catch (err) {
      console.error('[CallManager] Handle answer error:', err);
      setCallState('call_failed');
      setErrorMessage('Failed to connect');
    }
  }, [callState, webRTC]);

  // Handle received ICE candidate
  const handleReceivedIceCandidate = useCallback(async (data: IceCandidate) => {
    if (!activeCall || data.roomId !== activeCall.roomId) return;

    // If peer connection not ready, queue the candidate
    if (!webRTC.peerConnection || webRTC.peerConnection.remoteDescription === null) {
      iceCandidatesQueue.current.push(data.candidate);
      return;
    }

    await webRTC.addIceCandidate(data.candidate);
  }, [activeCall, webRTC]);

  // Handle call state events
  const handleCallStateEvent = useCallback((event: CallStateEvent) => {
    console.log('[CallManager] Call state event:', event);

    if (activeCall && event.roomId !== activeCall.roomId) return;

    switch (event.type) {
      case 'rejected':
        setCallState('rejected');
        setErrorMessage('Call was rejected');
        setTimeout(resetCall, 3000);
        break;
      case 'ended':
        setCallState('call_ended');
        setTimeout(resetCall, 2000);
        break;
      case 'busy':
        setCallState('call_failed');
        setErrorMessage('User is busy');
        setTimeout(resetCall, 3000);
        break;
      case 'timeout':
        setCallState('missed');
        setTimeout(resetCall, 3000);
        break;
    }
  }, [activeCall, resetCall]);

  // Subscribe to signaling
  useEffect(() => {
    if (!userId) return;

    signaling.subscribeToSignaling({
      onIncomingCall: handleIncomingCall,
      onCallAnswer: handleCallAnswer,
      onIceCandidate: handleReceivedIceCandidate,
      onCallStateChange: handleCallStateEvent,
    });

    return () => {
      signaling.cleanup();
    };
  }, [userId, signaling, handleIncomingCall, handleCallAnswer, handleReceivedIceCandidate, handleCallStateEvent]);

  // Cleanup on unmount - use empty deps to run only on unmount
  useEffect(() => {
    return () => {
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, []);

  return {
    // State
    callState,
    activeCall,
    callDuration,
    isMuted,
    isCameraOff,
    errorMessage,
    localStream: webRTC.state.localStream,
    remoteStream: webRTC.state.remoteStream,
    connectionState: webRTC.state.connectionState,

    // Actions
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    resetCall,
  };
};
