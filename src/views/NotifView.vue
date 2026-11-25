<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useInfusionStore } from '@/stores/infusion'
import { useDeviceTabsStore } from '@/stores/deviceTabs'
import { useNotificationStore } from '@/stores/notification'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import PixelCornerFrame from '@/components/ui/PixelCornerFrame.vue'
import type { InfusionDevice } from '@/types/infusion'
const devices = useInfusionStore()
const tabs = useDeviceTabsStore()
const notification = useNotificationStore()
const router = useRouter()
function openDeviceDetail(device: InfusionDevice) {
  tabs.openTab(device)
  router.push({ name: 'detail-perangkat', params: { id: device.id } })
}
function testNotification() {
  notification.triggerToast({
    title: 'Uji notifikasi',
    message: 'Notifikasi berhasil ditampilkan. Sistem peringatan berjalan.',
    level: 'warning',
    deviceId: 'UJI-NOTIF',
  })
}
const activeAlerts = computed(() => devices.devices.flatMap((device) => {
  if (device.status !== 'running') return []
  const level = devices.getLevel(device)
  if (level !== 'critical' && level !== 'warning') return []
  const key = JSON.stringify([device.id, level, device.patient, device.nurse, device.room, device.fluid, device.volumePct, device.remainingMl, device.totalMl, device.updatedAt])
  if (notification.isAlertDismissed(key)) return []
  return [{ device, level, key }]
}))
</script>
<template>
  <div class="space-y-6"><header class="flex flex-wrap items-end justify-between gap-4 border-b border-outline-variant pb-5"><div><p class="font-telemetry text-[10px] uppercase tracking-[.2em] text-primary">Clinical alerts / center</p><h1 class="mt-2 font-display text-3xl sm:text-4xl">Peringatan</h1><p class="mt-1 text-sm text-muted">Daftar kondisi perangkat yang memerlukan perhatian.</p></div><button type="button" class="rounded-[8px] bg-primary px-4 py-3 text-xs font-bold uppercase tracking-wider text-on-primary hover:bg-secondary" @click="testNotification">Uji notifikasi</button></header>
    <div class="space-y-3">
      <article v-for="alert in activeAlerts" :key="alert.key" role="link" tabindex="0" :aria-label="`Buka detail perangkat ${alert.device.id}`" class="rounded-[10px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" @click="openDeviceDetail(alert.device)" @keydown.enter.self="openDeviceDetail(alert.device)" @keydown.space.self.prevent="openDeviceDetail(alert.device)"><PixelCornerFrame :critical="alert.level === 'critical'" :dark="alert.level === 'critical'" class="flex cursor-pointer flex-col justify-between gap-3 p-4 transition-colors hover:border-primary sm:flex-row sm:items-center">
        <div class="flex items-start gap-3"><span class="mt-1 h-3 w-3 shrink-0 rounded-full" :class="alert.level === 'critical' ? 'bg-secondary-container' : 'bg-primary'"/><div><div class="flex flex-wrap items-center gap-2"><strong>{{ alert.device.patient }}</strong><StatusBadge :status="alert.level" /></div><p class="mt-1 text-xs" :class="alert.level === 'critical' ? 'text-secondary-container' : 'text-muted'">{{ alert.device.id }} · {{ alert.device.room }} · {{ alert.device.reportedVolume !== undefined ? `volume sensor ${alert.device.reportedVolume}` : `${alert.device.remainingMl} mL tersisa dari ${alert.device.totalMl} mL` }}</p><p class="mt-1 text-xs">Perawat: {{ alert.device.nurse || '—' }}</p><p class="mt-1 text-[10px]" :class="alert.level === 'critical' ? 'text-secondary-container' : 'text-muted'">Diperbarui {{ alert.device.updatedAt }}</p></div></div>
        <div class="flex items-center gap-2">
          <button type="button" :aria-label="`Hapus notifikasi ${alert.device.id}`" class="notification-dismiss-button grid h-9 w-9 shrink-0 place-items-center border text-lg" @click.stop="notification.dismissAlert(alert.key)">×</button>
        </div>
      </PixelCornerFrame></article>
      <div v-if="activeAlerts.length === 0" class="rounded-[10px] border border-[#C6DED6]/65 bg-surface p-10 text-center text-sm text-muted shadow-[0_2px_12px_rgba(0,20,18,0.04)]">Tidak ada peringatan aktif.</div>
    </div>
  </div>
</template>

<style scoped>
.notification-dismiss-button {
  border-color: #001412;
  border-radius: 8px;
  background-color: #C6DED6;
  color: #001412;
}

.notification-dismiss-button:hover {
  border-color: #00625C;
  background-color: #00625C;
  color: #F6FBF2;
}
</style>
