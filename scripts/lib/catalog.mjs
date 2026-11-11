// Shared catalog loader: games × models × builds.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const STATUSES = ["complete", "partial", "failed", "running", "queued"];
export const PURITY = ["one-shot", "iterated"];

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

export function loadCatalog() {
  const { games } = readJson(path.join(root, "catalog", "games.json"));
  const { models } = readJson(path.join(root, "catalog", "models.json"));
  const builds = [];
  const problems = [];
  const buildsDir = path.join(root, "builds");
  for (const model of models) {
    const modelDir = path.join(buildsDir, model.id);
    if (!fs.existsSync(modelDir)) continue;
    for (const entry of fs.readdirSync(modelDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith("_")) continue;
      const dir = path.join(modelDir, entry.name);
      const metaFile = path.join(dir, "oneshot.json");
      if (!fs.existsSync(metaFile)) {
        problems.push(`builds/${model.id}/${entry.name}: missing oneshot.json`);
        continue;
      }
      let meta;
      try {
        meta = readJson(metaFile);
      } catch (error) {
        problems.push(`builds/${model.id}/${entry.name}/oneshot.json: ${error.message}`);
        continue;
      }
      const rel = `builds/${model.id}/${entry.name}`;
      if (meta.game !== entry.name) problems.push(`${rel}: oneshot.json game "${meta.game}" must equal folder name`);
      if (meta.model !== model.id) problems.push(`${rel}: oneshot.json model "${meta.model}" must equal "${model.id}"`);
      if (!games.some((g) => g.id === entry.name)) problems.push(`${rel}: unknown game id (add it to catalog/games.json)`);
      if (!STATUSES.includes(meta.status)) problems.push(`${rel}: status must be one of ${STATUSES.join(", ")}`);
      if (meta.purity && !PURITY.includes(meta.purity)) problems.push(`${rel}: purity must be one of ${PURITY.join(", ")}`);
      if (meta.screenshot && !fs.existsSync(path.join(dir, meta.screenshot)))
        problems.push(`${rel}: screenshot ${meta.screenshot} not found`);
      const hasPackage = fs.existsSync(path.join(dir, "package.json"));
      const build = {
        command: meta.build?.command ?? (hasPackage ? "npm run build" : null),
        output: meta.build?.output ?? (hasPackage ? "dist" : "."),
      };
      builds.push({ ...meta, build, dir, rel, hasPackage, hasLockfile: fs.existsSync(path.join(dir, "package-lock.json")) });
    }
  }
  for (const dir of fs.existsSync(buildsDir) ? fs.readdirSync(buildsDir) : [])
    if (!models.some((m) => m.id === dir)) problems.push(`builds/${dir}: unknown model id (add it to catalog/models.json)`);
  return { games, models, builds, problems };
}

export function filterBuilds(builds, argv) {
  const pick = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1]?.split(",") : null;
  };
  const models = pick("--model");
  const games = pick("--game");
  return builds.filter((b) => (!models || models.includes(b.model)) && (!games || games.includes(b.game)));
}
