"""Materialise the Muharaf line dataset into Kraken training format.

`aamijar/muharaf-public` ships line-level images already paired with their
transcription, so each row maps directly to a Kraken training pair:

    data/<split>/<n>.png        # the line image
    data/<split>/<n>.gt.txt     # the ground-truth transcription (UTF-8)

`ketos train` reads the `.gt.txt` sitting next to each image (format-type=path).

Usage:
    pip install "datasets>=2.19" pillow
    python prepare_muharaf.py --out data --dataset aamijar/muharaf-public
"""

import argparse
import os

from datasets import load_dataset


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="data")
    ap.add_argument("--dataset", default="aamijar/muharaf-public")
    args = ap.parse_args()

    ds = load_dataset(args.dataset)
    for split in ds:
        out_dir = os.path.join(args.out, split)
        os.makedirs(out_dir, exist_ok=True)
        written = 0
        for i, row in enumerate(ds[split]):
            text = (row.get("text") or "").strip()
            if not text:
                continue  # skip empty lines — they teach the model nothing
            image = row["image"]
            if image.mode not in ("RGB", "L"):
                image = image.convert("RGB")
            base = os.path.join(out_dir, f"{i:06d}")
            image.save(base + ".png")
            with open(base + ".gt.txt", "w", encoding="utf-8") as fh:
                fh.write(text)
            written += 1
        print(f"{split}: wrote {written} line pairs -> {out_dir}")


if __name__ == "__main__":
    main()
