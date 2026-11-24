<script setup lang="ts">
import { computed, ref } from 'vue'
import { useNow } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { useInfusionStore } from '@/stores/infusion'
import { useDeviceTabsStore } from '@/stores/deviceTabs'
import InfusionCard from '@/components/infusion/InfusionCard.vue'
import { infusionRealtimeStatus } from '@/services/infusionRealtime'
const router = useRouter()
const store = useInfusionStore()
const tabs = useDeviceTabsStore()
const now = useNow()
const filter = ref<'all' | 'critical' | 'warning' | 'normal'>('all')
const runningDevices = computed(() => store.activeDevices.filter((device) => device.status === 'running'))
const filteredDevices = computed(() => runningDevices.value.filter((device) => {
  const level = store.getLevel(device)
  if (filter.value === 'all') return true
  if (filter.value === 'critical') return level === 'critical'
  if (filter.value === 'warning') return level === 'warning'
  return level === 'normal'
}))
const dateLabel = computed(() => new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now.value))
const timeLabel = computed(() => new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now.value))
function openDetail(device: (typeof store.devices)[number]) { tabs.openTab(device); router.push({ name: 'detail-perangkat', params: { id: device.id } }) }
</script>
<template>
  <div class="space-y-6">
    <header class="flex flex-col justify-between gap-4 border-b border-outline-variant pb-5 sm:flex-row sm:items-end"><div><p class="font-telemetry text-[10px] uppercase tracking-[.22em] text-primary">Nurse station / overview</p><h1 class="mt-2 font-display text-3xl sm:text-4xl">Monitoring Infus</h1><p class="mt-1 text-sm text-muted">Pantau volume cairan dan status perangkat secara terpusat.</p><p class="mt-2 text-xs font-semibold" :class="infusionRealtimeStatus === 'connected' ? 'text-primary' : 'text-warning'">{{ infusionRealtimeStatus === 'connected' ? 'Realtime terhubung ke server Go' : infusionRealtimeStatus === 'connecting' ? 'Menghubungkan ke server Go…' : infusionRealtimeStatus === 'disconnected' ? 'Koneksi terputus; mencoba menyambung ulang…' : infusionRealtimeStatus === 'error' ? 'Koneksi server bermasalah; periksa konfigurasi dan log.' : 'Mode demo — atur VITE_API_BASE_URL untuk menghubungkan server.' }}</p></div><div class="border border-outline-variant bg-white px-4 py-2 text-right"><p class="text-xs text-muted">{{ dateLabel }}</p><p class="font-telemetry text-lg font-semibold">{{ timeLabel }}</p></div></header>
    <section class="grid gap-3 sm:grid-cols-3"><div class="border border-outline-variant bg-white p-4"><p class="text-[10px] font-bold uppercase tracking-wider text-muted">Sedang berjalan</p><p class="mt-2 font-telemetry text-3xl">{{ runningDevices.length.toString().padStart(2, '0') }}</p><p class="mt-1 text-xs text-muted">Perangkat terpakai</p></div><div class="border border-warning/40 bg-warning-container p-4"><p class="text-[10px] font-bold uppercase tracking-wider text-on-warning-container">Peringatan · 10%</p><p class="mt-2 font-telemetry text-3xl text-warning">{{ store.warningCount.toString().padStart(2, '0') }}</p><p class="mt-1 text-xs text-on-warning-container">Perlu perhatian perawat</p></div><div class="border border-error/40 bg-error-container p-4"><p class="text-[10px] font-bold uppercase tracking-wider text-on-error-container">Kritis · ≤5%</p><p class="mt-2 font-telemetry text-3xl text-error">{{ store.criticalCount.toString().padStart(2, '0') }}</p><p class="mt-1 text-xs text-on-error-container">Periksa dan ganti cairan</p></div></section>
    <section class="space-y-4"><div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 class="font-display text-2xl">Status perangkat</h2><p class="text-xs text-muted">Kartu monitoring bersifat read-only. Buka detail untuk tindakan.</p></div><div class="flex flex-wrap gap-1 border border-outline-variant bg-white p-1"><button v-for="option in [{ id: 'all', label: 'Semua' }, { id: 'critical', label: 'Kritis' }, { id: 'warning', label: 'Warning' }, { id: 'normal', label: 'Normal' }] as const" :key="option.id" class="px-3 py-2 text-[10px] font-bold uppercase tracking-wide" :class="filter === option.id ? 'bg-secondary text-white' : 'text-muted hover:bg-surface'" @click="filter = option.id">{{ option.label }}</button></div></div>
      <div v-if="filteredDevices.length" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><InfusionCard v-for="device in filteredDevices" :key="device.id" :device="device" @open-detail="openDetail" /></div><div v-else class="border border-dashed border-outline p-10 text-center text-sm text-muted">Tidak ada perangkat pada filter ini.</div>
    </section>
  </div>
</template>
