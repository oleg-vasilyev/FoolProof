# Delegating work, and what it costs

> Read before briefing any subagent, and before deciding not to. [Finishing a phase](SKILL.md) names which gates are delegated always — this says what a brief owes an agent, and what delegation does and does not buy.

Measured rather than assumed: one phase spent 493k tokens across six agents and saved
none. A cold agent re-reads the subject, the skill and the spec that are already in
your context, so delegation never buys tokens. It buys two things — room in your own
window, and wall-clock while you work on something disjoint.

**The review, the readings and the checkup are delegated always.** Their whole value
is that the reader did not write the thing: 89k tokens caught three things about to
ship, including a false sentence written earlier in the same phase by the same person
who then re-read it and approved it. Four phases in one night went four for four on
real bugs rather than style — a systemd unit that would have restarted the bot every
ten seconds forever when `.env.production` was missing, a measuring command in a skill
left broken by a signature change, a test that by construction could not fail, a false
`PLAN.md` claim about cross-chat queries, and a deploy that would have rolled
production back onto an older tag. You cannot review your own work by reading it again.

**Writing is delegated only above ten files, and only once the artifact those files
are written against has been generated and looked at.** That narrows an earlier rule
here — *an independent scope is delegated on sight* — and the narrowing is the
owner's, decided against this skill's own ledger after three phases in a row paid the
same rework. Below the threshold, doing it yourself is cheaper than briefing.

**A question is delegated at any size, and the threshold does not apply to it.** That
number weighs writing a brief against writing the code yourself; a read-only errand has
no such arithmetic, because the alternative is reading the files in your own window and
then carrying them for the rest of the phase. One brief sent cold to read the agent
files against each other cost 149k tokens in a single call and returned three defects
nothing else was looking for — a pointer to server details no README holds, a *known
asymmetry* in the deploy that had been fixed two commits earlier, and a gallery count
one short. Three conditions, every time: the question stands apart from what you are
doing, it is answerable by opening files rather than by holding this session's
reasoning, and you can say what the answer must contain — fail the last and you get an
essay. **The moment is not fixed.** A gate's waiting is where it is easiest to notice,
since the review reliably leaves five minutes with nothing to edit, but framing is
where it is worth most: an assumption checked before anything is built costs nothing
to act on.

**Neither threshold opens what was always closed.** Whatever is expensive to be
wrong about stays in your hands at any size — the mechanic a player will feel, a
cross-feature hazard, anything touching `shared/` or the schema. A twelve-file batch
across `shared/` is not delegable because it is twelve files; it is the case the count
was never about.

When a batch does go out, on `model: "sonnet"` because settled transcription is not
judgement:

- **The brief carries everything** — the exact files to write, the subject each spec
  tests, the stubs to use by name, the skill to load first — and tells the agent to
  run **only its own files**, or it spends a turn investigating your half-finished
  edits and deciding they are not its business.
- **State the property and the evidence, not the fix.** *Assert the actual words
  rather than the table reference* bought exactly that: English literals in a spec
  that drives one locale, killing the English mutants and leaving the Russian ones
  alive. The property wanted was "every counted noun has its three forms, in every
  language", and its home was the copy table's own spec, which already loops over
  both. Name the mutant that must die and let the cold agent find the home — it reads
  the tree without the answer already in mind, which is the whole reason to send it.
- **Never against a subject that is not settled, and a subject that draws something
  is not settled until you have looked at what it draws.** The `/personal` phase
  spawned four spec agents and first opened the rendered poster eleven minutes later;
  both corrections it then had to send were visible in the first PNG. For a subject
  that draws nothing: name the observation that would change your mind, and make it
  before briefing anybody. If you cannot name one, the design is settled.
- **Freeze the paths an agent was given.** A phase moved `render/*` into subfolders
  while an agent was writing specs against those very paths, and the agent spent its
  last turn on stale mocks.
- **Before parallelising, name the exclusive resource they share.** Disjoint files
  are not enough: agents share one working tree, and any tool that copies it, writes
  a fixed temp directory or a fixed report file can only be run by one of them at a
  time. Three writers were told to run Stryker, whose sandbox lives *inside* the
  repository — so one run copied another's half-written sandbox and died, and the
  brief needed two corrections mid-flight. Ask what each agent runs, and where that
  writes; anything exclusive stays with you and runs after they finish. The same hour
  produced the general form of the mistake twice more, a config flag and a threshold
  flag both invented rather than read: **a tool's behaviour you did not observe is a
  guess**, and `--help` costs a second.
- **Launch parallel agents in one message**, and do not block on one whose files are
  disjoint from yours. Their reports are not shown to the owner — relay what matters.
- **"Launched" is not "running".** A launch can return success and leave nothing
  behind: no task, an empty output file, no folder on disk. One designer failed that
  way and was reported to the owner as still thinking, thirteen minutes late. Follow
  a launch with a non-blocking status check, and tell an agent that produces files to
  create its output folder first, so progress is visible on disk instead of inferred.
- **Stalled twice means finished — but read the tree before redoing anything.** Take
  what landed, do the rest yourself, repair what it left half-edited; one phase lost
  twenty minutes and still hand-wrote five of twelve files, and another nearly
  rewrote seven specs the agent had in fact delivered ten minutes earlier.
- **Say what its report must carry, because a hand-briefed agent has no file to hold
  it.** The six named agents each declare a `What comes back`; this one is defined by
  the brief alone, and what a caller cannot reconstruct is **which files it actually
  wrote**, which it was given and did not, why, and anything it touched that the
  brief never named. Ask for that list in those words.
- **An agent that cannot do something says so instead of doing something adjacent.**
  Nothing propagates upward here: a report is text, a narrowed pass reads exactly
  like a completed one, and no gate is watching. Put it in the brief in those words.
- **A model that refuses or dies mid-run is the caller's problem, not the agent's.**
  Re-run the errand on another model and say in the phase's record which one — what
  may not be substituted is the property the agent was chosen for, which for every
  reading pass here is a context that did not write the thing.
- **What never leaves your hands:** copy, commit messages and document prose, because
  the voice is the product here, and anything resting on why-context this session
  accumulated — why a threshold is 7 and not 5 — which no brief can carry. The poster
  gallery is the exception that runs the other way: judging a drawing needs eyes that
  have not lived the phase, so it is delegated *because* it is judgement. What stays
  yours there is the conclusion — which reading is wrong, and what the line should say.
