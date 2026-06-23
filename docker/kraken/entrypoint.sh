#!/bin/sh
set -e
mkdir -p /models

# If a model DOI is provided and no model is mounted, try to fetch one.
# Kraken stores fetched models in its app dir; copy the first .mlmodel to KRAKEN_MODEL.
if [ ! -f "$KRAKEN_MODEL" ] && [ -n "$KRAKEN_MODEL_DOI" ]; then
  echo "Fetching Kraken model: $KRAKEN_MODEL_DOI"
  kraken get "$KRAKEN_MODEL_DOI" || echo "WARN: model fetch failed; starting without a model"
  found=$(find /root /usr -name '*.mlmodel' 2>/dev/null | grep -vi blla | head -1 || true)
  if [ -n "$found" ]; then
    echo "Installing model: $found -> $KRAKEN_MODEL"
    cp "$found" "$KRAKEN_MODEL"
  fi
fi

if [ -f "$KRAKEN_MODEL" ]; then
  echo "Kraken model ready: $KRAKEN_MODEL"
else
  echo "No recognition model present yet (/transcribe will return 503 until one is installed)."
fi

exec python /app/app.py
