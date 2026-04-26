#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/web"
exec npm run supplier-poll:scheduled
