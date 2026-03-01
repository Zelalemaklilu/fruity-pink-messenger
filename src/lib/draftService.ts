const DRAFT_PREFIX = "zeshopp_draft_";

export function getDraft(chatId: string): string {
  try {
    return localStorage.getItem(`${DRAFT_PREFIX}${chatId}`) || "";
  } catch {
    return "";
  }
}

export function saveDraft(chatId: string, text: string): void {
  try {
    if (text.trim()) {
      localStorage.setItem(`${DRAFT_PREFIX}${chatId}`, text);
    } else {
      localStorage.removeItem(`${DRAFT_PREFIX}${chatId}`);
    }
  } catch {}
}

export function clearDraft(chatId: string): void {
  try {
    localStorage.removeItem(`${DRAFT_PREFIX}${chatId}`);
  } catch {}
}

export function hasDraft(chatId: string): boolean {
  try {
    const draft = localStorage.getItem(`${DRAFT_PREFIX}${chatId}`);
    return !!draft && draft.trim().length > 0;
  } catch {
    return false;
  }
}
