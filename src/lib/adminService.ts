export interface GroupPermissions {
  groupId: string;
  canSendMessages: boolean;
  canSendMedia: boolean;
  canAddMembers: boolean;
  canPinMessages: boolean;
  canChangeInfo: boolean;
  slowModeSeconds: number;
}

export interface AdminAction {
  id: string;
  groupId: string;
  adminId: string;
  action: string;
  targetUserId: string;
  timestamp: string;
}

const PERMISSIONS_KEY = "zeshopp_group_permissions";
const ADMIN_LOG_KEY = "zeshopp_admin_log";
const MUTED_MEMBERS_KEY = "zeshopp_muted_members";

function loadPermissions(): Record<string, GroupPermissions> {
  try {
    return JSON.parse(localStorage.getItem(PERMISSIONS_KEY) || "{}");
  } catch {
    return {};
  }
}

function savePermissions(data: Record<string, GroupPermissions>): void {
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(data));
}

function loadAdminLog(): AdminAction[] {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_LOG_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveAdminLog(log: AdminAction[]): void {
  localStorage.setItem(ADMIN_LOG_KEY, JSON.stringify(log));
}

function loadMutedMembers(): Record<string, string[]> {
  try {
    return JSON.parse(localStorage.getItem(MUTED_MEMBERS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveMutedMembers(data: Record<string, string[]>): void {
  localStorage.setItem(MUTED_MEMBERS_KEY, JSON.stringify(data));
}

export function getGroupPermissions(groupId: string): GroupPermissions {
  const all = loadPermissions();
  if (all[groupId]) return all[groupId];
  return {
    groupId,
    canSendMessages: true,
    canSendMedia: true,
    canAddMembers: true,
    canPinMessages: true,
    canChangeInfo: true,
    slowModeSeconds: 0,
  };
}

export function setGroupPermissions(groupId: string, permissions: Partial<GroupPermissions>): void {
  const all = loadPermissions();
  const existing = all[groupId] || getGroupPermissions(groupId);
  all[groupId] = { ...existing, ...permissions, groupId };
  savePermissions(all);
}

export function isMemberMuted(groupId: string, userId: string): boolean {
  const muted = loadMutedMembers();
  return (muted[groupId] || []).includes(userId);
}

export function muteMember(groupId: string, userId: string): void {
  const muted = loadMutedMembers();
  if (!muted[groupId]) muted[groupId] = [];
  if (!muted[groupId].includes(userId)) {
    muted[groupId].push(userId);
  }
  saveMutedMembers(muted);
}

export function unmuteMember(groupId: string, userId: string): void {
  const muted = loadMutedMembers();
  if (!muted[groupId]) return;
  muted[groupId] = muted[groupId].filter((id) => id !== userId);
  saveMutedMembers(muted);
}

export function getMutedMembers(groupId: string): string[] {
  const muted = loadMutedMembers();
  return muted[groupId] || [];
}

export function logAdminAction(
  groupId: string,
  adminId: string,
  action: string,
  targetUserId: string,
): void {
  const log = loadAdminLog();
  const entry: AdminAction = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    groupId,
    adminId,
    action,
    targetUserId,
    timestamp: new Date().toISOString(),
  };
  log.push(entry);
  saveAdminLog(log);
}

export function getAdminLog(groupId: string): AdminAction[] {
  const log = loadAdminLog();
  return log.filter((entry) => entry.groupId === groupId);
}
