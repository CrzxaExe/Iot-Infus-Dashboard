import type {
  HistoryEnvelope,
  ServerErrorMessage,
  ServerInfusPayload,
  ServerNotification,
} from '@/types/backend'

export type HistoryCategory = 'data' | 'command' | 'ack' | 'error' | 'notify'

export interface HistoryOptions {
  limit?: number
  before?: string
  after?: string
  signal?: AbortSignal
}

function apiBase(): string {
  const base = import.meta.env.VITE_API_BASE_URL?.trim()
  if (!base) throw new Error('VITE_API_BASE_URL is not configured')
  return base.replace(/\/+$/, '')
}

export function historyLabel(category: HistoryCategory, deviceId = ''): string {
  const id = deviceId.trim()
  return id ? `${category}/${id}` : category
}

function isEnvelope<T>(value: unknown): value is HistoryEnvelope<T> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const row = value as Record<string, unknown>
  return typeof row.label === 'string'
    && typeof row.category === 'string'
    && Array.isArray(row.data)
    && typeof row.limit === 'number'
    && typeof row.hasMore === 'boolean'
    && typeof row.nextCursor === 'string'
}

export async function fetchHistory<T>(
  label: string,
  options: HistoryOptions = {},
): Promise<HistoryEnvelope<T>> {
  const url = new URL(`${apiBase()}/history`)
  url.searchParams.set('label', label)
  url.searchParams.set('limit', String(options.limit ?? 50))
  if (options.before) url.searchParams.set('before', options.before)
  if (options.after) url.searchParams.set('after', options.after)

  const response = await fetch(url, { signal: options.signal })
  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const serverMessage = body
      && typeof body === 'object'
      && !Array.isArray(body)
      && 'error' in body
      && typeof (body as { error?: unknown }).error === 'string'
      ? (body as { error: string }).error
      : undefined
    throw new Error(serverMessage ?? `Failed to load history (HTTP ${response.status})`)
  }

  if (!isEnvelope<T>(body)) throw new Error('Unknown history response format')
  return body
}

export function fetchTelemetryHistory(deviceId = '', options: HistoryOptions = {}) {
  return fetchHistory<ServerInfusPayload & { _id?: string }>(historyLabel('data', deviceId), options)
}

export function fetchNotificationHistory(deviceId = '', options: HistoryOptions = {}) {
  return fetchHistory<ServerNotification>(historyLabel('notify', deviceId), options)
}

export function fetchErrorHistory(deviceId = '', options: HistoryOptions = {}) {
  return fetchHistory<ServerErrorMessage>(historyLabel('error', deviceId), options)
}
