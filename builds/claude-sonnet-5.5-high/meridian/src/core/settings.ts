export interface Settings {
  fov: number;
  sensitivity: number;
  invertY: boolean;
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  radio: boolean;
  subtitles: boolean;
  reducedMotion: boolean;
  reducedFlashes: boolean;
  colorblind: 'off' | 'deuteranopia' | 'protanopia' | 'tritanopia';
  quality: 'low' | 'medium' | 'high';
  density: number;
  driveAssist: boolean;
  minimapRotate: boolean;
  toggleAim: boolean;
  streamer: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  fov: 85, sensitivity: 1, invertY: false, masterVolume: 0.7, sfxVolume: 0.9, musicVolume: 0.5, radio: true, subtitles: true,
  reducedMotion: false, reducedFlashes: false, colorblind: 'off', quality: 'medium', density: 1, driveAssist: true, minimapRotate: false,
  toggleAim: false, streamer: false,
};

const KEY = 'meridian.settings.v1';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch { /* storage unavailable */ }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(s: Settings): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
