import { describe, expect, it } from 'vitest';
import { provenanceSchema, paginatedSchema, bboxSchema } from './common.js';
import { registerRequestSchema } from './auth.js';
import { z } from 'zod';

describe('shared schemas', () => {
  it('accepts a well-formed provenance record', () => {
    const result = provenanceSchema.safeParse({
      capability: 'transcribe',
      adapterKey: 'llm-vision',
      modelName: 'claude-opus-4-8',
      modelVersion: '2026-01-01',
      generatedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it('rejects provenance missing a model version', () => {
    const result = provenanceSchema.safeParse({
      capability: 'transcribe',
      adapterKey: 'llm-vision',
      modelName: 'claude-opus-4-8',
      generatedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it('clamps bbox coordinates to the unit square', () => {
    expect(bboxSchema.safeParse({ x: 0, y: 0, w: 0.5, h: 0.5 }).success).toBe(
      true,
    );
    expect(bboxSchema.safeParse({ x: -1, y: 0, w: 0.5, h: 0.5 }).success).toBe(
      false,
    );
  });

  it('builds a paginated envelope around an item schema', () => {
    const schema = paginatedSchema(z.object({ id: z.string() }));
    const result = schema.safeParse({
      items: [{ id: 'a' }],
      nextCursor: null,
    });
    expect(result.success).toBe(true);
  });

  it('enforces the minimum password length on register', () => {
    const result = registerRequestSchema.safeParse({
      orgName: 'Test Lab',
      email: 'a@b.com',
      password: 'short',
      name: 'Tester',
    });
    expect(result.success).toBe(false);
  });
});
