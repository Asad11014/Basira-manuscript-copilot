#!/usr/bin/env bash
# Ingest the images in samples/inbox/ as manuscripts, run Kraken transcription,
# and (with --translate) Claude translation. Prints results for eyeballing.
#
# Requires: the app running (`pnpm dev`), Kraken sidecar up
# (`docker compose --profile kraken up -d kraken`), and (for --translate)
# MODEL_PROVIDER_API_KEY set in .env.
set -euo pipefail

API="${API_URL:-http://localhost:4000}"
WEB="${WEB_URL:-http://localhost:5173}"
EMAIL="${EMAIL:-editor@basira.test}"
PASS="${PASS:-password123}"
TRANSLATE=0
[ "${1:-}" = "--translate" ] && TRANSLATE=1

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INBOX="$ROOT/samples/inbox"
JAR="$(mktemp)"
trap 'rm -f "$JAR"' EXIT

jqpy() { python3 -c "import json,sys; d=json.load(sys.stdin); print($1)"; }

echo "→ Logging in as $EMAIL"
curl -fsS -c "$JAR" -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" >/dev/null

PID=$(curl -fsS -b "$JAR" -X POST "$API/projects" -H 'Content-Type: application/json' \
  -d '{"name":"Sample Test","description":"Accuracy test ingest"}' | jqpy "d['id']")
echo "→ Project: $PID"

shopt -s nullglob
files=("$INBOX"/*.{jpg,jpeg,png,tif,tiff,webp,pdf,JPG,JPEG,PNG,TIF,TIFF,WEBP,PDF})
if [ ${#files[@]} -eq 0 ]; then
  echo "No images found in $INBOX — drop your manuscript pages there first." >&2
  exit 1
fi

poll_job() { # $1 = job id
  for _ in $(seq 1 40); do
    st=$(curl -fsS -b "$JAR" "$API/jobs/$1" | jqpy "d['status']")
    [ "$st" = done ] && return 0
    [ "$st" = failed ] && { curl -fsS -b "$JAR" "$API/jobs/$1" | jqpy "'   FAILED: '+str(d['error'])"; return 1; }
    sleep 3
  done
  echo "   timed out waiting for job $1"; return 1
}

for f in "${files[@]}"; do
  name="$(basename "$f")"
  echo; echo "════════ $name ════════"
  ms=$(curl -fsS -b "$JAR" -X POST "$API/manuscripts" \
    -F "projectId=$PID" -F "title=$name" -F 'sourceLanguage=ar' -F 'script=naskh' \
    -F "file=@$f")
  page=$(echo "$ms" | jqpy "d['pages'][0]['id']")
  echo "→ uploaded; first page $page; preprocessing…"; sleep 5

  echo "→ transcribing (Kraken)…"
  job=$(curl -fsS -b "$JAR" -X POST "$API/pages/$page/transcribe" \
    -H 'Content-Type: application/json' -d '{"sourceLanguageHint":"ar"}' | jqpy "d['id']")
  if poll_job "$job"; then
    curl -fsS -b "$JAR" "$API/pages/$page/transcriptions" | python3 -c "
import json,sys; d=json.load(sys.stdin); t=[x for x in d if x['isCurrent']][0]
print('--- TRANSCRIPTION ('+t['provenance']['modelName']+') ---'); print(t['text'])"
  fi

  if [ "$TRANSLATE" -eq 1 ]; then
    echo "→ translating (Claude)…"
    job=$(curl -fsS -b "$JAR" -X POST "$API/pages/$page/translate" \
      -H 'Content-Type: application/json' -d '{"targetLang":"en","wantGlosses":true}' | jqpy "d['id']")
    tid=$(curl -fsS -b "$JAR" "$API/pages/$page/transcriptions" | jqpy "[x for x in d if x['isCurrent']][0]['id']")
    if poll_job "$job"; then
      curl -fsS -b "$JAR" "$API/transcriptions/$tid/translations" | python3 -c "
import json,sys; d=json.load(sys.stdin); t=[x for x in d if x['isCurrent']][0]
print('--- TRANSLATION ('+t['provenance']['modelName']+') ---'); print(t['text'])"
    fi
  fi
done

echo; echo "✓ Done. Review in the UI: $WEB/project/$PID"
