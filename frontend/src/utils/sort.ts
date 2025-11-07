/**
 * Generic sorting utility for arrays of objects
 */

/**
 * Sort an array of objects by a specific field
 *
 * @param data - Array of objects to sort
 * @param field - Field name to sort by
 * @param direction - Sort direction ('asc' or 'desc')
 * @returns Sorted array
 */
export function sortData<T>(data: T[], field: string, direction: 'asc' | 'desc'): T[] {
  if (!field) return data;

  return [...data].sort((a, b) => {
    const aValue = (a as any)[field];
    const bValue = (b as any)[field];

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    // Handle string comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    // Handle numeric comparison
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}
