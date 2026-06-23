"""Minimal HTTP wrapper around the Kraken CLI.

POST /transcribe  (multipart: image)  -> {text, lines[], confidence, model_name, model_version}
GET  /healthz                          -> {status, model_present}

Pipeline is configurable via env:
  KRAKEN_SEG_MODE  box | baseline   (default box — lightweight, ideal for printed
                                     text; baseline is the neural segmenter, far
                                     more memory-hungry — give Docker 6-8 GB)
  KRAKEN_BASE_DIR  L | R | auto      (default R — Arabic/Persian/Ottoman are RTL)

If no recognition model is present, /transcribe returns 503 with a clear message.
"""

import os
import subprocess
import tempfile

from flask import Flask, jsonify, request

app = Flask(__name__)

MODEL = os.environ.get("KRAKEN_MODEL", "/models/recognition.mlmodel")
MODEL_NAME = os.environ.get("KRAKEN_MODEL_NAME", os.path.basename(MODEL))
MODEL_VERSION = os.environ.get("KRAKEN_MODEL_VERSION", "kraken")
SEG_MODE = os.environ.get("KRAKEN_SEG_MODE", "box")
BASE_DIR = os.environ.get("KRAKEN_BASE_DIR", "R")


def build_command(in_path: str, out_path: str) -> list[str]:
    cmd = ["kraken", "-i", in_path, out_path]
    if SEG_MODE == "baseline":
        cmd += ["segment", "-bl", "ocr"]
    else:
        # Legacy box segmenter on a binarized image — light and accurate on print.
        cmd += ["binarize", "segment", "ocr"]
    cmd += ["--base-dir", BASE_DIR, "-m", MODEL]
    return cmd


@app.get("/healthz")
def healthz():
    return jsonify(
        {
            "status": "ok",
            "model_present": os.path.exists(MODEL),
            "seg_mode": SEG_MODE,
            "base_dir": BASE_DIR,
        }
    )


@app.post("/transcribe")
def transcribe():
    if not os.path.exists(MODEL):
        return (
            jsonify(
                {
                    "error": (
                        f"No recognition model at {MODEL}. Install a Kraken .mlmodel "
                        "(see KRAKEN_MODEL_DOI / scripts)."
                    )
                }
            ),
            503,
        )
    if "image" not in request.files:
        return jsonify({"error": "missing 'image' file"}), 400

    with tempfile.TemporaryDirectory() as d:
        in_path = os.path.join(d, "in.png")
        out_path = os.path.join(d, "out.txt")
        request.files["image"].save(in_path)

        proc = subprocess.run(
            build_command(in_path, out_path),
            capture_output=True,
            text=True,
        )
        if proc.returncode != 0 or not os.path.exists(out_path):
            detail = (proc.stderr or proc.stdout or "kraken failed").strip()
            # "Killed" almost always means OOM under the neural segmenter.
            if "Killed" in detail:
                detail += (
                    " — the process was killed (likely out of memory). Use "
                    "KRAKEN_SEG_MODE=box, or give Docker more memory for baseline."
                )
            return jsonify({"error": detail[-2000:]}), 500

        with open(out_path, encoding="utf-8") as fh:
            text = fh.read()

    lines = [{"text": line} for line in text.splitlines() if line.strip()]
    return jsonify(
        {
            "text": text.strip(),
            "lines": lines,
            "confidence": None,
            "model_name": MODEL_NAME,
            "model_version": MODEL_VERSION,
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8500)
