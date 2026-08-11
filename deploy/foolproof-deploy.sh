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

as_owner() {
  runuser -u "$OWNER" -- "$@"
}

say() {
  echo "deploy: $*"
}

cd "$REPO"

# --prune-tags as well as --prune: a tag deleted upstream to yank a bad release
# has to disappear here too, or it stays the newest tag and keeps being deployed.
as_owner git fetch --tags --prune --prune-tags --force --quiet origin

# v[0-9]* rather than v*: `version:refname` sorts a tag like `very-old` above
# every real version, and this script would then deploy it.
newest=$(as_owner git tag --list 'v[0-9]*' --sort=-version:refname | head -1)

if [ -z "$newest" ]; then
  say "no released tag exists yet — nothing to deploy"
  exit 0
fi

wanted=$(as_owner git rev-parse "${newest}^{commit}")
running=$(as_owner git rev-parse HEAD)

if [ "$wanted" = "$running" ]; then
  exit 0
fi

# Not just "different": a checkout that already contains the tag is ahead of it,
# which is what a fresh clone of main looks like. Deploying then would be a
# downgrade, and a timer enabled at the wrong moment would do it silently.
if as_owner git merge-base --is-ancestor "$wanted" HEAD; then
  exit 0
fi

say "$newest is newer than what is running — deploying it"

# Nothing below may leave the bot able to start code that could not be installed,
# so a failure puts the previous commit back and stops without touching the
# service. The handler turns -e off first: it runs under it otherwise, and a
# failing line would abort the rollback halfway, silently.
restore() {
  set +e
  say "deploying $newest failed — putting the previous version back, the bot is untouched"
  as_owner git checkout --quiet --detach "$running" || say "could not check $running back out"
  as_owner npm ci --silent || say "could not install $running back either — the tree is not clean"
  exit 1
}
trap restore ERR

as_owner git checkout --quiet --detach "$wanted"
# ci rather than install, and with the dev dependencies: this is exactly the tree
# package-lock.json describes, which is the tree the checks ran against.
as_owner npm ci --silent

trap - ERR

if ! systemctl restart "$SERVICE"; then
  say "$newest is installed but the service would not restart — journalctl -u $SERVICE"
  exit 1
fi

sleep "$SETTLE_SECONDS"

# This proves the service came back, not that the bot is healthy: the supervisor
# keeps the unit active while it restarts a child that keeps dying. A release that
# starts and then crash-loops looks like a success here and like a problem in the
# journal, which is where a deploy has to be checked anyway.
if ! systemctl is-active --quiet "$SERVICE"; then
  say "$newest is installed but the service did not come back — journalctl -u $SERVICE"
  exit 1
fi

say "$newest is installed and the bot is running again"
