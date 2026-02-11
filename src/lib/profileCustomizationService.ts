// Profile customization service - accent colors, themes

const ACCENT_KEY = 'zeshopp-accent-color';
const PROFILE_THEME_KEY = 'zeshopp-profile-theme';

export interface AccentColor {
  id: string;
  name: string;
  hsl: string; // HSL values without hsl()
}

export const ACCENT_COLORS: AccentColor[] = [
  { id: 'pink', name: 'Fruity Pink', hsl: '338 85% 70%' },
  { id: 'blue', name: 'Ocean Blue', hsl: '210 90% 60%' },
  { id: 'green', name: 'Forest Green', hsl: '145 65% 45%' },
  { id: 'purple', name: 'Royal Purple', hsl: '260 80% 60%' },
  { id: 'orange', name: 'Sunset Orange', hsl: '25 90% 55%' },
  { id: 'cyan', name: 'Neon Cyan', hsl: '180 80% 50%' },
  { id: 'red', name: 'Cherry Red', hsl: '0 75% 55%' },
  { id: 'gold', name: 'Golden', hsl: '45 90% 55%' },
];

export function getAccentColor(): AccentColor {
  try {
    const stored = localStorage.getItem(ACCENT_KEY);
    if (!stored) return ACCENT_COLORS[0];
    return ACCENT_COLORS.find(c => c.id === stored) || ACCENT_COLORS[0];
  } catch {
    return ACCENT_COLORS[0];
  }
}

export function setAccentColor(colorId: string): void {
  const color = ACCENT_COLORS.find(c => c.id === colorId);
  if (!color) return;
  
  localStorage.setItem(ACCENT_KEY, colorId);
  
  // Apply to CSS custom properties
  const root = document.documentElement;
  root.style.setProperty('--primary', color.hsl);
  root.style.setProperty('--accent', color.hsl);
  root.style.setProperty('--ring', color.hsl);
  
  // Update glow color (slightly lighter)
  const parts = color.hsl.split(' ');
  const lightness = parseInt(parts[2]) + 5;
  root.style.setProperty('--primary-glow', `${parts[0]} ${parts[1]} ${lightness}%`);
}

export function initAccentColor(): void {
  const color = getAccentColor();
  if (color.id !== 'pink') {
    setAccentColor(color.id);
  }
}

export type ProfileTheme = 'default' | 'minimal' | 'gradient' | 'glass';

export function getProfileTheme(): ProfileTheme {
  try {
    return (localStorage.getItem(PROFILE_THEME_KEY) as ProfileTheme) || 'default';
  } catch {
    return 'default';
  }
}

export function setProfileTheme(theme: ProfileTheme): void {
  localStorage.setItem(PROFILE_THEME_KEY, theme);
}
