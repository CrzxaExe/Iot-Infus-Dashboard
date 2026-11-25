<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useInfusionStore } from '@/stores/infusion'
import { useDeviceTabsStore } from '@/stores/deviceTabs'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import type { InfusionHistoryEntry } from '@/types/infusion'
const store = useInfusionStore()
const tabs = useDeviceTabsStore()
const router = useRouter()
const filter = ref('all')
const entries = computed(() => filter.value === 'all' ? store.history : store.history.filter((item) => item.status === filter.value))
function deviceForEntry(entry: InfusionHistoryEntry) {
  return entry.deviceId ? store.findDevice(entry.deviceId) : undefined
}
function openDeviceDetail(entry: InfusionHistoryEntry) {
  const device = deviceForEntry(entry)
  if (!device) return
  tabs.openTab(device)
  router.push({ name: 'detail-perangkat', params: { id: device.id } })
}
</script>
<template>
  <div class="space-y-6"><header class="border-b border-outline-variant pb-5"><p class="font-telemetry text-[10px] uppercase tracking-[.2em] text-primary">Clinical log / sessions</p><h1 class="mt-2 font-display text-3xl sm:text-4xl">Riwayat Infus</h1><p class="mt-1 text-sm text-muted">Catatan sesi infus dan status pemasangan perangkat.</p></header>
    <div class="flex flex-wrap gap-1 rounded-[10px] border border-[#C6DED6]/65 bg-surface p-1 shadow-[0_2px_12px_rgba(0,20,18,0.04)]"><button v-for="item in [{ value: 'all', label: 'Semua' }, { value: 'running', label: 'Sedang Berjalan' }, { value: 'ready', label: 'Terpasang' }, { value: 'done', label: 'Selesai' }]" :key="item.value" class="rounded-[8px] px-3 py-2 text-[10px] font-bold uppercase tracking-wide" :class="filter === item.value ? 'bg-primary text-on-primary' : 'text-muted hover:bg-secondary-container/55'" @click="filter = item.value">{{ item.label }}</button></div>
    <p v-if="store.liveMode" class="rounded-[10px] border border-[#C6DED6]/65 bg-secondary-container p-4 text-sm text-secondary shadow-[0_2px_12px_rgba(0,20,18,0.04)]">Server Go saat ini menyimpan telemetry mentah, belum menyediakan riwayat sesi infus untuk tabel ini.</p>
    <div v-else class="overflow-x-auto rounded-[10px] border border-[#C6DED6]/65 bg-surface shadow-[0_2px_12px_rgba(0,20,18,0.04)]"><table class="w-full min-w-[980px] text-left text-xs"><thead class="bg-secondary text-[10px] uppercase tracking-wider text-on-secondary"><tr><th class="px-4 py-3">ID sesi</th><th class="px-4 py-3">ID perangkat</th><th class="px-4 py-3">Waktu dibuat</th><th class="px-4 py-3">Pasien / Ruangan</th><th class="px-4 py-3">Cairan</th><th class="px-4 py-3">Mulai</th><th class="px-4 py-3">Selesai</th><th class="px-4 py-3">Perawat</th><th class="px-4 py-3">Status</th></tr></thead><tbody><tr v-for="entry in entries" :key="entry.id" :role="deviceForEntry(entry) ? 'link' : undefined" :tabindex="deviceForEntry(entry) ? 0 : undefined" :aria-label="deviceForEntry(entry) ? `Riwayat ${entry.id}, buka detail perangkat ${entry.deviceId}` : undefined" class="border-b border-outline-variant last:border-0 hover:bg-secondary-container/25" :class="deviceForEntry(entry) ? 'cursor-pointer' : ''" @click="openDeviceDetail(entry)" @keydown.enter.self="openDeviceDetail(entry)" @keydown.space.self.prevent="openDeviceDetail(entry)"><td class="px-4 py-4 font-telemetry text-primary">{{ entry.id }}</td><td class="px-4 py-4 font-telemetry">{{ entry.deviceId || '—' }}</td><td class="px-4 py-4 font-telemetry">{{ entry.createdAt }}</td><td class="px-4 py-4"><strong>{{ entry.patient || 'Belum ditempati' }}</strong><span class="mt-1 block text-muted">{{ entry.room || '—' }}</span></td><td class="px-4 py-4">{{ entry.fluid }}</td><td class="px-4 py-4 font-telemetry">{{ entry.startedAt }}</td><td class="px-4 py-4 font-telemetry">{{ entry.endedAt }}</td><td class="px-4 py-4">{{ entry.nurse || '—' }}</td><td class="px-4 py-4"><StatusBadge :status="entry.status" /></td></tr><tr v-if="entries.length === 0"><td colspan="9" class="px-4 py-10 text-center text-muted">Belum ada catatan untuk filter ini.</td></tr></tbody></table></div>
  </div>
</template>
