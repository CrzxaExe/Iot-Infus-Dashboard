<script setup lang="ts">
import { computed, ref } from 'vue'
import { useInfusionStore } from '@/stores/infusion'
import StatusBadge from '@/components/ui/StatusBadge.vue'
const store = useInfusionStore()
const filter = ref('all')
const entries = computed(() => filter.value === 'all' ? store.history : store.history.filter((item) => item.status === filter.value))
</script>
<template>
  <div class="space-y-6"><header class="border-b border-outline-variant pb-5"><p class="font-telemetry text-[10px] uppercase tracking-[.2em] text-primary">Clinical log / sessions</p><h1 class="mt-2 font-display text-3xl sm:text-4xl">Riwayat Infus</h1><p class="mt-1 text-sm text-muted">Catatan sesi infus dan status pemasangan perangkat.</p></header>
    <div class="flex flex-wrap gap-2"><button v-for="item in [{ value: 'all', label: 'Semua' }, { value: 'running', label: 'Sedang Berjalan' }, { value: 'ready', label: 'Terpasang' }, { value: 'done', label: 'Selesai' }]" :key="item.value" class="border px-3 py-2 text-[10px] font-bold uppercase" :class="filter === item.value ? 'border-secondary bg-secondary text-white' : 'border-outline-variant bg-white text-muted'" @click="filter = item.value">{{ item.label }}</button></div>
    <p v-if="store.liveMode" class="border border-warning/40 bg-warning-container p-4 text-sm text-on-warning-container">Server Go saat ini menyimpan telemetry mentah, belum menyediakan riwayat sesi infus untuk tabel ini.</p>
    <div v-else class="overflow-x-auto border border-outline-variant bg-white"><table class="w-full min-w-[900px] text-left text-xs"><thead class="bg-secondary text-[10px] uppercase tracking-wider text-white"><tr><th class="px-4 py-3">ID sesi</th><th class="px-4 py-3">Waktu dibuat</th><th class="px-4 py-3">Pasien / Ruangan</th><th class="px-4 py-3">Cairan</th><th class="px-4 py-3">Mulai</th><th class="px-4 py-3">Selesai</th><th class="px-4 py-3">Perawat</th><th class="px-4 py-3">Status</th></tr></thead><tbody><tr v-for="entry in entries" :key="entry.id" class="border-b border-outline-variant last:border-0"><td class="px-4 py-4 font-telemetry text-primary">{{ entry.id }}</td><td class="px-4 py-4 font-telemetry">{{ entry.createdAt }}</td><td class="px-4 py-4"><strong>{{ entry.patient || 'Belum ditempati' }}</strong><span class="mt-1 block text-muted">{{ entry.room || '—' }}</span></td><td class="px-4 py-4">{{ entry.fluid }}</td><td class="px-4 py-4 font-telemetry">{{ entry.startedAt }}</td><td class="px-4 py-4 font-telemetry">{{ entry.endedAt }}</td><td class="px-4 py-4">{{ entry.nurse || '—' }}</td><td class="px-4 py-4"><StatusBadge :status="entry.status" /></td></tr><tr v-if="entries.length === 0"><td colspan="8" class="px-4 py-10 text-center text-muted">Belum ada catatan untuk filter ini.</td></tr></tbody></table></div>
  </div>
</template>
