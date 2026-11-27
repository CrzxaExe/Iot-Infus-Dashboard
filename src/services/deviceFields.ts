import type { ServerInfusData } from '@/types/backend'
import type { InfusionDevice } from '@/types/infusion'
import { toServoAngle } from './infusionProtocol'

function trimmed(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * Backend-first accessors. Server devices read directly from `telemetry`;
 * local demo devices keep working through their existing fields.
 */
export function dataOf(device: InfusionDevice): ServerInfusData {
  if (device.telemetry?.data) return device.telemetry.data
  return {
    tpm: device.rateTpm,
    infusType: device.fluid,
    percent: device.volumePct,
    servoAngle: toServoAngle(device.targetTpm),
    volume: device.reportedVolume ?? device.remainingMl,
  }
}

export function deviceIdOf(device: InfusionDevice): string {
  return trimmed(device.telemetry?.deviceId) || device.id || '—'
}

export function patientIdOf(device: InfusionDevice): string {
  // Device configuration is a frontend-only overlay and wins over telemetry.
  return trimmed(device.patient) || trimmed(device.telemetry?.patientId)
}

export function roomIdOf(device: InfusionDevice): string {
  return trimmed(device.room) || trimmed(device.telemetry?.roomId)
}

export function infusTypeOf(device: InfusionDevice): string {
  return trimmed(device.fluid) || trimmed(dataOf(device).infusType) || '—'
}

export function percentOf(device: InfusionDevice): number {
  return dataOf(device).percent
}

export function tpmOf(device: InfusionDevice): number {
  return dataOf(device).tpm
}

export function volumeOf(device: InfusionDevice): number {
  return dataOf(device).volume
}

export function servoAngleOf(device: InfusionDevice): number {
  return dataOf(device).servoAngle
}

export function timestampOf(device: InfusionDevice): string {
  return trimmed(device.telemetry?.timestamp) || device.updatedAt
}

export function isServerDevice(device: InfusionDevice): boolean {
  return Boolean(device.telemetry) || device.source === 'server'
}

/** Server payloads report absolute volume; local devices use remaining/total. */
export function volumeLabelOf(device: InfusionDevice): string {
  if (isServerDevice(device)) return `${volumeOf(device)} ml`
  return `${device.remainingMl} / ${device.totalMl} ml`
}
