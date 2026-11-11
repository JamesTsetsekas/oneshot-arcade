import RAPIER from '@dimforge/rapier3d-compat';
import { WorldModel } from '../src/world/model';

let ready: Promise<void> | null = null;
let model: WorldModel | null = null;

export async function getRapier(): Promise<typeof RAPIER> {
  if (!ready) ready = RAPIER.init();
  await ready;
  return RAPIER;
}
export function getModel(): WorldModel {
  if (!model) model = new WorldModel();
  return model;
}
