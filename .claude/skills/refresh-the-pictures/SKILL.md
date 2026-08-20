---
name: refresh-the-pictures
description: Audit every committed picture after an implemented visual change and regenerate the stale ones — the /stats mockups, the site posters, the Claude Design page, the OG previews, the favicon and the touch icon. Use after the diff review, when a design change has landed in code, when docs:check reports mockups or posters out of step — it runs in check:push and check:release, not in the phase loop — or whenever a committed PNG might no longer match what the product draws.
---

# Refreshing the committed pictures

> **Stage 5** of [how a change becomes a release](../../../DEVELOPMENT-FLOW.md).

Every picture in the repository is a copy of something the code or the design
can change without it. Three families are gated, the rest have nothing but this
table — so the skill *is* the checklist: after any implemented visual change,
walk it top to bottom and say for each row why it does or does not need
redrawing. Skipping a row silently is how an icon ships in last year's colour.

| Picture | Drawn by | What catches it going stale |
|---|---|---|
| `docs/mockups/*.svg` + `.png` | `node scripts/tools.ts mockups` | `docs:check` compares the SVG |
| `docs/posters/*-{en,ru}.svg` + `.png` | `node scripts/tools.ts site-posters` | `docs:check` compares the SVG |
| `docs/previews/og-cover*.png` | by hand, from the site's own look | nothing — this row |
| `docs/favicon.png`, `docs/apple-touch-icon.png` | by hand, from the bot's avatar | nothing — this row |
| the Claude Design page | the `update-the-design-page` skill, end to end | `docs:check` compares `design-page.sync` |

The gate deliberately compares **SVG, never PNG** — rasterizing would drag the
native resvg binary into a documentation gate. So a resvg upgrade can change
every shipped PNG while `docs:check` stays green, and the hand-made rows have
no generator at all: for those, the walk through this table is the whole
mechanism.

## The procedure for the generated rows

1. **Redraw after the review, before the final commit.** The pictures stage
   sits between the diff review and the retrospective so that a review finding
   cannot force a second redraw — `docs:check` was taken out of `check:phase`
   for exactly that reason. It still compares the SVGs in CI (`check:push`) and
   before a tag (`check:release`), so a stale mockup that reaches the push is a
   red check. **Commit both halves.** The SVG is the reviewable one: a
   colour change is one readable diff line where a PNG is an opaque blob. The
   PNG is the one `README.md` and the site actually show.
2. **Every regenerated PNG goes to the `poster-reader` agent, not to your own
   eyes.** The gate proves the file matches the renderer; it cannot say the
   renderer started drawing nonsense — the awards card grew from thirteen rules to
   thirty-eight with every gate green. And you cannot read your own copy cold: a
   released card carried a hint that only parses if you already know what the chart
   will be, and it was looked at here, on purpose, by the person who wrote it. Send
   the paths and the lines to read, never what any of it is for; `finish-phase`
   gate 6 has the four questions the brief carries.
3. **Check the render against the e2e quiet window.** A poster that grows costs
   rasterizing time, and `e2e/harness/settling.ts` decides the bot has finished
   after `QUIET_MS` of silence — a window the slowest single render must fit
   inside. One redesign added ~80ms, crossed the old window, and announced
   itself as five scenarios asserting against photos that had not arrived.
   Measure before `e2e:changed`, so a red suite means the bot, not the harness:

   ```
   node -e "import('./src/features/scoresheet/bot/rasterizer.ts').then(async ({rasterize})=>{const {posters}=await import('./scripts/mockups.ts');for(const [n,s] of Object.entries(posters())){await rasterize(s);const t=performance.now();await rasterize(s);console.log(n,(performance.now()-t).toFixed(0)+'ms');}})"
   ```

## The hand-made rows

The OG previews change only when the site's look changes, the two icons only
when the avatar does. When their source moved, regenerate from it and look at
the result at the size it is served — an OG cover is judged in a link preview,
an icon in a browser tab, not in an image viewer at full width.

## What this skill hands off

If the mockups or the posters were redrawn, the page in Claude Design is now
behind the code — that is a separate job with its own trap list: load the
**`update-the-design-page`** skill.
