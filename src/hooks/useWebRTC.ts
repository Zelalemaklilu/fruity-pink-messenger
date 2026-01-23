import { useCallback, useRef, useState } from 'react';

export type CallType = 'voice' | 'video';

export interface WebRTCState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionState: RTCPeerConnectionState | null;
  iceConnectionState: RTCIceConnectionState | null;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

export const useWebRTC = () => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  
  const [state, setState] = useState<WebRTCState>({
    localStream: null,
    remoteStream: null,
    connectionState: null,
    iceConnectionState: null,
  });

  const [error, setError] = useState<string | null>(null);

  // Get user media based on call type
  const getUserMedia = useCallback(async (callType: CallType): Promise<MediaStream> => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === 'video',
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setState(prev => ({ ...prev, localStream: stream }));
      return stream;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access media devices';
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        throw new Error(callType === 'video' 
          ? 'Camera and microphone permission denied. Please allow access to make video calls.'
          : 'Microphone permission denied. Please allow access to make voice calls.'
        );
      }
      throw new Error(`Failed to access ${callType === 'video' ? 'camera/microphone' : 'microphone'}: ${errorMessage}`);
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback((
    onIceCandidate: (candidate: RTCIceCandidate) => void,
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void
  ): RTCPeerConnection => {
    // Close existing connection if any
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        remoteStreamRef.current = remoteStream;
        setState(prev => ({ ...prev, remoteStream }));
      }
    };

    // Monitor connection state
    pc.onconnectionstatechange = () => {
      setState(prev => ({ ...prev, connectionState: pc.connectionState }));
      onConnectionStateChange?.(pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      setState(prev => ({ ...prev, iceConnectionState: pc.iceConnectionState }));
    };

    return pc;
  }, []);

  // Add local tracks to peer connection
  const addLocalTracks = useCallback((stream: MediaStream) => {
    if (!peerConnectionRef.current) {
      throw new Error('Peer connection not initialized');
    }
    
    stream.getTracks().forEach(track => {
      peerConnectionRef.current!.addTrack(track, stream);
    });
  }, []);

  // Create offer (caller side)
  const createOffer = useCallback(async (): Promise<RTCSessionDescriptionInit> => {
    if (!peerConnectionRef.current) {
      throw new Error('Peer connection not initialized');
    }

    const offer = await peerConnectionRef.current.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    
    await peerConnectionRef.current.setLocalDescription(offer);
    return offer;
  }, []);

  // Handle incoming offer (receiver side)
  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> => {
    if (!peerConnectionRef.current) {
      throw new Error('Peer connection not initialized');
    }

    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
    
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);
    
    return answer;
  }, []);

  // Handle incoming answer (caller side)
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) {
      throw new Error('Peer connection not initialized');
    }

    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
  }, []);

  // Add ICE candidate
  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) {
      console.warn('Peer connection not ready for ICE candidate');
      return;
    }

    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('Failed to add ICE candidate:', err);
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback((muted: boolean) => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }, []);

  // Toggle camera
  const toggleCamera = useCallback((disabled: boolean) => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !disabled;
      });
    }
  }, []);

  // Cleanup all resources
  const cleanup = useCallback(() => {
    // Stop all local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Stop all remote tracks
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop());
      remoteStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setState({
      localStream: null,
      remoteStream: null,
      connectionState: null,
      iceConnectionState: null,
    });
    
    setError(null);
  }, []);

  return {
    state,
    error,
    setError,
    getUserMedia,
    createPeerConnection,
    addLocalTracks,
    createOffer,
    handleOffer,
    handleAnswer,
    addIceCandidate,
    toggleMute,
    toggleCamera,
    cleanup,
    peerConnection: peerConnectionRef.current,
  };
};
