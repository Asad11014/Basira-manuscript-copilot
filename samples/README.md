# Sample manuscripts (for accuracy testing)

Drop manuscript **page images** here in `samples/inbox/` to test transcription
and translation accuracy:

```
samples/inbox/page1.jpg
samples/inbox/page2.png
samples/inbox/page3.tiff
```

Accepted: JPG, PNG, TIFF, WEBP, PDF (one page each is ideal for a quick test).

Then, with the app + Kraken sidecar running, ingest and transcribe them:

```bash
# Transcription only (free, local via Kraken):
scripts/ingest-samples.sh

# Transcription + translation (translation needs MODEL_PROVIDER_API_KEY):
scripts/ingest-samples.sh --translate
```

The script uploads each image as its own manuscript under a "Sample Test"
project, runs Kraken transcription, and (optionally) Claude translation, then
prints the results so you can eyeball accuracy. Afterwards they're visible in
the web UI to review like an end user.

> Note: the bundled Kraken model is trained on **printed** Arabic. Clean printed
> / lithograph pages transcribe very well; cursive handwritten manuscripts will
> be much less accurate with this model — that's expected, and the point of the
> test. See `docs/PROGRESS.md` for the handwriting path.
