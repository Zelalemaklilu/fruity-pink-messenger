import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  addDoc,
  serverTimestamp,
  Timestamp,
  limit,
  startAfter,
  onSnapshot,
  increment,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface Account {
  id?: string;
  oderId?: string;
  username: string;
  email?: string;
  name: string;
  phoneNumber: string;
  isActive: boolean;
  bio?: string;
  avatarUrl?: string;
  photoURL?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Message {
  id?: string;
  tempId?: string;
  accountId: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'voice' | 'file';
  status: 'sending' | 'sent' | 'delivered' | 'read';
  fileName?: string;
  createdAt?: Timestamp;
}

export interface Chat {
  id?: string;
  participants: string[];
  participantUsernames: string[];
  participantNames: string[];
  participantAvatars: string[];
  lastMessage?: string;
  lastMessageTimestamp?: Timestamp;
  lastMessageAt?: Timestamp;
  unreadCount: { [oderId: string]: number };
  isGroup: boolean;
  groupName?: string;
  createdAt?: Timestamp;
  // Legacy fields for compatibility
  accountId?: string;
  participantIds?: string[];
}

// Accounts Collection
export const accountsCollection = collection(db, 'accounts');

// Check if username is unique (excluding current user)
// PRODUCTION: With public read enabled, this query should succeed.
// Safety fallback: If query fails (network issue), return true to not block signup.
export const isUsernameUnique = async (username: string, currentoderId?: string): Promise<boolean> => {
  const normalizedUsername = username.toLowerCase().trim();
  const q = query(accountsCollection, where('username', '==', normalizedUsername));
  
  try {
    const snapshot = await getDocs(q);
    if (snapshot.empty) return true;
    
    // If there's a match, check if it's the current user
    if (currentoderId) {
      return snapshot.docs.every(doc => doc.data().oderId === currentoderId);
    }
    return false;
  } catch (error: unknown) {
    // PRODUCTION FALLBACK: Log error but allow signup attempt
    // Better to let user try signup than falsely block with "Username Taken"
    console.error("Error checking username uniqueness (allowing signup):", error);
    logIndexError(error);
    return true; // Return true to allow signup attempt
  }
};

// Search for user by name with prefix matching and email fallback
export const searchByUsername = async (searchName: string, excludeoderId: string): Promise<Account | null> => {
  const normalizedQuery = searchName.toLowerCase().trim();
  
  try {
    // Try prefix match on 'name' field (startsWith behavior)
    const prefixQuery = query(
      accountsCollection, 
      where('name', '>=', normalizedQuery),
      where('name', '<=', normalizedQuery + '\uf8ff')
    );
    const prefixSnapshot = await getDocs(prefixQuery);
    
    if (!prefixSnapshot.empty) {
      for (const docSnap of prefixSnapshot.docs) {
        const data = docSnap.data();
        if (data.oderId !== excludeoderId) {
          return { id: docSnap.id, ...data } as Account;
        }
      }
    }
    
    // Fallback: Try email search
    const emailQuery = query(accountsCollection, where('email', '==', normalizedQuery));
    const emailSnapshot = await getDocs(emailQuery);
    
    if (!emailSnapshot.empty) {
      for (const docSnap of emailSnapshot.docs) {
        const data = docSnap.data();
        if (data.oderId !== excludeoderId) {
          return { id: docSnap.id, ...data } as Account;
        }
      }
    }
    
    return null;
  } catch (error: unknown) {
    console.error("Error searching by name:", error);
    logIndexError(error);
    return null;
  }
};

// Search for multiple users (for autocomplete/suggestions)
export const searchUsers = async (searchTerm: string, excludeoderId: string, maxResults: number = 5): Promise<Account[]> => {
  const normalizedQuery = searchTerm.toLowerCase().trim();
  const results: Account[] = [];
  
  try {
    // Prefix match on 'name' field (matches your Firestore schema)
    const prefixQuery = query(
      accountsCollection, 
      where('name', '>=', normalizedQuery),
      where('name', '<=', normalizedQuery + '\uf8ff'),
      limit(maxResults)
    );
    const snapshot = await getDocs(prefixQuery);
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data.oderId !== excludeoderId) {
        results.push({ id: docSnap.id, ...data } as Account);
      }
    }
    
    // If no results, try email fallback
    if (results.length === 0) {
      const emailQuery = query(accountsCollection, where('email', '==', normalizedQuery));
      const emailSnapshot = await getDocs(emailQuery);
      
      for (const docSnap of emailSnapshot.docs) {
        const data = docSnap.data();
        if (data.oderId !== excludeoderId) {
          results.push({ id: docSnap.id, ...data } as Account);
        }
      }
    }
    
    return results;
  } catch (error: unknown) {
    console.error("Error searching users:", error);
    logIndexError(error);
    return [];
  }
};

export const createAccount = async (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  // Ensure username is lowercase and unique
  const normalizedUsername = account.username?.toLowerCase().trim() || account.name.toLowerCase().replace(/\s/g, '');
  
  // CRITICAL: Check if account already exists for this oderId to prevent duplicates
  if (account.oderId) {
    try {
      const existingAccounts = await getAccountsByoderId(account.oderId);
      if (existingAccounts.length > 0) {
        console.log("Account already exists for oderId:", account.oderId);
        return existingAccounts[0].id || account.oderId;
      }
    } catch (error) {
      console.error("Error checking existing account:", error);
    }
  }
  
  const isUnique = await isUsernameUnique(normalizedUsername);
  if (!isUnique) {
    throw new Error('Username already taken');
  }
  
  try {
    // Use setDoc with oderId as document ID for guaranteed uniqueness
    const docId = account.oderId || doc(accountsCollection).id;
    const docRef = doc(db, 'accounts', docId);
    
    console.log("Firestore: Attempting to write account with ID:", docId);
    
    await setDoc(docRef, {
      ...account,
      username: normalizedUsername,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log("Firestore account created successfully with ID:", docId);
    return docId;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Firestore Write Error:", error);
    
    // CRITICAL: Show alert to user so they know the write failed
    alert("Firestore Error: " + errorMessage);
    
    throw new Error(`Failed to create account in Firestore: ${errorMessage}`);
  }
};

export const getAccountsByoderId = async (oderId: string): Promise<Account[]> => {
  const q = query(accountsCollection, where('oderId', '==', oderId));
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
  } catch (error: unknown) {
    console.error("Error getting accounts:", error);
    logIndexError(error);
    return [];
  }
};

// Legacy compatibility
export const getAccountsByUserId = getAccountsByoderId;

export const getAccountByoderId = async (oderId: string): Promise<Account | null> => {
  const accounts = await getAccountsByoderId(oderId);
  return accounts.length > 0 ? accounts[0] : null;
};

export const updateAccount = async (accountId: string, data: Partial<Account>): Promise<void> => {
  // If updating username, check uniqueness first
  if (data.username) {
    const normalizedUsername = data.username.toLowerCase().trim();
    const docRef = doc(db, 'accounts', accountId);
    const docSnap = await getDoc(docRef);
    const currentoderId = docSnap.data()?.oderId;
    
    const isUnique = await isUsernameUnique(normalizedUsername, currentoderId);
    if (!isUnique) {
      throw new Error('Username already taken');
    }
    data.username = normalizedUsername;
  }
  
  const docRef = doc(db, 'accounts', accountId);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteAccount = async (accountId: string): Promise<void> => {
  const docRef = doc(db, 'accounts', accountId);
  await deleteDoc(docRef);
};

export const setActiveAccount = async (oderId: string, accountId: string): Promise<void> => {
  const accounts = await getAccountsByoderId(oderId);
  for (const account of accounts) {
    if (account.id) {
      await updateAccount(account.id, { isActive: false });
    }
  }
  await updateAccount(accountId, { isActive: true });
};

// Helper function to log index errors
const logIndexError = (error: unknown): void => {
  if (error instanceof Error && error.message.includes('index')) {
    const urlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
    if (urlMatch) {
      console.error('🔥 INDEX REQUIRED - Create index at:', urlMatch[0]);
    }
  }
};

// Messages Collection
export const messagesCollection = collection(db, 'messages');

export const sendMessage = async (message: Omit<Message, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(messagesCollection, {
    ...message,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

// Get messages with pagination
export const getMessagesByChatId = async (
  chatId: string, 
  limitCount: number = 20,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ messages: Message[], lastDoc: QueryDocumentSnapshot<DocumentData> | null }> => {
  try {
    let q = query(
      messagesCollection, 
      where('chatId', '==', chatId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    if (lastDoc) {
      q = query(
        messagesCollection, 
        where('chatId', '==', chatId),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(limitCount)
      );
    }
    
    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)).reverse();
    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
    
    return { messages, lastDoc: newLastDoc };
  } catch (error: unknown) {
    console.error("Error loading messages:", error);
    logIndexError(error);
    return { messages: [], lastDoc: null };
  }
};

// Real-time message listener
export const subscribeToMessages = (
  chatId: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  const q = query(
    messagesCollection,
    where('chatId', '==', chatId),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
    callback(messages);
  }, (error) => {
    console.error("Error in message subscription:", error);
    logIndexError(error);
  });
};

export const updateMessageStatus = async (messageId: string, status: Message['status']): Promise<void> => {
  const docRef = doc(db, 'messages', messageId);
  await updateDoc(docRef, { status });
};

// Chats Collection
export const chatsCollection = collection(db, 'chats');

// Find or create chat between two users
export const findOrCreateChat = async (
  currentoderId: string,
  currentUsername: string,
  currentName: string,
  currentAvatar: string,
  otheroderId: string,
  otherUsername: string,
  otherName: string,
  otherAvatar: string
): Promise<string> => {
  // Search for existing chat
  try {
    const q = query(
      chatsCollection,
      where('participants', 'array-contains', currentoderId)
    );
    
    const snapshot = await getDocs(q);
    
    // Find chat that contains both users
    for (const chatDoc of snapshot.docs) {
      const data = chatDoc.data();
      if (data.participants?.includes(otheroderId)) {
        return chatDoc.id;
      }
    }
  } catch (error: unknown) {
    console.error("Error finding chat:", error);
    logIndexError(error);
  }
  
  // Create new chat if not found
  const newChat: Omit<Chat, 'id'> = {
    participants: [currentoderId, otheroderId],
    participantUsernames: [currentUsername, otherUsername],
    participantNames: [currentName, otherName],
    participantAvatars: [currentAvatar || '', otherAvatar || ''],
    unreadCount: { [currentoderId]: 0, [otheroderId]: 0 },
    isGroup: false,
    createdAt: serverTimestamp() as Timestamp
  };
  
  const docRef = await addDoc(chatsCollection, newChat);
  return docRef.id;
};

export const createChat = async (chat: Omit<Chat, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(chatsCollection, {
    ...chat,
    unreadCount: chat.unreadCount || {},
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

// Get chats for a user, sorted by last message
export const getChatsByoderId = async (oderId: string): Promise<Chat[]> => {
  try {
    const q = query(
      chatsCollection, 
      where('participants', 'array-contains', oderId),
      orderBy('lastMessageTimestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
  } catch (error: unknown) {
    console.error("Error getting chats:", error);
    logIndexError(error);
    
    // Fallback query without ordering (for when index doesn't exist)
    try {
      const fallbackQ = query(
        chatsCollection, 
        where('participants', 'array-contains', oderId)
      );
      const fallbackSnapshot = await getDocs(fallbackQ);
      const chats = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
      // Sort client-side
      return chats.sort((a, b) => {
        const aTime = a.lastMessageTimestamp?.toMillis() || 0;
        const bTime = b.lastMessageTimestamp?.toMillis() || 0;
        return bTime - aTime;
      });
    } catch (fallbackError) {
      console.error("Fallback query failed:", fallbackError);
      return [];
    }
  }
};

// Legacy compatibility
export const getChatsByAccountId = getChatsByoderId;

// Real-time chat listener
export const subscribeToChats = (
  oderId: string,
  callback: (chats: Chat[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const q = query(
    chatsCollection,
    where('participants', 'array-contains', oderId)
  );
  
  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Chat))
      .sort((a, b) => {
        const aTime = a.lastMessageTimestamp?.toMillis() || 0;
        const bTime = b.lastMessageTimestamp?.toMillis() || 0;
        return bTime - aTime;
      });
    callback(chats);
  }, (error) => {
    console.error("Error in chat subscription:", error);
    logIndexError(error);
    // Call error callback to stop loading spinner
    onError?.(error);
    // Return empty chats on error so UI doesn't freeze
    callback([]);
  });
};

export const getChatById = async (chatId: string): Promise<Chat | null> => {
  try {
    const docRef = doc(db, 'chats', chatId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Chat;
    }
    return null;
  } catch (error) {
    console.error("Error getting chat:", error);
    return null;
  }
};

export const updateChat = async (chatId: string, data: Partial<Chat>): Promise<void> => {
  const docRef = doc(db, 'chats', chatId);
  await updateDoc(docRef, data);
};

// Increment unread count for a user
export const incrementUnreadCount = async (chatId: string, oderId: string): Promise<void> => {
  const docRef = doc(db, 'chats', chatId);
  await updateDoc(docRef, {
    [`unreadCount.${oderId}`]: increment(1)
  });
};

// Reset unread count when user opens chat
export const resetUnreadCount = async (chatId: string, oderId: string): Promise<void> => {
  const docRef = doc(db, 'chats', chatId);
  await updateDoc(docRef, {
    [`unreadCount.${oderId}`]: 0
  });
};
