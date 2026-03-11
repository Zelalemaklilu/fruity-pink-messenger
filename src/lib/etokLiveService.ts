export interface LiveGiftItem {
  id: string;
  emoji: string;
  name: string;
  coins: number;
  animationColor: string;
}

export interface EtokLiveStream {
  id: string;
  hostId: string;
  title: string;
  category: string;
  viewerCount: number;
  giftTotal: number;
  startedAt: string;
  thumbnailColor: string;
  thumbnailEmoji: string;
  isLive: boolean;
  guestIds: string[];
  moderatorIds: string[];
  mutedUserIds: string[];
  blockedUserIds: string[];
  battlePartnerId?: string;
  battleHostScore?: number;
  battlePartnerScore?: number;
  battleEndsAt?: string;
}

export interface LiveComment {
  id: string;
  streamId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  isGift?: boolean;
  giftEmoji?: string;
  createdAt: string;
}

export interface ScheduledLive {
  id: string;
  hostId: string;
  title: string;
  scheduledAt: string;
  category: string;
  reminderIds: string[];
  thumbnailEmoji: string;
}

export const LIVE_GIFTS: LiveGiftItem[] = [
  { id: "lg1", emoji: "🌹", name: "Rose", coins: 1, animationColor: "#ff4444" },
  { id: "lg2", emoji: "🍭", name: "Lollipop", coins: 5, animationColor: "#ff88cc" },
  { id: "lg3", emoji: "🍩", name: "Doughnut", coins: 10, animationColor: "#ffaa00" },
  { id: "lg4", emoji: "🍦", name: "Ice Cream", coins: 30, animationColor: "#aaddff" },
  { id: "lg5", emoji: "💎", name: "Diamond", coins: 100, animationColor: "#88ddff" },
  { id: "lg6", emoji: "👑", name: "Crown", coins: 500, animationColor: "#ffd700" },
  { id: "lg7", emoji: "🚀", name: "Rocket", coins: 200, animationColor: "#ff6622" },
  { id: "lg8", emoji: "🦁", name: "Lion", coins: 50, animationColor: "#ffbb44" },
  { id: "lg9", emoji: "🌈", name: "Rainbow", coins: 150, animationColor: "#ff88ff" },
  { id: "lg10", emoji: "⚡", name: "Thunder", coins: 80, animationColor: "#ffff44" },
  { id: "lg11", emoji: "🏆", name: "Trophy", coins: 1000, animationColor: "#ffd700" },
  { id: "lg12", emoji: "🎆", name: "Fireworks", coins: 300, animationColor: "#ff4488" },
];

const LIVE_KEY = "etok_lives";
const LIVE_COMMENTS_KEY = "etok_live_comments";
const SCHEDULED_KEY = "etok_scheduled_lives";
const COINS_KEY = "etok_coins_balance";
const VERSION_KEY = "etok_live_version";
const CURRENT_VERSION = "1";

const BG_COLORS = [
  "from-violet-900 to-purple-900",
  "from-rose-900 to-pink-900",
  "from-blue-900 to-indigo-900",
  "from-emerald-900 to-teal-900",
  "from-orange-900 to-red-900",
  "from-cyan-900 to-blue-900",
];

const CATEGORIES = ["Music", "Gaming", "Food", "Education", "Comedy", "Dance", "Travel", "Fitness", "Art", "Fashion"];

const DEMO_LIVES: EtokLiveStream[] = [
  { id: "live1", hostId: "u7", title: "Live Music Session 🎵 Playing your requests!", category: "Music", viewerCount: 12400, giftTotal: 8900, startedAt: new Date(Date.now() - 35 * 60000).toISOString(), thumbnailColor: BG_COLORS[0], thumbnailEmoji: "🎵", isLive: true, guestIds: [], moderatorIds: [], mutedUserIds: [], blockedUserIds: [] },
  { id: "live2", hostId: "u5", title: "Comedy Night — Roast session! 😂", category: "Comedy", viewerCount: 34500, giftTotal: 23000, startedAt: new Date(Date.now() - 72 * 60000).toISOString(), thumbnailColor: BG_COLORS[1], thumbnailEmoji: "😂", isLive: true, guestIds: ["u1"], moderatorIds: [], mutedUserIds: [], blockedUserIds: [] },
  { id: "live3", hostId: "u4", title: "Live Workout — Join me! 💪", category: "Fitness", viewerCount: 5600, giftTotal: 2300, startedAt: new Date(Date.now() - 18 * 60000).toISOString(), thumbnailColor: BG_COLORS[2], thumbnailEmoji: "💪", isLive: true, guestIds: [], moderatorIds: [], mutedUserIds: [], blockedUserIds: [] },
  { id: "live4", hostId: "u6", title: "Speed art — drawing your portraits! 🎨", category: "Art", viewerCount: 2800, giftTotal: 1200, startedAt: new Date(Date.now() - 45 * 60000).toISOString(), thumbnailColor: BG_COLORS[3], thumbnailEmoji: "🎨", isLive: true, guestIds: [], moderatorIds: [], mutedUserIds: [], blockedUserIds: [] },
  { id: "live5", hostId: "u8", title: "Fashion haul — new Ethiopian designers! 👗", category: "Fashion", viewerCount: 8900, giftTotal: 5600, startedAt: new Date(Date.now() - 25 * 60000).toISOString(), thumbnailColor: BG_COLORS[4], thumbnailEmoji: "👗", isLive: true, guestIds: [], moderatorIds: [], mutedUserIds: [], blockedUserIds: [] },
  { id: "live6", hostId: "u3", title: "Q&A — ask me anything about travel! ✈️", category: "Travel", viewerCount: 4200, giftTotal: 1800, startedAt: new Date(Date.now() - 60 * 60000).toISOString(), thumbnailColor: BG_COLORS[5], thumbnailEmoji: "✈️", isLive: true, guestIds: [], moderatorIds: [], mutedUserIds: [], blockedUserIds: [] },
];

const DEMO_SCHEDULED: ScheduledLive[] = [
  { id: "sl1", hostId: "u7", title: "Album Release Party LIVE 🎉", scheduledAt: new Date(Date.now() + 2 * 24 * 3600000).toISOString(), category: "Music", reminderIds: [], thumbnailEmoji: "🎉" },
  { id: "sl2", hostId: "u1", title: "Dance Battle Championship 🏆", scheduledAt: new Date(Date.now() + 5 * 24 * 3600000).toISOString(), category: "Dance", reminderIds: [], thumbnailEmoji: "🏆" },
  { id: "sl3", hostId: "u2", title: "Ethiopian New Year Cooking Special 🍲", scheduledAt: new Date(Date.now() + 7 * 24 * 3600000).toISOString(), category: "Food", reminderIds: [], thumbnailEmoji: "🍲" },
];

function initLiveData(): void {
  if (localStorage.getItem(VERSION_KEY) === CURRENT_VERSION) return;
  localStorage.setItem(LIVE_KEY, JSON.stringify(DEMO_LIVES));
  localStorage.setItem(LIVE_COMMENTS_KEY, JSON.stringify([]));
  localStorage.setItem(SCHEDULED_KEY, JSON.stringify(DEMO_SCHEDULED));
  localStorage.setItem(COINS_KEY, "500");
  localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
}

initLiveData();

function load<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
  catch { return fallback; }
}
function save(key: string, data: unknown): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getCoinsBalance(): number {
  return parseInt(localStorage.getItem(COINS_KEY) || "500", 10);
}
export function addCoins(amount: number): void {
  localStorage.setItem(COINS_KEY, String(getCoinsBalance() + amount));
}
export function deductCoins(amount: number): boolean {
  const b = getCoinsBalance();
  if (b < amount) return false;
  localStorage.setItem(COINS_KEY, String(b - amount));
  return true;
}

export function getActiveLives(): EtokLiveStream[] {
  return load<EtokLiveStream[]>(LIVE_KEY, []).filter(l => l.isLive);
}
export function getLivesByCategory(cat: string): EtokLiveStream[] {
  if (cat === "All") return getActiveLives();
  return getActiveLives().filter(l => l.category === cat);
}
export function getLiveById(id: string): EtokLiveStream | undefined {
  return load<EtokLiveStream[]>(LIVE_KEY, []).find(l => l.id === id);
}
export { CATEGORIES };

export function startLive(hostId: string, title: string, category: string): EtokLiveStream {
  const lives = load<EtokLiveStream[]>(LIVE_KEY, []);
  const newLive: EtokLiveStream = {
    id: "live" + Date.now(),
    hostId, title, category,
    viewerCount: 1, giftTotal: 0,
    startedAt: new Date().toISOString(),
    thumbnailColor: BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)],
    thumbnailEmoji: "📡",
    isLive: true,
    guestIds: [], moderatorIds: [], mutedUserIds: [], blockedUserIds: [],
  };
  lives.push(newLive);
  save(LIVE_KEY, lives);
  return newLive;
}

export function endLive(streamId: string): void {
  const lives = load<EtokLiveStream[]>(LIVE_KEY, []);
  const l = lives.find(l => l.id === streamId);
  if (l) { l.isLive = false; save(LIVE_KEY, lives); }
}

export function joinLive(streamId: string): void {
  const lives = load<EtokLiveStream[]>(LIVE_KEY, []);
  const l = lives.find(l => l.id === streamId);
  if (l) { l.viewerCount += 1; save(LIVE_KEY, lives); }
}

export function leaveLive(streamId: string): void {
  const lives = load<EtokLiveStream[]>(LIVE_KEY, []);
  const l = lives.find(l => l.id === streamId);
  if (l) { l.viewerCount = Math.max(0, l.viewerCount - 1); save(LIVE_KEY, lives); }
}

export function getLiveComments(streamId: string): LiveComment[] {
  return load<LiveComment[]>(LIVE_COMMENTS_KEY, []).filter(c => c.streamId === streamId);
}

export function addLiveComment(streamId: string, authorId: string, authorName: string, authorAvatar: string, text: string, isGift?: boolean, giftEmoji?: string): LiveComment {
  const comments = load<LiveComment[]>(LIVE_COMMENTS_KEY, []);
  const c: LiveComment = {
    id: Date.now().toString() + Math.random(),
    streamId, authorId, authorName, authorAvatar, text,
    isGift, giftEmoji,
    createdAt: new Date().toISOString(),
  };
  comments.push(c);
  const recent = comments.filter(x => x.streamId === streamId).slice(-100);
  const others = comments.filter(x => x.streamId !== streamId);
  save(LIVE_COMMENTS_KEY, [...others, ...recent]);
  return c;
}

export function sendLiveGift(streamId: string, giftId: string, senderId: string, senderName: string, senderAvatar: string): boolean {
  const gift = LIVE_GIFTS.find(g => g.id === giftId);
  if (!gift) return false;
  if (!deductCoins(gift.coins)) return false;
  const lives = load<EtokLiveStream[]>(LIVE_KEY, []);
  const l = lives.find(l => l.id === streamId);
  if (l) { l.giftTotal += gift.coins; save(LIVE_KEY, lives); }
  addLiveComment(streamId, senderId, senderName, senderAvatar, `sent a ${gift.name}`, true, gift.emoji);
  return true;
}

export function muteUser(streamId: string, userId: string): void {
  const lives = load<EtokLiveStream[]>(LIVE_KEY, []);
  const l = lives.find(l => l.id === streamId);
  if (l && !l.mutedUserIds.includes(userId)) { l.mutedUserIds.push(userId); save(LIVE_KEY, lives); }
}

export function blockFromLive(streamId: string, userId: string): void {
  const lives = load<EtokLiveStream[]>(LIVE_KEY, []);
  const l = lives.find(l => l.id === streamId);
  if (l && !l.blockedUserIds.includes(userId)) { l.blockedUserIds.push(userId); save(LIVE_KEY, lives); }
}

export function startBattle(streamId: string, partnerId: string): void {
  const lives = load<EtokLiveStream[]>(LIVE_KEY, []);
  const l = lives.find(l => l.id === streamId);
  if (l) {
    l.battlePartnerId = partnerId;
    l.battleHostScore = 0;
    l.battlePartnerScore = 0;
    l.battleEndsAt = new Date(Date.now() + 60000).toISOString();
    save(LIVE_KEY, lives);
  }
}

export function getScheduledLives(): ScheduledLive[] { return load(SCHEDULED_KEY, []); }
export function scheduleLiveEvent(hostId: string, title: string, scheduledAt: string, category: string): ScheduledLive {
  const all = getScheduledLives();
  const s: ScheduledLive = { id: "sl" + Date.now(), hostId, title, scheduledAt, category, reminderIds: [], thumbnailEmoji: "📅" };
  all.push(s);
  save(SCHEDULED_KEY, all);
  return s;
}

export function toggleReminder(scheduleId: string, userId: string): boolean {
  const all = getScheduledLives();
  const s = all.find(x => x.id === scheduleId);
  if (!s) return false;
  const idx = s.reminderIds.indexOf(userId);
  if (idx >= 0) s.reminderIds.splice(idx, 1);
  else s.reminderIds.push(userId);
  save(SCHEDULED_KEY, all);
  return !s.reminderIds.includes(userId);
}
