// Create an isolated one-shot workspace for <model> × <game> and print the prompt to hand the model.
//   node scripts/new-run.mjs <model-id> <game-id> [--runs-dir <dir>] [--force] [--quiet]
// The workspace lives OUTSIDE this repo (default: ../oneshot-runs) so the model cannot see other builds.
import fs from "node:fs";
import path from "node:path";
import { loadCatalog, root } from "./lib/catalog.mjs";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const [modelId, gameId] = args.filter((a, i) => !a.startsWith("--") && !(args[i - 1] ?? "").startsWith("--runs"));
const { games, models } = loadCatalog();
const model = models.find((m) => m.id === modelId);
const game = games.find((g) => g.id === gameId);
if (!model || !game) {
  console.error("Usage: node scripts/new-run.mjs <model-id> <game-id> [--runs-dir dir] [--force]");
  console.error(`Models: ${models.map((m) => m.id).join(", ")}`);
  console.error(`Games:  ${games.map((g) => g.id).join(", ")}`);
  process.exit(1);
}
const runsDir = path.resolve(flag("--runs-dir") ?? process.env.ONESHOT_RUNS_DIR ?? path.join(root, "..", "oneshot-runs"));
if (runsDir.startsWith(root + path.sep)) {
  console.error("The runs directory must be outside the repository so runs stay blind to other builds.");
  process.exit(1);
}
const workspace = path.join(runsDir, model.id, game.id);
if (fs.existsSync(workspace) && fs.readdirSync(workspace).length && !args.includes("--force")) {
  console.error(`${workspace} is not empty. Use --force to reset it.`);
  process.exit(1);
}
fs.rmSync(workspace, { recursive: true, force: true });
fs.mkdirSync(path.join(workspace, "oneshot"), { recursive: true });

const harnessFile = fs.readFileSync(path.join(root, "prompts", "ONESHOT-HARNESS.md"), "utf8");
const version = harnessFile.match(/^# Oneshot Arcade harness (v\d+)/m)?.[1] ?? "v?";
const template = harnessFile.split(/\n---\n/).slice(1).join("\n---\n").trim();
const port = 5100 + models.indexOf(model) * 100 + games.indexOf(game) * 10;
const values = {
  MODEL_LABEL: `${model.label} (${model.harness}, ${model.effort} effort)`,
  MODEL_ID: model.id,
  GAME_ID: game.id,
  GAME_NAME: game.name,
  WORKSPACE: workspace.split(path.sep).join("/"),
  PORT: String(port),
  HARNESS_VERSION: version,
  DATE: new Date().toISOString().slice(0, 10),
};
const prompt = template.replace(/\{\{(\w+)\}\}/g, (m, key) => values[key] ?? m);
fs.copyFileSync(path.join(root, "prompts", "games", game.prompt), path.join(workspace, "BRIEF.md"));
fs.writeFileSync(path.join(workspace, "ONESHOT.md"), prompt + "\n");
if (!args.includes("--quiet")) console.log(prompt);
console.error(`\nWorkspace ready: ${workspace}\nWhen the run ends: node scripts/import-run.mjs ${model.id} ${game.id}`);
