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


def build_command(in_path: str, out_path: str, model_path: str) -> list[str]:
    cmd = ["kraken", "-i", in_path, out_path]
    if SEG_MODE == "baseline":
        cmd += ["segment", "-bl", "ocr"]
    else:
        # Legacy box segmenter on a binarized image — light and accurate on print.
        cmd += ["binarize", "segment", "ocr"]
    cmd += ["--base-dir", BASE_DIR, "-m", model_path]
    return cmd


def resolve_model(model_param):
    """Pick the recognition model. A `model` form field selects
    /models/<name>.mlmodel (e.g. 'muharaf'); otherwise the default is used."""
    if model_param:
        safe = os.path.basename(str(model_param))  # block path traversal
        path = f"/models/{safe}.mlmodel"
        return path, f"kraken-{safe}", f"{safe}.mlmodel"
    return MODEL, MODEL_NAME, MODEL_VERSION


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
    model_path, model_name, model_version = resolve_model(request.form.get("model"))
    if not os.path.exists(model_path):
        return (
            jsonify(
                {
                    "error": (
                        f"No recognition model at {model_path}. Install a Kraken "
                        ".mlmodel there (see scripts/install-kraken-model.sh)."
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
            build_command(in_path, out_path, model_path),
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
            "model_name": model_name,
            "model_version": model_version,
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8500)
