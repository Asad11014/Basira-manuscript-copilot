import { config as loadEnv } from 'dotenv';
import { z } from 'zod';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load the repo-root .env (monorepo: env lives at the root, not per-app).
const here = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(here, '../../../../.env') });

const boolish = (def: boolean) =>
  z
    .enum(['true', 'false', '1', '0'])
    .transform((v) => v === 'true' || v === '1')
    .or(z.boolean())
    .default(def);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().default(4000),
  API_URL: z.string().url().default('http://localhost:4000'),
  WEB_URL: z.string().url().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),

  STORAGE_DRIVER: z.enum(['minio', 'local', 's3']).default('local'),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().default('basira'),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  LOCAL_STORAGE_DIR: z.string().default('./.storage'),

  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be set (>= 8 chars)'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_NAME: z.string().default('basira_token'),
  COOKIE_SECURE: boolish(false),
  // Cross-site (e.g. web + api on different *.onrender.com hosts) needs 'none'.
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),

  MODEL_PROVIDER: z.string().default('anthropic'),
  MODEL_PROVIDER_API_KEY: z.string().optional(),
  MODEL_VISION_NAME: z.string().default('claude-opus-4-8'),
  MODEL_TEXT_NAME: z.string().default('claude-opus-4-8'),

  TRANSCRIBE_ADAPTER: z.string().default('llm-vision'),
  TRANSLATE_ADAPTER: z.string().default('llm'),
  NER_ADAPTER: z.string().default('llm'),

  // Kraken HTR sidecar (used when TRANSCRIBE_ADAPTER=kraken).
  KRAKEN_URL: z.string().url().default('http://localhost:8500'),

  MAX_UPLOAD_MB: z.coerce.number().int().default(100),
  DEFAULT_TARGET_LANG: z.string().default('en'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast and loud — a misconfigured server should never half-start.
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const config = parsed.data;
export type AppConfig = typeof config;

export const isProd = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';
