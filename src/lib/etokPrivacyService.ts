export type VideoPrivacy = "everyone" | "friends" | "only_me";
export type InteractionPermission = "everyone" | "friends" | "no_one";

export interface EtokPrivacySettings {
  userId: string;
  privateAccount: boolean;
  isBusinessAccount: boolean;
  defaultVideoPrivacy: VideoPrivacy;
  allowComments: InteractionPermission;
  commentKeywords: string[];
  filterSpam: boolean;
  duetPermission: InteractionPermission;
  stitchPermission: InteractionPermission;
  allowDownload: boolean;
  screenTimeLimitMinutes: number;
  screenTimeReminderEnabled: boolean;
  screenTimeReminderIntervalMinutes: number;
  familyPairingLinked: boolean;
  familyPairingEmail: string;
}

export interface BlockedUser {
  blockerId: string;
  blockedId: string;
  blockedAt: string;
}

export interface ReportedContent {
  id: string;
  reporterId: string;
  contentType: "video" | "user" | "comment" | "live";
  contentId: string;
  reason: string;
  reportedAt: string;
}

const SETTINGS_KEY = "etok_privacy_settings";
const BLOCKED_KEY = "etok_blocked_users";
const REPORTS_KEY = "etok_reports";
const SCREEN_TIME_KEY = "etok_screen_time";

function defaultSettings(userId: string): EtokPrivacySettings {
  return {
    userId,
    privateAccount: false,
    isBusinessAccount: false,
    defaultVideoPrivacy: "everyone",
    allowComments: "everyone",
    commentKeywords: [],
    filterSpam: true,
    duetPermission: "everyone",
    stitchPermission: "everyone",
    allowDownload: true,
    screenTimeLimitMinutes: 0,
    screenTimeReminderEnabled: false,
    screenTimeReminderIntervalMinutes: 30,
    familyPairingLinked: false,
    familyPairingEmail: "",
  };
}

function load<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
  catch { return fallback; }
}
function save(key: string, data: unknown): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getPrivacySettings(userId: string): EtokPrivacySettings {
  const all: EtokPrivacySettings[] = load(SETTINGS_KEY, []);
  return all.find(s => s.userId === userId) ?? defaultSettings(userId);
}

export function savePrivacySettings(settings: EtokPrivacySettings): void {
  const all: EtokPrivacySettings[] = load(SETTINGS_KEY, []);
  const idx = all.findIndex(s => s.userId === settings.userId);
  if (idx >= 0) all[idx] = settings; else all.push(settings);
  save(SETTINGS_KEY, all);
}

export function getBlockedUsers(blockerId: string): BlockedUser[] {
  return load<BlockedUser[]>(BLOCKED_KEY, []).filter(b => b.blockerId === blockerId);
}

export function blockUser(blockerId: string, blockedId: string): void {
  const list = load<BlockedUser[]>(BLOCKED_KEY, []);
  if (!list.some(b => b.blockerId === blockerId && b.blockedId === blockedId)) {
    list.push({ blockerId, blockedId, blockedAt: new Date().toISOString() });
    save(BLOCKED_KEY, list);
  }
}

export function unblockUser(blockerId: string, blockedId: string): void {
  const list = load<BlockedUser[]>(BLOCKED_KEY, []).filter(b => !(b.blockerId === blockerId && b.blockedId === blockedId));
  save(BLOCKED_KEY, list);
}

export function isBlocked(blockerId: string, blockedId: string): boolean {
  return load<BlockedUser[]>(BLOCKED_KEY, []).some(b => b.blockerId === blockerId && b.blockedId === blockedId);
}

export function reportContent(reporterId: string, contentType: ReportedContent["contentType"], contentId: string, reason: string): void {
  const list = load<ReportedContent[]>(REPORTS_KEY, []);
  list.push({ id: Date.now().toString(), reporterId, contentType, contentId, reason, reportedAt: new Date().toISOString() });
  save(REPORTS_KEY, list);
}

export function getScreenTimeToday(): number {
  const today = new Date().toISOString().slice(0, 10);
  const data: Record<string, number> = load(SCREEN_TIME_KEY, {});
  return data[today] ?? 0;
}

export function addScreenTime(minutes: number): void {
  const today = new Date().toISOString().slice(0, 10);
  const data: Record<string, number> = load(SCREEN_TIME_KEY, {});
  data[today] = (data[today] ?? 0) + minutes;
  save(SCREEN_TIME_KEY, data);
}

export function isScreenTimeLimitReached(userId: string): boolean {
  const settings = getPrivacySettings(userId);
  if (!settings.screenTimeLimitMinutes) return false;
  return getScreenTimeToday() >= settings.screenTimeLimitMinutes;
}

export const SCREEN_TIME_OPTIONS = [
  { label: "No limit", value: 0 },
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "4 hours", value: 240 },
];

export const REPORT_REASONS = [
  "Spam or misleading",
  "Nudity or sexual content",
  "Hate speech or discrimination",
  "Violence or dangerous acts",
  "Harassment or bullying",
  "Misinformation",
  "Intellectual property violation",
  "Other",
];
