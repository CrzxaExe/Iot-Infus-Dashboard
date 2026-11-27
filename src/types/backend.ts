/**
 * DTO untuk protokol InfusServer.
 * Label WebSocket = topic MQTT tanpa prefix `medical/infusion/`.
 */

/** Mirrors models.InfusData from InfusServer. */
export interface ServerInfusData {
  tpm: number
  infusType: string
  percent: number
  servoAngle: number
  volume: number
}

/** Mirrors models.InfusPayload from InfusServer. */
export interface ServerInfusPayload {
  _id?: string
  deviceId: string
  patientId: string
  roomId: string
  timestamp?: string
  data: ServerInfusData
}

export type CommandType = 'set' | 'reset' | string

export interface ServerCommand<T = Record<string, unknown>> {
  _id?: string
  type: CommandType
  deviceId: string
  timestamp?: string
  isSuccess?: boolean
  successTimestamp?: string
  data: T
}

export interface ServerNotification {
  deviceId: string
  patientId?: string
  roomId?: string
  level?: string
  message: string
  isRead?: boolean
  isResolved?: boolean
  timestamp?: string
}

export interface ServerErrorMessage {
  deviceId: string
  error: string
  isFixed?: boolean
  timestamp?: string
}

export interface WsSnapshot {
  [label: string]: unknown
}

export interface WsAck {
  type: string
  requestId?: string
  labels?: string[]
  label?: string
  message?: string
  data?: unknown
}

export interface WsEvent {
  type: string
  data?: unknown
  message?: string
  requestId?: string
}

export type ServerMessage = WsAck | WsEvent

export interface HistoryEnvelope<T> {
  label: string
  category: string
  data: T[]
  limit: number
  nextCursor: string
  hasMore: boolean
}

export interface CommandRequest {
  action: 'publish'
  requestId: string
  label: string
  data: ServerCommand
}

export interface SubscribeRequest {
  action: 'subscribe'
  requestId: string
  labels: string[]
  replay?: boolean
}

export type WsClientRequest = CommandRequest | SubscribeRequest
