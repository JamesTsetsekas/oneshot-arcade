export type QuestStatus = "inactive" | "active" | "done";
export interface QuestState { status: QuestStatus; step: number }

export interface QuestDef {
  id: string;
  name: string;
  optional?: boolean;
  steps: string[];
  reward: { xp: number; gold: number; skillPoint?: boolean; text: string };
  giver: string;
}

export const QUESTS: QuestDef[] = [
  {
    id: "ashway", name: "The Ashway", giver: "Marshal Ivra",
    steps: ["Speak with Marshal Ivra in Ember Refuge", "Find and kindle the Ashway waypoint in the Soot March"],
    reward: { xp: 120, gold: 60, text: "60 gold, waypoint travel" },
  },
  {
    id: "open_archive", name: "The Toll Unpaid", giver: "Marshal Ivra",
    steps: ["Find the Toll-Keeper's gate in the Soot March", "Defeat the Toll-Keeper", "Enter the Hollow Archive"],
    reward: { xp: 400, gold: 150, skillPoint: true, text: "150 gold, +1 skill point" },
  },
  {
    id: "artificer", name: "The Caged Artificer", giver: "Marshal Ivra",
    steps: ["Search the Archive's first floor for the Artificer", "Free Calder from the cage", "Return to Ember Refuge"],
    reward: { xp: 300, gold: 100, skillPoint: true, text: "+1 skill point, Artificer services" },
  },
  {
    id: "engine", name: "The Buried Star", giver: "Marshal Ivra",
    steps: ["Descend to the Archive's third floor", "Silence the Orison Engine"],
    reward: { xp: 900, gold: 400, text: "400 gold, Veteran difficulty, Target Hunt" },
  },
  {
    id: "hunter", name: "Smoke at the Hunter's Camp", giver: "Hunter Sela", optional: true,
    steps: ["Find the hunter camp in the Soot March", "Defend Sela from the mire pack", "Speak with Sela"],
    reward: { xp: 200, gold: 0, text: "+1 permanent potion capacity" },
  },
];
export const QUEST_BY_ID: Record<string, QuestDef> = Object.fromEntries(QUESTS.map((q) => [q.id, q]));

export function initialQuests(): Record<string, QuestState> {
  const o: Record<string, QuestState> = {};
  for (const q of QUESTS) o[q.id] = { status: q.id === "ashway" ? "active" : "inactive", step: 0 };
  return o;
}

export function questStepText(id: string, st: QuestState): string {
  const q = QUEST_BY_ID[id];
  if (st.status === "done") return "Complete";
  return q.steps[Math.min(st.step, q.steps.length - 1)];
}
