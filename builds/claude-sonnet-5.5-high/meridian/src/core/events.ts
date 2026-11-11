/** Sim -> presentation events (audio, VFX, UI). Drained once per frame by the shell. */
export type GameEvent =
  | { type: 'gunshot'; x: number; z: number; weapon: string; byPlayer: boolean }
  | { type: 'impact'; x: number; y: number; z: number; material: 'concrete' | 'flesh' | 'metal' | 'glass' }
  | { type: 'tracer'; x0: number; y0: number; z0: number; x1: number; y1: number; z1: number }
  | { type: 'crash'; x: number; z: number; strength: number }
  | { type: 'horn'; id: number }
  | { type: 'toast'; text: string; tone?: 'info' | 'good' | 'bad' | 'warn' }
  | { type: 'subtitle'; speaker: string; text: string; ms: number }
  | { type: 'banner'; title: string; sub: string }
  | { type: 'sfx'; name: 'pickup' | 'cash' | 'alert' | 'door' | 'phone' | 'reload' | 'step' | 'splash' | 'heal' | 'fail' | 'win' | 'click' | 'siren_on'; x?: number; z?: number }
  | { type: 'smoke'; x: number; z: number }
  | { type: 'fade'; ms: number; hold: number }
  | { type: 'saved'; reason: string }
  | { type: 'died'; reason: string }
  | { type: 'missionFailed'; reason: string };
