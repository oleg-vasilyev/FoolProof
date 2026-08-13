---
name: update-the-design-page
description: Bring the Durak Stats Poster System page in Claude Design back in step with what the code actually draws — after the design changed mid-phase, after a new chart was drawn on the page, or after refresh-the-pictures redrew the mockups. Covers pulling the page, splicing the real drawings in, and pushing it back byte-checked.
---

# Updating the design page

The page is the design's home and the renderer is the drawing's home; whichever
moved, the page must end up showing what the code actually draws. A page
showing an intention instead is exactly the state Rev. 1.0 was found in: eight
charts specified, two built, and nothing anywhere saying which was which.

Two directions lead here:

- **The design moved first** — the owner changed it mid-phase, or drew a new
  chart on the page. Read the page, build what it asks, and only then run the
  procedure below: the mockup on the page has to come from the renderer. An
  unbuilt chart stays under *Ideas* with its reasoning intact, and moves up
  only when it gains a real mockup — never rewritten from memory.
- **The code moved first** — `refresh-the-pictures` redrew the mockups. Run the
  procedure directly.

## The procedure

1. **Pull the page** with `DesignSync get_file` — project
   `dfdd20cb-3609-4baa-935d-eb20b8257c2c`, path
   `Durak Stats Poster System.dc.html` — into a local file. The same page for a
   human is
   [Durak Stats Poster System](https://claude.ai/design/p/dfdd20cb-3609-4baa-935d-eb20b8257c2c?file=Durak+Stats+Poster+System.dc.html);
   read it through the tool rather than the browser. It is ~80 KB, so let the
   result persist to disk and work from there rather than reading it into
   context.
2. **Splice, do not regenerate.**
   `node scripts/tools.ts design-page <page.html> <out.html>` replaces the body
   of every `<div class="poster" data-poster="…">` and touches nothing else.
   Slots are matched **by name, not by position**, so reordering the page
   cannot swap two drawings; a slot naming a poster nothing draws, a poster
   with no slot, or a slot holding nested markup all refuse by name.
3. **Read what the change made false.** The drawings are now current; the prose
   around them may not be. A renamed award, a new colour, a changed size — fix
   the sentence, and bump the `Rev.` in the header and the footer together.
4. **Push it back**: `finalize_plan` with the one path, then `write_files` with
   `localPath`. Read it back and compare against the local file — the write is
   done only when they are byte-identical.

## What the page is, and is not

- The project is `PROJECT_TYPE_PROJECT`, **not** `PROJECT_TYPE_DESIGN_SYSTEM`,
  and the type is fixed at creation. The Design System pane, `@dsCard` markers
  and `register_assets` do not apply — do not try to make them work.
- **The page's own chrome is not the poster's palette.** The document is warm
  and set in Golos Text; the posters it specifies are neutral and set in Noto
  Sans. That is deliberate — do not "fix" it.
- **Never print a number the data can move.** Rev. 2.0 labelled the awards
  mockup `1620 × 1160` and the real picture was 2232 tall, because the height
  follows the awards earned. State what is fixed — the width — and describe
  the rest.
