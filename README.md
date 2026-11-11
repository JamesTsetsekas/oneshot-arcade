# Oneshot Arcade

**One prompt. One take. Every model.**

Oneshot Arcade compares how well AI coding models build browser games. Each game starts as one detailed, original design brief. Every model gets that brief verbatim inside the same [one-shot harness](prompts/ONESHOT-HARNESS.md), with no hints, no human feedback, and no second take. The builds are published side by side so anyone can play them and decide which model did best.

**[Play the arcade →](https://jamestsetsekas.github.io/oneshot-arcade/)**

The dashboard has three views:

- **Matrix**: every game × every model on one screen, with a screenshot, status, and test count in each cell.
- **By game**: one brief, every model's build side by side. This is the fairest comparison.
- **By model**: one model's builds across every brief.

Click any build for its details: the screenshot, the model's own one-shot report, its self-score, the source link, and a play button.

## The lineup

| Model | Harness | Effort | Folder |
| --- | --- | --- | --- |
| GPT-6 Astra | Codex | high | `builds/gpt-6-astra-high/` |
| GPT-6.1 Sol | Codex | high | `builds/gpt-6.1-sol-high/` |
| Fable 5.2 | Claude Code | high | `builds/claude-fable-5.2-high/` |
| Opus 5.5 | Claude Code | high | `builds/claude-opus-5.5-high/` |
| Sonnet 5.5 | Claude Code | high | `builds/claude-sonnet-5.5-high/` |

| # | Game | Genre | Brief |
| --- | --- | --- | --- |
| 01 | Shardfront | Real-time strategy | [brief](prompts/games/01-shardfront-browser-rts.md) |
| 02 | Ashfall Covenant | Action RPG | [brief](prompts/games/02-ashfall-covenant-browser-arpg.md) |
| 03 | Breachline | Arcade FPS | [brief](prompts/games/03-breachline-browser-arcade-fps.md) |
| 04 | Last Protocol | Tactical FPS | [brief](prompts/games/04-last-protocol-browser-tactical-fps.md) |
| 05 | Crownfall | Lane-and-objective battle arena | [brief](prompts/games/05-crownfall-browser-moba.md) |
| 06 | Skybreak | No-build battle royale | [brief](prompts/games/06-skybreak-browser-battle-royale.md) |
| 07 | Meridian Run | Open-world courier adventure | [brief](prompts/games/07-meridian-run-browser-open-world.md) |
| 08 | Farestorm | Arcade taxi driving | [brief](prompts/games/08-farestorm-browser-arcade-driving.md) |

The GPT-6 Astra builds came from the original *Astra Oneshots* collection, before the harness existed. Four of them were remade or kept from an earlier attempt, and the dashboard marks those **ITERATED**. Every build made with the harness is a true one-shot.

## Play locally

Requires Node.js **22.12+** (or 24+) and npm.

```sh
git clone https://github.com/JamesTsetsekas/oneshot-arcade.git
cd oneshot-arcade
npm run setup        # npm ci + build for every build (allow several minutes)
npm start            # assembles site/ and serves http://127.0.0.1:4160
```

Each build is an independent npm project, so you can work on one directly:

```sh
cd builds/gpt-6.1-sol-high/farestorm
npm ci && npm run dev
```

Useful filters, which work with `setup`, `build`, and `test`:

```sh
npm run setup -- --model claude-opus-5.5-high
npm run test  -- --game farestorm,crownfall
npm run setup -- --keep-going          # don't stop at the first broken build
npm run check                          # validate catalog/ and every oneshot.json
```

## Repository layout

```
catalog/games.json         the games (id, name, genre, brief file, pitch)
catalog/models.json        the model × harness × effort lineup (id = folder under builds/)
catalog/queue.json         runs in progress; shown on the dashboard as "running"
prompts/ONESHOT-HARNESS.md the wrapper every model receives (versioned)
prompts/games/*.md         the game briefs, given verbatim
prompts/PROMPT-PACK.md     how the briefs were researched and designed
builds/<model>/<game>/     one model's build of one brief + oneshot.json + ONESHOT-REPORT.md
arcade/                    the dashboard (plain HTML/CSS/JS, no build step)
scripts/                   setup/build/test runner, site builder, new-run / import-run
```

Every build folder has an `oneshot.json` that the dashboard reads:

```json
{
  "game": "farestorm", "model": "gpt-6.1-sol-high",
  "status": "complete",              // complete | partial | failed
  "purity": "one-shot",              // one-shot | iterated
  "harnessVersion": "v1", "date": "2026-11-11", "durationMinutes": 94,
  "build": { "command": "npm run build", "output": "dist" },
  "screenshot": "oneshot/screenshot.png",
  "tests": { "passed": 41, "failed": 0 },
  "stack": ["TypeScript", "Vite", "Three.js"],
  "summary": "One-sentence pitch of what shipped.",
  "selfScore": { "playability": 7, "polish": 6, "fidelity": 6 }
}
```

## Running a new one-shot

1. **Create a blind workspace.** It is created outside the repo, so the model cannot see other builds:

   ```sh
   node scripts/new-run.mjs claude-opus-5.5-high farestorm > prompt.txt
   ```

   This creates `../oneshot-runs/<model>/<game>/` containing `BRIEF.md` and `ONESHOT.md`, the rendered harness with a unique dev-server port. Set `ONESHOT_RUNS_DIR` to use a different location.

2. **Start the model** in that directory with this kickoff message, sent identically to every model:

   > Your complete instructions are in this file: `<workspace>/ONESHOT.md`. Read it first and follow it exactly. That directory is your workspace and project root. Change into it before doing anything else, and do not read or list anything outside it. This is an autonomous one-shot: never ask questions, and work until the deliverable is finished.

   Use the harness and effort recorded in `catalog/models.json`. Do not intervene. If you have to, for example to restart a crashed session, import the run with `--purity iterated --notes "what happened"`.

3. **Import the result.** This copies the source only (no `node_modules`, `dist`, or secrets), normalizes `oneshot.json`, and computes the run time:

   ```sh
   node scripts/import-run.mjs claude-opus-5.5-high farestorm
   npm run setup -- --model claude-opus-5.5-high --game farestorm
   npm start
   ```

   Then remove the run from `catalog/queue.json` and commit.

### Adding a game

1. Write an original brief in `prompts/games/NN-<slug>.md`. Match the existing structure: vision, loop, stack, controls, MVP boundary, and acceptance criteria. Keep it IP-clean: name genre mechanics, never another game's content.
2. Add it to `catalog/games.json` with a unique lowercase `id`, a `glyph`, and a one-line `pitch`.
3. Run `npm run check`, then queue a run for each model.

### Adding a model

Add an entry to `catalog/models.json`. The `id` is `<model>-<effort>` and becomes the folder name. Give it a distinct `color`. A model at a different effort level, or on a different harness, counts as a separate entry.

### Changing the harness

Treat the harness as frozen within a version. If you change it, bump the version on its first line (`# Oneshot Arcade harness v2`). New runs record that version, and the dashboard shows which version each build used. Comparisons are fairest between builds that used the same harness version.

## Fairness and honesty notes

- Runs happen in an empty directory outside this repo, and the harness forbids reading other attempts. This depends on the model following instructions. It is not a sandbox.
- Test counts, self-scores, and coverage tables are each model's own claims. The reports ask for evidence, and the playable build is the real test.
- These are browser vertical slices of intentionally huge briefs. Nobody ships the whole brief in one session, so the comparison is how much good game each model delivers.
- Briefs reference genres, never protected content. Each build's `ASSETS.md` and README document its asset sources.

## Deployment

Pushing to `main` runs `.github/workflows/pages.yml`, which validates the catalog, installs and builds every build (`--keep-going`), assembles `site/`, and publishes it to the `gh-pages` branch. A broken build appears on the dashboard as "not built" instead of failing the deploy.
