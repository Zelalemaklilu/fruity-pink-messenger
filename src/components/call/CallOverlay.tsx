import { useContext } from 'react';
import { CallContext } from '@/contexts/CallContext';
import { IncomingCallScreen } from './IncomingCallScreen';
import { CallScreen } from './CallScreen';

export const CallOverlay = () => {
  // Use context directly to avoid throwing if provider not ready
  const context = useContext(CallContext);
  
  // If context not available yet, render nothing (don't crash)
  if (!context) return null;
  
  const { callState, isReady } = context;

  if (!isReady) return null;

  // Show incoming call screen
  if (callState === 'incoming_ringing') {
    return <IncomingCallScreen />;
  }

  // Show active call screen for all active call states
  const activeCallStates = [
    'outgoing_calling',
    'connecting',
    'in_call',
    'call_ended',
    'call_failed',
    'rejected',
    'missed',
  ];

  if (activeCallStates.includes(callState)) {
    return <CallScreen />;
  }

  return null;
};
