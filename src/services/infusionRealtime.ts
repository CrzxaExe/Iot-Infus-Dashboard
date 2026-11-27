import { ref } from 'vue'
import type {
  ServerCommand,
  ServerErrorMessage,
  ServerInfusPayload,
  ServerMessage,
  ServerNotification,
  WsClientRequest,
} from '@/types/backend'

export type RealtimeStatus = 'not-configured' | 'connecting' | 'connected' | 'disconnected' | 'error'

export const infusRealtimeStatus = ref<RealtimeStatus>('not-configured')

/**
 * `data` menangkap semua device; `command`/`ack` dipakai untuk korelasi perintah.
 * `error` dan `notify` tidak perlu di-subscribe karena server mengirimnya ke semua klien.
 */
const SUBSCRIBE_LABELS = ['data/#', 'command/#', 'ack/#']
const BUFFERED_EVENT_TYPES = new Set(['data', 'command', 'acknowledgement'])

const listeners = new Set<(message: ServerMessage) => void>()
const outboundQueue: string[] = []
const buffered: ServerMessage[] = []

let socket: WebSocket | undefined
let stopped = false
let reconnectTimer: ReturnType<typeof setTimeout> | undefined
let reconnectAttempt = 0
let subscribeRequestId = ''
let waitingForSnapshot = false

function id(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function websocketUrl(): string | undefined {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim()
  if (!configuredUrl) return undefined

  const url = new URL(configuredUrl, window.location.origin)
  if (url.protocol === 'https:') url.protocol = 'wss:'
  else if (url.protocol === 'http:') url.protocol = 'ws:'
  else if (url.protocol !== 'ws:' && url.protocol !== 'wss:') {
    throw new Error('VITE_API_BASE_URL must use http://, https://, ws://, or wss://')
  }

  url.pathname = '/ws'
  url.search = ''
  url.hash = ''
  return url.toString()
}

export function parseServerMessage(value: unknown): ServerMessage | undefined {
  if (!isRecord(value)) return undefined
  if (value.type !== undefined && typeof value.type !== 'string') return undefined
  if (value.requestId !== undefined && typeof value.requestId !== 'string') return undefined
  if (value.message !== undefined && typeof value.message !== 'string') return undefined
  if (value.labels !== undefined
    && (!Array.isArray(value.labels) || !value.labels.every((label) => typeof label === 'string'))) {
    return undefined
  }

  return {
    type: typeof value.type === 'string' ? value.type : '',
    requestId: typeof value.requestId === 'string' ? value.requestId : undefined,
    message: typeof value.message === 'string' ? value.message : undefined,
    labels: Array.isArray(value.labels) ? (value.labels as string[]) : undefined,
    label: typeof value.label === 'string' ? value.label : undefined,
    data: value.data,
  }
}

function hasDeviceId(value: Record<string, unknown>): boolean {
  return typeof value.deviceId === 'string' && value.deviceId.trim().length > 0
}

export function isServerInfusPayload(value: unknown): value is ServerInfusPayload {
  if (!isRecord(value) || !isRecord(value.data)) return false
  return hasDeviceId(value)
    && typeof value.patientId === 'string'
    && typeof value.roomId === 'string'
    && (value.timestamp === undefined || typeof value.timestamp === 'string')
    && typeof value.data.tpm === 'number'
    && typeof value.data.infusType === 'string'
    && typeof value.data.percent === 'number'
    && typeof value.data.servoAngle === 'number'
    && typeof value.data.volume === 'number'
}

export function isServerCommand(value: unknown): value is ServerCommand {
  if (!isRecord(value) || !isRecord(value.data)) return false
  return typeof value.type === 'string'
    && hasDeviceId(value)
    && (value._id === undefined || typeof value._id === 'string')
    && (value.isSuccess === undefined || typeof value.isSuccess === 'boolean')
    && (value.timestamp === undefined || typeof value.timestamp === 'string')
}

export function isServerNotification(value: unknown): value is ServerNotification {
  if (!isRecord(value)) return false
  return hasDeviceId(value)
    && typeof value.message === 'string'
    && (value.level === undefined || typeof value.level === 'string')
    && (value.patientId === undefined || typeof value.patientId === 'string')
    && (value.roomId === undefined || typeof value.roomId === 'string')
    && (value.isRead === undefined || typeof value.isRead === 'boolean')
    && (value.isResolved === undefined || typeof value.isResolved === 'boolean')
    && (value.timestamp === undefined || typeof value.timestamp === 'string')
}

export function isServerError(value: unknown): value is ServerErrorMessage {
  if (!isRecord(value)) return false
  return hasDeviceId(value)
    && typeof value.error === 'string'
    && (value.isFixed === undefined || typeof value.isFixed === 'boolean')
    && (value.timestamp === undefined || typeof value.timestamp === 'string')
}

/** Subscribe snapshots have the shape `{ "data/#": [payload, ...] }`. */
export function extractSnapshot(data: unknown, label = 'data/#'): ServerInfusPayload[] | undefined {
  if (!isRecord(data)) return undefined

  const records = data[label] ?? data['data/+']
  if (!Array.isArray(records)) return undefined

  const payloads = new Map<string, ServerInfusPayload>()
  for (const record of records) {
    // Devices may publish payloads with an empty deviceId. They violate the
    // contract and are skipped silently to avoid spamming the browser console.
    if (!isServerInfusPayload(record)) continue
    const deviceId = record.deviceId.trim()
    if (!payloads.has(deviceId)) payloads.set(deviceId, { ...record, deviceId })
  }
  return [...payloads.values()]
}

export function onServerMessage(handler: (message: ServerMessage) => void): () => void {
  listeners.add(handler)
  return () => listeners.delete(handler)
}

function emit(message: ServerMessage): void {
  for (const listener of listeners) listener(message)
}

function flushBuffered(): void {
  const messages = buffered.splice(0)
  for (const message of messages) emit(message)
}

function send(request: WsClientRequest): void {
  const payload = JSON.stringify(request)
  if (socket?.readyState === WebSocket.OPEN) socket.send(payload)
  else outboundQueue.push(payload)
}

export function sendWsRequest(request: WsClientRequest): void {
  send(request)
}

export function connectInfusionRealtime(): () => void {
  let endpoint: string
  try {
    const resolved = websocketUrl()
    if (!resolved) {
      infusRealtimeStatus.value = 'not-configured'
      return () => undefined
    }
    endpoint = resolved
  } catch (error) {
    infusRealtimeStatus.value = 'error'
    console.error('[infus-ws] Invalid backend URL:', error)
    return () => undefined
  }

  stopped = false

  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return () => stop()
  }

  connect()

  return () => stop()

  function connect(): void {
    if (stopped) return
    infusRealtimeStatus.value = 'connecting'

    try {
      socket = new WebSocket(endpoint)
    } catch (error) {
      console.error('[infus-ws] Failed to open WebSocket connection:', error)
      scheduleReconnect()
      return
    }

    socket.addEventListener('open', () => {
      if (stopped) return
      reconnectAttempt = 0
      infusRealtimeStatus.value = 'connected'
      waitingForSnapshot = true
      buffered.length = 0
      subscribeRequestId = id('sub')

      send({
        action: 'subscribe',
        requestId: subscribeRequestId,
        labels: SUBSCRIBE_LABELS,
        replay: true,
      })

      const queued = outboundQueue.splice(0)
      for (const payload of queued) socket?.send(payload)
    })

    socket.addEventListener('message', (event: MessageEvent<string>) => {
      if (stopped) return

      let parsed: unknown
      try {
        parsed = JSON.parse(event.data)
      } catch (error) {
        console.error('[infus-ws] Failed to parse server message:', error)
        return
      }

      const message = parseServerMessage(parsed)
      if (!message) {
        console.error('[infus-ws] Invalid message envelope:', parsed)
        return
      }

      const isOwnSubscribeAck = message.requestId === subscribeRequestId
      if (isOwnSubscribeAck && (message.type === 'subscribed' || message.type === 'error')) {
        waitingForSnapshot = false
        if (message.type === 'error') infusRealtimeStatus.value = 'error'
        emit(message)
        flushBuffered()
        return
      }

      // Events that may arrive before the DB snapshot are buffered so they are not lost when it is applied.
      if (waitingForSnapshot && BUFFERED_EVENT_TYPES.has(message.type ?? '')) {
        buffered.push(message)
        return
      }

      emit(message)
    })

    socket.addEventListener('error', (event) => {
      if (stopped) return
      infusRealtimeStatus.value = 'error'
      console.error('[infus-ws] WebSocket connection error:', event)
    })

    socket.addEventListener('close', () => {
      if (stopped) return
      socket = undefined
      infusRealtimeStatus.value = 'disconnected'
      scheduleReconnect()
    })
  }

  function scheduleReconnect(): void {
    if (stopped || reconnectTimer) return
    const delay = Math.min(30_000, 1_000 * 2 ** reconnectAttempt) + Math.floor(Math.random() * 250)
    reconnectAttempt += 1
    reconnectTimer = setTimeout(() => {
      reconnectTimer = undefined
      connect()
    }, delay)
  }

  function stop(): void {
    stopped = true
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = undefined
    socket?.close()
    socket = undefined
    waitingForSnapshot = false
    buffered.length = 0
    infusRealtimeStatus.value = 'not-configured'
  }
}
