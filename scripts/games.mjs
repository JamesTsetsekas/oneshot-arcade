// Install / build / test every build in builds/<model>/<game>/.
//   npm run setup -- --model gpt-6.1-sol-high --game farestorm --keep-going
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { loadCatalog, filterBuilds, root } from "./lib/catalog.mjs";

const action = process.argv[2];
const commands = {
  setup: ["install", "build"],
  install: ["install"],
  build: ["build"],
  test: ["test"],
};
if (!Object.hasOwn(commands, action)) {
  console.error("Use npm run setup | install:games | build | test  [-- --model a,b --game x,y --keep-going]");
  process.exit(1);
}
const keepGoing = process.argv.includes("--keep-going");
const npmCli = process.env.npm_execpath;
if (!npmCli || !fs.existsSync(npmCli)) {
  console.error("Run this script through npm so its CLI path is available.");
  process.exit(1);
}
const { builds } = loadCatalog();
const selected = filterBuilds(builds, process.argv).filter((b) => ["complete", "partial"].includes(b.status));
const statusFile = path.join(root, ".build-status.json");
const status = fs.existsSync(statusFile) ? JSON.parse(fs.readFileSync(statusFile, "utf8")) : {};
const failures = [];

function npm(args, cwd) {
  console.log(`\n[${path.relative(root, cwd)}] npm ${args.join(" ")}`);
  const result = spawnSync(process.execPath, [npmCli, ...args], { cwd, stdio: "inherit", windowsHide: true });
  return !result.error && result.status === 0;
}

for (const b of selected) {
  const key = `${b.model}/${b.game}`;
  if (!b.hasPackage) {
    status[key] = { ok: true, static: true };
    continue;
  }
  let ok = true;
  for (const step of commands[action]) {
    if (step === "install") ok = npm(b.hasLockfile ? ["ci", "--no-audit", "--no-fund"] : ["install", "--no-audit", "--no-fund"], b.dir);
    else if (step === "build") ok = npm(["run", "build"], b.dir);
    else if (step === "test") ok = npm(["test"], b.dir);
    if (!ok) break;
  }
  if (action !== "test") status[key] = { ok, at: new Date().toISOString() };
  if (!ok) {
    failures.push(key);
    if (!keepGoing) break;
  }
}
fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
console.log(`\n${action}: ${selected.length - failures.length}/${selected.length} succeeded.`);
if (failures.length) {
  console.error(`Failed: ${failures.join(", ")}`);
  process.exit(keepGoing && action !== "test" ? 0 : 1);
}
