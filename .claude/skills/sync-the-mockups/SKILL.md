---
name: sync-the-mockups
description: Redraw the committed poster mockups and bring the Claude Design page back in step after anything that changes what /stats draws. Use when touching scoresheet/render/, palette.ts, card-metrics.ts or poster copy, when npm run check reports the mockups out of step, or when a new chart is drawn in Claude Design and has to be built.
---

# Keeping the pictures, the repository and the design page in step

Three copies of the same drawing exist and they drift in silence: the renderer in
`src/`, the PNGs `README.md` shows, and the mockups on the design page. The last
sync found **three different palettes**, two font families and two widths in play at
once, so this is not hypothetical.

One link of the three is now checked. `npm run check` renders the sample evening and
compares it against `docs/mockups/*.svg`; a single changed hex fails the gate. Two
things it deliberately does not do:

- **It compares the SVG, never the PNG.** Rasterizing would drag the native resvg
  binary into a documentation gate. So a resvg upgrade can change the picture
  `README.md` shows while the gate stays green — after one, open the PNG.
- **It cannot reach the design page**, which lives behind the network while a gate
  stays offline. The gate's message naming this skill is the whole mechanism.

## The trigger

Anything that changes what `/stats` puts on a picture: `features/scoresheet/render/`,
`palette.ts`, `card-metrics.ts`, the award catalogue, or a `copy.*.ts` string a
poster prints. If `docs:check` complained, the trigger already fired.

## The procedure

1. **Redraw.** `node scripts/tools.ts mockups` rewrites `docs/mockups/` — SVG and
   PNG for both posters. **Commit both.** The SVG is the reviewable half: a colour
   change is one readable line in the diff, where a PNG is an opaque blob. The PNG
   is the half `README.md` shows, because GitHub renders it reliably.
   Redraw **before** running `npm run check`, not after it complains: the gate runs
   lint, types, docs and the whole suite, and a stale mockup makes you pay for all
   of it twice.
2. **Look at the PNG.** Actually open it. The gate proves the file matches the
   renderer; it cannot tell you the renderer started drawing nonsense. Read it as a
   reader, not as a diff — the awards card grew from thirteen rules to thirty-eight
   with every gate green, and opening the picture is what found the two rows that
   said the same thing in different words, and a sentence that read "1 game of 12
   games". Ask specifically: **does any row repeat another, and does every sentence
   read like English?**
3. **Pull the design page** with `DesignSync get_file` — project
   `dfdd20cb-3609-4baa-935d-eb20b8257c2c`, path `Durak Stats Poster System.dc.html`
   — into a local file. The same page for a human to open is
   [Durak Stats Poster System](https://claude.ai/design/p/dfdd20cb-3609-4baa-935d-eb20b8257c2c?file=Durak+Stats+Poster+System.dc.html);
   read it through the tool rather than the browser, which is faster and does not
   need a session. It is ~80 KB, so let the tool result persist to disk and
   work from there rather than reading it into context.
4. **Splice, do not regenerate.**
   `node scripts/tools.ts design-page <page.html> <out.html>` replaces the body of
   every `<div class="poster" data-poster="…">` and touches nothing else. The slots
   are matched **by name, not by position**, so reordering the page's sections
   cannot swap the two drawings; a slot naming a poster nothing draws, a poster with
   no slot, or a slot holding nested markup instead of one drawing each refuse by
   name rather than splicing something wrong.
5. **Check the render against the e2e quiet window.** A poster that grows costs
   rasterizing time, and `e2e/harness/settling.ts` decides the bot has finished
   after `QUIET_MS` of silence — a window the slowest single render has to fit
   inside. This redesign added ~80ms to the chronology (~460ms → ~540ms), crossed
   the old 600ms window, and announced itself as five scenarios asserting against
   photos that had not arrived: a wrong answer in a gate, wearing flakiness as a
   disguise. Measure it before running `e2e:changed`, so a red suite means the bot
   and not the harness:

   ```
   node -e "import('./src/features/scoresheet/bot/rasterizer.ts').then(async ({rasterize})=>{const {posters}=await import('./scripts/mockups.ts');for(const [n,s] of Object.entries(posters())){await rasterize(s);const t=performance.now();await rasterize(s);console.log(n,(performance.now()-t).toFixed(0)+'ms');}})"
   ```

6. **Read what the change made false.** The mockups are now current; the prose
   around them may not be. A renamed award, a new colour, a changed size — fix the
   sentence and bump the `Rev.` in the header and the footer together.
7. **Push it back**: `finalize_plan` with the one path, then `write_files` with
   `localPath`. Read it back and compare against the local file; the write is only
   done when they are byte-identical.

## What this page is, and is not

- The project is `PROJECT_TYPE_PROJECT`, **not** `PROJECT_TYPE_DESIGN_SYSTEM`, and
  the type is fixed at creation. So the Design System pane, `@dsCard` markers and
  `register_assets` do not apply here. Do not try to make them work; a new project
  would be needed, and nothing currently needs one.
- **The page's own chrome is not the poster's palette.** The document is warm and
  set in Golos Text; the posters it specifies are neutral and set in Noto Sans.
  That is deliberate — the chrome belongs to the document. Do not "fix" it.
- **Never print a number the data can move.** Rev. 2.0 first labelled the awards
  mockup `1620 × 1160` and the real picture was 2232 tall, because the height
  follows the awards earned. State what is fixed — the width — and describe the
  rest.
- The unbuilt charts live under *Ideas* with their original reasoning intact. When
  one of them gets built it moves up into the implemented section and gains a real
  mockup; it does not get rewritten from memory.

## When the design moves first

The other direction is a person drawing a new chart in Claude Design and telling
you. Read the page, build the chart, and only then run this procedure — the
mockup on the page has to come from the renderer, or the page goes back to being
a drawing of an intention. That is exactly the state Rev. 1.0 was found in: eight
charts specified, two built, and nothing anywhere saying which was which.
