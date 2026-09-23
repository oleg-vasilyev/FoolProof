# Tell the case study's findings the way the talk tells them

```
Asked:      минорно обнови кейс стади, чтобы оно мачилось на идеи выступления, особенно первая секция с выводами; пили до конца и пушай, меня не жди
Kind:       documents
Ran:        opened 2026-09-23T15:05Z, closed at this commit's own %cI · claude-opus-5-5, site-writer and site-reader on their own models, fact-checks on sonnet · 2,654,371 subagent tokens, summed from the agents' own reports
Path:       study the project → check the tech debt → the size of the phase in one line → write the facts first → the site-writer agent, once per language → place the paragraphs → node scripts/gates/gate-runner.ts check-docs — the tree's words → the site-reader agent, once per language → the site-writer agent again with the findings → npm run check:phase → the phase-reviewer agent → the retrospective skill → save the takeaway to persistent memory → write the phase log to logbook/phases/ → node scripts/gates/gate-runner.ts check-docs — links resolve → the write-a-commit skill → commit and push to main
Skipped:    how many writer-to-reader rounds the page is worth · the built page for approval · Writing the code and the tests · Reading every sentence, then syncing every picture · npm version with the release message
Off-map:    two cold fact-checks of the diff against git, one after the first wave and one after the last
Delegated:  17 errands — 2 site-writers resumed 5 and 6 times; 9 site-reader passes, 12 to 3 findings each; 2 fact-checks, 3 and 1 unsupported claims; the phase-reviewer, 12 promises and 5 findings, 1 blocking
Rework:     the f4 and f5 facts in the tree, rewritten twice — my own paraphrase of af08fc5 (one file, then nineteen scripts) was wrong both times; settled by reading the commit sentence before writing the tree
Loops:      six English and five Russian writer rounds against a cap of three — each reader found fresh repeats in text the previous round had changed, and the rounds were spent on wording no reader stopped on
Broke:      none
Gates:      check-docs ×9 · check:quick ×2 · check:phase · the phase-reviewer · two fact-checks · copy not opened (no copy table moved) · gallery not opened (no picture changed) · the built page not looked at by eye (text inside existing elements only)
Found by:   the fact-check 4 · the site-reader 2 facts, dozens of wording · the review 3 · me 0 · the owner 0
Landed:     memory a-fact-added-to-a-tree-is-quoted-from-the-commit — a fact I add to a tree is copied from git show first
```

The owner's talk, parked on the talk-outline branch, is built on one idea — an AI
developer does what is checked, so the checks are the product and must check
themselves — and five steps up a ladder. The page's findings had the same five, told
without that idea and with two titles that did not match the talk. The lead now opens on
the talk's sentence, finding 03 became plan-first with a cold reader and the reviewer's
two-number reply, and finding 05 took the talk's own title. One citation the page had
carried since 17 September was wrong and is fixed: 4e56b66 sat under the second
checkup's examples, which are 6207423's.
