export interface Channel {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  isPublic: boolean;
  subscriberCount: number;
  avatarColor: string;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: string;
  type: 'text' | 'image' | 'announcement';
  views: number;
  edited: boolean;
}

const CHANNELS_KEY = 'zeshopp_channels';
const channelMessagesKey = (id: string) => `zeshopp_channel_messages_${id}`;
const channelSubscribersKey = (id: string) => `zeshopp_channel_subscribers_${id}`;

const AVATAR_COLORS = [
  'hsl(210, 80%, 55%)',
  'hsl(145, 65%, 42%)',
  'hsl(340, 75%, 55%)',
  'hsl(260, 70%, 58%)',
  'hsl(25, 85%, 55%)',
  'hsl(185, 70%, 42%)',
  'hsl(45, 85%, 50%)',
  'hsl(0, 70%, 55%)',
];

function randomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getChannels(): Channel[] {
  return readJson<Channel[]>(CHANNELS_KEY, []);
}

export function createChannel(name: string, description: string, userId: string): Channel {
  const channels = getChannels();
  const channel: Channel = {
    id: `ch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    description,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    isPublic: true,
    subscriberCount: 0,
    avatarColor: randomAvatarColor(),
  };
  channels.push(channel);
  writeJson(CHANNELS_KEY, channels);
  return channel;
}

export function getChannel(id: string): Channel | undefined {
  return getChannels().find(c => c.id === id);
}

export function deleteChannel(id: string): void {
  const channels = getChannels().filter(c => c.id !== id);
  writeJson(CHANNELS_KEY, channels);
  localStorage.removeItem(channelMessagesKey(id));
  localStorage.removeItem(channelSubscribersKey(id));
}

export function updateChannel(id: string, updates: Partial<Channel>): Channel | undefined {
  const channels = getChannels();
  const idx = channels.findIndex(c => c.id === id);
  if (idx === -1) return undefined;
  channels[idx] = { ...channels[idx], ...updates, id };
  writeJson(CHANNELS_KEY, channels);
  return channels[idx];
}

function getSubscribers(channelId: string): string[] {
  return readJson<string[]>(channelSubscribersKey(channelId), []);
}

function setSubscribers(channelId: string, subs: string[]): void {
  writeJson(channelSubscribersKey(channelId), subs);
  const channels = getChannels();
  const idx = channels.findIndex(c => c.id === channelId);
  if (idx !== -1) {
    channels[idx].subscriberCount = subs.length;
    writeJson(CHANNELS_KEY, channels);
  }
}

export function subscribeToChannel(channelId: string, userId: string): void {
  const subs = getSubscribers(channelId);
  if (!subs.includes(userId)) {
    subs.push(userId);
    setSubscribers(channelId, subs);
  }
}

export function unsubscribeFromChannel(channelId: string, userId: string): void {
  const subs = getSubscribers(channelId).filter(s => s !== userId);
  setSubscribers(channelId, subs);
}

export function isSubscribed(channelId: string, userId: string): boolean {
  return getSubscribers(channelId).includes(userId);
}

export function getSubscriberCount(channelId: string): number {
  return getSubscribers(channelId).length;
}

export function getChannelMessages(channelId: string): ChannelMessage[] {
  return readJson<ChannelMessage[]>(channelMessagesKey(channelId), []);
}

export function sendChannelMessage(
  channelId: string,
  content: string,
  senderId: string,
  senderName: string,
  type: string = 'text'
): ChannelMessage {
  const messages = getChannelMessages(channelId);
  const message: ChannelMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    channelId,
    content,
    senderId,
    senderName,
    createdAt: new Date().toISOString(),
    type: type as ChannelMessage['type'],
    views: 0,
    edited: false,
  };
  messages.push(message);
  writeJson(channelMessagesKey(channelId), messages);
  return message;
}

export function deleteChannelMessage(channelId: string, messageId: string): void {
  const messages = getChannelMessages(channelId).filter(m => m.id !== messageId);
  writeJson(channelMessagesKey(channelId), messages);
}

export function getMyChannels(userId: string): Channel[] {
  return getChannels().filter(c => c.createdBy === userId);
}

export function getSubscribedChannels(userId: string): Channel[] {
  return getChannels().filter(c => isSubscribed(c.id, userId) && c.createdBy !== userId);
}
