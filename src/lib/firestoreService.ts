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
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface Account {
  id?: string;
  userId: string;
  name: string;
  phoneNumber: string;
  isActive: boolean;
  bio?: string;
  avatarUrl?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Message {
  id?: string;
  accountId: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'voice' | 'file';
  status: 'sent' | 'delivered' | 'read';
  createdAt?: Timestamp;
}

export interface Chat {
  id?: string;
  accountId: string;
  participantIds: string[];
  participantNames: string[];
  lastMessage?: string;
  lastMessageAt?: Timestamp;
  isGroup: boolean;
  groupName?: string;
  createdAt?: Timestamp;
}

// Accounts Collection
export const accountsCollection = collection(db, 'accounts');

export const createAccount = async (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(accountsCollection, {
    ...account,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const getAccountsByUserId = async (userId: string): Promise<Account[]> => {
  const q = query(accountsCollection, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
};

export const updateAccount = async (accountId: string, data: Partial<Account>): Promise<void> => {
  const docRef = doc(db, 'accounts', accountId);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteAccount = async (accountId: string): Promise<void> => {
  const docRef = doc(db, 'accounts', accountId);
  await deleteDoc(docRef);
};

export const setActiveAccount = async (userId: string, accountId: string): Promise<void> => {
  // First, set all accounts as inactive
  const accounts = await getAccountsByUserId(userId);
  for (const account of accounts) {
    if (account.id) {
      await updateAccount(account.id, { isActive: false });
    }
  }
  // Then set the selected account as active
  await updateAccount(accountId, { isActive: true });
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

export const getMessagesByChatId = async (chatId: string): Promise<Message[]> => {
  const q = query(
    messagesCollection, 
    where('chatId', '==', chatId),
    orderBy('createdAt', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
};

export const updateMessageStatus = async (messageId: string, status: Message['status']): Promise<void> => {
  const docRef = doc(db, 'messages', messageId);
  await updateDoc(docRef, { status });
};

// Chats Collection
export const chatsCollection = collection(db, 'chats');

export const createChat = async (chat: Omit<Chat, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(chatsCollection, {
    ...chat,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const getChatsByAccountId = async (accountId: string): Promise<Chat[]> => {
  const q = query(
    chatsCollection, 
    where('accountId', '==', accountId),
    orderBy('lastMessageAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
};

export const updateChat = async (chatId: string, data: Partial<Chat>): Promise<void> => {
  const docRef = doc(db, 'chats', chatId);
  await updateDoc(docRef, data);
};
