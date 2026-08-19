---
name: write-a-doc
description: Decide which FoolProof document a fact belongs in, and how to add it without duplicating what another file already says. Use before editing README.md, PLAN.md, CLAUDE.md, TECH-DEBT.md or any folder README, whenever a rule changes wording anywhere, and at the end of a phase that changed behaviour.
---

# Writing a document here

> **Stage 6** of [how a change becomes a release](../../../DEVELOPMENT-FLOW.md).

The five documents have been de-duplicated **twice**. Both times the cause was the
same: a phase had twenty facts to record, the dividing question is applied to one
fact at a time, and when a fact seems to fit two files the safe-feeling move is to
write it in both. It is not safe. It creates two things that must be changed
together, and one of them will not be.

So the rule is mechanical, not tasteful: **one fact, one home, and every other file
links to it with an anchor.** A summary of what another document says in full is
duplication wearing a hat.

## Which home

Route by what *kind* of fact it is, not by which document you happen to be editing:

| The fact is | Home | The test |
|---|---|---|
| What a person types, sees, or has to do to run the bot | `README.md` | somebody who will never read the code needs it |
| What the bot must do — a state, a refusal, a limit, a schema decision, a measured number | `PLAN.md` | it would survive a rewrite in another language |
| How code here must be written | `CLAUDE.md` | a violation is possible in a file nobody is currently thinking about |
| A procedure with an obvious trigger — adding X, closing Y | a **skill** | you would know to ask for it by name |
| Rules for a folder that could be deleted as a unit | a `README.md` **inside that folder** | it leaves with the folder |
| Something deliberately unfinished, plus the trigger to pick it up | `TECH-DEBT.md` | it names a trigger, not a wish |
| Why a non-obvious line of configuration exists | a comment **in that config file** | config files are exempt from the no-comments rule |
| The story that explains a rule | one sentence beside the rule; the long version in the skill or `PLAN.md` | it is told once |

Two consequences worth spelling out, because both have been got wrong:

- **A lesson learned in a phase does not automatically belong in `CLAUDE.md`.** If it
  only matters while doing one job, it belongs in that job's skill. `CLAUDE.md` is
  loaded before every session, so a paragraph there is paid for by every session
  that never needed it.
- **A rule about `e2e/` goes in `e2e/README.md`**, not in a skill and not in
  `CLAUDE.md`: the folder is meant to be deletable, and documentation that outlives
  its subject is worse than none.

## The four steps, in order

1. **Search before writing.** Grep the other documents for the nouns in what you are
   about to add. If it is already there, link to it — `[what it costs](PLAN.md#what-survives-a-failure)`
   — and write nothing.
2. **Search for what it makes false.** A new feature usually contradicts a sentence
   written before it existed. Deleting that sentence is part of the change, not
   cleanup for later. `/merge` shipped while three places still said merging was
   manual, and one of them was an invariant.

   **Narrowing a rule is the hard case, and it needs the opposite search: grep for
   the rule's *old* wording, not its new one.** The new phrasing exists only where
   you have already been, so searching for it finds exactly the places that need no
   work. A phase narrowed "a feature with an inline keyboard gets scenarios" to
   "a keyboard whose buttons carry `callback_data`", changed it in two files, and
   left it stale in three — including `write-an-e2e-scenario`, the skill that owns
   the judgement, so the document a reader would consult gave the wrong answer.
   `docs:check` cannot see this: a rule restated in prose is not a link.

   **Grep the frontmatter too, and grep it first.** A skill's `description:` is not
   documentation about the skill — it is the trigger that decides whether the skill
   is loaded at all, so a stale one is worse than stale prose: nobody reads the
   corrected body because nothing opens the file. This rule was written, and one
   commit later the same phase moved when `finish-phase` applies, updated the
   routing table and a memory note, and left the skill's own description saying
   "use when a phase is being wrapped up" — the one copy that decides whether any
   of the others are ever seen.
3. **Write it once, in the home the table names.** If you find yourself explaining
   the same thing in a second file "briefly", stop: that is the duplication being
   born. A link is shorter and cannot drift.
4. **Run `npm run docs:check`.** It is the gate that catches most of what this file
   asks for, and it grows — the schema and the poster mockups joined it after this
   list was first written. What it checks is enumerated once, in `CLAUDE.md`; do not
   re-list it here. Read the complaint rather than guessing which check fired.

## The script table in `README.md`

`docs:check` compares that table against `package.json`, so the two cannot drift —
but three things about it are judgement, and they arrived here from `CLAUDE.md`
when a new rule pushed that file over its budget:

- **Never put comment keys (`"// …": "…"`) in `package.json`.** The script name has
  to say what it does; a comment beside it is an admission that it does not.
- **Keep the table short.** It is the first thing a new reader sees, and a reader
  who has to scan twenty rows to find `npm start` has been told the project is
  complicated before learning anything about it.
- **Anything occasional goes behind `scripts/tools.ts`**, which lists itself when
  run with no argument, so a one-off never earns a permanent row.

## When the document argues for something you want

A rule needs a reason, the reason is usually a story this project already paid
for, and the story is written down somewhere else — so **re-read it before citing
it**. Writing prose in favour of a change you are making is the one moment the
author is not a neutral witness, and the drift is always in the same direction:
the evidence comes out slightly stronger than the source says.

This has happened, in the phase that added an adversarial reviewer of all places.
The paragraph justifying it claimed a defect had slipped past *every* gate; the
story it cited, thirty lines below in the same file, says the reviewer caught it.
The review found it in the diff. Nobody would have found it in the released prose,
because a reason nobody checks reads exactly like a reason that holds.

## The budget is the point

`CLAUDE.md` has a **line budget**, enforced by `docs:check`. It exists so that adding
to it costs something: when a new rule pushes the file over, the fix is to move an
old paragraph into the skill where it belongs, not to raise the number. Raising it is
allowed exactly once per argument that the whole file is needed before every session
— and that argument has lost twice.

## What overlap is allowed

Exactly one thing may be said in two places, and it is deliberate: **`README.md`
must be readable without opening another file.** So the product's central constraint
— input happens on a Friday evening, on a phone, one-handed, so the whole product is
a keyboard — appears both as the README's opening and as `PLAN.md`'s design
constraint. Stripping it from the README was considered and rejected: a visitor
would then have to open the spec to learn why the bot looks the way it does.

Everything else that appears twice is a bug in the documentation.
