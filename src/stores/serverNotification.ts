import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import type { HistoryOptions } from '@/services/historyService'
import { fetchNotificationHistory } from '@/services/historyService'
import type { ServerErrorMessage, ServerNotification } from '@/types/backend'

export type ServerAlertLevel = 'normal' | 'warning' | 'critical'

const MAX_ITEMS = 200

export const useServerNotificationStore = defineStore('serverNotification', () => {
  const notifications = ref<ServerNotification[]>([])
  const errors = ref<ServerErrorMessage[]>([])
  const dismissedKeys = useStorage<string[]>('infucare-dismissed-notifications', [])

  function notificationKey(item: ServerNotification): string {
    return `${item.deviceId}|${item.timestamp ?? ''}|${item.message}`
  }

  function errorKey(item: ServerErrorMessage): string {
    return `${item.deviceId}|${item.timestamp ?? ''}|${item.error}`
  }

  const unresolved = computed(() => notifications.value.filter((item) => item.isResolved !== true
    && !dismissedKeys.value.includes(notificationKey(item))))

  const activeErrors = computed(() => errors.value.filter((item) => item.isFixed !== true))

  function levelFor(item: ServerNotification): ServerAlertLevel {
    const level = (item.level ?? '').toLowerCase()
    if (level === 'critical') return 'critical'
    if (level === 'warning') return 'warning'
    return 'normal'
  }

  function hydrate(items: ServerNotification[]): void {
    const existing = new Set(notifications.value.map(notificationKey))
    const fresh = items.filter((item) => !existing.has(notificationKey(item)))
    notifications.value = [...fresh, ...notifications.value].slice(0, MAX_ITEMS)
  }

  function upsert(item: ServerNotification): boolean {
    const key = notificationKey(item)
    const index = notifications.value.findIndex((current) => notificationKey(current) === key)
    if (index >= 0) {
      notifications.value[index] = item
      return false
    }
    notifications.value.unshift(item)
    notifications.value = notifications.value.slice(0, MAX_ITEMS)
    return true
  }

  function addError(item: ServerErrorMessage): boolean {
    const key = errorKey(item)
    if (errors.value.some((current) => errorKey(current) === key)) return false
    errors.value.unshift(item)
    errors.value = errors.value.slice(0, MAX_ITEMS)
    return true
  }

  function dismiss(item: ServerNotification): void {
    const key = notificationKey(item)
    if (!dismissedKeys.value.includes(key)) dismissedKeys.value.push(key)
    if (dismissedKeys.value.length > MAX_ITEMS) dismissedKeys.value.splice(0, dismissedKeys.value.length - MAX_ITEMS)
  }

  function dismissKey(key: string): void {
    if (!dismissedKeys.value.includes(key)) dismissedKeys.value.push(key)
  }

  /** Mengisi daftar dari REST /history?label=notify agar tidak bergantung pada WS snapshot saja. */
  async function loadHistory(options: HistoryOptions = {}): Promise<void> {
    try {
      const response = await fetchNotificationHistory('', { limit: 50, ...options })
      hydrate(response.data)
    } catch (error) {
      console.error('[serverNotification] Failed to load notification history:', error)
    }
  }

  /** Penanda selesai hanya lokal sampai backend menyediakan endpoint update isResolved. */
  function markResolved(item: ServerNotification): void {
    dismiss(item)
    const current = notifications.value.find((row) => notificationKey(row) === notificationKey(item))
    if (current) current.isResolved = true
  }

  return {
    notifications,
    errors,
    unresolved,
    activeErrors,
    notificationKey,
    errorKey,
    levelFor,
    hydrate,
    loadHistory,
    upsert,
    addError,
    dismiss,
    dismissKey,
    markResolved,
  }
})
