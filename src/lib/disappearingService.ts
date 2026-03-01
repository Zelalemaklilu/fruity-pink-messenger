const DISAPPEARING_PREFIX = "zeshopp_disappearing_";

export type DisappearingTimer = "off" | "24h" | "7d" | "30d";

export const TIMER_OPTIONS: { value: DisappearingTimer; label: string; seconds: number }[] = [
  { value: "off", label: "Off", seconds: 0 },
  { value: "24h", label: "24 hours", seconds: 86400 },
  { value: "7d", label: "7 days", seconds: 604800 },
  { value: "30d", label: "30 days", seconds: 2592000 },
];

export function getDisappearingTimer(chatId: string): DisappearingTimer {
  try {
    const val = localStorage.getItem(`${DISAPPEARING_PREFIX}${chatId}`);
    if (val && TIMER_OPTIONS.some(o => o.value === val)) return val as DisappearingTimer;
  } catch {}
  return "off";
}

export function setDisappearingTimer(chatId: string, timer: DisappearingTimer): void {
  try {
    if (timer === "off") {
      localStorage.removeItem(`${DISAPPEARING_PREFIX}${chatId}`);
    } else {
      localStorage.setItem(`${DISAPPEARING_PREFIX}${chatId}`, timer);
    }
  } catch {}
}

export function getTimerLabel(timer: DisappearingTimer): string {
  return TIMER_OPTIONS.find(o => o.value === timer)?.label || "Off";
}

export function getTimerSeconds(timer: DisappearingTimer): number {
  return TIMER_OPTIONS.find(o => o.value === timer)?.seconds || 0;
}
