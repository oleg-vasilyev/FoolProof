# Open a poster full screen, and zoom into it

```
Asked:      «постеры на лендинге хотелось бы иметь возможность открыть на всю страницу на
            компе и на телефоне… иконку просмотра целиком… призумить жестами или колёсиком»
Kind:       feature
Ran:        opened right after the v1.20.4 tag, closed at this commit's own %cI · Fable 5.1 ·
            subagent tokens: the reviewer's one pass, see Delegated
Path:       Framing the task and the mockup → the size of the phase in one line → Writing
            the code and the tests → Quality gates → npm run check:phase → node
            scripts/gates/gate-runner.ts docs-check — links resolve → Review by an agent
            that did not write the diff → the phase-reviewer agent → Retrospective — fixing
            the process and the documents → write the phase log to logbook/phases/ →
            Release to production → the write-a-commit skill → commit and push to main
Skipped:    check the tech debt · Reading every sentence, then syncing every picture · npm
            version with the release message
Off-map:    the change looked at through the preview pane's own browser, opened, zoomed and
            closed by script, because the pane was too narrow for a screenshot to judge
Delegated:  1 errand — the phase-reviewer over the four files: 4 findings, 9 promises checked
Rework:     the dialog placed after the script that looks for it, so the script found nothing
            and did nothing — moved above the scripts; a body scrollbar behind the open
            dialog — a one-line scroll lock; the SVG as the full-screen source, replaced by
            a PNG for both languages when the reviewer read the SVG's font — the CLAUDE.md
            rule about resvg and fonts covered it, and reading it before choosing the source
            would have settled it
Loops:      the browser check ×4 — a stale page, the dialog order, green, then the fixes ·
            check:phase ×2 — tools.ts changed after the first run
Broke:      none
Gates:      check:phase · docs-check · phase-reviewer · copy: nothing to read · gallery: shut,
            no drawing changed · e2e: in the battery, no keyboard changed
Found by:   me 2 (the dialog's place in the body, the scroll behind it) · the review 3 (the
            font the SVG has no copy of, the click after pointer capture, the dialog's label)
Landed:     none — scripts/tools/tools.ts writes a PNG per poster in both languages, README
            says so
```
