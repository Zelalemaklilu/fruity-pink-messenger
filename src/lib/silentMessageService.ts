const STORAGE_KEY = "zeshopp_silent_mode";

function loadSilentChats(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveSilentChats(chatIds: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chatIds));
}

export function isSilentMode(chatId: string): boolean {
  return loadSilentChats().includes(chatId);
}

export function toggleSilentMode(chatId: string): boolean {
  const chats = loadSilentChats();
  const index = chats.indexOf(chatId);
  if (index >= 0) {
    chats.splice(index, 1);
    saveSilentChats(chats);
    return false;
  } else {
    chats.push(chatId);
    saveSilentChats(chats);
    return true;
  }
}

export function setSilentMode(chatId: string, silent: boolean): void {
  const chats = loadSilentChats();
  const index = chats.indexOf(chatId);
  if (silent && index < 0) {
    chats.push(chatId);
    saveSilentChats(chats);
  } else if (!silent && index >= 0) {
    chats.splice(index, 1);
    saveSilentChats(chats);
  }
}
