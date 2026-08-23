# Running FoolProof on a server

The operator's half of the documentation: how the bot gets onto a machine, what
keeps it there, how it says it is unwell, and what to do when it is. Everything a
person needs to *use* the bot or work on the code is in
[README.md](../README.md); what the bot must do is in [PLAN.md](../PLAN.md).

This file lives beside the units and the scripts it describes, so it leaves with
them. The files it names — `foolproof.service`, the deploy timer, the backup timer
and `configure-server.sh` — are all in this folder.

## Running it on a server

A laptop that has to be awake on a Friday evening is the weakest part of the setup,
and moving off it is cheap: long polling means the host opens **no port, needs no
domain and no certificate**, so a firewall with nothing but SSH in it is enough.
Anything that runs Node 24 will do. This one runs on a free Oracle Cloud VM with
1 GB of memory, where the service idles at about 95 MB — 100.8 MB after half a day
up, against a 148.8 MB peak — and the heaviest `/stats` peaks at 411 MB.

On the server, once. Ubuntu's own Node is too old, and the unit files name
`/usr/local/bin`, which is where the tarball puts it:

```bash
curl -fsSLO https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz
sudo tar -xJf node-v24.19.0-linux-x64.tar.xz -C /usr/local --strip-components=1
node -v && npm -v

git clone https://github.com/oleg-vasilyev/FoolProof.git
cd FoolProof
npm ci
```

The deploy timer and `configure-server.sh` both run `sudo systemctl` **without a
password prompt**, from a non-interactive session that has nowhere to type one, so
the account needs that granted once:

```bash
echo 'ubuntu ALL=(ALL) NOPASSWD: /usr/bin/systemctl' | sudo tee /etc/sudoers.d/foolproof
sudo chmod 440 /etc/sudoers.d/foolproof
```

Then send it its configuration, **from your machine**, where `.env` is the copy you
can edit:

```bash
cp .env.example .env    # fill in the token and your own id, then
deploy/configure-server.sh
```

That writes `.env.production` on the server with mode 600, restarts the bot, and
prints the key names and their lengths — never a value. It rewrites one key on the
way: `DB_PATH` becomes an absolute path **outside the clone**, because a deploy
checks the clone out from under itself and nothing that deploys should be able to
reach the games.

Then it waits — up to ninety seconds — for the bot to say it is polling, and puts
the previous configuration back if the bot stops instead. Ninety, because a wrong
token does not stop the service: it makes the bot die and be restarted until the
supervisor gives up, about forty seconds in, and anything quicker would call a
crash-looping bot healthy. If the wait runs out with the service still up but
nothing said, the script leaves the new file in place and tells you to read the
journal — rolling back a configuration that may be fine is the worse mistake.

Copy an existing database to that path before the first start (with its `-wal` and
`-shm` sidecars — [README.md](../README.md#two-databases-and-only-one-of-them-is-real)
says why all three); the schema creates whatever is missing, so
a file from an older version needs no migration.

Then hand it to systemd. [`deploy/foolproof.service`](foolproof.service) is
the unit, and it assumes the user `ubuntu`, the clone at `/home/ubuntu/FoolProof`
and npm at `/usr/local/bin/npm` — edit those three lines if yours differ:

```bash
sudo install -m 644 deploy/foolproof.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now foolproof
journalctl -u foolproof -f
```

The unit runs `npm run start:prod`, so **changing how production starts is a change
to `package.json`**, which a release delivers by itself. Changing the unit is not:
a deploy never touches `/etc`, so a release that edits `foolproof.service` needs
that first line run again by hand — the same as the deploy script.

`systemctl restart foolproof` and `systemctl stop foolproof` reach the bot the same
way `Ctrl+C` does, so the pending edit is still flushed. The unit brings the bot
back after a crash or a reboot, and gives up after five failed starts in five
minutes — [PLAN.md](../PLAN.md#what-survives-a-failure) explains which failures it is
allowed to answer and which are the supervisor's.

One thing to get right before the first start: **stop whatever was polling before**,
for the reason in [Running it](../README.md#running-it) — one token serves one process.

### Deploying a new version

Push a tag and wait. The server looks every five minutes and puts the newest
released tag live if it is not live already:

```bash
npm version minor    # writes package.json and package-lock.json, commits, tags
git push --follow-tags
```

**The server pulls; nothing pushes to it** — the same property long polling gives
the bot, and worth keeping for the same reason: no deploy key in anyone else's
hands, no port opened for one, nothing to rotate, and a public repository means the
check needs no credentials at all. What it costs is that a release takes up to five
minutes rather than being instant, and that a deploy is reported in the server's
journal rather than in a browser.

Nothing has to be true before enabling it: a checkout that already contains the
newest tag is left alone, so a server sitting on unreleased commits is not
downgraded. A tag that cannot be installed does not touch the running bot either —
the previous version is put back and keeps serving the chat. That tag is retried at
every check and fails the same way each time, which is deliberate: fixing the tag is
all it takes. Watch one happen, or run one now rather than waiting:

```bash
journalctl -u foolproof-deploy -f
sudo systemctl start foolproof-deploy
```

The last line a deploy prints says the bot is running again, and means only that
systemd has it: a release that starts and then crash-loops inside the supervisor
looks the same from outside. The journal above is the thing to read.

Install the script and the two units, and note the **timer** is what gets enabled —
the service beside it is one deploy, which is what `systemctl start` above runs:

```bash
sudo install -m 755 deploy/foolproof-deploy.sh /usr/local/bin/foolproof-deploy
sudo install -m 644 deploy/foolproof-deploy.service /etc/systemd/system/
sudo install -m 644 deploy/foolproof-deploy.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now foolproof-deploy.timer
```

The script is installed outside the clone rather than run from it, for the reason
in `foolproof-deploy.service`. It means a release that changes the deploy script
needs that first line run by hand; nothing else about a release does.

### Backups, and getting the games back

Every evening ever played lives in one SQLite file on one virtual disk, so the
only question that matters is what happens when that disk stops existing. A
monthly timer answers it — monthly because one table of friends adds a few
kilobytes a month, so a month is both what the snapshot holds and what losing
the disk would cost. A second table playing is the moment to make it daily,
which is one line in the timer:

```bash
sudo install -m 644 deploy/foolproof-backup.service /etc/systemd/system/
sudo install -m 644 deploy/foolproof-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now foolproof-backup.timer
```

[`scripts/backup-database.ts`](../scripts/backup-database.ts) takes the snapshot
with `VACUUM INTO` rather than copying the file. That matters: the database runs
in WAL mode, so the newest games are in `foolproof.db-wal` and not in
`foolproof.db` at all — a copied file is a backup of everything except what
happened most recently. `VACUUM INTO` writes one consistent file, from a
read-only connection, without asking the bot to stop.

It then **opens the snapshot it just wrote**, runs `PRAGMA integrity_check` and
counts the games and players. A backup that has never been read is a guess, and
the count is what turns the message into evidence rather than a habit. Fourteen
snapshots are kept in `/home/ubuntu/backups` — fourteen months at this rate —
and each is also sent to the operator's own Telegram chat: off the box, over a
credential that already exists, to the one place the operator is already
looking.

That arriving file is also the only monitoring there is, which a monthly rate
makes thin: a timer that breaks in February announces itself in April, if
anyone is counting months. `systemctl list-timers foolproof-backup.timer` is
the direct answer meanwhile, and a backup can always be taken by hand with
`sudo systemctl start foolproof-backup`.

To get the games back, on the server:

```bash
sudo systemctl stop foolproof
gunzip -c ~/backups/foolproof-<stamp>Z.db.gz > /home/ubuntu/data/foolproof.db
rm -f /home/ubuntu/data/foolproof.db-wal /home/ubuntu/data/foolproof.db-shm
sudo systemctl start foolproof
```

Deleting the two sidecars is the step that is easy to miss and expensive to get
wrong: a stale `-wal` beside a restored database is a journal describing pages
that file has never had. The snapshot is already whole, so they have nothing to
add. Ask the bot for `/status` afterwards — the game and player counts there
should match the caption of the backup you restored from, and that is the check
that the restore worked rather than merely finished.

This path has been walked and not only written: the operator rehearsed a restore on
21 August 2026 and it went through without a hitch. A procedure nobody has ever run
is a guess in the same way an unread backup is, which is the whole reason the
snapshot is opened and counted rather than merely written.

The gate that actually stands before a release is local: a **pre-push hook**
(installed by `npm install`, which points git at [`.githooks/`](../.githooks/))
runs the full `check:release` before any `v*` tag leaves the machine — every
scenario, every mutant. It has to be local, because the server pulls whatever
tag appears and waits for nobody.

The same folder holds a **commit-msg hook** guarding one file. The bot is
developed by an agent that is also allowed to improve its own process, and
[DEVELOPMENT-FLOW.md](../DEVELOPMENT-FLOW.md) is where that process is written
down — so a commit that moves an arrow on that drawing must say why in a
`Flow:` paragraph, and must carry the skill, rule, command or hook the moved
step stands on. Neither is a request for permission: the agent changes the
process and reports it, and the reason survives in the message rather than in
a chat that scrolls away.

GitHub Actions needs no setup and runs two checks behind that. Every push runs
`check:push` ([`.github/workflows/check.yml`](../.github/workflows/check.yml)):
`main` is released only by tag, so a broken test there is tolerable, but the
website ships straight from `main` and the documents may not rot. A release tag
repeats the full `check:release` on a clean clone
([`.github/workflows/release-check.yml`](../.github/workflows/release-check.yml)) —
the second opinion that catches what only a fresh checkout can show, such as a
drifted lock file. A red run there means push a fixed tag now; the timer will
not wait.

## Asking the bot how it is doing

The bot is on a machine you are not sitting at. **`/status`** answers from the chat
with everything the terminal would have told you:

```
Bot status

Database: foolproof.db (512 KB)
Recorded: 52 players, 186 games, 2 live
Last game: 2026-08-13 21:07:44 UTC

Chats: 14 in all, 9 played in the last week, 3 first seen in it
Games: 5 in the last day, 31 in the last week
Language: 6 chose Russian, 2 chose English, 6 never asked

Version: 1.11.0
Up for 3h 12m
Start #2 — the one before it ended with exit code 1
Since this start: 1 warning, 0 errors
Telegram: 9 retries, 1 rate limit, 2 refusals
Slowest poster: 2.4 s

Latest:
19:31:04 WARN polling: could not edit message 500: message to edit not found
```

The database line is the one that matters most: it names the file, so a production
run that quietly came up on the dev database is one glance away from being caught.
The middle block is the one that grew when the bot stopped being yours alone.

The command is **hidden** — not in `/help`, not in the `/` menu — and
`OPERATOR_TG_ID` in the env file is **required**: it names the only Telegram user
the bot will answer, and without it the bot refuses to start. `PLAN.md` explains
[what it reports and why](../PLAN.md#asking-the-bot-how-it-is-doing), including why no
environment value is ever printed.
## When something goes wrong

`start:prod` starts a **supervisor**, which runs the bot as a child process and
starts it again if it dies — 1 s, then 2, 4, 8, up to a minute apart. Everything the
bot prints still goes straight to the journal; the extra lines say `supervisor:`.
(`npm start` skips it: the harness runs `src/main.ts` itself, so a crash there is a
crash you are meant to see.)

```
INFO  supervisor: starting the bot
INFO  polling: listening for updates by long polling
WARN  supervisor: the bot died (exit code 1), starting it again in 1000ms
```

Lose the wifi and nothing needs doing: every call to Telegram is retried, the card
catches up when the connection comes back, and the log says so once at each end
rather than once per retry.

```
WARN  polling: telegram is unreachable during getUpdates (…) — retrying until it answers
INFO  polling: telegram is answering again
```

Restart it mid-game and the live card is redrawn from the database as it starts, so
what is on screen is always what was actually recorded. A tap that arrives against a
card whose buttons are out of date redraws it too, instead of refusing every further
tap.

A bot that has never managed to run for a minute is given five tries and then
abandoned, so a missing token or a locked database is one clear message instead of a
loop:

```
ERROR supervisor: the bot never got going (exit code 1) — fix what the log above says and start it again
```

`Ctrl+C` stops both, and lets the bot finish the edit it was in the middle of.
[PLAN.md](../PLAN.md#what-survives-a-failure) explains what each failure costs and why
the supervisor does not forward the signal itself.

