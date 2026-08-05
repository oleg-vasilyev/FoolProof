# `e2e/` — a different world, and it stays outside

Units prove the pieces and mock everything around them. That is the right default
and it can never prove the bot works, because the one thing it refuses to run is
the whole thing. So this folder plays whole scenarios against a **real
`src/main.ts` process** on a real SQLite file, with a fake Telegram on the other
end.

How to run it is in the root [README](../README.md#watching-it-play). What is
deliberately unfinished about it is in [TECH-DEBT.md](../TECH-DEBT.md) — the
harness is **parked**: it is not a release gate and nothing depends on it. This
file is the part that must not be re-derived by whoever picks it up.

One obligation survives the parking: **a feature with an inline keyboard gets
scenarios.** Whether a tap reaches the feature that owns it is a fact about real
grammY that no unit can reach, and it was already wrong once.

## The separation is structural, not a convention to remember

- It lives at the repository root — not in `src/`, not in `scripts/`. It has its own
  `tsconfig.json` and its own `vitest.e2e.config.ts`, so `npm test`, coverage and
  mutation cannot pick it up. `npm run e2e` is the only way in.
- **It imports nothing from `src/`.** Not a type, not a constant, not `copy.en.ts`.
  It knows the bot the way Telegram knows it: commands in, Bot API calls out. A
  harness that imported the copy table would assert a constant against itself.
  That is also why this folder uses **relative imports** — the `#` aliases are the
  app's, and this is not the app.
- The runner is **Vitest**, which the project already depends on. Scenarios are
  `*.e2e.spec.ts` and read as `describeScenario(name, …)` with ordinary
  `describe`/`it`/`expect`; the cases inside a file share one chat and run in
  order, which is what makes a scenario a scenario rather than a pile of tests.

## One world per worker, and it outlives the file

A world is a port, a bot process and a database file. `VITEST_WORKER_ID` names all
three, which is why scenario files run at the same time without colliding.

Every scenario wipes the database and restarts the bot, but the message log carries
on and each message is stamped with the scenario that produced it — so the page
reads as one long conversation with a divider per scenario, the way Telegram does,
while a query still only sees the scenario running now.

**`isolate: false` in the Vitest config is load-bearing.** With isolation the
module registry is rebuilt per file, so the world would be recreated per scenario
file — losing the history and racing itself for the port.

## Four rules that keep the harness honest

All were learned by getting them wrong:

- **A scenario ends the way an evening does.** Nothing may be left with a keyboard
  on it: a card ends on Confirm or Cancel, a `/merge` screen the same. Eight of the
  sixteen scenarios used to walk off mid-card, and since the chat log outlives the
  database reset between files, the result was a watch run full of screens a player
  could still tap against games that no longer existed. `describeScenario` now fails
  a scenario that leaves one open, and names it — the harness cannot tidy up on the
  scenario's behalf without deciding when a screen is finished, which is the bot's
  business, not the fake's.

- **A scenario that asserts only captions cannot tell two screens apart.** When a new
  screen is inserted before an old one and lists the same names, every assertion in
  the scenario keeps passing while looking at a different message — which is the exact
  confusion the new screen's heading exists to prevent, now unguarded. A scenario that
  crosses a screen boundary asserts the text first and the captions second.

- **The fake Telegram records; it never decides.** It stores messages, edits,
  deletions and callback answers, and answers queries about them. Nothing in it
  knows what a game is. The moment it needs to know, the scenario is asserting
  against a second implementation.
- **It must refuse everything the real one refuses.** The first version accepted an
  edit to a message it had never seen and answered `ok: true`, so a lost message
  passed. It now answers `400` for an unknown message, and for an edit that changes
  nothing — which is what Telegram does, and what a redraw of an in-sync card
  actually gets. That immediately broke two scenarios asserting "the card was
  edited again": the honest observable is that the bot **attempted** the edit, so
  the fake counts attempts separately from applied edits.

## The hub proxies the worlds rather than linking to them

The hub lists a run **by scenario, not by worker**. A world plays several scenarios
one after another, so it reports the name and verdict of each — `?scenario=N` on a
world's URL narrows the page to one of them. Scenario, not file: `describeScenario`
names what is being tested, and which file it sits in never reaches the world.

A world lives inside a Vitest worker and dies with it, so a page pointed straight
at its port goes blank the moment the run ends — which is exactly when you want to
look at the `/stats` picture. So `hub/` serves every world under `/world/<port>/`,
remembering the last state and every picture it saw; when the port stops answering
it serves the remembered copy. That is also why the hub lives in `watch-live.ts`
and not in `globalSetup`: it has to outlive the runner.

The page receives its base path explicitly rather than relying on the URL keeping a
trailing slash — a relative `chat/state` under `/world/8090` resolves to
`/world/chat/state`, which matches no route, and that looked exactly like a dead
world for two rounds of "fixed it".

A third round of the same illusion came from the page's own redraw. It skips the
feed when the markup it computed matches what it last drew, and the "nothing here"
notice wrote into the feed **without** recording what it had written — so one
failed poll while the chat was still empty pinned the notice in place, and every
later poll agreed nothing had changed. Anything that writes to the feed writes to
`feedShown` too.

A fourth was not in this code at all. The hub answers **`410 Gone`** for a world
its sweep has not reached yet, a browser opens its tab within a second of the hub
starting, and **`410` is heuristically cacheable** — so Chrome kept that answer and
never asked again, for as long as the tab stayed open. `curl` has no cache, which
is why it could not be reproduced from a terminal. Both ends now refuse the cache:
every hub response carries `cache-control: no-store`, and every poll passes
`{ cache: "no-store" }`, which is also what rescues a browser whose cache was
poisoned before the header existed.

The chat page renders the bot's message text as **raw HTML**, which is what
Telegram does with `parse_mode: "HTML"`. That is deliberate: a name the bot failed
to escape shows up as markup on the page instead of hiding in a string comparison.

## The one seam in `src/`

`BOT_API_ROOT`, read in `shared/telegram/bot-client-options.ts` and handed to
grammY as `apiRoot`. It is absent from both env files, `npm run e2e` sets it only on
the process it spawns, and a run pointed anywhere but Telegram **warns on startup**
— which `/status` then reports, so a misdirected bot cannot hide.

It is not a test hook: a self-hosted Bot API server is a real Telegram feature. It
had to be an env seam because grammY imports `node-fetch` rather than using global
`fetch`, so patching `globalThis.fetch` cannot redirect it.
