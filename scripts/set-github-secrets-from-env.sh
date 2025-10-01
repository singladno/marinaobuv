#!/usr/bin/env bash

# Usage:
#   scripts/set-github-secrets-from-env.sh path/to/envfile OWNER/REPO
#
# Requirements:
#   - GitHub CLI installed: https://cli.github.com/
#   - Authenticated: gh auth login
#
# Notes:
#   - Lines starting with # are ignored
#   - Empty lines are ignored
#   - Export statements are supported (export KEY=VALUE)
#   - Quotes around values are stripped

set -euo pipefail

ENV_FILE=${1:-}
REPO=${2:-}

if [[ -z "${ENV_FILE}" || -z "${REPO}" ]]; then
  echo "Usage: $0 path/to/envfile OWNER/REPO"
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) not found. Install from https://cli.github.com/"
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Error: env file not found: ${ENV_FILE}"
  exit 1
fi

# Function to normalize a line KEY=VALUE -> KEY VALUE (strips quotes)
parse_line() {
  local line="$1"
  # remove leading/trailing spaces
  line="$(echo "$line" | sed -E 's/^\s+|\s+$//g')"
  # support export
  line="$(echo "$line" | sed -E 's/^export\s+//')"
  # ensure it looks like KEY=VALUE
  if [[ "$line" != *"="* ]]; then
    return 1
  fi
  local key="${line%%=*}"
  local value="${line#*=}"
  # strip surrounding quotes if present
  value="$(echo "$value" | sed -E 's/^"(.*)"$/\1/; s/^\'(.*)\'$/\1/')"
  # trim spaces around key
  key="$(echo "$key" | sed -E 's/^\s+|\s+$//g')"
  # guard against empty key
  if [[ -z "$key" ]]; then
    return 1
  fi
  echo "$key" "$value"
}

# Confirm repo has correct format
if [[ "$REPO" != *"/"* ]]; then
  echo "Error: REPO must be in OWNER/REPO format"
  exit 1
fi

updated=0
skipped=0

while IFS= read -r raw || [[ -n "$raw" ]]; do
  # skip comments and empty lines
  if [[ -z "$(echo "$raw" | tr -d ' \t')" ]] || [[ "$raw" =~ ^\s*# ]]; then
    continue
  fi
  if parsed=$(parse_line "$raw"); then
    key=$(echo "$parsed" | awk '{print $1}')
    value=${parsed#*$key }
    if [[ -z "$value" ]]; then
      echo "Skipping $key (empty value)"
      ((skipped++))
      continue
    fi
    # Set secret using gh CLI
    printf "%s" "$value" | gh secret set "$key" --repo "$REPO" --app actions --body - >/dev/null && {
      echo "Set secret: $key"
      ((updated++))
    }
  else
    echo "Skipping invalid line: $raw"
    ((skipped++))
  fi
done < "$ENV_FILE"

echo "Done. Updated $updated secrets. Skipped $skipped lines."
