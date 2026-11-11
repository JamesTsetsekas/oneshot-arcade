// Tutorial director: a guided scenario that validates outcomes (state), not exact clicks.
import { DEF_INDEX } from '../data/defs';
import type { InputController } from '../input/controller';
import { FL_BRACED, OT_AMOVE, OT_ATTACK, OT_GATHER, type Sim } from '../sim/sim';
import type { TutorialView } from '../ui/store';

interface Step { title: string; text: string; hint: string; done: (s: Sim, input: InputController, t: TutorialDirector) => boolean }

const count = (s: Sim, id: string, includeBuilding = true): number => {
  let n = 0;
  const di = DEF_INDEX[id];
  for (const e of s.ids) if (s.alive[e] && s.owner[e] === 0 && s.def[e] === di && (includeBuilding || !(s.flags[e] & 1))) n++;
  return n;
};

const STEPS: Step[] = [
  {
    title: 'Survey the ravine', text: 'Pan the camera with the arrow keys (or WASD while nothing is selected). Drag with the middle mouse button and zoom with the wheel.',
    hint: 'Move the camera a little.', done: (_s, input) => input.cameraMoved > 45,
  },
  {
    title: 'Select your Fabricators', text: 'Drag a box around the Fabricators beside your Core Relay. Double-clicking one selects every Fabricator on screen.',
    hint: 'Select at least three Fabricators.', done: (s, input) => input.selection.filter((e) => s.alive[e] && s.d(e).worker).length >= 3,
  },
  {
    title: 'Harvest Prism Ore', text: 'With Fabricators selected, right-click a teal Prism Ore seam. They mine for 1.6 seconds, carry the load home and repeat.',
    hint: 'Put four workers on ore.', done: (s) => s.ids.filter((e) => s.alive[e] && s.owner[e] === 0 && s.orders[e][0]?.t === OT_GATHER).length >= 4,
  },
  {
    title: 'Train another worker', text: 'Select the Core Relay and press Q (or click the Fabricator button). More workers means more income - aim for two per seam.',
    hint: 'Queue a Fabricator.', done: (s) => count(s, 'fabricator') > 6 || s.ids.some((e) => s.alive[e] && s.owner[e] === 0 && s.queue[e].length > 0),
  },
  {
    title: 'Raise supply', text: 'Select a Fabricator, press B to open the build palette, then Q for a Grid Pylon. Place it inside the blue construction field. Pylons raise your supply cap.',
    hint: 'Place a Grid Pylon.', done: (s) => count(s, 'grid_pylon') > 0,
  },
  {
    title: 'Tap a Flux vent', text: 'Flux pays for advanced units and research. Press B then E and place a Flux Tap on one of the glowing vents near your base. The builder starts drawing Flux when it is done.',
    hint: 'Place a Flux Tap on a vent.', done: (s) => count(s, 'flux_tap') > 0,
  },
  {
    title: 'Build production', text: 'Press B then W and place an Assembly Bay (it needs a finished Grid Pylon). Extra Fabricators right-clicked onto a foundation speed it up.',
    hint: 'Place an Assembly Bay.', done: (s) => count(s, 'assembly_bay') > 0,
  },
  {
    title: 'Muster Bulwarks', text: 'Select the Assembly Bay and press Q to queue Bulwarks. Right-click the ground to set its rally point. If the queue pauses you are supply blocked - build another Grid Pylon.',
    hint: 'Own four Bulwarks.', done: (s) => count(s, 'bulwark') >= 4,
  },
  {
    title: 'Form a control group', text: 'Double-click a Bulwark to select them all, then press Ctrl+1 (Alt+1 also works if your browser intercepts Ctrl). Press 1 to recall the group; double-tap 1 to jump to it.',
    hint: 'Assign Bulwarks to a control group.', done: (s, input) => input.groups.some((g) => g.some((e) => s.alive[e] && s.d(e).id === 'bulwark')),
  },
  {
    title: 'Use an ability', text: 'With Bulwarks selected press Q to Brace: +2 range but much slower. Press Q again to stand up before marching.',
    hint: 'Brace at least one Bulwark.', done: (s, _i, t) => { if (s.ids.some((e) => s.alive[e] && s.owner[e] === 0 && (s.flags[e] & FL_BRACED))) t.braced = true; return t.braced; },
  },
  {
    title: 'Attack-move', text: 'A Chorus outpost sits at the south-east expansion (pinged on the minimap). Press A, then left-click near it. Attack-moving units fight whatever they meet on the way. Bring eight or more Bulwarks.',
    hint: 'Issue an attack-move order.', done: (s) => s.ids.some((e) => s.alive[e] && s.owner[e] === 0 && !s.d(e).worker && (s.orders[e][0]?.t === OT_AMOVE || s.orders[e][0]?.t === OT_ATTACK)),
  },
  {
    title: 'Destroy the Heartgrove', text: 'Break the Needle Pod and the defenders, then destroy the Heartgrove. Keep producing reinforcements and rally them forward - destroying every enemy headquarters wins the match.',
    hint: 'Destroy the enemy Heartgrove.', done: (s) => s.winner === 0,
  },
];

export class TutorialDirector {
  step = 0;
  braced = false;
  justAdvanced = false;

  update(s: Sim, input: InputController): void {
    this.justAdvanced = false;
    while (this.step < STEPS.length && STEPS[this.step].done(s, input, this)) {
      this.step++;
      this.justAdvanced = true;
    }
  }

  /** world position worth pinging for the current step */
  target(s: Sim): { x: number; z: number } | null {
    if (this.step >= 10) return { x: s.map.sites[2].x, z: s.map.sites[2].z };
    return null;
  }

  view(): TutorialView {
    const i = Math.min(this.step, STEPS.length - 1);
    const st = STEPS[i];
    return { step: Math.min(this.step + 1, STEPS.length), total: STEPS.length, title: st.title, text: st.text, hint: st.hint, done: this.step >= STEPS.length };
  }
}
