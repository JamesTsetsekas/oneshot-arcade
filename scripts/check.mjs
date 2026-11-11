// Validate catalog + build metadata. Exits non-zero on any problem.
import fs from "node:fs";
import path from "node:path";
import { loadCatalog, root } from "./lib/catalog.mjs";

const { games, models, builds, problems } = loadCatalog();
for (const [name, list] of [["games", games], ["models", models]]) {
  const ids = list.map((x) => x.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) problems.push(`catalog/${name}.json: duplicate ids ${dupes.join(", ")}`);
  for (const id of ids)
    if (!/^[a-z0-9][a-z0-9.-]*$/.test(id)) problems.push(`catalog/${name}.json: id "${id}" must be lowercase kebab-case`);
}
for (const g of games)
  if (!fs.existsSync(path.join(root, "prompts", "games", g.prompt)))
    problems.push(`catalog/games.json: ${g.id} prompt ${g.prompt} not found`);
if (!fs.existsSync(path.join(root, "prompts", "ONESHOT-HARNESS.md"))) problems.push("prompts/ONESHOT-HARNESS.md missing");
if (problems.length) {
  console.error(problems.map((p) => `x ${p}`).join("\n"));
  process.exit(1);
}
console.log(
  `ok: ${games.length} games x ${models.length} models, ${builds.length}/${games.length * models.length} cells have a build.`,
);
