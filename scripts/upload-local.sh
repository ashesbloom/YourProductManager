#!/usr/bin/env bash
# Copy one encoded lecture (media/<lecture-id>/) into the local R2 that `npm run dev` reads.
# ponytail: one wrangler call per file (~1s each) — fine for dev clips; production uses rclone (README).
# Usage: scripts/upload-local.sh <lecture-id>
set -euo pipefail
id=$1
cd media
find "$id" -type f | while read -r f; do
  npx wrangler r2 object put "ypm-media/$f" --file "$f" --local >/dev/null
  echo "uploaded $f"
done
