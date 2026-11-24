import type { InfusionDevice, ServerInfusPayload } from '@/types/infusion'

export function toServerDevice(payload: ServerInfusPayload): InfusionDevice {
  const percent = Math.min(100, Math.max(0, payload.data.percent))
  const recordedAt = payload.timestamp || new Date().toISOString()
  const sample = {
    recordedAt,
    volumePct: percent,
    ...(payload.data.volume === undefined ? {} : { reportedVolume: payload.data.volume }),
  }

  return {
    id: payload.deviceId,
    room: payload.roomId ?? '',
    patient: payload.patientId ?? '',
    nurse: '',
    fluid: payload.data.infusType,
    volumePct: percent,
    remainingMl: 0,
    totalMl: 0,
    rateTpm: payload.data.tpm,
    targetTpm: payload.data.tpm,
    status: 'running',
    paused: false,
    updatedAt: recordedAt,
    volumeHistory: [sample],
    ...(payload.data.volume === undefined ? {} : { reportedVolume: payload.data.volume }),
    source: 'server',
  }
}
