#!/usr/bin/env bash

set -euo pipefail

# Idempotently install/update cron jobs from scripts/cron-jobs.conf
# Lines with marker "# JOB:..." are ensured to exist exactly once.

CONF_FILE="scripts/cron-jobs.conf"

if [ ! -f "$CONF_FILE" ]; then
  echo "Config file not found: $CONF_FILE" >&2
  exit 1
fi

# Read current crontab
EXISTING=$(crontab -l 2>/dev/null || true)

# Remove any lines with markers present in the config to avoid duplicates
MARKERS=$(grep -o '# JOB:[^ ]\+' "$CONF_FILE" | awk '{print $2}' | sed 's/# //g' | sort -u || true)
FILTERED="$EXISTING"
if [ -n "$MARKERS" ]; then
  while read -r MARK; do
    [ -z "$MARK" ] && continue
    FILTERED=$(printf "%s\n" "$FILTERED" | grep -v "$MARK" || true)
  done <<< "$MARKERS"
fi

# Append active (uncommented) lines from config
ACTIVE=$(grep -E '^[^#].*# JOB:' "$CONF_FILE" || true)

# Additionally, remove any existing lines that reference the same script paths as ACTIVE jobs
# This prevents duplicates where an older unmarked cron remains alongside the managed job
if [ -n "$ACTIVE" ]; then
  SCRIPT_PATHS=$(printf "%s\n" "$ACTIVE" | grep -oE 'src/[A-Za-z0-9_\-/]+\.ts' | sort -u || true)
  if [ -n "$SCRIPT_PATHS" ]; then
    while read -r PATH_MATCH; do
      [ -z "$PATH_MATCH" ] && continue
      FILTERED=$(printf "%s\n" "$FILTERED" | grep -v "$PATH_MATCH" || true)
    done <<< "$SCRIPT_PATHS"
  fi
fi

NEW_CRON=$(printf "%s\n%s\n" "$FILTERED" "$ACTIVE" | sed '/^$/N;/^\n$/D')

printf "%s\n" "$NEW_CRON" | crontab -

echo "Installed cron jobs:"
crontab -l


