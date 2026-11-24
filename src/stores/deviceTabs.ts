import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import type { DeviceTab, InfusionDevice } from '@/types/infusion'

export const useDeviceTabsStore = defineStore('deviceTabs', () => {
  const openTabs = useStorage<DeviceTab[]>('infucare-open-tabs', [])

  function openTab(device: InfusionDevice) {
    const existing = openTabs.value.find((tab) => tab.id === device.id)
    if (existing) Object.assign(existing, { nurse: device.nurse, critical: device.volumePct <= 5 })
    else openTabs.value.push({ id: device.id, nurse: device.nurse, critical: device.volumePct <= 5 })
  }

  function syncTab(device: InfusionDevice) {
    const tab = openTabs.value.find((item) => item.id === device.id)
    if (tab) Object.assign(tab, { nurse: device.nurse, critical: device.volumePct <= 5 })
  }

  function closeTab(id: string): string | null {
    const index = openTabs.value.findIndex((tab) => tab.id === id)
    if (index < 0) return null
    openTabs.value.splice(index, 1)
    return openTabs.value[index]?.id ?? openTabs.value[index - 1]?.id ?? null
  }

  return { openTabs, openTab, syncTab, closeTab }
})
