import type { Tier } from './rules';

export interface TaxiSpec {
  id: 'gull' | 'breaker' | 'tempest';
  name: string;
  blurb: string;
  mass: number;
  topSpeed: number; // m/s
  accel0: number; // m/s^2 at standstill
  brake: number;
  steerMax: number; // rad
  latGrip: number; // max lateral accel m/s^2
  gripBase: number; // lateral velocity damping /s
  gripDrift: number;
  driftYaw: number; // rad/s authority while drifting
  yawResponse: number;
  shove: number; // traffic shove multiplier
  length: number;
  width: number;
  wheelBase: number;
}

export const TAXIS: Record<TaxiSpec['id'], TaxiSpec> = {
  gull: {
    id: 'gull', name: 'Gull Compact', blurb: 'Agile and eager to slide. Light on its feet, light in a collision.',
    mass: 1050, topSpeed: 44.0, accel0: 7.2, brake: 24, steerMax: 0.62, latGrip: 23, gripBase: 9.5, gripDrift: 2.5, driftYaw: 1.55, yawResponse: 11,
    shove: 0.7, length: 3.9, width: 1.8, wheelBase: 2.4,
  },
  breaker: {
    id: 'breaker', name: 'Breaker Sedan', blurb: 'The balanced all-rounder. Predictable, quick, forgiving.',
    mass: 1350, topSpeed: 47.2, accel0: 6.3, brake: 23, steerMax: 0.55, latGrip: 22, gripBase: 9, gripDrift: 2.3, driftYaw: 1.35, yawResponse: 9.5,
    shove: 1, length: 4.4, width: 1.9, wheelBase: 2.7,
  },
  tempest: {
    id: 'tempest', name: 'Tempest Wagon', blurb: 'Heavy and planted. Shoves traffic aside, turns like a ship.',
    mass: 1850, topSpeed: 49.6, accel0: 5.5, brake: 21, steerMax: 0.48, latGrip: 21, gripBase: 8.2, gripDrift: 2.0, driftYaw: 1.12, yawResponse: 8,
    shove: 1.6, length: 4.9, width: 2.0, wheelBase: 3.0,
  },
};
export const TAXI_ORDER: TaxiSpec['id'][] = ['gull', 'breaker', 'tempest'];

export const TAXI_COLORS = [
  { name: 'Coral Surf', body: 0xff5e57, trim: 0xfff1e0 },
  { name: 'Lagoon Teal', body: 0x19b3a6, trim: 0xfff1e0 },
  { name: 'Cobalt Tide', body: 0x2f6bff, trim: 0xe8f0ff },
  { name: 'Mint Gelato', body: 0x7be0b0, trim: 0x1d3b3a },
  { name: 'Orchid Pulse', body: 0xa855f7, trim: 0xf6e8ff },
  { name: 'Sunset Orange', body: 0xff8a2b, trim: 0x2a1530 },
];

export type Preference = 'thrill' | 'fragile' | 'tourist' | 'late' | 'musician' | 'chill' | 'foodie' | 'racer';

export interface Archetype {
  id: number;
  name: string;
  pref: Preference;
  skin: number;
  shirt: number;
  hair: number;
  barks: { pickup: string; stunt: string; hit: string; arrive: string; urgent: string; fail: string };
}

const A = (
  name: string, pref: Preference, shirt: number, hair: number, skin: number,
  pickup: string, stunt: string, hit: string, arrive: string, urgent: string, fail: string,
): Omit<Archetype, 'id'> => ({ name, pref, skin, shirt, hair, barks: { pickup, stunt, hit, arrive, urgent, fail } });

const RAW: Omit<Archetype, 'id'>[] = [
  A('Juno the Thrill-Seeker', 'thrill', 0xff3d81, 0x2b1b4a, 0xe8b48f, "Make it loud!", "Again! Again!", "Okay, that one tickled.", "Best ride this week.", "Faster, faster!", "I wanted a wild one..."),
  A('Pip the Courier', 'fragile', 0x35c3ff, 0x5a3a22, 0xc98b61, "Careful - glass inside.", "Eyes on the road, please!", "My cargo!", "Parcel intact. Bless you.", "Customers are waiting.", "Package is late. So am I."),
  A('Marisol the Tourist', 'tourist', 0xffd34d, 0x1a1a1a, 0xf2c9a0, "Show me the sights!", "Is this part of the tour?", "Charming... I think.", "Postcard-perfect.", "The ferry leaves soon!", "I missed the view."),
  A('Dev the Night-Shifter', 'late', 0x6ee7a1, 0x101010, 0x8d5a3b, "Clock's ticking. Go.", "Nice, but keep moving.", "No time for dents.", "Clocked in. Thanks.", "Boss will notice!", "Overtime again."),
  A('Ottoline the Cellist', 'musician', 0xc084fc, 0xb45f06, 0xf0c8a5, "Tempo allegro, please.", "Bravo, maestro!", "Off the beat...", "Standing ovation.", "Curtain in minutes!", "I missed my entrance."),
  A('Basil the Gardener', 'chill', 0x4ade80, 0xcfcfcf, 0xd2a07a, "No rush, friend.", "Whoa, easy there.", "My tomatoes!", "Peaceful enough.", "Ah - a little faster maybe?", "Well, that is that."),
  A('Noodle Nell', 'foodie', 0xfb923c, 0x3f2a1d, 0xe6b58f, "Soup waits for no one.", "Don't spill the broth!", "There goes lunch.", "Delicious timing.", "Getting cold!", "Cold noodles. Tragic."),
  A('Rook the Racer', 'racer', 0xef4444, 0x111111, 0xb87a56, "Show me what you've got.", "Sloppy line. Do better.", "Amateur.", "Not bad. Not bad.", "Floor it!", "Pathetic."),
  A('Wren the Student', 'late', 0x60a5fa, 0xe9c46a, 0xf3d1b0, "Exam in ten!", "Ha! Nice one.", "Ow, my backpack.", "Made it! Thanks!", "Hurry hurry hurry!", "I am so failed."),
  A('Captain Ferro', 'thrill', 0x22d3ee, 0xe5e7eb, 0xcf9a74, "Take her out to sea!", "Hard to starboard!", "Hull breach!", "Dry land at last.", "Full steam!", "Mutiny of the clock."),
  A('Lotte the Florist', 'fragile', 0xf472b6, 0x7c4a2d, 0xf5d3b6, "Roses hate bumps.", "Petals everywhere!", "Mind the bouquet!", "Fresh as ever.", "They'll wilt!", "Wilted. Sigh."),
  A('Hiro the Chef', 'foodie', 0xf8fafc, 0x111827, 0xe7be98, "Mise en place - go!", "Flambe-level driving.", "Burnt the sauce.", "Sublime.", "Service starts now!", "Table seven walked."),
  A('Zadie the DJ', 'musician', 0xa78bfa, 0xff7ab8, 0x8a5a44, "Drop me at the decks!", "That's a drop!", "Skipped a beat.", "Crowd's going wild.", "Set time!", "Dead air. Ugh."),
  A('Ambrose the Banker', 'late', 0x94a3b8, 0x3a3a3a, 0xe0b090, "Markets open soon.", "Is this... safe?", "Insurance, please.", "Adequate. Receipt?", "Time is money!", "Lost a fortune."),
  A('Saffi the Surfer', 'thrill', 0x2dd4bf, 0xf5d97a, 0xd8a06f, "Catch the swell, driver!", "Totally gnarly!", "Wipeout!", "Stoked!", "Waves won't wait!", "Flat day. Bummer."),
  A('Gus the Retiree', 'chill', 0xcbd5e1, 0xffffff, 0xe3b99a, "Take your time.", "Goodness gracious!", "My hip!", "Lovely stroll... I mean ride.", "Bingo starts!", "Oh well, next week."),
  A('Imogen the Critic', 'tourist', 0xfda4af, 0x6b3a1e, 0xf1cfb0, "Impress me.", "Theatrical. I like it.", "Rude.", "Four stars.", "Premiere is soon!", "One star."),
  A('Tobias the Plumber', 'fragile', 0x38bdf8, 0x7c5a3a, 0xcd9770, "Tools in the back, gentle!", "Watch the wrenches!", "Clang!", "Pipe dreams delivered.", "Leak's getting worse!", "Flooded. Great."),
  A('Yuna the Pilot', 'racer', 0x3b82f6, 0x0f172a, 0xe9c3a1, "Cleared for takeoff?", "Smooth banking.", "Turbulence!", "Smooth landing.", "Gate closing!", "Missed my flight."),
  A('Kofi the Busker', 'musician', 0xfbbf24, 0x1f2937, 0x7b4b32, "Gotta catch the crowd!", "What a rhythm!", "Out of tune!", "Hat's full. Thanks!", "Rush hour crowd!", "No tips today."),
  A('Delphine the Baker', 'foodie', 0xfcd34d, 0x8b5e34, 0xf4d6bb, "Bread's rising!", "Mind my loaves!", "Flat bread!", "Golden crust.", "Oven timer!", "Burnt batch."),
  A('Mx. Quill the Poet', 'tourist', 0x818cf8, 0x5b2a86, 0xe0b48e, "Inspire me, driver.", "A verse! A verse!", "Ouch, my muse.", "An ode to you.", "Deadline looms!", "Blank page."),
  A('Bram the Mover', 'chill', 0x84cc16, 0x6b4423, 0xc48a62, "Heavy load, steady hands.", "Easy, easy!", "Crash! Great.", "Delivered. Phew.", "Truck's waiting!", "Overbooked day."),
  A('Pixel the Streamer', 'racer', 0xe879f9, 0x00e5ff, 0xe8c4a4, "Chat, watch this driver!", "CLIP IT!", "Lag spike!", "Five-star stream.", "Going live!", "Stream's dead."),
];
export const ARCHETYPES: Archetype[] = RAW.map((a, id) => ({ ...a, id }));

export const TIER_INFO: Record<Tier, { label: string; color: number; css: string; shape: string }> = {
  short: { label: 'SHORT', color: 0x2ee6a0, css: '#2ee6a0', shape: 'circle' },
  medium: { label: 'MEDIUM', color: 0xffb02e, css: '#ffb02e', shape: 'diamond' },
  long: { label: 'LONG', color: 0xff3df2, css: '#ff3df2', shape: 'star' },
};

export type DistrictId = 'harbor' | 'steps' | 'beach' | 'civic' | 'lantern';
export const DISTRICT_NAMES: Record<DistrictId, string> = {
  harbor: 'Harbor Loop', steps: 'Old Steps', beach: 'Sunward Beach', civic: 'Civic Crown', lantern: 'Lantern Ward',
};

export const DESTINATION_NAMES: Record<DistrictId, string[]> = {
  lantern: ['Moonlit Arcade', 'Paper Crane Hall', 'Canal Eight Bridge', 'Ember Noodle Hall', 'Glowfern Conservatory', 'Night Orchid Theatre', 'Kite Market'],
  steps: ["Cobbler's Stair", 'Saltbread Bakery', 'Old Gull Clocktower', 'Terrace Tea House', 'Whistlewell Square'],
  civic: ['Crown Museum', 'Sunward Stadium', 'Spiral Garage', 'Fountain of Eleven', "Mayor's Atrium", 'Glasswing Library', 'Brass Band Pavilion', 'Orrery Observatory', 'Harborview Court'],
  beach: ['Coral Cabana Hotel', 'Driftwood Pier', 'Sandpiper Resort', 'Starfish Boardwalk'],
  harbor: ['Ferry Hold 4', 'Lighthouse Quay', 'Anchor Cranes', 'Net & Lantern Cannery', 'Tidewater Terminal', 'Blue Crate Warehouse', 'Salt Dock Market'],
};

export const SHORTCUT_NAMES = [
  'Brinecat Alley', 'Teacup Cut', 'Wickerlane', 'The Gullet', 'Cobbler Squeeze', 'Maintenance Whisker', 'Lampwick Passage',
  'Dune Skim', 'Terrace Slide', 'Garage Cut', 'Tram Shed Lane', 'Drain Run', 'Plank Deck Dash', 'Ferry Hold Hop', 'Sundial Diagonal',
  'Kelp Gap', 'Fennel Row', 'Crown Corner', 'Pelican Pass', 'Hushed Lane', 'Rivet Run', 'Tidy Tunnel', 'Mosaic Mile', 'Spindle Way', 'Orange Peel Lane', 'Gantry Hop', 'Salt Cellar', 'Bellows Alley', 'Quillfeather Cut', 'Marlin Mews', 'Cinder Steps', 'Honeycomb Run',
];
