const ARCHIVE_KEY = "zeshopp_archived_chats";

export function getArchivedChatIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function archiveChat(chatId: string): void {
  try {
    const archived = getArchivedChatIds();
    if (!archived.includes(chatId)) {
      archived.push(chatId);
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archived));
    }
  } catch {}
}

export function unarchiveChat(chatId: string): void {
  try {
    const archived = getArchivedChatIds().filter(id => id !== chatId);
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archived));
  } catch {}
}

export function isChatArchived(chatId: string): boolean {
  return getArchivedChatIds().includes(chatId);
}
