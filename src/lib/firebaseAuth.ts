import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from './firebase';

let confirmationResult: ConfirmationResult | null = null;

// Initialize reCAPTCHA verifier
export const initRecaptcha = (buttonId: string) => {
  if (typeof window !== 'undefined') {
    const recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA solved');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      }
    });
    return recaptchaVerifier;
  }
  return null;
};

// Send OTP to phone number
export const sendOTP = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier): Promise<boolean> => {
  try {
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return true;
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

// Verify OTP code
export const verifyOTP = async (code: string): Promise<User | null> => {
  if (!confirmationResult) {
    throw new Error('No confirmation result. Please request OTP first.');
  }
  
  try {
    const result = await confirmationResult.confirm(code);
    return result.user;
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

// Sign out
export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
    localStorage.removeItem('authToken');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Subscribe to auth state changes
export const subscribeToAuthState = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};
