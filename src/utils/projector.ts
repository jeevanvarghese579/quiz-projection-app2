export function calculateProminentTeamCapacity(viewportWidth: number, availableHeight: number, teamCount: number): number {
  if (teamCount <= 0) return 0;
  if (viewportWidth < 1024) return teamCount;
  const rowHeightWithGap = viewportWidth >= 1280 ? 88 : 80;
  return Math.min(teamCount, Math.max(3, Math.floor((availableHeight - 32) / rowHeightWithGap)));
}

export interface ThumbnailGridLayout {
  columns: number;
  rows: number;
  tileSize: number;
  gap: number;
}

export type AutoScrollDirection = 'down' | 'up';

export interface AutoScrollStep {
  scrollTop: number;
  direction: AutoScrollDirection;
}

const AUTO_SCROLL_DOWN_PIXELS_PER_SECOND = 28;
const AUTO_SCROLL_UP_PIXELS_PER_SECOND = 360;

export function calculateOverflowAutoScrollStep(
  scrollTop: number,
  maxScroll: number,
  elapsedMs: number,
  direction: AutoScrollDirection,
): AutoScrollStep {
  if (maxScroll <= 0) return { scrollTop: 0, direction: 'down' };
  const elapsedSeconds = Math.min(100, Math.max(0, elapsedMs)) / 1000;
  if (direction === 'down') {
    const next = scrollTop + AUTO_SCROLL_DOWN_PIXELS_PER_SECOND * elapsedSeconds;
    return next >= maxScroll
      ? { scrollTop: maxScroll, direction: 'up' }
      : { scrollTop: next, direction };
  }
  const next = scrollTop - AUTO_SCROLL_UP_PIXELS_PER_SECOND * elapsedSeconds;
  return next <= 0
    ? { scrollTop: 0, direction: 'down' }
    : { scrollTop: next, direction };
}

function calculateGridWithGap(availableWidth: number, availableHeight: number, teamCount: number, gap: number): ThumbnailGridLayout {
  let best: ThumbnailGridLayout = { columns: 0, rows: 0, tileSize: 0, gap };
  for (let columns = 1; columns <= teamCount; columns += 1) {
    const rows = Math.ceil(teamCount / columns);
    const widthPerTile = (availableWidth - gap * (columns - 1)) / columns;
    const heightPerTile = (availableHeight - gap * (rows - 1)) / rows;
    const tileSize = Math.floor(Math.min(widthPerTile, heightPerTile) * 100) / 100;
    if (tileSize > best.tileSize) best = { columns, rows, tileSize, gap };
  }
  return best;
}

export function calculateThumbnailGrid(availableWidth: number, availableHeight: number, teamCount: number): ThumbnailGridLayout {
  if (teamCount <= 0 || availableWidth <= 0 || availableHeight <= 0) {
    return { columns: 0, rows: 0, tileSize: 0, gap: 0 };
  }
  const spacious = calculateGridWithGap(availableWidth, availableHeight, teamCount, 8);
  if (spacious.tileSize >= 48) return spacious;
  const compact = calculateGridWithGap(availableWidth, availableHeight, teamCount, 4);
  if (compact.tileSize >= 24) return compact;
  const dense = calculateGridWithGap(availableWidth, availableHeight, teamCount, 2);
  return dense.tileSize >= 8 ? dense : calculateGridWithGap(availableWidth, availableHeight, teamCount, 0);
}
