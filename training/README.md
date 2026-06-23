# Training a custom Kraken handwriting model (Muharaf)

> **Ready-to-run notebook:** open **`training/muharaf_kraken_colab.ipynb`** —
> connect a Colab GPU runtime and **Run All**. The steps below are the same cells,
> documented.

Goal: a Kraken **recognition** model for historical Arabic *handwriting*, to
replace the printed-Arabic OpenITI model. We transfer-learn from the OpenITI
model (it already knows the Arabic alphabet) on the **`aamijar/muharaf-public`**
line dataset (24,495 line image↔text pairs).

> ⚠️ **Licence — verified at source.** The Muharaf authors distribute the dataset
> under **CC BY-NC-SA 4.0 (non-commercial)** — confirmed on the official
> [GitHub repo](https://github.com/MehreenMehreen/muharaf) ("We distribute this
> dataset under the CC BY-NC-SA 4.0.") and [Zenodo record](https://zenodo.org/records/11492215).
> A third-party Hugging Face mirror mislabels it "MIT" — that label is **invalid**
> (a re-uploader cannot relicense the authors' work). Treat **all** Muharaf mirrors
> as non-commercial.
>
> ➡️ A model trained on Muharaf is for **R&D / feasibility evaluation only**.
> The **commercial production model** must be trained on data you have rights to:
> your own scholar-corrected pages (the in-app flywheel), commissioned
> transcriptions of public-domain manuscripts, or a separately negotiated
> commercial licence from the Muharaf authors. Confirm with counsel before any
> commercial use.

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

## Plug it into the local app — DEMO-GATED (non-commercial)

Because Muharaf is non-commercial, this model is installed into the **gated
`muharaf` slot**, reachable only via the `kraken-muharaf` adapter, which is
**restricted to the demo user**. Commercial users can never invoke it, and its
outputs are excluded from the ground-truth/training export.

From the repo root, with the Kraken sidecar running:

```bash
scripts/install-kraken-model.sh ~/Downloads/muharaf_hw_best.mlmodel muharaf
```

Then in `.env`:

```
DEMO_TRANSCRIBE_ADAPTER=kraken-muharaf   # demo user's transcriptions use it
# RESTRICTED_TRANSCRIBE_ADAPTERS=kraken-muharaf  (already set — keeps it gated)
```

Restart the app (`pnpm dev`), log in as the **demo user** (`demo@basira.test`),
and transcribe — it runs the handwriting model. Any other user is blocked (403).

## The commercial path — owned data, no licence issue

For the production model, don't train on Muharaf. Use **your own** scholar-
corrected pages: in the app, open a manuscript → **Training data** (toolbar) to
download a Kraken-trainable ZIP (`GET /manuscripts/:id/ground-truth`). It emits
line image ↔ text pairs from corrected transcriptions and **excludes any page
transcribed by a restricted model**, so the training set stays commercially
clean. Feed that ZIP into the same `ketos train` flow above.

## Notes

- This improves **recognition**. End-to-end on a *new* page also needs good
  **line segmentation** — our sidecar uses the light box segmenter (fits 3.8 GB
  Docker); for dense cursive pages the neural baseline segmenter reads better but
  needs ~6–8 GB Docker (`KRAKEN_SEG_MODE=baseline`). The test in step 5 measures
  pure recognition (lines are pre-cut), so it isolates the model's quality.
- Whether it nails *your specific* manuscript depends on hand similarity to
  Muharaf. The durable win is continuing to fine-tune on your own corrected
  pages captured in Basira.
