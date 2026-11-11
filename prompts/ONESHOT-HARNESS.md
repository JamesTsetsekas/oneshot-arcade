# Oneshot Arcade harness v1.1

Every model gets this exact wrapper around the game brief. Only the `{{placeholders}}` change between runs. `node scripts/new-run.mjs` fills them in and creates the workspace. Do not edit this text for one model and not the others. If the harness changes, bump the version and record it in each build's `oneshot.json`.

**Changelog.** v1.1 added the operational rule 7 ("your run ends when your turn ends"). It contains no game guidance. Under v1, one Claude Code run ended its turn while it waited on a background command, and it needed a neutral nudge to continue.

---

You are **{{MODEL_LABEL}}**, taking part in **Oneshot Arcade**, a public, side-by-side evaluation of how well AI coding models build browser games from a single prompt. Your build will be played, screenshotted, and compared with builds of the same brief from other models.

## The rules

1. **This is a one-shot.** You get this prompt and nothing else. No human will answer questions, review a plan, or give feedback mid-run. Never stop to ask. When something is ambiguous, choose sensibly, write the assumption down, and keep going. Work until the deliverable is as good as you can make it, then stop.
2. **Stay in your workspace.** Your workspace is `{{WORKSPACE}}`. Create, read, and modify files only inside it. Do not list, open, or search its parent directories, other runs, other games, or any `oneshot-arcade` / `astra-oneshots` repository, locally or on GitHub. Looking at another model's attempt invalidates the run.
3. **Play fair.** You may use public documentation, npm packages, and other open-source libraries, as you would in any project. Do not download or copy an existing game's source, art, audio, maps, or names. The brief's IP boundary is binding.
4. **Be honest.** Your report is evidence, not marketing. Unverified claims count against you. "Not done" and "not verified" are acceptable answers.
5. **No secrets, telemetry, or external services.** Ship no API keys, analytics, trackers, or accounts. The game must run with no backend. Optional local servers, such as a multiplayer relay, may exist, but single-player play cannot depend on them.
6. **Do not use git remotes.** Do not push, publish, or deploy anything. A local `git init` for your own checkpoints is fine.
7. **Your run ends when your turn ends.** Nothing will wake you up later. Run long commands such as installs, tests, builds, and browser checks in the foreground and wait for them. Never end your turn while a background command is still working.

## The brief

The full game brief for **{{GAME_NAME}}** (`{{GAME_ID}}`) is in `{{WORKSPACE}}/BRIEF.md`. Read all of it before you start. It describes a large production game. Neither you nor anyone else is expected to ship the whole thing in one session. You are judged on how good a **playable vertical slice** you deliver: a complete core loop that is fun and readable and feels polished, built on architecture that honors the brief's technical direction. Prioritize like a strong lead engineer: core loop first, then feel, clarity, and polish, then breadth. Hide unfinished features. Do not show dead buttons.

## The delivery contract

The arcade's tooling depends on these. Breaking one can make your build unplayable on the site.

- **Location.** The project root is `{{WORKSPACE}}`, not a subfolder.
- **Toolchain.** Use Node.js 22.12+ and npm. Commit a `package.json` and an up-to-date `package-lock.json` so that `npm ci` works from a clean checkout. A no-build static game is also allowed: then `index.html` sits at the root, there is no `package.json`, and `"build": {"command": null, "output": "."}` goes in `oneshot.json`.
- **Build.** `npm run build` writes a fully static site to `dist/` with `dist/index.html`. It must work when served from **any sub-path**, such as `https://host/play/{{MODEL_ID}}/{{GAME_ID}}/`. Use relative URLs everywhere (in Vite, `base: "./"`). Do not use root-absolute `/assets/...` paths or hash-routing assumptions about `/`. Single-player play must work with no server beyond static file hosting.
- **Tests.** `npm test` runs your automated tests headlessly and exits 0. Test the simulation and rules, not just rendering.
- **Target.** Desktop Chrome/Edge with WebGL 2, keyboard and mouse, 1920×1080 or 1280×720. Show a clear error screen if a required capability is missing.
- **Ports.** If you run a dev or preview server, use port **{{PORT}}** (or {{PORT}}+1 to +9). Other runs are using other ports at the same time. Stop the servers you start before you finish.
- **Assets.** Use only original or properly licensed assets. Procedural, generated, or hand-authored assets are all fine. List each asset's source and license in `ASSETS.md`. Keep the source tree under about 50 MB, `node_modules` and `dist` excluded.

## Required files at the workspace root

1. `README.md`: what the game is, how to run it (`npm ci`, `npm run dev`, `npm run build`, `npm test`), controls, and what is in the slice.
2. `ONESHOT-REPORT.md`, with these sections in this order:
   - **Summary**: three sentences on what you built.
   - **Brief coverage**: a table of the brief's major systems and acceptance criteria, each marked Done / Partial / Not started, with a one-line note.
   - **Architecture**: stack choices and why, and the main modules.
   - **Verification**: the exact commands you ran and their real results (test counts, build output, any browser or gameplay checks). Say plainly what you could not verify.
   - **Assumptions and deviations** from the brief.
   - **Known issues and limitations.**
   - **Self-assessment**: an honest score from 1 to 10 for playability, visual polish, and brief fidelity, one sentence each.
3. `oneshot/screenshot.png`: a real in-game gameplay screenshot at 1280×720 or larger, not the menu if you can avoid it. Capture it from your production build with a headless browser (Playwright, Puppeteer, or similar). Save extra screenshots in `oneshot/` too. If you cannot capture one, say why in the report and omit the file. Never fake a screenshot.
4. `oneshot.json`, filled in as below. Keep the keys and replace the values:

```json
{
  "schema": 1,
  "game": "{{GAME_ID}}",
  "model": "{{MODEL_ID}}",
  "status": "complete",
  "harnessVersion": "{{HARNESS_VERSION}}",
  "date": "{{DATE}}",
  "startedAt": "<ISO timestamp when you began>",
  "finishedAt": "<ISO timestamp when you finished>",
  "build": { "command": "npm run build", "output": "dist" },
  "screenshot": "oneshot/screenshot.png",
  "tests": { "passed": 0, "failed": 0 },
  "stack": ["e.g. TypeScript", "Vite", "Three.js"],
  "summary": "<one-sentence pitch of what you actually shipped>",
  "selfScore": { "playability": 0, "polish": 0, "fidelity": 0 },
  "readme": "README.md",
  "report": "ONESHOT-REPORT.md",
  "notes": "<anything a reviewer must know, or empty>"
}
```

Set `status` to `complete` if the core loop is playable start to finish, `partial` if it is playable but the loop is incomplete, and `failed` if nothing playable builds. Record `startedAt` right away by running a shell command, before you write any code.

## How to finish

Before you stop, from a clean state: delete `node_modules` and `dist`, then run `npm ci`, `npm test`, and `npm run build`. Serve `dist/` from a sub-path to confirm it loads, and capture the final screenshot. Then reply with a short summary: the status, the test counts, the screenshot path, and the top three known issues. That reply is your final word. There will be no follow-up turn.
