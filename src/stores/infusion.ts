import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { initialInfusionSnapshot } from '@/data/initialInfusionSnapshot'
import type { ServerInfusPayload } from '@/types/backend'
import type { DeviceConfigForm, InfusionDataEvent, InfusionDevice, InfusionHistoryEntry, InfusionLevel, InfusionSnapshot, HistoryStatus } from '@/types/infusion'
import { percentOf } from '@/services/deviceFields'
import { toServerDevice } from '@/services/infusionProtocol'

export const useInfusionStore = defineStore('infusion', () => {
  const devices = ref<InfusionDevice[]>(initialInfusionSnapshot.devices.map((item) => ({ ...item })))
  const history = ref<InfusionHistoryEntry[]>(initialInfusionSnapshot.history.map((item) => ({ ...item })))
  const liveMode = ref(false)
  // Device configuration has no backend API yet, so keep it as a local overlay.
  const deviceConfigs = useStorage<Record<string, DeviceConfigForm>>('infucare-device-configs', {})
  let historySequence = 0

  const activeDevices = computed(() => devices.value.filter((device) => device.status !== 'done'))
  // The backend has no session status, so count every active telemetry device.
  const criticalCount = computed(() => devices.value.filter((device) => device.status !== 'done' && getLevel(device) === 'critical').length)
  const warningCount = computed(() => devices.value.filter((device) => device.status !== 'done' && getLevel(device) === 'warning').length)

  function getLevel(device: InfusionDevice): InfusionLevel {
    if (device.status === 'done') return 'normal'
    if (percentOf(device) <= 5) return 'critical'
    if (percentOf(device) <= 10) return 'warning'
    return 'normal'
  }

  function findDevice(id: string) {
    return devices.value.find((device) => device.id === id)
  }

  function deleteDevice(id: string) {
    const index = devices.value.findIndex((device) => device.id === id)
    if (index >= 0) devices.value.splice(index, 1)
    if (deviceConfigs.value[id]) {
      const next = { ...deviceConfigs.value }
      delete next[id]
      deviceConfigs.value = next
    }
  }

  function deviceConfig(id: string): DeviceConfigForm | undefined {
    return deviceConfigs.value[id]
  }

  function replaceSnapshot(snapshot: InfusionSnapshot) {
    devices.value = snapshot.devices.map((device) => ({ ...device, volumeHistory: device.volumeHistory?.map((sample) => ({ ...sample })) }))
    history.value = snapshot.history.map((entry) => ({ ...entry }))
  }

  function enableLiveMode() {
    liveMode.value = true
    devices.value = []
    history.value = []
  }

  function replaceServerSnapshot(payloads: ServerInfusPayload[]) {
    devices.value = payloads
      .filter((payload) => Boolean(payload.deviceId?.trim()))
      .map((payload) => {
        const deviceId = payload.deviceId.trim()
        return toServerDevice({ ...payload, deviceId }, deviceConfigs.value[deviceId])
      })
    history.value = []
  }

  function applyServerTelemetry(payload: ServerInfusPayload) {
    if (!payload.deviceId?.trim()) return
    const deviceId = payload.deviceId.trim()
    const config = deviceConfigs.value[deviceId]
    const incoming = toServerDevice({ ...payload, deviceId }, config)
    const current = findDevice(incoming.id)
    if (!current) {
      devices.value.push(incoming)
      return
    }

    const samples = [...(current.volumeHistory ?? []), ...(incoming.volumeHistory ?? [])].slice(-1000)
    Object.assign(current, incoming, {
      paused: current.paused,
      volumeHistory: samples,
      ...(config ? {} : {
        nurse: current.nurse || incoming.nurse,
        patient: current.patient || incoming.patient,
        room: current.room || incoming.room,
        bed: current.bed || incoming.bed,
        fluid: current.fluid || incoming.fluid,
        totalMl: current.totalMl || incoming.totalMl,
        targetTpm: current.targetTpm || incoming.targetTpm,
      }),
    })
  }

  function applyDataEvent(event: InfusionDataEvent) {
    if (event.type === 'device.upserted') {
      const current = findDevice(event.device.id)
      const device = { ...event.device, volumeHistory: event.device.volumeHistory?.map((sample) => ({ ...sample })) }
      if (current) Object.assign(current, device)
      else devices.value.push(device)
      return
    }

    if (event.type === 'device.deleted') {
      deleteDevice(event.deviceId)
      return
    }

    if (event.type === 'history.upserted') {
      const current = history.value.find((entry) => entry.id === event.entry.id)
      if (current) Object.assign(current, event.entry)
      else history.value.unshift({ ...event.entry })
      return
    }

    const device = findDevice(event.deviceId)
    if (!device) throw new Error(`Cannot apply telemetry for unknown infusion device: ${event.deviceId}`)
    updateDevice(event.deviceId, {
      volumePct: event.sample.volumePct,
      remainingMl: event.sample.remainingMl,
      rateTpm: event.rateTpm ?? device.rateTpm,
      updatedAt: event.sample.recordedAt,
      volumeHistory: [...(device.volumeHistory ?? []).slice(-999), { ...event.sample }],
    })
  }

  function updateDevice(id: string, patch: Partial<InfusionDevice>) {
    const device = findDevice(id)
    if (device) Object.assign(device, patch, { updatedAt: patch.updatedAt ?? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) })
  }

  function currentTime() {
    return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  function findOpenHistory(deviceId: string) {
    return history.value.find((entry) => entry.deviceId === deviceId && entry.status !== 'done')
  }

  function createHistoryEntry(device: InfusionDevice, status: HistoryStatus): InfusionHistoryEntry {
    const time = currentTime()
    historySequence += 1
    return {
      id: `HIS-${Date.now()}-${historySequence}`,
      deviceId: device.id,
      patient: device.patient,
      room: device.room,
      fluid: device.fluid,
      startedAt: status === 'ready' ? '—' : status === 'done' ? device.updatedAt : time,
      endedAt: status === 'done' ? time : '—',
      createdAt: time,
      status,
      nurse: device.nurse,
    }
  }

  function syncHistoryDetails(entry: InfusionHistoryEntry, device: InfusionDevice) {
    Object.assign(entry, { deviceId: device.id, patient: device.patient, room: device.room, fluid: device.fluid, nurse: device.nurse })
  }

  function configureDevice(payload: DeviceConfigForm) {
    deviceConfigs.value = {
      ...deviceConfigs.value,
      [payload.deviceId]: { ...payload },
    }
    const existing = findDevice(payload.deviceId)
    const totalMl = Math.max(1, Number(payload.totalMl) || 500)
    const patient = payload.patient.trim()
    const nurse = payload.nurse.trim()
    const room = payload.room.trim()
    const bed = payload.bed.trim()
    const status: HistoryStatus = patient && nurse ? 'running' : 'ready'
    if (existing) {
      const previousStatus = existing.status
      const previousDevice = { ...existing }
      updateDevice(existing.id, { nurse, patient, room, bed, fluid: payload.fluid, totalMl, remainingMl: totalMl, volumePct: 100, rateTpm: payload.targetTpm, targetTpm: payload.targetTpm, status, paused: false, volumeHistory: [] })
      const updatedDevice = findDevice(existing.id)
      const entry = findOpenHistory(existing.id)
      if (!updatedDevice) return

      if (previousStatus === 'running' && status === 'ready') {
        if (entry) {
          entry.status = 'done'
          entry.endedAt = currentTime()
        } else {
          history.value.unshift(createHistoryEntry(previousDevice, 'done'))
        }
        history.value.unshift(createHistoryEntry(updatedDevice, 'ready'))
      } else if (entry) {
        syncHistoryDetails(entry, updatedDevice)
        if (entry.status !== status) {
          entry.status = status
          entry.startedAt = status === 'running' ? currentTime() : '—'
          entry.endedAt = '—'
        }
      } else {
        history.value.unshift(createHistoryEntry(updatedDevice, status))
      }
    } else {
      const device: InfusionDevice = { id: payload.deviceId, room, bed, patient, nurse, fluid: payload.fluid, targetTpm: payload.targetTpm, totalMl, remainingMl: totalMl, volumePct: 100, rateTpm: payload.targetTpm, status, paused: false, updatedAt: 'Baru', volumeHistory: [] }
      devices.value.push(device)
      history.value.unshift(createHistoryEntry(device, status))
    }
  }

  function adjustTarget(id: string, delta: number) {
    const device = findDevice(id)
    if (device) updateDevice(id, { targetTpm: Math.min(60, Math.max(1, device.targetTpm + delta)), rateTpm: Math.min(60, Math.max(1, device.targetTpm + delta)) })
  }

  function togglePause(id: string) {
    const device = findDevice(id)
    if (device) updateDevice(id, { paused: !device.paused })
  }

  function replaceFluid(id: string) {
    const device = findDevice(id)
    if (!device) return
    const assigned = Boolean(device.patient.trim() && device.nurse.trim())
    if (assigned) {
      const currentEntry = findOpenHistory(id)
      if (currentEntry) {
        currentEntry.status = 'done'
        currentEntry.endedAt = currentTime()
      } else {
        history.value.unshift(createHistoryEntry(device, 'done'))
      }
      updateDevice(id, { remainingMl: device.totalMl, volumePct: 100, paused: false, status: 'running', volumeHistory: [] })
      const updatedDevice = findDevice(id)
      if (updatedDevice) history.value.unshift(createHistoryEntry(updatedDevice, 'running'))
      return
    }
    updateDevice(id, { remainingMl: device.totalMl, volumePct: 100, paused: false, status: 'ready', volumeHistory: [] })
  }

  function setHistoryStatus(id: string, status: HistoryStatus) {
    const item = history.value.find((entry) => entry.id === id)
    if (item) item.status = status
  }

  return { devices, history, liveMode, deviceConfigs, activeDevices, criticalCount, warningCount, getLevel, findDevice, deviceConfig, deleteDevice, replaceSnapshot, enableLiveMode, replaceServerSnapshot, applyServerTelemetry, applyDataEvent, updateDevice, configureDevice, adjustTarget, togglePause, replaceFluid, setHistoryStatus }
})
