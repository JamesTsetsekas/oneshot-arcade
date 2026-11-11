import type { World } from './world';
import { LINES } from './world';
import type { MissionDef, MissionNode } from './missions';
import { Rng } from '../core/rng';

/** Authored story missions. Pure data; the runtime in missions.ts executes them. */
export function storyMissions(world: World): MissionDef[] {
  const safe = world.poi('safehouse');
  const print = world.poi('printshop');
  const tower = world.poi('tower');
  const dock = world.poi('dockside');
  const garage = world.poi('garage');

  const firstShift: MissionDef = {
    id: 'first-shift', title: 'First Shift', kind: 'story', giver: 'Ines Calder (Dispatch)', version: 1,
    summary: 'A tutorial delivery run across South Quay. Parcel from Marrow & Daughters to Halyard Tower.',
    reward: { cash: 260, trust: 1 }, repeatable: true,
    optional: [
      { id: 'time', text: 'Deliver within 3:30', rule: 'time', limit: 210 },
      { id: 'nocrime', text: 'Stay on the right side of the law', rule: 'nocrime' },
    ],
    fails: [{ when: { c: 'vehicleDead', tag: 'kestrel' }, reason: 'Your courier bike was wrecked.' }],
    start: 'spawn-bike',
    nodes: {
      'spawn-bike': { t: 'spawn', spawn: { kind: 'vehicle', tag: 'kestrel', def: 'kestrel', x: safe.x + 5, z: safe.z - 3.6, heading: Math.PI / 2, behavior: 'parked', ownedByPlayer: true, color: 0xe8742b }, next: 'intro' },
      intro: { t: 'dialogue', next: 'o-bike', lines: [
        { who: 'Ines (Dispatch)', text: "Rowan, you're up. First shift, first parcel. Your Kestrel is parked right outside the loft.", ms: 4200 },
        { who: 'Ines (Dispatch)', text: 'Press E beside it to climb on. W and S to ride, A and D to steer, Space is the handbrake.', ms: 4200 },
      ] },
      'o-bike': { t: 'objective', id: 'bike', text: 'Get on your Kestrel courier bike', cond: { c: 'enterVehicle', tag: 'kestrel' }, marker: { x: 0, z: 0, tag: 'kestrel', label: 'Kestrel' }, next: 'd-pickup' },
      'd-pickup': { t: 'dialogue', next: 'o-pickup', lines: [
        { who: 'Ines (Dispatch)', text: 'Parcel is at Marrow & Daughters Print, up in Tide Market. Follow the route on your map.', ms: 4200 },
        { who: 'Ines (Dispatch)', text: 'Lights matter: the cars will stop for them, and they will not stop for you.', ms: 3800 },
      ] },
      'o-pickup': { t: 'objective', id: 'pickup', text: 'Collect the parcel at Marrow & Daughters Print', cond: { c: 'interact', x: print.x, z: print.z, r: 6, prompt: 'E - Collect parcel', onFoot: true }, marker: { x: print.x, z: print.z, label: 'Print shop' }, next: 'cp1' },
      cp1: { t: 'checkpoint', id: 'cp-pickup', restore: [{ kind: 'vehicle', tag: 'kestrel', def: 'kestrel', x: print.x, z: print.z - 7.5, heading: 0, behavior: 'parked', ownedByPlayer: true, color: 0xe8742b }], next: 'd-deliver' },
      'd-deliver': { t: 'dialogue', next: 'o-deliver', lines: [
        { who: 'Marrow', text: "Careful with it. It's fragile, it's late, and it's yours now.", ms: 3600 },
        { who: 'Ines (Dispatch)', text: 'Halyard Tower in Glassline. Park inside the marked zone and bring the bike to a stop.', ms: 4200 },
      ] },
      'o-deliver': { t: 'objective', id: 'deliver', text: 'Deliver the parcel to Halyard Tower (park in the zone)', cond: { c: 'zone', x: tower.x, z: tower.z - 6, r: 7, tag: 'kestrel', stop: true }, marker: { x: tower.x, z: tower.z - 6, r: 7, label: 'Halyard Tower' }, next: 'reward' },
      reward: { t: 'reward', next: 'd-done' },
      'd-done': { t: 'dialogue', next: 'done', lines: [
        { who: 'Ines (Dispatch)', text: "Clean drop. I've got something bigger for you: a courier van went missing from Foundry Row. Check your phone.", ms: 5000 },
      ] },
      done: { t: 'cleanup', tags: [], keep: ['kestrel'], next: 'end' },
      end: { t: 'end' },
    },
  };

  const hotCargo: MissionDef = {
    id: 'hot-cargo', title: 'Hot Cargo', kind: 'story', giver: 'Ines Calder (Dispatch)', version: 1,
    summary: 'Recover a stolen courier van without wrecking the cargo. Rivals are watching.',
    reward: { cash: 520, trust: 2 }, repeatable: true, requires: { mission: 'first-shift' },
    optional: [
      { id: 'cargo', text: 'Cargo integrity above 70%', rule: 'cargo', limit: 70 },
      { id: 'safe', text: 'No civilians harmed', rule: 'safe' },
      { id: 'time', text: 'Finish within 6:00', rule: 'time', limit: 360 },
    ],
    fails: [
      { when: { c: 'cargoLost', tag: 'van' }, reason: 'The cargo was destroyed.' },
      { when: { c: 'vehicleDead', tag: 'van' }, reason: 'The van was wrecked.' },
    ],
    start: 'spawn-pell',
    nodes: {
      'spawn-pell': { t: 'spawn', spawn: { kind: 'npc', tag: 'pell', x: dock.x, z: dock.z + 1.5, role: 'dock worker', variant: 3 }, next: 'intro' },
      intro: { t: 'dialogue', next: 'o-pell', lines: [
        { who: 'Ines (Dispatch)', text: 'A sealed courier van got lifted from Foundry Row an hour ago. Cargo is a client manifest box. Do not wreck it.', ms: 5000 },
        { who: 'Ines (Dispatch)', text: 'Pell runs the tea stand on the Breakwater quay. He saw which way it went.', ms: 4000 },
      ] },
      'o-pell': { t: 'objective', id: 'pell', text: 'Talk to Pell at the Dockside Tea Stand', cond: { c: 'interact', x: dock.x, z: dock.z + 1.5, r: 5, prompt: 'E - Talk to Pell', onFoot: true }, marker: { x: dock.x, z: dock.z + 1.5, label: 'Pell' }, next: 'choice' },
      choice: { t: 'choice', prompt: 'How do you ask Pell?', options: [
        { text: 'Ask politely', set: { clue: 1 }, next: 'd-polite' },
        { text: 'Slip him some cash for a better answer', set: { clue: 2 }, cost: 40, next: 'd-bribe' },
      ] },
      'd-polite': { t: 'dialogue', next: 'spawn-van', lines: [{ who: 'Pell', text: 'Heading up the arterial, a white Dray van. Could be anywhere between here and Glassline by now.', ms: 4400 }] },
      'd-bribe': { t: 'dialogue', next: 'spawn-van', lines: [{ who: 'Pell', text: "For that? White Dray, rear doors taped shut. Circling Foundry Row, I'd bet my kettle on it.", ms: 4400 }] },
      'spawn-van': { t: 'spawn', spawn: { kind: 'vehicle', tag: 'van', def: 'dray', x: 0, z: 0, heading: 0, behavior: 'flee', cargo: true, color: 0xeeeeee, farFrom: { x: dock.x, z: dock.z, min: 120 } }, next: 'br' },
      br: { t: 'branch', key: 'clue', equals: 2, then: 'o-find-b', else: 'o-find-a' },
      'o-find-a': { t: 'objective', id: 'find', text: 'Find the stolen van (wide search area)', cond: { c: 'sees', tag: 'van', range: 48 }, marker: { x: 0, z: 0, tag: 'van', r: 95, label: 'Last seen' }, next: 'd-found' },
      'o-find-b': { t: 'objective', id: 'find', text: 'Find the stolen van (narrow search area)', cond: { c: 'sees', tag: 'van', range: 48 }, marker: { x: 0, z: 0, tag: 'van', r: 45, label: 'Last seen' }, next: 'd-found' },
      'd-found': { t: 'dialogue', next: 'o-stop', lines: [{ who: 'Rowan', text: "That's the van. He's spotted me. Time to make him stop.", ms: 3200 }] },
      'o-stop': { t: 'objective', id: 'stop', text: 'Force the van to stop: ram it, or shoot its tyres (gunfire will be noticed)', cond: { c: 'vehicleStopped', tag: 'van' }, marker: { x: 0, z: 0, tag: 'van', label: 'Van' }, next: 'o-enter' },
      'o-enter': { t: 'objective', id: 'enter', text: 'Get into the stolen van', cond: { c: 'enterVehicle', tag: 'van' }, marker: { x: 0, z: 0, tag: 'van', label: 'Van' }, next: 'cp1' },
      cp1: { t: 'checkpoint', id: 'cp-van', restore: [{ kind: 'vehicle', tag: 'van', def: 'dray', x: 0, z: 0, heading: 0, behavior: 'idle', cargo: true, color: 0xeeeeee }], next: 'spawn-rivals' },
      'spawn-rivals': { t: 'spawn', spawn: { kind: 'chasers', tag: 'rivals', count: 2, def: 'mistral', behind: 120 }, next: 'd-rivals' },
      'd-rivals': { t: 'dialogue', next: 'o-garage', lines: [
        { who: 'Ines (Dispatch)', text: "Two cars just peeled off a side street. Those are the buyers. Get that van to Tidewater Garage.", ms: 4200 },
      ] },
      'o-garage': { t: 'objective', id: 'garage', text: 'Drive the van to Tidewater Garage with the rivals on your tail', cond: { c: 'zone', x: garage.x, z: garage.z - 8, r: 9, tag: 'van' }, marker: { x: garage.x, z: garage.z - 8, r: 9, label: 'Garage' }, next: 'reward' },
      reward: { t: 'reward', next: 'cleanup' },
      cleanup: { t: 'cleanup', tags: ['van', 'rivals', 'pell'], next: 'd-done' },
      'd-done': { t: 'dialogue', next: 'end', lines: [{ who: 'Ines (Dispatch)', text: 'Cargo is safe. The client owes you. Courier runs and street circuits are open on your phone now.', ms: 4600 }] },
      end: { t: 'end' },
    },
  };

  return [firstShift, hotCargo];
}

type Modifier = 'fragile' | 'urgent' | 'quiet';

/** Random sidewalk anchor (block edge) used by generated activities. */
export function anchor(world: World, rng: Rng, avoid?: { x: number; z: number }, minDist = 140): { x: number; z: number } {
  void world;
  for (let k = 0; k < 40; k++) {
    const i = rng.int(0, 5);
    const j = rng.int(1, 5);
    const side = rng.int(0, 3);
    const off = rng.range(-14, 14);
    const cx = -200 + 80 * i;
    const cz = -200 + 80 * j;
    const x = side === 0 ? cx - 32 : side === 1 ? cx + 32 : cx + off;
    const z = side === 2 ? cz - 32 : side === 3 ? cz + 32 : cz + off;
    if (!avoid || Math.hypot(x - avoid.x, z - avoid.z) >= minDist) return { x, z };
  }
  return { x: 0, z: 0 };
}

export function courierRun(world: World, seed: number, modifier: Modifier): MissionDef {
  const rng = new Rng(seed);
  const a = anchor(world, rng);
  const b = anchor(world, rng, a, 150);
  const dist = Math.hypot(a.x - b.x, a.z - b.z);
  const limit = Math.round(dist / 6.5 + 55);
  const names = { fragile: 'Fragile', urgent: 'Urgent', quiet: 'Quiet' };
  const pay = Math.round(70 + dist * 0.28 + (modifier === 'urgent' ? 40 : modifier === 'fragile' ? 25 : 30));
  return {
    id: 'courier-' + seed, title: `Courier Run (${names[modifier]})`, kind: 'activity', giver: 'Courier Board', version: 1, repeatable: true,
    summary: modifier === 'urgent' ? `Beat the clock: ${limit}s.` : modifier === 'fragile' ? 'Avoid collisions: the parcel is fragile.' : 'Stay off the radar: no crimes.',
    reward: { cash: pay, trust: 0.34 },
    optional: [
      { id: 'time', text: `Under ${Math.round(limit * 0.7)}s`, rule: 'time', limit: limit * 0.7 },
      modifier === 'fragile' ? { id: 'nodamage', text: 'No more than 1 collision', rule: 'nodamage', limit: 1 } : { id: 'nocrime', text: 'No crimes committed', rule: 'nocrime' },
    ],
    fails: modifier === 'quiet' ? [{ when: { c: 'tierAtLeast', tier: 2 }, reason: 'The police got involved - this was supposed to be quiet.' }] : [],
    start: 'o1',
    nodes: {
      o1: { t: 'objective', id: 'pickup', text: 'Pick up the package', cond: { c: 'interact', x: a.x, z: a.z, r: 6, prompt: 'E - Pick up package', onFoot: true }, marker: { x: a.x, z: a.z, label: 'Pickup' }, next: 'o2' },
      o2: { t: 'objective', id: 'drop', text: 'Deliver the package', cond: { c: 'zone', x: b.x, z: b.z, r: 6 }, marker: { x: b.x, z: b.z, r: 6, label: 'Drop-off' }, timer: modifier === 'urgent' ? limit : 600, next: 'reward' },
      reward: { t: 'reward', next: 'end' },
      end: { t: 'end' },
    },
  };
}

/** Three-lap time trial through live traffic around the arterial loop. */
export function streetCircuit(): MissionDef {
  const pts: Array<[number, number]> = [[1, 1], [5, 1], [5, 4], [1, 4]];
  const nodes: Record<string, MissionNode> = {};
  nodes['o0'] = { t: 'objective', id: 'start', text: 'Take any vehicle to the start line', cond: { c: 'zone', x: LINES[pts[0][0]], z: LINES[pts[0][1]], r: 11, onFoot: false }, marker: { x: LINES[pts[0][0]], z: LINES[pts[0][1]], r: 11, label: 'Start' }, next: 'c1' };
  let id = 1;
  const total = 3 * pts.length;
  for (let lap = 0; lap < 3; lap++) {
    for (let k = 0; k < pts.length; k++) {
      const p = pts[(k + 1) % pts.length];
      const last = id === total;
      nodes['c' + id] = {
        t: 'objective', id: 'cp' + id, text: `Lap ${lap + 1}/3 - checkpoint ${k + 1}/${pts.length}`, cond: { c: 'zone', x: LINES[p[0]], z: LINES[p[1]], r: 12, onFoot: false },
        marker: { x: LINES[p[0]], z: LINES[p[1]], r: 12, label: last ? 'Finish' : 'Checkpoint ' + (k + 1) }, timer: 420, next: last ? 'reward' : 'c' + (id + 1),
      };
      id++;
    }
  }
  nodes['reward'] = { t: 'reward', next: 'end' };
  nodes['end'] = { t: 'end' };
  return {
    id: 'street-circuit', title: 'Street Circuit', kind: 'activity', giver: 'Circuit Board', version: 1, repeatable: true,
    summary: 'Three laps through live traffic. Respect the clock.', reward: { cash: 300, trust: 0.5 },
    optional: [{ id: 'time', text: 'Finish under 4:30', rule: 'time', limit: 270 }, { id: 'nodamage', text: 'Under 6 collisions', rule: 'nodamage', limit: 6 }],
    fails: [], start: 'o0', nodes,
  };
}

export function recoveryCall(world: World, seed: number): MissionDef {
  const rng = new Rng(seed);
  const garage = world.poi('garage');
  const spot = anchor(world, rng, garage, 160);
  const hdg = rng.range(0, Math.PI * 2);
  return {
    id: 'recovery-' + seed, title: 'Recovery Call', kind: 'activity', giver: 'Recovery Board', version: 1, repeatable: true,
    summary: 'A reported-stolen car is parked somewhere in the search area. Find it and bring it back to the garage.',
    reward: { cash: 190, trust: 0.34 },
    optional: [{ id: 'nodamage', text: 'Under 2 collisions', rule: 'nodamage', limit: 2 }, { id: 'time', text: 'Back within 5:00', rule: 'time', limit: 300 }],
    fails: [{ when: { c: 'vehicleDead', tag: 'stolen' }, reason: 'The recovered car was wrecked.' }], start: 's0',
    nodes: {
      s0: { t: 'spawn', spawn: { kind: 'vehicle', tag: 'stolen', def: rng.pick(['hollis', 'mistral', 'tern']), x: spot.x, z: spot.z, heading: hdg, behavior: 'parked', locked: false }, next: 'o1' },
      o1: { t: 'objective', id: 'find', text: 'Locate the reported stolen car in the search area', cond: { c: 'sees', tag: 'stolen', range: 28 }, marker: { x: 0, z: 0, tag: 'stolen', r: 90, label: 'Search area' }, next: 'o2' },
      o2: { t: 'objective', id: 'enter', text: 'Get in the recovered car', cond: { c: 'enterVehicle', tag: 'stolen' }, marker: { x: 0, z: 0, tag: 'stolen', label: 'Car' }, next: 'o3' },
      o3: { t: 'objective', id: 'return', text: 'Return the car to Tidewater Garage', cond: { c: 'zone', x: garage.x, z: garage.z - 8, r: 9, tag: 'stolen' }, marker: { x: garage.x, z: garage.z - 8, r: 9, label: 'Garage' }, next: 'reward' },
      reward: { t: 'reward', next: 'cleanup' },
      cleanup: { t: 'cleanup', tags: ['stolen'], next: 'end' },
      end: { t: 'end' },
    },
  };
}
