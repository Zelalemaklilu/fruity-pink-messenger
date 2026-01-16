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

/**
 * STRICT FIRESTORE SCHEMA COMPLIANCE
 * ==================================
 * 
 * COLLECTION: accounts (NOT 'users')
 * - Document ID = Firebase Auth UID = oderId field
 * - Fields: createdAt, email, isActive, name, oderId, phoneNumber, updatedAt, username
 * 
 * COLLECTION: chats
 * - participants: MUST be array of exactly 2 Firebase Auth UIDs
 * - Security Rule: request.auth.uid in resource.data.participants
 * 
 * SUBCOLLECTION: chats/{chatId}/messages
 * - senderId: MUST be request.auth.uid (Firebase Auth UID)
 * - Security Rule: request.resource.data.senderId == request.auth.uid
 */

// Types - Strictly matching Firestore schema
export interface Account {
  id?: string;           // Document ID (= Firebase Auth UID)
  oderId?: string;       // Firebase Auth UID field
  username: string;      // Unique lowercase username
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
  accountId: string;     // Sender's Auth UID
  chatId: string;
  senderId: string;      // REQUIRED: Must be request.auth.uid
  receiverId: string;    // Receiver's Auth UID (from participants)
  content: string;
  type: 'text' | 'image' | 'voice' | 'file';
  status: 'sending' | 'sent' | 'delivered' | 'read';
  fileName?: string;
  createdAt?: Timestamp;
}

export interface Chat {
  id?: string;
  participants: string[];          // MUST be exactly 2 Firebase Auth UIDs
  participantUsernames: string[];
  participantNames: string[];
  participantAvatars: string[];
  lastMessage?: string;
  lastMessageTimestamp?: Timestamp;
  lastMessageAt?: Timestamp;
  unreadCount: { [authUid: string]: number };  // Keyed by Auth UID
  isGroup: boolean;
  groupName?: string;
  createdAt?: Timestamp;
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

// Search for user by username with prefix matching
export const searchByUsername = async (searchTerm: string, excludeoderId: string): Promise<Account | null> => {
  // CLEAN INPUT: Remove "@" symbol and normalize
  const normalizedQuery = searchTerm.replace(/@/g, '').toLowerCase().trim();
  
  console.log("searchByUsername - Searching ACCOUNTS for:", normalizedQuery);
  
  if (!normalizedQuery) {
    console.log("Empty search term after normalization");
    return null;
  }
  
  try {
    // FORCE COLLECTION REFERENCE: Use accountsCollection (which points to 'accounts')
    const prefixQuery = query(
      accountsCollection, 
      where('username', '>=', normalizedQuery),
      where('username', '<=', normalizedQuery + '\uf8ff')
    );
    const snapshot = await getDocs(prefixQuery);
    
    console.log("searchByUsername - Results count:", snapshot.docs.length);
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      console.log("searchByUsername - Found user:", data.username);
      if (data.oderId !== excludeoderId) {
        return { id: docSnap.id, ...data } as Account;
      }
    }
    
    return null;
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    console.error("searchByUsername SEARCH ERROR:", firebaseError.code, firebaseError.message);
    logIndexError(error);
    return null;
  }
};

// Search for multiple users (for autocomplete/suggestions)
export const searchUsers = async (searchTerm: string, excludeoderId: string, maxResults: number = 5): Promise<Account[]> => {
  // CLEAN INPUT: Remove "@" symbol and normalize
  const normalizedQuery = searchTerm.replace(/@/g, '').toLowerCase().trim();
  const results: Account[] = [];
  
  console.log("Searching ACCOUNTS collection for:", normalizedQuery);
  
  if (!normalizedQuery) {
    console.log("Empty search term after normalization");
    return [];
  }
  
  try {
    // FORCE COLLECTION REFERENCE: Explicitly use 'accounts' collection
    const accountsRef = collection(db, 'accounts');
    
    // Prefix match on 'username' field (startsWith behavior)
    const prefixQuery = query(
      accountsRef, 
      where('username', '>=', normalizedQuery),
      where('username', '<=', normalizedQuery + '\uf8ff'),
      limit(maxResults)
    );
    const snapshot = await getDocs(prefixQuery);
    
    console.log("Search results count:", snapshot.docs.length);
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      console.log("Found user:", data.username);
      // No extra filters - just exclude current user
      if (data.oderId !== excludeoderId) {
        results.push({ id: docSnap.id, ...data } as Account);
      }
    }
    
    return results;
  } catch (error: unknown) {
    // ERROR LOGGING: Log specific error code and message
    const firebaseError = error as { code?: string; message?: string };
    console.error("SEARCH ERROR:", firebaseError.code, firebaseError.message);
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

/**
 * MESSAGES SUBCOLLECTION
 * Path: /chats/{chatId}/messages/{messageId}
 * 
 * SECURITY RULE REQUIREMENT:
 * - request.auth.uid in chat.participants (must be chat participant)
 * - request.resource.data.senderId == request.auth.uid (senderId MUST match auth)
 */
const getMessagesCollection = (chatId: string) => collection(db, 'chats', chatId, 'messages');

export const sendMessage = async (message: Omit<Message, 'id' | 'createdAt'>): Promise<string> => {
  // STRICT VALIDATION: Ensure required fields are present
  if (!message.chatId) {
    throw new Error('chatId is required for sending messages');
  }
  
  if (!message.senderId) {
    throw new Error('senderId is REQUIRED - Firestore rule: request.resource.data.senderId == request.auth.uid');
  }
  
  // STRICT MESSAGE PAYLOAD - matches Firestore security rules exactly
  const messageData: Record<string, unknown> = {
    senderId: message.senderId,     // REQUIRED: Must be auth.currentUser.uid
    receiverId: message.receiverId, // The other participant's Auth UID
    accountId: message.accountId,   // Same as senderId (for consistency)
    content: message.content,
    type: message.type,
    status: message.status,
    createdAt: serverTimestamp()
  };
  
  // Optional fields
  if (message.tempId) messageData.tempId = message.tempId;
  if (message.fileName) messageData.fileName = message.fileName;
  
  console.log("sendMessage STRICT:", { 
    chatId: message.chatId, 
    senderId: message.senderId,
    receiverId: message.receiverId 
  });
  
  // Write to: /chats/{chatId}/messages/{messageId}
  const messagesRef = getMessagesCollection(message.chatId);
  const docRef = await addDoc(messagesRef, messageData);
  
  console.log("Message created:", message.chatId, "->", docRef.id);
  return docRef.id;
};

// Get messages with pagination from subcollection
export const getMessagesByChatId = async (
  chatId: string, 
  limitCount: number = 20,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ messages: Message[], lastDoc: QueryDocumentSnapshot<DocumentData> | null }> => {
  try {
    const messagesRef = getMessagesCollection(chatId);
    
    let q = query(
      messagesRef, 
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    if (lastDoc) {
      q = query(
        messagesRef, 
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(limitCount)
      );
    }
    
    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map(docSnap => ({ 
      id: docSnap.id, 
      chatId, // Add chatId since it's not stored in subcollection docs
      ...docSnap.data() 
    } as Message)).reverse();
    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
    
    return { messages, lastDoc: newLastDoc };
  } catch (error: unknown) {
    console.error("Error loading messages:", error);
    logIndexError(error);
    return { messages: [], lastDoc: null };
  }
};

// Real-time message listener for subcollection
// SECURITY: Your rules use get() on parent chat to verify participants
// Path: chats/{chatId}/messages - requires auth.uid in chat.participants
export const subscribeToMessages = (
  chatId: string,
  callback: (messages: Message[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  console.log("subscribeToMessages: Subscribing to", `chats/${chatId}/messages`);
  
  const messagesRef = getMessagesCollection(chatId);
  const q = query(
    messagesRef,
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(docSnap => ({ 
      id: docSnap.id, 
      chatId, // Add chatId since it's not stored in subcollection docs
      ...docSnap.data() 
    } as Message));
    console.log("subscribeToMessages: Received", messages.length, "messages");
    callback(messages);
  }, (error) => {
    console.error("subscribeToMessages ERROR:", error);
    console.error("This often means: Security rule 'get(/databases/.../chats/$(chatId)).data.participants' failed");
    console.error("Check that the chat document has 'participants' array containing your Auth UID");
    logIndexError(error);
    onError?.(error as Error);
    // Return empty array so UI doesn't freeze
    callback([]);
  });
};

// Update message status in subcollection
export const updateMessageStatus = async (chatId: string, messageId: string, status: Message['status']): Promise<void> => {
  const docRef = doc(db, 'chats', chatId, 'messages', messageId);
  await updateDoc(docRef, { status });
};

/**
 * Mark messages as read - SAFE VERSION for strict security rules
 * 
 * IMPORTANT: Your security rules may only allow:
 * - Reading messages if you're in chat.participants
 * - Creating messages if senderId == auth.uid
 * - But NO update rule exists!
 * 
 * This function handles permission errors gracefully by:
 * 1. Querying only messages where current user is the RECEIVER
 * 2. Updating each message individually and catching failures
 * 3. Logging but not throwing on permission denied
 */
export const markMessagesAsRead = async (chatId: string, currentUserId: string): Promise<void> => {
  try {
    const messagesRef = getMessagesCollection(chatId);
    
    // Query messages where current user is the RECEIVER (not sender)
    // This is more likely to be allowed by strict security rules
    const q = query(
      messagesRef,
      where('receiverId', '==', currentUserId)
    );
    
    const snapshot = await getDocs(q);
    
    // Filter client-side for unread messages
    const unreadDocs = snapshot.docs.filter(docSnap => {
      const data = docSnap.data();
      return data.status === 'sent' || data.status === 'delivered';
    });
    
    if (unreadDocs.length === 0) {
      console.log('[markMessagesAsRead] No unread messages to update');
      return;
    }
    
    console.log(`[markMessagesAsRead] Found ${unreadDocs.length} unread messages`);
    
    // Update each message individually to handle partial failures
    let successCount = 0;
    let failCount = 0;
    
    for (const docSnap of unreadDocs) {
      try {
        await updateDoc(doc(db, 'chats', chatId, 'messages', docSnap.id), { status: 'read' });
        successCount++;
      } catch (updateError: unknown) {
        const firebaseError = updateError as { code?: string };
        // Only log first failure to avoid spam
        if (failCount === 0) {
          console.warn('[markMessagesAsRead] Update blocked by security rules:', firebaseError.code);
          console.info('This is expected if your Firestore rules have no "allow update" for messages');
        }
        failCount++;
      }
    }
    
    if (successCount > 0) {
      console.log(`[markMessagesAsRead] Updated ${successCount} messages`);
    }
    if (failCount > 0) {
      console.log(`[markMessagesAsRead] ${failCount} updates blocked by security rules (this is OK)`);
    }
  } catch (error: unknown) {
    const firebaseError = error as { code?: string };
    // Query itself might fail - log but don't throw
    console.warn('[markMessagesAsRead] Query failed:', firebaseError.code);
  }
};

/**
 * Mark messages as delivered - SAFE VERSION for strict security rules
 */
export const markMessagesAsDelivered = async (chatId: string, currentUserId: string): Promise<void> => {
  try {
    const messagesRef = getMessagesCollection(chatId);
    
    // Query only messages where current user is the RECEIVER
    const q = query(
      messagesRef,
      where('receiverId', '==', currentUserId)
    );
    
    const snapshot = await getDocs(q);
    
    // Filter for 'sent' status
    const sentDocs = snapshot.docs.filter(docSnap => docSnap.data().status === 'sent');
    
    if (sentDocs.length === 0) return;
    
    // Update each individually with error handling
    for (const docSnap of sentDocs) {
      try {
        await updateDoc(doc(db, 'chats', chatId, 'messages', docSnap.id), { status: 'delivered' });
      } catch (updateError: unknown) {
        // Security rules may block - this is expected, just log once
        const firebaseError = updateError as { code?: string };
        console.warn('[markMessagesAsDelivered] Update blocked:', firebaseError.code);
        break; // Don't spam logs
      }
    }
  } catch (error: unknown) {
    const firebaseError = error as { code?: string };
    console.warn('[markMessagesAsDelivered] Query failed:', firebaseError.code);
  }
};

/**
 * CHATS COLLECTION
 * 
 * SECURITY RULES REQUIREMENTS:
 * - CREATE: participants.size() == 2 AND request.auth.uid in participants
 * - READ/UPDATE/DELETE: request.auth.uid in resource.data.participants
 */
export const chatsCollection = collection(db, 'chats');

/**
 * Find or create a chat between two users
 * 
 * CRITICAL: participants array MUST contain exactly 2 Firebase Auth UIDs
 * - currentAuthUid: The authenticated user's auth.uid
 * - otherAuthUid: The target user's Auth UID (from accounts.id or accounts.oderId)
 */
export const findOrCreateChat = async (
  currentAuthUid: string,   // Firebase Auth UID (auth.currentUser.uid)
  currentUsername: string,
  currentName: string,
  currentAvatar: string,
  otherAuthUid: string,     // Target user's Auth UID (from accounts document ID)
  otherUsername: string,
  otherName: string,
  otherAvatar: string
): Promise<string> => {
  console.log("findOrCreateChat STRICT:", { currentAuthUid, otherAuthUid });
  
  // Validate both UIDs are present
  if (!currentAuthUid || !otherAuthUid) {
    throw new Error('Both Auth UIDs are required for chat creation');
  }
  
  // Search for existing chat
  try {
    const q = query(
      chatsCollection,
      where('participants', 'array-contains', currentAuthUid)
    );
    
    const snapshot = await getDocs(q);
    
    // Find chat that contains both users
    for (const chatDoc of snapshot.docs) {
      const data = chatDoc.data();
      if (data.participants?.includes(otherAuthUid)) {
        console.log("Found existing chat:", chatDoc.id);
        return chatDoc.id;
      }
    }
  } catch (error: unknown) {
    console.error("Error finding chat:", error);
    logIndexError(error);
  }
  
  // Create new chat - STRICT compliance with security rules
  const newChat = {
    participants: [currentAuthUid, otherAuthUid], // EXACTLY 2 Auth UIDs
    participantUsernames: [currentUsername, otherUsername],
    participantNames: [currentName, otherName],
    participantAvatars: [currentAvatar || '', otherAvatar || ''],
    unreadCount: { [currentAuthUid]: 0, [otherAuthUid]: 0 },
    isGroup: false,
    createdAt: serverTimestamp()
  };
  
  console.log("Creating chat STRICT:", { 
    participants: newChat.participants,
    participantUsernames: newChat.participantUsernames 
  });
  
  const docRef = await addDoc(chatsCollection, newChat);
  return docRef.id;
};

/**
 * Create a new chat document
 * 
 * STRICT: participants array must be exactly 2 Firebase Auth UIDs
 */
export const createChat = async (chat: Omit<Chat, 'id' | 'createdAt'>): Promise<string> => {
  // Validate participants
  if (!chat.participants || chat.participants.length !== 2) {
    throw new Error('Chat must have exactly 2 participants (Auth UIDs)');
  }
  
  const chatData: Record<string, unknown> = {
    participants: chat.participants, // Exactly 2 Auth UIDs
    participantUsernames: chat.participantUsernames || [],
    participantNames: chat.participantNames || [],
    participantAvatars: chat.participantAvatars || [],
    unreadCount: chat.unreadCount || {},
    isGroup: chat.isGroup || false,
    createdAt: serverTimestamp()
  };
  
  // Optional fields
  if (chat.lastMessage) chatData.lastMessage = chat.lastMessage;
  if (chat.lastMessageTimestamp) chatData.lastMessageTimestamp = chat.lastMessageTimestamp;
  if (chat.groupName) chatData.groupName = chat.groupName;
  
  console.log("createChat STRICT:", { participants: chat.participants });
  
  const docRef = await addDoc(chatsCollection, chatData);
  return docRef.id;
};

// Get chats for a user, sorted by last message
// CRITICAL: authUid must be a Firebase Auth UID (stored in participants array)
export const getChatsByAuthUid = async (authUid: string): Promise<Chat[]> => {
  try {
    const q = query(
      chatsCollection, 
      where('participants', 'array-contains', authUid),
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
        where('participants', 'array-contains', authUid)
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

// Legacy compatibility - getChatsByoderId now expects Auth UID
export const getChatsByoderId = getChatsByAuthUid;
export const getChatsByAccountId = getChatsByAuthUid;

// Real-time chat listener
// CRITICAL: authUid must be a Firebase Auth UID (stored in participants array)
export const subscribeToChats = (
  authUid: string,
  callback: (chats: Chat[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const q = query(
    chatsCollection,
    where('participants', 'array-contains', authUid)
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
      const data = docSnap.data();
      const chat = { id: docSnap.id, ...data } as Chat;
      
      // VALIDATE: Ensure participants is a proper array of 2 strings
      if (!Array.isArray(chat.participants) || chat.participants.length !== 2) {
        console.error("INVALID CHAT: participants must be array of 2 Auth UIDs", chat.participants);
        return null;
      }
      
      return chat;
    }
    return null;
  } catch (error) {
    console.error("Error getting chat:", error);
    return null;
  }
};

/**
 * Verify and ensure chat document has valid participants array
 * This is critical for security rules that check: get(/databases/.../chats/$(chatId)).data.participants
 *
 * IMPORTANT:
 * - Some legacy chats may have participants stored under a different field name.
 * - With strict rules, missing/incorrect `participants` will block reads from `chats/{chatId}/messages`.
 * - This function will attempt a safe repair by inferring the 2 Auth UIDs from other fields and writing them back.
 */
const normalizeUidArray2 = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  const cleaned = value
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter(Boolean);

  const unique = Array.from(new Set(cleaned));
  return unique.length === 2 ? unique : null;
};

const inferParticipantsArray2 = (data: DocumentData): string[] | null => {
  // 1) Common alternate field names
  const altKeys = [
    'participantIds',
    'participantUids',
    'memberIds',
    'members',
    'userIds',
    'users',
    'uids'
  ] as const;

  for (const key of altKeys) {
    const fromAlt = normalizeUidArray2((data as Record<string, unknown>)[key]);
    if (fromAlt) return fromAlt;
  }

  // 2) unreadCount object keys are Auth UIDs in this app's schema
  if (data.unreadCount && typeof data.unreadCount === 'object') {
    const keys = Object.keys(data.unreadCount as Record<string, unknown>)
      .map((k) => k.trim())
      .filter(Boolean);
    const unique = Array.from(new Set(keys));
    if (unique.length === 2) return unique;
  }

  // 3) sender/receiver style fields
  const maybeSender = typeof data.senderId === 'string' ? data.senderId.trim() : '';
  const maybeReceiver = typeof data.receiverId === 'string' ? data.receiverId.trim() : '';
  if (maybeSender && maybeReceiver) return Array.from(new Set([maybeSender, maybeReceiver]));

  const maybeFrom = typeof (data as any).from === 'string' ? String((data as any).from).trim() : '';
  const maybeTo = typeof (data as any).to === 'string' ? String((data as any).to).trim() : '';
  if (maybeFrom && maybeTo) return Array.from(new Set([maybeFrom, maybeTo]));

  return null;
};

export const verifyChatParticipants = async (chatId: string, currentUserId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, 'chats', chatId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.error('verifyChatParticipants: Chat does not exist:', chatId);
      return false;
    }

    const data = docSnap.data();

    // First try the canonical field
    let participants = normalizeUidArray2(data.participants);

    // Repair path: infer + write-back
    if (!participants || !participants.includes(currentUserId)) {
      const inferred = inferParticipantsArray2(data);

      if (!inferred) {
        console.error('verifyChatParticipants: Cannot infer participants for chat:', {
          chatId,
          hasParticipantsField: Boolean((data as any).participants),
          unreadCountKeys: data.unreadCount ? Object.keys(data.unreadCount as Record<string, unknown>) : []
        });
        return false;
      }

      if (!inferred.includes(currentUserId)) {
        console.error('verifyChatParticipants: Inferred participants does not include current user:', {
          chatId,
          currentUserId,
          inferred
        });
        return false;
      }

      if (inferred.length !== 2) {
        console.error('verifyChatParticipants: Inferred participants must be exactly 2 UIDs:', {
          chatId,
          inferred
        });
        return false;
      }

      try {
        await updateDoc(docRef, { participants: inferred });
        participants = inferred;
        console.log('verifyChatParticipants: Repaired chat participants field for strict rules', {
          chatId,
          participants
        });
      } catch (writeError) {
        console.error('verifyChatParticipants: Failed to repair participants (update denied?):', writeError);
        return false;
      }
    }

    // Final validation
    if (!participants || participants.length !== 2) {
      console.error('verifyChatParticipants: INVALID participants after validation:', participants);
      return false;
    }

    if (!participants.every((p) => typeof p === 'string' && p.length > 0)) {
      console.error('verifyChatParticipants: participants contains invalid entries:', participants);
      return false;
    }

    console.log('verifyChatParticipants: Chat structure VALID for security rules', {
      chatId,
      participants
    });

    return true;
  } catch (error) {
    console.error('verifyChatParticipants error:', error);
    return false;
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
