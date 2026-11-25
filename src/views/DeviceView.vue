<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useInfusionStore } from '@/stores/infusion'
import { useDeviceTabsStore } from '@/stores/deviceTabs'
import { useNotificationStore } from '@/stores/notification'
import DeviceConfigModal from '@/components/infusion/DeviceConfigModal.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import type { DeviceConfigForm, InfusionDevice } from '@/types/infusion'
const store = useInfusionStore()
const tabs = useDeviceTabsStore()
const notify = useNotificationStore()
const router = useRouter()
const modalOpen = ref(false)
const editing = ref<InfusionDevice | null>(null)
function configure(device: InfusionDevice | null = null) { editing.value = device; modalOpen.value = true }
function save(payload: DeviceConfigForm) { store.configureDevice(payload); modalOpen.value = false; notify.triggerToast({ title: 'Konfigurasi tersimpan', message: `${payload.deviceId} berhasil diperbarui.`, level: 'info', deviceId: payload.deviceId }) }
function removeDevice(device: InfusionDevice) {
  if (!window.confirm(`Hapus perangkat ${device.id}?`)) return
  store.deleteDevice(device.id)
  tabs.closeTab(device.id)
  notify.triggerToast({ title: 'Perangkat dihapus', message: `${device.id} telah dihapus dari daftar perangkat.`, level: 'info', deviceId: device.id })
}
function openDetail(device: InfusionDevice) { tabs.openTab(device); router.push({ name: 'detail-perangkat', params: { id: device.id } }) }
</script>
<template>
  <div class="space-y-6"><header class="flex flex-wrap items-end justify-between gap-4 border-b border-outline-variant pb-5"><div><p class="font-telemetry text-[10px] uppercase tracking-[.2em] text-primary">Inventory / configuration</p><h1 class="mt-2 font-display text-3xl sm:text-4xl">Perangkat Infus</h1><p class="mt-1 text-sm text-muted">Konfigurasi cairan dan penugasan perangkat.</p><p v-if="store.liveMode" class="mt-2 rounded-[6px] bg-secondary-container px-2 py-1 text-xs text-secondary">Server saat ini hanya mengirim telemetry; registrasi dan konfigurasi belum tersedia.</p></div><button class="rounded-[8px] bg-primary px-4 py-3 text-xs font-bold uppercase tracking-wider text-on-primary hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50" :disabled="store.liveMode" @click="configure()">+ Pasang perangkat</button></header>
    <div class="overflow-x-auto rounded-[10px] border border-[#C6DED6]/65 bg-surface shadow-[0_2px_12px_rgba(0,20,18,0.04)]"><table class="w-full min-w-[760px] border-collapse text-left text-xs"><thead class="bg-secondary text-[10px] uppercase tracking-wider text-on-secondary"><tr><th class="px-4 py-3">ID perangkat</th><th class="px-4 py-3">Pasien / Ruangan</th><th class="px-4 py-3">Perawat</th><th class="px-4 py-3">Sisa cairan</th><th class="px-4 py-3">Status</th><th class="px-4 py-3 text-right">Aksi</th></tr></thead><tbody><tr v-for="device in store.devices" :key="device.id" role="link" tabindex="0" :aria-label="`Buka detail perangkat ${device.id}`" class="cursor-pointer border-b border-outline-variant last:border-0 hover:bg-secondary-container/25" @click="openDetail(device)" @keydown.enter.self="openDetail(device)" @keydown.space.self.prevent="openDetail(device)"><td class="px-4 py-4 font-telemetry font-bold text-primary"><div class="flex items-center gap-2"><button type="button" :disabled="store.liveMode" :aria-label="`Hapus perangkat ${device.id}`" title="Hapus perangkat" class="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] border border-outline-variant text-on-surface hover:bg-secondary hover:text-on-secondary disabled:cursor-not-allowed disabled:opacity-40" @click.stop="removeDevice(device)"><svg aria-hidden="true" class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 5v5m4-5v5" /></svg></button><div>{{ device.id }}<span class="mt-1 block font-body font-normal text-muted">{{ device.fluid }}</span></div></div></td><td class="px-4 py-4"><strong>{{ device.patient || 'Belum ditempati' }}</strong><span class="mt-1 block text-muted">{{ device.room || '—' }}</span></td><td class="px-4 py-4">{{ device.nurse || '—' }}</td><td class="px-4 py-4 font-telemetry">{{ device.reportedVolume !== undefined ? `Sensor: ${device.reportedVolume}` : `${device.remainingMl} / ${device.totalMl} mL` }}</td><td class="px-4 py-4"><StatusBadge :status="device.status" /></td><td class="px-4 py-4 text-right"><button :disabled="store.liveMode" class="rounded-[8px] border border-secondary-container bg-secondary-container/55 px-3 py-2 font-bold text-secondary hover:bg-primary hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-40" @click.stop="configure(device)">Konfigurasi</button></td></tr><tr v-if="store.devices.length === 0"><td colspan="6" class="px-4 py-10 text-center text-muted">{{ store.liveMode ? 'Menunggu data perangkat dari server…' : 'Belum ada perangkat. Pilih “Pasang perangkat” untuk menambahkan.' }}</td></tr></tbody></table></div>
    <DeviceConfigModal :open="modalOpen" :device="editing" @close="modalOpen = false" @save="save" />
  </div>
</template>
