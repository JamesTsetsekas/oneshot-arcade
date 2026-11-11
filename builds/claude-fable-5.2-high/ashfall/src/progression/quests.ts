import type { Hero } from '../entity-combat/types';

export interface QuestStage { trigger: string; title: string; text: string; xp: number; gold: number; sp?: number }
/** Linear act questline. Stage i completes when its trigger fires; later triggers also complete skipped stages. */
export const QUEST: QuestStage[] = [
  { trigger: 'talk:elder', title: 'Ash on the Road', text: 'Speak with Elder Maren in Ember Refuge.', xp: 20, gold: 0 },
  { trigger: 'enter:march', title: 'Ash on the Road', text: 'Take the north gate into the Soot March.', xp: 20, gold: 0 },
  { trigger: 'waypoint:march', title: 'The Ashway', text: 'Find and wake the Ashway waypoint shrine in the Soot March.', xp: 120, gold: 40, sp: 1 },
  { trigger: 'kill:tollkeeper', title: 'The Toll-Keeper', text: 'Reach the ruined tollhouse and defeat the Toll-Keeper.', xp: 400, gold: 120, sp: 1 },
  { trigger: 'cage', title: 'The Caged Artificer', text: 'Open the cage at the tollhouse and free the Artificer.', xp: 80, gold: 0 },
  { trigger: 'talk:artificer', title: 'The Caged Artificer', text: 'Return to Ember Refuge (waypoint, or T to town-gate) and speak with Artificer Ilse.', xp: 150, gold: 60, sp: 1 },
  { trigger: 'enter:archive1', title: 'Open the Archive', text: 'Carry the Archive Seal to the crypt door beyond the tollhouse.', xp: 100, gold: 0 },
  { trigger: 'enter:archive3', title: 'The Hollow Archive', text: 'Descend through the Hollow Archive to the Engine vault on the third floor.', xp: 400, gold: 100, sp: 1 },
  { trigger: 'kill:engine', title: 'Silence the Engine', text: 'Destroy the Orison Engine.', xp: 900, gold: 300, sp: 1 },
];
export const QUEST_DONE = QUEST.length;
export function questText(hero: Hero): { title: string; text: string } {
  if (hero.quest >= QUEST_DONE) return { title: 'Act Complete', text: hero.difficulty === 0 ? 'The Engine is silent. Speak with Elder Maren to begin a Veteran expedition, or use the Hunt portal.' : 'Veteran expedition complete. Hunt the bosses again for stronger relics.' };
  return QUEST[hero.quest];
}
/** Returns the completed stages (for rewards) when `key` advances the quest; empty otherwise. */
export function questTrigger(hero: Hero, key: string): QuestStage[] {
  const idx = QUEST.findIndex((q, i) => i >= hero.quest && q.trigger === key);
  if (idx < 0) return [];
  let to = idx + 1;
  // On repeat expeditions the Artificer is already free: skip her rescue stages.
  if (key === 'kill:tollkeeper' && hero.flags.artificer) to = 6;
  const done = QUEST.slice(hero.quest, to);
  hero.quest = to;
  return done;
}
