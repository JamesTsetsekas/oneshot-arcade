export interface QuestDef {
  id: string;
  name: string;
  summary: string;
  objective: string;
  optional?: boolean;
  hidden?: boolean;
  xp: number;
  gold: number;
}

export const QUESTS: QuestDef[] = [
  { id: 'ashway', name: 'Light the Ashway', summary: 'Marshal Vell needs the star-metal shrine in the Soot March lit so the Refuge can reach it.', objective: 'Activate the Ashway Shrine in the Soot March.', xp: 60, gold: 40 },
  { id: 'toll', name: 'Break the Toll', summary: 'A bell-wrought gatekeeper chains the Hollow Archive shut.', objective: 'Defeat the Toll-Keeper at the Archive Gate.', xp: 140, gold: 120 },
  { id: 'artificer', name: 'The Trapped Artificer', summary: 'A craftsperson was sealed in a cage in the Archive Lower Stacks.', objective: 'Rescue the Artificer in the Hollow Archive (Lower Stacks).', xp: 120, gold: 80 },
  { id: 'engine', name: 'Silence the Orison Engine', summary: 'The buried star feeds a machine-organism at the heart of the Archive.', objective: 'Defeat the Orison Engine.', xp: 300, gold: 300 },
  { id: 'hunter', name: "Hunter's Cache", summary: 'A hunter camp hides a cache - and an ambush.', objective: "Survive the ambush at the hunter camp (optional).", optional: true, xp: 90, gold: 60 },
];
