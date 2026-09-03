#!/usr/bin/env bash
#
# Put the newest released tag live, if it is not live already. Driven by
# foolproof-deploy.timer — README.md#deploying-a-new-version has the whole story,
# including why the server pulls rather than being pushed to.

# -E, not just -e: without it a shell function does not inherit the ERR trap, so a
# failure inside as_owner() below would exit without ever running the rollback.
# Proven by trying it rather than by reading it.
set -Eeuo pipefail

REPO=/home/ubuntu/FoolProof
OWNER=ubuntu
SERVICE=foolproof.service
SETTLE_SECONDS=15
# The fetch runs as root and drops to the owner on the way, so which home ssh would
# look under is a question about runuser's environment handling. Both files are
# named outright instead, so the answer never matters; both belong to the owner.
DEPLOY_KEY=/home/ubuntu/.ssh/foolproof-deploy
KNOWN_HOSTS=/home/ubuntu/.ssh/known_hosts
# GitHub limits unauthenticated downloads and says so with a refusal that git
# reports as a missing username. Three tries cover the transient kind; the key
# above is what makes the refusal stop happening at all.
FETCH_ATTEMPTS=3
FETCH_RETRY_SECONDS=20
# Outside the clone, because it records what is *running*, which the clone's HEAD
# does not: a deploy killed between the checkout and the restart leaves HEAD at the
# new tag with the old code serving, and a script comparing against HEAD would then
# find nothing to do forever. The stamp is written after the restart has been seen
# to hold, so it can only ever name a version that was actually started.
STAMP=/home/ubuntu/.foolproof-deployed

as_owner() {
  runuser -u "$OWNER" -- "$@"
}

say() {
  echo "deploy: $*"
}

cd "$REPO"

remote=$(as_owner git remote get-url origin)
case "$remote" in
  git@*|ssh://*)
    if [ ! -f "$DEPLOY_KEY" ]; then
      say "origin is $remote but there is no key at $DEPLOY_KEY — README.md#deploying-a-new-version says how to make one"
      exit 1
    fi
    export GIT_SSH_COMMAND="ssh -i $DEPLOY_KEY -o IdentitiesOnly=yes -o UserKnownHostsFile=$KNOWN_HOSTS"
    ;;
esac

# --prune-tags as well as --prune: a tag deleted upstream to yank a bad release
# has to disappear here too, or it stays the newest tag and keeps being deployed.
fetch_tags() {
  local attempt=1
  while ! as_owner git fetch --tags --prune --prune-tags --force --quiet origin; do
    if [ "$attempt" -ge "$FETCH_ATTEMPTS" ]; then
      say "could not fetch from $remote in $FETCH_ATTEMPTS tries — giving up until the next run"
      return 1
    fi
    attempt=$(( attempt + 1 ))
    sleep "$FETCH_RETRY_SECONDS"
  done
}
fetch_tags

# v[0-9]* rather than v*: `version:refname` sorts a tag like `very-old` above
# every real version, and this script would then deploy it.
newest=$(as_owner git tag --list 'v[0-9]*' --sort=-version:refname | head -1)

if [ -z "$newest" ]; then
  say "no released tag exists yet — nothing to deploy"
  exit 0
fi

wanted=$(as_owner git rev-parse "${newest}^{commit}")

# What is running is the stamp when there is one; HEAD is only trusted on a box
# that has never deployed, where it is the clone somebody made by hand.
running=$(as_owner git rev-parse HEAD)
if [ -f "$STAMP" ] && as_owner git cat-file -e "$(cat "$STAMP")^{commit}" 2>/dev/null; then
  running=$(cat "$STAMP")
fi

if [ "$wanted" = "$running" ]; then
  exit 0
fi

# Not just "different": a running version that already contains the tag is ahead
# of it, which is what a fresh clone of main looks like. Deploying then would be a
# downgrade, and a timer enabled at the wrong moment would do it silently.
if as_owner git merge-base --is-ancestor "$wanted" "$running"; then
  exit 0
fi

say "$newest is newer than what is running — deploying it"

# Nothing below may leave the bot able to start code that could not be installed,
# so a failure puts the previous commit back and stops without touching the
# service. The handler turns -e off first: it runs under it otherwise, and a
# failing line would abort the rollback halfway, silently.
#
# It covers the restart as well, and that is the point rather than an extra: a
# deploy that installed the code and then failed to start it would otherwise leave
# the new tag checked out while the old code ran, and the tree would not be the one
# the stamp names. Rolling the checkout back keeps the clone and the stamp telling
# the same story, which is what makes the next run's comparison mean anything.
restore() {
  set +e
  say "deploying $newest failed — putting the previous version back"
  as_owner git checkout --quiet --detach "$running" || say "could not check $running back out"
  as_owner npm ci --omit=dev --silent || say "could not install $running back either — the tree is not clean"
  systemctl restart "$SERVICE" || say "could not restart the bot on $running either — journalctl -u $SERVICE"
  exit 1
}
trap restore ERR

as_owner git checkout --quiet --detach "$wanted"
# ci rather than install: exactly the tree package-lock.json describes, which is the
# tree the checks ran against. --omit=dev because the bot imports two packages and
# the backup script none, and a 1 GB box has no room for a test runner it never runs.
as_owner npm ci --omit=dev --silent

# The restart and the settle run under the trap, so a bot that will not come back
# takes the checkout back with it.
systemctl restart "$SERVICE"

sleep "$SETTLE_SECONDS"

# This proves the service came back, not that the bot is healthy: the supervisor
# keeps the unit active while it restarts a child that keeps dying. A release that
# starts and then crash-loops looks like a success here and like a problem in the
# journal, which is where a deploy has to be checked anyway.
systemctl is-active --quiet "$SERVICE"

trap - ERR

echo "$wanted" | as_owner tee "$STAMP" >/dev/null

say "$newest is installed and the bot is running again"
