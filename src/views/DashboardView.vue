<script setup lang="ts">
import { computed, ref } from 'vue'
import { useNow } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { useInfusionStore } from '@/stores/infusion'
import { useDeviceTabsStore } from '@/stores/deviceTabs'
import { useRealtimeStore } from '@/stores/realtime'
import { patientIdOf } from '@/services/deviceFields'
import { deviceDetailPath } from '@/utils/deviceRoute'
import InfusionCard from '@/components/infusion/InfusionCard.vue'
import PixelCornerFrame from '@/components/ui/PixelCornerFrame.vue'
const router = useRouter()
const store = useInfusionStore()
const tabs = useDeviceTabsStore()
const realtime = useRealtimeStore()
const now = useNow()
const filter = ref<'all' | 'critical' | 'warning' | 'normal'>('all')
// Backend has no session status, so show every active telemetry device.
const visibleDevices = computed(() => store.activeDevices)
const assignedDevices = computed(() => visibleDevices.value.filter((device) => Boolean(patientIdOf(device))))
const filteredDevices = computed(() => visibleDevices.value.filter((device) => {
  const level = store.getLevel(device)
  if (filter.value === 'all') return true
  if (filter.value === 'critical') return level === 'critical'
  if (filter.value === 'warning') return level === 'warning'
  return level === 'normal'
}))
const connectionLabel = computed(() => ({
  'not-configured': 'Backend belum dikonfigurasi',
  connecting: 'Menghubungkan ke server…',
  connected: 'Terhubung · data langsung',
  disconnected: 'Terputus · mencoba lagi',
  error: 'Koneksi error',
}[realtime.status]))
const dateLabel = computed(() => new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now.value))
const timeLabel = computed(() => new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now.value))
function openDetail(device: (typeof store.devices)[number]) { if (!device?.id?.trim()) return; tabs.openTab(device); router.push(deviceDetailPath(device.id)) }
</script>
<template>
  <div class="space-y-6">
    <header class="flex flex-col justify-between gap-4 border-b border-outline-variant pb-5 sm:flex-row sm:items-end"><div><p class="font-telemetry text-[10px] uppercase tracking-[.22em] text-primary">Nurse station / overview</p><h1 class="mt-2 font-display text-3xl sm:text-4xl">Monitoring Infus</h1><p class="mt-1 text-sm text-muted">Pantau volume cairan dan status perangkat secara terpusat.</p><p class="mt-2 rounded-[6px] px-2 py-1 text-xs font-semibold" :class="realtime.status === 'connected' ? 'bg-primary text-on-primary' : 'bg-secondary-container text-secondary'">{{ connectionLabel }}</p></div><div class="rounded-[10px] border border-[#C6DED6]/65 bg-surface px-4 py-2 text-right shadow-[0_2px_12px_rgba(0,20,18,0.04)]"><p class="text-xs text-muted">{{ dateLabel }}</p><p class="font-telemetry text-lg font-semibold">{{ timeLabel }}</p></div></header>
    <section class="grid gap-3 sm:grid-cols-3"><div class="rounded-[10px] border border-[#C6DED6]/65 bg-[#C6DED6]/25 p-4 shadow-[0_2px_12px_rgba(0,20,18,0.04)]"><p class="text-[10px] font-bold uppercase tracking-wider text-muted">Perangkat aktif</p><p class="mt-2 font-telemetry text-3xl text-primary">{{ visibleDevices.length.toString().padStart(2, '0') }}</p><p class="mt-1 text-xs text-muted">{{ assignedDevices.length }} terpakai · {{ visibleDevices.length - assignedDevices.length }} standby</p></div><div class="rounded-[10px] border border-[#C6DED6]/65 bg-[#C6DED6]/25 p-4 shadow-[0_2px_12px_rgba(0,20,18,0.04)]"><p class="text-[10px] font-bold uppercase tracking-wider text-secondary">Peringatan · 10%</p><p class="mt-2 font-telemetry text-3xl text-secondary">{{ store.warningCount.toString().padStart(2, '0') }}</p><p class="mt-1 text-xs text-secondary">Perlu perhatian perawat</p></div><PixelCornerFrame :critical="store.criticalCount > 0" dark class="p-4"><p class="text-[10px] font-bold uppercase tracking-wider text-secondary-container">Kritis · ≤5%</p><p class="mt-2 font-telemetry text-3xl">{{ store.criticalCount.toString().padStart(2, '0') }}</p><p class="mt-1 text-xs text-secondary-container">Periksa dan ganti cairan</p></PixelCornerFrame></section>
    <section class="space-y-4"><div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 class="font-display text-2xl">Status perangkat</h2><p class="text-xs text-muted">Kartu monitoring bersifat read-only. Buka detail untuk tindakan.</p></div><div class="flex flex-wrap gap-1 rounded-[10px] border border-[#C6DED6]/65 bg-surface p-1 shadow-[0_2px_12px_rgba(0,20,18,0.04)]"><button v-for="option in [{ id: 'all', label: 'Semua' }, { id: 'critical', label: 'Kritis' }, { id: 'warning', label: 'Warning' }, { id: 'normal', label: 'Normal' }] as const" :key="option.id" class="rounded-[8px] px-3 py-2 text-[10px] font-bold uppercase tracking-wide" :class="filter === option.id ? 'bg-primary text-on-primary' : 'text-muted hover:bg-secondary-container/55'" @click="filter = option.id">{{ option.label }}</button></div></div>
      <div v-if="filteredDevices.length" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><InfusionCard v-for="device in filteredDevices" :key="device.id" :device="device" @open-detail="openDetail" /></div><div v-else class="rounded-[10px] border border-dashed border-outline p-10 text-center text-sm text-muted">Tidak ada perangkat pada filter ini.</div>
    </section>
  </div>
</template>
