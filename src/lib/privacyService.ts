const PRIVACY_KEY = "zeshopp_privacy_settings";

export interface PrivacySettings {
  lastSeenVisibility: "everyone" | "contacts" | "nobody";
  readReceipts: boolean;
  onlineStatus: boolean;
  profilePhotoVisibility: "everyone" | "contacts" | "nobody";
  forwardedMessages: boolean;
  phoneNumberVisibility: "everyone" | "contacts" | "nobody";
  groupsAddPermission: "everyone" | "contacts";
}

const DEFAULT_SETTINGS: PrivacySettings = {
  lastSeenVisibility: "everyone",
  readReceipts: true,
  onlineStatus: true,
  profilePhotoVisibility: "everyone",
  forwardedMessages: true,
  phoneNumberVisibility: "contacts",
  groupsAddPermission: "everyone",
};

export function getPrivacySettings(): PrivacySettings {
  try {
    const stored = localStorage.getItem(PRIVACY_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function updatePrivacySettings(updates: Partial<PrivacySettings>): PrivacySettings {
  const current = getPrivacySettings();
  const updated = { ...current, ...updates };
  try {
    localStorage.setItem(PRIVACY_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}
