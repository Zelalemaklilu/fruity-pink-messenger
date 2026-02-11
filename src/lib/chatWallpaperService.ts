// Chat wallpaper service - stores wallpaper preferences in localStorage

const WALLPAPER_KEY = 'zeshopp-chat-wallpapers';
const DEFAULT_WALLPAPER_KEY = 'zeshopp-default-wallpaper';

export interface WallpaperConfig {
  type: 'color' | 'gradient' | 'pattern';
  value: string;
}

const PRESET_WALLPAPERS: WallpaperConfig[] = [
  { type: 'color', value: 'transparent' }, // default
  { type: 'gradient', value: 'linear-gradient(135deg, hsl(220 15% 10%), hsl(220 15% 5%))' },
  { type: 'gradient', value: 'linear-gradient(135deg, hsl(338 30% 15%), hsl(260 20% 10%))' },
  { type: 'gradient', value: 'linear-gradient(180deg, hsl(210 40% 12%), hsl(210 30% 6%))' },
  { type: 'gradient', value: 'linear-gradient(135deg, hsl(145 30% 10%), hsl(180 20% 6%))' },
  { type: 'pattern', value: 'radial-gradient(circle at 25% 25%, hsl(338 85% 70% / 0.05) 1px, transparent 1px)' },
  { type: 'pattern', value: 'repeating-linear-gradient(45deg, hsl(338 85% 70% / 0.03) 0px, hsl(338 85% 70% / 0.03) 1px, transparent 1px, transparent 12px)' },
  { type: 'gradient', value: 'linear-gradient(180deg, hsl(30 30% 12%), hsl(20 20% 6%))' },
];

export function getPresetWallpapers(): WallpaperConfig[] {
  return PRESET_WALLPAPERS;
}

export function getChatWallpaper(chatId: string): WallpaperConfig | null {
  try {
    const stored = localStorage.getItem(WALLPAPER_KEY);
    if (!stored) return getDefaultWallpaper();
    const map = JSON.parse(stored);
    return map[chatId] || getDefaultWallpaper();
  } catch {
    return null;
  }
}

export function setChatWallpaper(chatId: string, wallpaper: WallpaperConfig): void {
  try {
    const stored = localStorage.getItem(WALLPAPER_KEY);
    const map = stored ? JSON.parse(stored) : {};
    map[chatId] = wallpaper;
    localStorage.setItem(WALLPAPER_KEY, JSON.stringify(map));
  } catch {}
}

export function getDefaultWallpaper(): WallpaperConfig | null {
  try {
    const stored = localStorage.getItem(DEFAULT_WALLPAPER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setDefaultWallpaper(wallpaper: WallpaperConfig): void {
  try {
    localStorage.setItem(DEFAULT_WALLPAPER_KEY, JSON.stringify(wallpaper));
  } catch {}
}

export function getWallpaperStyle(wallpaper: WallpaperConfig | null): React.CSSProperties {
  if (!wallpaper || wallpaper.value === 'transparent') return {};
  if (wallpaper.type === 'color') return { backgroundColor: wallpaper.value };
  return { backgroundImage: wallpaper.value };
}
