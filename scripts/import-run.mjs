// Copy a finished one-shot workspace into builds/<model>/<game>/ (source only) and normalize oneshot.json.
//   node scripts/import-run.mjs <model-id> <game-id> [--runs-dir <dir>] [--purity one-shot|iterated] [--notes "..."]
import fs from "node:fs";
import path from "node:path";
import { loadCatalog, root } from "./lib/catalog.mjs";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const positional = args.filter((a, i) => !a.startsWith("--") && !(args[i - 1] ?? "").startsWith("--"));
const [modelId, gameId] = positional;
const { games, models } = loadCatalog();
if (!models.some((m) => m.id === modelId) || !games.some((g) => g.id === gameId)) {
  console.error("Usage: node scripts/import-run.mjs <model-id> <game-id> [--runs-dir dir] [--purity iterated] [--notes text]");
  process.exit(1);
}
const runsDir = path.resolve(flag("--runs-dir") ?? process.env.ONESHOT_RUNS_DIR ?? path.join(root, "..", "oneshot-runs"));
const workspace = path.join(runsDir, modelId, gameId);
if (!fs.existsSync(workspace)) {
  console.error(`No workspace at ${workspace}`);
  process.exit(1);
}
const target = path.join(root, "builds", modelId, gameId);
const SKIP = new Set([
  "node_modules", "dist", ".git", ".vite", "coverage", "test-results", "playwright-report",
  ".cache", ".turbo", ".parcel-cache", "BRIEF.md", "ONESHOT.md",
]);
const SKIP_FILE = /^(\.env(\..*)?|.*\.(log|pem|key|tsbuildinfo))$/;
fs.rmSync(target, { recursive: true, force: true });
let bytes = 0;
fs.cpSync(workspace, target, {
  recursive: true,
  filter: (src) => {
    const name = path.basename(src);
    if (src === workspace) return true;
    if (SKIP.has(name) && path.dirname(src) === workspace) return false;
    if (name === "node_modules" || name === ".git") return false;
    if (fs.statSync(src).isFile()) {
      if (SKIP_FILE.test(name) && name !== ".env.example") return false;
      bytes += fs.statSync(src).size;
    }
    return true;
  },
});

const metaFile = path.join(target, "oneshot.json");
let meta = {};
try {
  meta = JSON.parse(fs.readFileSync(metaFile, "utf8"));
} catch {
  console.warn("oneshot.json missing or invalid. Recording the run as failed.");
  meta = { status: "failed", notes: "The run ended without a valid oneshot.json." };
}
meta.schema = 1;
meta.game = gameId;
meta.model = modelId;
meta.purity = flag("--purity") ?? meta.purity ?? "one-shot";
if (flag("--notes")) meta.notes = [meta.notes, flag("--notes")].filter(Boolean).join(" ");
if (!["complete", "partial", "failed"].includes(meta.status)) meta.status = "partial";
if (meta.startedAt && meta.finishedAt) {
  const minutes = (Date.parse(meta.finishedAt) - Date.parse(meta.startedAt)) / 60000;
  if (Number.isFinite(minutes) && minutes > 0) meta.durationMinutes = Math.round(minutes);
}
if (meta.screenshot && !fs.existsSync(path.join(target, meta.screenshot))) {
  console.warn(`Screenshot ${meta.screenshot} not found. Clearing the field.`);
  delete meta.screenshot;
}
fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2) + "\n");
const queueFile = path.join(root, "catalog", "queue.json");
if (fs.existsSync(queueFile)) {
  const queue = JSON.parse(fs.readFileSync(queueFile, "utf8"));
  const before = queue.runs?.length ?? 0;
  queue.runs = (queue.runs ?? []).filter((r) => !(r.model === modelId && r.game === gameId));
  if (queue.runs.length !== before) fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2) + "\n");
}
console.log(
  `Imported ${modelId}/${gameId}: status=${meta.status}, ${(bytes / 1e6).toFixed(1)} MB source, tests=${JSON.stringify(meta.tests ?? null)}`,
);
if (bytes > 60e6) console.warn("Warning: the source is larger than 60 MB. Check for committed binaries or build output.");
