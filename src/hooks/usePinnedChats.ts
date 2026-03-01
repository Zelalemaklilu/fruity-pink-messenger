import { useState, useCallback, useEffect, useMemo } from "react";
import { chatStore } from "@/lib/chatStore";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY_PREFIX = "zeshopp_pinned_chats_";

function loadPinnedForUser(userId: string | undefined): Set<string> {
  try {
    const key = `${STORAGE_KEY_PREFIX}${userId || "anon"}`;
    const raw = localStorage.getItem(key);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function savePinnedForUser(userId: string | undefined, pinned: Set<string>) {
  try {
    const key = `${STORAGE_KEY_PREFIX}${userId || "anon"}`;
    localStorage.setItem(key, JSON.stringify([...pinned]));
  } catch {}
}

export function usePinnedChats() {
  const { user } = useAuth();
  const userId = user?.id;
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => loadPinnedForUser(userId));

  useEffect(() => {
    setPinnedIds(loadPinnedForUser(userId));
  }, [userId]);

  const togglePin = useCallback((chatId: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(chatId)) {
        next.delete(chatId);
      } else {
        next.add(chatId);
      }
      savePinnedForUser(userId, next);
      return next;
    });
  }, [userId]);

  const isPinned = useCallback(
    (chatId: string) => pinnedIds.has(chatId),
    [pinnedIds]
  );

  return { pinnedIds, togglePin, isPinned };
}
