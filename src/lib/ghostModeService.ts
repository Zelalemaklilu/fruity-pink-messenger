/**
 * Ghost Mode Service
 * Read messages without sending read receipts
 * Hide typing indicator and online status
 */

const STORAGE_KEY = "zeshopp_ghost_mode";

export interface GhostModeSettings {
  enabled: boolean;
  hideReadReceipts: boolean;
  hideTyping: boolean;
  hideOnlineStatus: boolean;
}

const DEFAULT_SETTINGS: GhostModeSettings = {
  enabled: false,
  hideReadReceipts: true,
  hideTyping: true,
  hideOnlineStatus: true,
};

export function getGhostMode(): GhostModeSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function setGhostMode(settings: Partial<GhostModeSettings>): GhostModeSettings {
  const current = getGhostMode();
  const updated = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function toggleGhostMode(): boolean {
  const current = getGhostMode();
  const newEnabled = !current.enabled;
  setGhostMode({ enabled: newEnabled });
  return newEnabled;
}

export function isGhostModeActive(): boolean {
  return getGhostMode().enabled;
}

export function shouldSendReadReceipts(): boolean {
  const settings = getGhostMode();
  return !settings.enabled || !settings.hideReadReceipts;
}

export function shouldShowTyping(): boolean {
  const settings = getGhostMode();
  return !settings.enabled || !settings.hideTyping;
}

export function shouldShowOnlineStatus(): boolean {
  const settings = getGhostMode();
  return !settings.enabled || !settings.hideOnlineStatus;
}
