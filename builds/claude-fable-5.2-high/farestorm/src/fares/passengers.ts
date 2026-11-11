// The 24 passenger archetypes of Galeport. All names and lines are original.
export type Preference = 'thrill' | 'fragile' | 'tourist' | 'rusher' | 'musician';

export interface Archetype {
  id: number;
  name: string;
  role: string;
  pref: Preference;
  body: string; // css/hex colours used by both the 3D figure and the HUD portrait
  accent: string;
  skin: string;
  hat: 'none' | 'cap' | 'brim' | 'beanie' | 'helmet' | 'bun';
  greet: string;
  voice: number; // pitch multiplier for the bark blip
}

const A = (
  name: string, role: string, pref: Preference, body: string, accent: string, skin: string, hat: Archetype['hat'], greet: string, voice: number,
): Omit<Archetype, 'id'> => ({ name, role, pref, body, accent, skin, hat, greet, voice });

export const ARCHETYPES: Archetype[] = [
  A('Odalys Venn', 'Stunt pilot on shore leave', 'thrill', '#ff5a4e', '#ffd23f', '#c98a5e', 'helmet', 'Make it loud. I get bored on the ground.', 1.2),
  A('Brix Halloran', 'Skate courier', 'thrill', '#7c4dff', '#2ee6c8', '#f0c8a0', 'beanie', 'Sideways is a direction, right?', 1.35),
  A('Nana Quill', 'Retired rally navigator', 'thrill', '#2ee6c8', '#ff8a5c', '#e8b48a', 'brim', 'Flat out, dear. I will call the corners.', 0.9),
  A('Jett Marlowe', 'Kite surfer', 'thrill', '#ffb400', '#1e90ff', '#b9784c', 'cap', 'If the wheels leave the road, tip doubles.', 1.1),
  A('Pim Okafor', 'Roller derby jammer', 'thrill', '#ff3d9a', '#fff3d6', '#8a5a3a', 'helmet', 'Thread the gaps. I will hold on.', 1.25),
  A('Sister Ilse', 'Glass-organ courier', 'fragile', '#e9e4d8', '#6ec6ff', '#f2d0b0', 'bun', 'Gently, please. This box sings if you bump it.', 1.0),
  A('Tobias Reyl', 'Wedding cake baker', 'fragile', '#fff3d6', '#ff8fb1', '#d9a074', 'cap', 'Four tiers. Zero collisions. Understood?', 0.85),
  A('Dr. Maren Sol', 'Aquarium vet', 'fragile', '#3dbf9a', '#fff3d6', '#a8744c', 'none', 'There is a seahorse in this bag. Smooth roads only.', 1.05),
  A('Old Fenwick', 'Clock restorer', 'fragile', '#8d6e4a', '#ffd23f', '#f0c8a0', 'brim', 'Two hundred springs in here. Mind the kerbs.', 0.75),
  A('Lumi Park', 'Lantern maker', 'fragile', '#ff8a5c', '#ffe9a8', '#f4d4b4', 'bun', 'Paper lanterns. They crumple if you sneeze.', 1.3),
  A('Greta & Camera', 'Travel blogger', 'tourist', '#1e90ff', '#ffd23f', '#f0c8a0', 'brim', 'Take the pretty way. My followers want landmarks.', 1.15),
  A('Mr. Abernathy', 'Cruise passenger', 'tourist', '#ffcf6e', '#ff5a4e', '#e8b48a', 'cap', 'I have six hours ashore. Show me everything.', 0.8),
  A('Ines Duarte', 'Sketchbook student', 'tourist', '#9be564', '#7c4dff', '#b9784c', 'beanie', 'Drive past something I can draw.', 1.2),
  A('The Kowalczyks', 'Honeymooners', 'tourist', '#ff8fb1', '#2ee6c8', '#f2d0b0', 'none', 'We heard the lighthouse is lovely!', 1.1),
  A('Captain Roux', 'Ferry skipper off duty', 'tourist', '#27496d', '#fff3d6', '#c98a5e', 'cap', 'Never seen my own town from the back seat.', 0.7),
  A('Dana Whitlock', 'Late line cook', 'rusher', '#f4f4f4', '#ff5a4e', '#d9a074', 'cap', 'Shift started four minutes ago. Go go go.', 1.1),
  A('Councillor Preet', 'Running for a vote', 'rusher', '#27496d', '#ffd23f', '#a8744c', 'none', 'The vote closes on the hour. Do not spare the horses.', 0.9),
  A('Milo Tran', 'Exam candidate', 'rusher', '#6ec6ff', '#ff8a5c', '#f4d4b4', 'none', 'My final started. Fast is all I care about.', 1.3),
  A('Nurse Abiola', 'On-call medic', 'rusher', '#2ee6c8', '#fff3d6', '#8a5a3a', 'bun', 'Clinic is paging me. Quickest way you know.', 1.0),
  A('Rafe Castellan', 'Stage manager', 'rusher', '#2b2b3a', '#ff3d9a', '#e8b48a', 'beanie', 'Curtain in ten. I do not do late.', 0.95),
  A('Zuzu Bell', 'Brass band leader', 'musician', '#ffd23f', '#ff5a4e', '#b9784c', 'brim', 'Keep a rhythm going and I will keep paying.', 1.15),
  A('DJ Kelp', 'Boardwalk selector', 'musician', '#7c4dff', '#9be564', '#f0c8a0', 'cap', 'Chain it up. I tip on the beat.', 1.25),
  A('Marguerite', 'Surf guitarist', 'musician', '#ff8a5c', '#1e90ff', '#f2d0b0', 'none', 'Give me a long riff of tricks, driver.', 1.05),
  A('Otto Drumm', 'Street percussionist', 'musician', '#3dbf9a', '#ffd23f', '#c98a5e', 'beanie', 'Do not break the groove. Combos, combos!', 0.85),
].map((a, id) => ({ ...a, id }));

export const PREF_INFO: Record<Preference, { label: string; hint: string }> = {
  thrill: { label: 'Thrill-seeker', hint: 'Bigger tips for drifts, jumps and near misses' },
  fragile: { label: 'Fragile cargo', hint: 'Bonus for a collision-free ride' },
  tourist: { label: 'Sightseer', hint: 'Tips for passing landmarks' },
  rusher: { label: 'In a hurry', hint: 'Bigger time bonus for fast arrivals' },
  musician: { label: 'Rhythm rider', hint: 'Tips grow with your Pulse chain' },
};

export type BarkKind = 'stunt' | 'collision' | 'urgent' | 'arrive' | 'late' | 'fail' | 'sight';
export const BARKS: Record<Preference, Record<BarkKind, string[]>> = {
  thrill: {
    stunt: ['YES! Again!', 'Now that is driving!', 'My stomach is still back there!'],
    collision: ['Ha! Rubbing is racing.', 'Bit crunchy, that one.'],
    urgent: ['Come on, floor it!', 'We are losing the buzz!'],
    arrive: ['Best ride in Galeport!', 'Ten out of ten. Would scream again.'],
    late: ['Fun, but slow.', 'Late, but I enjoyed the scenery.'],
    fail: ['I will walk. Faster.', 'I am out. Call me when you find the throttle.'],
    sight: ['Blurry, but pretty!'],
  },
  fragile: {
    stunt: ['Was that strictly necessary?', 'Oh my. Careful now.'],
    collision: ['The cargo! Mind the cargo!', 'Something just rattled. Something expensive.'],
    urgent: ['Smooth, but not this smooth, please.', 'We do still need to arrive today.'],
    arrive: ['Not a scratch. Thank you.', 'Everything intact. You are a marvel.'],
    late: ['Late, but in one piece.', 'Slow and steady. Mostly slow.'],
    fail: ['I will carry it myself.', 'That is quite enough of that.'],
    sight: ['Lovely, lovely.'],
  },
  tourist: {
    stunt: ['Is this included in the tour?', 'Wheee! Do the locals drive like this?'],
    collision: ['Is that normal here?', 'I should have bought the insurance.'],
    urgent: ['My ferry leaves soon!', 'We are cutting it close, no?'],
    arrive: ['What a town! Five stars.', 'I got so many pictures!'],
    late: ['We saw a lot, at least.', 'A long tour, that.'],
    fail: ['I will find a tram.', 'I think I will explore on foot.'],
    sight: ['Ooh, look at that!', 'Slow down, I want a photo! No, do not.', 'It is in every guidebook!'],
  },
  rusher: {
    stunt: ['Less flair, more speed!', 'Fine, as long as it is faster.'],
    collision: ['No time for that!', 'We do not have minutes to waste!'],
    urgent: ['Faster! FASTER!', 'The clock, driver, the clock!'],
    arrive: ['Made it. You are a lifesaver.', 'With seconds to spare. Keep the change.'],
    late: ['Too late. Barely worth it.', 'I am going to hear about this.'],
    fail: ['Forget it, I will run!', 'Stop the car. I am sprinting.'],
    sight: ['Not now!'],
  },
  musician: {
    stunt: ['That is the hook!', 'Keep the tempo up!', 'Oh, that had swing.'],
    collision: ['Off-beat!', 'You dropped the rhythm.'],
    urgent: ['Pick up the tempo!', 'This verse is dragging.'],
    arrive: ['Encore, driver, encore!', 'What a set. Take a bow.'],
    late: ['Slow song, that one.', 'A ballad. I wanted a banger.'],
    fail: ['I am cancelling this gig.', 'The show cannot wait for you.'],
    sight: ['Nice backdrop.'],
  },
};
