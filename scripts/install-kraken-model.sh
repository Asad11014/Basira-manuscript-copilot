#!/usr/bin/env bash
# Install a trained Kraken recognition model (.mlmodel) into the running sidecar.
# Usage: scripts/install-kraken-model.sh <path-to-model.mlmodel> [slot]
#   slot defaults to "recognition" (the default model used by TRANSCRIBE_ADAPTER=kraken)
#   use "muharaf" for the demo-gated handwriting model (adapter kraken-muharaf)
set -euo pipefail

MODEL="${1:?usage: install-kraken-model.sh <path-to-model.mlmodel> [slot]}"
SLOT="${2:-recognition}"
[ -f "$MODEL" ] || { echo "No such file: $MODEL" >&2; exit 1; }

CONTAINER="$(docker compose ps -q kraken 2>/dev/null || true)"
if [ -z "$CONTAINER" ]; then
  echo "Kraken sidecar isn't running. Start it: docker compose --profile kraken up -d kraken" >&2
  exit 1
fi

echo "→ Copying $(basename "$MODEL") into the sidecar as /models/${SLOT}.mlmodel…"
docker cp "$MODEL" "$CONTAINER:/models/${SLOT}.mlmodel"
docker compose --profile kraken restart kraken >/dev/null
sleep 3
echo "→ Health:"
curl -s -m5 http://localhost:8500/healthz || true
echo
if [ "$SLOT" = "muharaf" ]; then
  echo "Done. This is the demo-gated handwriting model. In .env set"
  echo "DEMO_TRANSCRIBE_ADAPTER=kraken-muharaf, restart the app, and the DEMO"
  echo "user's transcriptions will use it (non-demo users are blocked)."
else
  echo "Done. In .env set TRANSCRIBE_ADAPTER=kraken (and update KRAKEN_MODEL_NAME/"
  echo "KRAKEN_MODEL_VERSION for provenance), then restart the app and re-transcribe."
fi
