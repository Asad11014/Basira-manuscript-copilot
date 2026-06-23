import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/db.js";
import { buildProvenance } from "../src/provenance/stamp.js";
import { getStorage } from "../src/storage/index.js";
import {
  DEMO_GLOSSES,
  DEMO_MODEL,
  DEMO_PAGE_REGIONS,
  DEMO_PROJECT_GLOSSARY,
  DEMO_SOURCE_LINES,
  DEMO_SOURCE_TEXT,
  DEMO_TRANSCRIPTION_CONFIDENCE,
  buildDemoPageSvg,
  demoAlignmentFor,
  demoTranslationTextFor,
} from "../src/demo/sample-manuscript.js";

const DEMO_ORG_ID = "demo-org";
const DEMO_USER_EMAIL = "demo@basira.test";
const DEMO_USER_PASSWORD = "password123";
const DEMO_PROJECT_ID = "demo-project-completed-flow";
const DEMO_MANUSCRIPT_ID = "demo-manuscript-completed-flow";
const DEMO_PAGE_ID = "demo-page-completed-flow-1";
const DEMO_TRANSCRIPTION_ID = "demo-transcription-completed-flow-v1";
const DEMO_TRANSLATION_ID = "demo-translation-completed-flow-en-v1";

const IMAGE_KEY = "demo/completed-flow/page-1.svg";
const PROCESSED_IMAGE_KEY = "demo/completed-flow/page-1-processed.svg";
const THUMBNAIL_KEY = "demo/completed-flow/page-1-thumbnail.svg";

const json = (value: unknown) => value as Prisma.InputJsonValue;

async function putDemoImages() {
  const pageSvg = buildDemoPageSvg();
  const storage = getStorage();
  await storage.put(IMAGE_KEY, pageSvg, "image/svg+xml");
  await storage.put(PROCESSED_IMAGE_KEY, pageSvg, "image/svg+xml");
  await storage.put(THUMBNAIL_KEY, pageSvg, "image/svg+xml");
}

async function seedDemoAccount() {
  const org = await prisma.organization.upsert({
    where: { id: DEMO_ORG_ID },
    update: { name: "Basira Demo Lab", plan: "free", seatLimit: 10 },
    create: {
      id: DEMO_ORG_ID,
      name: "Basira Demo Lab",
      plan: "free",
      seatLimit: 10,
    },
  });

  const passwordHash = await bcrypt.hash(DEMO_USER_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {
      orgId: org.id,
      name: "Demo Admin",
      role: "admin",
      disabled: false,
      passwordHash,
    },
    create: {
      email: DEMO_USER_EMAIL,
      orgId: org.id,
      name: "Demo Admin",
      role: "admin",
      passwordHash,
    },
  });

  return { org, user };
}

async function seedDemoProject(orgId: string) {
  await prisma.project.upsert({
    where: { id: DEMO_PROJECT_ID },
    update: {
      name: "Completed Manuscript Demo",
      description:
        "A local fixture showing upload, preprocessing, transcription, translation, glossary, provenance, and review UI.",
      tags: ["demo", "completed-flow"],
      glossary: json(DEMO_PROJECT_GLOSSARY),
    },
    create: {
      id: DEMO_PROJECT_ID,
      orgId,
      name: "Completed Manuscript Demo",
      description:
        "A local fixture showing upload, preprocessing, transcription, translation, glossary, provenance, and review UI.",
      tags: ["demo", "completed-flow"],
      glossary: json(DEMO_PROJECT_GLOSSARY),
    },
  });

  await prisma.manuscript.upsert({
    where: { id: DEMO_MANUSCRIPT_ID },
    update: {
      title: "Synthetic Adab Folio",
      sourceLanguage: "ar",
      script: "naskh",
      metadata: json({
        shelfmark: "DEMO-001",
        repository: "Basira local demo",
        note: "Synthetic manuscript image and text for product demonstrations.",
      }),
      originalFileKey: IMAGE_KEY,
    },
    create: {
      id: DEMO_MANUSCRIPT_ID,
      projectId: DEMO_PROJECT_ID,
      title: "Synthetic Adab Folio",
      sourceLanguage: "ar",
      script: "naskh",
      metadata: json({
        shelfmark: "DEMO-001",
        repository: "Basira local demo",
        note: "Synthetic manuscript image and text for product demonstrations.",
      }),
      originalFileKey: IMAGE_KEY,
    },
  });

  await prisma.page.upsert({
    where: { id: DEMO_PAGE_ID },
    update: {
      manuscriptId: DEMO_MANUSCRIPT_ID,
      index: 0,
      originalImageKey: IMAGE_KEY,
      processedImageKey: PROCESSED_IMAGE_KEY,
      thumbnailKey: THUMBNAIL_KEY,
      width: 900,
      height: 1200,
      status: "translated",
    },
    create: {
      id: DEMO_PAGE_ID,
      manuscriptId: DEMO_MANUSCRIPT_ID,
      index: 0,
      originalImageKey: IMAGE_KEY,
      processedImageKey: PROCESSED_IMAGE_KEY,
      thumbnailKey: THUMBNAIL_KEY,
      width: 900,
      height: 1200,
      status: "translated",
    },
  });
}

async function seedDemoRegions() {
  await prisma.region.deleteMany({
    where: {
      pageId: DEMO_PAGE_ID,
      id: { notIn: DEMO_PAGE_REGIONS.map((region) => region.id) },
    },
  });

  for (const region of DEMO_PAGE_REGIONS) {
    await prisma.region.upsert({
      where: { id: region.id },
      update: {
        pageId: DEMO_PAGE_ID,
        type: region.type,
        order: region.order,
        bbox: json(region.bbox),
      },
      create: {
        id: region.id,
        pageId: DEMO_PAGE_ID,
        type: region.type,
        order: region.order,
        bbox: json(region.bbox),
      },
    });
  }
}

async function seedDemoReviewState(userId: string) {
  await prisma.transcription.deleteMany({
    where: { pageId: DEMO_PAGE_ID, id: { not: DEMO_TRANSCRIPTION_ID } },
  });

  const perRegionText = Object.fromEntries(
    DEMO_SOURCE_LINES.map((line, index) => [
      `demo-region-line-${index + 1}`,
      line,
    ]),
  );

  await prisma.transcription.upsert({
    where: { id: DEMO_TRANSCRIPTION_ID },
    update: {
      pageId: DEMO_PAGE_ID,
      version: 1,
      text: DEMO_SOURCE_TEXT,
      perRegionText: json(perRegionText),
      confidence: DEMO_TRANSCRIPTION_CONFIDENCE,
      provenance: json(
        buildProvenance({
          capability: "transcribe",
          adapterKey: "demo",
          modelName: DEMO_MODEL.name,
          modelVersion: DEMO_MODEL.transcribeVersion,
          details: { lineCount: DEMO_SOURCE_LINES.length },
        }),
      ),
      createdByUserId: userId,
      isCurrent: true,
    },
    create: {
      id: DEMO_TRANSCRIPTION_ID,
      pageId: DEMO_PAGE_ID,
      version: 1,
      text: DEMO_SOURCE_TEXT,
      perRegionText: json(perRegionText),
      confidence: DEMO_TRANSCRIPTION_CONFIDENCE,
      provenance: json(
        buildProvenance({
          capability: "transcribe",
          adapterKey: "demo",
          modelName: DEMO_MODEL.name,
          modelVersion: DEMO_MODEL.transcribeVersion,
          details: { lineCount: DEMO_SOURCE_LINES.length },
        }),
      ),
      createdByUserId: userId,
      isCurrent: true,
    },
  });

  await prisma.translation.deleteMany({
    where: {
      transcriptionId: DEMO_TRANSCRIPTION_ID,
      targetLang: "en",
      id: { not: DEMO_TRANSLATION_ID },
    },
  });

  await prisma.translation.upsert({
    where: { id: DEMO_TRANSLATION_ID },
    update: {
      transcriptionId: DEMO_TRANSCRIPTION_ID,
      targetLang: "en",
      version: 1,
      text: demoTranslationTextFor("en"),
      alignment: json(demoAlignmentFor("en")),
      glosses: json(DEMO_GLOSSES),
      provenance: json(
        buildProvenance({
          capability: "translate",
          adapterKey: "demo",
          modelName: DEMO_MODEL.name,
          modelVersion: DEMO_MODEL.translateVersion,
          details: {
            targetLang: "en",
            alignmentPairs: DEMO_SOURCE_LINES.length,
          },
        }),
      ),
      createdByUserId: userId,
      isCurrent: true,
    },
    create: {
      id: DEMO_TRANSLATION_ID,
      transcriptionId: DEMO_TRANSCRIPTION_ID,
      targetLang: "en",
      version: 1,
      text: demoTranslationTextFor("en"),
      alignment: json(demoAlignmentFor("en")),
      glosses: json(DEMO_GLOSSES),
      provenance: json(
        buildProvenance({
          capability: "translate",
          adapterKey: "demo",
          modelName: DEMO_MODEL.name,
          modelVersion: DEMO_MODEL.translateVersion,
          details: {
            targetLang: "en",
            alignmentPairs: DEMO_SOURCE_LINES.length,
          },
        }),
      ),
      createdByUserId: userId,
      isCurrent: true,
    },
  });
}

async function main() {
  await putDemoImages();
  const { org, user } = await seedDemoAccount();
  await seedDemoProject(org.id);
  await seedDemoRegions();
  await seedDemoReviewState(user.id);

  console.log("Demo seed complete.");
  console.log(`Login: ${DEMO_USER_EMAIL} / ${DEMO_USER_PASSWORD}`);
  console.log(`Open: /project/${DEMO_PROJECT_ID}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
