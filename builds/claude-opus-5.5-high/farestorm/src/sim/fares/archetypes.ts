// 24 original passenger archetypes for Galeport. Preferences modify tips, never the destination timer.

export type Preference = "thrill" | "fragile" | "tourist" | "rush" | "musician" | "calm" | "shortcut" | "nightowl" | "chatty";
export type BarkCat = "pickup" | "stunt" | "collision" | "urgency" | "arrival" | "fail" | "praise";

export interface Archetype {
  id: number;
  name: string;
  role: string;
  pref: Preference;
  body: string;
  accent: string;
  skin: string;
  hat: "none" | "cap" | "beanie" | "sunhat" | "tophat" | "headphones" | "helmet" | "bun" | "beret";
  prop: "none" | "case" | "box" | "board" | "bag" | "camera" | "flowers";
  height: number;
  voice: number; // pitch multiplier for the chirp voice
  greet: string;
}

export const ARCHETYPES: Archetype[] = [
  { id: 0, name: "Juno Vale", role: "Rollercoaster tester", pref: "thrill", body: "#ff4f6d", accent: "#ffe14d", skin: "#c98b62", hat: "helmet", prop: "none", height: 1.0, voice: 1.25, greet: "Make my stomach flip!" },
  { id: 1, name: "Bram Kettle", role: "Cake courier", pref: "fragile", body: "#ffffff", accent: "#ff8fb1", skin: "#f1c7a3", hat: "cap", prop: "box", height: 1.05, voice: 0.85, greet: "Four-tier cake. Gently, please." },
  { id: 2, name: "Odette & Pip", role: "Sightseers", pref: "tourist", body: "#7fd3ff", accent: "#ffd166", skin: "#e8b48f", hat: "sunhat", prop: "camera", height: 0.95, voice: 1.1, greet: "Show us the sights!" },
  { id: 3, name: "Marlo Finch", role: "Night-shift nurse", pref: "rush", body: "#3ad1c4", accent: "#ffffff", skin: "#8d5a3b", hat: "none", prop: "bag", height: 1.0, voice: 1.0, greet: "Shift starts in a minute!" },
  { id: 4, name: "Sable Reed", role: "Jazz trumpeter", pref: "musician", body: "#8a5cff", accent: "#ffcf5a", skin: "#6b4128", hat: "beret", prop: "case", height: 1.08, voice: 0.95, greet: "Keep the groove going." },
  { id: 5, name: "Grandpa Oleander", role: "Retired ferry captain", pref: "calm", body: "#2b4a8c", accent: "#f4f1e6", skin: "#f0c9a8", hat: "cap", prop: "none", height: 0.92, voice: 0.7, greet: "Easy on the swells, kid." },
  { id: 6, name: "Pixie Morrow", role: "Map collector", pref: "shortcut", body: "#7ccf4a", accent: "#2b2d42", skin: "#e5a880", hat: "beanie", prop: "bag", height: 0.9, voice: 1.35, greet: "I know a secret way..." },
  { id: 7, name: "Dex Halloran", role: "Street racer fan", pref: "nightowl", body: "#1d1d2b", accent: "#3dfcff", skin: "#c48a64", hat: "headphones", prop: "none", height: 1.02, voice: 1.05, greet: "Thread every gap!" },
  { id: 8, name: "Wren Applegate", role: "Gossip columnist", pref: "chatty", body: "#ff9f1c", accent: "#ffffff", skin: "#f2c29b", hat: "sunhat", prop: "bag", height: 0.98, voice: 1.3, greet: "Did you hear about the mayor?" },
  { id: 9, name: "Captain Lumi", role: "Kite surfer", pref: "thrill", body: "#00b4d8", accent: "#ff6b35", skin: "#a86b47", hat: "none", prop: "board", height: 1.06, voice: 1.15, greet: "Catch some air, captain!" },
  { id: 10, name: "Ines Porcelain", role: "Antique dealer", pref: "fragile", body: "#c9a227", accent: "#3b2f2f", skin: "#ecc19c", hat: "tophat", prop: "box", height: 1.0, voice: 0.9, greet: "Mind the porcelain, dear." },
  { id: 11, name: "The Okafor Twins", role: "Food bloggers", pref: "tourist", body: "#ff5d8f", accent: "#7dffaf", skin: "#5a3622", hat: "cap", prop: "camera", height: 0.96, voice: 1.2, greet: "Content! Scenery! Go!" },
  { id: 12, name: "Rafe Quillon", role: "Courtroom lawyer", pref: "rush", body: "#33415c", accent: "#e63946", skin: "#e0ac84", hat: "none", prop: "case", height: 1.04, voice: 0.88, greet: "Court's in session. Hurry!" },
  { id: 13, name: "DJ Saltwave", role: "Pier DJ", pref: "musician", body: "#ff3ec8", accent: "#1dfcff", skin: "#9b6542", hat: "headphones", prop: "none", height: 1.0, voice: 1.1, greet: "Drop the beat, driver!" },
  { id: 14, name: "Sister Marguerite", role: "Choir director", pref: "calm", body: "#f4f1e6", accent: "#2a9d8f", skin: "#f5d0b0", hat: "bun", prop: "flowers", height: 0.94, voice: 1.0, greet: "Serenity, please." },
  { id: 15, name: "Tobias Gearloft", role: "Tram engineer", pref: "shortcut", body: "#ff6f59", accent: "#26323d", skin: "#d39a74", hat: "cap", prop: "bag", height: 1.03, voice: 0.8, greet: "Bet you know the tram cuts." },
  { id: 16, name: "Vesper Nox", role: "Neon sign artist", pref: "nightowl", body: "#5f2eea", accent: "#ff2e88", skin: "#b07953", hat: "beanie", prop: "none", height: 1.0, voice: 1.18, greet: "Ride the edge with me." },
  { id: 17, name: "Mayor-ish Pell", role: "Self-declared mayor", pref: "chatty", body: "#e9c46a", accent: "#264653", skin: "#efc6a4", hat: "tophat", prop: "none", height: 1.08, voice: 0.92, greet: "Vote Pell! Probably!" },
  { id: 18, name: "Kiko Spark", role: "Fireworks technician", pref: "thrill", body: "#ffbe0b", accent: "#fb5607", skin: "#c69069", hat: "helmet", prop: "box", height: 0.97, voice: 1.28, greet: "Light the fuse!" },
  { id: 19, name: "Hollis Fern", role: "Orchid grower", pref: "fragile", body: "#80ed99", accent: "#ff70a6", skin: "#f3d1b5", hat: "sunhat", prop: "flowers", height: 0.93, voice: 1.12, greet: "My orchids bruise easily." },
  { id: 20, name: "Professor Aldous", role: "Architecture historian", pref: "tourist", body: "#a68a64", accent: "#f2e8cf", skin: "#e2b590", hat: "beret", prop: "camera", height: 1.01, voice: 0.82, greet: "Mind the landmarks, please!" },
  { id: 21, name: "Zuri Bolt", role: "Sprint coach", pref: "rush", body: "#06d6a0", accent: "#118ab2", skin: "#6e4429", hat: "cap", prop: "none", height: 1.07, voice: 1.08, greet: "Personal best! Now!" },
  { id: 22, name: "Beatrix Tuba", role: "Marching band leader", pref: "musician", body: "#d62828", accent: "#fcbf49", skin: "#edbb95", hat: "tophat", prop: "case", height: 1.0, voice: 0.98, greet: "Keep it in tempo!" },
  { id: 23, name: "Nils Marsh", role: "Birdwatcher", pref: "calm", body: "#606c38", accent: "#dda15e", skin: "#f1c9a4", hat: "sunhat", prop: "camera", height: 0.99, voice: 0.94, greet: "Quietly... the gulls are nesting." },
];

export const PREF_INFO: Record<Preference, { label: string; hint: string }> = {
  thrill: { label: "Thrill-seeker", hint: "Slides & airtime tip x1.6" },
  fragile: { label: "Fragile cargo", hint: "Bumps cost tips; clean ride +25%" },
  tourist: { label: "Tourist", hint: "Pass landmarks for bonus" },
  rush: { label: "Running late", hint: "Blazing pays x1.4" },
  musician: { label: "Musician", hint: "3x Pulse or higher: tips x1.5" },
  calm: { label: "Calm rider", hint: "Smooth ride bonus; stunts tip less" },
  shortcut: { label: "Shortcut nerd", hint: "Shortcuts tip x2" },
  nightowl: { label: "Edge rider", hint: "Close shaves & rush lanes x1.6" },
  chatty: { label: "Chatterbox", hint: "Friendly flat tip" },
};

export const BARKS: Record<Preference, Record<BarkCat, string[]>> = {
  thrill: {
    pickup: ["Let's get weird with physics!", "Floor it, I signed the waiver!"],
    stunt: ["WHEEE!", "Again! Again!", "That's the stuff!"],
    collision: ["Ha! Love the crunch!", "Bumper cars!"],
    urgency: ["Faster is funner!", "Don't slow down now!"],
    arrival: ["Best ride ever!", "My hair is a hurricane!"],
    fail: ["Boring finish, pal."],
    praise: ["You're a legend!"],
  },
  fragile: {
    pickup: ["Smooth, please. Very smooth.", "It's precious cargo."],
    stunt: ["Oh no no no...", "Please land softly!"],
    collision: ["The frosting!", "Careful!!"],
    urgency: ["Fast, but gentle!", "Time's slipping!"],
    arrival: ["Not a crumb out of place!", "Delivered intact. Bless you."],
    fail: ["It's ruined, and late."],
    praise: ["So smooth!"],
  },
  tourist: {
    pickup: ["Take the scenic route!", "Ooh, a real storm cab!"],
    stunt: ["Did you see that view?!", "Photo op!"],
    collision: ["Was that on the tour?", "Ow, my camera!"],
    urgency: ["We'll miss the sunset!", "Hurry, the tour leaves soon!"],
    arrival: ["Five stars, would ride again!", "What a city!"],
    fail: ["We missed it all..."],
    praise: ["Look at that landmark!"],
  },
  rush: {
    pickup: ["Go go go!", "No time, just drive!"],
    stunt: ["Fine, whatever's fastest!", "Efficient!"],
    collision: ["Don't stop!", "Keep moving!"],
    urgency: ["I'm SO late!", "Clock's ticking!"],
    arrival: ["Made it! Barely!", "Right on time!"],
    fail: ["I'm fired. Thanks."],
    praise: ["Now THAT's speed!"],
  },
  musician: {
    pickup: ["Let's find the rhythm.", "Every ride's a solo."],
    stunt: ["Nice syncopation!", "That's a riff!"],
    collision: ["Off-beat, friend.", "Ouch, wrong note."],
    urgency: ["Tempo, tempo!", "Pick up the pace!"],
    arrival: ["Encore!", "Smooth groove!"],
    fail: ["Missed my cue..."],
    praise: ["Keep that chain swinging!"],
  },
  calm: {
    pickup: ["Nice and easy.", "No rush, no fuss."],
    stunt: ["Goodness!", "Was that strictly necessary?"],
    collision: ["Steady now.", "Oof. Breathe."],
    urgency: ["A little quicker, perhaps.", "We're cutting it fine."],
    arrival: ["Lovely and peaceful.", "Perfectly pleasant."],
    fail: ["Oh dear. Too late."],
    praise: ["Like a gentle tide."],
  },
  shortcut: {
    pickup: ["Bet there's a cut through here.", "Use the secret routes!"],
    stunt: ["Ooh, efficient!", "Ha, clever!"],
    collision: ["Map didn't show that wall.", "Recalculating!"],
    urgency: ["Take the shortcut!", "There's a quicker way!"],
    arrival: ["Textbook routing!", "My map approves."],
    fail: ["You missed every cut."],
    praise: ["A shortcut! You beauty!"],
  },
  nightowl: {
    pickup: ["Make it close!", "Ride the edge!"],
    stunt: ["So close!", "Ice cold!"],
    collision: ["Tch. Sloppy.", "Close... too close."],
    urgency: ["Push it!", "Don't brake now!"],
    arrival: ["Ice in your veins!", "Clean."],
    fail: ["Lost your nerve, huh."],
    praise: ["Razor-thin!"],
  },
  chatty: {
    pickup: ["So anyway, where was I?", "You'll never guess what happened!"],
    stunt: ["Wait till the column hears!", "Scandalous!"],
    collision: ["That'll be in the paper!", "Ooh, drama!"],
    urgency: ["Faster, I've got gossip to drop!", "Deadline, darling!"],
    arrival: ["Toodles!", "Great chat!"],
    fail: ["That's going in the column."],
    praise: ["You're my new favourite driver!"],
  },
};
