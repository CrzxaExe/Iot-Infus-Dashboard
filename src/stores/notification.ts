import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { InfusionLevel, PixelToastPayload } from '@/types/infusion'

export const useNotificationStore = defineStore('notification', () => {
  const activeToast = ref<PixelToastPayload | null>(null)
  const burstCounter = ref(0)
  const dismissedAlerts = ref<string[]>([])

  function triggerToast(payload: { title: string; message: string; level?: InfusionLevel | 'info'; deviceId?: string }) {
    activeToast.value = {
      ...payload,
      level: payload.level ?? 'info',
      deviceId: payload.deviceId ?? 'INF-001',
      id: Date.now(),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    }
    burstCounter.value += 1
  }

  function dismissToast() { activeToast.value = null }
  function dismissAlert(key: string) {
    if (!dismissedAlerts.value.includes(key)) dismissedAlerts.value.push(key)
  }
  function isAlertDismissed(key: string) {
    return dismissedAlerts.value.includes(key)
  }

  return { activeToast, burstCounter, triggerToast, dismissToast, dismissAlert, isAlertDismissed }
})
