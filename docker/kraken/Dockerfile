# Kraken HTR sidecar. Free, open-source handwritten-text recognition.
# Exposes POST /transcribe (multipart image) -> JSON {text, lines, ...}.
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    KRAKEN_MODEL=/models/recognition.mlmodel \
    KRAKEN_MODEL_NAME=kraken

# libgomp1 is needed by torch/scipy at runtime; the rest ship as wheels.
RUN apt-get update \
 && apt-get install -y --no-install-recommends libgomp1 ca-certificates \
 && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir kraken flask

COPY app.py entrypoint.sh /app/
RUN chmod +x /app/entrypoint.sh

EXPOSE 8500
ENTRYPOINT ["/app/entrypoint.sh"]
