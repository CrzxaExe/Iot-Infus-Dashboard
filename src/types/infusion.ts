import type { ServerInfusPayload } from './backend'

export type InfusionLevel = 'normal' | 'warning' | 'critical'
export type HistoryStatus = 'running' | 'ready' | 'done'
export type BadgeStatus = InfusionLevel | HistoryStatus

export interface InfusionHistoryEntry {
  id: string
  deviceId?: string
  patient: string
  room: string
  fluid: string
  startedAt: string
  endedAt: string
  createdAt: string
  status: HistoryStatus
  nurse: string
}

export interface InfusionVolumeSample {
  recordedAt: string
  volumePct: number
  remainingMl?: number
  reportedVolume?: number
}

export interface InfusionDevice {
  id: string
  room: string
  bed?: string
  patient: string
  nurse: string
  fluid: string
  volumePct: number
  remainingMl: number
  totalMl: number
  rateTpm: number
  targetTpm: number
  status: HistoryStatus
  paused: boolean
  updatedAt: string
  volumeHistory?: InfusionVolumeSample[]
  reportedVolume?: number
  source?: 'local' | 'server'
  /** Original payload from InfusServer; local demo devices do not have it. */
  telemetry?: ServerInfusPayload
}

export interface InfusionSnapshot {
  devices: InfusionDevice[]
  history: InfusionHistoryEntry[]
}

export type InfusionDataEvent =
  | { type: 'device.upserted'; device: InfusionDevice }
  | { type: 'device.deleted'; deviceId: string }
  | { type: 'telemetry.received'; deviceId: string; sample: InfusionVolumeSample; rateTpm?: number }
  | { type: 'history.upserted'; entry: InfusionHistoryEntry }

export interface DeviceTab {
  id: string
  nurse: string
  critical: boolean
}

export interface PixelToastPayload {
  id: number
  title: string
  message: string
  level: InfusionLevel | 'info'
  deviceId: string
  time: string
}

export interface DeviceConfigForm {
  deviceId: string
  nurse: string
  patient: string
  room: string
  bed: string
  fluid: string
  totalMl: number
  targetTpm: number
}
