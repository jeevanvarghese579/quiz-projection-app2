import { describe, expect, it } from 'vitest';
import { calculateProminentTeamCapacity } from './projector';

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
