import { ref } from 'vue'
import type { ServerInfusPayload } from '@/types/infusion'
import { useInfusionStore } from '@/stores/infusion'

export type RealtimeStatus = 'not-configured' | 'connecting' | 'connected' | 'disconnected' | 'error'

export const infusionRealtimeStatus = ref<RealtimeStatus>('not-configured')

interface ServerMessage {
  type?: string
  requestId?: string
  message?: string
  data?: Record<string, unknown>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseServerMessage(value: unknown): ServerMessage | undefined {
  if (!isRecord(value)) return undefined
  if (value.type !== undefined && typeof value.type !== 'string') return undefined
  if (value.requestId !== undefined && typeof value.requestId !== 'string') return undefined
  if (value.message !== undefined && typeof value.message !== 'string') return undefined
  if (value.data !== undefined && !isRecord(value.data)) return undefined
  return {
    type: typeof value.type === 'string' ? value.type : undefined,
    requestId: typeof value.requestId === 'string' ? value.requestId : undefined,
    message: typeof value.message === 'string' ? value.message : undefined,
    data: isRecord(value.data) ? value.data : undefined,
  }
}

function isServerInfusPayload(value: unknown): value is ServerInfusPayload {
  if (!isRecord(value) || !isRecord(value.data)) return false
  return typeof value.deviceId === 'string'
    && typeof value.data.tpm === 'number'
    && typeof value.data.infusType === 'string'
    && typeof value.data.percent === 'number'
    && (value.data.volume === undefined || typeof value.data.volume === 'number')
    && (value.patientId === undefined || typeof value.patientId === 'string')
    && (value.roomId === undefined || typeof value.roomId === 'string')
    && (value.timestamp === undefined || typeof value.timestamp === 'string')
}

function websocketUrl(): string | undefined {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim()
  if (!configuredUrl) return undefined

  const url = new URL(configuredUrl)
  if (url.protocol === 'https:') url.protocol = 'wss:'
  else if (url.protocol === 'http:') url.protocol = 'ws:'
  else throw new Error('VITE_API_BASE_URL harus menggunakan http:// atau https://')

  url.pathname = '/ws'
  url.search = ''
  url.hash = ''
  return url.toString()
}

function snapshotPayloads(data: Record<string, unknown>): ServerInfusPayload[] | undefined {
  const records = data['data/+']
  if (!Array.isArray(records)) return undefined

  const payloads = new Map<string, ServerInfusPayload>()
  for (const record of records) {
    if (!isServerInfusPayload(record)) {
      console.error('[infusion-ws] Mengabaikan payload snapshot dengan format tidak valid:', record)
      continue
    }
    if (!payloads.has(record.deviceId)) payloads.set(record.deviceId, record)
  }
  return [...payloads.values()]
}

export function connectInfusionRealtime(): () => void {
  let url: string | undefined
  try {
    url = websocketUrl()
  } catch (error) {
    infusionRealtimeStatus.value = 'error'
    console.error('[infusion-ws] URL backend tidak valid:', error)
    return () => undefined
  }

  if (!url) {
    infusionRealtimeStatus.value = 'not-configured'
    return () => undefined
  }
  const endpoint = url

  const store = useInfusionStore()
  store.enableLiveMode()
  let socket: WebSocket | undefined
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined
  let stopped = false

  function connect() {
    if (stopped) return
    infusionRealtimeStatus.value = 'connecting'
    try {
      socket = new WebSocket(endpoint)
    } catch (error) {
      infusionRealtimeStatus.value = 'error'
      console.error('[infusion-ws] Gagal membuka koneksi WebSocket:', error)
      reconnectTimer = setTimeout(connect, 3000)
      return
    }

    socket.addEventListener('open', () => {
      if (stopped) return
      infusionRealtimeStatus.value = 'connected'
      socket?.send(JSON.stringify({
        action: 'subscribe',
        requestId: `dashboard-${Date.now()}`,
        labels: ['data/+'],
        replay: true,
      }))
    })

    socket.addEventListener('message', (event: MessageEvent<string>) => {
      let message: ServerMessage
      try {
        const parsed: unknown = JSON.parse(event.data)
        const validMessage = parseServerMessage(parsed)
        if (!validMessage) throw new Error('format pesan tidak valid')
        message = validMessage
      } catch (error) {
        console.error('[infusion-ws] Gagal membaca pesan server:', error)
        return
      }

      if (message.type === 'error') {
        console.error('[infusion-ws] Server menolak request:', message.message ?? 'unknown error')
        infusionRealtimeStatus.value = 'error'
        return
      }

      if (message.type === 'subscribed' && message.requestId?.startsWith('dashboard-')) {
        const payloads = message.data ? snapshotPayloads(message.data) : undefined
        if (!payloads) {
          console.error('[infusion-ws] Server tidak mengirim snapshot pada label data/+')
          infusionRealtimeStatus.value = 'error'
          return
        }
        store.replaceServerSnapshot(payloads)
        return
      }

      if (message.type === 'data' && isServerInfusPayload(message.data)) {
        store.applyServerTelemetry(message.data)
      }
    })

    socket.addEventListener('error', (event) => {
      console.error('[infusion-ws] Koneksi WebSocket mengalami error:', event)
      infusionRealtimeStatus.value = 'error'
    })

    socket.addEventListener('close', () => {
      if (stopped) return
      infusionRealtimeStatus.value = 'disconnected'
      reconnectTimer = setTimeout(connect, 3000)
    })
  }

  connect()

  return () => {
    stopped = true
    if (reconnectTimer) clearTimeout(reconnectTimer)
    socket?.close()
  }
}
