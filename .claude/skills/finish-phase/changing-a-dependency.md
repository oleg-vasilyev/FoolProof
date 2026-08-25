# Changing a dependency

> Opened by gate 1 of [finishing a phase](SKILL.md), and only when the phase touched `package.json` or `package-lock.json`. Every rule here was bought by a battery that was green on this machine and red on the Linux runner.

**A lock file rewritten here can be wrong somewhere else, and the dry run will not
say so.** `npm install` on Windows prunes optional packages this platform has no
use for — the wasm fallbacks a native binding carries — and leaves the package that
*depends* on them behind, which Linux then refuses to install. Both times this has
happened, every local gate was green and GitHub Actions failed on `npm ci` before
running a test. So after any change to `package-lock.json`, **diff it for removals**
and put back what was dropped:

```bash
git diff -- package-lock.json | grep -E "^-\s+\"node_modules/"
```

A removal that no dependency change explains is the bug. Restore those entries from
the last lock CI accepted rather than regenerating — `npm install --package-lock-only`
prunes them again, because it resolves for this machine too.

**A phase that touched `package.json` runs `npm ci --dry-run` before committing.**
`npm run check` uses the `node_modules/` already on this machine, so it cannot see
that the lock file it produced is unsatisfiable somewhere else. Adding
`@tailwindcss/cli` on Windows wrote a lock whose wasm fallback conflicted with the
one vitest brings; every local gate stayed green and GitHub Actions failed on
`npm ci` before running a single test. The dry run reproduces that in one second,
here. Whichever way it is then fixed, ask first what the dependency costs the
**server**, which runs `npm ci` on every deploy and would have installed a CSS
compiler it has no use for.

**The dry run is necessary and not sufficient — read the lock's diff too.** It
resolves against the platform it runs on, so a lock written on Windows can pass it
here and fail on the Linux runner. Adding `tailwindcss` did exactly that: `npm
install` rewrote the whole file and dropped `@emnapi/core` and `@emnapi/runtime`,
two optional peers this platform decides are unnecessary and the runner requires.
The dry run was green; CI died on `npm ci` with *Missing: @emnapi/core from lock
file*. So **any line the lock loses is a finding, not noise** — a phase that adds a
dependency should only ever add lines. When `npm install` removes some anyway, put
the committed lock back and hand-write the entries: the manifest line and the
package block, which for a dependency with no dependencies of its own is all there
is.
