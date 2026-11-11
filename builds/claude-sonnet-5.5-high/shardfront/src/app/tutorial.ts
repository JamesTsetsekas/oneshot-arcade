// Tutorial: guided scenario that validates player ACTIONS (not exact clicks). It never pauses the simulation.
import { defIndex } from '../data';
import { TD } from '../sim/ext';
import { Ord } from '../sim/types';
import type { Game } from './game';

interface Step { id: string; title: string; text: string; check: (g: Game, t: Tutorial) => boolean }

export class Tutorial {
  idx = 0;
  finished = false;
  flags = { group: false, attackMove: false, brace: false };
  steps: Step[];
  private enemyHall = -1;
  private nextCheck = 0;
  marker: { x: number; y: number } | null = null;

  constructor(private g: Game) {
    const sim = g.sim;
    const own = (defId: string, done = false) => sim.ids.filter((id) => sim.alive[id] && sim.owner[id] === 0 && sim.type[id] === defIndex[defId] && (!done || sim.ext[id].done));
    const queuedWorkers = () => own('core_relay').reduce((s, h) => s + sim.ext[h].q.filter((q) => q.kind === 'unit').length, 0);
    this.steps = [
      { id: 'select', title: 'Select', text: 'Drag a box around your Fabricators (the small worker walkers beside your Core Relay), or double-click one to grab them all.', check: (gm) => gm.input.ownSelected().filter((id) => TD[sim.type[id]].isWorker).length >= 4 },
      { id: 'gather', title: 'Gather', text: 'Right-click a glowing teal Prism Ore seam to put them to work. Watch the ore counter climb.', check: () => sim.ids.filter((id) => sim.alive[id] && sim.owner[id] === 0 && TD[sim.type[id]].isWorker && sim.ext[id].orders[0]?.k === Ord.Gather).length >= 4 && sim.players[0].stats.ore >= 10 },
      { id: 'workers', title: 'Economy', text: 'Select the Core Relay and press Q (or click the Fabricator button) twice to train 2 more workers.', check: () => sim.ids.filter((id) => sim.alive[id] && sim.owner[id] === 0 && TD[sim.type[id]].isWorker).length + queuedWorkers() >= 8 },
      { id: 'pylon', title: 'Supply', text: 'Select a Fabricator, press B, then choose the Grid Pylon (Q) and click near your base. Pylons raise your supply cap and extend your build field.', check: () => own('grid_pylon').length > 0 },
      { id: 'bay', title: 'Production', text: 'Build an Assembly Bay the same way (B, then W). It needs a Grid Pylon field to stand in. Keep the Fabricator beside it until it finishes.', check: () => own('assembly_bay').length > 0 },
      { id: 'tap', title: 'Flux', text: 'Advanced units need Flux. Build a Flux Tap (B, then E / the vent icon) on a pink Flux Vent near your Core Relay, then send three Fabricators to mine it.', check: () => own('flux_tap').length > 0 },
      { id: 'train', title: 'Army', text: 'Once the Assembly Bay is complete, select it and train 4 Bulwarks (Q). Set a rally point with R and a click. Watch your supply!', check: () => sim.ids.filter((id) => sim.alive[id] && sim.owner[id] === 0 && sim.type[id] === defIndex['bulwark']).length >= 4 },
      { id: 'group', title: 'Control groups', text: 'Box-select your Bulwarks and press Ctrl+1 to assign them to group 1. Press 1 any time to re-select them (double-tap 1 to centre the camera).', check: (_, t) => t.flags.group },
      { id: 'brace', title: 'Abilities', text: 'Select a Bulwark and press Q to Brace: +2 range, but it cannot move while braced. Move it to cancel.', check: (_, t) => t.flags.brace },
      { id: 'attackmove', title: 'Attack-move', text: 'Press 1, then A and click near the marked enemy outpost (the teal ring on the ground). Units attack anything they meet on the way.', check: (_, t) => t.flags.attackMove && sim.ids.some((id) => sim.alive[id] && sim.owner[id] === 0 && sim.type[id] === defIndex['bulwark'] && t.marker !== null && Math.hypot(sim.x[id] - t.marker.x, sim.y[id] - t.marker.y) < 22) },
      { id: 'destroy', title: 'Destroy the objective', text: 'Destroy the enemy Heartgrove. Focus-fire with right-click on a target; keep your army together.', check: () => sim.over && sim.winner === 0 },
    ];
    g.input.onGroupAssigned = (n) => { if (n === 1 && g.input.groups[1].filter((id) => sim.alive[id] && sim.type[id] === defIndex['bulwark']).length >= 3) this.flags.group = true; };
    g.input.onCommand = (c) => { if (c === 'attackMove') this.flags.attackMove = true; };
    for (const id of sim.ids) if (sim.alive[id] && sim.owner[id] === 1 && TD[sim.type[id]].isHall) this.enemyHall = id;
    if (this.enemyHall >= 0) this.marker = { x: sim.x[this.enemyHall] - 8, y: sim.y[this.enemyHall] + 6 };
  }

  update() {
    const g = this.g, sim = g.sim;
    if (this.finished) return;
    if (!this.flags.brace) for (const id of sim.ids) if (sim.alive[id] && sim.owner[id] === 0 && sim.type[id] === defIndex['bulwark'] && sim.ext[id].mode > 0) this.flags.brace = true;
    if (sim.tick >= this.nextCheck) {
      const s = this.steps[this.idx];
      if (s && s.check(g, this)) {
        this.idx++;
        this.nextCheck = sim.tick + 20;
        g.hud.toast(`✓ ${s.title} complete`);
        if (this.idx >= this.steps.length) { this.finished = true; void g.onTutorialDone(); }
      }
    }
    if (sim.tick % 10 === 0) this.render();
  }

  /** called when the match ends: make sure a winning finish always completes the last step */
  async finalize() {
    if (this.finished || !(this.g.sim.over && this.g.sim.winner === 0)) return;
    this.idx = this.steps.length;
    this.finished = true;
    await this.g.onTutorialDone();
  }

  render() {
    const s = this.steps[Math.min(this.idx, this.steps.length - 1)];
    const li = this.steps.map((st, i) => `<li class="${i < this.idx ? 'done' : i === this.idx ? 'cur' : ''}">${i + 1}. ${st.title}</li>`).join('');
    this.g.hud.setTutorialPanel(`<h5>Tutorial · step ${Math.min(this.idx + 1, this.steps.length)} / ${this.steps.length}</h5><b>${s.title}</b><br>${s.text}<ul class="steps">${li}</ul>`);
    this.g.hud.setObjective('Objective', this.idx >= this.steps.length ? 'Tutorial complete!' : s.title);
  }
}
