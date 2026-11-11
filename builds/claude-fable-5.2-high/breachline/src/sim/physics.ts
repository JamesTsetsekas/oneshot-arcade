// shared-simulation: Rapier WASM loader. Used identically by the embedded server (worker / Node) and client prediction.
import RAPIER from '@dimforge/rapier3d-compat';

export type Rapier = typeof RAPIER;
let ready: Promise<Rapier> | null = null;

export function loadRapier(): Promise<Rapier> {
  if (!ready) ready = RAPIER.init().then(() => RAPIER);
  return ready;
}
