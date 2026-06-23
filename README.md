# Basira — Islamic Manuscript Copilot

> **بصيرة** ("insight") — a web platform that helps scholars **scan, read,
> transcribe, translate, and annotate** historic Islamic manuscripts.

Basira is an **assistive copilot**, not an autonomous system. Every generated
transcription and translation is a **machine-produced draft requiring expert
review** — the human scholar is always the final authority. All generated
artefacts are provenance-tracked (which adapter + model + version produced them,
and when).

This repository implements the MVP described in `SPEC_1.md`.

---

## Architecture at a glance

```
apps/web   React 18 + Vite SPA (zero-friction UI)
apps/api   Node 20 + Express (thin routes, fat services)
           ├─ adapters/   MODEL REGISTRY (transcribe / translate / ner)
           ├─ preprocess/ deskew, denoise, contrast, split
           ├─ exporters/  EXPORT REGISTRY (docx/pdf/txt/json/csv)
           ├─ jobs/       BullMQ handlers (one file per job type)
           └─ storage/    StorageProvider (minio | local | s3)
packages/shared  Zod schemas + TS types — the typed contract for both sides
```

Infrastructure (Postgres, Redis, MinIO) runs in Docker; the app runs on the host.

## Tech stack

TypeScript (strict) everywhere · React 18 + Vite + Tailwind · Express · Prisma +
PostgreSQL 16 · BullMQ + Redis · S3/MinIO object storage · `sharp` preprocessing ·
JWT (httpOnly cookie) auth · Zod validation · Vitest. Monorepo via pnpm
workspaces.

---

## Prerequisites

- **Node 20+** and **pnpm 9** (`corepack enable pnpm`)
- **Docker** (for Postgres, Redis, MinIO)

## Quick start

```bash
# 1. Install dependencies (also generates the Prisma client)
pnpm install

# 2. Configure environment
cp .env.example .env
#   - set JWT_SECRET to a long random string (openssl rand -base64 48)
#   - set MODEL_PROVIDER_API_KEY to enable the default LLM adapters (M3+)

# 3. Bring up infrastructure (Postgres, Redis, MinIO + bucket)
docker compose up -d

# 4. Apply the database schema and seed demo data
pnpm db:migrate     # or `pnpm db:push` for a quick non-migration sync
pnpm db:seed        # creates admin@basira.test / password123

# 5. Run the app (API + web, in parallel with hot reload)
pnpm dev
```

- Web app: http://localhost:5173
- API: http://localhost:4000 (`/healthz`, `/readyz`)
- MinIO console: http://localhost:9001 (`minioadmin` / `minioadmin`)

> The async job worker runs as a separate process. Start it with
> `pnpm --filter @basira/api worker` (added in M2).

## Local demo mode

Use this when you want to show the completed review UI without Kraken, an LLM
API key, or a real manuscript upload.

```bash
# Bring up Postgres, Redis, and MinIO first.
pnpm infra:up

# Seed a demo login plus one completed manuscript with page image,
# regions, transcription, translation, alignment, glosses, and provenance.
pnpm demo:seed

# Optional: run the app with deterministic demo adapters so the Generate
# transcription / Generate translation buttons also succeed locally.
pnpm dev:demo
```

Demo login:

| Email              | Password      |
| ------------------ | ------------- |
| `demo@basira.test` | `password123` |

Open the seeded project at `/project/demo-project-completed-flow`, then click
the manuscript page to see the image pane, region overlays, transcription,
translation, glossary disclosure, aligned-passage count, provenance labels, and
version controls.

## Common commands

| Command                | What it does                                                |
| ---------------------- | ----------------------------------------------------------- |
| `pnpm dev`             | Run API + web in parallel (hot reload)                      |
| `pnpm dev:demo`        | Run API + web with local demo transcribe/translate adapters |
| `pnpm build`           | Build all packages                                          |
| `pnpm test`            | Run all unit tests (Vitest)                                 |
| `pnpm typecheck`       | Type-check every package                                    |
| `pnpm db:migrate`      | Create/apply a Prisma migration                             |
| `pnpm db:studio`       | Open Prisma Studio                                          |
| `pnpm db:seed`         | Seed demo org + users + project                             |
| `pnpm demo:seed`       | Seed a completed manuscript review fixture                  |
| `docker compose up -d` | Start Postgres + Redis + MinIO                              |

## Demo credentials (local only)

| Role   | Email                | Password      |
| ------ | -------------------- | ------------- |
| admin  | `admin@basira.test`  | `password123` |
| editor | `editor@basira.test` | `password123` |
| viewer | `viewer@basira.test` | `password123` |

---

## Design rules (from the spec — keep these true)

1. **No monolithic files.** One responsibility per file; split anything over ~250 lines.
2. **Registry/adapter pattern for anything pluggable.** Adding a model backend,
   exporter, or preprocess step = one new file + one registry line.
3. **Complexity lives server-side.** The client uploads and reads; the server orchestrates.
4. **Everything is provenance-tracked.** No generated artefact is saved without provenance.
5. **The scholar is the final authority.** Generated text is always a draft — editable, versioned, flaggable.
6. **Type-safe end to end.** Shared Zod schemas; no `any` on API boundaries.
7. **Stub, don't fake.** Out-of-scope features expose a seam and throw `NotImplemented`.

## Build status

This is built in milestone order (see `SPEC_1.md` §16). See `docs/PROGRESS.md`
for what's landed.
