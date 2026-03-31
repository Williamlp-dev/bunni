const cache = new Map<string, { blocked: boolean; expiresAt: number }>()
const TTL_MS = 60_000

function symmetricKey(a: string, b: string): string {
  return [a, b].sort().join(":")
}

export function getCachedBlockStatus(a: string, b: string): boolean | null {
  const key = symmetricKey(a, b)
  const entry = cache.get(key)
  if (!entry) return null

  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }

  return entry.blocked
}

export function setCachedBlockStatus(a: string, b: string, blocked: boolean): void {
  const key = symmetricKey(a, b)
  cache.set(key, { blocked, expiresAt: Date.now() + TTL_MS })
}

export function invalidateBlockCache(userId1: string, userId2: string): void {
  const key = symmetricKey(userId1, userId2)
  cache.delete(key)
}
