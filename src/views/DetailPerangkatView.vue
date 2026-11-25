<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInfusionStore } from '@/stores/infusion'
import { useDeviceTabsStore } from '@/stores/deviceTabs'
import { useNotificationStore } from '@/stores/notification'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import PixelCornerFrame from '@/components/ui/PixelCornerFrame.vue'
const route = useRoute()
const router = useRouter()
const store = useInfusionStore()
const tabs = useDeviceTabsStore()
const notify = useNotificationStore()
const device = computed(() => store.findDevice(String(route.params.id)))
const level = computed(() => device.value ? store.getLevel(device.value) : 'normal')
function formatSampleTime(value: string) {
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? value : new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(timestamp)
}
const trendPoints = computed(() => {
  const samples = device.value?.volumeHistory?.slice(-7) ?? []
  return samples.map((sample, index) => {
    const volume = Math.min(100, Math.max(0, sample.volumePct))
    return {
      time: formatSampleTime(sample.recordedAt),
      volume,
      x: 38 + index * 432 / Math.max(1, samples.length - 1),
      y: 160 - volume * 1.32,
      remainingMl: sample.remainingMl,
      reportedVolume: sample.reportedVolume,
    }
  })
})
const trendLine = computed(() => trendPoints.value.map((point) => `${point.x},${point.y}`).join(' '))
const trendStartLabel = computed(() => trendPoints.value[0]?.time ?? '')
const trendEndLabel = computed(() => trendPoints.value[trendPoints.value.length - 1]?.time ?? '')
const hoveredPoint = ref<(typeof trendPoints.value)[number] | null>(null)
watch(device, (value) => { if (value) tabs.openTab(value) }, { immediate: true })
function adjust(delta: number) { if (!device.value || device.value.source === 'server') return; store.adjustTarget(device.value.id, delta); const updated = store.findDevice(device.value.id); if (updated) tabs.syncTab(updated) }
function togglePause() { if (!device.value || device.value.source === 'server') return; store.togglePause(device.value.id); notify.triggerToast({ title: device.value.paused ? 'Aliran dilanjutkan' : 'Aliran dijeda', message: `${device.value.id} · status aliran diperbarui.`, level: 'info', deviceId: device.value.id }) }
function replace() { if (!device.value || device.value.source === 'server') return; store.replaceFluid(device.value.id); notify.triggerToast({ title: 'Cairan diperbarui', message: 'Sesi sebelumnya dicatat pada riwayat.', level: 'info', deviceId: device.value.id }) }
</script>
<template>
  <div v-if="device" class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-3 border-b border-outline-variant pb-5"><div><button type="button" class="mb-3 text-xs font-bold uppercase text-primary" @click="router.push('/')">← Kembali ke monitoring</button><p class="font-telemetry text-[10px] uppercase tracking-[.2em] text-primary">Detail perangkat / {{ device.id }}</p><h1 class="mt-1 font-display text-3xl sm:text-4xl">{{ device.patient || 'Perangkat standby' }}</h1><p class="mt-1 text-sm text-muted">{{ device.room ? `${device.room} · ` : '' }}{{ device.fluid }}</p></div><StatusBadge :status="level" /></header>
    <section class="grid gap-4 lg:grid-cols-[1.2fr_.8fr]"><PixelCornerFrame :critical="level === 'critical'" class="p-5"><div class="flex items-center justify-between"><h2 class="font-display text-xl">Volume cairan tersisa</h2><span class="font-telemetry text-xs text-muted">{{ device.id }}</span></div><div class="mt-6 flex items-end gap-2 rounded-[8px] bg-[#C6DED6]/25 p-3"><strong class="font-telemetry text-6xl" :class="level === 'critical' ? 'text-secondary' : level === 'warning' ? 'text-secondary' : 'text-primary'">{{ device.volumePct }}</strong><span class="mb-2 font-telemetry text-xl text-muted">%</span></div><div class="mt-4 h-4 rounded-[8px] bg-secondary-container"><div class="h-full rounded-[8px]" :class="level === 'critical' ? 'bg-secondary' : level === 'warning' ? 'bg-secondary-container' : 'bg-primary'" :style="{ width: `${device.volumePct}%` }" /></div><div class="mt-3 flex justify-between font-telemetry text-xs"><template v-if="device.reportedVolume !== undefined"><span>Volume sensor</span><span>{{ device.reportedVolume }}</span></template><template v-else><span>{{ device.remainingMl }} mL tersisa</span><span>{{ device.totalMl }} mL total</span></template></div><div v-if="device.reportedVolume === undefined" class="mt-6 grid grid-cols-2 gap-3"><div class="rounded-[6px] bg-secondary-container p-2"><p class="text-[10px] uppercase text-secondary">Warning 10%</p><strong class="font-telemetry text-secondary">{{ Math.round(device.totalMl * .1) }} mL</strong></div><div class="rounded-[6px] bg-secondary p-2 text-on-secondary"><p class="text-[10px] uppercase text-secondary-container">Kritis ≤5%</p><strong class="font-telemetry">{{ Math.round(device.totalMl * .05) }} mL</strong></div></div></PixelCornerFrame>
      <div class="rounded-[10px] border border-[#C6DED6]/65 bg-surface p-5 shadow-[0_2px_12px_rgba(0,20,18,0.04)]"><h2 class="font-display text-xl">Informasi pasien</h2><dl class="mt-4 space-y-3 text-sm"><div class="flex justify-between gap-3 border-b border-outline-variant pb-2"><dt class="text-muted">Pasien</dt><dd class="text-right font-semibold">{{ device.patient || 'Belum ditugaskan' }}</dd></div><div class="flex justify-between gap-3 border-b border-outline-variant pb-2"><dt class="text-muted">Ruangan</dt><dd class="font-semibold">{{ device.room || 'Belum ditentukan' }}</dd></div><div class="flex justify-between gap-3 border-b border-outline-variant pb-2"><dt class="text-muted">Jenis cairan</dt><dd class="font-semibold">{{ device.fluid }}</dd></div><div class="flex justify-between gap-3 border-b border-outline-variant pb-2"><dt class="text-muted">Perawat</dt><dd class="text-right font-semibold">{{ device.nurse || 'Belum ditugaskan' }}</dd></div><div class="flex justify-between gap-3"><dt class="text-muted">Pembaruan</dt><dd class="font-telemetry">{{ device.updatedAt }}</dd></div></dl></div></section>
    <section class="grid gap-4 lg:grid-cols-2"><div class="rounded-[10px] border border-[#C6DED6]/65 bg-surface p-5 shadow-[0_2px_12px_rgba(0,20,18,0.04)]"><h2 class="font-display text-xl">Tren volume infus</h2><div class="mt-4"><svg v-if="trendPoints.length > 0" viewBox="0 0 520 190" role="group" aria-label="Grafik tren volume cairan. Arahkan kursor atau fokuskan titik untuk melihat nilainya." class="w-full" @mouseleave="hoveredPoint = null">
        <line x1="38" y1="18" x2="38" y2="160" stroke="#C6DED6" />
        <line x1="38" y1="160" x2="500" y2="160" stroke="#C6DED6" />
        <line x1="38" y1="146.8" x2="500" y2="146.8" stroke="#C6DED6" stroke-dasharray="5 5" />
        <line x1="38" y1="153.4" x2="500" y2="153.4" stroke="#001412" stroke-dasharray="5 5" />
        <polyline :points="trendLine" fill="none" stroke="#00625C" stroke-width="3" />
        <g v-for="point in trendPoints" :key="point.time">
          <circle :cx="point.x" :cy="point.y" r="11" fill="transparent" tabindex="0" role="button" :aria-label="`${point.time}: ${point.volume}%${point.reportedVolume === undefined ? ` (${point.remainingMl} mL)` : `, volume sensor ${point.reportedVolume}`}`" @mouseenter="hoveredPoint = point" @focus="hoveredPoint = point" @blur="hoveredPoint = null" />
          <circle :cx="point.x" :cy="point.y" :r="hoveredPoint?.time === point.time ? 6 : 4" fill="#00625C" pointer-events="none" />
        </g>
        <g v-if="hoveredPoint" pointer-events="none">
          <rect :x="Math.min(390, Math.max(42, hoveredPoint.x - 52))" :y="Math.max(18, Math.min(116, hoveredPoint.y - 42))" width="104" height="36" rx="8" fill="#001412" />
          <text :x="Math.min(390, Math.max(42, hoveredPoint.x - 52)) + 7" :y="Math.max(18, Math.min(116, hoveredPoint.y - 42)) + 14" font-size="10" fill="#F6FBF2">{{ hoveredPoint.time }} · {{ hoveredPoint.volume }}%</text>
          <text :x="Math.min(390, Math.max(42, hoveredPoint.x - 52)) + 7" :y="Math.max(18, Math.min(116, hoveredPoint.y - 42)) + 28" font-size="9" fill="#C6DED6">{{ hoveredPoint.reportedVolume === undefined ? `${hoveredPoint.remainingMl} mL tersisa` : `Volume sensor: ${hoveredPoint.reportedVolume}` }}</text>
        </g>
        <text x="42" y="12" font-size="10" fill="#001412">100%</text>
        <text x="420" y="143" font-size="9" fill="#001412">10% warning</text>
        <text x="420" y="166" font-size="9" fill="#001412">5% kritis</text>
        <text x="38" y="178" font-size="10" fill="#001412">{{ trendStartLabel }}</text>
        <text x="450" y="178" font-size="10" fill="#001412">{{ trendEndLabel }}</text>
      </svg><p v-else class="grid h-48 place-items-center border border-dashed border-outline-variant text-sm text-muted">Data tren volume belum tersedia.</p></div></div>
      <div class="rounded-[10px] border border-[#C6DED6]/65 bg-surface p-5 shadow-[0_2px_12px_rgba(0,20,18,0.04)]"><h2 class="font-display text-xl">Kendali perangkat</h2><div class="mt-5 border-b border-outline-variant pb-4"><p class="mb-2 text-xs font-semibold uppercase">Target laju tetes</p><div class="flex items-center gap-3"><button :disabled="device.source === 'server'" class="h-10 w-10 rounded-[8px] border border-outline-variant text-xl hover:bg-secondary-container/55 disabled:cursor-not-allowed disabled:opacity-40" @click="adjust(-1)">−</button><strong class="min-w-20 text-center font-telemetry text-2xl">{{ device.targetTpm }} <small class="text-xs">tpm</small></strong><button :disabled="device.source === 'server'" class="h-10 w-10 rounded-[8px] border border-outline-variant text-xl hover:bg-secondary-container/55 disabled:cursor-not-allowed disabled:opacity-40" @click="adjust(1)">+</button></div></div><div class="mt-4 flex flex-col gap-2"><button :disabled="device.source === 'server'" class="w-full rounded-[8px] border border-secondary-container bg-secondary-container/55 px-4 py-3 text-xs font-bold uppercase text-secondary hover:bg-primary hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-40" @click="togglePause">{{ device.paused ? 'Lanjutkan aliran' : 'Jeda aliran' }}</button><button :disabled="device.source === 'server'" class="w-full rounded-[8px] bg-primary px-4 py-3 text-xs font-bold uppercase text-on-primary hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40" @click="replace">Tandai cairan diganti / reset volume</button></div><p class="mt-3 rounded-[6px] bg-secondary-container p-2 text-[10px] leading-relaxed text-secondary">{{ device.source === 'server' ? 'Server mengirim telemetry saja; format perintah kontrol perangkat belum disepakati.' : 'Hubungkan dan validasi kendali dengan API serta perangkat sebelum digunakan.' }}</p></div></section>
  </div>
  <div v-else class="rounded-[10px] border border-[#C6DED6]/65 bg-surface p-10 text-center shadow-[0_2px_12px_rgba(0,20,18,0.04)]"><h1 class="font-display text-2xl">Perangkat tidak ditemukan</h1><p class="mt-2 text-sm text-muted">Perangkat dengan ID tersebut tidak tersedia.</p><button class="mt-5 rounded-[8px] bg-primary px-4 py-2 text-xs font-bold text-on-primary" @click="router.push('/devices')">Kembali ke perangkat</button></div>
</template>
