# Where a phase's budget actually goes

> Not a gate. Read while planning a phase, and again after one cost more than it should have — every line was paid for here at least once. [Finishing a phase](SKILL.md) is the gates themselves.

A phase's cost is dominated by rework, not by thinking:

- **Freeze every signature that crosses a layer before the first `Write`.** `/merge`
  flipped `mergePlayers` between `number` and `void` after the SQL, the stub and the
  integration spec were written, and paid for three files twice.
- **Waiting on gates that did not need running.** See gate 3.
- **A new path that bypasses an old one inherits its obligations.** List what the old
  path did *besides* the obvious thing — a cleanup, a sweep, a refusal — and say for
  each whether the new one still does it. Noticing a side effect and filing it as
  minor is not that check: the seating screen dropped the sweep that made a mistyped
  name disappear, and the phase then wrote a `PLAN.md` paragraph claiming it had not.
- **Decide where a rule lives before writing it, not after.** If one rule already
  earned a `domain/` module, its siblings belong beside it: a phase left the line-up
  arithmetic inline ten lines from `starter-rule.ts`, and the review's move cost two
  specs a second writing. In reverse, a `domain/` predicate that gates a button is
  unfinished until the `render/` side reads it — until then the rule is unreachable
  and nothing fails.
- **Anything the owner will look at gets rendered and shown before a spec is written
  against it**, and a choice between two defensible shapes is asked rather than
  picked. Five rounds went on a chart's legend because two guesses were cheaper to
  make than one question, and each guess cost a render, a spec pass and a screenshot.
- **A design settled in a session that has ended is not settled.** Frozen signatures,
  an approved mockup and a decisions note survive a restart; the owner's agreement
  does not, because what he agreed to was a picture he can no longer see. A resumed
  phase shows the drawing again before writing a line against it — one that did not
  wrote the module its notes had frozen, and deleted it the same hour. The tell is
  cheap: if you are *reading* a decision instead of remembering making it, re-show it.
- **Read the commit messages of the work you pick up, before contradicting any of
  it.** One session was a command away from "repairing" a gallery fixture back to a
  state a previous session had already tried, caught in review and written up at
  length. Reading cost a minute; the correction would have cost the phase.
- **A bulk rewrite is a script written to a file and run with `node`** — never a
  heredoc, which died twice on shell quoting before the first one landed. Anchor on
  the call as it appears, not on the name: replacing `awardRow(` blindly also rewrote
  `describe("awardRow()")`. **And it reports every replacement it did not make, then
  exits non-zero** — `String.replace` returns the string unchanged when the needle is
  absent, so one script here announced "cases rewritten" over a file it had not
  touched, CRLF against LF-shaped needles, and the lie held until the suite failed
  with the old case names still in it.

**An edit made by a script ends with a lint run, not with a glance.** The editor hook
lints a file as it is written; a patch applied by a throwaway script gets no such
feedback, and its mistake is always the same shape — a line inserted without the blank
lines around it, or a deletion leaving two. Twice the phase battery has stopped on its
first gate over one, which is a two-minute answer to a two-second question.

## A round trip is the unit, not a second of machine time

**Iterate against the number, not against the gate.** A budget names the count it wants
in its own message, so `wc -l` answers the next attempt — in the same call as the edit,
costing nothing. One phase ran the whole documents check twenty-three times, ten of them
over a single page, to learn what one command tells it. `docs:check` takes under a
second, so the waste is never the machine: it is a round trip per attempt, and a round
trip carries the whole conversation with it. The same arithmetic decides every "just run
it again" in a phase.
