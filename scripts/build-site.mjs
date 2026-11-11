// Assemble the static arcade site (GitHub Pages and `npm start`) into site/.
//   site/index.html, app.js, style.css     dashboard
//   site/data/catalog.json                 games × models × builds
//   site/prompts/...                       briefs + harness
//   site/play/<model>/<game>/              playable static builds
//   site/shots/<model>/<game>.<ext>        screenshots
import fs from "node:fs";
import path from "node:path";
import { loadCatalog, root } from "./lib/catalog.mjs";

const site = path.join(root, "site");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const repoUrl = String(pkg.repository?.url ?? pkg.repository ?? "")
  .replace(/^git\+/, "")
  .replace(/\.git$/, "");
const { games, models, builds, problems } = loadCatalog();
for (const p of problems) console.warn(`warning: ${p}`);

fs.rmSync(site, { recursive: true, force: true });
for (const dir of ["data", "prompts/games", "play", "shots"])
  fs.mkdirSync(path.join(site, dir), { recursive: true });
for (const file of ["index.html", "style.css", "app.js"])
  fs.copyFileSync(path.join(root, "arcade", file), path.join(site, file));
for (const game of games)
  fs.copyFileSync(
    path.join(root, "prompts", "games", game.prompt),
    path.join(site, "prompts", "games", game.prompt),
  );
fs.copyFileSync(
  path.join(root, "prompts", "ONESHOT-HARNESS.md"),
  path.join(site, "prompts", "ONESHOT-HARNESS.md"),
);

const SKIP = new Set(["node_modules", ".git", "test-results", "playwright-report", "coverage", ".vite"]);
// Older builds reference root-absolute asset paths; make them subpath-safe.
const rewriteRootPaths = (text) =>
  text
    .replaceAll('"/assets/', '"./assets/')
    .replaceAll("'/assets/", "'./assets/")
    .replaceAll('"/manifest.webmanifest', '"./manifest.webmanifest')
    .replaceAll('"/icon.svg', '"./icon.svg');
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const records = [];
for (const b of builds) {
  const output = path.join(b.dir, b.build.output);
  const playable =
    ["complete", "partial"].includes(b.status) && fs.existsSync(path.join(output, "index.html"));
  let playUrl = null;
  if (playable) {
    const target = path.join(site, "play", b.model, b.game);
    fs.cpSync(output, target, { recursive: true, filter: (src) => !SKIP.has(path.basename(src)) });
    for (const file of walk(target))
      if (/\.(html|js|css|json|webmanifest)$/.test(file))
        fs.writeFileSync(file, rewriteRootPaths(fs.readFileSync(file, "utf8")));
    playUrl = `./play/${b.model}/${b.game}/`;
  }
  let screenshotUrl = null;
  if (b.screenshot && fs.existsSync(path.join(b.dir, b.screenshot))) {
    const ext = path.extname(b.screenshot).toLowerCase();
    fs.mkdirSync(path.join(site, "shots", b.model), { recursive: true });
    fs.copyFileSync(path.join(b.dir, b.screenshot), path.join(site, "shots", b.model, `${b.game}${ext}`));
    screenshotUrl = `./shots/${b.model}/${b.game}${ext}`;
  }
  const blob = (file) => (repoUrl && file ? `${repoUrl}/blob/main/${b.rel}/${file}` : null);
  const report = b.report ?? (fs.existsSync(path.join(b.dir, "ONESHOT-REPORT.md")) ? "ONESHOT-REPORT.md" : null);
  records.push({
    model: b.model,
    game: b.game,
    status: b.status,
    purity: b.purity ?? "one-shot",
    date: b.date ?? null,
    harnessVersion: b.harnessVersion ?? null,
    durationMinutes: b.durationMinutes ?? null,
    tests: b.tests ?? null,
    stack: b.stack ?? null,
    summary: b.summary ?? null,
    notes: b.notes ?? null,
    selfScore: b.selfScore ?? null,
    playUrl,
    screenshotUrl,
    sourceUrl: repoUrl ? `${repoUrl}/tree/main/${b.rel}` : null,
    readmeUrl: blob(b.readme ?? "README.md"),
    reportUrl: blob(report),
    verificationUrl: blob(b.verification),
  });
}
// Runs in flight (catalog/queue.json) appear as running/queued until their build is imported.
const queueFile = path.join(root, "catalog", "queue.json");
const queue = fs.existsSync(queueFile) ? JSON.parse(fs.readFileSync(queueFile, "utf8")).runs ?? [] : [];
for (const run of queue) {
  if (records.some((r) => r.model === run.model && r.game === run.game)) continue;
  if (!models.some((m) => m.id === run.model) || !games.some((g) => g.id === run.game)) continue;
  records.push({
    model: run.model,
    game: run.game,
    status: run.status === "queued" ? "queued" : "running",
    purity: "one-shot",
    date: run.started ?? null,
    summary: null,
    notes: run.status === "queued" ? "Queued for a future wave." : "This one-shot is running now. Check back soon.",
  });
}
fs.writeFileSync(
  path.join(site, "data", "catalog.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), repoUrl, games, models, builds: records }, null, 2),
);
fs.writeFileSync(path.join(site, ".nojekyll"), "");
const playableCount = records.filter((r) => r.playUrl).length;
console.log(
  `Site ready in site/: ${records.length} builds (${playableCount} playable), ${games.length} games, ${models.length} models.`,
);
