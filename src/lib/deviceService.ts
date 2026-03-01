export interface DeviceSession {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: "desktop" | "mobile" | "tablet" | "web";
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  createdAt: string;
  isCurrent: boolean;
}

const SESSIONS_KEY_PREFIX = "zeshopp_device_sessions_";
const CURRENT_SESSION_ID_KEY = "zeshopp_current_session_id";

function getStorageKey(userId: string): string {
  return `${SESSIONS_KEY_PREFIX}${userId}`;
}

function loadSessions(userId: string): DeviceSession[] {
  try {
    const data = localStorage.getItem(getStorageKey(userId));
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveSessions(userId: string, sessions: DeviceSession[]): void {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(sessions));
}

function getCurrentSessionId(): string | null {
  return localStorage.getItem(CURRENT_SESSION_ID_KEY);
}

export function getCurrentDevice(): {
  deviceName: string;
  deviceType: "desktop" | "mobile" | "tablet" | "web";
  browser: string;
  os: string;
} {
  const ua = navigator.userAgent;

  let browser = "Unknown Browser";
  if (ua.includes("Edg/")) browser = "Microsoft Edge";
  else if (ua.includes("Chrome/") && !ua.includes("Edg/")) browser = "Google Chrome";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Safari";
  else if (ua.includes("Opera/") || ua.includes("OPR/")) browser = "Opera";

  let os = "Unknown OS";
  if (ua.includes("Windows NT 10")) os = "Windows 10";
  else if (ua.includes("Windows NT 11") || (ua.includes("Windows NT 10") && ua.includes("Win64"))) os = "Windows";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("iPhone")) os = "iOS";
  else if (ua.includes("iPad")) os = "iPadOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("CrOS")) os = "ChromeOS";

  let deviceType: "desktop" | "mobile" | "tablet" | "web" = "desktop";
  if (/iPad|tablet/i.test(ua) || (ua.includes("Android") && !ua.includes("Mobile"))) {
    deviceType = "tablet";
  } else if (/iPhone|iPod|Android.*Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    deviceType = "mobile";
  } else if (window.innerWidth < 768) {
    deviceType = "mobile";
  } else if (window.innerWidth < 1024) {
    deviceType = "tablet";
  }

  const deviceName = `${browser} on ${os}`;

  return { deviceName, deviceType, browser, os };
}

function generateMockIp(): string {
  const octets = [
    Math.floor(Math.random() * 200) + 10,
    Math.floor(Math.random() * 255),
    "x",
    "x",
  ];
  return octets.join(".");
}

export function registerDevice(userId: string): DeviceSession {
  const sessions = loadSessions(userId);
  const existingId = getCurrentSessionId();

  if (existingId) {
    const existing = sessions.find((s) => s.id === existingId);
    if (existing) {
      existing.lastActive = new Date().toISOString();
      existing.isCurrent = true;
      sessions.forEach((s) => {
        if (s.id !== existingId) s.isCurrent = false;
      });
      saveSessions(userId, sessions);
      return existing;
    }
  }

  const device = getCurrentDevice();
  const session: DeviceSession = {
    id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    deviceName: device.deviceName,
    deviceType: device.deviceType,
    browser: device.browser,
    os: device.os,
    ipAddress: generateMockIp(),
    location: "Current Location",
    lastActive: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    isCurrent: true,
  };

  sessions.forEach((s) => (s.isCurrent = false));
  sessions.unshift(session);
  saveSessions(userId, sessions);
  localStorage.setItem(CURRENT_SESSION_ID_KEY, session.id);

  if (sessions.length === 1) {
    generateMockSessions(userId);
  }

  return session;
}

export function getDeviceSessions(userId: string): DeviceSession[] {
  const sessions = loadSessions(userId);
  if (sessions.length === 0) {
    registerDevice(userId);
    return loadSessions(userId);
  }
  return sessions;
}

export function terminateSession(userId: string, sessionId: string): void {
  const sessions = loadSessions(userId);
  const filtered = sessions.filter((s) => s.id !== sessionId);
  saveSessions(userId, filtered);
}

export function terminateAllOtherSessions(userId: string): number {
  const sessions = loadSessions(userId);
  const currentId = getCurrentSessionId();
  const others = sessions.filter((s) => s.id !== currentId);
  const current = sessions.filter((s) => s.id === currentId);
  saveSessions(userId, current);
  return others.length;
}

const MOCK_DEVICES: Array<{
  deviceName: string;
  deviceType: "desktop" | "mobile" | "tablet" | "web";
  browser: string;
  os: string;
  location: string;
}> = [
  { deviceName: "Safari on iPhone", deviceType: "mobile", browser: "Safari", os: "iOS 17.2", location: "Lagos, Nigeria" },
  { deviceName: "Chrome on Windows", deviceType: "desktop", browser: "Google Chrome", os: "Windows 11", location: "London, UK" },
  { deviceName: "Firefox on macOS", deviceType: "desktop", browser: "Firefox", os: "macOS Sonoma", location: "New York, US" },
  { deviceName: "Samsung Internet on Android", deviceType: "mobile", browser: "Samsung Internet", os: "Android 14", location: "Nairobi, Kenya" },
  { deviceName: "Chrome on iPad", deviceType: "tablet", browser: "Google Chrome", os: "iPadOS 17", location: "Accra, Ghana" },
];

export function generateMockSessions(userId: string): void {
  const sessions = loadSessions(userId);
  const count = 2 + Math.floor(Math.random() * 2);
  const shuffled = [...MOCK_DEVICES].sort(() => Math.random() - 0.5);

  for (let i = 0; i < count && i < shuffled.length; i++) {
    const mock = shuffled[i];
    const hoursAgo = Math.floor(Math.random() * 72) + 1;
    const lastActive = new Date(Date.now() - hoursAgo * 3600000).toISOString();
    const createdAt = new Date(Date.now() - (hoursAgo + Math.floor(Math.random() * 168)) * 3600000).toISOString();

    sessions.push({
      id: `session_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      deviceName: mock.deviceName,
      deviceType: mock.deviceType,
      browser: mock.browser,
      os: mock.os,
      ipAddress: generateMockIp(),
      location: mock.location,
      lastActive,
      createdAt,
      isCurrent: false,
    });
  }

  saveSessions(userId, sessions);
}

export function getActiveDeviceCount(userId: string): number {
  return getDeviceSessions(userId).length;
}
