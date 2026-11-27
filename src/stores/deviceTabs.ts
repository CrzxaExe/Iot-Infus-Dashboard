import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import type { DeviceTab, InfusionDevice } from '@/types/infusion'

type StoredTab = Partial<DeviceTab> & { deviceId?: string }

function normalizeTab(value: unknown): DeviceTab | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const row = value as StoredTab
  const id = typeof row.id === 'string' && row.id.trim()
    ? row.id
    : typeof row.deviceId === 'string' && row.deviceId.trim()
      ? row.deviceId
      : ''
  if (!id) return undefined
  return {
    id,
    nurse: typeof row.nurse === 'string' ? row.nurse : '',
    critical: row.critical === true,
  }
}

export const useDeviceTabsStore = defineStore('deviceTabs', () => {
  const openTabs = useStorage<DeviceTab[]>('infucare-open-tabs', [])

  // Old localStorage entries can use a different shape. Drop entries without a
  // valid id so RouterLink cannot throw "Missing required param id".
  openTabs.value = openTabs.value
    .map(normalizeTab)
    .filter((tab): tab is DeviceTab => Boolean(tab))

  function openTab(device: InfusionDevice) {
    if (!device?.id?.trim()) return
    const existing = openTabs.value.find((tab) => tab.id === device.id)
    if (existing) Object.assign(existing, { nurse: device.nurse, critical: device.volumePct <= 5 })
    else openTabs.value.push({ id: device.id, nurse: device.nurse, critical: device.volumePct <= 5 })
  }

  function syncTab(device: InfusionDevice) {
    if (!device?.id?.trim()) return
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
