#!/usr/bin/env bash
#
# Send the server its configuration, generated from the local .env.
#
# The bot's env file is the one thing that is neither in git nor produced by a
# deploy: the tag deploy checks out code and never touches it. So it has to get
# there somehow, and "somehow" was a person typing over SSH from memory, which is
# not a procedure. This is.
#
# .env on this machine is the source. The server's copy differs in exactly one
# key — the database lives outside the clone there — and that difference is
# applied here rather than being remembered.
#
# Nothing is printed but key names and lengths, and the generated file is piped
# straight into ssh: it never lands on this machine's disk and never reaches the
# terminal.

# -E so the ERR trap fires from inside a function; without it the rollback below
# would never run.
set -Eeuo pipefail

SOURCE=.env
HOST=ubuntu@140.238.208.44
REPO=/home/ubuntu/FoolProof
TARGET=$REPO/.env.production
SERVER_DB_PATH=/home/ubuntu/data/foolproof.db
SERVICE=foolproof.service
# Long enough to outlast the supervisor giving up. A wrong token does not stop the
# unit — it makes the bot die and be restarted 1, 2, 4, 8, 16 s apart until the
# supervisor abandons it, about forty seconds in. Anything shorter reads a
# crash-looping bot as a healthy one, which is the exact failure this script has to
# catch. src/shared/lifecycle/restart-policy.ts owns those numbers.
PATIENCE_SECONDS=90
POLL_SECONDS=3
LIVE="listening for updates"
REQUIRED_KEY=BOT_TOKEN

say() {
  echo "configure: $*"
}

if [ ! -f "$SOURCE" ]; then
  say "no $SOURCE here — copy .env.example to it and fill it in first"
  exit 1
fi

if ! grep -qE "^${REQUIRED_KEY}=.+" "$SOURCE"; then
  say "$SOURCE has no $REQUIRED_KEY, or it is empty — the bot would not start"
  exit 1
fi

say "sending $SOURCE, with DB_PATH replaced by the server's own"

# One ssh, one heredoc-free pipeline: the file is written to a temp path first, so
# a dropped connection cannot leave a half-written config in place.
{
  tr -d '\r' < "$SOURCE" | grep -v '^DB_PATH='
  echo "DB_PATH=$SERVER_DB_PATH"
} | ssh "$HOST" "umask 077 && cat > $TARGET.incoming"

ssh "$HOST" "bash -s" <<REMOTE
set -Eeuo pipefail

kept=$TARGET.previous
incoming=$TARGET.incoming

tidy() {
  rm -f "\$kept" "\$incoming"
}

restore() {
  set +e
  if [ -f "\$kept" ]; then
    echo "configure: putting the previous configuration back"
    mv "\$kept" "$TARGET"
    sudo -n systemctl restart $SERVICE
  else
    echo "configure: there was no previous configuration to go back to — the bot is down and $TARGET is the file to fix"
  fi
  tidy
  exit 1
}
trap restore ERR

if [ -f "$TARGET" ]; then
  cp -p "$TARGET" "\$kept"
fi

mv "\$incoming" "$TARGET"
chmod 600 "$TARGET"

since=\$(date '+%Y-%m-%d %H:%M:%S')
sudo -n systemctl restart $SERVICE

# Three outcomes, not two. The bot saying it is polling is the only real success;
# the unit stopping is a certain failure; still running but silent after all this
# time is neither, and rolling back a configuration that may be fine would be worse
# than saying so.
waited=0
while [ \$waited -lt $PATIENCE_SECONDS ]; do
  if journalctl -u $SERVICE --since "\$since" --no-pager | grep -q '$LIVE'; then
    trap - ERR
    tidy
    echo "configure: the bot is polling again"
    break
  fi

  if ! systemctl is-active --quiet $SERVICE; then
    echo "configure: the bot stopped with the new configuration"
    restore
  fi

  sleep $POLL_SECONDS
  waited=\$(( waited + $POLL_SECONDS ))
done

if [ \$waited -ge $PATIENCE_SECONDS ]; then
  trap - ERR
  tidy
  echo "configure: the new configuration is in place and the unit is up, but the bot never said it was polling — read: journalctl -u $SERVICE"
  exit 1
fi

echo "configure: keys now on the server, values not shown —"
while IFS='=' read -r key value; do
  case "\$key" in ''|\#*) continue;; esac
  echo "configure:   \$key [\${#value} chars]"
done < "$TARGET"
REMOTE

say "done"
