import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDFJ7EHuECoEo99wWVMMkffYoMP5bFXVkM",
  authDomain: "studio-8672600014-3dc36.firebaseapp.com",
  projectId: "studio-8672600014-3dc36",
  storageBucket: "studio-8672600014-3dc36.firebasestorage.app",
  messagingSenderId: "322857909990",
  appId: "1:322857909990:web:eddd94ff7decd2eac38527"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
