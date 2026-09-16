# The case study, as facts

The structure of `docs/case-study/index.html` and `docs/ru/case-study/index.html`, and
what each block of text on them is there to say. The page retells the repository's git
history — 314 commits over six and a half weeks — and every claim on it was
fact-checked against git, so a block's facts are read from that history, never
improved on. A page is written from this file, never from the other language's page:
the writer gets a block's facts and says them the way a reader of that language would.
`node scripts/gates/gate-runner.ts docs-check` holds both pages to this tree — same
blocks, same order, same numbers, same commits.

A `##` heading is a section, a `###` heading a block, and the block's id on the page
is `section.block` in a `data-block` attribute. Under a block, bullets are the facts
it must carry. `numbers:` lists every number its text may print in both languages;
`numbers-en:` or `numbers-ru:` a number only that language prints as digits, where the
other spells it as a word (*era 2* against *во второй эпохе*); `commits:` every
hash it may cite in an `<a class="hash">` link; and `rev:` climbs when a fact changes
so the pages go red until rewritten. A block is one paragraph unless it says
`granularity: section`. The strings the charts draw with live in `<script>` and are
not held here.

## header

### skip
- The link a keyboard user takes past the header to the content.

### brand
- The product name, beside the icon.

### nav-eras
- Leads to the seven eras.

### nav-patterns
- Leads to the section on what kept coming back.

### nav-today
- Leads to the section on the harness today.

### nav-source
- Leads to the source on GitHub.

### lang-current
- The two-letter code of the language this page is in.

### lang-en
- The English page, named in English.

### lang-ru
- The Russian page, named in Russian.

### bot
- Leads to the landing page, the one about the bot itself.

## hero

### eyebrow
- A case study, spanning 28 July to 11 September 2026, over 314 commits.
numbers: 28, 11, 2026, 314

### title
- The one line the page is about: the harness that learned to check itself.

### lead
- FoolProof is a small Telegram bot that keeps score at Durak; one person, working with Claude Code, built it in six and a half weeks.
- The bot is the least interesting part: around it grew a set of rules, checks, skills and agents that decide how the next line of code gets written, and that set was rewritten more often than the bot.
- This is the story of that set: what broke, what replaced it, and what it looks like today.

### note
- Every claim comes from the commit history, every number is read from git, and every hash links to its commit.

### tile-1-value
- The count of commits.
numbers: 314

### tile-1-label
- Commits, by one author.

### tile-2-value
- The count of days.
numbers: 46

### tile-2-label
- Days, from 28 July to 11 September.
numbers: 28, 11

### tile-3-value
- The count of releases.
numbers: 40

### tile-3-label
- Releases tagged.

### tile-4-value
- Tests, from none to the final count.
numbers: 0, 5043

### tile-4-label
- Tests, by the last commit message that counted them.

### tile-5-value
- Skills plus agents.
numbers: 11, 7

### tile-5-label
- Skills and agents at the end.

## findings

### eyebrow
- What comes before the detail.

### title
- What the history says, in five findings.

### lead
- Each finding is drawn from the chapters below and points at the commit that states it; a reader short of time reads only these.
- Then pick an era: the second is where a rule was found dead, the fifth where the readers arrive, the seventh where the harness got a ruler.
numbers-en: 2, 5, 7

### f1-n
- The first finding's number.
numbers: 01

### f1-title
- The harness is over two thirds the size of the product.

### f1-body
- At the last commit the bot's source is 15829 lines without its tests; the skills, agents, documents and document checks that decide how the next line gets written are 11332.
- That side was rewritten more often than the bot was.
numbers: 15829, 11332

### f2-n
- The second finding's number.
numbers: 02

### f2-title
- Acceptance cannot tell models apart; the process can.

### f2-body
- Every model dropped cold into the benchmark's fenced clone passed the hidden spec and left every gate green.
- Only the process columns separated them: eight of eleven obligations for a dollar and six minutes, against eleven of eleven for twenty-two dollars and thirty-six minutes.
commits: a05104e

### f3-n
- The third finding's number.
numbers: 03

### f3-title
- The agent is the harness's only user, and for six weeks nothing was built that way.

### f3-body
- The scripts were shaped for a person at a terminal; a count over a month of transcripts found 1463 hand-typed test runs whose verdicts the model read through a grep on a stream.
- Then package.json went from twenty-three scripts to eight, and every gate started leaving its verdict in a file.
numbers: 1463
commits: af08fc5, d49d590

### f4-n
- The fourth finding's number.
numbers: 04

### f4-title
- A rule counts only once it has been seen refusing.

### f4-body
- A lint rule was found dead four times in one day; three documentation checks stayed green under sabotage.
- In the phase that finally made the deliberate break a step of the flow, fourteen such breaks were made and four hit nothing the rule watched.
commits: 5d48dac

### f5-n
- The fifth finding's number.
numbers: 05

### f5-title
- The author is the wrong reader, and this page is no exception.

### f5-body
- Every diff is reviewed by an agent that did not write it, every picture read by one that does not know what it is for.
- A fact-checker re-deriving this page's claims from git found 17 of 263 that the history did not support, and every one of them read perfectly.
numbers: 17, 263
commits: 5bf13e4

## timeline

### eyebrow
- Every commit, in order.

### title
- Forty-six days on one strip.

### lead
- One bar per commit, coloured by era; a diamond above a bar is a release tag; of the forty-six days, thirty-one have commits.
- The seven eras are this page's division, not the repository's: the lines fall where the subject of the work changed.
- Hover or tap a bar to read the commit; click an era name to jump to its chapter.

## harness

### eyebrow
- Terms.

### title
- What "the harness" means on this page.

### lead
- The harness is everything in the repository that is not the product.

### terms-summary
- Opens the list of ten words this page uses in the project's own sense.

### term-1-title
- CLAUDE.md.

### term-1-body
- The rules loaded before every session: style, layering, testing, gates.

### term-2-title
- Skills.

### term-2-body
- Procedures loaded for one kind of job: writing a spec (the test file of one module), adding a feature, finishing a phase.

### term-3-title
- Agents.

### term-3-body
- Separate model instances with a brief and a contract: a reviewer, a designer, and cold readers, who are deliberately not told what they are looking at.

### term-4-title
- Hooks.

### term-4-body
- Scripts that fire on an edit or at the end of a turn, a turn being one reply from the model.

### term-5-title
- Lint rules and gates.

### term-5-body
- What a machine refuses, and what must be green before a commit or a tag.

### term-6-title
- Documents.

### term-6-body
- The spec, the debt list, the flow drawing, the logbook, and the check that holds all of them against the code.

### terms-more
- Four more words recur in the project's sense: the owner is the one person who sets the tasks and makes the decisions; the other side of the conversation is the model, and one of its replies is a turn.
- A phase is any bounded list of changes, feature or not, that ends at a commit or a tag; a gate is a check a phase must pass on the way.

### question
- The question the history keeps asking: where a rule belongs, in the text the model reads or in the toolchain (the lint, the hooks and the checks a machine runs).
- The first answer was given on 29 July and never changed: prose is for judgement, anything else belongs in the toolchain.
- Everything that follows is the story of that answer being tested.
numbers: 29
commits: e88417a

## era-1

### band-era
- The first era of seven.
numbers: 1, 7

### band-dates
- 28 to 29 July.
numbers: 28, 29

### band-commits
- Commits 1 to 30.
numbers: 1, 30

### title
- Two Markdown files.

### lead
- The repository begins with no code, only a rulebook that already forbids the things the project would spend the next month learning how to enforce; the one thing it did not have was a check.
- By the end of the second day three of its paragraphs had become ESLint rules, the code had layers that may not import each other, and Stryker was grading the tests by planting deliberate breaks, 88.4% caught on the first run.
- One rule from those two days outlived everything: a fact lives where its reason lives, and the other document gets a pointer, never a retelling.
numbers: 88, 4
commits: 44f6f66

### d1-summary
- Tests arrive, and then a grader for the tests; the count is 312 tests.
numbers: 312

### d1-p1
- On 29 July the code got 312 tests in fourteen files and a coverage gate at 70%.
- The same day it got Stryker, a mutation-testing tool: each small deliberate break it plants is a mutant, and it counts how many the tests noticed.
numbers: 29, 312, 70
commits: 9276ad7

### d1-p2
- The first run scored 88.4%, the project's first mutation score; by the end of the era it had reached 94.78%.
- The line below which the gate fails was raised from 60 to 85 in those days, so the gate bites on a regression rather than hanging there for show.
numbers: 88, 4, 94, 78, 60, 85
commits: fda82cb, 508de4e

### d1-p3
- The investment paid back at once: mutation testing found tests that passed for the wrong reason, a dependency replaced by a stub with the test checking only that the stub was called.
- Stryker stayed with the project for the rest of the history.

### d2-summary
- The rules move out of prose; the count is 3 lint rules.
numbers: 3

### d2-p1
- Commit 26, "make the checkable conventions checkable", set the shape of the harness: three rules (no comments, named numbers, blank lines after imports) written straight into the config.
- The code was split into layers (shared code, game logic, rendering, Telegram handlers) and the layers became zones of banned imports, each proved with a deliberate violation.
- A hook on every edit started linting each file as it was written.
numbers: 26
commits: e88417a

### d2-p2
- The same commit brought the first two skills and the first agent: finish-phase, where the gates moved out of CLAUDE.md; add-repository-method, for new queries; and phase-reviewer, which reads a whole diff and is told not to fix anything.

### d2-p3
- The rule about where a fact lives was written when four subjects turned up in both PLAN.md and CLAUDE.md.
- The question: would this still be true if the bot were rewritten in Python? If yes, PLAN.md; if no, CLAUDE.md.
commits: 0afd7b2

### d2-p4
- By the end of 29 July the testing craft had outgrown the rulebook and became the third skill, write-a-spec, and the tests stood at 418.
- CLAUDE.md had nearly doubled in two days and was cut back, on the grounds that it is loaded on every turn and should hold only what is true while writing any line of code; it would not stay inside those bounds.
numbers: 29, 418
commits: 66ff3bd

### tile-1-value
- The count of skills.
numbers: 3

### tile-1-label
- Skills.

### tile-2-value
- The count of agents.
numbers: 1

### tile-2-label
- Agents.

### tile-3-value
- The count of hooks.
numbers: 2

### tile-3-label
- Hooks.

### tile-4-value
- The count of project lint rules.
numbers: 3

### tile-4-label
- Project lint rules.

### tile-5-value
- The count of tests.
numbers: 418

### tile-5-label
- Tests.

### tile-6-value
- The mutation score.
numbers: 94, 78

### tile-6-label
- Mutation score.

### tn-eyebrow
- Then and now: the no-comments rule.

### tn-lead
- The first tab is the header of the lint config as it stood in the repository, admitting the no-comments rule cannot be checked by a machine; the second is the same rule once it became an ESLint rule, retold.

### tn-tab-1
- Commit 3, on 28 July.
numbers: 3, 28

### tn-tab-2
- Commit 26, on 29 July.
numbers: 26, 29

### tn-body-1
- The lint config header as committed, in English: the rules back CLAUDE.md, are kept small and autofix-friendly, and the no-comments rule has no ESLint equivalent and stays a review convention.

### tn-body-2
- project/no-comments is an inline ESLint rule of twelve lines, run by the lint-changed hook on every Edit or Write, so a comment is refused at the edit rather than at the end of the turn.

### tn-note
- The header of eslint.config.js at the first commit cited, and what replaced it at the second.
commits: 2db720c, e88417a

## era-2

### band-era
- The second era of seven.
numbers: 2, 7

### band-dates
- 30 July to 2 August.
numbers: 30, 2

### band-commits
- Commits 31 to 66.
numbers: 31, 66

### title
- Features you can delete, and rules that prove they fire.

### lead
- Era 1 made the rules checkable; era 2 found out that a checkable rule can be dead and nothing tells you: on 30 July four commits kept finding the same feature-independence rule dead, three versions of it and two exemptions beside it.
- The answer was a habit that outlived the era: a new zone is not finished until a deliberate violation has been shown to fail the lint.
- The same era gave the project a fake Telegram, a debt list where an entry names a trigger rather than a wish, and the documents gate that would grow into thirty families of checks.
numbers: 30
numbers-en: 1, 2

### d1-summary
- A rule found dead, four times in one day; the count is 13 violations.
numbers: 13

### d1-p1
- The era starts by turning the source tree inside out: instead of layers at the top (game, render, bot), each feature became a folder with those layers inside it, and the rule was stated as a test, a feature is a folder you can delete, verified by deleting one.
- Every import came to be written from the root through a hash-sign alias, so an import from another feature shows in the line itself, which a relative path never does.
commits: 476f239

### d1-p2
- Fencing features off with lint produced the lesson the project would repeat most often: the rule was written, enabled and green, and did not work.
- The first two versions did nothing (a path pattern never matched a relative import, then two config blocks silently replaced each other); the third was killed by the pattern library reading the hash-sign aliases as comments.
commits: 476f239, 40d8179

### d1-p3
- The remaining two of the four commits found exemptions dead outside the zones: the logger had moved and its exemption pointed at a file that no longer existed, and a Stryker exclusion was orphaned the same way, so the score fell.
commits: 4d6b389, f749a9c

### d1-p4
- Thirteen deliberate violations were run to prove one commit.

### q1
- The quotation: a rule that fires and a rule that is dead look identical from the outside; from the commit cited, 30 July.
numbers: 749, 9, 30

### d2-summary
- A fake Telegram; the count is 7 known faults.
numbers: 7

### d2-p1
- By 31 July the bot could retry, restart itself and report on its own state; then it got e2e, a fake Bot API server and scenarios that play a whole evening against the bot, tap by tap; one scenario file is one evening with several cases inside.
- The rules for the fake: it only records what it is sent, never decides anything itself, and must refuse everything the real one refuses.
numbers: 31, 2
commits: 3ab3c9c

### d2-p2
- e2e worked but was not yet a gate; its seven known faults were written into a new file, TECH-DEBT.md, with a rule for the file: an entry names a trigger, not a wish, where a trigger is the event after which the debt has to be paid.
numbers: 2
commits: 0505b9b

### d2-p3
- e2e earned its keep seventy minutes later: a new screen with buttons was given a narrow obligation, a feature with an inline keyboard gets scenarios, and the scenarios caught two wrong assumptions of the model's own, which it wrote into the commit message.
- e2e becomes a gate in era 3.
numbers: 2, 2
numbers-en: 3
commits: aea4238

### d3-summary
- The cost of a gate; the count is 63 seconds.
numbers: 63

### d3-p1
- The project learned what a gate costs on that same screen: an hour and most of a model budget, eight Stryker invocations where two would have done; a model budget is the text the model can read and write in one session.
- The answer was a mode that mutates only the changed files: 63 seconds instead of four and a half minutes.
numbers: 63
commits: 66564c9

### d3-p2
- Two rules came with it and stayed: never re-run a gate to re-read its output, and one round of survivor-killing per phase, survivors being the mutants no test caught, killed by writing the missing tests.

### d4-summary
- The rulebook overflows; the count is 585 lines.
numbers: 585

### d4-p1
- CLAUDE.md had been the default place to append every lesson and reached 585 lines; it was cut to 354 by moving rather than deleting, the e2e rules to their own README and the layering procedure to a new add-a-feature skill.
numbers: 585, 354, 2
commits: 4a3d0a9

### d4-p2
- Then the commit "make the documents check themselves" observed the documents had been de-duplicated twice and concluded the fault was that nobody checked the rule; it added the documents gate this story calls docs:check, the name it carried until September (docs-check today).
- At first it checked links, the README tree against the folders, the script table against package.json, and a 380-line budget on CLAUDE.md; its first run found two undocumented scripts.
- By the end of the story it holds more than thirty groups of checks, each about one subject, which this page calls a family.
numbers: 380
commits: 29fe4d5

### d5-summary
- A lesson left in the chat is gone; the count is 5 questions.
numbers: 5

### d5-p1
- The era ends with the retrospective, and its first attempt failed: it was hung on compaction (when a conversation stops fitting in the model's memory it is squeezed to a summary), with a hook asking five questions first, about rework, repeated commands, subagents, sequencing and re-reading.
- It was deleted the same day: a compaction hook cannot return a word into the conversation, so it failed on every compaction, and compaction was the worst moment available anyway.
commits: ec3d818

### d5-p2
- The retrospective became a gate, the fifth in order and at the time the last, and a skill of its own.
- Its first outputs replaced the delegation policy with a narrower rule the owner overrules in era 4: delegate only when your own context is scarce.
numbers-en: 4
commits: ecc6395

### next
- This era learned to prove that a rule fires; the next one finds a hole in a proven rule too.

### tile-1-value
- The count of skills.
numbers: 6

### tile-1-label
- Skills.

### tile-2-value
- The count of agents.
numbers: 1

### tile-2-label
- Agents.

### tile-3-value
- CLAUDE.md's lines, against its budget.
numbers: 370, 380

### tile-3-label
- CLAUDE.md lines against its budget.

### tile-4-value
- The count of tests.
numbers: 1367

### tile-4-label
- Tests.

### tile-5-value
- The count of e2e cases.
numbers: 82

### tile-5-label
- e2e cases.
numbers: 2

### tile-6-value
- The approximate mutation score.
numbers: 97, 5

### tile-6-label
- Mutation score.

### chart-title
- The rulebook under a budget.

### chart-sub
- Lines in CLAUDE.md at every commit; the line at 380 is the budget docs:check has enforced since commit 50.
numbers: 380, 50

### chart-table
- Opens the chart as a table.

## era-3

### band-era
- The third era of seven.
numbers: 3, 7

### band-dates
- 5 to 7 August.
numbers: 5, 7

### band-commits
- Commits 67 to 121.
numbers: 67, 121

### title
- Scenarios become a gate, states become tables.

### lead
- In this era a lint rule caught the model that had written it, and two gates were found green for as long as they had existed, both by accident: three days in which the checks started reading the code as well as the documents.
- A rule banning game states written as bare strings caught five real ones by being installed, then a spec written by the same model, then a fourth spelling nobody had thought of.
- The release of 1.7.0 says two gates were found lying on the way, both by accident and both for as long as they had existed: one waited 600 ms for a picture that had grown slower, the other could not read a checkout with Windows line endings, which a fresh clone gets.
numbers: 1, 7, 0, 600
commits: 4422ddb

### d1-summary
- e2e becomes a gate; the count is 6 gates.
numbers: 2, 6

### d1-p1
- e2e still had seven recorded problems; six were closed in one commit.
numbers: 2

### d1-p2
- Before they could be a gate the scenarios had to be taught to end the way a real evening ends; the bot's message holding the current game with its buttons is the card, and eight of sixteen scenarios broke off mid-card, which e2e now fails.
numbers: 2

### d1-p3
- The gate plays only the scenarios the diff can reach: for a phase inside one feature usually two or three files and about fifteen seconds.
- From that commit the phase ends with six gates in a fixed order, e2e fourth: lint and types, coverage, mutation over the diff, e2e over the diff, the review, the retrospective; over the diff means over the files the phase changed.
numbers: 2, 2
numbers-en: 2
commits: 52c0f73

### d1-p4
- Writing a scenario got its own skill, for a reason about what makes a skill open: the model opens one when its description matches what it is doing right now.
- CLAUDE.md said to read the README on touching the scenario folder, and a phase edited a scenario without opening it because that felt like adding a case; the skill now surfaces on editing a scenario file.
- The same lesson returns in era 4 and costs more.
numbers: 2
numbers-en: 4
commits: a0fcb61

### d2-summary
- The rule that caught its own author; the count is 5 more sites.
numbers: 5

### d2-p1
- Every string the code used as a name for a game phase, a button press, an outcome or a refusal moved into a table per feature, and a lint rule banned writing such a name as a string anywhere else.
commits: 3c0b283

### d2-p2
- Specs were exempt at first; three commits later the review found a spec comparing a state against a bare string, added after the rule existed by the same model that wrote the rule.
- The rule was extended to specs and along the way caught five more sites in the production code.
commits: a89a991

### d2-p3
- A release review then found a function still returning a game state as a string: the rule knew three shapes and a returned value was a fourth.
- Hence one more step in the ritual from era 2: once a rule is shown to fire, search the whole tree once for the shapes it cannot reach, because a lint rule catches the syntax somebody thought of.
numbers-en: 2
commits: dc2602c

### d3-summary
- docs:check learns to read the code; the count is 3 palettes.
numbers: 3

### d3-p1
- The documents gate grew from links and budgets into a truth-checker, one family at a time, each added after something had been found wrong.

### d3-p2
- One family checks the database schema, the SQL in PLAN.md against the SQL the bot runs; it arrived after a schema recreated from the document failed the first command, the database refusing a record with a required field missing.
commits: a24c0d4

### d3-p3
- Another redraws the posters and compares them with the committed ones, so one changed colour code makes the gate red; it arrived after the posters were compared with their design mockup and three palettes, two font families and two widths were found in play, with no document saying which was right.
commits: 73b4f3a

### d4-summary
- Two gates found lying; the count is 5 of 17 scenarios.
numbers: 5, 17

### d4-p1
- Both were green by luck: the first was the e2e quiet window, the pause before a scenario reads the screen; the usual poster render grew from 460 to 540 ms, the headroom shrank to 60 ms, and five of seventeen scenarios went red on a working bot.
- It looked like flakiness and was measured instead of waved off: the window was doubled.
numbers: 2, 460, 540, 60
commits: 2e7c639

### d4-p2
- The second was the documents gate, which could not read a checkout whose files carried CRLF; the author's copy happened to hold Unix endings, so it was green, and on a fresh clone it would have gone red on a tree where nothing was wrong.
commits: 6ddd56e

### next
- Two unrelated things happen in the next era: the bot leaves the laptop for a server, and the first gate no machine can answer appears.

### tile-1-value
- The count of skills.
numbers: 8

### tile-1-label
- Skills.

### tile-2-value
- The count of project lint rules.
numbers: 5

### tile-2-label
- Project lint rules.

### tile-3-value
- The count of gates.
numbers: 6

### tile-3-label
- Gates.

### tile-4-value
- The count of tests.
numbers: 1976

### tile-4-label
- Tests.

### tile-5-value
- The count of e2e cases.
numbers: 142

### tile-5-label
- e2e cases.
numbers: 2

### tile-6-value
- The mutation score over one poster's redesign.
numbers: 98, 96

### tile-6-label
- Mutation over the ten files one poster's redesign touched.

### chart-1-title
- Tests, as the commit messages count them.

### chart-1-sub
- The test count a phase-final commit reports; gaps are commits that did not report one.

### chart-1-table
- Opens the chart as a table.

### chart-2-title
- The mutation score, as reported.

### chart-2-sub
- Whole-tree or diff scores from commit messages; the line at 85 is the break threshold since commit 20.
numbers: 85, 20

### chart-2-table
- Opens the chart as a table.

## era-4

### band-era
- The fourth era of seven.
numbers: 4, 7

### band-dates
- 11 to 14 August.
numbers: 11, 14

### band-commits
- Commits 122 to 184.
numbers: 122, 184

### title
- The bot leaves the laptop.

### lead
- Sixty-three commits in four days brought the first gate no machine can answer: a poster is a picture and no test reads one; its first run caught two holes in the award rules and a line of text leaving the card, and the brief that made it work was specific claims, not a verdict.
- The bot left the laptop for a server that pulls the newest tag every five minutes and waits for nobody, which forces the order of every check after it.
- One phase ran six gates and released without the seventh, because the skill holding the gates never opened.

### d1-summary
- The gate a machine cannot answer; the count is 9 evenings.
numbers: 9

### d1-p1
- The gallery gate takes nine awkward evenings and draws both posters for them, the chronology and the awards; it came in fifth, and the gates became seven.
- The two holes were in the rules by which the bot hands out awards, captions like THE COMEBACK; two days later the gate was moved after the review, because a picture checked at gate five could be stale by gate six.
- Who should look at the picture is settled only in era 5.
numbers-en: 5
commits: ce3c70c, 743adaa

### q1
- The quotation: "looked, fine" is the green light with nothing behind it; from the commit cited, 11 August.
numbers: 3, 70, 11

### d2-summary
- Delegation becomes the rule; the count is 3 conditions.
numbers: 3

### d2-p1
- The era-2 rule, delegate only when context is scarce, was overruled by the owner: an independent scope goes to a subagent at once when the work touches no file the model has open, the brief fits one message, and only the result matters; the review became always the phase-reviewer subagent, never a re-read.
- The retrospective was told to count how many such scopes were delegated and how many were not, because a new default fails by quietly not being used.
numbers-en: 2
commits: 0352b2b

### d2-p2
- A later commit added the reviewer's limit: it reads the diff and runs nothing, so a green review of a shell script, a systemd unit or a workflow is half a gate; all three are files only a run can check.
commits: 6a4c252

### d3-summary
- Three checks, by what is at stake; the count is 3 checks.
numbers: 3

### d3-p1
- The server pulls the newest tag every five minutes; nothing pushes to it.
- The single check split into three: before a push, lint, types and the documents, run by CI because a push changes the website and the documents, not the bot; at the end of a phase, the four machine gates as one command; before a tag, the full battery of coverage, every mutant, every scenario.
commits: cfd02a1, f58e793

### d3-p2
- The battery sits in a git hook on the developer's machine and runs before the tag leaves for GitHub; a red CI after that stops nothing and can only report a broken bot already on the server.
commits: 3b22b7c

### d4-summary
- The flow gets drawn, and the drawing gets hooks; the count is 8 stages.
numbers: 8

### d4-p1
- The whole development loop was drawn as a sequence diagram in DEVELOPMENT-FLOW.md.
- Today it has eight stages: framing the task and the mockup, code and tests, the machine gates, a review by an agent that did not write the diff, reading the sentences and syncing the pictures, the retrospective, the release, and the checkup.
commits: edc1148

### d4-p2
- It is the owner's drawing: it may not be changed quietly, and permission may not be asked for either, so the rule is to move the step and report it in the closing message with counts.
- Three things watch it: a hook stating the obligation on edit, a commit-message check refusing a moved step without a reason, and docs:check failing if the drawing names a skill or script that does not exist.
commits: 5eb6933, 912be9b

### d5-summary
- Nothing audits the auditors; the count is 13 findings.
numbers: 13

### d5-p1
- The deep-checkup agent was written to run weekly, believe nothing on say-so, fix nothing, and return a report where every verdict cites a command and its output.
- Its first run took 33 minutes and produced thirteen findings, the highest being that no backup existed and no restore had been rehearsed; a verified daily backup followed and the other twelve closed in one commit.
numbers: 33
commits: 4e56b66, 0ba2815

### d6-summary
- The retrospective that was skipped; the count is 27 rows.
numbers: 27

### d6-p1
- There were seven gates and the retrospective stood seventh; the first explanation blamed the release feeling like the end, and the next commit corrected it at the owner's word: the phase worked from the checkup's findings register, 27 rows, none of them a gate, and the empty list read as a finished phase.
- The fix was a change in what makes a skill open: every description was checked and a third rewritten to name the task the skill is needed on, because a description is the trigger that decides whether the skill is opened at all.
- docs:check began failing when a skill or agent is named nowhere in CLAUDE.md; era 3 had met the lesson on the scenarios, here it cost a skipped gate.
numbers: 27
numbers-en: 3
commits: 6799bd8, fdab9be, f6f617b

### next
- In the next era the harness gains readers who are told nothing on purpose, and every agent a contract for what it must be told and return.

### tile-1-value
- The count of skills.
numbers: 10

### tile-1-label
- Skills.

### tile-2-value
- The count of agents.
numbers: 2

### tile-2-label
- Agents.

### tile-3-value
- Claude hooks plus git hooks.
numbers: 3, 2

### tile-3-label
- Claude hooks and git hooks.

### tile-4-value
- The count of gates.
numbers: 7

### tile-4-label
- Gates.

### tile-5-value
- The count of docs:check families.
numbers: 12

### tile-5-label
- docs:check families.

### tile-6-value
- The count of tests.
numbers: 2502

### tile-6-label
- Tests.

## era-5

### band-era
- The fifth era of seven.
numbers: 5, 7

### band-dates
- 19 to 25 August.
numbers: 19, 25

### band-commits
- Commits 185 to 244.
numbers: 185, 244

### title
- Cold readers and the budget squeeze.

### lead
- A released poster told the players "one dot per evening — 3 more evenings" and never said what would arrive; the owner read it cold and asked what it meant, and that question is the origin of every cold reader: agents briefed with the pictures and nothing else, whose first run reported seventeen findings on twenty-nine drawings.
- Then the harness was pointed at itself: a checkup broke every document rule on purpose and three stayed green, and Stryker found the checks caught 47.17% of their own mutants.
- Then at its own size: every skill got a line budget, a tag became conditional, and the era ends with eight consecutive commits marked "Tag: none".
numbers: 3, 47, 17

### d1-summary
- The author cannot read their own drawing; the count is 9 gates.
numbers: 9

### d1-p1
- The chart was not on the poster yet; it appears once enough evenings have accumulated, and a hint stands in its place until then.
- poster-reader is briefed with pictures and the list of lines on them and nothing else, reading them cold with no idea what any of it is for; the gallery gate became the one gate you may not perform yourself.
commits: da50714

### d1-p2
- The same failure existed in words: reading one real evening before shipping became a gate, owed whenever a phase changes what a poster says; until then no gate had asked what the evening's chronology actually says.
commits: 93c1456

### d1-p3
- Two real evenings were read and ten minutes found eight defects, so copy-reader was born: it reads every line the bot can say, in both languages with real values, and asks whether a person would say it; with the two inserted gates there were nine.
- Its first readings found some sixty things, mostly acted on; it was then moved earlier, to the moment a table of lines is written.
commits: d45f2f0

### d1-p4
- The plan-reviewer agent works at the start of a phase, when the plan exists and the code does not; it gets the owner's words and the agreed signatures, may come back with nothing, and owes only an account of what it checked.
- Calibrated on a plan with three planted faults, it found all three and a fourth.
commits: e64c8cd

### q1
- The quotation: it is the only reader here whose ignorance is the instrument; from the commit cited, 20 August.
numbers: 50714, 20

### d2-summary
- A gate that silently does not apply; the count is the 80% bar.
numbers: 80

### d2-p1
- The product got its third poster, one player's whole career, and it shipped in two releases with no gallery case because no rule said a new poster owed one: a gate that does not apply is indistinguishable from a gate with nothing to report.
commits: 2b1353b, da16c8d

### d2-p2
- The checkers were checked: a checkup broke every document rule on purpose, nine went red and three stayed green; Stryker on the tooling found the tests caught only 47.17% of the document checks' mutants.
- The checks were rewritten as pure functions with specs and given their own Stryker run with an 80% bar, separate because an average with the bot's mutants would have read as 93% and hidden the failure.
numbers: 47, 17, 80, 93
commits: 3d92c6b, 471cac4

### d3-summary
- Budgets everywhere; the count is 16% of changed lines.
numbers: 16

### d3-p1
- CLAUDE.md had had a line budget since era 2; now every skill got one, and so did TECH-DEBT.md.
- finish-phase had grown to 722 lines and was cut to 459 with five pages moved beside it, and the budgets were lowered in the same commit so the split cannot be a way to turn the counter off.
numbers: 722, 459
numbers-en: 2
commits: ab68474

### d3-p2
- An outside review by a fresh model measured 16% of five days' changed lines going into the process rather than the product, and counted eight releases in four days, each restarting the bot and paying for a full mutation run and a full e2e run.
- Three things became conditional: a tag only when a player or the operator gets something new, delegated writing only above ten files, a retrospective only when there is something to count.
numbers: 16, 2
commits: fff3c5f

### d3-p3
- The last commit of the era tested the claim that a skill should state outcomes rather than steps, and the claim did not hold: one skill rewritten to almost half its length lost six concrete instructions, the war stories surviving as symptoms while the fixes they bought were compressed away.
- With that in the brief, another skill was cut without losing an instruction; a skill-auditor agent now inventories a skill rule by rule before anyone shortens it.
commits: 784b26c

### d3-p4
- Every agent got a contract, what its brief must carry and what it returns, and the reply opens with a verdict line of two numbers, how much was covered and how much was found, with the findings after it.
- The reason: the report of an agent that checked less than asked is indistinguishable from a full one, and nobody further down checks it again.
commits: ba4603f

### d3-p5
- A hook on the end of a turn: one phase stopped on a message that listed what was left, ended with "Continuing", and did nothing; no gate could notice because there was no diff.
- The hook reads the last sentence of a reply and refuses a turn that ends by announcing work instead of doing it.
commits: 2239ef0

### next
- What remained was to teach the harness to remember what it had done; that is the last era's work.

### tile-1-value
- The count of skills.
numbers: 11

### tile-1-label
- Skills.

### tile-2-value
- The count of agents.
numbers: 7

### tile-2-label
- Agents.

### tile-3-value
- The count of Stryker families.
numbers: 2

### tile-3-label
- Stryker families, with two bars.

### tile-4-value
- The approximate count of docs:check families.
numbers: 30

### tile-4-label
- docs:check families.

### tile-5-value
- The count of tests.
numbers: 3994

### tile-5-label
- Tests.

### tile-6-value
- The count of consecutive untagged commits.
numbers: 8

### tile-6-label
- Consecutive commits marked "Tag: none" at the end of the era.

### chart-title
- The parts of the harness.

### chart-sub
- Skills, agents and project lint rules present in the tree at every commit.

### chart-table
- Opens the chart as a table.

## era-6

### band-era
- The sixth era of seven.
numbers: 6, 7

### band-dates
- 26 August to 2 September.
numbers: 26, 2

### band-commits
- Commits 245 to 274.
numbers: 245, 274

### title
- The harness keeps records of itself.

### lead
- This era added almost no new parts and deleted one: the routing table at the top of CLAUDE.md, telling the model which skill to read since era 2, a second copy of a fact that had drifted from the first; the check that replaced it fired on every skill, since no description said when it was due.
- The same audits found the lint blind in three places at once, including a hundred spec files loading their subject with await import, which no import ban had looked at.
- The number of awards the bot can hand out was "thirty-six" in six places, and it was forty-five.
numbers-en: 2

### d1-summary
- Blind spots in the lint; the count is 2 more lint rules.
numbers: 2

### d1-p1
- ESLint had never been run on the scenario folder, and the import zones read only static imports; every ban is now written twice, for static and dynamic imports.
- Two more rules moved from prose into lint: only one file may open the database, and every screen's Cancel and Confirm row is assembled in one place.
- The hand-written list of features in the lint config was replaced by reading the folder, because a folder left off it got no fence at all, silently.
commits: fee84a4, 76a0ee0, 6232fe5, 01ef471

### d2-summary
- Where a skill says when it is due.

### d2-p1
- The skill's own description played the same role as the table and nobody checked either: era 4 had taught descriptions to name the task, but none named the stage, and the table and the descriptions had drifted apart.
- Each description now names its stage, docs:check keeps the description, the skill's title and the flow drawing in agreement, and the drawing draws every skill and agent at its stage, checked in both directions.
- finish-phase's description flipped from load it when any list of changes is accepted to do not load it at stage 1, after the checkup found the wording firing two stages early.
numbers: 1
numbers-en: 4
commits: 01ef471

### tn-eyebrow
- Then and now: how a skill says when it is due.

### tn-lead
- Two artifacts from the repository: the CLAUDE.md table, where the reader finds the right row alone, and the skill description that names its own stage.

### tn-tab-1
- CLAUDE.md, on 1 August.
numbers: 1

### tn-tab-2
- finish-phase, on 28 August.
numbers: 28

### tn-body-1
- The routing table as committed, in English: a row per job (adding a feature, adding a query, writing a spec, closing a phase, touching e2e) naming the skill or README to read.
numbers: 2, 2

### tn-body-2
- The skill description as committed, in English: this is stage 3 and after, load it when the code is written and the gates are due, do not load it at stage 1.
numbers: 3, 1

### tn-note
- The routing table CLAUDE.md opened with from the first commit cited, and the skill's own header after the second deleted the table.
commits: 4a3d0a9, 01ef471

### d3-summary
- The flow, corrected five times in a day; the count is 5 commits.
numbers: 5

### d3-p1
- The flow drawing was read as prose and several steps were not where they happen: two steps every phase needs sat in the branch only a bug fix enters, and a question the repository can answer was drawn at stage 4 when it happens at stage 1, before the owner is asked anything.
- On 26 August five commits in a row corrected where steps sit (two more that day drew in the phase-log steps), and two of the five admitted nothing mechanical checks that a step sits where it actually happens.
numbers: 26
numbers-en: 4, 1
commits: 8a1bfc2, 650cdec, 3beac4c

### d4-summary
- The logbook; the count is 2 fields.
numbers: 2

### d4-p1
- The answer was a record: the logbook holds one log per phase, written at the retrospective, saying what was asked, what kind of work it was, what ran, what was delegated, what was rebuilt, and which gate found each defect.
- Two fields, the path taken and the stages skipped, name the stages in the drawing's own words and between them must list every stage, so a phase that quietly went round one reads differently from one that did not mention it.
commits: db81a3a, f4b09e7

### d4-p2
- The one rule that matters: a number you did not measure is written "not measured", never estimated.
- The first log under it had two counts wrong, both checkable with one git log command and both erring in the flattering direction.
commits: db81a3a

### d4-p3
- The folder beside it keeps every checkup report, never pruned, each with a measurements table so the next visit can ask whether a number moved; the first report is from a new run at the end of August, not the one era 4 describes.
numbers-en: 4
commits: b8cb5ea

### d5-summary
- Counts rot.

### d5-p1
- The most repeated lesson of the era is small: a count of spec files and a column of line counts had rotted like the award count, and the number was removed entirely, a gate for it considered and rejected because a check defends a fact something depends on, and nothing depends on this one.
commits: 25108af

### q1
- The quotation: a fact stated in two places is the copy that rots; from the commit cited, 28 August.
numbers: 01, 471, 28

### tile-1-value
- Skills plus agents.
numbers: 11, 7

### tile-1-label
- Skills and agents.

### tile-2-value
- The count of project lint rules.
numbers: 7

### tile-2-label
- Project lint rules.

### tile-3-value
- The count of docs:check families.
numbers: 32

### tile-3-label
- docs:check families.

### tile-4-value
- The count of tests.
numbers: 4367

### tile-4-label
- Tests.

### tile-5-value
- The count of e2e cases.
numbers: 178

### tile-5-label
- e2e cases.
numbers: 2

### tile-6-value
- The count of lines in CLAUDE.md.
numbers: 359

### tile-6-label
- Lines in CLAUDE.md.

### chart-title
- Product and harness, in lines of text.

### chart-sub
- Source under src/ without specs and stubs, against the skills, agents, documents and docs:check code that govern it.

### chart-table
- Opens the chart as a table.

## era-7

### band-era
- The seventh era of seven.
numbers: 7, 7

### band-dates
- 3 to 11 September.
numbers: 3, 11

### band-commits
- Commits 275 to 314.
numbers: 275, 314

### title
- The agent becomes the user, and the harness gets a ruler.

### lead
- The deploy had been failing a third of the time since 31 August and nothing noticed, because a fetch that fails looks like a fetch that found nothing new; finding it took reading the server's journal instead of the README, and set the tone for an era that stopped believing what the harness said about itself.
- The scripts were rebuilt around a fact true since the first commit: their only user is an agent; twenty-three scripts became eight, every gate a row in one table leaving a verdict file.
- Last came a ruler, a frozen task in a fenced clone run cold, whose first honest table said every model passes and only the process columns tell them apart.
numbers: 31

### d1-summary
- Two repairs for a real evening; the count is 11 games.
numbers: 11

### d1-p1
- Two people at the table are called Roma, the second written Romani; one Friday the wrong one was typed, eleven games went to a man who stayed home, and the evening was repaired over ssh with a script.
- That became /replace: two names typed, the decision read back with the game count, one tap; the plan reviewer found the hole before a line existed, so Confirm re-derives everything and answers "screen expired" rather than crashing.
commits: 9b28574

### d1-p2
- The harness lesson sat underneath: a feature may not import another, so the name parser and the seat rotation moved to shared/ first; and a second feature listening for typed text exposed the first listener swallowing every text message meant for the ones after it.
commits: 7d2ad6d

### d2-summary
- The checkup reads the journal; the count is 181 activations.
numbers: 181

### d2-p1
- The first checkup had called the deploy's anonymous fetch a design; the second found 181 activations of the deploy timer since 31 August ending in GitHub refusing an unauthenticated download, and the fetch got a key.
- The phase that took the rest of the report counted the process: three of twelve phases had written no phase log while claiming a retrospective, and six of ten had broken a shell command on a backslash two memories already forbade; both became hooks, one on the commit message and one on the shell command.
numbers: 181, 31
commits: 6207423, 02277c0

### d2-p2
- One gate moved for its price: the retrospective had run in a fork of the conversation, which re-sends the whole transcript on every call, and now runs in the conversation.
commits: f1f874e

### d3-summary
- Twenty-three scripts become eight; the count is 1463 test runs.
numbers: 1463

### d3-p1
- A gate's verdict sat in the middle of a stream the agent sees only the tail of, so every run went through save the log, grep the log; the release battery ran twenty-nine minutes inside a git push where the agent lost sight of it.
- Now one runner runs any gate, streams its output to a log, leaves a verdict file with its exit code, duration and the numbers from the tool's own JSON, and rebuilds the Gates paragraph after every gate so a commit pastes it rather than retypes it.
commits: e026d5e

### d3-p2
- The owner asked for the same for every other script and for everything the agent never runs to go; a count over a month of transcripts found 14301 tool calls, of which 1463 were hand-typed test runs on one spec, read through a grep on a stream.
- Every script left in package.json had been run that month, so nothing more was deleted, and the log says so rather than deleting for effect.
numbers: 14301, 1463
commits: af08fc5

### d3-p3
- The document check learned the runner's table and refused a bare npx eslint or npm test, because with the configs moved those misbehave; its first run found 63 stale names.
- While that rule was being written the agent typed the same commands by hand twelve times, so a hook refuses them in the shell too; every moved gate and new rule was proven by a deliberate break, fourteen in all, and four hit nothing the rule watched.
numbers: 63
commits: d49d590

### tn-eyebrow
- Then and now: the scripts in package.json.

### tn-lead
- The first tab is the scripts block at the start of 9 September; the second is the same block four commits later, after the gates moved into a table of their own.
numbers: 9

### tn-tab-1
- Commit 290, on 9 September.
numbers: 290, 9

### tn-tab-2
- Commit 294, on 9 September.
numbers: 294, 9

### tn-body-1
- The twenty-three script names as committed, in English: prepare, start, the check batteries, lint, typecheck, docs:check, the test variants, the e2e variants.
numbers: 2, 2, 2, 2, 2

### tn-body-2
- The eight script names as committed, in English, and the note that every gate is a row in the gate list, run only through the gate runner.
numbers: 2

### tn-note
- The scripts of package.json at the first commit cited, and at the second.
commits: 93a27ef, d49d590

### d4-summary
- A ruler for the harness; the count is 4 models.
numbers: 4

### d4-p1
- The harness changed every week and nothing said whether it got better; models changed underneath it too, and the only comparison was an impression of one session against a memory of another.
- On 10 September the repository got a benchmark: a frozen task with the owner's brief, a hidden spec and a list of obligations, and a runner that cuts a clone of HEAD without history, hands the brief to a headless agent, scores the result with the clone's own gate runner and writes one row per run.
- Nothing is a single score on purpose: acceptance is the headline and gates, obligations, turns, minutes and dollars say how it was reached; the task's award is never merged, because the day it lands the task measures memory.
numbers: 10
commits: d011e68

### d4-p2
- The owner asked what stopped a model from noticing it was being measured and reading its way to the answer, and the honest reply was nothing much; the calibration was cancelled, the clone moved under the system temp folder with the runner's source stripped out, a hook in the clone refuses every step whose path leaves it, and the refusal count is a column.
- The first calibration showed seven fence hits, none a step out of the clone, and a minutes column saying eleven for a run the file times put at forty-six; both columns were fixed the same night.
commits: 5f5a120, cf15a80, 3328b6e

### d4-p3
- The table was rewritten once more when all four models failed the same two obligations, the only two whose pattern spans a line break, because the clone is checked out on Windows with a carriage return before every newline.
- With the matcher fixed, acceptance and the gates saturate for every model tried; the process columns separate them: Haiku at medium effort met eight of eleven obligations, named no debt, and cost a dollar and six minutes; Opus at medium met eleven of eleven, named the debt, and cost twenty-two dollars and thirty-six minutes.
commits: a05104e

### d5-summary
- The checkup finds what the gates cannot; the count is 13 sentences.
numbers: 13

### d5-p1
- The fourth checkup, on 11 September, ran the full mutation battery and found it red at a pristine HEAD: neither mutation config named a test config, so the dry run collected every spec under the root, including since 10 September the benchmark's hidden spec, which fails by design.
- It found thirteen sentences in the documents that had stopped being true or never were, none within reach of the document check, which cannot read a server or a git history.
numbers: 11, 10
commits: 1f901b6, 187f621

### d5-p2
- It read the harness as its only user does: a Stop hook had been running the linter's autofix over the whole tree at the end of every turn, editing files unasked and refusing nothing, so it could not be seen refusing; it is gone.
- The Gates paragraph a commit pastes now opens with the battery, the HEAD and the time, the commit hook refuses a stamp from another HEAD, and the push hook, freed of the release battery, refuses a tag whose battery was not green at that commit.
- The award rules held a dozen survivors on exact boundaries, each a rule a player would notice moving by one game; and thirteen of the sixteen phase logs had written "not measured" for the wall clock against a rule that the number is always there to take, so the document check refuses that field now.
commits: 3f77a65, 81b76d1, cf74fb1, 08aac82

### q1
- The quotation: the agent is the harness's only user, and a person's convenience is second; from the commit cited, 9 September.
numbers: 08, 5, 9

### tile-1-value
- Skills plus agents.
numbers: 11, 7

### tile-1-label
- Skills and agents.

### tile-2-value
- The count of project lint rules.
numbers: 8

### tile-2-label
- Project lint rules.

### tile-3-value
- Scripts in package.json, before and after.
numbers: 23, 8

### tile-3-label
- Scripts in package.json.

### tile-4-value
- The count of tests.
numbers: 5043

### tile-4-label
- Tests.

### tile-5-value
- The count of e2e cases.
numbers: 205

### tile-5-label
- e2e cases.
numbers: 2

### tile-6-value
- The count of lines in CLAUDE.md.
numbers: 379

### tile-6-label
- Lines in CLAUDE.md, of its budget of 380.
numbers: 380

## patterns

### eyebrow
- Across all seven eras.

### title
- What kept coming back.

### lead
- Seven patterns run through the whole history, each stated in a commit, not inferred; they are the lessons the findings counted, here as the rule each became.

### r1-n
- The first pattern's number.
numbers: 01

### r1-title
- Prose becomes a machine.

### r1-body
- Every rule starts as a sentence in CLAUDE.md; if a machine can check it, it becomes a lint rule, a hook or a docs:check family, and the sentence is deleted.
- The trigger is measured, not felt: a rule in prose broken thirteen times in a week is the sign it needs a machine.
commits: 08aac82

### r1-link
- Leads to era 1.
numbers: 1

### r2-n
- The second pattern's number.
numbers: 02

### r2-title
- A rule that never fires looks clean.

### r2-body
- A rule found dead, a gate that passed only because the author's machine had no CRLF, documentation rules that stayed green under sabotage.
- The answer is always the same: prove a new rule with a deliberate violation before trusting it, then search the tree by hand for the spellings its author did not think of.

### r2-link
- Leads to era 2.
numbers: 2

### r3-n
- The third pattern's number.
numbers: 03

### r3-title
- Gate the diff, read the report you have.

### r3-body
- Mutation over changed files, e2e over reachable scenarios, one round of survivor-killing, and never re-running a gate to re-read its output.
numbers: 2

### r3-link
- Leads to era 2.
numbers: 2

### r4-n
- The fourth pattern's number.
numbers: 04

### r4-title
- Every reader is briefed, and told less than the author knows.

### r4-body
- The review is always an agent that did not write the diff; the pictures are read by an agent that does not know what they are for; the bot's lines are read as sentences with real values; the plan is criticised before code exists.

### r4-link
- Leads to era 5.
numbers: 5

### r5-n
- The fifth pattern's number.
numbers: 05

### r5-title
- A lesson left in the chat is gone.

### r5-body
- The retrospective is a gate that falls before the release, not after; each lesson has to land as a rule, a check or a skill line, and since every file has a line budget, each new rule displaces an older one.

### r5-link
- Leads to era 2 and to era 5.
numbers: 2, 5

### r6-n
- The sixth pattern's number.
numbers: 06

### r6-title
- Counts in prose rot.

### r6-body
- A number that changes whenever a list changes is removed rather than corrected; the exception is a number something depends on, which a check holds.

### r6-link
- Leads to era 6.
numbers: 6

### r7-n
- The seventh pattern's number.
numbers: 07

### r7-title
- Shape every output for the one who reads it.

### r7-body
- The harness has one user and it is not a person: a verdict is a file it can open, never a stream it sees the tail of; a red gate names its reasons and the one command that re-runs it; nothing waits on a terminal.
- The rule was stated in the seventh era and applied backwards over everything written before it.

### r7-link
- Leads to era 7.
numbers: 7

### outro
- What of all this stands in the repository today is below, in one list.

## today

### eyebrow
- At commit 314.
numbers: 314

### title
- The harness today.

### item-1-term
- Rules loaded every session.

### item-1-desc
- CLAUDE.md, 379 lines against a budget of 380.
numbers: 379, 380

### item-2-term
- Skills, eleven.
numbers: 11

### item-2-desc
- The eleven skills by name: add-a-feature, add-repository-method, finish-phase with five pages beside it, fix-a-bug, refresh-the-pictures, retrospective, update-the-design-page, write-a-commit, write-a-doc, write-a-spec, write-an-e2e-scenario; each description names its stage in the flow.
numbers: 2

### item-3-term
- Agents, seven.
numbers: 7

### item-3-desc
- The seven agents by name: phase-reviewer, plan-reviewer, poster-designer, poster-reader, copy-reader, skill-auditor, deep-checkup; each with a brief contract and a Verdict: line.

### item-4-term
- Hooks.

### item-4-desc
- Six Claude hooks: lint on every edit, a reason owed on every flow edit, a refusal of a turn that ends by announcing work, a refusal of a shell command carrying a backslash the shell would eat, a refusal of a gate typed by hand instead of run through the runner, and the fence the benchmark writes into its clone.
- Git hooks: a commit-message check for the flow drawing, the phase log and the Gates stamp, and a push hook that lets a tag leave only on a green stamp from the release battery.

### item-5-term
- Lint.

### item-5-desc
- Eight project rules and import zones per feature layer, compiled for static and dynamic imports.

### item-6-term
- Gates.

### item-6-desc
- Nine in the phase ritual, in order: lint and types, coverage, mutation over the diff, a real evening, e2e over the diff, review, the sentences, the pictures, the retrospective.
- The machine half is eleven rows in one table, run only through one runner, each leaving a log and a verdict file; four batteries, one per moment.
numbers: 2

### item-7-term
- Documents.

### item-7-desc
- README, PLAN, CLAUDE, TECH-DEBT, DEVELOPMENT-FLOW, four folder READMEs, and a logbook of phases and checkups, all held against the code by the document check.

### item-8-term
- Benchmark.

### item-8-desc
- One frozen task, run cold in a fenced clone and scored by the clone's own gates; one row per run with acceptance, gates, obligations, fence hits, tool calls, minutes and dollars by model.
- The weekly checkup runs the pinned model, so its row moves only when the harness does; three rows so far.

### method-title
- How this page was written.

### method-body
- Only the git history was read: 314 commit messages and the diffs of the harness files at each; the first 274 on 3 September and the forty after them on 14 September, the same way; no session transcripts.
- Where a motive is stated in a commit it is quoted; where a pattern is observed across commits, the text says so; the charts are computed from the tree at every commit; hashes link to the commits on GitHub.
numbers: 314, 274, 3, 14

## footer

### line
- FoolProof is a scoresheet for Podkidnoy Durak.

### landing
- Leads to the landing page.

### github
- Leads to GitHub.

### licence
- Leads to the MIT licence.

### bot
- Leads to the bot.

### disclaimer
- Not affiliated with Telegram.
