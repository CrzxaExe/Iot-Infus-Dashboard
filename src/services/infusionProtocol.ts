import type { ServerInfusPayload } from '@/types/backend'
import type { DeviceConfigForm, InfusionDevice } from '@/types/infusion'

function parseGoTimestamp(value: string): number {
  const direct = Date.parse(value)
  if (!Number.isNaN(direct)) return direct

  // Backend uses time.Now().String(), e.g. "2026-11-26 09:12:33.123 +0700 WIB m=+0.123".
  const match = value.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})(?:\.\d+)?\s+([+-]\d{4})/)
  if (!match) return Number.NaN

  const [, date, time, offset] = match
  if (!date || !time || !offset) return Number.NaN
  return Date.parse(`${date}T${time}${offset.slice(0, 3)}:${offset.slice(3)}`)
}

export function normalizeTimestamp(value?: string): string {
  if (!value) return new Date().toISOString()
  const parsed = parseGoTimestamp(value)
  return Number.isNaN(parsed) ? value : new Date(parsed).toISOString()
}

/**
 * Backend stores servoAngle from 0-180; a larger angle reduces the drip rate.
 * This is the default mapping and can be changed if the device convention differs.
 */
export function toServoAngle(targetTpm: number): number {
  const tpm = Math.min(60, Math.max(1, Number(targetTpm) || 20))
  return Math.round(180 - (tpm / 60) * 180)
}

export function toServerDevice(payload: ServerInfusPayload, config?: DeviceConfigForm): InfusionDevice {
  const percent = Math.min(100, Math.max(0, payload.data.percent))
  const recordedAt = normalizeTimestamp(payload.timestamp)
  const deviceId = payload.deviceId.trim()
  const patientId = payload.patientId.trim()
  const roomId = payload.roomId.trim()
  const telemetry: ServerInfusPayload = {
    ...payload,
    deviceId,
    patientId,
    roomId,
    timestamp: payload.timestamp ?? recordedAt,
    data: { ...payload.data, percent },
  }
  const totalMl = config?.totalMl ?? 0
  // Server payloads already carry patientId, so treat the device as running
  // even when the local config overlay (nurse, totalMl, etc.) is still empty.
  const assigned = Boolean(config?.patient?.trim() || patientId)

  return {
    id: deviceId,
    telemetry,
    room: config?.room || roomId,
    bed: config?.bed ?? '',
    patient: config?.patient || patientId,
    nurse: config?.nurse ?? '',
    fluid: config?.fluid || payload.data.infusType,
    volumePct: percent,
    remainingMl: totalMl > 0 ? Math.round(totalMl * percent / 100) : 0,
    totalMl,
    rateTpm: payload.data.tpm,
    targetTpm: config?.targetTpm ?? payload.data.tpm,
    status: assigned ? 'running' : 'ready',
    paused: false,
    updatedAt: recordedAt,
    volumeHistory: [{ recordedAt, volumePct: percent, reportedVolume: payload.data.volume }],
    reportedVolume: payload.data.volume,
    source: 'server',
  }
}
