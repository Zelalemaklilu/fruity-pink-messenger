/**
 * Chat Lock Service
 * Lock individual chats with a PIN code
 */

const STORAGE_KEY = "zeshopp_chat_locks";
const APP_LOCK_KEY = "zeshopp_app_lock";

interface ChatLock {
  chatId: string;
  pinHash: string;
  lockedAt: string;
}

interface AppLock {
  pinHash: string;
  enabled: boolean;
}

function hashPin(pin: string): string {
  // Simple hash for client-side PIN - not cryptographic
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

function loadLocks(): ChatLock[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocks(locks: ChatLock[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(locks));
}

export function isChatLocked(chatId: string): boolean {
  return loadLocks().some(l => l.chatId === chatId);
}

export function lockChat(chatId: string, pin: string): void {
  const locks = loadLocks();
  const existing = locks.findIndex(l => l.chatId === chatId);
  const entry: ChatLock = {
    chatId,
    pinHash: hashPin(pin),
    lockedAt: new Date().toISOString(),
  };
  if (existing >= 0) {
    locks[existing] = entry;
  } else {
    locks.push(entry);
  }
  saveLocks(locks);
}

export function unlockChat(chatId: string): void {
  const locks = loadLocks();
  saveLocks(locks.filter(l => l.chatId !== chatId));
}

export function verifyChatPin(chatId: string, pin: string): boolean {
  const locks = loadLocks();
  const lock = locks.find(l => l.chatId === chatId);
  if (!lock) return true; // No lock = always accessible
  return lock.pinHash === hashPin(pin);
}

// App-level lock
export function getAppLock(): AppLock | null {
  try {
    const stored = localStorage.getItem(APP_LOCK_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setAppLock(pin: string): void {
  const lock: AppLock = { pinHash: hashPin(pin), enabled: true };
  localStorage.setItem(APP_LOCK_KEY, JSON.stringify(lock));
}

export function removeAppLock(): void {
  localStorage.removeItem(APP_LOCK_KEY);
}

export function verifyAppPin(pin: string): boolean {
  const lock = getAppLock();
  if (!lock) return true;
  return lock.pinHash === hashPin(pin);
}

export function isAppLockEnabled(): boolean {
  const lock = getAppLock();
  return !!lock?.enabled;
}

// Session tracking - avoid repeated PIN prompts
const unlockedSessions = new Set<string>();

export function markChatUnlocked(chatId: string): void {
  unlockedSessions.add(chatId);
}

export function isChatSessionUnlocked(chatId: string): boolean {
  return unlockedSessions.has(chatId);
}

export function clearUnlockedSessions(): void {
  unlockedSessions.clear();
}
