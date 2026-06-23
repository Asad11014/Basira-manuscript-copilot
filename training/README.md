# Training a custom Kraken handwriting model (Muharaf)

Goal: a Kraken **recognition** model for historical Arabic *handwriting*, to
replace the printed-Arabic OpenITI model. We transfer-learn from the OpenITI
model (it already knows the Arabic alphabet) on the **`aamijar/muharaf-public`**
line dataset (24,495 line image↔text pairs).

> ⚠️ **Licence:** `aamijar/muharaf-public` is **CC-BY-NC-SA-4.0 (non-commercial)**.
> Use the resulting model for **R&D / evaluation only**. For a commercial model,
> retrain on the **MIT-licensed `TheRealOKAI/muharaf-public-pages`** (segment it
> into lines first) or on your own corrected pages (the in-app flywheel).

> 🖥️ **Run this on a GPU** (Google Colab / Kaggle free tier). 22k lines on the
> local CPU-only Docker would take far too long. The output `.mlmodel` then plugs
> into the local Kraken sidecar with no code change.

## Colab steps

**0. Runtime → Change runtime type → GPU (T4 is fine).**

**1. Install + fetch this prep script**

```bash
!pip install -q "kraken>=5,<8" "datasets>=2.19" pillow
!wget -q https://raw.githubusercontent.com/Asad11014/Basira-manuscript-copilot/main/training/prepare_muharaf.py
```

**2. Build Kraken training pairs from the line dataset**

```bash
!python prepare_muharaf.py --out data --dataset aamijar/muharaf-public
# -> data/train/*.png + *.gt.txt, data/validation/..., data/test/...
```

**3. Fetch the OpenITI Arabic base model (for transfer learning)**

```bash
!kraken get 10.5281/zenodo.7050270
# note the printed path to all_arabic_scripts.mlmodel, e.g.
# ~/.local/share/htrmopo/<uuid>/all_arabic_scripts.mlmodel
BASE=$(find ~ -name 'all_arabic_scripts.mlmodel' | head -1); echo "$BASE"
```

**4. Train (transfer-learn on the handwriting lines)**

```bash
# Flags occasionally change between kraken versions — verify with
# `ketos train --help`. `--resize union` adapts the character set to Muharaf.
!ketos train -d cuda:0 --format-type path --resize union \
    -i "$BASE" -o muharaf_hw \
    -e $(ls data/validation/*.png) \
    $(ls data/train/*.png)
```

Early-stopping writes `muharaf_hw_best.mlmodel`. Expect a few hours on a T4.

**5. Evaluate on the held-out test split (clean recognition CER)**

```bash
!ketos test -d cuda:0 --format-type path -m muharaf_hw_best.mlmodel \
    $(ls data/test/*.png)
# Reports character accuracy / CER. Compare to the printed model + to Claude's
# ~38% confidence baseline. Sub-10% CER on this hand class is a strong result.
```

**6. Download the model**

```python
from google.colab import files
files.download('muharaf_hw_best.mlmodel')
```

## Plug it into the local app

From the repo root, with the Kraken sidecar running:

```bash
scripts/install-kraken-model.sh ~/Downloads/muharaf_hw_best.mlmodel
```

Then set provenance + ensure the adapter in `.env`:

```
TRANSCRIBE_ADAPTER=kraken
KRAKEN_MODEL_NAME=kraken-muharaf-handwriting
KRAKEN_MODEL_VERSION=Muharaf handwriting (transfer-learned from OpenITI)
```

Restart the app (`pnpm dev`) and re-transcribe a page in the UI.

## Notes

- This improves **recognition**. End-to-end on a *new* page also needs good
  **line segmentation** — our sidecar uses the light box segmenter (fits 3.8 GB
  Docker); for dense cursive pages the neural baseline segmenter reads better but
  needs ~6–8 GB Docker (`KRAKEN_SEG_MODE=baseline`). The test in step 5 measures
  pure recognition (lines are pre-cut), so it isolates the model's quality.
- Whether it nails *your specific* manuscript depends on hand similarity to
  Muharaf. The durable win is continuing to fine-tune on your own corrected
  pages captured in Basira.
