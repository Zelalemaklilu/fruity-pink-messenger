import { useCall } from '@/contexts/CallContext';
import { IncomingCallScreen } from './IncomingCallScreen';
import { CallScreen } from './CallScreen';

export const CallOverlay = () => {
  const { callState, isReady } = useCall();

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
