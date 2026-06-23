import { describe, expect, it } from 'vitest';
import { createAnnotationRequestSchema, anchorSchema } from './annotation.js';
import { entitySchema } from './entity.js';
import { searchQuerySchema } from './search.js';

describe('M5 schemas', () => {
  it('requires either pageId or transcriptionId on a new annotation', () => {
    expect(
      createAnnotationRequestSchema.safeParse({ kind: 'comment', body: 'hi' })
        .success,
    ).toBe(false);
    expect(
      createAnnotationRequestSchema.safeParse({
        pageId: 'p1',
        kind: 'comment',
        body: 'hi',
      }).success,
    ).toBe(true);
  });

  it('accepts an anchor with a region and span', () => {
    expect(
      anchorSchema.safeParse({ regionId: 'r1', span: [0, 12] }).success,
    ).toBe(true);
  });

  it('rejects an entity with an unknown type', () => {
    const base = {
      id: 'e1',
      pageId: 'p1',
      transcriptionId: null,
      surfaceText: 'الغزالي',
      normalizedName: 'al-Ghazālī',
      span: [3, 10],
      provenance: {
        capability: 'ner',
        adapterKey: 'llm',
        modelName: 'm',
        modelVersion: 'v',
        generatedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
    };
    expect(entitySchema.safeParse({ ...base, type: 'person' }).success).toBe(
      true,
    );
    expect(entitySchema.safeParse({ ...base, type: 'spaceship' }).success).toBe(
      false,
    );
  });

  it('requires a non-empty search query', () => {
    expect(searchQuerySchema.safeParse({ q: '' }).success).toBe(false);
    expect(
      searchQuerySchema.safeParse({ q: 'kalam', scope: 'translation' }).success,
    ).toBe(true);
  });
});
