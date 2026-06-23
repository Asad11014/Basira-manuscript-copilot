import { defineConfig } from 'vitest/config';

// Env defaults so config validation passes under test without a real .env.
// dotenv does not override already-set process.env, so these win.
export default defineConfig({
  test: {
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://basira:basira@localhost:5432/basira_test',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'test-secret-test-secret',
      STORAGE_DRIVER: 'local',
      MODEL_PROVIDER_API_KEY: 'test-key',
    },
  },
});
