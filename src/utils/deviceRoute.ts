/** Build a safe detail path; fall back to the device list when the id is invalid. */
export function deviceDetailPath(id: unknown): string {
  const value = typeof id === 'string'
    ? id.trim()
    : id === null || id === undefined
      ? ''
      : String(id).trim()
  return value ? `/perangkat/${encodeURIComponent(value)}` : '/devices'
}
