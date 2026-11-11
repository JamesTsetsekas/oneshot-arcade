// Mission content for the South Quay slice: four story missions and three repeatable activities,
// all expressed as mission-graph data (see graph.ts for the schema).
import { MissionDef, NodeDef } from './graph';
import { ANCHORS, AnchorId } from '../world/district';
import { WAREHOUSE, PORT, parkSpots } from '../world/lots';
import { Rng } from '../core/math';
import { roadRoute, routeLength } from '../world/roads';

const pts = (g: { route: number[][] }[]) => g.map((x) => x.route[0]);
const routes = (g: { route: number[][] }[]) => g.map((x) => x.route);

export const M1: MissionDef = {
  id: 'm1', title: 'First Shift', giver: 'Imre Calloway', kind: 'story', par: 210,
  brief: 'Your first run for Kestrel Couriers: collect a parcel in Tide Market and deliver it to the Meridian Exchange. No trouble, no drama.',
  reward: { cash: 250, trust: 60 }, start: 'intro',
  fails: [{ when: { c: 'vehDead', veh: 'bike' }, reason: 'The delivery bike was wrecked.' }],
  nodes: {
    intro: { t: 'dialogue', next: 'spawnBike', lines: [
      { who: 'Imre', text: 'Rowan. First shift on the Kestrel books. Your Swift is parked out front, key is in it.' },
      { who: 'Imre', text: 'Parcel is waiting at the Saltline Stall. Ride like the insurance is watching.' } ] },
    spawnBike: { t: 'spawn', next: 'walk', items: [{ kind: 'vehicle', ref: 'bike', type: 'swift', at: 'bikeSpot', color: 0xf2b134, owned: true }] },
    walk: { t: 'objective', text: 'Walk to your delivery bike', hint: 'WASD move · Mouse look · Shift sprint · Space jump', goal: { g: 'goto', pos: 'bikeSpot', r: 3.2, mode: 'foot' }, next: 'mount' },
    mount: { t: 'objective', text: 'Get on the Swift', hint: 'E — mount or enter a vehicle · F — get off', goal: { g: 'enter', veh: ['bike'] }, next: 'ride1' },
    ride1: { t: 'objective', text: 'Ride to the Tide Market loading bay', hint: 'W throttle · S brake/reverse · A/D steer · Space handbrake · follow the GPS line', goal: { g: 'goto', pos: 'marketPark', r: 6.5, veh: 'bike', stop: true }, next: 'collect' },
    collect: { t: 'objective', text: 'Collect the parcel from the Saltline Stall', hint: 'F — get off the bike, then hold E at the stall', goal: { g: 'interact', pos: 'marketPickup', label: 'Hold E — Collect the parcel', hold: 1.0 }, next: 'cp' },
    cp: { t: 'checkpoint', restore: ['spawnBike'], next: 'timer' },
    timer: { t: 'set', set: [{ k: 'timer', start: true }], next: 'say2' },
    say2: { t: 'dialogue', next: 'ride2', lines: [{ who: 'Imre', text: 'Good. Meridian Exchange, Glassline. The lobby tips better if you are quick. Signals still apply.' }] },
    ride2: { t: 'objective', text: 'Deliver to the Meridian Exchange in Glassline', hint: 'M — full map · C — camera distance · H — horn', goal: { g: 'goto', pos: 'glassPark', r: 8, veh: 'bike', stop: true }, next: 'bonus',
      optional: [{ text: 'Arrive inside 1:40', flag: 'late', invert: true }] },
    bonus: { t: 'branch', when: { c: 'timeOver', seconds: 100 }, yes: 'late', no: 'drop' },
    late: { t: 'set', set: [{ k: 'flag', key: 'late' }], next: 'drop' },
    drop: { t: 'objective', text: 'Hand the parcel to the lobby desk', goal: { g: 'interact', pos: 'glassDrop', label: 'Hold E — Hand over the parcel', hold: 1.0 }, next: 'outro' },
    outro: { t: 'dialogue', next: 'reward', lines: [
      { who: 'Imre', text: 'Signed for. You are on the roster. Your phone has the job board — press P.' },
      { who: 'Imre', text: 'The Swift is yours to keep. Rest at the safehouse on Tide Street to save your progress.' } ] },
    reward: { t: 'reward', next: 'cleanup' }, cleanup: { t: 'cleanup', next: 'end' }, end: { t: 'end' },
  },
};

export const M2: MissionDef = {
  id: 'm2', title: 'Lost Manifest', giver: 'Odalys Brandt', kind: 'story', par: 360,
  brief: 'The port contract was rewritten overnight. Photograph the original manifests in the Foundry Row warehouse. Talk your way in the front or slip the side-door lock.',
  reward: { cash: 600, trust: 120 }, start: 'intro', fails: [],
  nodes: {
    intro: { t: 'dialogue', next: 'setup', lines: [
      { who: 'Odalys', text: 'Thirty years of dock contracts, and last night someone replaced every page.' },
      { who: 'Odalys', text: 'The originals are in the Foundry warehouse on Slipway Lane. Three manifests. Photograph them, touch nothing else.' } ] },
    setup: { t: 'set', next: 'guards', set: [{ k: 'restricted', rects: [WAREHOUSE.zone] }, { k: 'cameras', group: 'warehouse', on: true }, { k: 'door', id: 'wh-side', open: false }] },
    guards: { t: 'spawn', next: 'travel', items: [{ kind: 'actors', group: 'wh', faction: 'security', at: pts(WAREHOUSE.guards), patrols: routes(WAREHOUSE.guards) }] },
    travel: { t: 'objective', text: 'Go to the Foundry Row warehouse', goal: { g: 'goto', pos: 'warehouseFront', r: 34 }, next: 'cpA' },
    cpA: { t: 'checkpoint', restore: ['setup', 'guards'], next: 'approach' },
    approach: { t: 'objective', text: 'Find a way in: talk at the front gate, or bypass the side-door lock', hint: 'Ctrl — crouch to stay quieter and harder to spot · G — throw a distraction chirper',
      goal: { g: 'anyOf', options: [
        { pos: 'warehouseFront', label: 'E — Talk to the gate guard', next: 'talk' },
        { pos: 'warehouseSide', label: 'E — Work the side-door lock', next: 'lock' } ] }, next: 'inside' },
    talk: { t: 'choice', prompt: 'The gate guard looks you over. "Yard is closed. What do you want?"', options: [
      { label: '"Kestrel Couriers. I need a signature from the shift lead."', next: 'bluffOk' },
      { label: '"Fire inspection. Surprise visit."', next: 'bluffBad' },
      { label: 'Say nothing and step back.', next: 'approach' } ] },
    bluffOk: { t: 'set', next: 'bluffSay', set: [{ k: 'bluff', group: 'wh', seconds: 80 }, { k: 'flag', key: 'bluffed' }] },
    bluffSay: { t: 'dialogue', next: 'inside', lines: [{ who: 'Guard', text: 'Couriers. Fine. Shift lead is in the hall. You have got a minute, then I want you gone.' }] },
    bluffBad: { t: 'dialogue', next: 'bluffBad2', lines: [{ who: 'Guard', text: 'Inspectors come in a van with a clipboard. Move along before I call it in.' }] },
    bluffBad2: { t: 'objective', text: 'The front is burned. Bypass the side-door lock on Slipway Lane', goal: { g: 'interact', pos: 'warehouseSide', label: 'E — Work the side-door lock' }, next: 'lock' },
    lock: { t: 'objective', text: 'Bypass the lock: press E while the needle is in the green band', hint: 'Three clean hits. A miss makes noise.', goal: { g: 'lock', hits: 3, abort: 'approach' }, next: 'unlock' },
    unlock: { t: 'set', next: 'inside', set: [{ k: 'door', id: 'wh-side', open: true }, { k: 'flag', key: 'picked' }] },
    inside: { t: 'objective', text: 'Photograph the three manifests in the warehouse hall', hint: 'Guards and cameras only react to what they can see. Cut the feed at the yard fuse box if you like.',
      goal: { g: 'multi', items: WAREHOUSE.manifests.map((m) => ({ pos: m, label: 'Hold E — Photograph manifest', hold: 1.4 })) }, next: 'cpB',
      optional: [{ text: 'Stay undetected', flag: 'spotted', invert: true }, { text: 'Cut the camera feed', flag: 'feedCut' }],
      side: [{ pos: WAREHOUSE.fuseBox, label: 'Hold E — Pull the camera fuse', hold: 1.2, flag: 'feedCut', set: [{ k: 'disableCamera', group: 'warehouse' }] }] },
    cpB: { t: 'checkpoint', restore: ['setup', 'guards'], next: 'spotCheck' },
    spotCheck: { t: 'branch', when: { c: 'alertAtLeast', n: 1 }, yes: 'markSpotted', no: 'say3' },
    markSpotted: { t: 'set', set: [{ k: 'flag', key: 'spotted' }], next: 'say3' },
    say3: { t: 'dialogue', next: 'escape', lines: [{ who: 'Odalys', text: 'I have the images. Walk out like you belong there, and lose anyone who disagrees.' }] },
    escape: { t: 'objective', text: 'Leave the yard and lose any attention', goal: { g: 'leave', rect: WAREHOUSE.zone, margin: 45 }, next: 'outro' },
    outro: { t: 'dialogue', next: 'reward', lines: [{ who: 'Odalys', text: 'The old manifests name the real contractor. That is leverage. I will call when I know where to point it.' }] },
    reward: { t: 'reward', next: 'cleanup' }, cleanup: { t: 'cleanup', next: 'end' }, end: { t: 'end' },
  },
};

export const M3: MissionDef = {
  id: 'm3', title: 'Hot Cargo', giver: 'Imre Calloway', kind: 'story', par: 420,
  brief: 'A Kestrel van left the depot with the wrong driver. Follow the witness trail, force the van to stop without wrecking the cargo, and bring it to Breakwater Auto & Marine.',
  reward: { cash: 900, trust: 150 }, start: 'intro',
  fails: [{ when: { c: 'cargoGone', veh: 'van' }, reason: 'The cargo was destroyed.' }, { when: { c: 'vehDead', veh: 'van' }, reason: 'The van was lost.' }],
  nodes: {
    intro: { t: 'dialogue', next: 'clue1', lines: [
      { who: 'Imre', text: 'One of our Portage vans rolled out an hour ago and the driver was not on my rota.' },
      { who: 'Imre', text: 'It is carrying Odalys\'s paper archive. Ask around the market. Somebody always sees a van.' } ] },
    clue1: { t: 'objective', text: 'Ask the Saltline vendor about the van', goal: { g: 'interact', pos: 'marketPickup', label: 'E — Ask about the van' }, next: 'say1' },
    say1: { t: 'dialogue', next: 'clue2', lines: [{ who: 'Vendor', text: 'Cream van, yellow courier stripe? Took the Tide Street bridge west like it was late for its own funeral.' }] },
    clue2: { t: 'objective', text: 'Ask the angler on the Tide Street bridge', goal: { g: 'interact', pos: 'canalBridge', label: 'E — Ask the angler' }, next: 'say2' },
    say2: { t: 'dialogue', next: 'spawnVan', lines: [{ who: 'Angler', text: 'Came back over ten minutes later. Doing laps of Foundry Row, I reckon. Lost, or waiting on someone.' }] },
    spawnVan: { t: 'spawn', next: 'chase', items: [{ kind: 'vehicle', ref: 'van', type: 'portage', at: { x: 282, z: -230 }, yaw: 0, color: 0xe8e2d0, owned: true, driver: 'flee' }] },
    chase: { t: 'objective', text: 'Intercept the stolen Portage and force it to stop', hint: 'Box it in or block its lane. Ramming hard damages the cargo.', goal: { g: 'vehStopped', veh: 'van', seconds: 2.5 }, next: 'cp',
      optional: [{ text: 'Keep the cargo above 70%', flag: 'cargoHurt', invert: true }] },
    cp: { t: 'checkpoint', next: 'say3' },
    say3: { t: 'dialogue', next: 'take', lines: [{ who: 'Imre', text: 'Driver bailed? Good. Take the van to Breakwater Auto. And Rowan — whoever hired him will want it back.' }] },
    take: { t: 'objective', text: 'Get in the Portage', goal: { g: 'enter', veh: ['van'] }, next: 'rivals' },
    rivals: { t: 'spawn', next: 'deliver', items: [
      { kind: 'vehicle', ref: 'rivalA', type: 'cutlass', at: { x: 150, z: -40 }, yaw: Math.PI, color: 0x2c3036, driver: 'chase' },
      { kind: 'vehicle', ref: 'rivalB', type: 'tern', at: { x: 392, z: -300 }, yaw: -Math.PI / 2, color: 0x3a4048, driver: 'chase' } ] },
    deliver: { t: 'objective', text: 'Drive the van to Breakwater Auto & Marine — rivals are closing in', goal: { g: 'deliver', veh: 'van', pos: 'garage', r: 9 }, next: 'cargoCheck' },
    cargoCheck: { t: 'branch', when: { c: 'cargoBelow', veh: 'van', v: 70 }, yes: 'cargoHurt', no: 'outro' },
    cargoHurt: { t: 'set', set: [{ k: 'flag', key: 'cargoHurt' }], next: 'outro' },
    outro: { t: 'dialogue', next: 'reward', lines: [{ who: 'Imre', text: 'Van is in the bay and the archive is intact. Somebody paid real money to make it vanish. Talk to Odalys.' }] },
    reward: { t: 'reward', next: 'cleanup' }, cleanup: { t: 'cleanup', next: 'end' }, end: { t: 'end' },
  },
};

export const M4: MissionDef = {
  id: 'm4', title: 'Signal at the Breakwater', giver: 'Odalys Brandt', kind: 'story', par: 600, allowAlert: true,
  brief: 'Get into Port Control, upload the evidence from the control terminal, hold the room while it sends, then escape a Tier 3 search and make it home.',
  reward: { cash: 2000, trust: 300 }, start: 'intro', fails: [],
  nodes: {
    intro: { t: 'dialogue', next: 'setup', lines: [
      { who: 'Odalys', text: 'The contract was signed from the Port Control terminal. The same terminal can send the originals to every desk in the harbor authority.' },
      { who: 'Odalys', text: 'Get in, upload, and stay alive while it sends. Shut the server room first if you can — fewer alarms reach their friends.' } ] },
    setup: { t: 'set', next: 'guards', set: [{ k: 'restricted', rects: [PORT.zone] }, { k: 'cameras', group: 'port', on: true }] },
    guards: { t: 'spawn', next: 'travel', items: [{ kind: 'actors', group: 'port', faction: 'security', at: pts(PORT.guards), patrols: routes(PORT.guards) }] },
    travel: { t: 'objective', text: 'Go to Port Control on Breakwater Drive', goal: { g: 'goto', pos: 'portGate', r: 36 }, next: 'cpA' },
    cpA: { t: 'checkpoint', restore: ['setup', 'guards'], next: 'infiltrate' },
    infiltrate: { t: 'objective', text: 'Infiltrate the compound and reach the control office', hint: 'Stun projector (3) and baton (F) are nonlethal. Smoke blocks sight lines.',
      goal: { g: 'goto', pos: PORT.officeDoor, r: 3.2, mode: 'foot' }, next: 'cpB',
      optional: [{ text: 'Shut down the server room', flag: 'serverOff' }],
      side: [{ pos: PORT.serverSwitch, label: 'Hold E — Shut down the server room', hold: 1.5, flag: 'serverOff' }] },
    cpB: { t: 'checkpoint', restore: ['setup', 'guards'], next: 'upload' },
    upload: { t: 'objective', text: 'Upload the evidence at the control terminal', goal: { g: 'interact', pos: PORT.terminal, label: 'Hold E — Start the upload', hold: 2.5, r: 3 }, next: 'say2' },
    say2: { t: 'dialogue', next: 'wave1', lines: [{ who: 'Odalys', text: 'It is sending. They will know within seconds. Hold that compound until it finishes.' }] },
    wave1: { t: 'spawn', next: 'hold1', items: [{ kind: 'actors', group: 'rivals', faction: 'rival', at: [PORT.rivalSpawns[0], PORT.rivalSpawns[1]] }] },
    hold1: { t: 'objective', text: 'Survive the counterattack while the upload completes', goal: { g: 'wait', seconds: 28, inside: PORT.zone }, next: 'wave2' },
    wave2: { t: 'spawn', next: 'hold2', items: [{ kind: 'actors', group: 'rivals2', faction: 'rival', at: [PORT.rivalSpawns[2], PORT.rivalSpawns[0]] }] },
    hold2: { t: 'objective', text: 'Survive the counterattack while the upload completes', goal: { g: 'wait', seconds: 26, inside: PORT.zone }, next: 'serverBranch' },
    serverBranch: { t: 'branch', when: { c: 'flag', key: 'serverOff' }, yes: 'cpC', no: 'wave3' },
    wave3: { t: 'spawn', next: 'hold3', items: [{ kind: 'actors', group: 'rivals3', faction: 'rival', at: [PORT.rivalSpawns[3], PORT.rivalSpawns[1], PORT.rivalSpawns[2]] }] },
    hold3: { t: 'objective', text: 'A last wave got the alarm — hold on', goal: { g: 'wait', seconds: 22, inside: PORT.zone }, next: 'cpC' },
    cpC: { t: 'checkpoint', restore: ['escapeCars'], next: 'escapeCars' },
    escapeCars: { t: 'spawn', next: 'say3', items: [
      { kind: 'vehicle', ref: 'escBike', type: 'sirocco', at: PORT.bikeSpot, yaw: 0, color: 0xd9482b, owned: true },
      { kind: 'vehicle', ref: 'escCar', type: 'cutlass', at: PORT.carSpot, yaw: 0, color: 0x1f7a8c, owned: true } ] },
    say3: { t: 'dialogue', next: 'tier', lines: [{ who: 'Odalys', text: 'Sent. Every desk has it. Port security just called in the whole district — there is a Sirocco and a Cutlass by the gate. Pick one and go.' }] },
    tier: { t: 'set', next: 'pick', set: [{ k: 'alertTier', tier: 3 }, { k: 'restricted', rects: [] }, { k: 'weather', rain: true }, { k: 'hour', atLeast: 20.5 }] },
    pick: { t: 'objective', text: 'Choose your escape: the Sirocco bike or the Cutlass coupe', goal: { g: 'enter', veh: ['escBike', 'escCar'] }, next: 'evade' },
    evade: { t: 'objective', text: 'Break the Tier 3 search', hint: 'Get out of sight, leave the search area on the map, and stay unseen until the beacon cools.', goal: { g: 'alertClear' }, next: 'home' },
    home: { t: 'objective', text: 'Return to the safehouse on Tide Street', goal: { g: 'goto', pos: 'safehouse', r: 7 }, next: 'outro' },
    outro: { t: 'dialogue', next: 'reward', lines: [
      { who: 'Odalys', text: 'The harbor authority froze the contract an hour ago. The docks will remember who carried that.' },
      { who: 'Imre', text: 'Take tomorrow off, Rowan. Then again, the board is full. South Quay is yours to ride.' } ] },
    reward: { t: 'reward', next: 'cleanup' }, cleanup: { t: 'cleanup', next: 'end' }, end: { t: 'end' },
  },
};

export const STORY: MissionDef[] = [M1, M2, M3, M4];
export const STORY_ORDER = STORY.map((m) => m.id);
export const GIVER_ANCHOR: Record<string, AnchorId> = { m1: 'depot', m2: 'odalys', m3: 'depot', m4: 'odalys' };

// ------------------------------------------------------------------ activities
const COURIER_STOPS: { a: AnchorId | { x: number; z: number }; name: string }[] = [
  { a: 'marketPickup', name: 'Saltline Stall' }, { a: 'glassDrop', name: 'Meridian Exchange' }, { a: 'quayMart', name: 'Quay Mart' },
  { a: 'supply', name: 'Harbor Supply' }, { a: 'odalys', name: 'Dockhands Union Hall' }, { a: 'viewpoint', name: 'Lantern viewpoint' },
  { a: 'precinct', name: 'Glassline Substation desk' }, { a: 'clothing', name: 'Thread & Tide' }, { a: 'portGate', name: 'Port Control gate' },
  { a: 'warehouseFront', name: 'Foundry warehouse gate' }, { a: 'canalBridge', name: 'Tide Street bridge' }, { a: { x: -330, z: 152 }, name: 'Weir Street flats' },
  { a: { x: 330, z: 152 }, name: 'Ledger Street steps' }, { a: { x: -330, z: -305 }, name: 'West docks office' },
];
export type CourierMod = 'fragile' | 'urgent' | 'quiet';
/** Courier Runs: procedurally paired pickup/drop with a modifier. */
export function makeCourier(seed: number): MissionDef {
  const rng = new Rng(seed * 7919 + 13);
  const p = (s: (typeof COURIER_STOPS)[number]) => (typeof s.a === 'string' ? ANCHORS[s.a] : s.a);
  let a = rng.pick(COURIER_STOPS), b = rng.pick(COURIER_STOPS);
  for (let k = 0; k < 20 && (a === b || Math.hypot(p(a).x - p(b).x, p(a).z - p(b).z) < 220); k++) { a = rng.pick(COURIER_STOPS); b = rng.pick(COURIER_STOPS); }
  const mod: CourierMod = rng.pick(['fragile', 'urgent', 'quiet']);
  const dist = routeLength(roadRoute(p(a).x, p(a).z, p(b).x, p(b).z));
  const limit = Math.round(dist / 9.5 + 28);
  const modText = mod === 'fragile' ? 'Fragile: no more than two hard knocks.' : mod === 'urgent' ? `Urgent: deliver inside ${Math.floor(limit / 60)}:${String(limit % 60).padStart(2, '0')}.` : 'Quiet: finish with no Alert on you.';
  const nodes: Record<string, NodeDef> = {
    pickup: { t: 'objective', text: `Collect the parcel at ${a.name}`, goal: { g: 'interact', pos: a.a, label: 'Hold E — Collect the parcel', hold: 0.8, r: 3.2 }, next: 'go' },
    go: { t: 'dialogue', next: 'drop', lines: [{ who: 'Imre', text: `${b.name}. ${modText}` }] },
    drop: { t: 'objective', text: `Deliver to ${b.name}`, hint: modText, goal: { g: 'interact', pos: b.a, label: 'Hold E — Hand over the parcel', hold: 0.8, r: 3.2 }, next: 'reward',
      ...(mod === 'urgent' ? { timeLimit: { seconds: limit, reason: 'The delivery window closed.' } } : {}) },
    reward: { t: 'reward', next: 'cleanup' }, cleanup: { t: 'cleanup', next: 'end' }, end: { t: 'end' },
  };
  return {
    id: `courier:${seed}`, title: `Courier Run — ${a.name} to ${b.name}`, giver: 'Kestrel Couriers', kind: 'activity', par: limit + 30,
    brief: `${Math.round(dist)} m route. ${modText}`, reward: { cash: Math.round(110 + dist * 0.45), trust: 20 }, start: 'pickup', nodes,
    fails: mod === 'fragile' ? [{ when: { c: 'impacts', n: 3 }, reason: 'The fragile parcel broke.' }] : mod === 'quiet' ? [{ when: { c: 'alertAtLeast', n: 2 }, reason: 'Too much attention for a quiet run.' }] : [],
  };
}
export const CIRCUIT_GATES: { x: number; z: number }[] = [
  { x: 280, z: -300 }, { x: 280, z: -80 }, { x: 280, z: 270 }, { x: 50, z: 270 }, { x: -170, z: 270 }, { x: -170, z: 40 }, { x: -170, z: -300 }, { x: 60, z: -300 },
];
/** Street Circuit: three laps of the arterial loop through live traffic. */
export function makeCircuit(): MissionDef {
  const nodes: Record<string, NodeDef> = {
    grid: { t: 'objective', text: 'Bring any vehicle to the start grid on Breakwater Drive', goal: { g: 'goto', pos: 'circuitStart', r: 9, mode: 'vehicle', stop: true }, next: 'go' },
    go: { t: 'set', set: [{ k: 'timer', start: true }], next: 'say' },
    say: { t: 'dialogue', next: 'g0_0', lines: [{ who: 'Marshal', text: 'Three laps of the arterial loop. Traffic is live. Go!' }] },
    reward: { t: 'reward', next: 'cleanup' }, cleanup: { t: 'cleanup', next: 'end' }, end: { t: 'end' },
  };
  for (let lap = 0; lap < 3; lap++) CIRCUIT_GATES.forEach((g, i) => {
    const last = i === CIRCUIT_GATES.length - 1;
    nodes[`g${lap}_${i}`] = { t: 'objective', text: `Street Circuit — lap ${lap + 1}/3, gate ${i + 1}/${CIRCUIT_GATES.length}`, hint: 'Hold R for 1 s to reset to the last gate (+5 s)', goal: { g: 'goto', pos: g, r: 16, mode: 'vehicle' }, next: last ? (lap === 2 ? 'reward' : `g${lap + 1}_0`) : `g${lap}_${i + 1}` };
  });
  return { id: 'circuit', title: 'Street Circuit — Arterial Loop', giver: 'South Quay Street League', kind: 'activity', par: 235, brief: 'Three-lap time trial around the arterial loop through live traffic. Beat your own ghost.', reward: { cash: 350, trust: 25 }, start: 'grid', nodes, fails: [], allowAlert: true };
}
/** Recovery Calls: find a reported stolen vehicle inside a search area and return it undamaged. */
export function makeRecovery(seed: number): MissionDef {
  const rng = new Rng(seed * 104729 + 7);
  const g = ANCHORS.garage;
  const spots = parkSpots.filter((s) => !s.reserved && Math.hypot(s.x - g.x, s.z - g.z) > 260);
  const spot = spots.length ? rng.pick(spots) : { x: 100, z: 100, yaw: 0 };
  const type = rng.pick(['tern', 'dart', 'coaster', 'cutlass']);
  const ox = spot.x + rng.range(-40, 40), oz = spot.z + rng.range(-40, 40);
  const nodes: Record<string, NodeDef> = {
    spawn: { t: 'spawn', next: 'find', items: [{ kind: 'vehicle', ref: 'target', type, at: { x: spot.x, z: spot.z }, yaw: spot.yaw, color: 0xc2456e, owned: true }] },
    find: { t: 'objective', text: 'Search the marked area for the magenta stolen vehicle', hint: 'The owner reported it somewhere inside the circle.', goal: { g: 'goto', pos: { x: spot.x, z: spot.z }, r: 14, area: { x: ox, z: oz, r: 62 } }, next: 'take' },
    take: { t: 'objective', text: 'Get in the recovered vehicle', goal: { g: 'enter', veh: ['target'] }, next: 'cp' },
    cp: { t: 'checkpoint', restore: [], next: 'back' },
    back: { t: 'objective', text: 'Return it to Breakwater Auto & Marine in good condition', goal: { g: 'deliver', veh: 'target', pos: 'garage', r: 9 }, next: 'reward' },
    reward: { t: 'reward', next: 'cleanup' }, cleanup: { t: 'cleanup', next: 'end' }, end: { t: 'end' },
  };
  const def: MissionDef = { id: `recovery:${seed}`, title: 'Recovery Call', giver: 'Breakwater Auto & Marine', kind: 'activity', par: 300, brief: 'A customer\'s car was taken overnight. Find it in the search area and bring it back without adding dents.', reward: { cash: 320, trust: 20 }, start: 'spawn', nodes, fails: [{ when: { c: 'vehDead', veh: 'target' }, reason: 'The vehicle was wrecked.' }] };
  return def;
}
