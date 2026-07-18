// Firestore's `in` operator accepts at most 30 values per query, so lookups
// keyed off an arbitrary-length list of IDs need to be split into batches.
export const FIRESTORE_IN_QUERY_LIMIT = 30

export function chunk<T>(items: T[], size: number): T[][] {
  if (!Number.isInteger(size) || size <= 0) {
    throw new RangeError('chunk size must be a positive integer')
  }
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}
