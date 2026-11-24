<script setup lang="ts">
import { computed } from 'vue'
import { useInfusionStore } from '@/stores/infusion'
import { useNotificationStore } from '@/stores/notification'
import StatusBadge from '@/components/ui/StatusBadge.vue'
const devices = useInfusionStore()
const notification = useNotificationStore()
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
  <div class="space-y-6"><header class="border-b border-outline-variant pb-5"><p class="font-telemetry text-[10px] uppercase tracking-[.2em] text-primary">Clinical alerts / center</p><h1 class="mt-2 font-display text-3xl sm:text-4xl">Peringatan</h1><p class="mt-1 text-sm text-muted">Daftar kondisi perangkat yang memerlukan perhatian.</p></header>
    <div class="space-y-3">
      <article v-for="alert in activeAlerts" :key="alert.key" class="flex flex-col justify-between gap-3 border bg-white p-4 sm:flex-row sm:items-center" :class="alert.level === 'critical' ? 'border-error/50' : 'border-warning/50'">
        <div class="flex items-start gap-3"><span class="mt-1 h-3 w-3 shrink-0" :class="alert.level === 'critical' ? 'bg-error' : 'bg-warning'"/><div><div class="flex flex-wrap items-center gap-2"><strong>{{ alert.device.patient }}</strong><StatusBadge :status="alert.level" /></div><p class="mt-1 text-xs text-muted">{{ alert.device.id }} · {{ alert.device.room }} · {{ alert.device.reportedVolume !== undefined ? `volume sensor ${alert.device.reportedVolume}` : `${alert.device.remainingMl} mL tersisa dari ${alert.device.totalMl} mL` }}</p><p class="mt-1 text-xs">Perawat: {{ alert.device.nurse || '—' }}</p><p class="mt-1 text-[10px] text-muted">Diperbarui {{ alert.device.updatedAt }}</p></div></div>
        <div class="flex items-center gap-2">
          <button type="button" :aria-label="`Hapus notifikasi ${alert.device.id}`" class="notification-dismiss-button grid h-9 w-9 shrink-0 place-items-center border text-lg" @click="notification.dismissAlert(alert.key)">×</button>
        </div>
      </article>
      <div v-if="activeAlerts.length === 0" class="border border-outline-variant bg-white p-10 text-center text-sm text-muted">Tidak ada peringatan aktif.</div>
    </div>
  </div>
</template>

<style scoped>
.notification-dismiss-button {
  border-color: #181d17;
  background-color: #181d17;
  color: #fff;
}

.notification-dismiss-button:hover {
  border-color: #ba1a1a;
  background-color: #ba1a1a;
}
</style>
