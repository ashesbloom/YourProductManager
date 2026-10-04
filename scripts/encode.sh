#!/usr/bin/env bash
# Encode one lecture into 720p + 360p HLS (6s chunks) under media/<lecture-id>/ and print its catalog line.
# Usage: scripts/encode.sh <source-video> <lecture-id> "<title>"
#        CLIP=120 scripts/encode.sh …   # first 120s only, for local dev
set -euo pipefail
src=$1 id=$2 title=$3
[[ $id =~ ^[a-z0-9-]+$ ]] || { echo "lecture id must match [a-z0-9-]+" >&2; exit 1; }
out="media/$id"
rm -rf "$out" && mkdir -p "$out"

ffmpeg -hide_banner -loglevel error -stats -y ${CLIP:+-t "$CLIP"} -i "$src" \
  -filter_complex "[0:v]split=2[a][b];[a]scale=-2:720[v720];[b]scale=-2:360[v360]" \
  -map "[v720]" -map 0:a:0 -map "[v360]" -map 0:a:0 \
  -c:v libx264 -preset slow -profile:v main -crf 23 \
  -maxrate:v:0 1500k -bufsize:v:0 3000k -maxrate:v:1 400k -bufsize:v:1 800k \
  -force_key_frames "expr:gte(t,n_forced*6)" -sc_threshold 0 \
  -c:a aac -b:a 96k -ac 1 -ar 48000 \
  -f hls -hls_time 6 -hls_playlist_type vod -hls_flags independent_segments \
  -hls_segment_filename "$out/%v/seg_%04d.ts" \
  -master_pl_name master.m3u8 \
  -var_stream_map "v:0,a:0,name:720p v:1,a:1,name:360p" \
  "$out/%v/index.m3u8"

# Duration of what was actually encoded (so CLIP runs get the clip length).
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out/720p/index.m3u8")
node -e 'const [id, t, d] = process.argv.slice(1); console.log(`  L(${JSON.stringify(id)}, ${JSON.stringify(t)}, false, ${Math.round(+d)}),`)' "$id" "$title" "$dur"
