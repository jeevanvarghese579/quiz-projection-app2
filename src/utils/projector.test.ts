import { describe, expect, it } from 'vitest';
import { calculateOverflowAutoScrollStep, calculateProminentTeamCapacity, calculateThumbnailGrid } from './projector';

describe('calculateProminentTeamCapacity', () => {
  it('fills a full-HD main panel with the rows that fit', () => {
    expect(calculateProminentTeamCapacity(1920, 850, 20)).toBe(9);
  });

  it('uses the available desktop height instead of a fixed five-team limit', () => {
    expect(calculateProminentTeamCapacity(1366, 650, 20)).toBe(7);
  });

  it('keeps all teams in the stacked mobile layout', () => {
    expect(calculateProminentTeamCapacity(768, 600, 20)).toBe(20);
  });
});

describe('calculateThumbnailGrid', () => {
  it('fits every team into square tiles within the available area', () => {
    const layout = calculateThumbnailGrid(1000, 600, 20);
    expect(layout.columns * layout.rows).toBeGreaterThanOrEqual(20);
    expect(layout.columns * layout.tileSize + (layout.columns - 1) * layout.gap).toBeLessThanOrEqual(1000);
    expect(layout.rows * layout.tileSize + (layout.rows - 1) * layout.gap).toBeLessThanOrEqual(600);
  });

  it('shrinks tiles to keep large team lists on one screen', () => {
    const smallList = calculateThumbnailGrid(1280, 700, 20);
    const largeList = calculateThumbnailGrid(1280, 700, 120);
    expect(largeList.columns * largeList.rows).toBeGreaterThanOrEqual(120);
    expect(largeList.tileSize).toBeLessThan(smallList.tileSize);
  });

  it('still fits very large lists by reducing gaps and tile size', () => {
    const layout = calculateThumbnailGrid(1280, 700, 500);
    expect(layout.columns * layout.rows).toBeGreaterThanOrEqual(500);
    expect(layout.columns * layout.tileSize + (layout.columns - 1) * layout.gap).toBeLessThanOrEqual(1280);
    expect(layout.rows * layout.tileSize + (layout.rows - 1) * layout.gap).toBeLessThanOrEqual(700);
  });

  it('returns an empty layout when there are no teams', () => {
    expect(calculateThumbnailGrid(1280, 700, 0)).toEqual({ columns: 0, rows: 0, tileSize: 0, gap: 0 });
  });
});

describe('calculateOverflowAutoScrollStep', () => {
  it('scrolls down slowly and returns upward much faster', () => {
    const down = calculateOverflowAutoScrollStep(100, 500, 100, 'down');
    const up = calculateOverflowAutoScrollStep(400, 500, 100, 'up');
    expect(down.scrollTop - 100).toBeCloseTo(2.8);
    expect(400 - up.scrollTop).toBeCloseTo(120);
  });

  it('reverses direction at the bottom and top boundaries', () => {
    expect(calculateOverflowAutoScrollStep(499, 500, 100, 'down')).toEqual({ scrollTop: 500, direction: 'up' });
    expect(calculateOverflowAutoScrollStep(10, 500, 100, 'up')).toEqual({ scrollTop: 0, direction: 'down' });
  });

  it('stays at the top when the panel has no overflow', () => {
    expect(calculateOverflowAutoScrollStep(20, 0, 100, 'up')).toEqual({ scrollTop: 0, direction: 'down' });
  });
});
