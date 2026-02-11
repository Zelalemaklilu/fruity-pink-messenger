// Notification sound customization service

const SOUND_KEY = 'zeshopp-notification-sounds';
const DEFAULT_SOUND_KEY = 'zeshopp-default-sound';

export interface SoundConfig {
  id: string;
  name: string;
  frequency: number;
  duration: number;
  type: OscillatorType;
}

export const PRESET_SOUNDS: SoundConfig[] = [
  { id: 'default', name: 'Default', frequency: 800, duration: 150, type: 'sine' },
  { id: 'gentle', name: 'Gentle', frequency: 523, duration: 200, type: 'sine' },
  { id: 'bright', name: 'Bright', frequency: 1200, duration: 100, type: 'triangle' },
  { id: 'soft', name: 'Soft Bell', frequency: 660, duration: 250, type: 'sine' },
  { id: 'chirp', name: 'Chirp', frequency: 1000, duration: 80, type: 'square' },
  { id: 'deep', name: 'Deep', frequency: 330, duration: 300, type: 'sine' },
  { id: 'none', name: 'Silent', frequency: 0, duration: 0, type: 'sine' },
];

export function playSound(config: SoundConfig): void {
  if (config.id === 'none' || config.frequency === 0) return;
  
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = config.type;
    osc.frequency.setValueAtTime(config.frequency, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration / 1000);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + config.duration / 1000);
  } catch {}
}

export function getContactSound(contactId: string): SoundConfig {
  try {
    const stored = localStorage.getItem(SOUND_KEY);
    if (!stored) return getDefaultSound();
    const map = JSON.parse(stored);
    const soundId = map[contactId];
    return PRESET_SOUNDS.find(s => s.id === soundId) || getDefaultSound();
  } catch {
    return PRESET_SOUNDS[0];
  }
}

export function setContactSound(contactId: string, soundId: string): void {
  try {
    const stored = localStorage.getItem(SOUND_KEY);
    const map = stored ? JSON.parse(stored) : {};
    map[contactId] = soundId;
    localStorage.setItem(SOUND_KEY, JSON.stringify(map));
  } catch {}
}

export function getDefaultSound(): SoundConfig {
  try {
    const stored = localStorage.getItem(DEFAULT_SOUND_KEY);
    if (!stored) return PRESET_SOUNDS[0];
    const soundId = JSON.parse(stored);
    return PRESET_SOUNDS.find(s => s.id === soundId) || PRESET_SOUNDS[0];
  } catch {
    return PRESET_SOUNDS[0];
  }
}

export function setDefaultSound(soundId: string): void {
  try {
    localStorage.setItem(DEFAULT_SOUND_KEY, JSON.stringify(soundId));
  } catch {}
}
