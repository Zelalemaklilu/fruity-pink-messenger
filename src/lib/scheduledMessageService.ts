export interface ScheduledMessage {
  id: string;
  chatId: string;
  text: string;
  scheduledAt: string;
  createdAt: string;
}

const STORAGE_KEY = "zeshopp_scheduled_messages";

function loadMessages(): ScheduledMessage[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveMessages(messages: ScheduledMessage[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

export function getScheduledMessages(chatId?: string): ScheduledMessage[] {
  const messages = loadMessages();
  if (chatId) {
    return messages.filter((m) => m.chatId === chatId);
  }
  return messages;
}

export function addScheduledMessage(
  chatId: string,
  text: string,
  scheduledAt: Date,
): ScheduledMessage {
  const messages = loadMessages();
  const newMessage: ScheduledMessage = {
    id: Date.now().toString(),
    chatId,
    text,
    scheduledAt: scheduledAt.toISOString(),
    createdAt: new Date().toISOString(),
  };
  messages.push(newMessage);
  saveMessages(messages);
  return newMessage;
}

export function removeScheduledMessage(id: string): void {
  const messages = loadMessages();
  saveMessages(messages.filter((m) => m.id !== id));
}

export function getReadyMessages(): ScheduledMessage[] {
  const messages = loadMessages();
  const now = new Date();
  return messages.filter((m) => new Date(m.scheduledAt) <= now);
}

export function clearSentMessages(ids: string[]): void {
  const messages = loadMessages();
  const idSet = new Set(ids);
  saveMessages(messages.filter((m) => !idSet.has(m.id)));
}
