export interface SlowModeConfig {
  groupId: string;
  intervalSeconds: number;
  lastMessageTimes: Record<string, string>;
}

const STORAGE_KEY = "zeshopp_slow_mode";

export const SLOW_MODE_OPTIONS = [
  { value: 0, label: "Off" },
  { value: 10, label: "10s" },
  { value: 30, label: "30s" },
  { value: 60, label: "1m" },
  { value: 300, label: "5m" },
  { value: 900, label: "15m" },
  { value: 3600, label: "1h" },
];

function loadConfigs(): SlowModeConfig[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveConfigs(configs: SlowModeConfig[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

export function getSlowMode(groupId: string): SlowModeConfig | null {
  const configs = loadConfigs();
  return configs.find((c) => c.groupId === groupId) || null;
}

export function setSlowMode(groupId: string, intervalSeconds: number): void {
  const configs = loadConfigs();
  const existing = configs.findIndex((c) => c.groupId === groupId);
  const entry: SlowModeConfig = {
    groupId,
    intervalSeconds,
    lastMessageTimes: existing >= 0 ? configs[existing].lastMessageTimes : {},
  };
  if (existing >= 0) {
    configs[existing] = entry;
  } else {
    configs.push(entry);
  }
  saveConfigs(configs);
}

export function removeSlowMode(groupId: string): void {
  const configs = loadConfigs();
  saveConfigs(configs.filter((c) => c.groupId !== groupId));
}

export function canSendMessage(groupId: string, userId: string): { allowed: boolean; remainingSeconds: number } {
  const config = getSlowMode(groupId);
  if (!config || config.intervalSeconds === 0) {
    return { allowed: true, remainingSeconds: 0 };
  }
  const lastTime = config.lastMessageTimes[userId];
  if (!lastTime) {
    return { allowed: true, remainingSeconds: 0 };
  }
  const elapsed = (Date.now() - new Date(lastTime).getTime()) / 1000;
  if (elapsed >= config.intervalSeconds) {
    return { allowed: true, remainingSeconds: 0 };
  }
  return {
    allowed: false,
    remainingSeconds: Math.ceil(config.intervalSeconds - elapsed),
  };
}

export function recordMessageSent(groupId: string, userId: string): void {
  const configs = loadConfigs();
  const existing = configs.findIndex((c) => c.groupId === groupId);
  if (existing >= 0) {
    configs[existing].lastMessageTimes[userId] = new Date().toISOString();
    saveConfigs(configs);
  }
}

export function getSlowModeLabel(seconds: number): string {
  return SLOW_MODE_OPTIONS.find((o) => o.value === seconds)?.label || "Off";
}
