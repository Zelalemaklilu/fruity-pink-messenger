/**
 * View-Once Media Service
 * Images and videos that disappear after being viewed
 */

const STORAGE_KEY = "zeshopp_view_once";
const VIEWED_KEY = "zeshopp_view_once_viewed";

interface ViewOnceMessage {
  messageId: string;
  chatId: string;
  createdAt: string;
}

function loadViewOnce(): ViewOnceMessage[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveViewOnce(items: ViewOnceMessage[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function loadViewed(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(VIEWED_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function saveViewed(ids: Set<string>): void {
  localStorage.setItem(VIEWED_KEY, JSON.stringify([...ids]));
}

export function markAsViewOnce(messageId: string, chatId: string): void {
  const items = loadViewOnce();
  if (!items.some(i => i.messageId === messageId)) {
    items.push({ messageId, chatId, createdAt: new Date().toISOString() });
    saveViewOnce(items);
  }
}

export function isViewOnce(messageId: string): boolean {
  return loadViewOnce().some(i => i.messageId === messageId);
}

export function hasBeenViewed(messageId: string): boolean {
  return loadViewed().has(messageId);
}

export function markAsViewed(messageId: string): void {
  const viewed = loadViewed();
  viewed.add(messageId);
  saveViewed(viewed);
}

export function isViewOnceExpired(messageId: string): boolean {
  return isViewOnce(messageId) && hasBeenViewed(messageId);
}

export function getViewOnceMessages(chatId: string): string[] {
  return loadViewOnce()
    .filter(i => i.chatId === chatId)
    .map(i => i.messageId);
}
