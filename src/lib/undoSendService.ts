/**
 * Undo Send Service
 * Provides a 5-second window to undo sent messages
 */

type UndoEntry = {
  messageId: string;
  chatId: string;
  timer: ReturnType<typeof setTimeout>;
  onUndo: () => void;
};

const pendingMessages = new Map<string, UndoEntry>();
const listeners = new Set<() => void>();

const UNDO_WINDOW_MS = 5000;

export function registerUndoSend(
  messageId: string,
  chatId: string,
  onUndo: () => void
): void {
  // Clear any existing timer for this message
  const existing = pendingMessages.get(messageId);
  if (existing) {
    clearTimeout(existing.timer);
  }

  const timer = setTimeout(() => {
    pendingMessages.delete(messageId);
    notifyListeners();
  }, UNDO_WINDOW_MS);

  pendingMessages.set(messageId, { messageId, chatId, timer, onUndo });
  notifyListeners();
}

export function undoSend(messageId: string): boolean {
  const entry = pendingMessages.get(messageId);
  if (!entry) return false;

  clearTimeout(entry.timer);
  entry.onUndo();
  pendingMessages.delete(messageId);
  notifyListeners();
  return true;
}

export function hasPendingUndo(chatId: string): string | null {
  for (const [id, entry] of pendingMessages) {
    if (entry.chatId === chatId) return id;
  }
  return null;
}

export function getPendingUndos(chatId: string): string[] {
  const ids: string[] = [];
  for (const [id, entry] of pendingMessages) {
    if (entry.chatId === chatId) ids.push(id);
  }
  return ids;
}

export function subscribeToUndoChanges(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notifyListeners() {
  listeners.forEach(cb => cb());
}

export function clearPendingUndos(): void {
  pendingMessages.forEach(entry => clearTimeout(entry.timer));
  pendingMessages.clear();
  notifyListeners();
}
