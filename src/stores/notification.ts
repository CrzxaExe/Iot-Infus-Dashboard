import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { InfusionLevel, PixelToastPayload } from '@/types/infusion'

/** Batas jumlah toast yang ditumpuk agar layar tidak penuh saat notifikasi datang cepat. */
const MAX_TOASTS = 20

export const useNotificationStore = defineStore('notification', () => {
  const toasts = ref<PixelToastPayload[]>([])
  const burstCounter = ref(0)
  const dismissedAlerts = ref<string[]>([])
  let toastSequence = 0

  /** Kompatibilitas dengan pemanggil lama yang hanya butuh toast teratas. */
  const activeToast = computed(() => toasts.value[0] ?? null)

  function triggerToast(payload: { title: string; message: string; level?: InfusionLevel | 'info'; deviceId?: string }) {
    toastSequence += 1
    toasts.value.push({
      ...payload,
      level: payload.level ?? 'info',
      deviceId: payload.deviceId ?? 'INF-001',
      id: Date.now() + toastSequence,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    })

    if (toasts.value.length > MAX_TOASTS) {
      toasts.value.splice(0, toasts.value.length - MAX_TOASTS)
    }
    burstCounter.value += 1
  }

  function dismissToast(id?: number) {
    if (id === undefined) {
      toasts.value.shift()
      return
    }
    const index = toasts.value.findIndex((toast) => toast.id === id)
    if (index >= 0) toasts.value.splice(index, 1)
  }

  function clearToasts() {
    toasts.value = []
  }

  function dismissAlert(key: string) {
    if (!dismissedAlerts.value.includes(key)) dismissedAlerts.value.push(key)
  }
  function isAlertDismissed(key: string) {
    return dismissedAlerts.value.includes(key)
  }

  return { toasts, activeToast, burstCounter, triggerToast, dismissToast, clearToasts, dismissAlert, isAlertDismissed }
})
