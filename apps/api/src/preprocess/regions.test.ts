import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { detectRegions } from './regions.js';

/** White page with `count` black horizontal bars separated by clear gaps. */
async function pageWithBars(count: number): Promise<Buffer> {
  const width = 400;
  const height = 600;
  const barHeight = 30;
  const gap = 40;
  const composites = Array.from({ length: count }, (_, i) => ({
    input: {
      create: {
        width: 300,
        height: barHeight,
        channels: 3 as const,
        background: '#000000',
      },
    },
    left: 50,
    top: 30 + i * (barHeight + gap),
  }));
  return sharp({
    create: { width, height, channels: 3, background: '#ffffff' },
  })
    .composite(composites)
    .png()
    .toBuffer();
}

describe('detectRegions', () => {
  it('detects one textblock plus a line per text band', async () => {
    const regions = await detectRegions(await pageWithBars(3));
    const lines = regions.filter((r) => r.type === 'line');
    const blocks = regions.filter((r) => r.type === 'textblock');
    expect(blocks).toHaveLength(1);
    expect(lines).toHaveLength(3);
    // Lines are ordered top-to-bottom.
    expect(lines[0]!.bbox.y).toBeLessThan(lines[2]!.bbox.y);
    // bboxes are normalised within the unit square.
    for (const r of regions) {
      expect(r.bbox.x).toBeGreaterThanOrEqual(0);
      expect(r.bbox.w).toBeLessThanOrEqual(1);
    }
  });

  it('falls back to a single full-page block on a blank page', async () => {
    const blank = await sharp({
      create: { width: 200, height: 200, channels: 3, background: '#ffffff' },
    })
      .png()
      .toBuffer();
    const regions = await detectRegions(blank);
    expect(regions).toHaveLength(1);
    expect(regions[0]!.type).toBe('textblock');
  });
});
