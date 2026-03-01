export interface ChatTheme {
  chatId: string;
  bubbleColor: string;
  accentColor: string;
  fontSize: "small" | "medium" | "large";
}

const STORAGE_KEY = "zeshopp_chat_themes";

const PRESET_THEMES = [
  { name: "Default", bubbleColor: "", accentColor: "" },
  { name: "Ocean", bubbleColor: "hsl(210, 80%, 45%)", accentColor: "hsl(200, 70%, 50%)" },
  { name: "Forest", bubbleColor: "hsl(145, 60%, 35%)", accentColor: "hsl(120, 50%, 40%)" },
  { name: "Sunset", bubbleColor: "hsl(25, 85%, 50%)", accentColor: "hsl(15, 80%, 55%)" },
  { name: "Berry", bubbleColor: "hsl(300, 60%, 40%)", accentColor: "hsl(280, 55%, 45%)" },
  { name: "Rose", bubbleColor: "hsl(338, 85%, 50%)", accentColor: "hsl(350, 80%, 55%)" },
  { name: "Midnight", bubbleColor: "hsl(230, 70%, 30%)", accentColor: "hsl(220, 60%, 40%)" },
  { name: "Amber", bubbleColor: "hsl(38, 92%, 45%)", accentColor: "hsl(45, 85%, 50%)" },
];

function loadThemes(): Record<string, ChatTheme> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveThemes(themes: Record<string, ChatTheme>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
}

export function getChatTheme(chatId: string): ChatTheme | null {
  const themes = loadThemes();
  return themes[chatId] || null;
}

export function setChatTheme(chatId: string, theme: Partial<ChatTheme>): void {
  const themes = loadThemes();
  const existing = themes[chatId] || {
    chatId,
    bubbleColor: "",
    accentColor: "",
    fontSize: "medium" as const,
  };
  themes[chatId] = { ...existing, ...theme, chatId };
  saveThemes(themes);
}

export function removeChatTheme(chatId: string): void {
  const themes = loadThemes();
  delete themes[chatId];
  saveThemes(themes);
}

export function getPresetThemes(): typeof PRESET_THEMES {
  return PRESET_THEMES;
}

export { PRESET_THEMES };
