const USERNAMES_KEY = "zeshopp_usernames";
const USER_USERNAME_PREFIX = "zeshopp_user_username_";

function getUsernameMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(USERNAMES_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveUsernameMap(map: Record<string, string>): void {
  localStorage.setItem(USERNAMES_KEY, JSON.stringify(map));
}

export function setUsername(userId: string, username: string): { success: boolean; error?: string } {
  const normalized = username.toLowerCase().trim();

  if (normalized.length < 3 || normalized.length > 30) {
    return { success: false, error: "Username must be 3-30 characters" };
  }

  if (!/^[a-z0-9_]+$/.test(normalized)) {
    return { success: false, error: "Only lowercase letters, numbers, and underscores allowed" };
  }

  const map = getUsernameMap();

  if (map[normalized] && map[normalized] !== userId) {
    return { success: false, error: "Username is already taken" };
  }

  const currentUsername = getUsername(userId);
  if (currentUsername && currentUsername !== normalized) {
    delete map[currentUsername];
  }

  map[normalized] = userId;
  saveUsernameMap(map);
  localStorage.setItem(`${USER_USERNAME_PREFIX}${userId}`, normalized);

  return { success: true };
}

export function getUsername(userId: string): string | null {
  return localStorage.getItem(`${USER_USERNAME_PREFIX}${userId}`) || null;
}

export function getUserIdByUsername(username: string): string | null {
  const map = getUsernameMap();
  return map[username.toLowerCase().trim()] || null;
}

export function isUsernameAvailable(username: string): boolean {
  const normalized = username.toLowerCase().trim();
  if (normalized.length < 3 || normalized.length > 30) return false;
  if (!/^[a-z0-9_]+$/.test(normalized)) return false;
  const map = getUsernameMap();
  return !map[normalized];
}

export function generateShareLink(username: string): string {
  return `zeshopp.app/u/${username.toLowerCase().trim()}`;
}

export function searchByUsername(query: string): Array<{ username: string; userId: string }> {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return [];
  const map = getUsernameMap();
  return Object.entries(map)
    .filter(([uname]) => uname.includes(normalized))
    .map(([username, userId]) => ({ username, userId }));
}
