// Original, subtitle-ready pedestrian barks for Port Meridian. Short pairs with optional context tags.
export interface BarkPair { a: string; b: string; tag?: string }
export const BARK_PAIRS: BarkPair[] = [
  { a: 'Tram was nine minutes late. Nine.', b: 'That is early, for the viaduct line.' },
  { a: 'They are automating the cranes next, you know.', b: 'The cranes already ignore me. Nothing changes.', tag: 'breakwater' },
  { a: 'Is the saltline stall open today?', b: 'Open, sold out, and smug about it.', tag: 'tide' },
  { a: 'You can see three districts from the Lantern.', b: 'And all three can see you panting up the hill.', tag: 'lantern' },
  { a: 'My lease says "harbor glimpse".', b: 'If you lean out far enough, everything is a glimpse.', tag: 'glassline' },
  { a: 'Flood sirens tested fine this morning.', b: 'Great. My ears are still ringing in agreement.' },
  { a: 'The port contract goes to a company nobody has met.', b: 'Efficient. No one to complain to.', tag: 'foundry' },
  { a: 'Did you feed the canal ducks again?', b: 'They have a union now. I pay dues.', tag: 'canal' },
  { a: 'Rain like this, the tiles shine up nicely.', b: 'So do my socks, from the inside.', tag: 'rain' },
  { a: 'Glassline looks better at night.', b: 'Everything expensive does.', tag: 'night' },
  { a: 'Courier nearly took my elbow off yesterday.', b: 'On time, though, I bet.' },
  { a: 'They repainted the flood barrier teal.', b: 'Oxidised copper green. There was a committee.' },
  { a: 'Coffee at the depot is one coin cheaper.', b: 'It also tastes one coin cheaper.' },
  { a: 'Heard the foundry whistle at noon?', b: 'It is the only thing in this city that is punctual.', tag: 'foundry' },
  { a: 'Market is crowded today.', b: 'It is a market. That is the entire idea.', tag: 'tide' },
  { a: 'I walk the seawall every evening.', b: 'I watch people walk the seawall. Same exercise.', tag: 'breakwater' },
  { a: 'New signal timing on Meridian Boulevard.', b: 'I counted. We lost four seconds of green.', tag: 'glassline' },
  { a: 'You taking the stairs up Ledger Street?', b: 'The stairs are taking me, more like.', tag: 'lantern' },
  { a: 'Somebody parked across the loading bay again.', b: 'Bold. The van drivers hold grudges.' },
  { a: 'Warm for the season.', b: 'Enjoy it. The evening forecast is all umbrellas.', tag: 'day' },
];
export const REACT_LINES = {
  weapon: ['Whoa, easy. Put that away!', 'Is that real? I am leaving.', 'No trouble, no trouble!'],
  dodge: ['Watch it!', 'This is a footpath!', 'Are you blind?'],
  carjacked: ['Hey! That is my car!', 'Take it, just do not hurt me!', 'I am calling this in!'],
  talkedDown: ['Fine. I saw nothing. Just go.', 'Okay, okay. Hanging up.'],
  refuse: ['Back off! Yes, hello, emergency line?', 'Do not touch me. They are already on the way.'],
};
/** Fictional station idents shown as radio text (no voiced audio is bundled). */
export const RADIO_IDENTS = {
  tideline: ['Tideline 98.2: harbor beat for the long way round.', 'You are adrift on Tideline. Stay out of the bus lane.', 'Tideline 98.2. Cargo in, bass out.'],
  lantern: ['Lantern Indie 104: small songs from a tall hill.', 'Lantern Indie. Recorded in a stairwell, on purpose.', 'This is Lantern 104. The view is free.'],
};
