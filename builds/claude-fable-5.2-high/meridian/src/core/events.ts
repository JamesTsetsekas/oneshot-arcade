// Tiny typed event bus. Simulation systems publish facts; audio/VFX/UI/police subscribe.
export type NoiseKind = 'gunshot' | 'crash' | 'horn' | 'siren' | 'scream' | 'chirper' | 'skid' | 'melee';
export interface GameEvents {
  noise: { kind: NoiseKind; x: number; z: number; radius: number; byPlayer: boolean };
  sfx: { name: string; x?: number; y?: number; z?: number; vol?: number; pitch?: number };
  vfx: { kind: 'smoke' | 'sparks' | 'muzzle' | 'dust' | 'splash' | 'glass' | 'impact' | 'stun' | 'smokebomb'; x: number; y: number; z: number; dx?: number; dy?: number; dz?: number; n?: number };
  tracer: { ax: number; ay: number; az: number; bx: number; by: number; bz: number; stun: boolean };
  subtitle: { speaker: string; text: string; dur?: number };
  toast: { text: string; kind?: 'info' | 'good' | 'bad' | 'money' };
  shake: { amount: number };
  vehicleImpact: { vehicleId: number; dv: number; x: number; y: number; z: number; byPlayer: boolean };
  playerDown: { cause: string };
  arrested: { fine: number };
  missionChanged: Record<string, never>;
  saved: { reason: string };
  alertChanged: { tier: number; status: string };
}
type Handler<T> = (p: T) => void;
export class Bus {
  private map = new Map<string, Handler<any>[]>();
  on<K extends keyof GameEvents>(type: K, fn: Handler<GameEvents[K]>): () => void {
    let list = this.map.get(type);
    if (!list) { list = []; this.map.set(type, list); }
    list.push(fn);
    return () => { const l = this.map.get(type)!; const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); };
  }
  emit<K extends keyof GameEvents>(type: K, payload: GameEvents[K]) {
    const list = this.map.get(type);
    if (list) for (let i = 0; i < list.length; i++) list[i](payload);
  }
}
