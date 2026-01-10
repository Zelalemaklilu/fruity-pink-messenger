import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  signOut,
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  deleteUser
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

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

/**
 * ATOMIC SIGNUP: Creates Auth user + Firestore profile in one operation.
 * If Firestore write fails, Auth user is deleted (rollback).
 * This ensures 1 Auth User = 1 Firestore Document.
 */
export const atomicSignUpWithEmail = async (
  email: string, 
  password: string, 
  username: string
): Promise<User> => {
  let user: User | null = null;
  
  try {
    console.log("ATOMIC SIGNUP: Step 1 - Creating Auth user...");
    const result = await createUserWithEmailAndPassword(auth, email, password);
    user = result.user;
    console.log("ATOMIC SIGNUP: Auth user created with UID:", user.uid);
    
    // Step 2: IMMEDIATELY write to Firestore
    console.log("ATOMIC SIGNUP: Step 2 - Writing Firestore profile...");
    const docRef = doc(db, 'accounts', user.uid);
    
    await setDoc(docRef, {
      oderId: user.uid,
      username: username.toLowerCase().trim(),
      email: email,
      name: email.split('@')[0],
      phoneNumber: email,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log("ATOMIC SIGNUP: Firestore profile created successfully!");
    
    // Step 3: Send verification email (non-critical, don't rollback on failure)
    try {
      await sendEmailVerification(user);
      console.log("ATOMIC SIGNUP: Verification email sent");
    } catch (emailError) {
      console.warn("ATOMIC SIGNUP: Failed to send verification email (non-blocking):", emailError);
    }
    
    return user;
    
  } catch (error: any) {
    console.error("ATOMIC SIGNUP ERROR:", error);
    
    // CRITICAL ROLLBACK: If we created an Auth user but Firestore failed, delete the Auth user
    if (user) {
      console.log("ATOMIC SIGNUP: ROLLING BACK - Deleting orphan Auth user...");
      try {
        await deleteUser(user);
        console.log("ATOMIC SIGNUP: Rollback successful - Auth user deleted");
      } catch (deleteError) {
        console.error("ATOMIC SIGNUP: CRITICAL - Failed to rollback Auth user:", deleteError);
        alert("Critical Error: Auth user created but profile failed. Please contact support.");
      }
    }
    
    // Show clear error to user
    const errorMessage = error?.message || 'Unknown error';
    if (error?.code !== 'auth/email-already-in-use') {
      alert("Signup Error: " + errorMessage);
    }
    
    throw error;
  }
};

// Legacy signup (kept for compatibility but prefer atomicSignUpWithEmail)
export const signUpWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(result.user);
    return result.user;
  } catch (error: any) {
    console.error('Error signing up with email:', error);
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    console.error('Error signing in with email:', error);
    throw error;
  }
};

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
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