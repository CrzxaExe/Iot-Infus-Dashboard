<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useInfusionStore } from '@/stores/infusion'
import { useDeviceTabsStore } from '@/stores/deviceTabs'
import { useNotificationStore } from '@/stores/notification'
import { useServerNotificationStore } from '@/stores/serverNotification'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import PixelCornerFrame from '@/components/ui/PixelCornerFrame.vue'
import { deviceIdOf, patientIdOf, percentOf, roomIdOf, timestampOf, volumeLabelOf } from '@/services/deviceFields'
import { deviceDetailPath } from '@/utils/deviceRoute'
import type { ServerNotification } from '@/types/backend'
import type { InfusionDevice } from '@/types/infusion'
const devices = useInfusionStore()
const tabs = useDeviceTabsStore()
const notification = useNotificationStore()
const serverNotifications = useServerNotificationStore()
const router = useRouter()
function openDeviceDetail(device: InfusionDevice) {
  if (!device?.id?.trim()) return
  tabs.openTab(device)
  router.push(deviceDetailPath(device.id))
}
function testNotification() {
  notification.triggerToast({
    title: 'Uji notifikasi',
    message: 'Notifikasi berhasil ditampilkan. Sistem peringatan berjalan.',
    level: 'warning',
    deviceId: 'UJI-NOTIF',
  })
}
const serverAlerts = computed(() => serverNotifications.unresolved.map((item) => ({
  item,
  key: serverNotifications.notificationKey(item),
  level: serverNotifications.levelFor(item),
  device: devices.findDevice(item.deviceId),
})))

function dismissServerAlert(item: ServerNotification) { serverNotifications.dismiss(item) }

const activeAlerts = computed(() => devices.devices.flatMap((device) => {
  if (device.status === 'done') return []
  const level = devices.getLevel(device)
  if (level !== 'critical' && level !== 'warning') return []
  const key = JSON.stringify([deviceIdOf(device), level, patientIdOf(device), device.nurse, roomIdOf(device), percentOf(device), volumeLabelOf(device), timestampOf(device)])
  if (notification.isAlertDismissed(key)) return []
  return [{ device, level, key }]
}))
</script>
<template>
  <div class="space-y-6"><header class="flex flex-wrap items-end justify-between gap-4 border-b border-outline-variant pb-5"><div><p class="font-telemetry text-[10px] uppercase tracking-[.2em] text-primary">Clinical alerts / center</p><h1 class="mt-2 font-display text-3xl sm:text-4xl">Peringatan</h1><p class="mt-1 text-sm text-muted">Daftar kondisi perangkat yang memerlukan perhatian.</p></div><button type="button" class="rounded-[8px] bg-primary px-4 py-3 text-xs font-bold uppercase tracking-wider text-on-primary hover:bg-secondary" @click="testNotification">Uji notifikasi</button></header>
    <section class="space-y-3"><header class="flex items-end justify-between gap-3"><div><h2 class="font-display text-lg">Notifikasi dari server</h2><p class="text-xs text-muted">Dikirim lewat event notification / notificationSnapshot.</p></div></header>
      <article v-for="alert in serverAlerts" :key="alert.key" :role="alert.device ? 'link' : undefined" :tabindex="alert.device ? 0 : undefined" class="rounded-[10px]" @click="alert.device && openDeviceDetail(alert.device)" @keydown.enter.self="alert.device && openDeviceDetail(alert.device)"><PixelCornerFrame :critical="alert.level === 'critical'" :dark="alert.level === 'critical'" class="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"><div class="flex items-start gap-3"><span class="mt-1 h-3 w-3 shrink-0 rounded-full" :class="alert.level === 'critical' ? 'bg-secondary-container' : alert.level === 'warning' ? 'bg-primary' : 'bg-secondary'"/><div><div class="flex flex-wrap items-center gap-2"><strong>{{ alert.item.deviceId }}</strong><StatusBadge :status="alert.level" /></div><p class="mt-1 text-xs">{{ alert.item.message }}</p><p class="mt-1 text-[10px] text-muted">{{ alert.item.roomId || '—' }} · {{ alert.item.timestamp || '—' }}</p></div></div><div class="flex items-center gap-2"><button type="button" :aria-label="`Tutup notifikasi ${alert.item.deviceId}`" class="notification-dismiss-button grid h-9 w-9 shrink-0 place-items-center border text-lg" @click.stop="dismissServerAlert(alert.item)">×</button></div></PixelCornerFrame></article>
      <div v-if="serverAlerts.length === 0" class="rounded-[10px] border border-[#C6DED6]/65 bg-surface p-6 text-center text-xs text-muted">Tidak ada notifikasi server aktif.</div>
    </section>
    <div class="space-y-3">
      <article v-for="alert in activeAlerts" :key="alert.key" role="link" tabindex="0" :aria-label="`Buka detail perangkat ${deviceIdOf(alert.device)}`" class="rounded-[10px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" @click="openDeviceDetail(alert.device)" @keydown.enter.self="openDeviceDetail(alert.device)" @keydown.space.self.prevent="openDeviceDetail(alert.device)"><PixelCornerFrame :critical="alert.level === 'critical'" :dark="alert.level === 'critical'" class="flex cursor-pointer flex-col justify-between gap-3 p-4 transition-colors hover:border-primary sm:flex-row sm:items-center">
        <div class="flex items-start gap-3"><span class="mt-1 h-3 w-3 shrink-0 rounded-full" :class="alert.level === 'critical' ? 'bg-secondary-container' : 'bg-primary'"/><div><div class="flex flex-wrap items-center gap-2"><strong>{{ patientIdOf(alert.device) || 'Belum ditempati' }}</strong><StatusBadge :status="alert.level" /></div><p class="mt-1 text-xs" :class="alert.level === 'critical' ? 'text-secondary-container' : 'text-muted'">{{ deviceIdOf(alert.device) }} · {{ roomIdOf(alert.device) || '—' }} · {{ volumeLabelOf(alert.device) }} · {{ percentOf(alert.device) }}%</p><p class="mt-1 text-xs">Perawat · lokal: {{ alert.device.nurse || '—' }}</p><p class="mt-1 text-[10px]" :class="alert.level === 'critical' ? 'text-secondary-container' : 'text-muted'">Diperbarui {{ timestampOf(alert.device) }}</p></div></div>
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
