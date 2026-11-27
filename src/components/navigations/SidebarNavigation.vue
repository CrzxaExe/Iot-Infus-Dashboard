<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSettings } from '@/stores/settings'
import { useDeviceTabsStore } from '@/stores/deviceTabs'
import { useInfusionStore } from '@/stores/infusion'
import { useServerNotificationStore } from '@/stores/serverNotification'
import { deviceDetailPath } from '@/utils/deviceRoute'
import monitoringInfusLogo from '@/assets/image/Monitoring-infus-logo.png'
const settings = useSettings()
const tabsStore = useDeviceTabsStore()
const infusion = useInfusionStore()
const serverNotifications = useServerNotificationStore()
const { openTabs } = storeToRefs(tabsStore)
const route = useRoute()
const router = useRouter()
const alertCount = computed(() => infusion.warningCount + infusion.criticalCount + serverNotifications.unresolved.length)
const links = [
  { label: 'Monitoring Infus', to: '/' },
  { label: 'Ruangan', to: '/rooms' },
  { label: 'Perangkat Infus', to: '/devices' },
  { label: 'Riwayat Infus', to: '/history' },
  { label: 'Peringatan', to: '/notify' },
]
const activePath = computed(() => route.path)
const validTabs = computed(() => openTabs.value.filter((tab) => typeof tab?.id === 'string' && Boolean(tab.id.trim())))
function closeTab(id: string) {
  const next = tabsStore.closeTab(id)
  if (route.name === 'detail-perangkat' && route.params.id === id) {
    if (next) router.push(deviceDetailPath(next))
    else router.push('/')
  }
}
</script>
<template>
  <aside class="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-secondary-container/25 bg-secondary text-on-secondary lg:flex">
    <RouterLink to="/" aria-label="Monitoring Infus" class="flex justify-center border-b border-secondary-container/25 px-5 py-4"><img :src="monitoringInfusLogo" alt="Monitoring Infus" class="block h-auto w-full" /></RouterLink>
    <div class="px-4 pt-6"><p class="mb-3 font-telemetry text-[9px] uppercase tracking-[.2em] text-secondary-container/70">Nurse station</p><nav class="space-y-1"><RouterLink v-for="link in links" :key="link.to" :to="link.to" class="flex items-center gap-3 rounded-[8px] px-3 py-3 text-xs font-semibold transition-colors" :class="activePath === link.to ? 'bg-primary text-on-primary' : 'text-secondary-container/80 hover:bg-secondary-container/10 hover:text-on-secondary'">{{ link.label }}<span v-if="link.to === '/notify' && alertCount > 0" class="ml-auto rounded-[6px] bg-primary px-1.5 py-0.5 font-telemetry text-[9px] text-on-primary">+{{ alertCount }}</span></RouterLink></nav></div>
    <div class="mt-7 px-4"><div class="mb-2 flex items-center justify-between"><p class="font-telemetry text-[9px] uppercase tracking-[.2em] text-secondary-container/70">Perangkat dibuka</p><span class="font-telemetry text-[10px] text-secondary-container/70">{{ validTabs.length }}</span></div><TransitionGroup name="sidebar-tab" tag="div" class="space-y-1 overflow-hidden"><div v-for="tab in validTabs" :key="tab.id" class="flex max-h-11 items-center rounded-[6px] border border-secondary-container/25 pl-2 text-[10px]" :class="route.params.id === tab.id ? 'bg-primary/25' : 'bg-secondary-container/5'"><RouterLink :to="deviceDetailPath(tab.id)" class="flex min-w-0 flex-1 items-center gap-2 py-2 font-telemetry"><span class="h-2 w-2 shrink-0 rounded-full" :class="tab.critical ? 'bg-secondary-container' : 'bg-primary'"/><span class="truncate">{{ tab.id }} · {{ tab.nurse }}</span></RouterLink><button type="button" :aria-label="`Tutup tab ${tab.id}`" class="rounded-[6px] px-2 py-1 text-secondary-container/70 hover:bg-primary hover:text-on-primary" @click="closeTab(tab.id)">×</button></div></TransitionGroup></div>
    <div class="mt-auto border-t border-secondary-container/25 px-5 py-4"><div class="flex justify-between text-[10px] text-secondary-container/80"><span>Perangkat aktif</span><span class="font-telemetry text-on-secondary">{{ infusion.activeDevices.length }}</span></div></div>
  </aside>
  <header class="sticky top-0 z-30 flex items-center justify-between border-b border-outline-variant bg-surface px-4 py-3 lg:hidden"><RouterLink to="/" class="font-display text-xl">Monitoring Infus</RouterLink><div class="flex items-center gap-2"><RouterLink to="/notify" class="rounded-[8px] border border-outline-variant px-3 py-1 text-xs" aria-label="Buka notifikasi">Notifikasi<span v-if="alertCount > 0" class="ml-1 rounded-[6px] bg-primary px-1.5 py-0.5 font-telemetry text-[9px] text-on-primary">{{ alertCount }}</span></RouterLink><button type="button" class="rounded-[8px] border border-outline-variant px-3 py-1 text-xs" @click="settings.setOpen()">{{ settings.isOpen ? 'Tutup menu' : 'Menu' }}</button></div></header>
  <Transition name="modal-fade"><div v-if="settings.isOpen" class="fixed inset-0 z-40 bg-secondary/60 lg:hidden" @click="settings.setOpen(false)"><aside class="h-full w-72 bg-secondary p-5 text-on-secondary" @click.stop><div class="mb-7 flex items-center justify-between"><strong class="font-display text-2xl">Monitoring Infus</strong><button class="rounded-[8px] px-2 py-1 hover:bg-primary" @click="settings.setOpen(false)">×</button></div><nav class="space-y-2"><RouterLink v-for="link in links" :key="link.to" :to="link.to" class="flex items-center gap-3 rounded-[8px] px-3 py-3 text-sm" :class="activePath === link.to ? 'bg-primary text-on-primary' : 'text-secondary-container/80 hover:bg-secondary-container/10'" @click="settings.setOpen(false)">{{ link.label }}<span v-if="link.to === '/notify' && alertCount > 0" class="ml-auto rounded-[6px] bg-primary px-1.5 py-0.5 font-telemetry text-[9px] text-on-primary">+{{ alertCount }}</span></RouterLink></nav><div class="mt-8 border-t border-secondary-container/25 pt-4"><p class="mb-2 text-[10px] uppercase text-secondary-container/70">Perangkat dibuka</p><RouterLink v-for="tab in validTabs" :key="tab.id" :to="deviceDetailPath(tab.id)" class="block rounded-[6px] px-2 py-2 font-telemetry text-xs hover:bg-primary/25" @click="settings.setOpen(false)">{{ tab.id }} · {{ tab.nurse }}</RouterLink></div></aside></div></Transition>
</template>
