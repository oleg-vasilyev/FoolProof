# `e2e/` — a different world, and it stays outside

Units prove the pieces and mock everything around them. That is the right default
and it can never prove the bot works, because the one thing it refuses to run is
the whole thing. So this folder plays whole scenarios against a **real
`src/main.ts` process** on a real SQLite file, with a fake Telegram on the other
end.

How to run it is in the root [README](../README.md#watching-it-play). It used to be
parked — not a gate, nothing depending on it — because seven honest problems stood
between it and being trusted. Six are closed and the seventh is in
[TECH-DEBT.md](../TECH-DEBT.md): a graceful shutdown cannot be played on Windows.
So it is **a gate now**, and `npm run e2e:changed` plays only what a diff can reach.

**This file is about the harness, not about writing a scenario.** Whether one is
owed, the verbs a scenario drives the chat with, and what it must assert are the
`write-an-e2e-scenario` skill — a scenario gets edited far more often than the
harness does, and the two jobs were being read as one. What is left here is what
must not be re-derived by whoever picks the harness up.

One obligation survives the parking: **a keyboard whose buttons carry
`callback_data` gets scenarios.** Whether a tap reaches the feature that owns it is
a fact about real grammY that no unit can reach, and it was already wrong once. A
URL button routes nothing back and earns none; the `write-an-e2e-scenario` skill
owns the judgement and says why.

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
  `describe`/`it`/`expect`.

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

## Two rules that keep the fake honest

Both were learned by getting them wrong:

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

That second rule is why `describeScenario`, and not the fake, is what refuses a
scenario ending with a keyboard still on screen: knowing when a screen is finished
is the bot's business. The rule itself lives in the `write-an-e2e-scenario` skill,
with the other things a scenario author has to get right.

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
