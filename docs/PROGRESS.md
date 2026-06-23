# Build progress

Built in milestone order per `SPEC_1.md` §16.

## ✅ M0 — Scaffold

- pnpm monorepo (`apps/web`, `apps/api`, `packages/shared`).
- `packages/shared`: Zod schemas + TS types (constants, common/provenance,
  auth, user, org, project, manuscript, page, region, job). Vitest unit tests.
- `apps/api`: Express bootstrap (thin `index.ts` → `app.ts`), config (Zod env
  validation), pino logger, Prisma client, Redis factory, typed HTTP error
  plumbing + `NotImplementedError` seam, health routes (`/healthz`, `/readyz`).
- `apps/web`: React 18 + Vite + Tailwind + React Router + React Query; typed API
  client; RTL-ready fonts; M0 landing page that verifies API connectivity.
- Prisma schema for the full data model (§7) + initial migration + dev seed.
- Docker Compose: Postgres, Redis, MinIO (+ bucket bootstrap).
- `.env.example`, README with onboarding.

**DoD met:** `docker compose up` + `pnpm dev` runs a wired app; `pnpm test` and
`pnpm typecheck` pass.

### Environment note (local gotcha)

The Docker Postgres is mapped to **host port 5433** (not 5432) because a local
Postgres already occupies 5432 on this machine; on macOS `localhost` resolves to
IPv6 first and would otherwise hit the wrong server (Prisma P1010). See
`DATABASE_URL` in `.env.example`.

## ✅ M1 — Auth + projects

- Email/password auth: `POST /auth/register` (provisions org + admin user),
  `/auth/login`, `/auth/logout`, `GET /auth/me`. JWT in an httpOnly cookie;
  bcrypt hashing. `authProvider` seam (default `password` provider) for future SSO.
- RBAC middleware: `requireAuth` (loads user fresh per request), `requireRole`.
  Org scoping in every service (a user only sees their org's data).
- Projects CRUD (`/projects`), org-scoped, cursor-paginated; editor/admin write,
  viewer read-only.
- Audit-log skeleton (`recordAudit`) writing register/login/project events.
- Web: login/register page, auth hook + route guard, app shell, projects
  dashboard with create.

**DoD met & verified live:** register → login → create project; viewer create
returns 403; unauth returns 401.

## ✅ M2 — Upload + workspace

- `StorageProvider` interface with local-disk and S3/MinIO implementations,
  resolved by `STORAGE_DRIVER`.
- Multipart upload (`POST /manuscripts`); file split into page images — PDFs
  rasterised (pdf.js + napi canvas, standard fonts), ZIPs unpacked in order,
  single images pass through. Original preserved for provenance.
- Async job pipeline: BullMQ queue + handler registry + worker (runs in-process
  in dev, standalone via `pnpm worker`); `Job` row created before enqueue;
  `GET /jobs/:id` polling + working SSE stream (`/jobs/:id/stream`).
- Preprocess job: orient → deskew (projection-profile) → denoise → contrast,
  processed + thumbnail variants, region detection (textblock + line bands).
- Routes: `GET /manuscripts/:id` (+ `/pages`), `GET /pages/:id`,
  `GET /pages/:id/image?variant=`, `GET /projects/:id/manuscripts`.
- Web: upload form, project detail, manuscript page-grid (auto-refresh while
  processing), page workspace with clickable region overlays + draft disclaimer.

**DoD met & verified live:** uploaded a 2-page PDF → pages rasterised,
preprocessed, 1 textblock + 19 line regions detected, all image variants serve.

## ✅ M3 — Transcription

- Model adapter registry (§8): `registerAdapter` / `resolveTranscribeAdapter`
  by key; config picks the active adapter. Switching adapters needs no call-site
  change (§17.10).
- Default `llm-vision` transcribe adapter (Anthropic Claude vision) with a
  versioned prompt file (never inlined), strict Zod-parsed JSON envelope, and a
  JSON-salvage fallback. `transkribus` registered as a `NotImplemented` seam.
- Transcribe job handler: resolves adapter → runs on the page image → saves a
  versioned `Transcription` with mandatory provenance. `POST /pages/:id/transcribe`.
- Versioning service (append-only): `GET /pages/:id/transcriptions`,
  `PUT /transcriptions/:id` (human edit → new version, human provenance).
- Web: RTL-aware editor (`dir="rtl"`, Naskh font, NFC-normalise on save),
  confidence badge, version dropdown, generate/re-transcribe/save, draft +
  provenance labelling. Job-polling hook.

**DoD met & verified live:** transcribe job wires through registry → worker →
adapter and fails gracefully with a clear error when no model key is set; editing
a transcription creates v2 and flips `isCurrent` (v1 retained). Real generation
needs `MODEL_PROVIDER_API_KEY`.

## ✅ M4 — Translation + review

- Default `llm` translate adapter (domain-adapted prompt, source↔target
  alignment, glosses) with versioned prompt file and per-project glossary
  injection. Registered in the model registry.
- Translate job handler: resolves the page's CURRENT transcription + project
  glossary → runs adapter → saves a versioned `Translation`. `POST /pages/:id/translate`.
- Translation versioning per (transcription, targetLang): `PUT /translations/:id`,
  `GET /transcriptions/:id/translations`. Glossary editable via `PATCH /projects/:id`.
- Web: side-by-side transcription + translation panes with proportional
  synchronised scroll (`SyncScrollProvider`), target-language selector,
  generate/re-translate/save, glosses disclosure, alignment count, draft +
  provenance labelling. Per-project glossary editor on the project page.
- Local demo support: `demo` transcribe/translate adapters plus
  `pnpm demo:seed` create a completed manuscript review fixture without Kraken
  or an LLM key.

**DoD met & verified live:** translate job wires through registry → current
transcription → glossary → adapter (fails gracefully without a model key);
editing a translation creates v2 and flips `isCurrent`; glossary PATCH persists.

## ✅ Transcription engine — Kraken (free, local)

- `kraken` transcribe adapter (HTTP → sidecar) registered in the model registry;
  set `TRANSCRIBE_ADAPTER=kraken`.
- Kraken Docker sidecar (`docker/kraken/`, compose `kraken` profile): Flask
  wrapper around the Kraken CLI; auto-downloads a recognition model on first boot
  (`KRAKEN_MODEL_DOI`).
- Model: **OpenITI printed Arabic** (`10.5281/zenodo.7050270`).
- Working recipe (fits ~3.8 GB Docker RAM): **box segmentation + binarize +
  `--base-dir R`**. The neural baseline segmenter OOMs at 3.8 GB → use
  `KRAKEN_SEG_MODE=baseline` only with ~6–8 GB Docker.
- **Verified end-to-end** (app + `scripts/ingest-samples.sh`): clean printed
  Arabic transcribes at ~100% with correct logical RTL order.
- Caveat: model is trained on **printed** Arabic — cursive handwritten
  manuscripts will be far less accurate with it (no strong free off-the-shelf
  handwritten Arabic model exists; that path needs a trained model + baseline
  segmenter, or a vision-LLM/Transkribus adapter).
- Translation still uses Claude (`MODEL_PROVIDER_API_KEY`).

## ✅ M5 — Annotation, entities, search, versions

- Annotation layer: `POST /annotations`, `PATCH /annotations/:id`,
  `GET /pages/:id/annotations`. Kinds: comment / gloss / citationFlag /
  uncertainFlag; anchored to page or transcription. Any authenticated user may
  annotate (viewers comment); author or editor/admin can resolve/edit.
- NER: default `llm` adapter + versioned prompt + `ner` job handler. Detects
  people/works/places/citations from the current transcription; server derives
  char spans by locating surface text. `POST /pages/:id/ner`,
  `GET /pages/:id/entities`. Provenance stamped.
- Search: `GET /search?q=&projectId=&scope=` across transcriptions,
  translations, and annotations — org-scoped, snippeted. Web search page + nav.
- Web: annotation rail (add/resolve), entities panel (detect + grouped chips),
  search page; version history surfaced via the transcription/translation
  dropdowns with provenance.

**DoD met & verified live:** comment on a passage (incl. as a viewer → 201;
viewer transcribe → 403); search returns Arabic hits across manuscripts; NER
wires through registry → worker → adapter (real entities need a model key).

## ✅ M6 — Export, admin, batch, audit

- Export registry (`Exporter` interface): **txt, json, csv, docx, pdf** — adding
  a format = one file + one registry line (TEI-XML is the documented seam).
  DOCX uses RTL runs; PDF embeds shaped Arabic rendered via canvas (pdfkit can't
  shape Arabic) using the bundled Amiri font. `POST /exports` → job →
  `GET /exports/:id/download`.
- Admin (admin-only): `GET/POST /admin/users`, `PATCH /admin/users/:id`
  (role/disable, seat-limit enforced), `GET /admin/seats`, `GET /admin/audit`
  (queryable, date-filtered).
- Batch: `POST /manuscripts/:id/batch {steps[]}` → batch job runs the steps over
  every page in order (reuses step handlers), reporting aggregate progress.
- Web: manuscript toolbar (export format picker + batch button), admin page
  (users table, create, role/disable, seats, audit log), admin nav link.

**DoD met & verified live:** all 5 formats generate + download with correct
content types (DOCX valid Word; PDF valid with embedded Arabic); admin
list/create/role/disable + queryable audit; editor→403 on admin; batch job
0→50→100%. **All §17 acceptance criteria are now exercised** (real LLM
transcription/translation/NER still require `MODEL_PROVIDER_API_KEY`; Kraken
transcription works key-free).

## ⏳ Upcoming

- M5 — Annotation, entities, search, versions
- M6 — Export, admin, batch, audit
- M4 — Translation + review
- M5 — Annotation, entities, search, versions
- M6 — Export, admin, batch, audit
