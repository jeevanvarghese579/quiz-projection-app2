export function calculateProminentTeamCapacity(viewportWidth: number, availableHeight: number, teamCount: number): number {
  if (teamCount <= 0) return 0;
  if (viewportWidth < 1024) return teamCount;
  const rowHeightWithGap = viewportWidth >= 1280 ? 88 : 80;
  return Math.min(teamCount, Math.max(3, Math.floor((availableHeight - 32) / rowHeightWithGap)));
}
