import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { ServerCommand, ServerMessage } from '@/types/backend'
import {
  connectInfusionRealtime,
  extractSnapshot,
  infusRealtimeStatus,
  isServerCommand,
  isServerError,
  isServerInfusPayload,
  isServerNotification,
  onServerMessage,
  sendWsRequest,
} from '@/services/infusionRealtime'
import { useInfusionStore } from '@/stores/infusion'
import { useNotificationStore } from '@/stores/notification'
import { useServerNotificationStore } from '@/stores/serverNotification'

export type CommandStateStatus = 'sending' | 'stored' | 'success' | 'failed'

export interface CommandState {
  requestId: string
  deviceId: string
  label: string
  status: CommandStateStatus
  commandId?: string
  error?: string
  createdAt: number
}

const STATUS_LABEL: Record<CommandStateStatus, string> = {
  sending: 'Mengirim',
  stored: 'Tersimpan · menunggu perangkat',
  success: 'Dikonfirmasi perangkat',
  failed: 'Gagal',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function nestedRequestId(command: ServerCommand): string | undefined {
  const data = command.data
  if (!isRecord(data) || typeof data.requestId !== 'string') return undefined
  return data.requestId
}

export const useRealtimeStore = defineStore('realtime', () => {
  const status = computed(() => infusRealtimeStatus.value)
  const commands = ref<Record<string, CommandState>>({})
  const seenTelemetry = new Map<string, number>()

  let sequence = 0
  let stopSocket: (() => void) | undefined
  let stopListening: (() => void) | undefined

  const activeCommands = computed(() => Object.values(commands.value)
    .filter((command) => command.status === 'sending' || command.status === 'stored'))

  function start(): void {
    if (stopSocket) return
    stopListening = onServerMessage(handleMessage)
    stopSocket = connectInfusionRealtime()
  }

  function stop(): void {
    stopSocket?.()
    stopSocket = undefined
    stopListening?.()
    stopListening = undefined
  }

  function handleMessage(message: ServerMessage): void {
    const type = message.type ?? ''

    if (type === 'subscribed') {
      const payloads = extractSnapshot(message.data, 'data/#')
      // A missing snapshot means the server had no data for this label.
      if (payloads) useInfusionStore().replaceServerSnapshot(payloads)
      return
    }

    if (type === 'data') {
      if (!isServerInfusPayload(message.data)) return
      const key = `${message.data.deviceId}|${message.data.timestamp ?? ''}|${message.data.data.percent}|${message.data.data.tpm}`
      if (seenTelemetry.has(key)) return
      seenTelemetry.set(key, Date.now())
      if (seenTelemetry.size > 1000) {
        const oldest = seenTelemetry.keys().next().value
        if (oldest) seenTelemetry.delete(oldest)
      }
      useInfusionStore().applyServerTelemetry(message.data)
      return
    }

    if (type === 'command' || type === 'acknowledgement') {
      if (!isServerCommand(message.data)) return
      const requestId = nestedRequestId(message.data)
      if (!requestId) return
      if (type === 'command') markStored(requestId, message.data._id)
      else if (message.data.isSuccess) markSuccess(requestId, message.data._id)
      else markStored(requestId, message.data._id)
      return
    }

    if (type === 'published') {
      if (message.requestId) markStored(message.requestId)
      return
    }

    if (type === 'error') {
      if (message.requestId) markFailed(message.requestId, message.message ?? 'Request rejected by server')
      else useNotificationStore().triggerToast({ title: 'Server error', message: message.message ?? 'No error details provided', level: 'critical' })
      return
    }

    if (type === 'deviceError') {
      if (!isServerError(message.data)) return
      const isNew = useServerNotificationStore().addError(message.data)
      if (isNew) {
        useNotificationStore().triggerToast({
          title: 'Error perangkat',
          message: `${message.data.deviceId}: ${message.data.error}`,
          level: 'critical',
          deviceId: message.data.deviceId,
        })
      }
      return
    }

    if (type === 'notification' || type === 'notificationSnapshot') {
      const items = type === 'notificationSnapshot' && Array.isArray(message.data)
        ? message.data
        : [message.data]
      const serverNotifications = useServerNotificationStore()

      if (type === 'notificationSnapshot') {
        serverNotifications.hydrate(items.filter(isServerNotification))
        return
      }

      for (const item of items) {
        if (!isServerNotification(item)) continue
        if (!serverNotifications.upsert(item)) continue
        const level = serverNotifications.levelFor(item)
        useNotificationStore().triggerToast({
          title: level === 'critical' ? 'Notifikasi kritis' : 'Peringatan infus',
          message: `${item.deviceId} · ${item.message}`,
          level: level === 'normal' ? 'info' : level,
          deviceId: item.deviceId,
        })
      }
    }
  }

  function markStored(requestId: string, commandId?: string): void {
    const command = commands.value[requestId]
    if (!command || command.status === 'success' || command.status === 'failed') return
    command.status = 'stored'
    if (commandId) command.commandId = commandId
  }

  function markSuccess(requestId: string, commandId?: string): void {
    const command = commands.value[requestId]
    if (!command) return
    command.status = 'success'
    if (commandId) command.commandId = commandId
    command.error = undefined
  }

  function markFailed(requestId: string, message: string): void {
    const command = commands.value[requestId]
    if (!command) return
    command.status = 'failed'
    command.error = message
  }

  function sendCommand(deviceId: string, type: 'set' | 'reset', data: Record<string, unknown>): string {
    const id = deviceId.trim()
    if (!id || id.includes('/')) throw new Error('Invalid device ID for the command label')

    sequence += 1
    const requestId = `cmd-${Date.now()}-${sequence}`
    commands.value[requestId] = {
      requestId,
      deviceId: id,
      label: `command/${id}`,
      status: 'sending',
      createdAt: Date.now(),
    }

    sendWsRequest({
      action: 'publish',
      requestId,
      label: `command/${id}`,
      data: {
        type,
        deviceId: id,
        data: { ...data, requestId },
      },
    })

    return requestId
  }

  function commandForDevice(deviceId: string): CommandState | undefined {
    return Object.values(commands.value)
      .filter((command) => command.deviceId === deviceId)
      .sort((a, b) => b.createdAt - a.createdAt)[0]
  }

  function statusLabel(state: CommandStateStatus): string {
    return STATUS_LABEL[state]
  }

  return {
    status,
    commands,
    activeCommands,
    start,
    stop,
    sendCommand,
    commandForDevice,
    statusLabel,
  }
})
