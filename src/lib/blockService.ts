import { supabase } from "@/integrations/supabase/client";

const BLOCK_KEY = "zeshopp_blocked_users";

function getLocalBlocked(): string[] {
  try {
    return JSON.parse(localStorage.getItem(BLOCK_KEY) || "[]");
  } catch {
    return [];
  }
}

function setLocalBlocked(ids: string[]): void {
  try {
    localStorage.setItem(BLOCK_KEY, JSON.stringify(ids));
  } catch {}
}

export function isUserBlocked(userId: string): boolean {
  return getLocalBlocked().includes(userId);
}

export function blockUser(userId: string): void {
  const blocked = getLocalBlocked();
  if (!blocked.includes(userId)) {
    blocked.push(userId);
    setLocalBlocked(blocked);
  }
}

export function unblockUser(userId: string): void {
  const blocked = getLocalBlocked().filter(id => id !== userId);
  setLocalBlocked(blocked);
}

export function getBlockedUsers(): string[] {
  return getLocalBlocked();
}
