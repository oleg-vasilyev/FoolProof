# What a skill holds, and what it must not

> Opened by [writing a document here](SKILL.md) when a skill is being written, when
> one has outgrown its budget, or before accepting a rewrite of one. A skill is read
> **whole** by the job that loads it, so every line in it is paid for by every run of
> that job — which is the whole reason there is a rule about what earns a line.

## The dividing question

**Could a competent reader work this out from the repository in front of them?** If
yes, it does not belong here: they will work it out, and the line will have cost
every future run of the job for nothing. If no, it belongs here and it stays in the
words it already has.

Almost everything that has cost this project a day fails that test in the same way —
it is a fact about somebody else's tool. A config format that silently replaces
rather than merges. A glob library that reads a character as a comment. A framework
whose middleware order decides whether a command is ever seen. A rasterizer that
draws a blank picture instead of failing. None of those is derivable from our code by
anyone, however good.

## A remedy is not a "how"

A skill should say what a finished piece of work has to be true of, and how each of
those is tested, rather than walking a reader through steps they could choose for
themselves. That is the general shape, and it has one hard edge.

**When a sentence answers *what do I do so this does not happen again*, and the answer
is not visible in the code, it is not a step — it is the whole value.** It stays.

This was measured. A rewrite of `add-a-feature` under "describe the outcome, not the
how" named both of this project's silent lint-zone failures and compressed their two
fixes into *both are fixed in how the config is generated*. The symptom survived and
the remedy did not, so a reader learns what bit us and not what to do the next time
that config is regenerated. **A sentence saying a trap was fixed, without saying what
the fix was, is worse than saying nothing** — silence leaves a reader curious, and
that sentence tells them not to look.

The same rewrite kept *the visual language lives in the committed PNGs* and dropped
what the pictures actually show. **What tells a reader what to look for is content,
not decoration**: without it, opening the picture shows them a picture rather than a
grammar.

**Where the outcome alone invites a shortcut, the procedure stays too.** *The zone
must be shown to fire* is an outcome; without *write a violation, run the linter,
watch it fail, delete it* the natural move is to assume it fires, which is how the
silent zones `add-a-feature` records got shipped.

## Two reasons to cut, and they must not be blurred

Everything removed goes for one of two reasons, and they carry different risk.

- **It is already somewhere else** — in a file the reader has open anyway, in a type,
  in a config, or in a machine that fails on it as the file is saved. Cutting it is a
  pure win, and it enforces the standing rule against a second copy rather than
  proposing anything new.
- **You judged the reader could rederive it.** This is the risky one, and it owes the
  name of what they would have to read.

Blur the two and the exercise looks better than it was. The `add-a-feature` rewrite
saved seventy-five lines, and its single largest cut was a directory tree already
standing in `CLAUDE.md` — a pure win owing nothing to the principle, which it
flattered by association.

**An enforcement claim is checked, not assumed.** Auditing `write-a-spec` turned up
`project/named-numbers` sitting in an `eslint.config.js` block that ignores
`*.spec.ts`, so *name every number* in a spec is held by prose alone while the rule
beside it is deliberately extended to specs. A line cut as *the lint has this* would
have taken a live rule with it.

**Nor is a count read in an audit's own report a count.** Three went out wrong in the
session that produced this page — an integration-spec tally of two where there were
seven, twelve skills and agents where there were seventeen, a rewrite reported at 98
lines that was 91. Every one came from a summary rather than from the file, and every
one was wrong in the direction that made the story better. Run the count yourself
before repeating it, and that goes double for a number an audit produced about its
own work.

**Running it yourself is not enough either.** The fourth was mine: a `grep` for
`import(` counted `typeof import("…")` as well — a *type*, not an import — and put 129
files into a document where 102 do it. A count is only as narrow as the pattern behind
it, so before quoting what a pattern found, say what it excludes and check that it does.

## Two things that worked

- **Point at a neighbour rather than describing a shape.** *Build by imitating a
  feature of a similar shape — `live-game` for a screen driven by taps, `scoresheet`
  for one that draws* replaced twelve lines of directory tree, and cannot go stale.
- **Lead with the mechanical test.** Where a property can be checked by running
  something, the check belongs beside the property and usually replaces the paragraph
  about how to satisfy it. The reference is the deletion probe `add-a-feature` opens
  with — a property nobody has to be trusted about.

## What the yield depends on

Not on the skill's length — on what it is made of. The same exercise took
`add-a-feature` from 166 lines to 91 and `write-a-spec` from 394 to 378, because the
first was largely duplication and procedure and the second was almost entirely
remedies. **Shorter is a side effect and never a target**: the pass that kept every
remedy and saved sixteen lines beat the one that saved seventy-five and lost six.

So the product of auditing a skill is the **inventory**, not the rewrite — a row per
rule saying whether it is enforced, duplicated or load-bearing. The rewrite is
adopted only when it is a net win, and never on its own account of itself. What that
inventory must contain, and how the audit is run, is the `skill-auditor` agent's.
