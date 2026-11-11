// Authored story slice: four missions as data-driven graphs (schema v1).
import { MISSION_SCHEMA_VERSION, type MissionDef, type MNode } from "./runtime";

function graph(nodes: MNode[]): Record<string, MNode> {
  const out: Record<string, MNode> = {};
  for (const n of nodes) out[n.id] = n;
  return out;
}

export const SHED_RECT = { x0: -325, z0: -165, x1: -275, z1: -135 };
export const PORT_RECT = { x0: 237, z0: -323, x1: 263, z1: -307 };

export const FIRST_SHIFT: MissionDef = {
  schema: MISSION_SCHEMA_VERSION, id: "first_shift", title: "First Shift", giver: "Mara Okoye", kind: "story",
  blurb: "Your first Quayside Couriers delivery: Tide Market to Lantern Hill on the Kestrel.",
  reward: { cash: 250, trust: 110 }, parTime: 260, start: "s", rewardKey: "story:first_shift",
  fail: [
    { kind: "playerDead", reason: "You were taken to the clinic." },
    { kind: "vehicleDestroyed", tag: "kestrel", reason: "Your Kestrel was wrecked." },
  ],
  nodes: graph([
    { id: "s", type: "start", next: "call" },
    { id: "call", type: "dialogue", next: "bike", lines: [
      { speaker: "Mara", text: "Morning, Rowan. First shift with Quayside — your Kestrel's parked outside the loft." },
      { speaker: "Mara", text: "Ride down to the Tide Market plaza. I'll have a package waiting." },
    ] },
    { id: "bike", type: "objective", next: "ride", obj: { kind: "enterVehicle", text: "Get on your Kestrel (walk up and press E)", tags: ["kestrel"] } },
    { id: "ride", type: "objective", next: "pickup", obj: { kind: "reach", text: "Ride to Quayside Couriers in Tide Market (follow the GPS line)", x: -80, z: -110, r: 9 } },
    { id: "pickup", type: "objective", next: "brief", obj: { kind: "interact", text: "Collect the package from Mara", id: "mara_pkg", x: -80, z: -125, r: 2.6, label: "Take package", onFoot: true } },
    { id: "brief", type: "dialogue", next: "cp1", lines: [
      { speaker: "Mara", text: "Ceramics for Calder Steps, Lantern Hill. Park in the marked bay and hand it over." },
      { speaker: "Mara", text: "Beat two minutes and there's a tip in it. Traffic doesn't care that you're new." },
    ] },
    { id: "cp1", type: "checkpoint", next: "bike2", spawn: { x: -80, z: -114, yaw: 0 } },
    { id: "bike2", type: "objective", next: "park", obj: { kind: "enterVehicle", text: "Back on the Kestrel", tags: ["kestrel"] } },
    { id: "park", type: "objective", next: "handover", optional: [{ id: "fast", text: "Deliver within 2:00 (tip)", kind: "time", seconds: 200 }],
      obj: { kind: "reach", text: "Stop in the parking bay on Calder Steps (Lantern Hill)", x: -103, z: 245, r: 4.5, inVehicle: true, stopped: true } },
    { id: "handover", type: "objective", next: "pay", obj: { kind: "interact", text: "Hand over the package at the door", id: "calder_door", x: -106.5, z: 250, r: 2.4, label: "Deliver package", onFoot: true } },
    { id: "pay", type: "reward", next: "wrap", cash: 250, trust: 110 },
    { id: "wrap", type: "dialogue", next: "end", lines: [
      { speaker: "Mara", text: "Smooth. That's how Quayside does it. Courier runs are on your phone (P) whenever you want work." },
      { speaker: "Mara", text: "Oh — a journalist, Ines Calder, has been asking for you. She hangs around the canal path by the Glassline bridge." },
    ] },
    { id: "end", type: "end" },
  ]),
};

export const LOST_MANIFEST: MissionDef = {
  schema: MISSION_SCHEMA_VERSION, id: "lost_manifest", title: "Lost Manifest", giver: "Ines Calder", kind: "story",
  blurb: "Get into Calloway Freight Shed 4 and photograph three cargo manifests. Quiet is better.",
  reward: { cash: 400, trust: 140 }, parTime: 420, start: "s", rewardKey: "story:lost_manifest",
  fail: [{ kind: "playerDead", reason: "You were taken to the clinic." }],
  nodes: graph([
    { id: "s", type: "start", next: "talk" },
    { id: "talk", type: "dialogue", next: "go", lines: [
      { speaker: "Ines", text: "Rowan. The port automation contract went to Calloway Freight, and the numbers don't add up." },
      { speaker: "Ines", text: "Their manifests are in Shed 4, Foundry Row. Photographs only — nobody needs to get hurt." },
    ] },
    { id: "go", type: "objective", next: "cp", obj: { kind: "reach", text: "Go to Freight Shed 4 in Foundry Row", x: -300, z: -180, r: 12 } },
    { id: "cp", type: "checkpoint", next: "spawn", spawn: { x: -300, z: -182, yaw: 0 } },
    { id: "spawn", type: "spawn", next: "choice", requests: [
      { kind: "door", id: "shed_s", locked: true }, { kind: "door", id: "shed_w", locked: true },
      { kind: "guard", tag: "shed", x: -318, z: -140, yaw: 0, team: "security", weapon: "baton", zone: SHED_RECT, waypoints: [{ x: -318, z: -140 }, { x: -300, z: -140 }, { x: -300, z: -158 }, { x: -318, z: -158 }] },
      { kind: "guard", tag: "shed", x: -284, z: -140, yaw: 0, team: "security", weapon: "baton", zone: SHED_RECT, waypoints: [{ x: -284, z: -140 }, { x: -280, z: -160 }, { x: -286, z: -146 }] },
      { kind: "guard", tag: "shed", x: -310, z: -150, yaw: 1.5, team: "security", weapon: "stun", zone: SHED_RECT, waypoints: [{ x: -312, z: -150 }, { x: -296, z: -150 }] },
      { kind: "npc", tag: "shed_foreman", x: -294, z: -168, yaw: Math.PI, role: "security" },
    ] },
    { id: "choice", type: "branch", prompt: "Shed 4 is locked down. How do you get in?", options: [
      { label: "Side door — bypass the lock", hint: "Quiet. Timing minigame at the west door.", next: "side_go" },
      { label: "Front gate — talk to the foreman", hint: "Bluff your way in. Choose your words.", next: "front_go" },
    ] },
    { id: "side_go", type: "objective", next: "side_check", obj: { kind: "lockpick", text: "Bypass the side-door lock (west wall)", id: "shed_lock", x: -327, z: -146, r: 2.2, label: "Bypass lock" } },
    { id: "side_check", type: "trigger", flag: "lockpickFailed", next: "side_alarm", elseNext: "side_open" },
    { id: "side_alarm", type: "world", next: "photos", set: { "door:shed_w": false, alarm: "shed" } },
    { id: "side_open", type: "world", next: "photos", set: { "door:shed_w": false } },
    { id: "front_go", type: "objective", next: "front_talk", obj: { kind: "interact", text: "Talk to the foreman at the front gate", id: "foreman", x: -294, z: -168.5, r: 2.6, label: "Talk to foreman", onFoot: true } },
    { id: "front_talk", type: "branch", prompt: "Foreman: \"Shed's closed. Who sent you?\"", options: [
      { label: "\"Quayside Couriers. Calloway pickup — paperwork's inside.\"", hint: "Plausible. You are a courier.", next: "front_ok" },
      { label: "\"Harbor safety inspection. Open up.\"", hint: "Bold. He may check.", next: "front_bad" },
    ] },
    { id: "front_ok", type: "dialogue", next: "front_open", lines: [{ speaker: "Foreman", text: "Courier, huh. Fine. Grab your paperwork and don't touch the office desks." }] },
    { id: "front_open", type: "world", next: "photos", set: { "door:shed_s": false, cover: true } },
    { id: "front_bad", type: "dialogue", next: "front_alarm", lines: [{ speaker: "Foreman", text: "Inspection? On a Sunday? Hey — security!" }] },
    { id: "front_alarm", type: "world", next: "photos", set: { "door:shed_s": false, alarm: "shed" } },
    { id: "photos", type: "objective", next: "leave", optional: [{ id: "ghost", text: "Stay undetected", kind: "flag", flag: "undetected" }],
      obj: { kind: "interactAll", text: "Photograph the cargo manifests", r: 2.0, points: [
        { id: "man1", x: -318, z: -161.5, label: "Photograph manifest" },
        { id: "man2", x: -297, z: -138.5, label: "Photograph manifest" },
        { id: "man3", x: -281, z: -161.5, label: "Photograph manifest" },
      ] } },
    { id: "leave", type: "objective", next: "lose", obj: { kind: "leaveArea", text: "Get clear of Freight Shed 4", x: -300, z: -150, r: 75 } },
    { id: "lose", type: "objective", next: "pay", obj: { kind: "escapeAlert", text: "Lose the Alert" } },
    { id: "pay", type: "reward", next: "clean", cash: 400, trust: 140, unlock: ["pistol"] },
    { id: "clean", type: "cleanup", next: "wrap" },
    { id: "wrap", type: "dialogue", next: "end", lines: [
      { speaker: "Ines", text: "These manifests list cargo that doesn't exist — and automated cranes that already do." },
      { speaker: "Ines", text: "Harbor Compact 9 is in your locker if things turn ugly. And Mara just lost a van. Coincidence? Doubt it." },
    ] },
    { id: "end", type: "end" },
  ]),
};

export const HOT_CARGO: MissionDef = {
  schema: MISSION_SCHEMA_VERSION, id: "hot_cargo", title: "Hot Cargo", giver: "Mara Okoye", kind: "story",
  blurb: "Track a stolen Quayside Hauler through witnesses, force it to stop without wrecking the cargo, and bring it in.",
  reward: { cash: 700, trust: 160 }, parTime: 480, start: "s", rewardKey: "story:hot_cargo",
  fail: [
    { kind: "playerDead", reason: "You were taken to the clinic." },
    { kind: "vehicleDestroyed", tag: "hot_van", reason: "The Hauler was wrecked — cargo lost." },
    { kind: "cargoBelow", tag: "hot_van", min: 15, reason: "The cargo was destroyed." },
    { kind: "vehicleEscaped", tag: "hot_van", dist: 420, reason: "The van got away." },
  ],
  nodes: graph([
    { id: "s", type: "start", next: "talk" },
    { id: "talk", type: "dialogue", next: "spawnw", lines: [
      { speaker: "Mara", text: "Somebody drove off with one of our Haulers — client cargo inside. Wardens say 'file a report'." },
      { speaker: "Mara", text: "Market folks saw it. Ask around, find the van, and bring it to Breakwater Repair in one piece." },
    ] },
    { id: "spawnw", type: "spawn", next: "w1", requests: [
      { kind: "npc", tag: "hc_w1", x: 40, z: -196.5, yaw: 0, role: "vendor" },
      { kind: "npc", tag: "hc_w2", x: 193.8, z: -150, yaw: Math.PI / 2, role: "commuter" },
    ] },
    { id: "w1", type: "objective", next: "w1d", obj: { kind: "interact", text: "Ask the fruit vendor by the tram line", id: "hc_w1", x: 40, z: -196.5, r: 2.6, label: "Ask about the van", onFoot: true } },
    { id: "w1d", type: "dialogue", next: "w2", lines: [{ speaker: "Vendor", text: "White Hauler, Quayside stripes? Went east toward Glassline like it owed somebody money." }] },
    { id: "w2", type: "objective", next: "w2d", obj: { kind: "interact", text: "Find the commuter who saw it in Glassline", id: "hc_w2", x: 193.8, z: -150, r: 2.6, label: "Ask about the van", onFoot: true } },
    { id: "w2d", type: "dialogue", next: "cp", lines: [{ speaker: "Commuter", text: "It doubled back north. Probably circling the canal bridges — the cameras there are always broken." }] },
    { id: "cp", type: "checkpoint", next: "spawnv", spawn: { x: 193.8, z: -146, yaw: 0 } },
    { id: "spawnv", type: "spawn", next: "chase", requests: [
      { kind: "vehicle", tag: "hot_van", model: "hauler", x: 100, z: 160, yaw: 0, ai: "wander", crew: 1, team: "rival" },
    ] },
    { id: "chase", type: "objective", next: "board", obj: { kind: "stopVehicle", text: "Find the stolen Hauler and force it to stop (ram or box it in — mind the cargo)", tag: "hot_van", searchX: 160, searchZ: 120, searchR: 110, revealAt: 110 } },
    { id: "board", type: "objective", next: "spawnr", obj: { kind: "enterVehicle", text: "Get in the Hauler", tags: ["hot_van"] } },
    { id: "spawnr", type: "spawn", next: "deliver", requests: [
      { kind: "vehicle", tag: "rivals", model: "brava", x: 0, z: 0, yaw: 0, ai: "pursue", crew: 2, team: "rival" },
      { kind: "vehicle", tag: "rivals", model: "varro", x: 0, z: 0, yaw: 0, ai: "pursue", crew: 2, team: "rival" },
    ] },
    { id: "deliver", type: "objective", next: "pay", optional: [{ id: "cargo", text: "Keep the rivals off — no civilians hurt", kind: "noCivHarm" }],
      obj: { kind: "deliverVehicle", text: "Deliver the Hauler to Breakwater Repair — rivals are on you", tag: "hot_van", x: -150, z: -353, r: 7 } },
    { id: "pay", type: "reward", next: "clean", cash: 700, trust: 160, unlock: ["carbine", "shotgun"] },
    { id: "clean", type: "cleanup", next: "wrap" },
    { id: "wrap", type: "dialogue", next: "end", lines: [
      { speaker: "Mara", text: "Cargo's intact. And it's full of port-control hardware with Calloway serials." },
      { speaker: "Mara", text: "Ines needs to see this. Carbine and shotgun are unlocked in the locker — hope you never need them." },
    ] },
    { id: "end", type: "end" },
  ]),
};

export const SIGNAL_BREAKWATER: MissionDef = {
  schema: MISSION_SCHEMA_VERSION, id: "signal_breakwater", title: "Signal at the Breakwater", giver: "Ines Calder", kind: "story",
  blurb: "Infiltrate Port Control, upload the evidence, hold out, then break a Tier-3 search and get home.",
  reward: { cash: 1500, trust: 300 }, parTime: 600, start: "s", rewardKey: "story:signal_breakwater",
  fail: [{ kind: "playerDead", reason: "You were taken to the clinic." }],
  nodes: graph([
    { id: "s", type: "start", next: "talk" },
    { id: "talk", type: "dialogue", next: "go", lines: [
      { speaker: "Ines", text: "The Port Control Office at the Breakwater runs the whole automated contract." },
      { speaker: "Ines", text: "Upload my files from their own terminal and every screen in the city carries it. Cut the server room if you can." },
    ] },
    { id: "go", type: "objective", next: "spawn", obj: { kind: "reach", text: "Go to the Port Control Office (Breakwater)", x: 250, z: -296, r: 12 } },
    { id: "spawn", type: "spawn", next: "cp1", requests: [
      { kind: "guard", tag: "port", x: 240, z: -301, yaw: 0, team: "security", weapon: "pistol", zone: { x0: 228, z0: -330, x1: 272, z1: -295 }, waypoints: [{ x: 240, z: -301 }, { x: 262, z: -301 }] },
      { kind: "guard", tag: "port", x: 241, z: -314, yaw: 0, team: "security", weapon: "stun", zone: PORT_RECT, waypoints: [{ x: 241, z: -314 }, { x: 251, z: -320 }, { x: 251, z: -310 }] },
      { kind: "guard", tag: "port", x: 259, z: -320, yaw: 0, team: "security", weapon: "baton", zone: PORT_RECT },
    ] },
    { id: "cp1", type: "checkpoint", next: "terminal", spawn: { x: 250, z: -296, yaw: Math.PI } },
    { id: "terminal", type: "objective", next: "upl", optional: [
      { id: "server", text: "Shut down the server room (east room)", kind: "flag", flag: "serverShutdown" },
      { id: "safe", text: "No civilians harmed", kind: "noCivHarm" },
    ], obj: { kind: "interact", text: "Start the upload at the control terminal", id: "terminal", x: 244, z: -318.5, r: 2.4, label: "Start upload", onFoot: true } },
    { id: "upl", type: "dialogue", next: "waves", lines: [{ speaker: "Ines", text: "Upload's running — forty-five seconds. Calloway's private security will know. Hold the room!" }] },
    { id: "waves", type: "spawn", next: "hold", requests: [
      { kind: "wave", tag: "attackers", count: 3, waves: 3, interval: 14, fromX: 250, fromZ: -268, toX: 246, toZ: -304 },
    ] },
    { id: "hold", type: "objective", next: "cp2", obj: { kind: "survive", text: "Hold the control room until the upload finishes", seconds: 45, x: 248, z: -315, r: 13 } },
    { id: "cp2", type: "checkpoint", next: "escv", spawn: { x: 246, z: -303, yaw: 0 } },
    { id: "escv", type: "spawn", next: "done", requests: [
      { kind: "vehicle", tag: "escape_moto", model: "vanta", x: 236, z: -295, yaw: Math.PI / 2, ai: "none" },
      { kind: "vehicle", tag: "escape_car", model: "brava", x: 263, z: -295, yaw: -Math.PI / 2, ai: "none" },
    ] },
    { id: "done", type: "dialogue", next: "heat", lines: [{ speaker: "Ines", text: "Upload complete! Wardens are flooding the Breakwater. Bike or car outside — your call. Go!" }] },
    { id: "heat", type: "world", next: "pick", set: { forceAlert: 3 } },
    { id: "pick", type: "objective", next: "escape", obj: { kind: "enterVehicle", text: "Choose your escape: Vanta 800 (west) or Brava GT (east)", tags: ["escape_moto", "escape_car"] } },
    { id: "escape", type: "objective", next: "home", obj: { kind: "escapeAlert", text: "Break the Tier-3 search — get out of sight and stay out" } },
    { id: "home", type: "objective", next: "night", obj: { kind: "reach", text: "Lie low at the safehouse", x: -55, z: 96, r: 7 } },
    { id: "night", type: "world", next: "pay", set: { weather: "rain", time: 21.5 } },
    { id: "pay", type: "reward", next: "clean", cash: 1500, trust: 300, unlock: ["marksman", "mpistol", "vehicle:vanta"] },
    { id: "clean", type: "cleanup", next: "wrap" },
    { id: "wrap", type: "dialogue", next: "end", lines: [
      { speaker: "Ines", text: "It's everywhere. Every tram screen, every tower in Glassline. Calloway's contract is finished." },
      { speaker: "Ines", text: "Keep the Vanta. Port Meridian's going to need a courier who knows the back streets." },
    ] },
    { id: "end", type: "end" },
  ]),
};

export const STORY: MissionDef[] = [FIRST_SHIFT, LOST_MANIFEST, HOT_CARGO, SIGNAL_BREAKWATER];
export const STORY_GIVER: Record<string, string> = {
  first_shift: "contact_mara", lost_manifest: "contact_ines", hot_cargo: "contact_mara", signal_breakwater: "contact_ines",
};

/** Which story mission is next given completed ids. */
export function nextStory(done: string[]): MissionDef | null {
  for (const m of STORY) if (!done.includes(m.id)) return m;
  return null;
}
