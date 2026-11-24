<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSettings } from '@/stores/settings'
import { useDeviceTabsStore } from '@/stores/deviceTabs'
import { useInfusionStore } from '@/stores/infusion'
import monitoringInfusLogo from '@/assets/image/Monitoring-infus-logo.png'
const settings = useSettings()
const tabsStore = useDeviceTabsStore()
const infusion = useInfusionStore()
const { openTabs } = storeToRefs(tabsStore)
const route = useRoute()
const router = useRouter()
const alertCount = computed(() => infusion.warningCount + infusion.criticalCount)
const links = [
  { label: 'Monitoring Infus', to: '/' },
  { label: 'Ruangan', to: '/rooms' },
  { label: 'Perangkat Infus', to: '/devices' },
  { label: 'Riwayat Infus', to: '/history' },
  { label: 'Peringatan', to: '/notify' },
]
const activePath = computed(() => route.path)
function closeTab(id: string) {
  const next = tabsStore.closeTab(id)
  if (route.name === 'detail-perangkat' && route.params.id === id) {
    if (next) router.push({ name: 'detail-perangkat', params: { id: next } })
    else router.push('/')
  }
}
</script>
<template>
  <aside class="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/10 bg-secondary text-white lg:flex">
    <RouterLink to="/" aria-label="Monitoring Infus" class="flex justify-center border-b border-white/10 px-5 py-4"><img :src="monitoringInfusLogo" alt="Monitoring Infus" class="block h-auto w-full" /></RouterLink>
    <div class="px-4 pt-6"><p class="mb-3 font-telemetry text-[9px] uppercase tracking-[.2em] text-white/40">Nurse station</p><nav class="space-y-1"><RouterLink v-for="link in links" :key="link.to" :to="link.to" class="flex items-center gap-3 border-l-2 px-3 py-3 text-xs font-semibold transition-colors" :class="activePath === link.to ? 'border-inverse-primary bg-white/10 text-white' : 'border-transparent text-white/55 hover:bg-white/5 hover:text-white'">{{ link.label }}<span v-if="link.to === '/notify' && alertCount > 0" class="ml-auto bg-primary-container px-1.5 py-0.5 font-telemetry text-[9px] text-white">+{{ alertCount }}</span></RouterLink></nav></div>
    <div class="mt-7 px-4"><div class="mb-2 flex items-center justify-between"><p class="font-telemetry text-[9px] uppercase tracking-[.2em] text-white/40">Perangkat dibuka</p><span class="font-telemetry text-[10px] text-white/40">{{ openTabs.length }}</span></div><TransitionGroup name="sidebar-tab" tag="div" class="space-y-1 overflow-hidden"><div v-for="tab in openTabs" :key="tab.id" class="flex max-h-11 items-center border-l-2 pl-2 text-[10px]" :class="route.params.id === tab.id ? 'border-inverse-primary bg-white/10' : 'border-white/20'"><RouterLink :to="{ name: 'detail-perangkat', params: { id: tab.id } }" class="flex min-w-0 flex-1 items-center gap-2 py-2 font-telemetry"><span class="h-2 w-2 shrink-0" :class="tab.critical ? 'bg-error' : 'bg-inverse-primary'"/><span class="truncate">{{ tab.id }} · {{ tab.nurse }}</span></RouterLink><button type="button" :aria-label="`Tutup tab ${tab.id}`" class="px-2 py-1 text-white/50 hover:bg-error hover:text-white" @click="closeTab(tab.id)">×</button></div></TransitionGroup></div>
    <div class="mt-auto border-t border-white/10 px-5 py-4"><div class="flex justify-between text-[10px] text-white/50"><span>Perangkat aktif</span><span class="font-telemetry text-inverse-primary">{{ infusion.activeDevices.length }}</span></div></div>
  </aside>
  <header class="sticky top-0 z-30 flex items-center justify-between border-b border-outline-variant bg-white px-4 py-3 lg:hidden"><RouterLink to="/" class="font-display text-xl">Monitoring Infus</RouterLink><button type="button" class="border border-outline-variant px-3 py-1 text-xs" @click="settings.setOpen()">{{ settings.isOpen ? 'Tutup menu' : 'Menu' }}</button></header>
  <Transition name="modal-fade"><div v-if="settings.isOpen" class="fixed inset-0 z-40 bg-secondary/60 lg:hidden" @click="settings.setOpen(false)"><aside class="h-full w-72 bg-secondary p-5 text-white" @click.stop><div class="mb-7 flex items-center justify-between"><strong class="font-display text-2xl">Monitoring Infus</strong><button @click="settings.setOpen(false)">×</button></div><nav class="space-y-2"><RouterLink v-for="link in links" :key="link.to" :to="link.to" class="flex items-center gap-3 border-l-2 px-3 py-3 text-sm" :class="activePath === link.to ? 'border-inverse-primary bg-white/10' : 'border-transparent text-white/60'" @click="settings.setOpen(false)">{{ link.label }}<span v-if="link.to === '/notify' && alertCount > 0" class="ml-auto bg-primary-container px-1.5 py-0.5 font-telemetry text-[9px] text-white">+{{ alertCount }}</span></RouterLink></nav><div class="mt-8 border-t border-white/10 pt-4"><p class="mb-2 text-[10px] uppercase text-white/40">Perangkat dibuka</p><RouterLink v-for="tab in openTabs" :key="tab.id" :to="{ name: 'detail-perangkat', params: { id: tab.id } }" class="block py-2 font-telemetry text-xs" @click="settings.setOpen(false)">{{ tab.id }} · {{ tab.nurse }}</RouterLink></div></aside></div></Transition>
</template>
