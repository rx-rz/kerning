export function createInitialComparisonSlots(
  preferredId: string,
  availableIds: readonly string[],
  populate: boolean,
) {
  if (!populate) return [preferredId];
  return [
    preferredId,
    ...availableIds.filter((id) => id !== preferredId),
  ].slice(0, 3);
}

export function addComparisonSlot(current: readonly string[], id: string) {
  return current.includes(id) || current.length >= 3
    ? [...current]
    : [...current, id];
}
