<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useInfusionStore } from '@/stores/infusion'
import { useDeviceTabsStore } from '@/stores/deviceTabs'
import { useRealtimeStore } from '@/stores/realtime'
import { fetchTelemetryHistory } from '@/services/historyService'
import { normalizeTimestamp } from '@/services/infusionProtocol'
import { deviceDetailPath } from '@/utils/deviceRoute'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import type { ServerInfusPayload } from '@/types/backend'
import type { InfusionHistoryEntry } from '@/types/infusion'
const store = useInfusionStore()
const tabs = useDeviceTabsStore()
const router = useRouter()
const realtime = useRealtimeStore()
const filter = ref('all')
const telemetryDevice = ref('')
const telemetryRows = ref<(ServerInfusPayload & { _id?: string })[]>([])
const telemetryCursor = ref('')
const hasMoreTelemetry = ref(false)
const loadingTelemetry = ref(false)
const telemetryError = ref('')
const entries = computed(() => filter.value === 'all' ? store.history : store.history.filter((item) => item.status === filter.value))
function deviceForEntry(entry: InfusionHistoryEntry) {
  return entry.deviceId ? store.findDevice(entry.deviceId) : undefined
}
function openDeviceDetail(entry: InfusionHistoryEntry) {
  const device = deviceForEntry(entry)
  if (!device) return
  if (!device.id?.trim()) return
  tabs.openTab(device)
  router.push(deviceDetailPath(device.id))
}

function formatTelemetryTime(value?: string): string {
  const parsed = Date.parse(normalizeTimestamp(value))
  if (Number.isNaN(parsed)) return value ?? '—'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed)
}

async function loadTelemetry(reset = false): Promise<void> {
  if (loadingTelemetry.value) return
  if (reset) {
    telemetryRows.value = []
    telemetryCursor.value = ''
    hasMoreTelemetry.value = false
  }

  loadingTelemetry.value = true
  telemetryError.value = ''
  try {
    const response = await fetchTelemetryHistory(telemetryDevice.value.trim(), {
      limit: 50,
      before: reset ? undefined : telemetryCursor.value || undefined,
    })
    telemetryRows.value = reset ? response.data : [...telemetryRows.value, ...response.data]
    telemetryCursor.value = response.nextCursor
    hasMoreTelemetry.value = response.hasMore
  } catch (error) {
    telemetryError.value = error instanceof Error ? error.message : 'Gagal memuat riwayat telemetri.'
  } finally {
    loadingTelemetry.value = false
  }
}

watch(() => realtime.status, (value) => {
  if (value === 'connected') void loadTelemetry(true)
}, { immediate: true })
</script>
<template>
  <div class="space-y-6"><header class="border-b border-outline-variant pb-5"><p class="font-telemetry text-[10px] uppercase tracking-[.2em] text-primary">Clinical log / sessions</p><h1 class="mt-2 font-display text-3xl sm:text-4xl">Riwayat Infus</h1><p class="mt-1 text-sm text-muted">Catatan sesi infus dan status pemasangan perangkat.</p></header>
    <section class="rounded-[10px] border border-[#C6DED6]/65 bg-surface p-4 shadow-[0_2px_12px_rgba(0,20,18,0.04)]">
      <header class="flex flex-wrap items-end justify-between gap-3 border-b border-outline-variant pb-3"><div><h2 class="font-display text-lg">Telemetri server</h2><p class="text-xs text-muted">Dokumen mentah dari koleksi `data` melalui GET /history.</p></div><div class="flex w-full gap-2 sm:w-auto"><input v-model="telemetryDevice" type="search" aria-label="Filter deviceId telemetri" placeholder="Filter deviceId" class="w-full rounded-[8px] border border-[#C6DED6] bg-surface px-3 py-2 text-sm sm:w-48" @keyup.enter="loadTelemetry(true)" /><button type="button" class="shrink-0 rounded-[8px] bg-primary px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-on-primary disabled:opacity-50" :disabled="loadingTelemetry" @click="loadTelemetry(true)">Muat ulang</button></div></header>
      <p v-if="telemetryError" class="mt-3 rounded-[6px] bg-secondary-container p-2 text-xs text-secondary">{{ telemetryError }}</p>
      <div v-if="telemetryRows.length" class="mt-3 overflow-x-auto"><table class="w-full min-w-[760px] border-collapse text-left text-xs"><thead class="bg-secondary text-[10px] uppercase tracking-wider text-on-secondary"><tr><th class="px-3 py-2">timestamp</th><th class="px-3 py-2">deviceId</th><th class="px-3 py-2">patientId / roomId</th><th class="px-3 py-2">infusType</th><th class="px-3 py-2">tpm</th><th class="px-3 py-2">percent</th><th class="px-3 py-2">servoAngle</th><th class="px-3 py-2">volume</th></tr></thead><tbody><tr v-for="row in telemetryRows" :key="row._id ?? `${row.deviceId}-${row.timestamp}`" class="border-b border-outline-variant last:border-0"><td class="px-3 py-2 font-telemetry">{{ formatTelemetryTime(row.timestamp) }}</td><td class="px-3 py-2 font-telemetry font-bold text-primary">{{ row.deviceId }}</td><td class="px-3 py-2">{{ row.patientId || '—' }} <span class="text-muted">· {{ row.roomId || '—' }}</span></td><td class="px-3 py-2">{{ row.data.infusType }}</td><td class="px-3 py-2 font-telemetry">{{ row.data.tpm }}</td><td class="px-3 py-2 font-telemetry">{{ row.data.percent }}%</td><td class="px-3 py-2 font-telemetry">{{ row.data.servoAngle }}</td><td class="px-3 py-2 font-telemetry">{{ row.data.volume }}</td></tr></tbody></table></div>
      <p v-else class="mt-3 rounded-[6px] border border-dashed border-outline p-6 text-center text-xs text-muted">Belum ada telemetri dari server.</p>
      <button v-if="hasMoreTelemetry" type="button" class="mt-3 w-full rounded-[8px] border border-outline-variant px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-primary disabled:opacity-50" :disabled="loadingTelemetry" @click="loadTelemetry()">{{ loadingTelemetry ? 'Memuat…' : 'Muat lebih banyak' }}</button>
    </section>
    <div class="flex flex-wrap gap-1 rounded-[10px] border border-[#C6DED6]/65 bg-surface p-1 shadow-[0_2px_12px_rgba(0,20,18,0.04)]"><button v-for="item in [{ value: 'all', label: 'Semua' }, { value: 'running', label: 'Sedang Berjalan' }, { value: 'ready', label: 'Terpasang' }, { value: 'done', label: 'Selesai' }]" :key="item.value" class="rounded-[8px] px-3 py-2 text-[10px] font-bold uppercase tracking-wide" :class="filter === item.value ? 'bg-primary text-on-primary' : 'text-muted hover:bg-secondary-container/55'" @click="filter = item.value">{{ item.label }}</button></div>
    <p v-if="store.liveMode" class="rounded-[10px] border border-[#C6DED6]/65 bg-secondary-container p-4 text-sm text-secondary shadow-[0_2px_12px_rgba(0,20,18,0.04)]">Server Go saat ini menyimpan telemetry mentah, belum menyediakan riwayat sesi infus untuk tabel ini.</p>
    <div v-else class="overflow-x-auto rounded-[10px] border border-[#C6DED6]/65 bg-surface shadow-[0_2px_12px_rgba(0,20,18,0.04)]"><table class="w-full min-w-[980px] text-left text-xs"><thead class="bg-secondary text-[10px] uppercase tracking-wider text-on-secondary"><tr><th class="px-4 py-3">ID sesi</th><th class="px-4 py-3">ID perangkat</th><th class="px-4 py-3">Waktu dibuat</th><th class="px-4 py-3">Pasien / Ruangan</th><th class="px-4 py-3">Cairan</th><th class="px-4 py-3">Mulai</th><th class="px-4 py-3">Selesai</th><th class="px-4 py-3">Perawat</th><th class="px-4 py-3">Status</th></tr></thead><tbody><tr v-for="entry in entries" :key="entry.id" :role="deviceForEntry(entry) ? 'link' : undefined" :tabindex="deviceForEntry(entry) ? 0 : undefined" :aria-label="deviceForEntry(entry) ? `Riwayat ${entry.id}, buka detail perangkat ${entry.deviceId}` : undefined" class="border-b border-outline-variant last:border-0 hover:bg-secondary-container/25" :class="deviceForEntry(entry) ? 'cursor-pointer' : ''" @click="openDeviceDetail(entry)" @keydown.enter.self="openDeviceDetail(entry)" @keydown.space.self.prevent="openDeviceDetail(entry)"><td class="px-4 py-4 font-telemetry text-primary">{{ entry.id }}</td><td class="px-4 py-4 font-telemetry">{{ entry.deviceId || '—' }}</td><td class="px-4 py-4 font-telemetry">{{ entry.createdAt }}</td><td class="px-4 py-4"><strong>{{ entry.patient || 'Belum ditempati' }}</strong><span class="mt-1 block text-muted">{{ entry.room || '—' }}</span></td><td class="px-4 py-4">{{ entry.fluid }}</td><td class="px-4 py-4 font-telemetry">{{ entry.startedAt }}</td><td class="px-4 py-4 font-telemetry">{{ entry.endedAt }}</td><td class="px-4 py-4">{{ entry.nurse || '—' }}</td><td class="px-4 py-4"><StatusBadge :status="entry.status" /></td></tr><tr v-if="entries.length === 0"><td colspan="9" class="px-4 py-10 text-center text-muted">Belum ada catatan untuk filter ini.</td></tr></tbody></table></div>
  </div>
</template>
