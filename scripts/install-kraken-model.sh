#!/usr/bin/env bash
# Install a trained Kraken recognition model (.mlmodel) into the running sidecar.
# Usage: scripts/install-kraken-model.sh <path-to-model.mlmodel>
set -euo pipefail

MODEL="${1:?usage: install-kraken-model.sh <path-to-model.mlmodel>}"
[ -f "$MODEL" ] || { echo "No such file: $MODEL" >&2; exit 1; }

CONTAINER="$(docker compose ps -q kraken 2>/dev/null || true)"
if [ -z "$CONTAINER" ]; then
  echo "Kraken sidecar isn't running. Start it: docker compose --profile kraken up -d kraken" >&2
  exit 1
fi

echo "→ Copying $(basename "$MODEL") into the sidecar's model volume…"
docker cp "$MODEL" "$CONTAINER:/models/recognition.mlmodel"
docker compose --profile kraken restart kraken >/dev/null
sleep 3
echo "→ Health:"
curl -s -m5 http://localhost:8500/healthz || true
echo
echo "Done. In .env set TRANSCRIBE_ADAPTER=kraken (and update KRAKEN_MODEL_NAME/"
echo "KRAKEN_MODEL_VERSION for provenance), then restart the app and re-transcribe."
