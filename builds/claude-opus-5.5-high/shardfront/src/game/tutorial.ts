// Guided tutorial. Steps validate *actions and outcomes* (not exact clicks) by reading the
// simulation and the client's selection state.
import type { Sim } from '../simulation-core/sim';
import { Kind } from '../simulation-core/types';

export interface TutorialContext {
  sim: Sim;
  selection: Set<number>;
  controlGroups: number[][];
  lastCommands: string[];
  cameraMoved: boolean;
}

export interface TutorialStep {
  id: string;
  title: string;
  text: string;
  done: (c: TutorialContext) => boolean;
  /** pause the simulation while this step's instruction is first shown */
  pause?: boolean;
}

const own = (c: TutorialContext, def: string, built = true) =>
  c.sim.structuresOf(0, def).filter((s) => !built || c.sim.built[s]).length + c.sim.unitsOf(0, def).length;

export const TUTORIAL_STEPS: TutorialStep[] = [
  { id: 'camera', title: 'Look around', text: 'Pan the camera with the arrow keys, middle-mouse drag, or the minimap. Scroll the mouse wheel to zoom.', done: (c) => c.cameraMoved, pause: true },
  { id: 'select', title: 'Select a Fabricator', text: 'Left-click one of your Fabricators (small walkers near the Core Relay), or drag a box around several.', done: (c) => [...c.selection].some((id) => c.sim.alive[id] && c.sim.owner[id] === 0 && c.sim.kind[id] === Kind.Unit && c.sim.udef(id).worker) },
  { id: 'move', title: 'Move', text: 'Right-click the ground to move the selected units.', done: (c) => c.lastCommands.includes('move') },
  { id: 'gather', title: 'Mine Prism Ore', text: 'Select your Fabricators and right-click a teal Prism Ore crystal. Workers carry ore back to the Core Relay automatically.', done: (c) => c.sim.players[0].stats.oreCollected >= 40 },
  { id: 'train', title: 'Train a worker', text: 'Select the Core Relay and press Q (or click the Fabricator button) to queue a new worker.', done: (c) => c.sim.players[0].stats.unitsCreated >= 1 || c.lastCommands.includes('train') },
  { id: 'supply', title: 'Build a Grid Pylon', text: 'Select a Fabricator, press B to open the construction palette, then Q for Grid Pylon. Place it near your base. Pylons add supply and extend the construction field.', done: (c) => own(c, 'grid_pylon', false) >= 1 },
  { id: 'production', title: 'Build an Assembly Bay', text: 'With a Fabricator selected: B, then W. The Assembly Bay produces combat walkers. Buildings must sit inside the glowing construction field.', done: (c) => own(c, 'assembly_bay', false) >= 1 },
  { id: 'flux', title: 'Tap the Flux vent', text: 'Build a Flux Tap (B, then E) on the glowing orange vent near your base, then right-click the finished tap with 2–3 Fabricators to haul Flux.', done: (c) => c.sim.players[0].stats.fluxCollected >= 8 },
  { id: 'army', title: 'Train Bulwarks', text: 'Select the finished Assembly Bay and train 4 Bulwarks (W). Right-click the ground with the Bay selected to set a rally point.', done: (c) => c.sim.unitsOf(0, 'bulwark').length >= 4 },
  { id: 'group', title: 'Control group', text: 'Select your Bulwarks and press Ctrl+1 to bind them to group 1. Press 1 to reselect them, double-tap 1 to jump the camera.', done: (c) => c.controlGroups[1].some((id) => c.sim.alive[id] && c.sim.kind[id] === Kind.Unit && !c.sim.udef(id).worker) },
  { id: 'ability', title: 'Use an ability', text: 'With Bulwarks selected, press Q to Brace (+2 range, immobile). Press Q again to release. Every ability shows its hotkey on the command card.', done: (c) => c.lastCommands.includes('ability') },
  { id: 'attack', title: 'Attack-move', text: 'Press A, then left-click near the enemy outpost to the north-east. Attack-moving units engage everything on the way.', done: (c) => c.lastCommands.includes('attackMove') },
  { id: 'destroy', title: 'Destroy the Heartgrove', text: 'Destroy the enemy Heartgrove to win. Reinforce with more Bulwarks if needed; Arc Lancers deal bonus damage to Armored targets.', done: (c) => c.sim.over && c.sim.winner === 0 },
];
