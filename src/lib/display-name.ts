export function sanitizeDisplayName(
  name?: string | null,
  fallback?: string | null,
): string {
  return name?.trim() || fallback?.trim() || 'Cyber User'
}

export function getInitial(name?: string | null): string {
  return sanitizeDisplayName(name).charAt(0).toUpperCase()
}

export function safeString(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value.trim()
  return '—'
}
