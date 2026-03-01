export interface SecretChat {
  chatId: string;
  enabled: boolean;
  selfDestructTimer: number;
  enabledAt: string;
}

const STORAGE_KEY = "zeshopp_secret_chats";

export const SELF_DESTRUCT_OPTIONS = [
  { value: 0, label: "Off" },
  { value: 30, label: "30s" },
  { value: 60, label: "1m" },
  { value: 300, label: "5m" },
  { value: 3600, label: "1h" },
  { value: 86400, label: "1d" },
];

function loadSecretChats(): SecretChat[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveSecretChats(chats: SecretChat[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

export function isSecretChat(chatId: string): boolean {
  const chats = loadSecretChats();
  return chats.some((c) => c.chatId === chatId && c.enabled);
}

export function enableSecretChat(chatId: string, selfDestructTimer: number = 0): void {
  const chats = loadSecretChats();
  const existing = chats.findIndex((c) => c.chatId === chatId);
  const entry: SecretChat = {
    chatId,
    enabled: true,
    selfDestructTimer,
    enabledAt: new Date().toISOString(),
  };
  if (existing >= 0) {
    chats[existing] = entry;
  } else {
    chats.push(entry);
  }
  saveSecretChats(chats);
}

export function disableSecretChat(chatId: string): void {
  const chats = loadSecretChats();
  saveSecretChats(chats.filter((c) => c.chatId !== chatId));
}

export function getSecretChat(chatId: string): SecretChat | null {
  const chats = loadSecretChats();
  return chats.find((c) => c.chatId === chatId) || null;
}

export function setSelfDestructTimer(chatId: string, seconds: number): void {
  const chats = loadSecretChats();
  const existing = chats.findIndex((c) => c.chatId === chatId);
  if (existing >= 0) {
    chats[existing].selfDestructTimer = seconds;
    saveSecretChats(chats);
  }
}

export function getSelfDestructLabel(seconds: number): string {
  return SELF_DESTRUCT_OPTIONS.find((o) => o.value === seconds)?.label || "Off";
}
