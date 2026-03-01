const STORAGE_KEY = "zeshopp_translations";
const PREFERRED_LANG_KEY = "zeshopp_translate_lang";

export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "am", name: "Amharic" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "ar", name: "Arabic" },
  { code: "zh", name: "Chinese" },
  { code: "hi", name: "Hindi" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "de", name: "German" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "tr", name: "Turkish" },
  { code: "it", name: "Italian" },
  { code: "sw", name: "Swahili" },
];

function loadTranslations(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveTranslations(translations: Record<string, string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(translations));
}

export function getPreferredLanguage(): string {
  try {
    return localStorage.getItem(PREFERRED_LANG_KEY) || "en";
  } catch {
    return "en";
  }
}

export function setPreferredLanguage(code: string): void {
  localStorage.setItem(PREFERRED_LANG_KEY, code);
}

export function getTranslation(messageId: string): string | null {
  const translations = loadTranslations();
  return translations[messageId] || null;
}

export function saveTranslation(messageId: string, text: string): void {
  const translations = loadTranslations();
  translations[messageId] = text;
  saveTranslations(translations);
}

export function clearTranslations(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export async function translateMessage(
  messageId: string,
  text: string,
  targetLang: string,
): Promise<string> {
  const cached = getTranslation(messageId);
  if (cached) return cached;

  const lang = LANGUAGES.find((l) => l.code === targetLang);
  const langName = lang ? lang.name : targetLang;

  await new Promise((resolve) => setTimeout(resolve, 300));

  const translated = `[${langName}] ${text}`;
  saveTranslation(messageId, translated);
  return translated;
}
