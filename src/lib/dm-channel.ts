export function getDmChannelId(id1: string, id2: string): string {
  const str = [id1, id2].sort().join('')
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return 'dm_' + (hash >>> 0).toString(36)
}
