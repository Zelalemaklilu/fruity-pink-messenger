const FOLDERS_KEY = "zeshopp_chat_folders";
const FOLDER_CHATS_PREFIX = "zeshopp_folder_chats_";

export interface ChatFolder {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const DEFAULT_FOLDERS: ChatFolder[] = [];

export function getChatFolders(): ChatFolder[] {
  try {
    const stored = localStorage.getItem(FOLDERS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [...DEFAULT_FOLDERS];
}

export function addChatFolder(folder: ChatFolder): void {
  const folders = getChatFolders();
  folders.push(folder);
  try {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  } catch {}
}

export function removeChatFolder(folderId: string): void {
  const folders = getChatFolders().filter(f => f.id !== folderId);
  try {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    localStorage.removeItem(`${FOLDER_CHATS_PREFIX}${folderId}`);
  } catch {}
}

export function updateChatFolder(folderId: string, updates: Partial<ChatFolder>): void {
  const folders = getChatFolders().map(f => 
    f.id === folderId ? { ...f, ...updates } : f
  );
  try {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  } catch {}
}

export function getFolderChatIds(folderId: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(`${FOLDER_CHATS_PREFIX}${folderId}`) || "[]");
  } catch {
    return [];
  }
}

export function addChatToFolder(folderId: string, chatId: string): void {
  const chatIds = getFolderChatIds(folderId);
  if (!chatIds.includes(chatId)) {
    chatIds.push(chatId);
    try {
      localStorage.setItem(`${FOLDER_CHATS_PREFIX}${folderId}`, JSON.stringify(chatIds));
    } catch {}
  }
}

export function removeChatFromFolder(folderId: string, chatId: string): void {
  const chatIds = getFolderChatIds(folderId).filter(id => id !== chatId);
  try {
    localStorage.setItem(`${FOLDER_CHATS_PREFIX}${folderId}`, JSON.stringify(chatIds));
  } catch {}
}

export function getChatFolderId(chatId: string): string | null {
  const folders = getChatFolders();
  for (const folder of folders) {
    if (getFolderChatIds(folder.id).includes(chatId)) {
      return folder.id;
    }
  }
  return null;
}
